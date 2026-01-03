
import { MenuItem, Category, TranslationStrings, Language } from './types';

export const TRANSLATIONS: Record<Language, TranslationStrings> = {
  ku: {
    restaurantName: "مازن بۆ کیتۆ",
    address: "شەقامی شۆڕش، هەولێر",
    phone: "07500997000",
    search: "بگەڕێ بۆ خواردنی تەندروست...",
    myOrder: "داواکارییەکانم:",
    total: "کۆی گشتی:",
    totalPriceLabel: "نرخی کۆی گشتی" ,
    placeOrder: "فەرمان بنێرە",
    orderPlaced: "فەرمان بەسەرکەوتوویی نێردرا",
    myOrders: "داواکارییەکانم",
    orderHistory: "مێژووی داواکارییەکان",

    showOrder: "سەبەتەی کڕین",
    back: "گەڕانەوە",
    addToCart: "زیادکردن",
    currency: "د.ع",
    noItems: "هیچ کاڵایەک نەدۆزرایەوە",
    adminLogin: "چوونەژوورەوەی بەڕێوبەر",
    passwordPlaceholder: "پاسۆرد بنووسە...",
    loginButton: "چوونەژوورەوە",
    logoutButton: "چوونە دەرەوە",
    addItem: "زیادکردنی خواردن",
    save: "پاشکەوتکردن",
    edit: "دەستکاری",
    delete: "سڕینەوە",
    itemName: "ناوی خواردن",
    itemPrice: "نرخ",
    itemImage: "لینکی وێنە",
    selectCategory: "بەش هەڵبژێرە",
    sects: {
      sweets: "شیرینی",
      main: "سەرەکی"
    },
    // New Translations
    slogan: "تاکە شوێن بۆ سەلامەتی تۆ، مازن بۆ کیتۆ هەڵبژێرە",
    manageMenu: "بەڕێوەبردنی مێنیو",
    mediaFolder: "فۆڵدەری وێنەکان",
    restaurantSettings: "رێکخستنەکان",
    categories: "هاوپۆلەکان",
    foods: "خواردنەکان",
    uploadImage: "دانانی وێنە",
    active: "چالاک",
    hidden: "شاراوە",
    manageFoods: "بەڕێوەبردنی کاڵاکان",

    // Navigation
    dashboard: "داشبۆرد",
    sectionsNavbar: "بەشەکان",
    categoriesNavbar: "هاوپۆلەکان",
    allItems: "هەموو خواردنەکان",
    addProduct: "زیادکردنی بەرهەم",
    settingsNavbar: "ڕێکخستنەکان",
    mediaLibrary: "فۆڵدەری وێنەکان",

    // Dashboard
    welcomeAdmin: "بەخێربێیتەوە بەڕێوبەر 👋",
    dataSummary: "پوختەیەک لە داتاکانی ئەمڕۆ",
    totalItems: "کۆی بەرهەمەکان",
    totalCategories: "کۆی هاوپۆلەکان",
    todaysOrders: "داواکاری ئەمڕۆ",
    activity: "چالاکی",
    quickTips: "ڕێنمایی خێرا",
    tipAdd: "بۆ زیادکردنی خواردن بڕۆ بەشی 'زیادکردن'",
    tipEdit: "دەتوانیت نرخ و وێنەکان لە 'لیستی خواردن' بگۆڕیت",
    tipSave: "هەمیشە پاش گۆڕانکاری دوگمەی 'پاشکەوتکردن' دابگرە",

    // Wizard & Forms
    selectType: "جۆری بەرهەم هەڵبژێرە",
    typeQuestion: "ئایە بەرهەمەکە سەرەکییە یان شیرینی؟",
    addNewCategory: "زیادکردنی هاوپۆل",
    createCategory: "زیادکردنی هاوپۆلی نوێ",
    kurdishName: "ناوی کوردی",
    englishName: "English Name",
    cancel: "پاشگەزبوونەوە",
    add: "زیادکردن",
    saveSection: "پاشکەوتکردن",
    chooseImage: "وێنە هەڵبژێرە",
    fillAllFields: "تکایە هەموو بەشەکان پڕبکەرەوە",
    sectionIdPlaceholder: "Section ID (e.g., drinks)",
    enterId: "ID بنووسە",
    backToHome: "سەرەکی",

    // Managers
    restaurantInfo: "زانیاری ڕێستۆرانت (هەموو زمانەکان)",
    exportJSON: "دابەزاندنی داتا (JSON)",
    importJSON: "گەڕاندنەوەی داتا (JSON)",
    backupRestore: "هەڵگرتن و گەڕاندنەوە",
    exportDesc: "دابەزاندنی هەموو داتاکان وەک فایل",
    newCategory: "هاوپۆلی نوێ",
    itemsCount: "Items",
    changeImage: "گۆڕینی وێنە",

    // Media
    uploadNew: "زیادکردنی وێنە",
    uploading: "جارێ دەکرێت...",
    noImages: "هیچ وێنەیەک نییە",
    deleteConfirm: "دڵنیایت لە سڕینەوە؟",
    uploadFailed: "کێشەیەک هەیە لە کاتی بەرزکردنەوە",
    deleteFailed: "نەتوانرا بسڕدرێتەوە",
    loading: "چاوەڕوانبە...",

    // Alerts
    adminLoginError: "پاسۆرد هەڵەیە!",
    itemAdded: "خواردن زیادکرا",
    offline: "تۆ ئۆفلاینیت",
    emptyBasket: "سەبەتەکەت بەتاڵە",
    premiumKeto: "پریمیۆم کیتۆ",
    logoAlt: "لۆگۆی مازن",
    descriptionLabel: "دەربارە (ژیاننامە)",    team: "تیم",
    teamIntro: "",    // Roles
    role_owner: "خاوەنی ڕێستورانت",
    role_manager: "بەڕێوەبەر",
    role_chef: "شێف",
    role_staff: "کارمەندانی ڕێستورانت",
  },
  ar: {
    restaurantName: "مازن للكيتو",
    address: "شارع شورش، أربيل",
    phone: "07500997000",
    search: "ابحث عن طعام صحي...",
    myOrder: "طلبي:",
    total: "المجموع:",
    totalPriceLabel: "سعر الإجمالي" ,
    placeOrder: "إرسال الطلب",
    orderPlaced: "تم إرسال الطلب بنجاح",
    myOrders: "طلباتِي",
    orderHistory: "تاريخ الطلبات",

    showOrder: "عرض السلة",
    back: "رجوع",
    addToCart: "إضافة",
    currency: "د.ع",
    noItems: "لم يتم العثور على سلع",
    adminLogin: "دخول المسؤول",
    passwordPlaceholder: "أدخل كلمة المرور...",
    loginButton: "تسجيل الدخول",
    logoutButton: "تسجيل الخروج",
    addItem: "إضافة طعام",
    save: "حفظ",
    edit: "تعديل",
    delete: "حذف",
    itemName: "اسم الطعام",
    itemPrice: "السعر",
    itemImage: "رابط الصورة",
    selectCategory: "اختر القسم",
    sects: {
      sweets: "حلويات",
      main: "رئيسي"
    },
    // New Translations
    slogan: "لأجل سلامتك، اختر مازن للكيتو",
    manageMenu: "إدارة القائمة",
    mediaFolder: "مجلد الصور",
    restaurantSettings: "الإعدادات",
    categories: "الفئات",
    foods: "الأطعمة",
    uploadImage: "رفع صورة",
    active: "نشط",
    hidden: "مخفي",
    manageFoods: "إدارة الأطعمة",

    // Navigation
    dashboard: "لوحة التحكم",
    sectionsNavbar: "الأقسام",
    categoriesNavbar: "الفئات",
    allItems: "جميع الأطعمة",
    addProduct: "إضافة منتج",
    settingsNavbar: "الإعدادات",
    mediaLibrary: "مكتبة الصور",

    // Dashboard
    welcomeAdmin: "مرحبًا بك مرة أخرى 👋",
    dataSummary: "ملخص بيانات اليوم",
    totalItems: "إجمالي المنتجات",
    totalCategories: "إجمالي الفئات",
    todaysOrders: "طلبات اليوم",
    activity: "النشاط",
    quickTips: "نصائح سريعة",
    tipAdd: "لإضافة طعام، انتقل إلى قسم 'إضافة'",
    tipEdit: "يمكنك تعديل الأسعار والصور من 'قائمة الطعام'",
    tipSave: "اضغط دائمًا على 'حفظ' بعد التغييرات",

    // Wizard & Forms
    selectType: "اختر نوع المنتج",
    typeQuestion: "هل المنتج رئيسي أم حلويات؟",
    addNewCategory: "إضافة فئة",
    createCategory: "إنشاء فئة جديدة",
    kurdishName: "الاسم بالكردي",
    englishName: "الاسم بالإنجليزية",
    cancel: "إلغاء",
    add: "إضافة",
    saveSection: "حفظ القسم",
    chooseImage: "اختر صورة",
    fillAllFields: "يرجى ملء جميع الحقول",
    sectionIdPlaceholder: "معرف القسم (مثل: drinks)",
    enterId: "أدخل المعرف",
    backToHome: "الرئيسية",

    // Managers
    restaurantInfo: "معلومات المطعم (جميع اللغات)",
    exportJSON: "تصدير البيانات (JSON)",
    importJSON: "استيراد البيانات (JSON)",
    backupRestore: "النسخ الاحتياطي والاستعادة",
    exportDesc: "تنزيل جميع البيانات كملف",
    newCategory: "فئة جديدة",
    itemsCount: "عنصر",
    changeImage: "تغيير الصورة",

    // Media
    uploadNew: "رفع صورة جديدة",
    uploading: "جاري الرفع...",
    noImages: "لا توجد صور",
    deleteConfirm: "هل أنت متأكد من الحذف؟",
    uploadFailed: "فشل الرفع",
    deleteFailed: "فشل الحذف",
    loading: "جاري التحميل...",

    adminLoginError: "كلمة المرور غير صحيحة!",
    itemAdded: "تم إضافة الطعام",
    offline: "أنت غير متصل بالإنترنت",
    emptyBasket: "سلتك فارغة",
    premiumKeto: "كيتو ممتاز",
    logoAlt: "شعار مازن",
    descriptionLabel: "عن الشخص (السيرة الذاتية)",
    team: "الفريق",
    teamIntro: "",
    orders: "الطلبات",
    // Roles
    role_owner: "صاحب المطعم",
    role_manager: "المدير",
    role_chef: "شيف",
    role_staff: "طاقم العمل",
  },
  fa: {
    restaurantName: "مازن برای کیتو",
    address: "خیابان شورش، اربیل",
    phone: "07500997000",
    search: "جستجوی غذای سالم...",
    myOrder: "سفارش من:",
    total: "مجموع:",
    totalPriceLabel: "قیمت کل" ,
    placeOrder: "ثبت سفارش",
    orderPlaced: "سفارش با موفقیت ثبت شد",
    myOrders: "سفارش‌های من",
    orderHistory: "تاریخچه سفارش‌ها",

    showOrder: "نمایش سبد خرید",
    back: "بازگشت",
    addToCart: "افزودن",
    currency: "د.ع",
    noItems: "موردی یافت نشد",
    adminLogin: "ورود مدیر",
    passwordPlaceholder: "رمز عبور را وارد کنید...",
    loginButton: "ورود",
    logoutButton: "خروج",
    addItem: "افزودن غذا",
    save: "ذخیره",
    edit: "ویرایش",
    delete: "حذف",
    itemName: "نام غذا",
    itemPrice: "قیمت",
    itemImage: "لینک تصویر",
    selectCategory: "انتخاب دسته",
    sects: {
      sweets: "شیرینی",
      main: "اصلی"
    },
    // New Translations
    slogan: "برای سلامتی خود، مازن برای کیتو را انتخاب کنید",
    manageMenu: "مدیریت منو",
    mediaFolder: "پوشه تصاویر",
    restaurantSettings: "تنظیمات",
    categories: "دسته‌بندی‌ها",
    foods: "غذاها",
    uploadImage: "آپلود تصویر",
    active: "فعال",
    hidden: "پنهان",
    manageFoods: "مدیریت غذاها",

    // Navigation
    dashboard: "داشبورد",
    sectionsNavbar: "بخش‌ها",
    categoriesNavbar: "دسته‌بندی‌ها",
    allItems: "همه غذاها",
    addProduct: "افزودن محصول",
    settingsNavbar: "تنظیمات",
    mediaLibrary: "کتابخانه تصاویر",

    // Dashboard
    welcomeAdmin: "خوش آمدید مدیر 👋",
    dataSummary: "خلاصه داده‌های امروز",
    totalItems: "کل محصولات",
    totalCategories: "کل دسته‌بندی‌ها",
    todaysOrders: "سفارشات امروز",
    activity: "فعالیت",
    quickTips: "نکات سریع",
    tipAdd: "برای افزودن غذا به بخش 'افزودن' بروید",
    tipEdit: "می‌توانید قیمت و تصاویر را در 'لیست غذا' تغییر دهید",
    tipSave: "همیشه پس از تغییرات دکمه 'ذخیره' را بزنید",

    // Wizard & Forms
    selectType: "انتخاب نوع محصول",
    typeQuestion: "آیا محصول اصلی است یا شیرینی؟",
    addNewCategory: "افزودن دسته‌بندی",
    createCategory: "ایجاد دسته‌بندی جدید",
    kurdishName: "نام کردی",
    englishName: "نام انگلیسی",
    cancel: "لغو",
    add: "افزودن",
    saveSection: "ذخیره بخش",
    chooseImage: "انتخاب تصویر",
    fillAllFields: "لطفا همه فیلدها را پر کنید",
    sectionIdPlaceholder: "شناسه بخش (مانند: drinks)",
    enterId: "شناسه را وارد کنید",
    backToHome: "خانه",

    // Managers
    restaurantInfo: "اطلاعات رستوران (همه زبان‌ها)",
    exportJSON: "صدور داده‌ها (JSON)",
    importJSON: "وارد کردن داده‌ها (JSON)",
    backupRestore: "پشتیبان‌گیری و بازیابی",
    exportDesc: "دانلود همه داده‌ها به عنوان فایل",
    newCategory: "دسته‌بندی جدید",
    itemsCount: "آیتم",
    changeImage: "تغییر تصویر",

    // Media
    uploadNew: "آپلود تصویر جدید",
    uploading: "در حال آپلود...",
    noImages: "تصویری وجود ندارد",
    deleteConfirm: "آیا از حذف مطمئن هستید؟",
    uploadFailed: "آپلود ناموفق بود",
    deleteFailed: "حذف ناموفق بود",
    loading: "در حال بارگذاری...",

    adminLoginError: "رمز عبور نادرست است!",
    itemAdded: "غذا اضافه شد",
    offline: "شما آفلاین هستید",
    emptyBasket: "سبد خرید شما خالی است",
    premiumKeto: "کیتو ممتاز",
    logoAlt: "لوگوی مازن",
    descriptionLabel: "درباره (بیوگرافی)",
    team: "تیم",
    teamIntro: "",
    orders: "سفارشات",
    // Roles
    role_owner: "صاحب رستوران",
    role_manager: "مدیر",
    role_chef: "سرآشپز",
    role_staff: "کارکنان",
  },
  en: {
    restaurantName: "Mazin For Keto",
    address: "Shorsh Street, Erbil",
    phone: "07500997000",
    search: "Search healthy food...",
    myOrder: "MY ORDER:",
    total: "Total:",
    totalPriceLabel: "Total Price" ,
    placeOrder: "Place Order",
    orderPlaced: "Order placed successfully",
    myOrders: "My Orders",
    orderHistory: "Order History",

    showOrder: "View Cart",
    back: "Back",
    addToCart: "Add",
    currency: "IQD",
    noItems: "No items found",
    adminLogin: "Admin Login",
    passwordPlaceholder: "Enter password...",
    loginButton: "Login",
    logoutButton: "Logout",
    addItem: "Add Item",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    itemName: "Item Name",
    itemPrice: "Price",
    itemImage: "Image Link",
    selectCategory: "Select Category",
    sects: {
      sweets: "Sweets",
      main: "Main"
    },
    // New Translations
    slogan: "Choose Mazin For Keto for your Safety",
    manageMenu: "Menu Management",
    mediaFolder: "Media Folder",
    restaurantSettings: "Settings",
    categories: "Categories",
    foods: "Foods",
    uploadImage: "Upload Image",
    active: "Active",
    hidden: "Hidden",
    manageFoods: "Manage Foods",

    // Navigation
    dashboard: "Dashboard",
    sectionsNavbar: "Sections",
    categoriesNavbar: "Categories",
    allItems: "All Items",
    addProduct: "Add Product",
    settingsNavbar: "Settings",
    mediaLibrary: "Media Library",

    // Dashboard
    welcomeAdmin: "Welcome Back Admin 👋",
    dataSummary: "Summary of today's data",
    totalItems: "Total Items",
    totalCategories: "Total Categories",
    todaysOrders: "Today's Orders",
    activity: "Activity",
    quickTips: "Quick Tips",
    tipAdd: "To add food go to 'Add Product'",
    tipEdit: "You can edit prices and images in 'All Items'",
    tipSave: "Always click 'Save' after changes",

    // Wizard & Forms
    selectType: "Select Product Type",
    typeQuestion: "Is it a Main dish or Sweets?",
    addNewCategory: "Add Category",
    createCategory: "Create New Category",
    kurdishName: "Kurdish Name",
    englishName: "English Name",
    cancel: "Cancel",
    add: "Add",
    saveSection: "Save Section",
    chooseImage: "Choose Image",
    fillAllFields: "Please fill all fields",
    sectionIdPlaceholder: "Section ID (e.g., drinks)",
    enterId: "Enter ID",
    backToHome: "Home",

    // Managers
    restaurantInfo: "Restaurant Info (All Languages)",
    exportJSON: "Export Data (JSON)",
    importJSON: "Restore Data (JSON)",
    backupRestore: "Backup & Restore",
    exportDesc: "Download all data as a file",
    newCategory: "New Category",
    itemsCount: "items",
    changeImage: "Change Image",

    // Media
    uploadNew: "Upload New",
    uploading: "Uploading...",
    noImages: "No images found",
    deleteConfirm: "Are you sure you want to delete?",
    uploadFailed: "Upload failed",
    deleteFailed: "Delete failed",
    loading: "Loading...",

    adminLoginError: "Incorrect password!",
    itemAdded: "Item added successfully",
    offline: "You are offline",
    emptyBasket: "Your basket is empty",
    premiumKeto: "Premium Keto",
    logoAlt: "Mazin Logo",
    descriptionLabel: "About (Bio)",
    team: "Team",
    teamIntro: "",
    orders: "Orders",
    // Roles
    role_owner: "Restaurant Owner",
    role_manager: "Manager",
    role_chef: "Chef",
    role_staff: "Restaurant Staff",
  }
};

