import { createContext, useContext, useState, useCallback } from "react";
import { saveToken, saveUser, clearAuth, getToken, getUser } from "../api/token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore session from localStorage on mount
    const token = getToken();
    const stored = getUser();
    if (token && stored) return stored;
    return null;
  });

  const login = useCallback((token, userData) => {
    saveToken(token);
    saveUser(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
