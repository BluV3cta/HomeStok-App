import React, { useState, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Table, 
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useGrocery } from '../context/GroceryContext';
import { GroceryCategory, StockLevel, StoreName, CATEGORY_LABELS } from '../types';

interface ImportSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessImport?: (count: number) => void;
}

interface ParsedGroceryRow {
  name: string;
  category: GroceryCategory;
  targetQuantity: number;
  unit: string;
  estimatedPrice: number;
  preferredStore: StoreName;
  stockLevel: StockLevel;
  notes?: string;
  buyThisMonth: boolean;
}

export const ImportSpreadsheetModal: React.FC<ImportSpreadsheetModalProps> = ({
  isOpen,
  onClose,
  onSuccessImport
}) => {
  const { addItem, addStore, stores, selectedMonth } = useGrocery();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedGroceryRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [targetMonth, setTargetMonth] = useState<string>(selectedMonth);
  const [queueAllToBuy, setQueueAllToBuy] = useState<boolean>(true);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to map arbitrary category strings to GroceryCategory
  const mapCategory = (raw: string): GroceryCategory => {
    const lower = (raw || '').toLowerCase().trim();
    if (lower.includes('pantry') || lower.includes('grain') || lower.includes('rice') || lower.includes('oil') || lower.includes('canned')) return 'pantry';
    if (lower.includes('produce') || lower.includes('veg') || lower.includes('fruit') || lower.includes('tomato') || lower.includes('onion')) return 'produce';
    if (lower.includes('meat') || lower.includes('fish') || lower.includes('poultry') || lower.includes('chicken') || lower.includes('beef')) return 'meat_fish';
    if (lower.includes('dairy') || lower.includes('egg') || lower.includes('milk') || lower.includes('cheese') || lower.includes('butter')) return 'dairy_eggs';
    if (lower.includes('household') || lower.includes('clean') || lower.includes('soap') || lower.includes('toilet') || lower.includes('detergent')) return 'household';
    if (lower.includes('snack') || lower.includes('drink') || lower.includes('beverage') || lower.includes('juice') || lower.includes('biscuit')) return 'snacks_drinks';
    if (lower.includes('spice') || lower.includes('season') || lower.includes('pepper') || lower.includes('salt')) return 'spices';
    return 'other';
  };

  // Helper to map stock level strings
  const mapStockLevel = (raw: string): StockLevel => {
    const lower = (raw || '').toLowerCase().trim();
    if (lower.includes('out') || lower.includes('empty') || lower.includes('zero') || lower.includes('none')) return 'out_of_stock';
    if (lower.includes('low') || lower.includes('running') || lower.includes('few') || lower.includes('little')) return 'low';
    if (lower.includes('plenty') || lower.includes('well') || lower.includes('full')) return 'well_stocked';
    return 'adequate';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          throw new Error('Spreadsheet has no sheets');
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('Spreadsheet appears to be empty. Please check the rows.');
        }

        const rows: ParsedGroceryRow[] = [];

        rawJson.forEach((row: any) => {
          // Normalize column key lookup
          const keys = Object.keys(row);
          const findVal = (keywords: string[]) => {
            const key = keys.find(k => keywords.some(w => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(w)));
            return key ? row[key] : '';
          };

          const rawName = String(findVal(['name', 'item', 'product', 'grocery', 'title', 'description']) || '').trim();
          if (!rawName) return; // Skip empty row

          const rawCat = String(findVal(['cat', 'category', 'group', 'type']) || '');
          const rawQty = parseFloat(String(findVal(['quantity', 'qty', 'count', 'amount']) || '1')) || 1;
          const rawUnit = String(findVal(['unit', 'measure', 'size', 'pkg', 'pack']) || 'pcs').trim();
          const rawPrice = parseFloat(String(findVal(['price', 'cost', 'est', 'estimate', 'ghs', 'cedi']) || '0')) || 0;
          const rawStore = String(findVal(['store', 'shop', 'market', 'vendor', 'supermarket']) || 'Melcom').trim();
          const rawStock = String(findVal(['stock', 'level', 'status']) || 'low');
          const rawNotes = String(findVal(['note', 'comment', 'memo', 'remark']) || '').trim();

          const stockLevel = mapStockLevel(rawStock);
          const buyThisMonth = stockLevel === 'out_of_stock' || stockLevel === 'low' || queueAllToBuy;

          rows.push({
            name: rawName,
            category: mapCategory(rawCat),
            targetQuantity: Math.max(1, rawQty),
            unit: rawUnit || 'pcs',
            estimatedPrice: Math.max(0, rawPrice),
            preferredStore: rawStore || 'Melcom',
            stockLevel,
            notes: rawNotes || undefined,
            buyThisMonth
          });
        });

        if (rows.length === 0) {
          throw new Error('Could not identify any grocery item names in the file columns. Please check headers.');
        }

        setParsedRows(rows);
      } catch (err: any) {
        console.error('File parsing error:', err);
        setError(err.message || 'Failed to read file. Please ensure it is a valid Excel (.xlsx, .xls) or CSV file.');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file. Please try again.');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Item Name": "Royal Aroma Fragrant Rice 5kg",
        "Category": "Pantry Staples",
        "Target Quantity": 1,
        "Unit": "5kg bag",
        "Estimated Price": 158.00,
        "Preferred Store": "Paga Focus",
        "Stock Level": "Low",
        "Notes": "Cheapest at Paga Focus"
      },
      {
        "Item Name": "Frytol Pure Vegetable Oil 1L",
        "Category": "Pantry Staples",
        "Target Quantity": 2,
        "Unit": "1L bottle",
        "Estimated Price": 36.50,
        "Preferred Store": "Melcom",
        "Stock Level": "Out of Stock",
        "Notes": ""
      },
      {
        "Item Name": "Fresh Tomatoes (Medium Basket)",
        "Category": "Fresh Produce",
        "Target Quantity": 1,
        "Unit": "basket",
        "Estimated Price": 50.00,
        "Preferred Store": "Local Market",
        "Stock Level": "Out of Stock",
        "Notes": "Buy on market day"
      },
      {
        "Item Name": "Crate of Fresh Eggs (30 pcs)",
        "Category": "Dairy & Eggs",
        "Target Quantity": 1,
        "Unit": "crate",
        "Estimated Price": 58.00,
        "Preferred Store": "Local Market",
        "Stock Level": "Out of Stock",
        "Notes": ""
      },
      {
        "Item Name": "Geisha Beauty Soap 3-Pack",
        "Category": "Household & Toiletries",
        "Target Quantity": 2,
        "Unit": "pack",
        "Estimated Price": 26.50,
        "Preferred Store": "Melcom",
        "Stock Level": "Low",
        "Notes": ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Groceries");
    XLSX.writeFile(wb, "StockPilot_Grocery_Template.xlsx");
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setIsLoading(true);

    try {
      let importedCount = 0;

      // 1. Auto-register any new stores found in the file
      for (const row of parsedRows) {
        if (row.preferredStore && !stores.includes(row.preferredStore)) {
          await addStore(row.preferredStore);
        }
      }

      // 2. Add all items to the grocery collection
      for (const row of parsedRows) {
        await addItem({
          name: row.name,
          category: row.category,
          stockLevel: row.stockLevel,
          targetQuantity: row.targetQuantity,
          unit: row.unit,
          estimatedPrice: row.estimatedPrice,
          preferredStore: row.preferredStore,
          buyThisMonth: queueAllToBuy ? true : row.buyThisMonth,
          bought: false,
          month: targetMonth,
          notes: row.notes
        });
        importedCount += 1;
      }

      setImportSummary(`Successfully imported ${importedCount} items into ${targetMonth}!`);
      if (onSuccessImport) onSuccessImport(importedCount);

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Import saving error:', err);
      setError('Failed to save imported items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-amber-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Import Groceries from Excel / CSV
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  .xlsx, .xls, .csv
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulk upload existing grocery lists, price sheets, or supermarket exports.
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {importSummary && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{importSummary}</span>
            </div>
          )}

          {/* Upload Dropzone */}
          {parsedRows.length === 0 ? (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-2xl p-8 sm:p-10 text-center transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".xlsx, .xls, .csv, .tsv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                
                <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                  Select Excel or CSV File
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Drag and drop or tap to browse from your phone or computer. Supports .xlsx, .xls, and .csv formats.
                </p>
              </div>

              {/* Sample Template Helper */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Download Sample Grocery Template
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Pre-formatted columns: Item Name, Category, Quantity, Unit, Price, Store
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Download .XLSX Template</span>
                </button>
              </div>
            </div>
          ) : (
            /* Parsed Preview Table */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-none">
                    {fileName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                    {parsedRows.length} items detected
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setFileName('');
                  }}
                  className="text-xs text-slate-400 hover:text-rose-500 self-start sm:self-auto"
                >
                  Choose another file
                </button>
              </div>

              {/* Target Month & Queue Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Import into Month
                  </label>
                  <select
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    <option value="2026-07">July 2026</option>
                    <option value="2026-08">August 2026</option>
                    <option value="2026-09">September 2026 (Current)</option>
                    <option value="2026-10">October 2026</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-4 sm:pt-6">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Queue all items to buy?
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Puts items directly on in-store shopping list
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={queueAllToBuy}
                    onChange={(e) => setQueueAllToBuy(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-bold text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Qty & Unit</th>
                        <th className="py-2.5 px-3">Price (GH₵)</th>
                        <th className="py-2.5 px-3">Store</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedRows.map((row, idx) => {
                        const catInfo = CATEGORY_LABELS[row.category] || CATEGORY_LABELS.other;

                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                              {row.name}
                            </td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                                {catInfo.icon} {catInfo.label.split(' ')[0]}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                              {row.targetQuantity} {row.unit}
                            </td>
                            <td className="py-2 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                              GH₵ {row.estimatedPrice.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                              {row.preferredStore}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        {parsedRows.length > 0 && !importSummary && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 font-semibold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-500/25 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isLoading ? 'Importing...' : `Import ${parsedRows.length} Items Now`}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
