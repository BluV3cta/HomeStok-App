import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Calendar, 
  Coins, 
  CheckCircle2, 
  Layers, 
  Store, 
  ArrowRight,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { useGrocery } from '../context/GroceryContext';
import { generateExpenseReportPdf } from '../utils/pdfGenerator';
import { CURRENCY_CONFIGS } from '../types';

interface ExportPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportPdfReportModal: React.FC<ExportPdfReportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    selectedMonth, 
    monthlyBudget, 
    items, 
    currency, 
    formatMoney, 
    convertFromGHS 
  } = useGrocery();

  const currentYear = selectedMonth.split('-')[0] || '2026';
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [targetMonth, setTargetMonth] = useState<string>(selectedMonth);
  const [targetYear, setTargetYear] = useState<string>(currentYear);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableMonths = [
    { value: '2026-07', label: 'July 2026' },
    { value: '2026-08', label: 'August 2026' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-10', label: 'October 2026' },
  ];

  const availableYears = ['2026', '2025'];

  // Calculate scope metrics for live preview
  const relevantItems = items.filter(item => {
    if (!item.bought) return false;
    const m = item.month || selectedMonth;
    if (reportType === 'yearly') {
      return m.startsWith(targetYear);
    }
    return m === targetMonth;
  });

  const previewSpent = relevantItems.reduce((acc, item) => {
    const price = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
    const qty = item.boughtQuantity !== undefined ? item.boughtQuantity : item.targetQuantity;
    return acc + (price * qty);
  }, 0);

  const currConfig = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.GHS;

  const handleGeneratePdf = () => {
    setIsGenerating(true);
    setSuccessMessage(null);

    try {
      generateExpenseReportPdf({
        type: reportType,
        month: targetMonth,
        year: targetYear,
        currency,
        monthlyBudget,
        allItems: items,
        formatMoney,
        convertFromGHS
      });

      const label = reportType === 'yearly' ? `Annual ${targetYear}` : targetMonth;
      setSuccessMessage(`Downloaded StockPilot Expense Report for ${label} in ${currency}!`);
      setTimeout(() => {
        setIsGenerating(false);
      }, 800);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-amber-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Export PDF Expense Report
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {currency}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official grocery audit summary, store breakdown & itemized ledger.
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          
          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Scope Selector: Monthly vs Yearly */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
              Select Report Scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReportType('monthly')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                  reportType === 'monthly'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm">Monthly Report</span>
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-normal opacity-80">
                  Detailed monthly audit & store split
                </span>
              </button>

              <button
                type="button"
                onClick={() => setReportType('yearly')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                  reportType === 'yearly'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm">Yearly / Annual</span>
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-normal opacity-80">
                  12-month trend & annual grocery spend
                </span>
              </button>
            </div>
          </div>

          {/* Period Dropdowns */}
          {reportType === 'monthly' ? (
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Target Month
              </label>
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
              >
                {availableMonths.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label} {m.value === selectedMonth ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Target Year
              </label>
              <select
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    {y} Calendar Year
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Report Scope Preview
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Currency: {currConfig.name} ({currConfig.symbol})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Recorded Spend</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {formatMoney(previewSpent)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Purchased Line Items</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {relevantItems.length} items
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Executive Budget Summary & Variance Analysis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Store Distribution (Melcom, Dominion, Paga Focus, Markets)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Category Breakdown & Complete Itemized Ledger</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 font-semibold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-500/25 flex items-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
