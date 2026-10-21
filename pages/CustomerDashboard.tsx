import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { useApp } from '../contexts/AppContext';
import { getServiceRecommendation } from '../services/geminiService';
import { 
  ShoppingCart, 
  Clock, 
  Sparkles, 
  Send, 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Building,
  CreditCard,
  QrCode,
  Receipt,
  Smartphone,
  Paperclip,
  Download,
  Eye,
  Upload,
  X,
  FileCheck,
  Trash2
} from 'lucide-react';
import { Order, OrderStatus, ChatMessage, WalletRequestStatus, FileAttachment } from '../types';
import { 
  AttachmentViewerModal, 
  downloadAttachment, 
  fileToAttachment, 
  formatFileSize 
} from '../components/AttachmentViewerModal';

export const CustomerDashboard: React.FC = () => {
  const { 
    services, 
    orders, 
    currentUser, 
    placeOrder, 
    walletRequests, 
    walletTransactions,
    requestWalletTopup,
    companyPaymentDetails,
    addOrderAttachment,
    removeOrderAttachment,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('services');
  const [orderingServiceId, setOrderingServiceId] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [payUsingWallet, setPayUsingWallet] = useState(true);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderAttachments, setOrderAttachments] = useState<FileAttachment[]>([]);
  const [placedOrderNotification, setPlacedOrderNotification] = useState<Order | null>(null);

  // Topup modal state
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(1000);
  const [customAmountStr, setCustomAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI (Google Pay / PhonePe / Paytm)');
  const [transactionRef, setTransactionRef] = useState('');
  const [topupNotes, setTopupNotes] = useState('');
  const [topupAttachment, setTopupAttachment] = useState<FileAttachment | null>(null);
  const [topupSuccessMsg, setTopupSuccessMsg] = useState('');
  const [topupSubmitting, setTopupSubmitting] = useState(false);

  // Attachment Viewer State
  const [viewingAttachment, setViewingAttachment] = useState<FileAttachment | null>(null);
  const [viewerTitle, setViewerTitle] = useState('Attachment Preview');
  const [viewerDeleteCallback, setViewerDeleteCallback] = useState<{ fn?: () => void }>({});

  // In-app delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    name: string;
    source: string;
    onConfirm: () => void;
  } | null>(null);

  // AI Assistant state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Namaste! I can help you choose the best services or explain how your INR wallet and order system works. What can I do for you today?' }
  ]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Filters for customer data
  const myOrders = orders.filter(o => o.userId === currentUser?.id);
  const myRequests = walletRequests.filter(r => r.userId === currentUser?.id);
  const myTransactions = walletTransactions.filter(t => t.userId === currentUser?.id);

  const walletBalance = currentUser?.walletBalance || 0;
  const totalCredited = myTransactions
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalDebited = myTransactions
    .filter(t => t.type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingRequests = myRequests.filter(r => r.status === WalletRequestStatus.PENDING);

  const formatINR = (val: number) => {
    return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setLoadingAi(true);

    const response = await getServiceRecommendation(userMsg, services);
    setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoadingAi(false);
  };

  const selectedService = services.find(s => s.id === orderingServiceId);
  const hasEnoughWalletBalance = selectedService ? walletBalance >= selectedService.price : false;

  const handlePlaceOrder = async () => {
    if (!orderingServiceId || !selectedService) return;
    setOrderSubmitting(true);

    const result = await placeOrder(
      orderingServiceId, 
      orderNotes, 
      payUsingWallet,
      orderAttachments
    );
    setOrderSubmitting(false);

    if (result.success) {
      setOrderingServiceId(null);
      setOrderNotes('');
      setOrderAttachments([]);
      if (result.order) {
        setPlacedOrderNotification(result.order);
      } else {
        setActiveTab('orders');
      }
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleTopupFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const file = files[0];
      const att = await fileToAttachment(file, currentUser?.fullName || 'Customer');
      setTopupAttachment(att);
      showToast(`Attached "${file.name}" as payment proof!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to read attachment file.', 'error');
    }
  };

  const handleOrderFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const file = files[0];
      const att = await fileToAttachment(file, currentUser?.fullName || 'Customer');
      setOrderAttachments(prev => [...prev, att]);
      showToast(`Attached file "${file.name}" to order draft!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to read file.', 'error');
    }
  };

  const handleAddFileToExistingOrder = async (orderId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const file = files[0];
      const att = await fileToAttachment(file, currentUser?.fullName || 'Customer');
      addOrderAttachment(orderId, att);
    } catch (err) {
      console.error(err);
      showToast('Failed to read file.', 'error');
    }
  };

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customAmountStr ? parseFloat(customAmountStr) : topupAmount;
    if (isNaN(finalAmount) || finalAmount <= 0) {
      showToast('Please enter a valid positive amount.', 'error');
      return;
    }
    if (!transactionRef.trim()) {
      showToast('Please provide the UPI Transaction ID, UTR number, or deposit reference.', 'error');
      return;
    }

    setTopupSubmitting(true);
    const success = await requestWalletTopup(
      finalAmount, 
      paymentMethod, 
      transactionRef, 
      topupNotes,
      topupAttachment || undefined
    );
    setTopupSubmitting(false);

    if (success) {
      setTopupSuccessMsg(`Top-up request for ${formatINR(finalAmount)} submitted with proof! An admin will verify and credit your wallet.`);
      setTransactionRef('');
      setTopupNotes('');
      setCustomAmountStr('');
      setTopupAttachment(null);
      setTimeout(() => {
        setTopupSuccessMsg('');
        setTopupModalOpen(false);
      }, 2500);
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRequestTopup={() => setTopupModalOpen(true)}
      tabs={[
        { id: 'services', label: 'Services Catalog', icon: <ShoppingCart className="w-5 h-5" /> },
        { 
          id: 'wallet', 
          label: 'Wallet & Top-up', 
          icon: <Wallet className="w-5 h-5" />, 
          badge: pendingRequests.length > 0 ? pendingRequests.length : undefined 
        },
        { id: 'orders', label: 'My Orders', icon: <Clock className="w-5 h-5" /> },
        { id: 'ai-help', label: 'AI Advisor', icon: <Sparkles className="w-5 h-5" /> },
      ]}
    >
      {/* Top Banner with Quick Actions */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-2">
            <span>Customer Portal (INR)</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser?.fullName}!
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Order online professional services, view package brochures & deliverables, and fund your INR wallet with payment proof receipts.
          </p>
        </div>

        {/* Live Wallet Chip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
          <div className="pr-4 sm:border-r border-white/10">
            <span className="text-xs uppercase text-indigo-200 font-semibold tracking-wider block">Wallet Balance</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {formatINR(walletBalance)}
            </div>
          </div>
          <button
            onClick={() => setTopupModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/40 text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Money</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SERVICES CATALOG WITH BROCHURES & ATTACHMENTS */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Available Services & Packages</h2>
              <p className="text-sm text-slate-500">Inspect deliverables, download package brochures, and order with 1-click INR wallet checkout.</p>
            </div>
            <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Your Wallet Balance: <span className="font-bold text-indigo-600 font-mono">{formatINR(walletBalance)}</span>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">No Services Available Currently</h3>
              <p className="text-xs text-slate-500 mt-1">Please check back soon or contact the administrator.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => {
                const affordable = walletBalance >= service.price;
                const hasAttachments = service.attachments && service.attachments.length > 0;

                return (
                  <div 
                  key={service.id} 
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                        {service.category}
                      </span>
                      <span className="text-xs font-medium text-slate-400">Fixed Rate</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2">{service.name}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{service.description}</p>

                    {/* Service Package Brochure / Document Attachment */}
                    {hasAttachments && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1.5 flex items-center space-x-1">
                          <Paperclip className="w-3 h-3 text-indigo-600" />
                          <span>Package Brochure / Deliverables:</span>
                        </span>
                        <div className="space-y-1">
                          {service.attachments!.map(att => (
                            <div key={att.id} className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200">
                              <span className="truncate max-w-[150px] font-medium text-slate-800">{att.name}</span>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewerTitle(`Package Brochure: ${service.name}`);
                                    setViewingAttachment(att);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 p-1"
                                  title="View brochure"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadAttachment(att)}
                                  className="text-slate-600 hover:text-slate-900 p-1"
                                  title="Download brochure"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="pt-4 border-t border-slate-100 flex items-baseline justify-between mb-4">
                      <span className="text-xs text-slate-500 font-medium">Pricing</span>
                      <span className="text-2xl font-black text-indigo-600 font-mono">
                        ₹{service.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button 
                      onClick={() => {
                        setOrderingServiceId(service.id);
                        setPayUsingWallet(walletBalance >= service.price);
                      }}
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Order Service</span>
                    </button>
                    {affordable ? (
                      <p className="text-[11px] text-emerald-600 text-center mt-2 flex items-center justify-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Payable instantly via wallet</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-600 text-center mt-2 flex items-center justify-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Add {formatINR(service.price - walletBalance)} to pay via wallet</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* TAB 2: WALLET HUB & ADD MONEY REQUESTS WITH ATTACHMENTS */}
      {activeTab === 'wallet' && (
        <div className="space-y-8">
          {/* Top Wallet Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-indigo-500/20">
              <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold mb-2">
                <span>Available Balance</span>
                <Wallet className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-black font-mono tracking-tight text-white mb-2">
                {formatINR(walletBalance)}
              </div>
              <button
                onClick={() => setTopupModalOpen(true)}
                className="w-full text-center py-1.5 px-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                + Request Add Money
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>Total Added (Approved)</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600">
                +{formatINR(totalCredited)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Verified credits into your account</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>Total Spent</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-800">
                -{formatINR(totalDebited)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Paid towards service orders</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>Pending Top-up Requests</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-600">
                {pendingRequests.length}
              </div>
              <p className="text-xs text-slate-400 mt-1">Awaiting admin verification</p>
            </div>
          </div>

          {/* Quick Add Money Action Card */}
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-600/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Need to add funds to your wallet?</h3>
                <p className="text-sm text-slate-600">
                  Transfer to our company account via UPI, IMPS, or NetBanking, upload your payment receipt screenshot, and your admin will credit your balance!
                </p>
              </div>
            </div>
            <button
              onClick={() => setTopupModalOpen(true)}
              className="flex-shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Place Top-up Request</span>
            </button>
          </div>

          {/* Section: Top-up Requests List (with View & Download Receipt) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Your Add Money / Top-Up Requests</h3>
                <p className="text-xs text-slate-500">Track status and inspect your uploaded deposit receipts</p>
              </div>
              <span className="text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {myRequests.length} Total Requests
              </span>
            </div>

            {myRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-slate-600">No wallet top-up requests yet.</p>
                <p className="text-xs text-slate-400 mt-1">Submit your first request above to get your wallet funded in INR.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Request ID</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Method & Reference</th>
                      <th className="px-6 py-3.5">Receipt Attachment</th>
                      <th className="px-6 py-3.5">Submitted Date</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Admin Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {myRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{req.id}</td>
                        <td className="px-6 py-4 font-bold font-mono text-indigo-600 text-base">
                          {formatINR(req.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{req.paymentMethod}</p>
                          <p className="text-xs text-slate-500 font-mono">Ref / UTR: {req.transactionRef}</p>
                          {req.notes && <p className="text-xs text-slate-400 italic mt-0.5 max-w-xs">{req.notes}</p>}
                        </td>

                        {/* Receipt Attachment with View & Download */}
                        <td className="px-6 py-4">
                          {req.attachment ? (
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setViewerTitle(`Deposit Receipt (${formatINR(req.amount)})`);
                                  setViewingAttachment(req.attachment || null);
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadAttachment(req.attachment!)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Download receipt"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">None</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          {req.status === WalletRequestStatus.APPROVED && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approved & Credited</span>
                            </span>
                          )}
                          {req.status === WalletRequestStatus.PENDING && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pending Review</span>
                            </span>
                          )}
                          {req.status === WalletRequestStatus.REJECTED && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {req.adminNotes || (
                            <span className="text-slate-400 italic">
                              {req.status === WalletRequestStatus.PENDING ? 'Waiting for admin confirmation' : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: Wallet Ledger / Transaction Statement */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Transaction Statement</h3>
                <p className="text-xs text-slate-500">Official log of INR credits and debits from your wallet</p>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {myTransactions.length} records
              </span>
            </div>

            {myTransactions.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <p>No transactions recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Date & Time</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5">Description</th>
                      <th className="px-6 py-3.5 text-right">Amount</th>
                      <th className="px-6 py-3.5 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {myTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          {tx.type === 'CREDIT' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-xs font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                              <span>CREDIT</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                              <ArrowUpRight className="w-3 h-3 text-slate-600" />
                              <span>DEBIT</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                          {tx.description}
                        </td>
                        <td className={`px-6 py-4 text-right font-mono font-bold text-sm ${
                          tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                        }`}>
                          {tx.type === 'CREDIT' ? `+${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-600 text-xs">
                          {formatINR(tx.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MY ORDERS WITH ATTACHMENTS (VIEW & DOWNLOAD) */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Service Orders & Project Files</h2>
              <p className="text-xs text-slate-500">Track project milestones and download deliverables uploaded by your admin</p>
            </div>
            <button
              onClick={() => setActiveTab('services')}
              className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              + Order New Service
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700">No service orders placed yet.</p>
              <p className="text-xs text-slate-400 mt-1">Browse our catalog and pay instantly with your INR wallet balance.</p>
              <button
                onClick={() => setActiveTab('services')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Browse Services
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Payment Method</th>
                    <th className="px-6 py-4">Deliverables & Attachments</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{order.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{order.serviceName}</td>
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                        ₹{(order.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        {order.paymentMethod === 'WALLET' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Wallet className="w-3 h-3 text-emerald-600" />
                            <span>Paid with Wallet</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            <span>Direct / Invoice</span>
                          </span>
                        )}
                      </td>

                      {/* Attachments & Deliverables */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {order.attachments && order.attachments.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {order.attachments.map(att => (
                                <div key={att.id} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-800 border border-slate-200">
                                  <Paperclip className="w-3 h-3 text-indigo-600" />
                                  <span className="truncate max-w-[120px]">{att.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewerTitle(`Deliverable • ${order.serviceName}`);
                                      setViewingAttachment(att);
                                      setViewerDeleteCallback({
                                        fn: () => removeOrderAttachment(order.id, att.id)
                                      });
                                    }}
                                    className="p-0.5 text-indigo-600 hover:text-indigo-800"
                                    title="View file"
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
                            <span className="text-xs text-slate-400 block">No files attached</span>
                          )}

                          {/* Client upload extra requirement file */}
                          <label className="cursor-pointer inline-flex items-center space-x-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold transition-colors">
                            <Upload className="w-3 h-3" />
                            <span>+ Attach File</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleAddFileToExistingOrder(order.id, e.target.files)}
                            />
                          </label>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800' : 
                            order.status === OrderStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                            order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AI ASSISTANT */}
      {activeTab === 'ai-help' && (
        <div className="max-w-3xl mx-auto h-[600px] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-indigo-200" />
              <div>
                <span className="font-semibold block leading-tight">AI Service & Wallet Advisor (INR)</span>
                <span className="text-[11px] text-indigo-200">Ask about service scopes, brochures, and how to top up</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {loadingAi && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex space-x-1.5 items-center">
                    <span className="text-xs text-slate-400 mr-2">Thinking</span>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about recommendations or INR wallet top-ups..."
                className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button 
                onClick={handleSendMessage}
                disabled={loadingAi || !chatInput.trim()}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM ORDER MODAL WITH OPTIONAL REQUIREMENT ATTACHMENT */}
      {orderingServiceId && selectedService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in zoom-in duration-150 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs uppercase font-semibold text-indigo-600 tracking-wider">Confirm Your Order</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{selectedService.name}</h3>
              </div>
              <button 
                onClick={() => setOrderingServiceId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="my-5 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Service Fee</span>
                  <span className="text-xs text-slate-400">{selectedService.category}</span>
                </div>
                <div className="text-2xl font-black text-indigo-600 font-mono">
                  {formatINR(selectedService.price)}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Payment Method
                </label>
                <div className="space-y-2">
                  {/* Option 1: Pay with Wallet */}
                  <div 
                    onClick={() => setPayUsingWallet(true)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      payUsingWallet 
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <Wallet className={`w-5 h-5 ${payUsingWallet ? 'text-indigo-600' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Pay with Wallet Balance</p>
                          <p className="text-xs text-slate-500">
                            Available: <span className="font-mono font-bold text-slate-800">{formatINR(walletBalance)}</span>
                          </p>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="payment_choice" 
                        checked={payUsingWallet} 
                        onChange={() => setPayUsingWallet(true)} 
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>

                    {payUsingWallet && !hasEnoughWalletBalance && (
                      <div className="mt-3 pt-3 border-t border-indigo-100 flex items-center justify-between text-xs">
                        <span className="text-amber-700 font-medium">
                          Need {formatINR(selectedService.price - walletBalance)} more in wallet.
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTopupModalOpen(true);
                          }}
                          className="font-bold text-indigo-700 underline hover:text-indigo-800"
                        >
                          Request Add Money Now
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Option 2: Place order with offline bill / invoice */}
                  <div 
                    onClick={() => setPayUsingWallet(false)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      !payUsingWallet 
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <Receipt className={`w-5 h-5 ${!payUsingWallet ? 'text-indigo-600' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Pay via Offline Invoice / Later</p>
                          <p className="text-xs text-slate-500">Order placed with status Pending Payment</p>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="payment_choice" 
                        checked={!payUsingWallet} 
                        onChange={() => setPayUsingWallet(false)} 
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Requirements & Instructions (Optional)
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-20"
                  placeholder="Specify deadlines, business details, or specific requirements..."
                />
              </div>

              {/* Attach Project Requirement Document */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Attach Project Files / Requirements Brief (Optional)
                </label>
                <label className="flex items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl cursor-pointer bg-slate-50 hover:bg-indigo-50/30 transition-all text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Upload Requirements Document / Image / PDF</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleOrderFileSelect(e.target.files)}
                  />
                </label>

                {orderAttachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {orderAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg text-xs">
                        <span className="truncate max-w-[200px] font-medium text-indigo-900">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setOrderAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setOrderingServiceId(null)}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-sm font-semibold"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={orderSubmitting || (payUsingWallet && !hasEnoughWalletBalance)}
                onClick={handlePlaceOrder}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center space-x-2"
              >
                <span>{orderSubmitting ? 'Processing...' : (payUsingWallet ? 'Pay & Place Order' : 'Submit Order')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST ADD MONEY / TOP-UP MODAL (PULLS DYNAMIC ADMIN COMPANY DETAILS + FILE ATTACHMENT) */}
      {topupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Money to Wallet (INR)</h3>
                  <p className="text-xs text-slate-500">Transfer funds and attach proof for admin verification</p>
                </div>
              </div>
              <button 
                onClick={() => setTopupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {topupSuccessMsg ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-sm">{topupSuccessMsg}</p>
                <p className="text-xs text-emerald-600 mt-1">Returning to dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleTopupSubmit} className="my-4 space-y-4">
                {/* Current Balance Banner */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Current Balance:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{formatINR(walletBalance)} INR</span>
                </div>

                {/* Preset INR Amount Buttons */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Top-Up Amount (INR)
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[500, 1000, 2500, 5000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setTopupAmount(amt);
                          setCustomAmountStr('');
                        }}
                        className={`py-2 rounded-xl text-sm font-bold font-mono transition-all border ${
                          topupAmount === amt && !customAmountStr
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="10"
                      placeholder="Or enter custom amount in INR (e.g. 7500)"
                      value={customAmountStr}
                      onChange={(e) => {
                        setCustomAmountStr(e.target.value);
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Deposit / Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="UPI (Google Pay / PhonePe / Paytm)">UPI (Google Pay / PhonePe / Paytm / BHIM)</option>
                    <option value="IMPS / NEFT Bank Transfer">IMPS / NEFT Bank Transfer</option>
                    <option value="NetBanking / RTGS">NetBanking / RTGS</option>
                    <option value="Debit / Credit Card Receipt">Debit / Credit Card Receipt</option>
                    <option value="Cash / Branch Counter Deposit">Cash / Branch Counter Deposit</option>
                  </select>
                </div>

                {/* Dynamic Company Account Details (Managed by Admin!) */}
                <div className="p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-200 text-xs text-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-indigo-900 flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Company Official Payment Details:</span>
                    </p>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">Verified</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mt-2 font-mono text-[11px] text-slate-700">
                    <div>Bank: <strong className="text-slate-900">{companyPaymentDetails.bankName}</strong></div>
                    <div>A/C No: <strong className="text-slate-900">{companyPaymentDetails.accountNumber}</strong></div>
                    <div>IFSC: <strong className="text-slate-900">{companyPaymentDetails.ifscCode}</strong></div>
                    <div>Beneficiary: <strong className="text-slate-900">{companyPaymentDetails.accountHolderName}</strong></div>
                    <div className="col-span-2 text-xs pt-1 border-t border-indigo-100">
                      Official UPI ID: <strong className="text-indigo-700 text-sm">{companyPaymentDetails.upiId}</strong>
                    </div>
                  </div>

                  {companyPaymentDetails.instructions && (
                    <p className="text-[11px] text-indigo-800/80 mt-2 italic bg-white/70 p-1.5 rounded border border-indigo-100">
                      Note: {companyPaymentDetails.instructions}
                    </p>
                  )}
                </div>

                {/* Transaction Ref / UTR */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    UPI UTR / Transaction Reference ID / Receipt No *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UPI-123456789012 or IMPS Ref #99014"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Admin will verify this reference before adding funds.</p>
                </div>

                {/* ATTACHMENT UPLOAD: Payment Screenshot / Receipt */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Attach Payment Proof / Screenshot (Receipt / UTR Slip)
                  </label>
                  
                  {topupAttachment ? (
                    <div className="flex items-center justify-between p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs">
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <Paperclip className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span className="font-semibold text-indigo-950 truncate">{topupAttachment.name}</span>
                        <span className="text-[10px] text-slate-500">({formatFileSize(topupAttachment.size)})</span>
                      </div>
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setViewerTitle('Uploaded Receipt Preview');
                            setViewingAttachment(topupAttachment);
                          }}
                          className="p-1 text-indigo-600 hover:text-indigo-800"
                          title="Preview attachment"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTopupAttachment(null)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Remove attachment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl cursor-pointer bg-slate-50 hover:bg-indigo-50/30 transition-all text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Upload className="w-4 h-4 text-indigo-600" />
                        <span>Upload Screenshot, Receipt, or PDF</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleTopupFileSelect(e.target.files)}
                      />
                    </label>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">Upload a payment screenshot to get your wallet approved faster.</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Additional Notes / Remitter Info (Optional)
                  </label>
                  <textarea
                    value={topupNotes}
                    onChange={(e) => setTopupNotes(e.target.value)}
                    placeholder="e.g. Transferred from PhonePe account at 3:15 PM"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-14"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTopupModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={topupSubmitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{topupSubmitting ? 'Submitting...' : 'Submit Top-Up Request'}</span>
                  </button>
                </div>
              </form>
            )}
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

      {/* IN-APP ATTACHMENT DELETION CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">Remove Attachment</h3>
                <p className="text-xs text-slate-500 truncate">{deleteTarget.source}</p>
              </div>
            </div>
            
            <div className="mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <p className="text-slate-700">
                Remove attached file: <strong className="text-slate-900 block truncate font-mono mt-0.5">{deleteTarget.name}</strong>
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                This will remove the file from your order record immediately.
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
                <span>Yes, Remove Attachment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER PLACED NOTIFICATION CELEBRATION MODAL */}
      {placedOrderNotification && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 text-center animate-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider mb-2">
              Order Confirmed & Placed
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Order #{placedOrderNotification.id} Received!
            </h3>

            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your service request has been registered and a live notification has been sent to the system administrator.
            </p>

            {/* Receipt Summary Card */}
            <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Service Package:</span>
                <span className="font-bold text-slate-900 text-sm">{placedOrderNotification.serviceName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Amount:</span>
                <span className="font-mono font-bold text-indigo-700 text-base">{formatINR(placedOrderNotification.amount)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Payment Mode:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                  placedOrderNotification.paymentMethod === 'WALLET' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-slate-200 text-slate-800'
                }`}>
                  {placedOrderNotification.paymentMethod === 'WALLET' ? 'Paid from INR Wallet' : 'Direct Payment / Invoice'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Current Status:</span>
                <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-blue-100 text-blue-800">
                  {placedOrderNotification.status.replace('_', ' ')}
                </span>
              </div>

              {placedOrderNotification.attachments && placedOrderNotification.attachments.length > 0 && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Attached Files:</span>
                  <span className="font-semibold text-slate-800 flex items-center space-x-1">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{placedOrderNotification.attachments.length} requirement file(s) attached</span>
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPlacedOrderNotification(null);
                  setActiveTab('orders');
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>View in My Orders</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPlacedOrderNotification(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};