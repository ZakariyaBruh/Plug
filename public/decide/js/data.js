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

  // Every tag a dish may carry is in one of the two lists below. Between them
  // they are deliberately longer than the questions: "a thing food can be" and
  // "a thing worth asking about" are not the same list, and tying them
  // together once meant the only way to stop asking about caffeine was to
  // forget which drinks have caffeine in them. Standing rules, the mood
  // shortcuts, the taste profile and the dish filters all read tags nobody is
  // ever asked about.

  /*
   * The tags worth forming an opinion about — everything the app is allowed to
   * learn a preference from.
   *
   * The diet tags below are deliberately not in here. Every mode that compares
   * two dishes files away what separated them (see decisiveTags), and left to
   * itself that machinery would happily conclude that somebody who keeps halal
   * "prefers" not-pork, and start weighting their dinners by it. It is not a
   * preference. It is a rule, it is already held as one, and reading it back
   * to somebody as a taste — "Strongest preference: not pork" — would be the
   * app being clever at them on the one subject where it should be quiet.
   */
  var LEARNABLE = [
    'drink', 'sweet', 'hot', 'quick', 'healthy', 'light', 'filling', 'meat',
    'spicy', 'cheesy', 'handheld', 'soupy', 'fried', 'crunchy', 'soft',
    'seafood', 'shareable', 'homemade', 'bready', 'chicken', 'chocolate', 'fruity',
    'breakfast', 'caffeine', 'messy', 'carby', 'fresh', 'cheap', 'indulgent', 'veg',
    // Never asked about, still true of the food.
    'comfort'
  ];

  /*
   * WHAT IS IN THE FOOD, as opposed to what it is like.
   *
   * Every tag above is a matter of taste: somebody who says "nothing spicy" is
   * telling you a preference, and the worst a wrong guess costs them is a
   * dinner they did not fancy. These six are not that. They are the things
   * people do not eat for reasons that have nothing to do with the food being
   * nice, and a wrong guess costs somebody a rule they keep. So they are held
   * to standards the rest are not:
   *
   *  1. NEVER 0.5. Every other tag may be a half — "depends how it's made" —
   *     and everything downstream reads a half as a pass. "It might have pork
   *     in it" is the one answer a rule like this must never give, so item()
   *     refuses a diet tag that is not plainly 1 or plainly absent. Where a
   *     dish is commonly made both ways it is tagged: leaving somebody one
   *     dish short is the cheaper mistake by a very long way.
   *  2. CONSISTENT WITH THEIR PARENT. Pork and beef are meat; shellfish is
   *     seafood. A dish carrying the child and not the parent would be hidden
   *     from one rule and served by the other, so item() refuses that too.
   *  3. NEVER LEARNED FROM — see LEARNABLE above.
   *
   * What they cannot do is certify anything, and the app says so plainly where
   * it asks: nothing here knows whether an animal was slaughtered to a rite or
   * whether a kitchen keeps its pans apart. This filters a menu. It does not
   * vouch for a kitchen.
   */
  var DIET_TAGS = [
    'pork', 'beef', 'shellfish', 'alcohol', 'dairy', 'egg',
    /*
     * The two that are not about an animal.
     *
     * `allium` is onion, garlic, leek, shallot, spring onion and chives — the
     * pungent group that Jain cooking leaves out, that a sattvic kitchen
     * leaves out, and that the Chinese Mahayana "five pungent roots" covers.
     * `root` is everything else grown underground: potato, carrot, radish,
     * beetroot, ginger, turmeric, galangal.
     *
     * Tagged as normally made, like the rest, and that cuts deep here — onion
     * or garlic is in most of the savoury half of any catalogue, and ginger or
     * turmeric is in most of the curries. That is not a flaw in the tagging.
     * It is what the rule actually does, and a Jain profile that came back
     * with a full menu would be a profile that had not been listened to.
     */
    'allium', 'root'
  ];

  // Pork and beef are meat; shellfish is seafood. Written down because item()
  // enforces it, not because a reader would doubt it.
  var DIET_PARENT = { pork: 'meat', beef: 'meat', shellfish: 'seafood' };

  var TAGS = LEARNABLE.concat(DIET_TAGS);

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

    // The two promises the diet tags make, checked on every dish rather than
    // trusted. See DIET_TAGS for why these two in particular.
    DIET_TAGS.forEach(function (t) {
      if (!(t in tags)) return;
      if (tags[t] !== 1) {
        throw new Error('"' + t + '" on ' + name + ' is ' + tags[t] +
          ' — a diet tag is 1 or it is left off. There is no "probably".');
      }
      var parent = DIET_PARENT[t];
      if (parent && (tags[parent] || 0) !== 1) {
        throw new Error(name + ' is tagged "' + t + '" but not "' + parent +
          '" — one rule would hide it and the other would serve it.');
      }
    });

    // Cheese is dairy. Held here rather than assumed, because "No cheese" and
    // "No dairy" are two separate rules and a cheese-led dish that forgot to
    // say it was dairy would be caught by the narrower one and missed by the
    // wider. A MAYBE-cheese dish is exempt on purpose: it is one that can be
    // made without, which is exactly what a half means.
    if ((tags.cheesy || 0) === 1 && (tags.dairy || 0) !== 1) {
      throw new Error(name + ' is cheese-led but not tagged "dairy".');
    }

    /*
     * A NARROW ANIMAL TAG IMPLIES THE WIDE ONE.
     *
     * DIET_PARENT already refuses a dish tagged "pork" that forgot "meat",
     * because both of those are diet tags and diet tags are checked. "chicken"
     * is not a diet tag — it is allowed to be a half, since a green curry
     * genuinely can be made either way — and so nothing was checking it.
     *
     * Khao soi is a chicken curry. It was tagged chicken:1, meat:0, and
     * therefore veg:1, and it was served to vegetarians, Jains, Sattvic and
     * Buddhist and Sikh profiles, and anybody keeping Ital. Congee, tagged
     * maybe-chicken, was counted fully vegetarian the same way. Nothing failed,
     * because nothing was looking.
     *
     * So the roll-up happens here instead of being trusted to whoever writes
     * the next dish: meat is at least as true as the most specific meat on the
     * dish, and seafood at least as true as the most specific fish. Then veg
     * falls out of those, as it always did, and cannot disagree with them.
     */
    var MEATS = ['chicken', 'pork', 'beef'];
    var FISH = ['shellfish'];
    MEATS.forEach(function (t) {
      if ((tags[t] || 0) > (tags.meat || 0)) tags.meat = tags[t];
    });
    FISH.forEach(function (t) {
      if ((tags[t] || 0) > (tags.seafood || 0)) tags.seafood = tags[t];
    });

    // Vegetarian is never authored by hand — it falls out of meat and seafood,
    // so the two can never contradict each other.
    if (!('veg' in tags)) tags.veg = 1 - Math.max(tags.meat || 0, tags.seafood || 0);

    /*
     * And the same fact stated the other way round, as a check rather than a
     * derivation, because the derivation above only runs when veg was left
     * off. A dish CAN name its own veg — several do — and a hand-written
     * veg:1 on something carrying an animal tag is the exact defect this is
     * here to catch.
     */
    if ((tags.veg || 0) > 0) {
      var animal = MEATS.concat(FISH, ['meat', 'seafood']).filter(function (t) {
        return (tags[t] || 0) > 0;
      });
      var worst = Math.max.apply(null, animal.map(function (t) { return tags[t]; }).concat([0]));
      if (tags.veg > 1 - worst) {
        throw new Error(name + ' is tagged veg ' + tags.veg + ' but carries ' +
          animal.join(', ') + ' — a vegetarian would be served it.');
      }
    }

    // Nor is meat-and-dairy-in-one-dish, which is what keeps a cheeseburger off
    // a kosher menu even though neither half of it is forbidden on its own.
    // Derived for the same reason veg is: it is a fact about two other tags,
    // and authoring it by hand is authoring a way for it to disagree with them.
    if ((tags.meat || 0) === 1 && (tags.dairy || 0) === 1) tags.meatdairy = 1;

    return { name: name, icon: icon, blurb: blurb, tags: tags };
  }

  var ITEMS = [
    // ---- hot savoury mains -------------------------------------------------
    item('Pizza', '\u{1F355}', 'A slice big enough to fold. Nobody has ever regretted this.',
      'hot cheesy carby comfort shareable indulgent handheld messy filling bready dairy allium', 'quick cheap'),
    item('Cheeseburger', '\u{1F354}', 'Beef, melted cheese, and a bun that gives up halfway through.',
      'hot meat carby comfort indulgent handheld messy fried filling bready beef dairy allium egg', 'quick cheap'),
    item('Fried chicken', '\u{1F357}', 'Shatteringly crisp outside, ridiculous inside.',
      'hot meat fried crunchy comfort indulgent shareable handheld messy filling chicken allium dairy', 'cheap'),
    item('Ramen', '\u{1F35C}', 'A bowl of broth you will absolutely drink to the bottom.',
      'hot soupy comfort carby meat filling soft pork egg allium root', 'spicy cheap chicken'),
    item('Pho', '\u{1F372}', 'Clean beef broth, herbs, noodles. Restorative stuff.',
      'hot soupy meat carby healthy light fresh soft beef allium root'),
    item('Chicken soup', '\u{1F963}', 'The one you make when the world is being difficult.',
      'hot soupy comfort light healthy meat homemade cheap soft chicken allium root'),
    item('Thai green curry', '\u{1F35B}', 'Coconut, chilli, basil. Loud in the best way.',
      'hot spicy comfort carby filling soft allium root seafood', 'meat healthy chicken'),
    item('Chicken biryani', '\u{1F35A}', 'Layered rice that took someone all afternoon.',
      'hot meat carby spicy comfort shareable indulgent filling soft chicken dairy allium root'),
    item('Spaghetti bolognese', '\u{1F35D}', 'The default answer for a reason.',
      'hot meat carby comfort homemade cheap filling soft beef dairy alcohol allium indulgent'),
    item('Mac and cheese', '\u{1F9C0}', 'Carbs wearing a cheese blanket.',
      'hot cheesy carby comfort indulgent quick homemade cheap filling soft dairy'),
    item('Tacos', '\u{1F32E}', 'Three small ones, obviously. Nobody stops at three.',
      'hot meat handheld shareable messy spicy fresh filling bready beef allium', 'cheap chicken'),
    item('Burrito', '\u{1F32F}', 'An entire meal wrapped in foil like a gift.',
      'hot meat carby handheld comfort indulgent messy filling soft bready dairy allium', 'spicy quick chicken'),
    item('Quesadilla', '\u{1FAD3}', 'Two tortillas, a lot of cheese, four minutes.',
      'hot cheesy carby quick homemade cheap handheld crunchy filling bready dairy'),
    item('Grilled cheese', '\u{1F96A}', 'Butter the outside of the bread. That is the whole trick.',
      'hot cheesy carby comfort quick homemade cheap handheld crunchy filling bready dairy'),
    item('Steak', '\u{1F969}', 'Rest it before you cut it. Please.',
      'hot meat indulgent filling soft beef dairy'),
    item('Roast chicken', '\u{1F357}', 'Sunday energy, whatever day it actually is.',
      'hot meat comfort shareable filling soft chicken allium', 'healthy homemade'),
    item('Shawarma wrap', '\u{1F32F}', 'Spinning meat, garlic sauce, questionable decisions.',
      'hot meat carby handheld messy spicy filling bready allium', 'cheap quick chicken'),
    item('Fish and chips', '\u{1F35F}', 'Vinegar, too much salt, eaten out of the paper.',
      'hot seafood fried carby comfort indulgent crunchy messy filling alcohol root', 'bready'),
    item('Dumplings', '\u{1F95F}', 'A steamer basket and no intention of sharing, really.',
      'hot shareable comfort handheld filling soft bready allium root', 'meat quick'),
    item('Egg fried rice', '\u{1F35A}', 'Whatever is in the fridge, plus rice, plus a wok.',
      'hot carby quick homemade cheap comfort filling soft egg allium root'),
    item('Pad thai', '\u{1F35C}', 'Sweet, sour, peanuts, lime squeezed over the top.',
      'hot carby comfort filling soft egg allium', 'seafood spicy'),
    item('Katsu curry', '\u{1F35B}', 'Crumbed cutlet under a sauce that tastes like a hug.',
      'hot meat carby fried comfort crunchy indulgent filling chicken egg allium root'),
    item('Lasagna', '\u{1F35D}', 'Layers. Patience. Cheese pulled over the edge of the dish.',
      'hot cheesy carby meat comfort indulgent shareable homemade filling soft beef dairy allium'),
    item('Chilli con carne', '\u{1F336}\u{FE0F}', 'Better on the second day, as everyone keeps telling you.',
      'hot meat spicy comfort homemade cheap filling soft beef allium', 'soupy'),
    item('Buffalo wings', '\u{1F357}', 'Sticky fingers and a small pile of napkins.',
      'hot meat spicy fried shareable messy indulgent handheld filling chicken dairy allium'),
    item('Nachos', '\u{1F9C0}', 'A shared plate where everyone quietly hunts the loaded ones.',
      'hot cheesy crunchy shareable indulgent messy spicy handheld cheap filling dairy allium'),
    item('Falafel wrap', '\u{1F9C6}', 'Crisp chickpea balls, pickles, far too much sauce.',
      'carby handheld healthy cheap fried messy filling bready allium', 'hot'),
    item('Baked potato', '\u{1F954}', 'Crisp skin, steam everywhere, butter melting in.',
      'hot carby comfort cheap homemade filling soft dairy root', 'cheesy'),
    item('Miso soup', '\u{1F963}', 'Small, warm, and somehow exactly enough.',
      'hot soupy light healthy quick cheap soft allium', 'seafood'),

    // ---- hot savoury mains, the rest of the world ---------------------------
    //
    // The first pass at this catalogue was written from one kitchen and it
    // showed: a quarter of it was American and there was nothing at all from
    // Korea, Africa, South America or the Caribbean. An app that tells you what
    // to eat should not assume where you live.
    item('Bibimbap', '\u{1F35A}', 'A bowl you wreck on purpose. Mix it properly, all the way down.',
      'hot carby healthy comfort filling messy egg allium root', 'meat spicy homemade crunchy'),
    item('Korean fried chicken', '\u{1F357}', 'Twice fried, so it stays crisp under the sauce.',
      'hot meat fried crunchy indulgent shareable handheld messy spicy filling chicken allium'),
    item('Tteokbokki', '\u{1F362}', 'Chewy rice cakes in a sauce that is sweeter than it looks, then hotter.',
      'hot spicy carby comfort shareable cheap filling soft allium', 'quick seafood'),
    item('Butter chicken', '\u{1F35B}', 'The gentle one. Tomato, cream, and a lot of butter doing quiet work.',
      'hot meat comfort indulgent carby filling soft chicken dairy allium root', 'spicy'),
    item('Chana masala', '\u{1F958}', 'Chickpeas that have been somewhere. Cheap, filling, quietly brilliant.',
      'hot spicy healthy cheap comfort carby homemade veg filling soft allium root'),
    item('Masala dosa', '\u{1F95E}', 'A crisp metre-long crepe with spiced potato hiding inside.',
      'hot crunchy carby shareable veg filling allium root', 'spicy cheap'),
    item('Kabsa', '\u{1F35B}', 'Spiced rice and slow meat, cooked in one pot and eaten from one plate.',
      'hot meat carby comfort shareable filling soft chicken allium root', 'homemade handheld messy'),
    item('Lahmacun', '\u{1FAD3}', 'Thin as paper, folded round salad and lemon. Not a pizza, whatever anyone says.',
      'hot meat carby handheld crunchy cheap quick filling bready allium', 'spicy'),
    item('Manakish', '\u{1FAD3}', 'Flatbread under za’atar and oil, straight from the oven.',
      'hot carby cheap quick handheld breakfast veg filling bready', 'cheesy'),
    item('Jollof rice', '\u{1F35A}', 'The one people argue about across borders. Smoky, red, gone quickly.',
      'hot spicy carby comfort shareable cheap filling soft allium root', 'meat'),
    item('Tagine', '\u{1F372}', 'Slow, sweet and savoury at once. The apricots are not optional.',
      'hot comfort shareable filling soft fruity allium root', 'meat homemade sweet'),
    item('Koshari', '\u{1F35D}', 'Rice, lentils, pasta and fried onion. Carbohydrate on carbohydrate, and it works.',
      'hot carby cheap comfort veg shareable filling allium', 'spicy'),
    item('Doro wat', '\u{1F35B}', 'Deep, dark and slow. Eaten with your hands off shared injera.',
      'hot meat spicy comfort shareable handheld messy filling soft chicken egg dairy allium root'),
    item('Feijoada', '\u{1F372}', 'Black beans and everything else, cooked until it gives up.',
      'hot meat comfort shareable indulgent filling soft pork allium', 'homemade carby soupy cheap'),
    item('Jerk chicken', '\u{1F357}', 'Allspice, scotch bonnet and smoke. It is meant to hurt a little.',
      'hot meat spicy shareable handheld messy filling chicken allium'),
    item('Pierogi', '\u{1F95F}', 'Little parcels, boiled then fried in butter. Somebody’s grandmother is involved.',
      'hot carby comfort homemade cheap shareable filling soft bready dairy allium root egg', 'cheesy veg'),
    item('Nasi goreng', '\u{1F35A}', 'Last night’s rice, improved. The fried egg on top is the whole point.',
      'hot carby quick cheap comfort filling soft spicy egg allium', 'breakfast meat homemade chicken'),
    item('Laksa', '\u{1F35C}', 'Coconut, chilli and noodles. Somewhere between a soup and an event.',
      'hot soupy spicy carby comfort filling soft allium root egg', 'seafood indulgent chicken'),
    item('Chicken satay', '\u{1F362}', 'Charred on sticks, drowned in peanut sauce.',
      'hot meat handheld shareable cheap light chicken allium', 'spicy messy'),
    item('Chicken adobo', '\u{1F357}', 'Vinegar, soy, garlic, time. Four things and no notes.',
      'hot meat comfort homemade cheap shareable filling soft chicken allium', 'carby quick soupy'),
    item('Plov', '\u{1F35A}', 'Rice cooked in the fat of the lamb above it. Made for a crowd, always.',
      'hot meat carby comfort shareable indulgent filling soft allium root', 'homemade'),
    item('Mapo tofu', '\u{1F963}', 'Numbing rather than merely hot. Silky tofu, and rice underneath.',
      'hot spicy comfort carby quick filling soft soupy allium root', 'homemade meat'),
    item('Bao buns', '\u{1F95F}', 'Steamed, pillowy, slightly sweet, and gone in three bites.',
      'hot carby shareable handheld comfort filling soft bready allium dairy', 'meat'),
    item('Banh mi', '\u{1F956}', 'A French loaf that emigrated and came back better.',
      'hot meat carby handheld crunchy quick cheap fresh filling bready pork root egg'),

    // ---- eggs and breakfast ------------------------------------------------
    item('Omelette', '\u{1F373}', 'Three eggs and whatever needs using up.',
      'hot quick homemade healthy cheap breakfast filling soft egg dairy'),
    item('Shakshuka', '\u{1F373}', 'Eggs poached in tomatoes, bread for mopping.',
      'hot spicy homemade healthy breakfast comfort shareable filling soft egg allium', 'soupy'),
    item('Full English breakfast', '\u{1F373}', 'A plate that ends the day before it starts.',
      'hot meat breakfast comfort indulgent shareable fried filling pork egg', 'bready'),
    item('Avocado toast', '\u{1F951}', 'Yes, still. It is still good.',
      'healthy quick homemade breakfast carby fresh light bready', 'hot'),
    item('Bagel with cream cheese', '\u{1F96F}', 'Toasted, thick schmear, no negotiation.',
      'cheesy carby quick handheld breakfast cheap light bready dairy seafood', 'hot'),
    item('Peanut butter toast', '\u{1F35E}', 'Two minutes from thought to eaten.',
      'sweet quick homemade cheap comfort carby breakfast light bready', 'hot'),
    item('Cereal', '\u{1F963}', 'Acceptable at any hour and you know it.',
      'sweet quick homemade cheap breakfast light crunchy dairy', 'fruity'),

    // ---- cold savoury ------------------------------------------------------
    item('Sushi', '\u{1F363}', 'Little parcels, soy sauce, a dab of wasabi.',
      'seafood fresh healthy light shareable handheld root'),
    item('Poke bowl', '\u{1F372}', 'Raw fish over rice with everything green on top.',
      'seafood fresh healthy light carby quick allium root'),
    item('Caesar salad', '\u{1F957}', 'Croutons, anchovy dressing, more parmesan than advertised.',
      'fresh healthy light crunchy cheesy dairy egg allium seafood', 'meat'),
    item('Greek salad', '\u{1F957}', 'Tomatoes, feta, olive oil, a lot of black pepper.',
      'fresh healthy light cheesy homemade dairy allium'),
    item('Club sandwich', '\u{1F96A}', 'Cut into triangles or it does not count.',
      'meat carby handheld quick cheap filling bready pork egg', 'hot chicken'),
    item('Hummus and pita', '\u{1FAD3}', 'Dip, tear, repeat until the bowl is scraped.',
      'fresh healthy light shareable cheap quick homemade bready allium', 'hot'),
    item('Cheese and crackers', '\u{1F9C0}', 'Barely cooking, entirely a meal.',
      'cheesy crunchy quick shareable cheap light bready dairy', 'hot'),
    item('Charcuterie board', '\u{1F9C0}', 'Snacks arranged on wood so they count as dinner.',
      'meat cheesy shareable indulgent filling pork dairy', 'fresh hot'),
    item('Gazpacho', '\u{1F963}', 'Cold tomato soup, and it works. Trust it.',
      'soupy fresh healthy light homemade soft allium'),
    item('Spring rolls', '\u{1F962}', 'Rice paper, herbs, that peanut dipping sauce.',
      'fresh light healthy handheld shareable root seafood', 'hot bready'),

    item('Fattoush', '\u{1F957}', 'Sharp, herby, and full of the fried bread that makes it worth it.',
      'fresh healthy light cheap veg crunchy shareable allium', 'bready'),
    item('Ceviche', '\u{1F41F}', 'Cooked by lime rather than heat. Eat it the day it is made.',
      'seafood fresh healthy light shareable allium'),
    item('Arepas', '\u{1FAD3}', 'A warm maize pocket that will hold anything you put in it.',
      'carby handheld cheap shareable filling bready', 'hot cheesy meat veg'),
    item('Empanadas', '\u{1F95F}', 'Pastry, filling, crimped edge. Every country claims a different crimp.',
      'carby handheld shareable cheap crunchy filling bready allium root dairy egg', 'hot meat chicken'),

    // ---- snacks ------------------------------------------------------------
    item('Popcorn', '\u{1F37F}', 'A bowl on your chest, film already started.',
      'crunchy light quick cheap shareable handheld', 'hot'),
    item('Crisps', '\u{1F954}', 'You are not going to stop at a few.',
      'crunchy fried quick cheap handheld shareable light root', 'hot'),
    item('Nuts', '\u{1F95C}', 'Salty, sensible, weirdly satisfying.',
      'crunchy healthy quick handheld light', 'hot'),
    item('Pretzel', '\u{1F968}', 'Warm, salty, twisted, eaten walking.',
      'carby handheld quick cheap light bready', 'hot crunchy'),

    // ---- hot sweet ---------------------------------------------------------
    item('Pancakes', '\u{1F95E}', 'A stack, butter sliding off, syrup pooling.',
      'sweet hot breakfast comfort indulgent homemade shareable carby filling soft egg dairy', 'chocolate fruity'),
    item('Waffles', '\u{1F9C7}', 'Crisp squares built to hold syrup.',
      'sweet hot breakfast indulgent crunchy comfort carby filling egg dairy', 'chocolate'),
    item('French toast', '\u{1F35E}', 'Yesterday’s bread, rescued.',
      'sweet hot breakfast comfort indulgent homemade quick carby filling soft bready egg dairy'),
    item('Crepes', '\u{1F95E}', 'Thin, lacy, folded around chocolate.',
      'sweet hot indulgent homemade soft light egg dairy', 'handheld chocolate fruity'),
    item('Churros', '\u{1F968}', 'Cinnamon sugar and a cup of chocolate to dunk in.',
      'sweet hot fried crunchy indulgent shareable handheld messy cheap light bready'),
    item('Cinnamon roll', '\u{1F369}', 'Best warm, from the middle outwards.',
      'sweet indulgent comfort handheld breakfast messy soft light bready egg dairy', 'hot'),
    item('Molten chocolate cake', '\u{1F36B}', 'The bit where the middle runs out.',
      'sweet hot indulgent comfort soft light chocolate egg dairy'),
    item('Apple pie', '\u{1F967}', 'With cream, and no discussion about it.',
      'sweet comfort indulgent shareable light bready fruity dairy dairy egg', 'hot'),
    item('Rice pudding', '\u{1F35A}', 'Slow, creamy, a spoonful of jam on top.',
      'sweet hot comfort homemade cheap soft dairy', 'light'),

    item('Baklava', '\u{1F36F}', 'Layers you cannot count, held together by syrup and nerve.',
      'sweet crunchy indulgent shareable cheap veg light bready dairy', 'hot'),
    item('Pastel de nata', '\u{1F95A}', 'Burnt on top on purpose. Eat it warm, standing up.',
      'sweet hot crunchy indulgent cheap quick veg light bready egg dairy'),

    // ---- cold sweet --------------------------------------------------------
    item('Ice cream', '\u{1F366}', 'Straight from the tub is a valid serving suggestion.',
      'sweet indulgent quick handheld messy cheap soft light dairy', 'shareable chocolate'),
    item('Frozen yoghurt', '\u{1F368}', 'Dessert with a slightly clearer conscience.',
      'sweet light healthy quick soft dairy', 'indulgent fruity shareable'),
    item('Cheesecake', '\u{1F370}', 'A dense slice that defeats most people.',
      'sweet indulgent cheesy comfort soft light dairy egg', 'chocolate'),
    item('Tiramisu', '\u{1F36E}', 'Coffee, cocoa, and a spoon that keeps going back.',
      'sweet indulgent caffeine comfort soft light chocolate dairy egg alcohol'),
    item('Fruit salad', '\u{1F353}', 'Cold, sharp, and genuinely refreshing.',
      'sweet fresh healthy light quick cheap fruity homemade'),
    item('Yoghurt parfait', '\u{1F963}', 'Layers of yoghurt, granola, berries.',
      'sweet fresh healthy light quick breakfast soft fruity dairy cheap', 'crunchy'),
    item('Popsicle', '\u{1F36D}', 'For when it is far too hot to chew.',
      'sweet light quick handheld cheap fruity'),
    item('Doughnut', '\u{1F369}', 'Sugar on your fingers, no plate involved.',
      'sweet indulgent quick handheld messy cheap fried soft light bready egg dairy', 'hot chocolate'),
    item('Chocolate bar', '\u{1F36B}', 'Snap a row off. Then another row.',
      'sweet indulgent quick handheld cheap light chocolate dairy', 'hot'),
    item('Cookies', '\u{1F36A}', 'Still warm, edges crisp, middle not quite set.',
      'sweet indulgent quick handheld cheap shareable crunchy comfort light chocolate egg dairy', 'hot'),
    item('Brownie', '\u{1F36B}', 'Fudgy corner piece. The good one.',
      'sweet indulgent comfort handheld cheap soft light chocolate egg dairy', 'hot'),

    item('Mango lassi', '\u{1F964}', 'Thick, cold and sweet enough to put a fire out.',
      'drink sweet healthy quick veg light fruity dairy', 'indulgent'),
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
      'drink hot sweet comfort indulgent quick homemade cheap light chocolate dairy'),
    item('Smoothie', '\u{1F964}', 'Fruit, ice, and a blender doing the work.',
      'drink sweet fresh healthy light quick homemade fruity'),
    item('Milkshake', '\u{1F964}', 'So thick the straw is basically decorative.',
      'drink sweet indulgent quick comfort light dairy', 'chocolate'),
    item('Bubble tea', '\u{1F9CB}', 'Chewy pearls, oversized straw, small joy.',
      'drink sweet indulgent quick caffeine light dairy', 'chocolate fruity'),
    item('Orange juice', '\u{1F34A}', 'Freshly squeezed, pulp included.',
      'drink sweet fresh healthy light quick cheap breakfast fruity'),
    item('Lemonade', '\u{1F34B}', 'Sharp, cold, condensation on the glass.',
      'drink sweet fresh light quick cheap fruity'),
    // Filling rather than light, which is the entire point of drinking one —
    // and which stops it being offered to somebody who asked for a light bite.
    item('Protein shake', '\u{1F95B}', 'Not glamorous. Does the job.',
      'drink healthy quick filling homemade dairy', 'sweet chocolate'),

    // ---- the second intake ----------------------------------------------
    // Chosen for what the first hundred and twelve did not have rather than
    // for being obvious: a Spanish rice pan, a Greek bake, a Thai curry
    // noodle, a Mexican breakfast. `veg` is never written here — item()
    // works it out from meat and seafood so the two can never contradict.
    item('Birria tacos', '\u{1F32E}', 'Dipped in the broth it was cooked in. Bring napkins.',
      'hot meat messy indulgent handheld comfort filling soft beef allium dairy', 'spicy shareable'),
    item('Khao soi', '\u{1F35C}', 'Curry broth, soft noodles, and a tangle of crisp ones on top.',
      'hot soupy spicy carby comfort chicken filling egg allium root seafood', 'crunchy'),
    item('Okonomiyaki', '\u{1F373}', 'A cabbage pancake under sauce, mayo and dancing flakes.',
      'hot shareable homemade filling soft messy egg allium', 'veg cheap seafood meat'),
    item('Rendang', '\u{1F35B}', 'Beef cooked down until the sauce is a coating. Deeply serious.',
      'hot meat spicy filling comfort soft beef allium root', 'homemade'),
    item('Hainanese chicken rice', '\u{1F35A}', 'Poached chicken, rice cooked in the stock. Quietly perfect.',
      'hot chicken meat carby light comfort soft allium root', 'healthy'),
    item('Paella', '\u{1F958}', 'One pan, socarrat on the bottom, everyone round it.',
      'hot shareable seafood carby filling homemade shellfish allium', 'chicken'),
    item('Risotto', '\u{1F35A}', 'Stirred until it goes creamy without any cream in it.',
      'hot carby comfort soft homemade filling cheesy dairy alcohol allium', 'veg'),
    item('Carbonara', '\u{1F35D}', 'Egg, cheese, pepper, pork. No cream, ever.',
      'hot carby cheesy meat comfort filling quick pork egg dairy', 'indulgent'),
    item('Moussaka', '\u{1F346}', 'Aubergine, lamb and a lid of béchamel gone golden.',
      'hot meat cheesy filling comfort indulgent soft dairy alcohol allium root', 'homemade'),
    item('Schnitzel', '\u{1F356}', 'Hammered thin, fried gold, lemon over the top.',
      'hot meat fried crunchy filling pork egg dairy', 'quick'),
    item('Croque monsieur', '\u{1F956}', 'A cheese toastie that went to finishing school.',
      'hot cheesy bready meat indulgent filling quick pork dairy', 'comfort'),
    item('Chilaquiles', '\u{1F336}', 'Last night\'s tortilla chips, this morning\'s breakfast.',
      'hot breakfast spicy messy cheesy comfort crunchy dairy allium egg', 'veg cheap'),
    item('Elote', '\u{1F33D}', 'Corn, mayo, chilli, lime, cheese. Eaten off the cob, badly.',
      'hot handheld messy cheesy spicy cheap shareable dairy egg', 'veg quick'),
    item('Pupusas', '\u{1FAD3}', 'Stuffed griddled corn cakes with something sharp on the side.',
      'hot cheesy filling soft handheld cheap comfort dairy allium', 'veg'),
    item('Congee', '\u{1F963}', 'Rice cooked to a whisper. What you want when nothing else appeals.',
      'hot soupy soft light comfort breakfast healthy cheap allium root egg', 'chicken'),
    item('Japchae', '\u{1F35C}', 'Glass noodles, sesame, vegetables that still have a snap.',
      'carby light shareable soft healthy allium root', 'veg meat quick'),
    item('Souvlaki', '\u{1F959}', 'Skewered, griddled, wrapped with chips inside. Correctly.',
      'hot meat handheld filling messy quick pork dairy allium', 'cheap'),
    item('Basque cheesecake', '\u{1F370}', 'Burnt on purpose. The middle barely sets.',
      'sweet indulgent soft homemade shareable dairy egg', 'fruity'),
    item('Kunafa', '\u{1F36E}', 'Shredded pastry, melting cheese, syrup. Hot, somehow.',
      'sweet hot cheesy indulgent shareable crunchy dairy', 'homemade'),
    item('Sticky toffee pudding', '\u{1F36E}', 'Dates, sponge, and more sauce than seems wise.',
      'sweet hot soft indulgent comfort homemade filling dairy egg', 'shareable'),
    item('Lobster', '\u{1F99E}', 'Butter, a cracked shell, and no dignity left at the table.',
      'hot seafood indulgent shareable messy filling soft shellfish allium dairy', 'homemade fresh'),
    // ---- the third intake: plant-based -------------------------------------
    //
    // CHOSEN BY WHO HAD THE SHORTEST MENU, not by what sounded good. Strict
    // profiles were down to almost nothing: vegan and Ital had 25 dishes each,
    // Jain 36, Sattvic 49. A rule with nothing left to offer is a rule the
    // engine stops enforcing (see activeBans in engine.js), so the thinnest
    // menus are the ones where the dietary promise is closest to quietly
    // breaking — which makes them the right place to spend the next hundred
    // dishes rather than the last.
    //
    // Nothing here carries dairy or egg unless it says so, so almost all of it
    // counts for vegan and Ital as well as vegetarian. A dozen of them carry
    // neither allium nor root either, which is the only way the Jain and
    // Sattvic lists grow at all.
    item('Dal tadka', '\u{1F963}', 'Lentils, and a spoonful of hot spiced oil poured over at the end.',
      'hot soupy comfort carby filling soft healthy cheap homemade allium root quick', 'spicy'),
    item('Rajma', '\u{1FAD8}', 'Kidney beans in a thick gravy, with rice to put it on.',
      'hot soupy comfort filling carby healthy cheap homemade soft allium root', 'spicy'),
    item('Idli', '\u{1F35A}', 'Steamed, sour, and lighter than anything that filling has a right to be.',
      'hot soft light healthy quick breakfast cheap homemade shareable'),
    item('Lemon rice', '\u{1F35A}', 'Yesterday’s rice, woken up with mustard seed and lemon.',
      'hot carby quick cheap light homemade root', 'crunchy'),
    item('Coconut rice', '\u{1F35A}', 'Rice cooked in coconut milk. Sweet, plain, and quietly excellent.',
      'hot carby comfort soft cheap homemade filling quick', 'sweet'),
    item('Upma', '\u{1F963}', 'Semolina, softened, with whatever vegetables were in the drawer.',
      'hot soft breakfast quick cheap homemade healthy filling allium root carby', 'spicy'),
    item('Poha', '\u{1F35A}', 'Flattened rice, turmeric yellow, eaten before ten in the morning.',
      'hot soft breakfast quick light cheap homemade healthy allium root', 'crunchy'),
    item('Baingan bharta', '\u{1F346}', 'Aubergine burnt over a flame, then mashed into something smoky.',
      'hot comfort soft healthy homemade filling spicy allium root'),
    item('Aloo gobi', '\u{1F957}', 'Potato and cauliflower, dry-fried, turmeric everywhere.',
      'hot comfort homemade filling healthy root allium', 'spicy'),
    item('Dhokla', '\u{1F35E}', 'Steamed chickpea sponge, sweet and sour at once.',
      'soft light healthy shareable homemade cheap quick'),
    item('Pav bhaji', '\u{1F35E}', 'Mashed vegetables, far too much butter, and a bun to push it around with.',
      'hot spicy comfort carby messy shareable bready filling dairy allium root', 'indulgent'),
    item('Vada pav', '\u{1F35E}', 'A spiced potato fritter in a bun. Bombay’s answer to everything.',
      'hot handheld cheap fried carby bready spicy filling messy allium root', 'crunchy'),
    item('Khichdi', '\u{1F963}', 'Rice and lentils cooked soft together. What you eat when you are ill or tired.',
      'hot soft comfort soupy light healthy cheap homemade filling root'),
    item('Mujadara', '\u{1F35A}', 'Lentils and rice under a heap of onions fried almost black.',
      'hot carby comfort filling cheap homemade soft healthy allium'),
    item('Ful medames', '\u{1FAD8}', 'Fava beans, olive oil, lemon, and bread to scoop with.',
      'hot soupy breakfast cheap filling healthy homemade soft allium'),
    item('Baba ganoush', '\u{1F346}', 'Smoked aubergine and tahini, with a pool of oil on top.',
      'soft light healthy shareable fresh homemade cheap allium'),
    item('Tabbouleh', '\u{1F957}', 'More parsley than grain, and all the better for it.',
      'fresh light healthy shareable homemade cheap crunchy allium'),
    item('Imam bayildi', '\u{1F346}', 'Aubergine split and stuffed with onion and tomato, cooked in oil until it gives up.',
      'hot soft comfort healthy homemade filling allium'),
    item('Batata harra', '\u{1F954}', 'Potatoes fried hard, then tossed with coriander, chilli and garlic.',
      'hot spicy crunchy fried shareable cheap root allium', 'handheld'),
    item('Warak enab', '\u{1F96C}', 'Vine leaves rolled around rice and herbs, eaten cold with lemon.',
      'light fresh shareable homemade handheld cheap healthy allium'),
    item('Yaki onigiri', '\u{1F359}', 'A rice triangle grilled until the outside crackles.',
      'hot handheld quick cheap carby soft crunchy'),
    item('Inari sushi', '\u{1F359}', 'Sweet fried tofu pockets packed with rice. Picnic food.',
      'sweet handheld light quick shareable cheap soft'),
    item('Vegetable gyoza', '\u{1F95F}', 'Crisp on the bottom, steamed on top, gone in four bites.',
      'hot crunchy fried shareable handheld homemade quick allium root'),
    item('Tofu larb', '\u{1F957}', 'Crumbled tofu, lime, chilli, herbs, and toasted rice powder.',
      'hot spicy fresh light healthy homemade quick allium'),
    item('Pad pak', '\u{1F957}', 'Whatever greens are in, hit hard in a very hot pan.',
      'hot quick healthy light homemade allium root', 'spicy'),
    item('Gallo pinto', '\u{1F35A}', 'Rice and black beans fried together. Breakfast, most days.',
      'hot carby comfort filling cheap breakfast homemade allium'),
    item('Patacones', '\u{1F34C}', 'Green plantain, smashed flat, fried twice, salted hard.',
      'hot crunchy fried shareable cheap handheld', 'spicy'),
    item('Frijoles negros', '\u{1FAD8}', 'Black beans cooked down slow with cumin and a bay leaf.',
      'hot soupy comfort filling cheap healthy homemade soft allium'),
    item('Tacos de nopales', '\u{1F32E}', 'Cactus paddles, griddled, with lime and far too much coriander.',
      'hot handheld fresh healthy shareable spicy homemade allium'),
    item('Shiro', '\u{1F963}', 'Ground chickpeas simmered to a thick, spiced purée.',
      'hot soupy comfort filling spicy cheap homemade soft allium quick'),
    item('Misir wot', '\u{1FAD8}', 'Red lentils and berbere. Properly, seriously hot.',
      'hot soupy spicy comfort filling cheap homemade soft allium root'),
    item('Gomen', '\u{1F96C}', 'Collard greens cooked long with ginger and garlic.',
      'hot healthy light homemade cheap soft allium root'),
    item('Chakalaka', '\u{1F345}', 'A hot, sharp relish of peppers and beans that goes with everything.',
      'hot spicy fresh shareable cheap homemade allium root'),
    item('Ribollita', '\u{1F35E}', 'Yesterday’s soup, thickened with yesterday’s bread.',
      'hot soupy comfort filling healthy cheap homemade bready soft allium root'),
    item('Panzanella', '\u{1F345}', 'Stale bread and tomatoes, and the bread is the point.',
      'fresh light healthy shareable bready homemade cheap allium'),
    item('Pasta e ceci', '\u{1F35D}', 'Pasta and chickpeas in their own starchy broth.',
      'hot soupy comfort carby filling cheap healthy homemade soft allium quick'),
    item('Caponata', '\u{1F346}', 'Sweet, sour, oily aubergine. Better the next day.',
      'soft shareable fresh healthy homemade allium'),
    item('Pisto', '\u{1F345}', 'Spanish summer vegetables cooked down until nothing is in a hurry.',
      'hot soft comfort healthy homemade cheap allium'),
    item('Polenta', '\u{1F963}', 'Stirred until it gives in. Soft, plain, endlessly forgiving.',
      'hot soft comfort carby cheap homemade filling'),
    item('Mango sticky rice', '\u{1F96D}', 'Warm coconut rice, cold mango, and a pinch of salt on top.',
      'sweet soft comfort indulgent fruity shareable homemade filling'),
    item('Halva', '\u{1F36C}', 'Sesame, crumbly and far too sweet. One slice is plenty.',
      'sweet soft indulgent shareable cheap quick'),
    item('Sorbet', '\u{1F367}', 'Fruit and sugar and nothing else. Sharper than ice cream.',
      'sweet fruity light quick shareable fresh'),
    item('Date and nut balls', '\u{1F36C}', 'Blitzed, rolled, and eaten before they reach the fridge.',
      'sweet quick handheld cheap homemade filling healthy'),
    item('Barley tea', '\u{1FAD6}', 'Roasted barley in hot water. No caffeine, no fuss.',
      'drink hot light cheap quick'),
    item('Horchata', '\u{1F964}', 'Rice, cinnamon and sugar, served far too cold.',
      'drink sweet fresh cheap quick light'),
    // ---- the fourth intake: breadth ----------------------------------------
    //
    // The third intake went to the profiles that had almost nothing. This one
    // goes to everybody: with 178 dishes a regular player starts seeing the
    // same answer inside a fortnight, and a decision engine that repeats
    // itself is one people stop believing. Meat, fish, sandwiches, soups and
    // puddings, which is where the catalogue was thinnest once the plant-based
    // batch had landed.
    item('Lamb chops', '\u{1F356}', 'Fat rendered crisp, pink in the middle, eaten with fingers.',
      'hot meat indulgent filling homemade messy allium', 'shareable'),
    item('Beef stew', '\u{1F372}', 'Three hours of doing almost nothing, and then dinner.',
      'hot meat soupy comfort filling homemade soft beef allium root'),
    item('Shepherd’s pie', '\u{1F958}', 'Mince under mash, forked rough so the ridges catch.',
      'hot meat comfort filling indulgent homemade soft dairy root allium cheap'),
    item('Meatballs', '\u{1F35D}', 'In tomato sauce, with bread for the bottom of the bowl.',
      'hot meat comfort filling shareable homemade soft beef dairy egg allium', 'carby'),
    item('Bulgogi', '\u{1F356}', 'Sweet marinated beef, grilled fast, eaten in lettuce.',
      'hot meat sweet shareable filling beef allium root', 'fresh'),
    item('Peking duck pancakes', '\u{1F95E}', 'You build each one yourself, which is half the fun.',
      'hot meat shareable handheld indulgent filling allium', 'homemade'),
    item('Goulash', '\u{1F372}', 'Paprika, beef, and a bowl you can stand a spoon in.',
      'hot meat soupy comfort filling beef allium root soft', 'spicy'),
    item('Chicken tikka masala', '\u{1F35B}', 'Invented in Britain, argued about everywhere.',
      'hot meat spicy comfort carby filling chicken dairy allium root', 'indulgent'),
    item('Sausage roll', '\u{1F950}', 'Flaky on top, hot in the middle, eaten out of a paper bag.',
      'hot meat handheld bready filling crunchy pork dairy egg indulgent cheap', 'quick'),
    item('Char siu', '\u{1F357}', 'Lacquered pork, red at the edges, over rice.',
      'hot meat sweet filling shareable pork allium carby alcohol'),
    item('Philly cheesesteak', '\u{1F96A}', 'Chopped beef, melted cheese, a roll giving up under it.',
      'hot meat cheesy bready handheld messy indulgent beef dairy allium filling cheap'),
    item('Fish tacos', '\u{1F32E}', 'Battered white fish, cabbage, lime, and a chipotle drizzle.',
      'hot seafood handheld fresh shareable messy fried crunchy allium egg', 'spicy'),
    item('Grilled salmon', '\u{1F41F}', 'Skin crisp, the middle barely set. Five minutes of attention.',
      'hot seafood healthy light filling homemade quick soft'),
    item('Prawn curry', '\u{1F35B}', 'Coconut, tamarind, and prawns in for the last three minutes only.',
      'hot seafood spicy soupy comfort filling shellfish allium root carby'),
    item('Moules marinière', '\u{1F958}', 'Wine, shallots, parsley, and bread for the liquor at the bottom.',
      'hot seafood shellfish shareable soupy alcohol allium dairy', 'bready'),
    item('Fish pie', '\u{1F958}', 'Three kinds of fish under mash, with a proper crust on top.',
      'hot seafood comfort filling indulgent dairy root allium soft homemade'),
    item('Crab cakes', '\u{1F99E}', 'More crab than binder, which is the whole argument.',
      'hot seafood shellfish crunchy fried handheld egg allium shareable'),
    item('Sardines on toast', '\u{1F41F}', 'Tinned, mashed, lemon over. Lunch in four minutes.',
      'hot seafood quick cheap bready healthy filling light'),
    item('Tuna melt', '\u{1F96A}', 'The toastie that divides households.',
      'hot seafood cheesy bready handheld comfort indulgent dairy egg quick filling'),
    item('Eggs benedict', '\u{1F373}', 'The yolk goes first, then the hollandaise. Order matters.',
      'hot egg indulgent breakfast bready dairy soft filling homemade meat pork'),
    item('Breakfast burrito', '\u{1F32F}', 'Everything at once, wrapped, eaten with one hand.',
      'hot handheld filling messy egg dairy allium root breakfast cheesy'),
    item('Porridge', '\u{1F963}', 'Salt, not sugar, and an argument about the water.',
      'hot soft comfort breakfast cheap healthy quick filling'),
    item('Granola', '\u{1F963}', 'Baked in clusters, and you pick the big ones out first.',
      'crunchy sweet breakfast healthy quick homemade'),
    item('Minestrone', '\u{1F372}', 'Whatever the week left behind, in broth, with pasta.',
      'hot soupy healthy comfort filling cheap homemade allium root carby light'),
    item('Tom yum', '\u{1F35C}', 'Sour, hot, and it clears your head in two spoonfuls.',
      'hot soupy spicy seafood fresh shellfish allium root light'),
    item('French onion soup', '\u{1F9C0}', 'An hour of onions, and then cheese on toast on top.',
      'hot soupy comfort cheesy bready indulgent dairy allium alcohol filling'),
    item('Banoffee pie', '\u{1F967}', 'Banana, toffee, cream, and no shame at all.',
      'sweet indulgent soft dairy fruity shareable filling homemade', 'chocolate'),
    item('Eton mess', '\u{1F368}', 'Meringue broken into cream and strawberries. Deliberately untidy.',
      'sweet soft fruity light shareable dairy egg quick fresh indulgent'),
    item('Panna cotta', '\u{1F36E}', 'It should wobble. If it does not, it has set too hard.',
      'sweet soft light dairy indulgent homemade meat'),
    item('Affogato', '\u{1F366}', 'Hot espresso onto cold ice cream. Pudding and coffee in one glass.',
      'sweet caffeine quick indulgent dairy hot'),
    item('Matcha latte', '\u{1F375}', 'Grassy, bitter, and better than it has any right to be.',
      'drink hot caffeine sweet dairy quick'),
    item('Masala chai', '\u{1F375}', 'Boiled, not steeped, with the milk in from the start.',
      'drink hot sweet dairy caffeine quick root comfort'),
    item('Hot toddy', '\u{1F375}', 'Whisky, lemon, honey. Medicinal, allegedly.',
      'drink hot sweet alcohol comfort quick'),
    item('Arancini', '\u{1F359}', 'Risotto’s second life, fried, with a molten middle.',
      'hot fried crunchy cheesy shareable handheld dairy egg carby filling indulgent', 'homemade'),
    item('Bibingka', '\u{1F36E}', 'Coconut rice cake, baked in banana leaf, eaten warm.',
      'sweet hot soft comfort shareable egg dairy homemade'),
    // ---- the fifth intake: the map ------------------------------------------
    //
    // CHOSEN BY WHERE THE CATALOGUE HAD NOTHING. Two hundred dishes sounds
    // broad until you list the kitchens: there was no Persian food at all, no
    // Georgian, no Nordic, no Sri Lankan, no Burmese, no Nepali, one Portuguese
    // pastry and one Austrian cutlet. Meanwhile there were four ways of saying
    // "wings" and two of saying "bolognese".
    //
    // So this intake is a map rather than a menu. Everything here is the first
    // of its kitchen in the catalogue, or close to it, which is also the
    // fastest way to stop a regular player seeing the same answers: a
    // catalogue deepens by being wider, not by adding a fifth burger.
    item('Ghormeh sabzi', '\u{1F372}', 'Herbs cooked down almost black, lamb, dried lime. Iran’s national dish and it tastes like nothing else.',
      'hot soupy comfort filling homemade meat allium root soft', 'healthy fruity'),
    item('Fesenjan', '\u{1F35B}', 'Walnuts and pomegranate, sour and sweet at once, over rice.',
      'hot comfort filling indulgent homemade meat chicken allium carby soft'),
    item('Tahdig', '\u{1F35A}', 'The crisp golden crust from the bottom of the rice pot. People fight over it.',
      'hot carby crunchy shareable comfort homemade dairy root filling'),
    item('Khachapuri', '\u{1F9C0}', 'A bread boat of molten cheese with an egg on top. You stir it in yourself.',
      'hot cheesy bready indulgent shareable filling dairy egg comfort messy', 'homemade'),
    item('Khinkali', '\u{1F95F}', 'Georgian soup dumplings. Hold the knot, bite, drink, and never use a fork.',
      'hot soft filling shareable homemade meat beef allium messy'),
    item('Smorrebrod', '\u{1F35E}', 'Open rye sandwiches, built tall and eaten with a knife and fork.',
      'bready light fresh shareable seafood dairy filling egg', 'healthy'),
    item('Swedish meatballs', '\u{1F35D}', 'Cream sauce, lingonberry, and mash underneath.',
      'hot meat comfort filling indulgent homemade beef dairy allium soft root egg shareable'),
    item('Gravlax', '\u{1F41F}', 'Salmon cured in dill and sugar for two days. No cooking involved.',
      'seafood light fresh healthy shareable homemade'),
    item('Rice and curry', '\u{1F35B}', 'Sri Lankan: five or six little curries round a mound of rice, all at once.',
      'hot spicy carby filling shareable homemade healthy allium root soupy'),
    item('Hoppers', '\u{1F373}', 'Bowl-shaped coconut pancakes, lacy at the edge, egg in the middle.',
      'hot soft breakfast homemade shareable egg crunchy'),
    item('Kottu roti', '\u{1F958}', 'Chopped flatbread and everything else, clattered together on a hot plate.',
      'hot spicy filling messy shareable carby meat chicken egg allium root'),
    item('Mohinga', '\u{1F35C}', 'Burma’s breakfast: fish broth, rice noodles, and a squeeze of lime.',
      'hot soupy seafood breakfast filling carby comfort allium root egg'),
    item('Tea leaf salad', '\u{1F957}', 'Fermented tea leaves, crunchy beans, tomato. Savoury, sour and awake.',
      'fresh crunchy light healthy shareable spicy allium caffeine seafood'),
    item('Momos', '\u{1F95F}', 'Steamed Himalayan dumplings, with a fiery tomato dip on the side.',
      'hot soft shareable handheld filling homemade meat allium root', 'spicy'),
    item('Dal bhat', '\u{1F35A}', 'Lentils, rice, a vegetable and a pickle. Eaten twice a day, and refilled.',
      'hot soupy carby filling healthy cheap homemade comfort allium root soft shareable', 'spicy'),
    item('Bigos', '\u{1F372}', 'Hunter’s stew: sauerkraut, sausage, and better every time it is reheated.',
      'hot soupy comfort filling meat pork beef allium root soft homemade cheap'),
    item('Svíčková', '\u{1F958}', 'Beef in a root vegetable cream sauce, with bread dumplings and a spoon of jam.',
      'hot meat comfort filling indulgent beef dairy root allium soft homemade', 'sweet'),
    item('Goetta', '\u{1F373}', 'Pork and steel-cut oats, sliced and fried until the edges go dark.',
      'hot meat breakfast filling crunchy cheap pork allium fried'),
    item('Bratwurst', '\u{1F32D}', 'Grilled, in a roll, with mustard and nothing else needed.',
      'hot meat handheld quick shareable filling pork bready messy'),
    item('Spaetzle', '\u{1F35D}', 'Scraped straight into the water, then fried in butter. Cheese optional and usual.',
      'hot soft comfort carby filling homemade egg dairy', 'cheesy'),
    item('Bacalhau à brás', '\u{1F373}', 'Salt cod, straw potatoes and egg, folded together off the heat.',
      'hot seafood comfort filling homemade egg allium root soft'),
    item('Caldo verde', '\u{1F372}', 'Potato broth, shredded kale, a coin of sausage.',
      'hot soupy comfort filling cheap healthy homemade meat pork allium root quick'),
    item('Piri piri chicken', '\u{1F357}', 'Spatchcocked, charred, and basted with more chilli than is sensible.',
      'hot meat spicy shareable filling messy chicken allium homemade'),
    item('Xiao long bao', '\u{1F95F}', 'Soup inside a dumpling. Bite a hole first or you will regret it.',
      'hot soft shareable handheld filling meat pork allium soupy alcohol'),
    item('Dan dan noodles', '\u{1F35C}', 'Sichuan pepper, chilli oil, pork, and a puddle of sauce at the bottom to stir up.',
      'hot spicy carby filling comfort meat pork allium messy quick'),
    item('Cong you bing', '\u{1F95E}', 'Spring onion pancakes, layered, flaky, best straight from the pan.',
      'hot crunchy handheld cheap shareable allium fried quick'),
    item('Hot pot', '\u{1F372}', 'A boiling pot in the middle and two hours of cooking your own dinner.',
      'hot soupy shareable spicy filling meat seafood allium root homemade'),
    item('Banh xeo', '\u{1F373}', 'A turmeric crepe, shatteringly crisp, wrapped in lettuce with herbs.',
      'hot crunchy fried fresh shareable handheld seafood shellfish root allium meat pork'),
    item('Bun cha', '\u{1F35C}', 'Grilled pork patties in a bowl of dipping broth, with cold noodles and a fistful of herbs.',
      'hot meat fresh filling carby pork allium soupy seafood'),
    item('Com tam', '\u{1F35A}', 'Broken rice, grilled pork chop, a fried egg over the top.',
      'hot meat carby filling comfort pork egg allium cheap seafood'),
    item('Khao man gai', '\u{1F357}', 'Poached chicken and rice cooked in its stock, with a ginger sauce that makes it.',
      'hot meat carby light comfort filling chicken allium root soft'),
    item('Som tam', '\u{1F957}', 'Green papaya pounded with lime, chilli and dried shrimp. Loud in every direction.',
      'fresh crunchy spicy light healthy shareable seafood shellfish allium'),
    item('Massaman curry', '\u{1F35B}', 'Gentle, nutty, cinnamon-warm. The curry for people who say they do not like curry.',
      'hot comfort filling carby meat allium root soft indulgent seafood', 'spicy'),
    item('Nasi campur', '\u{1F35A}', 'A little of everything on one plate, and no two plates the same.',
      'hot carby filling shareable spicy meat egg allium root seafood'),
    item('Roti canai', '\u{1F95E}', 'Flipped, slapped, layered and torn, with dhal to dip.',
      'hot bready crunchy handheld cheap shareable breakfast dairy', 'homemade'),
    item('Ackee and saltfish', '\u{1F373}', 'Jamaica’s national breakfast. Looks like scrambled egg, tastes like the sea.',
      'hot seafood breakfast filling homemade allium root spicy'),
    item('Doubles', '\u{1F959}', 'Trinidad street food: curried chickpeas between two soft fried breads.',
      'hot handheld cheap spicy messy filling bready fried allium root'),
    item('Pepperpot', '\u{1F372}', 'Cassareep-dark and clove-scented, cooked long and eaten longer.',
      'hot meat soupy comfort filling beef allium root soft homemade spicy', 'sweet'),
    item('Egusi soup', '\u{1F372}', 'Ground melon seed, greens and palm oil, thick enough to eat with your hands.',
      'hot soupy comfort filling spicy meat seafood allium homemade'),
    item('Fufu', '\u{1F35A}', 'Pounded and stretchy, torn with the fingers, dipped in soup. Do not chew it.',
      'soft filling comfort cheap carby homemade root'),
    item('Suya', '\u{1F356}', 'Skewers rolled in ground peanut and chilli, grilled over open coals.',
      'hot meat spicy handheld shareable messy beef allium crunchy'),
    item('Bunny chow', '\u{1F35E}', 'Curry served in a hollowed-out half loaf. The bread is the bowl.',
      'hot spicy filling messy bready handheld meat allium root comfort'),
    item('Bobotie', '\u{1F958}', 'Curried mince under a set custard, with bay leaves standing up in it.',
      'hot meat comfort filling homemade beef egg dairy allium root soft'),
    item('Milanesa', '\u{1F356}', 'Beaten thin, crumbed, fried, and covering the whole plate.',
      'hot meat fried crunchy filling comfort beef egg cheap dairy', 'shareable'),
    item('Choripan', '\u{1F32D}', 'Chorizo split down the middle in a roll, with chimichurri all over it.',
      'hot meat handheld messy shareable quick pork bready allium spicy'),
    item('Aji de gallina', '\u{1F35B}', 'Shredded chicken in a creamy yellow chilli sauce, over rice and potato.',
      'hot comfort filling spicy meat chicken dairy allium root carby soft egg'),
    item('Pastel de choclo', '\u{1F33D}', 'Sweetcorn baked over a savoury filling, sugar scattered on top.',
      'hot comfort filling sweet homemade meat beef egg allium soft dairy'),
    item('Tamales', '\u{1F33D}', 'Steamed in their own leaves, unwrapped at the table.',
      'hot soft filling shareable homemade meat pork allium root comfort', 'spicy'),
    item('Mole poblano', '\u{1F35B}', 'Thirty ingredients, chocolate among them, and a whole afternoon.',
      'hot spicy comfort filling indulgent meat chicken chocolate allium root soft homemade'),
    item('Chiles en nogada', '\u{1F336}', 'Stuffed poblanos under a walnut cream, with pomegranate over the top.',
      'hot comfort filling indulgent homemade meat dairy egg allium fruity'),
    item('Cachapa', '\u{1F33D}', 'A sweet corn pancake folded around soft white cheese.',
      'hot sweet soft handheld cheesy dairy filling homemade shareable'),
    item('Skyr with berries', '\u{1F963}', 'Thick, sour, and gone in six spoonfuls.',
      'sweet light healthy quick breakfast dairy fresh fruity'),
    item('Kanelbullar', '\u{1F36E}', 'Cardamom as much as cinnamon, and pearl sugar on top.',
      'sweet soft indulgent bready homemade dairy egg comfort'),
    item('Basbousa', '\u{1F36E}', 'Semolina cake soaked in syrup while it is still hot.',
      'sweet soft indulgent shareable homemade dairy filling', 'crunchy'),
    item('Halo-halo', '\u{1F368}', 'Shaved ice, a dozen things underneath, and you stir it all to a mess on purpose.',
      'sweet fruity shareable indulgent dairy messy'),
    item('Salep', '\u{1F375}', 'Thick, hot, orchid-root sweet, with cinnamon over it.',
      'drink hot sweet comfort dairy quick root indulgent'),
    item('Ayran', '\u{1F964}', 'Salted yoghurt, whisked and cold. Strange once, then necessary.',
      'drink light fresh quick cheap dairy healthy'),
    // ---- the sixth intake: the big kitchens --------------------------------
    //
    // The fifth intake went to countries with nothing at all. This one goes to
    // the four or five kitchens most people in Britain and America actually
    // cook from, which were oddly thin: nine Italian dishes, three French, one
    // Spanish omelette short of any Spain at all, and a British section that
    // was a fried breakfast and some chips.
    //
    // These are the dishes somebody names when you ask what they had for
    // dinner, which is exactly the well a decision engine draws from most
    // often and the first place repetition shows.
    item('Coq au vin', '\u{1F357}', 'Chicken braised in red wine with bacon and small onions. Better the next day.',
      'hot meat comfort filling indulgent homemade chicken pork alcohol dairy allium root soft soupy'),
    item('Ratatouille', '\u{1F346}', 'Summer vegetables cooked separately, then together. Patience is the recipe.',
      'hot soft healthy comfort homemade allium light', 'filling'),
    item('Quiche lorraine', '\u{1F967}', 'Custard, bacon and pastry. Best eaten barely warm, never hot.',
      'hot soft filling comfort bready egg dairy meat pork homemade', 'shareable'),
    item('Steak frites', '\u{1F969}', 'One steak, a mountain of chips, and a sauce that is mostly butter.',
      'hot meat indulgent filling beef dairy fried crunchy root', 'quick'),
    item('Bouillabaisse', '\u{1F372}', 'Marseille fish stew, saffron-gold, with rouille and bread on the side.',
      'hot soupy seafood shellfish filling indulgent homemade alcohol allium root bready'),
    item('Crème brûlée', '\u{1F36E}', 'You crack the top with a spoon. That is the entire point.',
      'sweet soft indulgent dairy egg homemade light'),
    item('Tarte tatin', '\u{1F34E}', 'Upside down, caramelised, and turned out with your fingers crossed.',
      'sweet hot soft indulgent fruity dairy shareable homemade'),
    item('Croissant', '\u{1F950}', 'Shatters everywhere. Eat it over a plate or do not eat it at all.',
      'sweet crunchy bready breakfast indulgent dairy handheld quick egg'),
    item('Gratin dauphinois', '\u{1F958}', 'Potatoes, cream, garlic, an hour. No cheese, whatever anyone tells you.',
      'hot soft comfort indulgent filling dairy root allium homemade'),
    item('Cacio e pepe', '\u{1F35D}', 'Cheese, pepper, pasta water. Three things and every one of them can go wrong.',
      'hot carby cheesy comfort quick dairy filling indulgent homemade'),
    item('Amatriciana', '\u{1F35D}', 'Guanciale, tomato, pecorino. Rome in a bowl and no garlic in sight.',
      'hot carby comfort filling meat pork dairy cheesy spicy quick'),
    item('Osso buco', '\u{1F356}', 'Shin on the bone, braised soft, with lemon and parsley thrown over at the end.',
      'hot meat comfort filling indulgent beef alcohol allium root soft homemade', 'carby'),
    item('Aubergine parmigiana', '\u{1F346}', 'Layered, baked, and better after an hour on the side.',
      'hot cheesy comfort filling indulgent dairy allium soft homemade shareable'),
    item('Gnocchi', '\u{1F958}', 'Light if you are lucky, and bullets if you overwork them.',
      'hot soft comfort carby filling root egg dairy homemade'),
    item('Focaccia', '\u{1F35E}', 'Dimpled, oily, salty. Half of it goes before it reaches the table.',
      'bready soft shareable homemade cheap filling', 'hot'),
    item('Tortilla española', '\u{1F373}', 'Potato and egg, and an argument about whether onion belongs in it.',
      'hot soft filling comfort egg root allium homemade shareable cheap'),
    item('Patatas bravas', '\u{1F954}', 'Fried potatoes under a smoky, slightly frightening sauce.',
      'hot crunchy fried spicy shareable cheap root allium'),
    item('Croquetas', '\u{1F9C0}', 'Crisp outside, molten inside, and they burn your mouth every time.',
      'hot fried crunchy shareable handheld indulgent dairy egg meat pork cheap'),
    item('Toad in the hole', '\u{1F32D}', 'Sausages in a batter that has to rise. Do not open the oven.',
      'hot meat comfort filling indulgent pork egg dairy homemade soft bready'),
    item('Bangers and mash', '\u{1F32D}', 'Sausages, mash, and gravy poured into a crater you make yourself.',
      'hot meat comfort filling pork dairy root allium soft cheap'),
    item('Scones with jam and cream', '\u{1F9C1}', 'Jam first or cream first, and people have stopped speaking over it.',
      'sweet soft shareable dairy egg bready homemade fruity indulgent'),
    item('Trifle', '\u{1F368}', 'Layers in a glass bowl, made the day before, eaten with a serving spoon.',
      'sweet soft indulgent shareable dairy egg fruity alcohol homemade', 'messy'),
    item('Cornish pasty', '\u{1F95F}', 'Crimped down one side, eaten in the hand, invented to be carried.',
      'hot meat handheld filling bready beef root allium dairy egg comfort'),
    item('BBQ ribs', '\u{1F356}', 'Low, slow, sticky, and a stack of napkins you will need all of.',
      'hot meat indulgent messy shareable filling pork spicy sweet'),
    item('Gumbo', '\u{1F372}', 'It starts with a roux and you do not stop stirring for forty minutes.',
      'hot soupy comfort filling spicy meat pork seafood shellfish allium carby homemade'),
    item('Jambalaya', '\u{1F35A}', 'Everything in one pot and the rice cooks in it.',
      'hot carby filling spicy comfort meat pork chicken seafood shellfish allium homemade'),
    item('Clam chowder', '\u{1F372}', 'Thick, white, and there should be a cracker on top.',
      'hot soupy seafood shellfish comfort filling indulgent dairy meat pork root allium'),
    item('Reuben', '\u{1F96A}', 'Salt beef, sauerkraut, melted swiss, griddled in butter until it groans.',
      'hot meat cheesy bready handheld indulgent messy beef dairy egg filling'),
    item('Biscuits and gravy', '\u{1F35E}', 'Soft scones under a peppery white sausage gravy. Not a biscuit in the British sense.',
      'hot soft comfort filling indulgent breakfast dairy meat pork bready homemade'),
    item('Udon', '\u{1F35C}', 'Fat, chewy noodles in a clear broth. Slippery and quietly perfect.',
      'hot soupy carby comfort soft filling seafood allium quick'),
    item('Tempura', '\u{1F364}', 'Batter so thin it barely exists, fried so fast it stays pale.',
      'hot fried crunchy light shareable seafood shellfish egg', 'quick'),
    item('Yakitori', '\u{1F357}', 'Skewers over coals, brushed with tare until they shine.',
      'hot meat handheld shareable chicken allium quick', 'sweet'),
    item('Takoyaki', '\u{1F419}', 'Molten balls of batter with octopus inside, and flakes that move on top.',
      'hot soft shareable handheld messy seafood egg dairy allium', 'crunchy'),
    item('Gyudon', '\u{1F35A}', 'Thin beef and onion simmered sweet, over rice, in fifteen minutes.',
      'hot meat carby comfort filling quick beef allium soft cheap egg'),
    item('Mochi', '\u{1F361}', 'Chewy, cold, and gone in two bites. The texture is the whole thing.',
      'sweet soft handheld shareable quick'),
    item('Kung pao chicken', '\u{1F357}', 'Numbing, sweet-sour, with peanuts and a lot of dried chilli you leave behind.',
      'hot meat spicy quick carby filling chicken allium crunchy'),
    item('Sweet and sour pork', '\u{1F35B}', 'Properly made it is sharp, not orange. The pineapple is not optional.',
      'hot meat fried crunchy filling pork egg fruity allium carby', 'sweet'),
    item('Wonton soup', '\u{1F372}', 'Silky parcels in a clear broth, and the broth matters more than the parcels.',
      'hot soupy light comfort meat pork seafood shellfish egg allium soft'),
    item('Kimchi jjigae', '\u{1F372}', 'Old kimchi is better than new for this. Sour, red, and very hot.',
      'hot soupy spicy comfort filling meat pork seafood allium soft cheap'),
    item('Haemul pajeon', '\u{1F373}', 'A seafood and spring onion pancake, crisp at the edge, torn and shared.',
      'hot fried crunchy shareable seafood shellfish egg allium filling'),
    item('Naengmyeon', '\u{1F35C}', 'Chewy buckwheat noodles in icy broth. Strange in winter, essential in August.',
      'soupy carby light fresh meat beef egg allium root'),
    item('Rogan josh', '\u{1F35B}', 'Kashmiri chilli for colour, not heat, and lamb that falls apart.',
      'hot meat spicy comfort filling dairy allium root soft homemade carby'),
    item('Samosa', '\u{1F95F}', 'Crisp triangle, spiced potato, eaten standing over the bag.',
      'hot fried crunchy handheld spicy cheap shareable root allium filling'),
    item('Palak paneer', '\u{1F96C}', 'Spinach cooked down green and cubes of cheese that squeak.',
      'hot comfort healthy filling dairy cheesy allium root soft carby'),
    item('Sambar', '\u{1F963}', 'Tamarind-sour lentil stew with whatever vegetables were about.',
      'hot soupy healthy comfort cheap filling allium root soft homemade spicy'),
    item('Gulab jamun', '\u{1F36E}', 'Fried milk dough soaked in rose syrup. Two is plenty and you will have four.',
      'sweet soft indulgent shareable dairy fried homemade'),
    item('Jalebi', '\u{1F36C}', 'Piped in spirals, fried, then dunked in syrup while still hissing.',
      'sweet crunchy indulgent shareable fried handheld cheap'),
    item('Kofta', '\u{1F356}', 'Spiced mince round a skewer, grilled until the edges blacken.',
      'hot meat spicy handheld shareable filling allium homemade', 'messy'),
    item('Maqluba', '\u{1F35A}', 'Upside down: cooked in a pot, flipped onto a plate, and everyone waits to see if it holds.',
      'hot meat carby filling comfort shareable chicken allium root soft homemade'),
    item('Menemen', '\u{1F373}', 'Eggs barely set in tomato and green pepper, eaten straight from the pan.',
      'hot soft breakfast quick comfort egg allium cheap homemade'),
    item('Borek', '\u{1F9C0}', 'Coiled filo, cheese inside, shattering on the way to your mouth.',
      'hot crunchy bready shareable handheld cheesy dairy egg filling'),
    item('Spanakopita', '\u{1F96C}', 'Spinach and feta between filo sheets brushed with far too much oil.',
      'hot crunchy bready shareable filling cheesy dairy egg homemade'),
    item('Borscht', '\u{1F372}', 'Deep red, sweet and sour at once, with a white swirl on top.',
      'hot soupy comfort filling healthy dairy meat beef allium root soft homemade cheap'),
    item('Beef stroganoff', '\u{1F35D}', 'Strips of beef, mushrooms, soured cream, and it is done in twenty minutes.',
      'hot meat comfort filling indulgent quick beef dairy allium carby soft'),
    item('Pozole', '\u{1F372}', 'Hominy and pork in a red broth, with a plate of raw things to pile on top.',
      'hot soupy comfort filling spicy meat pork allium shareable homemade'),
    item('Enchiladas', '\u{1F32E}', 'Rolled, sauced, baked under cheese until the edges catch.',
      'hot comfort filling spicy cheesy meat chicken dairy allium shareable', 'bready'),
    item('Tres leches cake', '\u{1F370}', 'Soaked in three milks until it barely holds together.',
      'sweet soft indulgent shareable dairy egg homemade filling', 'messy'),

    /* ---- the seventh intake: east and central Asia -------------------
     *
     * The map had China as one country with eight dishes on it, Japan as a
     * sushi counter, and nothing at all between Iran and Xinjiang. These are
     * the regional kitchens that were standing in for each other: Shanghai
     * and Sichuan and Shaanxi are not one cuisine, and a catalogue that
     * treats them as one has a hole in it the size of a continent.
     */
    item('Zhajiangmian', '\u{1F35C}', 'Wheat noodles under a dark salty pork sauce, with raw cucumber on top to cut it.',
      'hot meat pork carby filling comfort soft allium homemade cheap'),
    item('Taiwanese beef noodle soup', '\u{1F35C}', 'Shin braised for hours in soy and spices, over noodles, with pickled greens.',
      'hot soupy meat beef carby filling comfort spicy allium root soft homemade'),
    item('Lu rou fan', '\u{1F35A}', 'Minced braised pork belly spooned over rice. Nothing else, and nothing else needed.',
      'hot meat pork carby filling comfort cheap soft allium'),
    item('Sheng jian bao', '\u{1F95F}', 'Steamed on top, fried crisp underneath, full of soup that will burn you.',
      'hot meat pork bready handheld shareable soft crunchy allium'),
    item('Siu mai', '\u{1F95F}', 'Open-topped parcels of pork and prawn, steamed in the basket they arrive in.',
      'hot meat pork seafood shellfish shareable handheld soft'),
    item('Cheung fun', '\u{1F365}', 'Sheets of rice noodle rolled loose and flooded with sweet soy.',
      'hot soft carby shareable light quick cheap'),
    item('Lion’s head meatballs', '\u{1F372}', 'Meatballs the size of a fist, braised until they barely hold, sat in cabbage.',
      'hot meat pork soupy filling comfort soft allium root homemade shareable'),
    item('Twice-cooked pork', '\u{1F958}', 'Boiled, sliced, then fried again with bean paste until the edges curl.',
      'hot meat pork spicy filling allium indulgent'),
    item('Big plate chicken', '\u{1F357}', 'Chicken and potato in a wide red pan, with hand-pulled noodles dropped in at the end.',
      'hot meat chicken spicy filling carby shareable allium root comfort messy'),
    item('Liangpi', '\u{1F35C}', 'Cold slippery noodles in vinegar and chilli oil, eaten on the hottest day of the year.',
      'spicy carby light fresh allium cheap soft quick'),
    item('Jianbing', '\u{1F32F}', 'A crepe cooked on a griddle, egg cracked onto it, a crisp sheet folded inside.',
      'hot breakfast handheld crunchy egg quick cheap messy allium spicy'),
    item('Roujiamo', '\u{1F959}', 'Chopped braised pork stuffed into a flatbread. Older than the sandwich by a very long way.',
      'hot meat pork bready handheld filling cheap messy'),
    item('Hot and sour soup', '\u{1F372}', 'Thick with black vinegar and white pepper, egg drawn through it in ribbons.',
      'hot soupy spicy light quick egg allium comfort cheap'),
    item('Youtiao and soy milk', '\u{1F956}', 'A long fried stick of dough, torn and dunked into warm soy milk.',
      'breakfast fried crunchy bready cheap soft quick shareable'),
    item('Oyster omelette', '\u{1F373}', 'Egg and sweet potato starch gone gloriously gluey, with small oysters through it.',
      'hot egg seafood shellfish soft messy quick allium cheap'),

    /* ---- Japan, past the sushi counter ------------------------------- */
    item('Tonkatsu', '\u{1F356}', 'Pork in panko, fried, sliced, and eaten with a mountain of shredded cabbage.',
      'hot meat pork fried crunchy filling indulgent egg bready'),
    item('Zaru soba', '\u{1F35C}', 'Cold buckwheat noodles on a bamboo mat, dipped a few at a time.',
      'light fresh quick healthy carby soft seafood allium cheap'),
    item('Omurice', '\u{1F373}', 'Ketchup fried rice wrapped in a thin omelette, split open at the table.',
      'hot egg comfort soft carby filling chicken meat quick allium', 'sweet'),
    item('Sukiyaki', '\u{1F372}', 'Thin beef cooked at the table in sweet soy, then dipped in raw egg.',
      'hot meat beef soupy shareable filling indulgent egg allium soft'),
    item('Chawanmushi', '\u{1F36E}', 'Savoury custard so soft it is eaten with a spoon, with things hidden in it.',
      'hot soft light egg seafood quick healthy'),
    item('Karaage', '\u{1F357}', 'Marinated chicken in potato starch, fried twice, lemon squeezed over.',
      'hot meat chicken fried crunchy handheld shareable indulgent allium root'),
    item('Oyakodon', '\u{1F35A}', 'Chicken and egg simmered together over rice — parent and child, says the name.',
      'hot meat chicken egg carby filling comfort quick soft allium'),
    item('Taiyaki', '\u{1F41F}', 'A fish-shaped waffle with sweet bean paste in the middle, eaten walking.',
      'sweet hot soft handheld shareable homemade egg dairy cheap'),
    item('Dorayaki', '\u{1F95E}', 'Two small pancakes with red bean between them, sealed at the edges.',
      'sweet soft handheld egg cheap shareable'),

    /* ---- Korea, past the barbecue ------------------------------------ */
    item('Samgyetang', '\u{1F372}', 'A whole small chicken stuffed with rice and ginseng, in a broth that has gone milky.',
      'hot soupy meat chicken comfort filling healthy carby soft allium root homemade'),
    item('Sundubu jjigae', '\u{1F372}', 'Silken tofu broken into a red bubbling broth with an egg cracked in at the end.',
      'hot soupy spicy comfort filling soft egg allium seafood quick'),
    item('Jajangmyeon', '\u{1F35C}', 'Noodles under black bean sauce, pork and onion cooked down until sweet.',
      'hot carby filling comfort meat pork soft allium root cheap messy'),
    item('Kimbap', '\u{1F359}', 'Rolled, sliced, packed for somewhere else. Not sushi, and nobody there thinks it is.',
      'light handheld shareable fresh carby egg allium root quick'),
    item('Galbi', '\u{1F356}', 'Short ribs marinated in pear and soy, grilled over fire at the table.',
      'hot meat beef shareable indulgent filling allium messy fruity'),
    item('Dakgalbi', '\u{1F373}', 'Chicken and cabbage stir-fried in gochujang on a hot plate, cheese melted over the top.',
      'hot meat chicken spicy shareable filling cheesy dairy allium root comfort'),
    item('Budae jjigae', '\u{1F372}', 'Army stew: kimchi, spam, sausage, instant noodles and cheese, and it is genuinely excellent.',
      'hot soupy spicy meat pork filling comfort shareable cheesy dairy allium carby'),
    item('Bingsu', '\u{1F367}', 'Shaved milk ice under fruit and condensed milk, eaten by four people with four spoons.',
      'sweet light shareable dairy fruity soft'),

    /* ---- the middle of the map: Central Asia and Afghanistan ---------
     *
     * Between Iran and Xinjiang there was nothing at all, which is a gap of
     * four thousand miles and several of the great noodle and rice kitchens.
     */
    item('Manti', '\u{1F95F}', 'Tiny dumplings under garlic yoghurt and melted butter with chilli in it.',
      'hot meat filling shareable soft dairy allium homemade'),
    item('Lagman', '\u{1F35C}', 'Hand-pulled noodles in a pepper and lamb broth, somewhere between a soup and a stir fry.',
      'hot soupy meat carby filling allium root spicy soft homemade'),
    item('Kabuli pulao', '\u{1F35A}', 'Rice layered with lamb, carrot and raisins, the top gone deep gold.',
      'hot meat carby filling shareable fruity root allium soft comfort'),
    item('Ashak', '\u{1F95F}', 'Leek dumplings under yoghurt and a spoonful of spiced mince. The order matters.',
      'hot meat filling dairy allium spicy soft shareable homemade'),
    item('Beshbarmak', '\u{1F372}', 'Five fingers: boiled meat and wide sheets of pasta, eaten with your hands.',
      'hot meat carby filling shareable soft allium comfort messy handheld'),
    item('Shashlik', '\u{1F362}', 'Cubed lamb off a skewer, cooked over coals, with raw onion and flatbread.',
      'hot meat handheld shareable filling messy allium homemade'),
    item('Qurutob', '\u{1F963}', 'Torn flatbread soaked in salty dried yoghurt, with onion and herbs piled over it.',
      'soft dairy bready shareable allium filling homemade cheap'),
    item('Shurpa', '\u{1F372}', 'A clear lamb and vegetable soup, thin on purpose, with a lot of dill.',
      'hot soupy meat filling comfort healthy root allium soft homemade'),

    /* ---- the eighth intake: the Atlantic side --------------------------
     *
     * South America had six dishes and Africa had nine, between them covering
     * two continents and about a hundred kitchens. The Caribbean had four.
     * These are the ones people actually eat, rather than the ones that turn
     * up on a list of national dishes.
     */
    item('Lomo saltado', '\u{1F373}', 'Beef and chips stir-fried together in soy and vinegar, which should not work and does.',
      'hot meat beef filling carby indulgent allium quick messy fried'),
    item('Papa a la huancaína', '\u{1F958}', 'Cold boiled potato under a warm yellow cheese sauce with chilli in it.',
      'cheesy dairy root soft light shareable spicy quick egg'),
    item('Causa', '\u{1F35B}', 'Chilled mashed potato pressed in layers around a filling, cut like a cake.',
      'light fresh root soft shareable egg healthy'),
    item('Anticuchos', '\u{1F362}', 'Beef heart on skewers, marinated in vinegar and chilli, charred over coals.',
      'hot meat beef handheld shareable spicy messy allium'),
    item('Arroz chaufa', '\u{1F35A}', 'Peruvian Chinese fried rice, with soy and ginger and whatever was in the fridge.',
      'hot carby filling quick egg chicken meat allium cheap comfort'),
    item('Asado', '\u{1F356}', 'Meat over wood for several hours, and no hurry about any of it.',
      'hot meat beef shareable filling indulgent messy'),
    item('Provoleta', '\u{1F9C0}', 'A disc of provolone grilled until it crusts on both sides and runs in the middle.',
      'hot cheesy dairy shareable indulgent quick soft'),
    item('Locro', '\u{1F372}', 'A thick winter stew of corn, squash and whatever pork is around.',
      'hot soupy meat pork filling comfort carby root homemade allium'),
    item('Chivito', '\u{1F354}', 'Uruguay’s sandwich: steak, ham, cheese, egg, and a decision to be made about the size of your mouth.',
      'hot meat beef pork cheesy dairy egg handheld filling indulgent messy bready', 'shareable fried'),
    item('Pão de queijo', '\u{1F9C0}', 'Cheese bread that is hollow inside and chewy in a way nothing else is.',
      'hot cheesy dairy bready handheld shareable egg quick soft'),
    item('Moqueca', '\u{1F372}', 'Fish stewed in coconut milk, palm oil and peppers, in a clay pot.',
      'hot soupy seafood filling comfort healthy allium spicy soft'),
    item('Coxinha', '\u{1F357}', 'A teardrop of dough around shredded chicken, breaded and fried.',
      'hot meat chicken fried crunchy handheld shareable indulgent dairy egg bready', 'cheesy'),
    item('Açaí bowl', '\u{1F963}', 'Frozen purple sludge, sweeter than it looks, under granola and banana.',
      'sweet fruity light fresh healthy quick breakfast soft', 'crunchy'),
    item('Brigadeiro', '\u{1F36B}', 'Condensed milk cooked with cocoa until it rolls, then rolled in sprinkles.',
      'sweet chocolate dairy handheld shareable soft indulgent cheap homemade'),
    item('Ajiaco', '\u{1F372}', 'Three kinds of potato and an herb nothing else tastes like, with chicken and capers.',
      'hot soupy meat chicken comfort filling root dairy allium homemade'),
    item('Bandeja paisa', '\u{1F37D}', 'A tray with beans, rice, pork, egg, plantain and an avocado, and no gaps.',
      'hot meat pork filling carby indulgent egg shareable comfort fried'),
    item('Sancocho', '\u{1F372}', 'A big bone-in soup of whatever roots the ground gave up, cooked long.',
      'hot soupy meat chicken filling comfort root healthy allium homemade'),
    item('Pabellón criollo', '\u{1F35A}', 'Shredded beef, black beans, rice and fried plantain, in four stripes.',
      'hot meat beef carby filling comfort shareable fruity allium fried'),
    item('Tequeños', '\u{1F9C0}', 'Sticks of white cheese wrapped in dough and fried until the cheese gives up.',
      'hot cheesy dairy fried crunchy handheld shareable indulgent'),
    item('Salteñas', '\u{1F958}', 'Baked pastries that hold soup inside them, which is a trick and a hazard.',
      'hot meat chicken filling handheld shareable soupy messy root allium dairy egg'),
    item('Flan', '\u{1F36E}', 'Baked custard turned out under its own caramel, wobbling.',
      'sweet soft dairy egg indulgent shareable homemade'),
    item('Alfajores', '\u{1F36A}', 'Two crumbling biscuits with caramel between them, rolled in coconut at the edge.',
      'sweet soft handheld shareable dairy egg indulgent'),

    /* ---- the Caribbean ------------------------------------------------ */
    item('Oxtail stew', '\u{1F372}', 'Cooked until the meat gives up entirely, with butter beans in the gravy.',
      'hot meat beef filling comfort soupy indulgent allium root homemade'),
    item('Curry goat', '\u{1F35B}', 'Goat bone-in in a yellow curry that gets better the next day.',
      'hot meat spicy filling comfort soupy allium root homemade'),
    item('Rice and peas', '\u{1F35A}', 'Rice cooked in coconut milk with kidney beans and a whole scotch bonnet lifted out at the end.',
      'hot carby filling comfort cheap allium soft homemade healthy shareable'),
    item('Callaloo', '\u{1F96C}', 'Greens cooked down soft with coconut milk, thyme and a lot of pepper.',
      'hot healthy comfort soft allium light homemade', 'spicy'),
    item('Escovitch fish', '\u{1F41F}', 'Fried whole fish under a hot vinegar dressing with carrot and peppers in it.',
      'hot seafood fried crunchy spicy filling fresh allium root'),
    item('Griot', '\u{1F356}', 'Pork marinated in citrus, braised, then fried until the outside shatters.',
      'hot meat pork fried crunchy filling indulgent handheld allium fruity'),
    item('Mofongo', '\u{1F963}', 'Green plantain mashed with garlic and crackling in a wooden mortar.',
      'hot filling carby comfort allium indulgent meat pork soft shareable'),
    item('Arroz con gandules', '\u{1F35A}', 'Rice with pigeon peas and sofrito, and a crust at the bottom worth fighting over.',
      'hot carby filling comfort shareable allium meat pork cheap'),
    item('Ropa vieja', '\u{1F372}', 'Old clothes: beef shredded into rags in a pepper and tomato sauce.',
      'hot meat beef filling comfort soft allium shareable homemade'),

    /* ---- Africa, past the seven dishes it had -------------------------- */
    item('Thieboudienne', '\u{1F35B}', 'Senegal’s big one: fish and rice cooked in tomato, with the vegetables laid on top.',
      'hot seafood carby filling shareable comfort root allium spicy homemade'),
    item('Yassa', '\u{1F357}', 'Chicken buried under onions slow-cooked in lemon and mustard until sweet.',
      'hot meat chicken filling comfort allium fruity homemade carby'),
    item('Maafe', '\u{1F372}', 'Groundnut stew: peanut butter, tomato and meat, thick enough to stand a spoon in.',
      'hot soupy meat filling comfort indulgent root allium homemade cheap', 'spicy'),
    item('Waakye', '\u{1F35A}', 'Rice and beans cooked with sorghum leaves until the whole thing goes red-brown.',
      'hot carby filling cheap comfort shareable healthy homemade', 'spicy'),
    item('Kelewele', '\u{1F34C}', 'Ripe plantain cubed, spiced with ginger and chilli, and fried.',
      'hot sweet fried spicy handheld shareable fruity quick cheap root'),
    item('Moi moi', '\u{1F36E}', 'Steamed bean pudding, soft all the way through, with pepper and onion in it.',
      'hot soft healthy filling allium homemade cheap egg'),
    item('Kitfo', '\u{1F969}', 'Minced raw beef warmed in spiced butter, eaten with injera and cheese.',
      'meat beef dairy spicy filling indulgent shareable'),
    item('Tibs', '\u{1F958}', 'Cubes of lamb fried hard with onion, rosemary and green chilli.',
      'hot meat spicy filling shareable allium quick indulgent dairy'),
    item('Nyama choma', '\u{1F356}', 'Goat over charcoal, salt only, cut up on a board with a pile of kachumbari.',
      'hot meat shareable filling messy handheld fresh'),
    item('Ugali and sukuma wiki', '\u{1F372}', 'A stiff maize block and a pan of greens, and it is most of East Africa’s dinner.',
      'hot carby filling cheap healthy comfort allium homemade soft quick'),
    item('Harira', '\u{1F372}', 'Lentil and chickpea soup thickened with flour, with a date on the side.',
      'hot soupy healthy filling comfort light allium root homemade'),
    item('Zaalouk', '\u{1F346}', 'Aubergine and tomato cooked down to a smoky paste, scooped with bread.',
      'healthy light fresh shareable allium homemade cheap', 'spicy'),
    item('Malva pudding', '\u{1F36E}', 'Apricot sponge drowned in hot cream the moment it comes out.',
      'sweet hot soft indulgent dairy egg comfort shareable homemade fruity'),

    /* ---- the ninth intake: the last of the gaps, and 450 ---------------
     *
     * What was left after the map was filled in: the European kitchens that
     * had one dish standing in for a country, the Indian regions that are not
     * Punjab, the Philippines and Malaysia, the Levant past the mezze, and a
     * pudding shelf that stopped at the Mediterranean.
     */
    item('Currywurst', '\u{1F32D}', 'Sliced sausage under curried ketchup, eaten with a small wooden fork standing up.',
      'hot meat pork spicy handheld messy cheap quick fried filling'),
    item('Rösti', '\u{1F954}', 'Grated potato pressed into a pan and fried until both sides are a single crust.',
      'hot root crunchy fried soft comfort dairy homemade cheap filling'),
    item('Fondue', '\u{1F9C0}', 'A pot of melted cheese and wine, and a rule about what happens if you drop your bread.',
      'hot cheesy dairy shareable indulgent filling alcohol soft allium bready'),
    item('Cassoulet', '\u{1F372}', 'Beans and several kinds of pork under a crust you are meant to break and let sink.',
      'hot meat pork filling comfort indulgent allium root homemade soupy bready'),
    item('Tartiflette', '\u{1F954}', 'Potato, bacon and a whole reblochon, baked until the top browns and the middle runs.',
      'hot cheesy dairy meat pork root filling indulgent comfort allium alcohol'),
    item('Bitterballen', '\u{1F362}', 'Crisp spheres of ragout that are molten inside and will burn you every time.',
      'hot meat beef fried crunchy handheld shareable indulgent dairy egg'),
    item('Stamppot', '\u{1F954}', 'Potato mashed through kale or endive, with a sausage pushed into the middle.',
      'hot root soft comfort filling cheap dairy meat pork homemade'),
    item('Pelmeni', '\u{1F95F}', 'Small meat dumplings boiled and eaten under soured cream and black pepper.',
      'hot meat pork beef filling comfort soft shareable dairy allium homemade quick'),
    item('Blini', '\u{1F95E}', 'Small buckwheat pancakes, soured cream on top, and the topping is the argument.',
      'soft shareable dairy egg handheld homemade cheap breakfast'),
    item('Olivier salad', '\u{1F957}', 'Diced everything under mayonnaise, and on every table in the country at New Year.',
      'root fresh shareable egg chicken meat filling allium light'),
    item('Lángos', '\u{1FAD3}', 'Fried dough the size of a plate, rubbed with garlic, buried under soured cream and cheese.',
      'hot fried bready crunchy handheld cheesy dairy allium indulgent cheap'),
    item('Ćevapi', '\u{1F32D}', 'Little skinless sausages, ten to a portion, in flatbread with raw onion.',
      'hot meat beef handheld shareable filling messy allium bready'),
    item('Welsh rarebit', '\u{1F9C0}', 'Cheese, mustard and beer cooked into a paste and grilled onto toast.',
      'hot cheesy dairy bready quick comfort indulgent alcohol soft egg'),
    item('Scotch egg', '\u{1F95A}', 'A soft-boiled egg wrapped in sausagemeat and breadcrumbs, cut to show off the yolk.',
      'meat pork egg fried crunchy handheld shareable filling bready'),

    /* ---- India, past Punjab ------------------------------------------- */
    item('Chole bhature', '\u{1FAD3}', 'Black chickpea curry with a balloon of fried bread that deflates as you tear it.',
      'hot spicy filling bready fried carby shareable allium root comfort indulgent dairy'),
    item('Paneer tikka', '\u{1F9C0}', 'Cubes of paneer in yoghurt and spices, charred at the edges off a skewer.',
      'hot cheesy dairy spicy handheld shareable healthy allium homemade'),
    item('Vindaloo', '\u{1F35B}', 'Goan, and originally Portuguese: pork, vinegar, garlic and a great deal of chilli.',
      'hot meat pork spicy filling comfort allium root homemade'),
    item('Rasam', '\u{1F372}', 'Thin, sour, peppery, and drunk from the bowl as often as spooned.',
      'hot soupy spicy light healthy quick allium root comfort cheap'),
    item('Aloo paratha', '\u{1FAD3}', 'Flatbread stuffed with spiced potato, cooked in ghee, eaten with yoghurt and pickle.',
      'hot bready root soft filling comfort breakfast dairy homemade cheap allium'),
    item('Kathi roll', '\u{1F32F}', 'Paratha cooked with egg on one side, filled with kebab and onion, rolled in paper.',
      'hot meat chicken handheld spicy filling quick messy egg bready allium dairy'),
    item('Litti chokha', '\u{1F360}', 'Dough balls stuffed with roasted gram flour, cooked in ash, smashed into charred aubergine.',
      'hot bready root healthy filling homemade shareable dairy cheap allium'),

    /* ---- Malaysia and the Philippines --------------------------------- */
    item('Nasi lemak', '\u{1F35A}', 'Coconut rice with sambal, peanuts, anchovies, cucumber and half an egg.',
      'hot carby filling spicy shareable egg seafood breakfast root allium comfort'),
    item('Char kway teow', '\u{1F35C}', 'Flat noodles fried in pork fat over an unreasonable flame, with cockles and egg.',
      'hot carby filling seafood shellfish egg meat pork allium indulgent messy quick'),
    item('Gado-gado', '\u{1F957}', 'Blanched vegetables and egg under a thick warm peanut sauce.',
      'healthy fresh light shareable egg filling allium homemade'),
    item('Sinigang', '\u{1F372}', 'Sour soup — tamarind, tomato and whatever greens — and the sourness is the point.',
      'hot soupy meat pork healthy comfort filling fresh root allium seafood'),
    item('Kare-kare', '\u{1F372}', 'Oxtail in a thick peanut and annatto sauce, eaten with salty shrimp paste on the side.',
      'hot meat beef filling comfort indulgent root allium soft'),
    item('Bún bò Huế', '\u{1F35C}', 'Lemongrass and chilli beef noodle soup, heavier and hotter than pho and prouder of it.',
      'hot soupy meat beef pork spicy carby filling allium seafood shellfish'),

    /* ---- the Levant past the mezze ------------------------------------ */
    item('Musakhan', '\u{1FAD3}', 'Chicken roasted over flatbread with sumac onions, the bread soaking up everything.',
      'hot meat chicken bready filling shareable allium comfort messy handheld'),
    item('Mansaf', '\u{1F35A}', 'Lamb cooked in fermented dried yoghurt over rice, eaten from one tray with the right hand.',
      'hot meat carby filling shareable dairy comfort allium soft'),
    item('Kibbeh', '\u{1F95F}', 'Bulgur shells stuffed with spiced mince and pine nuts, fried into torpedoes.',
      'hot meat fried crunchy handheld shareable filling allium'),
    item('Muhammara', '\u{1F336}', 'Roasted red pepper and walnut, thick with pomegranate molasses and chilli.',
      'spicy fresh shareable light healthy cheap homemade allium fruity'),

    /* ---- North America ------------------------------------------------- */
    item('Poutine', '\u{1F35F}', 'Chips, squeaking cheese curds and hot gravy, in that order and no other.',
      'hot cheesy dairy fried filling indulgent messy comfort meat carby'),
    item('Lobster roll', '\u{1F99E}', 'Cold lobster in a split bun, either buttered or dressed, and people take sides.',
      'seafood shellfish handheld filling indulgent fresh bready egg dairy'),
    item('Shrimp and grits', '\u{1F364}', 'Prawns and bacon over a bowl of grits loosened with cheese.',
      'hot seafood shellfish comfort filling cheesy dairy soft meat pork allium'),
    item('Key lime pie', '\u{1F967}', 'Sharp green custard in a biscuit crust, and it should make you wince slightly.',
      'sweet fruity dairy egg soft indulgent shareable'),

    /* ---- and the pudding shelf ----------------------------------------- */
    item('Cannoli', '\u{1F365}', 'A fried tube filled with sweet ricotta, and never filled until you order it.',
      'sweet crunchy dairy handheld shareable indulgent chocolate egg alcohol'),
    item('Bakewell tart', '\u{1F967}', 'Frangipane over raspberry jam in pastry, with flaked almonds on top.',
      'sweet soft dairy egg fruity shareable indulgent homemade', 'crunchy'),
    item('Kulfi', '\u{1F366}', 'Denser than ice cream because it is never churned, on a stick, tasting of cardamom.',
      'sweet dairy soft light handheld shareable'),
    item('Turkish coffee', '\u{2615}', 'Ground to dust, boiled three times, and drunk down to the sludge and no further.',
      'drink hot caffeine quick shareable cheap')
  ];

  /*
   * QUICK MODE'S HUNDRED.
   *
   * THE RULE: the first hundred entries above, and the rule is the point.
   * They are the dishes this catalogue started with — pizza, cheeseburger,
   * ramen, pho, tacos, biryani — chosen first because they are the ones
   * nearly everybody recognises, with the pudding shelf on the end. Every
   * intake since has gone underneath them. So "the first hundred" is not an
   * arbitrary slice, it is the original staples, and it stays that way on its
   * own as the catalogue grows.
   *
   * WHY A SMALLER MENU IS A BETTER GAME, not a worse one. Measured over all
   * hundred against all four hundred and fifty: it finds the dish first 100%
   * of the time instead of 99.3%, and it does it in 7.8 questions instead of
   * 11.4. Fewer dishes are easier to tell apart, so a third of the questions
   * simply stop being worth asking. That is the whole of what "quick" means
   * here — not a cut-down mode, a shorter route to the same kind of answer.
   *
   * THERE ARE NO DRINKS IN IT, which is not a decision so much as a
   * consequence: the drinks were all added later. It pays off anyway, because
   * the engine drops any question where one of the two answers fits nothing
   * left — so "drink or food?", normally the opener, removes itself and the
   * game starts on something about the food.
   *
   * WHAT IT IS NOT ALLOWED TO BE is a diet trap. A hundred dishes filtered by
   * somebody's rules is a much smaller number, and the floor is checked by
   * the build rather than trusted: see scripts/accuracy-test.mjs.
   */
  var QUICK_COUNT = 100;
  var QUICK = ITEMS.slice(0, QUICK_COUNT);

  return { QUESTIONS: QUESTIONS, TAGS: TAGS, LEARNABLE: LEARNABLE, DIET_TAGS: DIET_TAGS,
    TASTES: TASTES, ITEMS: ITEMS, QUICK: QUICK, QUICK_COUNT: QUICK_COUNT,
    phrase: phrase, wordings: wordings };
});
