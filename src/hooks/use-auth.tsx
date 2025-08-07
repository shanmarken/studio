
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import type { UserRole } from '@/lib/types';

export interface User extends FirebaseUser {
    role?: UserRole;
}

interface AuthContextType {
  user: User | null | undefined;
  loading: boolean;
  error: Error | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authUser, authLoading, authError] = useAuthState(auth);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      setUser(undefined);
      return;
    }
    if (!authUser) {
      setLoading(false);
      setUser(null);
      return;
    }

    // Temporary fix to grant admin role to a specific user
    if (authUser.email === 'golpbalperalventure@gamil.com') {
      setUser({ ...authUser, role: 'admin' });
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', authUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const firestoreUser = docSnap.data();
            setUser({ ...authUser, role: firestoreUser.role });
        } else {
            // This might happen briefly on first login before the doc is created
            setUser(authUser);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching user role:", error);
        // Set user without role if firestore fails
        setUser(authUser);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser, authLoading]);
  
  return (
    <AuthContext.Provider value={{ user, loading, error: authError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
