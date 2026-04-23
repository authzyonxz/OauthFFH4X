import { trpc } from "@/lib/trpc";
import { useFFHAuth } from "@/contexts/FFHAuthContext";
import { Key, Package, Users, Activity, TrendingUp, AlertCircle, Clock, CheckCircle, XCircle, PauseCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const LOG_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  login: { label: "Login", color: "oklch(0.65 0.22 260)" },
  key_activation: { label: "Ativação", color: "oklch(0.65 0.18 145)" },
  key_created: { label: "Key Criada", color: "oklch(0.7 0.18 200)" },
  key_banned: { label: "Key Banida", color: "oklch(0.55 0.22 25)" },
  key_deleted: { label: "Key Excluída", color: "oklch(0.55 0.22 25)" },
  key_validation: { label: "Validação", color: "oklch(0.6 0.22 290)" },
  user_created: { label: "Usuário Criado", color: "oklch(0.65 0.18 145)" },
  user_banned: { label: "Usuário Banido", color: "oklch(0.55 0.22 25)" },
  package_created: { label: "Package Criado", color: "oklch(0.7 0.18 200)" },
  api_error: { label: "Erro API", color: "oklch(0.55 0.22 25)" },
  credits_added: { label: "Créditos", color: "oklch(0.75 0.18 85)" },
};

export default function Dashboard() {
  const { user } = useFFHAuth();
  const { data, isLoading } = trpc.dashboard.stats.useQuery();

  const stats = [
    {
      label: "Total de Keys",
      value: data?.totalKeys ?? 0,
      icon: Key,
      color: "oklch(0.65 0.22 260)",
      bg: "oklch(0.65 0.22 260 / 0.1)",
    },
    {
      label: "Keys Ativas",
      value: data?.activeKeys ?? 0,
      icon: CheckCircle,
      color: "oklch(0.65 0.18 145)",
      bg: "oklch(0.65 0.18 145 / 0.1)",
    },
    {
      label: "Keys Expiradas",
      value: data?.expiredKeys ?? 0,
      icon: XCircle,
      color: "oklch(0.55 0.22 25)",
      bg: "oklch(0.55 0.22 25 / 0.1)",
    },
    {
      label: user?.role === "admin" ? "Usuários Ativos" : "Créditos",
      value: user?.role === "admin" ? ((data as any)?.activeUsers ?? 0) : (data as any)?.credits ?? 0,
      icon: user?.role === "admin" ? Users : Activity,
      color: "oklch(0.6 0.22 290)",
      bg: "oklch(0.6 0.22 290 / 0.1)",
    },
    {
      label: "Packages",
      value: data?.totalPackages ?? 0,
      icon: Package,
      color: "oklch(0.7 0.18 200)",
      bg: "oklch(0.7 0.18 200 / 0.1)",
    },
  ];

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "oklch(0.95 0.01 260)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "oklch(0.5 0.02 260)" }}>
          Bem-vindo, <span style={{ color: "oklch(0.75 0.15 260)" }}>{user?.username}</span>
          {user?.role === "admin" ? " — Acesso Administrativo" : " — Painel do Revendedor"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "oklch(0.5 0.02 260)" }}>
                  {stat.label}
                </p>
                {isLoading ? (
                  <div className="h-8 w-16 rounded animate-pulse" style={{ background: "oklch(0.18 0.02 260)" }} />
                ) : (
                  <p className="text-3xl font-bold" style={{ color: "oklch(0.95 0.01 260)" }}>
                    {stat.value.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: stat.bg }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Logs (admin only) */}
      {user?.role === "admin" && (
        <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0.18 0.02 260)" }}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: "oklch(0.65 0.22 260)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "oklch(0.88 0.01 260)" }}>Atividade Recente</h2>
            </div>
            <a href="/logs" className="text-xs font-medium transition-colors hover:opacity-80" style={{ color: "oklch(0.65 0.22 260)" }}>
              Ver todos →
            </a>
          </div>
          <div className="divide-y" style={{ borderColor: "oklch(0.15 0.015 260)" }}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "oklch(0.25 0.02 260)" }} />
                  <div className="h-4 flex-1 rounded animate-pulse" style={{ background: "oklch(0.15 0.015 260)" }} />
                  <div className="h-3 w-20 rounded animate-pulse" style={{ background: "oklch(0.15 0.015 260)" }} />
                </div>
              ))
            ) : data?.recentLogs?.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "oklch(0.5 0.02 260)" }} />
                <p className="text-sm" style={{ color: "oklch(0.45 0.02 260)" }}>Nenhuma atividade registrada</p>
              </div>
            ) : (
              data?.recentLogs?.map((log: any) => {
                const typeInfo = LOG_TYPE_LABELS[log.type] || { label: log.type, color: "oklch(0.5 0.02 260)" };
                return (
                  <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-[oklch(0.12_0.015_260)] transition-colors">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: typeInfo.color, boxShadow: `0 0 6px ${typeInfo.color}` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>
                          {typeInfo.label}
                        </span>
                        <span className="text-sm truncate" style={{ color: "oklch(0.75 0.01 260)" }}>
                          {log.message}
                        </span>
                      </div>
                      {log.ip && (
                        <span className="text-xs mt-0.5 font-mono" style={{ color: "oklch(0.4 0.02 260)" }}>
                          IP: {log.ip}
                        </span>
                      )}
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: "oklch(0.4 0.02 260)" }}>
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Reseller info */}
      {user?.role === "reseller" && (
        <div className="rounded-xl p-5" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.88 0.01 260)" }}>Informações da Conta</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs" style={{ color: "oklch(0.5 0.02 260)" }}>Plano</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: "oklch(0.85 0.01 260)" }}>
                {user.plan === "annual" ? "Anual" : "Mensal"}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "oklch(0.5 0.02 260)" }}>Créditos Disponíveis</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: "oklch(0.75 0.18 85)" }}>
                {user.credits}
              </p>
            </div>
            {user.accountExpiresAt && (
              <div>
                <p className="text-xs" style={{ color: "oklch(0.5 0.02 260)" }}>Expiração da Conta</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: "oklch(0.85 0.01 260)" }}>
                  {new Date(user.accountExpiresAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
