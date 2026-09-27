import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Moon, 
  Sun, 
  WifiOff, 
  User as UserIcon, 
  LogOut, 
  Calendar,
  Sparkles,
  ChevronDown,
  ArrowRightLeft,
  Check,
  FileSpreadsheet,
  MoreVertical,
  Store,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGrocery } from '../context/GroceryContext';
import { CurrencyCode, CURRENCY_CONFIGS } from '../types';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenAudit: () => void;
  onOpenImport: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenAuth, 
  onOpenAudit,
  onOpenImport,
  activeTab, 
  setActiveTab 
}) => {
  const { user, isOffline, logout } = useAuth();
  const { 
    selectedMonth, 
    setSelectedMonth, 
    currency,
    setCurrency,
    formatMoney,
    darkMode, 
    toggleDarkMode, 
    totalSpent, 
    isOverBudget 
  } = useGrocery();

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showMobileQuickMenu, setShowMobileQuickMenu] = useState(false);

  const months = [
    { value: '2026-07', label: 'July 2026', short: 'Jul 26' },
    { value: '2026-08', label: 'August 2026', short: 'Aug 26' },
    { value: '2026-09', label: 'September 2026', short: 'Sep 26' },
    { value: '2026-10', label: 'October 2026', short: 'Oct 26' },
  ];

  const currentCurrencyConfig = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.GHS;
  const currentMonthShort = months.find(m => m.value === selectedMonth)?.short || selectedMonth;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-xs pt-safe">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Left: Brand Logo & Desktop Month/Currency Selectors */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Logo */}
            <div 
              onClick={() => setActiveTab('list')}
              className="cursor-pointer flex items-center gap-1.5 sm:gap-2 group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="flex items-center gap-1">
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  Stock<span className="text-emerald-500">Pilot</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {currentCurrencyConfig.symbol}
                </span>
              </div>
            </div>

            {/* Desktop Month Selector */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => {
                  setShowMonthDropdown(!showMonthDropdown);
                  setShowCurrencyDropdown(false);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200/70 dark:border-slate-700/70"
              >
                <Calendar className="w-3 h-3 text-emerald-500" />
                <span>{currentMonthShort}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showMonthDropdown && (
                <div className="absolute left-0 mt-2 w-44 rounded-xl shadow-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Month
                  </div>
                  {months.map(m => (
                    <button
                      key={m.value}
                      onClick={() => {
                        setSelectedMonth(m.value);
                        setShowMonthDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/30 ${
                        selectedMonth === m.value 
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-900/20' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{m.label}</span>
                      {selectedMonth === m.value && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Currency Switcher */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => {
                  setShowCurrencyDropdown(!showCurrencyDropdown);
                  setShowMonthDropdown(false);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200/70 dark:border-slate-700/70"
                title="Change currency view"
              >
                <ArrowRightLeft className="w-3 h-3 text-amber-500" />
                <span>{currency}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showCurrencyDropdown && (
                <div className="absolute left-0 mt-2 w-52 rounded-xl shadow-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Currency Exchange</span>
                    <span className="text-[9px] text-slate-400 font-normal">Base: GHS</span>
                  </div>
                  {(Object.keys(CURRENCY_CONFIGS) as CurrencyCode[]).map(code => {
                    const cfg = CURRENCY_CONFIGS[code];
                    const isSelected = currency === code;

                    return (
                      <button
                        key={code}
                        onClick={() => {
                          setCurrency(code);
                          setShowCurrencyDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors ${
                          isSelected 
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-900/20' 
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 font-bold text-slate-900 dark:text-white">{cfg.symbol}</span>
                          <div>
                            <div className="font-semibold leading-none">{code}</div>
                            <div className="text-[10px] text-slate-400">{cfg.name}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 inline mr-1" />}
                          {code !== 'GHS' && (
                            <span className="text-[10px] text-slate-400">
                              ≈ {cfg.rateToGHS} GHS
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Center: Desktop Navigation Tabs (Spacious & Clean) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'list'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Grocery List
            </button>

            <button
              onClick={() => setActiveTab('shop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'shop'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              In-Store Mode
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'compare'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Store Prices
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'reports'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Budget & Reports
            </button>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Desktop Import Excel/CSV Button */}
            <button
              onClick={onOpenImport}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors border border-slate-200/80 dark:border-slate-700"
              title="Import from Excel (.xlsx, .xls) or CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Import</span>
            </button>

            {/* Desktop Stock Audit Button */}
            <button
              onClick={onOpenAudit}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold transition-colors border border-amber-500/20"
              title="Audit current home inventory"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Stock Audit</span>
            </button>

            {/* Mobile Compact Capsule: Month + Currency Toggle */}
            <div className="flex sm:hidden items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setShowMonthDropdown(!showMonthDropdown);
                  setShowCurrencyDropdown(false);
                  setShowMobileQuickMenu(false);
                }}
                className="px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"
              >
                <span>{currentMonthShort.split(' ')[0]}</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
              </button>

              <div className="w-[1px] h-3 bg-slate-300 dark:bg-slate-700" />

              <button
                type="button"
                onClick={() => {
                  setShowCurrencyDropdown(!showCurrencyDropdown);
                  setShowMonthDropdown(false);
                  setShowMobileQuickMenu(false);
                }}
                className="px-2 py-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5"
              >
                <span>{currency}</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
              </button>
            </div>

            {/* Mobile Dropdowns Container */}
            {showMonthDropdown && (
              <div className="sm:hidden absolute top-14 left-3 right-3 rounded-2xl shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                  Select Month
                </div>
                {months.map(m => (
                  <button
                    key={m.value}
                    onClick={() => {
                      setSelectedMonth(m.value);
                      setShowMonthDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                      selectedMonth === m.value 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold' 
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{m.label}</span>
                    {selectedMonth === m.value && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                ))}
              </div>
            )}

            {showCurrencyDropdown && (
              <div className="sm:hidden absolute top-14 left-3 right-3 rounded-2xl shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                  Choose Display Currency
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {(Object.keys(CURRENCY_CONFIGS) as CurrencyCode[]).map(code => {
                    const cfg = CURRENCY_CONFIGS[code];
                    const isSelected = currency === code;

                    return (
                      <button
                        key={code}
                        onClick={() => {
                          setCurrency(code);
                          setShowCurrencyDropdown(false);
                        }}
                        className={`p-2.5 rounded-xl text-xs text-left border flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{cfg.symbol} {code}</div>
                          <div className="text-[10px] text-slate-400">{cfg.name}</div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Offline indicator */}
            {isOffline && (
              <div 
                className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs flex items-center"
                title="Offline mode - changes saved locally"
              >
                <WifiOff className="w-3.5 h-3.5" />
              </div>
            )}

            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile More Actions Menu Toggle */}
            <div className="relative sm:hidden">
              <button
                type="button"
                onClick={() => {
                  setShowMobileQuickMenu(!showMobileQuickMenu);
                  setShowMonthDropdown(false);
                  setShowCurrencyDropdown(false);
                }}
                className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMobileQuickMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={() => {
                      onOpenImport();
                      setShowMobileQuickMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>Import Excel / CSV</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenAudit();
                      setShowMobileQuickMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Run Stock Audit</span>
                  </button>

                  <div className="my-1 border-t border-slate-200 dark:border-slate-700" />

                  {user ? (
                    <button
                      onClick={async () => {
                        await logout();
                        setShowMobileQuickMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out ({user.email ? user.email.split('@')[0] : 'Guest'})</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onOpenAuth();
                        setShowMobileQuickMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Sign In / Sync</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Desktop User Profile / Auth */}
            {user ? (
              <div className="hidden sm:flex items-center gap-1">
                <div 
                  onClick={onOpenAuth}
                  className="cursor-pointer w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center border-2 border-emerald-400/30"
                  title={user.email || 'Guest user'}
                >
                  {user.email ? user.email.charAt(0).toUpperCase() : 'G'}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all items-center gap-1"
              >
                <UserIcon className="w-3 h-3" />
                <span>Sign In</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
