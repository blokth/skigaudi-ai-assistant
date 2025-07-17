"use client";

import {
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/firebase/client";

interface AuthCtx {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}
const AuthContext = createContext<AuthCtx>({
  user: null,
  isAdmin: false,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async u => {
        setUser(u);

        if (u) {
          const token = await u.getIdTokenResult();
          setIsAdmin(!!token.claims.admin);
        } else {
          setIsAdmin(false);
        }

        setLoading(false);
      }),
    []
  );

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
