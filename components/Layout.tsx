import React from 'react';
import { useApp } from '../contexts/AppContext';
import { UserRole } from '../types';
import { 
  LogOut, 
  User as UserIcon, 
  Shield, 
  Menu, 
  X, 
  Wallet, 
  ArrowUpRight, 
  Bell, 
  ShoppingCart, 
  CheckCheck, 
  Clock, 
  Trash2,
  FileCheck,
  CheckCircle2
} from 'lucide-react';

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
  const { 
    currentUser, 
    logout, 
    pendingRequestsCount,
    pendingOrdersCount,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  const isCustomer = currentUser?.role === UserRole.CUSTOMER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationAsRead(notif.id);
    if (notif.linkTab && onTabChange) {
      onTabChange(notif.linkTab);
      setNotificationsOpen(false);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen fixed top-0 left-0 z-50 shadow-xl border-r border-slate-800">
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight block leading-tight">ServiceMaster</span>
              <span className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">Portal & Wallet</span>
            </div>
          </div>

          {/* Desktop Notifications Bell Button */}
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>
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

          {/* Admin Live Pending Top-up Indicator */}
          {isAdmin && pendingRequestsCount > 0 && (
            <div 
              onClick={() => onTabChange?.('wallet-requests')}
              className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-colors"
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

          {/* Admin Live Pending Orders Indicator */}
          {isAdmin && pendingOrdersCount > 0 && (
            <div 
              onClick={() => onTabChange?.('orders')}
              className="mb-4 p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 cursor-pointer hover:bg-indigo-500/25 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-300 flex items-center space-x-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>Client Orders</span>
                </span>
                <span className="bg-indigo-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingOrdersCount} new
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80 mt-1">Clients placed orders requiring fulfillment</p>
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
          {/* Mobile Notifications Bell */}
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-900" />
            )}
          </button>

          {isCustomer && (
            <button
              onClick={() => onTabChange?.('wallet')}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-indigo-900/80 border border-indigo-500/40 text-white rounded-lg text-xs font-semibold"
            >
              <Wallet className="w-3.5 h-3.5 text-indigo-300" />
              <span>₹{(currentUser?.walletBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </button>
          )}

          {isAdmin && (pendingRequestsCount > 0 || pendingOrdersCount > 0) && (
            <button
              onClick={() => onTabChange?.(pendingRequestsCount > 0 ? 'wallet-requests' : 'orders')}
              className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-lg text-xs font-bold"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{pendingRequestsCount + pendingOrdersCount}</span>
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

      {/* NOTIFICATIONS DRAWER / MODAL */}
      {notificationsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-end animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Notifications Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 text-base">Notifications</h3>
                    {unreadNotificationsCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                        {unreadNotificationsCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Live order & wallet balance activity</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {unreadNotificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="p-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:bg-indigo-50 rounded-lg flex items-center space-x-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
              {notifications.length === 0 ? (
                <div className="py-16 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">No notifications yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    You'll be alerted when clients place new orders, upload attachments, or when wallet funds are credited.
                  </p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 rounded-xl transition-all cursor-pointer mb-1 border ${
                      !n.read 
                        ? 'bg-indigo-50/70 hover:bg-indigo-50 border-indigo-200/80 shadow-sm' 
                        : 'bg-white hover:bg-slate-50 border-transparent'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        n.type === 'ORDER_PLACED' ? 'bg-indigo-600 text-white' :
                        n.type === 'WALLET_REQUEST' ? 'bg-amber-500 text-white' :
                        n.type === 'WALLET_APPROVED' ? 'bg-emerald-600 text-white' :
                        n.type === 'ORDER_DELIVERABLE' ? 'bg-violet-600 text-white' :
                        'bg-slate-700 text-white'
                      }`}>
                        {n.type === 'ORDER_PLACED' ? <ShoppingCart className="w-4 h-4" /> :
                         n.type === 'WALLET_REQUEST' || n.type === 'WALLET_APPROVED' ? <Wallet className="w-4 h-4" /> :
                         n.type === 'ORDER_DELIVERABLE' ? <FileCheck className="w-4 h-4" /> :
                         <Bell className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className={`text-xs font-bold truncate ${!n.read ? 'text-indigo-950 font-extrabold' : 'text-slate-900'}`}>
                            {n.title}
                          </h4>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 ml-2" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-400 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}</span>
                          {n.linkTab && (
                            <span className="text-indigo-600 font-semibold hover:underline">
                              View in {n.linkTab.replace('-', ' ')} &rarr;
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Notifications Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px]">{notifications.length} Total</span>
                <button
                  type="button"
                  onClick={clearNotifications}
                  className="text-slate-500 hover:text-red-600 font-semibold flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};