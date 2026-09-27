import React from 'react';
import { 
  CheckSquare, 
  ShoppingCart, 
  Store, 
  Camera, 
  PieChart 
} from 'lucide-react';
import { useGrocery } from '../context/GroceryContext';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenScan: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenScan
}) => {
  const { itemsToBuy, itemsBought } = useGrocery();

  const remainingCount = itemsToBuy.length - itemsBought.length;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        
        {/* List Tab */}
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'list'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <div className="relative">
            <CheckSquare className="w-5 h-5" />
            {itemsToBuy.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[9px] font-bold">
                {itemsToBuy.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Groceries</span>
        </button>

        {/* In-Store Mode Tab */}
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'shop'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {remainingCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-bold">
                {remainingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Shop Mode</span>
        </button>

        {/* Scan Center Button */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            onClick={onOpenScan}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform border-4 border-slate-50 dark:border-slate-900"
            aria-label="Scan Receipt"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>

        {/* Compare Tab */}
        <button
          onClick={() => setActiveTab('compare')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'compare'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px] mt-1">Prices</span>
        </button>

        {/* Reports / Budget Tab */}
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'reports'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px] mt-1">Budget</span>
        </button>

      </div>
    </div>
  );
};
