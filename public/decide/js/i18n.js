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
   * speak is no use to the person who needs it. Somebody looking for Thai
   * is looking for "ภาษาไทย".
   */
  var LANGS = [
    { id: 'en', native: 'English',          english: 'English', flag: '\u{1F1EC}\u{1F1E7}', dir: 'ltr' },
    { id: 'ms', native: 'Bahasa Melayu',    english: 'Malay (Malaysia)', flag: '\u{1F1F2}\u{1F1FE}', dir: 'ltr' },
    { id: 'th', native: 'ภาษาไทย',          english: 'Thai (Thailand)', flag: '\u{1F1F9}\u{1F1ED}', dir: 'ltr' },
    { id: 'hi', native: 'हिन्दी',            english: 'Hindi (India)', flag: '\u{1F1EE}\u{1F1F3}', dir: 'ltr' },
    { id: 'ar', native: 'العربية',          english: 'Arabic', flag: '\u{1F310}', dir: 'rtl' }
  ];

  /*
   * The words. Keys are dotted by area so a missing one is obvious in a diff.
   * English is absent on purpose — it is in the markup, and a second copy here
   * is a second thing to keep in step.
   */
  var STRINGS = {
    ms: {
      'nav.decide': 'Pilih', 'nav.dishes': 'Hidangan', 'nav.menu': 'Menu',
      'nav.nearby': 'Berdekatan', 'nav.ask': 'Tanya', 'nav.news': 'Berita',
      'nav.profile': 'Profil', 'nav.language': 'Bahasa',
      'top.premium': 'Premium', 'top.signin': 'Log masuk',
      'lang.title': 'Pilih bahasa anda',
      'lang.eyebrow': 'Bahasa',
      'lang.sub': 'Aplikasi bertukar serta-merta. Anda boleh menukarnya bila-bila masa dari tab Profil.',
      'lang.note': 'Hidangan, resipi dan berita kekal dalam bahasa Inggeris buat masa ini — pelayar anda boleh menterjemahkannya jika anda minta.',
      'lang.ai': 'Jawapan daripada AI akan datang dalam bahasa anda.',
      'lang.warn': 'Halaman ini telah diterjemahkan. Ada bahagian yang mungkin kedengaran janggal atau tidak tepat — teks asal dalam bahasa Inggeris.',
      'lang.current': 'Sedang digunakan',
      'lang.choose': 'Teruskan',
      'landing.ask': 'Anda lapar.<br>Anda tak tahu nak makan apa.<br><em>Itulah gunanya saya.</em>',
      'landing.sub': 'Beberapa soalan pilih-satu yang mudah — manis atau masin, panas atau sejuk. Kemudian satu jawapan, lengkap dengan resipinya. Hampir tapi belum tepat? Minta yang lebih ringan, lebih pedas, lebih cepat, dan saya jawab semula begitu.',
      'landing.start': 'Pilihkan untuk saya',
      'landing.tonight': 'Pilihan malam ini',
      'landing.browse': 'Lihat menu',
      'landing.nearby': 'Lihat apa yang berdekatan',
      'landing.askai': 'Tanya nak makan apa',
      'landing.news': 'Baca tentang makanan',
      'landing.invite': 'Pilih bersama kawan',
      'landing.dishes': 'hidangan',
      'landing.questions': 'soalan sehingga jawapan',
      'landing.recipes': 'resipi',
      'view.nearby': 'Berdekatan dengan anda', 'view.ask': 'Tanya apa sahaja',
      'view.news': 'Berita makanan', 'view.menu': 'Menu malam ini',
      'view.dishes': 'Hidangan', 'view.profile': 'Profil anda',
      'eyebrow.aroundyou': 'Sekeliling anda', 'eyebrow.worthreading': 'Berbaloi dibaca',
      'eyebrow.feeding': 'Memberi makan', 'eyebrow.thelist': 'Senarai',
      'eyebrow.you': 'Anda', 'eyebrow.premium': 'Premium',
      'btn.back': 'Kembali', 'btn.done': 'Selesai', 'btn.tryagain': 'Cuba lagi',
      'btn.startover': 'Mula semula', 'btn.nevermind': 'Tak apa, kembali',
      'btn.decideagain': 'Pilih lagi', 'btn.yes': 'Ya', 'btn.no': 'Tidak',
      'btn.either': 'Mana-mana', 'btn.neither': 'Tak kedua-duanya'
    },
    th: {
      'nav.decide': 'ตัดสินใจ', 'nav.dishes': 'อาหาร', 'nav.menu': 'เมนู',
      'nav.nearby': 'ใกล้ฉัน', 'nav.ask': 'ถาม', 'nav.news': 'ข่าว',
      'nav.profile': 'โปรไฟล์', 'nav.language': 'ภาษา',
      'top.premium': 'Premium', 'top.signin': 'เข้าสู่ระบบ',
      'lang.title': 'เลือกภาษาของคุณ',
      'lang.eyebrow': 'ภาษา',
      'lang.sub': 'แอปเปลี่ยนภาษาทันที คุณเปลี่ยนได้ทุกเมื่อจากแท็บโปรไฟล์',
      'lang.note': 'อาหาร สูตร และข่าวยังเป็นภาษาอังกฤษไปก่อน — เบราว์เซอร์ของคุณแปลให้ได้หากคุณสั่ง',
      'lang.ai': 'คำตอบจาก AI จะมาเป็นภาษาของคุณ',
      'lang.warn': 'หน้านี้ถูกแปลแล้ว บางส่วนอาจอ่านแปลกหรือไม่ถูกต้อง — ต้นฉบับเป็นภาษาอังกฤษ',
      'lang.current': 'ใช้อยู่',
      'lang.choose': 'ต่อไป',
      'landing.ask': 'คุณหิว<br>แต่ไม่รู้ว่าอยากกินอะไร<br><em>นั่นแหละคือหน้าที่ของฉัน</em>',
      'landing.sub': 'คำถามเลือกข้อใดข้อหนึ่งง่าย ๆ ไม่กี่ข้อ — หวานหรือเค็ม ร้อนหรือเย็น แล้วได้คำตอบเดียวพร้อมสูตรอาหาร ใกล้เคียงแต่ยังไม่ใช่? บอกให้เบาลง เผ็ดขึ้น หรือเร็วขึ้น แล้วฉันจะตอบใหม่ตามนั้น',
      'landing.start': 'ตัดสินใจให้ฉัน',
      'landing.tonight': 'เมนูเด็ดคืนนี้',
      'landing.browse': 'ดูเมนู',
      'landing.nearby': 'ดูของกินใกล้คุณ',
      'landing.askai': 'ถามว่าจะกินอะไรดี',
      'landing.news': 'อ่านเรื่องอาหาร',
      'landing.invite': 'ตัดสินใจกับเพื่อน',
      'landing.dishes': 'เมนู',
      'landing.questions': 'คำถามกว่าจะได้คำตอบ',
      'landing.recipes': 'สูตร',
      'view.nearby': 'ใกล้คุณ', 'view.ask': 'ถามได้ทุกเรื่อง',
      'view.news': 'ข่าวอาหาร', 'view.menu': 'เมนูคืนนี้',
      'view.dishes': 'อาหาร', 'view.profile': 'โปรไฟล์ของคุณ',
      'eyebrow.aroundyou': 'รอบตัวคุณ', 'eyebrow.worthreading': 'น่าอ่าน',
      'eyebrow.feeding': 'เลี้ยงปากท้อง', 'eyebrow.thelist': 'รายการ',
      'eyebrow.you': 'คุณ', 'eyebrow.premium': 'Premium',
      'btn.back': 'กลับ', 'btn.done': 'เสร็จสิ้น', 'btn.tryagain': 'ลองอีกครั้ง',
      'btn.startover': 'เริ่มใหม่', 'btn.nevermind': 'ช่างเถอะ ย้อนกลับ',
      'btn.decideagain': 'ตัดสินใจอีกครั้ง', 'btn.yes': 'ใช่', 'btn.no': 'ไม่',
      'btn.either': 'อะไรก็ได้', 'btn.neither': 'ไม่ทั้งสองอย่าง'
    },
    hi: {
      'nav.decide': 'चुनें', 'nav.dishes': 'व्यंजन', 'nav.menu': 'मेन्यू',
      'nav.nearby': 'आस-पास', 'nav.ask': 'पूछें', 'nav.news': 'खबरें',
      'nav.profile': 'प्रोफ़ाइल', 'nav.language': 'भाषा',
      'top.premium': 'Premium', 'top.signin': 'साइन इन',
      'lang.title': 'अपनी भाषा चुनें',
      'lang.eyebrow': 'भाषा',
      'lang.sub': 'ऐप तुरंत बदल जाता है। आप जब चाहें प्रोफ़ाइल टैब से इसे फिर बदल सकते हैं।',
      'lang.note': 'व्यंजन, रेसिपी और खबरें अभी अंग्रेज़ी में ही रहेंगी — आप कहें तो आपका ब्राउज़र इनका अनुवाद कर सकता है।',
      'lang.ai': 'AI के जवाब आपकी भाषा में आएँगे।',
      'lang.warn': 'इस पेज का अनुवाद किया गया है। कुछ हिस्से अटपटे या गलत लग सकते हैं — मूल पाठ अंग्रेज़ी में है।',
      'lang.current': 'चालू',
      'lang.choose': 'आगे बढ़ें',
      'landing.ask': 'आपको भूख लगी है।<br>पता नहीं क्या खाना है।<br><em>इसीलिए तो मैं हूँ।</em>',
      'landing.sub': 'कुछ आसान या-तो-वह सवाल — मीठा या नमकीन, गरम या ठंडा। फिर एक जवाब, साथ में रेसिपी। करीब है पर ठीक नहीं? हल्का, तीखा या जल्दी बनने वाला बताइए, और जवाब उसी हिसाब से फिर बदल जाएगा।',
      'landing.start': 'मेरे लिए चुनो',
      'landing.tonight': 'आज रात की पसंद',
      'landing.browse': 'मेन्यू देखें',
      'landing.nearby': 'आस-पास देखें',
      'landing.askai': 'पूछें क्या खाएँ',
      'landing.news': 'खाने के बारे में पढ़ें',
      'landing.invite': 'दोस्त के साथ चुनें',
      'landing.dishes': 'व्यंजन',
      'landing.questions': 'सवालों में जवाब',
      'landing.recipes': 'रेसिपी',
      'view.nearby': 'आपके आस-पास', 'view.ask': 'कुछ भी पूछें',
      'view.news': 'खाने की खबरें', 'view.menu': 'आज रात का मेन्यू',
      'view.dishes': 'व्यंजन', 'view.profile': 'आपकी प्रोफ़ाइल',
      'eyebrow.aroundyou': 'आपके आस-पास', 'eyebrow.worthreading': 'पढ़ने लायक',
      'eyebrow.feeding': 'खिलाना', 'eyebrow.thelist': 'सूची',
      'eyebrow.you': 'आप', 'eyebrow.premium': 'Premium',
      'btn.back': 'वापस', 'btn.done': 'हो गया', 'btn.tryagain': 'फिर कोशिश करें',
      'btn.startover': 'फिर से शुरू करें', 'btn.nevermind': 'छोड़ो, वापस चलो',
      'btn.decideagain': 'फिर से चुनें', 'btn.yes': 'हाँ', 'btn.no': 'नहीं',
      'btn.either': 'कोई भी', 'btn.neither': 'दोनों नहीं'
    },
    ar: {
      'nav.decide': 'قرّر', 'nav.dishes': 'الأطباق', 'nav.menu': 'القائمة',
      'nav.nearby': 'بالقرب', 'nav.ask': 'اسأل', 'nav.news': 'الأخبار',
      'nav.profile': 'الملف الشخصي', 'nav.language': 'اللغة',
      'top.premium': 'Premium', 'top.signin': 'تسجيل الدخول',
      'lang.title': 'اختر لغتك',
      'lang.eyebrow': 'اللغة',
      'lang.sub': 'يتغيّر التطبيق فورًا. يمكنك تغييرها في أي وقت من الملف الشخصي.',
      'lang.note': 'تبقى الأطباق والوصفات والأخبار بالإنجليزية في الوقت الحالي — يستطيع متصفحك ترجمتها إن طلبت منه ذلك.',
      'lang.ai': 'ستصلك إجابات الذكاء الاصطناعي بلغتك.',
      'lang.warn': 'تمت ترجمة هذه الصفحة. قد يبدو بعضها غريبًا أو غير دقيق — النص الأصلي بالإنجليزية.',
      'lang.current': 'قيد الاستخدام',
      'lang.choose': 'متابعة',
      'landing.ask': 'أنت جائع.<br>ولا تعرف ماذا تريد أن تأكل.<br><em>وهذا ما وُجدت من أجله.</em>',
      'landing.sub': 'بضعة أسئلة سهلة من نوع «هذا أم ذاك» — حلو أم مالح، ساخن أم بارد. ثم إجابة واحدة، ومعها الوصفة. قريب لكن ليس تمامًا؟ اطلب أخفّ أو أحرّ أو أسرع، وسأجيب من جديد على هذا الأساس.',
      'landing.start': 'قرّر عني',
      'landing.tonight': 'اختيار الليلة',
      'landing.browse': 'تصفّح القائمة',
      'landing.nearby': 'شاهد ما حولك',
      'landing.askai': 'اسأل ماذا تأكل',
      'landing.news': 'اقرأ عن الطعام',
      'landing.invite': 'قرّر مع صديق',
      'landing.dishes': 'طبق',
      'landing.questions': 'أسئلة حتى الإجابة',
      'landing.recipes': 'وصفة',
      'view.nearby': 'بالقرب منك', 'view.ask': 'اسأل أي شيء',
      'view.news': 'أخبار الطعام', 'view.menu': 'قائمة الليلة',
      'view.dishes': 'الأطباق', 'view.profile': 'ملفك الشخصي',
      'eyebrow.aroundyou': 'من حولك', 'eyebrow.worthreading': 'يستحق القراءة',
      'eyebrow.feeding': 'إطعام الناس', 'eyebrow.thelist': 'القائمة',
      'eyebrow.you': 'أنت', 'eyebrow.premium': 'Premium',
      'btn.back': 'رجوع', 'btn.done': 'تم', 'btn.tryagain': 'حاول مرة أخرى',
      'btn.startover': 'ابدأ من جديد', 'btn.nevermind': 'لا بأس، ارجع',
      'btn.decideagain': 'قرّر مجددًا', 'btn.yes': 'نعم', 'btn.no': 'لا',
      'btn.either': 'أيّهما', 'btn.neither': 'لا هذا ولا ذاك'
    }
  };

  var lang = 'en';

  /*
   * The browser's own preference, used only to pick what the first-run chooser
   * highlights. Never used to decide silently: a Thai phone handed a Thai
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

  function dirOf(id) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].id === id) return LANGS[i].dir || 'ltr';
    return 'ltr';
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
    // Arabic runs right to left; every other language here runs left to right.
    document.documentElement.setAttribute('dir', dirOf(lang));
    if (document.body) { walk(document.body); watch(); }

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


  /*
   * THE REST OF THE APP: every other word on the screen.
   *
   * The curated STRINGS above are keyed by data-i18n; everything else - the
   * hundreds of lines in the markup and the ones the scripts write at run
   * time - is translated by its own English. A dictionary per language, in
   * js/lang-<id>.js, maps an English line to its translation; this walks the
   * page, swaps any text node whose whole text is in it, and keeps watching so
   * a line written later is swapped as it appears. English stays the source:
   * the original is remembered on each node, so going back is a restore, and
   * a line with no translation simply stays English rather than showing a key.
   *
   * Lines with a number or a name in them are matched by pattern instead -
   * "{0} in a row" - see PATTERNS in the dictionary files.
   */
  var DICTS = {};
  var PATTERNS = {};
  var seen = new WeakMap();      // text node -> { en, out }
  var seenAttr = new WeakMap();  // element -> { attr: { en, out } }
  var observer = null;
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];

  var here = document.currentScript;
  var version = here && here.src ? (here.src.match(/[?&]v=([^&]+)/) || [])[1] : '';

  function norm(text) { return text.replace(/\s+/g, ' ').trim(); }

  function patternsFor(id) {
    if (PATTERNS[id]) return PATTERNS[id];
    var list = [];
    var src = (window.I18N_PATTERNS && window.I18N_PATTERNS[id]) || [];
    src.forEach(function (pair) {
      var re = pair[0].replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\d)\}/g, '(.+?)');
      list.push({ re: new RegExp('^' + re + '$'), to: pair[1] });
    });
    PATTERNS[id] = list;
    return list;
  }

  /* The translation of one line, or null when there is none. */
  function lookup(en) {
    var table = window.I18N_DICT && window.I18N_DICT[lang];
    if (!table) return null;
    var key = norm(en);
    if (!key) return null;
    var hit = table[key];
    if (typeof hit === 'string') return hit;
    var pats = patternsFor(lang);
    for (var i = 0; i < pats.length; i++) {
      var m = key.match(pats[i].re);
      if (m) return pats[i].to.replace(/\{(\d)\}/g, function (_, n) {
        var part = m[Number(n) + 1];
        if (part === undefined) return '';
        // A captured name that has its own translation ("Meal planner") gets it.
        return typeof table[part] === 'string' ? table[part] : part;
      });
    }
    // A line that leads with an emoji ("\u{1F3B7} Jazz"): the words are translated, the emoji kept.
    var lead = key.match(/^(\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*)\s+(.+)$/u);
    if (lead && typeof table[lead[2]] === 'string') return lead[1] + ' ' + table[lead[2]];
    return null;
  }

  function skipped(node) {
    var el = node.parentElement;
    if (!el) return true;
    var tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'NOSCRIPT') return true;
    // Curated lines are the dictionary's own business, not this walker's.
    return !!el.closest('[data-i18n],[data-i18n-html],[data-no-i18n]');
  }

  function syncText(node) {
    if (skipped(node)) return;
    var s = seen.get(node);
    var en = s && node.nodeValue === s.out ? s.en : node.nodeValue;
    var out = lang === 'en' ? null : lookup(en);
    if (out === null) {
      if (s) { seen.delete(node); if (node.nodeValue !== en) node.nodeValue = en; }
      return;
    }
    // Keep the whitespace around the line: it is layout, and not ours to drop.
    var lead = en.match(/^\s*/)[0];
    var trail = en.match(/\s*$/)[0];
    out = lead + out + trail;
    seen.set(node, { en: en, out: out });
    if (node.nodeValue !== out) node.nodeValue = out;
  }

  function syncAttr(el, attr) {
    var cur = el.getAttribute(attr);
    if (cur === null) return;
    var rec = seenAttr.get(el) || {};
    var s = rec[attr];
    var en = s && cur === s.out ? s.en : cur;
    var out = lang === 'en' ? null : lookup(en);
    if (out === null) {
      if (s) { delete rec[attr]; if (cur !== en) el.setAttribute(attr, en); }
      return;
    }
    rec[attr] = { en: en, out: out };
    seenAttr.set(el, rec);
    if (cur !== out) el.setAttribute(attr, out);
  }

  function walk(root) {
    if (root.nodeType === 3) return syncText(root);
    if (root.nodeType !== 1) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var n;
    var nodes = [];
    while ((n = w.nextNode())) nodes.push(n);
    for (var i = 0; i < nodes.length; i++) syncText(nodes[i]);
    var withAttrs = [root].concat([].slice.call(root.querySelectorAll('[placeholder],[aria-label],[title],[alt]')));
    withAttrs.forEach(function (el) {
      ATTRS.forEach(function (a) { if (el.hasAttribute && el.hasAttribute(a)) syncAttr(el, a); });
    });
  }

  function watch() {
    if (observer || !window.MutationObserver) return;
    observer = new MutationObserver(function (records) {
      records.forEach(function (r) {
        if (r.type === 'characterData') syncText(r.target);
        else if (r.type === 'attributes') syncAttr(r.target, r.attributeName);
        else r.addedNodes.forEach(function (n) { walk(n); });
      });
    });
    observer.observe(document.body, {
      childList: true, characterData: true, subtree: true,
      attributes: true, attributeFilter: ATTRS
    });
  }

  function loadDict(id, done) {
    if (id === 'en' || (window.I18N_DICT && window.I18N_DICT[id])) return done();
    var tag = document.createElement('script');
    tag.src = 'js/lang-' + id + '.js' + (version ? '?v=' + version : '');
    tag.onload = done;
    // A dictionary that will not load leaves the app in English, which is the
    // fallback it was always going to have.
    tag.onerror = done;
    document.head.appendChild(tag);
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
      // The dictionary for the rest of the page arrives after the first paint
      // of the curated lines; when it lands the page is walked again.
      var asked = lang;
      loadDict(asked, function () { if (lang === asked) apply(); });
      return lang;
    }
  };
})();
