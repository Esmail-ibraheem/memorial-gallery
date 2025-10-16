import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Globe,
  Moon,
  Sun,
  Info,
  ExternalLink,
  Book,
  X,
  Volume2,
} from 'lucide-react';

/**
 * Memorial Gallery – MVP (Single-file React, JS only)
 * -------------------------------------------------------------
 * • Arabic-first UI (RTL) with English toggle.
 * • Search + basic filters + animated gallery.
 * • License guard for images (only render if license provided).
 * • FIX: Removed trailing comma at end of STRINGS.en.disclaimer.
 * • Converted away from TypeScript-only syntax so it runs in plain JS.
 * • Added lightweight runtime "tests" (console assertions) for utilities & i18n.
 */

// ------- i18n strings (NO trailing commas on last props) ---------
const STRINGS = {
  ar: {
    title: 'ذاكرة الشهداء في فلسطين',
    searchPlaceholder: 'ابحث بالاسم أو المدينة…',
    filters: 'تصفية النتائج',
    governorate: 'المحافظة',
    ageRange: 'الفئة العمرية',
    dateRange: 'التاريخ',
    tags: 'الوسوم',
    verseLabel: 'إظهار/إخفاء الآية',
    verse:
      'وَلَا تَحْسَبَنَّ الَّذِينَ قُتِلُوا فِي سَبِيلِ اللَّهِ أَمْوَاتًاۚ بَلْ أَحْيَاءٌ عِندَ رَبِّهِمْ يُرْزَقُونَ — آل عمران ١٦٩',
    showEnglish: 'English',
    hideEnglish: 'العربية',
    audioPlay: 'تشغيل التلاوة',
    audioPrompt: 'لم يتم تشغيل التلاوة تلقائيًا، اضغط على زر التشغيل للاستماع.',
    audioAttribution: 'تلاوة الشيخ بدر التركي',
    sources: 'المصادر',
    license: 'الترخيص',
    toggleTheme: 'تبديل المظهر',
    empty: 'لم نعثر على نتائج. جرّب كلمات أخرى أو عدّل عوامل التصفية.',
    about: 'عن الموقع',
    aboutText:
      'هذا موقع توثيقي إنساني يهدف إلى حفظ الذكرى وتقديم معلومات موثقة باحترام وحياد. نزيل أي محتوى بطلب من العائلة.',
    removal: 'طلب تصحيح/إزالة',
    disclaimer:
      'الصور تُعرض فقط عند وجود ترخيص واضح أو إذن. في غياب ذلك نستخدم بدائل محترمة.',
  },
  en: {
    title: 'Palestine Memorial Gallery',
    searchPlaceholder: 'Search by name or city…',
    filters: 'Filters',
    governorate: 'Governorate',
    ageRange: 'Age range',
    dateRange: 'Date',
    tags: 'Tags',
    verseLabel: 'Show/Hide Verse',
    verse:
      "Do not think of those slain in the way of God as dead; they are alive with their Lord, provided for. — Qur'an 3:169",
    showEnglish: 'English',
    hideEnglish: 'Arabic',
    audioPlay: 'Play recitation',
    audioPrompt:
      'The recitation did not start automatically. Tap play to listen.',
    audioAttribution: 'Recitation by Sheikh Badr Al-Turki',
    sources: 'Sources',
    license: 'License',
    toggleTheme: 'Theme',
    empty: 'No results found. Try different keywords or adjust filters.',
    about: 'About',
    aboutText:
      'This is a humane, documentary site with respectful, sourced information. We remove content on family request.',
    removal: 'Request Correction/Removal',
    disclaimer:
      'Photos are shown only with explicit license/permission; otherwise a respectful placeholder is used.',
  },
};

const RECITATION_SRC = `${import.meta.env.BASE_URL}audio/badr-turki-men.mp3`;

