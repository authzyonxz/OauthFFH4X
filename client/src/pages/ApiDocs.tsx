import { useState } from "react";
import { Copy, Zap, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = window.location.origin;

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/login",
    title: "Login de Usuário",
    desc: "Autentica um usuário e retorna um token JWT.",
    body: `{
  "username": "RUAN",
  "password": "RUAN00"
}`,
    response: `{
  "status": "success",
  "message": "Login realizado com sucesso",
  "token": "eyJhbGci...",
  "expires_in": 86400,
  "device": "authorized"
}`,
  },
  {
    method: "POST",
    path: "/api/v1/validate_key",
    title: "Validar Key",
    desc: "Valida uma key de licença com HWID do dispositivo. Na primeira chamada, ativa a key e inicia o contador de tempo.",
    body: `{
  "key": "FFH4X-30day-A9XK2L8QW3ZP1MN",
  "hwid": "DEVICE-UNIQUE-ID-123",
  "package_token": "pkg_token_aqui"
}`,
    response: `{
  "status": "success",
  "message": "key valid",
  "expires_in": 2592000,
  "device": "authorized"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/package_status?token=SEU_TOKEN",
    title: "Status do Package",
    desc: "Retorna o status atual do package (online/pausado/update requerido).",
    body: null,
    response: `{
  "status": "success",
  "message": "online",
  "expires_in": 0,
  "device": "authorized",
  "package_name": "MeuApp",
  "contact": "https://t.me/suporte"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/message?token=SEU_TOKEN",
    title: "Mensagem do Sistema",
    desc: "Retorna uma mensagem do sistema para exibir no app.",
    body: null,
    response: `{
  "status": "success",
  "message": "Bem-vindo ao AUTH FFH4X!",
  "expires_in": 0,
  "device": "authorized"
}`,
  },
];

const errorCodes = [
  { code: "key_invalid", desc: "Key não encontrada ou inválida" },
  { code: "key_expired", desc: "Key expirada" },
  { code: "key_banned", desc: "Key banida" },
  { code: "key_paused", desc: "Key pausada pelo administrador" },
  { code: "device_limit", desc: "Limite de dispositivos atingido" },
  { code: "device_banned", desc: "Dispositivo banido" },
  { code: "package_paused", desc: "Package pausado" },
  { code: "update_required", desc: "Atualização obrigatória do app" },
  { code: "wrong_package", desc: "Key não pertence a este package" },
];

function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copiado!");
  };
  return (
    <div className="relative rounded-lg overflow-hidden" style={{ background: "oklch(0.09 0.012 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: "oklch(0.18 0.02 260)" }}>
        <span className="text-xs font-mono" style={{ color: "oklch(0.45 0.02 260)" }}>{lang}</span>
        <button onClick={copy} className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
          style={{ color: copied ? "oklch(0.65 0.18 145)" : "oklch(0.5 0.02 260)" }}>
          {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="p-4 text-xs overflow-x-auto font-mono leading-relaxed" style={{ color: "oklch(0.78 0.08 260)" }}>
        {code}
      </pre>
    </div>
  );
}

export default function ApiDocs() {
  return (
    <div className="space-y-6 fade-in-up max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "oklch(0.95 0.01 260)" }}>Documentação da API</h1>
        <p className="text-sm mt-0.5" style={{ color: "oklch(0.5 0.02 260)" }}>
          Endpoints públicos para integração com apps iOS — versão v1
        </p>
      </div>

      {/* Base URL */}
      <div className="rounded-xl p-4" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.5 0.02 260)" }}>Base URL</p>
        <CodeBlock code={`${BASE_URL}/api`} lang="url" />
      </div>

      {/* Response Format */}
      <div className="rounded-xl p-4" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.88 0.01 260)" }}>Formato Padrão de Resposta</h2>
        <CodeBlock code={`{
  "status": "success" | "error",
  "message": "Descrição do resultado",
  "expires_in": 86400,
  "device": "authorized" | "unauthorized"
}`} />
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        {endpoints.map((ep, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
            <div className="px-5 py-4 border-b flex items-start gap-3" style={{ borderColor: "oklch(0.18 0.02 260)" }}>
              <span className="px-2.5 py-1 rounded text-xs font-bold font-mono flex-shrink-0"
                style={{
                  background: ep.method === "POST" ? "oklch(0.65 0.22 260 / 0.15)" : "oklch(0.65 0.18 145 / 0.15)",
                  color: ep.method === "POST" ? "oklch(0.65 0.22 260)" : "oklch(0.65 0.18 145)",
                }}>
                {ep.method}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono" style={{ color: "oklch(0.85 0.01 260)" }}>{ep.path}</code>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.5 0.02 260)" }}>{ep.desc}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {ep.body && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.5 0.02 260)" }}>Request Body</p>
                  <CodeBlock code={ep.body} />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.5 0.02 260)" }}>Response</p>
                <CodeBlock code={ep.response} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Codes */}
      <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "oklch(0.18 0.02 260)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "oklch(0.88 0.01 260)" }}>Códigos de Erro</h2>
        </div>
        <table className="ffh-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {errorCodes.map((e, i) => (
              <tr key={i}>
                <td><code className="text-xs font-mono" style={{ color: "oklch(0.65 0.22 25)" }}>{e.code}</code></td>
                <td><span className="text-sm" style={{ color: "oklch(0.7 0.01 260)" }}>{e.desc}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* iOS Integration Example */}
      <div className="rounded-xl p-5" style={{ background: "oklch(0.11 0.015 260)", border: "1px solid oklch(0.2 0.02 260)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" style={{ color: "oklch(0.75 0.18 85)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "oklch(0.88 0.01 260)" }}>Exemplo de Integração Swift (iOS)</h2>
        </div>
        <CodeBlock lang="swift" code={`// Validar key no app iOS
func validateKey(key: String, hwid: String) async throws {
    let url = URL(string: "${BASE_URL}/api/v1/validate_key")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = ["key": key, "hwid": hwid, "package_token": "SEU_TOKEN"]
    request.httpBody = try JSONEncoder().encode(body)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(APIResponse.self, from: data)
    
    if response.status == "success" {
        // Key válida — liberar acesso
        print("Expira em: \\(response.expires_in) segundos")
    } else {
        // Exibir mensagem de erro
        showError(response.message)
    }
}

struct APIResponse: Codable {
    let status: String
    let message: String
    let expires_in: Int
    let device: String
}`} />
      </div>
    </div>
  );
}
