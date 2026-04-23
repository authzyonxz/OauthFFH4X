import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useFFHAuth } from "@/contexts/FFHAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Prefixes() {
  const { user } = useFFHAuth();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: prefixes = [], isLoading } = trpc.prefixes.list.useQuery();

  const createMutation = trpc.prefixes.create.useMutation({
    onSuccess: () => {
      toast.success("Prefixo criado!");
      utils.prefixes.list.invalidate();
      setShowCreate(false);
      setNewName("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.prefixes.delete.useMutation({
    onSuccess: () => {
      toast.success("Prefixo excluído!");
      utils.prefixes.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const limit = user?.role === "reseller" ? 3 : Infinity;

  return (
    <div className="space-y-5 fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "oklch(0.95 0.01 260)" }}>Prefixos</h1>
          <p className="text-sm mt-0.5" style={{ color: "oklch(0.5 0.02 260)" }}>
            {prefixes.length}{user?.role === "reseller" ? "/3" : ""} prefixos
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          disabled={prefixes.length >= limit}
          className="gap-2"
          style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))", color: "oklch(0.98 0.005 260)" }}>
          <Plus className="w-4 h-4" /> Novo Prefixo
        </Button>
      </div>

      {user?.role === "reseller" && (
        <div className="rounded-lg p-3" style={{ background: "oklch(0.65 0.22 260 / 0.08)", border: "1px solid oklch(0.65 0.22 260 / 0.2)" }}>
          <p className="text-xs" style={{ color: "oklch(0.65 0.22 260)" }}>
            Revendedores podem criar no máximo 3 prefixos. Você tem {prefixes.length}/3.
          </p>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
        <table className="ffh-table">
          <thead>
            <tr>
              <th>Prefixo</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: "oklch(0.18 0.02 260)" }} /></td>
                  ))}
                </tr>
              ))
            ) : prefixes.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12">
                  <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "oklch(0.5 0.02 260)" }} />
                  <p style={{ color: "oklch(0.45 0.02 260)" }}>Nenhum prefixo criado</p>
                </td>
              </tr>
            ) : (
              prefixes.map((p: any) => (
                <tr key={p.id}>
                  <td>
                    <span className="font-mono font-semibold" style={{ color: "oklch(0.75 0.15 260)" }}>{p.name}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>
                      {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => deleteMutation.mutate({ prefixId: p.id })}
                      className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.22 25)" }} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.01 260)" }}>
              <Tag className="w-4 h-4 inline mr-2" style={{ color: "oklch(0.65 0.22 260)" }} />
              Criar Prefixo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.7 0.02 260)" }}>Nome (apenas letras, números e _)</Label>
              <Input
                placeholder="Ex: FFH4X"
                value={newName}
                onChange={e => setNewName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                className="font-mono"
                style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}
              />
              <p className="text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>
                Resultado: {newName || "PREFIXO"}-30day-XXXXXXXXXXXXXXX
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1"
                style={{ borderColor: "oklch(0.22 0.02 260)", color: "oklch(0.7 0.02 260)" }}>
                Cancelar
              </Button>
              <Button onClick={() => createMutation.mutate({ name: newName })} disabled={createMutation.isPending || !newName} className="flex-1"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))", color: "oklch(0.98 0.005 260)" }}>
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
