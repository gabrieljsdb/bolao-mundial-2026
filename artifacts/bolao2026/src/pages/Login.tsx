import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function Login() {
  const { login, error, loading } = useAuthContext();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.ok ? r.json() : null)
      .then(cfg => { if (cfg) setIsLocked(cfg.isLocked || false); })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      setLocation("/");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1a0a] flex flex-col items-center justify-center p-4">
      {isLocked && (
        <div className="w-full bg-red-950/90 border-b-2 border-red-500/60 backdrop-blur-sm fixed top-0 z-[60]">
          <div className="container flex items-center justify-center gap-3 py-3 px-4 mx-auto">
            <Lock className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <p className="text-red-200 font-['Oswald'] text-sm uppercase tracking-widest text-center">
              ⛔ Previsões encerradas — o prazo para palpites foi fechado pelo administrador. Você pode visualizar suas previsões, mas não alterá-las.
            </p>
            <Lock className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
          </div>
        </div>
      )}
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-green-400 font-['Bebas_Neue'] tracking-wider">
            BOLÃO COPA DO MUNDO 2026
          </h1>
          <p className="text-green-600 mt-2 font-['Oswald']">Faça login para acessar suas previsões</p>
        </div>

        {/* Card */}
        <div className="bg-[#0f2a0f] border border-green-900 rounded-lg p-8">
          <h2 className="text-xl font-bold text-green-300 mb-6 font-['Oswald'] uppercase tracking-wide">
            Entrar
          </h2>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 rounded p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-green-400 text-sm font-['Oswald'] uppercase tracking-wide mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[#0a1a0a] border border-green-800 text-green-100 rounded px-3 py-2 focus:outline-none focus:border-green-500 font-mono"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-green-400 text-sm font-['Oswald'] uppercase tracking-wide mb-1">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-[#0a1a0a] border border-green-800 text-green-100 rounded px-3 py-2 focus:outline-none focus:border-green-500 font-mono"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-600 disabled:bg-green-900 text-white font-bold py-3 rounded font-['Oswald'] uppercase tracking-wider transition-colors"
            >
              {loading ? "ENTRANDO..." : "ENTRAR"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-green-600 text-sm">
              Não tem conta?{" "}
              <button
                onClick={() => setLocation("/register")}
                className="text-green-400 hover:text-green-300 font-bold underline"
              >
                Registrar-se
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
