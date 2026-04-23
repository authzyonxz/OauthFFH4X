import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Ban, Shield, Key, CreditCard, Lock, Users as UsersIcon, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Users() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showCredits, setShowCredits] = useState<any>(null);
  const [showBan, setShowBan] = useState<any>(null);
  const [showPassword, setShowPassword] = useState<any>(null);
  const [creditsAmount, setCreditsAmount] = useState("10");
  const [creditsReason, setCreditsReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [form, setForm] = useState({
    username: "", password: "", role: "reseller" as "admin" | "reseller",
    plan: "monthly" as "monthly" | "annual", credits: "0", accountExpiresAt: "",
  });

  const { data: users = [], isLoading } = trpc.users.list.useQuery();

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado!");
      utils.users.list.invalidate();
      setShowCreate(false);
      setForm({ username: "", password: "", role: "reseller", plan: "monthly", credits: "0", accountExpiresAt: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const banMutation = trpc.users.ban.useMutation({
    onSuccess: () => { toast.success("Usuário banido!"); utils.users.list.invalidate(); setShowBan(null); setBanReason(""); },
    onError: (e) => toast.error(e.message),
  });

  const unbanMutation = trpc.users.unban.useMutation({
    onSuccess: () => { toast.success("Usuário desbanido!"); utils.users.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const creditsMutation = trpc.users.addCredits.useMutation({
    onSuccess: () => { toast.success("Créditos adicionados!"); utils.users.list.invalidate(); setShowCredits(null); setCreditsAmount("10"); setCreditsReason(""); },
    onError: (e) => toast.error(e.message),
  });

  const passwordMutation = trpc.users.changePassword.useMutation({
    onSuccess: () => { toast.success("Senha alterada!"); setShowPassword(null); setNewPassword(""); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = users.filter((u: any) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "oklch(0.95 0.01 260)" }}>Usuários</h1>
          <p className="text-sm mt-0.5" style={{ color: "oklch(0.5 0.02 260)" }}>{users.length} usuários</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2"
          style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))", color: "oklch(0.98 0.005 260)" }}>
          <Plus className="w-4 h-4" /> Novo Usuário
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(0.45 0.02 260)" }} />
        <Input placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10"
          style={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
        <div className="overflow-x-auto">
          <table className="ffh-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Função</th>
                <th>Plano</th>
                <th>Créditos</th>
                <th>Status</th>
                <th>Último login</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: "oklch(0.18 0.02 260)" }} /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "oklch(0.5 0.02 260)" }} />
                  <p style={{ color: "oklch(0.45 0.02 260)" }}>Nenhum usuário encontrado</p>
                </td></tr>
              ) : (
                filtered.map((u: any) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "oklch(0.65 0.22 260 / 0.15)", color: "oklch(0.75 0.15 260)" }}>
                          {u.username[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium" style={{ color: "oklch(0.88 0.01 260)" }}>{u.username}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${u.role === "admin" ? "status-active" : "status-inactive"}`}>
                        {u.role === "admin" ? "Admin" : "Revendedor"}
                      </span>
                    </td>
                    <td><span className="text-xs" style={{ color: "oklch(0.6 0.02 260)" }}>{u.plan === "annual" ? "Anual" : "Mensal"}</span></td>
                    <td><span className="font-mono text-sm" style={{ color: "oklch(0.75 0.18 85)" }}>{u.credits}</span></td>
                    <td>
                      <span className={`status-pill ${u.isBanned ? "status-banned" : "status-active"}`}>
                        {u.isBanned ? "Banido" : "Ativo"}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>
                        {u.lastLoginAt ? formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true, locale: ptBR }) : "Nunca"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowCredits(u)} title="Créditos"
                          className="p-1.5 rounded hover:bg-yellow-500/10 transition-colors">
                          <CreditCard className="w-3.5 h-3.5" style={{ color: "oklch(0.75 0.18 85)" }} />
                        </button>
                        <button onClick={() => setShowPassword(u)} title="Alterar senha"
                          className="p-1.5 rounded hover:bg-blue-500/10 transition-colors">
                          <Lock className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.22 260)" }} />
                        </button>
                        {u.isBanned ? (
                          <button onClick={() => unbanMutation.mutate({ userId: u.id })} title="Desbanir"
                            className="p-1.5 rounded hover:bg-green-500/10 transition-colors">
                            <Shield className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 145)" }} />
                          </button>
                        ) : (
                          <button onClick={() => setShowBan(u)} title="Banir"
                            className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
                            <Ban className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.22 25)" }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.01 260)" }}>Criar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {[
              { label: "Usuário", key: "username", placeholder: "nome_usuario", type: "text" },
              { label: "Senha", key: "password", placeholder: "••••••••", type: "password" },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>{f.label}</Label>
                <Input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }} />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Função</Label>
                <Select value={form.role} onValueChange={(v: any) => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
                    <SelectItem value="reseller" style={{ color: "oklch(0.88 0.01 260)" }}>Revendedor</SelectItem>
                    <SelectItem value="admin" style={{ color: "oklch(0.88 0.01 260)" }}>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Plano</Label>
                <Select value={form.plan} onValueChange={(v: any) => setForm(f => ({ ...f, plan: v }))}>
                  <SelectTrigger style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
                    <SelectItem value="monthly" style={{ color: "oklch(0.88 0.01 260)" }}>Mensal</SelectItem>
                    <SelectItem value="annual" style={{ color: "oklch(0.88 0.01 260)" }}>Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Créditos iniciais</Label>
                <Input type="number" min="0" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: e.target.value }))}
                  style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }} />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Expira em (opcional)</Label>
                <Input type="date" value={form.accountExpiresAt} onChange={e => setForm(f => ({ ...f, accountExpiresAt: e.target.value }))}
                  style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1"
                style={{ borderColor: "oklch(0.22 0.02 260)", color: "oklch(0.7 0.02 260)" }}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate({ ...form, credits: parseInt(form.credits), accountExpiresAt: form.accountExpiresAt || undefined })}
                disabled={createMutation.isPending} className="flex-1"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))", color: "oklch(0.98 0.005 260)" }}>
                {createMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credits Dialog */}
      <Dialog open={!!showCredits} onOpenChange={() => setShowCredits(null)}>
        <DialogContent style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.01 260)" }}>Adicionar Créditos — {showCredits?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.7 0.02 260)" }}>Quantidade</Label>
              <Input type="number" min="1" value={creditsAmount} onChange={e => setCreditsAmount(e.target.value)}
                style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.7 0.02 260)" }}>Motivo (opcional)</Label>
              <Input placeholder="Ex: Pagamento mensal" value={creditsReason} onChange={e => setCreditsReason(e.target.value)}
                style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCredits(null)} className="flex-1"
                style={{ borderColor: "oklch(0.22 0.02 260)", color: "oklch(0.7 0.02 260)" }}>Cancelar</Button>
              <Button onClick={() => creditsMutation.mutate({ userId: showCredits.id, amount: parseInt(creditsAmount), reason: creditsReason || undefined })}
                disabled={creditsMutation.isPending} className="flex-1"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))", color: "oklch(0.98 0.005 260)" }}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={!!showBan} onOpenChange={() => setShowBan(null)}>
        <DialogContent style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.01 260)" }}>Banir Usuário — {showBan?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.7 0.02 260)" }}>Motivo</Label>
              <Input placeholder="Motivo do banimento..." value={banReason} onChange={e => setBanReason(e.target.value)}
                style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBan(null)} className="flex-1"
                style={{ borderColor: "oklch(0.22 0.02 260)", color: "oklch(0.7 0.02 260)" }}>Cancelar</Button>
              <Button onClick={() => banMutation.mutate({ userId: showBan.id, reason: banReason || undefined })}
                disabled={banMutation.isPending} className="flex-1"
                style={{ background: "oklch(0.55 0.22 25)", color: "oklch(0.98 0.005 260)" }}>
                Banir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={!!showPassword} onOpenChange={() => setShowPassword(null)}>
        <DialogContent style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.01 260)" }}>Alterar Senha — {showPassword?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.7 0.02 260)" }}>Nova Senha</Label>
              <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPassword(null)} className="flex-1"
                style={{ borderColor: "oklch(0.22 0.02 260)", color: "oklch(0.7 0.02 260)" }}>Cancelar</Button>
              <Button onClick={() => passwordMutation.mutate({ userId: showPassword.id, newPassword })}
                disabled={passwordMutation.isPending || !newPassword} className="flex-1"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))", color: "oklch(0.98 0.005 260)" }}>
                Alterar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
