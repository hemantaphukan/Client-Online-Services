/**
 * ServiceMaster Pro - PHP / MySQL Backend API Client
 * Connects the React SPA to the PHP / MySQL backend on InfinityFree.
 */

import { 
  User, 
  Service, 
  Order, 
  WalletRequest, 
  WalletTransaction, 
  AppNotification, 
  CompanyPaymentDetails,
  FileAttachment 
} from '../types';

export const getApiBaseUrl = (): string => {
  const custom = localStorage.getItem('sm_api_base_url');
  if (custom && custom.trim() !== '') {
    return custom.trim().replace(/\/+$/, '');
  }
  // Default relative API path on same host (works directly when hosted on InfinityFree)
  return '/api';
};

export const setApiBaseUrl = (url: string) => {
  if (!url || url.trim() === '') {
    localStorage.removeItem('sm_api_base_url');
  } else {
    localStorage.setItem('sm_api_base_url', url.trim());
  }
};

export interface DBTestResult {
  success: boolean;
  message: string;
  host?: string;
  database?: string;
  user?: string;
  tables_found?: string[];
  table_counts?: Record<string, number>;
  missing_tables?: string[];
  is_schema_ready?: boolean;
  error?: string;
}

export const api = {
  // Test MySQL connection
  async testConnection(customBase?: string): Promise<DBTestResult> {
    const base = customBase ? customBase.replace(/\/+$/, '') : getApiBaseUrl();
    try {
      const res = await fetch(`${base}/test_db.php?t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: 'Could not connect to API server. ' + (err.message || 'Network error.'),
        error: err.message
      };
    }
  },

  // 1-Click Database Setup (executes database.sql)
  async runSetup(customBase?: string): Promise<{ success: boolean; message: string }> {
    const base = customBase ? customBase.replace(/\/+$/, '') : getApiBaseUrl();
    const res = await fetch(`${base}/setup.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  },

  // Auth
  async login(username: string, pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/auth.php?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass })
    });
    return await res.json();
  },

  async register(fullName: string, username: string, pass: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/auth.php?action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, username, password: pass })
    });
    return await res.json();
  },

  async getUsers(): Promise<{ success: boolean; users: User[] }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/auth.php?action=users`);
    return await res.json();
  },

  async updateUserStatus(userId: string, status: 'ACTIVE' | 'REJECTED'): Promise<{ success: boolean; message?: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/auth.php?action=update_status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status })
    });
    return await res.json();
  },

  async adjustBalance(userId: string, type: 'CREDIT' | 'DEBIT', amount: number, reason: string): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/auth.php?action=adjust_balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type, amount, reason })
    });
    return await res.json();
  },

  // Services
  async getServices(): Promise<{ success: boolean; services: Service[] }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/services.php?action=list`);
    return await res.json();
  },

  async createService(service: Partial<Service>): Promise<{ success: boolean; id?: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/services.php?action=create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    return await res.json();
  },

  async deleteService(id: string): Promise<{ success: boolean }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/services.php?action=delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return await res.json();
  },

  // Orders
  async getOrders(userId?: string, role?: string): Promise<{ success: boolean; orders: Order[] }> {
    const base = getApiBaseUrl();
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    const res = await fetch(`${base}/orders.php?action=list&${params.toString()}`);
    return await res.json();
  },

  async placeOrder(orderData: {
    userId: string;
    serviceId: string;
    paymentMethod: 'WALLET' | 'DIRECT';
    notes?: string;
    attachments?: FileAttachment[];
  }): Promise<{ success: boolean; orderId?: string; newBalance?: number; error?: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/orders.php?action=create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return await res.json();
  },

  async updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/orders.php?action=update_status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status })
    });
    return await res.json();
  },

  async addOrderAttachment(orderId: string, attachment: FileAttachment): Promise<{ success: boolean }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/orders.php?action=add_attachment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, attachment })
    });
    return await res.json();
  },

  async deleteOrderAttachment(attachmentId: string): Promise<{ success: boolean }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/orders.php?action=delete_attachment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachmentId })
    });
    return await res.json();
  },

  // Wallet
  async getWalletData(userId?: string, role?: string): Promise<{
    success: boolean;
    requests: WalletRequest[];
    transactions: WalletTransaction[];
  }> {
    const base = getApiBaseUrl();
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    const res = await fetch(`${base}/wallet.php?action=list&${params.toString()}`);
    return await res.json();
  },

  async requestTopup(data: {
    userId: string;
    amount: number;
    paymentMethod: string;
    transactionRef: string;
    notes?: string;
    attachment?: FileAttachment;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/wallet.php?action=request_topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async approveWalletRequest(requestId: string, approvedAmount: number, adminNotes?: string): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/wallet.php?action=approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, approvedAmount, adminNotes })
    });
    return await res.json();
  },

  async rejectWalletRequest(requestId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/wallet.php?action=reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, reason })
    });
    return await res.json();
  },

  async deleteReceipt(attachmentId: string): Promise<{ success: boolean }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/wallet.php?action=delete_receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachmentId })
    });
    return await res.json();
  },

  // Notifications
  async getNotifications(userId?: string, role?: string): Promise<{ success: boolean; notifications: AppNotification[] }> {
    const base = getApiBaseUrl();
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    const res = await fetch(`${base}/notifications.php?action=list&${params.toString()}`);
    return await res.json();
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/notifications.php?action=mark_read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return await res.json();
  },

  async markAllNotificationsRead(userId?: string, role?: string): Promise<{ success: boolean }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/notifications.php?action=mark_all_read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });
    return await res.json();
  },

  async clearNotifications(userId?: string, role?: string): Promise<{ success: boolean }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/notifications.php?action=clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });
    return await res.json();
  },

  // Settings
  async getCompanySettings(): Promise<{ success: boolean; settings: CompanyPaymentDetails }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/settings.php?action=get`);
    return await res.json();
  },

  async updateCompanySettings(settings: CompanyPaymentDetails): Promise<{ success: boolean; message?: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/settings.php?action=update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return await res.json();
  }
};
