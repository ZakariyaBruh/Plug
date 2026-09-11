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
      ingredients: ['1 onion', '2 garlic cloves', '200g spinach', '100ml cream or yoghurt', '4 eggs', 'Cumin', 'Lemon'],
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
      ingredients: ['200g macaroni', '150ml evaporated milk', '150g cheddar, grated', '1 egg', 'Mustard', 'Pepper'],
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
      ingredients: ['1 cauliflower, in small florets', '2 tsp smoked paprika', '1 tsp cumin', 'Tortillas', 'Yoghurt', 'Lime', 'Pickled onion'],
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
      ingredients: ['1 avocado', '2 slices bread', '1 egg', 'Vinegar', 'Chilli flakes', 'Lemon'],
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
      ingredients: ['1 frozen banana', '150g frozen berries', '150ml milk or oat milk', '2 tbsp yoghurt', '1 tbsp oats'],
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
      ingredients: ['1 whole chicken, about 1.6kg', '1 lemon', 'Butter, softened', 'Thyme', 'Salt', 'Potatoes and onions to sit under it'],
      steps: ['Dry the skin thoroughly and salt it an hour ahead if you can.',
              'Push butter and thyme under the breast skin. Halved lemon inside the cavity.',
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
      ingredients: ['80g popcorn kernels', '2 tbsp neutral oil', '30g butter', 'Fine salt'],
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
      ingredients: ['400g strong flour', '250ml warm water', '7g instant yeast', '1 tsp salt', '60g bicarbonate of soda', '1 egg, beaten', 'Coarse salt'],
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
      ingredients: ['250ml water', '120g plain flour', '30g butter', '1 egg', 'Oil for frying', 'Caster sugar and cinnamon', '100g dark chocolate, 100ml cream'],
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
      ingredients: ['500g ripe fruit', '3 tbsp sugar or honey', 'Squeeze of lime', 'Pinch of salt', '2 tbsp yoghurt or coconut milk (optional)'],
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
      ingredients: ['100g coarsely ground coffee', '1L cold water', 'Milk', 'Ice'],
      steps: ['Stir the grounds into cold water in a jar. Coarse grind only, or it turns muddy.',
              'Leave 12–18 hours at room temperature or in the fridge.',
              'Strain through a filter or muslin. It keeps a week.',
              'Serve over plenty of ice, diluted about half and half. It is concentrate, not coffee.'] }
  ]);

  recipes('Tea', [
    { name: 'Made properly', time: 5, serves: 1, level: 'Very easy',
      ingredients: ['1 teabag or 1 tsp loose leaf', 'Freshly drawn water', 'Milk'],
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
                    '1 tbsp gochugaru', '1 tbsp sugar', '1 tbsp soy sauce', '2 spring onions', '2 boiled eggs'],
      steps: ['Soak the rice cakes 10 minutes if they are not fresh, or they stay chalky in the middle.',
              'Bring the stock to a boil and whisk in the pastes, sugar and soy.',
              'Add the rice cakes and simmer, stirring, until the sauce thickens and clings — about 8 minutes.',
              'It gets hotter as it reduces, so taste before you add more chilli.',
              'Spring onion and halved eggs on top.'] }
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
                    '1 tbsp ginger', '4 cloves garlic', '4 hard-boiled eggs', '2 tbsp tej or red wine'],
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
                    'Butter', 'Cheese, shredded chicken or black beans to fill'],
      steps: ['Only masarepa works — ordinary cornmeal or polenta will not hydrate the same way.',
              'Stir the flour into the salted water and let it sit 5 minutes to swell.',
              'Knead until it stops cracking at the edges when you flatten a ball. If it cracks, add water a spoon at a time.',
              'Form discs about 1cm thick. Griddle 5 minutes a side until a crust forms and it sounds hollow.',
              'Finish in the oven 10 minutes if they are thick.',
              'Split like a pitta while hot, butter inside, then fill.'] }
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
      ingredients: ['3 aubergines, sliced', '500g lamb mince', '1 onion, 3 garlic cloves', '400g chopped tomatoes', '1 tsp cinnamon', '50g butter, 50g flour, 600ml milk', '1 egg yolk', '60g cheese'],
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
