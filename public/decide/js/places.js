/*
 * places.js — finding somewhere nearby that serves the thing.
 *
 * Data comes from OpenStreetMap: no API key, no account, and no tracking of the
 * person searching. The lookup runs only when someone asks for it, and the
 * coordinates never go anywhere except the map requests themselves.
 *
 * It reads OSM through three different front doors, asked at the same time:
 *
 *   overpass   structured tag queries. Unbeatable where tagging is dense,
 *              regularly overloaded, and slow from far away.
 *   photon     Komoot's geocoder. Matches venue *names*, which is what finds
 *              "Pizza Hut" in a city where nobody has filled in cuisine=pizza.
 *   nominatim  OSM's own geocoder. Weak on dish names, strong on the generic
 *              "anywhere at all that serves food" question.
 *
 * Three providers is not belt and braces, it is the actual finding: measured
 * across ten cities on five continents, Photon answers the dish question
 * (13 pizza places in Riyadh) where Overpass returns nothing, and Nominatim
 * answers the fallback question (22 places) where Photon returns one. Neither
 * covers both. Asking all three at once and merging costs one round trip.
 *
 * The query building, distance maths and response parsing are pure functions so
 * they can be tested without a network.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.FoodPlaces = mod;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Public Overpass instances, tried in order. They go down individually often
  // enough that a single endpoint is not dependable.
  // All of these are in Europe, which is worth knowing: from the Gulf or east
  // Asia the round trip alone is a fifth of a second before the server starts
  // thinking, and a bounding-box query can take ten more.
  var ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.osm.jp/api/interpreter'
  ];

  var PHOTON = 'https://photon.komoot.io/api';
  var NOMINATIM = 'https://nominatim.openstreetmap.org/search';

  // The kinds of place worth putting on the map. Used both to build queries and
  // to throw away whatever a free-text search drags in that is not a venue.
  var AMENITIES = ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'ice_cream', 'food_court'];
  var SHOPS = ['bakery', 'pastry', 'confectionery', 'deli', 'coffee', 'tea', 'ice_cream'];

  function listToSet(list) {
    var set = {};
    list.forEach(function (item) { set[item] = true; });
    return set;
  }
  var AMENITY_SET = listToSet(AMENITIES);
  var SHOP_SET = listToSet(SHOPS);

  // How a dish translates into what to look for on the map.
  //   cuisine  matches OSM's cuisine tag (Overpass)
  //   amenity  narrows the kind of venue (Overpass)
  //   find     what to type at a geocoder that matches venue names. Defaults to
  //            the dish name, which is right about two thirds of the time —
  //            "Pizza", "Baklava" and "Shawarma" are all in real shop signs.
  //            The overrides are the dishes nobody names a restaurant after.
  var LOOKUP = {
    'Pizza':                { cuisine: 'pizza', label: 'pizza places' },
    'Cheeseburger':         { cuisine: 'burger', label: 'burger places', find: 'burger' },
    'Fried chicken':        { cuisine: 'chicken', label: 'chicken shops', find: 'fried chicken' },
    'Buffalo wings':        { cuisine: 'chicken|american', label: 'wing places', find: 'wings' },
    'Ramen':                { cuisine: 'ramen|japanese', label: 'ramen bars' },
    'Pho':                  { cuisine: 'vietnamese', label: 'Vietnamese places' },
    'Sushi':                { cuisine: 'sushi|japanese', label: 'sushi places' },
    'Poke bowl':            { cuisine: 'poke|hawaiian', label: 'poke bars', find: 'poke' },
    'Thai green curry':     { cuisine: 'thai', label: 'Thai restaurants', find: 'thai' },
    'Pad thai':             { cuisine: 'thai', label: 'Thai restaurants', find: 'thai' },
    'Chicken biryani':      { cuisine: 'indian|pakistani', label: 'Indian restaurants', find: 'biryani' },
    'Katsu curry':          { cuisine: 'japanese', label: 'Japanese places', find: 'katsu' },
    'Dumplings':            { cuisine: 'chinese|dumpling', label: 'dumpling places', find: 'dumpling' },
    'Egg fried rice':       { cuisine: 'chinese', label: 'Chinese places', find: 'chinese' },
    'Spaghetti bolognese':  { cuisine: 'italian|pasta', label: 'Italian restaurants', find: 'pasta' },
    'Lasagna':              { cuisine: 'italian|pasta', label: 'Italian restaurants', find: 'italian' },
    'Tacos':                { cuisine: 'mexican|tacos', label: 'taquerias', find: 'taco' },
    'Burrito':              { cuisine: 'mexican|burrito', label: 'burrito places' },
    'Quesadilla':           { cuisine: 'mexican', label: 'Mexican places', find: 'mexican' },
    'Nachos':               { cuisine: 'mexican|american', label: 'Mexican places', find: 'mexican' },
    'Shawarma wrap':        { cuisine: 'kebab|turkish|lebanese', label: 'kebab shops', find: 'shawarma' },
    'Falafel wrap':         { cuisine: 'falafel|lebanese|middle_eastern', label: 'falafel places', find: 'falafel' },
    'Fish and chips':       { cuisine: 'fish_and_chips', label: 'chippies', find: 'fish and chips' },
    'Steak':                { cuisine: 'steak_house', label: 'steakhouses' },
    'Roast chicken':        { cuisine: 'chicken|portuguese', label: 'rotisseries', find: 'chicken' },
    'Full English breakfast': { cuisine: 'breakfast|english', label: 'breakfast spots', find: 'breakfast' },
    'Shakshuka':            { cuisine: 'middle_eastern|israeli', label: 'brunch places' },
    'Club sandwich':        { cuisine: 'sandwich', label: 'sandwich shops', find: 'sandwich' },
    'Bagel with cream cheese': { cuisine: 'bagel|sandwich', label: 'bagel shops', find: 'bagel' },
    'Greek salad':          { cuisine: 'greek', label: 'Greek places', find: 'greek' },
    'Caesar salad':         { cuisine: 'salad|american', label: 'salad places', find: 'salad' },
    'Hummus and pita':      { cuisine: 'lebanese|middle_eastern', label: 'mezze places', find: 'hummus' },
    'Spring rolls':         { cuisine: 'vietnamese|asian', label: 'Vietnamese places', find: 'vietnamese' },
    'Charcuterie board':    { cuisine: 'deli|wine', label: 'delis and wine bars', find: 'deli' },
    'Cheese and crackers':  { cuisine: 'deli|cheese', label: 'cheese shops', find: 'cheese' },
    'Churros':              { cuisine: 'spanish|dessert', label: 'churros places' },
    'Doughnut':             { amenity: 'cafe|fast_food', cuisine: 'donut', label: 'doughnut shops', find: 'donut' },
    'Cinnamon roll':        { amenity: 'cafe|bakery', label: 'bakeries', find: 'bakery' },
    'Cookies':              { amenity: 'cafe|bakery', label: 'bakeries', find: 'bakery' },
    'Brownie':              { amenity: 'cafe|bakery', label: 'bakeries', find: 'bakery' },
    'Apple pie':            { amenity: 'cafe|bakery', label: 'bakeries', find: 'bakery' },
    'Cheesecake':           { amenity: 'cafe|bakery', label: 'cake shops', find: 'cake' },
    'Tiramisu':             { cuisine: 'italian', label: 'Italian places', find: 'italian' },
    'Ice cream':            { amenity: 'ice_cream', label: 'ice cream shops' },
    'Frozen yoghurt':       { amenity: 'ice_cream|cafe', label: 'frozen yoghurt shops', find: 'yogurt' },
    'Coffee':               { amenity: 'cafe', cuisine: 'coffee_shop', label: 'coffee shops' },
    'Iced coffee':          { amenity: 'cafe', cuisine: 'coffee_shop', label: 'coffee shops', find: 'coffee' },
    'Tea':                  { amenity: 'cafe', cuisine: 'tea', label: 'tea rooms' },
    'Bubble tea':           { cuisine: 'bubble_tea', label: 'bubble tea shops' },
    'Milkshake':            { amenity: 'cafe|fast_food', label: 'places doing shakes', find: 'shake' },
    'Smoothie':             { amenity: 'cafe|juice_bar', label: 'juice bars', find: 'juice' },
    'Orange juice':         { amenity: 'cafe|juice_bar', label: 'juice bars', find: 'juice' },
    'Pancakes':             { amenity: 'cafe', cuisine: 'pancake|breakfast', label: 'pancake places', find: 'pancake' },
    'Waffles':              { amenity: 'cafe', cuisine: 'waffle|dessert', label: 'waffle places', find: 'waffle' },
    'French toast':         { amenity: 'cafe', cuisine: 'breakfast', label: 'brunch spots', find: 'breakfast' },
    'Crepes':               { cuisine: 'crepe|french', label: 'creperies', find: 'crepe' },
    'Avocado toast':        { amenity: 'cafe', cuisine: 'breakfast', label: 'brunch spots', find: 'brunch' },
    'Pretzel':              { amenity: 'bakery', cuisine: 'pretzel', label: 'bakeries' },

    'Bibimbap':             { cuisine: 'korean', label: 'Korean places' },
    'Korean fried chicken': { cuisine: 'korean|chicken', label: 'Korean chicken shops', find: 'korean chicken' },
    'Tteokbokki':           { cuisine: 'korean', label: 'Korean places', find: 'korean' },
    'Butter chicken':       { cuisine: 'indian|pakistani', label: 'Indian restaurants', find: 'indian' },
    'Chana masala':         { cuisine: 'indian|vegetarian', label: 'Indian restaurants', find: 'indian' },
    'Masala dosa':          { cuisine: 'indian|south_indian', label: 'South Indian places', find: 'dosa' },
    'Kabsa':                { cuisine: 'arab|saudi|middle_eastern', label: 'Arab restaurants' },
    'Lahmacun':             { cuisine: 'turkish|kebab', label: 'Turkish places', find: 'turkish' },
    'Manakish':             { cuisine: 'lebanese|middle_eastern|bakery', label: 'Levantine bakeries' },
    'Jollof rice':          { cuisine: 'african|nigerian|ghanaian', label: 'West African places', find: 'jollof' },
    'Tagine':               { cuisine: 'moroccan|african', label: 'Moroccan restaurants', find: 'moroccan' },
    'Koshari':              { cuisine: 'egyptian|middle_eastern', label: 'Egyptian places' },
    'Doro wat':             { cuisine: 'ethiopian|african', label: 'Ethiopian restaurants', find: 'ethiopian' },
    'Feijoada':             { cuisine: 'brazilian|latin_american', label: 'Brazilian places' },
    'Jerk chicken':         { cuisine: 'caribbean|jamaican', label: 'Caribbean places', find: 'jerk' },
    'Pierogi':              { cuisine: 'polish|eastern_european', label: 'Polish places' },
    'Nasi goreng':          { cuisine: 'indonesian|asian', label: 'Indonesian places', find: 'nasi' },
    'Laksa':                { cuisine: 'malaysian|singaporean|asian', label: 'Malaysian places' },
    'Chicken satay':        { cuisine: 'indonesian|malaysian|thai', label: 'Southeast Asian places', find: 'satay' },
    'Chicken adobo':        { cuisine: 'filipino|asian', label: 'Filipino places', find: 'filipino' },
    'Plov':                 { cuisine: 'uzbek|central_asian', label: 'Central Asian places' },
    'Mapo tofu':            { cuisine: 'chinese|sichuan', label: 'Sichuan places', find: 'sichuan' },
    'Bao buns':             { cuisine: 'chinese|taiwanese', label: 'bao places', find: 'bao' },
    'Banh mi':              { cuisine: 'vietnamese|sandwich', label: 'banh mi shops' },
    'Fattoush':             { cuisine: 'lebanese|middle_eastern', label: 'Levantine places', find: 'lebanese' },
    'Ceviche':              { cuisine: 'peruvian|seafood|latin_american', label: 'Peruvian places' },
    'Arepas':               { cuisine: 'venezuelan|colombian|latin_american', label: 'arepa places', find: 'arepa' },
    'Empanadas':            { cuisine: 'argentinian|latin_american|bakery', label: 'empanada places', find: 'empanada' },
    'Baklava':              { cuisine: 'turkish|middle_eastern|pastry', label: 'baklava shops' },
    'Pastel de nata':       { cuisine: 'portuguese|pastry|bakery', label: 'Portuguese bakeries', find: 'portuguese' },
    'Mango lassi':          { cuisine: 'indian', label: 'Indian places', find: 'indian' },
    'Mint tea':             { amenity: 'cafe|restaurant', cuisine: 'moroccan|middle_eastern', label: 'tea houses', find: 'tea' }
  };

  // Anything without its own entry falls back to eating out generally.
  var DEFAULT_LOOKUP = { amenity: 'restaurant|cafe|fast_food', label: 'places to eat' };

  // What the loose rung asks for. Measured as the best generic term at both
  // geocoders: "food" gets 22 hits at Nominatim and one at Photon, "restaurant"
  // gets 20-plus at both.
  var LOOSE_TERM = 'restaurant';

  function lookupFor(dishName) {
    return LOOKUP[dishName] || DEFAULT_LOOKUP;
  }

  // What to type at a name-matching geocoder for this dish.
  function termFor(dishName) {
    var spec = lookupFor(dishName);
    if (spec.find) return spec.find;
    return String(dishName || '').toLowerCase();
  }

  /* ------------------------------------------------------------ relevance */

  /*
   * How much a place actually has to do with the dish, 0 to 3.
   *
   * Every provider used to be taken at its word. Overpass with a cuisine
   * filter is trustworthy, but the other two are geocoders: they fuzzy-match
   * text and rank by their own score, so asking Photon for "ramen" returns the
   * nearest places whose names it thinks are ramen-ish, and asking Nominatim
   * can match on a street or a suburb rather than the venue at all. Both then
   * passed a check that only asked "is this somewhere that serves food" — true
   * of every restaurant in the city. That is where the generic results came
   * from: a burger van listed under "ramen bars" because it was close and the
   * one filter it had to pass was being a food shop.
   *
   * Overpass adds its own version of the same problem. A dish with no cuisine
   * in the table falls to a query for any *named* venue of the right kind, so
   * on the very first rung it returns the whole neighbourhood.
   *
   * So relevance is scored here, once, from the tags every provider now
   * carries, and the caller drops what does not clear the bar.
   */
  var STRONG = 3;      // the cuisine says so, or the sign over the door does
  var PLAUSIBLE = 1;   // the right sort of venue, and nothing more than that
  var GENERIC = 0;     // somewhere that serves food. So is everywhere.

  // Words a place is actually called when it sells the thing, where the dish's
  // own name is not what ends up on the sign. Only the ones that earn their
  // place: a pizzeria is never tagged cuisine=pizza in half the world, and
  // "pizza" is not a prefix of "pizzeria", so nothing else would catch it.
  var SIGNS = {
    pizza: ['pizzeria', 'pizzaria', 'pizzas'],
    taco: ['taqueria', 'tacos'],
    sushi: ['sushiya'],
    burger: ['burgers', 'burgerbar'],
    kebab: ['doner', 'döner', 'shawarma', 'gyros'],
    italian: ['trattoria', 'osteria', 'ristorante', 'pizzeria'],
    indian: ['tandoori', 'curry', 'masala', 'balti'],
    chinese: ['wok', 'noodle', 'dim sum'],
    japanese: ['sushi', 'ramen', 'izakaya', 'katsu'],
    thai: ['thai'],
    coffee: ['espresso', 'roaster', 'roastery', 'coffee', 'cafe', 'café'],
    bakery: ['boulangerie', 'patisserie', 'pâtisserie', 'bakehouse', 'bakers'],
    chicken: ['wings', 'rotisserie', 'grill'],
    'fish and chips': ['chippy', 'chip shop', 'fish bar'],
    'ice cream': ['gelato', 'gelateria', 'creamery'],
    juice: ['smoothie', 'juicery']
  };

  function fold(text) {
    return String(text || '').toLowerCase();
  }

  // Does the sign over the door name the thing? Substring rather than a stem:
  // a stem short enough to turn "pizza" into "pizzeria" also turns "burger"
  // into "Burgundy Wine Bar", and a wine bar is exactly what this is for
  // getting rid of.
  function signMatches(name, term) {
    var hay = fold(name);
    if (!hay || !term) return false;
    if (hay.indexOf(fold(term)) !== -1) return true;
    var also = SIGNS[fold(term)] || [];
    return also.some(function (word) { return hay.indexOf(word) !== -1; });
  }

  function cuisineMatches(place, spec) {
    if (!spec.cuisine || !place.cuisine) return false;
    // The spec's cuisine is already an alternation ("indian|pakistani"), and
    // OSM values are lowercase by convention only, so both sides are folded.
    return new RegExp('(^|;)(' + spec.cuisine + ')(;|$)', 'i').test(fold(place.cuisine)) ||
           new RegExp(spec.cuisine, 'i').test(fold(place.cuisine));
  }

  function amenityMatches(place, spec) {
    if (!spec.amenity || !place.amenity) return false;
    return new RegExp('^(' + spec.amenity + ')$', 'i').test(fold(place.amenity));
  }

  function relevanceOf(item, spec, term) {
    if (!item) return GENERIC;
    if (cuisineMatches(item, spec)) return STRONG;
    if (signMatches(item.name, term)) return STRONG;
    // The dish names the kind of shop it comes from — a bakery for a cinnamon
    // roll, an ice cream shop for ice cream. Being one is worth something, but
    // not as much as saying so.
    if (amenityMatches(item, spec)) return PLAUSIBLE;
    return GENERIC;
  }

  /* ------------------------------------------------------------- geometry */

  function clampLat(deg) { return Math.max(-90, Math.min(90, deg)); }

  // Fold a longitude back into [-180, 180). 181 is not a place; 179 is.
  function wrapLon(deg) {
    var x = (deg + 180) % 360;
    if (x < 0) x += 360;
    return x - 180;
  }

  // A box roughly `radius` metres around a point. Longitude degrees shrink with
  // latitude, so the east-west span is scaled by cos(lat).
  //
  // Two lines on the globe break the naive version of this, and people live
  // along one of them. Near the antimeridian the east edge comes out at 180.04,
  // which is not a longitude: Overpass rejects the query outright, so the app in
  // Fiji walked all four servers collecting 400s and told the user the map
  // servers were busy. Near the poles cos(lat) collapses instead and the box
  // grows past the whole planet. So latitudes are clamped, longitudes wrapped,
  // and a box reaching over a pole simply asks for every longitude — which is
  // the truth up there, where all of them are within walking distance.
  function boxAround(lat, lon, radiusMetres) {
    var dLat = radiusMetres / 111320;
    var south = clampLat(lat - dLat);
    var north = clampLat(lat + dLat);

    var shrink = Math.cos(clampLat(lat) * Math.PI / 180);
    var dLon = shrink > 1e-9 ? radiusMetres / (111320 * shrink) : 360;
    if (!(dLon < 180) || north >= 90 || south <= -90) {
      return { south: south, north: north, west: -180, east: 180 };
    }
    return { south: south, north: north, west: wrapLon(lon - dLon), east: wrapLon(lon + dLon) };
  }

  // Overpass takes (south,west,north,east) and wants west < east, so a box that
  // runs over the antimeridian has to be asked for as the two halves it really
  // is. Everywhere else this hands back the one box it was given.
  function splitBox(box) {
    if (box.west <= box.east) return [box];
    return [
      { south: box.south, north: box.north, west: box.west, east: 180 },
      { south: box.south, north: box.north, west: -180, east: box.east }
    ];
  }

  function toRad(deg) { return deg * Math.PI / 180; }

  // Great-circle distance in metres.
  function distance(lat1, lon1, lat2, lon2) {
    var R = 6371000;
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Compass bearing from the first point to the second, in degrees from north.
  function bearing(lat1, lon1, lat2, lon2) {
    var dLon = toRad(lon2 - lon1);
    var y = Math.sin(dLon) * Math.cos(toRad(lat2));
    var x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  var COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  function compass(deg) { return COMPASS[Math.round(deg / 45) % 8]; }

  // Three countries do not use metric for road distance, and telling somebody in
  // Ohio that dinner is 800 m away is the kind of small wrongness that makes an
  // app feel like it was built somewhere else. Taken from the browser's own
  // locale rather than guessed from coordinates.
  var IMPERIAL = /^en-(US|LR)\b|^my\b|-(US|LR|MM)\b/i;

  function usesMiles(locale) {
    var tag = locale || (typeof navigator !== 'undefined' && navigator.language) || 'en-GB';
    return IMPERIAL.test(tag);
  }

  function formatDistance(metres, locale) {
    if (usesMiles(locale)) {
      var feet = metres * 3.28084;
      if (feet < 1000) return Math.round(feet / 10) * 10 + ' ft';
      var miles = metres / 1609.344;
      return miles.toFixed(miles < 10 ? 1 : 0) + ' mi';
    }
    if (metres < 1000) return Math.round(metres / 10) * 10 + ' m';
    return (metres / 1000).toFixed(metres < 10000 ? 1 : 0) + ' km';
  }

  function tidyCuisine(value) {
    if (!value) return '';
    return value.split(';')[0].replace(/_/g, ' ').replace(/^./, function (c) {
      return c.toUpperCase();
    });
  }

  // Give every provider's result the same shape, with the distance maths done
  // once here rather than three times badly.
  function place(fields, origin) {
    if (!fields.name || typeof fields.lat !== 'number' || typeof fields.lon !== 'number') return null;
    if (isNaN(fields.lat) || isNaN(fields.lon)) return null;

    var metres = distance(origin.lat, origin.lon, fields.lat, fields.lon);
    var deg = bearing(origin.lat, origin.lon, fields.lat, fields.lon);
    return {
      id: fields.id,
      name: fields.name,
      lat: fields.lat,
      lon: fields.lon,
      metres: metres,
      distance: formatDistance(metres),
      bearing: deg,
      compass: compass(deg),
      kind: fields.kind || '',
      // The raw tags as well as the tidied one. `kind` is for reading; these
      // are for deciding whether this place has anything to do with the dish,
      // and collapsing them into one display string threw that away.
      cuisine: fields.cuisine || '',
      amenity: fields.amenity || '',
      address: fields.address || '',
      hours: fields.hours || '',
      website: fields.website || '',
      source: fields.source || ''
    };
  }

  function byDistance(a, b) { return a.metres - b.metres; }

  /* ------------------------------------------------------------- overpass */

  // Overpass QL for everything matching, as nodes and as ways, in a bounding box.
  // `loose` drops the cuisine filter and asks for anywhere that serves food.
  //
  // OpenStreetMap's cuisine tagging is dense in western Europe and thin almost
  // everywhere else, so "restaurants tagged cuisine=pizza within 1.5km" is a
  // reasonable question in Berlin and returns nothing in Riyadh — while the
  // same streets are full of places that would sell you a pizza. Widening the
  // radius does not fix that; relaxing the filter does, and asking a geocoder
  // that reads shop signs instead of tags fixes it better.
  function buildQuery(dishName, box, options) {
    var spec = lookupFor(dishName);
    var loose = options && options.loose;

    var amenity = loose
      ? 'restaurant|cafe|fast_food'
      : (spec.amenity || 'restaurant|cafe|fast_food|bar|pub');
    var clauses = [];

    // One box everywhere, two where the search runs over the date line.
    splitBox(box).forEach(function (part) {
      var bbox = [part.south, part.west, part.north, part.east].map(function (n) {
        return n.toFixed(5);
      }).join(',');

      ['node', 'way'].forEach(function (kind) {
        if (spec.cuisine && !loose) {
          // Case-insensitive: OSM's cuisine values are lowercase by convention
          // and by convention only, and a "Japanese" that the filter skips is a
          // restaurant the app says does not exist.
          clauses.push(kind + '["amenity"~"^(' + amenity + ')$"]["cuisine"~"' + spec.cuisine + '",i](' + bbox + ');');
        } else {
          clauses.push(kind + '["amenity"~"^(' + amenity + ')$"]["name"](' + bbox + ');');
        }
      });
    });

    return '[out:json][timeout:25];(' + clauses.join('') + ');out center tags 40;';
  }

  // Everything edible in the box, for the aggregator rather than for a dish.
  // Wider than the dish query on purpose: this is the question "what is around
  // me", so a bakery, an ice cream shop and a pub all belong in the answer
  // where a search for ramen would rightly throw them out.
  function browseQuery(box) {
    var clauses = [];
    var amenity = AMENITIES.join('|');
    var shop = SHOPS.join('|');
    splitBox(box).forEach(function (part) {
      var bbox = [part.south, part.west, part.north, part.east].map(function (n) {
        return n.toFixed(5);
      }).join(',');
      ['node', 'way'].forEach(function (kind) {
        clauses.push(kind + '["amenity"~"^(' + amenity + ')$"]["name"](' + bbox + ');');
        clauses.push(kind + '["shop"~"^(' + shop + ')$"]["name"](' + bbox + ');');
      });
    });
    return '[out:json][timeout:25];(' + clauses.join('') + ');out center tags 120;';
  }

  function addressOf(tags) {
    var parts = [];
    if (tags['addr:housenumber'] && tags['addr:street']) {
      parts.push(tags['addr:housenumber'] + ' ' + tags['addr:street']);
    } else if (tags['addr:street']) {
      parts.push(tags['addr:street']);
    }
    if (tags['addr:city']) parts.push(tags['addr:city']);
    return parts.join(', ');
  }

  // Turn a raw Overpass payload into something the interface can render.
  // Unnamed entries are dropped — an unnamed pin helps nobody.
  function parse(payload, origin) {
    var elements = (payload && payload.elements) || [];

    return elements.map(function (el) {
      var point = el.type === 'node' ? el : el.center;
      if (!point || typeof point.lat !== 'number' || typeof point.lon !== 'number') return null;
      if (!isFinite(point.lat) || !isFinite(point.lon)) return null;

      var tags = el.tags || {};
      return place({
        id: el.type + '/' + el.id,
        name: tags.name,
        lat: point.lat,
        lon: point.lon,
        kind: tidyCuisine(tags.cuisine) || tidyCuisine(tags.amenity),
        cuisine: tags.cuisine || '',
        amenity: tags.amenity || tags.shop || '',
        address: addressOf(tags),
        hours: tags.opening_hours || '',
        website: tags.website || tags['contact:website'] || '',
        source: 'overpass'
      }, origin);
    })
    .filter(Boolean)
    .sort(byDistance);
  }

  /* --------------------------------------------------------------- photon */

  // Takes one box, not a request, because a search over the date line is two
  // boxes and each needs its own URL — same reason the Overpass query is built
  // from splitBox. A viewbox running from 179.9 east to -179.9 is not a smaller
  // box, it is the whole planet minus the bit you wanted.
  function photonUrl(request, box) {
    box = box || request.box;
    var tags = AMENITIES.map(function (a) { return '&osm_tag=amenity:' + a; }).join('') +
               SHOPS.map(function (s) { return '&osm_tag=shop:' + s; }).join('');
    return PHOTON +
      '?q=' + encodeURIComponent(request.term) +
      '&lat=' + request.origin.lat.toFixed(5) +
      '&lon=' + request.origin.lon.toFixed(5) +
      '&limit=30' +
      '&bbox=' + [box.west, box.south, box.east, box.north].map(function (n) {
        return n.toFixed(5);
      }).join(',') +
      tags;
  }

  function servesFood(key, value) {
    if (key === 'amenity') return !!AMENITY_SET[value];
    if (key === 'shop') return !!SHOP_SET[value];
    return false;
  }

  function parsePhoton(payload, origin) {
    var features = (payload && payload.features) || [];

    return features.map(function (feature) {
      var props = feature.properties || {};
      var coords = (feature.geometry || {}).coordinates || [];
      if (!servesFood(props.osm_key, props.osm_value)) return null;

      var street = props.housenumber && props.street
        ? props.housenumber + ' ' + props.street
        : props.street || '';

      return place({
        id: 'photon/' + props.osm_type + props.osm_id,
        name: props.name,
        lat: coords[1],
        lon: coords[0],
        kind: tidyCuisine(props.osm_value),
        // A geocoder answers with the venue kind, never its cuisine — which is
        // exactly why a name has to count for as much as a tag below.
        amenity: props.osm_value || '',
        address: [street, props.city].filter(Boolean).join(', '),
        source: 'photon'
      }, origin);
    })
    .filter(Boolean)
    .sort(byDistance);
  }

  /* ------------------------------------------------------------ nominatim */

  function nominatimUrl(request, box) {
    box = box || request.box;
    return NOMINATIM +
      '?format=jsonv2' +
      '&q=' + encodeURIComponent(request.term) +
      // Nominatim takes any two opposite corners, left/top then right/bottom.
      '&viewbox=' + [box.west, box.north, box.east, box.south].map(function (n) {
        return n.toFixed(5);
      }).join(',') +
      '&bounded=1&limit=30&addressdetails=1';
  }

  function parseNominatim(payload, origin) {
    var results = Array.isArray(payload) ? payload : [];

    return results.map(function (row) {
      // jsonv2 calls it `category`; older responses call it `class`.
      var key = row.category || row['class'];
      if (!servesFood(key, row.type)) return null;

      var address = row.address || {};
      var street = address.house_number && address.road
        ? address.house_number + ' ' + address.road
        : address.road || '';
      var town = address.city || address.town || address.suburb || '';

      return place({
        id: 'nominatim/' + row.osm_type + row.osm_id,
        name: row.name,
        lat: parseFloat(row.lat),
        lon: parseFloat(row.lon),
        kind: tidyCuisine(row.type),
        amenity: row.type || '',
        address: [street, town].filter(Boolean).join(', '),
        source: 'nominatim'
      }, origin);
    })
    .filter(Boolean)
    .sort(byDistance);
  }

  /* ----------------------------------------------------------- merging */

  // Deduplicate: the same venue is often both a node and a building way, and now
  // also the same venue seen by three providers under three different ids.
  // Keeps whichever copy came first, which after the sort is the nearest.
  function dedupe(list) {
    var seen = [];
    return list.filter(function (candidate) {
      var clash = seen.some(function (other) {
        return other.name === candidate.name &&
               distance(other.lat, other.lon, candidate.lat, candidate.lon) < 60;
      });
      if (!clash) seen.push(candidate);
      return !clash;
    });
  }

  /* ---------------------------------------------------------- browser only */

  // The geolocation `timeout` option bounds acquiring a fix — it does NOT bound
  // waiting for someone to answer the permission prompt. Ignore that dialog and
  // neither callback ever fires, leaving the caller waiting forever, so this
  // keeps its own wall-clock guard on top.
  function currentPosition(options) {
    options = options || {};
    var fixTimeout = options.timeout || 10000;
    var hardTimeout = options.hardTimeout || fixTimeout + 5000;

    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) {
        reject(new Error('This browser cannot share your location.'));
        return;
      }

      var settled = false;
      function finish(fn, value) {
        if (settled) return;
        settled = true;
        clearTimeout(guard);
        fn(value);
      }

      var guard = setTimeout(function () {
        finish(reject, new Error('No answer to the location request. If your browser asked permission, it may still be waiting.'));
      }, hardTimeout);

      navigator.geolocation.getCurrentPosition(
        function (pos) { finish(resolve, { lat: pos.coords.latitude, lon: pos.coords.longitude }); },
        function (err) {
          finish(reject, new Error(
            err.code === 1 ? 'Location permission was declined.'
              : err.code === 3 ? 'Took too long to get a location fix.'
              : 'Could not work out where you are.'
          ));
        },
        { enableHighAccuracy: false, timeout: fixTimeout, maximumAge: 300000 }
      );
    });
  }

  // How long to wait on any one server before giving up on it.
  //
  // This used to have no timeout at all, which is the difference between "the
  // map is slow" and "the map does not work": a loaded Overpass instance holds
  // the connection open rather than refusing it, so the spinner ran forever and
  // the next server in the list was never tried.
  var PER_SERVER_MS = 16000;

  // ...but the rung as a whole gets this long, whatever any one server is doing.
  // Three providers running at once means the slow one no longer decides how
  // long the person waits: the geocoders answer in about 200 ms worldwide, and
  // Overpass contributes if it can make it inside the window.
  //
  // Four seconds, not sixteen, precisely because Overpass is now a bonus rather
  // than the map. Where it is healthy it answers a small bounding box well
  // inside this; where it is not, waiting longer only means a longer spinner in
  // front of results the geocoders already have.
  var RUNG_MS = 4000;

  function withTimeout(promise, ms, controller) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        if (controller) { try { controller.abort(); } catch (err) {} }
        reject(new Error('timeout'));
      }, ms);
      promise.then(
        function (value) { clearTimeout(timer); resolve(value); },
        function (err) { clearTimeout(timer); reject(err); }
      );
    });
  }

  // Why the last server said no, in words worth showing someone. These are free
  // community servers with a published usage policy, and being turned away is a
  // normal Tuesday rather than a bug.
  function reasonFor(status) {
    if (status === 429) return 'The map servers are rate-limiting us right now.';
    if (status === 504 || status === 502 || status === 503) return 'The map servers are busy.';
    if (status) return 'A map server answered with ' + status + '.';
    return 'Could not reach the map servers.';
  }

  function getJson(url, budget) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var request = fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (!res.ok) {
        var err = new Error('Server returned ' + res.status);
        err.status = res.status;
        throw err;
      }
      return res.json();
    });
    return withTimeout(request, budget || RUNG_MS, controller);
  }

  function postOverpass(endpoints, query, budget, index, lastReason) {
    index = index || 0;
    if (index >= endpoints.length) {
      return Promise.reject(new Error(lastReason || 'Could not reach the map servers.'));
    }

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var request = fetch(endpoints[index], {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (!res.ok) {
        var err = new Error('Server returned ' + res.status);
        err.status = res.status;
        throw err;
      }
      return res.json().then(function (payload) {
        // Remembered so the next rung of the ladder goes straight back to the
        // server that just worked.
        if (payload) payload.__endpoint = endpoints[index];
        return payload;
      });
    });

    // Never longer than the rung itself. Walking four mirrors at sixteen
    // seconds each inside a four-second rung means only the first ever gets
    // asked, and the caller waits for a result that has already been abandoned.
    var perServer = Math.min(PER_SERVER_MS, budget || RUNG_MS);

    return withTimeout(request, perServer, controller).catch(function (err) {
      // Keep why the last one failed, so the message at the end says something
      // true rather than the same sentence whatever happened.
      var reason = err && err.message === 'timeout'
        ? 'The map servers are not answering.'
        : reasonFor(err && err.status);
      return postOverpass(endpoints, query, budget, index + 1, reason);
    });
  }

  /* ------------------------------------------------------------ providers */

  // Ask a geocoder for every box the search covers — one nearly everywhere,
  // two for the strip of the world where a bounding box runs over the date
  // line — and pool what comes back. A part that fails does not lose the other:
  // half the answer beats none of it.
  function overBox(request, urlFor, parseWith) {
    var parts = splitBox(request.box);
    return Promise.all(parts.map(function (part) {
      return getJson(urlFor(request, part), request.budget).then(function (payload) {
        return parseWith(payload, request.origin);
      }, function (err) {
        if (parts.length === 1) throw err;
        return [];
      });
    })).then(function (lists) {
      return lists.reduce(function (all, list) { return all.concat(list); }, []);
    });
  }

  var PROVIDERS = [
    {
      id: 'photon',
      label: 'Photon',
      run: function (request) {
        return overBox(request, photonUrl, parsePhoton);
      }
    },
    {
      id: 'nominatim',
      label: 'Nominatim',
      run: function (request) {
        return overBox(request, nominatimUrl, parseNominatim);
      }
    },
    {
      id: 'overpass',
      label: 'Overpass',
      run: function (request) {
        var query = request.browse
          ? browseQuery(request.box)
          : buildQuery(request.dish, request.box, { loose: request.loose });
        return postOverpass(request.endpoints || ENDPOINTS, query, request.budget)
          .then(function (payload) {
            return parse(payload, request.origin);
          });
      }
    }
  ];

  // Once one provider has come back with enough to work with, the others get
  // this long to join in before the rung closes. Without it every rung waits
  // out the full deadline on whichever provider is down that day: from Riyadh,
  // with Overpass unreachable, a three-rung walk took 27 seconds to return
  // results the first provider had already produced in under one.
  var GRACE_MS = 1500;

  // Ask every provider at once and take whatever comes back inside the window.
  // Never rejects: a rung that nobody answered is a rung with no places and a
  // list of who failed, which is a different sentence from "nothing is nearby".
  function gather(providers, request, deadline, enough) {
    return new Promise(function (resolve) {
      var places = [];
      var sources = [];
      var missing = [];
      var reason = '';
      var left = providers.length;
      var done = false;
      var grace = null;

      if (!left) return resolve({ places: [], sources: [], missing: [], reason: '' });

      var stop = setTimeout(giveUp, deadline);

      function giveUp() {
        providers.forEach(function (p) {
          if (sources.indexOf(p.id) === -1 && missing.indexOf(p.id) === -1) {
            missing.push(p.id);
            reason = reason || 'The map servers are not answering.';
          }
        });
        finish();
      }

      providers.forEach(function (provider) {
        var attempt;
        try { attempt = provider.run(request); }
        catch (err) { attempt = Promise.reject(err); }

        Promise.resolve(attempt).then(function (found) {
          sources.push(provider.id);
          (found || []).forEach(function (p) { places.push(p); });
          // Enough to show someone. Give the rest a moment, then stop waiting.
          if (!grace && enough && places.length >= enough) {
            grace = setTimeout(giveUp, GRACE_MS);
          }
        }, function (err) {
          missing.push(provider.id);
          // Never the raw error. A browser's "Failed to fetch" or "NetworkError
          // when attempting to fetch resource" is not a sentence to show
          // somebody who just wanted to know where the pizza is.
          reason = reason ||
            (err && err.message === 'timeout'
              ? 'The map servers are not answering.'
              : reasonFor(err && err.status));
        }).then(function () {
          left--;
          if (left <= 0) finish();
        });
      });

      // Snapshot on the way out. A provider that answers after the deadline has
      // passed still runs its handler, and without the copy it would be pushing
      // into arrays the caller is already holding.
      function finish() {
        if (done) return;
        done = true;
        clearTimeout(stop);
        clearTimeout(grace);
        resolve({
          places: places.slice(),
          sources: sources.slice(),
          missing: missing.slice(),
          reason: reason
        });
      }
    });
  }

  // Widen the search until something turns up, rather than reporting nothing
  // found when the first ring simply happened to be empty.
  // The ladder: wider, then less fussy. The last rung asks only for somewhere
  // that serves food, which is the rung that finds anything at all in a place
  // OpenStreetMap has not been tagged to death.
  var LADDER = [
    { radius: 1500, loose: false },
    { radius: 5000, loose: false },
    { radius: 5000, loose: true }
  ];

  var ENOUGH = 3;
  var KEEP = 12;

  /* ----------------------------------------------------------- aggregator */

  /*
   * What is actually around you, independent of anything the game decided.
   *
   * The dish search answers "where can I get this". This answers the question
   * people ask far more often and the app could not: "what are my options".
   * Same three providers, same map, but the lookup is deliberately wide — every
   * kind of food venue, shops included — and the answer is sorted into
   * categories, because twenty pins called "restaurant" is a list, not a menu.
   */

  // OSM cuisine values, in the order they are checked: the specific before the
  // general, so a place tagged "pizza;italian" lands in Pizza rather than
  // Italian. Everything here is matched against the cuisine tag first and the
  // venue kind second.
  var CATEGORIES = [
    ['Pizza',          /pizza/],
    ['Burgers',        /burger/],
    ['Japanese',       /sushi|japanese|ramen|katsu|izakaya/],
    ['Chinese',        /chinese|sichuan|dim_sum|dumpling|cantonese/],
    ['Indian',        /indian|pakistani|south_indian|tandoori|curry|balti/],
    ['Thai',           /thai/],
    ['Vietnamese',     /vietnamese|pho/],
    ['Korean',         /korean/],
    ['Italian',        /italian|pasta|lasagne/],
    ['Mexican',        /mexican|taco|burrito|tex-mex/],
    ['Middle Eastern', /kebab|turkish|lebanese|middle_eastern|falafel|arab|persian|shawarma|syrian|egyptian/],
    ['Greek',          /greek/],
    ['Seafood',        /fish_and_chips|seafood|fish|sushi_bar/],
    ['Chicken',        /chicken|wings|rotisserie/],
    ['American',       /american|steak_house|steak|bbq|barbecue|diner/],
    ['Sandwiches',     /sandwich|deli|bagel|sub|wrap/],
    ['Breakfast',      /breakfast|brunch|pancake|waffle|crepe/],
    ['Sweet',          /dessert|donut|doughnut|cake|pastry|ice_cream|gelato|chocolate|bubble_tea|frozen_yoghurt/],
    ['Coffee & tea',   /coffee|coffee_shop|tea|cafe/],
    ['African',        /african|ethiopian|moroccan|nigerian|ghanaian/],
    ['Latin American', /caribbean|jamaican|brazilian|peruvian|latin_american|argentinian|venezuelan|colombian/],
    ['Asian',          /asian|malaysian|indonesian|filipino|singaporean|noodle|wok/],
    ['Vegetarian',     /vegetarian|vegan/]
  ];

  // When nothing in the cuisine says what it is, the kind of venue does.
  var KIND_CATEGORY = {
    cafe: 'Coffee & tea', coffee: 'Coffee & tea', tea: 'Coffee & tea',
    bakery: 'Bakery', pastry: 'Bakery', confectionery: 'Bakery',
    ice_cream: 'Sweet',
    fast_food: 'Fast food',
    bar: 'Bars & pubs', pub: 'Bars & pubs',
    food_court: 'Food court',
    deli: 'Sandwiches',
    restaurant: 'Restaurants'
  };

  function categoryOf(item) {
    var cuisine = fold(item && item.cuisine);
    var amenity = fold(item && item.amenity);
    var hay = cuisine || amenity;
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (hay && CATEGORIES[i][1].test(hay)) return CATEGORIES[i][0];
    }
    return KIND_CATEGORY[amenity] || 'Other';
  }

  // Counts per category, biggest first, so the filter reads as a menu of what
  // the neighbourhood actually has rather than an alphabet of everything OSM
  // can tag.
  function groupsOf(list) {
    var counts = {};
    list.forEach(function (item) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.keys(counts).map(function (label) {
      return { label: label, count: counts[label] };
    }).sort(function (a, b) {
      return (b.count - a.count) || (a.label < b.label ? -1 : 1);
    });
  }

  var BROWSE_LADDER = [1200, 3000, 6000];
  var BROWSE_ENOUGH = 8;
  var BROWSE_KEEP = 60;

  function browse(origin, options) {
    options = options || {};
    var ladder = options.ladder || BROWSE_LADDER;
    var providers = options.providers || PROVIDERS;
    var deadline = options.deadline || RUNG_MS;
    var endpoints = options.endpoints || ENDPOINTS;
    var everAnswered = {};
    var everMissing = {};
    var giveUpOn = {};
    var lastReason = '';

    function attempt(step) {
      var radius = ladder[step];
      var request = {
        dish: null,
        spec: DEFAULT_LOOKUP,
        term: LOOSE_TERM,
        box: boxAround(origin.lat, origin.lon, radius),
        origin: origin,
        radius: radius,
        loose: true,
        browse: true,
        endpoints: endpoints,
        budget: deadline
      };

      var asking = providers.filter(function (p) { return !giveUpOn[p.id]; });

      return gather(asking, request, deadline, BROWSE_ENOUGH).then(function (round) {
        round.sources.forEach(function (id) { everAnswered[id] = true; });
        round.missing.forEach(function (id) { everMissing[id] = true; giveUpOn[id] = true; });
        if (round.reason) lastReason = round.reason;

        var found = dedupe(round.places.slice().sort(byDistance)).filter(function (p) {
          return p.metres <= radius * 1.15;
        });
        found.forEach(function (p) { p.category = categoryOf(p); });

        var last = step === ladder.length - 1;
        if (found.length >= BROWSE_ENOUGH || last) {
          if (!found.length && !Object.keys(everAnswered).length) {
            var err = new Error((lastReason || 'Could not reach the map servers.') +
              ' They are shared and free, so this happens. Try again in a minute.');
            err.offline = true;
            throw err;
          }
          var kept = found.slice(0, BROWSE_KEEP);
          return {
            places: kept,
            groups: groupsOf(kept),
            radius: radius,
            sources: Object.keys(everAnswered),
            missing: Object.keys(everMissing).filter(function (id) { return !everAnswered[id]; })
          };
        }
        return attempt(step + 1);
      });
    }

    return attempt(0);
  }

  function search(dishName, origin, options) {
    options = options || {};
    var ladder = options.ladder || LADDER;
    var providers = options.providers || PROVIDERS;
    var deadline = options.deadline || RUNG_MS;
    var endpoints = options.endpoints || ENDPOINTS;

    // Every provider that answered anything, anywhere on the ladder. If this
    // ends up empty the network is the problem; if it does not, the message has
    // to be about the neighbourhood instead.
    var everAnswered = {};
    var lastReason = '';

    // A provider that could not be reached on the first rung will not suddenly
    // become reachable on the third. Asking it again costs the full rung
    // deadline every time: from Riyadh with Overpass unreachable, that alone
    // was the difference between a five-second search and a twenty-second one.
    var giveUpOn = {};
    var everMissing = {};

    // Matches found on any rung so far. A wider rung repeats the earlier ones,
    // but a provider that answered once and timed out next time would
    // otherwise take its results with it.
    var matchedAll = [];
    function remember(list) {
      list.forEach(function (item) {
        var known = matchedAll.some(function (other) { return other.id === item.id; });
        if (!known) matchedAll.push(item);
      });
    }

    function attempt(step) {
      var rung = ladder[step];
      var request = {
        dish: dishName,
        spec: lookupFor(dishName),
        term: rung.loose ? LOOSE_TERM : termFor(dishName),
        box: boxAround(origin.lat, origin.lon, rung.radius),
        origin: origin,
        radius: rung.radius,
        loose: rung.loose,
        endpoints: endpoints,
        budget: deadline
      };

      var asking = providers.filter(function (p) { return !giveUpOn[p.id]; });

      return gather(asking, request, deadline, ENOUGH).then(function (round) {
        round.sources.forEach(function (id) { everAnswered[id] = true; });
        round.missing.forEach(function (id) {
          everMissing[id] = true;
          giveUpOn[id] = true;
        });
        if (round.reason) lastReason = round.reason;

        var near = dedupe(round.places.slice().sort(byDistance)).filter(function (p) {
          return p.metres <= rung.radius * 1.15;
        });

        // Score what came back, then keep only what has something to do with
        // the dish. Sorted by relevance first and distance second, so a
        // pizzeria 900m away beats a sandwich shop across the road when the
        // question was pizza — which is the whole point of asking.
        near.forEach(function (p) {
          p.relevance = relevanceOf(p, request.spec, request.term);
        });
        var matched = near.filter(function (p) { return p.relevance > GENERIC; });
        matched.sort(function (a, b) {
          return (b.relevance - a.relevance) || (a.metres - b.metres);
        });

        // Two cases where filtering would be the wrong thing to do. A dish with
        // no entry in the table — chicken soup, toast — has no cuisine to match
        // on, so every food place is as good an answer as any other. And the
        // loose rung is the one that already gave up on matching; it exists to
        // answer "anywhere at all", and it says so on screen.
        var untargeted = request.spec === DEFAULT_LOOKUP || rung.loose;
        if (!untargeted) remember(matched);

        var found = untargeted ? near : matched;
        var generic = untargeted || !matched.length;

        var last = step === ladder.length - 1;

        // Never dilute real matches. The next rung down is the one that gives
        // up on matching entirely and returns anywhere that serves food — so
        // taking it after finding two actual pizzerias would bury them among
        // six places that are not. Two right answers beat eight mostly wrong
        // ones, even though eight is the bigger number.
        var next = ladder[step + 1];
        var wouldGiveUp = !rung.loose && next && next.loose;
        if (wouldGiveUp && matchedAll.length) {
          matchedAll.sort(function (a, b) {
            return (b.relevance - a.relevance) || (a.metres - b.metres);
          });
          found = matchedAll;
          generic = false;
        }

        if (found.length >= ENOUGH || last || (wouldGiveUp && matchedAll.length)) {
          if (!found.length && !Object.keys(everAnswered).length) {
            var err = new Error((lastReason || 'Could not reach the map servers.') +
              ' They are shared and free, so this happens. Try again in a minute.');
            err.offline = true;
            throw err;
          }
          return {
            places: found.slice(0, KEEP),
            radius: rung.radius,
            loose: rung.loose,
            // Whether these are places that match the dish or just places.
            // The screen has to be able to tell the difference, because
            // listing three kebab shops under "pizza places" is the app
            // lying about what it found.
            generic: generic,
            matched: matched.length,
            sources: Object.keys(everAnswered),
            missing: Object.keys(everMissing).filter(function (id) {
              return !everAnswered[id];
            })
          };
        }
        return attempt(step + 1);
      });
    }

    return attempt(0);
  }

  return {
    ENDPOINTS: ENDPOINTS,
    PHOTON: PHOTON,
    NOMINATIM: NOMINATIM,
    PER_SERVER_MS: PER_SERVER_MS,
    RUNG_MS: RUNG_MS,
    GRACE_MS: GRACE_MS,
    ENOUGH: ENOUGH,
    LADDER: LADDER,
    PROVIDERS: PROVIDERS,
    AMENITIES: AMENITIES,
    SHOPS: SHOPS,
    LOOSE_TERM: LOOSE_TERM,
    reasonFor: reasonFor,
    LOOKUP: LOOKUP,
    DEFAULT_LOOKUP: DEFAULT_LOOKUP,
    lookupFor: lookupFor,
    termFor: termFor,
    buildQuery: buildQuery,
    photonUrl: photonUrl,
    nominatimUrl: nominatimUrl,
    boxAround: boxAround,
    splitBox: splitBox,
    wrapLon: wrapLon,
    distance: distance,
    bearing: bearing,
    compass: compass,
    formatDistance: formatDistance,
    usesMiles: usesMiles,
    relevanceOf: relevanceOf,
    signMatches: signMatches,
    SIGNS: SIGNS,
    STRONG: STRONG,
    PLAUSIBLE: PLAUSIBLE,
    GENERIC: GENERIC,
    categoryOf: categoryOf,
    groupsOf: groupsOf,
    browseQuery: browseQuery,
    browse: browse,
    BROWSE_LADDER: BROWSE_LADDER,
    parse: parse,
    parsePhoton: parsePhoton,
    parseNominatim: parseNominatim,
    dedupe: dedupe,
    gather: gather,
    currentPosition: currentPosition,
    search: search
  };
});
