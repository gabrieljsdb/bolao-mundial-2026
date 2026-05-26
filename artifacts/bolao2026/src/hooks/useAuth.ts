import { useEffect, useState } from "react";

export interface User {
  id: number;
  email: string;
  name: string;
  department?: string;
  role: "user" | "admin";
  hasPaid?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar token do localStorage ao inicializar
  useEffect(() => {
    const storedToken = localStorage.getItem("worldcup_auth_token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Buscar dados do usuário logado
  async function fetchUser(authToken: string) {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token inválido
        localStorage.removeItem("worldcup_auth_token");
        setToken(null);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  }

  // Fazer login
  async function login(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || "Erro ao fazer login";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      localStorage.setItem("worldcup_auth_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setError(null);
      return true;
    } catch (err: any) {
      const message = err.message || "Erro desconhecido ao fazer login";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  // Registrar novo usuário
  async function register(email: string, password: string, name: string, department: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, department }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || "Erro ao registrar";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Após registrar, fazer login automaticamente
      return await login(email, password);
    } catch (err: any) {
      const message = err.message || "Erro desconhecido ao registrar";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  // Fazer logout
  function logout() {
    localStorage.removeItem("worldcup_auth_token");
    setToken(null);
    setUser(null);
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}
