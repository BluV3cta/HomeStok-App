import React, { useState, useEffect } from 'react';
import { X, Plus, Check, ShoppingBag, Sparkles, Store } from 'lucide-react';
import { useGrocery } from '../context/GroceryContext';
import { 
  GroceryItem, 
  GroceryCategory, 
  StockLevel, 
  StoreName, 
  GHANA_PRIMARY_STORES, 
  CATEGORY_LABELS,
  STOCK_STATUS_CONFIG 
} from '../types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: GroceryItem | null;
}

const COMMON_GHANA_STAPLES = [
  { name: 'Royal Aroma Fragrant Rice 5kg', cat: 'pantry', unit: '5kg bag', price: 158.00, store: 'Paga Focus' },
  { name: 'Frytol Pure Vegetable Oil 1L', cat: 'pantry', unit: '1L bottle', price: 36.50, store: 'Paga Focus' },
  { name: 'Ideal Evaporated Milk 160g', cat: 'dairy_eggs', unit: 'tin', price: 9.50, store: 'Paga Focus' },
  { name: 'Crate of Fresh Eggs (30 pcs)', cat: 'dairy_eggs', unit: 'crate', price: 58.00, store: 'Local Market' },
  { name: 'Fresh Tomatoes (Medium Basket)', cat: 'produce', unit: 'basket', price: 50.00, store: 'Local Market' },
  { name: 'Fresh Tilapia Fish 1kg', cat: 'meat_fish', unit: 'kg', price: 55.00, store: 'Local Market' },
  { name: 'Tasty Tom Tomato Paste (10 Tins)', cat: 'pantry', unit: 'pack', price: 39.00, store: 'Paga Focus' },
  { name: 'Geisha Beauty Soap 3-Pack', cat: 'household', unit: 'pack', price: 26.50, store: 'Melcom' },
  { name: 'Omo Active Detergent Powder 1kg', cat: 'household', unit: '1kg bag', price: 33.00, store: 'Paga Focus' },
  { name: 'Nestle Milo Refill / Tin 400g', cat: 'snacks_drinks', unit: 'tin', price: 44.50, store: 'Paga Focus' },
  { name: 'White Gari (1 Olonka)', cat: 'pantry', unit: 'olonka', price: 24.00, store: 'Local Market' },
  { name: 'Fresh Onions (Bawku Red) 1kg', cat: 'produce', unit: 'kg', price: 35.00, store: 'Local Market' },
  { name: 'Pepsodent Cavity Fighter 140g', cat: 'household', unit: 'tube', price: 18.50, store: 'Melcom' },
  { name: 'Golden Drop Sunflower Oil 2L', cat: 'pantry', unit: '2L bottle', price: 78.00, store: 'Melcom' },
];

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  editingItem
}) => {
  const { addItem, updateItem, selectedMonth, stores, addStore } = useGrocery();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<GroceryCategory>('pantry');
  const [stockLevel, setStockLevel] = useState<StockLevel>('low');
  const [targetQuantity, setTargetQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('pack');
  const [preferredStore, setPreferredStore] = useState<StoreName>(stores[0] || 'Melcom');
  const [isAddingNewStore, setIsAddingNewStore] = useState(false);
  const [newStoreInput, setNewStoreInput] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<string>('25.00');
  const [buyThisMonth, setBuyThisMonth] = useState<boolean>(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setCategory(editingItem.category);
      setStockLevel(editingItem.stockLevel);
      setTargetQuantity(editingItem.targetQuantity);
      setUnit(editingItem.unit);
      setPreferredStore(editingItem.preferredStore);
      setEstimatedPrice(editingItem.estimatedPrice.toString());
      setBuyThisMonth(editingItem.buyThisMonth);
      setNotes(editingItem.notes || '');
    } else {
      // Default reset
      setName('');
      setCategory('pantry');
      setStockLevel('low');
      setTargetQuantity(1);
      setUnit('pack');
      setPreferredStore('Melcom');
      setEstimatedPrice('25.00');
      setBuyThisMonth(true);
      setNotes('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof COMMON_GHANA_STAPLES[0]) => {
    setName(preset.name);
    setCategory(preset.cat as GroceryCategory);
    setUnit(preset.unit);
    setEstimatedPrice(preset.price.toString());
    setPreferredStore(preset.store);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const priceNum = parseFloat(estimatedPrice) || 0;

    if (editingItem) {
      await updateItem(editingItem.id, {
        name: name.trim(),
        category,
        stockLevel,
        targetQuantity,
        unit,
        preferredStore,
        estimatedPrice: priceNum,
        buyThisMonth,
        notes: notes.trim() || undefined
      });
    } else {
      await addItem({
        name: name.trim(),
        category,
        stockLevel,
        targetQuantity,
        unit,
        preferredStore,
        estimatedPrice: priceNum,
        buyThisMonth,
        bought: false,
        month: selectedMonth,
        notes: notes.trim() || undefined
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingItem ? 'Edit Grocery Item' : 'Add Grocery Item'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track stock and compare prices for {selectedMonth}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Quick Ghanaian Staples Shortcut Chips */}
          {!editingItem && (
            <div>
              <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick-add common Ghanaian staples:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                {COMMON_GHANA_STAPLES.slice(0, 6).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap transition-colors border border-slate-200/60 dark:border-slate-700/60"
                  >
                    + {preset.name.split(' ')[0]} {preset.name.split(' ')[1] || ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Royal Aroma Rice 5kg, Frytol Oil, Milo..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category & Stock Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GroceryCategory)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              >
                {(Object.keys(CATEGORY_LABELS) as GroceryCategory[]).map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat].icon} {CATEGORY_LABELS[cat].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Home Stock Level
              </label>
              <select
                value={stockLevel}
                onChange={(e) => {
                  const level = e.target.value as StockLevel;
                  setStockLevel(level);
                  setBuyThisMonth(STOCK_STATUS_CONFIG[level].autoBuy);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-medium"
              >
                <option value="out_of_stock">🔴 Out of Stock</option>
                <option value="low">🟡 Running Low</option>
                <option value="adequate">🟢 Adequate</option>
                <option value="well_stocked">🔵 Well Stocked</option>
              </select>
            </div>
          </div>

          {/* Target Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Quantity to Buy
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                placeholder="e.g. 5kg bag, 1L, tin, crate, olonka"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Preferred Store & Estimated Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Preferred Store
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewStore(!isAddingNewStore)}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  {isAddingNewStore ? 'Select Existing' : '+ Add Store'}
                </button>
              </div>

              {isAddingNewStore ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="New store name..."
                    value={newStoreInput}
                    onChange={(e) => setNewStoreInput(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (newStoreInput.trim()) {
                        await addStore(newStoreInput.trim());
                        setPreferredStore(newStoreInput.trim());
                        setNewStoreInput('');
                        setIsAddingNewStore(false);
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs shrink-0"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={preferredStore}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddingNewStore(true);
                    } else {
                      setPreferredStore(e.target.value);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  {stores.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="__add_new__">+ Add Future Store...</option>
                </select>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Price (GH₵)
              </label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="e.g. 158.00"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>

          {/* Buy this month toggle switch */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Queue for Purchase this Month?
              </span>
              <span className="text-[11px] text-slate-500">
                {buyThisMonth ? 'Will appear on your in-store shopping list' : 'Inventory tracking only (skipped this run)'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setBuyThisMonth(!buyThisMonth)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                buyThisMonth ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  buyThisMonth ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes / Best Store Advice (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Best bought on Saturday market day or during Melcom promo"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* Form Submit */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingItem ? 'Save Changes' : 'Add to Groceries'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
