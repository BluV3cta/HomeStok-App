import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ShoppingCart, 
  TrendingUp,
  Package,
  Layers
} from 'lucide-react';
import { useGrocery } from '../context/GroceryContext';
import { StockLevel, STOCK_STATUS_CONFIG, GroceryCategory, CATEGORY_LABELS } from '../types';

interface SalaryStockAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalaryStockAuditModal: React.FC<SalaryStockAuditModalProps> = ({ isOpen, onClose }) => {
  const { 
    monthItems, 
    updateItem, 
    updateStockLevel, 
    monthlyBudget 
  } = useGrocery();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // Filter items
  const filteredItems = monthItems.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate live projected bill from items marked to buy
  const projectedBill = monthItems.reduce((acc, item) => {
    if (item.buyThisMonth) {
      return acc + (item.estimatedPrice * item.targetQuantity);
    }
    return acc;
  }, 0);

  const toBuyCount = monthItems.filter(i => i.buyThisMonth).length;
  const outOfStockCount = monthItems.filter(i => i.stockLevel === 'out_of_stock').length;
  const lowStockCount = monthItems.filter(i => i.stockLevel === 'low').length;

  const handleStockClick = async (itemId: string, level: StockLevel) => {
    await updateStockLevel(itemId, level);
  };

  const handleToggleBuy = async (itemId: string, currentVal: boolean) => {
    await updateItem(itemId, { buyThisMonth: !currentVal });
  };

  const handleQtyChange = async (itemId: string, delta: number) => {
    const item = monthItems.find(i => i.id === itemId);
    if (!item) return;
    const newQty = Math.max(1, item.targetQuantity + delta);
    await updateItem(itemId, { targetQuantity: newQty });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-teal-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Monthly Stock Audit
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Inventory Check
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check current household inventory. Depleted items are automatically queued for purchase.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-400 font-medium">Out of Stock</div>
            <div className="text-base font-bold text-rose-500">{outOfStockCount} items</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-400 font-medium">Running Low</div>
            <div className="text-base font-bold text-amber-500">{lowStockCount} items</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-400 font-medium">Selected to Buy</div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{toBuyCount} items</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="text-slate-400 font-medium">Est. Shopping Bill</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100">
              GH₵ {projectedBill.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {(Object.keys(CATEGORY_LABELS) as GroceryCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded-lg text-xs whitespace-nowrap flex items-center gap-1 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>{CATEGORY_LABELS[cat].icon}</span>
                <span className="hidden sm:inline">{CATEGORY_LABELS[cat].label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Item Audit List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredItems.map(item => {
            const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other;

            return (
              <div 
                key={item.id}
                className={`p-3 rounded-xl border transition-all ${
                  item.buyThisMonth 
                    ? 'bg-white dark:bg-slate-800/90 border-emerald-500/40 shadow-sm' 
                    : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left: Item Info */}
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="text-xl mt-0.5">{catInfo.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          ({item.unit})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Est: GH₵ {item.estimatedPrice.toFixed(2)} at {item.preferredStore}</span>
                        {item.notes && <span className="italic truncate max-w-[200px]">· {item.notes}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Stock Selector & Buy Toggle */}
                  <div className="flex items-center flex-wrap gap-2 justify-end">
                    
                    {/* 4 Stock Buttons */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleStockClick(item.id, 'out_of_stock')}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                          item.stockLevel === 'out_of_stock'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'text-slate-500 hover:text-rose-500'
                        }`}
                        title="Out of stock - Auto sets Buy: YES"
                      >
                        🔴 Out
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStockClick(item.id, 'low')}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                          item.stockLevel === 'low'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-500 hover:text-amber-500'
                        }`}
                        title="Running low - Auto sets Buy: YES"
                      >
                        🟡 Low
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStockClick(item.id, 'adequate')}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                          item.stockLevel === 'adequate'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-emerald-500'
                        }`}
                        title="Adequate - Auto sets Buy: NO"
                      >
                        🟢 Okay
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStockClick(item.id, 'well_stocked')}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                          item.stockLevel === 'well_stocked'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-blue-500'
                        }`}
                        title="Well stocked - Auto sets Buy: NO"
                      >
                        🔵 Full
                      </button>
                    </div>

                    {/* Target Quantity adjuster if buying */}
                    {item.buyThisMonth && (
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="px-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.targetQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {/* Buy Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleBuy(item.id, item.buyThisMonth)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        item.buyThisMonth
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300'
                      }`}
                    >
                      {item.buyThisMonth ? <Check className="w-3.5 h-3.5" /> : null}
                      <span>{item.buyThisMonth ? 'Buy' : 'Skip'}</span>
                    </button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary & Action */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 dark:text-slate-300 text-center sm:text-left">
            <span className="font-bold text-slate-900 dark:text-white">{toBuyCount} items</span> queued for purchase. 
            Estimated: <span className="font-black text-emerald-600 dark:text-emerald-400">GH₵ {projectedBill.toFixed(2)}</span>
            {monthlyBudget > 0 && (
              <span className="text-slate-400 ml-1">
                (Budget: GH₵ {monthlyBudget.toFixed(2)})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply Audit to Grocery List
          </button>
        </div>

      </div>
    </div>
  );
};
