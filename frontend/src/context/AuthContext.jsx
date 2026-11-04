import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api, { tokens } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokens.access));

  const loadUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me/");
      setUser(data);
    } catch {
      tokens.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokens.access) loadUser();
  }, [loadUser]);

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login/", { username, password });
    tokens.set(data);
    await loadUser();
  };

  const register = async (form) => {
    await api.post("/auth/register/", form);
    await login(form.username, form.password);
  };

  const logout = () => {
    tokens.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
