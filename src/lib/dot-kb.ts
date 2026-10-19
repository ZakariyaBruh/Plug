import { DISH_COUNT, PRICE_MONTHLY, PRICE_YEARLY } from '#/lib/site'

/*
 * WHAT DOT KNOWS: MORSELS45, AND NOTHING ELSE.
 *
 * Dot answers questions about this app from this list and from nothing else —
 * it is not a general assistant, and asked about the weather it says so. Each
 * entry is one fact in Dot's own short voice, with the words somebody is likely
 * to ask it with. Two things read it:
 *
 *   - a strong keyword match is answered straight from the entry, in English,
 *     instantly and for free (routes/api/dot.ts);
 *   - everything else, and every other language, is put to a free model with
 *     the WHOLE list as its only source and an instruction to stay inside it.
 *
 * So a fact is added here once and both paths know it. Anything true about the
 * app that is not in this file, Dot does not know — which is the right way
 * round for a thing people will take at its word.
 */
export type Fact = { topic: string; keys: string[]; text: string }

export const FACTS: Fact[] = [
  {
    topic: 'what it is',
    keys: ['what is morsels45', 'what is this', 'what does it do', 'what is the app', 'purpose', 'who are you', 'what are you'],
    text: 'morsels45 is an app that decides what you eat. You answer a few yes or no questions, and it lands on one dish out of ' + DISH_COUNT + '. I am Dot, the small round one who lives in the corner.',
  },
  {
    topic: 'decide',
    keys: ['decide', 'decision', 'how do i start', 'how to play', 'questions', 'yes no', 'pick a dish', 'find dinner', 'what to eat', 'how does it work', 'how do i use'],
    text: 'Tap Decide, then answer yes, no or not sure to each question. About eight questions is usually enough, never more than twenty. Every answer narrows the dishes until one is left.',
  },
  {
    topic: 'quick decide',
    keys: ['quick decide', 'quick', 'faster', 'shorter', '100 dishes', 'hundred'],
    text: 'Quick decide is the same game over the 100 dishes everyone knows. It gets there in about eight questions instead of eleven.',
  },
  {
    topic: 'endless',
    keys: ['endless', 'two dishes', 'clock', 'timer game', 'picks a day', '200 picks'],
    text: 'Endless shows two dishes and a clock. Every pick buys time back, and buys back less each time. Free profiles get 200 picks a day; Premium takes the count off.',
  },
  {
    topic: 'modes',
    keys: ['modes', 'game modes', 'ways to play', 'knockout', 'blitz', 'this or that', 'shortlist', 'together', 'swipe', 'smash', 'drop zone', 'slice', 'derby', 'games'],
    text: 'The decide page has more than the questions: Knockout, Blitz, This or that, Shortlist, Together, Swipe, and the action ones: Smash, Drop Zone, Slice and Dish Derby. Most of the extra modes are Premium. Every game has a way to say none of these, and what you reject teaches the next round.',
  },
  {
    topic: 'swipe',
    keys: ['swipe', 'deck', 'cards'],
    text: 'Swipe deals one dish at a time. Right for yes, left for no. Every no re-sorts what is left away from it, and three yeses end it with a choice between the three.',
  },
  {
    topic: 'together',
    keys: ['together', 'friends', 'group', 'share a phone', 'six', 'partner', 'couple'],
    text: 'Together is for up to six people round one phone. Five either-ors each, then one dish the whole table can live with.',
  },
  {
    topic: 'dishes',
    keys: ['dishes', 'catalogue', 'browse', 'menu list', 'search', 'filter', 'how many dishes', '450'],
    text: 'The Dishes tab is the whole catalogue: ' + DISH_COUNT + ' dishes you can search and filter. It is free. Tap one to see its recipe and what goes with it.',
  },
  {
    topic: 'diet',
    keys: ['diet', 'vegetarian', 'vegan', 'halal', 'kosher', 'allergy', 'allergies', 'do not eat', 'dont eat', "don't eat", 'avoid', 'pork', 'dairy', 'gluten', 'rules', 'restrictions'],
    text: 'What you do not eat is free: diets, faiths (halal, kosher, Hindu, Jain and more) or any single ingredient. Pick it once and nothing offers it to you again. Premium adds banning a whole style of food and striking a dish off for good.',
  },
  {
    topic: 'planner',
    keys: ['planner', 'meal plan', 'plan the week', 'calendar', 'week', 'copy a day', 'duplicate', 'prep'],
    text: 'The meal planner has breakfast, lunch, dinner and a snack for every day, synced to your free account. You can copy one day across the whole week. Premium turns the week into a shopping list, a nutrition count and a budget.',
  },
  {
    topic: 'shopping list',
    keys: ['shopping list', 'grocery', 'groceries', 'aisle', 'ingredients list'],
    text: 'Premium builds one shopping list from every recipe in your week, scaled to your household and sorted by aisle. Tick it off in the shop and it syncs to your other devices.',
  },
  {
    topic: 'recipes',
    keys: ['recipes', 'recipe', 'kitchen', 'cookbook', 'cook', 'my recipes', 'import recipe', 'website recipe'],
    text: 'Recipes & kitchen has the recipe for every dish, kitchen timers and a converter for cups, grams and gas marks. Premium keeps your own recipes, copies them from a photo or a website, and has hands-free cook mode that reads the steps aloud.',
  },
  {
    topic: 'scan',
    keys: ['scan', 'barcode', 'is it healthy', 'nutrition label', 'fridge photo', 'photo of fridge', 'camera'],
    text: 'Scan food reads a barcode and gives a score out of 100, a green, amber or red answer, sugar in teaspoons and salt as a share of your daily limit. Premium also turns a photo of your fridge into dinner ideas. Photos are not kept.',
  },
  {
    topic: 'menu builder',
    keys: ['menu', 'write me a menu', 'five courses', 'dinner party', 'courses', 'starter', 'dessert', 'party'],
    text: 'Menu writes you five courses that belong on one table, each with a reason. Describe the occasion or answer three quick questions. Standard gets one every couple of days. The dinner party planner is Premium and makes a menu every guest can eat.',
  },
  {
    topic: 'nearby',
    keys: ['nearby', 'near me', 'restaurant', 'takeaway', 'location', 'where to eat', 'map', 'delivery'],
    text: 'Nearby finds places around you that serve a dish, once you allow location. Premium can open a restaurant\'s own site in a shared browser so two of you can order together.',
  },
  {
    topic: 'ask',
    keys: ['ask', 'chat', 'assistant', 'standard', 'advanced', 'questions a day', 'three questions', 'free questions', 'gemini', 'ai'],
    text: 'Ask has two assistants. Standard is free: three questions a day on your free account. Advanced is Premium: it knows your taste, reads a photo, can look things up on the web, suggests follow-ups and remembers the conversation.',
  },
  {
    topic: 'news',
    keys: ['news', 'headlines', 'articles', 'briefing', 'stories'],
    text: 'News gathers food writing from the Guardian, Eater, NYT Dining, The Kitchn and more. The latest six headlines a day are free. Premium opens the pieces and gives you a daily briefing.',
  },
  {
    topic: 'tv radio',
    keys: ['tv', 'radio', 'channels', 'music', 'stations', 'cooking shows', 'live'],
    text: 'TV & radio has free live channels and stations to cook and eat to. You need a free account for one TV group and one radio group a day. Radio keeps playing while you look up a recipe.',
  },
  {
    topic: 'daily',
    keys: ['daily', 'streak', 'quests', 'check in', 'check-in', 'trivia', 'journal', 'every day'],
    text: 'Daily has five little things a day: a mood check-in, one good thing, a food question everybody gets the same day, and so on. Finishing them grows your streak. Streak freezes mean one missed day costs nothing.',
  },
  {
    topic: 'xp',
    keys: ['xp', 'level', 'levels', 'badges', 'achievements', 'points', 'progress', 'rank', 'nibbler'],
    text: 'You earn XP for deciding, rating and coming back. XP raises your level and unlocks badges. It is all free and it lives in your profile.',
  },
  {
    topic: 'premium',
    keys: ['premium', 'subscribe', 'subscription', 'upgrade', 'what do i get', 'paid', 'worth it', 'pro'],
    text: 'Premium switches on everything marked Premium at once: the week turned into a shopping list, a smarter kitchen, cooking for more than you, the advanced assistant, more ways to play and the shared browser. Deciding stays free.',
  },
  {
    topic: 'price',
    keys: ['price', 'cost', 'how much', 'pay', 'dollar', 'per month', 'yearly', 'annual', 'cheap'],
    text: 'Premium is ' + PRICE_MONTHLY + ' or ' + PRICE_YEARLY + ' with seven days free first. Nothing is charged until the week is up, and cancelling is one link on your account page.',
  },
  {
    topic: 'trial',
    keys: ['free trial', 'trial', 'seven days', '7 days', 'free week', 'cancel', 'refund'],
    text: 'Premium starts with seven days free. Nothing is charged until the week is up, and cancelling is one link on your account page.',
  },
  {
    topic: 'free',
    keys: ['free', 'what is free', 'without paying', 'no cost', 'cost nothing'],
    text: 'Deciding is free for good: the decide game, Quick decide, Endless with 200 picks a day, every dish, every recipe and everything you do not eat. Games with me are free too.',
  },
  {
    topic: 'account',
    keys: ['account', 'sign in', 'log in', 'login', 'sign up', 'whop', 'register'],
    text: 'Sign in with a free Whop account to sync the planner, streaks, TV and radio between devices, and to keep your three free questions with you. You can use the decide game without one.',
  },
  {
    topic: 'languages',
    keys: ['language', 'languages', 'translate', 'malay', 'thai', 'hindi', 'arabic', 'english', 'change language'],
    text: 'morsels45 speaks English, Malay, Thai, Hindi and Arabic. Change it any time in Profile, under Language. Some translated lines may read oddly.',
  },
  {
    topic: 'themes',
    keys: ['theme', 'themes', 'look', 'palette', 'dark', 'light', 'colour', 'color', 'ember', 'matcha', 'neon'],
    text: 'Profile has palettes to change how the app looks. Five extra looks (ember, matcha, ink, paper, neon) are Premium.',
  },
  {
    topic: 'install',
    keys: ['install', 'home screen', 'android', 'phone app', 'download', 'offline', 'pwa'],
    text: 'morsels45 installs to your home screen and opens straight into the game. There is an Android app too. The decide game plays with no signal.',
  },
  {
    topic: 'dot',
    keys: ['dot', 'mascot', 'companion', 'buddy', 'pet', 'pat', 'bond', 'friend', 'quiet mode', 'turn off', 'hide dot', 'move dot', 'your name'],
    text: 'I am Dot. Tap me to chat, hold me for this menu, drag me anywhere. Press pat in the menu and I get fond of you. In Profile you can make me quieter, or turn me off, and I will not be offended. Slightly offended.',
  },
  {
    topic: 'dot games',
    keys: ['dot games', 'play with dot', 'flap', 'stack', 'snake', 'pair up', 'odd dish', 'sear', 'dot says', 'mini game'],
    text: 'I play Dot Flap, Dish Stack, Nom Snake, Pair Up, Odd Dish, Perfect Sear and Dot Says. Open the menu and press Play. They are free, and they count towards our bond.',
  },
  {
    topic: 'tour',
    keys: ['tour', 'tutorial', 'onboarding', 'show me around', 'how to use', 'guide', 'learn', 'help me'],
    text: 'I can show you around. Open my menu and press Tour, and I will walk you through everything, one thing at a time. You can skip any time.',
  },
  {
    topic: 'privacy',
    keys: ['privacy', 'data', 'private', 'tracking', 'stored', 'safe', 'secure', 'gdpr', 'cookies'],
    text: 'The decide game never calls out anywhere. What you type to the assistant goes to an AI service with nothing that says who you are, and your IP address is never stored. The Privacy page lists everything.',
  },
  {
    topic: 'shared browser',
    keys: ['shared browser', 'hyperbeam', 'order together', 'cook along', 'shop together', 'co-browse'],
    text: 'The shared browser is a real browser in the cloud that two of you drive at once, each from your own phone. Use it to order, shop or cook along. It is a Premium feature because it costs money to run by the minute.',
  },
  {
    topic: 'not working',
    keys: ['bug', 'broken', 'not working', 'problem', 'error', 'support', 'contact', 'help', 'report', 'stuck'],
    text: 'Sorry about that. Try reloading first. The Help page has answers to the usual things.',
  },
  {
    topic: 'learning',
    keys: ['learn', 'learns', 'remember', 'taste', 'know me', 'personalise', 'reject', 'not quite', 'never again', 'recommend'],
    text: 'Rate a dish and it changes what comes up next. Rejecting a dish teaches the next round, in the games too. You can reset what it has learned from Profile.',
  },
]

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
}

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'does', 'i', 'you', 'it', 'to', 'of', 'in', 'on', 'my', 'me', 'can', 'how', 'what', 'and', 'for', 'with', 'this', 'that', 'there', 'be'])

/** How many words of the question carry meaning, for deciding whether one keyword is enough. */
export function meaningfulWords(question: string): number {
  return words(question).filter((w) => !STOP.has(w)).length
}

/** The best fact for a question and how strongly it matched. Phrases score higher than single words. */
export function bestFact(question: string): { fact: Fact; score: number } | null {
  const q = ' ' + question.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ') + ' '
  const qw = new Set(words(question).filter((w) => !STOP.has(w)))
  let best: { fact: Fact; score: number } | null = null
  for (const fact of FACTS) {
    let score = 0
    for (const key of fact.keys) {
      const k = key.toLowerCase()
      if (k.includes(' ')) {
        if (q.includes(' ' + k + ' ')) score += 3 + k.split(' ').length
      } else if (qw.has(k)) score += 3
      else if (k.length > 4 && [...qw].some((w) => w.length > 4 && (w.startsWith(k) || k.startsWith(w)))) score += 2
    }
    if (score && (!best || score > best.score)) best = { fact, score }
  }
  return best
}

/** The whole list as text, for the model to answer from. */
export function factsAsText(): string {
  return FACTS.map((f) => `- ${f.topic}: ${f.text}`).join('\n')
}
