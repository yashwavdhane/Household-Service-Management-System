import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// Storage keys — centralized so axiosInstance can reuse them
export const TOKEN_KEY = "hsms_token";
export const USER_KEY = "hsms_user";

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true until we verify persisted session

  // ── Initialize from localStorage on mount ──────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        // Corrupted storage — clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  // ── Persist session changes ────────────────────────────────────────────────
  const persistSession = (newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  // ── register ───────────────────────────────────────────────────────────────
  const register = async (formData) => {
    const { data } = await axiosInstance.post("/auth/register", formData);
    persistSession(data.token, data.user);
    return data.user;
  };

  // ── login ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await axiosInstance.post("/auth/login", { email, password });
    persistSession(data.token, data.user);
    return data.user;
  };

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      // Notify backend (fire-and-forget; token removal is the real logout)
      await axiosInstance.post("/auth/logout");
    } catch {
      // ignore network errors on logout
    } finally {
      clearSession();
    }
  }, []);

  // ── updateUser (used after profile update) ─────────────────────────────────
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    register,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

export default AuthContext;
