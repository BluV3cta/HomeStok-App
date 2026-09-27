export type StoreName = string;

export type GroceryCategory = 
  | 'pantry' 
  | 'produce' 
  | 'dairy_eggs' 
  | 'meat_fish' 
  | 'household' 
  | 'snacks_drinks' 
  | 'spices' 
  | 'other';

export type StockLevel = 'out_of_stock' | 'low' | 'adequate' | 'well_stocked';

export type CurrencyCode = 'GHS' | 'USD' | 'GBP' | 'EUR' | 'NGN' | 'CAD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToGHS: number; // e.g. 1 USD = 16.20 GHS => amount in USD = amountInGHS / 16.20
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghana Cedi', rateToGHS: 1.0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToGHS: 16.25 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToGHS: 21.40 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToGHS: 17.80 },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rateToGHS: 0.0102 }, // 1 GHS ≈ 98 NGN => 1 NGN ≈ 0.0102 GHS
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateToGHS: 11.95 },
};

export interface GroceryItem {
  id: string;
  name: string;
  category: GroceryCategory;
  stockLevel: StockLevel;
  buyThisMonth: boolean;
  targetQuantity: number;
  unit: string;
  bought: boolean;
  boughtQuantity?: number;
  boughtPrice?: number;
  boughtAtStore?: StoreName;
  boughtDate?: string;
  preferredStore: StoreName;
  estimatedPrice: number; // stored in base GHS
  notes?: string;
  month: string; // YYYY-MM
  isUnplanned?: boolean; // added on-the-fly during in-store shopping
  isRecurring?: boolean; // persists in household inventory month on month
  updatedAt?: number;
}

export interface StorePriceBenchmark {
  id?: string;
  itemName: string;
  store: StoreName;
  price: number; // in base GHS
  unit: string;
  lastUpdated: string;
  notes?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: GroceryCategory;
}

export interface ReceiptRecord {
  id: string;
  store: StoreName;
  date: string;
  totalAmount: number;
  paymentMethod: 'momo' | 'cash' | 'card' | 'other';
  items: ReceiptItem[];
  reconciled: boolean;
  imageUrl?: string;
  notes?: string;
  month: string;
  createdAt: number;
}

export interface UserSettings {
  currency: CurrencyCode;
  monthlyBudget: number;
  darkMode: boolean;
  defaultStores: string[];
}

export const CATEGORY_LABELS: Record<GroceryCategory, { label: string; icon: string; color: string; badgeBg: string }> = {
  pantry: { label: 'Pantry Staples', icon: '🥫', color: 'text-amber-600 dark:text-amber-400', badgeBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' },
  produce: { label: 'Fresh Produce', icon: '🥬', color: 'text-emerald-600 dark:text-emerald-400', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' },
  meat_fish: { label: 'Meat & Fish', icon: '🐟', color: 'text-rose-600 dark:text-rose-400', badgeBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300' },
  dairy_eggs: { label: 'Dairy & Eggs', icon: '🥚', color: 'text-yellow-600 dark:text-yellow-400', badgeBg: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300' },
  household: { label: 'Household & Toiletries', icon: '🧼', color: 'text-blue-600 dark:text-blue-400', badgeBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' },
  snacks_drinks: { label: 'Snacks & Drinks', icon: '🧃', color: 'text-purple-600 dark:text-purple-400', badgeBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300' },
  spices: { label: 'Spices & Seasoning', icon: '🌶️', color: 'text-orange-600 dark:text-orange-400', badgeBg: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' },
  other: { label: 'Other Groceries', icon: '🛒', color: 'text-slate-600 dark:text-slate-400', badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300' },
};

export const DEFAULT_PRIMARY_STORES = [
  'Melcom',
  'Dominion Supermarket',
  'Paga Focus',
  'Local Market',
];

export const GHANA_PRIMARY_STORES = DEFAULT_PRIMARY_STORES;

export const STOCK_STATUS_CONFIG: Record<StockLevel, { label: string; badge: string; color: string; autoBuy: boolean }> = {
  out_of_stock: { label: 'Out of Stock', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800', color: 'rose', autoBuy: true },
  low: { label: 'Running Low', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800', color: 'amber', autoBuy: true },
  adequate: { label: 'Adequate', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800', color: 'emerald', autoBuy: false },
  well_stocked: { label: 'Well Stocked', badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800', color: 'blue', autoBuy: false },
};
