import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  Service, 
  Order, 
  UserRole, 
  UserStatus, 
  OrderStatus, 
  WalletRequest, 
  WalletRequestStatus, 
  WalletTransaction,
  CompanyPaymentDetails,
  FileAttachment,
  AppNotification
} from '../types';
import { 
  INITIAL_SERVICES, 
  INITIAL_USERS, 
  INITIAL_WALLET_REQUESTS, 
  INITIAL_WALLET_TRANSACTIONS,
  DEFAULT_COMPANY_PAYMENT_DETAILS,
  INITIAL_NOTIFICATIONS
} from '../constants';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  services: Service[];
  orders: Order[];
  walletRequests: WalletRequest[];
  walletTransactions: WalletTransaction[];
  companyPaymentDetails: CompanyPaymentDetails;
  updateCompanyPaymentDetails: (details: Partial<CompanyPaymentDetails>) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (fullName: string, username: string, password: string) => Promise<boolean>;
  placeOrder: (
    serviceId: string, 
    notes?: string, 
    payWithWallet?: boolean,
    attachments?: FileAttachment[]
  ) => Promise<{ success: boolean; message: string; order?: Order }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  addServiceAttachment: (serviceId: string, attachment: FileAttachment) => void;
  removeServiceAttachment: (serviceId: string, attachmentId: string) => void;
  addOrderAttachment: (orderId: string, attachment: FileAttachment) => void;
  removeOrderAttachment: (orderId: string, attachmentId: string) => void;
  removeWalletRequestAttachment: (requestId: string) => void;
  requestWalletTopup: (
    amount: number, 
    paymentMethod: string, 
    transactionRef: string, 
    notes?: string,
    attachment?: FileAttachment
  ) => Promise<boolean>;
  approveWalletRequest: (requestId: string, adminNotes?: string, adjustedAmount?: number) => void;
  rejectWalletRequest: (requestId: string, adminNotes?: string) => void;
  adjustUserWallet: (userId: string, amount: number, type: 'CREDIT' | 'DEBIT', description: string) => void;
  pendingRequestsCount: number;
  pendingOrdersCount: number;
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  toast: { message: string; type: 'success' | 'error' | 'info'; id: number } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sm_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Load initial data from localStorage or fallback to constants
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sm_users');
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: User[] = JSON.parse(saved);
      return parsed.map(u => ({
        ...u,
        walletBalance: typeof u.walletBalance === 'number' ? u.walletBalance : 0
      }));
    } catch {
      return INITIAL_USERS;
    }
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('sm_services');
    if (!saved) return INITIAL_SERVICES;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_SERVICES;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('sm_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>(() => {
    const saved = localStorage.getItem('sm_wallet_requests');
    return saved ? JSON.parse(saved) : INITIAL_WALLET_REQUESTS;
  });

  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem('sm_wallet_transactions');
    return saved ? JSON.parse(saved) : INITIAL_WALLET_TRANSACTIONS;
  });

  // Company Payment Account Details (editable by admin)
  const [companyPaymentDetails, setCompanyPaymentDetails] = useState<CompanyPaymentDetails>(() => {
    const saved = localStorage.getItem('sm_company_payment_details');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_PAYMENT_DETAILS;
  });

  // App-wide Notifications system
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('sm_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // App-wide Toast system (no window.alert in iframe)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  const hideToast = () => setToast(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Persistence effects
  useEffect(() => localStorage.setItem('sm_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('sm_services', JSON.stringify(services)), [services]);
  useEffect(() => localStorage.setItem('sm_orders', JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem('sm_wallet_requests', JSON.stringify(walletRequests)), [walletRequests]);
  useEffect(() => localStorage.setItem('sm_wallet_transactions', JSON.stringify(walletTransactions)), [walletTransactions]);
  useEffect(() => localStorage.setItem('sm_company_payment_details', JSON.stringify(companyPaymentDetails)), [companyPaymentDetails]);
  useEffect(() => localStorage.setItem('sm_notifications', JSON.stringify(notifications)), [notifications]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sm_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sm_current_user');
    }
  }, [currentUser]);

  // Keep currentUser in sync when users list updates
  useEffect(() => {
    if (currentUser) {
      const fresh = users.find(u => u.id === currentUser.id);
      if (fresh && (fresh.walletBalance !== currentUser.walletBalance || fresh.status !== currentUser.status)) {
        setCurrentUser(fresh);
      }
    }
  }, [users, currentUser]);

  // Filter visible notifications based on currentUser role and id
  const visibleNotifications = notifications.filter(n => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) {
      return n.forRole === UserRole.ADMIN || !n.forRole;
    }
    return (n.forRole === UserRole.CUSTOMER && (!n.userId || n.userId === currentUser.id)) ||
      (!n.forRole && (!n.userId || n.userId === currentUser.id));
  });

  const unreadNotificationsCount = visibleNotifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => {
      if (!currentUser) return n;
      if (currentUser.role === UserRole.ADMIN && (n.forRole === UserRole.ADMIN || !n.forRole)) {
        return { ...n, read: true };
      }
      if (currentUser.role === UserRole.CUSTOMER && ((n.forRole === UserRole.CUSTOMER && (!n.userId || n.userId === currentUser.id)) || (!n.forRole && (!n.userId || n.userId === currentUser.id)))) {
        return { ...n, read: true };
      }
      return n;
    }));
  };

  const clearNotifications = () => {
    setNotifications(prev => prev.filter(n => {
      if (!currentUser) return true;
      if (currentUser.role === UserRole.ADMIN) {
        return n.forRole !== UserRole.ADMIN && !!n.forRole;
      }
      return n.userId !== currentUser.id;
    }));
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updateCompanyPaymentDetails = (details: Partial<CompanyPaymentDetails>) => {
    setCompanyPaymentDetails(prev => ({
      ...prev,
      ...details,
      updatedAt: new Date().toISOString()
    }));
    showToast('Company payment account details updated successfully!', 'success');
  };

  const login = async (username: string, pass: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 200));
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === pass);
    if (user) {
      if (user.status === UserStatus.PENDING) {
        showToast("Your account is pending administrator approval before you can sign in.", "info");
        return false;
      }
      if (user.status === UserStatus.REJECTED) {
        showToast("Your account registration was declined by the administrator.", "error");
        return false;
      }
      const safeUser = {
        ...user,
        walletBalance: typeof user.walletBalance === 'number' ? user.walletBalance : 0
      };
      setCurrentUser(safeUser);
      showToast(`Welcome back, ${user.fullName}!`, 'success');
      return true;
    }
    showToast("Invalid username or password. Please try again.", "error");
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    showToast("Signed out successfully.", "info");
  };

  const register = async (fullName: string, username: string, pass: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      showToast("Username is already taken. Please choose another username.", "error");
      return false;
    }
    const newUser: User = {
      id: `u_${Date.now()}`,
      username: username.trim(),
      password: pass,
      fullName: fullName.trim(),
      role: UserRole.CUSTOMER,
      status: UserStatus.PENDING,
      walletBalance: 0,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    showToast("Account registration submitted! Awaiting administrator approval.", "success");
    return true;
  };

  const placeOrder = async (
    serviceId: string, 
    notes?: string, 
    payWithWallet: boolean = false,
    attachments?: FileAttachment[]
  ): Promise<{ success: boolean; message: string; order?: Order }> => {
    if (!currentUser) return { success: false, message: 'You must be logged in' };
    const service = services.find(s => s.id === serviceId);
    if (!service) return { success: false, message: 'Service not found' };

    if (payWithWallet) {
      const currentBal = currentUser.walletBalance || 0;
      if (currentBal < service.price) {
        return { 
          success: false, 
          message: `Insufficient wallet balance. You have ₹${currentBal.toFixed(2)}, but this service costs ₹${service.price.toFixed(2)}. Please request to add money to your wallet first.` 
        };
      }

      // Deduct from wallet balance
      const newBalance = currentBal - service.price;
      const updatedUser = { ...currentUser, walletBalance: newBalance };
      
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);

      // Add debit transaction
      const newTx: WalletTransaction = {
        id: `tx_${Date.now()}`,
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        type: 'DEBIT',
        amount: service.price,
        description: `Payment for service: ${service.name}`,
        createdAt: new Date().toISOString(),
        balanceAfter: newBalance
      };
      setWalletTransactions(prev => [newTx, ...prev]);
    }

    const newOrder: Order = {
      id: `ord_${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      serviceId,
      serviceName: service.name,
      amount: service.price,
      paymentMethod: payWithWallet ? 'WALLET' : 'DIRECT',
      status: payWithWallet ? OrderStatus.IN_PROGRESS : OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
      notes,
      attachments: attachments || []
    };

    setOrders(prev => [newOrder, ...prev]);

    // 1. Notification for Administrator
    const adminNotif: AppNotification = {
      id: `notif_${Date.now()}_admin`,
      title: '🛒 New Client Order Placed!',
      message: `${currentUser.fullName} (@${currentUser.username}) placed Order #${newOrder.id} for "${service.name}" (₹${service.price.toLocaleString('en-IN')}) via ${payWithWallet ? 'Wallet Balance' : 'Direct Invoice'}.`,
      type: 'ORDER_PLACED',
      createdAt: new Date().toISOString(),
      read: false,
      forRole: UserRole.ADMIN,
      orderId: newOrder.id,
      linkTab: 'orders'
    };

    // 2. Notification for Client
    const clientNotif: AppNotification = {
      id: `notif_${Date.now()}_client`,
      title: '🎉 Order Placed Successfully!',
      message: `Your Order #${newOrder.id} for "${service.name}" (${payWithWallet ? 'Paid ₹' + service.price.toLocaleString('en-IN') + ' from wallet' : '₹' + service.price.toLocaleString('en-IN') + ' via Direct Invoice'}) was received and is ${payWithWallet ? 'in progress' : 'pending'}.`,
      type: 'ORDER_PLACED',
      createdAt: new Date().toISOString(),
      read: false,
      forRole: UserRole.CUSTOMER,
      userId: currentUser.id,
      orderId: newOrder.id,
      linkTab: 'orders'
    };

    setNotifications(prev => [adminNotif, clientNotif, ...prev]);

    // Show instant toast notification
    showToast(`Order #${newOrder.id} placed successfully! Notification sent to administrator.`, 'success');

    return { 
      success: true, 
      message: payWithWallet 
        ? `Order placed and paid (₹${service.price.toFixed(2)}) using your wallet!` 
        : `Order placed successfully! Awaiting processing.`,
      order: newOrder
    };
  };


  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const updateUserStatus = (userId: string, status: UserStatus) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
  };

  const addService = (service: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...service,
      id: `s_${Date.now()}`,
      attachments: service.attachments || []
    };
    setServices(prev => [...services, newService]);
  };

  const addServiceAttachment = (serviceId: string, attachment: FileAttachment) => {
    setServices(prev => prev.map(s => {
      if (s.id !== serviceId) return s;
      return {
        ...s,
        attachments: [...(s.attachments || []), attachment]
      };
    }));
  };

  const removeServiceAttachment = (serviceId: string, attachmentId: string) => {
    setServices(prev => prev.map(s => {
      if (s.id !== serviceId) return s;
      return {
        ...s,
        attachments: (s.attachments || []).filter(a => a.id !== attachmentId)
      };
    }));
    showToast("Service package attachment deleted.", "info");
  };

  const addOrderAttachment = (orderId: string, attachment: FileAttachment) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        attachments: [...(o.attachments || []), attachment]
      };
    }));
    showToast(`Attachment "${attachment.name}" uploaded to Order #${orderId}`, "success");
  };

  const removeOrderAttachment = (orderId: string, attachmentId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        attachments: (o.attachments || []).filter(a => a.id !== attachmentId)
      };
    }));
    showToast("Order attachment deleted.", "info");
  };

  const removeWalletRequestAttachment = (requestId: string) => {
    setWalletRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const { attachment: _discarded, ...rest } = r;
      return rest;
    }));
    showToast("Deposit receipt attachment deleted.", "info");
  };

  // Client requests to add money to their wallet with optional attachment proof
  const requestWalletTopup = async (
    amount: number, 
    paymentMethod: string, 
    transactionRef: string, 
    notes?: string,
    attachment?: FileAttachment
  ): Promise<boolean> => {
    if (!currentUser) return false;
    if (amount <= 0) {
      showToast("Please enter a valid amount greater than ₹0.", "error");
      return false;
    }

    const newRequest: WalletRequest = {
      id: `wreq_${Date.now()}`,
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      username: currentUser.username,
      amount: Number(amount),
      paymentMethod,
      transactionRef: transactionRef.trim() || 'N/A',
      notes: notes?.trim() || '',
      status: WalletRequestStatus.PENDING,
      createdAt: new Date().toISOString(),
      attachment
    };

    setWalletRequests(prev => [newRequest, ...prev]);
    showToast(`Top-up request for ₹${amount.toLocaleString('en-IN')} submitted!`, 'success');
    return true;
  };

  // Admin approves client's top-up request and credits their wallet balance
  const approveWalletRequest = (requestId: string, adminNotes?: string, adjustedAmount?: number) => {
    const request = walletRequests.find(r => r.id === requestId);
    if (!request || request.status !== WalletRequestStatus.PENDING) return;

    const creditAmount = typeof adjustedAmount === 'number' && adjustedAmount > 0 
      ? adjustedAmount 
      : request.amount;

    const targetUser = users.find(u => u.id === request.userId);
    if (!targetUser) {
      showToast("Target client user was not found.", "error");
      return;
    }

    const currentBalance = targetUser.walletBalance || 0;
    const newBalance = currentBalance + creditAmount;

    // Update target user's wallet
    const updatedUser = { ...targetUser, walletBalance: newBalance };
    setUsers(prev => prev.map(u => u.id === targetUser.id ? updatedUser : u));

    if (currentUser && currentUser.id === targetUser.id) {
      setCurrentUser(updatedUser);
    }

    // Record wallet ledger transaction
    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      userId: targetUser.id,
      userFullName: targetUser.fullName,
      type: 'CREDIT',
      amount: creditAmount,
      description: `Wallet Top-Up Approved by Admin (Ref: ${request.transactionRef || 'N/A'})`,
      referenceId: request.id,
      createdAt: new Date().toISOString(),
      balanceAfter: newBalance
    };
    setWalletTransactions(prev => [newTx, ...prev]);

    // Update request status to APPROVED
    setWalletRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { 
            ...r, 
            status: WalletRequestStatus.APPROVED, 
            amount: creditAmount,
            reviewedAt: new Date().toISOString(),
            adminNotes: adminNotes || 'Approved and credited to customer wallet.'
          } 
        : r
    ));
    showToast(`₹${creditAmount.toLocaleString('en-IN')} credited to ${targetUser.fullName}'s wallet!`, 'success');
  };

  // Admin rejects a client's top-up request
  const rejectWalletRequest = (requestId: string, adminNotes?: string) => {
    setWalletRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { 
            ...r, 
            status: WalletRequestStatus.REJECTED, 
            reviewedAt: new Date().toISOString(),
            adminNotes: adminNotes || 'Request declined by administrator.'
          } 
        : r
    ));
    showToast("Top-up request declined.", "info");
  };

  // Admin directly credits or debits any client's wallet balance
  const adjustUserWallet = (
    userId: string, 
    amount: number, 
    type: 'CREDIT' | 'DEBIT', 
    description: string
  ) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const currentBal = targetUser.walletBalance || 0;
    let newBalance = type === 'CREDIT' ? currentBal + amount : currentBal - amount;
    if (newBalance < 0) newBalance = 0;

    const updatedUser = { ...targetUser, walletBalance: newBalance };
    setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(updatedUser);
    }

    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      userId: targetUser.id,
      userFullName: targetUser.fullName,
      type,
      amount,
      description: description || `Manual ${type.toLowerCase()} by administrator`,
      createdAt: new Date().toISOString(),
      balanceAfter: newBalance
    };
    setWalletTransactions(prev => [newTx, ...prev]);
    showToast(`Wallet for ${targetUser.fullName} ${type === 'CREDIT' ? 'credited' : 'debited'} with ₹${amount.toLocaleString('en-IN')}`, 'success');
  };

  const pendingRequestsCount = walletRequests.filter(r => r.status === WalletRequestStatus.PENDING).length;

  return (
    <AppContext.Provider value={{
      currentUser, 
      users, 
      services, 
      orders, 
      walletRequests,
      walletTransactions,
      companyPaymentDetails,
      updateCompanyPaymentDetails,
      login, 
      logout, 
      register, 
      placeOrder,
      updateOrderStatus, 
      updateUserStatus, 
      addService,
      addServiceAttachment,
      removeServiceAttachment,
      addOrderAttachment,
      removeOrderAttachment,
      removeWalletRequestAttachment,
      requestWalletTopup,
      approveWalletRequest,
      rejectWalletRequest,
      adjustUserWallet,
      pendingRequestsCount,
      toast,
      showToast,
      hideToast
    }}>
      {children}
      {toast && (
        <div 
          role="alert"
          className="fixed bottom-5 right-5 z-[100] max-w-sm w-full bg-slate-900/95 backdrop-blur-md text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between space-x-3 transition-all animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-400 ring-2 ring-emerald-400/30' :
              toast.type === 'error' ? 'bg-red-400 ring-2 ring-red-400/30' :
              'bg-indigo-400 ring-2 ring-indigo-400/30'
            }`} />
            <p className="text-xs font-semibold leading-snug truncate-2-lines text-slate-100">
              {toast.message}
            </p>
          </div>
          <button
            onClick={hideToast}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-sm flex-shrink-0 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};