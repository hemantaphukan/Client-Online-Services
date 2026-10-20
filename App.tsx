import React, { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { UserRole } from './types';
import { AdminDashboard } from './pages/AdminDashboard';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { Shield, Wallet, ArrowRight, UserCheck, Sparkles } from 'lucide-react';

const AuthForms: React.FC = () => {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      await login(formData.username, formData.password);
    } else {
      const success = await register(formData.fullName, formData.username, formData.password);
      if (success) {
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  const quickLogin = async (username: string, pass: string) => {
    setLoading(true);
    await login(username, pass);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-3">
          <Shield className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          ServiceMaster Pro
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Client Services Portal & Admin Wallet Balance Management
        </p>

        {/* Feature highlight banner */}
        <div className="mt-4 mx-4 sm:mx-0 p-3 bg-indigo-50 border border-indigo-200/80 rounded-xl text-xs text-indigo-900 flex items-center justify-center space-x-2">
          <Wallet className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>Clients request to add money &rarr; Admins verify & credit wallet balance</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200/80">
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                isLogin 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                !isLogin 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              New Registration
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="admin or john_doe"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Register Account')}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          {isLogin && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block text-center mb-3">
                Quick Demo 1-Click Login
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => quickLogin('admin', 'password123')}
                  className="p-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-left transition-all group"
                >
                  <div className="flex items-center justify-between text-indigo-300 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Admin Role</span>
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <p className="font-bold text-xs text-white">admin</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Approve wallet top-ups</p>
                </button>

                <button
                  type="button"
                  onClick={() => quickLogin('john_doe', 'password123')}
                  className="p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-left transition-all group"
                >
                  <div className="flex items-center justify-between text-indigo-700 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Client Role</span>
                    <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <p className="font-bold text-xs text-slate-900">john_doe</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Request add money & buy</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MainRouter: React.FC = () => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <AuthForms />;
  }

  return currentUser.role === UserRole.ADMIN ? <AdminDashboard /> : <CustomerDashboard />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
};

export default App;