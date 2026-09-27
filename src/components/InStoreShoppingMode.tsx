import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Store, 
  ShoppingCart, 
  Wallet, 
  TrendingUp, 
  Sparkles,
  Camera,
  Check,
  RotateCcw,
  Edit2,
  Plus,
  CheckCircle,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGrocery } from '../context/GroceryContext';
import { StoreName, GHANA_PRIMARY_STORES, CATEGORY_LABELS } from '../types';
import { AddUnplannedItemModal } from './AddUnplannedItemModal';

interface InStoreShoppingModeProps {
  onOpenScanReceipt: () => void;
  onBackToList: () => void;
}

export const InStoreShoppingMode: React.FC<InStoreShoppingModeProps> = ({
  onOpenScanReceipt,
  onBackToList
}) => {
  const { 
    itemsToBuy, 
    totalSpent, 
    estimatedTotal, 
    monthlyBudget,
    isOverBudget,
    toggleBought,
    updateItem,
    stores,
    formatMoney
  } = useGrocery();

  const [activeStore, setActiveStore] = useState<string>('all');
  const [editingPriceItemId, setEditingPriceItemId] = useState<string | null>(null);
  const [customPriceInput, setCustomPriceInput] = useState<string>('');
  const [isAddUnplannedOpen, setIsAddUnplannedOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter items queued for purchase
  const storeItems = itemsToBuy.filter(item => {
    if (activeStore === 'all') return true;
    return item.preferredStore === activeStore;
  });

  const remainingItems = storeItems.filter(i => !i.bought);
  const completedItems = storeItems.filter(i => i.bought);

  // Store-specific spent
  const storeSpent = completedItems.reduce((acc, item) => {
    const price = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
    return acc + (price * item.targetQuantity);
  }, 0);

  const storeEstTotal = storeItems.reduce((acc, item) => {
    const price = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
    return acc + (price * item.targetQuantity);
  }, 0);

  const handleToggleBought = async (itemId: string, currentlyBought: boolean, estPrice: number, preferredStore: StoreName) => {
    const nextBought = !currentlyBought;
    await toggleBought(itemId, nextBought, estPrice, preferredStore);

    if (nextBought) {
      // Check if all items in current view are completed
      if (remainingItems.length === 1) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const startPriceEdit = (itemId: string, currentPrice: number) => {
    setEditingPriceItemId(itemId);
    setCustomPriceInput(currentPrice.toString());
  };

  const saveCustomPrice = async (itemId: string) => {
    const parsed = parseFloat(customPriceInput);
    if (!isNaN(parsed) && parsed >= 0) {
      await updateItem(itemId, { 
        boughtPrice: parsed,
        bought: true,
        boughtAtStore: activeStore !== 'all' ? activeStore : undefined 
      });
    }
    setEditingPriceItemId(null);
  };

  return (
    <div className="space-y-4 pb-24 md:pb-12 max-w-4xl mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-900/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="p-1 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sticky High-Contrast HUD for Supermarket Shopping */}
      <div className="sticky top-14 sm:top-16 z-30 bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-800">
        
        {/* Store Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveStore('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeStore === 'all'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Stores ({itemsToBuy.length})
          </button>
          {stores.map(store => {
            const count = itemsToBuy.filter(i => i.preferredStore === store).length;
            return (
              <button
                key={store}
                onClick={() => setActiveStore(store)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeStore === store
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{store}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Metrics HUD */}
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
          
          {/* Total Spent So Far */}
          <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
              Spent So Far
            </span>
            <span className="text-base sm:text-xl font-black text-white tracking-tight">
              {formatMoney(totalSpent)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Trip: {formatMoney(storeSpent)}
            </span>
          </div>

          {/* Items Crossed Out */}
          <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
              Cart Progress
            </span>
            <span className="text-base sm:text-xl font-black text-white tracking-tight">
              {completedItems.length} <span className="text-sm font-normal text-slate-400">/ {storeItems.length}</span>
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {remainingItems.length} items left
            </span>
          </div>

          {/* Budget Standing */}
          <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700">
            <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider block">
              Budget Status
            </span>
            <span className={`text-base sm:text-xl font-black tracking-tight ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatMoney(monthlyBudget - totalSpent)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {isOverBudget ? 'Over Budget' : 'Remaining'}
            </span>
          </div>

        </div>

        {/* Action Bar inside HUD */}
        <div className="mt-3 pt-2 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onBackToList}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            ← Back to Plan
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddUnplannedOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              title="Add unexpected item or deal found in store"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Add Unplanned Item</span>
            </button>

            <button
              onClick={onOpenScanReceipt}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md hover:opacity-95 transition-opacity"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scan Receipt</span>
            </button>
          </div>
        </div>

      </div>

      {/* Shopping Trip Checklist */}
      <div className="space-y-6">
        
        {/* Remaining Items (To Buy) */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Aisle Items to Pick</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold">
                {remainingItems.length}
              </span>
            </h3>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddUnplannedOpen(true)}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Unplanned Item</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-400">Tap circle to cart</span>
            </div>
          </div>

          {remainingItems.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800/80 rounded-3xl border border-emerald-500/30 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center mb-2">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                All Items in this run are crossed out! 🎉
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You're ready for the cash register. Snap a photo of the receipt to reconcile prices.
              </p>
              <button
                onClick={onOpenScanReceipt}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
              >
                Scan Receipt & Reconcile
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {remainingItems.map(item => {
                const cat = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other;

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between gap-3 active:bg-slate-50 dark:active:bg-slate-750 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Big touch checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleBought(item.id, false, item.estimatedPrice, item.preferredStore)}
                        className="w-10 h-10 rounded-2xl border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-300 hover:border-emerald-500 hover:text-emerald-500 transition-colors shrink-0"
                        aria-label={`Mark ${item.name} as bought`}
                      >
                        <Circle className="w-6 h-6" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.icon}</span>
                          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Qty: {item.targetQuantity} {item.unit}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                            <Store className="w-3 h-3 text-slate-400" />
                            {item.preferredStore}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Quick Edit */}
                    <div className="text-right shrink-0">
                      <div className="font-black text-base text-slate-900 dark:text-white">
                        {formatMoney(item.estimatedPrice * item.targetQuantity)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        @ {formatMoney(item.estimatedPrice)}/{item.unit}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Crossed Out Items (In Cart) */}
        {completedItems.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="font-bold text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <span>Already in Cart (Crossed Out)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                  {completedItems.length}
                </span>
              </h3>
              <span className="text-xs text-slate-400">Tap to uncheck or update price</span>
            </div>

            <div className="space-y-2">
              {completedItems.map(item => {
                const boughtPrice = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
                const isEditing = editingPriceItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-3.5 border border-emerald-500/30 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Checked Icon */}
                      <button
                        type="button"
                        onClick={() => toggleBought(item.id, false)}
                        className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0"
                        title="Uncross item"
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="line-through font-bold text-sm text-slate-600 dark:text-slate-400 truncate">
                            {item.name}
                          </span>
                          {item.isUnplanned && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-bold">
                              ✨ Unplanned
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-emerald-700 dark:text-emerald-300">
                          {item.targetQuantity} {item.unit} bought at {item.boughtAtStore || item.preferredStore}
                        </span>
                      </div>
                    </div>

                    {/* Price with Quick Shelf Price Edit */}
                    <div className="text-right shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            value={customPriceInput}
                            onChange={(e) => setCustomPriceInput(e.target.value)}
                            className="w-18 px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-emerald-500 text-slate-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => saveCustomPrice(item.id)}
                            className="px-2 py-1 rounded bg-emerald-600 text-white text-xs font-bold"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => startPriceEdit(item.id, boughtPrice)}
                          className="cursor-pointer group flex items-center gap-1.5 justify-end"
                          title="Tap to change price if shelf price differed"
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                              {formatMoney(boughtPrice * item.targetQuantity)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ({formatMoney(boughtPrice)}/{item.unit})
                            </div>
                          </div>
                          <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-emerald-500" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Add Unplanned Item In-Store Modal */}
      <AddUnplannedItemModal
        isOpen={isAddUnplannedOpen}
        onClose={() => setIsAddUnplannedOpen(false)}
        defaultStore={activeStore !== 'all' ? activeStore : undefined}
        onItemAdded={(addedName) => {
          setToastMessage(`Added "${addedName}" to in-store cart & monthly inventory!`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />
    </div>
  );
};
