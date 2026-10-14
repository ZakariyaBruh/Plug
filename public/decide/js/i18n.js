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
      'lang.sub': 'Aplikasi bertukar serta-merta. Anda boleh menukarnya bila-bila masa dari tab ini.',
      'lang.note': 'Hidangan, resipi dan berita kekal dalam bahasa Inggeris buat masa ini — pelayar anda boleh menterjemahkannya jika anda minta.',
      'lang.ai': 'Jawapan daripada AI akan datang dalam bahasa anda.',
      'lang.warn': 'Halaman ini telah diterjemahkan. Ada bahagian yang mungkin kedengaran janggal atau tidak tepat — teks asal dalam bahasa Inggeris.',
      'lang.current': 'Sedang digunakan',
      'lang.choose': 'Teruskan',
      'landing.ask': 'Anda lapar.<br>Anda tak tahu nak makan apa.<br><em>Tak apa — mungkin saya tahu.</em>',
      'landing.sub': 'Beberapa soalan mudah — manis atau masin, panas atau sejuk, guna tangan atau sudu garpu — dan kami akan cari apa yang anda benar-benar teringin. Biasanya dalam lapan soalan.',
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
      'btn.either': 'Mana-mana', 'btn.neither': 'Tak kedua-duanya',
      'ad.later': 'Tidak sekarang', 'ad.never.aff': 'Bukan untuk saya', 'ad.never.plus': 'Tidak berminat'
    },
    th: {
      'nav.decide': 'ตัดสินใจ', 'nav.dishes': 'อาหาร', 'nav.menu': 'เมนู',
      'nav.nearby': 'ใกล้ฉัน', 'nav.ask': 'ถาม', 'nav.news': 'ข่าว',
      'nav.profile': 'โปรไฟล์', 'nav.language': 'ภาษา',
      'top.premium': 'Premium', 'top.signin': 'เข้าสู่ระบบ',
      'lang.title': 'เลือกภาษาของคุณ',
      'lang.eyebrow': 'ภาษา',
      'lang.sub': 'แอปเปลี่ยนภาษาทันที คุณเปลี่ยนได้ทุกเมื่อจากแท็บนี้',
      'lang.note': 'อาหาร สูตร และข่าวยังเป็นภาษาอังกฤษไปก่อน — เบราว์เซอร์ของคุณแปลให้ได้หากคุณสั่ง',
      'lang.ai': 'คำตอบจาก AI จะมาเป็นภาษาของคุณ',
      'lang.warn': 'หน้านี้ถูกแปลแล้ว บางส่วนอาจอ่านแปลกหรือไม่ถูกต้อง — ต้นฉบับเป็นภาษาอังกฤษ',
      'lang.current': 'ใช้อยู่',
      'lang.choose': 'ต่อไป',
      'landing.ask': 'คุณหิว<br>แต่ไม่รู้ว่าอยากกินอะไร<br><em>ไม่เป็นไร — บางทีฉันอาจรู้</em>',
      'landing.sub': 'คำถามง่าย ๆ ไม่กี่ข้อ — หวานหรือเค็ม ร้อนหรือเย็น ใช้มือหรือช้อนส้อม — แล้วเราจะหาให้ว่าคุณอยากกินอะไรจริง ๆ โดยปกติประมาณแปดข้อ',
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
      'btn.either': 'อะไรก็ได้', 'btn.neither': 'ไม่ทั้งสองอย่าง',
      'ad.later': 'ไม่ใช่ตอนนี้', 'ad.never.aff': 'ไม่สนใจ', 'ad.never.plus': 'ไม่สนใจ'
    },
    hi: {
      'nav.decide': 'चुनें', 'nav.dishes': 'व्यंजन', 'nav.menu': 'मेन्यू',
      'nav.nearby': 'आस-पास', 'nav.ask': 'पूछें', 'nav.news': 'खबरें',
      'nav.profile': 'प्रोफ़ाइल', 'nav.language': 'भाषा',
      'top.premium': 'Premium', 'top.signin': 'साइन इन',
      'lang.title': 'अपनी भाषा चुनें',
      'lang.eyebrow': 'भाषा',
      'lang.sub': 'ऐप तुरंत बदल जाता है। आप जब चाहें इस टैब से इसे फिर बदल सकते हैं।',
      'lang.note': 'व्यंजन, रेसिपी और खबरें अभी अंग्रेज़ी में ही रहेंगी — आप कहें तो आपका ब्राउज़र इनका अनुवाद कर सकता है।',
      'lang.ai': 'AI के जवाब आपकी भाषा में आएँगे।',
      'lang.warn': 'इस पेज का अनुवाद किया गया है। कुछ हिस्से अटपटे या गलत लग सकते हैं — मूल पाठ अंग्रेज़ी में है।',
      'lang.current': 'चालू',
      'lang.choose': 'आगे बढ़ें',
      'landing.ask': 'आपको भूख लगी है।<br>पता नहीं क्या खाना है।<br><em>कोई बात नहीं — शायद मुझे पता हो।</em>',
      'landing.sub': 'कुछ आसान सवाल — मीठा या नमकीन, गरम या ठंडा, हाथ से या चम्मच से — और हम पता लगा लेंगे कि आपका सच में क्या खाने का मन है। आम तौर पर लगभग आठ सवालों में।',
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
      'lang.sub': 'يتغيّر التطبيق فورًا. يمكنك تغييرها في أي وقت من هذا التبويب.',
      'lang.note': 'تبقى الأطباق والوصفات والأخبار بالإنجليزية في الوقت الحالي — يستطيع متصفحك ترجمتها إن طلبت منه ذلك.',
      'lang.ai': 'ستصلك إجابات الذكاء الاصطناعي بلغتك.',
      'lang.warn': 'تمت ترجمة هذه الصفحة. قد يبدو بعضها غريبًا أو غير دقيق — النص الأصلي بالإنجليزية.',
      'lang.current': 'قيد الاستخدام',
      'lang.choose': 'متابعة',
      'landing.ask': 'أنت جائع.<br>ولا تعرف ماذا تريد أن تأكل.<br><em>لا بأس — ربما أعرف أنا.</em>',
      'landing.sub': 'بضعة أسئلة سهلة — حلو أم مالح، ساخن أم بارد، باليد أم بالشوكة — ونعرف ما تشتهيه فعلًا. عادةً في نحو ثمانية أسئلة.',
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
      'btn.either': 'أيّهما', 'btn.neither': 'لا هذا ولا ذاك',
      'ad.later': 'ليس الآن', 'ad.never.aff': 'لا يهمني', 'ad.never.plus': 'غير مهتم'
    }
  };

  /*
   * The ads, translated — Malay, Thai and Arabic only.
   *
   * NOT HINDI, ON PURPOSE. The offers are shown in English to a Hindi reader,
   * buttons included, so an offer never arrives half in one language. Anything
   * absent here falls back to the English written in app.js's ADS roster, which
   * is also why a new ad needs no entry here to work: it simply shows in
   * English until somebody writes it.
   *
   * Keyed by the ad's id, each as [title, body, fine, cta]. No figure is added
   * or changed in translation — the $4.99 is the one the English carries.
   */
  var ADS = {
    ms: {
      'plus-takeaway': ['Lebih murah daripada satu pesanan bawa pulang',
        'Premium memberi anda enam lagi cara bermain, mod masak, pembina menu, dan peraturan yang tidak pernah ditanya dua kali. Sebulan penuh harganya kurang daripada satu pesanan penghantaran.',
        'Tujuh hari percuma dahulu. Permainan yang anda main kekal percuma sama ada anda langgan atau tidak.',
        'Tujuh hari percuma'],
      'plus-modes': ['Ada enam lagi permainan di sini',
        'Knockout, Blitz, Ini atau itu, Senarai pendek, Swipe dan Bersama — semuanya menunggu di sebalik satu suis. Katalog yang sama, enam cara berbeza untuk berbalah mengenainya.',
        'Tujuh hari percuma, kemudian $4.99 sebulan.',
        'Jenguk sekejap'],
      'aff-tell': ['Dapat bayaran kerana bercerita',
        'morsels45 ada program affiliate. Kongsi pautan anda sendiri, dan apabila seseorang mendaftar melaluinya, anda dapat bahagian — selagi mereka kekal.',
        'Percuma untuk sertai, tiada apa untuk dibayar, dan orang yang anda hantar tidak dikenakan kos tambahan.',
        'Tunjukkan caranya'],
      'aff-already': ['Anda sudah pun mengesyorkannya',
        'Setiap kali anda menyelesaikan pertengkaran tentang makan malam dengan ini, ada orang lain yang mendengarnya. Dengan pautan di tangan, ia bernilai untuk anda juga, bukan hanya untuk mereka.',
        'Mengambil masa seminit untuk disediakan dan tiada apa untuk dibayar.',
        'Dapatkan pautan saya'],
      'aff-recurring': ['Dibayar selagi mereka kekal',
        'Bahagian itu bukan yuran sekali sahaja. Daftarkan seseorang dan anda terus menerima pendapatan daripada mereka setiap bulan mereka terus menggunakannya.',
        'Tiada apa untuk dibayar, tiada apa untuk dihantar, dan tiada minimum.',
        'Lihat syarat'],
      'aff-nothing-to-sell': ['Tiada apa untuk dibeli, tiada apa untuk disiarkan',
        'Ini bukan jenis yang menyuruh anda membeli kit atau menyiarkan apa-apa di media sosial. Ia cuma pautan. Anda hantar kepada orang yang tak boleh decide nak makan apa, iaitu semua orang.',
        'Percuma untuk sertai dan anda boleh berhenti bila-bila masa.',
        'Dapatkan pautan saya'],
      'aff-group': ['Satu pautan untuk satu kumpulan sembang',
        'Pautan yang sama tidak luput dan tidak kisah berapa ramai yang menggunakannya. Letakkan di tempat yang beberapa orang akan nampak sekali, bukannya menghantarnya berulang kali.',
        'Percuma untuk sertai, dan orang yang anda hantar tidak dikenakan kos tambahan.',
        'Tunjukkan caranya'],
      'aff-cancel': ['Pautan anda kekal walaupun anda berhenti membayar',
        'Program affiliate bukan sebahagian daripada Premium. Sertai dengan versi percuma, kekalkan jika anda membatalkan langganan, dan terus menerima pendapatan sama ada anda langgan atau tidak.',
        'Tiada bayaran untuk menjadi affiliate, selama-lamanya.',
        'Sertai sekarang']
    },
    th: {
      'plus-takeaway': ['ถูกกว่าค่าสั่งอาหารกลับบ้านหนึ่งมื้อ',
        'Premium คือโหมดการเล่นอีกหกแบบ โหมดทำอาหาร เครื่องมือสร้างเมนู และกติกาที่จะไม่ถามคุณซ้ำสอง ทั้งเดือนราคาถูกกว่าค่าสั่งเดลิเวอรีเพียงครั้งเดียว',
        'ลองฟรีเจ็ดวันก่อน เกมที่คุณเล่นอยู่ยังฟรีเหมือนเดิมไม่ว่าคุณจะสมัครหรือไม่',
        'ลองฟรีเจ็ดวัน'],
      'plus-modes': ['ข้างในยังมีอีกหกเกม',
        'Knockout, Blitz, This or that, Shortlist, Swipe และ Together ซ่อนอยู่หลังสวิตช์เดียว รายการอาหารชุดเดิม แต่มีหกวิธีให้เถียงกันไม่ซ้ำ',
        'ฟรีเจ็ดวัน จากนั้น $4.99 ต่อเดือน',
        'ลองดู'],
      'aff-tell': ['ได้เงินแค่บอกต่อ',
        'morsels45 มีโปรแกรมพันธมิตร (affiliate) แชร์ลิงก์ของคุณเอง เมื่อมีคนสมัครผ่านลิงก์นั้น คุณจะได้ส่วนแบ่ง — ตราบเท่าที่เขายังใช้อยู่',
        'สมัครฟรี ไม่มีค่าใช้จ่าย และคนที่คุณส่งให้ไม่ต้องจ่ายเพิ่มแม้แต่บาท',
        'ดูวิธี'],
      'aff-already': ['คุณแนะนำมันอยู่แล้ว',
        'ทุกครั้งที่คุณใช้มันยุติการเถียงเรื่องมื้อเย็น จะมีอีกคนได้ยินเรื่องนี้ พอมีลิงก์อยู่ในมือ มันก็มีค่าสำหรับคุณด้วย ไม่ใช่แค่สำหรับเขา',
        'ตั้งค่าไม่ถึงหนึ่งนาที และไม่มีค่าใช้จ่าย',
        'รับลิงก์ของฉัน'],
      'aff-recurring': ['จ่ายให้ตราบเท่าที่เขายังอยู่',
        'ส่วนแบ่งนี้ไม่ใช่ค่าแนะนำครั้งเดียว ชวนใครสักคนมาสมัคร แล้วคุณจะได้รายได้จากเขาทุกเดือนที่เขายังใช้งานอยู่',
        'ไม่มีค่าใช้จ่าย ไม่ต้องส่งของ และไม่มีขั้นต่ำ',
        'ดูเงื่อนไข'],
      'aff-nothing-to-sell': ['ไม่ต้องซื้อ ไม่ต้องโพสต์',
        'ไม่ใช่แบบที่ต้องซื้อชุดสินค้าหรือโพสต์อะไรบนโซเชียลมีเดีย มันคือลิงก์ลิงก์เดียว ส่งให้คนที่ตัดสินใจไม่ได้ว่าจะกินอะไร ซึ่งก็คือทุกคน',
        'สมัครฟรี และเลิกได้ทุกเมื่อ',
        'รับลิงก์ของฉัน'],
      'aff-group': ['ลิงก์เดียว ใช้ได้ทั้งกลุ่มแชต',
        'ลิงก์เดิมไม่มีวันหมดอายุ และไม่สนว่าจะมีกี่คนใช้ ฝากไว้ในที่ที่คนหลายคนจะเห็นครั้งเดียว แทนที่จะส่งซ้ำแล้วซ้ำอีก',
        'สมัครฟรี และคนที่คุณส่งให้ไม่ต้องจ่ายเพิ่ม',
        'ดูวิธี'],
      'aff-cancel': ['เลิกจ่ายแล้ว ลิงก์ของคุณยังอยู่',
        'โปรแกรมพันธมิตรไม่ได้เป็นส่วนหนึ่งของ Premium สมัครด้วยเวอร์ชันฟรีได้ ยกเลิกแล้วยังเก็บไว้ได้ และยังได้รายได้ต่อไปไม่ว่าอย่างไร',
        'การเป็นพันธมิตรไม่มีค่าใช้จ่าย ตลอดไป',
        'เข้าร่วม']
    },
    ar: {
      'plus-takeaway': ['أقل من طلب توصيل واحد',
        'يمنحك Premium ست طرق لعب إضافية، ووضع الطبخ، وأداة بناء القوائم، وقواعد لا تسألك عنها مرتين. شهر كامل منه يكلّف أقل من طلب توصيل واحد.',
        'سبعة أيام مجانًا أولًا. تبقى اللعبة التي تلعبها مجانية في الحالتين.',
        'سبعة أيام مجانًا'],
      'plus-modes': ['هنا ست ألعاب أخرى',
        'Knockout وBlitz وThis or that وShortlist وSwipe وTogether — كلها خلف مفتاح واحد. الكتالوج نفسه، وست طرق مختلفة للجدال حوله.',
        'سبعة أيام مجانًا، ثم 4.99$ في الشهر.',
        'ألقِ نظرة'],
      'aff-tell': ['احصل على أجر مقابل إخبار الناس',
        'لدى morsels45 برنامج شراكة بالعمولة. شارك رابطك الخاص، وعندما يشترك أحدهم من خلاله تحصل على حصة — ما دام مستمرًا.',
        'الانضمام مجاني، ولا شيء تدفعه، ولا يكلّف من ترسل إليهم أي شيء إضافي.',
        'أرني الطريقة'],
      'aff-already': ['أنت توصي به أصلًا',
        'في كل مرة تحسم فيها نقاشًا حول العشاء بهذا التطبيق، يسمع عنه شخص آخر. وبوجود رابط في يدك، يصبح لذلك قيمة لك أنت أيضًا، لا لهم وحدهم.',
        'يستغرق إعداده دقيقة، ولا شيء تدفعه.',
        'احصل على رابطي'],
      'aff-recurring': ['يدفع لك ما دام مشتركًا',
        'الحصة ليست مكافأة لمرة واحدة. اشترك أحدهم وستواصل الكسب منه كل شهر يواصل فيه الاستخدام.',
        'لا شيء تدفعه، ولا شيء تشحنه، ولا حدّ أدنى.',
        'اطّلع على الشروط'],
      'aff-nothing-to-sell': ['لا شيء لتشتريه، ولا شيء لتنشره',
        'هذا ليس من ذلك النوع الذي يطلب منك شراء حقيبة أو نشر أي شيء على وسائل التواصل. إنه رابط فقط. ترسله إلى من لا يستطيعون تقرير ما يأكلونه، أي إلى الجميع.',
        'الانضمام مجاني، ويمكنك التوقف في أي وقت.',
        'احصل على رابطي'],
      'aff-group': ['رابط واحد يكفي مجموعة دردشة كاملة',
        'الرابط نفسه لا ينتهي ولا يهمّه كم شخصًا يستخدمه. ضعه في مكان يراه فيه عدة أشخاص مرة واحدة، بدل إرساله مرارًا وتكرارًا.',
        'الانضمام مجاني، ولا يكلّف من ترسل إليهم أي شيء إضافي.',
        'أرني الطريقة'],
      'aff-cancel': ['رابطك يبقى معك إن توقفت عن الدفع',
        'برنامج الشراكة ليس جزءًا من Premium. انضم عبر النسخة المجانية، واحتفظ به إن ألغيت اشتراكك، وواصل الكسب في الحالتين.',
        'لا شيء تدفعه لتكون شريكًا، أبدًا.',
        'انضم']
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

  /*
   * One ad in the current language, or the very object it was given if there
   * is nothing written for this language — which is the whole of the fallback,
   * and why Hindi, which has no ads here, simply sees the English ones.
   */
  function ad(card) {
    var set = ADS[lang];
    var row = set && set[card.id];
    if (!row) return card;
    return {
      id: card.id, kind: card.kind, icon: card.icon,
      title: row[0], body: row[1], fine: row[2], cta: row[3]
    };
  }

  /* Whether this language has its own ads, for the button labels around them. */
  function hasAds() { return !!ADS[lang]; }

  return {
    LANGS: LANGS,
    ad: ad,
    hasAds: hasAds,
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