export const INITIAL_SECTIONS: import('./types').Section[] = [
  { id: 'main', image: '', translations: { ku: 'سەرەکی', ar: 'رئيسي', fa: 'اصلی', en: 'Main' } },
  { id: 'sweets', image: '', translations: { ku: 'شیرینی', ar: 'حلويات', fa: 'شیرینی', en: 'Sweets' } }
];

export const CATEGORIES: Category[] = [
  // Sweets Sect (ordered per request)
  { id: 'drinks', sectionId: 'sweets', order: 0, image: '', translations: { ku: 'خواردنەوەکانی کیتۆ', ar: 'مشروبات', fa: 'نوشیدنی‌ها', en: 'DRINKS' } },
  { id: 'sweets', sectionId: 'sweets', order: 1, image: '', translations: { ku: 'شیرینیەکانی کیتۆ', ar: 'حلويات كيتو', fa: 'شیرینی کیتو', en: 'KETO SWEETS' } },
  { id: 'ice_cream', sectionId: 'sweets', order: 2, image: '', translations: { ku: 'ئایسکرێمەکانی کیتۆ', ar: 'آيس كريم كيتو', fa: 'بستنی کیتو', en: 'KETO ICE CREAM' } },

  // Main Sect (explicit order: Soup, Salads, Appetizers, Grilled, Main Dishes, Keto Burger, Almond Pizza, Market)
  { id: 'soup', sectionId: 'main', order: 0, image: '', translations: { ku: 'شۆربا', ar: 'شوربة', fa: 'سوپ', en: 'SOUP' } },
  { id: 'salads', sectionId: 'main', order: 1, image: '', translations: { ku: 'زەڵاتەکان', ar: 'سلطات', fa: 'سالاد', en: 'SALADS' } },
  { id: 'appetizers', sectionId: 'main', order: 2, image: '', translations: { ku: 'پێش خواردن', ar: 'مقبلات', fa: 'پیش غذا', en: 'APPETIZERS' } },
  { id: 'grilled', sectionId: 'main', order: 3, image: '', translations: { ku: 'برژاوەکان', ar: 'مشويات', fa: 'کبابی', en: 'GRILLED' } },
  { id: 'main_dishes', sectionId: 'main', order: 4, image: '', translations: { ku: 'ژەمەسەریەکان', ar: 'وجبات رئيسية', fa: 'غذاهای اصلی', en: 'MAIN DISHES' } },
  { id: 'burger', sectionId: 'main', order: 5, image: '', translations: { ku: 'بەرگەری کیتۆ', ar: 'برجر كيتو', fa: 'برگر کیتو', en: 'KETO BURGER' } },
  { id: 'pizza', sectionId: 'main', order: 6, image: '', translations: { ku: 'پیتزای بادەم', ar: 'بيتزا اللوز', fa: 'پیتزا بادام', en: 'ALMOND PIZZA' } },
  { id: 'market', sectionId: 'main', order: 7, image: '', translations: { ku: 'ماڕکێت', ar: 'سوق', fa: 'مارکت', en: 'MARKET' } },
];

