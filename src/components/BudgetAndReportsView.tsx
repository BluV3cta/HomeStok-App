import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  CheckCircle, 
  AlertTriangle, 
  Receipt, 
  Share2, 
  Calendar, 
  Store, 
  Trash2, 
  Edit3, 
  Check,
  Download,
  Copy,
  FileText
} from 'lucide-react';
import { useGrocery } from '../context/GroceryContext';
import { CATEGORY_LABELS, GroceryCategory, GHANA_PRIMARY_STORES, CURRENCY_CONFIGS } from '../types';
import { ExportPdfReportModal } from './ExportPdfReportModal';

interface BudgetAndReportsViewProps {
  onOpenScanReceipt: () => void;
}

export const BudgetAndReportsView: React.FC<BudgetAndReportsViewProps> = ({ onOpenScanReceipt }) => {
  const { 
    selectedMonth, 
    monthlyBudget, 
    setMonthlyBudget, 
    totalSpent, 
    estimatedTotal, 
    isOverBudget, 
    budgetVariance,
    itemsBought,
    itemsToBuy,
    receipts,
    deleteReceipt,
    resetToDefaults,
    currency,
    formatMoney,
    convertFromGHS,
    convertToGHS
  } = useGrocery();

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(monthlyBudget.toString());
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  itemsBought.forEach(item => {
    const cat = item.category || 'other';
    const price = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
    const qty = item.boughtQuantity !== undefined ? item.boughtQuantity : item.targetQuantity;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (price * qty);
  });

  // Store breakdown
  const storeTotals: Record<string, number> = {};
  itemsBought.forEach(item => {
    const store = item.boughtAtStore || item.preferredStore || 'Other';
    const price = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
    const qty = item.boughtQuantity !== undefined ? item.boughtQuantity : item.targetQuantity;
    storeTotals[store] = (storeTotals[store] || 0) + (price * qty);
  });

  const percentSpent = monthlyBudget > 0 ? Math.min(100, (totalSpent / monthlyBudget) * 100) : 0;
  const isBudgetSaved = totalSpent <= monthlyBudget;

  const handleSaveBudget = async () => {
    const parsed = parseFloat(budgetInput);
    if (!isNaN(parsed) && parsed > 0) {
      const amountInGHS = convertToGHS(parsed);
      await setMonthlyBudget(amountInGHS);
    }
    setIsEditingBudget(false);
  };

  const handleShareSummary = () => {
    const text = `StockPilot Report - ${selectedMonth}
Budget: ${formatMoney(monthlyBudget)}
Total Spent: ${formatMoney(totalSpent)}
Status: ${isOverBudget ? `Over budget by ${formatMoney(budgetVariance)}` : `Underspent by ${formatMoney(budgetVariance)} (${((budgetVariance / monthlyBudget) * 100).toFixed(0)}% saved)`}
Items Bought: ${itemsBought.length} / ${itemsToBuy.length}`;

    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  const currentCurrencySymbol = CURRENCY_CONFIGS[currency]?.symbol || 'GH₵';

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      
      {/* Top Budget Header Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Monthly Spending Control ({selectedMonth})
              </span>
              <div className="flex items-center gap-2">
                {isEditingBudget ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-black text-xl text-slate-900 dark:text-white">{currentCurrencySymbol}</span>
                    <input
                      type="number"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      className="w-28 px-2 py-1 rounded-lg border border-emerald-500 text-base font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveBudget}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatMoney(monthlyBudget)}
                    </h2>
                    <button
                      onClick={() => {
                        const converted = convertFromGHS(monthlyBudget);
                        setBudgetInput(converted.toString());
                        setIsEditingBudget(true);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-500 rounded"
                      title="Edit allocated budget"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <span className="text-xs text-slate-500">Allocated Budget</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Export PDF & Copy Summary */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              title="Export official monthly or yearly expense report to PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF Report</span>
            </button>

            <button
              onClick={handleShareSummary}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copyFeedback ? 'Copied Report!' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Status Pill */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">
              Actual Spent: <strong className="text-slate-900 dark:text-white font-bold">{formatMoney(totalSpent)}</strong>
            </span>
            <span className="text-slate-500">
              {percentSpent.toFixed(1)}% of Budget
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isOverBudget 
                  ? 'bg-rose-500' 
                  : percentSpent > 80 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (totalSpent / monthlyBudget) * 100)}%` }}
            />
          </div>
        </div>

        {/* Over/Under Banner */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          isOverBudget
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
        }`}>
          {isOverBudget ? (
            <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
          ) : (
            <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
          )}
          <div className="text-xs">
            <div className="font-bold text-sm">
              {isOverBudget ? (
                <>{formatMoney(budgetVariance)} Over Budget</>
              ) : (
                <>{formatMoney(budgetVariance)} Underspent Remaining</>
              )}
            </div>
            <p className="mt-0.5 opacity-90">
              {isOverBudget
                ? 'Your grocery spending this month has exceeded the allocated budget envelope. Check price inflation or unlisted items.'
                : `You are tracking well within budget. You have ${formatMoney(budgetVariance)} buffer remaining for additional household needs.`}
            </p>
          </div>
        </div>

      </div>

      {/* Grid: Category Breakdown & Store Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Spending by Grocery Category
            </h3>
          </div>

          <div className="space-y-2.5 pt-1">
            {Object.keys(categoryTotals).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Cross out items in shop mode or scan receipts to see category breakdown.
              </p>
            ) : (
              (Object.keys(categoryTotals) as GroceryCategory[]).map(cat => {
                const amount = categoryTotals[cat];
                const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                const info = CATEGORY_LABELS[cat] || CATEGORY_LABELS.other;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>{info.icon}</span>
                        <span>{info.label}</span>
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatMoney(amount)} <span className="text-[10px] text-slate-400">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Store Spend Distribution */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Store Spend Breakdown
            </h3>
          </div>

          <div className="space-y-2.5 pt-1">
            {Object.keys(storeTotals).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No store purchases recorded yet for {selectedMonth}.
              </p>
            ) : (
              Object.entries(storeTotals).map(([storeName, amount]) => {
                const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;

                return (
                  <div key={storeName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {storeName}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatMoney(amount)} <span className="text-[10px] text-slate-400">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Receipts & Reconciliation Ledger */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Scanned Receipts & Audit Ledger
            </h3>
          </div>

          <button
            onClick={onOpenScanReceipt}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors"
          >
            + Scan Receipt
          </button>
        </div>

        {receipts.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-400">
            No receipts scanned yet for this month. Tap "Scan Receipt" to upload your Melcom, Dominion, or market paper slips.
          </div>
        ) : (
          <div className="space-y-2">
            {receipts.map(rec => (
              <div 
                key={rec.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {rec.store}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 font-semibold">
                        Reconciled
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {rec.date} • {rec.items.length} items • Paid via {rec.paymentMethod.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {formatMoney(rec.totalAmount)}
                  </span>
                  <button
                    onClick={() => deleteReceipt(rec.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Delete receipt record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset / Demo Re-seed Helper */}
      <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
        <span>Need to reload realistic Ghana sample prices?</span>
        <button
          onClick={resetToDefaults}
          className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
        >
          Reset to Ghana Default Staples
        </button>
      </div>

      {/* Export PDF Report Modal */}
      <ExportPdfReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

    </div>
  );
};
