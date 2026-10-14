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
