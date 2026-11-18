import React, { useState } from 'react';
import { useAuth } from '../../firebase/authContext';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CitizenSignInProps {
  onSignedIn: () => void;
  onBrowseHome?: () => void;
}

export const CitizenSignIn: React.FC<CitizenSignInProps> = ({
  onSignedIn,
  onBrowseHome
}) => {
  const { loginCitizenEmail } = useAuth();

  const [email, setEmail] = useState<string>('citizen@gmail.com');
  const [password, setPassword] = useState<string>('password123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalEmail = email.trim() || 'citizen@gmail.com';
    loginCitizenEmail(finalEmail, password);
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    onSignedIn();
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 animate-in fade-in duration-300">
      {/* Title Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl relative overflow-hidden mb-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1.5">
          Citizen Portal Sign-In
        </h1>
        <p className="text-slate-300 text-xs leading-relaxed max-w-sm mx-auto">
          Please enter any email and password to report a waste problem.
        </p>
      </div>

      {/* Main Email & Password Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter any email address"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Enter any email (e.g. your email or citizen@gmail.com)
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter any password"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Enter any password
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign In & Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {onBrowseHome && (
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onBrowseHome}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
