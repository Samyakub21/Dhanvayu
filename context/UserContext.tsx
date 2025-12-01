import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';

export type CurrencyType = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';

const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥'
};

interface UserContextType {
  currency: CurrencyType;
  symbol: string;
  setCurrency: (currency: CurrencyType) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrencyState] = useState<CurrencyType>('INR');
  const user = auth.currentUser;

  // Sync with Firestore on mount
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid, 'settings', 'preferences'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.currency) setCurrencyState(data.currency as CurrencyType);
      }
    });
    return unsub;
  }, [user]);

  // Update function (Updates Local State INSTANTLY, then Firestore)
  const setCurrency = async (newCurrency: CurrencyType) => {
    setCurrencyState(newCurrency); // Immediate UI update
    if (user) {
      const ref = doc(db, 'users', user.uid, 'settings', 'preferences');
      try {
        await setDoc(ref, { currency: newCurrency }, { merge: true });
      } catch (e) {
        console.error("Failed to save currency", e);
      }
    }
  };

  return (
    <UserContext.Provider value={{ currency, symbol: CURRENCY_SYMBOLS[currency], setCurrency }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};