export const INITIAL_ROLES: import('./types').Role[] = [
  { id: 'owner', name: 'Restaurant Owner', order: 0, translations: { ku: 'خاوەنی ڕێستورانت', ar: 'صاحب المطعم', fa: 'صاحب رستوران', en: 'Restaurant Owner' } },
  { id: 'manager', name: 'Manager', order: 1, translations: { ku: 'بەڕێوەبەر', ar: 'المدير', fa: 'مدیر', en: 'Manager' } },
  { id: 'chef', name: 'Chef', order: 2, translations: { ku: 'شێف', ar: 'شيف', fa: 'سرآشپز', en: 'Chef' } },
  { id: 'staff', name: 'Staff', order: 3, translations: { ku: 'کارمەندانی ڕێستورانت', ar: 'طاقم العمل', fa: 'کارکنان', en: 'Staff' } },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Drinks
  {
    id: 1, categoryId: 'drinks', price: 4500, image: '',
    translations: { ku: { name: 'قاوەی بولێت پڕۆف (کیتۆ)' }, ar: { name: 'قهوة بوليت بروف' }, fa: { name: 'قهوه بولت پروف' }, en: { name: 'Bulletproof Coffee' } }
  },
  {
    id: 2, categoryId: 'drinks', price: 3000, image: '',
    translations: { ku: { name: 'لیمۆنادی تازە بە ستیڤیا' }, ar: { name: 'ليموناضة بالستيفيا' }, fa: { name: 'لموناد با استویا' }, en: { name: 'Fresh Lemonade with Stevia' } }
  },

  // Sweets
  {
    id: 3, categoryId: 'sweets', price: 6500, image: '',
    translations: { ku: { name: 'چیزکەیکی بێری کیتۆ' }, ar: { name: 'تشيز كيك كيتو' }, fa: { name: 'چیزکیک کیتو' }, en: { name: 'Keto Berry Cheesecake' } }
  },
  {
    id: 4, categoryId: 'sweets', price: 5000, image: '',
    translations: { ku: { name: 'بڕاونیس بە ئاردی بادەم' }, ar: { name: 'براونيز بدقيق اللوز' }, fa: { name: 'براونیز با آرد بادام' }, en: { name: 'Almond Flour Brownies' } }
  },

  // Ice Cream
  {
    id: 5, categoryId: 'ice_cream', price: 4000, image: '',
    translations: { ku: { name: 'ئایسکرێمی ڤانیلای کیتۆ' }, ar: { name: 'آيس كريم فانيليا كيتو' }, fa: { name: 'بستنی وانیلی کیتو' }, en: { name: 'Keto Vanilla Ice Cream' } }
  },
  {
    id: 6, categoryId: 'ice_cream', price: 4500, image: '',
    translations: { ku: { name: 'ئایسکرێمی شوکولاتەی تۆخ' }, ar: { name: 'آيس كريم شوكولاتة داكنة' }, fa: { name: 'بستنی شکلات تلخ' }, en: { name: 'Dark Chocolate Ice Cream' } }
  },

  // Main Dishes
  {
    id: 7, categoryId: 'main_dishes', price: 15000, image: '',
    translations: { ku: { name: 'سەلەمۆنی برژاو لەگەڵ سەوزە' }, ar: { name: 'سلمون مشوي مع خضار' }, fa: { name: 'سلمون کبابی با سبزیجات' }, en: { name: 'Grilled Salmon with Veggies' } }
  },
  {
    id: 8, categoryId: 'burger', price: 9500, image: '',
    translations: { ku: { name: 'بەرگری کیتۆ (بە کاهوو)' }, ar: { name: 'برجر كيتو بالخس' }, fa: { name: 'برگر کیتو با کاهو' }, en: { name: 'Keto Burger (Lettuce Wrap)' } }
  },
  {
    id: 9, categoryId: 'pizza', price: 12000, image: '',
    translations: { ku: { name: 'پیزای بادەم و مارگاریتا' }, ar: { name: 'بيتزا اللوز مارغريتا' }, fa: { name: 'پیتزا بادام مارگاریتا' }, en: { name: 'Almond Crust Margherita' } }
  },
  {
    id: 10, categoryId: 'grilled', price: 14000, image: '',
    translations: { ku: { name: 'شیش تاووقی کیتۆ' }, ar: { name: 'شيش طاووق كيتو' }, fa: { name: 'جوجه کباب کیتو' }, en: { name: 'Keto Shish Taouk' } }
  },
  {
    id: 11, categoryId: 'salads', price: 6000, image: '',
    translations: { ku: { name: 'زەڵاتەی ئەڤۆکادۆ و سپیناخ' }, ar: { name: 'سلطة أفوكادو وسبانخ' }, fa: { name: 'سالاد آووکادو و اسفناج' }, en: { name: 'Avocado Spinach Salad' } }
  }
];
