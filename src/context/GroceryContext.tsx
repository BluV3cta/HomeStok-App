import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { 
  GroceryItem, 
  GroceryCategory,
  StorePriceBenchmark, 
  ReceiptRecord, 
  StoreName, 
  StockLevel,
  STOCK_STATUS_CONFIG,
  DEFAULT_PRIMARY_STORES,
  CurrencyCode,
  CURRENCY_CONFIGS
} from '../types';
import { INITIAL_BENCHMARK_PRICES, INITIAL_GROCERY_ITEMS } from '../initialData';

interface BestPriceInfo {
  lowestPrice: number;
  lowestStore: StoreName;
  highestPrice: number;
  storePrices: Record<string, number>;
  savings: number;
}

interface GroceryContextType {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  items: GroceryItem[];
  benchmarks: StorePriceBenchmark[];
  receipts: ReceiptRecord[];
  stores: string[];
  addStore: (storeName: string) => Promise<void>;
  monthlyBudget: number;
  setMonthlyBudget: (amount: number) => Promise<void>;
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => Promise<void>;
  formatMoney: (amountInGHS: number) => string;
  convertFromGHS: (amountInGHS: number, targetCurr?: CurrencyCode) => number;
  convertToGHS: (amount: number, fromCurr?: CurrencyCode) => number;
  darkMode: boolean;
  toggleDarkMode: () => void;
  loading: boolean;
  
