
export type Language = 'ku' | 'ar' | 'fa' | 'en';
export type SectType = 'sweets' | 'main';

export interface TranslationStrings {
  restaurantName: string;
  address: string;
  phone: string;
  search: string;
  myOrder: string;
  total: string;
  showOrder: string;
  back: string;
  addToCart: string;
  currency: string;
  noItems: string;
  adminLogin: string;
  passwordPlaceholder: string;
  loginButton: string;
  logoutButton: string;
  addItem: string;
  save: string;
  edit: string;
  delete: string;
  itemName: string;
  itemPrice: string;
  itemImage: string;
  selectCategory: string;
  sects: {
    sweets: string;
    main: string;
  };
  categories: string;
  // Navigation
  dashboard: string;
  sectionsNavbar: string;
  categoriesNavbar: string;
  allItems: string;
  addProduct: string;
  settingsNavbar: string;
  mediaLibrary: string;

  // Dashboard
  welcomeAdmin: string;
  dataSummary: string;
  totalItems: string;
  totalCategories: string;
  todaysOrders: string;
  activity: string;
  quickTips: string;
  tipAdd: string;
  tipEdit: string;
  tipSave: string;

  // Wizard & Forms
  selectType: string;
  typeQuestion: string;
  addNewCategory: string;
  createCategory: string;
  kurdishName: string;
  englishName: string;
  cancel: string;
  add: string;
  saveSection: string;
  chooseImage: string;
  fillAllFields: string;
  sectionIdPlaceholder: string;
  enterId: string;
  backToHome: string;

  // Managers
  restaurantInfo: string;
  exportJSON: string;
  importJSON: string; // Added
  backupRestore: string; // Added
  exportDesc: string;
  newCategory: string;
  itemsCount: string;
  changeImage: string;

  // Media
  uploadNew: string;
  uploading: string;
  noImages: string;
  deleteConfirm: string;
  uploadFailed: string;
  deleteFailed: string;
  loading: string;

  // Alerts & Messages
  adminLoginError: string;
  itemAdded: string;
  offline: string;
  emptyBasket: string;
  slogan: string;
  orderPlaced: string; // 'Order placed' message

  // Missing Keys from Constants
  manageMenu: string;
  mediaFolder: string;
  restaurantSettings: string;
  foods: string;
  uploadImage: string;
  active: string;
  hidden: string;
  manageFoods: string;

  // New/optional UI Labels
  team: string;
  teamIntro: string;
  totalPriceLabel: string;
  placeOrder: string;
  myOrders: string;
  orderHistory: string;
  orders?: string; // Admin label for Orders


  // Specific Labels
  premiumKeto: string;
  logoAlt: string;
  descriptionLabel: string; // Added field
  role_owner: string;
  role_manager: string;
  role_chef: string;
  role_staff: string;
}

export interface MenuItem {
  id: number;
  categoryId: string;
  price: number;
  image: string;
  emoji?: string;
  order?: number;
  calories?: number;
  macros?: {
    protein: number;
    fat: number;
    carbs: number;
  };
  translations: Record<Language, { name: string; description?: string; ingredients?: string }>;
}

export interface Section {
  id: string;
  image: string;
  emoji?: string;
  order?: number;
  translations: Record<Language, string>;
}

export interface Category {
  id: string;
  sectionId: string;
  image: string;
  emoji?: string;
  order?: number;
  translations: Record<Language, string>;
  isActive?: boolean;
}

export interface CartItem {
  id: number;
  quantity: number;
}

export interface Order {
  id?: string;
  items: CartItem[];
  total: number;
  deviceId: string;
  status?: 'new' | 'processing' | 'completed' | 'cancelled';
  createdAt?: number;
  customerNote?: string;
}

// Export / Backup package
export interface ExportPackage {
  meta: {
    version: string;
    createdAt: number;
    checksum?: string;
    fileName?: string;
  };
  items: MenuItem[];
  categories: Category[];
  sections: Section[];
  profiles: Profile[];
  roles: Role[];
}

export interface BackupRecord {
  id?: string;
  meta: {
    version: string;
    createdAt: number;
    checksum?: string;
    fileName?: string;
  };
  performedBy?: string; // admin identifier
  notes?: string;
  fileUrl?: string; // Storage download URL for the payload
  storagePath?: string; // Storage path inside the bucket
  payload?: ExportPackage; // Optional embedded payload for quick preview
  sizeBytes?: number;
} 

export interface Role {
  id: string;
  name: string; // Fallback
  translations: Record<Language, string>;
  order: number;
}

export interface Profile {
  id: string;
  name: string; // Full name (Fallback or internal)
  role: string; // Role ID
  description?: string; // (Fallback)
  translations: Record<Language, { name: string; description: string; }>; // New multi-language support
  image: string;
  phone: string;
  email: string;
  socials: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    tiktok?: string;
    snapchat?: string;
  };
  isActive: boolean;
  order?: number;
}
