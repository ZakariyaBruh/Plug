import { db } from '#/lib/db'
import { today } from '#/lib/allowance'

/*
 * THREE SMALL DAILY HABITS, ACCOUNT-ONLY AND NOTHING TO DO WITH DINNER.
 *
 * Deciding what to eat is an episodic problem — most people open this app
 * once a day at most, some days not at all. These three exist to give a
 * signed-in visitor a reason to open it on the days they are not deciding
 * anything: a one-tap mood check-in, a one-line "good thing" journal, and a
 * daily trivia question everybody gets asked the same day. None of them are
 * Premium — they come with having an account at all, same as the invite
 * link (see lib/referrals.ts), because what they need is something to be
 * true across devices, not something to be paid for.
 *
 * ONE ROW PER PERSON PER DAY, for all three, keyed on the UTC calendar day
 * from lib/allowance.ts — the same day boundary the AI allowance already
 * uses, so "today" means the same thing everywhere in this codebase.
 *
 * STREAKS SHARE ONE ALGORITHM (streakFrom below): walk backward from today
 * while each day is in a set, stopping at the first gap. Today itself is
 * allowed to be missing without breaking the streak — the streak is "as of
 * whenever this was last checked," not "only if today is already done" —
 * otherwise everybody's streak would read as broken for the first minute of
 * every day until they showed up.
 */

let ready: Promise<void> | null = null

function ensureSchema(client: NonNullable<ReturnType<typeof db>>) {
  if (!ready) {
    ready = client
      .batch(
        [
          `create table if not exists checkins (
            user_id text not null,
            day text not null,
            mood text not null,
            created_at text not null,
            primary key (user_id, day)
          )`,
          `create table if not exists journal_entries (
            user_id text not null,
            day text not null,
            entry text not null,
            created_at text not null,
            primary key (user_id, day)
          )`,
          `create table if not exists trivia_answers (
            user_id text not null,
            day text not null,
            question_index integer not null,
            choice_index integer not null,
            correct integer not null,
            created_at text not null,
            primary key (user_id, day)
          )`,
        ],
        'write',
      )
      .then(() => undefined)
      .catch((err) => {
        ready = null
        throw err
      })
  }
  return ready
}

