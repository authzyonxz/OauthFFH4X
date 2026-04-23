import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CreditCard, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Credits() {
  const utils = trpc.useUtils();
  const { data: transactions = [], isLoading } = trpc.credits.history.useQuery();
  const { data: users = [] } = trpc.users.list.useQuery();

  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const addCreditsMutation = trpc.users.addCredits.useMutation({
    onSuccess: () => {
      toast.success("Créditos adicionados com sucesso!");
      utils.credits.history.invalidate();
      utils.users.list.invalidate();
      setOpen(false);
      setUserId("");
      setAmount("");
      setReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  const resellerUsers = users.filter((u: any) => u.role === "reseller");

  const handleAdd = () => {
    if (!userId || !amount) return toast.error("Preencha todos os campos obrigatórios");
    const amt = parseInt(amount);
    if (isNaN(amt) || amt <= 0) return toast.error("Quantidade inválida");
    addCreditsMutation.mutate({ userId: parseInt(userId), amount: amt, reason });
  };

  return (
    <div className="space-y-5 fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "oklch(0.95 0.01 260)" }}>Créditos</h1>
          <p className="text-sm mt-0.5" style={{ color: "oklch(0.5 0.02 260)" }}>Gerenciar créditos de revendedores</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 font-semibold"
              style={{ background: "oklch(0.65 0.22 260)", color: "white" }}>
              <Plus className="w-4 h-4" />
              Adicionar Créditos
            </Button>
          </DialogTrigger>
          <DialogContent style={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.9 0.01 260)" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "oklch(0.95 0.01 260)" }}>Adicionar Créditos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Revendedor *</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.25 0.02 260)", color: "oklch(0.88 0.01 260)" }}>
                    <SelectValue placeholder="Selecionar revendedor" />
                  </SelectTrigger>
                  <SelectContent style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.25 0.02 260)" }}>
                    {resellerUsers.length === 0 ? (
                      <SelectItem value="_none" disabled style={{ color: "oklch(0.5 0.02 260)" }}>Nenhum revendedor cadastrado</SelectItem>
                    ) : (
                      resellerUsers.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)} style={{ color: "oklch(0.88 0.01 260)" }}>
                          {u.username} — {u.credits ?? 0} créditos atuais
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Quantidade *</Label>
                <Input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="Ex: 50"
                  style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.25 0.02 260)", color: "oklch(0.88 0.01 260)" }} />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: "oklch(0.7 0.02 260)" }}>Motivo (opcional)</Label>
                <Input value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Ex: Recarga mensal"
                  style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.25 0.02 260)", color: "oklch(0.88 0.01 260)" }} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1"
                  style={{ borderColor: "oklch(0.25 0.02 260)", color: "oklch(0.7 0.02 260)" }}>
                  Cancelar
                </Button>
                <Button onClick={handleAdd} disabled={addCreditsMutation.isPending} className="flex-1"
                  style={{ background: "oklch(0.65 0.22 260)", color: "white" }}>
                  {addCreditsMutation.isPending ? "Adicionando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reseller balances */}
      {resellerUsers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {resellerUsers.map((u: any) => (
            <div key={u.id} className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.65 0.22 260 / 0.15)" }}>
                <CreditCard className="w-5 h-5" style={{ color: "oklch(0.65 0.22 260)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "oklch(0.88 0.01 260)" }}>{u.username}</p>
                <p className="text-xs" style={{ color: "oklch(0.5 0.02 260)" }}>
                  <span className="font-bold text-base" style={{ color: "oklch(0.75 0.18 85)" }}>{u.credits ?? 0}</span> créditos
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction history */}
      <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: "oklch(0.18 0.02 260)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "oklch(0.75 0.01 260)" }}>Histórico de Transações</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="ffh-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Usuário</th>
                <th>Quantidade</th>
                <th>Motivo</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                    <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: "oklch(0.18 0.02 260)" }} /></td>
                  ))}</tr>
                ))
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "oklch(0.5 0.02 260)" }} />
                  <p style={{ color: "oklch(0.45 0.02 260)" }}>Nenhuma transação registrada</p>
                </td></tr>
              ) : (
                transactions.map((t: any) => (
                  <tr key={t.id}>
                    <td>
                      {t.amount > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.65 0.18 145)" }} />
                          <span className="text-xs font-semibold" style={{ color: "oklch(0.65 0.18 145)" }}>Adição</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <TrendingDown className="w-4 h-4" style={{ color: "oklch(0.55 0.22 25)" }} />
                          <span className="text-xs font-semibold" style={{ color: "oklch(0.55 0.22 25)" }}>Consumo</span>
                        </div>
                      )}
                    </td>
                    <td><span className="font-medium" style={{ color: "oklch(0.88 0.01 260)" }}>{t.username || `#${t.userId}`}</span></td>
                    <td>
                      <span className="font-mono font-bold" style={{ color: t.amount > 0 ? "oklch(0.65 0.18 145)" : "oklch(0.55 0.22 25)" }}>
                        {t.amount > 0 ? "+" : ""}{t.amount}
                      </span>
                    </td>
                    <td><span className="text-sm" style={{ color: "oklch(0.6 0.02 260)" }}>{t.reason || "—"}</span></td>
                    <td>
                      <span className="text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>
                        {format(new Date(t.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
