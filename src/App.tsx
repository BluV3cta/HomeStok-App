import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { GroceryProvider } from './context/GroceryContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { GroceryListView } from './components/GroceryListView';
import { InStoreShoppingMode } from './components/InStoreShoppingMode';
import { StorePriceComparator } from './components/StorePriceComparator';
import { BudgetAndReportsView } from './components/BudgetAndReportsView';
import { SalaryStockAuditModal } from './components/SalaryStockAuditModal';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
import { AddItemModal } from './components/AddItemModal';
import { AuthModal } from './components/AuthModal';
import { ImportSpreadsheetModal } from './components/ImportSpreadsheetModal';
import { GroceryItem } from './types';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('list');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);

  const handleEditItem = (item: GroceryItem) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        onOpenImport={() => setIsImportModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {activeTab === 'list' && (
          <GroceryListView
            onOpenAddModal={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            onOpenAuditModal={() => setIsAuditModalOpen(true)}
            onOpenImport={() => setIsImportModalOpen(true)}
            onEditItem={handleEditItem}
            onGoToShopMode={() => setActiveTab('shop')}
            onOpenCompare={() => setActiveTab('compare')}
          />
        )}

        {activeTab === 'shop' && (
          <InStoreShoppingMode
            onOpenScanReceipt={() => setIsScanModalOpen(true)}
            onBackToList={() => setActiveTab('list')}
          />
        )}

        {activeTab === 'compare' && (
          <StorePriceComparator />
        )}

        {activeTab === 'reports' && (
          <BudgetAndReportsView
            onOpenScanReceipt={() => setIsScanModalOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (iOS / Android) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScan={() => setIsScanModalOpen(true)}
      />

      {/* Modals */}
      <SalaryStockAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      <ReceiptScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSuccessReconcile={() => {
          setActiveTab('reports');
        }}
      />

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        editingItem={editingItem}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ImportSpreadsheetModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <GroceryProvider>
        <MainApp />
      </GroceryProvider>
    </AuthProvider>
  );
}
