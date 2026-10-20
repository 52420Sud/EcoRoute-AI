import React, { useState } from 'react';
import { useAuth, UserRole } from '../../firebase/authContext';
import {
  Lock,
  Mail,
  User,
  Shield,
  Truck,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFirebaseSetup?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onOpenFirebaseSetup }) => {
  const { currentUser, loginWithEmail, registerWithEmail, loginDemo, logout, isFirebaseActive } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('authority');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password, role);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (r: UserRole) => {
    loginDemo(r);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {currentUser ? 'User Account Details' : isRegister ? 'Create System Account' : 'Sign In to Portal'}
              </h3>
              <p className="text-xs text-slate-300">
                {isFirebaseActive ? 'Connected to Firebase Authentication' : 'Local Authentication Mode'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-800">
          {currentUser ? (
            /* Logged In Card */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 font-black text-lg flex items-center justify-center mx-auto">
                  {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">{currentUser.displayName}</h4>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
                <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-200 text-emerald-800">
                  Role: {currentUser.role}
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            /* Login / Register Form */
            <div className="space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. authority@municipal.gov"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                {isRegister && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Account Role
                    </label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="citizen">Citizen Public Reporter</option>
                      <option value="authority">Municipal Waste Authority Admin</option>
                      <option value="driver">Fleet Collection Driver</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
                </button>
              </form>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegister(v => !v)}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
                </button>
              </div>

              {/* One-Click Quick Demo Login (PRD & Presentation Convenience) */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick One-Click Demo Logins:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('authority')}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-center font-bold text-slate-800 transition-colors flex flex-col items-center gap-1"
                  >
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Authority</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('citizen')}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-center font-bold text-slate-800 transition-colors flex flex-col items-center gap-1"
                  >
                    <User className="w-4 h-4 text-teal-600" />
                    <span>Citizen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('driver')}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-center font-bold text-slate-800 transition-colors flex flex-col items-center gap-1"
                  >
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Driver</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            {isFirebaseActive ? 'Firebase Auth: Ready' : 'Demo Auth Active'}
          </span>
          {onOpenFirebaseSetup && (
            <button
              onClick={() => {
                onClose();
                onOpenFirebaseSetup();
              }}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              Configure Firebase Project <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
