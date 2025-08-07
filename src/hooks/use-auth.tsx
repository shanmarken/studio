
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
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

    const userRef = doc(db, 'users', authUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        let userWithRole: User = { ...authUser };
        if (docSnap.exists()) {
            const firestoreUser = docSnap.data();
            userWithRole.role = firestoreUser.role;
        }

        // Definitive fix to grant admin role to a specific user, overriding any other role.
        if (authUser.email === 'info.globalpearlventures@gmail.com') {
            userWithRole.role = 'admin';
        }
        
        setUser(userWithRole);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching user role:", error);
        
        // Even on error, check if the user is the special admin
        let userWithError: User = { ...authUser };
        if (authUser.email === 'info.globalpearlventures@gmail.com') {
            userWithError.role = 'admin';
        }

        setUser(userWithError);
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