/** Consecutive days ending at `asOf`, walking back through `days`. */
function streakFrom(days: Set<string>, asOf: string): number {
  let streak = 0
  const cursor = new Date(asOf + 'T00:00:00Z')
  if (!days.has(asOf)) cursor.setUTCDate(cursor.getUTCDate() - 1)
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

/* --------------------------------------------------------- mood check-in */

export const MOODS = ['great', 'good', 'okay', 'rough', 'bad'] as const
export type Mood = (typeof MOODS)[number]

export type CheckinState = {
  today: Mood | null
  streak: number
  recent: { day: string; mood: Mood }[] // last 14 days, oldest first
}

export async function checkinState(userId: string): Promise<CheckinState> {
  const empty: CheckinState = { today: null, streak: 0, recent: [] }
  const client = db()
  if (!client) return empty
  try {
    await ensureSchema(client)
    const day = today()
    const rs = await client.execute({
      sql: 'select day, mood from checkins where user_id = ? order by day desc limit 60',
      args: [userId],
    })
    const rows = rs.rows.map((r) => ({ day: String(r.day), mood: String(r.mood) as Mood }))
    const days = new Set(rows.map((r) => r.day))
    const mine = rows.find((r) => r.day === day)
    return {
      today: mine ? mine.mood : null,
      streak: streakFrom(days, day),
      recent: rows.slice(0, 14).reverse(),
    }
  } catch (err) {
    console.error('habits: checkin read failed', err)
    return empty
  }
}

export async function recordCheckin(userId: string, mood: string): Promise<CheckinState | null> {
  if (!MOODS.includes(mood as Mood)) return null
  const client = db()
  if (!client) return null
  try {
    await ensureSchema(client)
    const day = today()
    await client.execute({
      sql: `insert into checkins (user_id, day, mood, created_at) values (?, ?, ?, ?)
            on conflict (user_id, day) do update set mood = excluded.mood`,
      args: [userId, day, mood, new Date().toISOString()],
    })
    return await checkinState(userId)
  } catch (err) {
    console.error('habits: checkin write failed', err)
    return null
  }
}

/* --------------------------------------------------------------- journal */

const JOURNAL_MAX = 140

export type JournalState = {
  today: string | null
  streak: number
  entries: { day: string; entry: string }[] // most recent first, capped
}

export async function journalState(userId: string): Promise<JournalState> {
  const empty: JournalState = { today: null, streak: 0, entries: [] }
  const client = db()
  if (!client) return empty
  try {
    await ensureSchema(client)
    const day = today()
    const rs = await client.execute({
      sql: 'select day, entry from journal_entries where user_id = ? order by day desc limit 30',
      args: [userId],
    })
    const rows = rs.rows.map((r) => ({ day: String(r.day), entry: String(r.entry) }))
    const days = new Set(rows.map((r) => r.day))
    const mine = rows.find((r) => r.day === day)
    return { today: mine ? mine.entry : null, streak: streakFrom(days, day), entries: rows }
  } catch (err) {
    console.error('habits: journal read failed', err)
    return empty
  }
}

export async function recordJournal(userId: string, text: string): Promise<JournalState | null> {
  const entry = text.replace(/\s+/g, ' ').trim().slice(0, JOURNAL_MAX)
  if (!entry) return null
  const client = db()
  if (!client) return null
  try {
    await ensureSchema(client)
    const day = today()
    await client.execute({
      sql: `insert into journal_entries (user_id, day, entry, created_at) values (?, ?, ?, ?)
            on conflict (user_id, day) do update set entry = excluded.entry`,
      args: [userId, day, entry, new Date().toISOString()],
    })
    return await journalState(userId)
  } catch (err) {
    console.error('habits: journal write failed', err)
    return null
  }
}

/* ----------------------------------------------------------------- trivia */

/*
 * One bank, read in order by a date-seeded index — not shuffled per visitor
 * — so a given calendar day is the same question for every single person
 * who opens the app that day. That shared-moment quality is the whole point
 * of a daily trivia question: it is something to compare notes on, not a
 * private quiz. Ninety questions means a repeat is three months out.
 *
 * Deliberately nothing about food: the game already has an entire catalogue
 * for that, and the point of this feature is a reason to open the app on a
 * day with no dinner to decide.
 */
const TRIVIA_BANK: { q: string; choices: string[]; answer: number }[] = [
  { q: 'Which planet has the most moons?', choices: ['Jupiter', 'Saturn', 'Neptune', 'Uranus'], answer: 1 },
  { q: 'What is the smallest country in the world by area?', choices: ['Monaco', 'San Marino', 'Vatican City', 'Liechtenstein'], answer: 2 },
  { q: 'Who painted the ceiling of the Sistine Chapel?', choices: ['Raphael', 'Donatello', 'Michelangelo', 'Leonardo da Vinci'], answer: 2 },
  { q: 'What is the hardest natural substance on Earth?', choices: ['Quartz', 'Diamond', 'Titanium', 'Graphene'], answer: 1 },
  { q: 'In what year did the Berlin Wall fall?', choices: ['1987', '1989', '1991', '1993'], answer: 1 },
  { q: 'What is the longest river in the world?', choices: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], answer: 1 },
  { q: 'How many sides does a dodecagon have?', choices: ['10', '11', '12', '14'], answer: 2 },
  { q: 'Which element has the chemical symbol "Fe"?', choices: ['Fluorine', 'Iron', 'Lead', 'Francium'], answer: 1 },
  { q: 'Who wrote "1984"?', choices: ['Aldous Huxley', 'Ray Bradbury', 'George Orwell', 'H.G. Wells'], answer: 2 },
  { q: 'What is the largest desert in the world by area?', choices: ['Sahara', 'Gobi', 'Arctic', 'Antarctic'], answer: 3 },
  { q: 'How many bones are in the adult human body?', choices: ['186', '206', '226', '246'], answer: 1 },
  { q: 'Which ocean is the deepest?', choices: ['Atlantic', 'Indian', 'Southern', 'Pacific'], answer: 3 },
  { q: 'What is the capital of Australia?', choices: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], answer: 2 },
  { q: 'Who composed "The Four Seasons"?', choices: ['Bach', 'Mozart', 'Vivaldi', 'Beethoven'], answer: 2 },
  { q: 'Which gas makes up most of Earth’s atmosphere?', choices: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'], answer: 2 },
  { q: 'What does "www" stand for?', choices: ['World Wide Web', 'World Web Wide', 'Web World Wide', 'Wide World Web'], answer: 0 },
  { q: 'Which country gifted the Statue of Liberty to the US?', choices: ['Spain', 'France', 'Italy', 'Belgium'], answer: 1 },
  { q: 'How many chambers does a human heart have?', choices: ['2', '3', '4', '5'], answer: 2 },
  { q: 'What is the currency of Japan?', choices: ['Won', 'Yuan', 'Yen', 'Ringgit'], answer: 2 },
  { q: 'Who discovered penicillin?', choices: ['Marie Curie', 'Alexander Fleming', 'Louis Pasteur', 'Joseph Lister'], answer: 1 },
  { q: 'What is the tallest mountain in the world, measured from sea level?', choices: ['K2', 'Kangchenjunga', 'Everest', 'Lhotse'], answer: 2 },
  { q: 'Which planet is known as the Red Planet?', choices: ['Venus', 'Mars', 'Jupiter', 'Mercury'], answer: 1 },
  { q: 'In Greek mythology, who is the god of the sea?', choices: ['Zeus', 'Apollo', 'Poseidon', 'Hades'], answer: 2 },
  { q: 'What is the smallest prime number?', choices: ['0', '1', '2', '3'], answer: 2 },
  { q: 'Which US state has the most coastline?', choices: ['California', 'Florida', 'Alaska', 'Hawaii'], answer: 2 },
  { q: 'How many strings does a standard violin have?', choices: ['3', '4', '5', '6'], answer: 1 },
  { q: 'What is the main language spoken in Brazil?', choices: ['Spanish', 'Portuguese', 'French', 'Italian'], answer: 1 },
  { q: 'Which animal is the fastest on land?', choices: ['Lion', 'Pronghorn', 'Cheetah', 'Greyhound'], answer: 2 },
  { q: 'Who directed the film "Jaws"?', choices: ['George Lucas', 'Steven Spielberg', 'Martin Scorsese', 'Francis Ford Coppola'], answer: 1 },
  { q: 'What is the freezing point of water in Fahrenheit?', choices: ['0°F', '32°F', '100°F', '212°F'], answer: 1 },
  { q: 'Which continent is the Sahara Desert on?', choices: ['Asia', 'Africa', 'South America', 'Australia'], answer: 1 },
  { q: 'What is the national sport of Japan?', choices: ['Judo', 'Karate', 'Sumo wrestling', 'Kendo'], answer: 2 },
  { q: 'How many colours are in a rainbow?', choices: ['5', '6', '7', '8'], answer: 2 },
  { q: 'Which planet has a day longer than its year?', choices: ['Mercury', 'Venus', 'Mars', 'Neptune'], answer: 1 },
  { q: 'What is the largest organ in the human body?', choices: ['Liver', 'Brain', 'Skin', 'Lungs'], answer: 2 },
  { q: 'Who was the first person to walk on the Moon?', choices: ['Buzz Aldrin', 'Yuri Gagarin', 'Neil Armstrong', 'John Glenn'], answer: 2 },
  { q: 'What is the capital of Canada?', choices: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'], answer: 3 },
  { q: 'Which instrument has 88 keys?', choices: ['Organ', 'Piano', 'Accordion', 'Harpsichord'], answer: 1 },
  { q: 'What is the study of earthquakes called?', choices: ['Geology', 'Seismology', 'Meteorology', 'Volcanology'], answer: 1 },
  { q: 'Which country has the most time zones?', choices: ['Russia', 'USA', 'France', 'China'], answer: 2 },
  { q: 'What do you call a group of lions?', choices: ['Pack', 'Pride', 'Herd', 'Troop'], answer: 1 },
  { q: 'Which planet spins on its side relative to the Sun?', choices: ['Saturn', 'Uranus', 'Neptune', 'Jupiter'], answer: 1 },
  { q: 'What is the longest-running animated TV show in the US?', choices: ['The Flintstones', 'Scooby-Doo', 'The Simpsons', 'Family Guy'], answer: 2 },
  { q: 'Which metal is liquid at room temperature?', choices: ['Lead', 'Mercury', 'Tin', 'Zinc'], answer: 1 },
  { q: 'What is the largest mammal in the world?', choices: ['African elephant', 'Blue whale', 'Giraffe', 'Sperm whale'], answer: 1 },
  { q: 'Who wrote "Romeo and Juliet"?', choices: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], answer: 1 },
  { q: 'Which country invented paper?', choices: ['Egypt', 'Greece', 'China', 'India'], answer: 2 },
  { q: 'How many continents are there?', choices: ['5', '6', '7', '8'], answer: 2 },
  { q: 'What is the speed of light, roughly, in km per second?', choices: ['30,000', '150,000', '300,000', '3,000,000'], answer: 2 },
  { q: 'Which US president appears on the one-dollar bill?', choices: ['Jefferson', 'Lincoln', 'Washington', 'Franklin'], answer: 2 },
  { q: 'What is the name for a fear of spiders?', choices: ['Claustrophobia', 'Arachnophobia', 'Acrophobia', 'Agoraphobia'], answer: 1 },
  { q: 'Which sea creature has three hearts?', choices: ['Shark', 'Octopus', 'Dolphin', 'Jellyfish'], answer: 1 },
  { q: 'What is the capital of Egypt?', choices: ['Alexandria', 'Cairo', 'Giza', 'Luxor'], answer: 1 },
  { q: 'Which scientist developed the theory of general relativity?', choices: ['Isaac Newton', 'Niels Bohr', 'Albert Einstein', 'Galileo Galilei'], answer: 2 },
  { q: 'What is the most spoken native language in the world?', choices: ['English', 'Hindi', 'Mandarin Chinese', 'Spanish'], answer: 2 },
  { q: 'How many legs does an insect have?', choices: ['4', '6', '8', '10'], answer: 1 },
  { q: 'Which country is home to the kangaroo?', choices: ['New Zealand', 'South Africa', 'Australia', 'Indonesia'], answer: 2 },
  { q: 'What is the name of Earth’s only natural satellite?', choices: ['Titan', 'The Moon', 'Europa', 'Phobos'], answer: 1 },
  { q: 'Which artist is known for cutting off part of his own ear?', choices: ['Pablo Picasso', 'Vincent van Gogh', 'Claude Monet', 'Salvador Dalí'], answer: 1 },
  { q: 'What is the chemical symbol for gold?', choices: ['Go', 'Gd', 'Au', 'Ag'], answer: 2 },
  { q: 'Which US city is known as "The Windy City"?', choices: ['New York', 'Chicago', 'Boston', 'Seattle'], answer: 1 },
  { q: 'How many hearts does an octopus have?', choices: ['One', 'Two', 'Three', 'Four'], answer: 2 },
  { q: 'What is the largest planet in our solar system?', choices: ['Saturn', 'Neptune', 'Jupiter', 'Uranus'], answer: 2 },
  { q: 'Who invented the telephone?', choices: ['Thomas Edison', 'Nikola Tesla', 'Alexander Graham Bell', 'Guglielmo Marconi'], answer: 2 },
  { q: 'Which country has the largest population in the world?', choices: ['China', 'USA', 'India', 'Indonesia'], answer: 2 },
  { q: 'What do you call baby frogs?', choices: ['Tadpoles', 'Larvae', 'Nymphs', 'Pups'], answer: 0 },
  { q: 'Which planet is closest to the Sun?', choices: ['Venus', 'Earth', 'Mercury', 'Mars'], answer: 2 },
  { q: 'What is the national flower of Japan?', choices: ['Rose', 'Lotus', 'Chrysanthemum', 'Cherry blossom'], answer: 3 },
  { q: 'How many Olympic rings are there?', choices: ['4', '5', '6', '7'], answer: 1 },
  { q: 'Which language has the most native speakers in Africa?', choices: ['Arabic', 'Swahili', 'Hausa', 'Amharic'], answer: 0 },
  { q: 'What is the deepest point in the ocean called?', choices: ['Puerto Rico Trench', 'Mariana Trench', 'Tonga Trench', 'Java Trench'], answer: 1 },
  { q: 'Which planet has the Great Red Spot?', choices: ['Mars', 'Saturn', 'Jupiter', 'Neptune'], answer: 2 },
  { q: 'Who wrote the music for "The Nutcracker"?', choices: ['Tchaikovsky', 'Chopin', 'Stravinsky', 'Rachmaninoff'], answer: 0 },
  { q: 'What is the rarest blood type?', choices: ['O negative', 'AB negative', 'B negative', 'A negative'], answer: 1 },
  { q: 'Which country does the Great Barrier Reef belong to?', choices: ['Fiji', 'Philippines', 'Australia', 'Indonesia'], answer: 2 },
  { q: 'What is the term for a word that reads the same backward and forward?', choices: ['Anagram', 'Palindrome', 'Acronym', 'Homonym'], answer: 1 },
  { q: 'Which US state is known as the "Sunshine State"?', choices: ['California', 'Florida', 'Arizona', 'Texas'], answer: 1 },
  { q: 'How many points does a standard compass rose have?', choices: ['4', '8', '16', '32'], answer: 1 },
  { q: 'Which animal can sleep for up to three years?', choices: ['Bear', 'Snail', 'Sloth', 'Tortoise'], answer: 1 },
  { q: 'What is the largest island in the world?', choices: ['Madagascar', 'Borneo', 'New Guinea', 'Greenland'], answer: 3 },
  { q: 'Who painted "The Starry Night"?', choices: ['Claude Monet', 'Vincent van Gogh', 'Edgar Degas', 'Paul Cézanne'], answer: 1 },
  { q: 'Which gas do plants absorb from the air?', choices: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], answer: 2 },
  { q: 'What is the capital of South Korea?', choices: ['Busan', 'Seoul', 'Incheon', 'Daegu'], answer: 1 },
  { q: 'Which bird is known for mimicking human speech?', choices: ['Crow', 'Parrot', 'Pigeon', 'Owl'], answer: 1 },
  { q: 'What is the smallest bone in the human body?', choices: ['Stapes (in the ear)', 'Pinky toe bone', 'Wrist bone', 'Nasal bone'], answer: 0 },
  { q: 'Which explorer is credited with reaching the Americas in 1492?', choices: ['Magellan', 'Columbus', 'Vasco da Gama', 'Cortes'], answer: 1 },
  { q: 'What is the collective name for a group of crows?', choices: ['Flock', 'Murder', 'Gaggle', 'Colony'], answer: 1 },
]

