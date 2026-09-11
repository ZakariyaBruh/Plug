/*
 * data.js — the knowledge base.
 *
 * Every dish is described by the same set of tags. A tag is 1 when it clearly
 * applies, 0.5 when it depends on how you make it, and 0 (the default) when it
 * doesn't apply. The engine never sees anything else, so adding a new dish is
 * just adding one line below.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.FoodData = mod;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Each question is one yes/no split. `tag` is the attribute it tests.
  //
  // `strict` marks an answer as a constraint rather than a preference: category
  // and dietary answers filter the list instead of merely reweighting it, so
  // asking for something sweet can never return a burger however the rest of the
  // answers fall. `true` binds both replies; 'yes' or 'no' binds only that one,
  // for questions where the other reply just lifts a restriction.
  //
  // Most replies are requirements and bind. The ones that do not are the ones
  // that only lift a restriction: "I can wait" is not a demand for something
  // slow, "money is fine" is not a demand for something expensive, and "messy
  // is fine" is not a demand for a mess.
  //
  // `neither` adds a third reply for a question whose two answers are genuinely
  // opposite ends of one axis, and where the middle is a real place to be. A
  // club sandwich is not hot and it is not cold, and before this there was no
  // way to ask for one — "cold" was the only home for anything that was not
  // hot, so it offered you crisps and a chocolate bar as cold food. On a
  // question with a `neither`, a tag of 0.5 means that middle rather than
  // "depends how it's made", and the two ends exclude it.
  //
  // `opposite` is for the questions with two real ends. Without it, "no" means
  // only "not the yes end" — and a tag of 0 is an absence, not a claim. That is
  // fine for "no cheese", which is exactly what a missing cheesy tag means, and
  // wrong for "soft and tender", which 87 dishes would have answered to purely
  // by not being crunchy. Steak, coffee and a bag of crisps were all soft. So
  // the far end gets a tag of its own and has to be earned the same way.
  //
  // `foodOnly` marks a question whose *frame* is food, whichever way it is
  // answered. "Light bite or proper meal?", "hands or cutlery?", "crunchy or
  // soft?" and "can you drink it from a bowl?" are all questions you would only
  // put to somebody picturing something to eat — so answering either end of one
  // says, quietly but unmistakably, that this is not a drink. Without that,
  // drinks were unfalsifiable: they carry almost no tags, so nothing a player
  // said about texture or cutlery ever ruled one out, and asking for a light
  // bite could hand back a protein shake. Now those questions take drinks off
  // the table, and are never put to somebody who has just asked for one.
  //
  // `ban` is what this question looks like as a standing rule — "never serve me
  // this". It is written out rather than derived from a reply, because the two
  // are different sentences: "No just a bite" and "No mess is fine" are what
  // deriving it gave, and both are nonsense.
  //
  // `asks` holds alternative wordings of the same question. One is picked per
  // game, so two runs in a row do not read identically — a variation in the
  // words, never in what is being asked, because the tag underneath is what the
  // engine filters on and a rewording that moved the meaning would quietly make
  // the answer mean something else. A game never sees two wordings of the same
  // question: each tag is asked once at most, and its wording is fixed when the
  // game starts.
  //
  // Every question here should be answerable in the time it takes to read it,
  // from appetite alone. The ones that went were the ones that could not be:
  // "carbs — bread, rice, pasta, potato?" is a nutrition question, "what is the
  // budget?" is arithmetic, and "sensible or full indulgence?" was asking
  // "are we being good today?" a second time in different words, which is how a
  // player ends up contradicting themselves and the guess ends up ignoring one
  // of the two answers.
  var QUESTIONS = [
    { opens: 1, strict: true, tag: 'drink', ban: 'Never a drink', text: 'First things first — drink or food?', yes: 'A drink', no: 'Actual food', yesIcon: '\u{1F964}', noIcon: '\u{1F37D}\u{FE0F}',
      asks: [
        { text: 'Are we drinking this or eating it?',    yes: 'Drinking',       no: 'Eating' },
        { text: 'Something in a glass, or on a plate?',  yes: 'In a glass',     no: 'On a plate' }
      ] },

    { opens: 2, strict: true, tag: 'sweet', ban: 'Nothing sweet', text: 'Sweet or savoury?', yes: 'Sweet', no: 'Savoury', yesIcon: '\u{1F36C}', noIcon: '\u{1F9C2}',
      asks: [
        { text: 'Sugar or salt?',                        yes: 'Sugar',          no: 'Salt' },
        { text: 'Which way is the craving pulling?',     yes: 'Towards sweet',  no: 'Towards savoury' }
      ] },

    { opens: 3, strict: true, tag: 'hot', ban: 'Nothing hot', text: 'Hot or cold?', yes: 'Hot', no: 'Cold', yesIcon: '\u{1F525}', noIcon: '\u{2744}\u{FE0F}', neither: 'Somewhere in between', neitherIcon: '\u{1F321}\u{FE0F}',
      asks: [
        { text: 'Steaming, or straight from the fridge?', yes: 'Steaming',      no: 'Straight from the fridge', neither: 'Neither, quite' },
        { text: 'Does it need to warm you up?',           yes: 'Warm me up',    no: 'Cool me down',         neither: 'Neither, really' }
      ] },

    { strict: true, tag: 'light', ban: 'Never just a bite', opposite: 'filling', foodOnly: true, text: 'Light bite or proper meal?', yes: 'Just a bite', no: 'A proper meal', yesIcon: '\u{1FAB6}', noIcon: '\u{1F356}',
      asks: [
        { text: 'How hungry are we, honestly?',          yes: 'Peckish',        no: 'Properly hungry' },
        { text: 'Snack, or sit down to it?',             yes: 'A snack',        no: 'Sit down to it' }
      ] },

    { strict: true, tag: 'meat', ban: 'No meat', text: 'Any meat in this?', yes: 'Yes, meat', no: 'No meat', yesIcon: '\u{1F969}', noIcon: '\u{1F331}',
      asks: [
        { text: 'Meat, or keep it off the plate?',       yes: 'Meat, please',   no: 'Keep it off' },
        { text: 'Is there an animal in this?',           yes: 'Afraid so',      no: 'None at all' }
      ] },

    { strict: true, tag: 'spicy', ban: 'Nothing spicy', text: 'How about heat?', yes: 'Bring the spice', no: 'Keep it mild', yesIcon: '\u{1F336}\u{FE0F}', noIcon: '\u{1F9CA}',
      asks: [
        { text: 'Chilli, or none at all?',               yes: 'Chilli',         no: 'None at all' },
        { text: 'Should this fight back?',               yes: 'Let it fight',   no: 'Keep the peace' }
      ] },

    { strict: true, tag: 'crunchy', ban: 'Nothing crunchy', opposite: 'soft', foodOnly: true, text: 'Crunchy or soft?', yes: 'Crunchy', no: 'Soft and tender', yesIcon: '\u{1F36A}', noIcon: '\u{2601}\u{FE0F}', neither: 'Neither, really', neitherIcon: '\u{1F91D}',
      asks: [
        { text: 'What should it feel like to bite?',     yes: 'A proper snap',  no: 'Give way easily', neither: 'Neither end' },
        { text: 'Crunch, or something softer?',          yes: 'Crunch',         no: 'Something softer', neither: 'In between' }
      ] },

    { strict: true, tag: 'cheesy', ban: 'No cheese', text: 'Is cheese involved?', yes: 'Cheese please', no: 'No cheese', yesIcon: '\u{1F9C0}', noIcon: '\u{1F645}',
      asks: [
        { text: 'Cheese: yes or no?',                    yes: 'Yes to cheese',  no: 'No to cheese' },
        { text: 'Does this need melting cheese on it?',  yes: 'It does',        no: 'No cheese needed' }
      ] },

    { strict: true, tag: 'handheld', ban: 'Nothing eaten with hands', foodOnly: true, text: 'Hands or cutlery?', yes: 'Eat with hands', no: 'Knife and fork', yesIcon: '\u{1F91A}', noIcon: '\u{1F374}',
      asks: [
        { text: 'Picked up, or eaten off a plate?',      yes: 'Picked up',      no: 'Off a plate' },
        { text: 'Eaten standing up, or sitting down?',   yes: 'Standing up',    no: 'Sitting down' }
      ] },

    { strict: true, tag: 'soupy', ban: 'Nothing soupy', foodOnly: true, text: 'Something you can drink from a bowl?', yes: 'Soupy', no: 'Not soupy', yesIcon: '\u{1F963}', noIcon: '\u{1F958}',
      asks: [
        { text: 'Is there broth involved?',              yes: 'Broth, yes',     no: 'No broth' },
        { text: 'Does this come with a spoon?',          yes: 'It needs one',   no: 'No spoon' }
      ] },

    { strict: true, tag: 'fried', ban: 'Nothing fried', text: 'Deep fried?', yes: 'Fried', no: 'Not fried', yesIcon: '\u{1F373}', noIcon: '\u{1F957}',
      asks: [
        { text: 'Has this been near a fryer?',           yes: 'Straight in',    no: 'Nowhere near' },
        { text: 'Golden and greasy, or not?',            yes: 'Golden please',  no: 'Not today' }
      ] },

    { strict: true, tag: 'seafood', ban: 'No seafood', text: 'Fish or seafood?', yes: 'From the sea', no: 'Not seafood', yesIcon: '\u{1F41F}', noIcon: '\u{1F414}',
      asks: [
        { text: 'Anything out of the water?',            yes: 'Out of the water', no: 'Off the land' },
        { text: 'Fish today?',                           yes: 'Fish, yes',      no: 'Not fish' }
      ] },

    // Narrow on purpose. A question that splits the whole catalogue in half is
    // worth the most at the start and nothing at all at the end, which is where
    // the game was running out of things to ask and settling for a coin flip
    // between two dishes it could not separate. "Chocolate?" tells you nothing
    // about dinner and everything about which pudding.
    { strict: true, tag: 'bready', ban: 'No bread', text: 'Bread involved?', yes: 'Bread, yes', no: 'No bread', yesIcon: '\u{1F956}', noIcon: '\u{1F6AB}',
      asks: [
        { text: 'Is there bread anywhere in this?',      yes: 'Bread, yes',     no: 'No bread at all' },
        { text: 'Dough, or no dough?',                   yes: 'Dough',          no: 'No dough' }
      ] },

    { strict: true, tag: 'chicken', ban: 'No chicken', text: 'Chicken?', yes: 'Chicken', no: 'Not chicken', yesIcon: '\u{1F357}', noIcon: '\u{1F645}',
      asks: [
        { text: 'Is it chicken?',                        yes: 'It is',          no: 'Something else' },
        { text: 'Chicken, or something else entirely?',  yes: 'Chicken',        no: 'Something else' }
      ] },

    { strict: true, tag: 'chocolate', ban: 'No chocolate', text: 'Chocolate?', yes: 'Chocolate', no: 'Not chocolate', yesIcon: '\u{1F36B}', noIcon: '\u{1F645}',
      asks: [
        { text: 'Does chocolate come into it?',          yes: 'It does',        no: 'None of it' },
        { text: 'Cocoa, or nothing like it?',            yes: 'Cocoa',          no: 'Nothing like it' }
      ] },

    { strict: true, tag: 'fruity', ban: 'No fruit', text: 'Any fruit in it?', yes: 'Fruit', no: 'No fruit', yesIcon: '\u{1F353}', noIcon: '\u{1F645}',
      asks: [
        { text: 'Is there fruit in this?',               yes: 'There is',       no: 'None at all' },
        { text: 'Berries, apple, mango, anything?',      yes: 'Something like that', no: 'None of that' }
      ] },

    { strict: true, tag: 'comfort', ban: 'Nothing stodgy', opposite: 'fresh', text: 'Comforting, or something fresh?', yes: 'Comfort food', no: 'Fresh and light', yesIcon: '\u{1FAC2}', noIcon: '\u{2728}', neither: 'Neither, really', neitherIcon: '\u{1F91D}',
      asks: [
        { text: 'Wrapped in a blanket, or out in the sun?', yes: 'Under a blanket', no: 'Out in the sun', neither: 'Neither end' },
        { text: 'Should this feel like a hug or a reset?',  yes: 'A hug',           no: 'A reset',        neither: 'Neither, really' }
      ] },

    { strict: 'yes', tag: 'quick', ban: 'Nothing rushed', text: 'How soon do you need this?', yes: 'Right now', no: 'I can wait', yesIcon: '\u{26A1}', noIcon: '\u{23F3}',
      asks: [
        { text: 'How much of a hurry are you in?',       yes: 'A real hurry',   no: 'No hurry at all' },
        { text: 'Is this urgent?',                       yes: 'Very',           no: 'Not really' }
      ] },

    { strict: 'yes', tag: 'healthy', ban: 'Nothing worthy', text: 'Are we being good today?', yes: 'Something healthy', no: 'Treat myself', yesIcon: '\u{1F966}', noIcon: '\u{1F35F}',
      asks: [
        { text: 'Being good, or not bothering?',         yes: 'Being good',     no: 'Not bothering' },
        { text: 'Is this meant to be good for you?',     yes: 'It should be',   no: 'Absolutely not' }
      ] },

    { strict: true, tag: 'homemade', ban: 'Never cooking it myself', text: 'Cook it yourself, or let someone else?', yes: 'Make it at home', no: 'Someone else', yesIcon: '\u{1F3E0}', noIcon: '\u{1F6F5}',
      asks: [
        { text: 'Is the kitchen open tonight?',          yes: 'It is',          no: 'Firmly closed' },
        { text: 'Who is making this?',                   yes: 'I am',           no: 'Somebody else' }
      ] },

    // The three below are moods and permissions rather than descriptions of the
    // food, so they nudge rather than filter — see the note on `strict` above.
    { tag: 'shareable', ban: 'Nothing meant for sharing', text: 'Eating alone or sharing?', yes: 'Sharing', no: 'All mine', yesIcon: '\u{1F46F}', noIcon: '\u{1F64B}',
      asks: [
        { text: 'Is anyone else eating?',                yes: 'Someone is',     no: 'Just me' },
        { text: 'One plate or several?',                 yes: 'Several',        no: 'One, and mine' }
      ] },

    { strict: true, tag: 'caffeine', ban: 'No caffeine', text: 'Do you want the caffeine?', yes: 'Wake me up', no: 'No caffeine', yesIcon: '\u{1F31E}', noIcon: '\u{1F634}',
      asks: [
        { text: 'Is this meant to keep you awake?',      yes: 'That is the idea', no: 'Absolutely not' },
        { text: 'Coffee-strength, or nothing like it?',  yes: 'Coffee-strength',  no: 'Nothing like it' }
      ] },

    { strict: 'yes', tag: 'breakfast', ban: 'No breakfast food', text: 'Breakfast food, or anything goes?', yes: 'Breakfast food', no: 'Anything goes', yesIcon: '\u{1F373}', noIcon: '\u{1F559}',
      asks: [
        { text: 'Is this a morning sort of thing?',      yes: 'Morning food',   no: 'Any hour will do' },
        { text: 'Is this breakfast?',                    yes: 'Breakfast',      no: 'Any time is fine' }
      ] },

    { strict: 'no', tag: 'messy', ban: 'Nothing messy', text: 'Happy to get messy?', yes: 'Mess is fine', no: 'Keep it clean', yesIcon: '\u{1F91D}', noIcon: '\u{1F9FB}',
      asks: [
        { text: 'Will napkins be needed?',               yes: 'Probably',       no: 'Rather not' },
        { text: 'Somewhere you can make a mess?',        yes: 'Somewhere messy', no: 'At a desk, so no' }
      ] },

    // Back after a spell out of the game. They were cut for being harder work
    // to answer than the rest — carbs reads like a nutrition label, budget is
    // arithmetic — and the alternative wordings below are the answer to that:
    // the same question, put the way somebody would actually think it.
    { strict: true, tag: 'carby', ban: 'No bread, rice or pasta', text: 'Bread, rice, pasta or potato in it?', yes: 'Load it up', no: 'None of those', yesIcon: '\u{1F35A}', noIcon: '\u{1F957}',
      asks: [
        { text: 'Something stodgy underneath it?',       yes: 'Stodge, please', no: 'Nothing stodgy' },
        { text: 'Is there a carb doing the heavy work?', yes: 'Very much so',   no: 'Not this time' }
      ] },

    { strict: 'yes', tag: 'cheap', ban: 'Nothing pricey', text: 'Watching what you spend?', yes: 'Keep it cheap', no: 'Not especially', yesIcon: '\u{1F4B8}', noIcon: '\u{1F4B3}',
      asks: [
        { text: 'Is this a cheap night?',                yes: 'A cheap one',    no: 'Money is fine' },
        { text: 'Does the price matter tonight?',        yes: 'It does',        no: 'Not tonight' }
      ] },

    { strict: true, tag: 'indulgent', ban: 'Nothing over the top', text: 'Sensible, or go all out?', yes: 'Go all out', no: 'Keep it sensible', yesIcon: '\u{1F451}', noIcon: '\u{1F9D8}',
      asks: [
        { text: 'How far are we taking this?',           yes: 'All the way',    no: 'Not far' },
        { text: 'Is this a treat or a sensible one?',    yes: 'A proper treat', no: 'A sensible one' }
      ] },

    { strict: 'yes', tag: 'veg', ban: 'Nothing with meat or fish', text: 'Should it be vegetarian?', yes: 'Vegetarian', no: 'Doesn\u2019t need to be', yesIcon: '\u{1F96C}', noIcon: '\u{1F357}',
      asks: [
        { text: 'Meat-free tonight?',                    yes: 'Meat-free',      no: 'No need' },
        { text: 'Does it have to be vegetarian?',        yes: 'It does',        no: 'It does not' }
      ] }
  ];

  // Every tag a dish may carry. This is deliberately a longer list than the
  // questions: "a thing food can be" and "a thing worth asking about" are not
  // the same list, and tying them together once meant the only way to stop
  // asking about caffeine was to forget which drinks have caffeine in them.
  // Standing rules, the mood shortcuts, the taste profile and the dish filters
  // all read tags nobody is asked about.
  var TAGS = [
    'drink', 'sweet', 'hot', 'quick', 'healthy', 'light', 'filling', 'meat',
    'spicy', 'cheesy', 'handheld', 'soupy', 'fried', 'crunchy', 'soft',
    'seafood', 'shareable', 'homemade', 'bready', 'chicken', 'chocolate', 'fruity',
    'breakfast', 'caffeine', 'messy', 'carby', 'fresh', 'cheap', 'indulgent', 'veg',
    // Never asked about, still true of the food.
    'comfort'
  ];

  // What somebody is asked to pick from when they set up their taste.
  //
  // Written out rather than read off the questions, because the two are
  // different jobs and reusing one for the other gave "Bring the spice" and
  // "Bread, yes" as things to be into. A question is a choice between two ends;
  // this is a noun you either like or you don't. It is also free to name things
  // nothing asks about — "fresh" is the far end of a question rather than one
  // of its own, and people have opinions about it either way.
  var TASTES = [
    { tag: 'spicy',     label: 'Spice',        icon: '\u{1F336}\u{FE0F}' },
    { tag: 'cheesy',    label: 'Cheese',       icon: '\u{1F9C0}' },
    { tag: 'meat',      label: 'Meat',         icon: '\u{1F969}' },
    { tag: 'seafood',   label: 'Seafood',      icon: '\u{1F41F}' },
    { tag: 'chicken',   label: 'Chicken',      icon: '\u{1F357}' },
    { tag: 'fried',     label: 'Fried food',   icon: '\u{1F373}' },
    { tag: 'sweet',     label: 'Sweet things', icon: '\u{1F36C}' },
    { tag: 'chocolate', label: 'Chocolate',    icon: '\u{1F36B}' },
    { tag: 'fruity',    label: 'Fruit',        icon: '\u{1F353}' },
    { tag: 'bready',    label: 'Bread',        icon: '\u{1F956}' },
    { tag: 'soupy',     label: 'Soup',         icon: '\u{1F963}' },
    { tag: 'crunchy',   label: 'Crunch',       icon: '\u{1F36A}' },
    { tag: 'comfort',   label: 'Comfort food', icon: '\u{1FAC2}' },
    { tag: 'fresh',     label: 'Fresh things', icon: '\u{2728}' },
    { tag: 'healthy',   label: 'Healthy food', icon: '\u{1F966}' },
    { tag: 'caffeine',  label: 'Caffeine',     icon: '\u{2615}' }
  ];

  TASTES.forEach(function (taste) {
    if (TAGS.indexOf(taste.tag) === -1) {
      throw new Error('Taste "' + taste.label + '" names unknown tag "' + taste.tag + '"');
    }
  });

  var ASKED = {};
  QUESTIONS.forEach(function (q) {
    if (TAGS.indexOf(q.tag) === -1) throw new Error('Question asks about unknown tag "' + q.tag + '"');
    if (ASKED[q.tag]) throw new Error('Two questions ask about "' + q.tag + '"');
    ASKED[q.tag] = true;
    if (q.opposite && TAGS.indexOf(q.opposite) === -1) {
      throw new Error('Question "' + q.tag + '" names unknown opposite "' + q.opposite + '"');
    }
    // An alternative wording that forgets one of its two replies would put a
    // blank button on screen, and one that forgets the middle reply on a
    // question that has one would quietly take the third answer away for that
    // game. Caught here rather than on the unlucky game where it is drawn.
    (q.asks || []).forEach(function (variant, i) {
      ['text', 'yes', 'no'].forEach(function (field) {
        if (!variant[field]) {
          throw new Error('Wording ' + i + ' of "' + q.tag + '" is missing ' + field);
        }
      });
      if (q.neither && !variant.neither) {
        throw new Error('Wording ' + i + ' of "' + q.tag + '" is missing its middle reply');
      }
    });
  });

  // One question as it will be put this game. The wording varies; the tag, the
  // flags and therefore the meaning never do — a variant that could change what
  // an answer filters on would be a variant that changes the answer.
  function phrase(question, index) {
    var variants = question.asks || [];
    if (!index || index > variants.length) return question;
    var wording = variants[index - 1];
    var out = {};
    Object.keys(question).forEach(function (k) { out[k] = question[k]; });
    Object.keys(wording).forEach(function (k) { out[k] = wording[k]; });
    return out;
  }

  // How many ways there are to put this question, the original included.
  function wordings(question) { return 1 + ((question.asks || []).length); }

  function item(name, icon, blurb, yesTags, maybeTags) {
    var tags = {};
    (yesTags || '').split(/\s+/).filter(Boolean).forEach(function (t) { tags[t] = 1; });
    (maybeTags || '').split(/\s+/).filter(Boolean).forEach(function (t) { tags[t] = 0.5; });

    Object.keys(tags).forEach(function (t) {
      if (TAGS.indexOf(t) === -1) throw new Error('Unknown tag "' + t + '" on ' + name);
    });

    // Vegetarian is never authored by hand — it falls out of meat and seafood,
    // so the two can never contradict each other.
    if (!('veg' in tags)) tags.veg = 1 - Math.max(tags.meat || 0, tags.seafood || 0);

    return { name: name, icon: icon, blurb: blurb, tags: tags };
  }

  var ITEMS = [
    // ---- hot savoury mains -------------------------------------------------
    item('Pizza', '\u{1F355}', 'A slice big enough to fold. Nobody has ever regretted this.',
      'hot cheesy carby comfort shareable indulgent handheld messy filling bready', 'quick cheap'),
    item('Cheeseburger', '\u{1F354}', 'Beef, melted cheese, and a bun that gives up halfway through.',
      'hot meat carby comfort indulgent handheld messy fried filling bready', 'quick cheap'),
    item('Fried chicken', '\u{1F357}', 'Shatteringly crisp outside, ridiculous inside.',
      'hot meat fried crunchy comfort indulgent shareable handheld messy filling chicken', 'cheap'),
    item('Ramen', '\u{1F35C}', 'A bowl of broth you will absolutely drink to the bottom.',
      'hot soupy comfort carby meat filling soft', 'spicy cheap chicken'),
    item('Pho', '\u{1F372}', 'Clean beef broth, herbs, noodles. Restorative stuff.',
      'hot soupy meat carby healthy light fresh soft'),
    item('Chicken soup', '\u{1F963}', 'The one you make when the world is being difficult.',
      'hot soupy comfort light healthy meat homemade cheap soft chicken'),
    item('Thai green curry', '\u{1F35B}', 'Coconut, chilli, basil. Loud in the best way.',
      'hot spicy comfort carby filling soft', 'meat healthy chicken'),
    item('Chicken biryani', '\u{1F35A}', 'Layered rice that took someone all afternoon.',
      'hot meat carby spicy comfort shareable indulgent filling soft chicken'),
    item('Spaghetti bolognese', '\u{1F35D}', 'The default answer for a reason.',
      'hot meat carby comfort homemade cheap filling soft'),
    item('Mac and cheese', '\u{1F9C0}', 'Carbs wearing a cheese blanket.',
      'hot cheesy carby comfort indulgent quick homemade cheap filling soft'),
    item('Tacos', '\u{1F32E}', 'Three small ones, obviously. Nobody stops at three.',
      'hot meat handheld shareable messy spicy fresh filling bready', 'cheap chicken'),
    item('Burrito', '\u{1F32F}', 'An entire meal wrapped in foil like a gift.',
      'hot meat carby handheld comfort indulgent messy filling soft bready', 'spicy quick chicken'),
    item('Quesadilla', '\u{1FAD3}', 'Two tortillas, a lot of cheese, four minutes.',
      'hot cheesy carby quick homemade cheap handheld crunchy filling bready'),
    item('Grilled cheese', '\u{1F96A}', 'Butter the outside of the bread. That is the whole trick.',
      'hot cheesy carby comfort quick homemade cheap handheld crunchy filling bready'),
    item('Steak', '\u{1F969}', 'Rest it before you cut it. Please.',
      'hot meat indulgent filling soft'),
    item('Roast chicken', '\u{1F357}', 'Sunday energy, whatever day it actually is.',
      'hot meat comfort shareable filling soft chicken', 'healthy homemade'),
    item('Shawarma wrap', '\u{1F32F}', 'Spinning meat, garlic sauce, questionable decisions.',
      'hot meat carby handheld messy spicy filling bready', 'cheap quick chicken'),
    item('Fish and chips', '\u{1F35F}', 'Vinegar, too much salt, eaten out of the paper.',
      'hot seafood fried carby comfort indulgent crunchy messy filling', 'bready'),
    item('Dumplings', '\u{1F95F}', 'A steamer basket and no intention of sharing, really.',
      'hot shareable comfort handheld filling soft bready', 'meat quick'),
    item('Egg fried rice', '\u{1F35A}', 'Whatever is in the fridge, plus rice, plus a wok.',
      'hot carby quick homemade cheap comfort filling soft'),
    item('Pad thai', '\u{1F35C}', 'Sweet, sour, peanuts, lime squeezed over the top.',
      'hot carby comfort filling soft', 'seafood spicy'),
    item('Katsu curry', '\u{1F35B}', 'Crumbed cutlet under a sauce that tastes like a hug.',
      'hot meat carby fried comfort crunchy indulgent filling chicken'),
    item('Lasagna', '\u{1F35D}', 'Layers. Patience. Cheese pulled over the edge of the dish.',
      'hot cheesy carby meat comfort indulgent shareable homemade filling soft'),
    item('Chilli con carne', '\u{1F336}\u{FE0F}', 'Better on the second day, as everyone keeps telling you.',
      'hot meat spicy comfort homemade cheap filling soft', 'soupy'),
    item('Buffalo wings', '\u{1F357}', 'Sticky fingers and a small pile of napkins.',
      'hot meat spicy fried shareable messy indulgent handheld filling chicken'),
    item('Nachos', '\u{1F9C0}', 'A shared plate where everyone quietly hunts the loaded ones.',
      'hot cheesy crunchy shareable indulgent messy spicy handheld cheap filling'),
    item('Falafel wrap', '\u{1F9C6}', 'Crisp chickpea balls, pickles, far too much sauce.',
      'carby handheld healthy cheap fried messy filling bready', 'hot'),
    item('Baked potato', '\u{1F954}', 'Crisp skin, steam everywhere, butter melting in.',
      'hot carby comfort cheap homemade filling soft', 'cheesy'),
    item('Miso soup', '\u{1F963}', 'Small, warm, and somehow exactly enough.',
      'hot soupy light healthy quick cheap soft'),

    // ---- hot savoury mains, the rest of the world ---------------------------
    //
    // The first pass at this catalogue was written from one kitchen and it
    // showed: a quarter of it was American and there was nothing at all from
    // Korea, Africa, South America or the Caribbean. An app that tells you what
    // to eat should not assume where you live.
    item('Bibimbap', '\u{1F35A}', 'A bowl you wreck on purpose. Mix it properly, all the way down.',
      'hot carby healthy comfort filling', 'meat spicy homemade chicken'),
    item('Korean fried chicken', '\u{1F357}', 'Twice fried, so it stays crisp under the sauce.',
      'hot meat fried crunchy indulgent shareable handheld messy spicy filling chicken'),
    item('Tteokbokki', '\u{1F362}', 'Chewy rice cakes in a sauce that is sweeter than it looks, then hotter.',
      'hot spicy carby comfort shareable cheap filling soft', 'quick'),
    item('Butter chicken', '\u{1F35B}', 'The gentle one. Tomato, cream, and a lot of butter doing quiet work.',
      'hot meat comfort indulgent carby filling soft chicken', 'spicy'),
    item('Chana masala', '\u{1F958}', 'Chickpeas that have been somewhere. Cheap, filling, quietly brilliant.',
      'hot spicy healthy cheap comfort carby homemade veg filling soft'),
    item('Masala dosa', '\u{1F95E}', 'A crisp metre-long crepe with spiced potato hiding inside.',
      'hot crunchy carby shareable veg filling', 'spicy cheap'),
    item('Kabsa', '\u{1F35B}', 'Spiced rice and slow meat, cooked in one pot and eaten from one plate.',
      'hot meat carby comfort shareable filling soft chicken', 'homemade handheld messy'),
    item('Lahmacun', '\u{1FAD3}', 'Thin as paper, folded round salad and lemon. Not a pizza, whatever anyone says.',
      'hot meat carby handheld crunchy cheap quick filling bready', 'spicy'),
    item('Manakish', '\u{1FAD3}', 'Flatbread under za’atar and oil, straight from the oven.',
      'hot carby cheap quick handheld breakfast veg filling bready', 'cheesy'),
    item('Jollof rice', '\u{1F35A}', 'The one people argue about across borders. Smoky, red, gone quickly.',
      'hot spicy carby comfort shareable cheap filling soft', 'meat'),
    item('Tagine', '\u{1F372}', 'Slow, sweet and savoury at once. The apricots are not optional.',
      'hot comfort shareable filling soft fruity', 'meat homemade sweet'),
    item('Koshari', '\u{1F35D}', 'Rice, lentils, pasta and fried onion. Carbohydrate on carbohydrate, and it works.',
      'hot carby cheap comfort veg shareable filling', 'spicy'),
    item('Doro wat', '\u{1F35B}', 'Deep, dark and slow. Eaten with your hands off shared injera.',
      'hot meat spicy comfort shareable handheld messy filling soft chicken'),
    item('Feijoada', '\u{1F372}', 'Black beans and everything else, cooked until it gives up.',
      'hot meat comfort shareable indulgent filling soft', 'homemade carby soupy cheap'),
    item('Jerk chicken', '\u{1F357}', 'Allspice, scotch bonnet and smoke. It is meant to hurt a little.',
      'hot meat spicy shareable handheld messy filling chicken'),
    item('Pierogi', '\u{1F95F}', 'Little parcels, boiled then fried in butter. Somebody’s grandmother is involved.',
      'hot carby comfort homemade cheap shareable filling soft bready', 'cheesy veg'),
    item('Nasi goreng', '\u{1F35A}', 'Last night’s rice, improved. The fried egg on top is the whole point.',
      'hot carby quick cheap comfort filling soft spicy', 'breakfast meat homemade chicken'),
    item('Laksa', '\u{1F35C}', 'Coconut, chilli and noodles. Somewhere between a soup and an event.',
      'hot soupy spicy carby comfort filling soft', 'seafood indulgent chicken'),
    item('Chicken satay', '\u{1F362}', 'Charred on sticks, drowned in peanut sauce.',
      'hot meat handheld shareable cheap light chicken', 'spicy messy'),
    item('Chicken adobo', '\u{1F357}', 'Vinegar, soy, garlic, time. Four things and no notes.',
      'hot meat comfort homemade cheap shareable filling soft chicken', 'carby quick soupy'),
    item('Plov', '\u{1F35A}', 'Rice cooked in the fat of the lamb above it. Made for a crowd, always.',
      'hot meat carby comfort shareable indulgent filling soft', 'homemade'),
    item('Mapo tofu', '\u{1F963}', 'Numbing rather than merely hot. Silky tofu, and rice underneath.',
      'hot spicy comfort carby quick veg filling soft soupy', 'homemade'),
    item('Bao buns', '\u{1F95F}', 'Steamed, pillowy, slightly sweet, and gone in three bites.',
      'hot carby shareable handheld comfort filling soft bready', 'meat'),
    item('Banh mi', '\u{1F956}', 'A French loaf that emigrated and came back better.',
      'hot meat carby handheld crunchy quick cheap fresh filling bready'),

    // ---- eggs and breakfast ------------------------------------------------
    item('Omelette', '\u{1F373}', 'Three eggs and whatever needs using up.',
      'hot quick homemade healthy cheap breakfast filling soft'),
    item('Shakshuka', '\u{1F373}', 'Eggs poached in tomatoes, bread for mopping.',
      'hot spicy homemade healthy breakfast comfort shareable filling soft', 'soupy'),
    item('Full English breakfast', '\u{1F373}', 'A plate that ends the day before it starts.',
      'hot meat breakfast comfort indulgent shareable fried filling', 'bready'),
    item('Avocado toast', '\u{1F951}', 'Yes, still. It is still good.',
      'healthy quick homemade breakfast carby fresh light bready', 'hot'),
    item('Bagel with cream cheese', '\u{1F96F}', 'Toasted, thick schmear, no negotiation.',
      'cheesy carby quick handheld breakfast cheap light bready', 'hot'),
    item('Peanut butter toast', '\u{1F35E}', 'Two minutes from thought to eaten.',
      'sweet quick homemade cheap comfort carby breakfast light bready', 'hot'),
    item('Cereal', '\u{1F963}', 'Acceptable at any hour and you know it.',
      'sweet quick homemade cheap breakfast light crunchy', 'fruity'),

    // ---- cold savoury ------------------------------------------------------
    item('Sushi', '\u{1F363}', 'Little parcels, soy sauce, a dab of wasabi.',
      'seafood fresh healthy light shareable handheld'),
    item('Poke bowl', '\u{1F372}', 'Raw fish over rice with everything green on top.',
      'seafood fresh healthy light carby quick'),
    item('Caesar salad', '\u{1F957}', 'Croutons, anchovy dressing, more parmesan than advertised.',
      'fresh healthy light crunchy cheesy', 'meat'),
    item('Greek salad', '\u{1F957}', 'Tomatoes, feta, olive oil, a lot of black pepper.',
      'fresh healthy light cheesy homemade'),
    item('Club sandwich', '\u{1F96A}', 'Cut into triangles or it does not count.',
      'meat carby handheld quick cheap filling bready', 'hot chicken'),
    item('Hummus and pita', '\u{1FAD3}', 'Dip, tear, repeat until the bowl is scraped.',
      'fresh healthy light shareable cheap quick homemade bready', 'hot'),
    item('Cheese and crackers', '\u{1F9C0}', 'Barely cooking, entirely a meal.',
      'cheesy crunchy quick shareable cheap light bready', 'hot'),
    item('Charcuterie board', '\u{1F9C0}', 'Snacks arranged on wood so they count as dinner.',
      'meat cheesy shareable indulgent filling', 'fresh hot'),
    item('Gazpacho', '\u{1F963}', 'Cold tomato soup, and it works. Trust it.',
      'soupy fresh healthy light homemade soft'),
    item('Spring rolls', '\u{1F962}', 'Rice paper, herbs, that peanut dipping sauce.',
      'fresh light healthy handheld shareable', 'hot bready'),

    item('Fattoush', '\u{1F957}', 'Sharp, herby, and full of the fried bread that makes it worth it.',
      'fresh healthy light cheap veg crunchy shareable', 'bready'),
    item('Ceviche', '\u{1F41F}', 'Cooked by lime rather than heat. Eat it the day it is made.',
      'seafood fresh healthy light shareable'),
    item('Arepas', '\u{1FAD3}', 'A warm maize pocket that will hold anything you put in it.',
      'carby handheld cheap shareable filling bready', 'hot cheesy meat veg'),
    item('Empanadas', '\u{1F95F}', 'Pastry, filling, crimped edge. Every country claims a different crimp.',
      'carby handheld shareable cheap crunchy filling bready', 'hot meat chicken'),

    // ---- snacks ------------------------------------------------------------
    item('Popcorn', '\u{1F37F}', 'A bowl on your chest, film already started.',
      'crunchy light quick cheap shareable handheld', 'hot'),
    item('Crisps', '\u{1F954}', 'You are not going to stop at a few.',
      'crunchy fried quick cheap handheld shareable light', 'hot'),
    item('Nuts', '\u{1F95C}', 'Salty, sensible, weirdly satisfying.',
      'crunchy healthy quick handheld light', 'hot'),
    item('Pretzel', '\u{1F968}', 'Warm, salty, twisted, eaten walking.',
      'carby handheld quick cheap light bready', 'hot crunchy'),

    // ---- hot sweet ---------------------------------------------------------
    item('Pancakes', '\u{1F95E}', 'A stack, butter sliding off, syrup pooling.',
      'sweet hot breakfast comfort indulgent homemade shareable carby filling soft', 'chocolate fruity'),
    item('Waffles', '\u{1F9C7}', 'Crisp squares built to hold syrup.',
      'sweet hot breakfast indulgent crunchy comfort carby filling', 'chocolate'),
    item('French toast', '\u{1F35E}', 'Yesterday’s bread, rescued.',
      'sweet hot breakfast comfort indulgent homemade quick carby filling soft bready'),
    item('Crepes', '\u{1F95E}', 'Thin, lacy, folded around chocolate.',
      'sweet hot indulgent homemade soft light', 'handheld chocolate fruity'),
    item('Churros', '\u{1F968}', 'Cinnamon sugar and a cup of chocolate to dunk in.',
      'sweet hot fried crunchy indulgent shareable handheld messy cheap light bready'),
    item('Cinnamon roll', '\u{1F369}', 'Best warm, from the middle outwards.',
      'sweet indulgent comfort handheld breakfast messy soft light bready', 'hot'),
    item('Molten chocolate cake', '\u{1F36B}', 'The bit where the middle runs out.',
      'sweet hot indulgent comfort soft light chocolate'),
    item('Apple pie', '\u{1F967}', 'With cream, and no discussion about it.',
      'sweet comfort indulgent shareable light bready fruity', 'hot'),
    item('Rice pudding', '\u{1F35A}', 'Slow, creamy, a spoonful of jam on top.',
      'sweet hot comfort homemade cheap soft', 'light'),

    item('Baklava', '\u{1F36F}', 'Layers you cannot count, held together by syrup and nerve.',
      'sweet crunchy indulgent shareable cheap veg light bready', 'hot'),
    item('Pastel de nata', '\u{1F95A}', 'Burnt on top on purpose. Eat it warm, standing up.',
      'sweet hot crunchy indulgent cheap quick veg light bready'),

    // ---- cold sweet --------------------------------------------------------
    item('Ice cream', '\u{1F366}', 'Straight from the tub is a valid serving suggestion.',
      'sweet indulgent quick handheld messy cheap soft light', 'shareable chocolate'),
    item('Frozen yoghurt', '\u{1F368}', 'Dessert with a slightly clearer conscience.',
      'sweet light healthy quick soft', 'indulgent fruity shareable'),
    item('Cheesecake', '\u{1F370}', 'A dense slice that defeats most people.',
      'sweet indulgent cheesy comfort soft light', 'chocolate'),
    item('Tiramisu', '\u{1F36E}', 'Coffee, cocoa, and a spoon that keeps going back.',
      'sweet indulgent caffeine comfort soft light chocolate'),
    item('Fruit salad', '\u{1F353}', 'Cold, sharp, and genuinely refreshing.',
      'sweet fresh healthy light quick cheap fruity homemade'),
    item('Yoghurt parfait', '\u{1F963}', 'Layers of yoghurt, granola, berries.',
      'sweet fresh healthy light quick breakfast soft fruity', 'crunchy'),
    item('Popsicle', '\u{1F36D}', 'For when it is far too hot to chew.',
      'sweet light quick handheld cheap fruity'),
    item('Doughnut', '\u{1F369}', 'Sugar on your fingers, no plate involved.',
      'sweet indulgent quick handheld messy cheap fried soft light bready', 'hot chocolate'),
    item('Chocolate bar', '\u{1F36B}', 'Snap a row off. Then another row.',
      'sweet indulgent quick handheld cheap light chocolate', 'hot'),
    item('Cookies', '\u{1F36A}', 'Still warm, edges crisp, middle not quite set.',
      'sweet indulgent quick handheld cheap shareable crunchy comfort light chocolate', 'hot'),
    item('Brownie', '\u{1F36B}', 'Fudgy corner piece. The good one.',
      'sweet indulgent comfort handheld cheap soft light chocolate', 'hot'),

    item('Mango lassi', '\u{1F964}', 'Thick, cold and sweet enough to put a fire out.',
      'drink sweet healthy quick veg light fruity', 'indulgent'),
    item('Mint tea', '\u{1F375}', 'Poured from a height, and sweeter than you expect.',
      'drink hot sweet cheap quick veg light'),

    // ---- drinks ------------------------------------------------------------
    item('Coffee', '\u{2615}', 'The reasonable answer to most mornings.',
      'drink hot caffeine quick cheap comfort light'),
    item('Iced coffee', '\u{1F9CB}', 'Cold, strong, ice rattling in the cup.',
      'drink caffeine quick cheap light', 'fresh sweet'),
    item('Tea', '\u{1F375}', 'Put the kettle on. Everything looks better after.',
      'drink hot caffeine quick cheap light comfort healthy homemade'),
    item('Hot chocolate', '\u{2615}', 'Thick enough that the spoon hesitates.',
      'drink hot sweet comfort indulgent quick homemade cheap light chocolate'),
    item('Smoothie', '\u{1F964}', 'Fruit, ice, and a blender doing the work.',
      'drink sweet fresh healthy light quick homemade fruity'),
    item('Milkshake', '\u{1F964}', 'So thick the straw is basically decorative.',
      'drink sweet indulgent quick comfort light', 'chocolate'),
    item('Bubble tea', '\u{1F9CB}', 'Chewy pearls, oversized straw, small joy.',
      'drink sweet indulgent quick caffeine light', 'chocolate fruity'),
    item('Orange juice', '\u{1F34A}', 'Freshly squeezed, pulp included.',
      'drink sweet fresh healthy light quick cheap breakfast fruity'),
    item('Lemonade', '\u{1F34B}', 'Sharp, cold, condensation on the glass.',
      'drink sweet fresh light quick cheap fruity'),
    // Filling rather than light, which is the entire point of drinking one —
    // and which stops it being offered to somebody who asked for a light bite.
    item('Protein shake', '\u{1F95B}', 'Not glamorous. Does the job.',
      'drink healthy quick filling homemade', 'sweet chocolate'),

    // ---- the second intake ----------------------------------------------
    // Chosen for what the first hundred and twelve did not have rather than
    // for being obvious: a Spanish rice pan, a Greek bake, a Thai curry
    // noodle, a Mexican breakfast. `veg` is never written here — item()
    // works it out from meat and seafood so the two can never contradict.
    item('Birria tacos', '\u{1F32E}', 'Dipped in the broth it was cooked in. Bring napkins.',
      'hot meat messy indulgent handheld comfort filling soft', 'spicy shareable'),
    item('Khao soi', '\u{1F35C}', 'Curry broth, soft noodles, and a tangle of crisp ones on top.',
      'hot soupy spicy carby comfort chicken filling', 'crunchy'),
    item('Okonomiyaki', '\u{1F373}', 'A cabbage pancake under sauce, mayo and dancing flakes.',
      'hot shareable homemade filling soft messy', 'veg cheap'),
    item('Rendang', '\u{1F35B}', 'Beef cooked down until the sauce is a coating. Deeply serious.',
      'hot meat spicy filling comfort soft', 'homemade'),
    item('Hainanese chicken rice', '\u{1F35A}', 'Poached chicken, rice cooked in the stock. Quietly perfect.',
      'hot chicken meat carby light comfort soft', 'healthy'),
    item('Paella', '\u{1F958}', 'One pan, socarrat on the bottom, everyone round it.',
      'hot shareable seafood carby filling homemade', 'chicken'),
    item('Risotto', '\u{1F35A}', 'Stirred until it goes creamy without any cream in it.',
      'hot carby comfort soft homemade filling cheesy', 'veg'),
    item('Carbonara', '\u{1F35D}', 'Egg, cheese, pepper, pork. No cream, ever.',
      'hot carby cheesy meat comfort filling quick', 'indulgent'),
    item('Moussaka', '\u{1F346}', 'Aubergine, lamb and a lid of béchamel gone golden.',
      'hot meat cheesy filling comfort indulgent soft', 'homemade'),
    item('Schnitzel', '\u{1F356}', 'Hammered thin, fried gold, lemon over the top.',
      'hot meat fried crunchy filling', 'quick'),
    item('Croque monsieur', '\u{1F956}', 'A cheese toastie that went to finishing school.',
      'hot cheesy bready meat indulgent filling quick', 'comfort'),
    item('Chilaquiles', '\u{1F336}', 'Last night\'s tortilla chips, this morning\'s breakfast.',
      'hot breakfast spicy messy cheesy comfort crunchy', 'veg cheap'),
    item('Elote', '\u{1F33D}', 'Corn, mayo, chilli, lime, cheese. Eaten off the cob, badly.',
      'hot handheld messy cheesy spicy cheap shareable', 'veg quick'),
    item('Pupusas', '\u{1FAD3}', 'Stuffed griddled corn cakes with something sharp on the side.',
      'hot cheesy filling soft handheld cheap comfort', 'veg'),
    item('Congee', '\u{1F963}', 'Rice cooked to a whisper. What you want when nothing else appeals.',
      'hot soupy soft light comfort breakfast healthy cheap', 'chicken'),
    item('Japchae', '\u{1F35C}', 'Glass noodles, sesame, vegetables that still have a snap.',
      'carby light shareable soft healthy', 'veg meat quick'),
    item('Souvlaki', '\u{1F959}', 'Skewered, griddled, wrapped with chips inside. Correctly.',
      'hot meat handheld filling messy quick', 'cheap'),
    item('Basque cheesecake', '\u{1F370}', 'Burnt on purpose. The middle barely sets.',
      'sweet indulgent soft homemade shareable', 'fruity'),
    item('Kunafa', '\u{1F36E}', 'Shredded pastry, melting cheese, syrup. Hot, somehow.',
      'sweet hot cheesy indulgent shareable crunchy', 'homemade'),
    item('Sticky toffee pudding', '\u{1F36E}', 'Dates, sponge, and more sauce than seems wise.',
      'sweet hot soft indulgent comfort homemade filling', 'shareable')
  ];

  return { QUESTIONS: QUESTIONS, TAGS: TAGS, TASTES: TASTES, ITEMS: ITEMS,
    phrase: phrase, wordings: wordings };
});
