/*
 * Languages.
 *
 * WHY THIS IS A DICTIONARY AND NOT A TRANSLATE WIDGET.
 *
 * The obvious answer was Google's Website Translator — drop in a script, get
 * every language. It is gone: unavailable to commercial sites since 2019, and
 * switched off entirely on 1 October 2026. The paid Cloud Translation API
 * wants a card. So the app carries its own words.
 *
 * ENGLISH IS THE SOURCE AND IT STAYS IN THE MARKUP. Every translatable node
 * keeps its English text in the HTML and carries data-i18n="key". Nothing is
 * blank before this file runs, nothing flashes a key on a slow load, and a
 * missing translation falls back to a real sentence rather than to "nav.ask".
 * The original is stashed on the node the first time it is swapped, so
 * switching back to English is a restore rather than a second dictionary.
 *
 * WHAT IS NOT IN HERE, and why that is deliberate. The 133 dish blurbs and the
 * 146 recipes are about twenty thousand words. Machine-dumping those would
 * make the app's own voice worse in four languages at once, and a mistranslated
 * cooking step is how somebody ruins a dinner. Those stay English, and setting
 * <html lang> correctly (see apply) is what lets the browser's own translator
 * offer to do them — free, on the reader's terms, and clearly marked as a
 * machine translation rather than passed off as ours.
 */
