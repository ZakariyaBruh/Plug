/*
 * recipes.js — what to actually cook, once you've decided.
 *
 * Each dish carries a couple of genuinely different takes rather than one
 * canonical version: a classic, and a faster or lighter route. Quantities are
 * metric with rough cup equivalents left out on purpose — this is a prompt to
 * start cooking, not a reference text.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.FoodRecipes = mod;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BOOK = {};

  function recipes(dish, list) { BOOK[dish] = list; }

  recipes('Pancakes', [
    { name: 'The proper stack', time: 20, serves: 2, level: 'Easy',
      ingredients: ['150g plain flour', '2 tsp baking powder', '1 tbsp sugar', '1 egg', '200ml milk', 'Butter, for the pan'],
      steps: ['Whisk the dry ingredients in a bowl.',
              'Beat the egg into the milk, then pour into the dry and whisk to a thick batter. Leave it 5 minutes.',
              'Melt a little butter in a low-medium pan. Drop in spoonfuls.',
              'Flip when bubbles open on the surface and stay open, about 2 minutes.',
              'Stack, and keep them warm under a tea towel while you finish the rest.'] },
    { name: 'One bowl, ten minutes', time: 10, serves: 1, level: 'Very easy',
      ingredients: ['1 ripe banana', '1 egg', '3 tbsp oats', 'Pinch of cinnamon'],
      steps: ['Mash the banana in a bowl until mostly smooth.',
              'Beat in the egg, then stir through the oats and cinnamon.',
              'Cook small spoonfuls in a buttered pan over medium-low heat.',
              'Turn once, carefully — they are softer than they look.'] }
  ]);

  recipes('French toast', [
    { name: 'Thick-cut classic', time: 15, serves: 2, level: 'Easy',
      ingredients: ['4 thick slices of day-old bread', '2 eggs', '120ml milk', '1 tsp vanilla', 'Cinnamon', 'Butter'],
      steps: ['Beat the eggs, milk, vanilla and a good pinch of cinnamon in a shallow dish.',
              'Soak each slice 20 seconds a side — long enough to wet through, not so long it collapses.',
              'Fry in butter over medium heat until deep golden, about 3 minutes a side.',
              'Serve straight away with syrup, or berries and yoghurt.'] },
    { name: 'Savoury, with cheese', time: 15, serves: 2, level: 'Easy',
      ingredients: ['4 slices bread', '2 eggs', '80ml milk', '40g grated cheese', 'Black pepper', 'Butter'],
      steps: ['Beat eggs, milk, plenty of pepper and half the cheese together.',
              'Soak the bread briefly, then fry in butter over medium heat.',
              'Scatter the rest of the cheese on the cooked side as you flip.',
              'Press down gently so it catches and crisps.'] }
  ]);

  recipes('Omelette', [
    { name: 'French-style, barely coloured', time: 8, serves: 1, level: 'Medium',
      ingredients: ['3 eggs', 'Knob of butter', 'Salt', 'Chives, chopped'],
      steps: ['Beat the eggs well with a pinch of salt — no milk, no water.',
              'Melt butter in a non-stick pan over medium-low until foaming but not brown.',
              'Pour in the eggs and stir constantly with a spatula for 30 seconds, then stop.',
              'When the top is just barely wet, fold a third over, roll onto the plate.',
              'Scatter chives. The middle should still be soft.'] },
    { name: 'Loaded, folded, forgiving', time: 12, serves: 1, level: 'Easy',
      ingredients: ['3 eggs', 'Handful of grated cheese', 'Mushrooms or peppers, sliced', 'Butter', 'Salt and pepper'],
      steps: ['Fry the vegetables in butter until soft, then lift out.',
              'Beat and season the eggs, pour into the same pan over medium heat.',
              'Pull the set edges into the centre and tilt so raw egg runs out.',
              'When almost set, add the filling and cheese to one half and fold over.',
              'Give it a minute off the heat so the cheese melts through.'] }
  ]);

  recipes('Shakshuka', [
    { name: 'The standard, worth the time', time: 30, serves: 2, level: 'Easy',
      ingredients: ['1 onion, sliced', '1 red pepper, sliced', '2 garlic cloves', '1 tsp cumin', '1 tsp paprika', '400g tin chopped tomatoes', '4 eggs', 'Bread, to mop'],
      steps: ['Soften the onion and pepper in oil for 10 minutes — properly soft, not just translucent.',
              'Add garlic and spices, stir for a minute until it smells like something.',
              'Tip in the tomatoes, season, and simmer 10 minutes until thick enough to hold a trench.',
              'Make four wells, crack an egg into each, cover and cook 5–7 minutes.',
              'Take it off while the yolks still move. Bread is not optional.'] },
    { name: 'Green, with spinach', time: 20, serves: 2, level: 'Easy',
      ingredients: ['1 onion', '2 garlic cloves', '200g spinach', '4 eggs', 'Cumin', 'Lemon', 'Olive oil'],
      steps: ['Soften the onion, add garlic and a big pinch of cumin.',
              'Wilt in the spinach a handful at a time, then stir through the cream.',
              'Season well and squeeze in lemon — green shakshuka needs the acid.',
              'Make wells, add the eggs, cover and cook until just set.'] }
  ]);

  recipes('Grilled cheese', [
    { name: 'The only method that matters', time: 10, serves: 1, level: 'Very easy',
      ingredients: ['2 slices bread', '60g cheese, grated not sliced', 'Softened butter', 'Mustard (optional)'],
      steps: ['Butter the OUTSIDE of both slices. This is the whole trick.',
              'Grate the cheese so it melts evenly, and pile it between the unbuttered faces.',
              'Cook in a cold pan brought slowly up to medium — rushing browns the bread before the cheese goes.',
              'Press with a spatula, turn once, about 4 minutes a side.',
              'Rest 1 minute before cutting or the cheese runs out.'] },
    { name: 'With something sharp in it', time: 12, serves: 1, level: 'Easy',
      ingredients: ['2 slices sourdough', '60g mature cheddar', 'Thin apple or pickle slices', 'Butter', 'Black pepper'],
      steps: ['Butter the outsides of the bread.',
              'Layer cheese, then apple or pickle, then more cheese so the filling is sealed in.',
              'Cook slowly over medium-low until deeply golden.',
              'The acidity cuts the fat — that is the point of it.'] }
  ]);

  recipes('Quesadilla', [
    { name: 'Four minutes, one pan', time: 8, serves: 1, level: 'Very easy',
      ingredients: ['2 tortillas', '80g grated cheese', 'Spring onion', 'Pinch of chilli flakes'],
      steps: ['Heat a dry pan over medium.',
              'Lay one tortilla in, scatter cheese, onion and chilli over, top with the second.',
              'Cook 2 minutes until the underside is spotted, press flat, flip.',
              'Another 2 minutes, then slide out and cut into wedges with a big knife.'] },
    { name: 'Black bean and lime', time: 15, serves: 2, level: 'Easy',
      ingredients: ['4 tortillas', '400g tin black beans, drained', '100g cheese', '1 tsp cumin', 'Lime', 'Coriander'],
      steps: ['Crush the beans roughly with cumin, lime juice and salt — leave some texture.',
              'Spread over half of each tortilla, top with cheese and coriander, fold over.',
              'Dry-fry over medium heat, 3 minutes a side, pressing down.',
              'Cut and serve with more lime.'] }
  ]);

  recipes('Mac and cheese', [
    { name: 'Proper roux, baked', time: 40, serves: 4, level: 'Medium',
      ingredients: ['400g macaroni', '50g butter', '50g flour', '600ml milk', '250g strong cheddar, grated', '1 tsp mustard powder', 'Breadcrumbs'],
      steps: ['Boil the pasta two minutes short of the packet time. It cooks again later.',
              'Melt butter, stir in flour, cook 2 minutes — it should smell biscuity, not raw.',
              'Add milk a splash at a time, whisking, until you have a smooth pourable sauce.',
              'Off the heat, stir in most of the cheese and the mustard powder. Season hard; pasta dulls it.',
              'Fold through the pasta, top with the rest of the cheese and breadcrumbs, bake 20 minutes at 200C.'] },
    { name: 'Stovetop, fifteen minutes', time: 15, serves: 2, level: 'Easy',
      ingredients: ['200g macaroni', '150ml evaporated milk', '150g cheddar, grated', '1 tsp cornflour', 'Mustard', 'Pepper'],
      steps: ['Cook the pasta, drain, and return to the warm pan off the heat.',
              'Beat the egg into the evaporated milk with a spoon of mustard.',
              'Pour over the pasta and stir hard — the residual heat thickens it.',
              'Add cheese in handfuls, stirring until glossy. Do not put it back on the heat or it splits.'] }
  ]);

  recipes('Spaghetti bolognese', [
    { name: 'The long one', time: 150, serves: 4, level: 'Easy',
      ingredients: ['500g beef mince', '1 onion, 1 carrot, 1 celery stick, all finely diced', '2 garlic cloves', '400g tin tomatoes', '150ml milk', '150ml red wine', 'Spaghetti'],
      steps: ['Brown the mince hard in batches — crowd the pan and it steams instead.',
              'Soften the diced vegetables in the same pan for 10 minutes.',
              'Return the meat, add the milk and simmer until it disappears. Then the wine, same again.',
              'Add tomatoes and a splash of water, then the lowest possible heat for 2 hours.',
              'Season at the end, and loosen with pasta water when you toss it through.'] },
    { name: 'Weeknight version', time: 35, serves: 4, level: 'Easy',
      ingredients: ['500g beef mince', '1 onion, diced', '2 garlic cloves', '2 tbsp tomato purée', '400g tin tomatoes', '1 beef stock cube', 'Oregano', 'Spaghetti'],
      steps: ['Brown the mince, then the onion and garlic.',
              'Stir in the tomato purée and let it darken for a minute — this is where the depth comes from.',
              'Add tomatoes, crumbled stock cube, oregano and 100ml water.',
              'Simmer 25 minutes, uncovered, until it holds its shape on a spoon.'] }
  ]);

  recipes('Chilli con carne', [
    { name: 'Better on day two', time: 90, serves: 4, level: 'Easy',
      ingredients: ['500g beef mince', '1 onion', '2 garlic cloves', '2 tsp cumin', '1 tsp smoked paprika', '1 tbsp cocoa powder', '400g tin tomatoes', '400g tin kidney beans', '1 square dark chocolate'],
      steps: ['Brown the mince properly, then soften the onion and garlic with the spices.',
              'Add the cocoa, tomatoes and 200ml water. Simmer, lid ajar, for an hour.',
              'Add the drained beans for the last 20 minutes.',
              'Stir in the chocolate at the end and check the salt. Make it the day before if you can.'] },
    { name: 'Bean chilli, no meat', time: 35, serves: 4, level: 'Easy',
      ingredients: ['2 tins mixed beans', '1 onion', '1 red pepper', '2 tsp cumin', '1 tsp chipotle paste', '400g tin tomatoes', 'Lime'],
      steps: ['Soften the onion and pepper, add the spices and chipotle.',
              'Add tomatoes and beans, mash a quarter of the beans against the pan to thicken it.',
              'Simmer 20 minutes.',
              'Finish with lime juice — it lifts the whole thing.'] }
  ]);

  recipes('Egg fried rice', [
    { name: 'Yesterday’s rice, as intended', time: 12, serves: 2, level: 'Easy',
      ingredients: ['400g cold cooked rice', '2 eggs', '2 spring onions', '1 garlic clove', '1 tbsp soy sauce', '1 tsp sesame oil', 'Frozen peas'],
      steps: ['The rice must be cold and dry. Fresh rice steams and clumps.',
              'Scramble the eggs quickly in a very hot oiled wok, then tip them out.',
              'Fry the garlic and white parts of the onion for 30 seconds, add rice and peas.',
              'Press the rice against the pan and leave it — you want some grains to catch.',
              'Return the egg, add soy and sesame oil off the heat, scatter the green onion.'] }
  ]);

  recipes('Chicken soup', [
    { name: 'From a whole chicken', time: 120, serves: 4, level: 'Easy',
      ingredients: ['1 chicken carcass or 4 thighs', '2 carrots', '2 celery sticks', '1 onion', 'Bay leaf', 'Handful of noodles or rice', 'Parsley'],
      steps: ['Cover the chicken and halved vegetables with cold water. Bring up slowly and skim the foam.',
              'Simmer, barely bubbling, for 90 minutes. A rolling boil makes it cloudy.',
              'Strain, pull the meat off, dice fresh vegetables and cook them in the broth until tender.',
              'Return the meat, add noodles, and season properly at the very end.'] },
    { name: 'Thirty-minute version', time: 30, serves: 2, level: 'Very easy',
      ingredients: ['2 chicken breasts', '1L good stock', '2 carrots, sliced', '1 leek', 'Handful of noodles', 'Lemon'],
      steps: ['Simmer the whole chicken breasts in the stock for 15 minutes, then lift out and shred.',
              'Cook the sliced vegetables in the same stock until just tender.',
              'Add the noodles for their packet time, return the chicken.',
              'Squeeze in lemon at the end.'] }
  ]);

  recipes('Thai green curry', [
    { name: 'With shop-bought paste, done well', time: 25, serves: 2, level: 'Easy',
      ingredients: ['3 tbsp green curry paste', '400ml coconut milk', '300g chicken or tofu', 'Handful of green beans', 'Thai basil', 'Fish sauce', 'Palm or brown sugar', 'Lime'],
      steps: ['Fry the paste in a spoon of the thick coconut cream from the top of the tin for 2 minutes.',
              'This step is what separates it from a bland curry — the paste must sizzle and darken.',
              'Add the rest of the coconut milk and bring to a gentle simmer.',
              'Add the chicken, cook 8 minutes, then the beans for 4 more.',
              'Balance at the end: fish sauce for salt, sugar for round, lime for sharp. Basil off the heat.'] }
  ]);

  recipes('Tacos', [
    { name: 'Quick pork or beef', time: 25, serves: 2, level: 'Easy',
      ingredients: ['400g pork or beef mince', '1 tsp cumin', '1 tsp oregano', '1 chipotle in adobo', 'Corn tortillas', 'White onion, diced', 'Coriander', 'Lime'],
      steps: ['Brown the mince hard, breaking it up until some of it is genuinely crisp.',
              'Add spices and chopped chipotle, plus a splash of water, cook until sticky.',
              'Warm the tortillas directly over a flame or in a dry pan until they blister.',
              'Serve with raw onion, coriander and lime, and nothing else. Restraint is the point.'] },
    { name: 'Roast cauliflower', time: 35, serves: 2, level: 'Easy',
      ingredients: ['1 cauliflower, in small florets', '2 tsp smoked paprika', '1 tsp cumin', 'Tortillas', '1 avocado', 'Lime', 'Pickled onion'],
      steps: ['Toss the cauliflower with oil, paprika, cumin and salt.',
              'Roast at 220C for 25 minutes until charred at the edges — undercooked cauliflower ruins this.',
              'Thin the yoghurt with lime juice and salt.',
              'Build with the sauce underneath so it does not slide off.'] }
  ]);

  recipes('Baked potato', [
    { name: 'Crisp skin, properly', time: 90, serves: 2, level: 'Very easy',
      ingredients: ['2 large baking potatoes', 'Oil', 'Coarse salt', 'Butter', 'Cheese (optional)'],
      steps: ['Prick all over, rub with oil, then roll in coarse salt.',
              'Bake directly on the oven shelf at 200C for 75–90 minutes. No foil — foil steams it.',
              'It is done when the skin gives under a squeeze and sounds hollow.',
              'Split, fork the inside up roughly, and put in more butter than feels sensible.'] }
  ]);

  recipes('Greek salad', [
    { name: 'The real one, no lettuce', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['4 ripe tomatoes, in wedges', '1 cucumber, thickly sliced', 'Half a red onion, thin', 'Black olives', '200g block of feta', 'Dried oregano', 'Good olive oil'],
      steps: ['Salt the tomatoes and leave 5 minutes — they release juice, which becomes the dressing.',
              'Add cucumber, onion and olives. No leaves. There is no lettuce in this salad.',
              'Lay the feta on top in one slab, do not crumble it.',
              'Oregano over the cheese, then a lot of olive oil. No vinegar.'] }
  ]);

  recipes('Hummus and pita', [
    { name: 'Smooth, from a tin', time: 15, serves: 4, level: 'Easy',
      ingredients: ['400g tin chickpeas', '80g tahini', '1 lemon', '1 small garlic clove', 'Ice water', 'Cumin', 'Olive oil'],
      steps: ['Simmer the chickpeas in their liquid with a pinch of bicarb for 10 minutes so the skins loosen.',
              'Blend tahini, lemon juice and garlic first, until it seizes and then loosens pale.',
              'Add the drained warm chickpeas and blend for a full 3 minutes.',
              'Trickle in ice water until it turns almost too soft — it firms as it cools.'] }
  ]);

  recipes('Avocado toast', [
    { name: 'Done with some care', time: 7, serves: 1, level: 'Very easy',
      ingredients: ['1 ripe avocado', '2 slices good bread', 'Lemon', 'Chilli flakes', 'Flaky salt', 'Olive oil'],
      steps: ['Toast the bread hard — it has to hold up under the weight.',
              'Fork the avocado roughly in a bowl with lemon and salt. Never spread it straight onto the toast.',
              'Pile it on, keeping the texture.',
              'Olive oil, chilli, and more salt than you think.'] },
    { name: 'With a soft egg', time: 12, serves: 1, level: 'Easy',
      ingredients: ['1 avocado', '2 slices bread', '2 tbsp tahini', 'Dukkah', 'Chilli flakes', 'Lemon'],
      steps: ['Bring a small pan of water to a bare simmer with a splash of vinegar.',
              'Stir a whirlpool, drop the egg into the middle, cook 3 minutes.',
              'Meanwhile fork the avocado with lemon and salt onto toast.',
              'Lift the egg out with a slotted spoon, drain on paper, then set it on top and break it open.'] }
  ]);

  recipes('Cookies', [
    { name: 'Brown butter, chilled dough', time: 45, serves: 12, level: 'Medium',
      ingredients: ['150g butter', '150g brown sugar', '80g caster sugar', '1 egg plus 1 yolk', '250g plain flour', '1 tsp bicarb', '200g dark chocolate, chopped'],
      steps: ['Brown the butter until it smells nutty and the solids go amber. Cool 10 minutes.',
              'Beat in both sugars, then the egg and yolk, until glossy.',
              'Fold in flour, bicarb, salt and chocolate. Chill the dough at least 30 minutes — this is not optional.',
              'Bake at 180C for 10–12 minutes. Pull them while the centres still look underdone.'] }
  ]);

  recipes('Brownie', [
    { name: 'Fudgy, not cakey', time: 40, serves: 9, level: 'Easy',
      ingredients: ['200g dark chocolate', '150g butter', '250g caster sugar', '3 eggs', '90g plain flour', 'Pinch of salt'],
      steps: ['Melt the chocolate and butter together, then cool slightly.',
              'Whisk the eggs and sugar for a full 4 minutes until thick and pale — this makes the papery top.',
              'Fold in the chocolate, then the flour, stopping the moment it disappears.',
              'Bake at 180C for 22–25 minutes. A skewer should come out with damp crumbs, not clean.'] }
  ]);

  recipes('Hot chocolate', [
    { name: 'Made with real chocolate', time: 8, serves: 1, level: 'Very easy',
      ingredients: ['250ml whole milk', '40g dark chocolate, chopped', '1 tsp cocoa', 'Pinch of salt', 'Sugar to taste'],
      steps: ['Warm the milk with the cocoa and salt, whisking, until steaming but not boiling.',
              'Take off the heat and add the chopped chocolate. Wait 30 seconds, then whisk.',
              'Return to a low heat for a minute to thicken slightly.',
              'The salt is what stops it tasting flat.'] }
  ]);

  recipes('Smoothie', [
    { name: 'Thick, not watery', time: 5, serves: 1, level: 'Very easy',
      ingredients: ['1 frozen banana', '150g frozen berries', '150ml oat milk', '1 tbsp nut butter', '1 tbsp oats'],
      steps: ['Frozen fruit, not ice — ice waters it down as it melts.',
              'Liquid goes in the blender first, then the soft things, then the frozen.',
              'Blend on low, then high, stopping to push down rather than adding more liquid.',
              'The oats thicken it and stop you being hungry in an hour.'] }
  ]);

  recipes('Miso soup', [
    { name: 'Five minutes, properly', time: 8, serves: 2, level: 'Very easy',
      ingredients: ['500ml dashi or light stock', '2 tbsp miso paste', '100g silken tofu, cubed', '1 spring onion', 'Dried wakame (optional)'],
      steps: ['Heat the dashi to a bare simmer. Add the wakame if using.',
              'Add the tofu and warm through for 2 minutes.',
              'Take the pan OFF the heat, then whisk the miso in through a ladle of the broth.',
              'Boiling miso kills the flavour — this is the only rule that matters.'] }
  ]);

  recipes('Ramen', [
    { name: 'Weeknight shortcut bowl', time: 25, serves: 2, level: 'Easy',
      ingredients: ['800ml chicken stock', '2 tbsp miso paste', '1 tbsp soy', '1 tsp sesame oil', 'Garlic and ginger, grated', '2 portions ramen noodles', '2 eggs', 'Spring onion, sweetcorn'],
      steps: ['Boil the eggs exactly 6.5 minutes, then straight into cold water and peel.',
              'Fry the garlic and ginger in sesame oil, add stock, soy, and simmer 10 minutes.',
              'Whisk in the miso off the boil.',
              'Cook the noodles separately — never in the broth, or it goes cloudy and starchy.',
              'Assemble: noodles, broth, halved eggs, corn, onion.'] }
  ]);

  recipes('Pad thai', [
    { name: 'The balance is everything', time: 20, serves: 2, level: 'Medium',
      ingredients: ['200g flat rice noodles', '2 tbsp tamarind paste', '2 tbsp fish sauce', '2 tbsp palm sugar', '2 eggs', '200g prawns or tofu', 'Beansprouts', 'Peanuts, lime'],
      steps: ['Soak the noodles in warm water until pliable but still firm. They finish in the pan.',
              'Mix tamarind, fish sauce and sugar — taste it. It should be sharp, salty and sweet at once.',
              'Very hot wok: cook the prawns or tofu, push aside, scramble the eggs.',
              'Add drained noodles and sauce, toss hard for 2 minutes.',
              'Beansprouts in at the last second, then peanuts and lime off the heat.'] }
  ]);

  recipes('Steak', [
    { name: 'Thick cut, rested', time: 20, serves: 2, level: 'Medium',
      ingredients: ['2 thick sirloin or ribeye steaks', 'Neutral oil', 'Butter', 'Garlic clove', 'Thyme', 'Flaky salt'],
      steps: ['Take the steak out of the fridge 30 minutes ahead and dry the surface thoroughly.',
              'Salt generously. Get the pan hotter than feels reasonable.',
              'Sear without moving for 2–3 minutes a side, turning once.',
              'Add butter, garlic and thyme, tilt the pan and spoon it over for a minute.',
              'Rest on a warm plate for as long as you cooked it. Cutting early loses everything.'] }
  ]);

  recipes('Roast chicken', [
    { name: 'Simple, high heat', time: 90, serves: 4, level: 'Easy',
      ingredients: ['1 whole chicken, about 1.6kg', '1 lemon', 'Olive oil', 'Thyme', 'Salt', 'Potatoes and onions to sit under it'],
      steps: ['Dry the skin thoroughly and salt it an hour ahead if you can.',
              'Work oil and thyme under the breast skin. Halved lemon inside the cavity.',
              'Sit it on top of the halved potatoes and onions so they cook in the fat.',
              'Roast 220C for 20 minutes, then 190C for another 50–60.',
              'Rest 15 minutes, loosely covered, before carving.'] }
  ]);

  recipes('Cheeseburger', [
    { name: 'Smashed, thin, two patties', time: 20, serves: 2, level: 'Easy',
      ingredients: ['400g beef mince, 20% fat', '4 slices American cheese', '2 soft buns', 'White onion, thin', 'Pickles', 'Mustard and mayo'],
      steps: ['Roll the mince into four loose balls. Do not season yet and do not compact them.',
              'Very hot heavy pan. Put a ball down, smash flat hard for 10 seconds, then salt.',
              'Two minutes until the edges are lacy and brown, flip, cheese on immediately.',
              'Toast the buns in the fat left behind.',
              'Two thin patties beat one thick one — more crust, which is where the flavour is.'] }
  ]);

  recipes('Lasagna', [
    { name: 'Worth a Sunday', time: 150, serves: 6, level: 'Medium',
      ingredients: ['1 batch of ragù (see bolognese)', '50g butter', '50g flour', '700ml milk', 'Nutmeg', '150g parmesan', 'Lasagne sheets'],
      steps: ['Make the ragù first, and make it thicker than you would for pasta.',
              'For the béchamel: butter, flour, cook 2 minutes, then milk in stages, whisking. Grate in nutmeg.',
              'Layer: ragù, sheets, béchamel, parmesan. Repeat. Finish with béchamel and cheese on top.',
              'Bake 180C for 40 minutes until blistered.',
              'Rest 20 minutes before cutting or it slides apart on the plate.'] }
  ]);

  recipes('Katsu curry', [
    { name: 'Chicken katsu with a proper sauce', time: 45, serves: 2, level: 'Medium',
      ingredients: ['2 chicken breasts', 'Flour, 1 egg, panko', '1 onion', '1 carrot', '1 tbsp curry powder', '1 tbsp flour', '400ml stock', '1 tsp honey', 'Soy sauce'],
      steps: ['Soften the onion and carrot slowly for 10 minutes, add the curry powder and flour, cook 2 minutes.',
              'Add stock gradually, simmer 15 minutes, then blend until completely smooth and sieve it.',
              'Season with honey and soy. It should be glossy and coat a spoon.',
              'Flatten the chicken, coat in flour, egg then panko, pressing it on firmly.',
              'Shallow fry 4 minutes a side until deep gold. Slice, and pour the sauce beside, not over.'] }
  ]);

  recipes('Burrito', [
    { name: 'Rolled so it holds', time: 30, serves: 2, level: 'Easy',
      ingredients: ['2 large tortillas', '200g cooked rice', '400g tin black beans', '200g chicken or roast veg', 'Cheese', 'Salsa', 'Soured cream', 'Lime'],
      steps: ['Season the rice with lime and salt — plain rice is what makes burritos boring.',
              'Warm the tortillas until flexible or they will split when rolled.',
              'Pile the filling slightly below centre, leaving a clear border all round.',
              'Fold the sides in first, then roll from the bottom, tucking tight as you go.',
              'Sear the seam-side down in a dry pan for a minute to seal it.'] }
  ]);

  recipes('Nachos', [
    { name: 'Layered, so every chip counts', time: 25, serves: 4, level: 'Very easy',
      ingredients: ['1 large bag tortilla chips', '200g grated cheese', '400g tin black beans', 'Jalapeños', 'Soured cream', 'Guacamole', 'Spring onion'],
      steps: ['Build in two thin layers on a tray, not one deep pile. Chips, beans, cheese. Repeat.',
              'Bake 200C for 8 minutes, just until the cheese goes.',
              'Add the cold things — cream, guacamole, onion — only after baking.',
              'The layering is the entire difference between good nachos and a sad dry heap.'] }
  ]);

  recipes('Fruit salad', [
    { name: 'With a syrup that makes it worth it', time: 12, serves: 4, level: 'Very easy',
      ingredients: ['Mixed seasonal fruit', '1 lime', '2 tbsp honey', 'Mint leaves', 'Pinch of salt'],
      steps: ['Warm the honey with lime juice and a pinch of salt until it loosens.',
              'Cut the firm fruit first, the soft fruit last so it holds shape.',
              'Pour the syrup over while it is still warm and turn gently.',
              'Tear the mint in at the end. Chill 20 minutes.'] }
  ]);

  /* ---------------------------------------------------------------------- *
   * The rest of the catalogue. Shorter entries, because several of these are
   * assembly rather than cooking — but every dish has a way in.
   * ---------------------------------------------------------------------- */

  recipes('Pizza', [
    { name: 'No-knead base, hot oven', time: 90, serves: 2, level: 'Medium',
      ingredients: ['300g strong white flour', '200ml warm water', '1/4 tsp instant yeast', '1 tsp salt', '200g passata', '1 ball mozzarella', 'Basil, olive oil'],
      steps: ['Mix flour, water, yeast and salt into a shaggy dough. Cover, leave 1 hour.',
              'Fold it over on itself a few times, then rest another 30 minutes.',
              'Heat the oven as hot as it goes with a tray or stone inside — this is the whole game.',
              'Stretch by hand, never a rolling pin. Top sparingly: sauce, torn mozzarella, oil.',
              'Bake 7–9 minutes until the crust blisters. Basil after, not before.'] },
    { name: 'Pan pizza, no oven heroics', time: 30, serves: 1, level: 'Easy',
      ingredients: ['1 flatbread or naan', '4 tbsp passata', 'Handful grated mozzarella', 'Oregano', 'Olive oil'],
      steps: ['Warm a dry heavy pan over medium.',
              'Spread sauce on the flatbread, top with cheese and oregano.',
              'Cook in the pan, lid on, 6–8 minutes until the base crisps and the cheese melts.',
              'Finish under a hot grill for 60 seconds if you want colour on top.'] }
  ]);

  recipes('Fried chicken', [
    { name: 'Buttermilk, twice dredged', time: 240, serves: 4, level: 'Medium',
      ingredients: ['8 chicken thighs', '500ml buttermilk', '300g plain flour', '2 tsp paprika', '1 tsp garlic powder', 'Salt and pepper', 'Oil for frying'],
      steps: ['Brine the chicken in salted buttermilk for at least 3 hours, ideally overnight.',
              'Season the flour heavily — more than feels right; it is the only seasoning on the crust.',
              'Dredge, dip back in buttermilk, dredge again. That second coat makes the craggy bits.',
              'Fry at 165C for 12–15 minutes. Hotter and the crust burns before the middle cooks.',
              'Rest on a rack, never paper — paper steams the bottom soft.'] }
  ]);

  recipes('Pho', [
    { name: 'Cheat broth, real flavour', time: 45, serves: 2, level: 'Easy',
      ingredients: ['1L beef stock', '1 onion, halved', 'Thumb of ginger, halved', '2 star anise', '1 cinnamon stick', '200g rice noodles', '200g beef sirloin, sliced thin', 'Basil, lime, chilli'],
      steps: ['Char the onion and ginger cut-side down in a dry pan until blackened. This is what makes it taste like pho.',
              'Simmer them in the stock with the spices for 30 minutes, then strain.',
              'Soak the noodles in hot water until soft.',
              'Put raw sliced beef in the bowl, noodles on top, then pour the boiling broth over — it cooks the beef.',
              'Herbs, lime and chilli at the table, not in the pot.'] }
  ]);

  recipes('Chicken biryani', [
    { name: 'Layered, one pot', time: 75, serves: 4, level: 'Medium',
      ingredients: ['500g chicken thighs', '300g basmati rice', '200g yoghurt', '2 onions, sliced', '2 tsp garam masala', 'Pinch of saffron in warm milk', 'Handful of coriander and mint'],
      steps: ['Fry the onions slowly until genuinely brown — 20 minutes. Half go in the marinade, half on top.',
              'Marinate the chicken in yoghurt, spices and half the onions for 30 minutes.',
              'Parboil the rice for 5 minutes only. It finishes in the steam.',
              'Layer: chicken, then rice, then saffron milk, herbs and the rest of the onions.',
              'Lid on tight, lowest heat, 25 minutes. Do not stir until it is at the table.'] }
  ]);

  recipes('Shawarma wrap', [
    { name: 'Oven shawarma', time: 50, serves: 4, level: 'Easy',
      ingredients: ['600g chicken thighs', '2 tsp cumin', '2 tsp paprika', '1 tsp turmeric', 'Lemon', 'Flatbreads', 'Garlic sauce, pickles'],
      steps: ['Toss the thighs in the spices, lemon and oil. An hour is good; overnight is better.',
              'Roast at 220C for 25 minutes, then grill the top for 5 to get the charred edges.',
              'Rest, then slice thinly across the grain.',
              'Warm the flatbreads, pile in the meat, then far more garlic sauce and pickle than looks sensible.'] }
  ]);

  recipes('Fish and chips', [
    { name: 'Beer batter, double-fried chips', time: 60, serves: 2, level: 'Medium',
      ingredients: ['2 white fish fillets', '150g plain flour', '200ml cold beer', '1 tsp baking powder', '4 large potatoes', 'Oil for frying', 'Malt vinegar'],
      steps: ['Cut the chips and rinse off the starch, then dry them completely.',
              'Fry the chips once at 130C until soft but pale. Lift out and cool. This is the step people skip.',
              'Whisk flour, baking powder and cold beer into a batter the thickness of double cream.',
              'Fry the fish at 180C for 6–7 minutes, then the chips again at 190C until golden.',
              'Salt everything the second it comes out.'] }
  ]);

  recipes('Dumplings', [
    { name: 'Pork and cabbage, pan-fried', time: 60, serves: 4, level: 'Medium',
      ingredients: ['300g pork mince', '200g cabbage, finely chopped', '2 spring onions', '1 tbsp soy', '1 tsp sesame oil', 'Grated ginger', '1 pack dumpling wrappers'],
      steps: ['Salt the cabbage, wait 10 minutes, then squeeze the water out hard. Wet filling tears wrappers.',
              'Mix everything and beat it in one direction until it feels sticky.',
              'A teaspoon per wrapper, wet the rim, pleat and press firmly shut.',
              'Fry flat-side down until golden, add a splash of water, cover and steam 6 minutes.',
              'Uncover and let the water boil off so the bottoms crisp again.'] }
  ]);

  recipes('Buffalo wings', [
    { name: 'Baked, then sauced', time: 60, serves: 4, level: 'Easy',
      ingredients: ['1kg chicken wings', '1 tbsp baking powder (not soda)', '60g butter', '80ml hot sauce', '1 tsp honey', 'Celery and blue cheese to serve'],
      steps: ['Dry the wings thoroughly, then toss with baking powder and salt — it crisps the skin in the oven.',
              'Bake on a rack at 200C for 45 minutes, turning once.',
              'Melt the butter into the hot sauce with the honey. Do not boil it.',
              'Toss the wings in the sauce only when you are ready to eat, or they go soft.'] }
  ]);

  recipes('Falafel wrap', [
    { name: 'From dried chickpeas, properly', time: 40, serves: 4, level: 'Medium',
      ingredients: ['250g dried chickpeas, soaked overnight', '1 onion', '4 garlic cloves', 'Big handful parsley and coriander', '2 tsp cumin', '1 tsp baking powder', 'Flatbreads, tahini, pickles'],
      steps: ['Use soaked, never tinned or cooked chickpeas — tinned turns to paste and falls apart.',
              'Blitz everything to a coarse rubble, not a purée. Chill 30 minutes.',
              'Stir in the baking powder just before shaping into small patties.',
              'Shallow fry 3 minutes a side until deep brown.',
              'Wrap with tahini thinned with lemon and water, plus pickles for sharpness.'] }
  ]);

  recipes('Full English breakfast', [
    { name: 'Everything hot at once', time: 35, serves: 2, level: 'Easy',
      ingredients: ['4 sausages', '4 rashers bacon', '2 eggs', '200g mushrooms', '2 tomatoes', '1 tin baked beans', 'Bread to fry'],
      steps: ['Sausages first, lowest heat, 20 minutes turning often. They take longest and burn easiest.',
              'Add bacon after 10 minutes, tomatoes cut-side down beside it.',
              'Mushrooms in the bacon fat. Beans in a small pan. Oven on low with plates inside.',
              'Eggs last, in the same pan, spooning fat over the tops.',
              'The trick is order, not skill. Nothing waits more than two minutes.'] }
  ]);

  recipes('Bagel with cream cheese', [
    { name: 'Toasted, properly loaded', time: 8, serves: 1, level: 'Very easy',
      ingredients: ['1 bagel', '3 tbsp cream cheese', 'Red onion, sliced thin', 'Capers', 'Black pepper', 'Smoked salmon (optional)'],
      steps: ['Split and toast the bagel cut-side up under a grill, not in a toaster — it stays chewy inside.',
              'Let it cool 30 seconds so the cheese does not slide off.',
              'Spread thickly. Thin cream cheese on a bagel is a wasted bagel.',
              'Onion, capers, a lot of pepper.'] }
  ]);

  recipes('Peanut butter toast', [
    { name: 'The two-minute one', time: 4, serves: 1, level: 'Very easy',
      ingredients: ['2 slices bread', '2 tbsp peanut butter', 'Flaky salt', 'Honey or sliced banana'],
      steps: ['Toast the bread properly dark — pale toast goes soggy under peanut butter.',
              'Spread while hot so it melts slightly into the surface.',
              'Salt on top. It sounds wrong and it is the whole difference.',
              'Honey or banana if you want it to count as breakfast.'] }
  ]);

  recipes('Cereal', [
    { name: 'A better bowl', time: 3, serves: 1, level: 'Very easy',
      ingredients: ['Your cereal', 'Cold milk', 'Handful of berries', 'Spoon of yoghurt', 'Pinch of salt'],
      steps: ['Yoghurt in the bowl first, then cereal on top — it stops everything going soft at once.',
              'Milk around the edge, not over the middle.',
              'Berries and a tiny pinch of salt.',
              'Eat immediately. This dish has a two-minute window and everyone knows it.'] }
  ]);

  recipes('Sushi', [
    { name: 'Hand rolls, no mat needed', time: 45, serves: 2, level: 'Medium',
      ingredients: ['300g sushi rice', '3 tbsp rice vinegar', '1 tbsp sugar', 'Nori sheets', '200g sashimi-grade salmon or tuna', 'Cucumber, avocado', 'Soy, wasabi'],
      steps: ['Rinse the rice until the water runs clear, then cook it slightly dry.',
              'Fold vinegar, sugar and salt through while hot, using a slicing motion so the grains stay whole.',
              'Cool to body temperature — hot rice cooks the fish, cold rice cracks.',
              'Half a nori sheet, a smear of rice, fillings on a diagonal, roll into a cone.',
              'Eat as you make them. Hand rolls do not keep.'] }
  ]);

  recipes('Poke bowl', [
    { name: 'Fifteen minutes, no cooking', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['300g cooked rice', '250g sashimi-grade tuna or salmon', '2 tbsp soy', '1 tsp sesame oil', '1 tsp honey', 'Avocado, cucumber, edamame', 'Sesame seeds, spring onion'],
      steps: ['Cut the fish into 2cm cubes with a very sharp knife, against the grain.',
              'Dress it in soy, sesame oil and honey and leave 10 minutes — no longer, or it cures.',
              'Rice at the bottom, slightly warm, not hot.',
              'Arrange rather than mix, then scatter sesame and onion over.'] }
  ]);

  recipes('Caesar salad', [
    { name: 'Real dressing, real croutons', time: 25, serves: 2, level: 'Easy',
      ingredients: ['2 romaine hearts', '2 egg yolks', '4 anchovy fillets', '1 garlic clove', '1 tsp Dijon', 'Lemon', '150ml oil', '50g parmesan', 'Stale bread'],
      steps: ['Tear the bread, toss in oil and garlic, bake at 190C for 12 minutes.',
              'Mash the anchovies and garlic to a paste — this is the flavour, not a garnish.',
              'Whisk in yolks, mustard and lemon, then trickle the oil in slowly until thick.',
              'Dress the leaves in a big bowl with your hands so every one is coated.',
              'Parmesan and croutons last, so they stay crisp.'] }
  ]);

  recipes('Club sandwich', [
    { name: 'Three slices, cut in four', time: 20, serves: 1, level: 'Easy',
      ingredients: ['3 slices bread', '2 rashers bacon', '1 cooked chicken breast, sliced', 'Lettuce, tomato', 'Mayonnaise', 'Cocktail sticks'],
      steps: ['Toast all three slices and mayo every facing surface — dry bread is what makes a bad club.',
              'First layer: chicken, lettuce. Middle slice. Second layer: bacon, tomato.',
              'Press down firmly, then push a stick through each corner.',
              'Cut diagonally into four triangles. It genuinely tastes better this way.'] }
  ]);

  recipes('Cheese and crackers', [
    { name: 'Arranged with intent', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['3 cheeses — something hard, something soft, something blue', 'Crackers or oatcakes', 'Honey or chutney', 'Grapes or apple', 'Nuts'],
      steps: ['Take the cheese out of the fridge 30 minutes before. Cold cheese tastes of almost nothing.',
              'Three is the right number. Hard, soft, blue.',
              'Something sweet and something sharp beside it, plus something to crunch.',
              'Separate knives, or everything tastes of the blue.'] }
  ]);

  recipes('Charcuterie board', [
    { name: 'Built in five minutes', time: 15, serves: 4, level: 'Very easy',
      ingredients: ['3 cured meats', '2 cheeses', 'Cornichons and olives', 'Bread or crackers', 'Something sweet — figs, honey, quince', 'Almonds'],
      steps: ['Fold or ruffle the meat rather than laying it flat — it looks generous and eats better.',
              'Put the small bowls down first, then build around them.',
              'Leave no large empty gaps; fill with nuts and fruit.',
              'Serve at room temperature, and put out twice as much bread as you think.'] }
  ]);

  recipes('Gazpacho', [
    { name: 'Cold, sharp, blended smooth', time: 20, serves: 4, level: 'Very easy',
      ingredients: ['1kg ripe tomatoes', '1 cucumber', '1 green pepper', '1 garlic clove', '50g stale bread', '3 tbsp olive oil', '1 tbsp sherry vinegar'],
      steps: ['Use tomatoes that are almost too ripe. Underripe ones make it thin and sour.',
              'Soak the bread in water, squeeze out, and blend with everything else.',
              'Blend far longer than feels necessary — two full minutes — then trickle in the oil to emulsify.',
              'Chill at least 2 hours. Season again when cold; chilling flattens salt.'] }
  ]);

  recipes('Spring rolls', [
    { name: 'Fresh, in rice paper', time: 30, serves: 2, level: 'Easy',
      ingredients: ['8 rice paper wrappers', '100g vermicelli noodles', 'Cooked prawns or tofu', 'Lettuce, mint, coriander', 'Carrot, julienned', 'Peanut dipping sauce'],
      steps: ['Have everything ready before you wet a single wrapper. They wait for nobody.',
              'Dip a wrapper in warm water for 2 seconds only — it keeps softening on the board.',
              'Fillings just below centre, prawns pink-side down so they show through.',
              'Fold bottom up, sides in, roll tight. Keep under a damp cloth so they do not stick.'] }
  ]);

  recipes('Popcorn', [
    { name: 'On the hob, properly', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['80g popcorn kernels', '3 tbsp neutral oil', 'Fine salt'],
      steps: ['Heat the oil with three kernels in, lid on. When they pop, the oil is ready.',
              'Add the rest, take the pan off the heat for 30 seconds, then return it. They pop together this way.',
              'Shake the pan constantly, lid slightly ajar so steam escapes and it stays crisp.',
              'Melted butter and fine salt — coarse salt just falls to the bottom.'] }
  ]);

  recipes('Crisps', [
    { name: 'Oven crisps that actually crisp', time: 35, serves: 2, level: 'Easy',
      ingredients: ['3 large potatoes', '2 tbsp olive oil', 'Fine salt', 'Paprika or vinegar powder (optional)'],
      steps: ['Slice as thin as you possibly can — a peeler or mandoline, not a knife.',
              'Soak the slices in cold water 20 minutes to pull out starch, then dry completely.',
              'Toss in the barest film of oil and spread out so none overlap.',
              'Bake at 180C for 15–20 minutes, watching the last five like a hawk.'] }
  ]);

  recipes('Nuts', [
    { name: 'Warm spiced nuts', time: 15, serves: 4, level: 'Very easy',
      ingredients: ['300g mixed nuts', '1 tbsp olive oil', '1 tsp smoked paprika', '1 tsp rosemary, chopped', 'Flaky salt', 'Pinch of sugar'],
      steps: ['Toast the nuts dry at 180C for 8 minutes first, until they smell nutty.',
              'Toss straight from the oven with oil, spices, rosemary and salt.',
              'Back in for 3 minutes so it all sticks.',
              'Serve warm. Cold spiced nuts are just nuts.'] }
  ]);

  recipes('Pretzel', [
    { name: 'Soft pretzels, bicarb bath', time: 90, serves: 6, level: 'Medium',
      ingredients: ['400g strong flour', '250ml warm water', '7g instant yeast', '1 tsp salt', '60g bicarbonate of soda', 'Coarse salt'],
      steps: ['Knead a firm dough, prove 45 minutes until doubled.',
              'Roll each piece into a long rope, thin at the ends, and twist into shape.',
              'Boil briefly in water with the bicarb — 30 seconds a side. This is what makes it a pretzel and not bread.',
              'Egg wash, coarse salt, bake at 220C for 12–14 minutes until mahogany.'] }
  ]);

  recipes('Waffles', [
    { name: 'Crisp outside, soft in', time: 25, serves: 4, level: 'Easy',
      ingredients: ['250g plain flour', '2 tsp baking powder', '2 eggs, separated', '350ml buttermilk', '80g melted butter', '1 tbsp sugar'],
      steps: ['Whisk the whites to soft peaks separately — this is the only reason waffles beat pancakes.',
              'Mix everything else into a thick batter, then fold the whites through in two goes.',
              'Do not open the iron early. Wait for the steam to stop.',
              'Rest them on a rack, never stacked, or they steam themselves soggy.'] }
  ]);

  recipes('Crepes', [
    { name: 'Thin, lacy, rested', time: 45, serves: 4, level: 'Easy',
      ingredients: ['125g plain flour', '2 eggs', '300ml milk', '30g melted butter', 'Pinch of salt', 'Lemon and sugar, or chocolate spread'],
      steps: ['Blend everything smooth, then rest the batter 30 minutes. Unrested batter makes rubbery crepes.',
              'Hot pan, barely any butter, a small ladle swirled immediately to the edges.',
              'Flip when the edges lift and colour, about 45 seconds.',
              'The first one is always a write-off. That is the rule, not your fault.'] }
  ]);

  recipes('Churros', [
    { name: 'Choux-style, with chocolate', time: 40, serves: 4, level: 'Medium',
      ingredients: ['250ml water', '120g plain flour', '2 tbsp oil', 'Pinch of salt', 'Oil for frying', 'Caster sugar and cinnamon', '100g dark chocolate, 100ml oat milk'],
      steps: ['Boil the water and butter, tip in the flour off the heat and beat to a smooth ball.',
              'Cool 5 minutes, then beat in the egg until glossy.',
              'Pipe straight into 180C oil with a star nozzle, snipping with scissors.',
              'Fry 2 minutes a side, then roll in cinnamon sugar while hot.',
              'Chocolate melted into warm cream for dipping.'] }
  ]);

  recipes('Cinnamon roll', [
    { name: 'Overnight, baked for breakfast', time: 150, serves: 8, level: 'Medium',
      ingredients: ['500g strong flour', '7g instant yeast', '250ml warm milk', '60g sugar', '80g soft butter', '2 tbsp cinnamon', '150g brown sugar', 'Cream cheese icing'],
      steps: ['Knead a soft enriched dough and prove until doubled, about an hour.',
              'Roll into a rectangle, spread with butter, then cinnamon and brown sugar right to the edges.',
              'Roll tight and cut with dental floss, not a knife — a knife squashes them.',
              'Second prove in the tin, sides touching. Fridge overnight is fine and better.',
              'Bake at 180C for 25 minutes. Ice while just warm, not hot.'] }
  ]);

  recipes('Molten chocolate cake', [
    { name: 'The one that actually runs', time: 25, serves: 2, level: 'Medium',
      ingredients: ['100g dark chocolate', '100g butter', '2 eggs plus 1 yolk', '60g caster sugar', '30g plain flour', 'Cocoa for dusting'],
      steps: ['Butter the ramekins and dust with cocoa, not flour, so they turn out clean.',
              'Melt chocolate and butter together, cool slightly.',
              'Whisk eggs, yolk and sugar until thick and pale, then fold in chocolate, then flour.',
              'Bake at 200C for exactly 10–12 minutes. The edges set, the centre wobbles.',
              'Rest 60 seconds, then turn out. Every extra minute in the oven costs you the middle.'] }
  ]);

  recipes('Apple pie', [
    { name: 'Deep dish, no soggy bottom', time: 100, serves: 8, level: 'Medium',
      ingredients: ['350g plain flour', '175g cold butter', '1 egg', '1kg bramley apples', '120g sugar', '1 tsp cinnamon', '1 tbsp cornflour'],
      steps: ['Rub butter into flour to breadcrumbs, bind with egg and a splash of water. Rest 30 minutes cold.',
              'Cook the apples with sugar and cinnamon for 5 minutes first, then cool completely.',
              'Blind bake the base 15 minutes at 190C — this is the whole soggy-bottom problem solved.',
              'Cornflour through the filling to catch the juice, then lid on, sealed and vented.',
              'Bake 40 minutes. Rest an hour before cutting or it floods the plate.'] }
  ]);

  recipes('Rice pudding', [
    { name: 'Oven-baked, with skin', time: 130, serves: 4, level: 'Very easy',
      ingredients: ['100g pudding rice', '1L whole milk', '60g sugar', '25g butter', 'Grated nutmeg', 'Jam to serve'],
      steps: ['Butter a dish, add rice, sugar and milk, and stir once.',
              'Dot with butter and grate nutmeg over the top.',
              'Bake at 140C for two hours, undisturbed. Low and slow is the whole recipe.',
              'The brown skin is the best part. Do not stir it in.'] }
  ]);

  recipes('Ice cream', [
    { name: 'No-churn, two ingredients', time: 20, serves: 6, level: 'Very easy',
      ingredients: ['600ml double cream', '1 tin condensed milk', 'Vanilla, or cocoa, or crushed biscuits'],
      steps: ['Whip the cream to soft peaks — stop before it stiffens or it goes grainy.',
              'Fold in the condensed milk gently. No churning, no custard, no ice crystals.',
              'Ripple your flavour through at the end rather than mixing it fully.',
              'Freeze 6 hours in a shallow container. Out of the freezer 5 minutes before scooping.'] }
  ]);

  recipes('Frozen yoghurt', [
    { name: 'Blitzed from frozen fruit', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['400g frozen berries', '200g thick Greek yoghurt', '2 tbsp honey', 'Squeeze of lemon'],
      steps: ['Everything into a food processor straight from the freezer.',
              'Blitz, stopping to scrape down, until it turns suddenly smooth — about 90 seconds.',
              'Taste for sweetness; frozen fruit needs more honey than you expect.',
              'Eat now for soft-serve, or freeze 2 hours to scoop.'] }
  ]);

  recipes('Cheesecake', [
    { name: 'Baked vanilla, no cracks', time: 90, serves: 10, level: 'Medium',
      ingredients: ['250g digestive biscuits', '100g melted butter', '900g cream cheese, room temperature', '200g sugar', '3 eggs', '200ml soured cream', 'Vanilla'],
      steps: ['Crush the biscuits, mix with butter, press hard into the tin and chill.',
              'Beat the cheese and sugar on LOW. Air is what cracks a cheesecake.',
              'Add eggs one at a time, barely combining, then soured cream and vanilla.',
              'Bake at 160C in a water bath for 55 minutes. The centre should still wobble.',
              'Oven off, door ajar, leave an hour. Then fridge overnight. It cannot be rushed.'] }
  ]);

  recipes('Tiramisu', [
    { name: 'No-bake, overnight', time: 30, serves: 6, level: 'Easy',
      ingredients: ['3 eggs, separated', '500g mascarpone', '80g sugar', '300ml strong cold coffee', '2 tbsp marsala or rum', '200g savoiardi biscuits', 'Cocoa'],
      steps: ['Beat yolks and sugar pale, then fold in the mascarpone.',
              'Whip the whites separately to soft peaks and fold through — that is what keeps it light.',
              'Dip each biscuit in the coffee for one second. One. They keep drinking after you lift them.',
              'Layer biscuits, cream, biscuits, cream. Fridge at least 6 hours.',
              'Cocoa through a sieve only when serving, or it goes damp and bitter.'] }
  ]);

  recipes('Yoghurt parfait', [
    { name: 'Layered, in a glass', time: 8, serves: 1, level: 'Very easy',
      ingredients: ['200g thick yoghurt', '40g granola', 'Handful of berries', '1 tbsp honey', 'Lemon zest'],
      steps: ['Loosen the yoghurt with honey and a little lemon zest.',
              'Layer yoghurt, then fruit, then granola — and repeat, granola always last.',
              'Assemble immediately before eating; granola softens within minutes.',
              'A tall narrow glass makes the layers look deliberate.'] }
  ]);

  recipes('Popsicle', [
    { name: 'Real fruit, no ice shards', time: 10, serves: 6, level: 'Very easy',
      ingredients: ['500g ripe fruit', '3 tbsp sugar or honey', 'Squeeze of lime', 'Pinch of salt', '2 tbsp coconut milk (optional)'],
      steps: ['Blend the fruit with sugar, lime and salt, and taste it — it should be slightly too sweet.',
              'Freezing dulls sweetness by roughly a third. That is why shop lollies taste of nothing when they melt.',
              'A spoon of yoghurt or coconut milk stops big ice crystals forming.',
              'Freeze 4 hours. Run the mould under a warm tap for 10 seconds to release.'] }
  ]);

  recipes('Doughnut', [
    { name: 'Ring doughnuts, fried', time: 150, serves: 10, level: 'Medium',
      ingredients: ['500g strong flour', '7g instant yeast', '250ml warm milk', '50g sugar', '2 eggs', '60g soft butter', 'Oil for frying', 'Caster sugar to roll'],
      steps: ['Make a soft enriched dough, prove until doubled — about 90 minutes.',
              'Roll to 1.5cm, cut rings, and prove again on squares of baking paper for 30 minutes.',
              'Lower them into 175C oil on their paper, then peel it away. Handling proved dough deflates it.',
              'Fry 90 seconds a side, until they have a pale ring around the middle.',
              'Roll in sugar while hot.'] }
  ]);

  recipes('Chocolate bar', [
    { name: 'Fridge bark, no tempering', time: 20, serves: 8, level: 'Very easy',
      ingredients: ['300g dark chocolate', 'Flaky salt', 'Toasted nuts', 'Dried fruit or freeze-dried raspberry'],
      steps: ['Melt two-thirds of the chocolate gently, then stir in the last third off the heat until smooth.',
              'That last addition is a shortcut to a decent snap without a thermometer.',
              'Pour onto lined tray and spread thin.',
              'Scatter toppings before it sets, then chill 30 minutes and snap into shards.'] }
  ]);

  recipes('Coffee', [
    { name: 'Better cup, no machine', time: 6, serves: 1, level: 'Very easy',
      ingredients: ['18g coffee, medium grind', '300ml water just off the boil', 'Filter or cafetiere'],
      steps: ['Weigh the coffee if you can. Guessing is why cups differ every morning.',
              'Water at about 94C — boiling scorches it. Wait 30 seconds after the kettle.',
              'Pour a little first and wait 30 seconds for it to bloom and bubble.',
              'Then pour the rest slowly in circles. Four minutes total in a cafetiere.'] }
  ]);

  recipes('Iced coffee', [
    { name: 'Cold brew, overnight', time: 720, serves: 4, level: 'Very easy',
      ingredients: ['100g coarsely ground coffee', '1L cold water', 'Ice'],
      steps: ['Stir the grounds into cold water in a jar. Coarse grind only, or it turns muddy.',
              'Leave 12–18 hours at room temperature or in the fridge.',
              'Strain through a filter or muslin. It keeps a week.',
              'Serve over plenty of ice, diluted about half and half. It is concentrate, not coffee.'] }
  ]);

  recipes('Tea', [
    { name: 'Made properly', time: 5, serves: 1, level: 'Very easy',
      ingredients: ['1 teabag or 1 tsp loose leaf', 'Freshly drawn water'],
      steps: ['Fresh water, boiled once. Reboiled water is flat and it does show.',
              'Warm the pot or mug first if you care; it keeps the brew at temperature.',
              'Black tea: full boiling, 3–4 minutes. Green: wait two minutes off the boil, 2 minutes only.',
              'Squeezing the bag pushes out bitterness. Lift it out instead.'] }
  ]);

  recipes('Milkshake', [
    { name: 'Thick enough to stand a straw', time: 6, serves: 1, level: 'Very easy',
      ingredients: ['4 scoops ice cream', '80ml whole milk', 'Pinch of salt', 'Vanilla or cocoa or a handful of biscuits'],
      steps: ['Soften the ice cream 5 minutes on the counter first — blending frozen-hard just melts it.',
              'Far less milk than feels right. You can always add more.',
              'Blend in short bursts, not continuously, so it does not warm through.',
              'A pinch of salt makes it taste more of whatever it is.'] }
  ]);

  recipes('Bubble tea', [
    { name: 'Brown sugar milk tea', time: 30, serves: 2, level: 'Easy',
      ingredients: ['100g dried tapioca pearls', '100g brown sugar', '2 black tea bags', '300ml milk', 'Ice'],
      steps: ['Boil the pearls hard for 20 minutes, then rest off the heat 15 more. Undercooked pearls are chalky inside.',
              'Drain and steep them in brown sugar syrup while still hot.',
              'Brew the tea strong — double strength — and cool it.',
              'Pearls and syrup in the glass, ice, tea, then milk poured over the back of a spoon for the layers.'] }
  ]);

  recipes('Orange juice', [
    { name: 'Squeezed, with the pulp', time: 6, serves: 2, level: 'Very easy',
      ingredients: ['6 oranges', 'Pinch of salt', 'Ice'],
      steps: ['Roll each orange hard under your palm first — it breaks the segments and yields far more.',
              'Room-temperature fruit juices better than cold.',
              'Squeeze, and stop before you grind the white pith in; that is where the bitterness lives.',
              'A pinch of salt lifts it. Drink within the hour, before it turns dull.'] }
  ]);

  recipes('Lemonade', [
    { name: 'Proper still lemonade', time: 15, serves: 6, level: 'Very easy',
      ingredients: ['6 lemons', '150g sugar', '1L cold water', 'Mint', 'Ice'],
      steps: ['Make a syrup: sugar with 150ml water, warmed until clear, then cooled.',
              'Never add sugar straight to cold liquid — it sits at the bottom and never dissolves.',
              'Juice the lemons, combine with syrup and cold water, taste and adjust.',
              'Bruise the mint in your hands before adding. Chill an hour.'] }
  ]);

  recipes('Protein shake', [
    { name: 'Actually drinkable', time: 5, serves: 1, level: 'Very easy',
      ingredients: ['1 scoop protein powder', '250ml milk or oat milk', '1 frozen banana', '1 tbsp oats', '1 tsp peanut butter', 'Pinch of cinnamon'],
      steps: ['Liquid into the blender first, powder last — powder on the blades clumps every time.',
              'Frozen banana rather than ice, so it thickens instead of watering down.',
              'Oats and peanut butter make it actually hold you until lunch.',
              'Blend 30 seconds. Drink within a few minutes, before it thickens further.'] }
  ]);

  /* --------------------------------------------------------------- scaling */

  // A leading quantity: "150", "1.5", "1/4", or "1 1/2". Anything else — "Salt
  // to taste", "Butter, for the pan" — is left exactly as written, and so is
  // every number inside a step, so an oven stays at 200C when you double the
  // recipe.
  var QUANTITY = /^(\d+(?:\.\d+)?\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/;

  function parseQuantity(text) {
    var mixed = text.match(/^(\d+(?:\.\d+)?)\s+(\d+)\/(\d+)$/);
    if (mixed) return parseFloat(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    var fraction = text.match(/^(\d+)\/(\d+)$/);
    if (fraction) return Number(fraction[1]) / Number(fraction[2]);
    return parseFloat(text);
  }

  // Back to something a person would write on a list: grams and millilitres as
  // whole numbers, small counts to the nearest quarter, and quarters written as
  // fractions because "0.75 tsp" is nobody's handwriting.
  function formatQuantity(value) {
    if (!(value > 0) || !isFinite(value)) return null;
    if (value >= 10) return String(Math.round(value));

    var rounded = Math.max(0.25, Math.round(value * 4) / 4);
    var whole = Math.floor(rounded);
    var part = Math.round((rounded - whole) * 100) / 100;
    var frac = part === 0.25 ? '1/4' : part === 0.5 ? '1/2' : part === 0.75 ? '3/4' : '';

    if (!frac) return String(whole);
    return whole ? whole + ' ' + frac : frac;
  }

  function scaleLine(line, factor) {
    if (factor === 1) return line;
    var match = line.match(QUANTITY);
    if (!match) return line;

    var value = parseQuantity(match[1]);
    if (!(value > 0) || !isFinite(value)) return line;

    var text = formatQuantity(value * factor);
    if (text === null) return line;
    return text + line.slice(match[1].length);
  }

  // The ingredient list rewritten for a different number of servings.
  function scale(recipe, serves) {
    var base = recipe.serves || 1;
    var factor = (serves || base) / base;
    return recipe.ingredients.map(function (line) { return scaleLine(line, factor); });
  }

  /* ---- cooking from what you already have ---------------------------------

     "What can I make?" is a different question from "what do I fancy", and the
     honest way to answer it is off the ingredient lists rather than off the
     tags — a dish tagged `carby quick homemade` tells you nothing about whether
     there is rice in the cupboard.

     Matching is deliberately generous. An ingredient line is written for a
     person mid-cook — "1 onion, sliced", "150g plain flour", "Butter, for the
     pan" — and the thing a person has in their kitchen is the noun in the
     middle of that. So a line is reduced to its noun or two and matched loosely
     against what was typed. Getting this slightly wrong in the generous
     direction costs somebody a trip to the cupboard; getting it wrong in the
     strict direction means the feature never finds anything and nobody uses it
     twice.
     ------------------------------------------------------------------------- */

  // Things nobody counts as an ingredient. Assuming these are present is the
  // difference between "you can make an omelette" and "you can make an omelette
  // if you happen to own salt".
  var STAPLES = ['salt', 'pepper', 'water', 'oil', 'sugar', 'flour', 'butter'];

  // Words that describe a state rather than a thing. Stripping them is what
  // turns "1 large onion, finely sliced" into "onion".
  var NOISE = ['fresh', 'freshly', 'finely', 'roughly', 'thinly', 'thickly', 'large',
    'small', 'medium', 'ripe', 'plain', 'ground', 'chopped', 'sliced', 'diced',
    'grated', 'crushed', 'minced', 'good', 'plenty', 'pinch', 'handful', 'knob',
    'splash', 'drizzle', 'few', 'some', 'any', 'about', 'or', 'and', 'of', 'a',
    'an', 'the', 'to', 'for', 'with', 'taste', 'serve', 'garnish', 'optional',
    'extra', 'best', 'quality', 'day', 'old', 'cooked', 'raw', 'warm', 'cold',
    'hot', 'dried', 'tin', 'tinned', 'jar', 'packet', 'bunch', 'clove', 'cloves',
    'cup', 'cups', 'tbsp', 'tsp', 'g', 'kg', 'ml', 'l', 'slices', 'slice',
    'pieces', 'piece', 'thick', 'thin', 'into', 'plus', 'if', 'you', 'have',
    'from', 'per', 'person', 'each', 'in', 'on', 'at', 'it', 'them',
    'one', 'two', 'three', 'four', 'six', 'half', 'quarter', 'couple'];

  // Singular-ish. Not a stemmer — "tomatoes" and "tomato" have to meet, and
  // that is the whole job.
  function stem(word) {
    if (word.length > 4 && /ies$/.test(word)) return word.slice(0, -3) + 'y';
    if (word.length > 3 && /(ches|shes|ses|xes)$/.test(word)) return word.slice(0, -2);
    if (word.length > 3 && /s$/.test(word) && !/ss$/.test(word)) return word.slice(0, -1);
    return word;
  }

  // The words in a line that name something you might own.
  function nouns(line) {
    return String(line || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')          // "(or tofu)" is an aside, not a requirement
      .split(',')[0]                       // everything after the comma is preparation
      .replace(/[^a-z\s]/g, ' ')           // quantities, units stuck to numbers, punctuation
      .split(/\s+/)
      .filter(Boolean)
      .map(stem)
      .filter(function (word) {
        return word.length > 1 && NOISE.indexOf(word) === -1;
      });
  }

  // What somebody typed into the box, as a list of things.
  function readPantry(text) {
    return String(text || '')
      .toLowerCase()
      .split(/[,\n;]+/)
      .map(function (part) { return part.trim().replace(/[^a-z\s]/g, '').trim(); })
      .filter(Boolean)
      .map(function (part) {
        return part.split(/\s+/).map(stem).filter(function (w) {
          return w.length > 1 && NOISE.indexOf(w) === -1;
        }).join(' ');
      })
      .filter(Boolean);
  }

  // Have they got this line? A pantry entry matches when it shares a word with
  // the line's nouns, in either direction — "spring onion" should match "onion"
  // and "onions" should match "1 onion, sliced".
  function hasLine(line, pantry) {
    var words = nouns(line);
    if (!words.length) return true;                       // "Salt and pepper" alone
    if (words.every(function (w) { return STAPLES.indexOf(w) !== -1; })) return true;
    return pantry.some(function (entry) {
      var parts = entry.split(' ');
      return parts.some(function (part) {
        return words.some(function (word) {
          return word === part ||
            (word.length > 3 && part.length > 3 &&
              (word.indexOf(part) === 0 || part.indexOf(word) === 0));
        });
      });
    });
  }

  // Every bundled recipe scored against a cupboard, best first.
  //
  // Sorted by how close it is rather than by how much it uses, so a four-line
  // recipe you can start now beats a twelve-line one you have most of — which
  // is the answer to the question actually being asked.
  function fromPantry(text, limit) {
    var pantry = readPantry(text);
    if (!pantry.length) return [];

    var found = [];
    Object.keys(BOOK).forEach(function (dish) {
      BOOK[dish].forEach(function (recipe) {
        var missing = recipe.ingredients.filter(function (line) {
          return !hasLine(line, pantry);
        });
        var have = recipe.ingredients.length - missing.length;
        // A recipe you share one ingredient with is not a suggestion, it is
        // noise. Half is the point where "you could nearly make this" is true.
        if (have < Math.ceil(recipe.ingredients.length / 2)) return;
        found.push({
          dish: dish,
          recipe: recipe,
          have: have,
          total: recipe.ingredients.length,
          missing: missing
        });
      });
    });

    found.sort(function (a, b) {
      if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
      if (a.total !== b.total) return a.total - b.total;
      return a.recipe.time - b.recipe.time;
    });
    return found.slice(0, limit || 12);
  }

  /* ---- the rest of the world ---------------------------------------------- */

  recipes('Bibimbap', [
    { name: 'Whatever is in the fridge, arranged', time: 40, serves: 2, level: 'Medium',
      ingredients: ['300g cooked short-grain rice', '200g beef mince or firm tofu', '1 carrot, matchsticked',
                    '150g spinach', '150g beansprouts', '2 eggs', '2 tbsp gochujang', '1 tbsp sesame oil',
                    '2 cloves garlic', 'Soy sauce', 'Sesame seeds'],
      steps: ['Cook each vegetable separately and season each one separately. That is the whole discipline here — five things that taste of themselves.',
              'Blanch the spinach and beansprouts, squeeze them dry, dress with sesame oil, garlic and a pinch of salt.',
              'Fry the carrot briefly so it keeps its bite. Brown the beef hard with soy and a little sugar.',
              'Fry the eggs so the yolk is still loose; it becomes the sauce.',
              'Arrange in wedges on the rice rather than mixing — you want to see it before you wreck it.',
              'Gochujang on top. Now mix, hard, all the way to the bottom.'] }
  ]);

  recipes('Korean fried chicken', [
    { name: 'Fried twice, sauced late', time: 60, serves: 3, level: 'Medium',
      ingredients: ['800g chicken wings', '4 tbsp potato starch', '1 tsp salt', 'Oil for frying',
                    '3 tbsp gochujang', '2 tbsp honey', '2 tbsp soy sauce', '3 cloves garlic', '1 tbsp rice vinegar'],
      steps: ['Dry the wings properly and toss in salt and potato starch. Starch, not flour — it is what makes it glassy.',
              'Fry at 160C for 8 minutes. They will look pale and disappointing. Lift them out and rest 10 minutes.',
              'Fry again at 190C for 3 minutes. The second fry drives out the water the first one loosened, and is why it stays crisp under sauce.',
              'Warm the sauce ingredients together until glossy.',
              'Toss at the last possible second and eat immediately.'] }
  ]);

  recipes('Tteokbokki', [
    { name: 'Fifteen minutes, one pan', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['400g rice cakes', '500ml anchovy or vegetable stock', '3 tbsp gochujang',
                    '1 tbsp gochugaru', '1 tbsp sugar', '1 tbsp soy sauce', '2 spring onions'],
      steps: ['Soak the rice cakes 10 minutes if they are not fresh, or they stay chalky in the middle.',
              'Bring the stock to a boil and whisk in the pastes, sugar and soy.',
              'Add the rice cakes and simmer, stirring, until the sauce thickens and clings — about 8 minutes.',
              'It gets hotter as it reduces, so taste before you add more chilli.',
              'Spring onion over the top.'] }
  ]);

  recipes('Butter chicken', [
    { name: 'The gentle one', time: 60, serves: 4, level: 'Medium',
      ingredients: ['700g chicken thighs', '200g yoghurt', '2 tbsp garam masala', '1 tbsp ginger paste',
                    '1 tbsp garlic paste', '400g tin tomatoes', '80g butter', '150ml double cream',
                    '1 tsp kashmiri chilli', '1 tsp sugar'],
      steps: ['Marinate the chicken in yoghurt, half the spices, ginger and garlic. An hour will do; overnight is better.',
              'Blast the chicken under a hot grill until it takes colour. That char is most of the flavour.',
              'Cook the tomatoes down hard with the rest of the spices until they darken and split.',
              'Blend the sauce completely smooth, then push it through a sieve. Skipping the sieve is why home versions taste rough.',
              'Butter and cream in off the heat, then the chicken back. Do not boil it after the cream.'] }
  ]);

  recipes('Chana masala', [
    { name: 'Cheap, fast, ridiculously good', time: 30, serves: 4, level: 'Easy',
      ingredients: ['2 tins chickpeas', '1 onion', '400g tin tomatoes', '2 tsp cumin seeds',
                    '2 tsp ground coriander', '1 tsp turmeric', '1 tsp garam masala', '1 tbsp ginger',
                    '3 cloves garlic', '1 lemon'],
      steps: ['Toast the cumin seeds in oil until they pop. Everything else is built on that smell.',
              'Brown the onion properly — 10 minutes, not 3. Then ginger and garlic for one minute more.',
              'Ground spices in for 30 seconds only; they burn fast and turn bitter.',
              'Tomatoes in, cook until the oil separates out at the edges. That is the sign it is done.',
              'Chickpeas with a splash of their own liquid, simmer 10 minutes.',
              'Lemon at the end, off the heat. It lifts the whole thing.'] }
  ]);

  recipes('Masala dosa', [
    { name: 'Batter fermented overnight', time: 720, serves: 4, level: 'Hard',
      ingredients: ['200g rice', '70g urad dal', '1/2 tsp fenugreek seeds', '4 potatoes',
                    '1 tsp mustard seeds', '1 onion', '1 tsp turmeric', 'Curry leaves', 'Oil'],
      steps: ['Soak rice and dal separately for 6 hours, then grind each to a smooth batter and combine.',
              'Leave to ferment somewhere warm for 8–12 hours until it smells sour and has risen. This is the whole recipe; there is no shortcut.',
              'For the filling, pop mustard seeds in oil, add onion, turmeric and curry leaves, then crushed boiled potato.',
              'Get a flat pan properly hot, then wipe it with a halved onion dipped in oil — it seasons and stops sticking at once.',
              'Pour a ladle in the centre and spiral outwards fast. Do not touch it again.',
              'Oil round the edge, potato down the middle, fold when it lifts away on its own.'] }
  ]);

  recipes('Kabsa', [
    { name: 'One pot, in order', time: 90, serves: 5, level: 'Medium',
      ingredients: ['1kg chicken pieces', '400g basmati rice', '2 onions', '3 tomatoes',
                    '1 tbsp kabsa spice mix', '2 dried limes (loomi)', '4 cloves', '1 cinnamon stick',
                    'Handful of raisins and toasted almonds'],
      steps: ['Brown the chicken hard and set it aside. Everything after this cooks in what it left behind.',
              'Soften the onions, add tomato, spices, cloves and cinnamon.',
              'Pierce the dried limes and drop them in whole — they are what makes it taste like kabsa and not pilaf.',
              'Chicken back with water to cover, simmer 40 minutes, then lift the chicken out.',
              'Rinsed rice into the broth, measured: one and a half parts broth to one of rice. Lid on, lowest heat, 20 minutes, no peeking.',
              'Chicken back on top to warm through. Raisins and almonds over it at the table.'] }
  ]);

  recipes('Lahmacun', [
    { name: 'Thin as paper', time: 45, serves: 4, level: 'Medium',
      ingredients: ['300g strong flour', '180ml warm water', '1 tsp yeast', '250g lamb mince',
                    '1 onion', '1 pepper', '2 tomatoes', '1 tbsp pepper paste', 'Parsley', '2 lemons'],
      steps: ['Make a soft dough and leave it an hour. It wants to be slack, not tight.',
              'Blitz onion, pepper and tomato to a paste, squeeze out the water, then mix with the mince and pepper paste. Wet topping means soggy base.',
              'Roll each ball out until you can nearly see through it. Thinner than feels sensible.',
              'Spread the topping right to the edge, thinly.',
              'Hottest oven you have, on a preheated tray, 6–8 minutes.',
              'Parsley, a hard squeeze of lemon, roll it up and eat it with your hands.'] }
  ]);

  recipes('Manakish', [
    { name: 'Za’atar, oil, oven', time: 40, serves: 4, level: 'Easy',
      ingredients: ['300g flour', '180ml warm water', '1 tsp yeast', '1 tsp sugar',
                    '4 tbsp za’atar', '5 tbsp olive oil', 'Salt'],
      steps: ['Soft dough, one hour rise.',
              'Mix the za’atar with the oil to a loose paste. It should pour, not crumble.',
              'Flatten each ball to a rough round and dimple it all over with your fingers so the oil has somewhere to sit.',
              'Spread the za’atar oil thickly.',
              '220C for 10 minutes, until the base is set but the top is still glistening.'] }
  ]);

  recipes('Jollof rice', [
    { name: 'Smoky, and worth the argument', time: 70, serves: 5, level: 'Medium',
      ingredients: ['400g long-grain rice', '4 tomatoes', '2 red peppers', '1 scotch bonnet',
                    '2 onions', '3 tbsp tomato purée', '1 tsp thyme', '2 bay leaves', '500ml stock', 'Oil'],
      steps: ['Blend tomatoes, peppers, scotch bonnet and one onion into a smooth base.',
              'Fry the other onion, then the purée, for a good 5 minutes until it darkens.',
              'Add the blended base and cook it down hard — 15 to 20 minutes, until it is thick and the oil rises. Rushing this is why jollof tastes raw.',
              'Stock, thyme and bay in, then the washed rice. The liquid should sit just above the rice.',
              'Foil under the lid, lowest heat, 25 minutes, no stirring.',
              'Leave the bottom to catch slightly at the end. The smoky layer is the point, not a mistake.'] }
  ]);

  recipes('Tagine', [
    { name: 'Slow, sweet and savoury', time: 120, serves: 4, level: 'Easy',
      ingredients: ['800g lamb shoulder or chickpeas', '2 onions', '1 tsp ginger', '1 tsp cinnamon',
                    '1 tsp turmeric', 'Pinch of saffron', '150g dried apricots', '1 preserved lemon',
                    'Handful of almonds', 'Coriander'],
      steps: ['Brown the meat, then soften the onions in the same pot.',
              'Spices in with a splash of water so they bloom rather than burn.',
              'Barely cover with water, lid on, lowest heat, 90 minutes. It should tremble, never boil.',
              'Apricots in for the last 30 minutes so they swell without dissolving.',
              'Chopped preserved lemon at the very end — it is the sharp note the whole thing is balanced against.',
              'Toasted almonds and coriander over the top.'] }
  ]);

  recipes('Koshari', [
    { name: 'Carbohydrate on carbohydrate', time: 60, serves: 4, level: 'Medium',
      ingredients: ['200g rice', '150g brown lentils', '100g small pasta', '1 tin chickpeas',
                    '3 onions', '400g passata', '2 tbsp vinegar', '1 tsp cumin', '1 tsp chilli', 'Oil'],
      steps: ['Slice the onions thinly and fry them slowly until deep brown and crisp. Take your time; they are the best part.',
              'Cook lentils, rice and pasta separately. Together they turn to paste.',
              'For the sauce, cook passata with cumin, chilli and a good slug of vinegar until sharp.',
              'Layer: lentils, rice, pasta, chickpeas.',
              'Sauce over, fried onions on top, in that order. Mix at the table.'] }
  ]);

  recipes('Doro wat', [
    { name: 'The onions take an hour', time: 150, serves: 4, level: 'Hard',
      ingredients: ['6 chicken legs', '1kg red onions', '4 tbsp berbere', '100g spiced butter',
                    '1 tbsp ginger', '4 cloves garlic', '4 hard-boiled eggs', '2 tbsp water'],
      steps: ['Chop the onions finely and cook them dry, no fat, on a low heat for a full hour. They collapse into a paste. This is the recipe.',
              'Only then add the butter, garlic and ginger.',
              'Berbere in and cook it out for 10 minutes — raw berbere tastes dusty.',
              'Chicken in, barely covered, 45 minutes on low.',
              'Score the eggs and add them for the last 15 minutes so they take on colour.',
              'Serve on injera, no cutlery.'] }
  ]);

  recipes('Feijoada', [
    { name: 'Beans and everything else', time: 180, serves: 6, level: 'Medium',
      ingredients: ['500g black beans', '300g smoked pork', '200g chorizo', '200g beef',
                    '2 onions', '4 cloves garlic', '2 bay leaves', '2 oranges', 'Rice and greens to serve'],
      steps: ['Soak the beans overnight. Salted meats too, if they are very salty — change the water twice.',
              'Simmer the beans with bay for an hour before anything else joins them.',
              'Brown the meats, soften onion and garlic, then everything into the bean pot.',
              'Two more hours on the lowest heat. It is done when the broth is dark and thick without any flour.',
              'Mash a ladle of beans against the side and stir back in to thicken.',
              'Orange slices alongside. They cut through it, and that is not optional.'] }
  ]);

  recipes('Jerk chicken', [
    { name: 'Marinated hard, cooked slow', time: 90, serves: 4, level: 'Medium',
      ingredients: ['8 chicken thighs', '4 scotch bonnets', '1 bunch spring onions', '2 tbsp allspice',
                    '1 tbsp thyme', '2 tbsp brown sugar', '3 tbsp soy sauce', '1 lime', '1 tsp cinnamon', '1 tsp nutmeg'],
      steps: ['Blend everything except the chicken into a wet paste. Wear gloves for the scotch bonnets, seriously.',
              'Score the chicken and marinate at least 4 hours, overnight if you can.',
              'Cook it slowly first — 45 minutes at 180C, covered.',
              'Then hot and direct at the end for the char. Under a grill is fine if there is no fire.',
              'Rest it, then chop through the bone the way it is sold on the roadside.'] }
  ]);

  recipes('Pierogi', [
    { name: 'Boiled, then fried in butter', time: 90, serves: 4, level: 'Medium',
      ingredients: ['300g flour', '1 egg', '120ml warm water', '4 potatoes', '200g twaróg or ricotta',
                    '2 onions', '80g butter', 'Salt and pepper', 'Soured cream'],
      steps: ['Dough of flour, egg, water and salt. Knead 8 minutes, then rest it 30 — unrested dough tears when you fill it.',
              'Mash the potato with the cheese and a good amount of fried onion. Season it harder than seems right; the dough is bland.',
              'Roll thin, cut circles, fill, and seal with a dry finger. Wet edges will not hold.',
              'Boil until they float, then two minutes more.',
              'Now fry them in butter with the rest of the onion until the edges catch. Boiled alone is fine; fried is why people love them.',
              'Soured cream on the side.'] }
  ]);

  recipes('Nasi goreng', [
    { name: 'Yesterday’s rice, improved', time: 20, serves: 2, level: 'Easy',
      ingredients: ['400g cold cooked rice', '2 eggs', '2 shallots', '3 cloves garlic',
                    '2 tbsp kecap manis', '1 tbsp sambal oelek', '1 tsp shrimp paste', 'Spring onion', 'Cucumber'],
      steps: ['The rice must be cold and preferably a day old. Fresh rice steams instead of frying, every time.',
              'Pound shallots, garlic, sambal and shrimp paste to a rough paste.',
              'Fry the paste in hot oil until it smells cooked rather than sharp — about 2 minutes.',
              'Rice in, break it up, and leave it alone in between stirs so it catches.',
              'Kecap manis round the edge of the pan so it caramelises before it hits the rice.',
              'Fried egg on top, crisp at the edges, yolk soft. Cucumber alongside.'] }
  ]);

  recipes('Laksa', [
    { name: 'Coconut, chilli, noodles', time: 45, serves: 3, level: 'Medium',
      ingredients: ['3 tbsp laksa paste', '400ml coconut milk', '500ml stock', '200g rice noodles',
                    '200g prawns', '2 fried tofu puffs', '2 eggs', 'Beansprouts', '1 lime', 'Coriander'],
      steps: ['Fry the paste in oil for 3 minutes until it darkens and the oil splits out.',
              'Coconut milk and stock in. Simmer gently — a hard boil splits coconut milk.',
              'Taste and balance: it wants to be salty, sweet, sour and hot all at once. Adjust with fish sauce, sugar and lime.',
              'Cook the noodles separately and put them in the bowl, not the pot.',
              'Prawns in the broth for 2 minutes only.',
              'Ladle over, then beansprouts, halved egg, tofu, coriander and more lime.'] }
  ]);

  recipes('Chicken satay', [
    { name: 'Charred on sticks', time: 45, serves: 4, level: 'Easy',
      ingredients: ['600g chicken thigh', '1 tbsp turmeric', '1 tbsp coriander seed', '2 shallots',
                    '2 cloves garlic', '1 tbsp sugar', '150g peanut butter', '200ml coconut milk',
                    '1 tbsp sambal', '1 lime'],
      steps: ['Cut the chicken small and marinate in blitzed shallot, garlic, turmeric, coriander and sugar for an hour.',
              'Soak wooden skewers, or they burn through before the chicken cooks.',
              'Thread loosely. Packed tight, the middle steams.',
              'Grill hot and fast, turning often. The sugar wants to catch, not burn.',
              'For the sauce, warm peanut butter, coconut milk and sambal with a splash of water until it pours.',
              'Lime over the skewers, sauce on the side for dipping.'] }
  ]);

  recipes('Chicken adobo', [
    { name: 'Four things and no notes', time: 50, serves: 4, level: 'Very easy',
      ingredients: ['1kg chicken thighs', '120ml cane or white vinegar', '120ml soy sauce',
                    '1 whole head of garlic', '3 bay leaves', '1 tsp black peppercorns'],
      steps: ['Put everything in a pot cold. No browning, no oil.',
              'Bring to a boil and then do not stir for 5 minutes — letting the vinegar cook off its edge before you disturb it is the one rule.',
              'Lid off, simmer 30 minutes until the sauce reduces and turns glossy.',
              'Lift the chicken out and fry it briefly in its own fat if you want the skin crisp.',
              'Reduce the sauce further and pour it back over. Rice underneath.'] }
  ]);

  recipes('Plov', [
    { name: 'Made for a crowd', time: 100, serves: 6, level: 'Medium',
      ingredients: ['800g lamb shoulder', '500g long-grain rice', '4 carrots', '2 onions',
                    '1 whole head of garlic', '1 tbsp cumin seed', '1 tsp barberries', 'Oil'],
      steps: ['Cut the carrots into thick batons, never grated. Grated carrot dissolves and the whole thing goes sweet and mushy.',
              'Brown the lamb hard in a wide heavy pot, then onions, then carrots on top.',
              'Cumin and barberries in, water to cover, and simmer 40 minutes. This broth is called zirvak and it is the flavour of the dish.',
              'Rinse the rice until the water runs clear and lay it on top without stirring.',
              'Add water to sit two fingers above the rice. Bury the whole garlic head in the middle.',
              'Lid on, lowest heat, 25 minutes. Turn it out upside down so the meat ends up on top.'] }
  ]);

  recipes('Mapo tofu', [
    { name: 'Numbing, not just hot', time: 25, serves: 2, level: 'Easy',
      ingredients: ['400g silken tofu', '150g pork mince or mushrooms', '2 tbsp doubanjiang',
                    '1 tsp fermented black beans', '1 tsp sichuan peppercorns', '200ml stock',
                    '1 tbsp cornflour', '2 spring onions', 'Rice to serve'],
      steps: ['Cut the tofu into cubes and slip them into salted simmering water while you cook. It firms them just enough to survive the pan.',
              'Toast the peppercorns dry, then grind. Adding them whole means somebody gets all of it at once.',
              'Brown the mince, then fry the doubanjiang in the fat until the oil turns red.',
              'Stock in, then the drained tofu. Push it around with the back of a spoon rather than stirring, or it breaks up.',
              'Thicken with cornflour slurry in two goes.',
              'Ground peppercorn and spring onion over at the end, off the heat.'] }
  ]);

  recipes('Bao buns', [
    { name: 'Steamed and pillowy', time: 150, serves: 4, level: 'Hard',
      ingredients: ['300g plain flour', '1 tsp yeast', '1 tbsp sugar', '150ml warm milk',
                    '1 tbsp oil', '1/2 tsp baking powder', '500g pork belly', '2 tbsp hoisin', 'Cucumber', 'Spring onion'],
      steps: ['Make a soft dough and prove an hour until doubled.',
              'Knock back, work in the baking powder, and rest 15 minutes. The double raise is what makes them cloud-like.',
              'Roll ovals, brush one half with oil, fold over a chopstick and lift it out. The oil stops them sealing shut.',
              'Prove again on squares of paper for 30 minutes.',
              'Steam 10 minutes and do not lift the lid — a draught collapses them.',
              'Braise the pork belly slowly with hoisin meanwhile. Fill with cucumber and spring onion.'] }
  ]);

  recipes('Banh mi', [
    { name: 'A French loaf that emigrated', time: 30, serves: 2, level: 'Easy',
      ingredients: ['1 baguette', '200g pork or pâté', '1 carrot', '1 daikon or radish',
                    '3 tbsp rice vinegar', '2 tbsp sugar', 'Coriander', 'Cucumber', 'Mayonnaise', 'Chilli'],
      steps: ['Pickle the carrot and daikon at least an hour ahead in vinegar, sugar and salt. Without the pickle it is just a sandwich.',
              'Warm the baguette so the crust cracks and the inside stays soft.',
              'Pull out some of the crumb to make room. An overfull banh mi falls apart on the first bite.',
              'Mayonnaise on both sides, then pâté, then the meat.',
              'Pickle, cucumber, coriander and chilli. Press it shut and cut on the diagonal.'] }
  ]);

  recipes('Fattoush', [
    { name: 'Sharp, herby, and the bread matters', time: 20, serves: 4, level: 'Very easy',
      ingredients: ['2 pittas', '3 tomatoes', '1 cucumber', '1 baby gem', '4 radishes',
                    'Handful of mint and parsley', '1 tbsp sumac', '1 lemon', '4 tbsp olive oil', '1 tsp pomegranate molasses'],
      steps: ['Tear the pitta and fry or bake it until properly crisp. Soft bread makes it a wet salad.',
              'Chop everything roughly and about the same size.',
              'Dress with lemon, oil, sumac and pomegranate molasses. Taste — it should be sharper than you expect.',
              'Add the bread at the very last moment, at the table if you can.'] }
  ]);

  recipes('Ceviche', [
    { name: 'Cooked by lime', time: 25, serves: 3, level: 'Easy',
      ingredients: ['500g very fresh white fish', '10 limes', '1 red onion', '1 chilli',
                    'Coriander', '1 sweet potato', 'Salt'],
      steps: ['The fish has to be sashimi-grade and bought today. There is no cooking to hide behind.',
              'Cut it into even 2cm cubes so it firms at the same rate.',
              'Slice the onion paper-thin and rinse it in cold water to take the harshness out.',
              'Salt the fish first, then the lime juice. Salting after makes it watery.',
              'Ten to fifteen minutes only. Longer and it goes from firm to chalky.',
              'Chilli and coriander in at the end, boiled sweet potato alongside.'] }
  ]);

  recipes('Arepas', [
    { name: 'Warm maize pockets', time: 30, serves: 4, level: 'Easy',
      ingredients: ['250g masarepa (precooked maize flour)', '400ml warm water', '1 tsp salt',
                    'Something to fill them with'],
      steps: ['Only masarepa works — ordinary cornmeal or polenta will not hydrate the same way.',
              'Stir the flour into the salted water and let it sit 5 minutes to swell.',
              'Knead until it stops cracking at the edges when you flatten a ball. If it cracks, add water a spoon at a time.',
              'Form discs about 1cm thick. Griddle 5 minutes a side until a crust forms and it sounds hollow.',
              'Finish in the oven 10 minutes if they are thick.',
              'Split like a pitta while hot, then fill — black beans, avocado, shredded chicken or cheese, whichever you are in the mood for.'] }
  ]);

  recipes('Empanadas', [
    { name: 'Pastry, filling, crimped edge', time: 75, serves: 5, level: 'Medium',
      ingredients: ['400g flour', '100g cold butter', '1 egg', '120ml cold water', '1 tsp salt',
                    '400g beef mince', '2 onions', '1 tsp cumin', '1 tsp paprika', '2 boiled eggs', 'Olives'],
      steps: ['Rub the butter into the flour, bring together with egg and cold water, and rest an hour in the fridge.',
              'Cook the filling and then cool it completely. Warm filling melts the pastry and they burst.',
              'Chop the boiled egg and olives through it — that salty bite is what makes it taste right.',
              'Cut discs, fill, wet the edge and fold. Crimp firmly, however you like.',
              'Egg wash, 200C, 20–25 minutes until deep gold.'] }
  ]);

  recipes('Baklava', [
    { name: 'Hot pastry, cold syrup', time: 90, serves: 12, level: 'Medium',
      ingredients: ['400g filo pastry', '300g pistachios or walnuts', '250g butter, melted',
                    '300g sugar', '250ml water', '1 tbsp lemon juice', '1 tbsp honey'],
      steps: ['Make the syrup first and let it cool completely. Hot pastry and cold syrup, or the other way round — never both hot, or it goes soggy.',
              'Butter every single sheet. Tedious, and the whole reason it shatters.',
              'Half the sheets, then the nuts, then the rest.',
              'Cut it into diamonds before it goes in the oven. Afterwards it shatters instead of slicing.',
              '170C for 45 minutes until deep gold all the way through.',
              'Pour the cold syrup over the hot tray and leave it several hours. Overnight is better.'] }
  ]);

  recipes('Pastel de nata', [
    { name: 'Burnt on top on purpose', time: 60, serves: 12, level: 'Hard',
      ingredients: ['1 roll puff pastry', '250ml milk', '200g sugar', '100ml water',
                    '25g flour', '6 egg yolks', '1 cinnamon stick', '1 lemon peel'],
      steps: ['Roll the pastry into a tight log, cut discs, and press each one out from the middle with your thumbs. The spiral is what makes the layers stand up.',
              'Boil the sugar and water to 100C with cinnamon and lemon peel.',
              'Whisk flour into cold milk, then pour the hot syrup in slowly while whisking.',
              'Off the heat, whisk in the yolks. Never let it boil after this or it scrambles.',
              'Fill the cases only three-quarters full.',
              'The hottest your oven will go, 250C or more, for 12 minutes. The black blisters on top are correct.'] }
  ]);

  recipes('Mango lassi', [
    { name: 'Thick and cold', time: 5, serves: 2, level: 'Very easy',
      ingredients: ['2 ripe mangoes or 300g pulp', '300g full-fat yoghurt', '100ml milk',
                    '1 tbsp sugar', 'Pinch of cardamom', 'Ice'],
      steps: ['Use ripe mango or tinned pulp. Underripe mango makes it stringy and sour.',
              'Blend everything except the ice until completely smooth.',
              'Add ice last and blend briefly, or it turns watery.',
              'Cardamom is the difference between a mango smoothie and a lassi. Do not skip it.'] }
  ]);

  recipes('Mint tea', [
    { name: 'Poured from a height', time: 10, serves: 4, level: 'Very easy',
      ingredients: ['1 tbsp gunpowder green tea', '1 large bunch of fresh mint', '4 tbsp sugar', '1L water'],
      steps: ['Rinse the tea leaves with a splash of boiling water and pour it away. It takes the bitterness off.',
              'Fill with boiling water and steep 3 minutes, no longer.',
              'Push the mint down into the pot and add the sugar.',
              'Pour a glass, return it to the pot, and repeat three times to mix without stirring.',
              'Pour from as high as you dare. The foam on top is the point.'] }
  ]);

  /* ---- the second intake ------------------------------------------------
     One route each, written the same way as the rest: metric, rough, and a
     prompt to start cooking rather than a reference text. */

  recipes('Birria tacos', [
    { name: 'The shortcut stew', time: 150, serves: 4, level: 'Worth the wait',
      ingredients: ['1kg beef shin or chuck, in big pieces', '4 dried chillies, stems out', '1 onion, halved', '4 garlic cloves', '1 tsp cumin', '1 tsp oregano', '1 cinnamon stick', 'Corn tortillas', 'Grated cheese, coriander, lime'],
      steps: ['Cover the chillies in boiling water for 15 minutes, then blend with the onion, garlic, cumin and oregano and a ladle of the soaking water.',
              'Brown the beef hard in a heavy pot. Pour the paste over, add the cinnamon and enough water to almost cover.',
              'Lid on, lowest heat, two hours, until it falls apart. Shred the meat and keep the broth.',
              'Dip a tortilla in the red fat on top of the broth, griddle it, fill with meat and cheese, fold and crisp both sides.',
              'Serve with a bowl of the broth for dipping. That is the whole point.'] }
  ]);

  recipes('Khao soi', [
    { name: 'Northern curry noodles', time: 35, serves: 2, level: 'Easy',
      ingredients: ['200g egg noodles, plus a handful extra to fry', '2 tbsp red curry paste', '1 tsp curry powder', '400ml coconut milk', '300ml chicken stock', '2 chicken thighs, sliced', 'Fish sauce, lime, sugar', 'Shallot and pickles, to finish'],
      steps: ['Fry the spare noodles in a little oil until they puff and go gold. Drain and set aside.',
              'Fry the paste and curry powder in a splash of the thick coconut cream for a minute, until it smells like more than paste.',
              'Add the chicken, then the rest of the coconut milk and the stock. Simmer 12 minutes.',
              'Season with fish sauce, a squeeze of lime and a pinch of sugar until it tastes sharp as well as rich.',
              'Boil the soft noodles, bowl them, ladle over, and pile the crisp ones on top with shallot and pickles.'] }
  ]);

  recipes('Okonomiyaki', [
    { name: 'Cabbage pancake', time: 25, serves: 2, level: 'Easy',
      ingredients: ['150g plain flour', '120ml dashi or light stock', '2 eggs', '400g white cabbage, shredded fine', '2 spring onions', 'Oil', 'Brown sauce and mayonnaise, to finish'],
      steps: ['Whisk the flour, stock and eggs to a thick batter and rest it 10 minutes.',
              'Fold in the cabbage and spring onions. It should look like far too much cabbage for the batter. It is not.',
              'Oil a pan on medium, spoon in half the mix and shape it into a thick round. Lid on, 6 minutes.',
              'Flip once — commit, do not dither — and give it 5 more minutes uncovered.',
              'Zigzag with sauce and mayo. Repeat for the second one.'] }
  ]);

  recipes('Rendang', [
    { name: 'Dry beef curry', time: 180, serves: 4, level: 'Worth the wait',
      ingredients: ['800g beef shin, cubed', '400ml coconut milk', '6 shallots', '4 garlic cloves', 'Thumb of ginger and galangal', '3 red chillies', '1 lemongrass stalk, bruised', '3 kaffir lime leaves', '1 tsp turmeric'],
      steps: ['Blend the shallots, garlic, ginger, galangal, chillies and turmeric to a paste.',
              'Fry the paste in oil until it darkens and stops smelling raw, about 8 minutes.',
              'Add the beef, coconut milk, lemongrass and lime leaves. Bring up, then drop to the barest simmer.',
              'Leave it two to three hours, uncovered, stirring now and then. The liquid goes from soup to sauce to a coating.',
              'It is done when the oil separates and the beef is dark. Do not stop early — that is a curry, not a rendang.'] }
  ]);

  recipes('Hainanese chicken rice', [
    { name: 'Poached and quiet', time: 60, serves: 4, level: 'Not hard, just fussy',
      ingredients: ['1 whole chicken', 'Thumb of ginger, sliced', '4 spring onions', '300g jasmine rice', '2 garlic cloves, minced', 'Sesame oil', 'Soy, chilli and ginger, for the sauces'],
      steps: ['Sit the chicken in a pot with the ginger and spring onions, cover with water, bring to a bare tremble.',
              'Poach 35 minutes at that tremble — never a boil — then lift it out into iced water for 5 minutes. That is what makes the skin.',
              'Keep the stock. Fry the rice with the garlic in a little sesame oil, then cook it in the stock instead of water.',
              'Joint the chicken. Serve on the rice with a bowl of the remaining stock.',
              'Make two sauces: soy with a little sesame, and chilli pounded with ginger. Both, not one.'] }
  ]);

  recipes('Paella', [
    { name: 'One pan, no stirring', time: 45, serves: 4, level: 'Easy',
      ingredients: ['300g paella or bomba rice', '900ml hot stock', 'Pinch of saffron', '200g prawns', '200g chicken thigh, diced', '1 onion, 2 garlic cloves', '1 red pepper', '100g green beans', 'Smoked paprika'],
      steps: ['Brown the chicken in a wide shallow pan, then the pepper and beans, then the onion and garlic.',
              'Stir in the paprika and rice for a minute so every grain is coated.',
              'Pour in the hot stock with the saffron. Spread everything flat and then do not stir it again.',
              'Simmer 18 minutes, adding the prawns for the last 5.',
              'Turn the heat up for a final minute to catch the bottom — the crust is the best part — then rest it off the heat for 5.'] }
  ]);

  recipes('Risotto', [
    { name: 'Creamy without cream', time: 30, serves: 2, level: 'Easy',
      ingredients: ['180g arborio rice', '1 litre hot stock', '1 shallot, minced', '100ml white wine', '40g butter', '40g parmesan', 'Olive oil'],
      steps: ['Soften the shallot in oil without colouring it. Add the rice and toast 2 minutes until the edges go translucent.',
              'Wine in, let it vanish.',
              'Add hot stock a ladle at a time, stirring, waiting for each to be almost gone before the next. About 18 minutes.',
              'Taste for bite. It should be loose enough to spread slowly on a tilted plate.',
              'Off the heat, beat in the cold butter and the parmesan hard. That is where the creaminess comes from.'] }
  ]);

  recipes('Carbonara', [
    { name: 'Four ingredients, no cream', time: 20, serves: 2, level: 'Easy',
      ingredients: ['200g spaghetti', '100g guanciale or pancetta, cubed', '2 eggs plus 1 yolk', '50g pecorino, grated', 'Black pepper, lots'],
      steps: ['Render the guanciale slowly in a cold dry pan until the fat runs and the edges crisp.',
              'Boil the pasta. Beat the eggs with the pecorino and a great deal of pepper.',
              'Drag the drained pasta into the pan of fat, off the heat. Wait thirty seconds — this is the step everyone skips.',
              'Pour in the egg mixture and toss hard, adding splashes of pasta water until it turns glossy.',
              'If it scrambles, the pan was too hot. Nothing to do but eat it and go again.'] }
  ]);

  recipes('Moussaka', [
    { name: 'The proper bake', time: 105, serves: 6, level: 'A project',
      ingredients: ['3 aubergines, sliced', '500g lamb mince', '1 onion, 3 garlic cloves', '400g chopped tomatoes', '1 tsp cinnamon', '50g butter, 50g flour, 600ml milk', '1 tsp cornflour', '60g cheese'],
      steps: ['Salt the aubergine slices for 20 minutes, pat dry, then griddle or roast until soft and bronzed.',
              'Brown the lamb with the onion and garlic. Add tomatoes and cinnamon and cook down 25 minutes until thick, not wet.',
              'Make a béchamel: butter, flour, then milk in slowly. Off the heat, beat in the yolk and half the cheese.',
              'Layer aubergine, lamb, aubergine, then all the sauce. Rest of the cheese over.',
              'Bake at 180C for 40 minutes. Then leave it 20 minutes before cutting or it will run away from you.'] }
  ]);

  recipes('Schnitzel', [
    { name: 'Thin, gold, lemon', time: 25, serves: 2, level: 'Easy',
      ingredients: ['2 pork or chicken escalopes', '60g flour', '2 eggs, beaten', '120g fine breadcrumbs', 'Oil or clarified butter, for frying', 'Lemon'],
      steps: ['Put each escalope between two sheets and beat it out to about 5mm. Thinner than feels right.',
              'Flour, then egg, then crumbs — press the crumbs on lightly rather than packing them.',
              'Shallow fry in 1cm of hot fat, about 2 minutes a side, spooning fat over so the coating puffs away from the meat.',
              'Drain briefly on paper. Lemon over it at the table, not before.'] }
  ]);

  recipes('Croque monsieur', [
    { name: 'The grown-up toastie', time: 20, serves: 2, level: 'Easy',
      ingredients: ['4 slices of good white bread', '4 slices of ham', '100g gruyère, grated', '20g butter, 20g flour, 250ml milk', 'Dijon mustard', 'Nutmeg'],
      steps: ['Make a small thick béchamel and season it with mustard and a scrape of nutmeg.',
              'Butter the bread on the outside. Inside: a smear of sauce, ham, some cheese.',
              'Fry both sides in a pan until deep gold.',
              'Move to a tray, blanket the tops with the rest of the sauce and cheese, and grill until it blisters.'] }
  ]);

  recipes('Chilaquiles', [
    { name: 'Breakfast from leftovers', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['A big bag of tortilla chips, or yesterday\'s tortillas fried', '400g chopped tomatoes', '2 chipotle chillies in adobo', '1 onion, 2 garlic cloves', '2 eggs', 'Feta or queso fresco, coriander, soured cream'],
      steps: ['Blend the tomatoes with the chipotles, onion and garlic. Fry the lot in oil for 8 minutes until it darkens and thickens.',
              'Fry the eggs, however you like them.',
              'Tip the chips into the sauce and fold twice. Twice — any more and they go to mush.',
              'Straight onto plates, eggs on top, then cheese, coriander and cream. Eat immediately; this dish does not wait.'] }
  ]);

  recipes('Elote', [
    { name: 'Corn, done properly', time: 15, serves: 4, level: 'Very easy',
      ingredients: ['4 corn cobs', '4 tbsp mayonnaise', '60g feta or cotija, crumbled fine', 'Chilli powder', '2 limes', 'Butter'],
      steps: ['Griddle or barbecue the cobs dry, turning, until properly charred in patches — not merely warm.',
              'Rub with butter while hot, then paint with mayonnaise.',
              'Roll in the cheese so it sticks all over.',
              'Chilli powder, then lime squeezed over the top. Eat over a plate.'] }
  ]);

  recipes('Pupusas', [
    { name: 'Stuffed and griddled', time: 40, serves: 4, level: 'Easy',
      ingredients: ['400g masa harina', '500ml warm water', '200g mozzarella or queso, grated', '200g refried beans', 'Oil'],
      steps: ['Mix the masa and water to a soft dough like plasticine. Rest 10 minutes.',
              'Roll golf balls, press a hollow in each, fill with cheese and beans, then close the dough over and flatten gently to a disc.',
              'Dry griddle on medium for 4 minutes a side until freckled and puffed.',
              'Serve with something sharp and pickled — curtido if you have it, vinegary slaw if you do not.'] }
  ]);

  recipes('Congee', [
    { name: 'Rice cooked to a whisper', time: 75, serves: 4, level: 'Very easy',
      ingredients: ['150g jasmine rice', '2 litres chicken or vegetable stock', 'Thumb of ginger, sliced', 'Spring onions', 'Soy sauce, sesame oil', 'Whatever tops it: egg, chicken, peanuts, chilli oil'],
      steps: ['Rinse the rice until the water runs clear.',
              'Simmer it in the stock with the ginger, lid ajar, for an hour. Stir occasionally so the bottom does not catch.',
              'It is ready when the grains have collapsed and it pours like thick cream. Loosen with more stock if it goes past that.',
              'Season at the end with soy and sesame. Top with anything — the plainness underneath is the point.'] }
  ]);

  recipes('Japchae', [
    { name: 'Glass noodles with snap', time: 30, serves: 4, level: 'Easy',
      ingredients: ['200g sweet potato glass noodles', '1 carrot, 1 onion, 1 pepper, all in strips', '100g spinach', '3 tbsp soy sauce', '1 tbsp sugar', '2 tbsp sesame oil', 'Sesame seeds'],
      steps: ['Boil the noodles 6 minutes, rinse cold, then cut through the tangle a few times with scissors.',
              'Fry each vegetable separately and briefly, so each keeps its own texture. This is the whole technique.',
              'Wilt the spinach last, squeeze it dry.',
              'Toss everything with soy, sugar and sesame oil while still warm. Sesame seeds over. Good hot or at room temperature.'] }
  ]);

  recipes('Souvlaki', [
    { name: 'Wrapped, with the chips inside', time: 35, serves: 4, level: 'Easy',
      ingredients: ['600g pork shoulder or chicken thigh, cubed', 'Olive oil, lemon, oregano, garlic', '4 pitta breads', 'Tzatziki', 'Tomato, red onion', 'Chips'],
      steps: ['Marinate the meat in oil, lemon, plenty of oregano and crushed garlic for as long as you have. Twenty minutes will do.',
              'Thread onto skewers and griddle hard, turning, until charred at the edges and just done through.',
              'Warm the pitta on the same griddle so it takes on some of the fat.',
              'Tzatziki, meat, tomato, onion, and chips inside the wrap. Inside. Roll tightly in paper.'] }
  ]);

  recipes('Basque cheesecake', [
    { name: 'Burnt on purpose', time: 60, serves: 8, level: 'Easy',
      ingredients: ['600g cream cheese, room temperature', '200g caster sugar', '4 eggs', '300ml double cream', '25g plain flour', 'Pinch of salt'],
      steps: ['Heat the oven as high as it will go, around 220C. Line a tin with baking paper, crumpled, letting it stick up over the sides.',
              'Beat the cream cheese and sugar smooth, then the eggs one at a time, then the cream, then the flour. Do not whip air into it.',
              'Pour in and bake 40 minutes. The top should go properly dark — further than instinct allows — and the middle should still wobble.',
              'Cool completely in the tin. It sinks and cracks. That is what it looks like.'] }
  ]);

  recipes('Kunafa', [
    { name: 'Cheese under syrup', time: 45, serves: 8, level: 'Easy',
      ingredients: ['400g kataifi pastry, pulled apart', '150g butter, melted', '400g mozzarella or akkawi, sliced', '200g sugar', '150ml water', 'Squeeze of lemon', 'Pistachios'],
      steps: ['Boil the sugar, water and lemon for 5 minutes into a syrup and then leave it to go cold. Cold syrup, hot pastry — that rule matters.',
              'Toss the shredded pastry through the melted butter until every strand is coated.',
              'Press half into a tin, lay the cheese over, press the rest on top.',
              'Bake at 190C for 30 minutes until deep gold.',
              'Pour the cold syrup over the moment it leaves the oven. Pistachios, and eat it while the cheese still pulls.'] }
  ]);

  recipes('Sticky toffee pudding', [
    { name: 'More sauce than seems wise', time: 55, serves: 6, level: 'Easy',
      ingredients: ['200g dates, chopped', '250ml boiling water', '1 tsp bicarbonate of soda', '75g butter', '150g dark brown sugar', '2 eggs', '175g self-raising flour', 'For the sauce: 150g butter, 200g brown sugar, 250ml double cream'],
      steps: ['Pour the boiling water over the dates with the bicarb and leave 10 minutes, then mash roughly.',
              'Cream the butter and sugar, beat in the eggs, fold in the flour, then stir through the dates and their liquid. It will look far too wet. Trust it.',
              'Bake at 180C for 30 minutes.',
              'For the sauce, melt everything together and bubble for 3 minutes until it thickens and goes glossy.',
              'Skewer holes in the warm sponge and pour half the sauce in. The rest goes over at the table.'] }
  ]);

  recipes('Lobster', [
    { name: 'Grilled, with garlic butter', time: 30, serves: 2, level: 'Easier than it looks',
      ingredients: ['2 lobsters, about 500g each', '100g butter, softened', '2 garlic cloves, crushed', 'Small handful of parsley, chopped', '1 lemon', 'Salt and pepper'],
      steps: ['Put the lobsters in the freezer for 20 minutes first — it sedates them, and it is the kind thing to do.',
              'Lay one flat and split it lengthways through the head in one firm movement. Clean out the dark tract and the sac behind the eyes.',
              'Mash the butter with the garlic, parsley, lemon zest and plenty of pepper, and work it into the split flesh.',
              'Grill shell-side down, high and close, 8 to 10 minutes, until the flesh turns opaque and the butter is bubbling. Do not turn them over.',
              'Lemon squeezed over at the table. Serve with bread for the butter in the shell, which is the best part of it.'] }
  ]);

  /* ---- the third intake: plant-based ------------------------------------
     Written for the dishes added to data.js in the same batch. Every one of
     these is vegan unless its ingredients say otherwise, which is the whole
     reason the batch exists: the strictest profiles had almost nothing left
     to be offered. Quantities are metric and deliberately rough — this is a
     prompt to start cooking, not a reference text. */

  recipes('Dal tadka', [
    { name: 'The everyday one', time: 35, serves: 4, level: 'Easy',
      ingredients: ['200g toor or masoor dal', '1 tsp turmeric', '1 tomato, chopped', '3 tbsp oil', '1 tsp cumin seeds', '3 garlic cloves, sliced', '2 dried chillies', '1 tsp garam masala'],
      steps: ['Rinse the dal until the water runs clear, then simmer with the turmeric and three times its volume of water for 25 minutes, until it collapses.',
              'Stir in the tomato and a good pinch of salt and cook another 5 minutes.',
              'Heat the oil in a small pan. Add the cumin, then the garlic and chillies, and watch it — the garlic should go gold, not brown.',
              'Pour the whole lot over the dal, stir once so it streaks, and finish with the garam masala.'] },
    { name: 'Twenty minutes, one pan', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['150g red lentils', '1 tsp turmeric', '2 tbsp oil', '1 tsp cumin seeds', '2 garlic cloves, sliced', 'Chilli flakes', 'Lemon'],
      steps: ['Simmer the lentils and turmeric in 600ml water for 15 minutes, stirring now and then.',
              'While they go, fry the cumin, garlic and chilli in the oil until fragrant.',
              'Tip the oil in, salt it properly, and squeeze over half a lemon.'] }
  ]);

  recipes('Rajma', [
    { name: 'The Sunday version', time: 60, serves: 4, level: 'Medium',
      ingredients: ['2 tins kidney beans, drained', '2 onions, finely chopped', '4 garlic cloves', 'Thumb of ginger', '3 tomatoes, blitzed', '1 tsp cumin', '1 tsp coriander', '1 tsp garam masala', 'Oil'],
      steps: ['Fry the onions in oil over medium heat for a full 12 minutes, until they are properly brown. This is the whole dish.',
              'Add the garlic and ginger, crushed together, and cook 2 minutes.',
              'Add the tomatoes and the ground spices and cook until the oil separates out at the edges.',
              'Add the beans and 400ml water, then simmer 25 minutes, mashing a few beans against the side to thicken it.',
              'Garam masala at the end, off the heat. Rice underneath.'] },
    { name: 'Weeknight', time: 25, serves: 2, level: 'Easy',
      ingredients: ['1 tin kidney beans', '1 onion, chopped', '2 garlic cloves', '1 tin chopped tomatoes', '2 tsp curry powder', 'Oil'],
      steps: ['Brown the onion hard in oil, then add the garlic and curry powder.',
              'Tomatoes in, cook 10 minutes until it darkens.',
              'Beans and a splash of water, 10 minutes more, mashing some of them as you go.'] }
  ]);

  recipes('Idli', [
    { name: 'From scratch, with the waiting', time: 40, serves: 4, level: 'Medium',
      ingredients: ['200g idli rice', '100g urad dal', '1/2 tsp fenugreek seeds', 'Salt'],
      steps: ['Soak the rice, and separately the dal with the fenugreek, for 5 hours.',
              'Grind the dal to a light foam with a little water, then the rice to a fine grit. Fold them together with salt.',
              'Leave somewhere warm for 8 to 12 hours, until it has risen and smells sour.',
              'Ladle into greased moulds and steam 12 minutes. A skewer should come out clean.'] },
    { name: 'From a bought batter', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['Idli batter', 'Oil, for the moulds', 'Chutney or sambar, to serve'],
      steps: ['Stir the batter and check it for salt.', 'Grease the moulds and fill them two thirds full.',
              'Steam 12 minutes, then leave 2 minutes before turning them out or they tear.'] }
  ]);

  recipes('Lemon rice', [
    { name: 'The proper tempering', time: 15, serves: 2, level: 'Easy',
      ingredients: ['400g cooked rice, cold', '2 tbsp oil', '1 tsp mustard seeds', '1 tsp urad dal', 'A handful of peanuts', '10 curry leaves', '1/2 tsp turmeric', '1 lemon'],
      steps: ['Heat the oil and add the mustard seeds. Wait for them to pop — they will, all at once.',
              'Add the urad dal and peanuts and fry until both are gold, then the curry leaves, which will spit.',
              'Turmeric in, off the heat, then the rice, broken up with your fingers first.',
              'Salt, then the juice of the whole lemon, and stir until every grain is yellow.'] },
    { name: 'Five minutes with leftovers', time: 5, serves: 1, level: 'Very easy',
      ingredients: ['A bowl of cold rice', '1 tbsp oil', '1/4 tsp turmeric', 'Half a lemon', 'Salt'],
      steps: ['Warm the oil with the turmeric.', 'Rice in, broken up, tossed until it is evenly coloured.',
              'Lemon and salt off the heat.'] }
  ]);

  recipes('Coconut rice', [
    { name: 'Cooked in the tin', time: 25, serves: 4, level: 'Very easy',
      ingredients: ['300g jasmine rice', '1 tin coconut milk', '200ml water', '1 tsp salt', '1 tsp sugar'],
      steps: ['Rinse the rice three times, until the water is nearly clear.',
              'Everything in a pan, brought to a bare simmer.',
              'Lid on, lowest heat, 12 minutes. Do not lift the lid.',
              'Off the heat, still covered, 10 minutes more. Then fork it through.'] },
    { name: 'The Southeast Asian one', time: 30, serves: 4, level: 'Easy',
      ingredients: ['300g rice', '1 tin coconut milk', '200ml water', '2 pandan leaves, knotted', '1 tsp salt'],
      steps: ['Rinse the rice and put it in the pan with everything else, pandan on top.',
              'Simmer covered 12 minutes, then rest 10 off the heat.',
              'Pull the pandan out and fluff. It should smell like a bakery.'] }
  ]);

  recipes('Upma', [
    { name: 'With whatever is in the drawer', time: 20, serves: 2, level: 'Easy',
      ingredients: ['150g coarse semolina', '2 tbsp oil', '1 tsp mustard seeds', '1 onion, chopped', 'Thumb of ginger, grated', '1 green chilli', 'A handful of peas and diced carrot', '450ml water'],
      steps: ['Toast the semolina dry in the pan until it smells nutty, about 4 minutes, then tip it out.',
              'Oil in, mustard seeds, then the onion, ginger and chilli until soft.',
              'Vegetables and water, salted, brought to the boil.',
              'Rain the semolina in with one hand while stirring with the other, or it will lump. Cover, lowest heat, 5 minutes.'] },
    { name: 'Plain and quick', time: 12, serves: 1, level: 'Very easy',
      ingredients: ['75g semolina', '1 tbsp oil', '1 tsp mustard seeds', '250ml water', 'Salt'],
      steps: ['Toast the semolina, set it aside.', 'Pop the mustard seeds in the oil, add the salted water, bring to the boil.',
              'Semolina in, stirring hard. Lid on, 4 minutes.'] }
  ]);

  recipes('Poha', [
    { name: 'The Indore breakfast', time: 15, serves: 2, level: 'Easy',
      ingredients: ['150g thick poha', '2 tbsp oil', '1 tsp mustard seeds', '1 onion, chopped', '1 potato, diced small', '1/2 tsp turmeric', '10 curry leaves', 'Lemon', 'Sev, to finish'],
      steps: ['Rinse the poha in a sieve under the tap for 20 seconds, then leave it to drain. It should be damp, never wet.',
              'Pop the mustard seeds in the oil, add the curry leaves, onion and potato, and cook until the potato is done.',
              'Turmeric and salt, then the poha folded through gently — it breaks if you stir it like rice.',
              'Lid on, 2 minutes. Lemon and sev at the table.'] },
    { name: 'Without the potato', time: 10, serves: 1, level: 'Very easy',
      ingredients: ['75g poha', '1 tbsp oil', '1/2 onion', '1/4 tsp turmeric', 'Peanuts', 'Lemon'],
      steps: ['Rinse and drain the poha.', 'Fry the peanuts, then the onion, then the turmeric.',
              'Fold the poha through, cover 2 minutes, lemon over it.'] }
  ]);

  recipes('Baingan bharta', [
    { name: 'Over a flame', time: 45, serves: 3, level: 'Medium',
      ingredients: ['2 large aubergines', '2 onions, chopped', '4 garlic cloves', 'Thumb of ginger', '2 tomatoes', '1 tsp cumin', '1 green chilli', 'Oil', 'Coriander'],
      steps: ['Char the aubergines whole, directly on a gas flame or under a very hot grill, turning until the skin is black all over and they have collapsed. Twenty minutes, and worth every one.',
              'Leave them in a covered bowl 10 minutes, then peel and chop the flesh roughly.',
              'Fry the cumin, then the onion until brown, then the garlic, ginger and chilli.',
              'Tomatoes in until they break down, then the aubergine. Cook it down hard, 10 minutes, mashing as you go.',
              'Coriander, a lot of it, off the heat.'] },
    { name: 'In the oven', time: 50, serves: 3, level: 'Easy',
      ingredients: ['2 aubergines', '1 onion', '3 garlic cloves', '1 tin chopped tomatoes', '2 tsp garam masala', 'Oil'],
      steps: ['Halve the aubergines, score them, oil them, and roast at 220C for 35 minutes until the flesh is soft and brown.',
              'Scoop out and chop. Meanwhile brown the onion and garlic.',
              'Tomatoes and spices in, reduced hard, then the aubergine folded through.'] }
  ]);

  recipes('Aloo gobi', [
    { name: 'Dry, the way it should be', time: 35, serves: 3, level: 'Easy',
      ingredients: ['1 cauliflower, in florets', '3 potatoes, in chunks', '1 tsp cumin seeds', '1 tsp turmeric', '1 tsp coriander', 'Thumb of ginger', '1 green chilli', '3 tbsp oil'],
      steps: ['Fry the cumin seeds in the oil until they darken.',
              'Potatoes in first, 8 minutes, then the cauliflower. Let both take colour before you touch them.',
              'Ginger, chilli and ground spices, salted, tossed through.',
              'Lid on, lowest heat, 15 minutes, shaking the pan rather than stirring. It should be dry and a little caught underneath.'] },
    { name: 'Roasted', time: 40, serves: 3, level: 'Very easy',
      ingredients: ['1 cauliflower', '3 potatoes', '3 tbsp oil', '2 tsp curry powder', '1 tsp turmeric', 'Lemon'],
      steps: ['Toss everything with the oil and spices on the biggest tray you own.',
              'Roast at 220C for 35 minutes, turning once.',
              'Lemon over the top while it is still hot.'] }
  ]);

  recipes('Dhokla', [
    { name: 'Steamed, with the tempering', time: 30, serves: 4, level: 'Medium',
      ingredients: ['200g gram flour', '1 tbsp semolina', '1 tsp sugar', '1 tbsp lemon juice', '1 tsp eno or 1/2 tsp bicarbonate of soda', '2 tbsp oil', '1 tsp mustard seeds', '2 green chillies, split', '1 tsp sugar for the syrup'],
      steps: ['Whisk the gram flour, semolina, sugar, salt, lemon and 200ml water to a batter like thick cream. Rest it 10 minutes.',
              'Stir in the eno at the very last moment — it starts working immediately — and pour straight into a greased tin.',
              'Steam 15 minutes. A skewer comes out clean.',
              'Pop the mustard seeds in the oil with the chillies, add 4 tbsp water and the sugar, and pour that over the top. Cut into squares once it has soaked in.'] },
    { name: 'The microwave one', time: 12, serves: 2, level: 'Easy',
      ingredients: ['100g gram flour', '1 tbsp lemon juice', '1/2 tsp eno', 'Salt', 'Oil'],
      steps: ['Batter as above, rested 5 minutes.', 'Eno in, poured into a greased microwave dish.',
              'Full power 3 minutes, then rest 3 minutes before cutting.'] }
  ]);

  recipes('Pav bhaji', [
    { name: 'The stall version', time: 40, serves: 4, level: 'Easy',
      ingredients: ['3 potatoes, boiled', '1 cauliflower, small, boiled', '150g peas', '2 onions, chopped', '3 tomatoes, chopped', '1 green pepper', '3 tbsp pav bhaji masala', '80g butter', '8 soft rolls', 'Lemon'],
      steps: ['Melt half the butter and fry the onion until soft, keeping back a handful raw for the top.',
              'Pepper in, then the tomatoes, cooked until they lose their shape entirely.',
              'Masala and salt, then all the boiled vegetables, and now mash — properly, with a masher, for a good five minutes, adding splashes of water.',
              'Simmer 10 minutes. It should be thick and orange and a bit rough.',
              'Split the rolls, fry them cut-side down in the rest of the butter until gold, and serve with raw onion and lemon.'] },
    { name: 'With what you have', time: 25, serves: 2, level: 'Very easy',
      ingredients: ['2 potatoes', '200g frozen mixed vegetables', '1 onion', '1 tin chopped tomatoes', '2 tbsp pav bhaji masala', 'Butter', 'Rolls'],
      steps: ['Boil the potatoes and vegetables until very soft.',
              'Fry the onion in butter, add tomatoes and masala, cook 10 minutes.',
              'Everything in, mashed hard, loosened with water. Fry the rolls in butter.'] }
  ]);

  recipes('Vada pav', [
    { name: 'The whole thing', time: 40, serves: 4, level: 'Medium',
      ingredients: ['4 potatoes, boiled and mashed', '1 tsp mustard seeds', '10 curry leaves', 'Thumb of ginger', '2 green chillies', '1/2 tsp turmeric', '150g gram flour', 'Oil for frying', '4 soft rolls', 'Dry garlic chutney'],
      steps: ['Pop the mustard seeds in a little oil with the curry leaves, ginger and chilli, then fold through the mashed potato with the turmeric and plenty of salt. Roll into four balls.',
              'Whisk the gram flour with water and a pinch of turmeric to a batter that coats a spoon.',
              'Heat oil to 180C. Dip each ball and fry 4 minutes until the crust is set and gold.',
              'Split a roll, chutney on both sides, vada in, press down. Eat standing up.'] },
    { name: 'Baked, and honest about it', time: 35, serves: 4, level: 'Easy',
      ingredients: ['4 potatoes, mashed', 'Ginger, chilli, turmeric', 'Gram flour batter', 'Oil spray', 'Rolls and chutney'],
      steps: ['Make and shape the vada as above.', 'Dip in batter, put on lined tray, spray with oil.',
              'Bake at 200C for 25 minutes, turning once. Not the same, and still good.'] }
  ]);

  recipes('Khichdi', [
    { name: 'The one for when you are ill', time: 30, serves: 2, level: 'Very easy',
      ingredients: ['100g rice', '100g moong dal', '1/2 tsp turmeric', '1 tbsp oil', '1 tsp cumin seeds', 'Salt'],
      steps: ['Rinse the rice and dal together until the water clears.',
              'Simmer with the turmeric and 900ml water for 25 minutes, until nothing has its own shape any more. Add water if it tightens.',
              'Fry the cumin in the oil until it darkens and pour it over.',
              'Salt at the table. It should be loose enough to eat with a spoon.'] },
    { name: 'With vegetables', time: 35, serves: 3, level: 'Easy',
      ingredients: ['100g rice', '100g moong dal', '1 carrot, diced', '100g peas', '1/2 tsp turmeric', '1 tsp cumin', 'Oil'],
      steps: ['Fry the cumin, add the carrot for 3 minutes.',
              'Rice, dal, peas, turmeric and 900ml water. Simmer 25 minutes.',
              'Mash it slightly against the side of the pan before serving.'] }
  ]);

  recipes('Mujadara', [
    { name: 'With the onions taken seriously', time: 50, serves: 4, level: 'Easy',
      ingredients: ['200g brown or green lentils', '200g rice', '4 onions, sliced thin', '150ml olive oil', '1 tsp cumin', '1 tsp allspice'],
      steps: ['Fry the onions in the oil over medium heat for 25 minutes. Stir rarely. They go past gold, past brown, to the edge of burnt — that is the flavour of the whole dish. Lift out half onto kitchen paper.',
              'Simmer the lentils in plenty of water for 15 minutes, until nearly done, then drain, keeping the water.',
              'Add the rice, spices and the onions still in the pan, plus 500ml of the lentil water. Salt well.',
              'Lid on, lowest heat, 15 minutes, then 10 off the heat.',
              'The crisp onions go on top at the table.'] },
    { name: 'Faster', time: 30, serves: 2, level: 'Very easy',
      ingredients: ['1 tin lentils, drained', '150g rice', '2 onions', '4 tbsp olive oil', '1 tsp cumin'],
      steps: ['Fry the onions hard in the oil for 15 minutes.',
              'Rice, cumin and 300ml water, simmered covered 12 minutes.',
              'Lentils folded through at the end, warmed through.'] }
  ]);

  recipes('Ful medames', [
    { name: 'Breakfast, properly', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['1 tin fava beans', '2 garlic cloves, crushed', '1 lemon', '3 tbsp olive oil', '1 tsp cumin', 'Parsley', 'Tomato, chopped', 'Flatbread'],
      steps: ['Warm the beans in their own liquid for 10 minutes, then mash about half of them against the pan.',
              'Garlic, cumin, salt and the juice of the whole lemon, stirred in off the heat.',
              'Pour the oil over the top and do not stir it in.',
              'Parsley and tomato on top. Bread, not cutlery.'] },
    { name: 'With tahini', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['1 tin fava beans', '2 tbsp tahini', 'Lemon', 'Garlic', 'Chilli flakes', 'Olive oil'],
      steps: ['Warm and half-mash the beans.', 'Loosen the tahini with lemon and cold water until it is pourable.',
              'Beans in a bowl, tahini over, chilli and oil on top.'] }
  ]);

  recipes('Baba ganoush', [
    { name: 'Charred over a flame', time: 40, serves: 4, level: 'Medium',
      ingredients: ['2 aubergines', '3 tbsp tahini', '1 lemon', '1 garlic clove', 'Olive oil', 'Pomegranate seeds'],
      steps: ['Burn the aubergines whole over a gas flame or under a fierce grill until the skin is black and they have gone soft. Twenty minutes, turning.',
              'Rest them in a bowl under a plate, then peel. Leave the flesh in a sieve for 15 minutes — the bitter water needs to go.',
              'Chop rather than blend, so it keeps some texture. Fold in the tahini, lemon, crushed garlic and salt.',
              'Spread it wide, pool oil in the middle, scatter pomegranate.'] },
    { name: 'Oven, no drama', time: 45, serves: 4, level: 'Very easy',
      ingredients: ['2 aubergines', '3 tbsp tahini', 'Lemon', 'Garlic', 'Olive oil'],
      steps: ['Halve, score and oil the aubergines. Roast at 220C for 35 minutes until collapsing and brown.',
              'Scoop the flesh, drain it, chop it.', 'Tahini, lemon, garlic, salt. Oil on top.'] }
  ]);

  recipes('Tabbouleh', [
    { name: 'Mostly parsley, as intended', time: 20, serves: 4, level: 'Easy',
      ingredients: ['4 large bunches flat parsley', '2 tbsp fine bulgur', '2 tomatoes, diced very small', '4 spring onions', 'A handful of mint', '1 lemon', '4 tbsp olive oil'],
      steps: ['Soak the bulgur in the juice of the lemon for 15 minutes. That is all the water it gets.',
              'Chop the parsley by hand, and keep chopping. A processor bruises it to sludge.',
              'Everything together, oil and salt last.',
              'Eat within the hour — it weeps if it stands.'] },
    { name: 'The grain-forward one', time: 20, serves: 4, level: 'Very easy',
      ingredients: ['150g bulgur', '2 bunches parsley', '1 cucumber', '2 tomatoes', 'Lemon', 'Olive oil', 'Mint'],
      steps: ['Pour 200ml boiling water over the bulgur, cover, 15 minutes, then fork it loose.',
              'Chop everything small and fold it through.', 'Lemon and oil, generously, and salt properly.'] }
  ]);

  recipes('Imam bayildi', [
    { name: 'Cooked until it gives up', time: 75, serves: 4, level: 'Medium',
      ingredients: ['4 small aubergines', '3 onions, sliced thin', '6 garlic cloves, sliced', '4 tomatoes, chopped', '150ml olive oil', '1 tsp sugar', 'Parsley'],
      steps: ['Peel the aubergines in stripes and slit each one down one side, without cutting through. Salt the slits and leave 20 minutes.',
              'Cook the onions very slowly in most of the oil, 20 minutes, until sweet. Add the garlic, then the tomatoes and sugar, and cook to a jam.',
              'Stuff the slits, packing them full, and sit them in a snug dish.',
              'Pour over the rest of the oil and 150ml water, cover, and bake at 170C for 50 minutes.',
              'Eat at room temperature, never hot, with parsley over.'] },
    { name: 'Halved and roasted', time: 50, serves: 4, level: 'Easy',
      ingredients: ['2 aubergines, halved', '2 onions', '4 garlic cloves', '1 tin chopped tomatoes', 'Olive oil'],
      steps: ['Score and oil the aubergine halves, roast cut-side up at 200C for 30 minutes.',
              'Meanwhile cook the onion and garlic soft, add the tomatoes, reduce 15 minutes.',
              'Pile on top, back in for 15 minutes. Cool before eating.'] }
  ]);

  recipes('Batata harra', [
    { name: 'Fried hard', time: 35, serves: 4, level: 'Easy',
      ingredients: ['800g potatoes, in 2cm cubes', 'Oil for frying', '5 garlic cloves, crushed', '1 red chilli', 'A large bunch of coriander', '1 lemon'],
      steps: ['Boil the potatoes 6 minutes, then drain and dry them completely. Wet potatoes will not crisp.',
              'Fry in hot oil in batches until deep gold, 8 minutes a batch. Drain on paper.',
              'In a clean pan, warm 2 tbsp oil with the garlic and chilli for 30 seconds — no more, or the garlic turns bitter.',
              'Potatoes back in, coriander, salt, lemon. Toss and serve immediately.'] },
    { name: 'Oven version', time: 45, serves: 4, level: 'Very easy',
      ingredients: ['800g potatoes', '4 tbsp oil', '4 garlic cloves', 'Chilli flakes', 'Coriander', 'Lemon'],
      steps: ['Parboil 6 minutes, drain, shake them about in the colander to rough the edges.',
              'Roast at 220C in the oil for 35 minutes.',
              'Toss with raw crushed garlic, chilli, coriander and lemon while hot.'] }
  ]);

  recipes('Warak enab', [
    { name: 'Rolled properly', time: 90, serves: 6, level: 'Hard',
      ingredients: ['1 jar vine leaves', '300g short grain rice', '3 tomatoes, diced small', '1 onion, diced small', 'A bunch of parsley and mint', '2 lemons', '120ml olive oil'],
      steps: ['Rinse the leaves well and pat them dry. Line the bottom of a heavy pan with the torn ones.',
              'Mix the rice raw with the tomato, onion, herbs, half the oil, salt and the juice of one lemon.',
              'A teaspoon of filling per leaf, veined side up, sides folded in, rolled tight but not hard — the rice has to swell.',
              'Pack them in layers, seam down. Sit a plate on top to hold them under.',
              'Add water to just cover, the rest of the oil and lemon, and simmer on the lowest heat for 50 minutes.',
              'Cool in the pan. They are a cold dish.'] },
    { name: 'Lazy, in a dish', time: 45, serves: 4, level: 'Easy',
      ingredients: ['Vine leaves', '200g rice', 'Tomato, onion, herbs', 'Lemon', 'Olive oil'],
      steps: ['Mix the filling as above, adding 250ml water.',
              'Layer leaves and filling in an oiled dish, finishing with leaves.',
              'Cover tightly with foil and bake at 180C for 40 minutes. Cool before cutting.'] }
  ]);

  recipes('Yaki onigiri', [
    { name: 'Grilled in a pan', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['400g cooked short grain rice, warm', '2 tbsp soy sauce', '1 tsp mirin', '1 tsp sesame oil'],
      steps: ['Wet your hands, salt them, and press the rice into four firm triangles. Firm is the whole trick — loose ones fall apart in the pan.',
              'Dry-fry them in a non-stick pan over medium heat for 4 minutes a side, until a pale crust forms.',
              'Mix the soy, mirin and sesame oil and brush it on. Back in the pan 1 minute a side until it catches and smells toasted.'] },
    { name: 'With a filling', time: 20, serves: 2, level: 'Easy',
      ingredients: ['400g cooked rice', 'Pickled plum or miso', 'Soy sauce', 'Nori'],
      steps: ['Flatten a handful of rice, put the filling in the middle, close it over and shape.',
              'Grill as above and wrap a strip of nori round the bottom at the end.'] }
  ]);

  recipes('Inari sushi', [
    { name: 'From the tin', time: 20, serves: 3, level: 'Very easy',
      ingredients: ['1 packet seasoned inari pouches', '400g cooked short grain rice', '2 tbsp rice vinegar', '1 tbsp sugar', '1 tsp salt', 'Toasted sesame seeds'],
      steps: ['Dissolve the sugar and salt in the vinegar and fold it through the warm rice with a cutting motion, not a stir.',
              'Fan the rice as you go if you want it glossy. Let it cool to room temperature.',
              'Open each pouch gently, fill two thirds full, and fold the top over.',
              'Sesame on top.'] },
    { name: 'Simmering your own', time: 45, serves: 4, level: 'Medium',
      ingredients: ['8 aburaage sheets', '200ml water', '3 tbsp soy sauce', '3 tbsp sugar', '1 tbsp mirin', 'Sushi rice'],
      steps: ['Pour boiling water over the aburaage to take off the excess oil, then press dry.',
              'Cut in half, open into pouches, and simmer 15 minutes in the water, soy, sugar and mirin until most of it is absorbed.',
              'Cool, squeeze gently, and fill with seasoned rice.'] }
  ]);

  recipes('Vegetable gyoza', [
    { name: 'Folded and fried', time: 60, serves: 4, level: 'Medium',
      ingredients: ['30 gyoza wrappers', '1/2 small cabbage, shredded', '150g mushrooms, chopped fine', '2 spring onions', 'Thumb of ginger', '2 garlic cloves', '1 tbsp soy sauce', '1 tsp sesame oil', 'Oil for frying'],
      steps: ['Salt the cabbage and leave it 15 minutes, then squeeze it dry in a tea towel. Hard. A wet filling tears the wrappers.',
              'Fry the mushrooms until their water has gone, then cool and mix with everything else.',
              'A teaspoon per wrapper, wet the rim, fold and pleat one side only.',
              'Fry flat-side down in a little oil until the bottoms are gold, 3 minutes.',
              'Add 80ml water, lid on, 6 minutes. Then lid off until the water has gone and the bottoms crisp again.'] },
    { name: 'From frozen, unapologetically', time: 12, serves: 2, level: 'Very easy',
      ingredients: ['12 frozen vegetable gyoza', '1 tbsp oil', '80ml water', 'Soy sauce and vinegar'],
      steps: ['Oil in a cold pan, gyoza arranged flat-side down, heat turned to medium.',
              'When they sizzle, 3 minutes, then water in and lid on for 6.',
              'Lid off until dry and crisp. Dip in soy and vinegar.'] }
  ]);

  recipes('Tofu larb', [
    { name: 'With toasted rice powder', time: 25, serves: 2, level: 'Easy',
      ingredients: ['400g firm tofu', '2 tbsp uncooked sticky rice', '2 limes', '2 tbsp soy sauce', '1 tsp sugar', '4 shallots, sliced', 'Mint and coriander, a lot', '1 tsp chilli flakes', 'Lettuce leaves'],
      steps: ['Toast the raw rice in a dry pan until deep brown, 8 minutes, then grind it to a coarse powder. This is what makes it larb.',
              'Press the tofu dry, crumble it, and fry hard until the edges catch.',
              'Off the heat: lime juice, soy, sugar, chilli, shallots.',
              'Herbs and rice powder folded through at the very last second. Scoop with lettuce.'] },
    { name: 'Ten minutes', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['400g firm tofu', '2 limes', '2 tbsp soy sauce', 'Chilli flakes', 'Shallot', 'Mint and coriander', 'Crushed peanuts'],
      steps: ['Crumble and fry the tofu until browned.',
              'Dress with lime, soy and chilli off the heat.',
              'Shallot, herbs and peanuts through at the end.'] }
  ]);

  recipes('Pad pak', [
    { name: 'One very hot pan', time: 12, serves: 2, level: 'Easy',
      ingredients: ['400g mixed greens — pak choi, beans, broccoli', '3 garlic cloves, crushed', '1 red chilli', '2 tbsp soy sauce', '1 tbsp vegetarian oyster sauce', '1 tsp sugar', 'Oil'],
      steps: ['Have everything chopped and within reach before you start. This takes four minutes and there is no time to go looking.',
              'Get the pan hotter than feels sensible. Oil, then garlic and chilli for 10 seconds.',
              'Hardest vegetables first, tossed, 2 minutes. Then the leafy ones.',
              'Sauces and sugar round the edge of the pan so they caramelise rather than boil. Toss once and serve.'] },
    { name: 'With tofu, to make it dinner', time: 20, serves: 2, level: 'Easy',
      ingredients: ['200g firm tofu, cubed', '400g mixed vegetables', 'Garlic, chilli', 'Soy sauce', 'Cornflour'],
      steps: ['Toss the tofu in cornflour and fry until crisp on all sides. Lift out.',
              'Stir-fry the vegetables as above.', 'Tofu back in at the end so it stays crisp.'] }
  ]);

  recipes('Gallo pinto', [
    { name: 'Costa Rican breakfast', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['1 tin black beans, with their liquid', '300g cooked rice, cold', '1 onion, diced', '1 red pepper, diced', '2 garlic cloves', 'Coriander', 'Salsa Lizano or Worcestershire-style sauce'],
      steps: ['Fry the onion and pepper until soft, then the garlic.',
              'Beans in with a good splash of their black liquid — that is what colours the rice.',
              'Rice in, broken up, tossed until every grain has gone grey-purple.',
              'Coriander and a shake of the sauce at the end.'] },
    { name: 'Cuban-leaning', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['1 tin black beans', '300g cold rice', '1 onion', 'Cumin', 'Oregano', 'Lime'],
      steps: ['Soften the onion, add cumin and oregano.',
              'Beans with their liquid, cooked down 5 minutes.',
              'Rice folded through, lime over it.'] }
  ]);

  recipes('Patacones', [
    { name: 'Fried twice', time: 25, serves: 3, level: 'Easy',
      ingredients: ['3 green plantains', 'Oil for frying', 'Salt', 'Garlic water — 2 crushed cloves in 200ml warm water'],
      steps: ['Peel the plantains by scoring the skin lengthways and prising it off. They do not peel like bananas.',
              'Cut into 3cm chunks and fry at 160C for 4 minutes, until soft but barely coloured. Lift out.',
              'Squash each one flat between two plates or with the bottom of a glass.',
              'Dip briefly in the garlic water, then fry again at 190C for 3 minutes until crisp and gold.',
              'Salt immediately, while they are still shining.'] },
    { name: 'Air fryer', time: 30, serves: 3, level: 'Very easy',
      ingredients: ['3 green plantains', '3 tbsp oil', 'Salt'],
      steps: ['Chunk and toss in oil, air fry at 180C for 10 minutes.',
              'Squash flat, oil again, back in at 200C for 8 minutes.',
              'Salt at once. Less rich, still good.'] }
  ]);

  recipes('Frijoles negros', [
    { name: 'From dried, slowly', time: 120, serves: 6, level: 'Easy',
      ingredients: ['400g dried black beans, soaked overnight', '1 onion, halved', '1 green pepper', '4 garlic cloves', '2 bay leaves', '1 tbsp cumin', '2 tbsp olive oil', '1 tbsp vinegar'],
      steps: ['Simmer the beans with the halved onion, pepper and bay in plenty of unsalted water. Salt now makes them tough — it goes in at the end.',
              'An hour and a half, topping up the water, until they are properly soft.',
              'Fish out the onion and pepper. Fry the garlic and cumin in the oil and stir it in.',
              'Salt, then the vinegar, which is what stops it tasting flat. Mash a ladleful against the side to thicken.'] },
    { name: 'From tins', time: 20, serves: 3, level: 'Very easy',
      ingredients: ['2 tins black beans', '1 onion', '3 garlic cloves', '1 tsp cumin', 'Bay leaf', 'Vinegar', 'Oil'],
      steps: ['Soften the onion, add garlic and cumin.',
              'Beans with their liquid and the bay, simmered 15 minutes, mashing some.',
              'Salt and a splash of vinegar at the end.'] }
  ]);

  recipes('Tacos de nopales', [
    { name: 'Griddled', time: 25, serves: 3, level: 'Easy',
      ingredients: ['4 nopales paddles, or a jar, rinsed well', '1 onion, sliced', '2 tomatoes', 'Corn tortillas', 'Coriander', 'Lime', 'Chilli'],
      steps: ['If fresh, scrape off the spines with a knife and slice into strips. Rinse them until the water is no longer slippery — this matters.',
              'Dry-griddle the nopales hard until they squeak and take colour, 8 minutes. Do not crowd the pan.',
              'Add the onion and tomato and cook until soft.',
              'Warm the tortillas directly on the flame, fill, and finish with coriander, lime and chilli.'] },
    { name: 'From a jar, quickly', time: 12, serves: 2, level: 'Very easy',
      ingredients: ['1 jar nopales', '1 onion', 'Tortillas', 'Coriander', 'Lime'],
      steps: ['Rinse and drain the nopales thoroughly, then pat dry.',
              'Fry hard with the onion until the edges brown.',
              'Into warm tortillas with coriander and lime.'] }
  ]);

  recipes('Shiro', [
    { name: 'Ethiopian, with berbere', time: 30, serves: 4, level: 'Easy',
      ingredients: ['150g shiro powder (ground chickpea)', '1 onion, diced very fine', '3 garlic cloves', '2 tbsp berbere', '3 tbsp oil', '800ml water'],
      steps: ['Cook the onion in the dry pan first, no oil, for 5 minutes until it softens in its own moisture. That is the Ethiopian way and it is worth doing.',
              'Add the oil and garlic, then the berbere, and fry 2 minutes until it darkens.',
              'Whisk the shiro powder into the water separately, then pour it in slowly, stirring.',
              'Simmer 15 minutes, stirring often — it catches easily. It should be thick enough to hold a spoon-track. Injera or rice.'] },
    { name: 'With chickpea flour', time: 25, serves: 3, level: 'Easy',
      ingredients: ['100g gram flour', '1 onion', '2 tbsp berbere or 1 tbsp paprika and 1 tsp cayenne', 'Garlic', 'Oil'],
      steps: ['Soften the onion in oil, add garlic and spice.',
              'Whisk the flour into 600ml water and pour in gradually.',
              'Simmer 15 minutes, stirring, until thick.'] }
  ]);

  recipes('Misir wot', [
    { name: 'Properly hot', time: 45, serves: 4, level: 'Easy',
      ingredients: ['300g red lentils', '2 onions, diced very fine', '4 garlic cloves', 'Thumb of ginger', '3 tbsp berbere', '3 tbsp oil', '1 tbsp tomato purée'],
      steps: ['Dry-cook the onions in the pan for 8 minutes before any oil goes near them. They should be soft and sticky.',
              'Oil, garlic and ginger in, then the berbere and purée, fried 3 minutes until it smells toasted rather than raw.',
              'Lentils and 900ml water, simmered 25 minutes until they have gone completely.',
              'Salt at the end. It thickens as it stands, so keep it looser than you think.'] },
    { name: 'Milder', time: 40, serves: 4, level: 'Easy',
      ingredients: ['300g red lentils', '2 onions', 'Garlic and ginger', '1 tbsp paprika', '1 tsp cayenne', '1 tsp cardamom', 'Oil'],
      steps: ['As above, swapping the berbere for the paprika, cayenne and cardamom.',
              'Simmer until soft, salt at the end.'] }
  ]);

  recipes('Gomen', [
    { name: 'Collards, slowly', time: 35, serves: 4, level: 'Very easy',
      ingredients: ['500g collard greens or kale, shredded', '1 onion, sliced', '4 garlic cloves', 'Large thumb of ginger', '3 tbsp oil', '1 green chilli'],
      steps: ['Boil the greens 5 minutes and drain them well. This takes the bitterness off.',
              'Fry the onion in the oil until soft, then the garlic, ginger and chilli.',
              'Greens in with a splash of water, lid on, lowest heat, 20 minutes.',
              'Salt at the end. They should be soft, not squeaky.'] },
    { name: 'Quick greens', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['300g kale', '3 garlic cloves', 'Ginger', 'Oil', 'Lemon'],
      steps: ['Fry the garlic and ginger in oil for 1 minute.',
              'Kale in with a splash of water, covered 8 minutes.',
              'Salt and lemon.'] }
  ]);

  recipes('Chakalaka', [
    { name: 'The full relish', time: 30, serves: 4, level: 'Very easy',
      ingredients: ['2 onions, sliced', '3 carrots, grated', '2 peppers, sliced', '4 garlic cloves', '1 tbsp curry powder', '1 tin chopped tomatoes', '1 tin baked beans', '2 chillies', 'Oil'],
      steps: ['Fry the onions until soft, then the garlic, chilli and curry powder.',
              'Peppers in for 5 minutes, then the grated carrot, which should keep a little bite.',
              'Tomatoes in, cooked down 10 minutes.',
              'Beans folded through at the end and warmed, not boiled. Good hot, better cold the next day.'] },
    { name: 'Without the beans', time: 20, serves: 4, level: 'Very easy',
      ingredients: ['2 onions', '3 carrots', '2 peppers', 'Curry powder', 'Tinned tomatoes', 'Chilli'],
      steps: ['Soften onions and peppers, add spice.',
              'Carrot and tomatoes, cooked 12 minutes.',
              'Season hard — it needs more salt than you expect.'] }
  ]);

  recipes('Ribollita', [
    { name: 'Reboiled, as the name says', time: 90, serves: 6, level: 'Medium',
      ingredients: ['1 tin cannellini beans', '1 onion, 2 carrots, 2 celery sticks, all diced', '4 garlic cloves', '1 tin chopped tomatoes', '1 head cavolo nero, shredded', '300g stale sourdough', '1.2L vegetable stock', 'Olive oil'],
      steps: ['Cook the onion, carrot and celery in plenty of oil for 15 minutes, gently. No colour, just softness.',
              'Garlic, then tomatoes, cooked 10 minutes until they darken.',
              'Stock and beans — blitz half the beans first to thicken it — then the cavolo nero. Simmer 30 minutes.',
              'Tear the bread in and stir until it collapses. Take it off the heat and leave it an hour.',
              'Reheat to serve, which is the actual point of the dish, with a great deal of oil poured over.'] },
    { name: 'Same day', time: 45, serves: 4, level: 'Easy',
      ingredients: ['1 tin cannellini beans', 'Onion, carrot, celery', 'Tinned tomatoes', 'Kale', 'Stale bread', 'Stock', 'Olive oil'],
      steps: ['Soften the vegetables, add tomatoes and stock.',
              'Beans and kale, 20 minutes.',
              'Bread torn in for the last 10 minutes. Oil over every bowl.'] }
  ]);

  recipes('Panzanella', [
    { name: 'When the tomatoes are worth it', time: 30, serves: 4, level: 'Very easy',
      ingredients: ['600g very ripe tomatoes, in rough chunks', '300g stale country bread, torn', '1 red onion, sliced thin', '1 cucumber', 'A bunch of basil', '4 tbsp olive oil', '2 tbsp red wine vinegar'],
      steps: ['Salt the tomatoes in a colander set over a bowl and leave them 20 minutes. Keep what drips out — that juice is the dressing.',
              'Soak the red onion in cold water 10 minutes to take its edge off, then drain.',
              'Toss the torn bread in the tomato juice with the oil and vinegar and leave it 10 minutes to soften without going to mush.',
              'Everything together, basil torn in by hand, another 10 minutes standing before you eat it.'] },
    { name: 'With the bread toasted', time: 25, serves: 4, level: 'Very easy',
      ingredients: ['Country bread', 'Tomatoes', 'Red onion', 'Basil', 'Olive oil', 'Vinegar', 'Garlic'],
      steps: ['Tear and toast the bread with oil at 200C for 10 minutes, then rub with a cut garlic clove.',
              'Salt the tomatoes, keep the juice, dress everything together.',
              'Ten minutes standing, then eat. Better texture, less authentic.'] }
  ]);

  recipes('Pasta e ceci', [
    { name: 'Starchy and thick', time: 35, serves: 3, level: 'Easy',
      ingredients: ['2 tins chickpeas', '200g small pasta', '4 garlic cloves', '1 sprig rosemary', '2 tbsp tomato purée', '4 tbsp olive oil', '1 dried chilli'],
      steps: ['Blitz one tin of chickpeas, liquid and all, to a purée. Keep the other whole.',
              'Warm the oil gently with the garlic, rosemary and chilli for 5 minutes. Fish out the rosemary.',
              'Purée in, whole chickpeas in, tomato purée in, plus 600ml water. Simmer 10 minutes.',
              'Pasta straight into the pot — it cooks in the soup and the starch is the thickening. Stir often, add water if it tightens.',
              'It should be neither soup nor pasta. Olive oil over the top.'] },
    { name: 'Twenty minutes', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['1 tin chickpeas', '150g small pasta', '2 garlic cloves', 'Tomato purée', 'Olive oil', 'Rosemary'],
      steps: ['Soften the garlic in oil with the rosemary.',
              'Chickpeas with their liquid, purée and 400ml water, brought to a simmer.',
              'Pasta in, cooked in it, stirred often.'] }
  ]);

  recipes('Caponata', [
    { name: 'Sweet and sour', time: 50, serves: 4, level: 'Medium',
      ingredients: ['2 aubergines, in 2cm cubes', '1 onion, sliced', '3 celery sticks', '2 tbsp capers', '80g green olives', '400g tinned tomatoes', '3 tbsp red wine vinegar', '1 tbsp sugar', 'Olive oil', 'Basil'],
      steps: ['Salt the aubergine and leave it 30 minutes, then squeeze it dry. It will drink less oil this way.',
              'Fry the aubergine in batches in hot oil until deep brown on all sides. Lift out.',
              'Soften the onion and celery in the same pan, then the tomatoes, capers and olives.',
              'Vinegar and sugar in, simmered 10 minutes until it smells sharp rather than raw.',
              'Aubergine back in, warmed through, then left alone for a few hours. It is a room-temperature dish and it is better tomorrow.'] },
    { name: 'Roasted, less oil', time: 45, serves: 4, level: 'Easy',
      ingredients: ['2 aubergines', 'Onion, celery', 'Tinned tomatoes', 'Capers and olives', 'Vinegar and sugar', 'Olive oil'],
      steps: ['Roast the cubed aubergine at 220C in 3 tbsp oil for 30 minutes.',
              'Meanwhile make the sauce with the onion, celery, tomatoes, capers, olives, vinegar and sugar.',
              'Fold together and leave to cool.'] }
  ]);

  recipes('Pisto', [
    { name: 'Cooked down properly', time: 50, serves: 4, level: 'Very easy',
      ingredients: ['1 aubergine', '2 courgettes', '2 peppers', '1 onion', '4 tomatoes, or 1 tin', '3 garlic cloves', '5 tbsp olive oil'],
      steps: ['Dice everything about the same size. It matters less how big than that they match.',
              'Onion and pepper in the oil first, 10 minutes over medium-low.',
              'Aubergine next, which drinks the oil and gives it back later — another 10 minutes.',
              'Courgette, then garlic, then tomatoes. Now leave it, on the lowest heat, for 20 minutes, stirring rarely.',
              'It is ready when nothing is in a hurry and the oil has come back to the surface.'] },
    { name: 'With chickpeas, to make it dinner', time: 55, serves: 4, level: 'Easy',
      ingredients: ['Pisto as above', '1 tin chickpeas, drained', 'Smoked paprika', 'Parsley'],
      steps: ['Make the pisto.',
              'Fold the chickpeas through for the last 10 minutes so they take on the oil.',
              'A good pinch of smoked paprika and plenty of parsley at the end.'] }
  ]);

  recipes('Polenta', [
    { name: 'Stirred, the long way', time: 45, serves: 4, level: 'Easy',
      ingredients: ['200g coarse polenta', '1.2L water or stock', '1 tsp salt', '3 tbsp olive oil'],
      steps: ['Bring the salted water to a bare simmer and rain the polenta in with a whisk going. It lumps if you tip it.',
              'Switch to a wooden spoon and stir every few minutes for 40. It will spit — use a long spoon and a deep pan.',
              'It is done when it pulls away from the side of the pan and no longer tastes of raw grain.',
              'Oil in at the end, beaten hard. Salt again; polenta takes more than you think.'] },
    { name: 'Grilled the next day', time: 20, serves: 4, level: 'Very easy',
      ingredients: ['Leftover polenta', 'Olive oil'],
      steps: ['Pour the hot polenta into an oiled tin about 2cm deep and leave it to set, at least 2 hours.',
              'Cut into slabs.', 'Griddle in oil, 5 minutes a side, until crisp and marked.'] }
  ]);

  recipes('Mango sticky rice', [
    { name: 'The real thing', time: 60, serves: 4, level: 'Medium',
      ingredients: ['300g glutinous rice, soaked 4 hours', '1 tin coconut milk', '80g sugar', '1/2 tsp salt', '2 ripe mangoes', '1 tbsp toasted sesame or mung beans'],
      steps: ['Drain the soaked rice and steam it in a lined steamer for 25 minutes, until translucent. Boiling it will not do.',
              'Warm three quarters of the coconut milk with the sugar and salt until dissolved — do not boil it.',
              'Pour it over the hot rice, stir once, cover, and leave 30 minutes. It looks far too wet. It will not be.',
              'Slice the mango. Salt the reserved coconut milk a little more and spoon it over at the table.'] },
    { name: 'Faster, with pudding rice', time: 35, serves: 2, level: 'Easy',
      ingredients: ['150g pudding rice', '1 tin coconut milk', '60g sugar', 'Pinch of salt', '1 mango'],
      steps: ['Simmer the rice with half the coconut milk, 200ml water and a pinch of salt for 20 minutes.',
              'Sugar and most of the rest of the coconut milk in, cooked 5 more minutes.',
              'Rest 10 minutes. Mango alongside, the last of the coconut milk over.'] }
  ]);

  recipes('Halva', [
    { name: 'Tahini halva', time: 25, serves: 12, level: 'Medium',
      ingredients: ['400g tahini, well stirred', '300g sugar', '100ml water', '1 tsp vanilla', 'Pistachios'],
      steps: ['Warm the tahini gently to about body temperature.',
              'Boil the sugar and water to 120C. A sugar thermometer is the difference between halva and toffee.',
              'Pour the syrup into the tahini in a thin stream, stirring, and keep stirring only until it thickens and turns matt — about 30 seconds. Over-stirring makes it grainy in the wrong way.',
              'Press into a lined tin with the pistachios, cover, and leave 12 hours before cutting.'] },
    { name: 'Semolina halva', time: 30, serves: 8, level: 'Easy',
      ingredients: ['200g coarse semolina', '150ml oil', '250g sugar', '600ml water', 'Cinnamon', 'Pine nuts'],
      steps: ['Boil the sugar and water to a syrup, then set aside.',
              'Toast the semolina in the oil, stirring constantly, for 12 minutes until it is properly brown and smells of biscuits.',
              'Pour the hot syrup in — stand back, it erupts — and stir until it thickens.',
              'Lid on, off the heat, 15 minutes. Then spoon out and dust with cinnamon.'] }
  ]);

  recipes('Sorbet', [
    { name: 'With a machine', time: 30, serves: 4, level: 'Easy',
      ingredients: ['600g ripe fruit, or 500ml juice', '150g sugar', '150ml water', '1 tbsp lemon juice'],
      steps: ['Boil the sugar and water for 2 minutes to a syrup, then cool it completely.',
              'Blend with the fruit and lemon, then sieve if it has seeds or skin.',
              'Chill until properly cold — a warm mix churns to slush.',
              'Churn 25 minutes, then freeze an hour to firm up.'] },
    { name: 'Without one', time: 15, serves: 4, level: 'Very easy',
      ingredients: ['500g frozen fruit', '80g icing sugar', '1 lemon', '2 tbsp water'],
      steps: ['Blitz the frozen fruit with the sugar, lemon and water in a food processor. Stop and scrape twice.',
              'It will look like sand, then suddenly turn smooth. That moment is the sorbet.',
              'Eat immediately, or freeze 30 minutes for a firmer scoop.'] }
  ]);

  recipes('Date and nut balls', [
    { name: 'Four ingredients', time: 15, serves: 12, level: 'Very easy',
      ingredients: ['250g medjool dates, stoned', '150g almonds or walnuts', '2 tbsp cocoa', 'Pinch of salt', 'Desiccated coconut, to roll'],
      steps: ['Blitz the nuts first, alone, until they are coarse crumbs. Doing this with the dates in gives you paste.',
              'Add the dates, cocoa and salt and blitz until it starts to ball up around the blade.',
              'If it is too dry, one more date. Too wet, a spoonful more nuts.',
              'Roll into walnut-sized balls and turn them in coconut. Firm in the fridge 20 minutes.'] },
    { name: 'With oats and peanut butter', time: 12, serves: 12, level: 'Very easy',
      ingredients: ['200g dates', '100g oats', '3 tbsp peanut butter', 'Pinch of salt'],
      steps: ['Blitz the dates to a paste with a splash of hot water.',
              'Work in the oats, peanut butter and salt by hand.',
              'Roll and chill.'] }
  ]);

  recipes('Barley tea', [
    { name: 'Boiled', time: 15, serves: 4, level: 'Very easy',
      ingredients: ['4 tbsp roasted barley', '1.5L water'],
      steps: ['Bring the water to the boil, add the barley and turn it down.',
              'Simmer 10 minutes. Longer makes it bitter rather than stronger.',
              'Strain. Hot in winter, and it is better than it sounds chilled in summer.'] },
    { name: 'Cold brewed overnight', time: 5, serves: 4, level: 'Very easy',
      ingredients: ['4 tbsp roasted barley', '1.5L cold water'],
      steps: ['Barley and cold water in a jug.', 'Fridge, 8 hours.', 'Strain. Rounder and sweeter than the boiled kind.'] }
  ]);

  recipes('Horchata', [
    { name: 'Rice and cinnamon', time: 20, serves: 4, level: 'Easy',
      ingredients: ['200g long grain rice', '1 cinnamon stick', '1.2L water', '100g sugar', '1 tsp vanilla'],
      steps: ['Blitz the raw rice with the broken cinnamon stick and 400ml of the water until it is a rough slurry.',
              'Leave it to stand at least 4 hours, or overnight in the fridge.',
              'Blend again, then strain through a fine sieve lined with muslin, squeezing hard.',
              'Stir in the rest of the water, the sugar and the vanilla. Serve over a lot of ice.'] },
    { name: 'Quick, with rice milk', time: 5, serves: 2, level: 'Very easy',
      ingredients: ['500ml rice milk', '1/2 tsp ground cinnamon', '2 tbsp sugar', '1/2 tsp vanilla', 'Ice'],
      steps: ['Whisk everything together until the sugar has gone.',
              'Over ice, with more cinnamon on top. Not the real thing, and it takes five minutes.'] }
  ]);

  /* ---- the fourth intake: breadth ---------------------------------------
     Mains, fish, sandwiches, soups and puddings for the dishes added to
     data.js in the same batch. Nothing here uses an ingredient the dish is
     not tagged for: the tags are the dietary promise and the recipe under
     them has to keep it. */


  recipes('Lamb chops', [
    { name: 'In a very hot pan', time: 15, serves: 2, level: 'Easy',
      ingredients: ['4 lamb chops', '1 tbsp oil', 'Rosemary', '2 garlic cloves, bashed', 'Salt'],
      steps: ['Salt the chops and leave them 20 minutes at room temperature.',
              'Stand them fat-edge down in a hot dry pan first, held together with tongs, until the fat renders and browns. Three minutes, and it is the best part.',
              'Lay them flat, 2 minutes a side for pink, with the rosemary and garlic in the fat.',
              'Rest 5 minutes on a warm plate.'] },
    { name: 'Marinated and grilled', time: 30, serves: 2, level: 'Very easy',
      ingredients: ['4 lamb chops', '2 tbsp oil', '1 lemon', 'Oregano', 'Garlic'],
      steps: ['Marinate in the oil, lemon, oregano and crushed garlic for 20 minutes.',
              'Grill or barbecue 3 minutes a side over a fierce heat.',
              'Squeeze over more lemon and rest briefly.'] }
  ]);

  recipes('Beef stew', [
    { name: 'The long one', time: 210, serves: 6, level: 'Easy',
      ingredients: ['1kg beef shin or chuck, in large chunks', '2 onions', '3 carrots', '3 celery sticks', '3 tbsp flour', '500ml beef stock', '2 bay leaves', 'Oil'],
      steps: ['Dry the beef properly and brown it hard in batches. Crowding the pan steams it, and you will not get the colour back later.',
              'Soften the vegetables in the same pot, scraping up what is stuck.',
              'Flour in, cooked out 2 minutes, then the stock added gradually.',
              'Beef back in with the bay. Lid on, 150C oven, 3 hours.',
              'It is ready when a spoon goes through a piece without resistance. Skim the fat off the top.'] },
    { name: 'Pressure cooker', time: 60, serves: 6, level: 'Easy',
      ingredients: ['1kg beef chuck', 'Onions, carrots, celery', 'Stock', 'Flour', 'Bay'],
      steps: ['Brown the beef in the pot on sauté, then the vegetables.',
              'Flour, stock and bay in.', 'High pressure 45 minutes, then let it come down on its own.'] }
  ]);

  recipes('Shepherd’s pie', [
    { name: 'Made properly', time: 90, serves: 4, level: 'Medium',
      ingredients: ['600g lamb mince', '2 onions', '2 carrots', '2 tbsp tomato purée', '1 tbsp Worcestershire-style sauce', '400ml stock', '1kg potatoes', '80g butter', '100ml milk'],
      steps: ['Brown the mince hard, in two batches, and pour off most of the fat.',
              'Soften the onion and carrot, add the purée and cook it out for 2 minutes.',
              'Mince back in with the stock and sauce. Simmer 40 minutes, uncovered, until thick. Runny filling makes a soggy pie.',
              'Boil and mash the potatoes with the butter and warm milk. Season it harder than feels right.',
              'Spread the mash over, fork the top into ridges, and bake at 200C for 25 minutes until the peaks are brown.'] },
    { name: 'Weeknight', time: 45, serves: 4, level: 'Easy',
      ingredients: ['500g lamb mince', '1 onion', '1 tin chopped tomatoes', 'Stock cube', '800g potatoes', 'Butter'],
      steps: ['Brown the mince and onion together.', 'Tomatoes and stock cube, simmered 20 minutes.',
              'Mash on top, forked, 20 minutes at 200C.'] }
  ]);

  recipes('Meatballs', [
    { name: 'In tomato sauce', time: 60, serves: 4, level: 'Easy',
      ingredients: ['500g beef mince', '50g breadcrumbs', '50ml milk', '1 egg', '40g parmesan, grated', '2 tins chopped tomatoes', '4 garlic cloves', 'Basil', 'Oil'],
      steps: ['Soak the breadcrumbs in the milk for 5 minutes. This is what keeps them soft.',
              'Mix with the mince, egg, parmesan and plenty of salt, handling it as little as you can, then roll into balls the size of a walnut.',
              'Brown them all over in oil and lift out. They will not be cooked through yet.',
              'Garlic in the same pan, then the tomatoes, simmered 15 minutes.',
              'Meatballs back in, lid half on, 25 minutes. Basil at the end.'] },
    { name: 'Baked, less mess', time: 45, serves: 4, level: 'Very easy',
      ingredients: ['500g beef mince', 'Breadcrumbs, milk, egg, parmesan', 'Jar of tomato sauce', 'Garlic'],
      steps: ['Mix and roll as above.', 'Bake at 200C for 18 minutes on a lined tray.',
              'Drop into warmed sauce for 10 minutes so they take on some of it.'] }
  ]);



  recipes('Bulgogi', [
    { name: 'Marinated overnight', time: 40, serves: 4, level: 'Easy',
      ingredients: ['600g sirloin, sliced paper thin', '1 pear, grated', '4 tbsp soy sauce', '2 tbsp sugar', '1 tbsp sesame oil', '4 garlic cloves', '4 spring onions', 'Sesame seeds', 'Lettuce leaves'],
      steps: ['Freeze the beef 30 minutes first — it slices far thinner that way.',
              'Mix the marinade: the grated pear is not optional, it tenderises and sweetens at once.',
              'Marinate at least 2 hours, ideally overnight.',
              'Cook in a screaming hot pan in small batches. Any more and it boils.',
              'Sesame and spring onion over, wrapped in lettuce at the table.'] },
    { name: 'Quick weeknight', time: 25, serves: 2, level: 'Very easy',
      ingredients: ['300g thin beef strips', 'Soy sauce, sugar, sesame oil', 'Garlic', 'Grated apple', 'Rice'],
      steps: ['Mix and marinate 20 minutes.', 'Fry hard and fast in one layer.', 'Over rice with the pan juices.'] }
  ]);


  recipes('Peking duck pancakes', [
    { name: 'Slow-roast duck legs', time: 150, serves: 4, level: 'Medium',
      ingredients: ['4 duck legs', '1 tbsp five spice', '20 thin pancakes', '1 cucumber, in batons', '6 spring onions, shredded', 'Hoisin sauce'],
      steps: ['Rub the legs with five spice and plenty of salt and leave them uncovered in the fridge overnight if you can — dry skin is crisp skin.',
              'Roast at 150C for 2 hours on a rack, then 220C for 15 minutes to crisp.',
              'Rest, then shred the meat with two forks, skin and all.',
              'Steam the pancakes 3 minutes.',
              'Everyone builds their own: hoisin, duck, cucumber, spring onion, rolled.'] },
    { name: 'With shop-bought duck', time: 25, serves: 2, level: 'Very easy',
      ingredients: ['1 packet cooked aromatic duck', 'Pancakes', 'Cucumber', 'Spring onions', 'Hoisin'],
      steps: ['Heat the duck through as the packet says, then crisp the skin under a hot grill for 4 minutes.',
              'Shred, steam the pancakes, and put everything on the table.'] }
  ]);


  recipes('Goulash', [
    { name: 'The Hungarian way', time: 150, serves: 6, level: 'Easy',
      ingredients: ['1kg beef shin, in chunks', '4 onions, sliced', '3 tbsp sweet paprika', '1 tsp caraway', '2 peppers', '2 tomatoes', '3 potatoes', 'Oil'],
      steps: ['Cook the onions in the oil for 20 minutes until they are truly soft and sweet. There is more onion than feels right and that is correct.',
              'Off the heat, stir in the paprika — burnt paprika is bitter and there is no saving it.',
              'Beef, caraway and just enough water to cover. Lid on, lowest heat, 2 hours.',
              'Peppers, tomatoes and potatoes in for the last 30 minutes.',
              'It should be a thick soup, not a stew. Add water if it tightens.'] },
    { name: 'Pressure cooker', time: 60, serves: 6, level: 'Easy',
      ingredients: ['1kg beef', '4 onions', 'Paprika', 'Caraway', 'Peppers', 'Potatoes'],
      steps: ['Soften the onions on sauté, paprika off the heat.',
              'Beef and water in, high pressure 40 minutes.',
              'Release, add the vegetables, simmer 20 minutes with the lid off.'] }
  ]);






  recipes('Chicken tikka masala', [
    { name: 'Marinated, then sauced', time: 70, serves: 4, level: 'Medium',
      ingredients: ['700g chicken thighs, cubed', '150g yoghurt', '2 tbsp tikka spice mix', '2 onions', '4 garlic cloves', 'Thumb of ginger', '1 tin chopped tomatoes', '150ml double cream', '1 tsp garam masala', 'Oil'],
      steps: ['Marinate the chicken in the yoghurt and half the spice for at least an hour.',
              'Grill or roast it at 240C for 12 minutes until the edges blacken. The char is the tikka; without it this is just a curry.',
              'Fry the onion until brown, then the garlic, ginger and rest of the spice.',
              'Tomatoes in, cooked down 15 minutes, then blended smooth if you like it that way.',
              'Cream and chicken in, simmered 10 minutes. Garam masala off the heat.'] },
    { name: 'One pan, weeknight', time: 35, serves: 4, level: 'Easy',
      ingredients: ['700g chicken', '2 tbsp curry paste', '1 onion', '1 tin tomatoes', '100ml cream', 'Garam masala'],
      steps: ['Brown the chicken in the paste, lift out.',
              'Onion soft, tomatoes in, 15 minutes.',
              'Chicken back in with the cream, 10 minutes more.'] }
  ]);

  recipes('Sausage roll', [
    { name: 'From a block of pastry', time: 45, serves: 6, level: 'Easy',
      ingredients: ['500g puff pastry', '500g good sausagemeat', '1 onion, grated', '1 tsp sage', '1 tsp fennel seeds', '1 egg, beaten'],
      steps: ['Squeeze the grated onion dry in a cloth and mix it into the meat with the herbs and plenty of pepper.',
              'Roll the pastry into two long rectangles. Pipe or spoon the meat in a line down each.',
              'Brush one edge with egg, roll over, seal seam-side down, and press with a fork.',
              'Chill 20 minutes — warm pastry will not puff.',
              'Cut into lengths, slash the tops, egg wash, and bake at 200C for 25 minutes.'] },
    { name: 'With apple', time: 45, serves: 6, level: 'Easy',
      ingredients: ['500g puff pastry', '500g sausagemeat', '1 apple, grated', 'Sage', 'Mustard', 'Egg'],
      steps: ['Squeeze the grated apple dry and mix with the meat, sage and a spoon of mustard.',
              'Roll, seal, chill and bake as above.'] }
  ]);

  recipes('Char siu', [
    { name: 'Lacquered properly', time: 90, serves: 4, level: 'Medium',
      ingredients: ['800g pork shoulder, in long strips', '3 tbsp hoisin', '2 tbsp honey', '2 tbsp soy sauce', '1 tbsp five spice', '2 garlic cloves', '1 tbsp shaoxing or dry sherry', 'Red food colouring, optional'],
      steps: ['Marinate the pork overnight if you can, 2 hours at the very least. Keep back 3 tbsp of marinade.',
              'Roast on a rack over a tray of water at 180C for 40 minutes, turning once. The water stops the drips burning.',
              'Mix the reserved marinade with an extra spoon of honey and brush it on. Back in at 220C for 10 minutes.',
              'Brush and blast once more. You want dark, sticky edges, not an even colour.',
              'Rest 10 minutes, slice across the grain, over rice.'] },
    { name: 'Pan-glazed strips', time: 40, serves: 2, level: 'Easy',
      ingredients: ['400g pork loin strips', 'Hoisin, honey, soy, five spice', 'Garlic'],
      steps: ['Marinate 30 minutes.', 'Fry hard, then add the marinade and let it reduce to a glaze, turning the pork in it.',
              'Watch it — honey goes from caramel to burnt in under a minute.'] }
  ]);




  recipes('Philly cheesesteak', [
    { name: 'Chopped on the griddle', time: 25, serves: 2, level: 'Easy',
      ingredients: ['400g ribeye, frozen 30 minutes then sliced paper thin', '1 onion, sliced', '6 slices provolone or American cheese', '2 long soft rolls', 'Oil'],
      steps: ['Cook the onion in oil on a flat pan until soft and brown, then push it to one side.',
              'Beef onto the hot side in a single layer. Leave it 60 seconds, then chop it about with two spatulas as it cooks.',
              'Mix the onion through, season, then lay the cheese over the top and let it melt into the meat.',
              'Scoop the whole lot into the roll in one movement, using the roll as the scoop.'] },
    { name: 'With peppers', time: 30, serves: 2, level: 'Very easy',
      ingredients: ['400g thin beef', '1 onion', '1 green pepper', 'Cheese slices', 'Rolls'],
      steps: ['Soften onion and pepper together.', 'Beef in, chopped as it cooks.',
              'Cheese over, melted, then into warmed rolls.'] }
  ]);

  recipes('Fish tacos', [
    { name: 'Battered', time: 35, serves: 4, level: 'Medium',
      ingredients: ['600g white fish, in fingers', '120g flour', '1 tsp baking powder', '180ml cold soda water', 'Oil for frying', '12 corn tortillas', '1/4 red cabbage, shredded', 'Lime', '4 tbsp mayonnaise', '1 tsp chipotle paste'],
      steps: ['Whisk the flour, baking powder, salt and cold soda water to a thin batter and leave it alone — over-mixing makes it heavy.',
              'Heat the oil to 190C. Dip the fish and fry 3 minutes until pale gold. Drain on a rack, never on paper, or the bottom goes soft.',
              'Mix the mayonnaise with the chipotle and a squeeze of lime.',
              'Warm the tortillas on a dry pan. Cabbage first, fish, sauce, lime.'] },
    { name: 'Grilled, lighter', time: 20, serves: 4, level: 'Very easy',
      ingredients: ['600g white fish fillets', 'Chilli powder, cumin, lime', 'Tortillas', 'Cabbage', 'Coriander', 'Mayonnaise'],
      steps: ['Rub the fish with spice and lime, grill 3 minutes a side, then flake it.',
              'Warm tortillas, build with cabbage, fish and sauce.'] }
  ]);

  recipes('Grilled salmon', [
    { name: 'Crisp skin, in a pan', time: 15, serves: 2, level: 'Easy',
      ingredients: ['2 salmon fillets, skin on', '1 tbsp oil', 'Salt', 'Lemon'],
      steps: ['Dry the skin thoroughly and salt it. Wet skin steams and never crisps.',
              'Oil into a cold non-stick pan, salmon skin-side down, then turn the heat to medium. Starting cold renders the fat gently.',
              'Press it flat for the first 20 seconds so it does not curl. Then leave it, 6 minutes, without touching it.',
              'Turn for 60 seconds only. The middle should still be darker than the edges. Lemon over.'] },
    { name: 'Roasted with a tray of things', time: 25, serves: 2, level: 'Very easy',
      ingredients: ['2 salmon fillets', 'Cherry tomatoes', 'Courgette', 'Olives', 'Oil', 'Lemon'],
      steps: ['Roast the vegetables at 200C for 12 minutes in oil.',
              'Sit the salmon on top, back in for 10 minutes.',
              'Lemon and oil over the lot.'] }
  ]);

  recipes('Prawn curry', [
    { name: 'Goan-leaning, with coconut', time: 35, serves: 4, level: 'Easy',
      ingredients: ['500g raw prawns, peeled', '1 tin coconut milk', '2 onions', '4 garlic cloves', 'Thumb of ginger', '2 tsp turmeric', '2 tsp ground coriander', '1 tbsp tamarind paste', '2 green chillies', 'Oil'],
      steps: ['Brown the onions properly, 12 minutes, then the garlic, ginger and chilli.',
              'Ground spices in for 1 minute, then the coconut milk and tamarind. Simmer 15 minutes so it thickens and loses its raw edge.',
              'Prawns in for 3 minutes. Three. They go from perfect to rubber in about ninety seconds after that.',
              'Salt at the end, rice underneath.'] },
    { name: 'Twenty minutes', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['300g prawns', '1 tin coconut milk', '2 tbsp curry paste', 'Lime', 'Coriander'],
      steps: ['Fry the paste in oil for 1 minute until fragrant.',
              'Coconut milk in, simmered 10 minutes.',
              'Prawns 3 minutes, lime and coriander off the heat.'] }
  ]);

  recipes('Moules marinière', [
    { name: 'The classic', time: 25, serves: 2, level: 'Easy',
      ingredients: ['1kg mussels', '2 shallots, chopped fine', '2 garlic cloves', '200ml dry white wine', '50g butter', 'A large bunch of parsley', 'Bread'],
      steps: ['Scrub the mussels and pull off the beards. Throw away any that are cracked, or that stay open when you tap them.',
              'Soften the shallots and garlic in the butter without colouring them.',
              'Wine in, brought to a hard boil, then the mussels and the lid on.',
              'Four minutes, shaking the pan once. They are done the moment they open — any that stay shut go in the bin.',
              'Parsley in, and the bread is for the liquor, which is the best part.'] },
    { name: 'With cream', time: 25, serves: 2, level: 'Easy',
      ingredients: ['1kg mussels', 'Shallots, garlic, butter', '200ml white wine', '100ml double cream', 'Parsley'],
      steps: ['As above, adding the cream after the mussels have opened.',
              'Bring it back to a bare simmer only, then parsley and serve.'] }
  ]);


  recipes('Fish pie', [
    { name: 'Three fish and a proper crust', time: 75, serves: 4, level: 'Medium',
      ingredients: ['300g white fish', '200g salmon', '150g smoked haddock', '600ml milk', '1 bay leaf', '50g butter', '50g flour', 'Parsley', '1kg potatoes', '80g butter for the mash'],
      steps: ['Poach all the fish in the milk with the bay for 5 minutes, then lift it out and keep the milk. Flake the fish into big pieces.',
              'Make a white sauce with the butter, flour and the poaching milk. Cook it 5 minutes so it does not taste of flour.',
              'Parsley in, a lot, then fold the fish through gently and spread it in a dish. Let it cool and set a little.',
              'Mash the potatoes with butter and plenty of salt, and spread it over. Fork the top.',
              'Bake at 200C for 30 minutes until the top is brown and the edges are bubbling.'] },
    { name: 'With a fish pie mix', time: 50, serves: 4, level: 'Easy',
      ingredients: ['600g fish pie mix', '500ml milk', 'Butter and flour', 'Parsley', '800g potatoes'],
      steps: ['Poach the fish 4 minutes, keep the milk.', 'White sauce from the milk, parsley, fish folded in.',
              'Mash on top, 30 minutes at 200C.'] }
  ]);

  recipes('Crab cakes', [
    { name: 'Mostly crab', time: 40, serves: 4, level: 'Medium',
      ingredients: ['500g white crab meat, picked over', '1 egg', '3 tbsp mayonnaise', '1 tsp mustard', '40g cracker crumbs', 'Spring onion', 'Lemon', 'Oil'],
      steps: ['Pick through the crab for shell with your fingers, in good light. One fragment ruins the lot.',
              'Fold — do not beat — the egg, mayonnaise, mustard and crumbs together, then the crab, keeping the lumps whole.',
              'Shape into four fat cakes and chill 30 minutes. Warm mix falls apart in the pan.',
              'Fry 4 minutes a side in a little oil until dark gold. Lemon over.'] },
    { name: 'Baked', time: 40, serves: 4, level: 'Easy',
      ingredients: ['500g crab meat', 'Egg, mayonnaise, mustard, crumbs', 'Old Bay or paprika', 'Lemon'],
      steps: ['Mix and shape as above, then chill.',
              'Bake at 220C for 15 minutes on an oiled tray, turning once.'] }
  ]);

  recipes('Sardines on toast', [
    { name: 'Four minutes', time: 5, serves: 1, level: 'Very easy',
      ingredients: ['1 tin sardines in olive oil', '2 slices sourdough', '1 lemon', 'Chilli flakes', 'Parsley'],
      steps: ['Toast the bread hard. It has to hold up.',
              'Mash the sardines roughly with a fork, bones and all — they are soft and they are most of the calcium.',
              'Pile on, squeeze the lemon, scatter chilli and parsley.',
              'Pour the oil from the tin over the top rather than draining it away.'] },
    { name: 'With tomato', time: 8, serves: 1, level: 'Very easy',
      ingredients: ['1 tin sardines', 'Sourdough', '1 ripe tomato', 'Garlic clove', 'Olive oil'],
      steps: ['Toast the bread and rub it with the cut garlic clove.',
              'Grate the tomato over it, flesh only, and drizzle with oil.',
              'Sardines on top, lemon, pepper.'] }
  ]);

  recipes('Tuna melt', [
    { name: 'In a pan, pressed', time: 12, serves: 1, level: 'Very easy',
      ingredients: ['1 tin tuna, drained well', '2 tbsp mayonnaise', '1 spring onion', '1 tsp mustard', '2 slices bread', '60g cheddar, grated', 'Butter'],
      steps: ['Drain the tuna properly, pressing it against the tin. Wet filling makes a soggy sandwich.',
              'Mix with the mayonnaise, mustard and spring onion.',
              'Butter the outsides of the bread, not the insides. Cheese, tuna, cheese — the cheese on both sides is the glue.',
              'Medium-low heat, 4 minutes a side, pressed with a spatula. Low and slow, or the cheese is still solid when the bread burns.'] },
    { name: 'Open, under the grill', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['1 tin tuna', 'Mayonnaise', 'Cheddar', '2 slices bread', 'Tomato'],
      steps: ['Toast the bread on one side under the grill.',
              'Tuna mix on the untoasted side, tomato slices, cheese over.',
              'Back under until bubbling and blistered.'] }
  ]);

  recipes('Eggs benedict', [
    { name: 'With blender hollandaise', time: 30, serves: 2, level: 'Medium',
      ingredients: ['4 eggs, plus 3 yolks for the sauce', '150g butter, melted and hot', '1 tbsp lemon juice', '2 muffins', '4 slices ham', 'Vinegar for the water'],
      steps: ['Blitz the yolks with the lemon and a pinch of salt, then pour the hot melted butter in a thin, slow stream with the motor running. Too fast and it splits.',
              'Keep the sauce somewhere warm, not hot. Over heat it will scramble.',
              'Simmer a wide pan of water with a splash of vinegar. Crack each egg into a cup first, stir a gentle whirlpool, and slide it in.',
              'Three minutes for a set white and a liquid yolk. Lift out with a slotted spoon onto kitchen paper.',
              'Toasted muffin, ham, egg, sauce. In that order, immediately.'] },
    { name: 'Cheat hollandaise', time: 20, serves: 2, level: 'Easy',
      ingredients: ['4 eggs', '4 tbsp mayonnaise', '2 tbsp butter, melted', 'Lemon', 'Mustard', 'Muffins', 'Ham'],
      steps: ['Warm the mayonnaise with the melted butter, lemon and a little mustard, whisking. It will not split on you.',
              'Poach the eggs, toast the muffins, build as above.'] }
  ]);

  recipes('Breakfast burrito', [
    { name: 'Wrapped and griddled', time: 25, serves: 2, level: 'Easy',
      ingredients: ['4 eggs', '2 large tortillas', '1 potato, diced small', '60g cheddar, grated', '1/2 onion', 'Hot sauce', 'Oil'],
      steps: ['Fry the diced potato with the onion until crisp and cooked through, 12 minutes. Do this first; everything else is quick.',
              'Scramble the eggs slowly, off the heat at the last moment — they carry on cooking in the wrap.',
              'Warm the tortillas so they fold without cracking.',
              'Fill in a line just below the middle: potato, egg, cheese, hot sauce. Fold the sides in first, then roll tight.',
              'Griddle seam-side down for 2 minutes to seal it.'] },
    { name: 'Made ahead, frozen', time: 40, serves: 6, level: 'Easy',
      ingredients: ['8 eggs', '6 tortillas', 'Potato, onion, pepper', 'Cheese', 'Foil'],
      steps: ['Cook the filling and let it cool completely — warm filling steams and goes soggy.',
              'Wrap each burrito in foil and freeze.',
              'From frozen: 25 minutes at 190C, still in the foil, opened for the last 5.'] }
  ]);

  recipes('Porridge', [
    { name: 'With water and salt', time: 12, serves: 1, level: 'Very easy',
      ingredients: ['50g rolled oats', '300ml water', 'A good pinch of salt'],
      steps: ['Oats and cold water into the pan together, then bring it up slowly.',
              'Stir often once it starts to thicken, 8 minutes, until it falls thickly off the spoon.',
              'Salt in at the end. Scottish orthodoxy says salt and no sugar, and it is right — salt makes the oats taste of more.',
              'Let it sit off the heat for a minute before eating; it thickens again.'] },
    { name: 'Overnight oats', time: 5, serves: 1, level: 'Very easy',
      ingredients: ['50g rolled oats', '150ml oat milk', '1 tbsp chia seeds', 'Fruit', 'Cinnamon'],
      steps: ['Everything but the fruit into a jar, stirred.', 'Fridge overnight.',
              'Fruit on top in the morning. Loosen with a splash more if it has gone stiff.'] }
  ]);

  recipes('Granola', [
    { name: 'Clustered', time: 45, serves: 12, level: 'Very easy',
      ingredients: ['400g rolled oats', '150g nuts, roughly chopped', '80ml oil', '120ml maple syrup or honey', '1 tsp cinnamon', 'Salt'],
      steps: ['Mix everything and spread it in one layer on a big tray, pressed down firmly. Pressing is what makes clusters.',
              'Bake at 150C for 35 minutes, turning the tray once but not stirring it.',
              'Cool completely on the tray before you break it up. It crisps as it cools, not in the oven.'] },
    { name: 'With dried fruit', time: 45, serves: 12, level: 'Very easy',
      ingredients: ['400g oats', 'Nuts and seeds', 'Oil and syrup', '150g dried fruit'],
      steps: ['Bake the oats, nuts and seeds as above.',
              'Stir the dried fruit in only after it comes out — in the oven it turns to charcoal.'] }
  ]);

  recipes('Minestrone', [
    { name: 'Whatever the week left', time: 50, serves: 6, level: 'Very easy',
      ingredients: ['1 onion, 2 carrots, 2 celery sticks, diced', '3 garlic cloves', '1 courgette', '1 tin chopped tomatoes', '1 tin cannellini beans', '1.5L stock', '100g small pasta', 'Green beans', 'Olive oil', 'Basil'],
      steps: ['Soften the onion, carrot and celery in oil for 15 minutes. This base is most of the flavour and it cannot be hurried.',
              'Garlic, then tomatoes, cooked 5 minutes.',
              'Stock and beans in, simmered 20 minutes.',
              'Courgette, green beans and pasta for the last 10 — any earlier and the pasta turns to paste.',
              'Olive oil and torn basil in every bowl.'] },
    { name: 'Store cupboard', time: 30, serves: 4, level: 'Very easy',
      ingredients: ['1 onion', '1 tin tomatoes', '1 tin mixed beans', 'Stock', '80g pasta', 'Frozen vegetables', 'Olive oil'],
      steps: ['Soften the onion, add tomatoes and stock.',
              'Beans in, 10 minutes.', 'Pasta and frozen vegetables for the last 10.'] }
  ]);

  recipes('Tom yum', [
    { name: 'Clear, the way it comes', time: 30, serves: 4, level: 'Medium',
      ingredients: ['400g raw prawns, shells kept', '1.2L water', '3 lemongrass stalks, bashed', '6 lime leaves', 'Thumb of galangal, sliced', '200g mushrooms', '3 tbsp fish sauce', '4 limes', '6 bird’s eye chillies, bruised', 'Coriander'],
      steps: ['Fry the prawn shells in a dry pot for 2 minutes until they turn orange and smell sweet, then add the water. This is the stock and it takes ten minutes.',
              'Strain, then return to the pot with the lemongrass, lime leaves, galangal and chillies. Simmer 10 minutes.',
              'Mushrooms in for 3 minutes, then the prawns for 2.',
              'Off the heat: fish sauce and lime juice, tasted and adjusted. It should be sour first, salty second, hot third.',
              'Never boil it after the lime goes in.'] },
    { name: 'Creamy, with paste', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['300g prawns', '2 tbsp tom yum paste', '800ml stock', '150g mushrooms', '100ml evaporated or coconut milk', 'Lime', 'Fish sauce'],
      steps: ['Fry the paste 1 minute, add the stock, simmer 8 minutes.',
              'Mushrooms, then prawns for 2 minutes.',
              'Milk, lime and fish sauce off the heat.'] }
  ]);

  recipes('French onion soup', [
    { name: 'An hour of onions', time: 90, serves: 4, level: 'Easy',
      ingredients: ['1kg onions, sliced thin', '60g butter', '1 tbsp oil', '1 tsp sugar', '150ml dry white wine', '1.2L vegetable stock', '1 baguette', '150g gruyère, grated', 'Thyme'],
      steps: ['Onions, butter, oil and a pinch of salt in a wide heavy pan, lid on, 15 minutes to sweat them down.',
              'Lid off, sugar in, and now the long part: 45 minutes on medium-low, stirred every few minutes. They go gold, then amber, then properly brown. There is no shortcut and every minute you cut shows in the bowl.',
              'Wine in, scraping the pan, reduced by half. Then the stock and thyme, simmered 20 minutes.',
              'Toast rounds of baguette, float them on the soup in ovenproof bowls, heap the cheese on.',
              'Under a hot grill until the cheese is blistered and running down the sides.'] },
    { name: 'Without the grill', time: 80, serves: 4, level: 'Very easy',
      ingredients: ['1kg onions', 'Butter', 'Stock', 'Thyme', 'Bread and cheese'],
      steps: ['Caramelise the onions as above.', 'Stock and thyme, 20 minutes.',
              'Make cheese on toast separately and drop it in at the table.'] }
  ]);

  recipes('Banoffee pie', [
    { name: 'With tinned caramel', time: 30, serves: 8, level: 'Very easy',
      ingredients: ['250g digestive biscuits', '100g butter, melted', '1 tin caramel', '4 bananas', '400ml double cream', 'Dark chocolate, to grate'],
      steps: ['Crush the biscuits to crumbs and mix with the butter. Press hard into a tin, up the sides too, and chill 30 minutes.',
              'Spread the caramel over the cold base.',
              'Slice the bananas over it, in a close layer — they will not brown under the cream.',
              'Whip the cream to soft peaks only. Stiff cream looks wrong and tastes worse.',
              'Pile it on, grate chocolate over, and keep it cold until the moment it is cut.'] },
    { name: 'Boiling your own caramel', time: 180, serves: 8, level: 'Medium',
      ingredients: ['1 tin condensed milk', 'Digestives and butter', 'Bananas', 'Cream'],
      steps: ['Boil the unopened tin, fully submerged, for 3 hours. Keep it covered with water the entire time — a dry tin is dangerous.',
              'Cool it completely in the tin before opening.',
              'Build as above.'] }
  ]);

  recipes('Eton mess', [
    { name: 'Five minutes', time: 10, serves: 4, level: 'Very easy',
      ingredients: ['400g strawberries', '300ml double cream', '4 meringue nests', '1 tbsp icing sugar', '1 lemon'],
      steps: ['Crush a third of the strawberries with the icing sugar and a squeeze of lemon to make a rough sauce. Leave it 10 minutes to go syrupy.',
              'Chop the rest.',
              'Whip the cream to soft peaks — it must not be stiff or the mess will not fold.',
              'Break the meringue in by hand, in uneven pieces, then fold everything together twice only. Two folds. It should be streaked, not pink.'] },
    { name: 'With roasted rhubarb', time: 40, serves: 4, level: 'Easy',
      ingredients: ['400g rhubarb', '80g sugar', '1 orange', 'Cream', 'Meringues'],
      steps: ['Roast the rhubarb with the sugar and orange juice at 180C for 20 minutes, then cool.',
              'Fold through whipped cream and broken meringue as above.'] }
  ]);

  recipes('Panna cotta', [
    { name: 'It should wobble', time: 20, serves: 4, level: 'Medium',
      ingredients: ['500ml double cream', '100ml milk', '60g sugar', '1 vanilla pod', '2 sheets gelatine'],
      steps: ['Soak the gelatine in cold water for 5 minutes until it goes floppy.',
              'Warm the cream, milk, sugar and split vanilla pod to just below a simmer. Do not boil it.',
              'Off the heat, squeeze the gelatine out and stir it in until it has completely gone.',
              'Strain into moulds and chill at least 4 hours. Two sheets is deliberately the minimum — more sets it firm, and firm panna cotta is a bad panna cotta.',
              'Dip the moulds in hot water for 3 seconds to turn out.'] },
    { name: 'Coconut, no dairy', time: 20, serves: 4, level: 'Easy',
      ingredients: ['400ml coconut milk', '200ml coconut cream', '60g sugar', '2 tsp agar agar', 'Lime zest'],
      steps: ['Whisk the agar into the cold coconut milk, then bring to the boil for 2 minutes — agar needs boiling, unlike gelatine.',
              'Sugar, cream and zest in, then poured into moulds.',
              'Sets at room temperature in an hour. Firmer than the dairy one, by nature.'] }
  ]);

  recipes('Affogato', [
    { name: 'As it comes', time: 3, serves: 1, level: 'Very easy',
      ingredients: ['2 scoops vanilla ice cream', '1 shot hot espresso'],
      steps: ['Put the ice cream in a small glass and put the glass in the freezer while you make the coffee. A cold glass buys you a minute.',
              'Pull the espresso and pour it over at the table, not in the kitchen.',
              'Eat it immediately. The whole thing is the ten seconds where it is both hot and frozen.'] },
    { name: 'With something in it', time: 5, serves: 1, level: 'Very easy',
      ingredients: ['2 scoops ice cream', '1 shot espresso', 'Amaretti biscuit', 'Cocoa'],
      steps: ['Crush the biscuit over the ice cream.', 'Espresso poured over, cocoa dusted on top.'] }
  ]);

  recipes('Matcha latte', [
    { name: 'Whisked properly', time: 5, serves: 1, level: 'Easy',
      ingredients: ['1.5 tsp matcha powder', '60ml water at 80C', '200ml milk', 'Honey or sugar, optional'],
      steps: ['Sift the matcha into the cup. Unsifted matcha lumps and never recovers.',
              'Add the water — 80C, not boiling, or it turns bitter — and whisk in a W shape until it foams.',
              'Warm and froth the milk, then pour it in slowly against the side.',
              'Sweeten if you like; good matcha needs less than you think.'] },
    { name: 'Iced', time: 5, serves: 1, level: 'Very easy',
      ingredients: ['1.5 tsp matcha', '60ml warm water', 'Cold milk', 'Ice', 'Syrup'],
      steps: ['Sift and whisk the matcha with the warm water until smooth.',
              'Fill a glass with ice and cold milk, then pour the matcha over the top so it layers.'] }
  ]);

  recipes('Masala chai', [
    { name: 'Boiled, not steeped', time: 12, serves: 2, level: 'Very easy',
      ingredients: ['300ml water', '200ml whole milk', '2 tsp strong black tea', '4 cardamom pods, crushed', '1 cinnamon stick', 'Thumb of ginger, sliced', '2 cloves', 'Sugar to taste'],
      steps: ['Bring the water to the boil with the crushed spices and ginger and let it go 3 minutes. Crushing matters — whole pods give you nothing.',
              'Tea in, boiled another 2 minutes.',
              'Milk and sugar in, brought back to the boil. Let it rise up the pan and pull it off, three times. That is what makes chai rather than spiced tea.',
              'Strain from a height into the cups.'] },
    { name: 'With a paste, quicker', time: 6, serves: 2, level: 'Very easy',
      ingredients: ['300ml water', '200ml milk', '2 tsp tea', '1 tsp chai masala powder', 'Sugar'],
      steps: ['Boil the water with the tea and the masala powder for 3 minutes. Ready-ground spice gives itself up faster than whole, so this is the one place the shortcut costs nothing.',
              'Milk and sugar in, brought up to the boil and pulled off twice rather than three times.',
              'Strain into the cups from a height. Thinner than the boiled version, and still a good cup of tea.'] }
  ]);

  recipes('Hot toddy', [
    { name: 'The standard', time: 5, serves: 1, level: 'Very easy',
      ingredients: ['50ml whisky', '2 tsp honey', '1/2 lemon, juiced', '150ml hot water', '1 cinnamon stick', 'A slice of lemon with 3 cloves in it'],
      steps: ['Warm the glass with hot water first and pour it away, or the drink is lukewarm in a minute.',
              'Honey into the glass, a splash of hot water, stirred until it has dissolved. Honey will not dissolve in cold spirit.',
              'Whisky and lemon juice in, then the rest of the water — hot, not boiling, or the whisky turns harsh.',
              'Cinnamon stick to stir with, clove-studded lemon floated on top.'] },
    { name: 'Without the alcohol', time: 5, serves: 1, level: 'Very easy',
      ingredients: ['2 tsp honey', '1/2 lemon', '200ml hot water', 'Thumb of ginger, sliced', 'Cinnamon'],
      steps: ['Steep the ginger and cinnamon in the hot water for 4 minutes.',
              'Honey and lemon stirred in off the heat.'] }
  ]);

  recipes('Arancini', [
    { name: 'From yesterday’s risotto', time: 45, serves: 4, level: 'Medium',
      ingredients: ['600g cold risotto', '100g mozzarella, in small cubes', '2 eggs', '80g flour', '150g breadcrumbs', 'Oil for frying'],
      steps: ['The risotto must be properly cold and stiff. Warm risotto will not hold a ball and there is no fixing it.',
              'Take a heaped tablespoon, flatten it in your palm, put a cube of mozzarella in the middle and close it into a ball.',
              'Flour, then beaten egg, then breadcrumbs. Press the crumbs on firmly and do the whole batch before you fry anything.',
              'Fry at 180C for 4 minutes until deep gold, three or four at a time.',
              'Drain on a rack and wait two minutes — the middle is molten and it will take the roof of your mouth off.'] },
    { name: 'Baked', time: 40, serves: 4, level: 'Easy',
      ingredients: ['600g cold risotto', 'Mozzarella', 'Egg, flour, breadcrumbs', 'Oil spray'],
      steps: ['Shape and crumb as above.', 'Spray well with oil and bake at 200C for 25 minutes, turning once.',
              'Paler, less rich, and they still work.'] }
  ]);


  recipes('Bibingka', [
    { name: 'Baked in banana leaf', time: 50, serves: 8, level: 'Medium',
      ingredients: ['250g rice flour', '150g sugar', '2 tsp baking powder', '3 eggs', '400ml coconut milk', '100ml evaporated milk', '60g butter, melted', 'Banana leaf', 'Salted egg and grated coconut, to top'],
      steps: ['Line a round tin with softened banana leaf — pass it briefly over a flame and it goes pliable and smells of the tropics.',
              'Whisk the dry ingredients, then beat in the eggs, both milks and the butter until smooth.',
              'Pour in and bake at 180C for 30 minutes, until a skewer comes out clean.',
              'Brush with more butter, scatter sugar and grated coconut, and give it 5 minutes under the grill.',
              'Eat warm. It is not the same cold.'] },
    { name: 'Without the leaf', time: 45, serves: 8, level: 'Easy',
      ingredients: ['250g rice flour', 'Sugar, baking powder', '3 eggs', 'Coconut milk', 'Butter', 'Grated coconut'],
      steps: ['Line the tin with baking paper instead.',
              'Mix and bake as above at 180C for 30 minutes.',
              'Butter and coconut on top, grilled 5 minutes.'] }
  ]);

  /* ---- the fifth intake: the map ----------------------------------------
     For the kitchens the catalogue had none of. Ingredient lists are checked
     against each dish's tags by the build, so what is written here is what
     the dietary rules already promised. */

  recipes('Ghormeh sabzi', [
    { name: 'The herbs take an hour', time: 180, serves: 6, level: 'Medium',
      ingredients: ['500g lamb shoulder, cubed', '4 bunches parsley', '2 bunches coriander', '1 bunch chives', '2 tbsp dried fenugreek leaf', '2 onions', '1 tin red kidney beans', '4 dried limes, pierced', 'Turmeric', 'Oil'],
      steps: ['Chop the herbs very fine and fry them in oil over medium-low heat for 25 minutes, until the whole panful has gone dark, almost black, and smells nutty. This is the dish; rushing it gives you green soup.',
              'Separately brown the onion, then the lamb with turmeric and salt.',
              'Herbs, lamb, beans, dried limes and 800ml water together. Lowest heat, 2 hours.',
              'Press the limes against the side near the end to let their sourness out. Rice and tahdig underneath.'] },
    { name: 'With frozen herbs', time: 90, serves: 4, level: 'Easy',
      ingredients: ['400g lamb or beef', '1 packet frozen ghormeh sabzi herb mix', '1 tin kidney beans', '3 dried limes', '1 onion', 'Turmeric', 'Oil'],
      steps: ['Fry the frozen herbs in oil for 15 minutes until they darken and dry out.',
              'Brown the onion and meat with turmeric.',
              'Everything with 700ml water, simmered 70 minutes.'] }
  ]);

  recipes('Fesenjan', [
    { name: 'Walnut and pomegranate', time: 120, serves: 4, level: 'Medium',
      ingredients: ['400g walnuts', '6 chicken thighs', '300ml pomegranate molasses', '1 onion', '1 tsp turmeric', '2 tbsp sugar', 'Oil'],
      steps: ['Blitz the walnuts to a paste, then toast them in a dry pan, stirring, for 10 minutes until they smell warm and start to release oil.',
              'Brown the onion and chicken with the turmeric.',
              'Walnuts, molasses, sugar and 600ml water. Lowest heat, 90 minutes, stirring now and then.',
              'It goes from grey to deep brown and the oil comes to the surface. That is when it is ready. Balance the sour with sugar to taste.'] },
    { name: 'Faster, with mince', time: 60, serves: 4, level: 'Easy',
      ingredients: ['300g walnuts', '400g chicken mince, rolled into balls', 'Pomegranate molasses', 'Onion', 'Turmeric', 'Sugar'],
      steps: ['Toast the ground walnuts as above.', 'Brown the meatballs and onion.',
              'Simmer everything 45 minutes until dark.'] }
  ]);

  recipes('Tahdig', [
    { name: 'Rice crust, the plain way', time: 75, serves: 4, level: 'Hard',
      ingredients: ['400g basmati rice', '3 tbsp salt for the water', '80g butter', '3 tbsp oil', '1/2 tsp saffron, ground and steeped', '3 tbsp yoghurt'],
      steps: ['Rinse the rice five times and soak it 1 hour in heavily salted water.',
              'Parboil 6 minutes only — it should still snap in the middle. Drain and rinse with cold water.',
              'Mix a cupful of the rice with the yoghurt and saffron, and press it into the buttered, oiled pan in an even layer. That layer becomes the crust.',
              'Pile the rest on loosely in a pyramid, poke holes down through it with the handle of a spoon, and cover the lid with a tea towel.',
              'Lowest heat, 50 minutes. Do not lift the lid. Turn out onto a plate in one movement and hope.'] },
    { name: 'Potato tahdig', time: 70, serves: 4, level: 'Medium',
      ingredients: ['400g basmati', '2 potatoes, sliced 5mm', 'Butter and oil', 'Saffron', 'Salt'],
      steps: ['Parboil and drain the rice as above.',
              'Lay the potato slices in the buttered pan in one overlapping layer, salted.',
              'Rice piled on top, holes poked, tea towel under the lid, 50 minutes on the lowest heat.'] }
  ]);

  recipes('Khachapuri', [
    { name: 'Adjaruli, the boat', time: 90, serves: 4, level: 'Medium',
      ingredients: ['400g strong flour', '250ml warm milk', '7g yeast', '1 tsp sugar', '400g mozzarella and feta, mixed', '4 eggs', '60g butter'],
      steps: ['Make a soft dough with the flour, milk, yeast, sugar and salt. Knead 8 minutes and leave it to double, about an hour.',
              'Divide in four, roll each into an oval, then roll the two long sides inward and pinch the ends to make a boat.',
              'Fill with the cheese and bake at 230C for 12 minutes, until the walls are gold.',
              'Pull them out, make a well in the cheese, crack an egg into each, and give them 3 minutes more — the white should just set.',
              'A knob of butter on top, and stir the egg through at the table before you tear the ends off to dip.'] },
    { name: 'With shop-bought dough', time: 35, serves: 2, level: 'Easy',
      ingredients: ['1 roll pizza dough', '250g mozzarella and feta', '2 eggs', 'Butter'],
      steps: ['Shape two boats, fill with cheese.', 'Bake at 230C for 12 minutes.',
              'Egg into the well, 3 minutes more, butter on top.'] }
  ]);

  recipes('Khinkali', [
    { name: 'Pleated by hand', time: 90, serves: 4, level: 'Hard',
      ingredients: ['500g plain flour', '250ml water', '400g beef and pork mince', '2 onions, grated', '1 tsp coriander seed, ground', '1 tsp caraway', '150ml cold water for the filling', 'Black pepper'],
      steps: ['Work the flour, water and salt to a stiff dough and rest it 30 minutes.',
              'Mix the mince with the grated onion, spices, plenty of pepper and the cold water, a splash at a time, until it is loose and wet. That water becomes the soup.',
              'Roll discs thin, put a spoonful in the middle, and pleat the edge upward — eighteen folds is the traditional count — twisting the top into a knot.',
              'Boil in salted water 8 minutes, stirring once so they do not stick.',
              'Hold by the knot, bite a hole, drink the broth, then eat the rest. The knot is left on the plate and counted.'] },
    { name: 'With bought wrappers', time: 35, serves: 3, level: 'Easy',
      ingredients: ['1 packet round dumpling wrappers', '300g mince', '1 onion, grated', 'Caraway and coriander seed', 'Cold water', 'Pepper'],
      steps: ['Make the loose filling as above.', 'Fill and pleat, sealing tightly at the top.',
              'Boil 6 minutes. Less broth inside, most of the pleasure.'] }
  ]);

  recipes('Smorrebrod', [
    { name: 'Three classic ones', time: 25, serves: 2, level: 'Very easy',
      ingredients: ['6 slices dense rye bread', 'Butter', '200g pickled herring', '2 boiled eggs', '150g cold prawns', 'Mayonnaise', 'Dill', 'Radish', 'Lemon'],
      steps: ['Butter the rye right to the edges. It is not optional — it stops the topping soaking in and it is half the flavour.',
              'Herring with sliced red onion and dill on the first.',
              'Egg, prawns, a spoon of mayonnaise and lemon on the second.',
              'Radish, more butter and flaky salt on the third.',
              'Built tall, eaten with a knife and fork, and never stacked into a sandwich.'] },
    { name: 'One good one', time: 10, serves: 1, level: 'Very easy',
      ingredients: ['2 slices rye bread', 'Butter', '100g smoked salmon', 'Soured cream', 'Dill', 'Lemon', 'Cucumber'],
      steps: ['Butter the rye thickly.', 'Cucumber, then salmon in folds, then a spoon of soured cream.',
              'Dill and lemon over the top.'] }
  ]);

  recipes('Swedish meatballs', [
    { name: 'With the cream sauce', time: 50, serves: 4, level: 'Medium',
      ingredients: ['500g beef and pork mince', '60g breadcrumbs', '100ml milk', '1 onion, grated', '1 egg', '1/2 tsp allspice', '40g butter', '2 tbsp flour', '500ml beef stock', '150ml double cream', 'Lingonberry jam'],
      steps: ['Soak the breadcrumbs in the milk 5 minutes, then mix with the mince, grated onion, egg, allspice and plenty of salt. Roll small — smaller than you think.',
              'Fry in butter in batches until browned all over and lift out.',
              'Flour into the pan fat, cooked 2 minutes, then the stock added slowly, then the cream.',
              'Meatballs back in, simmered 15 minutes until the sauce coats them.',
              'Mash, and a spoon of lingonberry on the side of the plate.'] },
    { name: 'Baked, then sauced', time: 40, serves: 4, level: 'Easy',
      ingredients: ['500g mince', 'Breadcrumbs, milk, egg, onion, allspice', 'Stock, cream, flour, butter'],
      steps: ['Roll and bake at 200C for 15 minutes.',
              'Make the sauce in a pan and drop them in for 10 minutes.'] }
  ]);

  recipes('Gravlax', [
    { name: 'Two days, no cooking', time: 30, serves: 8, level: 'Easy',
      ingredients: ['1kg salmon fillet, skin on, pin-boned', '150g coarse salt', '150g sugar', '2 large bunches dill', '2 tbsp crushed white pepper'],
      steps: ['Mix the salt, sugar and pepper. Lay half the dill in a dish, the salmon skin-down on it, then the cure packed over the flesh and the rest of the dill on top.',
              'Cover, weight it with tins, and refrigerate 48 hours, turning once a day and pouring off the brine that comes out.',
              'Rinse briefly, pat dry, and slice thin on a long diagonal away from the skin.',
              'Mustard and dill sauce, and rye bread.'] },
    { name: 'Overnight, thinner piece', time: 20, serves: 4, level: 'Very easy',
      ingredients: ['400g salmon fillet', '80g salt', '80g sugar', 'Dill', 'Lemon zest'],
      steps: ['Cure as above but only 14 hours for a thinner fillet.',
              'Rinse, dry, slice. Softer and less salty than the full cure.'] }
  ]);

  recipes('Rice and curry', [
    { name: 'Five small ones', time: 75, serves: 4, level: 'Medium',
      ingredients: ['300g rice', '1 tin coconut milk', '200g red lentils', '1 aubergine', '200g green beans', '2 onions', '4 garlic cloves', 'Curry leaves', '2 tbsp Sri Lankan curry powder', '1 tsp turmeric', 'Pandan leaf'],
      steps: ['Dhal first: lentils, turmeric, half the coconut milk, an onion and curry leaves, simmered 25 minutes.',
              'Aubergine moju: fry slices until deep brown, then toss with vinegar, sugar and chilli.',
              'Green bean curry: beans, coconut milk, curry powder, 10 minutes.',
              'Rice with a pandan leaf in it.',
              'Everything in small bowls round the rice. The point is having four or five things at once, not one big one.'] },
    { name: 'Two curries and rice', time: 40, serves: 2, level: 'Easy',
      ingredients: ['200g rice', '150g red lentils', '1 tin coconut milk', 'Curry powder', 'Onion, garlic, curry leaves', '200g green beans'],
      steps: ['Dhal as above.', 'Bean curry as above.', 'Rice. Three bowls, one plate.'] }
  ]);

  recipes('Hoppers', [
    { name: 'Fermented overnight', time: 40, serves: 4, level: 'Hard',
      ingredients: ['250g rice flour', '1 tin coconut milk', '1 tsp yeast', '1 tsp sugar', '100ml warm water', '4 eggs', 'Salt'],
      steps: ['Whisk the yeast and sugar into the warm water and leave it 10 minutes until it foams.',
              'Beat in the rice flour and coconut milk to a thin batter, thinner than pancake batter, and leave it somewhere warm 8 hours.',
              'Get a small bowl-shaped pan very hot. Pour in a ladleful and immediately swirl the pan so the batter climbs the sides.',
              'Lid on, 3 minutes. The middle stays soft and the rim goes lacy and crisp.',
              'For an egg hopper, crack one into the middle at the start and cover until it sets.'] },
    { name: 'Without the wait', time: 20, serves: 2, level: 'Medium',
      ingredients: ['150g rice flour', '200ml coconut milk', '1/2 tsp bicarbonate of soda', '1 tsp sugar', '2 eggs'],
      steps: ['Whisk to a thin batter with the bicarbonate in at the end.',
              'Swirl in a hot bowl pan, lid on, 3 minutes.',
              'Less sour than the fermented version, and it is Tuesday.'] }
  ]);

  recipes('Kottu roti', [
    { name: 'Clattered on a hot plate', time: 30, serves: 2, level: 'Easy',
      ingredients: ['4 godhamba roti or parathas, shredded', '200g cooked chicken, shredded', '2 eggs', '1 onion', '1 leek', '2 green chillies', '3 tbsp curry sauce or gravy', 'Curry powder', 'Oil'],
      steps: ['Get the pan hotter than you would for anything else and keep it there.',
              'Onion, leek and chilli first, hard, 3 minutes.',
              'Push aside, scramble the eggs in the space, then mix through.',
              'Chicken, curry powder, then the shredded roti and the gravy.',
              'Now chop and turn it constantly with two spatulas for 3 minutes. The noise is the recipe.'] },
    { name: 'Vegetable, with tortillas', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['4 flour tortillas, shredded', '2 eggs', 'Onion, leek, carrot', 'Curry powder', 'Soy sauce', 'Oil'],
      steps: ['Fry the vegetables hard, scramble the egg alongside.',
              'Shredded tortilla and seasoning in, chopped and turned for 3 minutes.'] }
  ]);

  recipes('Mohinga', [
    { name: 'The proper broth', time: 90, serves: 6, level: 'Hard',
      ingredients: ['800g catfish or mackerel', '2 banana stems or 200g tinned bamboo shoot', '4 lemongrass stalks', '3 onions', '6 garlic cloves', 'Thumb of ginger', '3 tbsp fish sauce', '100g chickpea flour', '1 tsp turmeric', '500g rice vermicelli', 'Boiled eggs, coriander, lime, fritters to serve'],
      steps: ['Poach the fish with lemongrass and salt for 15 minutes, then lift out, flake it and keep every drop of the stock.',
              'Blitz the onion, garlic and ginger to a paste and fry it in oil with the turmeric for 10 minutes.',
              'Stock back in with the flaked fish and fish sauce. Simmer 30 minutes.',
              'Whisk the chickpea flour into cold water and stir it in — it thickens the broth to the right slippery weight.',
              'Over noodles, with egg, coriander, lime and something crunchy on top. The toppings are half of it.'] },
    { name: 'Weeknight version', time: 35, serves: 4, level: 'Easy',
      ingredients: ['2 tins mackerel', '1.2L fish or vegetable stock', '2 onions', 'Lemongrass, garlic, ginger', 'Chickpea flour', 'Fish sauce', 'Rice noodles', 'Lime and coriander'],
      steps: ['Fry the blitzed aromatics, add stock and flaked mackerel.',
              'Thicken with chickpea flour slurry, simmer 20 minutes.',
              'Over noodles with lime and herbs.'] }
  ]);

  recipes('Tea leaf salad', [
    { name: 'Lahpet thoke', time: 20, serves: 4, level: 'Easy',
      ingredients: ['4 tbsp fermented tea leaf paste', '100g fried broad beans', '50g fried split peas', '50g peanuts', '2 tomatoes, diced', '1/4 white cabbage, shredded', '3 garlic cloves, sliced and fried', '2 limes', 'Fish sauce', 'Sesame seeds'],
      steps: ['Keep every element in its own pile until the last moment — half the pleasure is the contrast and it goes soft if it sits dressed.',
              'Fry the sliced garlic in oil until pale gold and lift it out at once; it keeps browning off the heat.',
              'At the table: tea leaf in the middle, everything else round it, then tossed hard for a full 20 seconds.',
              'Lime and fish sauce to taste. It should be sour, salty, bitter and crunchy all at the same time.'] },
    { name: 'Without the fermented leaf', time: 15, serves: 4, level: 'Very easy',
      ingredients: ['4 tbsp strong brewed green tea leaves, squeezed dry', '2 tbsp sesame oil', 'Fried beans, peanuts, sesame', 'Cabbage, tomato', 'Lime', 'Fish sauce', 'Garlic'],
      steps: ['Steep the leaves 10 minutes, squeeze them out, chop and dress with sesame oil and a little lime.',
              'Build and toss as above. Less funk, same crunch.'] }
  ]);

  recipes('Momos', [
    { name: 'Steamed, with the tomato dip', time: 75, serves: 4, level: 'Medium',
      ingredients: ['400g plain flour', '220ml water', '400g chicken or pork mince', '1 onion, very finely chopped', 'Thumb of ginger', '4 garlic cloves', '2 spring onions', '1 tsp Sichuan pepper', '4 tomatoes', '4 dried chillies', '1 tbsp sesame seeds'],
      steps: ['Work the flour and water into a firm dough and rest it 30 minutes under a bowl.',
              'Mix the filling: the onion must be chopped small enough to disappear, or the pleats will not close.',
              'Roll discs thin at the edge and thicker in the middle. Fill, and pleat round in a circle into a purse.',
              'Steam in an oiled basket 12 minutes.',
              'For the achar: char the tomatoes and chillies under a grill until blistered, then blitz with toasted sesame, garlic and salt.'] },
    { name: 'With wrappers, pan-fried', time: 30, serves: 2, level: 'Easy',
      ingredients: ['1 packet dumpling wrappers', '250g mince', 'Onion, ginger, garlic, spring onion', 'Oil', 'Chilli sauce'],
      steps: ['Fill and fold the wrappers.',
              'Fry flat-side down 3 minutes, add 80ml water, lid on 6 minutes, lid off until crisp.'] }
  ]);

  recipes('Dal bhat', [
    { name: 'The plate', time: 45, serves: 4, level: 'Easy',
      ingredients: ['300g rice', '200g masoor or toor dal', '1 tsp turmeric', '2 tbsp oil', '1 tsp cumin seeds', '1 dried chilli', '3 garlic cloves', '1 onion', '300g spinach or mustard greens', 'Pickle, to serve'],
      steps: ['Dal: lentils and turmeric in three times their volume of water, simmered 25 minutes to a loose soup. Salt at the end.',
              'Temper: cumin, dried chilli and sliced garlic fried in the fat until the garlic is gold, poured over the dal.',
              'Rice, plain, plenty of it.',
              'Greens fried hard with onion and a little chilli.',
              'All three on one plate with a spoon of pickle. You mix it yourself, and a refill is expected.'] },
    { name: 'One pot', time: 30, serves: 2, level: 'Very easy',
      ingredients: ['150g rice', '100g red lentils', 'Turmeric', 'Cumin', 'Garlic', 'Oil', 'Greens'],
      steps: ['Rice and lentils cooked together with turmeric in 800ml water, 25 minutes.',
              'Tempering poured over at the end. Greens on the side.'] }
  ]);


  recipes('Bigos', [
    { name: 'Better on day three', time: 180, serves: 8, level: 'Easy',
      ingredients: ['1kg sauerkraut, rinsed', '500g white cabbage, shredded', '300g pork shoulder', '200g smoked sausage', '150g bacon', '2 onions', '30g dried mushrooms, soaked', '6 prunes', '2 bay leaves', '1 tsp caraway'],
      steps: ['Brown all the meats separately and set aside. Keep the fat.',
              'Soften the onions in it, then add both cabbages and the mushrooms with their soaking water.',
              'Meats back in with the prunes, bay and caraway. Lid on, lowest heat, 2 hours.',
              'Lid off for the last 30 minutes so it dries and darkens.',
              'Cool it completely and reheat the next day, and the day after. It genuinely improves twice.'] },
    { name: 'Two hours, fewer meats', time: 120, serves: 4, level: 'Very easy',
      ingredients: ['1 jar sauerkraut', '300g smoked sausage', '1 onion', '1/2 cabbage', 'Prunes', 'Bay', 'Caraway'],
      steps: ['Brown the sausage, soften the onion.',
              'Everything in with a splash of water, lid on, 90 minutes.',
              'Uncovered for the last 20.'] }
  ]);

  recipes('Svíčková', [
    { name: 'With the bread dumplings', time: 180, serves: 6, level: 'Hard',
      ingredients: ['1kg beef sirloin or topside', '3 carrots', '1 celeriac', '2 parsnips', '2 onions', '10 peppercorns', '5 allspice berries', '2 bay leaves', '300ml double cream', '2 tbsp flour', 'Cranberry sauce and lemon to serve'],
      steps: ['Lard or bard the beef if you can, then brown it hard on all sides.',
              'Roughly chop all the root vegetables and cook them in the same pot until they take colour.',
              'Beef back on top, spices in, 300ml water, lid on, 150C oven for 2 hours.',
              'Lift the beef out to rest. Blend the vegetables and their liquid completely smooth — this sauce has no lumps and no visible vegetables, which is the whole point.',
              'Cream and a flour slurry in, simmered until it coats a spoon. Sliced beef, sauce, a spoon of cranberry and a slice of lemon on top.'] },
    { name: 'Weeknight', time: 90, serves: 4, level: 'Medium',
      ingredients: ['800g braising beef', 'Carrot, celeriac, parsnip, onion', 'Allspice and bay', 'Cream', 'Flour'],
      steps: ['Brown the beef, soften the vegetables, braise together 70 minutes.',
              'Blend the sauce smooth, add cream, reduce.'] }
  ]);

  recipes('Goetta', [
    { name: 'Made and sliced', time: 180, serves: 8, level: 'Easy',
      ingredients: ['500g pork shoulder mince', '300g steel-cut oats', '1.2L stock', '2 onions, finely chopped', '3 bay leaves', '1 tsp allspice', 'Plenty of black pepper'],
      steps: ['Simmer the oats in the stock with the bay and onion for 90 minutes, stirring often. It goes from soup to porridge to paste.',
              'Work in the raw mince, allspice, salt and a lot of pepper and cook another 30 minutes.',
              'Pack into loaf tins and refrigerate overnight. It must be properly cold and firm.',
              'Slice 1cm thick and fry in a dry pan, without touching it, for 6 minutes a side until the outside is dark and crisp.',
              'Patience at the frying stage is the difference between goetta and porridge.'] },
    { name: 'Frying a bought loaf', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['Goetta loaf', 'Oil'],
      steps: ['Slice 1cm thick, cold.', 'Medium-hot pan, 6 minutes a side, turned once only.'] }
  ]);

  recipes('Bratwurst', [
    { name: 'Simmered, then grilled', time: 25, serves: 4, level: 'Very easy',
      ingredients: ['4 bratwurst', '500ml water or stock', '1 onion, sliced', '4 rolls', 'Mustard', 'Sauerkraut'],
      steps: ['Simmer the sausages gently in the liquid with the onion for 12 minutes. Gently — a hard boil splits them.',
              'Lift out, dry them, and grill or fry over a fierce heat for 4 minutes, turning, until the skin blisters and browns.',
              'The onions carry on cooking in the liquid and go on top.',
              'Roll, mustard, sausage, onions. Sauerkraut if you are in the mood.'] },
    { name: 'Straight on the grill', time: 15, serves: 4, level: 'Very easy',
      ingredients: ['4 bratwurst', '4 rolls', 'Mustard'],
      steps: ['Medium heat, not high — 12 minutes, turned often. High heat splits the skin before the middle is done.',
              'Rest 2 minutes, then into the rolls.'] }
  ]);

  recipes('Spaetzle', [
    { name: 'Scraped, then fried', time: 30, serves: 4, level: 'Medium',
      ingredients: ['300g plain flour', '4 eggs', '150ml milk', '1/2 tsp nutmeg', '60g butter', '150g grated cheese', '2 onions'],
      steps: ['Beat the flour, eggs, milk, nutmeg and salt hard with a spoon for 3 minutes, until the batter blisters and falls in ribbons. Beating is what gives it the chew.',
              'Rest 15 minutes.',
              'Press through a spaetzle press, or scrape thin strips off a wet board, straight into boiling salted water.',
              'They are done 30 seconds after they float. Lift out with a slotted spoon into cold water, then drain.',
              'Fry in butter until the edges catch, with fried onions and cheese folded through at the end.'] },
    { name: 'Plain, as a side', time: 20, serves: 4, level: 'Easy',
      ingredients: ['300g flour', '4 eggs', '150ml milk', 'Butter', 'Parsley'],
      steps: ['Batter and rest as above.', 'Boil in batches, drain.', 'Tossed in butter with parsley.'] }
  ]);

  recipes('Bacalhau à brás', [
    { name: 'Folded off the heat', time: 40, serves: 4, level: 'Medium',
      ingredients: ['400g salt cod, soaked 24 hours and flaked', '4 potatoes, cut into matchsticks', '2 onions, sliced thin', '4 garlic cloves', '6 eggs', 'Black olives', 'Parsley', 'Olive oil'],
      steps: ['Soak the salt cod 24 hours, changing the water three times, then flake it and pick out any bone.',
              'Fry the potato matchsticks in plenty of oil until crisp and gold. Drain.',
              'Soften the onion and garlic slowly, 12 minutes, then add the cod and warm it through.',
              'Potatoes in, then the beaten eggs — and now take the pan OFF the heat and fold. The residual heat sets them. On the heat you get scrambled egg with chips in it.',
              'Olives and a great deal of parsley.'] },
    { name: 'With smoked haddock', time: 30, serves: 2, level: 'Easy',
      ingredients: ['300g smoked haddock', '3 potatoes', '1 onion', '4 eggs', 'Parsley', 'Olive oil'],
      steps: ['Poach and flake the haddock — no soaking needed.',
              'Crisp the potato sticks, soften the onion.',
              'Everything together, eggs folded in off the heat.'] }
  ]);

  recipes('Caldo verde', [
    { name: 'Four things', time: 40, serves: 4, level: 'Very easy',
      ingredients: ['600g floury potatoes', '1 onion', '2 garlic cloves', '1.2L stock', '200g kale or collards, shredded as fine as you can', '150g chouriço, sliced thin', '4 tbsp olive oil'],
      steps: ['Simmer the potato, onion and garlic in the stock 20 minutes until falling apart.',
              'Blend it completely smooth with the olive oil. The soup is a velvet base and it should not be lumpy.',
              'Fry the chouriço slices until the fat runs and they curl.',
              'Bring the soup back to a simmer, add the kale, and cook 4 minutes only — it should stay green and have bite.',
              'Chouriço and its orange oil over each bowl.'] },
    { name: 'Without the sausage', time: 35, serves: 4, level: 'Very easy',
      ingredients: ['600g potatoes', 'Onion, garlic', 'Stock', 'Kale', 'Olive oil', 'Smoked paprika'],
      steps: ['Blend the potato base as above with a good pinch of smoked paprika.',
              'Kale in for 4 minutes.', 'A hard pour of olive oil on top.'] }
  ]);

  recipes('Piri piri chicken', [
    { name: 'Spatchcocked and basted', time: 70, serves: 4, level: 'Medium',
      ingredients: ['1 chicken, spatchcocked', '8 birds eye chillies', '6 garlic cloves', '2 red peppers, roasted', '100ml red wine vinegar', '1 tbsp smoked paprika', '1 lemon', '100ml olive oil', '1 tsp oregano'],
      steps: ['Blitz everything but the chicken into a loose sauce. Keep back a third for the table — basting sauce that has touched raw chicken does not come back.',
              'Slash the chicken through the thickest parts and marinate in the rest, at least 4 hours.',
              'Roast at 200C for 40 minutes, then finish under a hot grill or on coals for 10, basting twice.',
              'Rest 10 minutes, cut through the joints, and put the reserved sauce on the table.'] },
    { name: 'Thighs, on a weeknight', time: 40, serves: 4, level: 'Easy',
      ingredients: ['8 chicken thighs', 'Piri piri sauce', 'Lemon', 'Olive oil'],
      steps: ['Marinate the thighs 30 minutes in sauce, oil and lemon.',
              'Roast at 220C for 30 minutes, basting once.',
              'Lemon squeezed over at the end.'] }
  ]);

  recipes('Xiao long bao', [
    { name: 'With the jellied stock', time: 180, serves: 4, level: 'Hard',
      ingredients: ['300g pork skin and bones for the stock', '400g plain flour', '200ml hot water', '400g pork mince', 'Thumb of ginger', '4 spring onions', '2 tbsp shaoxing', '1 tbsp soy sauce', 'Sesame oil'],
      steps: ['Simmer the skin and bones 3 hours, strain, and chill until it sets to a firm jelly. Cube it. That jelly is the soup.',
              'Hot-water dough: pour the hot water into the flour, stir, knead 8 minutes, rest 30.',
              'Mix the mince with ginger, spring onion, shaoxing, soy and sesame, then fold through the cubed jelly last, gently.',
              'Roll wrappers thin at the edge, thick in the middle. Fill, and pleat upward into a tight purse — the seal has to hold liquid.',
              'Steam 8 minutes on oiled paper. Lift one into a spoon, bite a hole, sip, then eat. Straight into the mouth and it will burn you.'] },
    { name: 'From frozen', time: 12, serves: 2, level: 'Very easy',
      ingredients: ['12 frozen xiao long bao', 'Black vinegar', 'Shredded ginger'],
      steps: ['Steam from frozen on oiled paper or cabbage leaves, 9 minutes. Do not thaw them first.',
              'Vinegar with fine shreds of ginger in it to dip.'] }
  ]);

  recipes('Dan dan noodles', [
    { name: 'Sichuan, with the sauce underneath', time: 30, serves: 2, level: 'Medium',
      ingredients: ['200g wheat noodles', '200g pork mince', '2 tbsp ya cai or preserved mustard greens', '3 tbsp chilli oil with its sediment', '2 tbsp sesame paste', '2 tbsp soy sauce', '1 tsp Sichuan peppercorns, toasted and ground', '1 tsp sugar', '2 garlic cloves', 'Spring onion'],
      steps: ['Fry the mince hard with the preserved greens until dry and crisp at the edges, 8 minutes. Dry, not saucy.',
              'Build the sauce in the bottom of each bowl: sesame paste loosened with a splash of noodle water, soy, chilli oil, ground pepper, sugar, crushed garlic.',
              'Noodles on top of the sauce, not mixed in. The mince goes over.',
              'Stirred at the table by whoever is eating it. That is the dish — everyone gets a different first mouthful.'] },
    { name: 'Vegetarian, with mushrooms', time: 25, serves: 2, level: 'Easy',
      ingredients: ['200g noodles', '200g mushrooms, chopped fine', 'Preserved greens', 'Sesame paste, soy, chilli oil', 'Sichuan pepper', 'Garlic'],
      steps: ['Fry the mushrooms until all their water has gone and they brown, 10 minutes.',
              'Same sauce in the bowl, noodles, mushrooms on top.'] }
  ]);

  recipes('Cong you bing', [
    { name: 'Rolled and coiled', time: 50, serves: 4, level: 'Medium',
      ingredients: ['300g plain flour', '180ml hot water', '6 spring onions, sliced thin', '3 tbsp oil', '1 tbsp flour for the roux', 'Salt', 'Oil for frying'],
      steps: ['Pour the hot water into the flour, stir with chopsticks, knead 6 minutes to a soft dough, rest 30 minutes.',
              'Make a paste with the 3 tbsp oil and 1 tbsp flour — this is what keeps the layers apart.',
              'Roll thin, spread with the paste, scatter salt and spring onion, roll into a rope, then coil the rope into a snail and flatten it. The coiling makes the layers.',
              'Rest 10 minutes, then roll out to 5mm.',
              'Fry in a little oil, 3 minutes a side, pressing occasionally. Smack it between your hands when it comes out to loosen the layers.'] },
    { name: 'Quick, with tortillas', time: 12, serves: 2, level: 'Very easy',
      ingredients: ['2 flour tortillas', '4 spring onions', 'Sesame oil', 'Salt', 'Oil'],
      steps: ['Brush a tortilla with sesame oil, scatter spring onion and salt, roll and coil as above.',
              'Flatten, roll out, fry 3 minutes a side.'] }
  ]);

  recipes('Hot pot', [
    { name: 'The whole table', time: 60, serves: 6, level: 'Easy',
      ingredients: ['2L stock', '1 packet hot pot base, or dried chilli, Sichuan pepper and doubanjiang', '600g thinly sliced beef and lamb', '400g prawns and fish balls', 'Tofu, mushrooms, leafy greens, lotus root', 'Noodles', 'Sesame paste, soy, garlic, coriander for dipping'],
      steps: ['Get the broth going on a portable burner in the middle of the table. Half plain, half spicy, if you have a divided pot.',
              'Everything raw goes on plates round it. Meat sliced thin enough to see through.',
              'Everybody cooks their own: meat takes about 15 seconds, prawns a minute, root vegetables several.',
              'Each person mixes their own dipping sauce. Sesame paste, soy, garlic and coriander is the standard.',
              'Noodles go in at the very end, when the broth has taken on everything that was cooked in it.'] },
    { name: 'For two, in a pan', time: 35, serves: 2, level: 'Very easy',
      ingredients: ['1.2L stock', 'Hot pot base paste', '300g sliced meat', 'Tofu, mushrooms, greens', 'Noodles', 'Dipping sauce'],
      steps: ['Simmer the broth on the hob and bring the pan to the table on a trivet.',
              'Cook in batches, dip, repeat.', 'Noodles last.'] }
  ]);

  recipes('Banh xeo', [
    { name: 'Crisp and yellow', time: 40, serves: 4, level: 'Medium',
      ingredients: ['200g rice flour', '1 tsp turmeric', '400ml coconut milk', '150ml water', '2 spring onions', '200g prawns', '150g pork belly, sliced thin', '200g beansprouts', 'Lettuce, mint, coriander, perilla', 'Nuoc cham to dip'],
      steps: ['Whisk the flour, turmeric, coconut milk and water to a thin batter and rest it 30 minutes. Thin is the point — a thick batter makes a pancake, not a crisp shell.',
              'Very hot pan, a little oil, a few prawns and pork slices in first.',
              'Ladle in just enough batter to coat, swirling so it climbs the sides. Lid on, 2 minutes.',
              'Beansprouts on one half, lid on 1 minute more, then fold over and cook uncovered until the base is properly crisp.',
              'Torn up, wrapped in lettuce with the herbs, dipped in nuoc cham. Eaten with hands, over a plate.'] },
    { name: 'Vegetarian', time: 35, serves: 4, level: 'Easy',
      ingredients: ['Batter as above', '200g mushrooms', '200g tofu', 'Beansprouts', 'Herbs and lettuce', 'Dipping sauce'],
      steps: ['Fry mushrooms and tofu until browned.', 'Batter swirled over, lid on 2 minutes.',
              'Beansprouts, fold, crisp the base.'] }
  ]);

  recipes('Bun cha', [
    { name: 'Grilled patties in broth', time: 50, serves: 4, level: 'Medium',
      ingredients: ['500g pork mince, some fat in it', '3 shallots', '4 garlic cloves', '2 tbsp fish sauce', '1 tbsp sugar', '400g rice vermicelli', '150ml fish sauce and 150g sugar and 2 limes for the broth', '1 carrot and 1 kohlrabi, pickled', 'Lettuce, mint, perilla, coriander'],
      steps: ['Mix the mince with minced shallot, garlic, fish sauce, sugar and pepper. Rest 30 minutes, then shape into small flat patties.',
              'Grill over coals or under a fierce grill until charred at the edges — the char is most of the flavour.',
              'Dipping broth: dissolve the sugar in 600ml warm water, add fish sauce and lime until it tastes sweet first, then sour, then salty. It should be drinkable.',
              'Drop the hot patties straight into the warm broth with the pickles.',
              'Noodles and a mountain of herbs alongside. You dunk the noodles in the bowl, you do not pour the bowl over them.'] },
    { name: 'Pan-grilled, faster', time: 30, serves: 2, level: 'Easy',
      ingredients: ['300g pork mince', 'Shallot, garlic, fish sauce, sugar', 'Rice noodles', 'Lime, fish sauce, sugar for the broth', 'Herbs'],
      steps: ['Shape and fry the patties hard in a dry pan until well charred.',
              'Make the broth in a bowl, drop the patties in.', 'Noodles and herbs on the side.'] }
  ]);

  recipes('Com tam', [
    { name: 'Broken rice and grilled pork', time: 50, serves: 4, level: 'Medium',
      ingredients: ['4 pork chops, bashed thin', '3 tbsp fish sauce', '2 tbsp sugar', '3 garlic cloves', '1 tbsp honey', '300g broken rice or jasmine rice', '4 eggs', 'Cucumber and tomato', 'Nuoc cham', 'Spring onion oil'],
      steps: ['Marinate the flattened chops in fish sauce, sugar, crushed garlic and honey for at least an hour.',
              'Grill over a high heat, 4 minutes a side, until the sugars catch and blacken in places.',
              'Rice steamed as usual — broken rice if you can find it, for the softer texture.',
              'Fry an egg per person, lacy edges, soft yolk.',
              'Rice, chop, egg, a spoon of spring onion oil, salad, and nuoc cham poured over the lot.'] },
    { name: 'With pork belly slices', time: 35, serves: 2, level: 'Easy',
      ingredients: ['300g pork belly slices', 'Fish sauce, sugar, garlic', 'Rice', '2 eggs', 'Nuoc cham'],
      steps: ['Marinate 20 minutes, then fry hard until the edges crisp.',
              'Rice, egg, sauce.'] }
  ]);

  recipes('Khao man gai', [
    { name: 'Chicken and its own rice', time: 60, serves: 4, level: 'Medium',
      ingredients: ['1 whole chicken or 6 thighs', '2 thumbs ginger', '1 head garlic', '300g jasmine rice', '3 pandan leaves', 'For the sauce: 3 tbsp fermented soybean paste, 2 tbsp ginger, 2 chillies, 1 tbsp vinegar, 1 tbsp sugar, soy'],
      steps: ['Poach the chicken very gently with bashed ginger, garlic and salt for 35 minutes. Gently — a boil makes it stringy. Lift out and plunge into iced water for shining skin.',
              'Keep the poaching stock. Fry the rice briefly in a little chicken fat with minced garlic, then cook it in that stock with the pandan.',
              'Sauce: blitz everything, then taste. It should be salty, sharp, gingery and hot all at once, and it is what the dish is actually about.',
              'Sliced chicken over the rice, cucumber alongside, a bowl of the clear stock on the side.'] },
    { name: 'With thighs, in one pot', time: 45, serves: 2, level: 'Easy',
      ingredients: ['4 chicken thighs', 'Ginger, garlic', '200g rice', 'Soy, vinegar, chilli, sugar'],
      steps: ['Poach the thighs 25 minutes with ginger and garlic.',
              'Cook the rice in the strained stock.', 'Blitz the sauce and pour it over.'] }
  ]);

  recipes('Som tam', [
    { name: 'Pounded in a mortar', time: 20, serves: 2, level: 'Easy',
      ingredients: ['1 green papaya, shredded', '4 garlic cloves', '4 birds eye chillies', '2 tbsp dried shrimp', '2 tbsp palm sugar', '3 tbsp fish sauce', '2 limes', '10 green beans, snapped', '2 tomatoes', 'Peanuts'],
      steps: ['Pound the garlic and chilli to a rough paste first. Use a deep clay mortar if you have one; a bowl and a rolling pin will do.',
              'Add the dried shrimp and peanuts and bruise them, then the palm sugar, fish sauce and lime.',
              'Beans and tomato in, bruised only — you are breaking them, not mashing them.',
              'Papaya last, and now switch to lifting and turning with a spoon while you pound lightly with the other hand. Thirty seconds, no more.',
              'Taste. Sour first, then hot, then salty, then sweet. Adjust and eat immediately.'] },
    { name: 'With carrot and cucumber', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['2 carrots and 1 cucumber, shredded', 'Garlic, chilli', 'Fish sauce, lime, palm sugar', 'Peanuts', 'Dried shrimp'],
      steps: ['Make the dressing in a bowl by crushing the garlic and chilli with the back of a spoon.',
              'Toss the shredded vegetables through it and leave 5 minutes.',
              'Peanuts on top at the last second.'] }
  ]);

  recipes('Massaman curry', [
    { name: 'Slow, with the whole spices', time: 90, serves: 4, level: 'Medium',
      ingredients: ['700g beef or lamb, cubed', '4 tbsp massaman paste', '2 tins coconut milk', '4 potatoes, in chunks', '1 onion, in wedges', '80g roasted peanuts', '2 tbsp tamarind paste', '2 tbsp palm sugar', '3 tbsp fish sauce', '1 cinnamon stick', '4 cardamom pods'],
      steps: ['Crack open the coconut cream at the top of the tin and fry the paste in it until the oil splits out and it smells toasted, 5 minutes. This step is not optional.',
              'Meat in, turned to coat, then the rest of the coconut milk, the cinnamon and cardamom.',
              'Lowest heat, lid ajar, 60 minutes.',
              'Potato, onion and peanuts in for the last 25.',
              'Tamarind, sugar and fish sauce at the end, balanced until it is sweet, sour and salty in that order. It should not be fiery.'] },
    { name: 'With chicken, quicker', time: 45, serves: 4, level: 'Easy',
      ingredients: ['600g chicken thighs', 'Massaman paste', '1 tin coconut milk', 'Potatoes', 'Peanuts', 'Tamarind, palm sugar, fish sauce'],
      steps: ['Fry the paste in the coconut cream, add the chicken.',
              'Coconut milk and potatoes, 30 minutes.', 'Balance with tamarind, sugar and fish sauce.'] }
  ]);

  recipes('Nasi campur', [
    { name: 'A plate of five things', time: 75, serves: 4, level: 'Medium',
      ingredients: ['300g rice', '400g chicken, in pieces', '4 eggs', '200g tempeh', '200g long beans', '4 tbsp sambal', '1 tin coconut milk', 'Turmeric, lemongrass, galangal', 'Fried shallots', 'Prawn crackers'],
      steps: ['Rice first, with a pandan leaf or a little turmeric.',
              'Chicken simmered in coconut milk with lemongrass and turmeric, 30 minutes, then fried until the edges brown.',
              'Tempeh cut into batons and fried crisp, then tossed in sweet soy and chilli.',
              'Beans blanched and tossed with sambal and a spoon of coconut milk.',
              'Boiled eggs halved. Everything arranged round the rice in small heaps, fried shallots over the lot. No two plates the same and none of it mixed until you eat it.'] },
    { name: 'Three components', time: 40, serves: 2, level: 'Easy',
      ingredients: ['200g rice', '2 eggs', '200g tempeh or tofu', 'Sambal', 'Cucumber', 'Fried shallots'],
      steps: ['Rice, fried egg, tempeh fried crisp and tossed in sweet soy.',
              'Sambal and cucumber on the side, shallots over.'] }
  ]);


  recipes('Roti canai', [
    { name: 'Flipped and layered', time: 90, serves: 4, level: 'Hard',
      ingredients: ['400g plain flour', '250ml warm water', '1 tbsp condensed milk', '1 tsp salt', '100ml oil, plus more for resting', 'Dhal or curry to dip'],
      steps: ['Work the flour, water, condensed milk and salt into a very soft, slightly sticky dough. Knead 10 minutes.',
              'Divide into balls, coat each one generously in oil, and rest them in a covered tray for at least 4 hours. The long oily rest is what makes the dough stretch instead of tear.',
              'On an oiled surface, flatten a ball then stretch it outward with your fingertips until it is almost transparent and far wider than seems possible.',
              'Fold the edges in to make a rough square, or coil it into a spiral and flatten.',
              'Fry on a hot griddle, 2 minutes a side, then clap it between your hands to separate the layers.'] },
    { name: 'With frozen paratha', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['4 frozen paratha', 'Dhal or curry'],
      steps: ['Cook from frozen on a dry hot pan, 2 minutes a side, until it puffs and blisters.',
              'Clap it between your hands and tear rather than cut.'] }
  ]);

  recipes('Ackee and saltfish', [
    { name: 'Jamaica, on a Sunday', time: 45, serves: 4, level: 'Medium',
      ingredients: ['400g salt cod, soaked overnight', '1 tin ackee, drained very gently', '1 onion', '1 red pepper', '3 spring onions', '2 tomatoes', '1 scotch bonnet, whole', 'Thyme', 'Oil'],
      steps: ['Soak the salt cod overnight, then boil it 15 minutes, drain, and flake it, picking out bone and skin.',
              'Fry the onion, pepper, spring onion and thyme until soft, then the tomato.',
              'Fish in, warmed through.',
              'Ackee folded in with the gentlest hand you have and a whole scotch bonnet sat on top for aroma rather than heat. Ackee breaks into mush if you stir it, and mushy ackee is the one way to get this wrong.',
              'Two minutes covered, then lift the chilli out. Fried dumplings or green banana alongside.'] },
    { name: 'Quicker, with smoked fish', time: 25, serves: 2, level: 'Easy',
      ingredients: ['300g smoked haddock', '1 tin ackee', 'Onion, pepper, spring onion', 'Thyme', 'Scotch bonnet'],
      steps: ['Poach and flake the haddock — no overnight soak.',
              'Fry the vegetables, add the fish.', 'Fold the ackee through off the heat.'] }
  ]);

  recipes('Doubles', [
    { name: 'Bara and channa', time: 90, serves: 6, level: 'Medium',
      ingredients: ['300g plain flour', '1 tsp yeast', '1/2 tsp turmeric', '1 tsp sugar', '200ml warm water', '2 tins chickpeas', '1 onion', '4 garlic cloves', '2 tbsp curry powder', '1 tsp cumin', 'Oil for frying', 'Tamarind and pepper sauce'],
      steps: ['Bara dough: flour, yeast, turmeric, sugar, salt and water, kneaded soft and left to rise 1 hour.',
              'Channa: fry the onion, garlic, curry powder and cumin, then the chickpeas with 300ml water. Simmer 30 minutes and mash a third of them so it thickens.',
              'Pinch small balls of dough, flatten them thin between oiled palms, and fry 30 seconds a side in shallow oil. They puff, then settle.',
              'Two bara per serving — that is the name — with channa spooned between, tamarind over and pepper sauce if you dare.',
              'Eaten standing up, over the paper, with both hands.'] },
    { name: 'The channa, with flatbread', time: 40, serves: 4, level: 'Very easy',
      ingredients: ['2 tins chickpeas', 'Onion, garlic', 'Curry powder, cumin', 'Soft flatbreads', 'Tamarind sauce'],
      steps: ['Make the channa as above and cook it down thick.',
              'Warm the flatbreads and spoon it on. Not doubles, and it is a good lunch.'] }
  ]);

  recipes('Pepperpot', [
    { name: 'Cassareep dark', time: 240, serves: 8, level: 'Medium',
      ingredients: ['1.5kg beef, oxtail and pork trotter mixed', '200ml cassareep', '1 cinnamon stick', '6 cloves', '2 hot peppers, whole', '3 tbsp brown sugar', 'Orange peel', 'Thyme'],
      steps: ['Brown all the meat hard in batches. This is a dark dish and it starts with colour.',
              'Everything into the pot with the cassareep, spices, whole peppers and enough water to cover.',
              'Lowest heat, lid on, 3 to 4 hours, until the tougher cuts give up entirely.',
              'Leave the peppers whole and lift them out before serving unless you want it fierce.',
              'Cassareep is a preservative as well as a flavour: this keeps on the stove for days, reboiled each morning, and gets better. Plait bread to mop.'] },
    { name: 'Two hours, beef only', time: 150, serves: 4, level: 'Easy',
      ingredients: ['1kg braising beef', '120ml cassareep', 'Cinnamon, cloves', 'Brown sugar', 'Thyme', 'Hot pepper'],
      steps: ['Brown the beef, add everything with water to cover.',
              'Simmer 2 hours 15 with the lid ajar until it thickens and darkens.'] }
  ]);

  recipes('Egusi soup', [
    { name: 'Thick, with greens', time: 75, serves: 6, level: 'Medium',
      ingredients: ['300g ground egusi (melon seed)', '500g beef or goat, pre-boiled', '200g smoked fish, flaked', '150ml palm oil', '2 onions', '3 tbsp ground crayfish', '2 scotch bonnets', '400g spinach or bitterleaf', '1 stock cube'],
      steps: ['Mix the ground egusi with a little water into a stiff paste and leave it while you start the base.',
              'Bleach the palm oil gently — heat it until it thins and lightens, no more — then fry the blended onion and pepper in it for 10 minutes.',
              'Drop the egusi paste in in lumps and do not stir for 5 minutes. Letting it fry in lumps is what gives the soup its texture; stirring it in makes a smooth sauce, which is a different dish.',
              'Meat, fish, crayfish and stock in. Simmer 25 minutes, breaking the lumps up a little as you go.',
              'Greens in for the last 5 minutes only. With pounded yam or fufu.'] },
    { name: 'Smaller, without the goat', time: 45, serves: 4, level: 'Easy',
      ingredients: ['200g ground egusi', '300g beef', 'Smoked fish', 'Palm oil', 'Onion, scotch bonnet', 'Crayfish', 'Spinach'],
      steps: ['As above, with a single meat and a shorter simmer.',
              'Spinach in at the very end.'] }
  ]);

  recipes('Fufu', [
    { name: 'From flour, pounded in the pan', time: 20, serves: 4, level: 'Medium',
      ingredients: ['300g fufu flour (cassava, plantain or yam)', '900ml water', 'A wooden spoon you trust'],
      steps: ['Bring most of the water to the boil and take it off the heat.',
              'Rain in the flour gradually while stirring hard. It will fight back immediately.',
              'Back on a low heat and now work it — pressing against the side of the pan, folding, turning — for a full 8 minutes. This is the whole recipe and it is genuinely an arm workout.',
              'Splash in the rest of the water if it stiffens too far. It should be smooth, stretchy and glossy with no lumps at all.',
              'Wet your hands, shape into a ball, and serve with soup. Torn with the fingers, dipped, and swallowed rather than chewed.'] },
    { name: 'Microwave', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['200g fufu flour', '450ml water'],
      steps: ['Mix flour and water to a smooth batter in a microwave bowl.',
              'Two minutes, stir hard, two minutes, stir hard again, then one more minute.',
              'Work it with a wet spoon until stretchy and shape into a ball.'] }
  ]);

  recipes('Suya', [
    { name: 'Skewered, with yaji', time: 45, serves: 4, level: 'Easy',
      ingredients: ['600g beef sirloin, sliced thin', '100g roasted peanuts, ground to powder', '1 tbsp ground ginger', '1 tbsp cayenne', '1 tsp garlic powder', '1 stock cube, crushed', '3 tbsp oil', 'Onion and tomato to serve'],
      steps: ['Make the yaji: grind the peanuts as fine as you can without turning them to butter, then mix with the ginger, cayenne, garlic and crushed stock cube.',
              'Thread the thin beef onto skewers in loose folds, brush with oil, and rub half the yaji in firmly.',
              'Grill over hot coals or under a fierce grill, 3 minutes a side. It should char at the edges.',
              'Dust the rest of the yaji on as it comes off the heat — the second dusting is the one you taste.',
              'Raw onion and tomato, and nothing else needed.'] },
    { name: 'In a pan, with chicken', time: 30, serves: 2, level: 'Very easy',
      ingredients: ['400g chicken thigh strips', 'Yaji spice mix', 'Oil', 'Onion', 'Lime'],
      steps: ['Rub the strips with oil and half the spice, rest 20 minutes.',
              'Fry hard in a dry pan in one layer until charred.',
              'Rest of the spice over, lime squeezed on.'] }
  ]);

  recipes('Bunny chow', [
    { name: 'Durban, quarter loaf', time: 75, serves: 4, level: 'Medium',
      ingredients: ['1 unsliced white loaf', '600g lamb or chicken, cubed', '2 onions', '4 garlic cloves', 'Thumb of ginger', '3 tbsp Durban masala', '1 tsp turmeric', '4 tomatoes, grated', '3 potatoes', 'Curry leaves', 'Oil'],
      steps: ['Fry the onion until deep brown, 12 minutes, then the garlic, ginger and curry leaves.',
              'Masala and turmeric in for a minute, then the grated tomato, cooked until the oil separates.',
              'Meat in, coated, then water to barely cover. Lid on, 45 minutes.',
              'Potatoes in for the last 20 — they thicken it as they break down.',
              'Cut the loaf into quarters, hollow each one out, and fill. The scooped-out bread goes on top, for dipping. No cutlery.'] },
    { name: 'Bean bunny', time: 40, serves: 4, level: 'Easy',
      ingredients: ['1 loaf', '2 tins butter beans', 'Onion, garlic, ginger', 'Curry powder', 'Tomatoes', 'Potato'],
      steps: ['Same base: onion browned hard, spices, tomato cooked down.',
              'Beans and potato, simmered 25 minutes until thick.',
              'Into the hollowed bread.'] }
  ]);

  recipes('Bobotie', [
    { name: 'With the bay leaves standing up', time: 80, serves: 6, level: 'Easy',
      ingredients: ['800g beef mince', '2 onions', '2 tbsp curry powder', '1 tsp turmeric', '2 slices white bread', '250ml milk', '3 tbsp chutney', '2 tbsp vinegar', '60g raisins', '30g flaked almonds', '3 eggs', '6 bay leaves'],
      steps: ['Soak the bread in the milk and squeeze it out, keeping the milk for the topping.',
              'Brown the onion, add the curry powder and turmeric, then the mince until it loses its pink.',
              'Squeezed bread, chutney, vinegar, raisins, almonds and plenty of salt. It should taste sweet, sour and spiced all at once.',
              'Press into a dish. Beat the eggs into the reserved milk and pour it over.',
              'Stand the bay leaves upright in the custard and bake at 180C for 40 minutes, until the top is set and freckled brown.'] },
    { name: 'Lamb, smaller', time: 60, serves: 4, level: 'Easy',
      ingredients: ['500g lamb mince', 'Onion, curry powder', 'Bread and milk', 'Chutney, vinegar, raisins', '2 eggs', 'Bay'],
      steps: ['As above, in a smaller dish.', 'Bake 30 minutes at 180C.'] }
  ]);

  recipes('Milanesa', [
    { name: 'Thin and covering the plate', time: 35, serves: 4, level: 'Easy',
      ingredients: ['4 thin beef steaks', '3 eggs', '4 garlic cloves, crushed', 'Parsley', '200g fine breadcrumbs', 'Oil for frying', 'Lemon'],
      steps: ['Beat the steaks between two sheets of paper until they are 5mm and far bigger than they started.',
              'Beat the eggs with the crushed garlic, chopped parsley and salt — the garlic goes in the egg, not the crumb, which is what makes it Argentine rather than Austrian.',
              'Soak the steaks in that for 30 minutes if you have time.',
              'Crumb them firmly on both sides, pressing hard.',
              'Shallow-fry in hot oil, 2 minutes a side. Drain on a rack, salt at once, lemon at the table.'] },
    { name: 'A la napolitana', time: 45, serves: 4, level: 'Easy',
      ingredients: ['Milanesa as above', 'Tomato sauce', '200g mozzarella', 'Oregano'],
      steps: ['Fry the milanesas, then put them on a tray.',
              'A spoon of tomato sauce and a slice of mozzarella on each.',
              'Under a hot grill until melted and blistered.'] }
  ]);

  recipes('Choripan', [
    { name: 'With chimichurri', time: 25, serves: 4, level: 'Very easy',
      ingredients: ['4 chorizo sausages, fresh not cured', '4 crusty rolls', 'A large bunch parsley', '4 garlic cloves', '1 tsp oregano', '1 tsp chilli flakes', '100ml olive oil', '3 tbsp red wine vinegar'],
      steps: ['Chimichurri first, so it can sit: chop the parsley and garlic by hand, mix with the oregano, chilli, oil, vinegar and salt, and leave it 20 minutes.',
              'Grill the chorizo over medium coals, 12 minutes, turning. Medium, not fierce — high heat splits the skin and the fat is lost.',
              'Split each sausage down the middle almost through and open it flat, then give the cut faces 2 minutes on the grill.',
              'Split the rolls, grill them face down for 30 seconds, then sausage in and chimichurri spooned over generously.'] },
    { name: 'In a pan', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['2 fresh chorizo', '2 rolls', 'Shop-bought chimichurri', 'Olive oil'],
      steps: ['Fry the sausages over medium heat 12 minutes, then butterfly and crisp the cut side.',
              'Toast the rolls in the pan fat. Sausage, sauce, done.'] }
  ]);

  recipes('Aji de gallina', [
    { name: 'Shredded and creamy', time: 60, serves: 4, level: 'Medium',
      ingredients: ['4 chicken breasts, poached and shredded', '4 tbsp aji amarillo paste', '4 slices white bread', '300ml evaporated milk', '80g walnuts', '50g parmesan', '2 onions', '4 garlic cloves', 'Boiled potatoes, rice, olives and egg to serve'],
      steps: ['Poach the chicken 20 minutes, keep the stock, and shred it by hand into long strands rather than chopping it.',
              'Soak the bread in the evaporated milk, then blitz with the walnuts until smooth. This is the thickener; there is no flour in it.',
              'Fry the onion and garlic until soft, add the aji amarillo and cook 5 minutes.',
              'Bread mixture in, loosened with chicken stock, then the cheese and the shredded chicken.',
              'It should be thick enough to sit on a potato without sliding off. Rice, boiled potato, half an egg and an olive on the plate.'] },
    { name: 'Smaller, quicker', time: 35, serves: 2, level: 'Easy',
      ingredients: ['2 cooked chicken breasts', '2 tbsp aji amarillo paste', '2 slices bread', '200ml evaporated milk', 'Walnuts', 'Onion, garlic', 'Parmesan'],
      steps: ['Blitz the soaked bread with walnuts and milk.',
              'Fry onion, garlic and paste; add the bread cream and shredded chicken.',
              'Loosen with stock and finish with cheese.'] }
  ]);

  recipes('Pastel de choclo', [
    { name: 'Corn over pino', time: 90, serves: 6, level: 'Medium',
      ingredients: ['800g sweetcorn kernels', '100ml milk', '60g butter', '10 basil leaves', '600g beef mince', '3 onions', '1 tsp cumin', '80g raisins', '6 olives', '3 boiled eggs', '2 tbsp caster sugar'],
      steps: ['Pino first: cook the onions very slowly, 20 minutes, then the mince with cumin, paprika and salt. It should be moist, not wet. Raisins in at the end.',
              'Blitz the corn with the milk and basil, then cook it in the butter, stirring, for 10 minutes until it thickens to a soft polenta.',
              'Pino in the bottom of a dish, with the olives and halved eggs pressed into it.',
              'Corn spread over the top, right to the edges.',
              'Scatter the sugar over and bake at 200C for 35 minutes until the top blisters and caramelises in patches. The sugar crust is the point of the dish.'] },
    { name: 'With chicken', time: 75, serves: 4, level: 'Easy',
      ingredients: ['Corn topping as above', '500g shredded cooked chicken', '2 onions', 'Cumin', 'Raisins', 'Olives', 'Eggs', 'Sugar'],
      steps: ['Soften the onion, fold through the chicken and spices.',
              'Corn over, sugar scattered, baked 35 minutes at 200C.'] }
  ]);

  recipes('Mole poblano', [
    { name: 'The whole afternoon', time: 240, serves: 8, level: 'Hard',
      ingredients: ['6 ancho, 4 pasilla and 4 mulato chillies', '80g almonds', '60g raisins', '50g sesame seeds', '2 tomatoes', '1 onion', '4 garlic cloves', '1 corn tortilla', '1 slice stale bread', '60g dark chocolate', '1 cinnamon stick', 'Cloves and aniseed', '1.5L chicken stock', '1 chicken, jointed'],
      steps: ['Toast every chilli briefly on a dry pan until fragrant, then soak them in hot water 30 minutes. Toast, do not burn — burnt chilli makes the whole pot bitter and there is no rescue.',
              'Separately fry the nuts, raisins, sesame, tomato, onion, garlic, tortilla and bread until each is browned, then blitz the lot with the soaked chillies and some stock into a thick paste.',
              'Push it through a sieve. This is tedious and it is what separates mole from chilli paste.',
              'Fry the sieved paste in lard or oil in a deep pot for 20 minutes, stirring, until it darkens and thickens.',
              'Stock, spices and chocolate in, then two hours on the lowest heat, stirring often. Poached chicken in for the last 20 minutes, sesame over the top.'] },
    { name: 'From a paste jar', time: 45, serves: 4, level: 'Easy',
      ingredients: ['200g mole paste', '800ml chicken stock', '30g dark chocolate', '4 chicken thighs', 'Sesame seeds'],
      steps: ['Fry the paste in a little oil for 5 minutes to wake it up.',
              'Stock in gradually, whisking, then the chocolate. Simmer 20 minutes.',
              'Poached chicken in, sesame over.'] }
  ]);

  recipes('Chiles en nogada', [
    { name: 'For the season', time: 120, serves: 6, level: 'Hard',
      ingredients: ['6 poblano chillies', '500g pork mince', '1 onion', '3 garlic cloves', '1 apple, 1 pear, 1 peach, diced', '60g raisins', '50g almonds', '1 tsp cinnamon', '200g walnuts, soaked and peeled', '250g queso fresco or cream cheese', '150ml milk', '1 pomegranate', 'Parsley'],
      steps: ['Char the poblanos all over under a grill, sweat them in a covered bowl, then peel and slit them down one side, keeping the stalk. Take the seeds out through the slit.',
              'Picadillo: onion and garlic soft, pork browned, then the fruit, raisins, almonds and cinnamon. Cook 20 minutes until glossy and sweet-savoury. It must not be wet.',
              'Nogada: blend the peeled walnuts with the cheese and milk until completely smooth and pourable. Peeling the walnuts is what keeps it white and takes the bitterness out.',
              'Stuff the chillies generously and sit them on a plate.',
              'Sauce poured over cold, pomegranate and parsley on top — green, white and red, which is the whole idea.'] },
    { name: 'Simplified', time: 70, serves: 4, level: 'Medium',
      ingredients: ['4 poblanos', '400g pork mince', 'Apple and pear', 'Raisins, almonds, cinnamon', '150g walnuts', '200g cream cheese', 'Milk', 'Pomegranate'],
      steps: ['Roast and peel the chillies, make the picadillo, stuff them.',
              'Blend walnuts, cream cheese and milk without peeling the walnuts — slightly darker, much less work.'] }
  ]);

  recipes('Tamales', [
    { name: 'Steamed in their leaves', time: 180, serves: 12, level: 'Hard',
      ingredients: ['500g masa harina', '300g lard or shortening', '700ml warm stock', '1 tsp baking powder', '30 corn husks, soaked', '600g pork shoulder, cooked and shredded', '300ml red chilli sauce'],
      steps: ['Soak the husks in hot water an hour until pliable.',
              'Beat the lard alone for 5 minutes until it is white and fluffy — a stand mixer helps. Aerating the fat is what makes a light tamale rather than a brick.',
              'Add the masa, baking powder and salt, then the warm stock gradually, beating, until a teaspoon of the dough floats in a glass of water. That float test is the only reliable test.',
              'Spread masa on the smooth side of a husk, leaving a border. Filling down the middle, fold the sides over, fold the bottom up.',
              'Stand them upright in a steamer, open end up, and steam 90 minutes. They are done when the husk peels away cleanly.'] },
    { name: 'A small batch', time: 120, serves: 6, level: 'Medium',
      ingredients: ['250g masa harina', '150g lard', '350ml stock', 'Husks', '300g shredded chicken', 'Green salsa'],
      steps: ['Beat the fat, add masa and stock, float test.',
              'Fill and fold a dozen husks.', 'Steam 75 minutes.'] }
  ]);

  recipes('Cachapa', [
    { name: 'Sweet corn pancake', time: 25, serves: 4, level: 'Easy',
      ingredients: ['600g sweetcorn kernels', '3 tbsp masarepa or plain flour', '2 tbsp sugar', '1 tsp salt', '50ml milk', 'Butter', '300g queso de mano or mozzarella'],
      steps: ['Blitz the corn with the milk to a rough batter — leave some texture in it, it is not meant to be smooth.',
              'Stir in the flour, sugar and salt. It should be thick enough to spread rather than pour.',
              'Ladle into a buttered pan and shape into a round with the back of the spoon.',
              'Medium heat, 4 minutes a side. They are delicate; turn once, confidently.',
              'Cheese on one half, fold over, and press until it melts. Butter on top.'] },
    { name: 'With tinned corn', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['1 large tin sweetcorn, drained', '2 tbsp flour', '1 tbsp sugar', 'Butter', 'Mozzarella'],
      steps: ['Blitz, thicken with flour, season.',
              'Fry 4 minutes a side, fold round cheese.'] }
  ]);

  recipes('Skyr with berries', [
    { name: 'As it comes', time: 5, serves: 1, level: 'Very easy',
      ingredients: ['200g skyr', '100g mixed berries', '1 tbsp honey', '1 tbsp toasted oats or nuts'],
      steps: ['Skyr straight from the pot into a bowl. It is thicker than yoghurt and should stand up on its own.',
              'Crush half the berries with a fork and a little honey to make a rough sauce.',
              'Swirl that through, keeping streaks rather than mixing it pink.',
              'Whole berries and something toasted on top, for the crunch.'] },
    { name: 'Layered, made ahead', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['400g skyr', 'Berries', 'Granola', 'Honey', 'Lemon zest'],
      steps: ['Layer skyr, berries and granola in two jars.',
              'Honey and lemon zest on top, fridge overnight. The granola softens, which is either the point or the problem depending on who you ask.'] }
  ]);

  recipes('Kanelbullar', [
    { name: 'Cardamom and pearl sugar', time: 150, serves: 16, level: 'Medium',
      ingredients: ['500g strong flour', '250ml milk', '7g yeast', '80g sugar', '80g butter, softened', '2 tsp ground cardamom', '1 egg', 'For the filling: 100g butter, 100g sugar, 2 tbsp cinnamon, 1 tsp cardamom', 'Pearl sugar'],
      steps: ['Warm the milk to blood heat, stir in the yeast, then the flour, sugar, cardamom and salt. Knead 10 minutes, working in the soft butter a bit at a time.',
              'Rise 1 hour until doubled.',
              'Roll to a large rectangle, spread with the beaten filling, then fold in three and cut into strips.',
              'Twist each strip and knot it around two fingers — a knot holds its shape where a spiral unrolls.',
              'Prove 45 minutes, egg wash, pearl sugar on, and bake at 220C for 10 minutes only. They dry out fast.'] },
    { name: 'Rolled, the simple way', time: 120, serves: 12, level: 'Easy',
      ingredients: ['Dough as above', 'Filling as above', 'Egg', 'Pearl sugar'],
      steps: ['Roll, spread, and roll up into a log.',
              'Cut 3cm slices, cut side up in cases.', 'Prove, wash, bake 10 minutes at 220C.'] }
  ]);

  recipes('Basbousa', [
    { name: 'Syrup while hot', time: 50, serves: 12, level: 'Very easy',
      ingredients: ['300g coarse semolina', '150g sugar', '200g yoghurt', '120g butter, melted', '1 tsp baking powder', '80g desiccated coconut', 'Almonds', 'For the syrup: 250g sugar, 200ml water, 1 tbsp lemon juice, 1 tsp rose water'],
      steps: ['Make the syrup first and let it cool completely. Hot cake and cold syrup is the rule — the other way round and it sits on top instead of soaking in.',
              'Mix everything else and spread it in a buttered tin. Rest 15 minutes so the semolina drinks.',
              'Score it into diamonds before baking and press an almond into each.',
              'Bake at 180C for 30 minutes until deep gold at the edges.',
              'Pour the cold syrup over the moment it leaves the oven. It will hiss. Leave it 2 hours before cutting through the scores.'] },
    { name: 'With coconut only', time: 45, serves: 12, level: 'Very easy',
      ingredients: ['300g semolina', '150g coconut', 'Yoghurt', 'Butter', 'Sugar syrup'],
      steps: ['Same method, more coconut and no almonds.',
              'Cold syrup over hot cake, rest 2 hours.'] }
  ]);

  recipes('Halo-halo', [
    { name: 'Everything in the glass', time: 20, serves: 4, level: 'Very easy',
      ingredients: ['Sweetened red beans, nata de coco, kaong, jackfruit, macapuno', '2 ripe bananas in syrup', 'Leche flan, cubed', '400ml evaporated milk', 'Shaved ice', 'Ube ice cream', 'Toasted rice flakes'],
      steps: ['Sweet things in the bottom of a tall glass, in layers, about a third full. Which ones is entirely up to you and nobody agrees.',
              'Pack shaved ice on top, right to the rim. It has to be shaved, not crushed — crushed ice gives you a cold drink with lumps.',
              'Pour the evaporated milk over until it seeps down through the ice.',
              'Flan, ice cream and rice flakes on the very top.',
              'Then stir it all into a mess, which is what halo-halo means and the only correct way to eat it.'] },
    { name: 'With what a shop sells', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['1 jar mixed halo-halo fruit', 'Evaporated milk', 'Crushed ice', 'Vanilla or ube ice cream'],
      steps: ['Fruit in the bottom, ice packed on top.', 'Milk poured over, ice cream on top, stirred.'] }
  ]);

  recipes('Salep', [
    { name: 'Thick and hot', time: 12, serves: 2, level: 'Very easy',
      ingredients: ['500ml whole milk', '2 tsp salep powder', '2 tbsp sugar', 'Cinnamon'],
      steps: ['Whisk the salep powder into the COLD milk before any heat goes near it. Add it to hot milk and it lumps instantly and permanently.',
              'Bring up slowly, whisking constantly, with the sugar.',
              'It thickens suddenly at about 8 minutes, to the weight of thin custard.',
              'Into cups, cinnamon dusted heavily over the top.'] },
    { name: 'With cornflour', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['500ml milk', '2 tbsp cornflour', '2 tbsp sugar', '1 tsp rose water', 'Cinnamon'],
      steps: ['Slake the cornflour in a little cold milk, then whisk into the rest.',
              'Heat, whisking, until it thickens. Rose water off the heat, cinnamon on top.'] }
  ]);

  recipes('Ayran', [
    { name: 'Whisked and salted', time: 3, serves: 2, level: 'Very easy',
      ingredients: ['300g plain yoghurt', '300ml cold water', '1/2 tsp salt', 'Ice', 'Dried mint, optional'],
      steps: ['Whisk the yoghurt and salt together first, alone, until completely smooth.',
              'Add the cold water gradually, still whisking. Doing it the other way round leaves lumps of yoghurt floating about.',
              'Whisk hard for another 20 seconds to get a head of foam on it — the foam is the difference between ayran and salty milk.',
              'Over ice, with dried mint if you like.'] },
    { name: 'In a blender', time: 2, serves: 2, level: 'Very easy',
      ingredients: ['300g yoghurt', '300ml cold water', 'Salt', 'Ice'],
      steps: ['Everything in, 20 seconds on high.', 'Pour straight away while the foam is still on it.'] }
  ]);

  /* ---- the sixth intake: the big kitchens -------------------------------
     French, Italian, Spanish, British, American and the rest of East Asia —
     the wells people actually cook from, which were the thinnest in here. */

  recipes('Coq au vin', [
    { name: 'The long braise', time: 150, serves: 6, level: 'Medium',
      ingredients: ['1 chicken, jointed, or 8 thighs', '150g bacon lardons', '250g button mushrooms', '12 shallots', '750ml red wine', '400ml chicken stock', '2 tbsp flour', '40g butter', 'Thyme and bay'],
      steps: ['Marinate the chicken in the wine with the herbs overnight if you can. Lift it out and dry it properly before browning — wet chicken will not colour.',
              'Render the lardons, lift them out, and brown the chicken hard in the fat. Lift that out too.',
              'Shallots and mushrooms in the same pan until deep gold, then the flour cooked out for 2 minutes.',
              'Wine back in, scraping everything off the bottom, reduced by a third. Stock, chicken, lardons, herbs.',
              'Lid on, 150C, 90 minutes. Butter whisked in at the end to give the sauce its shine.'] },
    { name: 'Thighs, one evening', time: 70, serves: 4, level: 'Easy',
      ingredients: ['8 chicken thighs', '120g lardons', '200g mushrooms', '1 onion', '400ml red wine', '300ml stock', 'Flour', 'Butter', 'Thyme'],
      steps: ['Brown the lardons, then the thighs, then the vegetables.',
              'Flour, wine, stock, thyme.', 'Lid ajar, 50 minutes on the hob. Butter at the end.'] }
  ]);

  recipes('Ratatouille', [
    { name: 'Cooked separately, then together', time: 75, serves: 6, level: 'Easy',
      ingredients: ['1 aubergine', '2 courgettes', '2 peppers', '4 tomatoes', '2 onions', '4 garlic cloves', '120ml olive oil', 'Thyme and basil'],
      steps: ['Cut everything into even chunks and cook each vegetable on its own in oil, taking it out when it is browned but still holding together. This is the whole difference between ratatouille and vegetable stew.',
              'Onions and garlic last, softened slowly.',
              'Tomatoes in with the onions, cooked down 15 minutes to a sauce.',
              'Everything folded back together with the thyme and left on the lowest heat for 20 minutes.',
              'Basil off the heat. Better warm than hot, and better still tomorrow.'] },
    { name: 'One tray', time: 55, serves: 4, level: 'Very easy',
      ingredients: ['Aubergine, courgette, peppers, red onion', '4 tomatoes', 'Garlic', '5 tbsp olive oil', 'Herbes de Provence'],
      steps: ['Chunk everything onto the biggest tray you own with the oil and herbs.',
              'Roast at 220C for 40 minutes, turning once.',
              'Less layered, and it gets you to the same table.'] }
  ]);

  recipes('Quiche lorraine', [
    { name: 'Blind-baked, properly set', time: 90, serves: 6, level: 'Medium',
      ingredients: ['250g shortcrust pastry', '200g bacon lardons', '3 eggs and 2 yolks', '300ml double cream', '100ml milk', 'Nutmeg', 'Black pepper'],
      steps: ['Line the tin, prick the base, chill 30 minutes, then blind bake at 190C for 20 minutes with beans and 8 more without. A soggy bottom starts here.',
              'Brush the hot case with a little beaten egg and give it 2 minutes more — it seals the pastry.',
              'Render the lardons until crisp and scatter them over the base.',
              'Beat the eggs, cream, milk, nutmeg and plenty of pepper. No salt; the bacon is doing that.',
              'Bake at 160C for 35 minutes. Pull it out when the middle still wobbles — it sets as it cools, and an overcooked quiche is scrambled.'] },
    { name: 'With cheese, shop pastry', time: 60, serves: 6, level: 'Easy',
      ingredients: ['1 sheet shortcrust pastry', '150g lardons', '100g gruyère', '3 eggs', '300ml cream', 'Nutmeg'],
      steps: ['Blind bake the case 20 minutes at 190C.',
              'Lardons and cheese in, custard poured over.', '35 minutes at 160C, still wobbling in the middle.'] }
  ]);

  recipes('Steak frites', [
    { name: 'Chips twice-fried', time: 60, serves: 2, level: 'Medium',
      ingredients: ['2 sirloin steaks, thick', '800g floury potatoes', 'Oil for frying', '60g butter', '2 garlic cloves', 'Thyme', 'Salt'],
      steps: ['Cut the chips, rinse off the starch, and dry them completely. Fry at 140C for 8 minutes until soft and pale, then drain and cool.',
              'Salt the steaks and leave them out of the fridge 30 minutes.',
              'Smoking hot pan, no oil in it, steak in. Three minutes a side for medium rare on a thick one, turning once.',
              'Butter, garlic and thyme into the pan for the last minute, spooned over the steak again and again.',
              'Rest the steak 5 minutes while the chips go back into 190C oil for 3 minutes to crisp. Salt them the second they come out.'] },
    { name: 'With oven chips, honestly', time: 40, serves: 2, level: 'Easy',
      ingredients: ['2 steaks', 'Oven chips', 'Butter', 'Garlic', 'Thyme'],
      steps: ['Chips in at 220C for 25 minutes.',
              'Steak in a screaming pan, 3 minutes a side, butter-basted at the end.',
              'Rest 5 minutes. Pan juices poured over.'] }
  ]);

  recipes('Bouillabaisse', [
    { name: 'With the rouille', time: 90, serves: 6, level: 'Hard',
      ingredients: ['1kg mixed white fish on the bone', '500g mussels and prawns', '2 fennel bulbs', '2 onions', '6 garlic cloves', '4 tomatoes', '200ml white wine', 'A large pinch of saffron', 'Orange peel', '2 potatoes', 'Bread and rouille to serve'],
      steps: ['Make a stock from the fish bones and heads with one onion, 30 minutes, then strain it. This is not optional — it is what makes it bouillabaisse rather than fish soup.',
              'Soften the fennel, remaining onion and garlic in olive oil, 15 minutes.',
              'Tomatoes, wine, saffron and orange peel, reduced 10 minutes, then the stock.',
              'Potatoes in for 15 minutes, then the firmest fish, then the softer fish and shellfish for the last 5. Order matters more than timing.',
              'Toasted bread rubbed with garlic, a spoon of rouille on it, floated on the bowl.'] },
    { name: 'Weeknight fish stew', time: 40, serves: 4, level: 'Easy',
      ingredients: ['600g mixed fish and prawns', '1 fennel bulb', '1 onion', 'Garlic', '1 tin tomatoes', '150ml white wine', 'Saffron or paprika', '700ml fish stock'],
      steps: ['Soften the fennel, onion and garlic.', 'Tomatoes, wine, saffron, stock, simmered 15 minutes.',
              'Fish in for 5 minutes, prawns for 2. Bread on the side.'] }
  ]);

  recipes('Crème brûlée', [
    { name: 'Baked in a bain-marie', time: 60, serves: 4, level: 'Medium',
      ingredients: ['500ml double cream', '1 vanilla pod', '6 egg yolks', '80g caster sugar', 'Demerara for the top'],
      steps: ['Heat the cream with the split vanilla to just below a simmer, then leave it 20 minutes to infuse.',
              'Whisk the yolks and sugar pale, then pour the warm cream in slowly, whisking. Pour it in fast and you have sweet scrambled egg.',
              'Strain into ramekins and sit them in a roasting tin. Hot water poured in to halfway up.',
              'Bake at 150C for 30 minutes, until set at the edge and still moving in the middle.',
              'Chill at least 4 hours. Demerara over the top, blowtorch or a very hot grill, then wait two minutes for the sugar to set hard.'] },
    { name: 'Stovetop, no oven', time: 25, serves: 4, level: 'Easy',
      ingredients: ['500ml cream', '5 egg yolks', '80g sugar', '1 tbsp cornflour', 'Vanilla', 'Demerara'],
      steps: ['Whisk the yolks, sugar and cornflour, then temper in the hot cream.',
              'Back on a low heat, stirring constantly, until it thickens to custard. Do not let it boil.',
              'Into ramekins, chilled 3 hours, then sugared and torched.'] }
  ]);

  recipes('Tarte tatin', [
    { name: 'Turned out, fingers crossed', time: 70, serves: 6, level: 'Medium',
      ingredients: ['6 firm apples', '120g caster sugar', '80g butter', '1 sheet puff pastry', 'Pinch of salt'],
      steps: ['Peel, halve and core the apples and leave them uncovered for an hour if you can — drier apples give a firmer tart.',
              'Melt the sugar in an ovenproof pan until it is a proper amber caramel, then whisk in the butter and salt off the heat.',
              'Pack the apple halves in tightly, cut side up, curved side down. They shrink, so tighter than feels right.',
              'Cook on the hob 15 minutes so they start to soften and take on the caramel.',
              'Pastry over the top, edges tucked down inside, and bake at 200C for 30 minutes. Rest 5 minutes only, then turn out — leave it longer and the caramel glues it in.'] },
    { name: 'With pears', time: 70, serves: 6, level: 'Medium',
      ingredients: ['6 firm pears', 'Sugar and butter for the caramel', 'Puff pastry', 'Star anise'],
      steps: ['Same caramel, with a star anise dropped in.',
              'Pears packed tight, 15 minutes on the hob, pastry on, 30 minutes at 200C.',
              'Turned out after 5 minutes.'] }
  ]);

  recipes('Croissant', [
    { name: 'Three days, properly laminated', time: 240, serves: 12, level: 'Hard',
      ingredients: ['500g strong flour', '10g salt', '55g sugar', '10g yeast', '300ml cold milk', '280g good butter, cold', '1 egg for the wash'],
      steps: ['Make a plain dough with everything but the 280g butter. Knead briefly, then chill overnight. Cold dough is the whole discipline here.',
              'Beat the cold butter into a flat square between paper. It must be pliable but still cold — if it is greasy, it will tear through.',
              'Wrap the butter in the dough and give it three letter folds, chilling a full hour between each. Rushing this is where home croissants fail.',
              'Roll out, cut long triangles, notch the base and roll each one up loosely.',
              'Prove 2 hours at room temperature until they wobble when you shake the tray. Egg wash, then 200C for 18 minutes.'] },
    { name: 'From bought dough', time: 30, serves: 6, level: 'Very easy',
      ingredients: ['1 packet croissant dough', '1 egg'],
      steps: ['Roll the triangles up loosely and let them prove an hour longer than the packet says.',
              'Egg wash and bake at 200C for 16 minutes.'] }
  ]);

  recipes('Gratin dauphinois', [
    { name: 'No cheese, whatever anyone says', time: 90, serves: 6, level: 'Easy',
      ingredients: ['1.2kg waxy potatoes', '500ml double cream', '200ml milk', '3 garlic cloves', 'Nutmeg', 'Butter for the dish'],
      steps: ['Slice the potatoes 3mm on a mandolin and do not rinse them. The starch is what thickens the cream.',
              'Rub the dish hard with a cut garlic clove and butter it.',
              'Simmer the cream, milk, crushed garlic, nutmeg and plenty of salt, then add the potato slices and cook them in it for 10 minutes, stirring gently.',
              'Tip the whole lot into the dish and press flat.',
              'Bake at 160C for 60 minutes. A knife should go through without resistance. Rest 15 minutes before serving or it runs.'] },
    { name: 'Faster, thinner', time: 60, serves: 4, level: 'Very easy',
      ingredients: ['800g potatoes', '400ml cream', 'Garlic', 'Nutmeg'],
      steps: ['Layer raw slices in a buttered dish with garlic and nutmeg between.',
              'Cream poured over to just cover.', '170C for 50 minutes, covered for the first 30.'] }
  ]);

  recipes('Cacio e pepe', [
    { name: 'Three ingredients, all of them tricky', time: 15, serves: 2, level: 'Medium',
      ingredients: ['200g tonnarelli or spaghetti', '100g pecorino romano, grated very fine', '1 tbsp black peppercorns, coarsely cracked'],
      steps: ['Toast the cracked pepper in a dry pan for 30 seconds until it smells sharp, then add a ladle of pasta water and let it bubble.',
              'Cook the pasta in less water than usual — you want it starchy.',
              'Make a paste with the pecorino and a little cool pasta water in a bowl. Cool, not hot. Hot water seizes the cheese into strings and there is no coming back.',
              'Drain the pasta, let the pan cool for 20 seconds, then toss the pasta with the pepper water and the cheese paste off the heat.',
              'Keep tossing and adding water until it goes from grainy to glossy. That moment is the dish.'] },
    { name: 'The forgiving way', time: 15, serves: 2, level: 'Easy',
      ingredients: ['200g spaghetti', '60g pecorino and 40g parmesan', 'Black pepper', '20g butter'],
      steps: ['A knob of butter emulsified into the pepper water first makes the sauce far harder to break.',
              'Pasta in, cheese off the heat, tossed hard with splashes of water.'] }
  ]);

  recipes('Amatriciana', [
    { name: 'Rome, and no garlic', time: 25, serves: 2, level: 'Easy',
      ingredients: ['200g bucatini', '120g guanciale, in thick strips', '400g tinned tomatoes', '1 dried chilli', '60g pecorino romano', 'Black pepper'],
      steps: ['Render the guanciale from a cold pan until the fat has run and the meat is crisp. Lift the meat out and keep it, leave the fat.',
              'Chilli into the fat, then the tomatoes, crushed by hand. Simmer 15 minutes until it darkens.',
              'No garlic and no onion. People add them and it is a different sauce.',
              'Pasta into the sauce a minute early with a splash of its water, tossed until coated.',
              'Guanciale back in at the very end so it stays crisp, pecorino off the heat.'] },
    { name: 'With pancetta', time: 25, serves: 2, level: 'Very easy',
      ingredients: ['200g rigatoni', '120g pancetta', '1 tin tomatoes', 'Chilli flakes', 'Pecorino or parmesan'],
      steps: ['Crisp the pancetta, keep the fat.', 'Tomatoes and chilli, 15 minutes.',
              'Pasta tossed through, cheese and the pancetta at the end.'] }
  ]);

  recipes('Osso buco', [
    { name: 'With gremolata', time: 180, serves: 4, level: 'Medium',
      ingredients: ['4 thick veal or beef shin slices', '2 carrots, 1 onion, 2 celery sticks, diced small', '300ml white wine', '400ml stock', '1 tin tomatoes', 'Flour', 'For gremolata: 1 lemon, 3 garlic cloves, a bunch of parsley'],
      steps: ['Tie each shin round its middle with string so it holds together, dust in flour, and brown hard on both sides.',
              'Soften the diced vegetables in the same pot for 15 minutes.',
              'Wine in, reduced by half, then the tomatoes and stock. The liquid should come two thirds up the meat, no more.',
              'Lid on, 160C, 2 hours 30, turning once. It is ready when the marrow is soft and the meat gives to a spoon.',
              'Gremolata — zest, fine garlic and parsley, chopped together — scattered on at the table, raw. It cuts the whole thing.'] },
    { name: 'In white, no tomato', time: 160, serves: 4, level: 'Medium',
      ingredients: ['4 shin slices', 'Carrot, onion, celery', '400ml white wine', '400ml stock', 'Sage and bay', 'Gremolata'],
      steps: ['Brown and braise as above, leaving the tomatoes out and using more wine.',
              'Lighter, and the version Milan argues for.'] }
  ]);

  recipes('Aubergine parmigiana', [
    { name: 'Layered and rested', time: 105, serves: 6, level: 'Medium',
      ingredients: ['3 aubergines, sliced 1cm', '2 tins chopped tomatoes', '4 garlic cloves', '300g mozzarella, torn and drained', '80g parmesan', 'Basil', 'Olive oil'],
      steps: ['Salt the aubergine slices and leave them 30 minutes, then squeeze dry. They drink half the oil otherwise.',
              'Fry or roast them at 220C until browned on both sides.',
              'Tomato sauce: garlic softened in oil, tomatoes in, simmered 25 minutes until it is thick enough to hold a line.',
              'Layer sauce, aubergine, torn mozzarella, parmesan, basil. Three times. Drain the mozzarella properly or the whole thing floods.',
              'Bake at 180C for 40 minutes, then leave it a full hour. Hot from the oven it collapses; warm it cuts.'] },
    { name: 'Smaller, faster', time: 70, serves: 4, level: 'Easy',
      ingredients: ['2 aubergines', '1 jar passata', 'Garlic', '200g mozzarella', 'Parmesan', 'Basil'],
      steps: ['Roast the aubergine slices, warm the passata with garlic.',
              'Two layers rather than three, baked 30 minutes at 190C.',
              'Rest 30 minutes before cutting.'] }
  ]);

  recipes('Gnocchi', [
    { name: 'Light, if you are lucky', time: 70, serves: 4, level: 'Hard',
      ingredients: ['1kg floury potatoes', '200g plain flour, and more to hand', '1 egg yolk', 'Nutmeg', 'Salt', '60g butter and sage to finish'],
      steps: ['Bake the potatoes whole in their skins rather than boiling them. Wet potato is the enemy and boiling adds water you then need more flour to soak up.',
              'Scoop out the flesh while hot and rice it onto a board. Let the steam go.',
              'Scatter the flour, yolk, nutmeg and salt over and bring it together with your fingertips, quickly. Knead it and you get bullets.',
              'Roll ropes, cut 2cm pillows, and roll each down a fork if you want the ridges.',
              'Boil in batches. They rise in about 90 seconds and are ready 20 seconds after that. Straight into foaming butter with sage.'] },
    { name: 'From a packet, done well', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['500g shop gnocchi', '60g butter', 'Sage', 'Parmesan'],
      steps: ['Skip the boiling entirely: fry them straight from the packet in butter, 8 minutes, without moving them much.',
              'They go crisp and golden on two sides and soft inside.',
              'Sage in for the last minute, parmesan over.'] }
  ]);

  recipes('Focaccia', [
    { name: 'Dimpled and oily', time: 180, serves: 8, level: 'Easy',
      ingredients: ['500g strong flour', '400ml water', '7g yeast', '10g salt', '100ml olive oil', 'Flaky salt', 'Rosemary'],
      steps: ['Mix flour, water, yeast and salt to a very wet dough — wetter than feels manageable. No kneading; just fold it over in the bowl four times, every 30 minutes.',
              'Rise until doubled, 2 hours, or overnight in the fridge for a better flavour.',
              'Pour 50ml of the oil into the tin, tip the dough in, and stretch it gently to the corners. Rest 45 minutes.',
              'Oiled fingers straight down through the dough to the tin, all over. Those dimples hold the oil and the oil is the point.',
              'Rest of the oil, flaky salt and rosemary over. 220C for 22 minutes until deep gold underneath.'] },
    { name: 'With tomatoes and olives', time: 180, serves: 8, level: 'Easy',
      ingredients: ['Dough as above', 'Cherry tomatoes', 'Olives', 'Olive oil', 'Oregano'],
      steps: ['Same dough and same dimpling.',
              'Press halved tomatoes and olives into the dimples before the final rest.',
              'Oil and oregano over, 220C for 25 minutes.'] }
  ]);

  recipes('Tortilla española', [
    { name: 'Soft in the middle', time: 45, serves: 6, level: 'Medium',
      ingredients: ['800g waxy potatoes, sliced thin', '2 onions, sliced', '8 eggs', '300ml olive oil', 'Salt'],
      steps: ['Cook the potatoes and onions in the oil over a low heat for 25 minutes — poaching, not frying. They should be soft and barely coloured.',
              'Drain them, keeping the oil, and let them cool a little.',
              'Beat the eggs with plenty of salt, fold the potatoes in, and leave it 10 minutes so the egg soaks in.',
              'Two tablespoons of the oil in a smaller pan, mixture in, medium-low heat, 6 minutes.',
              'Slide onto a plate, invert the pan over it, flip, and give it 4 minutes more. The middle should still be loose. Rest 10 minutes before cutting.'] },
    { name: 'Without onion', time: 40, serves: 6, level: 'Medium',
      ingredients: ['800g potatoes', '8 eggs', 'Olive oil', 'Salt'],
      steps: ['Poach the potatoes alone in the oil, 25 minutes.',
              'Fold into beaten egg, rest, cook and flip as above.',
              'This is the sin onion camp. Both sides have strong feelings.'] }
  ]);

  recipes('Patatas bravas', [
    { name: 'With the real brava sauce', time: 45, serves: 4, level: 'Easy',
      ingredients: ['800g waxy potatoes, in 3cm cubes', 'Oil for frying', '2 tbsp sweet paprika', '1 tsp hot paprika', '1 tbsp flour', '400ml stock', '1 tbsp sherry vinegar', '2 garlic cloves'],
      steps: ['Boil the potato cubes 8 minutes, drain, and dry them completely. Then let them cool — cold, dry potatoes crisp and hot wet ones do not.',
              'Sauce: soften the garlic in oil, add both paprikas off the heat so they do not burn, then the flour for a minute.',
              'Stock in gradually, whisked, then the vinegar. Simmer 10 minutes until it coats a spoon. No tomato in the Madrid version.',
              'Fry the potatoes at 190C until deep gold, 6 minutes.',
              'Salt at once and sauce poured over, not under. They go soft in a minute, so carry them straight to the table.'] },
    { name: 'Oven, with a tomato sauce', time: 50, serves: 4, level: 'Very easy',
      ingredients: ['800g potatoes', 'Oil', '1 tin tomatoes', 'Smoked paprika', 'Chilli', 'Garlic', 'Sherry vinegar'],
      steps: ['Parboil, dry, then roast at 220C for 35 minutes.',
              'Blitz the tomatoes with fried garlic, paprika, chilli and vinegar and reduce 10 minutes.',
              'Sauce over the hot potatoes at the table.'] }
  ]);

  recipes('Croquetas', [
    { name: 'Jamón, the classic', time: 60, serves: 6, level: 'Medium',
      ingredients: ['100g butter', '120g flour', '750ml whole milk', '150g serrano ham, chopped fine', 'Nutmeg', '2 eggs', '200g breadcrumbs', 'Oil for frying'],
      steps: ['Melt the butter, add the flour and cook it out for 3 full minutes. Then add the milk a splash at a time, beating between each.',
              'Keep beating over a low heat for 12 minutes. It has to come away from the sides of the pan in one lump — an under-cooked béchamel will burst in the oil.',
              'Ham and nutmeg in, then spread it in a tray and chill at least 4 hours, or overnight.',
              'Shape into cylinders, then flour, egg and crumb. Chill again for 30 minutes.',
              'Fry at 190C for 2 minutes only. Deep gold outside, molten inside, and they will burn your mouth.'] },
    { name: 'Mushroom', time: 55, serves: 6, level: 'Medium',
      ingredients: ['Béchamel as above', '300g mushrooms, chopped fine and fried dry', 'Garlic', 'Eggs and breadcrumbs'],
      steps: ['Fry the mushrooms until every drop of water has gone and they brown.',
              'Fold into the thick béchamel, chill, shape, crumb and fry as above.'] }
  ]);

  recipes('Toad in the hole', [
    { name: 'Do not open the oven', time: 50, serves: 4, level: 'Easy',
      ingredients: ['8 good sausages', '140g plain flour', '4 eggs', '200ml milk', '4 tbsp beef dripping or oil', 'Salt'],
      steps: ['Make the batter first and rest it at least 30 minutes, or overnight. Rested batter rises far better.',
              'Get the fat smoking hot in the tin at 220C, then brown the sausages in it for 10 minutes.',
              'Pour the cold batter in round the sausages — cold batter into hot fat is the whole trick — and get it back in immediately.',
              'Twenty-five minutes, and do not open the door. Not once. It will collapse and it will not come back.',
              'Onion gravy, and mash if you are serious.'] },
    { name: 'Individual ones', time: 40, serves: 4, level: 'Easy',
      ingredients: ['8 chipolatas', 'Batter as above', 'Oil', 'Muffin tin'],
      steps: ['Hot oil in each hole, a browned chipolata in each.',
              'Batter poured in, 200C for 20 minutes.',
              'Faster, and everybody gets a crisp edge.'] }
  ]);

  recipes('Bangers and mash', [
    { name: 'With onion gravy', time: 45, serves: 4, level: 'Easy',
      ingredients: ['8 sausages', '1kg floury potatoes', '100g butter', '120ml warm milk', '3 onions, sliced thin', '1 tbsp flour', '500ml beef stock', '1 tsp mustard'],
      steps: ['Cook the onions in butter over a low heat for 25 minutes until they are properly brown. This is the gravy and it cannot be rushed.',
              'Fry the sausages slowly, 20 minutes, turning. Fast heat splits them.',
              'Flour into the onions, then the stock added gradually, then the mustard. Simmer 10 minutes.',
              'Boil and mash the potatoes, then beat in the butter and warm milk. Warm milk, or the mash goes gluey.',
              'A crater in the mash, sausages leaning on it, gravy poured into the hole.'] },
    { name: 'Oven sausages, quick gravy', time: 35, serves: 4, level: 'Very easy',
      ingredients: ['8 sausages', '1kg potatoes', 'Butter and milk', '1 onion', 'Gravy granules or stock and cornflour'],
      steps: ['Sausages at 200C for 25 minutes.',
              'Onion fried while the potatoes boil, gravy made round it.',
              'Mash, sausages, gravy.'] }
  ]);

  recipes('Scones with jam and cream', [
    { name: 'Tall and light', time: 30, serves: 8, level: 'Easy',
      ingredients: ['350g self-raising flour', '80g cold butter, cubed', '3 tbsp caster sugar', '175ml milk', '1 tsp lemon juice', '1 egg for the wash', 'Jam and clotted cream'],
      steps: ['Rub the cold butter into the flour with your fingertips until it looks like breadcrumbs. Cold hands, quick work.',
              'Warm the milk slightly and stir in the lemon juice, then add it to the dry and bring it together with a knife. Barely mix it — an overworked scone is a rock.',
              'Pat out to 4cm thick. Thick, not thin; that is what gives you height.',
              'Cut straight down with a floured cutter and do not twist it. Twisting seals the sides and they rise crooked.',
              'Egg wash the tops only, then 220C for 12 minutes.'] },
    { name: 'Fruit scones', time: 30, serves: 8, level: 'Easy',
      ingredients: ['Scone dough as above', '80g sultanas', 'Zest of an orange'],
      steps: ['Fold the sultanas and zest in with the milk.',
              'Same thickness, same straight cut, same 12 minutes at 220C.'] }
  ]);

  recipes('Trifle', [
    { name: 'Made the day before', time: 60, serves: 8, level: 'Medium',
      ingredients: ['1 madeira cake or 12 trifle sponges', '100ml sherry', '400g raspberries', '1 packet raspberry jelly', '600ml custard', '400ml double cream', 'Flaked almonds'],
      steps: ['Cake in the bottom of a glass bowl, broken up, and the sherry poured over it. Let it soak while you make the jelly.',
              'Raspberries over the cake, then the cooled but still-liquid jelly poured on. Fridge until properly set, 3 hours.',
              'Custard over the set jelly — pour it over the back of a spoon so it does not cut through.',
              'Fridge again before the cream goes on, or the layers bleed into each other and the whole point is lost.',
              'Cream whipped to soft peaks, spooned on, almonds over. Overnight is better than the same day.'] },
    { name: 'Without alcohol', time: 50, serves: 8, level: 'Easy',
      ingredients: ['Sponge', 'Orange juice', 'Berries', 'Jelly', 'Custard', 'Cream'],
      steps: ['Soak the sponge in orange juice instead of sherry.',
              'Same layers, same waiting between them.'] }
  ]);

  recipes('Cornish pasty', [
    { name: 'Crimped down one side', time: 90, serves: 4, level: 'Medium',
      ingredients: ['500g plain flour', '125g lard or butter', '125g cold butter', '175ml cold water', '400g beef skirt, diced small', '2 potatoes, diced', '1 swede, diced', '1 onion', 'Plenty of white pepper', '1 egg'],
      steps: ['Make a firm pastry, wrap it and chill 2 hours. Pasty pastry is sturdier than shortcrust because it has to carry itself.',
              'Everything for the filling goes in raw, diced small and layered: potato, swede, onion, then beef on top, with a lot of salt and white pepper.',
              'Roll circles the size of a side plate, pile the filling on one half, and wet the edge.',
              'Fold over and crimp along the side — not the top. The side crimp is what makes it Cornish and it is what let a miner hold it by the edge and throw that bit away.',
              'Egg wash, a small hole in the top, then 200C for 20 minutes and 160C for 40 more.'] },
    { name: 'With shop pastry', time: 70, serves: 4, level: 'Easy',
      ingredients: ['500g shortcrust pastry', '400g beef skirt or braising steak', 'Potato, swede, onion', 'White pepper', 'Egg'],
      steps: ['Same raw filling, same side crimp.',
              '200C for 20 minutes, then 170C for 35.'] }
  ]);

  recipes('BBQ ribs', [
    { name: 'Low and slow in the oven', time: 240, serves: 4, level: 'Easy',
      ingredients: ['2 racks pork ribs', '3 tbsp brown sugar', '2 tbsp paprika', '1 tbsp garlic powder', '1 tbsp mustard powder', 'Cayenne', '300ml barbecue sauce', 'Cider vinegar'],
      steps: ['Pull the membrane off the back of the racks — get a corner up with a knife and grip it with kitchen paper. Leave it on and no rub gets through.',
              'Rub the dry mix in all over and rest them in the fridge for a few hours.',
              'Wrap tightly in foil with a splash of vinegar and bake at 140C for 3 hours. The foil steams them tender.',
              'Open the foil, brush with sauce, and give them 25 minutes at 200C, brushing twice more.',
              'They are ready when the meat pulls back from the bone ends and a bone twists free. Rest 10 minutes.'] },
    { name: 'Boiled first, grilled after', time: 110, serves: 4, level: 'Very easy',
      ingredients: ['2 racks ribs', 'Bay and peppercorns', 'Barbecue sauce'],
      steps: ['Simmer the racks in water with bay and pepper for 75 minutes.',
              'Drain, dry, sauce them, and grill or barbecue 15 minutes, turning and brushing.',
              'Purists will tell you off. It works on a weeknight.'] }
  ]);

  recipes('Gumbo', [
    { name: 'Forty minutes of roux', time: 150, serves: 8, level: 'Hard',
      ingredients: ['200ml oil', '200g plain flour', '2 onions, 2 peppers, 3 celery sticks, all diced', '400g andouille or smoked sausage', '500g prawns', '400g chicken thighs', '2L stock', '3 bay leaves', 'Cayenne and thyme', 'Rice and file powder to serve'],
      steps: ['Equal oil and flour in a heavy pot on medium-low, and now stir. Constantly. For forty minutes, until it is the colour of dark chocolate. If it catches even slightly, throw it away and start again — burnt roux ruins everything downstream.',
              'The diced vegetables straight into the hot roux; they stop it cooking further and that is the timing.',
              'Sausage and chicken in, then the stock a ladle at a time, whisked.',
              'Simmer 90 minutes with the bay and thyme.',
              'Prawns in for the last 5 minutes only. Over rice, with file powder at the table, never in the pot.'] },
    { name: 'With a jarred roux', time: 60, serves: 6, level: 'Easy',
      ingredients: ['1 jar dark roux', 'Onion, pepper, celery', '300g smoked sausage', '300g prawns', '1.5L stock', 'Cajun seasoning', 'Rice'],
      steps: ['Soften the vegetables, stir in the roux and seasoning.',
              'Stock and sausage, simmered 40 minutes.',
              'Prawns for the last 5. Not the same, and it is a Tuesday.'] }
  ]);

  recipes('Jambalaya', [
    { name: 'Creole, with tomato', time: 70, serves: 6, level: 'Easy',
      ingredients: ['400g smoked sausage, sliced', '400g chicken thighs, diced', '300g prawns', '2 onions, 1 pepper, 2 celery sticks', '400g long grain rice', '1 tin tomatoes', '900ml stock', 'Cajun seasoning', 'Bay'],
      steps: ['Brown the sausage and chicken hard and lift them out, leaving the fat.',
              'Vegetables in that fat, 10 minutes, then the seasoning and tomatoes.',
              'Rice in, stirred to coat, then the stock and the meat back in.',
              'Lid on, lowest heat, 25 minutes. Do not stir it — stirring makes it gluey, and the crust on the bottom is wanted.',
              'Prawns pushed in for the last 5 minutes. Rest 10 with the lid on before you touch it.'] },
    { name: 'Cajun, no tomato', time: 65, serves: 6, level: 'Easy',
      ingredients: ['Sausage, chicken, prawns', 'Onion, pepper, celery', 'Rice', '1L dark stock', 'Cajun seasoning'],
      steps: ['Brown the meat hard enough to leave fond on the pan — that is where the brown colour comes from instead of tomato.',
              'Same method, more stock, no tomatoes.'] }
  ]);

  recipes('Clam chowder', [
    { name: 'New England', time: 45, serves: 4, level: 'Easy',
      ingredients: ['1kg clams, or 2 tins with their juice', '150g bacon lardons', '2 onions', '3 potatoes, diced', '500ml milk', '250ml double cream', '2 tbsp flour', 'Thyme and bay', 'Crackers'],
      steps: ['Steam fresh clams in a splash of water until they open, 4 minutes, then pull the meat out and strain every drop of the liquor through muslin. That liquor is the stock.',
              'Render the bacon, then soften the onion in the fat.',
              'Flour in for 2 minutes, then the clam liquor and milk gradually, whisking.',
              'Potatoes in, simmered 15 minutes until soft enough to crush against the side.',
              'Cream and clams in at the very end, warmed only. Boil them and they turn to rubber. Crackers crumbled on top.'] },
    { name: 'From tins', time: 30, serves: 4, level: 'Very easy',
      ingredients: ['2 tins clams', '100g bacon', '1 onion', '3 potatoes', '400ml milk', '200ml cream', 'Flour', 'Thyme'],
      steps: ['Bacon, onion, flour, then the clam juice and milk.',
              'Potatoes 15 minutes.', 'Cream and clams off the heat.'] }
  ]);

  recipes('Reuben', [
    { name: 'Griddled properly', time: 20, serves: 2, level: 'Easy',
      ingredients: ['4 slices rye bread', '300g salt beef or pastrami, sliced thin', '150g sauerkraut, squeezed dry', '4 slices swiss cheese', '4 tbsp mayonnaise', '2 tbsp ketchup', '1 tbsp gherkin, chopped', '40g butter'],
      steps: ['Squeeze the sauerkraut until nothing more comes out. Wet kraut is the single reason a reuben goes soggy.',
              'Mix the mayonnaise, ketchup and gherkin for the dressing.',
              'Warm the beef briefly in a dry pan so it is not cold in the middle of a hot sandwich.',
              'Build: bread, dressing, cheese, beef, kraut, cheese, dressing, bread. Cheese against both slices is what holds it together.',
              'Butter the outsides and griddle on a medium-low heat, pressed, 5 minutes a side. Low and slow, or the cheese is solid when the rye burns.'] },
    { name: 'The Rachel, with turkey', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['Rye bread', '300g sliced turkey', 'Coleslaw instead of sauerkraut', 'Swiss cheese', 'Dressing', 'Butter'],
      steps: ['Same build, coleslaw in place of the kraut and turkey in place of the beef.',
              'Griddled the same way, pressed and patient.'] }
  ]);

  recipes('Biscuits and gravy', [
    { name: 'From scratch', time: 45, serves: 4, level: 'Medium',
      ingredients: ['400g plain flour', '4 tsp baking powder', '120g very cold butter, grated', '300ml buttermilk', '400g pork sausagemeat', '3 tbsp flour for the gravy', '600ml whole milk', 'A lot of black pepper'],
      steps: ['Grate the frozen butter into the flour, baking powder and salt and toss it through with a fork. Do not rub it in — visible lumps of butter make the layers.',
              'Buttermilk in, brought together barely, then folded over on itself three times and patted to 3cm.',
              'Cut straight down, no twisting, and bake at 220C for 14 minutes.',
              'Gravy: brown the sausagemeat, breaking it up, then scatter the flour over and cook 2 minutes.',
              'Milk in gradually, whisked, simmered 8 minutes until it coats a spoon, then more pepper than you think is reasonable. Split the biscuits and drown them.'] },
    { name: 'With shop biscuits', time: 25, serves: 4, level: 'Very easy',
      ingredients: ['1 tin American biscuits or 8 plain scones', '400g sausagemeat', 'Flour', 'Milk', 'Black pepper'],
      steps: ['Bake the biscuits as the packet says.',
              'Make the sausage gravy in a pan while they cook.',
              'Split, pour, pepper.'] }
  ]);

  recipes('Udon', [
    { name: 'Kake udon, the plain one', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['2 portions thick udon noodles', '800ml dashi', '3 tbsp light soy sauce', '1 tbsp mirin-free seasoning or 1 tsp sugar', '2 spring onions', 'Shichimi'],
      steps: ['Warm the dashi with the soy and sugar. Taste it — the broth should be light and drinkable, not salty. It is most of the dish.',
              'Boil the udon separately and briefly; they are usually pre-cooked and only want 2 minutes.',
              'Drain them and rinse under hot water to take the starch off, or the broth goes cloudy.',
              'Noodles into the bowl first, broth poured over, spring onion and shichimi on top.'] },
    { name: 'Yaki udon, fried', time: 15, serves: 2, level: 'Easy',
      ingredients: ['2 portions udon', '200g cabbage and mushrooms', '3 tbsp soy sauce', '1 tbsp oyster sauce', 'Spring onion', 'Oil'],
      steps: ['Very hot pan, vegetables first, hard, 3 minutes.',
              'Udon in with a splash of water so they loosen, then the sauces round the edge of the pan.',
              'Tossed 2 minutes and served immediately.'] }
  ]);

  recipes('Tempura', [
    { name: 'Pale and barely there', time: 35, serves: 4, level: 'Medium',
      ingredients: ['300g prawns', '1 sweet potato, 1 aubergine, green beans', '150g plain flour', '50g cornflour', '1 egg', '250ml ice-cold sparkling water', 'Oil for frying', 'Dashi, soy and grated mooli to dip'],
      steps: ['Everything cold. Bowl in the freezer, water with ice in it, egg from the fridge. Cold batter hitting hot oil is what makes tempura light.',
              'Beat the egg into the ice water, then tip in the flours and stir about five times only. It must be lumpy. A smooth batter is a thick coating.',
              'Oil at 175C. Dip and fry in small batches, 2 minutes, turning once. It should stay pale — gold is already overdone.',
              'Drain standing up on a rack, never flat on paper.',
              'Dipping sauce: warm dashi, soy and a little sugar, with grated mooli stirred in at the table.'] },
    { name: 'Vegetable only', time: 25, serves: 2, level: 'Easy',
      ingredients: ['Sweet potato, courgette, mushrooms, broccoli', 'Batter as above', 'Oil', 'Soy and lemon'],
      steps: ['Same cold batter, same small batches.',
              'Firmer vegetables first, softer ones last.', 'Soy with a squeeze of lemon to dip.'] }
  ]);

  recipes('Yakitori', [
    { name: 'Over coals, with tare', time: 45, serves: 4, level: 'Medium',
      ingredients: ['800g chicken thighs, in 3cm pieces', '6 spring onions, in lengths', '150ml soy sauce', '3 tbsp sugar', '2 tbsp honey', 'Thumb of ginger', '2 garlic cloves', 'Bamboo skewers, soaked'],
      steps: ['Tare: simmer the soy, sugar, honey, smashed ginger and garlic until it thickens enough to coat a spoon, 12 minutes. Strain it.',
              'Thread chicken and spring onion alternately, packed tight so they baste each other.',
              'Grill over hot coals or under a fierce grill, turning every minute, for 8 minutes — with no sauce on yet. Sugar burns.',
              'Now brush with tare and give it 3 more minutes, turning and brushing twice.',
              'A last brush as they come off. Shichimi at the table.'] },
    { name: 'In a griddle pan', time: 30, serves: 2, level: 'Easy',
      ingredients: ['400g chicken thighs', 'Soy, sugar, honey, ginger', 'Spring onions', 'Skewers'],
      steps: ['Thread and cook dry in a hot griddle pan, 8 minutes, turning.',
              'Sauce brushed on for the last 3 minutes only.'] }
  ]);

  recipes('Takoyaki', [
    { name: 'In the dimpled pan', time: 40, serves: 4, level: 'Hard',
      ingredients: ['200g plain flour', '2 eggs', '600ml dashi', '200g cooked octopus, in small cubes', '4 spring onions', 'Pickled ginger', 'Takoyaki sauce', 'Mayonnaise', 'Bonito flakes'],
      steps: ['Whisk the flour, eggs and dashi to a very thin batter — thinner than pancake batter, almost like milk.',
              'Get the takoyaki pan properly hot and oil every dimple generously.',
              'Fill the dimples to overflowing — flooding the whole pan is correct and the mess becomes the skin.',
              'A cube of octopus, spring onion and ginger in each. After 3 minutes, cut the batter between the holes with a skewer and turn each ball a quarter turn, tucking the loose batter underneath.',
              'Keep turning every minute for 6 minutes until round and crisp. Sauce, mayonnaise, bonito on top — the flakes will move in the heat.'] },
    { name: 'With prawns, in a poffertjes pan', time: 35, serves: 4, level: 'Medium',
      ingredients: ['Batter as above', '200g small prawns', 'Spring onion', 'Sauce, mayonnaise, bonito'],
      steps: ['Same method in any dimpled pan.',
              'Prawns instead of octopus, which is easier to find and cooks in the same time.'] }
  ]);

  recipes('Gyudon', [
    { name: 'Fifteen minutes', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['300g beef sirloin, sliced paper thin', '1 large onion, sliced', '200ml beef stock', '3 tbsp soy sauce', '2 tbsp sugar', '1 tsp grated ginger', 'Rice', 'Pickled ginger'],
      steps: ['Freeze the beef 30 minutes first if you are slicing it yourself — it goes far thinner.',
              'Simmer the onion in the stock, soy, sugar and ginger for 5 minutes until soft.',
              'Beef in, spread out, and cook for 3 minutes only. Overcooked it goes grey and tough, and it is a two-minute window.',
              'Skim any foam, then spoon beef, onion and plenty of the liquid over hot rice.',
              'Pickled ginger on the side, and a raw or soft egg on top if that is your thing.'] },
    { name: 'With a soft egg', time: 20, serves: 2, level: 'Easy',
      ingredients: ['Gyudon as above', '2 eggs'],
      steps: ['Make the gyudon.',
              'Beat the eggs loosely and pour them over the simmering beef, lid on, 90 seconds — barely set, still running.'] }
  ]);

  recipes('Mochi', [
    { name: 'Microwaved, then dusted', time: 30, serves: 8, level: 'Medium',
      ingredients: ['200g glutinous rice flour', '180g caster sugar', '300ml water', 'Cornflour or katakuriko for dusting', '200g sweet red bean paste'],
      steps: ['Whisk the rice flour, sugar and water smooth in a microwave bowl.',
              'Cover and microwave 2 minutes, stir hard with a wet spatula, 1 minute more, stir, then 30 seconds. It goes from batter to a glossy, stretchy mass.',
              'Tip onto a board heavily dusted with cornflour and dust the top too. It is extremely sticky and there is no fixing that except dusting.',
              'Cut into pieces with a dusted scraper, flatten each in your palm, put a ball of bean paste in the middle and close it.',
              'Best the day it is made. It goes hard in the fridge.'] },
    { name: 'Ichigo daifuku, with a strawberry', time: 35, serves: 8, level: 'Medium',
      ingredients: ['Mochi dough as above', '8 small strawberries', '200g sweet red bean paste'],
      steps: ['Hull the strawberries and wrap each one in a thin layer of bean paste first, so the fruit is sealed away from the dough.',
              'Flatten a dusted piece of mochi and close it round the wrapped berry, pinching underneath.',
              'Eat the same day \u2014 the strawberry weeps overnight and softens the shell.'] }
  ]);

  recipes('Kung pao chicken', [
    { name: 'Gong bao, properly', time: 25, serves: 2, level: 'Medium',
      ingredients: ['400g chicken thighs, diced', '1 tbsp cornflour', '80g roasted peanuts', '10 dried chillies, halved', '1 tsp Sichuan peppercorns', '4 spring onions, in lengths', '3 garlic cloves', 'For the sauce: 2 tbsp black vinegar, 2 tbsp soy, 1 tbsp sugar, 1 tsp cornflour'],
      steps: ['Toss the chicken in cornflour, soy and a splash of water and leave it 15 minutes. This velveting is why restaurant chicken is tender.',
              'Mix the sauce in a bowl before you start. There is no time once the pan is hot.',
              'Very hot wok: dried chillies and Sichuan pepper for 20 seconds, until fragrant, not black.',
              'Chicken in, spread out, left alone 90 seconds, then tossed until just done.',
              'Garlic, spring onion, then the sauce round the edge. It thickens in seconds. Peanuts in off the heat so they stay crisp.'] },
    { name: 'With cashews, milder', time: 20, serves: 2, level: 'Easy',
      ingredients: ['400g chicken', '100g cashews', '2 dried chillies', 'Pepper, garlic, spring onion', 'Soy, vinegar, sugar, cornflour'],
      steps: ['Same method with fewer chillies and cashews in place of peanuts.',
              'Add a diced pepper with the garlic if you want more in the bowl.'] }
  ]);

  recipes('Sweet and sour pork', [
    { name: 'Sharp, not orange', time: 40, serves: 4, level: 'Medium',
      ingredients: ['600g pork shoulder, cubed', '1 egg', '100g cornflour', '1 pepper, 1 onion', '200g fresh pineapple', 'Oil for frying', 'For the sauce: 4 tbsp rice vinegar, 3 tbsp ketchup, 3 tbsp sugar, 2 tbsp soy, 1 tsp cornflour'],
      steps: ['Marinate the pork in the beaten egg, a splash of soy and salt for 20 minutes, then toss it in cornflour until every piece is dry and dusty.',
              'Fry at 170C for 4 minutes, rest 5, then again at 190C for 90 seconds. Twice is what keeps it crisp under the sauce.',
              'Mix the sauce and taste it cold. It should make you wince slightly — once it hits hot pork it mellows a lot.',
              'Stir-fry the pepper and onion hard for 2 minutes, add the pineapple, then the sauce until it thickens and turns glossy.',
              'Pork in at the very last second, tossed twice, and served immediately or the crust goes.'] },
    { name: 'With chicken, in the oven', time: 35, serves: 4, level: 'Easy',
      ingredients: ['600g chicken thighs', 'Cornflour', 'Pepper, onion, pineapple', 'Vinegar, ketchup, sugar, soy'],
      steps: ['Toss the chicken in cornflour and oil, roast at 220C for 20 minutes.',
              'Make the sauce and vegetables in a pan.',
              'Chicken folded through at the end.'] }
  ]);

  recipes('Wonton soup', [
    { name: 'The broth matters more', time: 60, serves: 4, level: 'Medium',
      ingredients: ['300g pork mince', '150g raw prawns, chopped', '1 tbsp sesame oil', '2 tbsp soy sauce', '1 tsp grated ginger', '2 spring onions', '40 wonton wrappers', '1.5L good chicken stock', 'Pak choi', 'White pepper'],
      steps: ['Mix the filling and beat it in one direction with chopsticks for a minute until it goes sticky and holds together. That beating is what gives wontons their bounce.',
              'A teaspoon per wrapper, wet the edge, fold to a triangle and bring the two long corners together.',
              'Get the stock properly good — this is a clear soup and there is nowhere to hide. Season it with white pepper and a little soy only.',
              'Boil the wontons in a separate pan of water, 4 minutes, so they do not cloud the broth.',
              'Wontons into bowls, broth poured over, pak choi wilted in the heat, spring onion on top.'] },
    { name: 'In chilli oil, no soup', time: 40, serves: 4, level: 'Easy',
      ingredients: ['Wontons as above', 'Chilli oil', 'Black vinegar', 'Soy', 'Garlic', 'Spring onion'],
      steps: ['Boil the wontons 4 minutes and drain them well.',
              'Sauce in the bowl: chilli oil, vinegar, soy, crushed garlic.',
              'Wontons on top, tossed at the table.'] }
  ]);

  recipes('Kimchi jjigae', [
    { name: 'Old kimchi is better', time: 35, serves: 3, level: 'Very easy',
      ingredients: ['400g well-fermented kimchi, with its juice', '300g pork belly, sliced', '1 onion', '2 tbsp gochujang', '1 tbsp gochugaru', '1 tsp sugar', '700ml stock or rice water', '200g firm tofu', '2 spring onions'],
      steps: ['Use the sourest kimchi you have. Fresh kimchi makes a flat stew; the sourness is the whole flavour and it only comes with age.',
              'Fry the pork belly until the fat runs and the edges brown, 6 minutes.',
              'Kimchi and onion in and fry them hard in that fat for 5 minutes. Frying the kimchi first is the step people skip and it is what deepens it.',
              'Gochujang, gochugaru and sugar in, then the stock and the kimchi juice. Simmer 15 minutes.',
              'Tofu in for the last 5, cut thick and left alone so it does not break. Spring onion over. Rice on the side, always.'] },
    { name: 'With tinned tuna', time: 25, serves: 2, level: 'Very easy',
      ingredients: ['300g sour kimchi', '1 tin tuna in oil', '1 onion', 'Gochujang and gochugaru', '500ml stock', 'Tofu'],
      steps: ['Fry the kimchi and onion in the tuna oil, 5 minutes.',
              'Paste, stock, simmer 12 minutes.', 'Tuna and tofu in at the end, barely stirred.'] }
  ]);

  recipes('Haemul pajeon', [
    { name: 'Crisp at the edge', time: 30, serves: 4, level: 'Medium',
      ingredients: ['150g plain flour', '50g cornflour', '1 egg', '250ml ice-cold water', '12 spring onions, whole, trimmed', '250g mixed prawns and squid, chopped', 'Oil', 'Soy and vinegar to dip'],
      steps: ['Batter: flour, cornflour, egg and ice-cold water, whisked but still slightly lumpy. Cold and slightly under-mixed is right.',
              'Lay the whole spring onions flat in a very hot, generously oiled pan — more oil than feels comfortable, it is shallow-frying not dry-frying.',
              'Pour half the batter over them in a thin layer, then scatter the seafood on top and a little more batter to hold it.',
              'Six minutes without touching it. Then flip, add more oil round the edge, and press flat for 4 minutes more.',
              'Cut with scissors and eat straight away. Soy with vinegar and a pinch of chilli to dip.'] },
    { name: 'Kimchi version', time: 25, serves: 2, level: 'Easy',
      ingredients: ['Batter as above', '200g kimchi, chopped, plus 2 tbsp of its juice', 'Spring onions', 'Oil'],
      steps: ['Fold the kimchi and its juice into the batter, which turns it pink.',
              'Same hot, oily pan and the same patience before flipping.'] }
  ]);

  recipes('Naengmyeon', [
    { name: 'Mul naengmyeon, in icy broth', time: 40, serves: 2, level: 'Medium',
      ingredients: ['2 portions buckwheat naengmyeon noodles', '1L beef stock, well skimmed', '150ml dongchimi radish water if you have it', '2 tbsp rice vinegar', '1 tsp sugar', '1 cucumber, shredded', '2 boiled eggs', 'Sliced cold beef brisket', 'Korean mustard'],
      steps: ['Chill the broth until it is nearly freezing — a few ice crystals in it is correct, not a fault.',
              'Season it with vinegar, sugar and salt. It should taste sharper than seems sensible; the noodles are bland and they take it up.',
              'Boil the noodles for the time on the packet and no longer, then rinse them under cold running water and keep rubbing them until they squeak.',
              'Coil into bowls, pour the icy broth over, and lay the cucumber, egg and beef on top.',
              'Mustard and more vinegar at the table, stirred in to taste.'] },
    { name: 'Bibim naengmyeon, no broth', time: 30, serves: 2, level: 'Easy',
      ingredients: ['Noodles', '3 tbsp gochujang', '1 tbsp vinegar', '1 tbsp sugar', 'Sesame oil', 'Cucumber, pear, egg'],
      steps: ['Mix the sauce and chill it.',
              'Boil, rinse and squeak the noodles the same way.',
              'Tossed with the sauce rather than swimming, with pear for sweetness.'] }
  ]);

  recipes('Rogan josh', [
    { name: 'Kashmiri, for colour not heat', time: 120, serves: 4, level: 'Medium',
      ingredients: ['800g lamb shoulder, cubed', '200g yoghurt', '3 tbsp Kashmiri chilli powder', '1 tsp fennel seed, ground', '1 tsp dried ginger', '4 green cardamom, 2 black cardamom, 1 cinnamon stick', '4 cloves', '3 tbsp oil or ghee', '1 onion'],
      steps: ['Whole spices into hot oil first until they crackle and the cinnamon uncurls.',
              'Brown the lamb hard in batches. Crowding steams it and you never get the colour back.',
              'Kashmiri chilli in off the heat — it is for the deep red, not for heat, and it burns in a second on a hot pan.',
              'Yoghurt in a spoonful at a time, stirring hard between each. Add it all at once and it splits.',
              'Lid on, lowest heat, 90 minutes, until the oil comes back to the surface. Rice, not bread.'] },
    { name: 'Pressure cooker', time: 55, serves: 4, level: 'Easy',
      ingredients: ['800g lamb', 'Yoghurt', 'Kashmiri chilli', 'Whole spices', 'Onion', 'Oil'],
      steps: ['Brown and spice on sauté as above.',
              'High pressure 35 minutes, natural release.',
              'Reduce uncovered 10 minutes if it is loose.'] }
  ]);

  recipes('Samosa', [
    { name: 'Folded from scratch', time: 90, serves: 8, level: 'Hard',
      ingredients: ['300g plain flour', '4 tbsp oil', '120ml water', '1 tsp ajwain', '4 potatoes, boiled and roughly crushed', '150g peas', '1 tsp cumin seeds', '1 tsp garam masala', '1 green chilli', 'Thumb of ginger', 'Oil for frying'],
      steps: ['Work the oil into the flour until it holds shape when squeezed, then add the water to make a firm dough. Rest 30 minutes. A soft dough gives a bubbly, soft samosa.',
              'Filling: cumin in hot oil, then ginger and chilli, then the crushed potato, peas and garam masala. Crushed, not mashed — you want texture.',
              'Roll an oval, cut it in half, and form each half into a cone by wetting the straight edge and overlapping it.',
              'Fill, then seal the top edge firmly, pressing out air.',
              'Fry at a low 150C for 10 minutes, then raise to 180C for 3. Low first is what gives the blistered, crisp shell.'] },
    { name: 'With filo, baked', time: 40, serves: 6, level: 'Easy',
      ingredients: ['1 packet filo', 'Potato and pea filling as above', 'Oil'],
      steps: ['Cut filo into long strips, brush with oil, and fold the filling up in triangles.',
              'Bake at 200C for 18 minutes.',
              'Not a samosa, and a good thing to eat.'] }
  ]);

  recipes('Palak paneer', [
    { name: 'Green, not khaki', time: 40, serves: 4, level: 'Easy',
      ingredients: ['500g spinach', '250g paneer, cubed', '1 onion', '3 garlic cloves', 'Thumb of ginger', '1 green chilli', '1 tsp cumin', '1 tsp garam masala', '100ml cream or yoghurt', 'Oil'],
      steps: ['Blanch the spinach 60 seconds, then straight into iced water. This is the whole secret to it staying bright green instead of going army khaki.',
              'Squeeze it dry and blitz to a rough purée with the chilli.',
              'Fry the paneer cubes until gold on two sides and set aside. Soak them in warm salted water while you cook the rest and they stay soft.',
              'Cumin, onion, garlic and ginger fried until soft, then the garam masala.',
              'Spinach in and warmed only for 3 minutes — long cooking is what dulls it. Cream, then the paneer folded in at the end.'] },
    { name: 'With tofu', time: 35, serves: 4, level: 'Easy',
      ingredients: ['500g spinach', '250g firm tofu', 'Onion, garlic, ginger, chilli', 'Cumin, garam masala', '100ml coconut milk'],
      steps: ['Same blanch-and-shock for the spinach.',
              'Fry the tofu until browned, coconut milk instead of cream.'] }
  ]);

  recipes('Sambar', [
    { name: 'With tamarind and drumsticks', time: 50, serves: 4, level: 'Easy',
      ingredients: ['200g toor dal', '1 tsp turmeric', '2 tbsp tamarind paste', '2 tbsp sambar powder', '1 onion, 1 carrot, 1 aubergine, drumsticks if you can get them', '2 tomatoes', '2 tbsp oil', '1 tsp mustard seeds', '10 curry leaves', '2 dried chillies', 'Pinch of asafoetida'],
      steps: ['Cook the dal with the turmeric until completely soft, 30 minutes, then whisk it smooth.',
              'Simmer the vegetables separately in water with the tamarind and sambar powder, 15 minutes, until tender. Cooking them in the dal makes everything mush.',
              'Combine, loosen with water to a pourable soup, and simmer 10 minutes.',
              'Tempering: mustard seeds popped in hot oil, then curry leaves, dried chillies and asafoetida, poured over the top.',
              'Do not stir the tempering in before it reaches the table. It is meant to be seen.'] },
    { name: 'Quick, with red lentils', time: 30, serves: 3, level: 'Very easy',
      ingredients: ['150g red lentils', 'Turmeric', 'Sambar powder', 'Tamarind', 'Mixed vegetables', 'Mustard seeds, curry leaves, oil'],
      steps: ['Lentils and vegetables together, 20 minutes, since red lentils collapse anyway.',
              'Tamarind and sambar powder in for the last 5.',
              'Tempering poured over at the table.'] }
  ]);

  recipes('Gulab jamun', [
    { name: 'From milk powder', time: 60, serves: 8, level: 'Medium',
      ingredients: ['200g milk powder', '60g plain flour', '1/2 tsp baking powder', '3 tbsp ghee or melted butter', '100ml milk', '400g sugar', '400ml water', '4 cardamom pods', '1 tsp rose water', 'Oil for frying'],
      steps: ['Syrup first: sugar, water and cardamom simmered 8 minutes to a thin syrup, not a thick one. Rose water off the heat. Keep it warm.',
              'Mix the dry, rub in the fat, then add milk a little at a time until it just comes together. Handle it as little as possible.',
              'Roll smooth balls with no cracks — cracks split in the oil. Wet palms help.',
              'Fry at a low 130C, moving them constantly, for 8 minutes until deep brown. Hot oil browns the outside and leaves the middle raw.',
              'Straight from the oil into the warm syrup and left 2 hours. They double.'] },
    { name: 'With ricotta', time: 45, serves: 8, level: 'Easy',
      ingredients: ['250g ricotta, drained', '4 tbsp plain flour', '1/2 tsp baking powder', 'Sugar syrup with cardamom', 'Oil'],
      steps: ['Work the ricotta and flour into a smooth dough and roll crack-free balls.',
              'Fry low and slow as above.', 'Soak in warm syrup 2 hours.'] }
  ]);

  recipes('Jalebi', [
    { name: 'Piped and hissing', time: 40, serves: 6, level: 'Medium',
      ingredients: ['200g plain flour', '2 tbsp cornflour', '1/2 tsp baking powder', '250ml water', 'A pinch of saffron', '400g sugar', '250ml water for the syrup', '1 tsp lemon juice', 'Oil for frying'],
      steps: ['Whisk the batter smooth and let it sit 20 minutes. It should ribbon off the whisk.',
              'Syrup: sugar and water to a one-thread consistency, about 5 minutes, with the lemon juice and saffron. Keep it warm but not hot.',
              'Pipe spirals straight into 180C oil from a bottle or a piping bag — start in the middle and work out.',
              'Fry 90 seconds a side until crisp but still pale gold. They must be crisp or they go soggy in the syrup.',
              'Straight into the warm syrup for 30 seconds only, then out. Longer and they soften. Eat hot.'] },
    { name: 'Fermented overnight', time: 30, serves: 6, level: 'Medium',
      ingredients: ['200g flour', '1/2 tsp yeast', '250ml warm water', 'Sugar syrup', 'Oil'],
      steps: ['Batter with the yeast, left somewhere warm overnight until bubbly and slightly sour.',
              'Pipe, fry and dip exactly as above. The sourness is the traditional flavour.'] }
  ]);

  recipes('Kofta', [
    { name: 'On skewers, over fire', time: 40, serves: 4, level: 'Easy',
      ingredients: ['600g lamb mince, 20% fat', '1 onion, grated and squeezed dry', '4 garlic cloves', 'A large bunch of parsley, chopped fine', '1 tsp cumin', '1 tsp coriander', '1/2 tsp cinnamon', '2 tbsp breadcrumbs', 'Flat skewers'],
      steps: ['Squeeze the grated onion properly dry in a cloth. Wet onion makes the mix slide off the skewer, which is the one way this goes wrong.',
              'Mix everything and then knead it hard for 3 minutes until it goes sticky and pale. That kneading is what makes it hold.',
              'Rest in the fridge 30 minutes, then mould round flat skewers, squeezing rather than rolling.',
              'Fierce heat, 3 minutes a side, turned once only. Moving them about is how they fall off.',
              'Flatbread, yoghurt, raw onion with sumac.'] },
    { name: 'In tomato sauce', time: 45, serves: 4, level: 'Easy',
      ingredients: ['600g mince mixture as above, rolled into balls', '1 tin tomatoes', '1 onion', 'Garlic', 'Cumin', 'Olive oil'],
      steps: ['Brown the koftas all over and lift them out.',
              'Onion, garlic and cumin in the fat, then the tomatoes, simmered 15 minutes.',
              'Koftas back in for 15 minutes. Rice or bread.'] }
  ]);

  recipes('Maqluba', [
    { name: 'Flipped, and everyone watches', time: 90, serves: 6, level: 'Hard',
      ingredients: ['800g chicken pieces', '400g rice, soaked 30 minutes', '1 aubergine, sliced', '1 cauliflower, in florets', '2 onions', '1 tbsp baharat', '1 tsp turmeric', 'Cinnamon stick', 'Oil for frying', 'Toasted almonds'],
      steps: ['Poach the chicken with an onion, cinnamon and baharat for 30 minutes. Keep the stock — the rice cooks in it and that is where the flavour is.',
              'Fry the aubergine and cauliflower until well browned. Browning, not just cooking; it is the colour on the outside of the finished dome.',
              'Layer in a heavy pot in reverse: chicken on the bottom, then the vegetables, then the drained rice on top, packed flat.',
              'Pour the hot stock over to about 2cm above the rice. Lid on, lowest heat, 35 minutes, then 15 off the heat without lifting it.',
              'Run a knife round the edge, put a big plate on top, and flip it in one confident movement. Hesitate and it falls apart.'] },
    { name: 'With lamb', time: 100, serves: 6, level: 'Medium',
      ingredients: ['800g lamb shoulder, cubed', 'Rice, aubergine, cauliflower', 'Baharat, cinnamon', 'Onion', 'Almonds'],
      steps: ['Simmer the lamb 60 minutes first; it needs longer than chicken.',
              'Same reverse layering, same 35 minutes, same nervous flip.'] }
  ]);

  recipes('Menemen', [
    { name: 'Barely set', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['4 eggs', '3 ripe tomatoes, grated', '2 green peppers, chopped', '1 onion', '3 tbsp olive oil', '1 tsp pul biber', 'Bread to mop'],
      steps: ['Soften the peppers and onion in the oil for 8 minutes. They should be genuinely soft, not crunchy.',
              'Grated tomato in — grated, so the skin stays behind in your hand — and cooked down 8 minutes until the water has gone and it is jammy.',
              'Crack the eggs straight in and stir slowly with a wooden spoon, folding rather than scrambling.',
              'Take it off the heat while it still looks slightly too wet. It carries on setting in the pan.',
              'Pul biber over, bread in hand, eaten out of the pan.'] },
    { name: 'Hotter, with sucuk-style spice', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['4 eggs', 'Tomatoes, peppers, onion', '1 tbsp tomato paste', '2 tsp pul biber', '1 tsp cumin', 'Olive oil'],
      steps: ['Fry the tomato paste and spices in the oil for a minute before the vegetables go in \u2014 it deepens the colour and the heat.',
              'Same folding, same slightly-too-wet finish.'] }
  ]);

  recipes('Borek', [
    { name: 'Coiled in a round tin', time: 70, serves: 8, level: 'Medium',
      ingredients: ['1 packet filo or yufka', '400g feta, crumbled', '200g ricotta or curd', 'A bunch of parsley and dill', '2 eggs', '150ml milk', '120ml olive oil', 'Sesame and nigella seeds'],
      steps: ['Mix the cheeses, herbs and one egg for the filling. No salt; the feta has plenty.',
              'Whisk the other egg with the milk and oil — this is the wetting mixture, and it is what stops the filo turning to cardboard.',
              'Lay a sheet, brush generously, put a line of filling along one long edge, and roll it into a rope.',
              'Coil the first rope in the middle of an oiled round tin and wind the rest around it in a spiral.',
              'Brush the top with the rest of the mixture, scatter the seeds, and bake at 180C for 40 minutes. Rest 15 minutes before cutting.'] },
    { name: 'Layered, like a lasagne', time: 60, serves: 8, level: 'Easy',
      ingredients: ['Filo', 'Feta and herb filling', 'Egg, milk and oil mixture', 'Seeds'],
      steps: ['Layer filo and filling flat in a rectangular tin, brushing every second sheet.',
              'Score the top into squares before baking or you will never cut it neatly.',
              '180C for 35 minutes.'] }
  ]);

  recipes('Spanakopita', [
    { name: 'In a big tin', time: 80, serves: 8, level: 'Medium',
      ingredients: ['1kg spinach', '400g feta', '1 bunch dill and 1 bunch spring onions', '3 eggs', '1 packet filo', '150ml olive oil', 'Nutmeg', 'Lemon zest'],
      steps: ['Wilt the spinach, then squeeze it dry in a cloth with real force. Then squeeze it again. Wet filling steams the pastry and is the only way to ruin this.',
              'Chop it and mix with crumbled feta, chopped dill, spring onion, eggs, nutmeg and zest.',
              'Six sheets of filo in the oiled tin, brushing every one, with plenty of overhang.',
              'Filling spread flat, then the overhang folded in and six more sheets on top, each brushed.',
              'Score the top into diamonds through the upper layers only, then 180C for 45 minutes until deep gold. Rest 20 minutes.'] },
    { name: 'Individual triangles', time: 50, serves: 8, level: 'Easy',
      ingredients: ['Filling as above', 'Filo strips', 'Olive oil'],
      steps: ['Cut the filo into long strips and brush with oil.',
              'A spoon of filling at one end, folded up in triangles like a flag.',
              '190C for 22 minutes.'] }
  ]);

  recipes('Borscht', [
    { name: 'With beef, the long one', time: 150, serves: 8, level: 'Medium',
      ingredients: ['800g beef shin', '4 beetroot', '2 carrots', '1/2 white cabbage', '3 potatoes', '2 onions', '2 tbsp tomato purée', '2 tbsp vinegar', '2 bay leaves', 'Soured cream and dill to serve'],
      steps: ['Simmer the beef with the bay for 90 minutes, skimming, then lift it out and shred it. Keep the broth.',
              'Grate the beetroot and cook it separately with the tomato purée and the vinegar for 15 minutes. The vinegar is not for flavour — it is what keeps the colour red instead of brown.',
              'Onion and carrot softened, then potato and cabbage into the broth for 15 minutes.',
              'Beetroot and beef in last, warmed through only. Boiling the beetroot in the pot loses the colour you just protected.',
              'Rest it an hour before serving, and it is better the next day. Soured cream and a lot of dill.'] },
    { name: 'Meat-free, quicker', time: 60, serves: 6, level: 'Easy',
      ingredients: ['4 beetroot', 'Carrot, onion, cabbage, potato', '1.5L vegetable stock', 'Tomato purée', 'Vinegar', 'Bay', 'Soured cream'],
      steps: ['Same separate beetroot treatment with the vinegar.',
              'Vegetables into the stock, 20 minutes, beetroot in at the end.'] }
  ]);

  recipes('Beef stroganoff', [
    { name: 'Twenty minutes, properly', time: 25, serves: 4, level: 'Easy',
      ingredients: ['600g beef fillet or sirloin, in strips', '300g mushrooms', '2 onions', '2 tbsp flour', '300ml beef stock', '250ml soured cream', '1 tbsp Dijon mustard', '1 tsp paprika', '40g butter'],
      steps: ['Get the pan very hot and sear the beef in two batches, 60 seconds a batch. Lift it out immediately — it finishes later and overcooked strips are the usual failure.',
              'Mushrooms in, hard, until browned and dry. Then the onion, softened.',
              'Flour and paprika in for 2 minutes, then the stock gradually.',
              'Soured cream and mustard off the heat. Off the heat, or it splits.',
              'Beef and any resting juices back in for 60 seconds only. Rice, pasta or mash.'] },
    { name: 'With braising steak', time: 90, serves: 4, level: 'Easy',
      ingredients: ['700g braising steak', 'Mushrooms, onion', 'Stock', 'Soured cream', 'Mustard', 'Paprika'],
      steps: ['Brown the beef, then braise it in the stock for 70 minutes until tender.',
              'Mushrooms and onion added near the end.',
              'Soured cream and mustard stirred in off the heat.'] }
  ]);

  recipes('Pozole', [
    { name: 'Rojo, with the garnish plate', time: 180, serves: 8, level: 'Medium',
      ingredients: ['1kg pork shoulder', '2 tins hominy, drained', '6 guajillo and 3 ancho chillies', '1 onion', '6 garlic cloves', '2 bay leaves', 'Oregano', 'To serve: shredded cabbage, radish, lime, onion, oregano, tostadas'],
      steps: ['Simmer the pork with half the onion, garlic and bay for 2 hours until it shreds. Skim it properly and keep every drop of the broth.',
              'Toast the chillies briefly, soak them in hot water 20 minutes, then blitz with the rest of the onion and garlic and push through a sieve.',
              'Fry that paste in a little oil for 8 minutes until it darkens, then stir it into the broth.',
              'Shredded pork and hominy in, simmered 30 minutes more.',
              'The garnish plate is not optional — cabbage, radish, raw onion, oregano and lime, added by each person. The soup is a base and they finish it.'] },
    { name: 'Verde, with chicken', time: 60, serves: 6, level: 'Easy',
      ingredients: ['800g chicken thighs', '2 tins hominy', '500g tomatillos', '2 jalapeños', 'Onion, garlic, coriander', 'Stock', 'Garnishes'],
      steps: ['Blitz the tomatillos, chillies, onion, garlic and coriander and fry the sauce 8 minutes.',
              'Stock, chicken and hominy, simmered 35 minutes, then the chicken shredded.',
              'Same garnish plate.'] }
  ]);

  recipes('Enchiladas', [
    { name: 'Rojas, baked', time: 60, serves: 4, level: 'Easy',
      ingredients: ['12 corn tortillas', '500g cooked shredded chicken', '6 guajillo chillies', '2 tomatoes', '1 onion', '3 garlic cloves', '300ml stock', '200g cheese, grated', 'Soured cream and coriander'],
      steps: ['Toast, soak and blitz the chillies with the tomato, onion and garlic, then sieve and fry the sauce for 8 minutes with the stock.',
              'Warm each tortilla briefly in oil until pliable, then dip it in the warm sauce. Dipping before filling is what stops them splitting and going papery.',
              'Fill with chicken, roll, and pack seam-side down in a dish.',
              'Rest of the sauce over the top, then the cheese.',
              'Bake at 200C for 20 minutes only. Longer and they go to mush. Soured cream and coriander after, not before.'] },
    { name: 'Verdes, with tomatillos', time: 50, serves: 4, level: 'Easy',
      ingredients: ['12 tortillas', 'Shredded chicken', '500g tomatillos', '2 jalapeños', 'Onion, garlic, coriander', 'Cheese', 'Soured cream'],
      steps: ['Blitz and fry the green sauce for 8 minutes.',
              'Same dip, fill, roll and bake, 20 minutes at 200C.'] }
  ]);

  recipes('Tres leches cake', [
    { name: 'Soaked overnight', time: 60, serves: 10, level: 'Medium',
      ingredients: ['5 eggs, separated', '200g caster sugar', '150g plain flour', '1 tsp baking powder', '1 tin evaporated milk', '1 tin condensed milk', '250ml double cream', '1 tsp vanilla', '300ml cream for the top'],
      steps: ['Whisk the yolks with two thirds of the sugar until pale and thick, fold in the flour and baking powder.',
              'Whisk the whites to soft peaks with the rest of the sugar and fold them in gently. This is a sponge with no fat in it, on purpose — fat would stop it drinking the milk.',
              'Bake at 180C for 25 minutes, then cool completely in the tin.',
              'Poke it all over with a skewer and pour the three mixed milks over slowly, in stages, letting each soak in.',
              'Cover and refrigerate overnight. It will look drowned and it will not be. Whipped cream on top before serving.'] },
    { name: 'With a shop sponge', time: 20, serves: 8, level: 'Very easy',
      ingredients: ['1 plain sponge cake', 'Evaporated, condensed and double milk', 'Vanilla', 'Cream', 'Cinnamon'],
      steps: ['Poke the sponge all over and pour the mixed milks on in stages.',
              'Four hours in the fridge at minimum.',
              'Cream and cinnamon on top.'] }
  ]);


  /* ---- the seventh intake: east and central Asia ------------------- */

  recipes('Zhajiangmian', [
    { name: 'The Beijing way', time: 40, serves: 4, level: 'Easy',
      ingredients: ['400g minced pork', '4 tbsp sweet bean sauce', '2 tbsp yellow bean paste', '1 onion, diced', '2 spring onions', '1 tbsp soy sauce', '1 tsp sugar', '500g wheat noodles', '1 cucumber, in matchsticks'],
      steps: ['Fry the pork in a dry wok until the fat renders and it browns properly. Do not rush this part.',
              'Add the onion and cook until soft, then the two bean pastes, soy and sugar.',
              'Turn it low and let it cook down for 25 minutes, stirring now and then, until it is dark and thick and oily.',
              'Boil the noodles, drain, and divide between bowls.',
              'A big spoon of sauce on top, raw cucumber alongside. Mix it all at the table.'] },
    { name: 'Weeknight, half the time', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['250g minced pork', '3 tbsp sweet bean sauce', '1 tbsp soy sauce', '1 tsp sugar', '250g noodles', 'Cucumber'],
      steps: ['Brown the mince hard, add the sauce, soy and sugar with a splash of water.',
              'Simmer 10 minutes while the noodles cook.',
              'Cucumber on top. It is not as deep and it is still very good.'] }
  ]);

  recipes('Taiwanese beef noodle soup', [
    { name: 'Braised properly', time: 180, serves: 4, level: 'Medium',
      ingredients: ['1kg beef shin, in chunks', '3 tbsp doubanjiang', '4 tbsp soy sauce', '2 tomatoes, quartered', '1 onion, sliced', '4 garlic cloves', 'Thumb of ginger', '2 star anise', '1 cinnamon stick', '400g thick wheat noodles', 'Pickled mustard greens', 'Pak choi'],
      steps: ['Blanch the beef in boiling water for 3 minutes and rinse. This is what keeps the broth clear.',
              'Fry the onion, garlic and ginger in oil, then the doubanjiang for a minute until it smells fierce.',
              'Add the beef, tomatoes, soy, spices and enough water to cover by an inch.',
              'Simmer very gently for two and a half hours. It is ready when a spoon goes through the shin.',
              'Cook the noodles separately — never in the broth. Beef, broth, greens, a spoon of pickles on top.'] },
    { name: 'Pressure cooker', time: 60, serves: 4, level: 'Easy',
      ingredients: ['800g beef shin', '3 tbsp doubanjiang', '4 tbsp soy sauce', '1 onion', 'Ginger', 'Star anise', 'Noodles', 'Greens'],
      steps: ['Blanch and rinse the beef.',
              'Everything in the pressure cooker with water to cover. 45 minutes at pressure, then let it come down on its own.',
              'Noodles and greens separately. Assemble.'] }
  ]);

  recipes('Lu rou fan', [
    { name: 'Belly, chopped not minced', time: 90, serves: 4, level: 'Easy',
      ingredients: ['600g pork belly, skin on, in small dice', '4 shallots, sliced', '4 tbsp soy sauce', '1 tbsp dark soy', '2 tbsp rock sugar', '1 star anise', '1 tsp five spice', 'White pepper', 'Rice, to serve'],
      steps: ['Fry the shallots in a little oil until deep brown and crisp, then lift most of them out.',
              'Render the pork in the same pan over medium heat until the fat runs and the edges catch.',
              'Both soys, the sugar, the spices and 400ml water. Bring up, then down to the barest simmer.',
              'An hour and a quarter, lid ajar, until it is glossy and thick enough to coat a spoon.',
              'Over hot rice, with the crisp shallots scattered back on. Pickled cucumber if you have it.'] },
    { name: 'With shoulder, quicker', time: 45, serves: 3, level: 'Very easy',
      ingredients: ['500g pork shoulder, diced small', '3 shallots', 'Soy sauce', 'Sugar', 'Five spice', 'Rice'],
      steps: ['Brown the shallots, brown the pork.',
              'Soy, sugar, five spice, 250ml water. Simmer 35 minutes uncovered.',
              'Leaner and faster. Over rice.'] }
  ]);

  recipes('Sheng jian bao', [
    { name: 'Fried, steamed, fried', time: 120, serves: 4, level: 'Hard',
      ingredients: ['300g plain flour', '1 tsp instant yeast', '180ml warm water', '400g minced pork', '2 spring onions, chopped', '1 tbsp soy sauce', '1 tsp sesame oil', '100ml cooled pork stock jelly', 'Sesame seeds'],
      steps: ['Make a soft dough with the flour, yeast and water. Knead 8 minutes, prove until doubled.',
              'Mix the pork, spring onion, soy and sesame oil, then fold through the set stock jelly — that is the soup.',
              'Roll small discs, pleat a spoonful of filling into each, seam upwards.',
              'Seam UP in an oiled pan over medium heat. Fry 2 minutes until the bottoms are gold.',
              'Pour in 100ml water, lid on, 8 minutes. Take the lid off and let the last of it fry dry.',
              'Sesame seeds, more spring onion. Bite a small hole first or you will regret it.'] },
    { name: 'With shop wrappers', time: 40, serves: 2, level: 'Medium',
      ingredients: ['1 pack thick bao or gyoza wrappers', '250g minced pork', 'Spring onion', 'Soy sauce', 'Sesame oil'],
      steps: ['Fill and pleat the wrappers.',
              'Same method: fry seam up, add water, lid on 7 minutes, uncover and crisp.',
              'No soup inside, but the bottom is the point anyway.'] }
  ]);

  recipes('Siu mai', [
    { name: 'Pork and prawn', time: 45, serves: 4, level: 'Medium',
      ingredients: ['300g minced pork', '150g raw prawns, roughly chopped', '4 dried shiitake, soaked and diced', '1 tbsp soy sauce', '1 tsp sesame oil', '1 tsp sugar', '1 tbsp cornflour', 'White pepper', '30 wonton wrappers', 'Roe or diced carrot, to top'],
      steps: ['Mix the pork with the soy, sesame oil, sugar, cornflour and pepper, then beat it in one direction for a full minute until it turns sticky.',
              'Fold in the prawn and mushroom. Chill for 20 minutes.',
              'Press a wrapper into the circle of your thumb and finger, drop in a spoonful, squeeze the middle and flatten the top.',
              'Steam over high heat for 9 minutes.',
              'Eat straight from the basket with chilli oil.'] },
    { name: 'Pork only', time: 35, serves: 3, level: 'Easy',
      ingredients: ['400g minced pork', '2 tbsp soy sauce', 'Sesame oil', 'Cornflour', 'Shiitake', 'Wonton wrappers'],
      steps: ['Same filling method, pork only, mushrooms for texture.',
              'Fill, steam 9 minutes.'] }
  ]);

  recipes('Cheung fun', [
    { name: 'Steamed on a tray', time: 40, serves: 2, level: 'Medium',
      ingredients: ['100g rice flour', '20g cornflour', '15g tapioca starch', '300ml water', '1 tsp oil', '4 tbsp light soy sauce', '2 tbsp water', '1 tbsp sugar', 'Sesame seeds'],
      steps: ['Whisk the flours into the water with the oil until completely smooth and thin as milk.',
              'Oil a flat metal tray. Ladle on a very thin layer — it should barely cover.',
              'Steam 3 minutes until it bubbles and goes translucent.',
              'Scrape it off and roll it loosely with an oiled scraper. Repeat, stirring the batter each time.',
              'Warm the soy, water and sugar together and pour it over. Sesame on top.'] },
    { name: 'With the batter left to rest', time: 50, serves: 2, level: 'Medium',
      ingredients: ['Rice flour', 'Cornflour', 'Water', 'Oil', 'Soy sauce', 'Sugar'],
      steps: ['Make the batter an hour ahead and let it settle; it steams smoother.',
              'Same method. Thinner layers make softer rolls.'] }
  ]);

  recipes('Lion’s head meatballs', [
    { name: 'Braised in cabbage', time: 90, serves: 4, level: 'Medium',
      ingredients: ['600g minced pork, not too lean', '1 tbsp cornflour', '2 tbsp soy sauce', '1 tsp sugar', '1 spring onion, chopped', 'Thumb of ginger, grated', '1 Chinese cabbage, quartered', '600ml stock', 'White pepper'],
      steps: ['Mix the pork with the cornflour, soy, sugar, spring onion, ginger and pepper, then throw it against the bowl twenty times. It should hold together tightly.',
              'Shape four very large balls, bigger than you think.',
              'Brown them gently all over in oil — they are fragile, use two spoons.',
              'Lay the cabbage in a pot, sit the meatballs on it, pour the stock around.',
              'Cover and simmer an hour. They will soften rather than firm up, which is the whole idea.'] },
    { name: 'Steamed, lighter', time: 50, serves: 4, level: 'Easy',
      ingredients: ['500g minced pork', 'Cornflour', 'Ginger', 'Spring onion', 'Cabbage leaves', 'Soy sauce'],
      steps: ['Same mix, same throwing.',
              'Sit the balls on cabbage leaves in a steamer, 35 minutes.',
              'Cleaner tasting, and no browning to go wrong.'] }
  ]);

  recipes('Twice-cooked pork', [
    { name: 'Hui guo rou', time: 45, serves: 3, level: 'Medium',
      ingredients: ['400g pork belly, in one piece', '2 spring onions', 'Thumb of ginger', '2 tbsp doubanjiang', '1 tbsp fermented black beans, rinsed', '1 leek, sliced on the angle', '2 green peppers, in squares', '1 tsp sugar', '1 tbsp soy sauce'],
      steps: ['Simmer the belly whole with the spring onion and ginger for 25 minutes. Cool it completely — ideally in the fridge.',
              'Slice it as thinly as you possibly can.',
              'Dry-fry the slices in a hot wok until the fat runs out and the edges curl and brown.',
              'Push them aside, fry the doubanjiang and black beans in the rendered fat until the oil turns red.',
              'Leek and peppers in, sugar and soy, toss hard for a minute. The vegetables should still snap.'] },
    { name: 'From leftover roast pork', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['Cold roast pork, sliced thin', 'Doubanjiang', 'Leek', 'Green pepper', 'Soy sauce', 'Sugar'],
      steps: ['Fry the cold slices hard until they crisp at the edges.',
              'Bean paste, then vegetables, then soy and sugar. Two minutes total.'] }
  ]);

  recipes('Big plate chicken', [
    { name: 'Da pan ji, with the noodles', time: 70, serves: 4, level: 'Medium',
      ingredients: ['1 chicken, jointed into small pieces', '3 potatoes, in chunks', '2 onions, sliced', '2 green peppers', '4 dried chillies', '2 tbsp doubanjiang', '1 tbsp Sichuan peppercorns', '3 garlic cloves', '2 tbsp soy sauce', '1 tsp sugar', '300g wide flat noodles'],
      steps: ['Brown the chicken hard in a wide pan, in batches, and set aside.',
              'Fry the chillies and peppercorns for 30 seconds, then the onion, garlic and bean paste.',
              'Chicken back in with the potatoes, soy, sugar and water to nearly cover.',
              'Simmer 35 minutes, until the potato is falling and the sauce has reduced by half.',
              'Peppers in for the last 5 minutes. Boil the noodles and tip them into the pan to finish in the sauce.',
              'Serve in the pan, in the middle, for everyone.'] },
    { name: 'Thighs only, weeknight', time: 40, serves: 3, level: 'Easy',
      ingredients: ['8 chicken thighs', '2 potatoes', '1 onion', 'Doubanjiang', 'Soy sauce', 'Noodles'],
      steps: ['Brown the thighs, add everything else with water to cover.',
              '25 minutes. Noodles in at the end.'] }
  ]);

  recipes('Liangpi', [
    { name: 'Washed flour, the real way', time: 180, serves: 3, level: 'Hard',
      ingredients: ['300g strong flour', '150ml water', '3 tbsp black vinegar', '3 tbsp chilli oil', '2 garlic cloves, crushed into water', '1 tsp sesame paste', '1 cucumber, shredded', 'Bean sprouts'],
      steps: ['Make a stiff dough and rest it 30 minutes. Then wash it in a bowl of water, squeezing, until the water runs milky and only a sticky lump of gluten is left.',
              'Let the starchy water settle for two hours and pour off the clear top.',
              'Steam the gluten lump for 20 minutes and cut it into cubes.',
              'Ladle thin layers of the settled starch into an oiled tray, steam 3 minutes each until translucent, and cut into wide ribbons.',
              'Dress with vinegar, chilli oil, garlic water and sesame paste. Cucumber, sprouts, gluten cubes on top.'] },
    { name: 'With shop-bought sheets', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['1 pack fresh liangpi or wide rice noodles', 'Black vinegar', 'Chilli oil', 'Garlic', 'Cucumber', 'Bean sprouts'],
      steps: ['Loosen the sheets in warm water and cut into ribbons.',
              'Dress heavily — it wants more vinegar than feels sensible.',
              'Cucumber and sprouts. Serve cold.'] }
  ]);

  recipes('Jianbing', [
    { name: 'On a flat pan', time: 20, serves: 2, level: 'Medium',
      ingredients: ['60g plain flour', '30g mung bean flour', '200ml water', '2 eggs', '2 tbsp sweet bean sauce', '1 tsp chilli sauce', '2 spring onions, chopped', 'Coriander', '2 sheets of crisp fried wonton skin'],
      steps: ['Whisk both flours into the water until thin and lump-free.',
              'Pour a ladle onto a wide, lightly oiled pan and spread it thin with the back of the ladle.',
              'Crack an egg on top and spread it over the surface while the crepe is still wet.',
              'Scatter spring onion and coriander, then flip once the base is set.',
              'Brush with bean sauce and chilli, lay the crisp sheet on, fold in the sides and fold it in half twice.',
              'Eat immediately, standing up, from a piece of paper.'] },
    { name: 'Tortilla shortcut', time: 8, serves: 1, level: 'Very easy',
      ingredients: ['1 large flour tortilla', '1 egg', 'Hoisin or sweet bean sauce', 'Chilli sauce', 'Spring onion', 'Crisp wonton skin'],
      steps: ['Crack the egg into a pan and immediately press the tortilla on top of it.',
              'Flip when set, sauce it, add the crackers, fold.',
              'Not the real thing. Two minutes.'] }
  ]);

  recipes('Roujiamo', [
    { name: 'With the bread made', time: 150, serves: 4, level: 'Medium',
      ingredients: ['600g pork belly or shoulder, in chunks', '2 star anise', '1 cinnamon stick', '1 tsp fennel seed', '3 tbsp soy sauce', '2 tbsp rock sugar', 'Thumb of ginger', '300g plain flour', '1 tsp instant yeast', '170ml water', 'Coriander', '1 green chilli'],
      steps: ['Braise the pork with the spices, soy, sugar, ginger and water to cover for two hours, until it shreds under a fork.',
              'Meanwhile make a firm dough with the flour, yeast and water. Prove 40 minutes, divide into 8, roll into flat discs.',
              'Cook the discs in a dry pan over medium heat, 3 minutes a side, until blistered and dry. They should sound hollow.',
              'Chop the pork on a board with some of its fat and a little of the braising liquid, plus coriander and chilli.',
              'Split a bun and stuff it. It should be slightly too full.'] },
    { name: 'Pitta and leftover pork', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['Leftover slow-cooked pork', 'Pitta bread', 'Coriander', 'Green chilli', 'Soy sauce'],
      steps: ['Chop the pork fine with coriander and chilli and a splash of soy.',
              'Warm the pitta in a dry pan until it puffs, split, fill.'] }
  ]);

  recipes('Hot and sour soup', [
    { name: 'Thick, peppery, vegetarian', time: 25, serves: 4, level: 'Easy',
      ingredients: ['1 litre vegetable stock', '6 dried shiitake, soaked and sliced', '150g firm tofu, in strips', '1 handful wood ear, soaked', '4 tbsp black vinegar', '1.5 tsp ground white pepper', '2 tbsp soy sauce', '3 tbsp cornflour in water', '2 eggs, beaten', '2 spring onions', '1 tsp sesame oil'],
      steps: ['Bring the stock up with the mushrooms and their soaking water, the wood ear and the tofu. Simmer 10 minutes.',
              'Soy sauce, vinegar and — this is the part people underdo — all of the white pepper.',
              'Stir in the cornflour slurry and let it thicken for a minute.',
              'Take it off the boil. Pour the beaten egg in a thin stream while stirring one way, and stop stirring.',
              'Sesame oil and spring onion off the heat. Taste: it wants more vinegar than you think.'] },
    { name: 'Fifteen minutes from a tin', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['600ml vegetable stock', '1 tin bamboo shoots', 'Mushrooms', 'Black vinegar', 'White pepper', 'Cornflour', '1 egg'],
      steps: ['Stock, bamboo and mushrooms up to a simmer for 5 minutes.',
              'Vinegar and pepper, thicken, then the egg in a stream.'] }
  ]);

  recipes('Youtiao and soy milk', [
    { name: 'Fried from scratch', time: 90, serves: 4, level: 'Hard',
      ingredients: ['300g plain flour', '1.5 tsp baking powder', '0.5 tsp bicarbonate of soda', '1 tsp salt', '180ml water', '1 tbsp oil', 'Oil for deep frying', '1 litre unsweetened soy milk', 'Sugar or soy sauce, to season'],
      steps: ['Mix everything into a very soft, sticky dough. Do not knead it much. Oil the top, cover, and rest it in the fridge for at least 4 hours — overnight is better.',
              'Turn it out onto a floured board and press into a long rectangle. Cut into strips a finger wide.',
              'Stack pairs of strips and press a chopstick down the middle to join them.',
              'Stretch each pair long and lower into oil at 190C. They puff almost at once — keep turning so they colour evenly.',
              'Warm the soy milk. Sweet, or savoury with a splash of soy and vinegar, which is the better one.',
              'Tear the sticks and dunk.'] },
    { name: 'Shop-bought, warmed', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['Frozen youtiao', 'Unsweetened soy milk', 'Sugar'],
      steps: ['Oven at 200C for 6 minutes, or air fryer for 4, until crisp again.',
              'Warm soy milk alongside. Dunk each piece for two seconds only.'] }
  ]);

  recipes('Oyster omelette', [
    { name: 'O a jian', time: 20, serves: 2, level: 'Medium',
      ingredients: ['12 small oysters, shucked', '3 eggs', '3 tbsp sweet potato starch', '5 tbsp water', '2 handfuls of chrysanthemum greens or lettuce', '2 spring onions', '3 tbsp ketchup', '1 tbsp chilli sauce', '1 tsp sugar', '1 tbsp soy sauce'],
      steps: ['Whisk the starch into the water until it is like thin cream. This, not the egg, is what makes it stretchy.',
              'Get a pan properly hot with a good film of oil. Lay in the oysters for 30 seconds.',
              'Pour the starch slurry over and let it set into a translucent sheet, 2 minutes.',
              'Beat the eggs and pour them over the top, then pile on the greens and spring onion.',
              'Flip in halves — it will not come away cleanly and that is fine. Another minute.',
              'Mix the sauce ingredients and pour over. Eat with a spoon.'] },
    { name: 'Without oysters', time: 15, serves: 2, level: 'Easy',
      ingredients: ['3 eggs', 'Sweet potato starch', 'Water', 'Lettuce', 'Spring onion', 'Ketchup', 'Chilli sauce'],
      steps: ['Same method, no oysters. Still gluey, still good, no longer the dish.',
              'A few prawns are a closer swap than nothing.'] }
  ]);

  recipes('Tonkatsu', [
    { name: 'Loin, panko, twice', time: 30, serves: 2, level: 'Easy',
      ingredients: ['2 pork loin chops, boneless, about 2cm thick', '3 tbsp plain flour', '1 egg, beaten', '80g panko', 'Oil for frying', '0.25 white cabbage, shredded as fine as you can', 'Tonkatsu sauce', 'Lemon'],
      steps: ['Nick the fat line at the edge of each chop in three places so it does not curl up in the pan.',
              'Season, then flour, egg and panko — press the crumbs on rather than patting.',
              'Fry in 2cm of oil at 170C, 4 minutes a side, until a deep even gold.',
              'Rest on a rack, never a plate, for 3 minutes.',
              'Slice into fingers. Cabbage on the side, sauce poured over, lemon squeezed.'] },
    { name: 'Oven, less oil', time: 35, serves: 2, level: 'Very easy',
      ingredients: ['2 pork chops', 'Flour', '1 egg', 'Panko', 'Oil spray', 'Cabbage', 'Tonkatsu sauce'],
      steps: ['Toast the panko in a dry pan until golden first — the oven will not do it for you.',
              'Crumb as above, spray with oil, bake at 210C for 20 minutes, turning once.'] }
  ]);

  recipes('Zaru soba', [
    { name: 'With proper tsuyu', time: 20, serves: 2, level: 'Easy',
      ingredients: ['200g dried soba', '300ml water', '10g kombu', '15g bonito flakes', '3 tbsp soy sauce', '1 tbsp sugar', '2 spring onions, sliced thin', 'Wasabi', 'Nori, shredded'],
      steps: ['Steep the kombu in cold water for 20 minutes, bring it almost to a boil and lift it out.',
              'Add the bonito, take it off the heat, wait 2 minutes and strain. Stir in the soy and sugar. Chill it.',
              'Boil the soba in a lot of unsalted water, 4 minutes, and taste one — they overcook fast.',
              'Rinse under cold water, rubbing them with your hands to get the starch off. This is not optional.',
              'Drain hard, pile on a mat or a plate. Nori on top, dipping sauce and condiments alongside.',
              'Dip only the bottom third. Do not drown them.'] },
    { name: 'Bottled sauce, ten minutes', time: 10, serves: 1, level: 'Very easy',
      ingredients: ['100g soba', 'Bottled mentsuyu, diluted as the bottle says', 'Spring onion', 'Wasabi'],
      steps: ['Boil, rinse cold, drain.',
              'Dilute the sauce, add the onion and wasabi. Done.'] }
  ]);

  recipes('Omurice', [
    { name: 'Wrapped, not draped', time: 25, serves: 2, level: 'Medium',
      ingredients: ['400g cooked rice, cold', '1 chicken breast, diced small', '0.5 onion, diced', '4 tbsp ketchup', '1 tbsp soy sauce', '6 eggs', 'Oil', 'Salt'],
      steps: ['Fry the onion and chicken in oil until cooked through, then the rice, breaking it up.',
              'Ketchup and soy in, and keep frying for 2 minutes so the ketchup loses its raw edge. Set aside warm.',
              'Beat 3 eggs with a pinch of salt and pour into a hot oiled non-stick pan. Stir for 10 seconds then leave it.',
              'While the top is still wet, lay half the rice down the middle and fold both sides over with a spatula.',
              'Turn it out onto a plate seam down, and shape it with a tea towel into an oval.',
              'More ketchup over the top, in a line. Repeat for the second one.'] },
    { name: 'The easy way: omelette on top', time: 18, serves: 2, level: 'Very easy',
      ingredients: ['Cold rice', 'Chicken', 'Onion', 'Ketchup', '4 eggs'],
      steps: ['Make the ketchup rice, pile it on plates.',
              'Cook two flat omelettes and drape one over each pile.',
              'Nobody minds.'] }
  ]);

  recipes('Sukiyaki', [
    { name: 'At the table', time: 30, serves: 4, level: 'Easy',
      ingredients: ['600g beef sirloin, sliced paper thin', '100ml soy sauce', '100ml water', '3 tbsp sugar', '1 Chinese cabbage, chopped', '1 pack shiitake', '1 block firm tofu, cubed', '1 bundle shirataki noodles', '4 spring onions', '4 eggs'],
      steps: ['Mix the soy, water and sugar. That is the whole sauce.',
              'Heat a heavy pan at the table. Rub it with a piece of beef fat, then lay in a few slices of beef and let them colour.',
              'Splash in some sauce, then add cabbage, mushrooms, tofu and noodles around the edges.',
              'Simmer gently — top the sauce up with water as it reduces, it should not go salty.',
              'Everyone cracks an egg into their own bowl and beats it. Dip each hot piece in the raw egg before eating.',
              'Keep adding as you go. It should last an hour.'] },
    { name: 'One pan on the hob', time: 25, serves: 3, level: 'Very easy',
      ingredients: ['400g thin beef', 'Soy sauce', 'Sugar', 'Cabbage', 'Tofu', 'Mushrooms', '3 eggs'],
      steps: ['Everything in a wide pan with the sauce and a splash of water.',
              'Simmer 12 minutes. Beaten egg in bowls to dip.'] }
  ]);

  recipes('Chawanmushi', [
    { name: 'Steamed in cups', time: 30, serves: 4, level: 'Medium',
      ingredients: ['3 eggs', '450ml dashi, cooled', '1 tsp soy sauce', '0.5 tsp salt', '4 slices fish cake', '4 shiitake, sliced', 'A few mitsuba or parsley leaves'],
      steps: ['Beat the eggs gently — you want no foam at all. Stir in the cooled dashi, soy and salt.',
              'Strain the mixture twice through a fine sieve. This is the difference between silk and scrambled egg.',
              'Divide the fish cake and mushroom between four cups and pour the custard over.',
              'Cover each with foil. Steam over LOW heat, lid slightly ajar, for 12–15 minutes.',
              'It is done when it wobbles as one piece and a skewer comes out clean with clear liquid.',
              'A leaf on top. Eat warm with a spoon.'] },
    { name: 'In the oven, in a tray of water', time: 40, serves: 4, level: 'Easy',
      ingredients: ['3 eggs', 'Dashi', 'Soy sauce', 'Mushrooms', 'Fish cake'],
      steps: ['Same custard, strained.',
              'Cups in a roasting tin, boiling water halfway up, foil over the whole tin.',
              '150C for 25 minutes.'] }
  ]);

  recipes('Karaage', [
    { name: 'Fried twice', time: 40, serves: 3, level: 'Easy',
      ingredients: ['600g chicken thigh, skin on, in large bite pieces', '2 tbsp soy sauce', '1 tbsp grated ginger', '2 garlic cloves, grated', '1 tsp sugar', '1 tsp sesame oil', '6 tbsp potato starch', 'Oil for frying', 'Lemon wedges'],
      steps: ['Marinate the chicken in everything but the starch for 30 minutes. Longer is not better — it goes salty.',
              'Drain, then toss each piece in potato starch and shake the excess off hard.',
              'Fry at 160C for 90 seconds. Lift out and rest 4 minutes. They will look underdone. They are.',
              'Fry again at 190C for 45 seconds, until deep gold and loud.',
              'Salt, lemon, and eat them within five minutes.'] },
    { name: 'Air fryer', time: 30, serves: 2, level: 'Very easy',
      ingredients: ['400g chicken thigh', 'Soy sauce', 'Ginger', 'Garlic', 'Potato starch', 'Oil spray'],
      steps: ['Marinate, coat in starch, spray well with oil.',
              '200C for 14 minutes, turning once. Crisp, not the same, still worth it.'] }
  ]);

  recipes('Oyakodon', [
    { name: 'One pan, one bowl', time: 15, serves: 1, level: 'Very easy',
      ingredients: ['1 chicken thigh, sliced', '0.5 onion, sliced thin', '120ml chicken stock', '1.5 tbsp soy sauce', '1 tbsp sugar', '2 eggs, barely beaten', '1 bowl hot rice', '1 spring onion'],
      steps: ['Simmer the onion in the stock, soy and sugar in a small pan for 3 minutes.',
              'Chicken in, and cook it through — 4 minutes, it is thigh, it forgives.',
              'Beat the eggs loosely, so there are still streaks of white. Pour two thirds in a circle over the top.',
              'Lid on, 45 seconds. Pour the rest in, lid on, 30 seconds more, then off the heat.',
              'Slide the whole thing onto the rice. The top should still be wet and just short of set.'] },
    { name: 'For two, in a frying pan', time: 20, serves: 2, level: 'Easy',
      ingredients: ['2 chicken thighs', '1 onion', 'Chicken stock', 'Soy sauce', 'Sugar', '4 eggs', 'Rice'],
      steps: ['Same, in a wider pan, and divide it in half with a spatula before serving.',
              'Do not stir the egg once it is in.'] }
  ]);

  recipes('Taiyaki', [
    { name: 'In a fish mould', time: 30, serves: 6, level: 'Medium',
      ingredients: ['150g plain flour', '1 tsp baking powder', '40g sugar', '1 egg', '180ml milk', '1 tbsp melted butter', '250g sweet red bean paste'],
      steps: ['Whisk the dry ingredients, then the egg, milk and butter, into a batter a little thinner than pancake batter.',
              'Heat and oil both sides of the mould well.',
              'Fill each side about a third, drop a spoon of bean paste in the middle of one, then top both with more batter.',
              'Close it and cook 2 minutes, then flip and cook 2 minutes more.',
              'They should be crisp at the fins and soft in the body. Eat hot.'] },
    { name: 'Custard, in a waffle iron', time: 25, serves: 4, level: 'Easy',
      ingredients: ['Same batter', 'Thick custard or chocolate spread', 'Butter for the iron'],
      steps: ['Not fish-shaped, and nobody will mind.',
              'Batter, filling in the middle, more batter, close, 3 minutes.'] }
  ]);

  recipes('Dorayaki', [
    { name: 'Honey batter', time: 30, serves: 4, level: 'Easy',
      ingredients: ['2 eggs', '70g sugar', '1 tbsp honey', '120g plain flour', '0.5 tsp baking powder', '2 tbsp water', '200g sweet red bean paste'],
      steps: ['Beat the eggs, sugar and honey until pale and slightly thickened.',
              'Sift in the flour and baking powder, fold, then loosen with the water. Rest the batter 20 minutes.',
              'Cook tablespoon rounds in a dry non-stick pan over low-medium heat — no oil, or they go patchy.',
              'Turn when the surface is covered in open bubbles. A minute more.',
              'Sandwich pairs with the bean paste, more in the middle than the edges so the sides stay closed.'] },
    { name: 'Chocolate, for the unconvinced', time: 25, serves: 4, level: 'Very easy',
      ingredients: ['Same batter', 'Chocolate spread', 'Banana'],
      steps: ['Same pancakes.',
              'Spread and a slice of banana between them.'] }
  ]);

  recipes('Samgyetang', [
    { name: 'Whole small chicken', time: 90, serves: 2, level: 'Easy',
      ingredients: ['1 small chicken (about 800g)', '4 tbsp glutinous rice, soaked 2 hours', '1 dried ginseng root', '6 garlic cloves', '4 jujubes', '1 spring onion', 'Salt and black pepper'],
      steps: ['Rinse the chicken well and trim the tail fat.',
              'Stuff the cavity with the drained rice, two garlic cloves and a jujube. Cross the legs to close it.',
              'Sit it in a deep pot with the ginseng, the rest of the garlic and jujubes, and water to just cover.',
              'Bring up, skim, then simmer very gently for an hour. The broth should go pale and slightly thick.',
              'Serve in the bowl it cooked in. Salt and pepper on the side to dip the meat in, not in the pot.'] },
    { name: 'With thighs, in half the time', time: 45, serves: 2, level: 'Very easy',
      ingredients: ['6 chicken thighs, bone in', 'Glutinous rice', 'Garlic', 'Jujube', 'Spring onion'],
      steps: ['Everything in a pot with water to cover.',
              '35 minutes gently. The rice cooks loose in the broth instead of in the bird.'] }
  ]);

  recipes('Sundubu jjigae', [
    { name: 'In an earthenware pot', time: 25, serves: 2, level: 'Easy',
      ingredients: ['1 tube silken tofu', '400ml anchovy stock', '2 tbsp gochugaru', '1 tbsp gochujang', '3 garlic cloves, minced', '0.5 onion, sliced', '1 courgette, sliced', '1 tbsp soy sauce', '1 tsp sesame oil', '2 eggs', '2 spring onions'],
      steps: ['Fry the gochugaru gently in oil with the garlic for 30 seconds until the oil goes red. Do not let it burn.',
              'Onion and courgette in for 2 minutes, then the gochujang and soy.',
              'Pour in the stock and bring to a hard boil.',
              'Break the tofu in with a spoon in big pieces. Do not stir it much — it should stay in clouds.',
              'Boil 5 minutes, crack an egg in, sesame oil and spring onion, and take it to the table still bubbling.'] },
    { name: 'Vegetarian, with kelp stock', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['Silken tofu', 'Kelp and mushroom stock', 'Gochugaru', 'Gochujang', 'Garlic', 'Courgette', 'Soy sauce'],
      steps: ['Same method with kelp and dried shiitake stock.',
              'A spoon of doenjang gives back the depth the anchovies took with them.'] }
  ]);

  recipes('Jajangmyeon', [
    { name: 'Fried bean paste, properly', time: 40, serves: 3, level: 'Medium',
      ingredients: ['5 tbsp chunjang black bean paste', '4 tbsp oil', '300g pork shoulder, diced small', '1 large onion, diced', '1 courgette, diced', '1 potato, diced', '1 tbsp sugar', '2 tbsp cornflour in water', '400g thick wheat noodles', '1 cucumber, in matchsticks'],
      steps: ['Fry the bean paste in the oil over low heat for 3 minutes, stirring — raw chunjang is bitter and this is the step everyone skips.',
              'Lift the paste out. Brown the pork in the same pan, then the onion, potato and courgette until softening.',
              'Paste back in with the sugar and 300ml water. Simmer 12 minutes until the potato is tender.',
              'Thicken with the cornflour slurry until it coats a spoon.',
              'Boil the noodles, drain, sauce on top, cucumber over that. Mix it violently before eating.'] },
    { name: 'Vegetarian, with mushrooms', time: 30, serves: 2, level: 'Easy',
      ingredients: ['Chunjang', 'Oil', 'Mushrooms', 'Onion', 'Courgette', 'Potato', 'Sugar', 'Cornflour', 'Noodles'],
      steps: ['Same, with a big handful of chopped mushrooms in place of the pork.',
              'Fry the paste properly. That is where all of it comes from.'] }
  ]);

  recipes('Kimbap', [
    { name: 'The standard roll', time: 45, serves: 3, level: 'Medium',
      ingredients: ['400g short grain rice, cooked and cooled a little', '1 tbsp sesame oil', '1 tsp salt', '4 sheets nori', '2 eggs', '1 carrot, in matchsticks', '1 bunch spinach', '4 strips yellow pickled radish', '4 strips of burdock or cucumber', 'Sesame seeds'],
      steps: ['Season the warm rice with the sesame oil and salt and spread it out to cool to body temperature.',
              'Make a flat omelette and cut it into long strips. Fry the carrot briefly in oil. Blanch and squeeze the spinach, then dress it with a little sesame oil and salt.',
              'Lay a nori sheet shiny side down and spread rice over three quarters of it, thin, leaving the far edge bare.',
              'Lay the fillings in a line a third of the way up. Roll tightly with the mat, pressing as you go.',
              'Brush the roll with sesame oil and scatter seeds. Wipe the knife between every cut or it will drag.',
              'Cut thick. It travels better than it keeps.'] },
    { name: 'Vegetable only, for a lunchbox', time: 25, serves: 2, level: 'Easy',
      ingredients: ['Cooked rice', 'Nori', 'Cucumber', 'Pickled radish', 'Carrot', 'Perilla leaves', 'Sesame oil'],
      steps: ['Same roll without the egg, with a perilla leaf laid along the rice.',
              'Keeps better than the standard one, which is the point of a lunchbox.'] }
  ]);

  recipes('Galbi', [
    { name: 'Marinated in pear', time: 240, serves: 4, level: 'Easy',
      ingredients: ['1.2kg beef short ribs, flanken cut', '1 Asian pear, grated', '1 onion, grated', '6 tbsp soy sauce', '3 tbsp sugar', '2 tbsp sesame oil', '5 garlic cloves, grated', '1 tbsp grated ginger', 'Black pepper', 'Spring onions', 'Lettuce leaves'],
      steps: ['Rinse the ribs in cold water for 20 minutes to draw out the blood, then pat them very dry.',
              'Mix everything else into a marinade. The pear is doing real work here — it tenderises, so do not go past 6 hours.',
              'Marinate 4 hours in the fridge, turning once.',
              'Grill over high heat, 2–3 minutes a side. They are thin; they want char, not time.',
              'Cut between the bones with scissors at the table. Eat wrapped in lettuce with rice and ssamjang.'] },
    { name: 'Under the grill', time: 200, serves: 3, level: 'Very easy',
      ingredients: ['800g short ribs', 'Pear', 'Soy sauce', 'Sugar', 'Garlic', 'Sesame oil'],
      steps: ['Same marinade, 3 hours.',
              'Grill on the top shelf, 4 minutes a side, watching. The sugar burns quickly.'] }
  ]);

  recipes('Dakgalbi', [
    { name: 'On a hot plate, with cheese', time: 45, serves: 3, level: 'Easy',
      ingredients: ['700g chicken thigh, in chunks', '3 tbsp gochujang', '1 tbsp gochugaru', '2 tbsp soy sauce', '1 tbsp sugar', '4 garlic cloves', '1 tbsp grated ginger', '0.25 cabbage, chopped', '2 sweet potatoes, sliced', '2 spring onions', '2 rice cakes handfuls', '150g grated mozzarella'],
      steps: ['Mix the gochujang, gochugaru, soy, sugar, garlic and ginger and rub it through the chicken. 30 minutes at least.',
              'Get a wide heavy pan very hot with a little oil. Chicken in, spread out, and leave it to catch before stirring.',
              'Cabbage, sweet potato and rice cakes in. Lid on, 12 minutes, stirring twice.',
              'Uncover and let the sauce reduce and stick.',
              'Push everything to the edges, pile the cheese in the middle, lid back on for 3 minutes.',
              'Eat from the pan. Fried rice in the leftovers afterwards is the tradition.'] },
    { name: 'Without the cheese', time: 35, serves: 3, level: 'Very easy',
      ingredients: ['Chicken thigh', 'Gochujang', 'Cabbage', 'Sweet potato', 'Rice cakes', 'Perilla leaves'],
      steps: ['Same, minus the cheese, plus a handful of torn perilla at the end.',
              'Closer to how it is eaten in Chuncheon.'] }
  ]);

  recipes('Budae jjigae', [
    { name: 'Everything in', time: 30, serves: 4, level: 'Very easy',
      ingredients: ['1 tin spam, sliced', '4 frankfurter sausages, sliced', '200g kimchi with its juice', '1 block tofu, sliced', '1 onion, sliced', '2 tbsp gochugaru', '1 tbsp gochujang', '3 garlic cloves', '1 tbsp soy sauce', '800ml stock', '1 pack instant noodles', '2 slices processed cheese', '2 spring onions'],
      steps: ['Arrange everything except the noodles, cheese and spring onion in a wide pan in neat sections. It matters for about a minute and then it does not.',
              'Mix the gochugaru, gochujang, garlic and soy into a paste and dot it in the middle.',
              'Pour the stock around and bring to a boil.',
              'Boil hard for 10 minutes, then add the noodles and cook 3 minutes more.',
              'Cheese on top, spring onion, and take it to the table still going.'] },
    { name: 'Without the tin', time: 25, serves: 3, level: 'Very easy',
      ingredients: ['Good sausages', 'Bacon', 'Kimchi', 'Tofu', 'Gochugaru', 'Stock', 'Noodles', 'Cheese'],
      steps: ['Fry the sausage and bacon first so the fat gets into it.',
              'Everything else as above. Better ingredients, slightly worse dish, and that is the joke.'] }
  ]);

  recipes('Bingsu', [
    { name: 'Milk ice, shaved', time: 20, serves: 2, level: 'Easy',
      ingredients: ['500ml whole milk', '3 tbsp condensed milk', '200g sweet red bean paste', '1 handful strawberries', '2 tbsp crushed nuts', 'Rice cakes, optional'],
      steps: ['Mix the milk with one tablespoon of the condensed milk and freeze it in a shallow tray overnight.',
              'Scrape it into fine shavings with a fork, or blitz the frozen blocks briefly in a blender.',
              'Pile it high in cold bowls — use bowls that have been in the freezer.',
              'Bean paste, fruit, nuts on top, the rest of the condensed milk drizzled over.',
              'Four spoons. It has about six minutes before it is a drink.'] },
    { name: 'Mango, no bean', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['Frozen milk cubes', 'Mango', 'Condensed milk'],
      steps: ['Blitz the frozen milk cubes to snow.',
              'Mango and condensed milk over. That is it.'] }
  ]);

  recipes('Manti', [
    { name: 'Folded small', time: 120, serves: 4, level: 'Hard',
      ingredients: ['400g plain flour', '200ml water', '1 tsp salt', '400g minced lamb', '2 onions, grated and squeezed dry', 'Black pepper', '400g thick yoghurt', '3 garlic cloves, crushed', '80g butter', '2 tsp dried mint', '1 tsp chilli flakes', '1 tbsp tomato paste'],
      steps: ['Make a firm dough with the flour, water and salt. Knead 10 minutes and rest it, covered, for 30.',
              'Mix the lamb with the grated onion, salt and a lot of black pepper.',
              'Roll the dough as thin as you can manage and cut into 3cm squares. Put a pea of filling on each and pinch all four corners up to meet.',
              'Boil in salted water for 12 minutes, or steam them for 25.',
              'Beat the garlic into the yoghurt. Melt the butter with the tomato paste, mint and chilli until it foams.',
              'Yoghurt over the drained manti, butter over the yoghurt. Do not serve them dry.'] },
    { name: 'Using gyoza wrappers', time: 45, serves: 3, level: 'Easy',
      ingredients: ['1 pack gyoza wrappers', '300g minced lamb', '1 onion, grated', 'Yoghurt', 'Garlic', 'Butter', 'Dried mint', 'Chilli flakes'],
      steps: ['Fill and pinch the corners as above. They will be bigger than they should be.',
              'Boil 6 minutes. Same garlic yoghurt, same burnt butter.'] }
  ]);

  recipes('Lagman', [
    { name: 'Pulled by hand', time: 120, serves: 4, level: 'Hard',
      ingredients: ['450g strong flour', '220ml salted water', 'Oil for coating', '500g lamb shoulder, in strips', '2 onions, sliced', '2 peppers, sliced', '3 tomatoes, chopped', '2 potatoes, diced', '4 garlic cloves', '1 tbsp cumin', '1 tsp chilli flakes', 'Coriander', '1 litre stock'],
      steps: ['Make a stiff dough, knead, rest an hour, then roll into ropes, oil them heavily and rest again for another hour. The oil and the waiting are what let them stretch.',
              'Brown the lamb hard in a wide pan. Onions, then peppers, then garlic and cumin.',
              'Tomatoes and potato in, stock over, and simmer 40 minutes.',
              'Pull the ropes out long and thin, doubling and swinging them, and drop straight into boiling water. Two minutes.',
              'Noodles in bowls, stew ladled over, coriander and chilli on top.'] },
    { name: 'With shop noodles', time: 55, serves: 4, level: 'Easy',
      ingredients: ['Thick wheat noodles', 'Lamb shoulder', 'Onion', 'Peppers', 'Tomato', 'Potato', 'Cumin', 'Stock'],
      steps: ['Make the stew exactly as above.',
              'Boil the noodles separately and keep them apart until the bowl.'] }
  ]);

  recipes('Kabuli pulao', [
    { name: 'Layered and steamed', time: 150, serves: 6, level: 'Medium',
      ingredients: ['1kg lamb on the bone', '2 onions, sliced', '500g basmati, soaked 2 hours', '3 carrots, in long matchsticks', '100g raisins', '3 tbsp sugar', '2 tsp ground cumin', '1 tsp ground cardamom', '1 tsp cinnamon', 'Oil', 'Salt'],
      steps: ['Fry the onion in oil until very dark — almost too dark. Add the lamb and brown it, then water to cover and simmer 90 minutes.',
              'Lift the lamb out and keep the stock. Strain it.',
              'Fry the carrot with the sugar until glazed, then the raisins for 30 seconds until they swell. Set aside.',
              'Parboil the drained rice in salted water for 5 minutes and drain.',
              'Layer rice, lamb, rice in a heavy pot. Pour over 500ml of the stock with the spices in it. Lid wrapped in a tea towel.',
              'Lowest heat, 35 minutes. Tip out, pile the carrots and raisins on top.'] },
    { name: 'One pot, weeknight', time: 60, serves: 4, level: 'Easy',
      ingredients: ['600g diced lamb', 'Onion', 'Basmati', 'Carrot', 'Raisins', 'Cumin', 'Cardamom'],
      steps: ['Brown the lamb and onion, add the spices and 800ml water, simmer 35 minutes.',
              'Soaked rice in, lid on, 15 minutes, then rest 10 off the heat.',
              'Glazed carrot and raisins on top at the end.'] }
  ]);

  recipes('Ashak', [
    { name: 'Leek dumplings, three layers', time: 90, serves: 4, level: 'Hard',
      ingredients: ['350g plain flour', '180ml water', '1 tsp salt', '4 leeks, very finely chopped', '1 tsp chilli flakes', '300g minced lamb', '1 onion, chopped', '1 tbsp tomato paste', '1 tsp turmeric', '400g thick yoghurt', '3 garlic cloves', '2 tsp dried mint', 'Oil'],
      steps: ['Make a plain dough and rest it 30 minutes.',
              'Salt the chopped leek, leave 15 minutes, then squeeze out every drop of water. Toss with chilli.',
              'Cook the mince with the onion, tomato paste and turmeric with a splash of water until thick.',
              'Roll the dough thin, cut 8cm circles, fill with leek and fold into half moons.',
              'Boil 6 minutes.',
              'Garlic yoghurt on the plate first, dumplings on that, meat sauce over, mint and more yoghurt on top. In that order or it is a different dish.'] },
    { name: 'Vegetarian, with more leek', time: 60, serves: 3, level: 'Medium',
      ingredients: ['Dough or gyoza wrappers', 'Leeks', 'Chilli flakes', 'Yoghurt', 'Garlic', 'Split peas', 'Tomato paste', 'Dried mint'],
      steps: ['Cook yellow split peas with onion, tomato paste and turmeric until thick, in place of the meat.',
              'Same three layers.'] }
  ]);

  recipes('Beshbarmak', [
    { name: 'Boiled meat and wide noodles', time: 180, serves: 6, level: 'Medium',
      ingredients: ['1.5kg lamb on the bone', '3 onions', '2 bay leaves', '10 peppercorns', '400g plain flour', '190ml water', 'Salt', 'Parsley or dill'],
      steps: ['Cover the meat with cold water, bring up slowly, and skim properly for the first ten minutes. Add one onion, the bay and peppercorns.',
              'Simmer two and a half hours until the meat falls off the bone. Keep the broth.',
              'Make a firm noodle dough from the flour, water and salt. Rest 30 minutes, roll thin, cut into squares the size of a playing card.',
              'Slice the other two onions into rings and soften them in a ladle of hot skimmed broth.',
              'Boil the noodle squares in the broth, 4 minutes, and lay them on a wide platter.',
              'Pulled meat over, onions over that, herbs on top. Broth in cups on the side.'] },
    { name: 'With lasagne sheets', time: 150, serves: 4, level: 'Easy',
      ingredients: ['1kg lamb', 'Onions', 'Bay', 'Fresh lasagne sheets, cut into squares'],
      steps: ['Same broth and meat.',
              'Fresh lasagne sheets in the broth for 3 minutes. Close enough.'] }
  ]);

  recipes('Shashlik', [
    { name: 'Marinated overnight', time: 300, serves: 4, level: 'Easy',
      ingredients: ['1kg lamb leg or shoulder, in 4cm cubes', '3 onions, two grated and one in rings', '2 tsp ground coriander', '1 tbsp paprika', '1 tsp black pepper', '3 tbsp vinegar or lemon juice', '2 tsp salt', 'Flatbread', 'Sumac'],
      steps: ['Mix the cubes with the grated onion, spices, vinegar and salt. Cover and leave overnight in the fridge.',
              'Thread onto flat metal skewers, fat and lean alternating, pressed close together but not squashed.',
              'Cook over coals that have gone grey, turning every couple of minutes. About 12 minutes total.',
              'Rest the skewers on a plate under foil for 5 minutes.',
              'Slide off onto warm flatbread, with the onion rings tossed in sumac and vinegar.'] },
    { name: 'Under the grill', time: 260, serves: 3, level: 'Very easy',
      ingredients: ['700g lamb', 'Onion', 'Paprika', 'Coriander', 'Lemon'],
      steps: ['Same marinade, 4 hours minimum.',
              'Highest shelf, hottest grill, 4 minutes a side. Not the same as fire, still good.'] }
  ]);

  recipes('Qurutob', [
    { name: 'Torn bread under qurut', time: 30, serves: 4, level: 'Easy',
      ingredients: ['2 flatbreads, ideally a day old', '200g qurut, or 300g thick yoghurt with 1 tsp salt', '3 onions, sliced', '100ml oil', '2 tomatoes, chopped', '1 cucumber, chopped', 'Coriander, dill and basil, a lot'],
      steps: ['Fry the onions slowly in the oil until deep brown and sweet. Keep the oil.',
              'Loosen the qurut with warm water until it pours like thick cream. If using yoghurt, salt it well.',
              'Tear the bread into rough pieces into a wide bowl and pour the qurut over. Let it sit two minutes to soak.',
              'Fried onions and their oil over the top.',
              'Tomato, cucumber and a great deal of herbs. Eaten with hands, from the middle, by everyone at once.'] },
    { name: 'With pitta and yoghurt', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['Pitta', 'Thick yoghurt', 'Onion', 'Oil', 'Tomato', 'Herbs'],
      steps: ['Toast the pitta until dry, then tear.',
              'Salted thinned yoghurt over, fried onions on top, herbs.'] }
  ]);

  recipes('Shurpa', [
    { name: 'Clear, with a lot of dill', time: 120, serves: 6, level: 'Very easy',
      ingredients: ['1kg lamb on the bone', '2 onions, sliced', '3 carrots, in thick rounds', '3 potatoes, halved', '2 tomatoes, quartered', '1 pepper, in strips', '1 tsp cumin seed', 'A very large bunch of dill', 'Salt and pepper'],
      steps: ['Cover the lamb with cold water and bring it up slowly. Skim carefully — this soup is meant to be clear.',
              'Simmer an hour, barely moving. Add the onion and carrot.',
              'Thirty minutes later, the potato, tomato, pepper and cumin.',
              'Another 25 minutes until the potato is soft but whole.',
              'Salt at the end, not the start. Half the dill in the pot, half in the bowls.'] },
    { name: 'Quicker, with chops', time: 55, serves: 4, level: 'Very easy',
      ingredients: ['6 lamb chops', 'Onion', 'Carrot', 'Potato', 'Tomato', 'Cumin', 'Dill'],
      steps: ['Same method, 25 minutes on the meat before the vegetables go in.',
              'Less body in the broth, same afternoon.'] }
  ]);


  /* ---- the eighth intake: the Atlantic side ------------------------ */

  recipes('Lomo saltado', [
    { name: 'In a very hot wok', time: 30, serves: 3, level: 'Easy',
      ingredients: ['500g beef sirloin, in thick strips', '3 tbsp soy sauce', '3 tbsp red wine vinegar', '1 red onion, in thick wedges', '2 tomatoes, in wedges', '1 yellow chilli, sliced', '600g chips, freshly fried', 'Coriander', 'Rice, to serve'],
      steps: ['Season the beef and get a wok or heavy pan as hot as it will go with a little oil.',
              'Sear the beef in two batches, 90 seconds each, and lift it out. It should still be pink.',
              'Onion in, 1 minute — it must stay crunchy. Then the chilli and tomato for 30 seconds.',
              'Beef back in with the soy and vinegar. It will steam violently. Toss for 20 seconds.',
              'Tip the hot chips in, toss twice, coriander over. Serve with rice as well as the chips, which is the point of the dish.'] },
    { name: 'With oven chips, on a weeknight', time: 25, serves: 2, level: 'Very easy',
      ingredients: ['350g beef', 'Soy sauce', 'Red wine vinegar', 'Red onion', 'Tomato', 'Oven chips', 'Coriander'],
      steps: ['Chips in the oven first, and get them properly dark.',
              'Everything else as above. Add the chips at the very last second or they go soft.'] }
  ]);

  recipes('Papa a la huancaína', [
    { name: 'The yellow sauce', time: 30, serves: 4, level: 'Very easy',
      ingredients: ['6 waxy potatoes', '200g queso fresco or feta', '3 tbsp aji amarillo paste', '150ml evaporated milk', '6 cream crackers', '1 garlic clove', '2 hard-boiled eggs', 'Black olives', 'Lettuce leaves'],
      steps: ['Boil the potatoes whole in salted water until a knife slides in. Cool and slice thick.',
              'Blitz the cheese, chilli paste, milk, crackers and garlic until completely smooth. The crackers are the thickener — add more if it is loose.',
              'Taste for salt. It should be sharp and hot enough to notice.',
              'Lay the potato on lettuce, pour the sauce over so it covers.',
              'Halved egg and olives on top. Serve cold with the sauce at room temperature.'] },
    { name: 'Quicker, with cream cheese', time: 20, serves: 3, level: 'Very easy',
      ingredients: ['Potatoes', 'Cream cheese', 'Aji amarillo paste', 'Milk', 'Garlic', 'Eggs'],
      steps: ['Blitz cream cheese, chilli paste, a splash of milk and garlic.',
              'Over boiled sliced potato, egg on top.'] }
  ]);

  recipes('Causa', [
    { name: 'Pressed in layers', time: 60, serves: 4, level: 'Medium',
      ingredients: ['1kg yellow potatoes', '3 tbsp aji amarillo paste', '3 tbsp lime juice', '4 tbsp oil', '2 avocados, sliced', '1 tomato, sliced', '2 hard-boiled eggs', 'Salt', 'Olives'],
      steps: ['Boil and peel the potatoes, then rice or mash them while hot and leave to cool completely.',
              'Work in the chilli paste, lime, oil and a lot of salt. It should be smooth, bright yellow and stiff enough to hold a shape.',
              'Line a tin or a ring with cling film. Half the potato in, pressed flat.',
              'Avocado and tomato over it, seasoned, then the rest of the potato on top, pressed down hard.',
              'An hour in the fridge. Turn out, slice like a cake, egg and olives on top.'] },
    { name: 'In a glass, no pressing', time: 30, serves: 2, level: 'Very easy',
      ingredients: ['Mashed potato, cooled', 'Aji amarillo paste', 'Lime', 'Avocado', 'Egg'],
      steps: ['Season the mash as above.',
              'Layer it with avocado in a glass. Egg on top. Chill 20 minutes.'] }
  ]);

  recipes('Anticuchos', [
    { name: 'Over coals', time: 240, serves: 4, level: 'Easy',
      ingredients: ['800g beef heart, trimmed and cut into 3cm squares', '4 tbsp aji panca paste', '4 tbsp red wine vinegar', '4 garlic cloves', '1 tsp cumin', '2 tsp salt', 'Oil', 'Boiled potato and corn, to serve'],
      steps: ['Trim every scrap of sinew from the heart. This is most of the work and it decides whether it is tender.',
              'Mix the chilli paste, vinegar, garlic, cumin and salt and marinate the meat 3 hours, or overnight.',
              'Thread three or four pieces per skewer, tightly.',
              'Very hot coals, 2 minutes a side. They are thin and they go from perfect to rubber quickly.',
              'Brush with the leftover marinade thinned with oil as they cook. Potato and corn alongside.'] },
    { name: 'With beef sirloin instead', time: 200, serves: 3, level: 'Very easy',
      ingredients: ['600g beef sirloin', 'Aji panca paste', 'Vinegar', 'Garlic', 'Cumin'],
      steps: ['Same marinade, 3 hours.',
              'Grill hard and fast. Not the real thing, and a good skewer.'] }
  ]);

  recipes('Arroz chaufa', [
    { name: 'Leftover rice, hot pan', time: 20, serves: 3, level: 'Very easy',
      ingredients: ['600g cold cooked rice', '2 chicken breasts, diced', '3 eggs', '4 spring onions', '1 red pepper, diced', '3 tbsp soy sauce', '1 tbsp grated ginger', '2 garlic cloves', '1 tsp sesame oil'],
      steps: ['Beat the eggs and cook them flat in the wok. Slide out, roll, slice into ribbons.',
              'Chicken in on high heat until browned and cooked, then ginger and garlic for 20 seconds.',
              'Pepper in, then the cold rice, broken up with the back of a spoon.',
              'Keep it moving for 3 minutes so the rice actually fries rather than steams.',
              'Soy, sesame oil, egg ribbons and spring onion folded in at the end.'] },
    { name: 'Vegetarian, with more egg', time: 15, serves: 2, level: 'Very easy',
      ingredients: ['Cold rice', '4 eggs', 'Spring onion', 'Pepper', 'Soy sauce', 'Ginger'],
      steps: ['Same method with no chicken and a fourth egg.',
              'A splash of vinegar at the end lifts it.'] }
  ]);

  recipes('Asado', [
    { name: 'Slowly, over wood', time: 300, serves: 8, level: 'Medium',
      ingredients: ['1 rack of beef short ribs (tira de asado)', '1kg flank or skirt', '4 chorizo sausages', 'Coarse salt', '1 bunch parsley', '4 garlic cloves', '2 tbsp oregano', '100ml red wine vinegar', '150ml oil'],
      steps: ['Build the fire with hardwood and let it burn down to embers. Rake embers under the grill — never flames.',
              'Salt the beef heavily half an hour before it goes on.',
              'Ribs bone-side down first, high above the coals, for two hours. Do not touch them.',
              'Turn once, lower the grill, another 40 minutes. The chorizo and flank go on for the last 20.',
              'Chop the parsley, garlic and oregano and mix with the vinegar, oil and salt for the chimichurri.',
              'Rest everything 10 minutes, carve on a board, chimichurri on the side, not on top.'] },
    { name: 'On a gas barbecue', time: 90, serves: 4, level: 'Easy',
      ingredients: ['Beef short ribs', 'Flank steak', 'Chorizo', 'Coarse salt', 'Chimichurri ingredients'],
      steps: ['Indirect heat, lid down, 200C for an hour on the ribs.',
              'Over direct heat for the last 10 minutes to crust. Flank and chorizo fast and hot.'] }
  ]);

  recipes('Provoleta', [
    { name: 'In a small iron pan', time: 12, serves: 4, level: 'Very easy',
      ingredients: ['1 thick round of provolone (about 2cm)', '1 tsp dried oregano', '1 tsp chilli flakes', '1 tbsp olive oil', 'Bread, to serve'],
      steps: ['Leave the cheese out of the fridge for an hour and pat the surface dry.',
              'Get a small heavy pan hot with a film of oil. Lay the cheese in.',
              'Three minutes without touching it, until a crust forms underneath and the top starts sweating.',
              'Flip carefully with a fish slice, oregano and chilli on top, 2 minutes more.',
              'To the table in the pan. It has about three minutes before it sets again, so bring the bread first.'] },
    { name: 'Under the grill', time: 10, serves: 3, level: 'Very easy',
      ingredients: ['Provolone round', 'Oregano', 'Chilli flakes', 'Olive oil'],
      steps: ['In a shallow dish, oil and herbs on top.',
              'Hottest grill, 6 minutes, until blistered.'] }
  ]);

  recipes('Locro', [
    { name: 'The long winter one', time: 240, serves: 8, level: 'Easy',
      ingredients: ['300g dried white maize, soaked overnight', '200g white beans, soaked overnight', '500g pork belly, diced', '2 chorizo, sliced', '400g pumpkin, diced', '1 sweet potato, diced', '2 onions', '1 tbsp paprika', '1 tsp cumin', 'Spring onion and chilli oil, to finish'],
      steps: ['Cover the drained maize and beans with water and simmer 90 minutes, topping up as needed.',
              'Brown the pork and chorizo in another pan and add them with their fat.',
              'Onions, paprika and cumin in. Another hour on low, stirring so it does not catch.',
              'Pumpkin and sweet potato in for the last 45 minutes — they should dissolve and thicken it.',
              'It is ready when a spoon stands up in it. Chilli oil and spring onion on top in the bowl.'] },
    { name: 'With tinned hominy', time: 90, serves: 4, level: 'Very easy',
      ingredients: ['2 tins hominy', '1 tin white beans', 'Pork belly', 'Chorizo', 'Pumpkin', 'Paprika', 'Cumin'],
      steps: ['Brown the meats, add everything, simmer 50 minutes.',
              'Mash some of the pumpkin against the side to thicken it.'] }
  ]);

  recipes('Chivito', [
    { name: 'Built properly', time: 25, serves: 2, level: 'Easy',
      ingredients: ['2 thin beef fillet steaks', '4 rashers bacon', '2 slices ham', '2 slices mozzarella', '2 eggs', '2 soft rolls', 'Mayonnaise', 'Lettuce, tomato', 'Pickled peppers', 'Olives'],
      steps: ['Fry the bacon until crisp and set aside in the fat.',
              'Sear the steaks hard, 90 seconds a side, then lay the ham and cheese on top and cover the pan for a minute to melt it.',
              'Fry the eggs in the bacon fat.',
              'Toast the rolls. Mayonnaise on both sides, lettuce and tomato on the bottom.',
              'Steak with its cheese, bacon, egg, peppers, olives. Lid on. Press once. Give up on eating it neatly.'] },
    { name: 'Al plato — on a plate, no bread', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['Steak', 'Bacon', 'Ham', 'Cheese', 'Eggs', 'Chips', 'Salad'],
      steps: ['Same components, piled on a plate with chips instead of in a roll.',
              'How half of Montevideo eats it.'] }
  ]);

  recipes('Pão de queijo', [
    { name: 'From tapioca starch', time: 40, serves: 6, level: 'Easy',
      ingredients: ['250g sour tapioca starch (polvilho azedo)', '120ml milk', '60ml oil', '1 tsp salt', '2 eggs', '150g grated hard cheese'],
      steps: ['Bring the milk, oil and salt to a rolling boil and pour it straight onto the starch. Stir hard — it will look like a disaster.',
              'Let it cool until you can touch it, then beat in the eggs one at a time.',
              'Beat in the cheese. The dough is sticky and that is correct.',
              'Wet your hands and roll walnut-sized balls onto a lined tray.',
              '200C for 20 minutes until puffed and pale gold. Do not open the oven early.',
              'Eat within ten minutes. They are not the same cold.'] },
    { name: 'Blender batter, in a muffin tin', time: 30, serves: 6, level: 'Very easy',
      ingredients: ['Tapioca starch', 'Milk', 'Oil', 'Eggs', 'Grated cheese'],
      steps: ['Blitz everything cold in a blender to a loose batter.',
              'Pour into a greased mini muffin tin, two thirds full. 200C, 20 minutes.'] }
  ]);

  recipes('Moqueca', [
    { name: 'Capixaba, in a clay pot', time: 40, serves: 4, level: 'Easy',
      ingredients: ['800g firm white fish, in thick pieces', '2 limes', '1 onion, in rings', '2 peppers, in rings', '3 tomatoes, in rings', '4 garlic cloves', '400ml coconut milk', '3 tbsp dende palm oil', 'Coriander', 'Salt'],
      steps: ['Rub the fish with lime juice, garlic and salt and leave it 20 minutes.',
              'Lay onion, pepper and tomato rings across the bottom of a wide pot in layers.',
              'Fish on top, then another layer of vegetables. Do not stir at any point.',
              'Pour the coconut milk and palm oil over, lid on, and simmer 18 minutes.',
              'Coriander over the top. Serve from the pot with rice and farofa.'] },
    { name: 'Prawn, quicker', time: 25, serves: 3, level: 'Very easy',
      ingredients: ['500g raw prawns', 'Lime', 'Onion', 'Pepper', 'Tomato', 'Coconut milk', 'Coriander'],
      steps: ['Same layering. Prawns need 6 minutes, not 18.',
              'Add them once the vegetables have softened.'] }
  ]);

  recipes('Coxinha', [
    { name: 'The teardrop', time: 90, serves: 6, level: 'Hard',
      ingredients: ['2 chicken breasts', '500ml chicken stock', '300g plain flour', '2 tbsp butter', '150g cream cheese', '1 onion, grated', '2 garlic cloves', 'Parsley', '2 eggs, beaten', '200g breadcrumbs', 'Oil for frying'],
      steps: ['Poach the chicken in the stock, then shred it and keep the stock.',
              'Mix the shredded chicken with the cream cheese, softened onion, garlic and parsley. Season hard.',
              'Bring 400ml of the stock and the butter to a boil, tip in all the flour at once and beat until it forms one smooth ball that leaves the pan. Cool it.',
              'Take a piece of dough, flatten it in your palm, put filling in the middle and close it into a teardrop with a point.',
              'Egg, then breadcrumbs. Chill 30 minutes — skip this and they burst.',
              'Fry at 170C for 4 minutes until deep gold.'] },
    { name: 'Baked, round, no shaping', time: 60, serves: 4, level: 'Medium',
      ingredients: ['Same dough and filling', 'Egg', 'Breadcrumbs', 'Oil spray'],
      steps: ['Roll into balls rather than teardrops.',
              'Crumb, spray well, 200C for 25 minutes turning once.'] }
  ]);

  recipes('Açaí bowl', [
    { name: 'From frozen pulp', time: 10, serves: 2, level: 'Very easy',
      ingredients: ['2 packs frozen unsweetened açaí pulp', '1 frozen banana', '2 tbsp guaraná syrup or honey', 'Splash of apple juice', 'Granola', 'Sliced banana and strawberry'],
      steps: ['Break the frozen pulp into a blender with the frozen banana and the syrup.',
              'Add only a splash of juice — too much and it becomes a smoothie, which is the usual mistake.',
              'Blitz in short bursts, scraping down, until it is thick enough to hold a spoon upright.',
              'Into cold bowls. Granola and fruit on top, not stirred through.'] },
    { name: 'With powder, thicker', time: 8, serves: 1, level: 'Very easy',
      ingredients: ['2 tbsp açaí powder', '1 frozen banana', 'Frozen berries', 'Splash of oat milk', 'Granola'],
      steps: ['Blitz the frozen fruit with the powder and as little liquid as it will take.',
              'Toppings on. Not the same colour, near enough the same bowl.'] }
  ]);

  recipes('Brigadeiro', [
    { name: 'Rolled', time: 30, serves: 20, level: 'Very easy',
      ingredients: ['1 tin condensed milk', '3 tbsp cocoa powder', '1 tbsp butter', 'Chocolate sprinkles'],
      steps: ['Everything except the sprinkles into a heavy pan over medium-low heat.',
              'Stir constantly with a spatula, scraping the bottom, for about 10 minutes.',
              'It is ready when you can draw the spatula across the base and the gap stays open for a second.',
              'Pour onto a greased plate and cool completely — at least an hour.',
              'Grease your hands, roll small balls, roll them in sprinkles.'] },
    { name: 'In a spoon, undercooked on purpose', time: 15, serves: 6, level: 'Very easy',
      ingredients: ['Condensed milk', 'Cocoa', 'Butter'],
      steps: ['Cook it two minutes less so it stays soft.',
              'Spoon into little cups. Brigadeiro de colher, and it is the better one.'] }
  ]);

  recipes('Ajiaco', [
    { name: 'With three potatoes and guascas', time: 90, serves: 6, level: 'Easy',
      ingredients: ['4 chicken breasts on the bone', '2 litres water', '500g waxy potatoes, sliced', '500g floury potatoes, chunked', '500g small yellow potatoes, whole', '2 corn cobs, in thirds', '3 tbsp dried guascas', '1 onion', 'Cream', 'Capers', 'Avocado'],
      steps: ['Simmer the chicken with the onion in the water for 30 minutes, then lift it out and shred it.',
              'The floury potatoes go in first and are meant to disintegrate — they are the thickener.',
              'Forty minutes later add the waxy and yellow potatoes and the corn.',
              'Guascas in for the last 10 minutes only. Any longer and they turn bitter.',
              'Chicken back in. Serve with cream, capers and avocado on the side for everyone to add.'] },
    { name: 'Without guascas', time: 70, serves: 4, level: 'Very easy',
      ingredients: ['Chicken thighs', 'Three kinds of potato', 'Corn', 'Oregano and a bay leaf', 'Cream', 'Capers'],
      steps: ['Same method. Oregano stands in, badly but willingly.',
              'The three potatoes matter more than the herb does.'] }
  ]);

  recipes('Bandeja paisa', [
    { name: 'The whole tray', time: 60, serves: 4, level: 'Medium',
      ingredients: ['400g cooked red beans with their liquor', '400g minced pork', '4 chorizo', '4 pieces pork belly for chicharrón', '4 eggs', '400g cooked white rice', '2 plantains, sliced', '2 avocados', '4 arepas'],
      steps: ['Score the pork belly skin, salt it, and roast at 200C for 45 minutes until it blisters and crackles.',
              'Simmer the beans with a little of the pork fat until thick.',
              'Brown the mince with onion and cumin. Grill the chorizo.',
              'Fry the plantain slices until dark at the edges. Fry the eggs last.',
              'Everything on one plate, nothing touching if you can manage it, avocado and an arepa on the side.',
              'There is no polite way to serve this and no polite amount of it.'] },
    { name: 'A smaller tray', time: 35, serves: 2, level: 'Easy',
      ingredients: ['Tinned red beans', 'Chorizo', 'Minced pork', 'Egg', 'Rice', 'Plantain', 'Avocado'],
      steps: ['Skip the chicharrón, which is the part that takes the hour.',
              'Everything else as above, on a normal plate.'] }
  ]);

  recipes('Sancocho', [
    { name: 'Bone-in, long', time: 120, serves: 6, level: 'Very easy',
      ingredients: ['1 chicken, jointed', '2 corn cobs, in thirds', '500g cassava, in chunks', '2 plantains, in thick rounds', '3 potatoes', '1 onion', '1 pepper', '4 garlic cloves', 'Coriander stalks', '2.5 litres water'],
      steps: ['Bring the chicken up in the water with the onion, pepper, garlic and coriander stalks. Skim.',
              'Simmer 40 minutes, then add the corn and cassava.',
              'Twenty minutes later, the plantain and potato.',
              'Another 25 minutes until everything is soft and the broth has gone slightly thick from the starch.',
              'Salt properly at the end. Rice, avocado and a wedge of lime on the side.'] },
    { name: 'With what is in the cupboard', time: 70, serves: 4, level: 'Very easy',
      ingredients: ['Chicken thighs', 'Sweet potato', 'Potato', 'Corn', 'Onion', 'Coriander'],
      steps: ['Same idea with whatever roots you have.',
              'It wants a lot of salt and a lot of coriander at the end.'] }
  ]);

  recipes('Pabellón criollo', [
    { name: 'Four stripes', time: 150, serves: 4, level: 'Medium',
      ingredients: ['800g beef flank', '1 onion', '1 red pepper', '4 garlic cloves', '2 tbsp tomato purée', '1 tsp cumin', '400g black beans, cooked', '300g rice', '2 ripe plantains', 'Oil'],
      steps: ['Simmer the flank with half the onion for 90 minutes until it pulls apart. Keep the broth.',
              'Shred the beef along the grain into long threads.',
              'Fry the rest of the onion, the pepper and garlic, add the tomato purée and cumin, then the beef and a ladle of broth. Reduce until barely wet.',
              'Warm the black beans with a little of the same sofrito.',
              'Fry the plantain slices until very dark and sweet.',
              'Four stripes on the plate: rice, beans, beef, plantain. Do not mix them before serving.'] },
    { name: 'With tinned beans and quick beef', time: 40, serves: 3, level: 'Easy',
      ingredients: ['Beef skirt', 'Onion', 'Pepper', 'Tomato purée', 'Tinned black beans', 'Rice', 'Plantain'],
      steps: ['Sear and slice the skirt thin instead of shredding flank.',
              'Everything else the same, and the plantain still has to be nearly black.'] }
  ]);

  recipes('Tequeños', [
    { name: 'Wrapped in a spiral', time: 60, serves: 6, level: 'Medium',
      ingredients: ['300g plain flour', '80g butter, cold and cubed', '1 tsp sugar', '1 tsp salt', '100ml cold water', '400g firm white cheese, in fingers', 'Oil for frying'],
      steps: ['Rub the butter into the flour, sugar and salt, then bring together with the water. Do not knead it much. Rest 30 minutes.',
              'Roll thin and cut into long strips about 2cm wide.',
              'Wrap each cheese finger in a spiral, overlapping slightly, and pinch both ends closed properly. A gap means the cheese escapes.',
              'Freeze for 15 minutes — this is the trick.',
              'Fry at 175C for 3 minutes, turning, until golden and blistered.',
              'Eat hot. Guasacaca or a sweet chilli sauce alongside.'] },
    { name: 'With puff pastry', time: 30, serves: 4, level: 'Very easy',
      ingredients: ['1 sheet puff pastry', 'Halloumi or firm white cheese', 'Oil'],
      steps: ['Cut the pastry into strips and wrap the cheese the same way.',
              'Fry or bake at 200C for 18 minutes. Puffier and less chewy.'] }
  ]);

  recipes('Salteñas', [
    { name: 'With the soup set in jelly', time: 180, serves: 8, level: 'Hard',
      ingredients: ['500g chicken thigh, diced', '2 potatoes, diced small', '1 onion, diced', '3 tbsp aji panca paste', '1 tsp cumin', '400ml chicken stock', '2 tsp gelatine', '500g plain flour', '120g butter', '1 egg', '1 tsp sugar', '180ml warm water', 'Turmeric, for colour'],
      steps: ['Cook the onion, chilli paste and cumin, add the chicken and potato and the stock, and simmer 15 minutes.',
              'Stir the gelatine into the hot liquid, then chill the whole filling overnight until it sets firm. This is the entire secret.',
              'Make a dough with the flour, butter, egg, sugar, turmeric and water. Rest an hour.',
              'Roll discs, put a scoop of the cold set filling in each, and seal with a rope pleat along the top edge.',
              'Chill again for 20 minutes. Bake at 220C for 15 minutes until the pastry sets and colours.',
              'Eat standing, upright, with a bite from the top corner first.'] },
    { name: 'Wetter and easier, in a muffin tin', time: 90, serves: 6, level: 'Medium',
      ingredients: ['Same filling, set', 'Shortcrust pastry', 'Egg for glazing'],
      steps: ['Line a muffin tin with pastry, fill with the set filling, lid on top, sealed.',
              'Bake at 210C for 20 minutes. Less elegant, much less leakage.'] }
  ]);

  recipes('Flan', [
    { name: 'Baked in a water bath', time: 90, serves: 8, level: 'Medium',
      ingredients: ['200g sugar, for the caramel', '3 tbsp water', '500ml whole milk', '1 tin condensed milk', '4 eggs', '2 egg yolks', '1 tsp vanilla'],
      steps: ['Melt the sugar with the water in a dry pan without stirring until it is deep amber. Pour it straight into the mould and swirl.',
              'Warm the milk. Whisk the eggs, yolks, condensed milk and vanilla, then pour the warm milk in slowly while whisking.',
              'Strain it. Twice. This is what makes the texture.',
              'Pour over the set caramel, cover with foil, and bake at 160C in a tin of boiling water for 50 minutes.',
              'It should still wobble in the middle. Chill overnight — not four hours, overnight.',
              'Run a knife round and turn it out. The caramel becomes the sauce.'] },
    { name: 'Small ones, quicker', time: 50, serves: 4, level: 'Easy',
      ingredients: ['Caramel', 'Condensed milk', 'Milk', '3 eggs'],
      steps: ['Same custard in ramekins.',
              '160C in a water bath for 30 minutes. Chill 4 hours.'] }
  ]);

  recipes('Alfajores', [
    { name: 'Cornflour biscuits', time: 90, serves: 12, level: 'Medium',
      ingredients: ['200g cornflour', '150g plain flour', '150g butter, soft', '100g sugar', '3 egg yolks', '1 tsp baking powder', 'Zest of 1 lemon', '300g dulce de leche', 'Desiccated coconut'],
      steps: ['Cream the butter and sugar, beat in the yolks and zest.',
              'Fold in both flours and the baking powder. It will be very soft — chill it for an hour.',
              'Roll to 6mm between sheets of paper and cut small rounds.',
              'Bake at 170C for 9 minutes. They should stay pale. A browned alfajor is an overbaked one.',
              'Cool completely, then sandwich generously with dulce de leche.',
              'Roll the exposed edge in coconut. Keep them a day before eating if you can.'] },
    { name: 'Chocolate-dipped', time: 100, serves: 12, level: 'Medium',
      ingredients: ['Same biscuits', 'Dulce de leche', '200g dark chocolate'],
      steps: ['Sandwich as above, then dip the whole thing in melted chocolate.',
              'Set on paper. The Cordobés version.'] }
  ]);

  recipes('Oxtail stew', [
    { name: 'Browned, then hours', time: 240, serves: 4, level: 'Easy',
      ingredients: ['1.5kg oxtail', '2 tbsp browning sauce or dark soy', '1 onion, chopped', '4 garlic cloves', '1 tbsp allspice', '4 sprigs thyme', '1 scotch bonnet, whole', '2 carrots', '1 tin butter beans', '1 tbsp tomato purée', '1 litre stock'],
      steps: ['Season the oxtail overnight with the garlic, thyme, allspice and browning.',
              'Brown it hard in a heavy pot, in batches, until genuinely dark. Do not crowd it.',
              'Onion and tomato purée in, then the stock, the carrots and the whole scotch bonnet — unpierced.',
              'Lid on, lowest heat, three hours. Check it has liquid every 45 minutes.',
              'Lift the chilli out before it splits. Butter beans in for the last 20 minutes.',
              'Skim the fat. Rice and peas on the side.'] },
    { name: 'Pressure cooker', time: 90, serves: 4, level: 'Very easy',
      ingredients: ['Oxtail', 'Allspice', 'Thyme', 'Onion', 'Scotch bonnet', 'Butter beans', 'Stock'],
      steps: ['Brown properly first — the pressure cooker will not do that for you.',
              '50 minutes at pressure, natural release, beans stirred in after.'] }
  ]);

  recipes('Curry goat', [
    { name: 'Better the next day', time: 180, serves: 6, level: 'Easy',
      ingredients: ['1.5kg goat on the bone, in chunks', '4 tbsp Caribbean curry powder', '1 tbsp allspice', '6 garlic cloves', '2 onions', 'Thyme', '1 scotch bonnet', '3 potatoes', '1 tin coconut milk', 'Oil'],
      steps: ['Rub the goat with half the curry powder, the garlic, thyme and allspice. Leave it overnight.',
              'Burn the rest of the curry powder in hot oil for 30 seconds until it darkens — this is the step that makes it taste like the real thing.',
              'Sear the meat in that oil, then onions, then water to cover and the whole scotch bonnet.',
              'Two hours at a bare simmer, lid ajar.',
              'Potatoes in for the last 30 minutes, coconut milk for the last 10.',
              'Better tomorrow. Genuinely, measurably better.'] },
    { name: 'With lamb shoulder', time: 120, serves: 4, level: 'Very easy',
      ingredients: ['1kg diced lamb shoulder', 'Curry powder', 'Allspice', 'Garlic', 'Thyme', 'Potato', 'Coconut milk'],
      steps: ['Same method, 90 minutes instead of two hours.',
              'Milder, and nobody will be unhappy.'] }
  ]);

  recipes('Rice and peas', [
    { name: 'With kidney beans', time: 50, serves: 6, level: 'Very easy',
      ingredients: ['400g long grain rice', '1 tin kidney beans with the liquid', '1 tin coconut milk', '2 spring onions, bruised', '4 sprigs thyme', '1 whole scotch bonnet', '4 allspice berries', '1 garlic clove', 'Salt'],
      steps: ['Bring the beans, their liquid, the coconut milk, thyme, spring onion, allspice, garlic and the whole chilli to a boil with 300ml water.',
              'Simmer 10 minutes so the liquid takes on everything.',
              'Rinse the rice and stir it in. Taste the liquid — it should be slightly over-salted.',
              'Lid on, lowest heat, 20 minutes. Do not lift the lid.',
              'Off the heat 10 minutes. Lift the chilli and thyme out, fork it through.',
              'If the chilli splits, you will know within one mouthful.'] },
    { name: 'With gungo peas', time: 60, serves: 6, level: 'Very easy',
      ingredients: ['Rice', 'Tin of gungo (pigeon) peas', 'Coconut milk', 'Thyme', 'Spring onion', 'Scotch bonnet'],
      steps: ['Exactly the same. The Christmas version.',
              'Slightly earthier and worth trying at least once.'] }
  ]);

  recipes('Callaloo', [
    { name: 'Cooked down soft', time: 35, serves: 4, level: 'Very easy',
      ingredients: ['500g callaloo or spinach and chard, chopped', '1 onion, sliced', '3 garlic cloves', '4 sprigs thyme', '1 whole scotch bonnet', '200ml coconut milk', '1 tomato, chopped', 'Black pepper', 'Oil'],
      steps: ['Soften the onion and garlic in oil with the thyme.',
              'Tomato in for 3 minutes until it collapses.',
              'Greens in with a splash of water and the whole chilli sat on top. Lid on.',
              'Twenty minutes on low. It should go dark and completely soft — this is not a dish that wants to stay bright green.',
              'Coconut milk in for the last 5 minutes, lots of black pepper, chilli out.'] },
    { name: 'Quicker, with frozen spinach', time: 20, serves: 3, level: 'Very easy',
      ingredients: ['Frozen spinach', 'Onion', 'Garlic', 'Thyme', 'Coconut milk', 'Scotch bonnet'],
      steps: ['Same, straight from frozen.',
              'Cook the water off properly before the coconut milk goes in.'] }
  ]);

  recipes('Escovitch fish', [
    { name: 'Fried whole, dressed hot', time: 40, serves: 2, level: 'Medium',
      ingredients: ['2 whole snapper, scaled and scored', '2 tsp allspice', 'Flour for dusting', 'Oil for frying', '1 carrot, in matchsticks', '1 onion, sliced', '1 pepper, sliced', '1 scotch bonnet, sliced', '150ml white vinegar', '1 tsp sugar', '6 pimento berries'],
      steps: ['Season the fish inside the scores with salt and allspice and leave 20 minutes. Pat dry, dust with flour.',
              'Fry in 2cm of hot oil, 5 minutes a side, until the skin is crisp and the fins snap. Drain on a rack.',
              'Boil the vinegar with the sugar and pimento, then add the carrot, onion and peppers for 2 minutes only. They must stay crunchy.',
              'Pour the whole hot dressing over the fish while both are still hot.',
              'Leave 15 minutes before eating. It is better at room temperature than straight away, and better again tomorrow.'] },
    { name: 'With fillets', time: 25, serves: 2, level: 'Easy',
      ingredients: ['4 white fish fillets', 'Flour', 'Allspice', 'Vinegar', 'Carrot', 'Onion', 'Scotch bonnet'],
      steps: ['Fry skin side down until crisp, 4 minutes, then 1 minute over.',
              'Same vinegar dressing poured over hot.'] }
  ]);

  recipes('Griot', [
    { name: 'Marinated, braised, fried', time: 240, serves: 6, level: 'Medium',
      ingredients: ['1.5kg pork shoulder, in large cubes', '4 limes', '2 bitter oranges or 1 orange plus 1 lime', '1 onion', '6 garlic cloves', '1 scotch bonnet', 'Thyme', '4 cloves', 'Oil for frying'],
      steps: ['Wash the pork in the juice of two limes and drain. Marinate overnight with the citrus, onion, garlic, thyme, cloves and chilli.',
              'Tip the lot into a pot with a splash of water, cover, and braise 90 minutes until tender.',
              'Lift the meat out and let it dry on a rack. Reduce the braising liquid to a few spoonfuls.',
              'Fry the cubes in hot oil until the outsides are dark and crisp, 5 minutes.',
              'Toss in the reduced liquid off the heat. Pikliz and fried plantain alongside.'] },
    { name: 'Oven-finished', time: 200, serves: 4, level: 'Easy',
      ingredients: ['Pork shoulder', 'Citrus', 'Garlic', 'Thyme', 'Scotch bonnet'],
      steps: ['Same marinade and braise.',
              'Finish under a hot grill on a rack, 12 minutes, turning, instead of frying.'] }
  ]);

  recipes('Mofongo', [
    { name: 'In a wooden mortar', time: 40, serves: 4, level: 'Medium',
      ingredients: ['4 green plantains', '150g pork crackling, chopped', '6 garlic cloves', '4 tbsp olive oil', 'Salt', 'Chicken stock, warm'],
      steps: ['Peel the plantains under running water — they fight back — and cut into thick rounds.',
              'Fry them in oil at 165C for 6 minutes until cooked through but pale. They should not brown.',
              'Crush the garlic with the oil and salt in a mortar into a rough paste.',
              'Add the hot plantain a few pieces at a time and pound, working in the crackling as you go.',
              'Splash in warm stock if it stiffens. It should hold together but not be smooth.',
              'Press into a bowl, turn out, and pour more broth around it.'] },
    { name: 'Trifongo, with cassava', time: 50, serves: 4, level: 'Medium',
      ingredients: ['2 green plantains', '1 ripe plantain', '300g cassava, boiled', '6 garlic cloves', '4 tbsp olive oil', 'Pork crackling', 'Warm stock'],
      steps: ['Fry the green plantain as before and boil the cassava until it falls apart.',
              'Pound all three together with the garlic paste — the ripe plantain sweetens it and the cassava makes it smoother.',
              'Same well in the middle, same broth poured round it.'] }
  ]);

  recipes('Arroz con gandules', [
    { name: 'With a proper sofrito', time: 50, serves: 6, level: 'Easy',
      ingredients: ['400g medium grain rice', '1 tin pigeon peas, drained', '100g cured ham or bacon, diced', '4 tbsp sofrito (onion, pepper, garlic, coriander, blitzed)', '2 tbsp tomato purée', '1 tsp dried oregano', '2 sachets sazón or 1 tsp annatto', '700ml stock', '8 olives', 'Oil'],
      steps: ['Render the ham in oil in a heavy pot until it catches.',
              'Sofrito in, and cook it for a full 4 minutes — it should darken and stop smelling raw.',
              'Tomato purée, oregano, annatto, then the peas and olives.',
              'Rice in, stirred to coat in the fat. Stock over, taste for salt.',
              'Boil hard uncovered until the liquid is level with the rice, then lid on, lowest heat, 20 minutes.',
              'Rest 10 minutes. The crust on the bottom — the pegao — is the best part and is not a mistake.'] },
    { name: 'Vegetarian', time: 45, serves: 4, level: 'Very easy',
      ingredients: ['Rice', 'Pigeon peas', 'Sofrito', 'Tomato purée', 'Annatto', 'Vegetable stock', 'Olives'],
      steps: ['Same without the ham, with an extra spoon of sofrito and a little more oil.',
              'Still gets a pegao if the heat is low enough for long enough.'] }
  ]);

  recipes('Ropa vieja', [
    { name: 'Shredded into rags', time: 180, serves: 6, level: 'Easy',
      ingredients: ['1kg beef flank or skirt', '2 onions, sliced', '2 peppers, sliced', '6 garlic cloves', '1 tin chopped tomatoes', '2 tbsp tomato purée', '2 tsp cumin', '1 tsp oregano', '2 bay leaves', '1 tbsp capers', '100g green olives'],
      steps: ['Simmer the beef with one onion, the bay and water to cover for 90 minutes, until it shreds. Keep 400ml of the broth.',
              'Pull the meat apart along the grain with two forks. Long threads, not chunks.',
              'Soften the second onion, the peppers and garlic slowly — 15 minutes, not 5.',
              'Cumin, oregano, tomato purée, tinned tomatoes and the reserved broth. Simmer 20 minutes.',
              'Beef back in with the olives and capers. Another 25 minutes uncovered until it is thick and glossy.',
              'Rice, black beans and fried plantain.'] },
    { name: 'Slow cooker', time: 480, serves: 6, level: 'Very easy',
      ingredients: ['Beef skirt', 'Onion', 'Peppers', 'Tinned tomatoes', 'Cumin', 'Olives'],
      steps: ['Everything in raw, on low, 8 hours.',
              'Shred in the pot at the end and reduce on the hob for 15 minutes if it is loose.'] }
  ]);

  recipes('Thieboudienne', [
    { name: 'Fish, rice, vegetables, in that order', time: 120, serves: 6, level: 'Hard',
      ingredients: ['1kg firm fish steaks', '1 bunch parsley', '6 garlic cloves', '1 scotch bonnet', '500g broken rice', '4 tbsp tomato purée', '1 tin chopped tomatoes', '2 onions', '1 cassava, in chunks', '2 carrots', '1 small cabbage, in wedges', '1 aubergine', 'Oil', 'Dried fish or fish stock'],
      steps: ['Blitz the parsley, garlic and chilli into a paste and stuff it into slits cut in the fish.',
              'Fry the fish briefly on both sides and lift out.',
              'In the same oil, cook the onion and tomato purée hard for 10 minutes until it darkens — this is where the colour comes from.',
              'Tinned tomatoes and 2 litres water. Add the vegetables in order of how long they take: cassava and carrot first, cabbage and aubergine later.',
              'Fish back in for the last 10 minutes. Lift everything out onto a platter.',
              'Cook the rinsed rice in the remaining broth, covered, 25 minutes, until it drinks all of it. Rice on the dish, fish and vegetables on top.'] },
    { name: 'One pot, fewer vegetables', time: 70, serves: 4, level: 'Medium',
      ingredients: ['White fish fillets', 'Rice', 'Tomato purée', 'Onion', 'Carrot', 'Cabbage', 'Fish stock'],
      steps: ['Same order, half the vegetables.',
              'The rice still has to cook in the broth. That is the dish.'] }
  ]);

  recipes('Yassa', [
    { name: 'Under a mountain of onions', time: 90, serves: 4, level: 'Very easy',
      ingredients: ['8 chicken thighs', '6 large onions, sliced thin', '6 lemons, juiced', '3 tbsp Dijon mustard', '4 garlic cloves', '2 bay leaves', '1 scotch bonnet', '2 tbsp oil', 'Salt and pepper'],
      steps: ['Marinate the chicken and the sliced onion together in the lemon juice, mustard, garlic and seasoning. Four hours minimum, overnight if you can.',
              'Lift the chicken out, wipe it, and brown it hard in oil. Set aside.',
              'Tip all the onion and marinade into the pan and cook it down for 30 minutes, stirring, until it goes soft and sweet and loses the raw lemon edge.',
              'Chicken back in with the bay and the whole chilli, lid on, 25 minutes.',
              'Taste. It should be sharp, sweet and savoury at once. Over rice.'] },
    { name: 'Grilled first, for the char', time: 100, serves: 4, level: 'Easy',
      ingredients: ['Chicken thighs', 'Onions', 'Lemon', 'Dijon mustard', 'Garlic', 'Bay'],
      steps: ['Marinate as above, then grill the chicken over coals or under a hot grill until charred rather than browning it in a pan.',
              'Cook the onions down separately for 30 minutes, then bring the two together for 15.',
              'The smoke is the difference, and it is a large one.'] }
  ]);

  recipes('Maafe', [
    { name: 'Groundnut stew', time: 110, serves: 6, level: 'Very easy',
      ingredients: ['800g lamb or beef, in chunks', '200g smooth peanut butter', '2 onions', '4 tbsp tomato purée', '1 tin chopped tomatoes', '2 sweet potatoes', '1 carrot', '1 small cabbage wedge', '1 scotch bonnet', '1 litre stock', 'Oil'],
      steps: ['Brown the meat hard and set it aside.',
              'Onions and tomato purée in the same pot for 8 minutes until dark.',
              'Loosen the peanut butter with a ladle of hot stock into a smooth paste, then stir it in — adding it straight from the jar makes it seize.',
              'Meat back in with the rest of the stock, tinned tomatoes and the whole chilli. Simmer 50 minutes.',
              'Sweet potato and carrot in for 25 minutes, cabbage for the last 10.',
              'It is ready when a layer of red oil sits on the surface. Over rice.'] },
    { name: 'Vegetarian, with more roots', time: 55, serves: 4, level: 'Very easy',
      ingredients: ['Peanut butter', 'Onion', 'Tomato purée', 'Sweet potato', 'Carrot', 'Cabbage', 'Chickpeas', 'Stock'],
      steps: ['Same base, chickpeas in place of the meat.',
              'Loosen the peanut butter first, always.'] }
  ]);

  recipes('Waakye', [
    { name: 'With sorghum leaves', time: 70, serves: 6, level: 'Easy',
      ingredients: ['200g black-eyed beans, soaked', '400g long grain rice', '6 dried sorghum leaves', '0.5 tsp bicarbonate of soda', 'Salt', 'Oil'],
      steps: ['Boil the beans with the sorghum leaves and the bicarbonate in plenty of water for 40 minutes. The water will turn deep red-brown.',
              'Fish the leaves out. The beans should be nearly tender.',
              'Add the rinsed rice and enough of the coloured water to sit 2cm above it. Salt.',
              'Boil until the water is level with the rice, then lid on, lowest heat, 20 minutes.',
              'Rest 10 minutes and fork through. Shito, gari and a boiled egg on the side make it the real thing.'] },
    { name: 'Without the leaves', time: 60, serves: 4, level: 'Very easy',
      ingredients: ['Black-eyed beans', 'Rice', 'Salt'],
      steps: ['Same method with plain water. It will be brown rather than red.',
              'Tastes close. Looks wrong to anybody who grew up with it.'] }
  ]);

  recipes('Kelewele', [
    { name: 'Ginger and chilli', time: 25, serves: 4, level: 'Very easy',
      ingredients: ['3 very ripe plantains', '1 thumb ginger, grated', '1 tsp cayenne', '0.5 tsp aniseed or fennel, crushed', '1 tsp salt', '2 tbsp water', 'Oil for frying', 'Roasted peanuts'],
      steps: ['The plantains must be properly black-skinned. Yellow ones will not work.',
              'Cube them and toss with the ginger, cayenne, aniseed, salt and water. Leave 10 minutes.',
              'Fry in 2cm of oil at 175C, in batches, for 3 minutes until dark at the edges.',
              'Drain on paper and salt again while hot.',
              'Peanuts alongside. Best eaten out of a paper bag.'] },
    { name: 'Air fried', time: 25, serves: 3, level: 'Very easy',
      ingredients: ['Ripe plantains', 'Ginger', 'Cayenne', 'Oil spray'],
      steps: ['Same spicing, sprayed well with oil.',
              '200C for 14 minutes, shaking twice. Less good and much less oil.'] }
  ]);

  recipes('Moi moi', [
    { name: 'Steamed in leaves or tins', time: 90, serves: 6, level: 'Medium',
      ingredients: ['400g black-eyed beans, soaked and peeled', '1 red onion', '2 red peppers', '1 scotch bonnet', '100ml oil', '1 tsp ground crayfish, optional', '2 hard-boiled eggs, sliced', '300ml warm water', 'Salt'],
      steps: ['Rub the soaked beans between your palms under water until the skins float off. Keep rinsing until they are all gone. This takes 15 minutes and there is no shortcut.',
              'Blitz the peeled beans with the onion, peppers, chilli and just enough water to move the blades. It should be thick, not runny.',
              'Beat in the oil and salt. Beat it for longer than feels necessary — air is what makes it light.',
              'Pour into greased ramekins or foil parcels, pushing a slice of egg into each.',
              'Steam, covered, for 50 minutes. Test with a skewer: clean means done.',
              'Turn out. It should be firm enough to slice and soft enough to spoon.'] },
    { name: 'With tinned beans', time: 50, serves: 4, level: 'Easy',
      ingredients: ['2 tins black-eyed beans, drained and rinsed', 'Onion', 'Red pepper', 'Oil', 'Egg'],
      steps: ['The skins are already off, which saves the worst part.',
              'Blitz, beat, steam 40 minutes. Slightly denser.'] }
  ]);

  recipes('Kitfo', [
    { name: 'Warmed, not cooked', time: 25, serves: 3, level: 'Medium',
      ingredients: ['500g very fresh lean beef, minced twice or hand-chopped', '80g niter kibbeh (spiced clarified butter)', '2 tbsp mitmita', '0.5 tsp ground cardamom', 'Salt', '200g ayib or cottage cheese', 'Cooked greens', 'Injera'],
      steps: ['Buy the beef from somebody you trust and use it the day you buy it. This matters more than anything else here.',
              'Melt the niter kibbeh gently until warm, not hot.',
              'Work the mitmita, cardamom and salt into the meat with your hands.',
              'Pour the warm butter over and mix until the meat is glossy and barely warmed through — it should still be red.',
              'Serve at once with the cheese and greens beside it, and injera underneath.',
              'Ask for it leb leb if you want it briefly warmed in the pan instead.'] },
    { name: 'Cooked through', time: 25, serves: 3, level: 'Very easy',
      ingredients: ['Minced beef', 'Niter kibbeh', 'Mitmita', 'Cardamom', 'Cottage cheese'],
      steps: ['Fry the mince in the spiced butter until just cooked.',
              'A different dish and a perfectly good one.'] }
  ]);

  recipes('Tibs', [
    { name: 'Hard and fast', time: 25, serves: 3, level: 'Very easy',
      ingredients: ['600g lamb leg, in small cubes', '3 tbsp niter kibbeh or butter', '1 red onion, in thick wedges', '2 green chillies, split', '1 tbsp rosemary, chopped', '3 garlic cloves', '1 tsp berbere', 'Salt', 'Injera or flatbread'],
      steps: ['Get a heavy pan extremely hot. Melt the spiced butter in it.',
              'Lamb in, in one layer, and left alone for 2 minutes to catch properly.',
              'Onion, garlic, rosemary and chilli in. Toss hard for 3 minutes — the onion should still have bite.',
              'Berbere and salt at the end, off the heat, or it burns.',
              'To the table in the pan, still spitting. Bread to pick it up with.'] },
    { name: 'With beef and a bit of sauce', time: 30, serves: 3, level: 'Very easy',
      ingredients: ['Beef sirloin', 'Butter', 'Onion', 'Tomato', 'Berbere', 'Rosemary'],
      steps: ['Same method, plus a chopped tomato at the end.',
              'Makes enough sauce to matter without turning it into a stew.'] }
  ]);

  recipes('Nyama choma', [
    { name: 'Over charcoal, salt only', time: 120, serves: 6, level: 'Easy',
      ingredients: ['2kg goat ribs and leg, on the bone', 'Coarse salt', '2 tomatoes', '1 red onion', '1 chilli', '1 lime', 'Coriander'],
      steps: ['Salt the meat heavily and leave it an hour at room temperature. That is the entire seasoning.',
              'Build a charcoal fire and let it settle to a low, even heat. High heat is the usual mistake.',
              'Meat on, well above the coals, turning every 10 minutes. It wants 60 to 90 minutes.',
              'It is done when the outside is dry and dark and a knife meets no resistance.',
              'Chop the tomato, onion, chilli and coriander with lime and salt for the kachumbari.',
              'Cut the meat up on a board with a cleaver. Eat with your hands, kachumbari and ugali alongside.'] },
    { name: 'Oven then grill', time: 150, serves: 4, level: 'Very easy',
      ingredients: ['Goat or lamb on the bone', 'Coarse salt', 'Kachumbari ingredients'],
      steps: ['Salted, wrapped in foil, 150C for 2 hours.',
              'Unwrap and finish under the hottest grill for 12 minutes to dry the outside.'] }
  ]);

  recipes('Ugali and sukuma wiki', [
    { name: 'Stiff, and greens beside it', time: 30, serves: 4, level: 'Easy',
      ingredients: ['400g white maize flour', '1 litre water', '1 large bunch collard greens or kale, shredded', '1 onion, sliced', '2 tomatoes, chopped', '2 tbsp oil', 'Salt'],
      steps: ['Bring the water to a boil with a pinch of salt. Rain in about a third of the flour, whisking, and let it thicken for 3 minutes.',
              'Add the rest a handful at a time, working it against the side of the pan with a wooden spoon.',
              'Keep folding and pressing for 8 minutes. It is ready when it pulls away from the pan cleanly in one mass.',
              'Turn it out onto a plate and shape it into a dome with a wet bowl.',
              'For the greens: soften the onion, add the tomato and cook it down, then the greens with a splash of water. 8 minutes, covered. Salt at the end.',
              'Tear a piece of ugali, press a dent in it, scoop.'] },
    { name: 'Softer, if you are new to it', time: 25, serves: 3, level: 'Very easy',
      ingredients: ['Maize flour', 'Water', 'Greens', 'Onion', 'Tomato'],
      steps: ['Use a little more water for a softer ugali.',
              'Easier to make and easier to eat, though nobody in Nairobi would serve it.'] }
  ]);

  recipes('Harira', [
    { name: 'Thickened with tadouira', time: 75, serves: 6, level: 'Medium',
      ingredients: ['150g brown lentils', '1 tin chickpeas', '2 onions, grated', '3 celery sticks, chopped fine', '1 tin chopped tomatoes', '2 tbsp tomato purée', '1 tsp turmeric', '1 tsp ginger', '1 tsp cinnamon', 'Large bunch coriander and parsley', '3 tbsp plain flour', '100ml water', 'Lemon', 'Dates, to serve'],
      steps: ['Soften the onion and celery in oil with all the spices for 8 minutes.',
              'Tomatoes, purée, lentils and 1.5 litres water. Simmer 35 minutes.',
              'Chickpeas and most of the herbs in. Another 15 minutes.',
              'Whisk the flour into the cold water until completely smooth — this is the tadouira.',
              'Pour it into the simmering soup in a thin stream, stirring the whole time, and cook 10 minutes more until it turns velvety.',
              'Lemon juice and the rest of the herbs at the end. A date on the side, which is not optional in Ramadan and is a good idea anyway.'] },
    { name: 'Without the flour', time: 50, serves: 4, level: 'Very easy',
      ingredients: ['Lentils', 'Chickpeas', 'Tomato', 'Celery', 'Onion', 'Turmeric', 'Coriander', 'Lemon'],
      steps: ['Same soup, unthickened.',
              'Blitz a ladleful and stir it back in if you want body without the flour.'] }
  ]);

  recipes('Zaalouk', [
    { name: 'Cooked down to a paste', time: 45, serves: 4, level: 'Very easy',
      ingredients: ['2 aubergines', '4 tomatoes, grated', '4 garlic cloves, crushed', '1 tsp paprika', '1 tsp cumin', '0.5 tsp cayenne', '4 tbsp olive oil', 'Large bunch coriander', 'Lemon', 'Bread'],
      steps: ['Char the aubergines whole over a flame or under a hot grill until the skins blacken and they collapse. Twenty minutes.',
              'Scrape the flesh out and chop it roughly.',
              'Cook the grated tomato with the garlic, spices and oil for 12 minutes until it darkens and thickens.',
              'Aubergine in, and cook another 15 minutes, mashing with a fork, until almost no liquid is left.',
              'Coriander and lemon off the heat. Better at room temperature, better again the next day, and eaten with bread rather than a fork.'] },
    { name: 'Roasted, hands off', time: 55, serves: 4, level: 'Very easy',
      ingredients: ['Aubergines', 'Tomatoes', 'Garlic', 'Cumin', 'Paprika', 'Olive oil', 'Coriander'],
      steps: ['Roast cubed aubergine at 220C for 30 minutes instead of charring.',
              'Then into the tomato base for 10 minutes. Less smoky, no less good.'] }
  ]);

  recipes('Malva pudding', [
    { name: 'Drowned straight from the oven', time: 60, serves: 8, level: 'Easy',
      ingredients: ['200g sugar', '2 eggs', '2 tbsp apricot jam', '150g plain flour', '1 tsp bicarbonate of soda', '1 tbsp butter', '1 tsp vinegar', '150ml milk', 'For the sauce: 250ml cream, 100g butter, 100g sugar, 3 tbsp water'],
      steps: ['Beat the sugar and eggs until pale, then beat in the jam.',
              'Melt the butter with the vinegar and add it with the milk, alternating with the flour and bicarbonate.',
              'Into a greased dish, 180C for 35 minutes until dark and risen.',
              'While it bakes, bring all the sauce ingredients to a boil together.',
              'The moment the pudding comes out, pour every drop of the hot sauce over it. It will look like far too much.',
              'Leave 10 minutes to drink it. Serve with cream or custard, which is excessive and correct.'] },
    { name: 'Individual ones', time: 45, serves: 6, level: 'Easy',
      ingredients: ['Same batter', 'Same sauce'],
      steps: ['Into ramekins, 180C for 20 minutes.',
              'Sauce over each while hot. They soak faster than the big one.'] }
  ]);


  /* ---- the ninth intake: the last of the gaps ---------------------- */

  recipes('Currywurst', [
    { name: 'Berlin style', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['4 bratwurst', '200ml passata', '3 tbsp tomato purée', '2 tbsp curry powder', '1 tbsp paprika', '1 tbsp white wine vinegar', '1 tbsp sugar', '1 tsp onion powder', 'More curry powder, to dust'],
      steps: ['Simmer the passata, purée, half the curry powder, paprika, vinegar and sugar for 10 minutes until thick and glossy.',
              'Fry or grill the sausages until the skins split and blister.',
              'Slice them into rounds on the plate — in Berlin, skinless; in the Ruhr, with skin.',
              'Sauce over, then a heavy dusting of raw curry powder on top. That last dusting is the dish.',
              'Chips on the side, wooden fork, standing up.'] },
    { name: 'From a jar of ketchup', time: 12, serves: 2, level: 'Very easy',
      ingredients: ['4 sausages', '6 tbsp ketchup', '2 tbsp curry powder', '1 tsp paprika', 'Splash of vinegar'],
      steps: ['Warm the ketchup with the spices and vinegar for 3 minutes.',
              'Over sliced fried sausage, more curry powder on top.'] }
  ]);

  recipes('Rösti', [
    { name: 'One big one', time: 35, serves: 2, level: 'Medium',
      ingredients: ['800g waxy potatoes', '40g butter', '1 tbsp oil', 'Salt', 'Black pepper'],
      steps: ['Parboil the potatoes whole for 8 minutes, then cool them completely — ideally overnight in the fridge.',
              'Peel and grate on the coarse side. Do not rinse; the starch is the glue.',
              'Season and press into a hot pan with the butter and oil, flattening into an even disc.',
              'Medium heat, 12 minutes, without touching it. Shake the pan — it should move as one piece.',
              'Slide it onto a plate, invert the pan over it, and flip. Another 10 minutes.',
              'Cut in wedges. A fried egg on top is not traditional and is a good idea.'] },
    { name: 'Small ones, from raw', time: 25, serves: 2, level: 'Easy',
      ingredients: ['Potatoes', 'Butter', 'Salt'],
      steps: ['Grate raw and squeeze out as much water as you can in a tea towel.',
              'Small mounds in butter, 5 minutes a side, pressed flat.'] }
  ]);

  recipes('Fondue', [
    { name: 'Moitié-moitié', time: 25, serves: 4, level: 'Easy',
      ingredients: ['400g Gruyère, grated', '400g Vacherin or Emmental, grated', '1 garlic clove', '300ml dry white wine', '1 tbsp cornflour', '1 tbsp kirsch', 'Nutmeg', 'Black pepper', '2 crusty loaves, in cubes'],
      steps: ['Rub the inside of the pot hard with the cut garlic clove, then leave it in.',
              'Warm the wine until it steams. Never let it boil.',
              'Add the cheese a large handful at a time, stirring in a figure of eight, and wait for each to melt before the next.',
              'Mix the cornflour with the kirsch and stir it in. It will tighten and go glossy.',
              'Nutmeg and pepper. Move to the burner, keep it at the barest bubble.',
              'Stir every time you dip, scraping the bottom. The crust that forms at the end is the best part of the evening.'] },
    { name: 'Smaller, for two', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['400g Gruyère and Emmental', '150ml white wine', 'Garlic', 'Cornflour', 'Bread'],
      steps: ['Half quantities, same method.',
              'A splash more wine if it seizes; a little more cornflour if it splits.'] }
  ]);

  recipes('Cassoulet', [
    { name: 'Over two days', time: 300, serves: 8, level: 'Hard',
      ingredients: ['600g dried white beans, soaked overnight', '4 duck legs confit', '400g pork belly, in chunks', '4 Toulouse sausages', '200g pork rind', '1 onion studded with cloves', '4 garlic cloves', '2 carrots', '1 bouquet garni', '2 tbsp tomato purée'],
      steps: ['Simmer the beans with the rind, studded onion, carrot and bouquet garni for 90 minutes. Season late.',
              'Brown the pork belly and sausages. Warm the duck legs to release their fat and lift them out.',
              'Layer in a deep dish: beans, meats, beans, with the tomato purée stirred into the bean liquor and poured over to just cover.',
              '150C for two and a half hours.',
              'Every 30 minutes, break the crust that has formed on top and push it under. Seven times is the number people argue about.',
              'Rest it overnight and reheat the next day. It is better, and that is not folklore.'] },
    { name: 'One afternoon, tinned beans', time: 120, serves: 6, level: 'Easy',
      ingredients: ['3 tins haricot beans', 'Duck legs', 'Pork belly', 'Toulouse sausages', 'Onion', 'Garlic', 'Thyme', 'Stock'],
      steps: ['Brown the meats, layer with the drained beans and stock to just cover.',
              '160C for 90 minutes, breaking the crust three times.'] }
  ]);

  recipes('Tartiflette', [
    { name: 'With a whole reblochon', time: 70, serves: 4, level: 'Very easy',
      ingredients: ['1kg waxy potatoes', '200g lardons or thick bacon', '2 onions, sliced', '1 whole reblochon', '100ml white wine', '2 tbsp crème fraîche', 'Black pepper'],
      steps: ['Boil the potatoes whole until just done, cool, then peel and slice thick.',
              'Fry the lardons until the fat runs, add the onions and cook until soft and gold.',
              'Wine in, and let it almost disappear.',
              'Layer potato, bacon and onion in a dish, with the crème fraîche dotted through and a lot of pepper.',
              'Cut the reblochon in half through its middle and lay both halves rind-up on top.',
              '200C for 25 minutes until the top is brown and the middle is liquid.'] },
    { name: 'With camembert', time: 60, serves: 4, level: 'Very easy',
      ingredients: ['Potatoes', 'Bacon', 'Onion', '1 camembert', 'Crème fraîche'],
      steps: ['Same, with a camembert split in half.',
              'Not tartiflette and nobody at the table will complain.'] }
  ]);

  recipes('Bitterballen', [
    { name: 'From a set ragout', time: 180, serves: 6, level: 'Medium',
      ingredients: ['400g cooked beef, shredded very fine', '60g butter', '60g plain flour', '500ml strong beef stock', '2 tbsp chopped parsley', '1 tsp nutmeg', '2 eggs, beaten', '150g breadcrumbs', 'Oil for frying', 'Mustard, to serve'],
      steps: ['Make a thick roux with the butter and flour and cook it 2 minutes.',
              'Add the stock a ladle at a time, whisking, until it is very thick — far thicker than a sauce.',
              'Stir in the beef, parsley and nutmeg, season hard, and spread it in a tray.',
              'Refrigerate at least 3 hours, until you can cut it into cubes that hold.',
              'Roll into balls, then flour, egg, breadcrumbs, then egg and breadcrumbs AGAIN. The double coat is what stops them bursting.',
              'Fry at 180C for 3 minutes. Mustard, and a warning about the temperature.'] },
    { name: 'Smaller, with leftover stew', time: 150, serves: 4, level: 'Easy',
      ingredients: ['Leftover beef stew, shredded', 'Butter', 'Flour', 'Stock', 'Egg', 'Breadcrumbs'],
      steps: ['Thicken the stew with a roux until it sets solid when cold.',
              'Same double crumb, same fry.'] }
  ]);

  recipes('Stamppot', [
    { name: 'Boerenkool, with kale', time: 40, serves: 4, level: 'Very easy',
      ingredients: ['1.2kg floury potatoes', '400g curly kale, shredded fine', '4 smoked sausages', '100ml milk', '60g butter', 'Mustard', 'Salt and pepper'],
      steps: ['Boil the potatoes. For the last 6 minutes, pile the kale on top of them and put the lid on.',
              'Sit the sausages on top of the kale to warm through at the same time. One pan, three jobs.',
              'Lift the sausages out. Drain, then mash the potato and kale together with the warm milk and butter.',
              'It should be rough rather than smooth, and green all the way through.',
              'A well in the middle of each plate, gravy or mustard in it, sausage on top.'] },
    { name: 'Hutspot, with carrot and onion', time: 40, serves: 4, level: 'Very easy',
      ingredients: ['Potatoes', 'Carrots', 'Onions', 'Butter', 'Milk', 'Smoked sausage'],
      steps: ['Boil the potato, carrot and onion together, then mash.',
              'Sweeter, older, and the one with a siege story attached.'] }
  ]);

  recipes('Pelmeni', [
    { name: 'Made and frozen', time: 120, serves: 6, level: 'Medium',
      ingredients: ['500g plain flour', '220ml water', '1 tsp salt', '300g minced pork', '300g minced beef', '1 onion, grated', '100ml iced water', 'Black pepper', 'Soured cream', 'Butter', 'Dill'],
      steps: ['Make a firm dough with the flour, water and salt. Knead 10 minutes, rest 40.',
              'Mix both minces with the grated onion, plenty of pepper and the iced water. The water is what keeps them juicy.',
              'Roll the dough very thin and cut small circles. Fill, fold into half moons, then bring the two corners together and pinch.',
              'Freeze them on a tray at this point — they cook better from frozen and this is how everyone actually does it.',
              'Boil in salted water. They rise; give them 3 minutes after that.',
              'Drain, toss in butter, soured cream and dill on top. Black pepper and vinegar if you grew up with it.'] },
    { name: 'Fried afterwards', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['Frozen pelmeni', 'Butter', 'Onion', 'Soured cream'],
      steps: ['Boil, drain well, then fry in butter with onion until the edges crisp.',
              'The best thing to do with leftovers, and arguably better than the original.'] }
  ]);

  recipes('Blini', [
    { name: 'Buckwheat, yeasted', time: 120, serves: 6, level: 'Medium',
      ingredients: ['150g buckwheat flour', '100g plain flour', '1 tsp instant yeast', '400ml warm milk', '2 eggs, separated', '1 tsp sugar', '1 tsp salt', '30g melted butter', 'Soured cream and dill, to serve'],
      steps: ['Whisk the yeast, sugar and warm milk into both flours and leave, covered, for an hour until bubbling.',
              'Beat in the yolks, salt and melted butter.',
              'Whisk the whites to soft peaks and fold them in last. The batter should be loose and full of air.',
              'Cook small rounds in a buttered pan over medium heat, 90 seconds a side.',
              'Stack under a cloth. Soured cream and dill, or whatever you are celebrating with.'] },
    { name: 'Unyeasted, in twenty minutes', time: 20, serves: 4, level: 'Very easy',
      ingredients: ['Buckwheat and plain flour', 'Milk', '2 eggs', 'Baking powder', 'Butter'],
      steps: ['Whisk everything with a teaspoon of baking powder and rest it 10 minutes.',
              'Same small rounds. Flatter, and fine.'] }
  ]);

  recipes('Olivier salad', [
    { name: 'The New Year one', time: 45, serves: 6, level: 'Very easy',
      ingredients: ['4 potatoes', '3 carrots', '4 eggs', '2 chicken breasts, poached', '6 pickled cucumbers', '200g peas', '250g mayonnaise', '1 tsp mustard', 'Dill', 'Salt and pepper'],
      steps: ['Boil the potatoes and carrots whole, and hard-boil the eggs. Cool everything completely.',
              'Dice everything to the same size — about 7mm. This is the entire craft of the dish and it is worth doing properly.',
              'Fold together with the peas, mayonnaise, mustard and a lot of black pepper.',
              'An hour in the fridge before serving, minimum. It needs to settle.',
              'Dill on top. It will be better tomorrow and gone by then.'] },
    { name: 'Lighter, with less dressing', time: 40, serves: 4, level: 'Very easy',
      ingredients: ['Potato', 'Carrot', 'Eggs', 'Pickles', 'Peas', '4 tbsp mayonnaise', '2 tsp mustard', 'Lemon juice', 'Dill'],
      steps: ['Same dice, same chilling, a third of the dressing.',
              'Loosen it with lemon and a spoon of the pickle brine instead. Sharper, and purists will tell you so.'] }
  ]);

  recipes('Lángos', [
    { name: 'With potato in the dough', time: 120, serves: 4, level: 'Medium',
      ingredients: ['300g strong flour', '1 boiled potato, riced', '7g instant yeast', '200ml warm milk', '1 tsp sugar', '1 tsp salt', 'Oil for frying', '3 garlic cloves', '200ml soured cream', '150g grated cheese'],
      steps: ['Mix the flour, riced potato, yeast, milk, sugar and salt into a soft, sticky dough. Knead 8 minutes.',
              'Prove until doubled, about an hour.',
              'Divide into four and stretch each by hand into a rough disc, thinner in the middle. Do not roll it.',
              'Fry in 3cm of oil at 180C, 90 seconds a side, until deep gold and puffed.',
              'Crush the garlic with a little salt and water and rub it straight onto the hot surface.',
              'Soured cream and a great deal of cheese. Eat immediately, with both hands.'] },
    { name: 'No potato, quicker prove', time: 75, serves: 3, level: 'Easy',
      ingredients: ['Flour', 'Yeast', 'Warm water', 'Salt', 'Oil', 'Garlic', 'Soured cream', 'Cheese'],
      steps: ['Straight dough, 40 minutes prove in a warm place.',
              'Slightly less tender. Same garlic, same excess.'] }
  ]);

  recipes('Ćevapi', [
    { name: 'Ten to a portion', time: 90, serves: 4, level: 'Easy',
      ingredients: ['500g minced beef', '300g minced lamb', '1 tsp bicarbonate of soda', '4 garlic cloves, crushed', '1 tsp paprika', '2 tsp salt', '100ml sparkling water', 'Somun or pitta bread', '1 large onion, chopped raw', 'Ajvar and kajmak, to serve'],
      steps: ['Mix the minces with the bicarbonate, garlic, paprika and salt, then work in the sparkling water.',
              'Knead it hard for 5 minutes until it turns pale and tacky, then rest it in the fridge overnight. The bicarbonate and the wait are what make the texture.',
              'Roll finger-length sausages, about as thick as your thumb.',
              'Grill over high heat, 3 minutes a side, until well marked.',
              'Into the bread, which should be split and warmed over the grill so it takes on the fat.',
              'Raw onion, ajvar, and no cutlery.'] },
    { name: 'Same day', time: 30, serves: 3, level: 'Very easy',
      ingredients: ['Minced beef and lamb', 'Garlic', 'Paprika', 'Sparkling water', 'Pitta', 'Onion'],
      steps: ['Skip the overnight rest and knead for longer.',
              'Looser, still good, slightly more likely to fall through the grill.'] }
  ]);

  recipes('Welsh rarebit', [
    { name: 'The proper paste', time: 20, serves: 2, level: 'Easy',
      ingredients: ['200g mature cheddar, grated', '25g butter', '25g plain flour', '100ml dark beer', '1 tbsp Worcestershire sauce', '2 tsp English mustard', '1 egg yolk', 'Black pepper', '4 thick slices bread'],
      steps: ['Melt the butter, stir in the flour and cook 1 minute, then whisk in the beer until smooth and thick.',
              'Cheese in off the heat, a handful at a time, then the mustard, Worcestershire and pepper.',
              'Beat in the yolk last. Cool it until it is spreadable — this is the difference between rarebit and cheese on toast.',
              'Toast the bread on one side only, under the grill.',
              'Spread the paste thickly right to the edges on the untoasted side.',
              'Back under the hottest grill until it blisters and goes brown in patches.'] },
    { name: 'Buck rarebit', time: 25, serves: 2, level: 'Easy',
      ingredients: ['Same paste', 'Bread', '2 eggs'],
      steps: ['Same rarebit, with a poached egg on top of each.',
              'That is the whole difference and it is worth the name change.'] }
  ]);

  recipes('Scotch egg', [
    { name: 'With a soft yolk', time: 50, serves: 4, level: 'Medium',
      ingredients: ['5 eggs', '400g sausagemeat', '1 tsp dried sage', '1 tsp mustard powder', '3 tbsp plain flour', '120g panko', 'Oil for frying', 'Salt and pepper'],
      steps: ['Boil four eggs for exactly 6 minutes 30 seconds, then straight into iced water. Peel carefully.',
              'Mix the sausagemeat with the sage, mustard powder and plenty of seasoning.',
              'Flatten a quarter of it on cling film, sit an egg in the middle, and use the film to wrap it round. Seal every seam.',
              'Flour, then the fifth egg beaten, then panko.',
              'Fry at 165C for 6 minutes, turning. Any hotter and the crumb burns before the meat cooks.',
              'Rest 5 minutes. Cut with a serrated knife, in one stroke.'] },
    { name: 'Baked', time: 45, serves: 4, level: 'Easy',
      ingredients: ['Eggs', 'Sausagemeat', 'Panko', 'Flour', 'Oil spray'],
      steps: ['Toast the panko in a dry pan first, or it stays pale.',
              '200C for 25 minutes. Less crisp, much less oil, and the yolk survives better.'] }
  ]);

  recipes('Chole bhature', [
    { name: 'Black chickpeas, fried bread', time: 180, serves: 4, level: 'Medium',
      ingredients: ['300g dried chickpeas, soaked overnight', '2 black tea bags', '2 onions, blitzed', '3 tomatoes, blitzed', '2 tbsp ginger-garlic paste', '2 tbsp chole masala', '1 tsp amchur', '300g plain flour', '3 tbsp yoghurt', '1 tsp semolina', '0.5 tsp baking powder', 'Oil for frying'],
      steps: ['Pressure cook the chickpeas with the tea bags — that is what turns them dark. Forty minutes, or two hours in a pot.',
              'Fry the onion paste until properly brown, then the ginger-garlic, then the tomato, until the oil separates out.',
              'Chole masala and amchur in, then the chickpeas with a ladle of their cooking water. Simmer 25 minutes, mashing a few against the side.',
              'For the bhature: mix the flour, yoghurt, semolina and baking powder into a soft dough and rest it 2 hours.',
              'Roll ovals and slide into hot oil, pressing them under with a spoon until they balloon. Thirty seconds a side.',
              'Serve the moment the bread comes out. It deflates within a minute and that is fine.'] },
    { name: 'Tinned chickpeas, shop naan', time: 40, serves: 3, level: 'Very easy',
      ingredients: ['2 tins chickpeas', 'Onion', 'Tomato', 'Chole masala', 'Ginger-garlic paste', 'Naan'],
      steps: ['Same masala base, 20 minutes with the chickpeas.',
              'A black tea bag in the pot gets some of the colour back.'] }
  ]);

  recipes('Paneer tikka', [
    { name: 'Off a skewer', time: 60, serves: 4, level: 'Easy',
      ingredients: ['400g paneer, in large cubes', '200g thick yoghurt', '2 tbsp gram flour', '1 tbsp ginger-garlic paste', '1 tbsp kashmiri chilli powder', '1 tsp garam masala', '1 tsp kasuri methi', '1 tbsp lemon juice', '1 pepper and 1 onion, in squares', 'Oil'],
      steps: ['Toast the gram flour in a dry pan for 2 minutes — raw, it tastes of nothing good.',
              'Whisk it into the yoghurt with all the spices, lemon and salt. It should be thick enough to cling.',
              'Fold the paneer and vegetables through gently and leave 30 minutes. Longer and the paneer goes rubbery.',
              'Thread onto skewers, alternating.',
              'Hottest grill or a very hot griddle, 10 minutes, turning, until the edges char in places.',
              'Lemon and raw onion. Chutney on the side.'] },
    { name: 'In the oven, no skewers', time: 50, serves: 3, level: 'Very easy',
      ingredients: ['Paneer', 'Yoghurt', 'Gram flour', 'Chilli powder', 'Garam masala', 'Peppers'],
      steps: ['Same marinade, spread on a tray.',
              '230C for 15 minutes, then 3 minutes under the grill for the char.'] }
  ]);

  recipes('Vindaloo', [
    { name: 'Goan, with vinegar', time: 150, serves: 4, level: 'Medium',
      ingredients: ['800g pork shoulder, in chunks', '10 dried kashmiri chillies', '1 tsp cumin seed', '1 tsp black peppercorns', '6 cloves', '1 cinnamon stick', '10 garlic cloves', 'Thumb of ginger', '150ml palm or cider vinegar', '1 tsp sugar', '2 onions, sliced', 'Oil'],
      steps: ['Soak the chillies in hot water for 20 minutes, then blitz with all the whole spices, garlic, ginger and the vinegar into a smooth paste.',
              'Rub half the paste through the pork and leave it overnight. This is a marinade, not a sauce, and the wait is the dish.',
              'Fry the onion slowly until deep brown, then add the rest of the paste and cook it 5 minutes.',
              'Pork in with its marinade and just enough water to stop it catching.',
              'Lid on, lowest heat, 90 minutes. It should be thick and dark, not soupy.',
              'Sugar and salt at the end to balance the vinegar. Better the next day, like most things with vinegar in.'] },
    { name: 'With chicken thighs', time: 60, serves: 3, level: 'Easy',
      ingredients: ['Chicken thighs', 'Vindaloo paste', 'Onion', 'Vinegar', 'Sugar'],
      steps: ['Same paste, 2 hours marinating.',
              '30 minutes simmering. Not the original and a good curry.'] }
  ]);

  recipes('Rasam', [
    { name: 'With a fresh masala', time: 30, serves: 4, level: 'Easy',
      ingredients: ['1 lime-sized ball of tamarind, soaked', '2 tomatoes, crushed by hand', '1 tbsp rasam powder', '1 tsp black peppercorns', '1 tsp cumin seed', '3 garlic cloves', '1 tbsp cooked toor dal, optional', 'Curry leaves', '1 tsp mustard seed', '1 dried chilli', 'Sesame or sunflower oil', 'Coriander'],
      steps: ['Crush the peppercorns, cumin and garlic roughly in a mortar. Rough, not powder.',
              'Strain the tamarind water into a pot with the tomatoes, rasam powder, salt and 700ml water.',
              'Simmer 10 minutes until the raw tamarind smell goes.',
              'Add the crushed spices and the dal if using. Now watch it: the moment it froths up at the edges, take it off. It must never boil hard.',
              'Temper the mustard seed, chilli and curry leaves in hot oil until they pop and pour it in.',
              'Coriander over. Drink it from the bowl or pour it over rice.'] },
    { name: 'Lemon rasam, no tamarind', time: 20, serves: 3, level: 'Very easy',
      ingredients: ['Tomatoes', 'Lemon juice', 'Pepper', 'Cumin', 'Curry leaves', 'Mustard seed'],
      steps: ['Same method with lemon juice stirred in off the heat instead of tamarind.',
              'Brighter, and better when you are ill.'] }
  ]);

  recipes('Aloo paratha', [
    { name: 'Stuffed and griddled', time: 60, serves: 4, level: 'Medium',
      ingredients: ['300g chapati flour', '200ml water', '4 potatoes, boiled and mashed', '1 green chilli, minced', '1 tbsp grated ginger', '1 tsp ajwain', '1 tsp amchur', '1 tsp garam masala', 'Coriander', 'Ghee', 'Yoghurt and pickle, to serve'],
      steps: ['Make a soft dough with the flour and water and rest it 30 minutes.',
              'Mix the mash with the chilli, ginger, spices, coriander and salt. It must be completely dry and completely cool, or it will tear the dough.',
              'Roll a small disc, put a ball of filling in the middle, gather the edges over the top and pinch shut. Press flat.',
              'Roll out gently from the centre, turning as you go. Slowly — speed is what splits them.',
              'Cook on a dry hot tava, 1 minute, flip, brush with ghee, flip again and press the edges with a cloth until it puffs.',
              'Yoghurt, pickle and a lump of butter on top.'] },
    { name: 'Folded, easier', time: 45, serves: 3, level: 'Easy',
      ingredients: ['Chapati flour', 'Potato', 'Ginger', 'Chilli', 'Ghee'],
      steps: ['Spread filling on a rolled disc, fold it in thirds like a letter, then in thirds again, and roll out.',
              'Far less likely to burst. Slightly less even inside.'] }
  ]);

  recipes('Kathi roll', [
    { name: 'Egg paratha, chicken inside', time: 45, serves: 2, level: 'Medium',
      ingredients: ['2 parathas or flaky flatbreads', '2 eggs, beaten', '300g chicken thigh, in strips', '3 tbsp yoghurt', '1 tbsp ginger-garlic paste', '1 tsp garam masala', '1 tsp chilli powder', '1 red onion, sliced thin', '1 lime', 'Green chutney', 'Chaat masala'],
      steps: ['Marinate the chicken in the yoghurt, ginger-garlic and spices for 30 minutes, then fry hard until charred at the edges.',
              'Soak the sliced onion in lime juice with a pinch of salt — it turns pink and loses its harshness.',
              'Cook a paratha in a hot pan. Pour half the beaten egg on top of it and flip it immediately so the egg cooks onto the bread.',
              'Egg side up, spread chutney down the middle.',
              'Chicken, pickled onion, chaat masala and lime.',
              'Roll tight and wrap the bottom half in paper. That paper is load-bearing.'] },
    { name: 'Paneer, same method', time: 35, serves: 2, level: 'Easy',
      ingredients: ['Parathas', 'Eggs', 'Paneer', 'Yoghurt', 'Spices', 'Red onion', 'Lime', 'Chutney'],
      steps: ['Same marinade on paneer cubes, 15 minutes only.',
              'Fry hard and fast so it chars without drying out.'] }
  ]);

  recipes('Litti chokha', [
    { name: 'Baked, then smashed into the chokha', time: 90, serves: 4, level: 'Medium',
      ingredients: ['300g wholemeal flour', '1 tsp ajwain', '150ml water', '200g sattu (roasted gram flour)', '1 tbsp pickle oil', '1 green chilli', '1 tbsp grated ginger', 'Coriander', '2 aubergines', '3 tomatoes', '4 potatoes', '4 garlic cloves', 'Mustard oil', 'Ghee'],
      steps: ['Make a stiff dough with the flour, ajwain, salt and water. Rest 30 minutes.',
              'Mix the sattu with the pickle oil, chilli, ginger, coriander, lemon and salt into a crumbly, damp filling.',
              'Stuff balls of dough with it, seal well and flatten slightly.',
              'Bake at 200C for 25 minutes, turning once, until cracked and dry. Over coals is better if you have them.',
              'For the chokha: char the aubergines, tomatoes and whole garlic directly over a flame until black. Peel and mash together with raw mustard oil, salt and chilli. Boil and mash the potatoes into it.',
              'Dunk each litti in melted ghee and break it into the chokha with your hand.'] },
    { name: 'In an air fryer', time: 60, serves: 3, level: 'Easy',
      ingredients: ['Dough', 'Sattu filling', 'Aubergine', 'Tomato', 'Potato', 'Mustard oil', 'Ghee'],
      steps: ['180C for 20 minutes, turning twice.',
              'Char the aubergine under the grill. You lose the smoke and keep the dish.'] }
  ]);

  recipes('Nasi lemak', [
    { name: 'With sambal made properly', time: 70, serves: 4, level: 'Medium',
      ingredients: ['400g rice', '1 tin coconut milk', '3 pandan leaves, knotted', '2cm ginger, sliced', '10 dried chillies, soaked', '2 shallots', '2 garlic cloves', '1 tsp belacan', '2 tbsp tamarind water', '1 tbsp sugar', '100g dried anchovies', '100g peanuts', '4 eggs', '1 cucumber'],
      steps: ['Rinse the rice and cook it in the coconut milk plus water to the usual level, with the pandan and ginger sitting on top.',
              'Fry the anchovies and peanuts separately until crisp, and set aside. Keep the oil.',
              'Blitz the chillies, shallots, garlic and belacan into a paste, then fry it in that oil for 15 minutes, patiently, until it darkens and the oil separates.',
              'Tamarind, sugar and salt in. It should be sweet, salty, sour and hot in that order.',
              'Boil the eggs 8 minutes and halve them.',
              'On the plate: rice in the middle, sambal, anchovies, peanuts, cucumber and egg around it. Never stirred together before it reaches the table.'] },
    { name: 'With shop sambal', time: 35, serves: 3, level: 'Very easy',
      ingredients: ['Rice', 'Coconut milk', 'Pandan', 'Jarred sambal', 'Dried anchovies', 'Peanuts', 'Eggs', 'Cucumber'],
      steps: ['Coconut rice as above.',
              'Fry the jarred sambal for 5 minutes with a little sugar and tamarind to wake it up.'] }
  ]);

  recipes('Char kway teow', [
    { name: 'One portion at a time', time: 25, serves: 2, level: 'Hard',
      ingredients: ['400g fresh flat rice noodles', '2 tbsp pork lard', '4 garlic cloves, minced', '100g prawns, peeled', '80g Chinese sausage, sliced thin', '100g cockles, optional', '2 eggs', '2 tbsp dark soy', '1 tbsp light soy', '1 tsp chilli paste', '2 handfuls bean sprouts', '2 spring onions, in lengths'],
      steps: ['Separate the noodles by hand first. Cold from the fridge they break; let them come to room temperature.',
              'Cook ONE portion at a time in the hottest wok you can manage. Two portions halves the heat and you get a stew.',
              'Lard in, garlic for 10 seconds, sausage and prawns until they colour.',
              'Noodles in, then both soys and the chilli paste. Toss and press them against the wok so they catch and blister.',
              'Push everything aside, crack in an egg, let it set for 15 seconds, then fold it through.',
              'Sprouts and spring onion in for 20 seconds only, still crunching. Straight onto the plate.'] },
    { name: 'Without lard or cockles', time: 20, serves: 2, level: 'Medium',
      ingredients: ['Flat rice noodles', 'Oil', 'Garlic', 'Prawns', 'Egg', 'Dark and light soy', 'Bean sprouts', 'Chives'],
      steps: ['Same method with oil. It will not taste the same and it will still be very good.',
              'The heat matters more than the lard does.'] }
  ]);

  recipes('Gado-gado', [
    { name: 'With a stone-ground sauce', time: 40, serves: 4, level: 'Easy',
      ingredients: ['200g raw peanuts, fried, or 150g peanut butter', '3 garlic cloves', '2 red chillies', '2 tbsp palm sugar', '2 tbsp tamarind water', '1 tbsp sweet soy', '200ml water', '200g green beans', '200g cabbage, shredded', '100g bean sprouts', '2 potatoes, boiled', '200g firm tofu, fried', '4 eggs, boiled', '1 cucumber', 'Emping or rice crackers'],
      steps: ['Pound or blitz the peanuts with the garlic, chilli, sugar and salt into a coarse paste.',
              'Loosen with the water, tamarind and sweet soy until it pours thickly. Taste: sweet, salty, sour, hot.',
              'Blanch the beans, cabbage and sprouts separately, each for only a minute or two. They should keep their colour.',
              'Arrange everything in sections on a platter, still slightly warm.',
              'Pour the sauce over in a wide stripe rather than tossing it through.',
              'Crackers on top, crushed at the table. Emping are the bitter ones and the right ones.'] },
    { name: 'From a jar, on a weeknight', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['Peanut butter', 'Sweet soy', 'Lime', 'Chilli', 'Blanched vegetables', 'Boiled eggs', 'Fried tofu'],
      steps: ['Whisk peanut butter with sweet soy, lime and hot water until it pours.',
              'Over whatever vegetables are in the fridge, blanched.'] }
  ]);

  recipes('Sinigang', [
    { name: 'Sour with tamarind', time: 90, serves: 5, level: 'Very easy',
      ingredients: ['800g pork belly or ribs, in chunks', '1 onion, quartered', '2 tomatoes, quartered', '200g tamarind pulp, or 1 sachet sinigang mix', '1 daikon, sliced', '200g green beans', '1 aubergine, sliced', '2 handfuls water spinach or spinach', '2 long green chillies', 'Fish sauce'],
      steps: ['Boil the pork with the onion in 2 litres of water, skimming, for 45 minutes.',
              'Simmer the tamarind pulp in a ladle of the broth, mash it, and strain the sour liquid back in.',
              'Tomato and daikon in for 10 minutes, then the aubergine and beans for 6.',
              'Greens and whole chillies in at the very end, off the heat.',
              'Season with fish sauce rather than salt — it wants that particular savouriness.',
              'It should be properly sour. If it makes you blink, it is right.'] },
    { name: 'With prawns, quicker', time: 35, serves: 3, level: 'Very easy',
      ingredients: ['Prawns', 'Tamarind or sinigang mix', 'Tomato', 'Daikon', 'Aubergine', 'Spinach', 'Fish sauce'],
      steps: ['Build the sour broth with the vegetables first, 20 minutes.',
              'Prawns in for the last 4 minutes only.'] }
  ]);

  recipes('Kare-kare', [
    { name: 'Oxtail, peanut, annatto', time: 240, serves: 6, level: 'Medium',
      ingredients: ['1.2kg oxtail', '1 onion', '4 tbsp annatto seeds, or 2 tsp powder', '150g ground toasted rice', '200g peanut butter', '1 aubergine, sliced', '1 bundle pak choi', '200g green beans', '1 banana heart, optional', 'Shrimp paste, to serve'],
      steps: ['Simmer the oxtail with the onion for three hours until it is genuinely falling apart. Keep 1.5 litres of the broth.',
              'Steep the annatto in a little hot broth and strain — that is the colour, and it is not chilli.',
              'Toast raw rice in a dry pan until brown, then grind it to powder. This is the thickener and the reason it tastes like itself.',
              'Bring the broth up with the annatto, peanut butter and ground rice, whisking, until it coats a spoon.',
              'Oxtail back in, then the vegetables in order of toughness, 4 to 8 minutes each.',
              'Do not salt it. It is meant to be under-seasoned, because the shrimp paste on the side does that job.'] },
    { name: 'With beef shin', time: 150, serves: 4, level: 'Easy',
      ingredients: ['Beef shin', 'Annatto', 'Peanut butter', 'Ground toasted rice', 'Aubergine', 'Green beans', 'Pak choi'],
      steps: ['Two hours on the shin rather than three on the tail.',
              'Same sauce. Leaner, and it misses the gelatine.'] }
  ]);

  recipes('Bún bò Huế', [
    { name: 'With a lemongrass broth', time: 240, serves: 6, level: 'Hard',
      ingredients: ['1kg beef shin', '500g pork hock', '6 lemongrass stalks, bruised', '1 onion, charred', '3 tbsp shrimp paste', '3 tbsp sugar', '4 tbsp chilli oil with annatto', 'Fish sauce', '500g thick round rice noodles', 'Banana blossom, herbs, lime, sliced onion, to serve'],
      steps: ['Blanch the beef and pork for 5 minutes and rinse. Cover with 4 litres fresh water.',
              'Charred onion and lemongrass in. Simmer three hours, skimming for the first twenty minutes.',
              'Mix the shrimp paste with a ladle of broth, let it settle, and pour the clear part back in. Never the sediment.',
              'Sugar, fish sauce and the chilli-annatto oil. Taste: it should be hot, sour-free, and much bolder than pho.',
              'Slice the meat. Cook the noodles separately.',
              'Noodles, meat, broth, then a plate of herbs, blossom and lime for everyone to wreck their own bowl with.'] },
    { name: 'Shortcut, three hours less', time: 60, serves: 4, level: 'Medium',
      ingredients: ['Good beef stock', 'Lemongrass', 'Shrimp paste', 'Chilli oil', 'Thin sliced beef', 'Round rice noodles', 'Herbs'],
      steps: ['Steep bruised lemongrass in hot stock for 30 minutes, then season as above.',
              'Pour the boiling broth over raw thin-sliced beef in the bowl.'] }
  ]);

  recipes('Musakhan', [
    { name: 'Roasted over the bread', time: 90, serves: 4, level: 'Easy',
      ingredients: ['8 chicken thighs, bone in', '6 large onions, sliced thin', '4 tbsp sumac, plus more', '150ml olive oil', '1 tsp allspice', '0.5 tsp cinnamon', '4 taboon or large flatbreads', '80g pine nuts', 'Lemon', 'Salt'],
      steps: ['Rub the chicken with sumac, allspice, salt and half the oil and leave it an hour.',
              'Cook the onions in the rest of the oil over low heat for 40 minutes, until collapsed and sweet but not browned. Stir in 3 tbsp sumac.',
              'Roast the chicken at 200C for 35 minutes, skin up, until dark.',
              'Lay a flatbread in a dish, spread it thickly with onion, then the chicken on top with every drop of its fat.',
              'Back in the oven for 10 minutes so the bread drinks it.',
              'Toasted pine nuts, more sumac, lemon. Eaten with hands, bread and all.'] },
    { name: 'Rolled, for a crowd', time: 80, serves: 6, level: 'Easy',
      ingredients: ['Cooked shredded chicken', 'Sumac onions', 'Thin flatbreads', 'Pine nuts', 'Olive oil'],
      steps: ['Spread onion and chicken on thin breads, roll into cigars, pack into a dish.',
              'Oil over, 200C for 15 minutes until crisp.'] }
  ]);

  recipes('Mansaf', [
    { name: 'With jameed', time: 150, serves: 8, level: 'Medium',
      ingredients: ['1.5kg lamb on the bone', '500g jameed (dried fermented yoghurt), soaked overnight', '2 tsp turmeric', '1 tsp cardamom', '1 cinnamon stick', '500g rice', '80g butter', '100g toasted almonds and pine nuts', '4 large flatbreads', 'Parsley'],
      steps: ['Simmer the lamb with the cinnamon and cardamom for 90 minutes, skimming. Keep the broth.',
              'Blend the soaked jameed with some of its water until completely smooth, then strain it.',
              'Warm it very gently with a ladle of broth and the turmeric, stirring constantly in one direction. It will split if it boils — this is the only difficult part.',
              'Add the lamb and keep it just below a simmer for 30 minutes.',
              'Cook the rice in broth with butter.',
              'Lay the bread on a wide tray, ladle sauce over it, rice on top, then the lamb, then more sauce, then the nuts. One tray, everyone standing round it.'] },
    { name: 'With thick yoghurt', time: 120, serves: 6, level: 'Easy',
      ingredients: ['Lamb', 'Thick yoghurt', '1 tbsp cornflour', 'Turmeric', 'Rice', 'Flatbread', 'Almonds'],
      steps: ['Whisk cornflour into the yoghurt before heating — without it, it splits every time.',
              'Warm it slowly with broth, stirring one way. Less sharp than jameed, and it holds.'] }
  ]);

  recipes('Kibbeh', [
    { name: 'Fried torpedoes', time: 120, serves: 6, level: 'Hard',
      ingredients: ['300g fine bulgur', '400g very lean minced lamb, for the shell', '1 onion, grated', '1 tsp allspice', '300g minced lamb, for the filling', '1 onion, diced', '60g pine nuts', '1 tsp cinnamon', '1 tsp seven spice', 'Oil for frying'],
      steps: ['Soak the bulgur 20 minutes, then squeeze it bone dry.',
              'Blitz it with the lean mince, grated onion, allspice and salt into a smooth paste. Chill it an hour — cold dough is workable dough.',
              'Fry the filling mince with the diced onion, pine nuts and spices until dry. Cool completely.',
              'Wet your hands. Take a ball of shell, push your finger into it to make a hollow cone, turning as you go until the walls are thin.',
              'Fill, pinch the top closed and taper both ends into points.',
              'Fry at 175C for 4 minutes until deep brown. Yoghurt on the side.'] },
    { name: 'Kibbeh bil sanieh, in a tray', time: 70, serves: 8, level: 'Easy',
      ingredients: ['Same shell mix', 'Same filling', 'Olive oil'],
      steps: ['Press half the shell mix into an oiled tray, filling over it, the rest on top.',
              'Score into diamonds, oil the surface, 200C for 35 minutes.',
              'All of the flavour, none of the shaping.'] }
  ]);

  recipes('Muhammara', [
    { name: 'With roasted peppers', time: 40, serves: 6, level: 'Very easy',
      ingredients: ['4 red peppers', '150g walnuts, toasted', '60g breadcrumbs', '2 tbsp pomegranate molasses', '1 tsp Aleppo pepper', '1 tsp cumin', '1 garlic clove', '3 tbsp olive oil', 'Lemon', 'Salt'],
      steps: ['Roast or char the peppers until blackened, then steam them in a covered bowl for 10 minutes and peel.',
              'Pulse the walnuts and breadcrumbs first, on their own, to a coarse rubble.',
              'Add the peppers, molasses, spices, garlic and lemon and pulse again. Stop while it is still rough — smooth muhammara is a dip that has lost its nerve.',
              'Work in the oil by hand.',
              'Rest an hour. More molasses if it needs sharpening, more Aleppo if it needs heat.'] },
    { name: 'From a jar of peppers', time: 15, serves: 4, level: 'Very easy',
      ingredients: ['Jarred roasted peppers, drained well', 'Walnuts', 'Breadcrumbs', 'Pomegranate molasses', 'Aleppo pepper', 'Olive oil'],
      steps: ['Dry the peppers on paper first or it will be watery.',
              'Same pulsing. Fifteen minutes to something people ask about.'] }
  ]);

  recipes('Poutine', [
    { name: 'Curds, gravy, in that order', time: 45, serves: 2, level: 'Medium',
      ingredients: ['800g floury potatoes, in thick chips', 'Oil for frying', '250g fresh cheese curds, at room temperature', '30g butter', '30g plain flour', '500ml beef stock', '1 tbsp cider vinegar', '1 tsp Worcestershire sauce', 'Black pepper'],
      steps: ['Fry the chips at 140C for 6 minutes, drain, and rest 20 minutes. Then fry again at 190C until deep gold.',
              'Make a brown roux with the butter and flour — cook it past blonde, 4 minutes.',
              'Whisk in the stock, vinegar and Worcestershire and simmer 10 minutes until it coats a spoon.',
              'Chips in a bowl, curds scattered over them while the chips are still spitting.',
              'Gravy over the top, hot enough to soften the curds without melting them flat.',
              'They should squeak. Cold curds do not squeak and are the usual thing that goes wrong.'] },
    { name: 'Vegetarian gravy', time: 40, serves: 2, level: 'Easy',
      ingredients: ['Chips', 'Cheese curds', 'Butter', 'Flour', 'Mushroom stock', 'Soy sauce', 'Cider vinegar'],
      steps: ['Same roux with a strong mushroom stock and a splash of soy for depth.',
              'Darker than it looks like it should be, and it works.'] }
  ]);

  recipes('Lobster roll', [
    { name: 'Maine style, cold and dressed', time: 30, serves: 2, level: 'Easy',
      ingredients: ['400g cooked lobster meat, in big chunks', '3 tbsp mayonnaise', '1 celery stick, diced fine', '1 tbsp lemon juice', '1 tbsp chives', '2 split-top buns', '30g butter, softened', 'Salt and pepper'],
      steps: ['Keep the lobster in large pieces. Shredded lobster in a roll is a waste of a lobster.',
              'Fold gently with the mayonnaise, celery, lemon, chives and seasoning. Chill 20 minutes.',
              'Butter both flat sides of the buns and griddle them until properly golden — this is not a step to skip.',
              'Fill generously so the meat sits proud of the bun.',
              'More chives, and a lemon wedge nobody will use.'] },
    { name: 'Connecticut style, warm and buttered', time: 20, serves: 2, level: 'Very easy',
      ingredients: ['Cooked lobster meat', '60g butter', 'Lemon', 'Split-top buns'],
      steps: ['Warm the lobster through in melted butter over very low heat. Two minutes, no more.',
              'Into a griddled bun with the butter spooned over. No mayonnaise, and people do have opinions.'] }
  ]);

  recipes('Shrimp and grits', [
    { name: 'Low country', time: 45, serves: 4, level: 'Easy',
      ingredients: ['200g stone-ground grits', '600ml water', '300ml milk', '60g butter', '100g sharp cheddar, grated', '500g large prawns, peeled', '150g bacon, chopped', '3 spring onions', '2 garlic cloves', '1 tbsp lemon juice', 'Hot sauce'],
      steps: ['Whisk the grits into the boiling water and milk, then turn it right down.',
              'Forty minutes, stirring every five. Quick grits take ten and taste like it.',
              'Butter and cheese in at the end. They should pour slowly, not hold a shape.',
              'Fry the bacon until crisp and lift out. Cook the prawns in the fat, 90 seconds a side, with the garlic.',
              'Spring onion, lemon and a splash of water off the heat to make a pan sauce.',
              'Grits in wide bowls, prawns and bacon on top, sauce over, hot sauce at the table.'] },
    { name: 'Polenta instead', time: 30, serves: 3, level: 'Very easy',
      ingredients: ['Quick polenta', 'Milk', 'Butter', 'Cheddar', 'Prawns', 'Bacon', 'Garlic', 'Lemon'],
      steps: ['Polenta in 8 minutes with milk and butter.',
              'Same prawns. Not grits, and close enough to be worth doing on a Tuesday.'] }
  ]);

  recipes('Key lime pie', [
    { name: 'Three ingredients in the filling', time: 50, serves: 8, level: 'Very easy',
      ingredients: ['250g digestive biscuits', '110g butter, melted', '2 tbsp sugar', '1 tin condensed milk', '4 egg yolks', '150ml lime juice', 'Zest of 3 limes', '300ml double cream'],
      steps: ['Blitz the biscuits, mix with the butter and sugar, press into a tin and bake at 180C for 10 minutes. Cool.',
              'Whisk the yolks with the zest until slightly thickened, then beat in the condensed milk.',
              'Add the lime juice last and whisk 2 minutes. It thickens in the bowl — that is the acid setting it, before it ever sees the oven.',
              'Pour into the crust and bake at 160C for 15 minutes, until set with a slight wobble.',
              'Cool, then at least four hours in the fridge.',
              'Whipped cream on top, and no sugar in the cream. The pie has enough.'] },
    { name: 'No-bake', time: 20, serves: 8, level: 'Very easy',
      ingredients: ['Biscuit base', 'Condensed milk', 'Lime juice and zest', 'Double cream'],
      steps: ['Whisk condensed milk with lime juice until thick, fold in softly whipped cream.',
              'Into the chilled base. Six hours in the fridge. Softer and just as sharp.'] }
  ]);

  recipes('Cannoli', [
    { name: 'Shells and all', time: 120, serves: 10, level: 'Hard',
      ingredients: ['250g plain flour', '2 tbsp sugar', '30g butter', '100ml marsala or white wine', '1 egg white, for sealing', 'Oil for frying', '500g ricotta, drained overnight', '120g icing sugar', '80g chocolate chips', 'Candied peel', 'Pistachios'],
      steps: ['Make a firm dough with the flour, sugar, butter and wine. Knead 10 minutes and rest it an hour.',
              'Drain the ricotta overnight in a sieve. Wet ricotta makes soggy cannoli and there is no fixing it later.',
              'Roll the dough paper thin, cut discs, wrap round metal tubes and seal the overlap with egg white.',
              'Fry at 180C for 2 minutes until blistered and gold. Slide off the tubes while warm.',
              'Beat the drained ricotta with the icing sugar until smooth, then fold in the chocolate.',
              'Fill from both ends with a piping bag, and only when somebody is ready to eat it. Pistachios on the ends.'] },
    { name: 'The filling, in a glass', time: 20, serves: 6, level: 'Very easy',
      ingredients: ['Drained ricotta', 'Icing sugar', 'Chocolate chips', 'Broken shop cannoli shells or amaretti'],
      steps: ['Layer the sweetened ricotta with crushed shells or biscuits in glasses.',
              'All of the good part and none of the frying.'] }
  ]);

  recipes('Bakewell tart', [
    { name: 'Frangipane over jam', time: 90, serves: 8, level: 'Medium',
      ingredients: ['250g shortcrust pastry', '4 tbsp raspberry jam', '125g butter, soft', '125g caster sugar', '2 eggs', '125g ground almonds', '25g plain flour', '0.5 tsp almond extract', '30g flaked almonds'],
      steps: ['Line a tart tin with the pastry and blind bake at 190C for 15 minutes, then 5 minutes more without the beans.',
              'Spread the jam over the base while the pastry is still warm, right to the edges.',
              'Cream the butter and sugar, beat in the eggs one at a time, then fold in the almonds, flour and extract.',
              'Spread over the jam carefully — do not stir the two together.',
              'Flaked almonds on top. 180C for 30 minutes until set and golden.',
              'Cool in the tin. Warm with custard, or cold with tea, and the second one is correct.'] },
    { name: 'Iced, the cherry one', time: 100, serves: 8, level: 'Medium',
      ingredients: ['Same tart', '150g icing sugar', 'Water', '1 glacé cherry'],
      steps: ['Bake without the flaked almonds and cool completely.',
              'Thick water icing poured over, one cherry in the middle. Not from Bakewell, and what most people mean.'] }
  ]);

  recipes('Kulfi', [
    { name: 'Reduced milk, no churning', time: 300, serves: 6, level: 'Easy',
      ingredients: ['1 litre whole milk', '150g sugar', '1 tsp ground cardamom', 'Pinch of saffron', '60g pistachios, chopped', '2 tbsp ground almonds'],
      steps: ['Bring the milk to a boil in a wide heavy pan, then simmer on low.',
              'Reduce it by two thirds, stirring and scraping the skin back in every few minutes. This takes 50 minutes and it is the whole recipe.',
              'Sugar, cardamom, saffron and the ground almonds in. Another 5 minutes.',
              'Cool, then stir in most of the pistachios.',
              'Into moulds or paper cups with a stick. Freeze at least 6 hours.',
              'Dip the mould in warm water for 5 seconds to release. Denser than ice cream, because nothing has been whipped into it.'] },
    { name: 'The quick one, with condensed milk', time: 250, serves: 6, level: 'Very easy',
      ingredients: ['1 tin evaporated milk', '1 tin condensed milk', '200ml double cream', 'Cardamom', 'Pistachios'],
      steps: ['Whisk everything together cold.',
              'Freeze in moulds. Sweeter, softer, and ready in an afternoon.'] }
  ]);

  recipes('Turkish coffee', [
    { name: 'In a cezve', time: 10, serves: 2, level: 'Medium',
      ingredients: ['2 heaped tsp coffee ground to powder', '2 demitasse cups of cold water', 'Sugar to taste', '1 cardamom pod, optional'],
      steps: ['Measure the water with the cups you will drink from. Cold water into the cezve.',
              'Stir in the coffee and any sugar now — it cannot be stirred later.',
              'Lowest possible heat. Do not stir again. It takes three or four minutes and rushing it is the only way to ruin it.',
              'When the foam rises to the rim, lift it off. Spoon a little foam into each cup.',
              'Return it to the heat twice more, letting it rise each time, then pour slowly.',
              'Wait a minute for the grounds to settle. Drink to the sludge and stop there.'] },
    { name: 'In a small saucepan', time: 8, serves: 1, level: 'Easy',
      ingredients: ['1 heaped tsp powdered coffee', '1 small cup cold water', 'Sugar'],
      steps: ['Same method in the smallest pan you own.',
              'Harder to catch the foam. Watch it the whole time and take it off early.'] }
  ]);

  return {
    BOOK: BOOK,
    scale: scale,
    scaleLine: scaleLine,
    parseQuantity: parseQuantity,
    formatQuantity: formatQuantity,
    STAPLES: STAPLES,
    stem: stem,
    nouns: nouns,
    readPantry: readPantry,
    hasLine: hasLine,
    fromPantry: fromPantry,
    // Recipes for one dish, or an empty list if none are bundled for it.
    forDish: function (name) { return BOOK[name] || []; },
    has: function (name) { return !!(BOOK[name] && BOOK[name].length); },
    count: function () {
      return Object.keys(BOOK).reduce(function (n, k) { return n + BOOK[k].length; }, 0);
    },
    dishes: function () { return Object.keys(BOOK); }
  };
});
