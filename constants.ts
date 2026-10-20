import { 
  Service, 
  User, 
  UserRole, 
  UserStatus, 
  WalletRequest, 
  WalletRequestStatus, 
  WalletTransaction,
  CompanyPaymentDetails,
  FileAttachment
} from './types';

// Sample SVG receipt data URL for testing attachment view & download
const SAMPLE_RECEIPT_DATA_URL = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#f8fafc" rx="16"/>
  <rect x="20" y="20" width="560" height="360" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="12"/>
  <rect x="20" y="20" width="560" height="60" fill="#4f46e5" rx="12"/>
  <text x="40" y="58" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">ServiceMaster Pro — Official Payment Receipt</text>
  <text x="40" y="120" fill="#64748b" font-family="sans-serif" font-size="14">Transaction ID:</text>
  <text x="200" y="120" fill="#0f172a" font-family="monospace" font-size="15" font-weight="bold">UPI-88921478</text>
  <text x="40" y="160" fill="#64748b" font-family="sans-serif" font-size="14">Amount Paid:</text>
  <text x="200" y="160" fill="#16a34a" font-family="monospace" font-size="20" font-weight="bold">₹1,500.00 INR</text>
  <text x="40" y="200" fill="#64748b" font-family="sans-serif" font-size="14">Payment Method:</text>
  <text x="200" y="200" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="bold">UPI / Google Pay</text>
  <text x="40" y="240" fill="#64748b" font-family="sans-serif" font-size="14">Remitter Name:</text>
  <text x="200" y="240" fill="#0f172a" font-family="sans-serif" font-size="14">John Doe (john_doe)</text>
  <text x="40" y="280" fill="#64748b" font-family="sans-serif" font-size="14">Status:</text>
  <text x="200" y="280" fill="#ca8a04" font-family="sans-serif" font-size="14" font-weight="bold">Awaiting Admin Verification</text>
  <line x1="40" y1="310" x2="560" y2="310" stroke="#e2e8f0" stroke-width="1"/>
  <text x="40" y="340" fill="#94a3b8" font-family="sans-serif" font-size="12">Verified Bank Counterfoil &bull; ServiceMaster Digital Wallet India</text>
</svg>
`);

// Sample Service Specification Document Data URL
const SAMPLE_SPEC_DOC_DATA_URL = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#0f172a" rx="16"/>
  <rect x="20" y="20" width="560" height="360" fill="#1e293b" stroke="#334155" stroke-width="2" rx="12"/>
  <text x="40" y="60" fill="#38bdf8" font-family="sans-serif" font-size="18" font-weight="bold">PROJECT SCOPE &amp; SPECIFICATIONS BROCHURE</text>
  <text x="40" y="100" fill="#e2e8f0" font-family="sans-serif" font-size="14">Package: Web Development Basic (₹4,999)</text>
  <text x="40" y="140" fill="#94a3b8" font-family="sans-serif" font-size="13">&bull; 5 Responsive Hand-crafted Web Pages</text>
  <text x="40" y="170" fill="#94a3b8" font-family="sans-serif" font-size="13">&bull; Modern Tailwind CSS Styling &amp; Fast Load Speed</text>
  <text x="40" y="200" fill="#94a3b8" font-family="sans-serif" font-size="13">&bull; Contact Form with Email Notification setup</text>
  <text x="40" y="230" fill="#94a3b8" font-family="sans-serif" font-size="13">&bull; Free SSL Certificate &amp; Domain Connection Support</text>
  <text x="40" y="260" fill="#94a3b8" font-family="sans-serif" font-size="13">&bull; 14-day Post-deployment Bug Support &amp; Maintenance</text>
  <line x1="40" y1="290" x2="560" y2="290" stroke="#334155" stroke-width="1"/>
  <text x="40" y="325" fill="#a5b4fc" font-family="sans-serif" font-size="13" font-weight="bold">ServiceMaster Pro Client Deliverable Document</text>
</svg>
`);

export const DEFAULT_COMPANY_PAYMENT_DETAILS: CompanyPaymentDetails = {
  bankName: 'HDFC Bank Ltd',
  accountNumber: '5020-0012-9843-11',
  accountHolderName: 'ServiceMaster Global Solutions India Pvt Ltd',
  ifscCode: 'HDFC0001298',
  branchName: 'Indiranagar Main Branch, Bengaluru',
  upiId: 'pay@servicemaster',
  instructions: 'Please transfer using any UPI app (GPay, PhonePe, Paytm) or IMPS/NEFT, then enter the 12-digit UTR/Ref number and attach your payment screenshot below.',
  updatedAt: new Date().toISOString()
};

