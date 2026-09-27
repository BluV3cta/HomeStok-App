import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Store, 
  Tag, 
  Edit3, 
  Trash2, 
  ArrowRight,
  TrendingDown,
  Layers,
  Check,
  ShoppingBag,
  FileSpreadsheet
} from 'lucide-react';
import { useGrocery } from '../context/GroceryContext';
import { 
  GroceryItem, 
  GroceryCategory, 
  CATEGORY_LABELS, 
  STOCK_STATUS_CONFIG, 
  StoreName,
  GHANA_PRIMARY_STORES 
} from '../types';

interface GroceryListViewProps {
  onOpenAddModal: () => void;
  onOpenAuditModal: () => void;
  onOpenImport: () => void;
  onEditItem: (item: GroceryItem) => void;
  onGoToShopMode: () => void;
  onOpenCompare: () => void;
}

export const GroceryListView: React.FC<GroceryListViewProps> = ({
  onOpenAddModal,
  onOpenAuditModal,
  onOpenImport,
  onEditItem,
  onGoToShopMode,
  onOpenCompare
}) => {
  const { 
    monthItems, 
    itemsToBuy, 
    itemsBought, 
    totalSpent, 
    estimatedTotal, 
    monthlyBudget,
    toggleBought, 
    toggleBuyThisMonth,
    updateStockLevel,
    deleteItem,
    bestPriceMap,
    stores,
    formatMoney,
    storeComparisonSummary
  } = useGrocery();

  const [activeListTab, setActiveListTab] = useState<'tobuy' | 'all' | 'bought'>('tobuy');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering
  const filteredItems = monthItems.filter(item => {
    // List tab filter
    if (activeListTab === 'tobuy' && !item.buyThisMonth) return false;
    if (activeListTab === 'bought' && (!item.buyThisMonth || !item.bought)) return false;

    // Store filter
    if (storeFilter !== 'all' && item.preferredStore !== storeFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || 
             item.preferredStore.toLowerCase().includes(q) ||
             (item.notes && item.notes.toLowerCase().includes(q));
    }

    return true;
  });

  const bestStoreOverall = storeComparisonSummary[0];

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      
      {/* Top Banner / Callout for Stock Check & Quick Stats */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Smart Monthly Grocery Planning</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Monthly Grocery & Price Tracker
            </h1>
            <p className="text-xs sm:text-sm text-emerald-50 mt-1">
              Check stock levels, compare prices across your favorite supermarkets and local markets, and keep to your budget.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                type="button"
                onClick={onOpenAuditModal}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-md shadow-amber-900/20 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-slate-900" />
                <span>Run Stock Audit</span>
              </button>
              
              <button
                type="button"
                onClick={onGoToShopMode}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs backdrop-blur-md transition-colors flex items-center gap-1.5 border border-white/20"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Start In-Store Mode</span>
              </button>

              <button
                type="button"
                onClick={onOpenImport}
                className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs backdrop-blur-md transition-colors flex items-center gap-1.5 border border-white/20"
                title="Import grocery list from Excel (.xlsx) or CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Import Excel/CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Snapshot Card (top right) */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col gap-2 min-w-[240px]">
            <div className="flex items-center justify-between text-xs text-emerald-100">
              <span>Shopping Progress</span>
              <span className="font-bold">{itemsBought.length} of {itemsToBuy.length} items</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
              <div 
                className="h-full bg-amber-400 transition-all duration-300 rounded-full"
                style={{ width: `${itemsToBuy.length > 0 ? (itemsBought.length / itemsToBuy.length) * 100 : 0}%` }}
              />
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <div>
                <div className="text-[10px] text-emerald-200">Spent So Far</div>
                <div className="text-base font-black">{formatMoney(totalSpent)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-emerald-200">Est. Total Basket</div>
                <div className="text-base font-bold text-emerald-100">{formatMoney(estimatedTotal)}</div>
              </div>
            </div>

            <div 
              onClick={onOpenCompare}
              className="cursor-pointer text-[11px] text-emerald-100 bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors"
            >
              <span>View Price Comparisons</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs, Filters, Add Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Main List Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setActiveListTab('tobuy')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeListTab === 'tobuy'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>To Buy</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px]">
              {itemsToBuy.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveListTab('all')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeListTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>All Inventory</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
              {monthItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveListTab('bought')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeListTab === 'bought'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Crossed Out</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 text-[10px]">
              {itemsBought.length}
            </span>
          </button>
        </div>

        {/* Search & Add New Item Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search rice, oil, milk, soap..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          <button
            type="button"
            onClick={onOpenImport}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
            title="Import Excel (.xlsx) or CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

      </div>

      {/* Filter Row: Stores and Categories */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between text-xs">
        
        {/* Store Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-slate-400 text-[11px] font-semibold mr-1 flex items-center gap-1">
            <Store className="w-3.5 h-3.5" />
            Store:
          </span>
          <button
            onClick={() => setStoreFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              storeFilter === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All Stores
          </button>
          {stores.map(store => (
            <button
              key={store}
              onClick={() => setStoreFilter(store)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                storeFilter === store
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {store}
            </button>
          ))}
        </div>

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {(Object.keys(CATEGORY_LABELS) as GroceryCategory[]).map(cat => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat].icon} {CATEGORY_LABELS[cat].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grocery Items Grid / List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-10 border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 mx-auto flex items-center justify-center mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            No grocery items match this view
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {activeListTab === 'tobuy' 
              ? 'All items are currently marked as stocked. Run the Stock Audit or add new groceries.'
              : 'Try changing your store or category filters.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={onOpenAuditModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-900 text-xs font-bold shadow-xs hover:bg-amber-400"
            >
              Run Stock Audit
            </button>
            <button
              onClick={onOpenImport}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-600"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Import Excel/CSV</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-500"
            >
              Add Item
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredItems.map(item => {
            const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other;
            const stockConfig = STOCK_STATUS_CONFIG[item.stockLevel];
            const priceInfo = bestPriceMap[item.id];
            const isLowestStore = priceInfo && priceInfo.lowestStore === item.preferredStore;

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-800/90 rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between hover:shadow-md ${
                  item.bought
                    ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : item.buyThisMonth
                    ? 'border-slate-200 dark:border-slate-700/80 shadow-xs'
                    : 'border-slate-200/60 dark:border-slate-800/60 opacity-75'
                }`}
              >
                <div>
                  {/* Top Bar: Category, Stock Badge, Buy toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${catInfo.badgeBg}`}>
                      <span>{catInfo.icon}</span>
                      <span>{catInfo.label.split(' ')[0]}</span>
                    </span>

                    {/* Stock Status Selector Pill */}
                    <div className="relative group">
                      <select
                        value={item.stockLevel}
                        onChange={(e) => updateStockLevel(item.id, e.target.value as any)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none appearance-none pr-4 ${stockConfig.badge}`}
                      >
                        <option value="out_of_stock">🔴 Out of Stock</option>
                        <option value="low">🟡 Running Low</option>
                        <option value="adequate">🟢 Adequate</option>
                        <option value="well_stocked">🔵 Well Stocked</option>
                      </select>
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none opacity-60">▼</span>
                    </div>
                  </div>

                  {/* Item Name & Target Quantity */}
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className={`font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug ${
                        item.bought ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}>
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Target: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.targetQuantity} {item.unit}</span>
                      </p>
                    </div>

                    {/* Checkbox to mark bought */}
                    <button
                      type="button"
                      onClick={() => toggleBought(item.id, !item.bought)}
                      className={`p-1 rounded-xl transition-all ${
                        item.bought
                          ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
                          : 'text-slate-300 hover:text-emerald-500'
                      }`}
                      title={item.bought ? "Mark unbought" : "Mark as bought in-store"}
                    >
                      {item.bought ? (
                        <CheckCircle2 className="w-6 h-6 fill-emerald-500 text-white" />
                      ) : (
                        <Circle className="w-6 h-6 stroke-[1.5]" />
                      )}
                    </button>
                  </div>

                  {/* Preferred Store & Estimated Price */}
                  <div className="mt-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Store className="w-3 h-3 text-slate-400" />
                        <span>Preferred: <strong>{item.preferredStore}</strong></span>
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {formatMoney(item.estimatedPrice)}
                      </span>
                    </div>

                    {/* Store Price Benchmark Comparison Pill */}
                    {priceInfo && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[11px] flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Lowest:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(priceInfo.lowestPrice)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({priceInfo.lowestStore})
                          </span>
                        </div>
                        {priceInfo.savings > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                            Save {formatMoney(priceInfo.savings)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-2 truncate">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Row Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleBuyThisMonth(item.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        item.buyThisMonth
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {item.buyThisMonth ? '✓ Queued to Buy' : '+ Add to List'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                      title="Edit Item"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="p-1 hover:text-rose-500 rounded transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
