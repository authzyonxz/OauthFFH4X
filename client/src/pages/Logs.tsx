import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const LOG_TYPES = [
  { value: "", label: "Todos os tipos" },
  { value: "login", label: "Login" },
  { value: "key_activation", label: "Ativação de Key" },
  { value: "key_validation", label: "Validação de Key" },
  { value: "key_created", label: "Key Criada" },
  { value: "key_banned", label: "Key Banida" },
  { value: "key_deleted", label: "Key Excluída" },
  { value: "user_created", label: "Usuário Criado" },
  { value: "user_banned", label: "Usuário Banido" },
  { value: "package_created", label: "Package Criado" },
  { value: "credits_added", label: "Créditos Adicionados" },
  { value: "api_error", label: "Erro de API" },
];

const TYPE_COLORS: Record<string, string> = {
  login: "oklch(0.65 0.22 260)",
  key_activation: "oklch(0.65 0.18 145)",
  key_validation: "oklch(0.6 0.22 290)",
  key_created: "oklch(0.7 0.18 200)",
  key_banned: "oklch(0.55 0.22 25)",
  key_deleted: "oklch(0.55 0.22 25)",
  user_created: "oklch(0.65 0.18 145)",
  user_banned: "oklch(0.55 0.22 25)",
  package_created: "oklch(0.7 0.18 200)",
  credits_added: "oklch(0.75 0.18 85)",
  api_error: "oklch(0.55 0.22 25)",
};

const LIMIT = 50;

export default function Logs() {
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");

  const { data, isLoading } = trpc.logs.list.useQuery({
    limit: LIMIT,
    offset: page * LIMIT,
    type: typeFilter || undefined,
  });

  const logs = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "oklch(0.95 0.01 260)" }}>Logs</h1>
          <p className="text-sm mt-0.5" style={{ color: "oklch(0.5 0.02 260)" }}>{total} registros</p>
        </div>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-52" style={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}>
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
            {LOG_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value} style={{ color: "oklch(0.88 0.01 260)" }}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
        <div className="overflow-x-auto">
          <table className="ffh-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Mensagem</th>
                <th>IP</th>
                <th>Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 4 }).map((_, j) => (
                    <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: "oklch(0.18 0.02 260)" }} /></td>
                  ))}</tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "oklch(0.5 0.02 260)" }} />
                  <p style={{ color: "oklch(0.45 0.02 260)" }}>Nenhum log encontrado</p>
                </td></tr>
              ) : (
                logs.map((log: any) => {
                  const color = TYPE_COLORS[log.type] || "oklch(0.5 0.02 260)";
                  const typeLabel = LOG_TYPES.find(t => t.value === log.type)?.label || log.type;
                  return (
                    <tr key={log.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                          <span className="text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap"
                            style={{ background: `${color}20`, color }}>
                            {typeLabel}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm" style={{ color: "oklch(0.75 0.01 260)" }}>{log.message}</span>
                      </td>
                      <td>
                        <span className="font-mono text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>{log.ip || "—"}</span>
                      </td>
                      <td>
                        <span className="text-xs whitespace-nowrap" style={{ color: "oklch(0.45 0.02 260)" }}>
                          {format(new Date(log.createdAt), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "oklch(0.18 0.02 260)" }}>
            <span className="text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>
              Página {page + 1} de {totalPages} ({total} registros)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="h-7 w-7 p-0" style={{ borderColor: "oklch(0.22 0.02 260)", color: "oklch(0.7 0.02 260)" }}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="h-7 w-7 p-0" style={{ borderColor: "oklch(0.22 0.02 260)", color: "oklch(0.7 0.02 260)" }}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
