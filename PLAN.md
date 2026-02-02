# خطة التطوير - Mushaf Mauri V3

## الملفات الجديدة المطلوبة

### 1. نظام i18n (اللغات)
- `src/i18n/index.ts` - مدير اللغات
- `src/i18n/locales/ar.ts` - عربي (منسوخ من الأصلي)
- `src/i18n/locales/en.ts` - إنجليزي
- `src/i18n/locales/fr.ts` - فرنسي
- `src/i18n/locales/amz.ts` - أمازيغي

### 2. نظام الحالة (State) مع Zustand
- `src/store/useAppStore.ts` - مخزن الحالة العام
  - `lang` - اللغة الحالية
  - `quira` - نوع المصحف (madina/warsh)
  - `theme` - الثيم الحالي (عادي/ليلي/أصفر/أزرق/أخضر)
  - `moqriId` - المقرئ الحالي
  - `currentPage` - الصفحة الحالية
  - `selectedAya` - الآية المحددة {sura, aya, page}
  - `isPlaying` - حالة التشغيل
  - `scrollToPage` - دالة للانتقال لصفحة

### 3. بيانات المصحف المحمدي
- `src/data/coordinateMuhammadi.js` - إحداثيات المحمدي (نسخ من الأصلي)
- `src/data/indexMuhammadi.js` - فهرس المحمدي (نسخ من الأصلي)

### 4. الإحداثيات الموحدة
- تعديل `src/utils/coordinates.ts`:
  - إضافة `getPageCoordinatesMuhammadi()` بنفس منطق الأصلي
  - دالة موحدة `getCoordinates(page, quira)` تختار تلقائياً
  - `TOTAL_PAGES` حسب نوع المصحف (604 مدينة / 604 محمدي)

### 5. مكون مشغل الصوت
- `src/components/AudioPlayer.tsx`
  - شريط في الأسفل يظهر عند تحديد آية أو تشغيل
  - أزرار: تشغيل/إيقاف، الآية التالية، السابقة
  - زر اختيار المقرئ (يفتح Modal)
  - يعرض اسم السورة:الآية الحالية
  - عند انتهاء الآية → تشغيل الآية التالية تلقائياً
  - إذا الآية التالية في صفحة أخرى → scroll للصفحة الجديدة ثم تحديد الآية
  - URL الصوت: `http://quran.ksu.edu.sa/ayat/mp3/{moqriId}/{suraAyaId}.mp3`
  - suraAyaId = سورة 3 أرقام + آية 3 أرقام (مثال: 002005 = البقرة آية 5)

### 6. مكون اختيار المقرئ
- `src/components/ReciterModal.tsx`
  - Modal يعرض قائمة 35 مقرئ من `listAuthor.js`
  - الأسماء من ملفات i18n

### 7. تعديل QuranPage.tsx
- عند الضغط → تحديد الآية وتغيير لون الخلفية إلى لون خفيف شفاف (مثلاً أزرق 20% شفافية)
- الآية المحددة حالياً (selectedAya) تبقى مميزة
- عند التشغيل الآية الحالية تتلون

### 8. شاشة القائمة الرئيسية (Home)
- `src/screens/HomeScreen.tsx`
  - صورة الغلاف (cover) من الأصلي
  - اختيار المصحف (حفص مدينة / ورش محمدي)
  - اختيار اللغة
  - الوضع الليلي / اختيار الثيم (5 ثيمات)
  - زر "فتح المصحف"

### 9. نظام الثيمات
- `src/theme/themes.ts`
  ```
  themes = [
    { bg: "#ccc", color: "#000", night: true },   // ليلي
    { bg: "#fff", color: "#000" },                 // أبيض
    { bg: "#fffcd9", color: "#000" },              // أصفر
    { bg: "#e8f7fe", color: "#369" },              // أزرق
    { bg: "#e7f7ec", color: "#009" },              // أخضر
  ]
  ```

### 10. تعديل MushafViewer.tsx
- استقبال `quira` من store لتحديد نوع المصحف
- تطبيق الثيم على الخلفية
- ربط AudioPlayer في الأسفل
- ربط selectedAya مع QuranPage
- إضافة `ref` لـ FlatList للتحكم بالـ scroll من الخارج (عند تشغيل آية في صفحة أخرى)

### 11. تعديل api.ts
- إضافة `getAudioUri(moqriId, sura, aya)`
- تعديل `getImagePageUri` ليدعم المحمدي أيضاً

---

## ترتيب التنفيذ

1. **نسخ ملفات البيانات** (coordinateMuhammadi, indexMuhammadi, listAuthor)
2. **إنشاء نظام i18n** (نسخ الملفات + إنشاء مدير اللغات)
3. **تثبيت الحزم** (zustand, expo-av)
4. **إنشاء store** (useAppStore مع Zustand)
5. **إنشاء الثيمات** (themes.ts)
6. **تعديل coordinates.ts** (إضافة المحمدي + دالة موحدة)
7. **تعديل types/index.ts** (إضافة أنواع جديدة)
8. **تعديل api.ts** (إضافة audio URL)
9. **تعديل QuranPage.tsx** (تلوين الآية المحددة)
10. **إنشاء AudioPlayer.tsx** (مشغل الصوت مع expo-av)
11. **إنشاء ReciterModal.tsx** (اختيار المقرئ)
12. **تعديل MushafViewer.tsx** (ربط كل شيء)
13. **إنشاء HomeScreen.tsx** (القائمة الرئيسية)
14. **تعديل App.tsx** (navigation بين Home و Mushaf)

---

## الحزم المطلوبة
- `zustand` - إدارة الحالة
- `expo-av` - تشغيل الصوت
- `@react-navigation/native` + `@react-navigation/native-stack` - التنقل
