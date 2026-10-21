import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { useApp } from '../contexts/AppContext';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  PlusCircle, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Check, 
  X, 
  Search, 
  Code, 
  Copy, 
  CheckCheck, 
  History, 
  ShieldCheck, 
  Coins,
  Building,
  Paperclip,
  Download,
  Eye,
  Upload,
  Settings,
  Save,
  FileCheck,
  Smartphone,
  Trash2,
  ShoppingCart,
  Server,
  Database,
  ExternalLink,
  Globe,
  Terminal,
  HelpCircle,
  RefreshCw,
  FileDown,
  CheckSquare,
  Sparkles
} from 'lucide-react';
import { 
  UserStatus, 
  OrderStatus, 
  Service, 
  WalletRequestStatus, 
  WalletRequest,
  FileAttachment 
} from '../types';
import { 
  AttachmentViewerModal, 
  downloadAttachment, 
  fileToAttachment,
  formatFileSize 
} from '../components/AttachmentViewerModal';
import { api, DBTestResult, getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { InfinityFreeDeployCenter } from '../components/InfinityFreeDeployCenter';

export const AdminDashboard: React.FC = () => {
  const { 
    users, 
    orders, 
    services, 
    walletRequests, 
    walletTransactions,
    companyPaymentDetails,
    updateCompanyPaymentDetails,
    updateUserStatus, 
    updateOrderStatus, 
    addService,
    deleteService,
    clearAllServices,
    resetDefaultServices,
    addServiceAttachment,
    removeServiceAttachment,
    addOrderAttachment,
    removeOrderAttachment,
    removeWalletRequestAttachment,
    approveWalletRequest,
    rejectWalletRequest,
    adjustUserWallet,
    pendingRequestsCount,
    pendingOrdersCount,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('wallet-requests');
  
  // New service state
  const [newService, setNewService] = useState<Partial<Service>>({ name: '', price: 0, description: '', category: '' });
  const [newServiceAttachments, setNewServiceAttachments] = useState<FileAttachment[]>([]);

  // Company Payment Details state (for editing)
  const [paymentForm, setPaymentForm] = useState(companyPaymentDetails);
  const [paymentDetailsSaved, setPaymentDetailsSaved] = useState(false);

  // Wallet approval modal
  const [selectedRequestForApproval, setSelectedRequestForApproval] = useState<WalletRequest | null>(null);
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [adminApprovalNote, setAdminApprovalNote] = useState('');

  // Wallet rejection modal
  const [selectedRequestForRejection, setSelectedRequestForRejection] = useState<WalletRequest | null>(null);
  const [adminRejectionNote, setAdminRejectionNote] = useState('');

  // Manual direct balance adjustment modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<number>(500);
  const [manualType, setManualType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [manualReason, setManualReason] = useState('');

  // Wallet tab filter
  const [walletFilter, setWalletFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [walletSearch, setWalletSearch] = useState('');

  // Attachment Viewer Modal State
  const [viewingAttachment, setViewingAttachment] = useState<FileAttachment | null>(null);
  const [viewerTitle, setViewerTitle] = useState('Attachment Preview');
  const [viewerDeleteCallback, setViewerDeleteCallback] = useState<{ fn?: () => void }>({});

  // Dedicated In-App Delete Confirmation state (no window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<{
    name: string;
    source: string;
    onConfirm: () => void;
  } | null>(null);

  // Order Attachment Upload state
  const [uploadingForOrderId, setUploadingForOrderId] = useState<string | null>(null);
  const [uploadingForServiceId, setUploadingForServiceId] = useState<string | null>(null);

  // Copy code feedback state
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const pendingUsers = users.filter(u => u.status === UserStatus.PENDING);
  const customers = users.filter(u => u.role === 'CUSTOMER');

  // Stats calculation
  const totalWalletInSystem = customers.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
  const totalApprovedDeposits = walletRequests
    .filter(r => r.status === WalletRequestStatus.APPROVED)
    .reduce((sum, r) => sum + r.amount, 0);

  const formatINR = (val: number) => {
    return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const filteredRequests = walletRequests.filter(req => {
    const matchesFilter = walletFilter === 'ALL' ? true : req.status === walletFilter;
    const matchesSearch = 
      req.userFullName.toLowerCase().includes(walletSearch.toLowerCase()) ||
      req.username.toLowerCase().includes(walletSearch.toLowerCase()) ||
      req.transactionRef.toLowerCase().includes(walletSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenApproveModal = (req: WalletRequest) => {
    setSelectedRequestForApproval(req);
    setApprovedAmount(req.amount);
    setAdminApprovalNote(`Payment verified via ${req.paymentMethod} (Ref: ${req.transactionRef}).`);
  };

  const handleConfirmApproval = () => {
    if (!selectedRequestForApproval) return;
    if (approvedAmount <= 0) {
      showToast("Approved amount must be greater than ₹0.", "error");
      return;
    }
    approveWalletRequest(selectedRequestForApproval.id, adminApprovalNote, approvedAmount);
    setSelectedRequestForApproval(null);
  };

  const handleOpenRejectModal = (req: WalletRequest) => {
    setSelectedRequestForRejection(req);
    setAdminRejectionNote('Deposit verification failed. Please check UPI UTR / transaction reference.');
  };

  const handleConfirmRejection = () => {
    if (!selectedRequestForRejection) return;
    rejectWalletRequest(selectedRequestForRejection.id, adminRejectionNote);
    setSelectedRequestForRejection(null);
  };

  const handleManualAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showToast("Please select a client.", "error");
      return;
    }
    if (manualAmount <= 0) {
      showToast("Amount must be greater than ₹0.", "error");
      return;
    }
    adjustUserWallet(selectedUserId, manualAmount, manualType, manualReason || `Direct admin ${manualType.toLowerCase()}`);
    setManualModalOpen(false);
    setSelectedUserId('');
    setManualReason('');
  };

  const handleSaveCompanyPaymentDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyPaymentDetails(paymentForm);
    setPaymentDetailsSaved(true);
    setTimeout(() => setPaymentDetailsSaved(false), 3000);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (newService.name && newService.price && newService.description) {
      addService({
        ...(newService as Omit<Service, 'id'>),
        attachments: newServiceAttachments
      });
      setNewService({ name: '', price: 0, description: '', category: '' });
      setNewServiceAttachments([]);
      showToast('Service package created with attachments!', 'success');
    }
  };

  const handleUploadOrderAttachment = async (orderId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const file = files[0];
      const attachment = await fileToAttachment(file, 'System Administrator (Deliverable)');
      addOrderAttachment(orderId, attachment);
      setUploadingForOrderId(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to read file.', 'error');
    }
  };

  const handleUploadServiceAttachment = async (serviceId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const file = files[0];
      const attachment = await fileToAttachment(file, 'System Administrator');
      addServiceAttachment(serviceId, attachment);
      setUploadingForServiceId(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to read file.', 'error');
    }
  };

  const handleNewServiceFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const file = files[0];
      const att = await fileToAttachment(file, 'System Administrator');
      setNewServiceAttachments(prev => [...prev, att]);
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, fileName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        { 
          id: 'wallet-requests', 
          label: 'Wallet & Top-ups', 
          icon: <Wallet className="w-5 h-5" />,
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined
        },
        { 
          id: 'payment-settings', 
          label: 'Payment Account Details', 
          icon: <Building className="w-5 h-5" /> 
        },
        { 
          id: 'orders', 
          label: 'Manage Orders', 
          icon: <FileText className="w-5 h-5" />,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined
        },
        { id: 'services', label: 'Manage Services', icon: <PlusCircle className="w-5 h-5" /> },
        { 
          id: 'approvals', 
          label: 'User Registrations', 
          icon: <AlertCircle className="w-5 h-5" />,
          badge: pendingUsers.length > 0 ? pendingUsers.length : undefined 
        },
        { id: 'users', label: 'Client Directory', icon: <Users className="w-5 h-5" /> },
        { id: 'infinityfree', label: 'InfinityFree & MySQL', icon: <Server className="w-5 h-5" /> },
      ]}
    >
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Admin Control Center</h1>
          <p className="text-slate-500 text-sm">
            Approve client wallet requests with payment proof attachments, manage company bank details, and share deliverables.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('payment-settings')}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs border border-slate-300 transition-all"
          >
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Edit Bank / UPI Details</span>
          </button>
          <button
            onClick={() => {
              if (customers.length > 0) setSelectedUserId(customers[0].id);
              setManualModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all"
          >
            <Coins className="w-4 h-4" />
            <span>Direct Balance Adjustment</span>
          </button>
        </div>
      </header>

      {/* NEW CLIENT ORDER ALERT BANNER (NOTIFICATION FOR ADMIN) */}
      {pendingOrdersCount > 0 && activeTab !== 'orders' && (
        <div 
          onClick={() => setActiveTab('orders')}
          className="mb-6 p-4 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-indigo-700 transition-all animate-in fade-in"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  New Order Notification
                </span>
                <span className="text-xs font-semibold text-indigo-200">Action Required</span>
              </div>
              <p className="text-sm font-bold mt-0.5">
                {pendingOrdersCount} new client order{pendingOrdersCount > 1 ? 's have' : ' has'} been placed! Click to review and assign deliverables.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="px-4 py-1.5 bg-white text-indigo-700 rounded-xl font-bold text-xs shadow-sm hover:bg-indigo-50 transition-colors self-start sm:self-auto"
          >
            View Orders &rarr;
          </button>
        </div>
      )}

      {/* TAB 1: WALLET & TOP-UP REQUEST APPROVALS */}

      {activeTab === 'wallet-requests' && (
        <div className="space-y-6">
          {/* Active Company Account Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-500/20 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
                <Building className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-bold text-indigo-300 tracking-wider">Active Client Deposit Account</span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-medium border border-emerald-500/30">Live for Clients</span>
                </div>
                <p className="text-sm font-bold text-white mt-0.5">
                  {companyPaymentDetails.bankName} &bull; A/C: {companyPaymentDetails.accountNumber} &bull; IFSC: {companyPaymentDetails.ifscCode} &bull; UPI: <span className="text-indigo-300 font-mono">{companyPaymentDetails.upiId}</span>
                </p>
                <p className="text-xs text-slate-300 mt-0.5">Clients see these payment details when submitting add-money requests.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('payment-settings')}
              className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition-all flex items-center space-x-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Modify Payment Details</span>
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border transition-all ${
              pendingRequestsCount > 0 
                ? 'bg-amber-500/10 border-amber-300 ring-2 ring-amber-400/20' 
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                <span>Pending Approvals</span>
                <Wallet className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-black font-mono text-amber-900">
                {pendingRequestsCount}
              </div>
              <p className="text-xs text-amber-700 mt-1">Clients awaiting wallet balance credit</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <span>Total Approved Top-ups</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black font-mono text-emerald-600">
                {formatINR(totalApprovedDeposits)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total INR credited to wallets</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <span>Total Client Balances</span>
                <Coins className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-3xl font-black font-mono text-slate-900">
                {formatINR(totalWalletInSystem)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Sum of all customer balances (INR)</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <span>Ledger Entries</span>
                <History className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-3xl font-black font-mono text-indigo-600">
                {walletTransactions.length}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total credits & debits logged</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setWalletFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    walletFilter === 'PENDING'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pending ({walletRequests.filter(r => r.status === WalletRequestStatus.PENDING).length})
                </button>
                <button
                  onClick={() => setWalletFilter('APPROVED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    walletFilter === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Approved ({walletRequests.filter(r => r.status === WalletRequestStatus.APPROVED).length})
                </button>
                <button
                  onClick={() => setWalletFilter('REJECTED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    walletFilter === 'REJECTED'
                      ? 'bg-red-100 text-red-900 border border-red-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Rejected ({walletRequests.filter(r => r.status === WalletRequestStatus.REJECTED).length})
                </button>
                <button
                  onClick={() => setWalletFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    walletFilter === 'ALL'
                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Requests ({walletRequests.length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search client, username, UTR ref..."
                  value={walletSearch}
                  onChange={(e) => setWalletSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <Wallet className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="font-semibold text-slate-600">No wallet top-up requests in this view.</p>
                <p className="text-xs text-slate-400 mt-1">
                  {walletFilter === 'PENDING' 
                    ? 'All client deposit requests have been processed!' 
                    : 'Try changing the status filter or search query.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Current Balance</th>
                      <th className="px-6 py-4">Requested Top-up</th>
                      <th className="px-6 py-4">Payment Method & Ref</th>
                      <th className="px-6 py-4">Receipt Attachment</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRequests.map(req => {
                      const clientUser = users.find(u => u.id === req.userId);
                      const currentBal = clientUser?.walletBalance ?? 0;

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Client Info */}
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{req.userFullName}</p>
                            <p className="text-xs text-slate-500 font-mono">@{req.username}</p>
                            {req.notes && (
                              <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded border border-slate-100 max-w-xs">
                                "{req.notes}"
                              </p>
                            )}
                          </td>

                          {/* Current Client Balance */}
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-slate-800">
                              {formatINR(currentBal)}
                            </span>
                          </td>

                          {/* Requested Topup */}
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center space-x-1 font-mono font-extrabold text-base text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                              <span>+{formatINR(req.amount)}</span>
                            </div>
                          </td>

                          {/* Payment Method & Ref */}
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800 block text-xs">{req.paymentMethod}</span>
                            <span className="text-xs font-mono text-slate-600 block mt-0.5">
                              Ref / UTR: <span className="font-bold text-slate-900">{req.transactionRef}</span>
                            </span>
                          </td>

                          {/* Receipt Attachment with View & Download */}
                          <td className="px-6 py-4">
                            {req.attachment ? (
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewerTitle(`Deposit Receipt • ${req.userFullName} (${formatINR(req.amount)})`);
                                    setViewingAttachment(req.attachment || null);
                                    setViewerDeleteCallback({
                                      fn: () => removeWalletRequestAttachment(req.id)
                                    });
                                  }}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadAttachment(req.attachment!)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Download receipt file"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteTarget({
                                      name: req.attachment?.name || 'Deposit Receipt',
                                      source: `Deposit Receipt for ${req.userFullName} (${formatINR(req.amount)})`,
                                      onConfirm: () => {
                                        removeWalletRequestAttachment(req.id);
                                        if (viewingAttachment?.id === req.attachment?.id) {
                                          setViewingAttachment(null);
                                        }
                                      }
                                    });
                                  }}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete client receipt attachment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No attachment</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            {req.status === WalletRequestStatus.PENDING && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Awaiting Approval</span>
                              </span>
                            )}
                            {req.status === WalletRequestStatus.APPROVED && (
                              <div>
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Credited</span>
                                </span>
                                {req.adminNotes && (
                                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{req.adminNotes}</p>
                                )}
                              </div>
                            )}
                            {req.status === WalletRequestStatus.REJECTED && (
                              <div>
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Declined</span>
                                </span>
                                {req.adminNotes && (
                                  <p className="text-[11px] text-red-600 mt-1 max-w-xs">{req.adminNotes}</p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Admin Action Buttons */}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            {req.status === WalletRequestStatus.PENDING ? (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleOpenApproveModal(req)}
                                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                  title="Approve and credit client wallet in INR"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve & Add Balance</span>
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(req)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-xs font-medium border border-slate-200 hover:border-red-200 transition-all"
                                  title="Decline request"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Processed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPANY PAYMENT ACCOUNT DETAILS (ADMIN EDITABLE) */}
      {activeTab === 'payment-settings' && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Company Payment Account Details</h2>
                <p className="text-xs text-slate-500">Configure bank account & UPI details shown to clients when adding wallet money</p>
              </div>
            </div>
            {paymentDetailsSaved && (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved & Live for Clients!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveCompanyPaymentDetails} className="p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  value={paymentForm.bankName}
                  onChange={(e) => setPaymentForm({...paymentForm, bankName: e.target.value})}
                  placeholder="e.g. HDFC Bank Ltd, ICICI Bank, SBI"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={paymentForm.accountNumber}
                  onChange={(e) => setPaymentForm({...paymentForm, accountNumber: e.target.value})}
                  placeholder="e.g. 5020-0012-9843-11"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Beneficiary / Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  value={paymentForm.accountHolderName}
                  onChange={(e) => setPaymentForm({...paymentForm, accountHolderName: e.target.value})}
                  placeholder="e.g. ServiceMaster Solutions Pvt Ltd"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  required
                  value={paymentForm.ifscCode}
                  onChange={(e) => setPaymentForm({...paymentForm, ifscCode: e.target.value.toUpperCase()})}
                  placeholder="e.g. HDFC0001298"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official UPI ID *
                </label>
                <input
                  type="text"
                  required
                  value={paymentForm.upiId}
                  onChange={(e) => setPaymentForm({...paymentForm, upiId: e.target.value})}
                  placeholder="e.g. pay@servicemaster or business@okaxis"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-mono text-indigo-700 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Branch / City Name
                </label>
                <input
                  type="text"
                  value={paymentForm.branchName || ''}
                  onChange={(e) => setPaymentForm({...paymentForm, branchName: e.target.value})}
                  placeholder="e.g. MG Road Branch, Bengaluru"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Special Instructions / Notice for Clients
              </label>
              <textarea
                value={paymentForm.instructions || ''}
                onChange={(e) => setPaymentForm({...paymentForm, instructions: e.target.value})}
                placeholder="e.g. Please transfer via any UPI app and attach the receipt screenshot with UTR reference."
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24"
              />
            </div>

            {/* Live Preview Box */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs">
              <span className="font-bold text-indigo-950 uppercase tracking-wider text-[11px] block mb-2">
                Live Preview (What Clients Will See in Add Money Modal):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 font-mono">
                <div>Bank: <strong className="text-slate-900">{paymentForm.bankName || '—'}</strong></div>
                <div>Account: <strong className="text-slate-900">{paymentForm.accountNumber || '—'}</strong></div>
                <div>IFSC: <strong className="text-slate-900">{paymentForm.ifscCode || '—'}</strong></div>
                <div>A/C Name: <strong className="text-slate-900">{paymentForm.accountHolderName || '—'}</strong></div>
                <div className="col-span-2">UPI: <strong className="text-indigo-700 font-bold">{paymentForm.upiId || '—'}</strong></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Last updated: {new Date(companyPaymentDetails.updatedAt).toLocaleString('en-IN')}
              </span>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Company Payment Details</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: MANAGE ORDERS (WITH ATTACHMENT VIEW & DOWNLOAD) */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">All Service Orders & Project Deliverables</h2>
              <p className="text-xs text-slate-500">Track orders, view client requirements, and upload deliverable attachments</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">{orders.length} Total Orders</span>
          </div>
          {orders.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No orders placed yet in the system.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Amount & Payment</th>
                    <th className="px-6 py-4">Attachments & Deliverables</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Change Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{order.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{order.userFullName}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{order.serviceName}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-900">₹{(order.amount || 0).toLocaleString('en-IN')}</span>
                        <div className="mt-0.5">
                          {order.paymentMethod === 'WALLET' ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Paid with INR Wallet
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              Direct / Invoice
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Order Attachments (View, Download & Upload) */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {order.attachments && order.attachments.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {order.attachments.map(att => (
                                <div key={att.id} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
                                  <Paperclip className="w-3 h-3 text-indigo-600" />
                                  <span className="truncate max-w-[120px]">{att.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewerTitle(`Order Deliverable: ${order.serviceName} (#${order.id})`);
                                      setViewingAttachment(att);
                                      setViewerDeleteCallback({
                                        fn: () => removeOrderAttachment(order.id, att.id)
                                      });
                                    }}
                                    className="p-0.5 text-indigo-600 hover:text-indigo-800"
                                    title="View attachment"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => downloadAttachment(att)}
                                    className="p-0.5 text-slate-600 hover:text-slate-900"
                                    title="Download file"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteTarget({
                                        name: att.name,
                                        source: `Order #${order.id} (${order.serviceName})`,
                                        onConfirm: () => {
                                          removeOrderAttachment(order.id, att.id);
                                          if (viewingAttachment?.id === att.id) {
                                            setViewingAttachment(null);
                                          }
                                        }
                                      });
                                    }}
                                    className="p-0.5 text-red-500 hover:text-red-700"
                                    title="Delete attachment"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 block">No attachments yet</span>
                          )}

                          {/* Upload deliverable button */}
                          <label className="cursor-pointer inline-flex items-center space-x-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold transition-colors">
                            <Upload className="w-3 h-3" />
                            <span>+ Upload Deliverable</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleUploadOrderAttachment(order.id, e.target.files)}
                            />
                          </label>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                          ${order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800' : 
                            order.status === OrderStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                            order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          {Object.values(OrderStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MANAGE SERVICES & SERVICE PACKAGE ATTACHMENTS */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Current Services & Package Attachments</h2>
                <p className="text-xs text-slate-500">Manage service catalog, delete services, and attach/remove package brochures</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-mono px-2 py-1 bg-slate-100 rounded-lg">
                  {services.length} {services.length === 1 ? 'Service' : 'Services'}
                </span>
                {services.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget({
                        name: `All ${services.length} Services`,
                        source: 'Entire Service Catalog',
                        onConfirm: () => {
                          clearAllServices();
                        }
                      });
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                    title="Delete all services from catalog"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetDefaultServices}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors"
                    title="Restore default sample services"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restore Samples</span>
                  </button>
                )}
              </div>
            </div>

            {services.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <PlusCircle className="w-12 h-12 mx-auto mb-2 opacity-30 text-indigo-400" />
                <p className="font-bold text-slate-700 text-sm">No services currently available.</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  All service packages have been deleted. You can create a new service using the form on the right, or restore sample services.
                </p>
                <button
                  type="button"
                  onClick={resetDefaultServices}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore Default Services</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                    <tr>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Package Attachments (Brochures / Docs)</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {services.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <span className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {s.category}
                          </span>
                          <p className="text-xs text-slate-500 mt-1 max-w-xs">{s.description}</p>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                          ₹{s.price.toLocaleString('en-IN')}
                        </td>
                        
                        {/* Service Attachments */}
                        <td className="px-6 py-4">
                          <div className="space-y-1.5">
                            {s.attachments && s.attachments.length > 0 ? (
                              <div className="flex flex-col gap-1.5">
                                {s.attachments.map(att => (
                                  <div key={att.id} className="inline-flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                                    <div className="flex items-center space-x-1.5 truncate pr-2">
                                      <Paperclip className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                                      <span className="truncate max-w-[140px] text-slate-800 font-medium">{att.name}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">({formatFileSize(att.size)})</span>
                                    </div>
                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setViewerTitle(`Package Document • ${s.name}`);
                                          setViewingAttachment(att);
                                          setViewerDeleteCallback({
                                            fn: () => removeServiceAttachment(s.id, att.id)
                                          });
                                        }}
                                        className="p-1 text-indigo-600 hover:text-indigo-800"
                                        title="View attachment"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => downloadAttachment(att)}
                                        className="p-1 text-slate-600 hover:text-slate-900"
                                        title="Download attachment"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeleteTarget({
                                            name: att.name,
                                            source: `Service Package "${s.name}"`,
                                            onConfirm: () => {
                                              removeServiceAttachment(s.id, att.id);
                                              if (viewingAttachment?.id === att.id) {
                                                setViewingAttachment(null);
                                              }
                                            }
                                          });
                                        }}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                        title="Delete attachment from package"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No package attachments</span>
                            )}

                            {/* Add attachment to this service */}
                            <label className="cursor-pointer inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              <span>+ Add Brochure/Doc</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleUploadServiceAttachment(s.id, e.target.files)}
                              />
                            </label>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget({
                                  name: s.name,
                                  source: `Service Package (ID: ${s.id}, ₹${s.price.toLocaleString('en-IN')})`,
                                  onConfirm: () => {
                                    deleteService(s.id);
                                  }
                                });
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                              title="Delete this service package"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              <span>Delete Service</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add New Service Form with Attachments */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Add New Service Package</h2>
            <p className="text-xs text-slate-500 mb-4">Create a service and upload brochures/scope documents</p>
            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Service Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Mobile App MVP"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newService.name}
                  onChange={e => setNewService({...newService, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Development, Design, Marketing"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newService.category}
                  onChange={e => setNewService({...newService, category: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Price (₹ INR)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="2499"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newService.price || ''}
                  onChange={e => setNewService({...newService, price: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea 
                  required
                  placeholder="Provide scope and deliverables..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-20"
                  value={newService.description}
                  onChange={e => setNewService({...newService, description: e.target.value})}
                />
              </div>

              {/* Package Attachment Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Package Attachments (Brochure / Scope Document)
                </label>
                <label className="flex items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl cursor-pointer bg-slate-50 hover:bg-indigo-50/30 transition-all text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Upload Brochure / Spec file</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleNewServiceFileSelect(e.target.files)}
                  />
                </label>

                {newServiceAttachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {newServiceAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg text-xs">
                        <span className="truncate max-w-[180px] font-medium text-indigo-900">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setNewServiceAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 text-sm font-bold shadow-md transition-all"
              >
                Create Service Package
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: PENDING USER REGISTRATIONS */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">User Registration Approvals</h2>
              <p className="text-xs text-slate-500">Approve new customer sign-ups so they can log in</p>
            </div>
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-bold">
              {pendingUsers.length} Pending
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
              <p className="font-semibold text-slate-700">No pending user registrations.</p>
              <p className="text-xs text-slate-400 mt-1">All newly registered accounts have been reviewed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Full Name</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Registration Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">{user.fullName}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">@{user.username}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => updateUserStatus(user.id, UserStatus.ACTIVE)}
                          className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> <span>Approve Account</span>
                        </button>
                        <button 
                          onClick={() => updateUserStatus(user.id, UserStatus.REJECTED)}
                          className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 font-medium text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CLIENT DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">User Directory & Wallet Balances (INR)</h2>
              <p className="text-xs text-slate-500">Inspect client account balances and manually adjust funds in INR</p>
            </div>
            <button
              onClick={() => {
                if (customers.length > 0) setSelectedUserId(customers[0].id);
                setManualModalOpen(true);
              }}
              className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              + Quick Adjust Client Wallet
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Name & Username</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Wallet Balance</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{user.fullName}</p>
                      <p className="text-xs text-slate-500 font-mono">@{user.username}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${user.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-800' : 
                          user.status === UserStatus.REJECTED ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-base">
                      {user.role === 'CUSTOMER' ? (
                        <span className="text-indigo-600">{formatINR(user.walletBalance ?? 0)}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">N/A (Admin)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role === 'CUSTOMER' && (
                        <button
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setManualModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold text-xs rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors"
                        >
                          Manage Balance
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: INFINITYFREE & MYSQL DEPLOYMENT CENTER */}
      {(activeTab === 'infinityfree' || activeTab === 'php-code') && (
        <InfinityFreeDeployCenter onNotify={showToast} />
      )}

      {/* MODAL 1: APPROVE TOP-UP REQUEST (WITH RECEIPT PREVIEW & DOWNLOAD) */}
      {selectedRequestForApproval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in zoom-in duration-150 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Approve Top-Up & Add Balance</h3>
                  <p className="text-xs text-slate-500">Verify payment proof and credit client's INR wallet</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRequestForApproval(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="my-5 space-y-4">
              {/* Client Info Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-bold text-slate-900">{selectedRequestForApproval.userFullName} (@{selectedRequestForApproval.username})</span>
                </div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-semibold text-slate-800">{selectedRequestForApproval.paymentMethod}</span>
                </div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-500">Transaction Reference / UTR:</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{selectedRequestForApproval.transactionRef}</span>
                </div>
                {selectedRequestForApproval.notes && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-slate-600">
                    <span className="font-semibold text-slate-700">Client Note: </span>
                    <span>{selectedRequestForApproval.notes}</span>
                  </div>
                )}
              </div>

              {/* Attached Payment Receipt Section */}
              {selectedRequestForApproval.attachment && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block mb-2 flex items-center space-x-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Attached Deposit Receipt / Screenshot:</span>
                  </span>
                  
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-indigo-100">
                    <span className="text-xs font-medium text-slate-800 truncate max-w-[200px]">
                      {selectedRequestForApproval.attachment.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setViewerTitle(`Deposit Receipt • ${selectedRequestForApproval.userFullName}`);
                          setViewingAttachment(selectedRequestForApproval.attachment || null);
                          setViewerDeleteCallback({
                            fn: () => {
                              removeWalletRequestAttachment(selectedRequestForApproval.id);
                              setSelectedRequestForApproval(prev => prev ? { ...prev, attachment: undefined } : null);
                            }
                          });
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadAttachment(selectedRequestForApproval.attachment!)}
                        className="p-1 text-slate-600 hover:text-indigo-600"
                        title="Download attachment"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget({
                            name: selectedRequestForApproval.attachment?.name || 'Deposit Receipt',
                            source: `Deposit Receipt for ${selectedRequestForApproval.userFullName}`,
                            onConfirm: () => {
                              removeWalletRequestAttachment(selectedRequestForApproval.id);
                              setSelectedRequestForApproval(prev => prev ? { ...prev, attachment: undefined } : null);
                              if (viewingAttachment?.id === selectedRequestForApproval.attachment?.id) {
                                setViewingAttachment(null);
                              }
                            }
                          });
                        }}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Delete receipt attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount to Credit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount to Credit to Client's Wallet (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-xl text-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Requested: <span className="font-bold">{formatINR(selectedRequestForApproval.amount)}</span>. You can adjust if needed.
                </p>
              </div>

              {/* Admin Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Verification Remark (Optional)
                </label>
                <input
                  type="text"
                  value={adminApprovalNote}
                  onChange={(e) => setAdminApprovalNote(e.target.value)}
                  placeholder="e.g. Deposit verified in bank/UPI statement"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRequestForApproval(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Credit {formatINR(approvedAmount)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT TOP-UP REQUEST */}
      {selectedRequestForRejection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-red-600 font-bold">
                <XCircle className="w-5 h-5" />
                <span>Decline Top-Up Request</span>
              </div>
              <button 
                onClick={() => setSelectedRequestForRejection(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <p className="text-slate-600">
                You are rejecting the request from <strong>{selectedRequestForRejection.userFullName}</strong> for <strong>{formatINR(selectedRequestForRejection.amount)}</strong>.
              </p>
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  value={adminRejectionNote}
                  onChange={(e) => setAdminRejectionNote(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 h-20 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="e.g. UPI UTR number could not be verified in bank records."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRequestForRejection(null)}
                className="px-3 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DIRECT MANUAL CLIENT WALLET ADJUSTMENT */}
      {manualModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Direct Wallet Balance Adjustment (INR)</h3>
                  <p className="text-xs text-slate-500">Credit or debit any customer wallet directly in INR</p>
                </div>
              </div>
              <button 
                onClick={() => setManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAdjustmentSubmit} className="my-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Customer *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose a Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} (@{c.username}) — Current: {formatINR(c.walletBalance || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Action Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setManualType('CREDIT')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                      manualType === 'CREDIT'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    <span>Add Balance (Credit +)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualType('DEBIT')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                      manualType === 'DEBIT'
                        ? 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-400/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-red-600" />
                    <span>Deduct Balance (Debit -)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={manualAmount}
                    onChange={(e) => setManualAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason / Audit Memo
                </label>
                <input
                  type="text"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g. UPI payment received, Promotional bonus, or Account adjustment"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  Apply Balance Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REUSABLE ATTACHMENT VIEWER & DOWNLOAD MODAL */}
      <AttachmentViewerModal
        attachment={viewingAttachment}
        onClose={() => {
          setViewingAttachment(null);
          setViewerDeleteCallback({});
        }}
        title={viewerTitle}
        onDelete={viewerDeleteCallback.fn}
      />

      {/* DEDICATED IN-APP ATTACHMENT DELETION CONFIRMATION MODAL (NO WINDOW.CONFIRM) */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">Delete Attachment</h3>
                <p className="text-xs text-slate-500 truncate">{deleteTarget.source}</p>
              </div>
            </div>
            
            <div className="mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <p className="text-slate-700">
                Permanently delete file: <strong className="text-slate-900 block truncate font-mono mt-0.5">{deleteTarget.name}</strong>
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                This will remove the uploaded file from the server and client portal. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTarget.onConfirm();
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Attachment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

// PHP Code constants
const SQL_SCHEMA_CODE = `-- MySQL Schema for ServiceMaster Pro with Attachments & Payment Settings
CREATE TABLE IF NOT EXISTS company_payment_settings (
  id INT PRIMARY KEY DEFAULT 1,
  bank_name VARCHAR(150) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_holder_name VARCHAR(150) NOT NULL,
  ifsc_code VARCHAR(30) NOT NULL,
  upi_id VARCHAR(100) NOT NULL,
  instructions TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- File attachments table for orders and wallet topups
CREATE TABLE IF NOT EXISTS file_attachments (
  id VARCHAR(50) PRIMARY KEY,
  parent_type ENUM('WALLET_REQUEST', 'ORDER', 'SERVICE') NOT NULL,
  parent_id VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const PHP_COMPANY_PAYMENT_CODE = `<?php
// company_payment.php - Admin updates Company Payment Details
session_start();
require_once 'db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'ADMIN') {
    die(json_encode(['error' => 'Unauthorized admin access']));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $bankName = trim($_POST['bank_name'] ?? '');
    $accNumber = trim($_POST['account_number'] ?? '');
    $holderName = trim($_POST['account_holder_name'] ?? '');
    $ifsc = trim($_POST['ifsc_code'] ?? '');
    $upi = trim($_POST['upi_id'] ?? '');
    $instructions = trim($_POST['instructions'] ?? '');

    $stmt = $pdo->prepare("REPLACE INTO company_payment_settings 
      (id, bank_name, account_number, account_holder_name, ifsc_code, upi_id, instructions) 
      VALUES (1, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$bankName, $accNumber, $holderName, $ifsc, $upi, $instructions]);

    echo json_encode(['success' => true, 'message' => 'Payment account details saved!']);
}
?>`;