// ------- Sample dataset (replace with verified, licensed data) ---------
const FAME_LEVELS = Object.freeze({
  INTERNATIONAL_LEADER: {
    level: 1,
    name_en: 'International Leader',
    name_ar: 'قائد دولي',
  },
  TOP_COMMANDER: {
    level: 2,
    name_en: 'Top Commander',
    name_ar: 'قائد ميداني بارز',
  },
  PUBLIC_FIGURE: {
    level: 3,
    name_en: 'Public Figure',
    name_ar: 'شخصية عامة',
  },
  LOCAL_FIGURE: {
    level: 4,
    name_en: 'Local Figure',
    name_ar: 'شخصية محلية',
  },
  CIVILIAN: {
    level: 5,
    name_en: 'Civilian',
    name_ar: 'مدني',
  },
});
const SAMPLE_DATA = [
  {
    id: 'shaheed_0001',
    full_name_ar: 'صالح الجعفراوي',
    full_name_en: 'Saleh Al-Jaafrawi',
    age: 27,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza',
    date_of_death: '2025-10-12',
    biography_ar:
      'صحفي وإعلامي وشخصية مؤثّرة على مواقع التواصل الاجتماعي ولاعب تنس طاولة فلسطيني',
    biography_en:
      'Journalist, media personality, social media influencer, and Palestinian table tennis player',
    photo_url:
      'https://th.bing.com/th?id=OIF.CP191QPsmQf%2bNM2Lau9jlA&cb=12&rs=1&pid=ImgDetMain&o=7&rm=3',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'wikipedia',
        url: 'https://www.bing.com/ck/a?!&&p=5b68bf4a0b35a2539b24809b76f8d76be3c6aaede8d9d49f4aa0276849c2c108JmltdHM9MTc2MDMxMzYwMA&ptn=3&ver=2&hsh=4&fclid=31dbc4ce-fd29-64cd-2b17-d535fc7b65f6&psq=%d8%b5%d8%a7%d9%84%d8%ad+%d8%a7%d9%84%d8%ac%d8%b9%d9%81%d8%b1%d8%a7%d9%88%d9%8a&u=a1aHR0cHM6Ly9hci53aWtpcGVkaWEub3JnL3dpa2kvJUQ4JUI1JUQ4JUE3JUQ5JTg0JUQ4JUFEXyVEOCVBNyVEOSU4NCVEOCVBQyVEOCVCOSVEOSU4MSVEOCVCMSVEOCVBNyVEOSU4OCVEOSU4QSM6fjp0ZXh0PSVEOCVCNSVEOCVBNyVEOSU4NCVEOCVBRCUyMCVEOCVBNyVEOSU4NCVEOCVBQyVEOCVCOSVEOSU4MSVEOCVCMSVEOCVBNyVEOSU4OCVEOSU4QSUyMCUyODIyJTIwJUQ5JTg2JUQ5JTg4JUQ5JTgxJUQ5JTg1JUQ4JUE4JUQ4JUIxJTIwMTk5NyUyMCVFMiU4MCU5MyUyMDEyJTIwJUQ4JUEzJUQ5JTgzJUQ4JUFBJUQ5JTg4JUQ4JUE4JUQ4JUIxLCVEOCVBNyVEOSU4NCVEOCVBQyVEOCVCOSVEOSU4MSVEOCVCMSVEOCVBNyVEOSU4OCVEOSU4QSUyMCVEOCVBOCVEOCVBQSVEOCVBNyVEOCVCMSVEOSU4QSVEOCVBRSUyMDIyJTIwJUQ5JTg2JUQ5JTg4JUQ5JTgxJUQ5JTg1JUQ4JUE4JUQ4JUIxJTIwMTk5NyUyMCVEOSU4MSVEOSU4QSUyMCVEOSU4NSVEOCVBRCVEOCVBNyVEOSU4MSVEOCVCOCVEOCVBOSUyMCVEOCVCQSVEOCVCMiVEOCVBOS4',
      },
    ],
    tags: ['civilian', 'Journalist'],
    governorate: 'Gaza',
    verified: true,
    prominence_level: FAME_LEVELS.PUBLIC_FIGURE.level,
  },
  {
    id: 'shaheed_0002',
    full_name_ar: 'انس الشريف',
    full_name_en: 'Ans Al-Sharif',
    age: 28,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza',
    date_of_death: '2025-08-10',
    biography_ar:
      'صحفي فلسطيني من مخيم جباليا، عمل مراسلًا مع قناة الجزيرة أثناء حرب الإبادة الإسرائيلية ضد قطاع غزة.',
    biography_en:
      "A Palestinian journalist from Jabalia refugee camp who worked as a correspondent for Al Jazeera during Israel's war of extermination against the Gaza Strip.",
    photo_url:
      'https://tse3.mm.bing.net/th/id/OIP.Zi3Yp7X0kpj4n3PgD7s8vwHaJW?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'wikipedia',
        url: 'https://www.bing.com/ck/a?!&&p=2e8338075bc7a615d5f67d389ad539b281e9a2303aa8c5098af33641e185c37bJmltdHM9MTc2MDMxMzYwMA&ptn=3&ver=2&hsh=4&fclid=31dbc4ce-fd29-64cd-2b17-d535fc7b65f6&psq=%d8%a7%d9%86%d8%b3+%d8%a7%d9%84%d8%b4%d8%b1%d9%8a%d9%81&u=a1aHR0cHM6Ly9hci53aWtpcGVkaWEub3JnL3dpa2kvJUQ4JUEzJUQ5JTg2JUQ4JUIzXyVEOCVBNyVEOSU4NCVEOCVCNCVEOCVCMSVEOSU4QSVEOSU4MQ',
      },
    ],
    tags: ['civilian', 'Journalist'],
    governorate: 'Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0003',
    full_name_ar: 'يحيى السنوار',
    full_name_en: 'Yahya Sinwar',
    age: 61,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza',
    date_of_death: '2024-09-16',
    biography_ar:
      'كان سياسي ومناضل وروائي فلسطيني، شغل منصب رئيس المكتب السياسي لحركة حماس منذ 6 أغسطس 2024',
    biography_en:
      'He was a Palestinian politician, activist and novelist who served as head of the political bureau of Hamas since 6 August 2024.',
    // No photo license -> will render placeholder
    photo_url:
      'https://masa-press.net/wp-content/uploads/2024/05/%D8%A7%D9%84%D8%B3%D9%86%D9%88%D8%A7%D8%B1.jpg',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'wikipedia',
        url: 'https://www.bing.com/ck/a?!&&p=8d7d9066f5487108fa8d33f823be5963d8abfe851cd193635423aa800c8552fcJmltdHM9MTc2MDMxMzYwMA&ptn=3&ver=2&hsh=4&fclid=31dbc4ce-fd29-64cd-2b17-d535fc7b65f6&psq=%d8%a7%d9%84%d8%b3%d9%86%d9%88%d8%a7%d8%b1&u=a1aHR0cHM6Ly9hci53aWtpcGVkaWEub3JnL3dpa2kvJUQ5JThBJUQ4JUFEJUQ5JThBJUQ5JTg5XyVEOCVBNyVEOSU4NCVEOCVCMyVEOSU4NiVEOSU4OCVEOCVBNyVEOCVCMQ',
      },
    ],
    tags: ['Military Leader', 'Political'],
    governorate: 'West Bank',
    verified: true,
  },
  {
    id: 'shaheed_0004',
    full_name_ar: 'اسماعيل هنية',
    full_name_en: 'Ismail Haniyeh',
    age: 62,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza',
    date_of_death: '2024-07-31',
    biography_ar:
      'إسماعيل هنية هو سياسي فلسطيني بارز ورئيس المكتب السياسي لحركة حماس، وقد اغتيل في 31 يوليو 2024 في طهران.',
    biography_en:
      'Ismail Haniyeh was a prominent Palestinian politician and head of the political bureau of Hamas. He was assassinated on 31 July 2024 in Tehran.',
    // No photo license -> will render placeholder
    photo_url:
      'https://th.bing.com/th/id/OSK.HEROdgKgqNV8_C8gnr0OzQLmLfQz23ES5_vFh0a1cU4PQRk?w=472&h=280&c=13&rs=2&o=6&cb=12&pid=SANGAM',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'wikipedia',
        url: 'https://ar.wikipedia.org/wiki/%D8%A5%D8%B3%D9%85%D8%A7%D8%B9%D9%8A%D9%84_%D9%87%D9%86%D9%8A%D8%A9',
      },
    ],
    tags: ['Political Leader', 'head of Hamas'],
    governorate: 'West Bank',
    verified: true,
  },
  {
    id: 'shaheed_0004',
    full_name_ar: 'بلال جاد الله',
    full_name_en: 'Belal Jadallah',
    age: 45,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza City',
    date_of_death: '2023-11-19',
    biography_ar:
      'صحفي ومدير مؤسسة بيت الصحافة – فلسطين، قُتل بقصف أثناء تغطية الأوضاع.',
    biography_en:
      'Journalist and director of Press House–Palestine, killed by shelling while reporting.',
    photo_url:
      'https://upload.wikimedia.org/wikipedia/ar/thumb/b/bf/Belal_Jadallah.jpg/250px-Belal_Jadallah.jpg',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Belal_Jadallah',
      },
      {
        title: 'Reuters',
        url: 'https://www.reuters.com/world/middle-east/three-more-journalists-killed-gaza-2023-11-19/',
      },
    ],
    tags: ['civilian', 'Journalist'],
    governorate: 'Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0005',
    full_name_ar: 'حمزة وائل الدحدوح',
    full_name_en: 'Hamza al-Dahdouh',
    age: 27,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza City',
    date_of_death: '2024-01-07',
    biography_ar:
      'صحفي فلسطيني في شبكة الجزيرة، استشهد بصاروخ استهدف مركبته قرب خان يونس.',
    biography_en:
      'Palestinian journalist with Al Jazeera, killed when a missile struck his car near Khan Younis.',
    photo_url:
      'https://upload.wikimedia.org/wikipedia/ar/thumb/7/75/%D8%AD%D9%85%D8%B2%D8%A9_%D9%88%D8%A7%D8%A6%D9%84_%D8%A7%D9%84%D8%AF%D8%AD%D8%AF%D9%88%D8%AD_%281996%E2%80%932024%29.jpg/250px-%D8%AD%D9%85%D8%B2%D8%A9_%D9%88%D8%A7%D8%A6%D9%84_%D8%A7%D9%84%D8%AF%D8%AD%D8%AF%D9%88%D8%AD_%281996%E2%80%932024%29.jpg',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Hamza_al-Dahdouh',
      },
      {
        title: 'Al Jazeera (names list)',
        url: 'https://www.aljazeera.com/news/2025/8/11/here-are-the-names-of-the-journalists-israel-killed-in-gaza',
      },
    ],
    tags: ['civilian', 'Journalist'],
    governorate: 'Khan Younis',
    verified: true,
  },
  {
    id: 'shaheed_0006',
    full_name_ar: 'سامر أبو دقة',
    full_name_en: 'Samer Abu Daqqa',
    age: 45,
    hometown_ar: 'عبسان الكبيرة',
    hometown_en: 'Abasan al-Kabira',
    date_of_death: '2023-12-15',
    biography_ar:
      'مصور ومحرّر في قناة الجزيرة، تُرك ينزف لساعات بعد استهدافه بطائرة مسيّرة في خان يونس.',
    biography_en:
      'Al Jazeera cameraman and editor, left bleeding for hours after a drone strike in Khan Younis.',
    photo_url:
      'https://upload.wikimedia.org/wikipedia/ar/thumb/0/0e/%D8%B3%D8%A7%D9%85%D8%B1_%D8%A3%D8%A8%D9%88_%D8%AF%D9%82%D8%A9.jpeg/330px-%D8%B3%D8%A7%D9%85%D8%B1_%D8%A3%D8%A8%D9%88_%D8%AF%D9%82%D8%A9.jpeg',
    photo_license: 'Unsplash License',
    sources: [
      { title: 'CPJ', url: 'https://cpj.org/data/people/samer-abu-daqqa/' },
      {
        title: 'AP News',
        url: 'https://apnews.com/article/b17e6f5c5d987e4f834a0cc3fdc043de',
      },
    ],
    tags: ['civilian', 'Journalist'],
    governorate: 'Khan Younis',
    verified: true,
  },
  {
    id: 'shaheed_0007',
    full_name_ar: 'إسماعيل الغول',
    full_name_en: 'Ismail al-Ghoul',
    age: 27,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza City',
    date_of_death: '2024-07-31',
    biography_ar:
      'مراسل الجزيرة في غزة، استشهد مع زميله خلال تغطيته بغزة الشاطئ.',
    biography_en:
      'Al Jazeera correspondent in Gaza, killed with his cameraman while reporting in Al-Shati camp.',
    photo_url:
      'https://upload.wikimedia.org/wikipedia/ar/thumb/a/af/%D8%A5%D8%B3%D9%85%D8%A7%D8%B9%D9%8A%D9%84_%D8%A7%D9%84%D8%BA%D9%88%D9%84.jpg/250px-%D8%A5%D8%B3%D9%85%D8%A7%D8%B9%D9%8A%D9%84_%D8%A7%D9%84%D8%BA%D9%88%D9%84.jpg',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'Al Jazeera report',
        url: 'https://www.aljazeera.com/news/2024/7/31/al-jazeera-journalist-cameraman-killed-in-gaza-attack',
      },
      {
        title: 'Reuters',
        url: 'https://www.reuters.com/world/un-expert-condemns-israeli-killing-al-jazeera-journalist-gaza-2024-08-06/',
      },
    ],
    tags: ['civilian', 'Journalist'],
    governorate: 'Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0008',
    full_name_ar: 'رامي الرفحي (الرفيعي/الرفي)',
    full_name_en: 'Rami al-Rifi (al-Refee)',
    age: 27,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza City',
    date_of_death: '2024-07-31',
    biography_ar:
      'مصور لقناة الجزيرة ووكالة وطنية، استشهد مع زميله إسماعيل الغول بقصف استهدف سيارتهم الإعلامية.',
    biography_en:
      'Camera operator for Al Jazeera/Watania, killed alongside Ismail al-Ghoul when their marked press car was hit.',
    photo_url:
      'https://committeetoprotectjournalists.file.force.com/sfc/dist/version/download/?oid=00DHs000004MOVN&ids=068QP00000KSzuq&d=%2Fa%2FQP000001laHB%2FDfN0AtFC2OwTILJ3i1K7TdqnuqgEHOLUZ7k1qOpT7_g&asPdf=false',
    photo_license: 'Unsplash License',
    sources: [
      { title: 'CPJ', url: 'https://cpj.org/data/people/rami-al-refee/' },
      {
        title: 'The Guardian',
        url: 'https://www.theguardian.com/world/article/2024/jul/31/two-al-jazeera-reporters-killed-as-israeli-airstrike-hits-car-in-northern-gaza',
      },
    ],
    tags: ['civilian', 'Journalist'],
    governorate: 'Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0009',
    full_name_ar: 'هند رجب',
    full_name_en: 'Hind Rajab',
    age: 5,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza City',
    date_of_death: '2024-01-29',
    biography_ar:
      'طفلة فلسطينية أصبحت رمزًا بعد مكالمتها المؤلمة مع الإسعاف؛ عُثر عليها شهيدة بعد 12 يومًا مع أفراد عائلتها والمسعفين المرسَلين لإنقاذها.',
    biography_en:
      'Palestinian child whose plea to rescuers went viral; found killed with her family and the paramedics sent to save her.',
    photo_url: '',
    photo_license: '',
    sources: [
      {
        title: 'Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Killing_of_Hind_Rajab',
      },
      {
        title: 'Washington Post (timeline)',
        url: 'https://www.washingtonpost.com/world/interactive/2024/hind-rajab-israel-gaza-killing-timeline/',
      },
    ],
    tags: ['civilian', 'Child'],
    governorate: 'Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0010',
    full_name_ar: 'يوسف الزّينو',
    full_name_en: 'Yusuf (Yousef) al-Zeino',
    age: null,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza City',
    date_of_death: '2024-02-10',
    biography_ar:
      'مسعف في جمعية الهلال الأحمر الفلسطيني، استشهد خلال مهمة إنقاذ هند رجب بعد تعرّض سيارة الإسعاف للاستهداف.',
    biography_en:
      'Paramedic with PRCS, killed when the ambulance sent to rescue Hind Rajab was struck.',
    photo_url: '',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'Forensic Architecture',
        url: 'https://forensic-architecture.org/investigation/the-killing-of-hind-rajab',
      },
      {
        title: 'Wikipedia (Health workers)',
        url: 'https://en.wikipedia.org/wiki/Killing_of_health_workers_in_the_Gaza_war',
      },
    ],
    tags: ['civilian', 'Paramedic'],
    governorate: 'Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0011',
    full_name_ar: 'أحمد المدهون',
    full_name_en: 'Ahmed al-Madhoun',
    age: null,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza City',
    date_of_death: '2024-02-10',
    biography_ar:
      'مسعف في جمعية الهلال الأحمر الفلسطيني، استشهد مع زميله خلال محاولة الوصول إلى هند رجب.',
    biography_en:
      'PRCS paramedic killed alongside his colleague while attempting to reach Hind Rajab.',
    photo_url: '',
    photo_license: '',
    sources: [
      {
        title: 'Forensic Architecture',
        url: 'https://forensic-architecture.org/investigation/the-killing-of-hind-rajab',
      },
      {
        title: 'Le Monde (report)',
        url: 'https://www.lemonde.fr/en/international/article/2024/02/12/how-6-year-old-hind-rajab-was-killed-as-palestinian-red-crescent-tried-to-rescue-her_6517073_4.html',
      },
    ],
    tags: ['civilian', 'Paramedic'],
    governorate: 'Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0012',
    full_name_ar: 'محمود أبو نعيلة',
    full_name_en: 'Mahmoud Abu Nujaila',
    age: 38,
    hometown_ar: 'جباليا',
    hometown_en: 'Jabalia',
    date_of_death: '2023-11-21',
    biography_ar:
      'طبيب جرّاح عظام في مستشفى العودة وعضو فريق أطباء بلا حدود، استشهد بقصف استهدف المستشفى وخلّد عبارة "من بقي حتى النهاية سيحكي القصة".',
    biography_en:
      "Orthopedic surgeon at Al-Awda Hospital and MSF physician, killed in a strike; author of the note 'Whoever stays until the end will tell the story.'",
    photo_url:
      'https://www.doctorswithoutborders.org/sites/default/files/styles/standout_mbt_553_519/public/Mahmoud%20Abu%20Nujaila_0.png?itok=FWmMmJ1C',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'MSF (Doctors Without Borders)',
        url: 'https://www.msf.org/remembering-our-colleagues-killed-gaza',
      },
    ],
    tags: ['civilian', 'Doctor'],
    governorate: 'North Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0013',
    full_name_ar: 'عدنان البرش',
    full_name_en: 'Adnan al-Bursh',
    age: 49,
    hometown_ar: 'جباليا',
    hometown_en: 'Jabalia',
    date_of_death: '2024-04-19',
    biography_ar:
      'استشاري عظام ورئيس قسم العظام في مجمع الشفاء الطبي، توفي في سجن عوفر بعد أشهر من الاعتقال.',
    biography_en:
      'Orthopedic surgeon and head of orthopedics at al-Shifa Medical Complex, died in Israeli custody at Ofer Prison.',
    photo_url:
      'https://english.ahram.org.eg/Media/News/2024/5/3/41_2024-638503578457176373-717.jpg',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Adnan_al-Bursh',
      },
      {
        title: 'OHCHR press release',
        url: 'https://www.ohchr.org/en/press-releases/2024/05/un-expert-horrified-death-gazan-orthopedic-surgeon-israeli-detention',
      },
    ],
    tags: ['civilian', 'Doctor'],
    governorate: 'North Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0014',
    full_name_ar: 'رشدي السراج',
    full_name_en: 'Roshdi (Rushdi) Sarraj',
    age: 31,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza City',
    date_of_death: '2023-10-22',
    biography_ar:
      'صحفي وصانع أفلام ومؤسس مشارك لشركة عين ميديا، قُتل بقصف على منزله بتل الهوى.',
    biography_en:
      'Journalist/filmmaker, co-founder of Ain Media, killed when an airstrike hit his home in Tal al-Hawa.',
    photo_url:
      'https://www.aljazeera.com/wp-content/uploads/2023/10/60714536_10218918315459055_6781969298454740992_n-1-1698047538.jpg?resize=1200%2C630',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Roshdi_Sarraj',
      },
      { title: 'CPJ', url: 'https://cpj.org/data/people/roshdi-sarraj/' },
    ],
    tags: ['civilian', 'Journalist'],
    governorate: 'Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0015',
    full_name_ar: 'هبة أبو ندى',
    full_name_en: 'Hiba Abu Nada',
    age: 32,
    hometown_ar: 'خانيونس',
    hometown_en: 'Khan Younis',
    date_of_death: '2023-10-20',
    biography_ar:
      'شاعرة وروائية فلسطينية، استشهدت إثر قصف على منزلها وذاع صيتها بقصائدها عن غزة.',
    biography_en:
      'Palestinian poet and novelist, killed when her home was struck; known for poetry about Gaza.',
    photo_url: '',
    photo_license: '',
    sources: [
      {
        title: 'Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Hiba_Abu_Nada',
      },
    ],
    tags: ['civilian', 'Poet', 'Writer'],
    governorate: 'Khan Younis',
    verified: true,
  },
  {
    id: 'shaheed_0016',
    full_name_ar: 'هبة زقّوط',
    full_name_en: 'Heba Zagout',
    age: 39,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza City',
    date_of_death: '2023-10-13',
    biography_ar:
      'فنانة تشكيلية ومعلّمة فنون فلسطينية، استشهدت بقصف على منزلها وهي أم لطفلين.',
    biography_en:
      'Palestinian painter and art teacher, killed in an airstrike on her home; mother of two.',
    photo_url: '',
    photo_license: '',
    sources: [
      {
        title: 'Middle East Eye',
        url: 'https://www.middleeasteye.net/news/israel-palestine-war-gaza-woman-killed-artist-heba-zagout',
      },
      {
        title: 'Airwars (incident)',
        url: 'https://airwars.org/civilian-casualties/ispt0430-october-13-2023/',
      },
    ],
    tags: ['civilian', 'Artist'],
    governorate: 'Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0017',
    full_name_ar: 'محمد أبو حطب',
    full_name_en: 'Mohammed Abu Hatab',
    age: null,
    hometown_ar: 'خان يونس',
    hometown_en: 'Khan Younis',
    date_of_death: '2023-11-02',
    biography_ar:
      'مراسل تلفزيون فلسطين، استشهد مع 11 من أفراد عائلته بقصف منزله بعد عودته من التغطية.',
    biography_en:
      'Palestine TV correspondent, killed with 11 family members when his home was struck shortly after a live report.',
    photo_url:
      'https://imagenes.20minutos.es/uploads/imagenes/2023/11/03/ultima-conexion-en-directo-de-mohamed-abu-hatab.png',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'RSF list',
        url: 'https://rsf.org/en/israel-gaza-war-list-journalists-killed-line-duty-palestine-israel-and-lebanon-gets-longer',
      },
      {
        title: 'UNESCO note',
        url: 'https://www.unesco.org/en/articles/unesco-director-general-deplores-death-journalist-mohammed-abu-hatab-palestine',
      },
    ],
    tags: ['civilian', 'Journalist'],
    governorate: 'Khan Younis',
    verified: true,
  },
  {
    id: 'shaheed_0018',
    full_name_ar: 'حسّان مجدي أبو وردة',
    full_name_en: 'Hassan Majdi Abu Warda',
    age: null,
    hometown_ar: 'جباليا',
    hometown_en: 'Jabalia',
    date_of_death: '2025-05-25',
    biography_ar:
      'مدير وكالة برق غزة الإخبارية، استشهد مع أفراد من عائلته إثر قصف منزله في جباليا.',
    biography_en:
      'Director of Barq Gaza News Agency, killed with family members when his home in Jabalia was struck.',
    photo_url:
      'https://www.africa-express.info/wp-content/uploads/2025/05/Hassan-Majdi-Abu-Warda.jpeg',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'Reuters',
        url: 'https://www.reuters.com/world/middle-east/israeli-strikes-kill-20-gaza-including-journalist-rescue-service-official-2025-05-25/',
      },
      {
        title: 'IFJ',
        url: 'https://www.ifj.org/media-centre/news/detail/category/press-releases/article/palestine-at-least-223-journalists-and-media-workers-killed-in-gaza',
      },
    ],
    tags: ['civilian', 'Journalist'],
    governorate: 'North Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0010',
    full_name_ar: 'صالح العاروري',
    full_name_en: 'Saleh al-Arouri',
    age: 57,
    hometown_ar: 'عارورة (رام الله)',
    hometown_en: "'Arura (Ramallah)",
    date_of_death: '2024-01-02',
    biography_ar:
      'سياسي فلسطيني ونائب رئيس المكتب السياسي لحركة حماس، اغتيل في ضاحية بيروت الجنوبية.',
    biography_en:
      'Deputy head of Hamas’s Political Bureau, assassinated in Beirut’s Dahieh district.',
    photo_url:
      'https://tse2.mm.bing.net/th/id/OIP.r25IaNM8E8YeF_crYQszAgHaDt?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'Wikimedia Commons',
        url: 'https://commons.wikimedia.org/wiki/File:Saleh_al-Arouri_at_Russia%E2%80%93Hamas_meeting,_2022_(cropped).jpg',
      },
    ],
    tags: ['Palestinian politician', 'Hamas leader'],
    governorate: 'West Bank',
    verified: true,
  },
  {
    id: 'shaheed_0011',
    full_name_ar: 'مروان عيسى',
    full_name_en: 'Marwan Issa',
    age: 58,
    hometown_ar: 'مخيم البريج (الوسطى)',
    hometown_en: 'Al-Bureij Camp (Deir al-Balah)',
    date_of_death: '2024-03-10',
    biography_ar:
      'نائب القائد العام لكتائب القسام؛ قُتل بضربة جوية في النصيرات وأُكّد استشهاده لاحقًا.',
    biography_en:
      'Deputy commander of Hamas’s Qassam Brigades; killed in Nuseirat strike, later confirmed.',
    // "photo_url": "https://commons.wikimedia.org/wiki/Special:FilePath/Marwan%20Issa%20reconstruction.jpg?width=600",
    // "photo_license": "Wikimedia Commons (see file page)",
    sources: [
      {
        title: 'Wikimedia Commons',
        url: 'https://commons.wikimedia.org/wiki/File:Marwan_Issa_reconstruction.jpg',
      },
    ],
    tags: ['military commander', 'Qassam Brigades'],
    governorate: 'Deir al-Balah',
    verified: true,
  },
  {
    id: 'shaheed_0012',
    full_name_ar: 'محمد الضيف',
    full_name_en: 'Mohammed Deif',
    age: 58,
    hometown_ar: 'مخيم خان يونس',
    hometown_en: 'Khan Younis RC',
    date_of_death: '2024-07-13',
    biography_ar:
      'القائد العام لكتائب القسام منذ 2002؛ أُكّد استشهاده في 30 يناير 2025.',
    biography_en:
      'Long-time Qassam Brigades chief; death confirmed Jan 30, 2025.',
    photo_url:
      'https://maktoobmedia.com/wp-content/uploads/2025/01/Mohammed-Deif.jpg',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Mohammed_Deif',
      },
    ],
    tags: ['military commander', 'Qassam Brigades'],
    governorate: 'Khan Younis',
    verified: true,
  },
  {
    id: 'shaheed_0013',
    full_name_ar: 'روحي مشتهى',
    full_name_en: 'Rawhi Mushtaha',
    age: 65,
    hometown_ar: 'غزة (الشجاعية)',
    hometown_en: "Gaza (Shuja'iyya)",
    date_of_death: '2024-07-23',
    biography_ar:
      'قيادي مؤسس بحماس وعضو المكتب السياسي؛ أُكّد استشهاده مطلع 2025.',
    biography_en:
      'Founding Hamas member; senior political bureau figure; death confirmed in early 2025.',
    photo_url:
      'https://tse1.mm.bing.net/th/id/OIP.pfPEwSBLVORMCY2NRVIikwHaEK?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3',
    photo_license: 'Unsplash License',
    sources: [
      {
        title: 'Wikimedia Commons',
        url: 'https://commons.wikimedia.org/wiki/File:Rawhi_Mushtaha.jpg',
      },
    ],
    tags: ['Hamas political leader'],
    governorate: 'Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0014',
    full_name_ar: 'أيمن نوفل',
    full_name_en: 'Ayman Nofal',
    age: 49,
    hometown_ar: 'مخيم البريج',
    hometown_en: 'Al-Bureij Camp',
    date_of_death: '2023-10-17',
    biography_ar: 'عضو المجلس العسكري العام لكتائب القسام وقائد لواء الوسطى.',
    biography_en:
      'Senior Qassam commander; head of Central Gaza Brigade and air operations.',
    photo_url:
      'https://popularbio.com/wp-content/uploads/2023/10/Ayman-Nofal.jpg',
    photo_license: 'Unsplash License',
    sources: [
      { title: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ayman_Nofal' },
    ],
    tags: ['military commander', 'Qassam Brigades'],
    governorate: 'Deir al-Balah',
    verified: true,
  },
  {
    id: 'shaheed_0015',
    full_name_ar: 'أحمد الغندور (أبو أنس)',
    full_name_en: 'Ahmed al-Ghandour (Abu Anas)',
    age: 56,
    hometown_ar: 'مخيم جباليا',
    hometown_en: 'Jabalia Camp',
    date_of_death: '2023-11-10',
    biography_ar:
      'قائد لواء الشمال؛ أعلنت كتائب القسام استشهاده في نوفمبر 2023.',
    biography_en:
      'Head of the Northern Gaza Brigade; Hamas announced his death in Nov 2023.',
    photo_url: '',
    photo_license: '',
    sources: [
      {
        title: 'Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Ahmed_Ghandour_(militant)',
      },
    ],
    tags: ['military commander', 'Qassam Brigades'],
    governorate: 'North Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0016',
    full_name_ar: 'أيمن سيام',
    full_name_en: 'Ayman Siam',
    age: null,
    hometown_ar: 'غزة',
    hometown_en: 'Gaza',
    date_of_death: '2023-11-26',
    biography_ar: 'قائد منظومة الصواريخ والمدفعية في كتائب القسام.',
    biography_en:
      'Head of Hamas’s rocket/artillery array; death reported Nov 2023.',
    photo_url: '',
    photo_license: '',
    sources: [
      {
        title: 'Times of Israel (report)',
        url: 'https://www.timesofisrael.com/hamas-confirms-senior-commanders-killed-in-earlier-gaza-fighting/',
      },
    ],
    tags: ['military commander', 'rockets chief'],
    governorate: 'North Gaza',
    verified: true,
  },
  {
    id: 'shaheed_0017',
    full_name_ar: 'رافع سلامة',
    full_name_en: 'Rafa Salama',
    age: null,
    hometown_ar: 'خان يونس',
    hometown_en: 'Khan Younis',
    date_of_death: '2024-07-13',
    biography_ar: 'قائد لواء خان يونس؛ استُهدف مع محمد الضيف في ضربة المواصي.',
    biography_en:
      'Khan Younis Brigade commander; targeted alongside Mohammed Deif in Al-Mawasi strike.',
    photo_url: '',
    photo_license: '',
    sources: [
      { title: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rafa_Salama' },
    ],
    tags: ['military commander', 'Qassam Brigades'],
    governorate: 'Khan Younis',
    verified: true,
  },
  {
    id: 'shaheed_0018',
    full_name_ar: 'محمد السنوار',
    full_name_en: 'Mohammed Sinwar',
    age: 49,
    hometown_ar: 'مخيم خان يونس',
    hometown_en: 'Khan Younis RC',
    date_of_death: '2025-05-13',
    biography_ar:
      'قائد الجناح العسكري لحماس وقائد غزة بعد مقتل شقيقه يحيى؛ أكدت حماس وفاته لاحقًا.',
    biography_en:
      'Hamas military chief and Gaza leader after Yahya Sinwar; death later confirmed by Hamas.',
    photo_url: '',
    photo_license: '',
    sources: [
      {
        title: 'Reuters (confirmation Aug 30, 2025)',
        url: 'https://www.reuters.com/world/middle-east/hamas-confirms-death-its-military-leader-mohammed-sinwar-2025-08-30/',
      },
    ],
    tags: ['military commander', 'Hamas leader'],
    governorate: 'Khan Younis',
    verified: true,
  },
];

// ------- Utilities ---------
function getFameLevelDetails(levelNumber) {
  return Object.values(FAME_LEVELS).find((l) => l.level === levelNumber);
}
function classNames() {
  return Array.from(arguments).filter(Boolean).join(' ');
}

function withinDateRange(dateStr, start, end) {
  if (!dateStr) return true;
  const d = new Date(dateStr).getTime();
  if (start && d < new Date(start).getTime()) return false;
  if (end && d > new Date(end).getTime()) return false;
  return true;
}

function licenseOK(m) {
  return Boolean(
    m.photo_url && m.photo_license && m.photo_license.trim().length > 0
  );
}

const GOVERNORATES = [
  'Gaza',
  'North Gaza',
  'Deir al-Balah',
  'Khan Younis',
  'Rafah',
  'Jerusalem',
  'Hebron',
  'Nablus',
  'Jenin',
  'Tulkarm',
  'Qalqilya',
  'Salfit',
  'Tubas',
  'Bethlehem',
  'West Bank',
];

// --- Runtime sanity checks (lightweight tests) ---
function validateStrings() {
  try {
    const requiredKeys = [
      'title',
      'searchPlaceholder',
      'filters',
      'governorate',
      'ageRange',
      'dateRange',
      'tags',
      'verseLabel',
      'verse',
      'showEnglish',
      'hideEnglish',
      'sources',
      'license',
      'toggleTheme',
      'empty',
      'about',
      'aboutText',
      'removal',
      'disclaimer',
    ];
    ['ar', 'en'].forEach((lang) => {
      const obj = STRINGS[lang];
      requiredKeys.forEach((k) => {
        console.assert(
          typeof obj[k] === 'string' && obj[k].length > 0,
          `[i18n] Missing/empty key "${k}" in ${lang}`
        );
      });
    });
    console.log('[i18n] STRINGS validated OK');
  } catch (e) {
    console.error('[i18n] Validation error', e);
  }
}

function runUtilityTests() {
  try {
    // initials tests
    console.assert(
      initials('محمد عبد الله') === 'مع',
      'initials Arabic failed'
    );
    console.assert(initials('Amina Yousef') === 'AY', 'initials Latin failed');

    // withinDateRange tests
    console.assert(
      withinDateRange('2024-01-02', '2024-01-01', '2024-12-31') === true,
      'date in range'
    );
    console.assert(
      withinDateRange('2023-12-31', '2024-01-01', '2024-12-31') === false,
      'date before range'
    );

    // licenseOK tests
    console.assert(
      licenseOK({ photo_url: 'u', photo_license: 'CC' }) === true,
      'license ok true'
    );
    console.assert(
      licenseOK({ photo_url: 'u', photo_license: '' }) === false,
      'license ok false'
    );

    console.log('[tests] Utility tests passed');
  } catch (e) {
    console.error('[tests] Utility tests error', e);
  }
}

// ------- Main Component ---------
export default function App() {
  const [lang, setLang] = useState('ar');
  const t = STRINGS[lang];
  const [dark, setDark] = useState(true);
  const [showVerse, setShowVerse] = useState(true);
  const [q, setQ] = useState('');
  const [gov, setGov] = useState('');
  const [ageMin, setAgeMin] = useState(0);
  const [ageMax, setAgeMax] = useState(120);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [tag, setTag] = useState('');
  const [selected, setSelected] = useState(null);
  const audioRef = useRef(null);
  const [audioAttempted, setAudioAttempted] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const viewBioLabel = lang === 'ar' ? 'عرض السيرة' : 'View biography';
  const biographyTitle = lang === 'ar' ? 'السيرة الذاتية' : 'Biography';
  const secondaryBiographyLabel = lang === 'ar' ? 'بالإنجليزية' : 'In Arabic';
  const closeLabel = lang === 'ar' ? 'إغلاق' : 'Close';

  const playRecitation = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.volume = 0.85;
    } catch (e) {
      // ignore seek errors
    }
    const playPromise = audio.play();
    setAudioAttempted(true);
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          setAudioError(false);
        })
        .catch(() => {
          setAudioError(true);
        });
    }
  }, []);

  // Run tests and set direction/theme on mount
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [dark]);

  useEffect(() => {
    playRecitation();
  }, [playRecitation]);

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selected]);

  useEffect(() => {
    validateStrings();
    runUtilityTests();
  }, []);

  const tagsAll = useMemo(() => {
    const s = new Set();
    SAMPLE_DATA.forEach((m) => (m.tags || []).forEach((tg) => s.add(tg)));
    return Array.from(s);
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    // 1. Filter the data just like before
    const filteredData = SAMPLE_DATA.filter((m) => {
      const inText = qq
        ? (m.full_name_ar || '').toLowerCase().includes(qq) ||
          (m.full_name_en || '').toLowerCase().includes(qq) ||
          (m.hometown_ar || '').toLowerCase().includes(qq) ||
          (m.hometown_en || '').toLowerCase().includes(qq)
        : true;
      const inGov = gov
        ? (m.governorate || '').toLowerCase() === gov.toLowerCase()
        : true;
      const inAge = m.age == null ? true : m.age >= ageMin && m.age <= ageMax;
      const inDate = withinDateRange(m.date_of_death, dateStart, dateEnd);
      const inTag = tag ? (m.tags || []).includes(tag) : true;
      return inText && inGov && inAge && inDate && Boolean(inTag);
    });

    // 2. Group the filtered results by prominence level
    const grouped = filteredData.reduce((acc, person) => {
      const level = person.prominence_level || FAME_LEVELS.CIVILIAN.level; // Default to civilian
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(person);
      return acc;
    }, {});

    // 3. Sort the people within each group by date (newest first)
    for (const level in grouped) {
      grouped[level].sort(
        (a, b) => new Date(b.date_of_death) - new Date(a.date_of_death)
      );
    }

    // 4. Get the keys (the level numbers) and sort them numerically
    const sortedLevels = Object.keys(grouped).sort((a, b) => a - b);

    return { grouped, sortedLevels };
  }, [q, gov, ageMin, ageMax, dateStart, dateEnd, tag]);

  return (
    <div
      className={classNames(
        'min-h-screen w-full bg-neutral-50 text-neutral-900 transition-colors',
        'dark:bg-neutral-950 dark:text-neutral-100'
      )}>
      <FloatingFlag lang={lang} />
      <audio
        ref={audioRef}
        src={RECITATION_SRC}
        preload="auto"
        aria-hidden="true"
      />
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60 bg-white/80 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6 shrink-0" />
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">
              {t.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ms-auto sm:justify-end">
            <button
              className="inline-flex w-full items-center justify-center gap-1 rounded-full border px-3 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:w-auto"
              onClick={playRecitation}
              title={t.audioAttribution}>
              <Volume2 size={16} /> {t.audioPlay}
            </button>
            <button
              className="inline-flex w-full items-center justify-center gap-1 rounded-full border px-3 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:w-auto"
              onClick={() => setShowVerse((v) => !v)}
              title={t.verseLabel}>
              <Info size={16} /> {t.verseLabel}
            </button>
            <button
              className="inline-flex w-full items-center justify-center gap-1 rounded-full border px-3 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:w-auto"
              onClick={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
              title={lang === 'ar' ? t.showEnglish : t.hideEnglish}>
              <Globe size={16} />{' '}
              {lang === 'ar' ? t.showEnglish : t.hideEnglish}
            </button>
            <button
              className="inline-flex w-full items-center justify-center gap-1 rounded-full border px-3 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:w-auto"
              onClick={() => setDark((d) => !d)}
              title={t.toggleTheme}>
              {dark ? <Sun size={16} /> : <Moon size={16} />} {t.toggleTheme}
            </button>
          </div>
        </div>
      </header>

      {audioAttempted && audioError && (
        <div className="mx-auto max-w-7xl px-4 pt-3 text-center text-sm text-amber-700 dark:text-amber-400 sm:text-end">
          {t.audioPrompt}
        </div>
      )}

      {/* Verse banner */}
      <AnimatePresence initial={false}>
        {showVerse && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-900 dark:to-neutral-950">
            <div className="mx-auto max-w-5xl px-4 py-4 text-center leading-relaxed">
              <p className="text-base md:text-lg font-medium">{t.verse}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero search & filters */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] items-start">
          <div className="relative">
            <Search
              className="absolute top-3 ms-3 text-neutral-500"
              size={18}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 ps-11 pe-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-700"
            />
          </div>
          <details className="md:ms-2 group w-full md:w-auto">
            <summary className="list-none">
              <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <Filter size={16} /> {t.filters}
              </button>
            </summary>
            <div className="mt-3 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Governorate */}
                <div>
                  <label className="block text-sm mb-1">{t.governorate}</label>
                  <select
                    value={gov}
                    onChange={(e) => setGov(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2">
                    <option value="">—</option>
                    {GOVERNORATES.map((g) => (
                      <option
                        key={g}
                        value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Age range */}
                <div>
                  <label className="block text-sm mb-1">{t.ageRange}</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={ageMin}
                      onChange={(e) => setAgeMin(Number(e.target.value))}
                      className="w-20 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-2 text-sm"
                    />
                    <span className="opacity-60 hidden sm:inline">—</span>
                    <span className="opacity-60 text-xs sm:hidden">↓</span>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={ageMax}
                      onChange={(e) => setAgeMax(Number(e.target.value))}
                      className="w-20 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-2 text-sm"
                    />
                  </div>
                </div>
                {/* Date range */}
                <div>
                  <label className="block text-sm mb-1">{t.dateRange}</label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                    />
                    <span className="opacity-60 hidden sm:inline">—</span>
                    <span className="opacity-60 text-xs sm:hidden text-center">
                      ↓
                    </span>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                {/* Tags */}
                <div>
                  <label className="block text-sm mb-1">{t.tags}</label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm">
                    <option value="">—</option>
                    {tagsAll.map((tg) => (
                      <option
                        key={tg}
                        value={tg}>
                        {tg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* Grid */}
      <main className="mx-auto max-w-7xl px-4 pb-16">
        {filtered.sortedLevels.length === 0 ? (
          <p className="opacity-70 text-center py-20">{t.empty}</p>
        ) : (
          <div className="space-y-12">
            {/* Iterate over the sorted level numbers (e.g., 1, 2, 3...) */}
            {filtered.sortedLevels.map((level) => {
              const levelDetails = getFameLevelDetails(Number(level));
              const peopleInLevel = filtered.grouped[level];

              // Don't render a section if there are no people or details
              if (!levelDetails || peopleInLevel.length === 0) {
                return null;
              }

              return (
                <section
                  key={level}
                  aria-labelledby={`level-title-${level}`}>
                  {/* Section Title */}
                  <div className="mb-4 border-b-2 border-neutral-200 dark:border-neutral-800 pb-2">
                    <h2
                      id={`level-title-${level}`}
                      className="text-xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200 sm:text-2xl">
                      {lang === 'ar'
                        ? levelDetails.name_ar
                        : levelDetails.name_en}
                    </h2>
                  </div>

                  {/* Grid for this level */}
                  <motion.div
                    layout
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <AnimatePresence>
                      {peopleInLevel.map((m, i) => (
                        // The <motion.article> for each person remains exactly the same as before.
                        // Just copy the entire <motion.article> block here.
                        <motion.article
                          key={m.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.25, delay: i * 0.03 }}
                          className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur shadow-sm hover:shadow-md">
                          <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                            {licenseOK(m) ? (
                              <img
                                src={m.photo_url}
                                alt={m.full_name_ar}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-6xl font-black tracking-tight select-none">
                                <span className="opacity-20">
                                  {initials(m.full_name_ar)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col p-4 space-y-3">
                            <h3 className="text-base font-semibold leading-snug sm:text-lg">
                              {lang === 'ar'
                                ? m.full_name_ar
                                : m.full_name_en || m.full_name_ar}
                            </h3>
                            <div className="text-sm opacity-80 flex flex-wrap gap-x-3 gap-y-1">
                              {m.age != null && <span>{m.age}</span>}
                              {m.hometown_ar && (
                                <span>
                                  {lang === 'ar'
                                    ? m.hometown_ar
                                    : m.hometown_en || m.hometown_ar}
                                </span>
                              )}
                              {m.date_of_death && (
                                <span>{m.date_of_death}</span>
                              )}
                            </div>
                            {m.tags && (
                              <div className="flex flex-wrap gap-1">
                                {m.tags.map((tg) => (
                                  <span
                                    key={tg}
                                    className="text-xs rounded-full border px-2 py-0.5 opacity-80">
                                    {tg}
                                  </span>
                                ))}
                              </div>
                            )}
                            {m.photo_license && (
                              <p className="text-[12px] opacity-60">
                                {t.license}: {m.photo_license}
                              </p>
                            )}
                            <div className="pt-2 flex flex-wrap gap-2">
                              {(m.sources || []).map((s) => (
                                <a
                                  key={s.url}
                                  href={s.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-sm underline underline-offset-2 hover:no-underline">
                                  {t.sources} <ExternalLink size={14} />
                                </a>
                              ))}
                              <button
                                type="button"
                                onClick={() => setSelected(m)}
                                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500/40 dark:hover:bg-neutral-800 dark:focus:ring-neutral-400/40">
                                <Info size={14} /> {viewBioLabel}
                              </button>
                            </div>
                          </div>
                        </motion.article>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/70 px-3 py-6 backdrop-blur sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}>
            <motion.div
              className="relative w-full max-w-3xl h-full max-h-[90vh] overflow-hidden rounded-3xl bg-white text-neutral-900 shadow-2xl ring-1 ring-neutral-900/10 dark:bg-neutral-900 dark:text-neutral-100 dark:ring-white/10"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white/80 text-neutral-600 shadow-sm transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500/40 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-200 dark:hover:bg-neutral-800"
                aria-label={closeLabel}>
                <X size={18} />
              </button>
              <div className="h-full overflow-y-auto">
                <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[260px,1fr]">
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800">
                      {licenseOK(selected) && selected.photo_url ? (
                        <img
                          src={selected.photo_url}
                          alt={
                            lang === 'ar'
                              ? selected.full_name_ar || selected.full_name_en
                              : selected.full_name_en || selected.full_name_ar
                          }
                          className="w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center text-5xl font-black opacity-20">
                          {initials(
                            selected.full_name_ar || selected.full_name_en
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm opacity-80">
                      {selected.age != null && <div>{selected.age}</div>}
                      {selected.hometown_ar && (
                        <div>
                          {lang === 'ar'
                            ? selected.hometown_ar
                            : selected.hometown_en || selected.hometown_ar}
                        </div>
                      )}
                      {selected.date_of_death && (
                        <div>{selected.date_of_death}</div>
                      )}
                      {selected.tags && (
                        <div className="flex flex-wrap gap-2">
                          {selected.tags.map((tg) => (
                            <span
                              key={tg}
                              className="rounded-full border px-2 py-0.5 text-xs opacity-80">
                              {tg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {(selected.sources || []).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">{t.sources}</h4>
                        <div className="flex flex-col gap-2">
                          {selected.sources.map((s) => (
                            <a
                              key={s.url}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm underline underline-offset-2 opacity-80 hover:no-underline">
                              {s.title || t.sources} <ExternalLink size={14} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold leading-tight">
                        {lang === 'ar'
                          ? selected.full_name_ar || selected.full_name_en
                          : selected.full_name_en || selected.full_name_ar}
                      </h3>
                      <p className="text-sm opacity-70">
                        {lang === 'ar'
                          ? selected.full_name_en || ''
                          : selected.full_name_ar || ''}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wide opacity-70">
                        {biographyTitle}
                      </h4>
                      <p className="leading-relaxed text-base">
                        {lang === 'ar'
                          ? selected.biography_ar || selected.biography_en || ''
                          : selected.biography_en ||
                            selected.biography_ar ||
                            ''}
                      </p>
                      {selected.biography_ar && selected.biography_en && (
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 text-sm leading-relaxed dark:border-neutral-800 dark:bg-neutral-800/70">
                          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">
                            {secondaryBiographyLabel}
                          </h5>
                          <p>
                            {lang === 'ar'
                              ? selected.biography_en
                              : selected.biography_ar}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About + footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60">
        <div className="mx-auto max-w-7xl px-4 py-8 grid gap-4 md:grid-cols-[1fr_auto] items-start">
          <div>
            <h4 className="font-semibold mb-2">{t.about}</h4>
            <p className="opacity-80 max-w-3xl">{t.aboutText}</p>
            <p className="opacity-60 text-sm mt-2">{t.disclaimer}</p>
          </div>
          <a
            href="mailto:contact@example.org?subject=Removal%20or%20Correction"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:w-auto">
            {t.removal} <X size={16} />
          </a>
        </div>
      </footer>
    </div>
  );
}

function initials(name) {
  const parts = String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return '—';
  return parts.map((p) => p[0]).join('');
}

function FloatingFlag({ lang }) {
  return (
    <div className="pointer-events-none fixed top-3 right-3 z-50 origin-top-right scale-75 sm:top-4 sm:right-4 sm:scale-100">
      <div className="flag-floating flex flex-col items-center gap-1">
        <div className="rounded-xl bg-white/90 dark:bg-neutral-900/90 p-2 shadow-lg ring-1 ring-black/10 dark:ring-white/10 backdrop-blur">
          <PalestineFlag className="flag-wave h-10 w-16" />
        </div>
        <span className="rounded-full bg-neutral-900/80 px-2 py-0.5 text-[11px] font-semibold text-neutral-100 shadow dark:bg-neutral-800/90">
          {lang === 'ar' ? 'فلسطين' : 'Palestine'}
        </span>
      </div>
    </div>
  );
}

function PalestineFlag({ className }) {
  return (
    <svg
      className={classNames('block', className)}
      viewBox="0 0 16 11"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Palestine flag">
      <path
        fill="#000000"
        d="M0 0h16v3.666H0z"
      />
      <path
        fill="#ffffff"
        d="M0 3.666h16v3.667H0z"
      />
      <path
        fill="#007a3d"
        d="M0 7.333h16V11H0z"
      />
      <path
        fill="#ce1126"
        d="M0 0l6 5.5L0 11z"
      />
    </svg>
  );
}
