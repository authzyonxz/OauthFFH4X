import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useFFHAuth } from "@/contexts/FFHAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Copy, Pause, Ban, Trash2, CalendarPlus, Play, Search, Key, Shield, Monitor, Clock, CheckCircle2 } from "lucide-react";
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
  const [showSuccess, setShowSuccess] = useState<string[] | null>(null);
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
    count: "1",
    isUniversal: false,
  });

  const { data: keys = [], isLoading } = trpc.keys.list.useQuery();
  const { data: packages = [] } = trpc.packages.list.useQuery();
  const { data: prefixes = [] } = trpc.prefixes.list.useQuery();

  const createBulkMutation = trpc.keys.createBulk.useMutation({
    onSuccess: (res) => {
      setShowSuccess(res.keys);
      utils.keys.list.invalidate();
      setShowCreate(false);
      setForm({ prefix: "", packageId: "", durationDays: "30", maxDevices: "1", customSuffix: "", count: "1" });
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
    if (!form.isUniversal && (!form.prefix || !form.packageId)) {
      toast.error("Selecione prefixo e package");
      return;
    }
    createBulkMutation.mutate({
      prefix: form.isUniversal ? undefined : form.prefix,
      packageId: form.isUniversal ? undefined : parseInt(form.packageId),
      durationDays: parseInt(form.durationDays),
      maxDevices: parseInt(form.maxDevices),
      count: parseInt(form.count),
      customSuffix: form.customSuffix || undefined,
      isUniversal: form.isUniversal,
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

  const copyAllKeys = () => {
    if (!showSuccess) return;
    navigator.clipboard.writeText(showSuccess.join("\n"));
    toast.success("Todas as keys foram copiadas!");
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

      {/* Table Container */}
      <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="ffh-table w-full">
            <thead>
              <tr>
                <th className="text-left px-4 py-3">Key</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Package</th>
                <th className="text-left px-4 py-3">Duração</th>
                <th className="text-left px-4 py-3">Dispositivo</th>
                <th className="text-left px-4 py-3">Tempo Restante</th>
                <th className="text-left px-4 py-3">Criada em</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-[oklch(0.18_0.02_260)]">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 rounded animate-pulse" style={{ background: "oklch(0.18 0.02 260)" }} /></td>
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
                    <tr key={key.id} className="border-t border-[oklch(0.18_0.02_260)] hover:bg-[oklch(0.13_0.015_260)] transition-colors">
                      <td className="px-4 py-4" data-label="Key">
                        <div className="flex items-center gap-2 justify-end md:justify-start">
                          <span className="key-badge font-mono text-[13px] tracking-wider" style={key.isUniversal ? { borderColor: "oklch(0.65 0.22 260)", color: "oklch(0.65 0.22 260)" } : {}}>
                            {key.key}
                          </span>
                          <button onClick={() => copyKey(key.key)} className="opacity-40 hover:opacity-100 transition-opacity p-1">
                            <Copy className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.22 260)" }} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4" data-label="Status"><StatusPill status={key.status} /></td>
                      <td className="px-4 py-4" data-label="Package">
                        {key.isUniversal ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter" style={{ background: "oklch(0.65 0.22 260)", color: "white" }}>
                            UNIVERSAL
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded font-medium" style={{ background: "oklch(0.16 0.02 260)", color: "oklch(0.7 0.02 260)" }}>
                            {pkg?.name || `#${key.packageId}`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4" data-label="Duração">
                        <span className="font-mono text-xs" style={{ color: "oklch(0.7 0.15 260)" }}>{key.duration}</span>
                      </td>
                      <td className="px-4 py-4" data-label="Dispositivo">
                        <div className="flex items-center gap-1.5 justify-end md:justify-start">
                          <Monitor className="w-3.5 h-3.5" style={{ color: "oklch(0.5 0.02 260)" }} />
                          <span className="text-xs" style={{ color: "oklch(0.65 0.02 260)" }}>
                            {key.maxDevices} máx.
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4" data-label="Tempo Restante">
                        <span className="text-xs font-mono font-bold" style={{ color: key.secondsRemaining > 0 ? "oklch(0.65 0.18 145)" : "oklch(0.55 0.22 25)" }}>
                          {formatSeconds(key.secondsRemaining)}
                        </span>
                      </td>
                      <td className="px-4 py-4" data-label="Criada em">
                        <span className="text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>
                          {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true, locale: ptBR })}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right" data-label="Ações">
                        <div className="flex items-center justify-end gap-1">
                          {key.isPaused ? (
                            <button onClick={() => setShowAction({ key, action: "unpause" })} title="Reativar"
                              className="p-2 rounded-lg hover:bg-green-500/10 transition-colors">
                              <Play className="w-4 h-4" style={{ color: "oklch(0.65 0.18 145)" }} />
                            </button>
                          ) : (
                            <button onClick={() => setShowAction({ key, action: "pause" })} title="Pausar"
                              className="p-2 rounded-lg hover:bg-yellow-500/10 transition-colors">
                              <Pause className="w-4 h-4" style={{ color: "oklch(0.75 0.18 85)" }} />
                            </button>
                          )}
                          {key.isBanned ? (
                            <button onClick={() => actionMutation.mutate({ keyId: key.id, action: "unban" })} title="Desbanir"
                              className="p-2 rounded-lg hover:bg-green-500/10 transition-colors">
                              <Shield className="w-4 h-4" style={{ color: "oklch(0.65 0.18 145)" }} />
                            </button>
                          ) : (
                            <button onClick={() => setShowAction({ key, action: "ban" })} title="Banir"
                              className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                              <Ban className="w-4 h-4" style={{ color: "oklch(0.55 0.22 25)" }} />
                            </button>
                          )}
                          <button onClick={() => setShowAction({ key, action: "add_days" })} title="Adicionar dias"
                            className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors">
                            <CalendarPlus className="w-4 h-4" style={{ color: "oklch(0.65 0.22 260)" }} />
                          </button>
                          <button onClick={() => setShowAction({ key, action: "delete" })} title="Excluir"
                            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-4 h-4" style={{ color: "oklch(0.55 0.22 25)" }} />
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

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md" style={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.95 0.01 260)" }}>Gerar Novas Keys</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {user?.role === "admin" && (
              <div className="flex items-center gap-2 mb-2 p-3 rounded-lg border border-[oklch(0.65_0.22_260/0.2)] bg-[oklch(0.65_0.22_260/0.05)]">
                <input
                  type="checkbox"
                  id="isUniversal"
                  checked={form.isUniversal}
                  onChange={e => setForm({ ...form, isUniversal: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isUniversal" className="font-bold cursor-pointer" style={{ color: "oklch(0.65 0.22 260)" }}>
                  GERAR KEY UNIVERSAL (Funciona em todos os packages)
                </Label>
              </div>
            )}

            {!form.isUniversal && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: "oklch(0.7 0.02 260)" }}>Prefixo</Label>
                  <Select value={form.prefix} onValueChange={v => setForm({ ...form, prefix: v })}>
                    <SelectTrigger style={{ background: "oklch(0.15 0.02 260)", border: "1px solid oklch(0.25 0.02 260)" }}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent style={{ background: "oklch(0.15 0.02 260)", border: "1px solid oklch(0.25 0.02 260)" }}>
                      {prefixes.map((p: any) => (
                        <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label style={{ color: "oklch(0.7 0.02 260)" }}>Package</Label>
                  <Select value={form.packageId} onValueChange={v => setForm({ ...form, packageId: v })}>
                    <SelectTrigger style={{ background: "oklch(0.15 0.02 260)", border: "1px solid oklch(0.25 0.02 260)" }}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent style={{ background: "oklch(0.15 0.02 260)", border: "1px solid oklch(0.25 0.02 260)" }}>
                      {packages.map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {user?.role === "admin" && (
              <div className="space-y-2">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Nome Personalizado (Ex: TEST2026)</Label>
                <Input
                  placeholder="Deixe vazio para gerar aleatório"
                  value={form.customSuffix}
                  onChange={e => setForm({ ...form, customSuffix: e.target.value })}
                  style={{ background: "oklch(0.15 0.02 260)", border: "1px solid oklch(0.25 0.02 260)" }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Duração (Dias)</Label>
                <Input
                  type="number"
                  value={form.durationDays}
                  onChange={e => setForm({ ...form, durationDays: e.target.value })}
                  style={{ background: "oklch(0.15 0.02 260)", border: "1px solid oklch(0.25 0.02 260)" }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={form.count}
                  onChange={e => setForm({ ...form, count: e.target.value })}
                  style={{ background: "oklch(0.15 0.02 260)", border: "1px solid oklch(0.25 0.02 260)" }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label style={{ color: "oklch(0.7 0.02 260)" }}>Máx. Dispositivos</Label>
              <Input
                type="number"
                value={form.maxDevices}
                onChange={e => setForm({ ...form, maxDevices: e.target.value })}
                style={{ background: "oklch(0.15 0.02 260)", border: "1px solid oklch(0.25 0.02 260)" }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} className="w-full" disabled={createBulkMutation.isPending}
              style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))" }}>
              {createBulkMutation.isPending ? "Gerando..." : `Gerar ${form.count} Keys`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={!!showSuccess} onOpenChange={() => setShowSuccess(null)}>
        <DialogContent className="max-w-md" style={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <DialogTitle style={{ color: "oklch(0.95 0.01 260)" }}>Keys Geradas com Sucesso!</DialogTitle>
            </div>
          </DialogHeader>
          <div className="py-4">
            <div className="max-h-[300px] overflow-y-auto rounded-lg p-3 space-y-2" style={{ background: "oklch(0.08 0.01 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
              {showSuccess?.map((k, i) => (
                <div key={i} className="flex items-center justify-between group border-b border-[oklch(0.18_0.02_260)] last:border-0 pb-2 last:pb-0">
                  <code className="text-sm font-mono text-[oklch(0.75_0.15_260)]">{k}</code>
                  <button onClick={() => copyKey(k)} className="opacity-40 group-hover:opacity-100 transition-opacity p-1">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={copyAllKeys} className="flex-1 gap-2" variant="secondary" style={{ background: "oklch(0.65 0.22 260 / 0.2)", color: "oklch(0.75 0.15 260)" }}>
              <Copy className="w-4 h-4" /> Copiar Todas
            </Button>
            <Button onClick={() => setShowSuccess(null)} className="flex-1" variant="outline">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={!!showAction} onOpenChange={() => setShowAction(null)}>
        <DialogContent className="max-w-sm" style={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.95 0.01 260)" }}>
              {showAction?.action === "pause" && "Pausar Key"}
              {showAction?.action === "unpause" && "Reativar Key"}
              {showAction?.action === "ban" && "Banir Key"}
              {showAction?.action === "add_days" && "Adicionar Dias"}
              {showAction?.action === "delete" && "Excluir Key"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm" style={{ color: "oklch(0.7 0.02 260)" }}>
              Tem certeza que deseja realizar esta ação na key <span className="font-mono font-bold">{showAction?.key.key}</span>?
            </p>
            {(showAction?.action === "ban" || showAction?.action === "pause") && (
              <div className="space-y-2">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Motivo (Opcional)</Label>
                <Input
                  placeholder="Ex: Abuso de sistema"
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  style={{ background: "oklch(0.15 0.02 260)", border: "1px solid oklch(0.25 0.02 260)" }}
                />
              </div>
            )}
            {showAction?.action === "add_days" && (
              <div className="space-y-2">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Quantidade de Dias</Label>
                <Input
                  type="number"
                  value={actionDays}
                  onChange={e => setActionDays(e.target.value)}
                  style={{ background: "oklch(0.15 0.02 260)", border: "1px solid oklch(0.25 0.02 260)" }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAction(null)}>Cancelar</Button>
            <Button
              variant={showAction?.action === "delete" || showAction?.action === "ban" ? "destructive" : "default"}
              onClick={() => handleAction(showAction!.action)}
              disabled={actionMutation.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
