/*
 * flavor.js — the app talking back.
 *
 * Every answer gets a short reply so the run feels like a conversation rather
 * than a form. Multiple variants per answer, picked at random, so a few games in
 * a row don't read identically.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.FoodFlavor = mod;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var REACTIONS = {
    drink:     { yes: ['Liquid it is.', 'Something to sip. Good.', 'Drink mode engaged.'],
                 no:  ['Proper food. Respect.', 'Right — let’s feed you.', 'Something you can chew. Good.'] },
    sweet:     { yes: ['Sweet tooth engaged.', 'Dessert energy. I approve.', 'Sugar it is.'],
                 no:  ['Savoury. Solid.', 'Salt over sugar. Noted.', 'Good — savoury is where the range is.'] },
    hot:       { yes: ['Something steaming. Lovely.', 'Warm it is.', 'Heat requested.'],
                 no:  ['Cool and refreshing.', 'Chilled. Sensible.', 'Nothing that needs blowing on.'],
                 neither: ['Room temperature. Sensible.', 'Neither, then. Fair.', 'Straight off the shelf.'] },
    quick:     { yes: ['Hungry *now*. Understood.', 'No patience whatsoever. Fair.'],
                 no:  ['Worth waiting for.', 'Patience. I respect it.'] },
    healthy:   { yes: ['Look at you go.', 'Virtuous. Noted.'],
                 no:  ['Treat mode activated.', 'No notes. Enjoy yourself.'] },
    light:     { yes: ['Keeping it small.', 'Just a little something.'],
                 no:  ['Go big, then.', 'Proper hunger. Understood.'] },
    meat:      { yes: ['Carnivore mode.', 'Meat it is.'],
                 no:  ['Plants only. Nice.', 'Meat-free. Got it.'] },
    spicy:     { yes: ['Heat seeker.', 'Chilli incoming.'],
                 no:  ['Gentle. Understood.', 'No fireworks. Fine.'] },
    carby:     { yes: ['Carbs are always the answer.', 'Bread, rice, or both.'],
                 no:  ['Skipping the carbs. Bold.', 'No stodge. Noted.'] },
    bready:    { yes: ['Bread. The great carrier.', 'Something to hold it all together.'],
                 no:  ['No bread. Fine.', 'Straight to the good bit, then.'] },
    chicken:   { yes: ['Chicken. Never a wrong answer.', 'The reliable one.'],
                 no:  ['Not chicken. Branching out.', 'Something else, then.'] },
    chocolate: { yes: ['Chocolate. Obviously.', 'Cocoa incoming.'],
                 no:  ['Not chocolate. Interesting.', 'Sweet, but not that sweet.'] },
    fruity:    { yes: ['Something with fruit in it.', 'Fruit. Practically a salad.'],
                 no:  ['No fruit. Understood.', 'Skipping the healthy bit.'] },
    cheesy:    { yes: ['Cheese improves everything.', 'More cheese. Always.'],
                 no:  ['No cheese. Interesting.', 'Cheese-free. Unusual, but fine.'] },
    handheld:  { yes: ['Hands it is.', 'No cutlery required.'],
                 no:  ['A sit-down job.', 'Knife and fork. Civilised.'] },
    soupy:     { yes: ['Broth incoming.', 'Something you can drink from the bowl.'],
                 no:  ['Nothing sloshing about.', 'Solid food. Noted.'] },
    fried:     { yes: ['Straight into the oil.', 'Fried. Excellent.'],
                 no:  ['Keeping it clean.', 'No oil. Understood.'] },
    crunchy:   { yes: ['Texture matters.', 'Crunch required.'],
                 no:  ['Soft and easy.', 'Nothing that fights back.'] },
    fresh:     { yes: ['Crisp and green.', 'Raw and fresh.'],
                 no:  ['Properly cooked.', 'Something that saw heat.'] },
    seafood:   { yes: ['Straight from the sea.', 'Fish it is.'],
                 no:  ['Landlubber. Fine by me.', 'Nothing with fins.'] },
    comfort:   { yes: ['Comfort it is.', 'One of those days. Understood.'],
                 no:  ['Something brighter.', 'Not a duvet day, then.'] },
    shareable: { yes: ['Company. Lovely.', 'Sharing. Very generous.'],
                 no:  ['All yours. No judgement.', 'Solo dining — the best kind.'] },
    cheap:     { yes: ['Budget noted.', 'Cheap and cheerful.'],
                 no:  ['Splashing out. Good.', 'Money is no object today.'] },
    homemade:  { yes: ['Chef mode.', 'Cooking it yourself. Bold.'],
                 no:  ['Let someone else do it.', 'Outsourcing dinner. Wise.'] },
    breakfast: { yes: ['Breakfast food. At any hour.', 'Morning food it is.'],
                 no:  ['Any time of day.', 'Not a breakfast thing. Fine.'] },
    caffeine:  { yes: ['Caffeine required. Understood.', 'Rocket fuel it is.'],
                 no:  ['Staying calm.', 'No jitters. Sensible.'] },
    messy:     { yes: ['Napkins at the ready.', 'The mess is half the fun.'],
                 no:  ['Clean hands. Respectable.', 'Nothing that drips.'] },
    indulgent: { yes: ['All out. Love it.', 'No restraint. Perfect.'],
                 no:  ['Sensible. Admirable.', 'Restraint. Impressive.'] },
    veg:       { yes: ['Vegetarian. Noted.', 'No meat anywhere near it.'],
                 no:  ['Anything goes.', 'No restrictions. Easy.'] }
  };

  // "Neither" is a real answer rather than a shrug, so it gets its own replies —
  // and a per-question line where there is one worth writing.
  var NEITHER = [
    'Neither end, then.',
    'Somewhere in the middle. Noted.',
    'Fair — it is not always one or the other.'
  ];

  var EITHER = [
    'No strong feelings. Noted.',
    'Keeping your options open.',
    'Fair enough — I’ll decide.',
    'Genuinely don’t mind. Respect.',
    'Fine, I’ll take the wheel.'
  ];

  // Shown under the question, keyed off how close the engine is to certain.
  // The thresholds are set from measured games (see tools/check.js) so the line
  // moves on roughly every question rather than sitting on "wide open" for three.
  var HUNCHES = [
    { at: 0.00, text: 'Wide open. Could be anything.' },
    { at: 0.10, text: 'Right, that helps.' },
    { at: 0.20, text: 'Starting to narrow it down…' },
    { at: 0.32, text: 'Getting warmer.' },
    { at: 0.45, text: 'Now we’re talking.' },
    { at: 0.58, text: 'Oh, I think I know this one.' },
    { at: 0.70, text: 'I’ve got it. One more to be sure.' }
  ];

  var REVEALS = ['Right.', 'Got it.', 'Here we go.', 'Obviously.', 'It was always this.'];

  var REJECTS = [
    'Fussy. Fine, let’s keep going.',
    'Noted. Crossing that one off.',
    'Alright, tougher than you look.',
    'Fair. Let me think again.'
  ];

  function pick(list, random) {
    return list[Math.floor((random || Math.random)() * list.length)];
  }

  function reaction(tag, value, random) {
    if (value === 'either') return pick(EITHER, random);
    var set = REACTIONS[tag];
    if (!set || !set[value]) return value === 'neither' ? pick(NEITHER, random) : '';
    return pick(set[value], random);
  }

  function hunch(confidence) {
    var out = HUNCHES[0].text;
    HUNCHES.forEach(function (h) { if (confidence >= h.at) out = h.text; });
    return out;
  }

  return {
    REACTIONS: REACTIONS,
    NEITHER: NEITHER,
    EITHER: EITHER,
    HUNCHES: HUNCHES,
    REVEALS: REVEALS,
    REJECTS: REJECTS,
    reaction: reaction,
    hunch: hunch,
    pick: pick
  };
});
