export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  GUEST = 'GUEST'
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum WalletRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number; // in bytes
  type: string; // mime type, e.g. 'image/png', 'application/pdf'
  dataUrl: string; // base64 data url or document content for viewing & downloading
  uploadedBy: string;
  uploadedAt: string;
}

export interface CompanyPaymentDetails {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  upiId: string;
  qrCodeUrl?: string;
  branchName?: string;
  instructions?: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be hashed
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  walletBalance: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  attachments?: FileAttachment[]; // Package brochures, deliverables checklist, scope docs
}

export interface Order {
  id: string;
  userId: string;
  userFullName: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  paymentMethod: 'WALLET' | 'DIRECT';
  status: OrderStatus;
  createdAt: string;
  notes?: string;
  attachments?: FileAttachment[]; // Client requirements or Admin deliverables
}

export interface WalletRequest {
  id: string;
  userId: string;
  userFullName: string;
  username: string;
  amount: number;
  paymentMethod: string;
  transactionRef: string;
  notes?: string;
  status: WalletRequestStatus;
  createdAt: string;
  reviewedAt?: string;
  adminNotes?: string;
  attachment?: FileAttachment; // Deposit slip, payment receipt screenshot, or PDF
}

export interface WalletTransaction {
  id: string;
  userId: string;
  userFullName: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  referenceId?: string;
  createdAt: string;
  balanceAfter: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'ORDER_PLACED' | 'WALLET_REQUEST' | 'WALLET_APPROVED' | 'ORDER_DELIVERABLE' | 'GENERAL';
  createdAt: string;
  read: boolean;
  forRole?: UserRole;
  userId?: string;
  orderId?: string;
  referenceId?: string;
  linkTab?: string;
}