window.I18n = (function () {
  'use strict';

  /*
   * Native names, because a language list written in the language you already
   * speak is no use to the person who needs it. Somebody looking for German
   * is looking for "Deutsch".
   */
  var LANGS = [
    { id: 'en', native: 'English',  english: 'English', flag: '\u{1F1EC}\u{1F1E7}' },
    { id: 'es', native: 'Español', english: 'Spanish', flag: '\u{1F1EA}\u{1F1F8}' },
    { id: 'fr', native: 'Français', english: 'French', flag: '\u{1F1EB}\u{1F1F7}' },
    { id: 'de', native: 'Deutsch',  english: 'German', flag: '\u{1F1E9}\u{1F1EA}' }
  ];

  /*
   * The words. Keys are dotted by area so a missing one is obvious in a diff.
   * English is absent on purpose — it is in the markup, and a second copy here
   * is a second thing to keep in step.
   */
  var STRINGS = {
    es: {
      'nav.decide': 'Decidir', 'nav.dishes': 'Platos', 'nav.menu': 'Menú',
      'nav.nearby': 'Cerca', 'nav.ask': 'Preguntar', 'nav.news': 'Noticias',
      'nav.profile': 'Perfil', 'nav.language': 'Idioma',
      'top.premium': 'Premium', 'top.signin': 'Iniciar sesión',
      'lang.title': 'Elige tu idioma',
      'lang.eyebrow': 'Idioma',
      'lang.sub': 'La aplicación cambia al instante. Puedes cambiarlo cuando quieras desde esta pestaña.',
      'lang.note': 'Los platos, las recetas y las noticias siguen en inglés por ahora — tu navegador puede traducirlos si se lo pides.',
      'lang.ai': 'Las respuestas de la IA llegarán en tu idioma.',
      'lang.warn': 'Esta p\u00e1gina est\u00e1 traducida. Puede que algo suene raro o est\u00e9 mal \u2014 el original est\u00e1 en ingl\u00e9s.',
      'lang.current': 'En uso',
      'lang.choose': 'Continuar',
      'landing.ask': 'Tienes hambre.<br>No sabes qué quieres.<br><em>No pasa nada — puede que yo sí.</em>',
      'landing.sub': 'Unas cuantas preguntas fáciles — dulce o salado, caliente o frío, manos o cubiertos — y averiguamos qué te apetece de verdad. Suelen bastar ocho preguntas.',
      'landing.start': 'Decide por mí',
      'landing.tonight': 'La elección de hoy',
      'landing.browse': 'Ver la carta',
      'landing.nearby': 'Mira qué tienes cerca',
      'landing.askai': 'Pregunta qué comer',
      'landing.news': 'Lee sobre comida',
      'landing.invite': 'Decidir con un amigo',
      'landing.dishes': 'platos',
      'landing.questions': 'preguntas hasta la respuesta',
      'landing.recipes': 'recetas',
      'view.nearby': 'Cerca de ti', 'view.ask': 'Pregunta lo que quieras',
      'view.news': 'Noticias de comida', 'view.menu': 'El menú de hoy',
      'view.dishes': 'Platos', 'view.profile': 'Tu perfil',
      'eyebrow.aroundyou': 'A tu alrededor', 'eyebrow.worthreading': 'Vale la pena leerlo',
      'eyebrow.feeding': 'Dar de comer', 'eyebrow.thelist': 'La lista',
      'eyebrow.you': 'Tú', 'eyebrow.premium': 'Premium',
      'btn.back': 'Atrás', 'btn.done': 'Listo', 'btn.tryagain': 'Inténtalo otra vez',
      'btn.startover': 'Empezar de nuevo', 'btn.nevermind': 'Déjalo, vuelve atrás',
      'btn.decideagain': 'Decidir otra vez', 'btn.yes': 'Sí', 'btn.no': 'No',
      'btn.either': 'Cualquiera', 'btn.neither': 'Ninguno'
    },
    fr: {
      'nav.decide': 'Décider', 'nav.dishes': 'Plats', 'nav.menu': 'Menu',
      'nav.nearby': 'À côté', 'nav.ask': 'Demander', 'nav.news': 'Actus',
      'nav.profile': 'Profil', 'nav.language': 'Langue',
      'top.premium': 'Premium', 'top.signin': 'Se connecter',
      'lang.title': 'Choisis ta langue',
      'lang.eyebrow': 'Langue',
      'lang.sub': "L'application change tout de suite. Tu peux en changer quand tu veux depuis cet onglet.",
      'lang.note': 'Les plats, les recettes et les actus restent en anglais pour le moment — ton navigateur peut les traduire si tu le lui demandes.',
      'lang.ai': "Les réponses de l'IA arriveront dans ta langue.",
      'lang.warn': 'Cette page est traduite. Certaines tournures peuvent sonner faux ou \u00eatre inexactes \u2014 la version d\u2019origine est en anglais.',
      'lang.current': 'Utilisée',
      'lang.choose': 'Continuer',
      'landing.ask': 'Tu as faim.<br>Tu ne sais pas quoi manger.<br><em>Ce n’est rien — moi peut-être.</em>',
      'landing.sub': 'Quelques questions faciles — sucré ou salé, chaud ou froid, à la main ou à la fourchette — et on trouve ce dont tu as vraiment envie. Huit questions en général.',
      'landing.start': 'Décide pour moi',
      'landing.tonight': 'Le plat du soir',
      'landing.browse': 'Voir la carte',
      'landing.nearby': 'Regarde ce qu’il y a à côté',
      'landing.askai': 'Demande quoi manger',
      'landing.news': 'Lis des articles sur la cuisine',
      'landing.invite': 'Décider à deux',
      'landing.dishes': 'plats',
      'landing.questions': 'questions jusqu’à la réponse',
      'landing.recipes': 'recettes',
      'view.nearby': 'À côté de toi', 'view.ask': 'Demande ce que tu veux',
      'view.news': 'Actus cuisine', 'view.menu': 'Le menu de ce soir',
      'view.dishes': 'Plats', 'view.profile': 'Ton profil',
      'eyebrow.aroundyou': 'Autour de toi', 'eyebrow.worthreading': 'À lire',
      'eyebrow.feeding': 'Nourrir du monde', 'eyebrow.thelist': 'La liste',
      'eyebrow.you': 'Toi', 'eyebrow.premium': 'Premium',
      'btn.back': 'Retour', 'btn.done': 'Terminé', 'btn.tryagain': 'Réessayer',
      'btn.startover': 'Recommencer', 'btn.nevermind': 'Laisse tomber, reviens en arrière',
      'btn.decideagain': 'Décider encore', 'btn.yes': 'Oui', 'btn.no': 'Non',
      'btn.either': 'Les deux', 'btn.neither': 'Ni l’un ni l’autre'
    },
    de: {
      'nav.decide': 'Entscheiden', 'nav.dishes': 'Gerichte', 'nav.menu': 'Menü',
      'nav.nearby': 'In der Nähe', 'nav.ask': 'Fragen', 'nav.news': 'News',
      'nav.profile': 'Profil', 'nav.language': 'Sprache',
      'top.premium': 'Premium', 'top.signin': 'Anmelden',
      'lang.title': 'Wähl deine Sprache',
      'lang.eyebrow': 'Sprache',
      'lang.sub': 'Die App stellt sofort um. Du kannst sie jederzeit über diesen Tab wechseln.',
      'lang.note': 'Gerichte, Rezepte und News bleiben vorerst auf Englisch — dein Browser kann sie übersetzen, wenn du ihn darum bittest.',
      'lang.ai': 'Die KI antwortet dir in deiner Sprache.',
      'lang.warn': 'Diese Seite ist \u00fcbersetzt. Manches klingt vielleicht schief oder ist schlicht falsch \u2014 das Original ist auf Englisch.',
      'lang.current': 'Aktiv',
      'lang.choose': 'Weiter',
      'landing.ask': 'Du hast Hunger.<br>Du weißt nicht, worauf.<br><em>Halb so wild — ich vielleicht schon.</em>',
      'landing.sub': 'Ein paar einfache Entweder-oder — süß oder herzhaft, heiß oder kalt, mit den Händen oder mit Besteck — und wir finden heraus, worauf du wirklich Lust hast. Meistens in acht Fragen.',
      'landing.start': 'Entscheide für mich',
      'landing.tonight': 'Das Gericht für heute',
      'landing.browse': 'Die Karte ansehen',
      'landing.nearby': 'Schau, was in der Nähe ist',
      'landing.askai': 'Frag, was du essen sollst',
      'landing.news': 'Über Essen lesen',
      'landing.invite': 'Zu zweit entscheiden',
      'landing.dishes': 'Gerichte',
      'landing.questions': 'Fragen bis zur Antwort',
      'landing.recipes': 'Rezepte',
      'view.nearby': 'In deiner Nähe', 'view.ask': 'Frag, was du willst',
      'view.news': 'Essens-News', 'view.menu': 'Das Menü für heute',
      'view.dishes': 'Gerichte', 'view.profile': 'Dein Profil',
      'eyebrow.aroundyou': 'Um dich herum', 'eyebrow.worthreading': 'Lesenswert',
      'eyebrow.feeding': 'Leute satt bekommen', 'eyebrow.thelist': 'Die Liste',
      'eyebrow.you': 'Du', 'eyebrow.premium': 'Premium',
      'btn.back': 'Zurück', 'btn.done': 'Fertig', 'btn.tryagain': 'Nochmal versuchen',
      'btn.startover': 'Von vorn', 'btn.nevermind': 'Schon gut, zurück',
      'btn.decideagain': 'Nochmal entscheiden', 'btn.yes': 'Ja', 'btn.no': 'Nein',
      'btn.either': 'Egal', 'btn.neither': 'Weder noch'
    }
  };

  var lang = 'en';

  /*
   * The browser's own preference, used only to pick what the first-run chooser
   * highlights. Never used to decide silently: a Spanish phone handed a Spanish
   * app with no say in it is a good guess taken too far, and the one thing
   * worse than the wrong language is the wrong language with no visible way
   * out. navigator.languages is ordered by preference, so the first one this
   * app actually speaks wins.
   */
  function guess() {
    var want = (navigator.languages && navigator.languages.length)
      ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < want.length; i++) {
      var two = String(want[i] || '').slice(0, 2).toLowerCase();
      for (var j = 0; j < LANGS.length; j++) if (LANGS[j].id === two) return two;
    }
    return 'en';
  }

  function known(id) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].id === id) return true;
    return false;
  }

  /* One string. Falls back to the English the caller passed rather than a key. */
  function t(key, english) {
    var table = STRINGS[lang];
    return (table && table[key]) || english || key;
  }

  /*
   * Swap every marked node. data-i18n sets textContent; data-i18n-html sets
   * innerHTML, for the handful of lines that carry a <br> or an <em> — kept
   * separate so that everything else is safely text and cannot smuggle markup
   * in from a dictionary.
   */
  function apply() {
    document.documentElement.setAttribute('lang', lang);

    var text = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < text.length; i++) swap(text[i], 'data-i18n', false);

    var html = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < html.length; j++) swap(html[j], 'data-i18n-html', true);

    var labels = document.querySelectorAll('[data-i18n-label]');
    for (var k = 0; k < labels.length; k++) {
      var el = labels[k];
      if (!el.dataset.i18nLabelEn) el.dataset.i18nLabelEn = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-label'), el.dataset.i18nLabelEn));
    }
  }

  function swap(el, attr, asHtml) {
    // The English in the markup is the fallback, so it is stashed before the
    // first overwrite and never read from the DOM again.
    if (el.dataset.i18nEn === undefined) {
      el.dataset.i18nEn = asHtml ? el.innerHTML : el.textContent;
    }
    var out = t(el.getAttribute(attr), el.dataset.i18nEn);
    if (asHtml) el.innerHTML = out; else el.textContent = out;
  }

  return {
    LANGS: LANGS,
    t: t,
    apply: apply,
    guess: guess,
    known: known,
    get: function () { return lang; },
    /* The name of a language, in that language. */
    nameOf: function (id) {
      for (var i = 0; i < LANGS.length; i++) if (LANGS[i].id === id) return LANGS[i].native;
      return id;
    },
    set: function (id) {
      lang = known(id) ? id : 'en';
      apply();
      return lang;
    }
  };
})();
