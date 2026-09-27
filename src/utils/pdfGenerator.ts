import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GroceryItem, CurrencyCode, CURRENCY_CONFIGS, CATEGORY_LABELS } from '../types';

interface GeneratePdfOptions {
  type: 'monthly' | 'yearly';
  month: string; // YYYY-MM
  year: string; // YYYY
  currency: CurrencyCode;
  monthlyBudget: number;
  allItems: GroceryItem[];
  formatMoney: (amountInGHS: number) => string;
  convertFromGHS: (amountInGHS: number, targetCurr?: CurrencyCode) => number;
}

export const generateExpenseReportPdf = ({
  type,
  month,
  year,
  currency,
  monthlyBudget,
  allItems,
  formatMoney,
  convertFromGHS,
}: GeneratePdfOptions) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const currConfig = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.GHS;
  const isYearly = type === 'yearly';

  // Filter items according to scope
  const targetItems = allItems.filter(item => {
    if (!item.bought) return false;
    const itemMonth = item.month || month;
    if (isYearly) {
      return itemMonth.startsWith(year);
    }
    return itemMonth === month;
  });

  // Calculate totals
  const totalSpentInGHS = targetItems.reduce((acc, item) => {
    const price = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
    const qty = item.boughtQuantity !== undefined ? item.boughtQuantity : item.targetQuantity;
    return acc + (price * qty);
  }, 0);

  const totalSpentFormatted = formatMoney(totalSpentInGHS);
  const totalBudgetInGHS = isYearly ? monthlyBudget * 12 : monthlyBudget;
  const budgetVarianceInGHS = totalBudgetInGHS - totalSpentInGHS;
  const isOver = budgetVarianceInGHS < 0;

  // Primary colors
  const primaryEmerald = [5, 150, 105]; // #059669
  const textDark = [30, 41, 59]; // slate-800
  const textMuted = [100, 116, 139]; // slate-500

  // 1. Header Banner
  doc.setFillColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
  doc.rect(0, 0, 210, 28, 'F');

  // Title & Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('StockPilot', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(220, 252, 231);
  doc.text('Know what you have. Know what to buy.', 14, 20);

  // Report Type & Date in header right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  const reportTitle = isYearly ? `Annual Grocery Expense Report (${year})` : `Monthly Expense Report (${month})`;
  doc.text(reportTitle, 196, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 252, 231);
  const generatedOn = `Generated on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  doc.text(generatedOn, 196, 20, { align: 'right' });

  let yCursor = 36;

  // 2. Report Overview & Currency Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Executive Spending Summary', 14, yCursor);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const currencyNote = currency === 'GHS' 
    ? 'All amounts reported in Ghana Cedis (GH₵)'
    : `All amounts converted to ${currConfig.name} (${currConfig.symbol} ${currency}) @ 1 ${currency} = ${currConfig.rateToGHS} GHS`;
  doc.text(currencyNote, 14, yCursor + 5);

  yCursor += 10;

  // Summary Metrics Table
  const summaryHeaders = [['Total Budget', 'Total Actual Spent', 'Net Variance', 'Purchased Items']];
  const varianceText = isOver 
    ? `+${formatMoney(Math.abs(budgetVarianceInGHS))} (Over Budget)`
    : `-${formatMoney(budgetVarianceInGHS)} (Saved Buffer)`;

  const summaryData = [[
    formatMoney(totalBudgetInGHS),
    totalSpentFormatted,
    varianceText,
    `${targetItems.length} items`
  ]];

  autoTable(doc, {
    startY: yCursor,
    head: summaryHeaders,
    body: summaryData,
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9.5,
      fontStyle: 'bold',
      textColor: [15, 23, 42],
      halign: 'center'
    },
    styles: { cellPadding: 3.5 },
    margin: { left: 14, right: 14 }
  });

  yCursor = (doc as any).lastAutoTable.finalY + 9;

  // 3. Category Breakdown Table
  const categoryTotals: Record<string, number> = {};
  targetItems.forEach(item => {
    const cat = item.category || 'other';
    const price = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
    const qty = item.boughtQuantity !== undefined ? item.boughtQuantity : item.targetQuantity;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (price * qty);
  });

  const categoryRows = Object.keys(categoryTotals).map(catKey => {
    const amount = categoryTotals[catKey];
    const pct = totalSpentInGHS > 0 ? ((amount / totalSpentInGHS) * 100).toFixed(1) : '0';
    const label = (CATEGORY_LABELS[catKey as keyof typeof CATEGORY_LABELS]?.label || catKey).split(' ')[0];
    return [label, formatMoney(amount), `${pct}%`];
  });

  // 4. Store Spend Breakdown Table
  const storeTotals: Record<string, number> = {};
  targetItems.forEach(item => {
    const store = item.boughtAtStore || item.preferredStore || 'Other';
    const price = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
    const qty = item.boughtQuantity !== undefined ? item.boughtQuantity : item.targetQuantity;
    storeTotals[store] = (storeTotals[store] || 0) + (price * qty);
  });

  const storeRows = Object.entries(storeTotals).map(([storeName, amount]) => {
    const pct = totalSpentInGHS > 0 ? ((amount / totalSpentInGHS) * 100).toFixed(1) : '0';
    return [storeName, formatMoney(amount), `${pct}%`];
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Category & Store Distribution', 14, yCursor);
  yCursor += 4;

  // Render Category Table
  autoTable(doc, {
    startY: yCursor,
    head: [['Category', 'Total Spent', '% of Total']],
    body: categoryRows.length > 0 ? categoryRows : [['No data recorded', '-', '-']],
    theme: 'striped',
    tableWidth: 88,
    margin: { left: 14 },
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 }
  });

  // Render Store Table alongside Category Table
  autoTable(doc, {
    startY: yCursor,
    head: [['Store / Market', 'Total Spent', '% of Total']],
    body: storeRows.length > 0 ? storeRows : [['No data recorded', '-', '-']],
    theme: 'striped',
    tableWidth: 88,
    margin: { left: 108 },
    headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 }
  });

  const catFinalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : yCursor + 40;
  yCursor = catFinalY + 10;

  // If Yearly: Add Monthly Breakdown Table
  if (isYearly) {
    const monthTotals: Record<string, number> = {};
    targetItems.forEach(item => {
      const m = item.month || 'Unknown';
      const price = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
      const qty = item.boughtQuantity !== undefined ? item.boughtQuantity : item.targetQuantity;
      monthTotals[m] = (monthTotals[m] || 0) + (price * qty);
    });

    const monthRows = Object.entries(monthTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, amount]) => [
        m,
        formatMoney(amount),
        totalSpentInGHS > 0 ? `${((amount / totalSpentInGHS) * 100).toFixed(1)}%` : '0%'
      ]);

    if (monthRows.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text('Monthly Trend Analysis', 14, yCursor);
      yCursor += 4;

      autoTable(doc, {
        startY: yCursor,
        head: [['Month', 'Total Spent', '% of Annual Expense']],
        body: monthRows,
        theme: 'striped',
        margin: { left: 14, right: 14 },
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });

      yCursor = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // 5. Itemized Expense Ledger
  // Check if we need a new page for the itemized table
  if (yCursor > 230) {
    doc.addPage();
    yCursor = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Itemized Expense Ledger', 14, yCursor);
  yCursor += 4;

  const itemRows = targetItems.map((item, idx) => {
    const price = item.boughtPrice !== undefined ? item.boughtPrice : item.estimatedPrice;
    const qty = item.boughtQuantity !== undefined ? item.boughtQuantity : item.targetQuantity;
    const lineTotal = price * qty;
    const store = item.boughtAtStore || item.preferredStore;
    const typeLabel = item.isUnplanned ? '✨ Unplanned' : 'Planned';
    const date = item.boughtDate || item.month || '-';

    return [
      String(idx + 1),
      item.name,
      `${qty} ${item.unit}`,
      store,
      date,
      typeLabel,
      formatMoney(price),
      formatMoney(lineTotal)
    ];
  });

  autoTable(doc, {
    startY: yCursor,
    head: [['#', 'Item Name', 'Qty', 'Store', 'Date', 'Type', 'Unit Price', 'Total']],
    body: itemRows.length > 0 ? itemRows : [['-', 'No items recorded as bought', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 18 },
      3: { cellWidth: 26 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }
    },
    styles: { cellPadding: 2 }
  });

  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `StockPilot Report • Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = isYearly 
    ? `StockPilot_Expense_Report_${year}_${currency}.pdf`
    : `StockPilot_Expense_Report_${month}_${currency}.pdf`;

  doc.save(filename);
};