  // Actions
  addItem: (item: Omit<GroceryItem, 'id'>) => Promise<string>;
  addUnplannedItem: (params: {
    name: string;
    category: GroceryCategory;
    quantity: number;
    unit: string;
    price: number;
    store: StoreName;
    isRecurring?: boolean;
    notes?: string;
  }) => Promise<string>;
  updateItem: (id: string, updates: Partial<GroceryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleBought: (id: string, bought: boolean, actualPrice?: number, actualStore?: StoreName) => Promise<void>;
  updateStockLevel: (id: string, stockLevel: StockLevel) => Promise<void>;
  toggleBuyThisMonth: (id: string) => Promise<void>;
  addOrUpdateBenchmark: (benchmark: StorePriceBenchmark) => Promise<void>;
  saveReceipt: (receipt: Omit<ReceiptRecord, 'id' | 'createdAt'>) => Promise<string>;
  deleteReceipt: (id: string) => Promise<void>;
  reconcileReceiptItems: (receipt: ReceiptRecord) => Promise<void>;
  resetToDefaults: () => Promise<void>;

  // Analytics & Computed
  monthItems: GroceryItem[];
  itemsToBuy: GroceryItem[];
  itemsBought: GroceryItem[];
  itemsRemaining: GroceryItem[];
  totalSpent: number;
  estimatedTotal: number;
  budgetRemaining: number;
  isOverBudget: boolean;
  budgetVariance: number;
  bestPriceMap: Record<string, BestPriceInfo>;
  storeComparisonSummary: {
    store: StoreName;
    totalCost: number;
    availableItemCount: number;
  }[];
}

const GroceryContext = createContext<GroceryContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_ITEMS = 'stockpilot_items_backup';
const LOCAL_STORAGE_KEY_BENCHMARKS = 'stockpilot_benchmarks_backup';
const LOCAL_STORAGE_KEY_RECEIPTS = 'stockpilot_receipts_backup';
const LOCAL_STORAGE_KEY_BUDGET = 'stockpilot_budget_backup';
const LOCAL_STORAGE_KEY_DARK = 'stockpilot_dark_mode';
const LOCAL_STORAGE_KEY_STORES = 'stockpilot_stores_backup';
const LOCAL_STORAGE_KEY_CURRENCY = 'stockpilot_currency_backup';

export const GroceryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  
  const [stores, setStores] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_STORES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PRIMARY_STORES;
  });

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENCY);
      if (saved && saved in CURRENCY_CONFIGS) return saved as CurrencyCode;
    } catch {}
    return 'GHS';
  });

  const [items, setItems] = useState<GroceryItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_GROCERY_ITEMS.map((item, index) => ({
      ...item,
      id: `local_item_${index + 1}`,
      updatedAt: Date.now()
    }));
  });

  const [benchmarks, setBenchmarks] = useState<StorePriceBenchmark[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BENCHMARKS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_BENCHMARK_PRICES;
  });

  const [receipts, setReceipts] = useState<ReceiptRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_RECEIPTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [monthlyBudget, setMonthlyBudgetState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BUDGET);
      if (saved) return Number(saved);
    } catch {}
    return 1500.00; // Default GH₵ 1,500 monthly grocery budget
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DARK);
      if (saved !== null) return saved === 'true';
    } catch {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [loading, setLoading] = useState(true);

  // Sync dark mode class on document
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      document.body.classList.remove('dark');
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_DARK, String(darkMode));
    } catch {}
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Backup to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_STORES, JSON.stringify(stores));
    } catch {}
  }, [stores]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENCY, currency);
    } catch {}
  }, [currency]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_BENCHMARKS, JSON.stringify(benchmarks));
    } catch {}
  }, [benchmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_RECEIPTS, JSON.stringify(receipts));
    } catch {}
  }, [receipts]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_BUDGET, String(monthlyBudget));
    } catch {}
  }, [monthlyBudget]);

  // Firestore synchronization when user is signed in
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userId = user.uid;

    // Listen to grocery items
    const itemsCol = collection(db, 'users', userId, 'grocery_items');
    const unsubItems = onSnapshot(query(itemsCol), async (snapshot) => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        const seeded: GroceryItem[] = [];
        INITIAL_GROCERY_ITEMS.forEach((initial) => {
          const docRef = doc(itemsCol);
          const newItem: GroceryItem = {
            ...initial,
            id: docRef.id,
            updatedAt: Date.now()
          };
          batch.set(docRef, newItem);
          seeded.push(newItem);
        });
        await batch.commit();
        setItems(seeded);
      } else {
        const remoteItems: GroceryItem[] = [];
        snapshot.forEach(docSnap => {
          remoteItems.push({ id: docSnap.id, ...docSnap.data() } as GroceryItem);
        });
        setItems(remoteItems);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Firestore items sync offline or error:', err);
      setLoading(false);
    });

    // Listen to store benchmark prices
    const benchmarksCol = collection(db, 'users', userId, 'store_prices');
    const unsubBenchmarks = onSnapshot(benchmarksCol, async (snapshot) => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        INITIAL_BENCHMARK_PRICES.forEach(bench => {
          const docRef = doc(benchmarksCol);
          batch.set(docRef, { ...bench, id: docRef.id });
        });
        await batch.commit();
      } else {
        const remoteBenchmarks: StorePriceBenchmark[] = [];
        snapshot.forEach(docSnap => {
          remoteBenchmarks.push({ id: docSnap.id, ...docSnap.data() } as StorePriceBenchmark);
        });
        setBenchmarks(remoteBenchmarks);
      }
    }, (err) => {
      console.warn('Firestore benchmarks sync error:', err);
    });

    // Listen to receipts
    const receiptsCol = collection(db, 'users', userId, 'receipts');
    const unsubReceipts = onSnapshot(receiptsCol, (snapshot) => {
      const remoteReceipts: ReceiptRecord[] = [];
      snapshot.forEach(docSnap => {
        remoteReceipts.push({ id: docSnap.id, ...docSnap.data() } as ReceiptRecord);
      });
      remoteReceipts.sort((a, b) => b.createdAt - a.createdAt);
      setReceipts(remoteReceipts);
    }, (err) => {
      console.warn('Firestore receipts sync error:', err);
    });

    // Listen to user settings (budget, stores, currency)
    const settingsDocRef = doc(db, 'users', userId, 'settings', 'general');
    const unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.monthlyBudget) {
          setMonthlyBudgetState(Number(data.monthlyBudget));
        }
        if (data.currency && data.currency in CURRENCY_CONFIGS) {
          setCurrencyState(data.currency as CurrencyCode);
        }
        if (Array.isArray(data.stores) && data.stores.length > 0) {
          // Merge with defaults
          const merged = Array.from(new Set([...DEFAULT_PRIMARY_STORES, ...data.stores]));
          setStores(merged);
        }
      } else {
        setDoc(settingsDocRef, { 
          monthlyBudget: 1500.00, 
          currency: 'GHS', 
          stores: DEFAULT_PRIMARY_STORES 
        }, { merge: true });
      }
    }, (err) => {
      console.warn('Firestore settings sync error:', err);
    });

    return () => {
      unsubItems();
      unsubBenchmarks();
      unsubReceipts();
      unsubSettings();
    };
  }, [user]);

  // Actions
  const addStore = async (newStoreName: string) => {
    const trimmed = newStoreName.trim();
    if (!trimmed || stores.includes(trimmed)) return;
    const updated = [...stores, trimmed];
    setStores(updated);

    if (user) {
      const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'general');
      await setDoc(settingsDocRef, { stores: updated }, { merge: true });
    }
  };

  const setCurrency = async (code: CurrencyCode) => {
    setCurrencyState(code);
    if (user) {
      const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'general');
      await setDoc(settingsDocRef, { currency: code }, { merge: true });
    }
  };

  const convertFromGHS = (amountInGHS: number, targetCurr: CurrencyCode = currency): number => {
    const config = CURRENCY_CONFIGS[targetCurr] || CURRENCY_CONFIGS.GHS;
    return Number((amountInGHS / config.rateToGHS).toFixed(2));
  };

  const convertToGHS = (amount: number, fromCurr: CurrencyCode = currency): number => {
    const config = CURRENCY_CONFIGS[fromCurr] || CURRENCY_CONFIGS.GHS;
    return Number((amount * config.rateToGHS).toFixed(2));
  };

  const formatMoney = (amountInGHS: number): string => {
    const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.GHS;
    const converted = convertFromGHS(amountInGHS, currency);
    return `${config.symbol} ${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const addItem = async (itemData: Omit<GroceryItem, 'id'>): Promise<string> => {
    const newItem: GroceryItem = {
      ...itemData,
      id: user ? '' : `local_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      month: itemData.month || selectedMonth,
      updatedAt: Date.now()
    };

    if (user) {
      const docRef = doc(collection(db, 'users', user.uid, 'grocery_items'));
      newItem.id = docRef.id;
      await setDoc(docRef, newItem);
    } else {
      setItems(prev => [newItem, ...prev]);
    }
    return newItem.id;
  };

  const addUnplannedItem = async (params: {
    name: string;
    category: GroceryCategory;
    quantity: number;
    unit: string;
    price: number;
    store: StoreName;
    isRecurring?: boolean;
    notes?: string;
  }): Promise<string> => {
    const today = new Date().toISOString().split('T')[0];
    const isRecurring = params.isRecurring !== undefined ? params.isRecurring : true;

    // 1. Ensure store is registered in store catalog
    if (params.store && !stores.includes(params.store)) {
      await addStore(params.store);
    }

    // 2. Add as bought item in cart for current month
    const newItemData: Omit<GroceryItem, 'id'> = {
      name: params.name.trim(),
      category: params.category,
      stockLevel: 'well_stocked',
      buyThisMonth: true,
      targetQuantity: params.quantity,
      unit: params.unit || 'pcs',
      bought: true,
      boughtQuantity: params.quantity,
      boughtPrice: params.price,
      boughtAtStore: params.store,
      boughtDate: today,
      preferredStore: params.store,
      estimatedPrice: params.price,
      notes: params.notes,
      month: selectedMonth,
      isUnplanned: true,
      isRecurring,
      updatedAt: Date.now()
    };

    const itemId = await addItem(newItemData);

    // 3. Register or update benchmark price for store price comparison engine
    if (params.price > 0 && params.store) {
      await addOrUpdateBenchmark({
        itemName: params.name.trim(),
        store: params.store,
        price: params.price,
        unit: params.unit || 'pcs',
        lastUpdated: today,
        notes: `In-store purchase at ${params.store} (${selectedMonth})`
      });
    }

    return itemId;
  };

  const updateItem = async (id: string, updates: Partial<GroceryItem>) => {
    const updatedWithTimestamp = { ...updates, updatedAt: Date.now() };

    setItems(prev => {
      const exists = prev.some(item => item.id === id);
      if (exists) {
        return prev.map(item => item.id === id ? { ...item, ...updatedWithTimestamp } : item);
      }

      // If carry-over item from another month, materialize it for the current month!
      if (id.includes(`_${selectedMonth}`)) {
        const baseId = id.substring(0, id.lastIndexOf(`_${selectedMonth}`));
        const baseItem = prev.find(i => i.id === baseId);
        if (baseItem) {
          const materializedItem: GroceryItem = {
            ...baseItem,
            ...updatedWithTimestamp,
            id,
            month: selectedMonth
          };
          return [materializedItem, ...prev];
        }
      }
      return prev;
    });

    if (user) {
      const docRef = doc(db, 'users', user.uid, 'grocery_items', id);
      await setDoc(docRef, updatedWithTimestamp, { merge: true });
    }
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'grocery_items', id);
      await deleteDoc(docRef);
    }
  };

  const toggleBought = async (id: string, bought: boolean, actualPrice?: number, actualStore?: StoreName) => {
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    const updates: Partial<GroceryItem> = {
      bought,
      boughtDate: bought ? new Date().toISOString().split('T')[0] : undefined,
    };

    if (bought) {
      if (actualPrice !== undefined) updates.boughtPrice = actualPrice;
      if (actualStore) updates.boughtAtStore = actualStore;
      if (!updates.boughtPrice) updates.boughtPrice = targetItem.estimatedPrice;
      if (!updates.boughtAtStore) updates.boughtAtStore = targetItem.preferredStore;
    }

    await updateItem(id, updates);

    if (bought && actualStore && actualPrice && actualPrice > 0) {
      await addOrUpdateBenchmark({
        itemName: targetItem.name,
        store: actualStore,
        price: actualPrice,
        unit: targetItem.unit,
        lastUpdated: new Date().toISOString().split('T')[0],
        notes: `Recorded during ${selectedMonth} grocery run`
      });
    }
  };

  const updateStockLevel = async (id: string, stockLevel: StockLevel) => {
    const autoBuy = STOCK_STATUS_CONFIG[stockLevel].autoBuy;
    await updateItem(id, {
      stockLevel,
      buyThisMonth: autoBuy
    });
  };

  const toggleBuyThisMonth = async (id: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    await updateItem(id, { buyThisMonth: !target.buyThisMonth });
  };

  const addOrUpdateBenchmark = async (benchmark: StorePriceBenchmark) => {
    const existingIndex = benchmarks.findIndex(
      b => b.itemName.trim().toLowerCase() === benchmark.itemName.trim().toLowerCase() && 
           b.store.trim().toLowerCase() === benchmark.store.trim().toLowerCase()
    );

    const updatedBenchmarks = [...benchmarks];
    const newBenchmarkData = {
      ...benchmark,
      lastUpdated: benchmark.lastUpdated || new Date().toISOString().split('T')[0]
    };

    if (existingIndex >= 0) {
      const existingId = benchmarks[existingIndex].id;
      updatedBenchmarks[existingIndex] = { ...benchmarks[existingIndex], ...newBenchmarkData };
      setBenchmarks(updatedBenchmarks);

      if (user && existingId) {
        const docRef = doc(db, 'users', user.uid, 'store_prices', existingId);
        await updateDoc(docRef, newBenchmarkData);
      }
    } else {
      if (user) {
        const docRef = doc(collection(db, 'users', user.uid, 'store_prices'));
        const created = { ...newBenchmarkData, id: docRef.id };
        await setDoc(docRef, created);
        setBenchmarks(prev => [created, ...prev]);
      } else {
        const created = { ...newBenchmarkData, id: `local_b_${Date.now()}` };
        setBenchmarks(prev => [created, ...prev]);
      }
    }
  };

  const saveReceipt = async (receiptData: Omit<ReceiptRecord, 'id' | 'createdAt'>): Promise<string> => {
    const newReceipt: ReceiptRecord = {
      ...receiptData,
      id: user ? '' : `receipt_${Date.now()}`,
      createdAt: Date.now(),
      month: receiptData.month || selectedMonth
    };

    if (user) {
      const docRef = doc(collection(db, 'users', user.uid, 'receipts'));
      newReceipt.id = docRef.id;
      await setDoc(docRef, newReceipt);
      setReceipts(prev => [newReceipt, ...prev]);
    } else {
      setReceipts(prev => [newReceipt, ...prev]);
    }
    return newReceipt.id;
  };

  const deleteReceipt = async (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'receipts', id);
      await deleteDoc(docRef);
    }
  };

  const reconcileReceiptItems = async (receipt: ReceiptRecord) => {
    for (const lineItem of receipt.items) {
      const matched = items.find(
        i => i.month === selectedMonth && 
        (i.name.toLowerCase().includes(lineItem.name.toLowerCase()) || 
         lineItem.name.toLowerCase().includes(i.name.toLowerCase()))
      );

      if (matched) {
        await updateItem(matched.id, {
          bought: true,
          boughtPrice: lineItem.unitPrice || lineItem.totalPrice,
          boughtQuantity: lineItem.quantity || matched.targetQuantity,
          boughtAtStore: receipt.store,
          boughtDate: receipt.date
        });
      }

      if (lineItem.unitPrice > 0) {
        await addOrUpdateBenchmark({
          itemName: matched ? matched.name : lineItem.name,
          store: receipt.store,
          price: lineItem.unitPrice,
          unit: matched ? matched.unit : 'unit',
          lastUpdated: receipt.date,
          notes: `Verified from receipt (${receipt.store})`
        });
      }
    }

    if (user) {
      const docRef = doc(db, 'users', user.uid, 'receipts', receipt.id);
      await updateDoc(docRef, { reconciled: true });
    }
    setReceipts(prev => prev.map(r => r.id === receipt.id ? { ...r, reconciled: true } : r));
  };

  const setMonthlyBudget = async (amount: number) => {
    setMonthlyBudgetState(amount);
    if (user) {
      const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'general');
      await setDoc(settingsDocRef, { monthlyBudget: amount }, { merge: true });
    }
  };

  const resetToDefaults = async () => {
    if (user) {
      const itemsCol = collection(db, 'users', user.uid, 'grocery_items');
      const batch = writeBatch(db);
      items.forEach(i => {
        batch.delete(doc(itemsCol, i.id));
      });
      INITIAL_GROCERY_ITEMS.forEach(init => {
        const docRef = doc(itemsCol);
        batch.set(docRef, { ...init, id: docRef.id, updatedAt: Date.now() });
      });
      await batch.commit();
    } else {
      setItems(INITIAL_GROCERY_ITEMS.map((item, index) => ({
        ...item,
        id: `local_item_${index + 1}`,
        updatedAt: Date.now()
      })));
      setBenchmarks(INITIAL_BENCHMARK_PRICES);
      setStores(DEFAULT_PRIMARY_STORES);
    }
  };

  // Filter items for selected month with month-on-month inventory support
  const monthItems = useMemo(() => {
    // 1. Items directly recorded in selectedMonth
    const currentMonthItems = items.filter(i => i.month === selectedMonth);
    const currentMonthItemNames = new Set(currentMonthItems.map(i => i.name.trim().toLowerCase()));

    // 2. Items from other months that are recurring or part of general inventory
    const carryOverItems: GroceryItem[] = [];

    items.forEach(item => {
      // If marked isRecurring or has no fixed month (master inventory item)
      if ((item.isRecurring || !item.month) && item.month !== selectedMonth) {
        const key = item.name.trim().toLowerCase();
        if (!currentMonthItemNames.has(key)) {
          carryOverItems.push({
            ...item,
            id: `${item.id}_${selectedMonth}`,
            month: selectedMonth,
            bought: false,
            boughtPrice: undefined,
            boughtQuantity: undefined,
            boughtDate: undefined,
            buyThisMonth: item.stockLevel === 'out_of_stock' || item.stockLevel === 'low',
          });
          currentMonthItemNames.add(key);
        }
      }
    });

    return [...currentMonthItems, ...carryOverItems];
  }, [items, selectedMonth]);

  const itemsToBuy = useMemo(() => {
    return monthItems.filter(i => i.buyThisMonth);
  }, [monthItems]);

  const itemsBought = useMemo(() => {
    return itemsToBuy.filter(i => i.bought);
  }, [itemsToBuy]);

  const itemsRemaining = useMemo(() => {
    return itemsToBuy.filter(i => !i.bought);
  }, [itemsToBuy]);

  const totalSpent = useMemo(() => {
    const listSpent = itemsBought.reduce((sum, item) => {
      const price = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
      const qty = item.boughtQuantity !== undefined ? item.boughtQuantity : item.targetQuantity;
      return sum + (price * qty);
    }, 0);
    return Number(listSpent.toFixed(2));
  }, [itemsBought]);

  const estimatedTotal = useMemo(() => {
    const total = itemsToBuy.reduce((sum, item) => {
      if (item.bought) {
        const price = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
        const qty = item.boughtQuantity !== undefined ? item.boughtQuantity : item.targetQuantity;
        return sum + (price * qty);
      }
      return sum + (item.estimatedPrice * item.targetQuantity);
    }, 0);
    return Number(total.toFixed(2));
  }, [itemsToBuy]);

  const budgetRemaining = useMemo(() => {
    return Number((monthlyBudget - totalSpent).toFixed(2));
  }, [monthlyBudget, totalSpent]);

  const isOverBudget = useMemo(() => {
    return totalSpent > monthlyBudget;
  }, [totalSpent, monthlyBudget]);

  const budgetVariance = useMemo(() => {
    return Number(Math.abs(monthlyBudget - totalSpent).toFixed(2));
  }, [monthlyBudget, totalSpent]);

  const bestPriceMap = useMemo(() => {
    const map: Record<string, BestPriceInfo> = {};

    items.forEach(item => {
      const itemKey = item.name.trim().toLowerCase();
      const matchingBenchmarks = benchmarks.filter(
        b => b.itemName.trim().toLowerCase() === itemKey ||
             itemKey.includes(b.itemName.trim().toLowerCase()) ||
             b.itemName.trim().toLowerCase().includes(itemKey)
      );

      if (matchingBenchmarks.length === 0) {
        map[item.id] = {
          lowestPrice: item.estimatedPrice,
          lowestStore: item.preferredStore,
          highestPrice: item.estimatedPrice,
          storePrices: { [item.preferredStore]: item.estimatedPrice },
          savings: 0
        };
        return;
      }

      const storePrices: Record<string, number> = {};
      let lowestPrice = Infinity;
      let lowestStore: StoreName = item.preferredStore;
      let highestPrice = 0;

      matchingBenchmarks.forEach(b => {
        storePrices[b.store] = b.price;
        if (b.price < lowestPrice) {
          lowestPrice = b.price;
          lowestStore = b.store;
        }
        if (b.price > highestPrice) {
          highestPrice = b.price;
        }
      });

      if (!storePrices[item.preferredStore]) {
        storePrices[item.preferredStore] = item.estimatedPrice;
        if (item.estimatedPrice < lowestPrice) {
          lowestPrice = item.estimatedPrice;
          lowestStore = item.preferredStore;
        }
      }

      map[item.id] = {
        lowestPrice,
        lowestStore,
        highestPrice: highestPrice > 0 ? highestPrice : lowestPrice,
        storePrices,
        savings: highestPrice > lowestPrice ? Number((highestPrice - lowestPrice).toFixed(2)) : 0
      };
    });

    return map;
  }, [items, benchmarks]);

  const storeComparisonSummary = useMemo(() => {
    return stores.map(store => {
      let totalCost = 0;
      let availableItemCount = 0;

      itemsToBuy.forEach(item => {
        const info = bestPriceMap[item.id];
        if (info && info.storePrices[store]) {
          totalCost += info.storePrices[store] * item.targetQuantity;
          availableItemCount += 1;
        } else {
          totalCost += item.estimatedPrice * item.targetQuantity;
        }
      });

      return {
        store,
        totalCost: Number(totalCost.toFixed(2)),
        availableItemCount,
      };
    }).sort((a, b) => a.totalCost - b.totalCost);
  }, [itemsToBuy, bestPriceMap, stores]);

  return (
    <GroceryContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        items,
        benchmarks,
        receipts,
        stores,
        addStore,
        monthlyBudget,
        setMonthlyBudget,
        currency,
        setCurrency,
        formatMoney,
        convertFromGHS,
        convertToGHS,
        darkMode,
        toggleDarkMode,
        loading,

        addItem,
        addUnplannedItem,
        updateItem,
        deleteItem,
        toggleBought,
        updateStockLevel,
        toggleBuyThisMonth,
        addOrUpdateBenchmark,
        saveReceipt,
        deleteReceipt,
        reconcileReceiptItems,
        resetToDefaults,

        monthItems,
        itemsToBuy,
        itemsBought,
        itemsRemaining,
        totalSpent,
        estimatedTotal,
        budgetRemaining,
        isOverBudget,
        budgetVariance,
        bestPriceMap,
        storeComparisonSummary,
      }}
    >
      {children}
    </GroceryContext.Provider>
  );
};

export const useGrocery = () => {
  const context = useContext(GroceryContext);
  if (!context) {
    throw new Error('useGrocery must be used within a GroceryProvider');
  }
  return context;
};
