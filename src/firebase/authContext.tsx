import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

export type UserRole = 'authority' | 'citizen' | 'driver';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber?: string | null;
  role: UserRole;
  isFirebaseUser: boolean;
  isOtpVerified?: boolean;
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, role?: UserRole) => Promise<void>;
  loginCitizenEmail: (email: string, pass: string, name?: string) => void;
  loginCitizenPhone: (name: string, phone: string, isOtpVerified?: boolean) => void;
  loginDemo: (role: UserRole) => void;
  logout: () => Promise<void>;
  isFirebaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('ecoroute_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const isFirebaseActive = isFirebaseConfigured() && Boolean(auth);

  useEffect(() => {
    if (isFirebaseActive && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const appUser: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            role: fbUser.email?.includes('authority') || fbUser.email?.includes('admin') ? 'authority' : 'citizen',
            isFirebaseUser: true
          };
          setCurrentUser(appUser);
          localStorage.setItem('ecoroute_auth_user', JSON.stringify(appUser));
        } else {
          // If we had a firebase user, clear it
          if (currentUser?.isFirebaseUser) {
            setCurrentUser(null);
            localStorage.removeItem('ecoroute_auth_user');
          }
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setLoading(false);
    }
  }, [isFirebaseActive]);

  const loginWithEmail = async (email: string, pass: string) => {
    if (isFirebaseActive && auth) {
      await signInWithEmailAndPassword(auth, email, pass);
    } else {
      // Local fallback simulation if Firebase keys not configured yet
      const role: UserRole = email.includes('admin') || email.includes('authority') ? 'authority' : 'citizen';
      const mockUser: AppUser = {
        uid: `USR-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        role,
        isFirebaseUser: false
      };
      setCurrentUser(mockUser);
      localStorage.setItem('ecoroute_auth_user', JSON.stringify(mockUser));
    }
  };

  const registerWithEmail = async (email: string, pass: string, role: UserRole = 'citizen') => {
    if (isFirebaseActive && auth) {
      await createUserWithEmailAndPassword(auth, email, pass);
    } else {
      const mockUser: AppUser = {
        uid: `USR-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        role,
        isFirebaseUser: false
      };
      setCurrentUser(mockUser);
      localStorage.setItem('ecoroute_auth_user', JSON.stringify(mockUser));
    }
  };

  const loginCitizenEmail = (email: string, pass: string, name?: string) => {
    const cleanEmail = email.trim() || 'citizen@example.com';
    const cleanName = name?.trim() || cleanEmail.split('@')[0] || 'Citizen';
    const citizenUser: AppUser = {
      uid: `CITIZEN-${Date.now()}`,
      email: cleanEmail,
      displayName: cleanName,
      phoneNumber: null,
      role: 'citizen',
      isFirebaseUser: false,
      isOtpVerified: false
    };
    setCurrentUser(citizenUser);
    localStorage.setItem('ecoroute_auth_user', JSON.stringify(citizenUser));
  };

  const loginCitizenPhone = (name: string, phone: string, isOtpVerified: boolean = false) => {
    const cleanPhone = phone.trim();
    const cleanName = name.trim() || 'Citizen Reporter';
    const citizenUser: AppUser = {
      uid: `CITIZEN-${Date.now()}`,
      email: null,
      displayName: cleanName,
      phoneNumber: cleanPhone,
      role: 'citizen',
      isFirebaseUser: false,
      isOtpVerified
    };
    setCurrentUser(citizenUser);
    localStorage.setItem('ecoroute_auth_user', JSON.stringify(citizenUser));
  };

  const loginDemo = (role: UserRole) => {
    const demoUser: AppUser = {
      uid: `DEMO-${role.toUpperCase()}`,
      email: `${role}@municipal.gov`,
      displayName: role === 'authority' ? 'Municipal Director' : role === 'driver' ? 'Ramesh Kumar (Driver)' : 'Citizen Aditya',
      phoneNumber: null,
      role,
      isFirebaseUser: false,
      isOtpVerified: false
    };
    setCurrentUser(demoUser);
    localStorage.setItem('ecoroute_auth_user', JSON.stringify(demoUser));
  };

  const logout = async () => {
    if (isFirebaseActive && auth) {
      await fbSignOut(auth);
    }
    setCurrentUser(null);
    localStorage.removeItem('ecoroute_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginCitizenEmail,
        loginCitizenPhone,
        loginDemo,
        logout,
        isFirebaseActive
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
