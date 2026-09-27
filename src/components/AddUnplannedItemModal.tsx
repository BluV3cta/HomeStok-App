import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  Sparkles, 
  Plus, 
  Store, 
  Check, 
  Layers, 
  Coins, 
  CalendarRange, 
  Tag, 
  Scale
} from 'lucide-react';
import { useGrocery } from '../context/GroceryContext';
import { GroceryCategory, StoreName, CATEGORY_LABELS } from '../types';

interface AddUnplannedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStore?: StoreName;
  onItemAdded?: (itemName: string) => void;
}

export const AddUnplannedItemModal: React.FC<AddUnplannedItemModalProps> = ({
  isOpen,
  onClose,
  defaultStore,
  onItemAdded
}) => {
  const { 
    stores, 
    addStore, 
    addUnplannedItem, 
    currency, 
    formatMoney,
    convertToGHS,
    convertFromGHS
  } = useGrocery();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<GroceryCategory>('snacks_drinks');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('pcs');
  const [priceInput, setPriceInput] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>(
    defaultStore && defaultStore !== 'all' ? defaultStore : (stores[0] || 'Melcom')
  );
  const [isAddingNewStore, setIsAddingNewStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [isRecurring, setIsRecurring] = useState<boolean>(true); // default true for month-on-month inventory
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common Ghanaian unplanned / impulse grocery purchases for rapid tapping
  const quickPicks = [
    { name: 'Golden Tree Kingsbite Chocolate', cat: 'snacks_drinks' as GroceryCategory, unit: 'bar', price: 22 },
    { name: 'Titus Sardines in Oil', cat: 'pantry' as GroceryCategory, unit: 'tin', price: 14 },
    { name: 'Butter Bread (Large Loaf)', cat: 'pantry' as GroceryCategory, unit: 'loaf', price: 25 },
    { name: 'Digestive Biscuits 400g', cat: 'snacks_drinks' as GroceryCategory, unit: 'pack', price: 28 },
    { name: 'Kivo Gari (Pepper & Shito mix)', cat: 'pantry' as GroceryCategory, unit: 'pack', price: 12 },
    { name: 'Voltic Mineral Water 1.5L', cat: 'snacks_drinks' as GroceryCategory, unit: 'bottle', price: 8 },
  ];

  if (!isOpen) return null;

  const handleSelectQuickPick = (item: typeof quickPicks[0]) => {
    setName(item.name);
    setCategory(item.cat);
    setUnit(item.unit);
    // Convert item price (in GHS) to the active display currency
    const inActiveCurrency = convertFromGHS(item.price);
    setPriceInput(inActiveCurrency.toString());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter an item name');
      return;
    }

    const priceNum = parseFloat(priceInput);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price for the item');
      return;
    }

    let finalStore = selectedStore;
    if (isAddingNewStore) {
      if (!newStoreName.trim()) {
        setError('Please enter the new store name');
        return;
      }
      finalStore = newStoreName.trim();
      await addStore(finalStore);
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert entered price in active currency back to base GHS
      const priceInGHS = convertToGHS(priceNum);

      await addUnplannedItem({
        name: name.trim(),
        category,
        quantity: Math.max(1, quantity),
        unit: unit.trim() || 'pcs',
        price: priceInGHS,
        store: finalStore,
        isRecurring,
        notes: notes.trim() || undefined
      });

      if (onItemAdded) {
        onItemAdded(name.trim());
      }

      onClose();
    } catch (err: any) {
      console.error('Error adding unplanned item:', err);
      setError('Failed to add item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPriceNumber = parseFloat(priceInput) || 0;
  const currentTotal = currentPriceNumber * quantity;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Add Unplanned Item
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  In-Store Add
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Spotted a deal or extra item in the aisle? Add it directly to your cart.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold">
              {error}
            </div>
          )}

          {/* Quick Tap Suggestions */}
          <div>
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
              Quick Suggestions:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {quickPicks.map((pick, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectQuickPick(pick)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1"
                >
                  <Plus className="w-2.5 h-2.5 text-emerald-500" />
                  <span>{pick.name.split(' ')[0]} {pick.name.split(' ')[1] || ''}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Gino Pepper Paste, Milo 400g, Plantain Chips..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category & Store Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GroceryCategory)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              >
                {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => (
                  <option key={catKey} value={catKey}>
                    {info.icon} {info.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Store */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1 flex items-center justify-between">
                <span>Store Purchased *</span>
                <button
                  type="button"
                  onClick={() => setIsAddingNewStore(!isAddingNewStore)}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  {isAddingNewStore ? 'Pick existing' : '+ Add new store'}
                </button>
              </label>
              
              {isAddingNewStore ? (
                <input
                  type="text"
                  placeholder="New store name (e.g. Shoprite)"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-500 text-slate-900 dark:text-white font-medium focus:outline-none"
                  autoFocus
                />
              ) : (
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  {stores.map(st => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Quantity, Unit & Price */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Quantity */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Qty *
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-l-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 text-center bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 rounded-r-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200"
                >
                  +
                </button>
              </div>
            </div>

            {/* Unit */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Unit
              </label>
              <input
                type="text"
                placeholder="pcs, bottle, kg"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Price per unit */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Unit Price ({currency}) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-500/50 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Total Calculation Card */}
          {currentPriceNumber > 0 && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Total Added to In-Store Cart:
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {quantity} × {currency} {currentPriceNumber.toFixed(2)} = {currency} {currentTotal.toFixed(2)}
                </span>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                Instantly counts toward store spent
              </div>
            </div>
          )}

          {/* Month-on-Month Inventory Persistence Checkbox (User requested!) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                <CalendarRange className="w-4 h-4 text-emerald-500" />
                <span>Keep in Inventory Month on Month</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Save this item permanently into your household inventory catalog. It will automatically be available in future months so you can audit its stock and repurchase it.
              </p>
            </div>
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 mt-1 cursor-pointer"
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Special promo at Melcom entrance, buy 2 get 1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold shadow-md shadow-emerald-500/25 flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add to Cart & Inventory'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