export const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Web Development Basic',
    description: 'A simple 5-page informational website with contact form and responsive design.',
    price: 4999,
    category: 'Development',
    attachments: [
      {
        id: 'att_s1_1',
        name: 'Web_Dev_Basic_Scope_Deliverables.svg',
        size: 14200,
        type: 'image/svg+xml',
        dataUrl: SAMPLE_SPEC_DOC_DATA_URL,
        uploadedBy: 'System Administrator',
        uploadedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 's2',
    name: 'E-commerce Solution',
    description: 'Full-featured online store with payment gateway integration and inventory.',
    price: 14999,
    category: 'Development',
    attachments: [
      {
        id: 'att_s2_1',
        name: 'Ecommerce_Architecture_Roadmap.svg',
        size: 15600,
        type: 'image/svg+xml',
        dataUrl: SAMPLE_SPEC_DOC_DATA_URL,
        uploadedBy: 'System Administrator',
        uploadedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 's3',
    name: 'SEO Optimization',
    description: 'Comprehensive audit, keywords ranking, and on-page optimization for search engines.',
    price: 2999,
    category: 'Marketing',
    attachments: []
  },
  {
    id: 's4',
    name: 'Logo & Branding Suite',
    description: 'Professional logo design, color palette, typography and brand identity guidelines.',
    price: 1999,
    category: 'Design',
    attachments: []
  },
  {
    id: 's5',
    name: 'Cloud Hosting & SSL Setup',
    description: 'Setup and secure configuration of cloud servers with automated backup & CDN.',
    price: 3499,
    category: 'Infrastructure',
    attachments: []
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'admin1',
    username: 'admin',
    password: 'password123',
    fullName: 'System Administrator',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    walletBalance: 0,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cust1',
    username: 'john_doe',
    password: 'password123',
    fullName: 'John Doe',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    walletBalance: 2500,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cust2',
    username: 'jane_pending',
    password: 'password123',
    fullName: 'Jane Pending',
    role: UserRole.CUSTOMER,
    status: UserStatus.PENDING,
    walletBalance: 0,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cust3',
    username: 'alex_smith',
    password: 'password123',
    fullName: 'Alex Smith',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    walletBalance: 1200,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_WALLET_REQUESTS: WalletRequest[] = [
  {
    id: 'wreq_101',
    userId: 'cust1',
    userFullName: 'John Doe',
    username: 'john_doe',
    amount: 1500,
    paymentMethod: 'UPI / Google Pay',
    transactionRef: 'UPI-88921478',
    notes: 'Paid via Google Pay to pay@servicemaster. Receipt attached.',
    status: WalletRequestStatus.PENDING,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    attachment: {
      id: 'att_w101',
      name: 'GooglePay_Receipt_UPI88921478.svg',
      size: 18450,
      type: 'image/svg+xml',
      dataUrl: SAMPLE_RECEIPT_DATA_URL,
      uploadedBy: 'John Doe',
      uploadedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  },
  {
    id: 'wreq_102',
    userId: 'cust3',
    userFullName: 'Alex Smith',
    username: 'alex_smith',
    amount: 2000,
    paymentMethod: 'IMPS / NEFT Bank Transfer',
    transactionRef: 'IMPS-55219904',
    notes: 'Transferred via HDFC NetBanking IMPS reference #55219904',
    status: WalletRequestStatus.PENDING,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'wreq_100',
    userId: 'cust1',
    userFullName: 'John Doe',
    username: 'john_doe',
    amount: 2500,
    paymentMethod: 'UPI / PhonePe',
    transactionRef: 'TXN-90218844',
    notes: 'Initial account funding for web project',
    status: WalletRequestStatus.APPROVED,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    adminNotes: 'Funds verified and added to wallet balance.'
  }
];

export const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx_1001',
    userId: 'cust1',
    userFullName: 'John Doe',
    type: 'CREDIT',
    amount: 2500,
    description: 'Wallet Top-up approved by Admin (Ref: TXN-90218844)',
    referenceId: 'wreq_100',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    balanceAfter: 2500
  },
  {
    id: 'tx_1002',
    userId: 'cust3',
    userFullName: 'Alex Smith',
    type: 'CREDIT',
    amount: 1200,
    description: 'Welcome promotion bonus credit',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    balanceAfter: 1200
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_welcome_admin',
    title: '👋 Welcome to ServiceMaster Pro',
    message: 'System is ready. Real-time notifications will alert you when clients place orders or upload deposit slips.',
    type: 'GENERAL' as const,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
    forRole: UserRole.ADMIN,
    linkTab: 'wallet-requests'
  },
  {
    id: 'notif_demo_order',
    title: '🛒 Client Order Received',
    message: 'John Doe placed Order #ord_1001 for "Logo & Branding Suite" (₹1,999).',
    type: 'ORDER_PLACED' as const,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    forRole: UserRole.ADMIN,
    orderId: 'ord_1001',
    linkTab: 'orders'
  },
  {
    id: 'notif_welcome_cust',
    title: '🎉 Welcome to your Client Portal',
    message: 'Browse services, request wallet credits in INR, or place orders with deliverables tracking.',
    type: 'GENERAL' as const,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    read: false,
    forRole: UserRole.CUSTOMER,
    userId: 'cust1',
    linkTab: 'services'
  }
];