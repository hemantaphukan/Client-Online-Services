import React from 'react';
import { useApp } from '../contexts/AppContext';
import { UserRole } from '../types';
import { LogOut, User as UserIcon, Shield, Menu, X, Wallet, ArrowUpRight } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabs?: TabItem[];
  onRequestTopup?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  tabs,
  onRequestTopup
}) => {
  const { currentUser, logout, pendingRequestsCount } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isCustomer = currentUser?.role === UserRole.CUSTOMER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen fixed top-0 left-0 z-50 shadow-xl border-r border-slate-800">
        {/* Brand header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight block leading-tight">ServiceMaster</span>
              <span className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">Portal & Wallet</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col overflow-y-auto">
          {/* User profile card */}
          <div className="p-3.5 bg-slate-800/70 rounded-xl mb-4 border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold truncate text-white">{currentUser?.fullName}</p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span className="text-xs text-slate-400 font-medium capitalize">@{currentUser?.username} ({currentUser?.role.toLowerCase()})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Live Wallet Card */}
          {isCustomer && (
            <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900/60 border border-indigo-500/30 relative overflow-hidden shadow-lg shadow-indigo-950/50">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between text-indigo-200 text-xs mb-1">
                <span className="flex items-center space-x-1 font-medium">
                  <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Wallet Balance</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border border-emerald-500/30">
                  Active
                </span>
              </div>
              <div className="flex items-baseline space-x-1 my-1">
                <span className="text-2xl font-black text-white tracking-tight">
                  ₹{(currentUser?.walletBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-indigo-300">INR</span>
              </div>
              <button
                onClick={() => {
                  if (onRequestTopup) {
                    onRequestTopup();
                  } else if (onTabChange) {
                    onTabChange('wallet');
                  }
                }}
                className="mt-2.5 w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all group"
              >
                <span>Add Money</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Admin Live Pending Indicator */}
          {isAdmin && pendingRequestsCount > 0 && (
            <div 
              onClick={() => onTabChange?.('wallet-requests')}
              className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300 flex items-center space-x-1.5">
                  <Wallet className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Top-up Requests</span>
                </span>
                <span className="bg-amber-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingRequestsCount} new
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80 mt-1">Clients waiting for wallet credit approval</p>
            </div>
          )}

          {/* Nav Tabs */}
          <nav className="space-y-1.5">
            {tabs?.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </div>
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-indigo-700' : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sign out */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <button 
            onClick={logout}
            className="flex items-center space-x-3 px-3.5 py-2.5 w-full text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 px-4 py-3 flex justify-between items-center shadow-lg border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">ServiceMaster</span>
        </div>

        <div className="flex items-center space-x-2">
          {isCustomer && (
            <button
              onClick={() => onTabChange?.('wallet')}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-indigo-900/80 border border-indigo-500/40 text-white rounded-lg text-xs font-semibold"
            >
              <Wallet className="w-3.5 h-3.5 text-indigo-300" />
              <span>₹{(currentUser?.walletBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </button>
          )}

          {isAdmin && pendingRequestsCount > 0 && (
            <button
              onClick={() => onTabChange?.('wallet-requests')}
              className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-lg text-xs font-bold"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{pendingRequestsCount}</span>
            </button>
          )}

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900 z-40 pt-16 px-4 flex flex-col pb-6">
          <div className="p-4 bg-slate-800/80 rounded-xl mb-4 border border-slate-700">
            <p className="text-white font-semibold text-sm">{currentUser?.fullName}</p>
            <p className="text-xs text-slate-400">@{currentUser?.username} ({currentUser?.role})</p>
            {isCustomer && (
              <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-xs text-slate-300">Wallet Balance:</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">₹{(currentUser?.walletBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <nav className="space-y-1.5 flex-1">
            {tabs?.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange?.(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="bg-amber-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 mt-14 md:mt-0 transition-all min-w-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};