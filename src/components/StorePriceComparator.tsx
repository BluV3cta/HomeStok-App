import React, { useState } from 'react';
import { 
  Store, 
  TrendingDown, 
  Award, 
  Plus, 
  Sparkles, 
  CheckCircle,
  Building2,
  X,
  Check
} from 'lucide-react';
import { useGrocery } from '../context/GroceryContext';
import { StoreName } from '../types';

export const StorePriceComparator: React.FC = () => {
  const { 
    items, 
    itemsToBuy, 
    stores,
    addStore,
    bestPriceMap, 
    storeComparisonSummary,
    addOrUpdateBenchmark,
    currency,
    convertToGHS,
    formatMoney 
  } = useGrocery();

  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [storeInput, setStoreInput] = useState<StoreName>(stores[0] || 'Melcom');
  const [priceInput, setPriceInput] = useState<string>('');
  const [unitInput, setUnitInput] = useState<string>('kg');
  const [notesInput, setNotesInput] = useState<string>('');
  
  const [showAddPriceModal, setShowAddPriceModal] = useState<boolean>(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState<boolean>(false);
  const [newStoreName, setNewStoreName] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Calculate Optimal Split Shopping Basket
  const splitShoppingTotal = itemsToBuy.reduce((sum, item) => {
    const info = bestPriceMap[item.id];
    const lowest = info ? info.lowestPrice : item.estimatedPrice;
    return sum + (lowest * item.targetQuantity);
  }, 0);

  const highestStore = storeComparisonSummary[storeComparisonSummary.length - 1];
  const lowestStore = storeComparisonSummary[0];
  const potentialSavings = highestStore ? highestStore.totalCost - splitShoppingTotal : 0;

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(priceInput);
    if (!selectedItemName || isNaN(priceNum) || priceNum <= 0) return;

    // Convert price to base GHS
    const priceInGHS = convertToGHS(priceNum);

    await addOrUpdateBenchmark({
      itemName: selectedItemName,
      store: storeInput,
      price: priceInGHS,
      unit: unitInput,
      lastUpdated: new Date().toISOString().split('T')[0],
      notes: notesInput || undefined
    });

    setSuccessMessage(`Updated ${selectedItemName} price for ${storeInput}!`);
    setTimeout(() => setSuccessMessage(''), 3000);
    setShowAddPriceModal(false);
    setPriceInput('');
    setNotesInput('');
  };

  const handleAddNewStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStoreName.trim();
    if (!trimmed) return;

    await addStore(trimmed);
    setStoreInput(trimmed);
    setSuccessMessage(`Added "${trimmed}" to your tracked stores!`);
    setTimeout(() => setSuccessMessage(''), 3000);
    setNewStoreName('');
    setShowAddStoreModal(false);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-amber-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
              <Award className="w-3.5 h-3.5 text-amber-200" />
              <span>Multi-Store Benchmark Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Store Price Comparison & Savings Advisor
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-xl">
              Compare prices across all your stores. Add new stores anytime and discover where each staple is cheapest.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => setShowAddStoreModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/20"
            >
              <Building2 className="w-4 h-4" />
              <span>+ Add Store</span>
            </button>

            <button
              onClick={() => setShowAddPriceModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Record Price</span>
            </button>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Split Shopping vs Single Store Insights Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Estimated Basket by Store ({stores.length} Stores Tracked)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Based on {itemsToBuy.length} items to buy
          </span>
        </div>

        {/* Dynamic Store Comparison Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {storeComparisonSummary.map((item, index) => {
            const isLowest = index === 0;

            return (
              <div
                key={item.store}
                className={`p-4 rounded-2xl border transition-all ${
                  isLowest
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm relative overflow-hidden'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                }`}
              >
                {isLowest && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg">
                    Best Value
                  </div>
                )}
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                  {item.store}
                </div>
                <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                  {formatMoney(item.totalCost)}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                  <span>{item.availableItemCount} prices tracked</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Smart Multi-Store Split Recommendation */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Optimal Multi-Store Split Basket:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-base">
                  {formatMoney(splitShoppingTotal)}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Buying each staple at its cheapest store saves you up to{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatMoney(potentialSavings)}
                </strong>{' '}
                compared to single-store buying!
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic Side-by-Side Item Price Matrix across all stores */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Price Matrix by Grocery Staple
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Green highlight indicates the lowest price store for each staple
            </p>
          </div>

          <button
            onClick={() => setShowAddStoreModal(true)}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Store</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-4">Grocery Item</th>
                <th className="py-3 px-3">Unit</th>
                {stores.map(store => (
                  <th key={store} className="py-3 px-3 whitespace-nowrap">
                    {store}
                  </th>
                ))}
                <th className="py-3 px-3 text-right">Max Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map(item => {
                const info = bestPriceMap[item.id];
                if (!info) return null;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {item.unit}
                    </td>

                    {/* Dynamic Store Price Columns */}
                    {stores.map(store => {
                      const price = info.storePrices[store];
                      const isCheapest = info.lowestStore === store;

                      return (
                        <td key={store} className="py-3 px-3 whitespace-nowrap">
                          {price !== undefined ? (
                            <span className={`px-2 py-1 rounded-md font-bold ${
                              isCheapest 
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {formatMoney(price)}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Max Savings */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {info.savings > 0 ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatMoney(info.savings)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Same price</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Future Store */}
      {showAddStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                <span>Add Future Store</span>
              </h3>
              <button 
                onClick={() => setShowAddStoreModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mb-4">
              Add any supermarket, grocery store or local stall to compare prices (e.g. Shoprite, MaxMart, Koala, Palace, etc.).
            </p>

            <form onSubmit={handleAddNewStore} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shoprite, MaxMart, Marina Mall..."
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStoreModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/25 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Store</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record New Store Price */}
      {showAddPriceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Record / Update Store Price
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the verified shelf or market price to keep your comparator up to date.
            </p>

            <form onSubmit={handleSavePrice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Grocery Item
                </label>
                <select
                  required
                  value={selectedItemName}
                  onChange={(e) => {
                    setSelectedItemName(e.target.value);
                    const matching = items.find(i => i.name === e.target.value);
                    if (matching) setUnitInput(matching.unit);
                  }}
                  className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                >
                  <option value="">Select item...</option>
                  {items.map(i => (
                    <option key={i.id} value={i.name}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Store
                  </label>
                  <select
                    value={storeInput}
                    onChange={(e) => setStoreInput(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium"
                  >
                    {stores.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Price (in {currency})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 165.00"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Promo deal or bulk discount"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPriceModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold shadow-md hover:bg-emerald-500"
                >
                  Save Store Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
