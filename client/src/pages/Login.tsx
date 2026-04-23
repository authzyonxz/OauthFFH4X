import { useState } from "react";
import { useFFHAuth } from "@/contexts/FFHAuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Key, Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useFFHAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Preencha usuário e senha");
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.22 260) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.22 290) 0%, transparent 70%)" }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(oklch(0.65 0.22 260) 1px, transparent 1px), linear-gradient(90deg, oklch(0.65 0.22 260) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />
      </div>

      <div className="w-full max-w-md px-4 relative z-10 fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 glow-blue"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260 / 0.2), oklch(0.6 0.22 290 / 0.2))", border: "1px solid oklch(0.65 0.22 260 / 0.3)" }}>
            <Shield className="w-8 h-8" style={{ color: "oklch(0.65 0.22 260)" }} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "oklch(0.95 0.01 260)" }}>
            AUTH <span style={{ color: "oklch(0.65 0.22 260)" }}>FFH4X</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.5 0.02 260)" }}>
            Sistema de Gerenciamento de Licenças
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: "oklch(0.11 0.015 260)",
            border: "1px solid oklch(0.2 0.02 260)",
            boxShadow: "0 25px 50px oklch(0 0 0 / 0.5)"
          }}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold" style={{ color: "oklch(0.9 0.01 260)" }}>Entrar no painel</h2>
            <p className="text-sm mt-0.5" style={{ color: "oklch(0.5 0.02 260)" }}>Acesso restrito a usuários autorizados</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium" style={{ color: "oklch(0.7 0.02 260)" }}>
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                className="h-11 font-mono"
                style={{
                  background: "oklch(0.14 0.015 260)",
                  border: "1px solid oklch(0.22 0.02 260)",
                  color: "oklch(0.92 0.01 260)",
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: "oklch(0.7 0.02 260)" }}>
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 pr-10"
                  style={{
                    background: "oklch(0.14 0.015 260)",
                    border: "1px solid oklch(0.22 0.02 260)",
                    color: "oklch(0.92 0.01 260)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "oklch(0.5 0.02 260)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold text-sm transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))",
                color: "oklch(0.98 0.005 260)",
                boxShadow: loading ? "none" : "0 4px 15px oklch(0.65 0.22 260 / 0.3)",
              }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Autenticando...</>
              ) : (
                <><Key className="w-4 h-4 mr-2" /> Acessar Painel</>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "oklch(0.35 0.02 260)" }}>
          AUTH FFH4X &copy; {new Date().getFullYear()} — Sistema de API para iOS
        </p>
      </div>
    </div>
  );
}
