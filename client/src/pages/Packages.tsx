import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Copy, Pause, Play, Zap, Link, Package, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Packages() {
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [editForm, setEditForm] = useState({ contactLink: "", updateMessage: "" });

  const { data: packages = [], isLoading } = trpc.packages.list.useQuery();

  const createMutation = trpc.packages.create.useMutation({
    onSuccess: () => {
      toast.success("Package criado!");
      utils.packages.list.invalidate();
      setShowCreate(false);
      setNewName("");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.packages.update.useMutation({
    onSuccess: () => {
      toast.success("Package atualizado!");
      utils.packages.list.invalidate();
      setShowEdit(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copiado!");
  };

  const togglePause = (pkg: any) => {
    updateMutation.mutate({ packageId: pkg.id, isPaused: !pkg.isPaused });
  };

  const toggleForceUpdate = (pkg: any) => {
    updateMutation.mutate({ packageId: pkg.id, forceUpdate: !pkg.forceUpdate });
  };

  return (
    <div className="space-y-5 fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "oklch(0.95 0.01 260)" }}>Packages</h1>
          <p className="text-sm mt-0.5" style={{ color: "oklch(0.5 0.02 260)" }}>{packages.length} packages</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2"
          style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))", color: "oklch(0.98 0.005 260)" }}>
          <Plus className="w-4 h-4" /> Novo Package
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)", height: "200px" }} />
          ))
        ) : packages.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "oklch(0.5 0.02 260)" }} />
            <p style={{ color: "oklch(0.45 0.02 260)" }}>Nenhum package criado</p>
          </div>
        ) : (
          packages.map((pkg: any) => (
            <div key={pkg.id} className="rounded-xl p-5 transition-all duration-200 hover:border-[oklch(0.3_0.04_260)]"
              style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold" style={{ color: "oklch(0.92 0.01 260)" }}>{pkg.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.02 260)" }}>
                    {formatDistanceToNow(new Date(pkg.createdAt), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {pkg.isPaused ? (
                    <span className="status-pill status-paused">Pausado</span>
                  ) : (
                    <span className="status-pill status-active">Online</span>
                  )}
                </div>
              </div>

              {/* Token */}
              <div className="rounded-lg p-2.5 mb-4" style={{ background: "oklch(0.14 0.02 260)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono truncate" style={{ color: "oklch(0.6 0.02 260)" }}>{pkg.token}</span>
                  <button onClick={() => copyToken(pkg.token)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                    <Copy className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.22 260)" }} />
                  </button>
                </div>
              </div>

              {/* Flags */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {pkg.forceUpdate && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.75 0.18 85 / 0.15)", color: "oklch(0.75 0.18 85)" }}>
                    Update Forçado
                  </span>
                )}
                {pkg.contactLink && (
                  <a href={pkg.contactLink} target="_blank" rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
                    style={{ color: "oklch(0.65 0.22 260)" }}>
                    <Link className="w-3 h-3" /> Contato
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => togglePause(pkg)}
                  className="flex-1 gap-1.5 text-xs h-8"
                  style={{ borderColor: "oklch(0.22 0.02 260)", color: pkg.isPaused ? "oklch(0.65 0.18 145)" : "oklch(0.75 0.18 85)" }}>
                  {pkg.isPaused ? <><Play className="w-3 h-3" /> Reativar</> : <><Pause className="w-3 h-3" /> Pausar</>}
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleForceUpdate(pkg)}
                  className="flex-1 gap-1.5 text-xs h-8"
                  style={{ borderColor: "oklch(0.22 0.02 260)", color: pkg.forceUpdate ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 260)" }}>
                  {pkg.forceUpdate ? <><CheckCircle className="w-3 h-3" /> Cancelar Update</> : <><Zap className="w-3 h-3" /> Forçar Update</>}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowEdit(pkg); setEditForm({ contactLink: pkg.contactLink || "", updateMessage: pkg.updateMessage || "" }); }}
                  className="h-8 px-2.5"
                  style={{ borderColor: "oklch(0.22 0.02 260)", color: "oklch(0.6 0.02 260)" }}>
                  <Link className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.01 260)" }}>
              <Package className="w-4 h-4 inline mr-2" style={{ color: "oklch(0.65 0.22 260)" }} />
              Criar Package
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.7 0.02 260)" }}>Nome do Package</Label>
              <Input
                placeholder="Ex: MeuApp iOS"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}
              />
            </div>
            <p className="text-xs" style={{ color: "oklch(0.45 0.02 260)" }}>
              Um token único será gerado automaticamente para integração com a API.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1"
                style={{ borderColor: "oklch(0.22 0.02 260)", color: "oklch(0.7 0.02 260)" }}>
                Cancelar
              </Button>
              <Button onClick={() => createMutation.mutate({ name: newName })} disabled={createMutation.isPending || !newName} className="flex-1"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))", color: "oklch(0.98 0.005 260)" }}>
                {createMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.22 0.02 260)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(0.92 0.01 260)" }}>Editar Package: {showEdit?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.7 0.02 260)" }}>Link de Contato</Label>
              <Input
                placeholder="https://t.me/seuperfil"
                value={editForm.contactLink}
                onChange={e => setEditForm(f => ({ ...f, contactLink: e.target.value }))}
                style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "oklch(0.7 0.02 260)" }}>Mensagem de Update</Label>
              <Input
                placeholder="Nova versão disponível!"
                value={editForm.updateMessage}
                onChange={e => setEditForm(f => ({ ...f, updateMessage: e.target.value }))}
                style={{ background: "oklch(0.14 0.015 260)", border: "1px solid oklch(0.22 0.02 260)", color: "oklch(0.88 0.01 260)" }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEdit(null)} className="flex-1"
                style={{ borderColor: "oklch(0.22 0.02 260)", color: "oklch(0.7 0.02 260)" }}>
                Cancelar
              </Button>
              <Button onClick={() => updateMutation.mutate({ packageId: showEdit.id, ...editForm })} disabled={updateMutation.isPending} className="flex-1"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 260), oklch(0.6 0.22 290))", color: "oklch(0.98 0.005 260)" }}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
