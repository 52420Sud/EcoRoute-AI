import React, { useState } from 'react';
import { currentFirebaseConfig, isFirebaseConfigured, saveFirebaseConfig, clearFirebaseConfig, FirebaseConfig } from '../../firebase/config';
import {
  Flame,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  X,
  Save,
  Trash2,
  Database,
  Lock,
  Cpu,
  Sparkles
} from 'lucide-react';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<FirebaseConfig>({ ...currentFirebaseConfig });
  const [pasteSnippet, setPasteSnippet] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const isConfigured = isFirebaseConfigured();

  // Helper to parse pasted snippet e.g.:
  // const firebaseConfig = { apiKey: "...", ... };
  const handleParseSnippet = (snippetText: string) => {
    setPasteSnippet(snippetText);
    try {
      const apiKeyMatch = snippetText.match(/apiKey:\s*["']([^"']+)["']/);
      const authDomainMatch = snippetText.match(/authDomain:\s*["']([^"']+)["']/);
      const projectIdMatch = snippetText.match(/projectId:\s*["']([^"']+)["']/);
      const storageBucketMatch = snippetText.match(/storageBucket:\s*["']([^"']+)["']/);
      const senderIdMatch = snippetText.match(/messagingSenderId:\s*["']([^"']+)["']/);
      const appIdMatch = snippetText.match(/appId:\s*["']([^"']+)["']/);

      setConfig(prev => ({
        apiKey: apiKeyMatch ? apiKeyMatch[1] : prev.apiKey,
        authDomain: authDomainMatch ? authDomainMatch[1] : prev.authDomain,
        projectId: projectIdMatch ? projectIdMatch[1] : prev.projectId,
        storageBucket: storageBucketMatch ? storageBucketMatch[1] : prev.storageBucket,
        messagingSenderId: senderIdMatch ? senderIdMatch[1] : prev.messagingSenderId,
        appId: appIdMatch ? appIdMatch[1] : prev.appId
      }));
    } catch {
      // ignore
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig(config);
    setSavedSuccess(true);
  };

  const handleClear = () => {
    clearFirebaseConfig();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 text-white shadow-inner">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Firebase Setup & Beginner Guide</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isConfigured ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white'
                }`}>
                  {isConfigured ? 'Connected to Firebase' : 'Setup Required'}
                </span>
              </div>
              <p className="text-xs text-orange-100">
                Connect Cloud Firestore database and Firebase Authentication for your IoT hardware and dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-800">
          {/* Beginner 4-Step Instructions Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                Beginner Step-by-Step Setup Guide (Takes 2 Minutes)
              </h4>
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                Open Firebase Console <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                <span className="font-bold text-slate-900 block text-xs">Create Project</span>
                <p className="text-[11px] text-slate-500">Go to Firebase Console, click "Add Project", and name it e.g. <b>waste-mgt-system</b>.</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[10px]">2</span>
                <span className="font-bold text-slate-900 block text-xs">Enable Firestore</span>
                <p className="text-[11px] text-slate-500">Click <b>Firestore Database</b> &gt; Create Database &gt; Select <b>"Start in test mode"</b>.</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[10px]">3</span>
                <span className="font-bold text-slate-900 block text-xs">Enable Auth</span>
                <p className="text-[11px] text-slate-500">Click <b>Authentication</b> &gt; Get Started &gt; Enable <b>Email/Password</b> provider.</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[10px]">4</span>
                <span className="font-bold text-slate-900 block text-xs">Copy Config</span>
                <p className="text-[11px] text-slate-500">Click Project Settings ⚙️ &gt; Web App <code>&lt;/&gt;</code> &gt; Copy <code>firebaseConfig</code> and paste below!</p>
              </div>
            </div>
          </div>

          {/* Quick Paste Snippet Box */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>Paste Complete Config Code from Firebase Console</span>
              <span className="text-slate-400 font-normal normal-case">Auto-detects keys</span>
            </label>
            <textarea
              rows={3}
              value={pasteSnippet}
              onChange={e => handleParseSnippet(e.target.value)}
              placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "smart-waste-123",\n  ...\n};`}
              className="w-full bg-slate-900 text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px]">API Key (apiKey)</label>
                <input
                  type="text"
                  required
                  value={config.apiKey}
                  onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="AIzaSyBxxxxxxx"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px]">Project ID (projectId)</label>
                <input
                  type="text"
                  required
                  value={config.projectId}
                  onChange={e => setConfig({ ...config, projectId: e.target.value })}
                  placeholder="smart-waste-management"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px]">Auth Domain (authDomain)</label>
                <input
                  type="text"
                  value={config.authDomain}
                  onChange={e => setConfig({ ...config, authDomain: e.target.value })}
                  placeholder="smart-waste.firebaseapp.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px]">Storage Bucket (storageBucket)</label>
                <input
                  type="text"
                  value={config.storageBucket}
                  onChange={e => setConfig({ ...config, storageBucket: e.target.value })}
                  placeholder="smart-waste.appspot.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px]">App ID (appId)</label>
                <input
                  type="text"
                  value={config.appId}
                  onChange={e => setConfig({ ...config, appId: e.target.value })}
                  placeholder="1:123456789:web:abcdef"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px]">Messaging Sender ID</label>
                <input
                  type="text"
                  value={config.messagingSenderId}
                  onChange={e => setConfig({ ...config, messagingSenderId: e.target.value })}
                  placeholder="123456789"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Save className="w-4 h-4" /> Save & Connect Firebase
              </button>

              {isConfigured && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Disconnect Firebase
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Configuration is saved securely in your browser's local storage</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