/*
 * Index into the bank, stable for the whole UTC day and the same for
 * everyone. Days since the Unix epoch, mod the bank length, so it is a
 * plain integer with no hashing to keep in sync between a read and the
 * answer check later.
 */
function triviaIndexFor(day: string): number {
  const epochDay = Math.floor(Date.parse(day + 'T00:00:00Z') / 86_400_000)
  return ((epochDay % TRIVIA_BANK.length) + TRIVIA_BANK.length) % TRIVIA_BANK.length
}

export type TriviaState = {
  day: string
  question: string
  choices: string[]
  answered: boolean
  correct: boolean | null
  correctIndex: number | null // only present once answered
  choiceIndex: number | null // which one THEY picked, once answered
  streak: number
  totalCorrect: number
  totalAnswered: number
}

async function triviaStateFor(client: NonNullable<ReturnType<typeof db>>, userId: string, day: string): Promise<TriviaState> {
  const index = triviaIndexFor(day)
  const question = TRIVIA_BANK[index]

  const rs = await client.execute({
    sql: 'select day, choice_index, correct from trivia_answers where user_id = ? order by day desc limit 90',
    args: [userId],
  })
  const rows = rs.rows.map((r) => ({
    day: String(r.day),
    choiceIndex: Number(r.choice_index),
    correct: Number(r.correct) === 1,
  }))
  const correctDays = new Set(rows.filter((r) => r.correct).map((r) => r.day))
  const mine = rows.find((r) => r.day === day)

  return {
    day,
    question: question.q,
    choices: question.choices,
    answered: !!mine,
    correct: mine ? mine.correct : null,
    correctIndex: mine ? question.answer : null,
    choiceIndex: mine ? mine.choiceIndex : null,
    streak: streakFrom(correctDays, day),
    totalCorrect: rows.filter((r) => r.correct).length,
    totalAnswered: rows.length,
  }
}

export async function triviaState(userId: string): Promise<TriviaState | null> {
  const client = db()
  if (!client) return null
  try {
    await ensureSchema(client)
    return await triviaStateFor(client, userId, today())
  } catch (err) {
    console.error('habits: trivia read failed', err)
    return null
  }
}

export async function recordTriviaAnswer(userId: string, choiceIndex: number): Promise<TriviaState | null> {
  const client = db()
  if (!client) return null
  try {
    await ensureSchema(client)
    const day = today()
    const index = triviaIndexFor(day)
    const question = TRIVIA_BANK[index]
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= question.choices.length) return null

    const correct = choiceIndex === question.answer ? 1 : 0
    // First answer of the day wins — do nothing on conflict rather than
    // overwrite, so a reload after answering cannot be used to retry.
    await client.execute({
      sql: `insert into trivia_answers (user_id, day, question_index, choice_index, correct, created_at)
            values (?, ?, ?, ?, ?, ?)
            on conflict (user_id, day) do nothing`,
      args: [userId, day, index, choiceIndex, correct, new Date().toISOString()],
    })
    return await triviaStateFor(client, userId, day)
  } catch (err) {
    console.error('habits: trivia write failed', err)
    return null
  }
}
