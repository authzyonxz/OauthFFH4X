import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useFFHAuth } from "@/contexts/FFHAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Copy, Pause, Ban, Trash2, CalendarPlus, Play, Search, Key, Shield, Monitor, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Ativa", cls: "status-active" },
    expired: { label: "Expirada", cls: "status-expired" },
    inactive: { label: "Inativa", cls: "status-inactive" },
    banned: { label: "Banida", cls: "status-banned" },
    paused: { label: "Pausada", cls: "status-paused" },
  };
  const info = map[status] || { label: status, cls: "status-inactive" };
  return <span className={`status-pill ${info.cls}`}>{info.label}</span>;
}

function formatSeconds(s: number | null): string {
  if (!s || s <= 0) return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function Keys() {
  const { user } = useFFHAuth();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showAction, setShowAction] = useState<{ key: any; action: string } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionDays, setActionDays] = useState("7");

  // Form state
  const [form, setForm] = useState({
    prefix: "",
    packageId: "",
    durationDays: "30",
    maxDevices: "1",
    customSuffix: "",
  });

  const { data: keys = [], isLoading } = trpc.keys.list.useQuery();
  const { data: packages = [] } = trpc.packages.list.useQuery();
  const { data: prefixes = [] } = trpc.prefixes.list.useQuery();

  const createMutation = trpc.keys.create.useMutation({
    onSuccess: (key) => {
      toast.success(`Key criada: ${key?.key}`);
      utils.keys.list.invalidate();
      setShowCreate(false);
      setForm({ prefix: "", packageId: "", durationDays: "30", maxDevices: "1", customSuffix: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const actionMutation = trpc.keys.action.useMutation({
    onSuccess: () => {
      toast.success("Ação realizada com sucesso");
      utils.keys.list.invalidate();
      setShowAction(null);
      setActionReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.prefix || !form.packageId) {
      toast.error("Selecione prefixo e package");
      return;
    }
    createMutation.mutate({
      prefix: form.prefix,
      packageId: parseInt(form.packageId),
      durationDays: parseInt(form.durationDays),
      maxDevices: parseInt(form.maxDevices),
      customSuffix: form.customSuffix || undefined,
    });
  };

  const handleAction = (action: string) => {
    if (!showAction) return;
    actionMutation.mutate({
      keyId: showAction.key.id,
      action: action as any,
      reason: actionReason || undefined,
      days: action === "add_days" ? parseInt(actionDays) : undefined,
    });
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Key copiada!");
  };

  const filtered = keys.filter((k: any) =>
    k.key.toLowerCase().includes(search.toLowerCase()) ||
    k.prefix.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "oklch(0.95 0.01 260)" }}>Keys</h1>
          <p className="text-sm mt-0.5" style={{ color: "oklch(0.5 0.02 260)" }}>
            {keys.length} keys no total
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2"
          style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))", color: "oklch(0.98 0.005 260)" }}>
          <Plus className="w-4 h-4" /> Nova Key
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(0.45 0.02 260)" }} />
        <Input
          placeholder="Buscar por key ou prefixo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10"
          style={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
        <div className="overflow-x-auto">
          <table className="ffh-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Status</th>
                <th>Package</th>
                <th>Duração</th>
                <th>Dispositivo</th>
                <th>Tempo Restante</th>
                <th>Criada em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: "oklch(0.18 0.02 260)" }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Key className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "oklch(0.5 0.02 260)" }} />
                    <p style={{ color: "oklch(0.45 0.02 260)" }}>Nenhuma key encontrada</p>
                  </td>
                </tr>
              ) : (
                filtered.map((key: any) => {
                  const pkg = packages.find((p: any) => p.id === key.packageId);
                  return (
                    <tr key={key.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="key-badge">{key.key}</span>
                          <button onClick={() => copyKey(key.key)} className="opacity-40 hover:opacity-100 transition-opacity">
                            <Copy className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.22 260)" }} />
                          </button>
                        </div>
                      </td>
                      <td><StatusPill status={key.status} /></td>
                      <td>
                        <span className="text-xs px-2 py-1 rounded" style={{ background: "oklch(0.16 0.02 260)", color: "oklch(0.7 0.02 260)" }}>
                          {pkg?.name || `#${key.packageId}`}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs" style={{ color: "oklch(0.7 0.15 260)" }}>{key.duration}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5" style={{ color: "oklch(0.5 0.02 260)" }} />
                          <span className="text-xs" style={{ color: "oklch(0.65 0.02 260)" }}>
                            {key.maxDevices} máx.
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-mono" style={{ color: key.secondsRemaining > 0 ? "oklch(0.65 0.18 145)" : "oklch(0.55 0.22 25)" }}>
                          {formatSeconds(key.secondsRemaining)}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>
                          {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true, locale: ptBR })}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {key.isPaused ? (
                            <button onClick={() => setShowAction({ key, action: "unpause" })} title="Reativar"
                              className="p-1.5 rounded hover:bg-green-500/10 transition-colors">
                              <Play className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 145)" }} />
                            </button>
                          ) : (
                            <button onClick={() => setShowAction({ key, action: "pause" })} title="Pausar"
                              className="p-1.5 rounded hover:bg-yellow-500/10 transition-colors">
                              <Pause className="w-3.5 h-3.5" style={{ color: "oklch(0.75 0.18 85)" }} />
                            </button>
                          )}
                          {key.isBanned ? (
                            <button onClick={() => actionMutation.mutate({ keyId: key.id, action: "unban" })} title="Desbanir"
                              className="p-1.5 rounded hover:bg-green-500/10 transition-colors">
                              <Shield className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 145)" }} />
                            </button>
                          ) : (
                            <button onClick={() => setShowAction({ key, action: "ban" })} title="Banir"
                              className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
                              <Ban className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.22 25)" }} />
                            </button>
                          )}
                          <button onClick={() => setShowAction({ key, action: "add_days" })} title="Adicionar dias"
                            className="p-1.5 rounded hover:bg-blue-500/10 transition-colors">
                            <CalendarPlus className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.22 260)" }} />
                          </button>
                          <button onClick={() => setShowAction({ key, action: "delete" })} title="Excluir"
                            className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.22 25)" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.01 260)" }}>
              <Key className="w-4 h-4 inline mr-2" style={{ color: "oklch(0.65 0.22 260)" }} />
              Criar Nova Key
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.7 0.02 260)" }}>Prefixo</Label>
              <Select value={form.prefix} onValueChange={v => setForm(f => ({ ...f, prefix: v }))}>
                <SelectTrigger style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}>
                  <SelectValue placeholder="Selecionar prefixo" />
                </SelectTrigger>
                <SelectContent style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
                  {prefixes.map((p: any) => (
                    <SelectItem key={p.id} value={p.name} style={{ color: "oklch(0.88 0.01 260)" }}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.7 0.02 260)" }}>Package</Label>
              <Select value={form.packageId} onValueChange={v => setForm(f => ({ ...f, packageId: v }))}>
                <SelectTrigger style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}>
                  <SelectValue placeholder="Selecionar package" />
                </SelectTrigger>
                <SelectContent style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
                  {packages.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)} style={{ color: "oklch(0.88 0.01 260)" }}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.7 0.02 260)" }}>Duração</Label>
              <Select value={form.durationDays} onValueChange={v => setForm(f => ({ ...f, durationDays: v }))}>
                <SelectTrigger style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
                  <SelectItem value="1" style={{ color: "oklch(0.88 0.01 260)" }}>1 dia (1day)</SelectItem>
                  <SelectItem value="7" style={{ color: "oklch(0.88 0.01 260)" }}>7 dias (7day)</SelectItem>
                  <SelectItem value="30" style={{ color: "oklch(0.88 0.01 260)" }}>30 dias (30day)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Dias personalizados</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ex: 3"
                  value={form.durationDays}
                  onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))}
                  style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}
                />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Máx. dispositivos</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.maxDevices}
                  onChange={e => setForm(f => ({ ...f, maxDevices: e.target.value }))}
                  style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}
                />
              </div>
            </div>

            {user?.role === "admin" && (
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Prefixo personalizado (opcional)</Label>
                <Input
                  placeholder="Ex: HAPPYBIRTHDAY"
                  value={form.customSuffix}
                  onChange={e => setForm(f => ({ ...f, customSuffix: e.target.value.toUpperCase() }))}
                  className="font-mono"
                  style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}
                />
                <p className="text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>
                  Resultado: {form.customSuffix || form.prefix || "PREFIXO"}-{form.durationDays}day-XXXXXXXXXXXXXXX
                </p>
              </div>
            )}

            {user?.role === "reseller" && (
              <div className="rounded-lg p-3" style={{ background: "oklch(0.75 0.18 85 / 0.08)", border: "1px solid oklch(0.75 0.18 85 / 0.2)" }}>
                <p className="text-xs" style={{ color: "oklch(0.75 0.18 85)" }}>
                  💳 Esta ação consumirá 1 crédito. Você tem {user.credits} créditos disponíveis.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1"
                style={{ borderColor: "oklch(0.22 0.02 260)", color: "oklch(0.7 0.02 260)" }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))", color: "oklch(0.98 0.005 260)" }}>
                {createMutation.isPending ? "Criando..." : "Criar Key"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!showAction} onOpenChange={() => setShowAction(null)}>
        <DialogContent style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.01 260)" }}>
              {showAction?.action === "ban" && "Banir Key"}
              {showAction?.action === "pause" && "Pausar Key"}
              {showAction?.action === "unpause" && "Reativar Key"}
              {showAction?.action === "delete" && "Excluir Key"}
              {showAction?.action === "add_days" && "Adicionar Dias"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {showAction?.key && (
              <div className="rounded-lg p-3" style={{ background: "oklch(0.14 0.02 260)" }}>
                <span className="key-badge">{showAction.key.key}</span>
              </div>
            )}
            {(showAction?.action === "ban") && (
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Motivo (opcional)</Label>
                <Input
                  placeholder="Motivo do banimento..."
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}
                />
              </div>
            )}
            {showAction?.action === "add_days" && (
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Dias a adicionar</Label>
                <Input
                  type="number"
                  min="1"
                  value={actionDays}
                  onChange={e => setActionDays(e.target.value)}
                  style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}
                />
              </div>
            )}
            {showAction?.action === "delete" && (
              <p className="text-sm" style={{ color: "oklch(0.65 0.18 25)" }}>
                Esta ação é irreversível. A key será excluída permanentemente.
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAction(null)} className="flex-1"
                style={{ borderColor: "oklch(0.22 0.02 260)", color: "oklch(0.7 0.02 260)" }}>
                Cancelar
              </Button>
              <Button
                onClick={() => handleAction(showAction!.action)}
                disabled={actionMutation.isPending}
                className="flex-1"
                style={{
                  background: showAction?.action === "delete" || showAction?.action === "ban"
                    ? "oklch(0.55 0.22 25)"
                    : "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))",
                  color: "oklch(0.98 0.005 260)"
                }}>
                {actionMutation.isPending ? "Processando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
