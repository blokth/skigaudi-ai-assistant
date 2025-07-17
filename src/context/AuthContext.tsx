"use client";

import {
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/firebase/client";

interface AuthCtx {
  user: User | null;
  loading: boolean;
}
const AuthContext = createContext<AuthCtx>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, u => {
    setUser(u);
    setLoading(false);
  }), []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
