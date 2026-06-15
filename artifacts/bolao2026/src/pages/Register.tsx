import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function Register() {
  const { register, error, loading } = useAuthContext();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");
    if (password !== confirmPassword) {
      setLocalError("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      setLocalError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (!department) {
      setLocalError("Por favor, selecione um setor");
      return;
    }
    const success = await register(email, password, name, department);
    if (success) {
      setLocation("/");
    }
  }

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#0a1a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-green-400 font-['Bebas_Neue'] tracking-wider">
            BOLÃO COPA DO MUNDO 2026
          </h1>
          <p className="text-green-600 mt-2 font-['Oswald']">Crie sua conta e faça suas previsões</p>
        </div>

        {/* Card */}
        <div className="bg-[#0f2a0f] border border-green-900 rounded-lg p-8">
          <h2 className="text-xl font-bold text-green-300 mb-6 font-['Oswald'] uppercase tracking-wide">
            Criar Conta
          </h2>

          {displayError && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 rounded p-3 mb-4 text-sm">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-green-400 text-sm font-['Oswald'] uppercase tracking-wide mb-1">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-[#0a1a0a] border border-green-800 text-green-100 rounded px-3 py-2 focus:outline-none focus:border-green-500 font-mono"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-green-400 text-sm font-['Oswald'] uppercase tracking-wide mb-1">
                Setor
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                required
                className="w-full bg-[#0a1a0a] border border-green-800 text-green-100 rounded px-3 py-2 focus:outline-none focus:border-green-500 font-mono"
              >
                <option value="">Selecione um setor</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Central de Atendimento">Central de Atendimento</option>
                <option value="Comissões">Comissões</option>
                <option value="Comunicação">Comunicação</option>
                <option value="Conselho Pleno">Conselho Pleno</option>
                <option value="Controladoria">Controladoria</option>
                <option value="Digitalização">Digitalização</option>
                <option value="ESA">ESA</option>
                <option value="Eventos">Eventos</option>
                <option value="Exame de Ordem">Exame de Ordem</option>
                <option value="Gabinete">Gabinete</option>
                <option value="Inclusão Digital">Inclusão Digital</option>
                <option value="Ouvidoria">Ouvidoria</option>
                <option value="Procuradoria Geral">Procuradoria Geral</option>
                <option value="RH">RH</option>
                <option value="Secretaria">Secretaria</option>
                <option value="Sede Balnearia">Sede Balnearia</option>
                <option value="Subsecao">Subsecao</option>
                <option value="Tecnologia">Tecnologia</option>
                <option value="TED">TED</option>
                <option value="Tesouraria">Tesouraria</option>
                <option value="Sociedades">Sociedades</option>
                <option value="Contabilidade">Contabilidade</option>
                <option value="CAASC">CAASC</option>
                <option value="Compras">Compras</option>
                <option value="Sicoob">Sicoob</option>
              </select>
            </div>

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
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-green-400 text-sm font-['Oswald'] uppercase tracking-wide mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
              {loading ? "CRIANDO CONTA..." : "CRIAR CONTA"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-green-600 text-sm">
              Já tem conta?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-green-400 hover:text-green-300 font-bold underline"
              >
                Fazer login
              </button>
            </p>
          </div>

          <div className="mt-4 p-3 bg-green-900/20 border border-green-800/50 rounded text-xs text-green-600">
            <strong className="text-green-500">Nota:</strong> O primeiro usuário registrado será automaticamente o administrador.
          </div>
        </div>
      </div>
    </div>
  );
}
