# 🚀 Documentação da API – AUTH FFH4X

Esta documentação descreve como integrar o sistema de autenticação **AUTH FFH4X** em seu projeto (C++, C#, Python, Android, etc.).

---

## 📌 Informações Gerais
- **URL Base:** `https://authffh4x.up.railway.app/api`
- **Package Token:** `PKG-ue2RH41zFXERvXtFMZ6qNfIB4i7q6DL3`
- **Formato de Resposta:** JSON

---

## 🔑 1. Validar Key (Login)
Este endpoint é usado para validar uma licença e vincular o dispositivo (HWID) do usuário.

- **Endpoint:** `POST /v1/validate_key`
- **Corpo da Requisição (JSON):**
```json
{
  "key": "SUA-KEY-AQUI",
  "hwid": "ID-UNICO-DO-DISPOSITIVO",
  "package_token": "PKG-ue2RH41zFXERvXtFMZ6qNfIB4i7q6DL3"
}
```

### 📥 Respostas Possíveis:

#### ✅ Sucesso (Key Válida/Ativada)
```json
{
  "status": "success",
  "message": "Key válida",
  "expires_in": 86400,
  "device": "authorized",
  "activated_at": "2024-04-23T12:00:00Z",
  "expires_at": "2024-04-24T12:00:00Z"
}
```

#### ❌ Erros Comuns
| Status | Mensagem | Descrição |
| :--- | :--- | :--- |
| `invalid` | Key inválida | A chave não existe no sistema. |
| `expired` | Key expirada | O tempo da licença acabou. |
| `banned` | Key banida | A chave foi bloqueada pelo administrador. |
| `paused` | Key pausada | A chave está temporariamente suspensa. |
| `device_limit` | Limite de dispositivos atingido | A chave já está em uso no número máximo de aparelhos. |
| `update_required` | Nova atualização disponível | O package exige que o usuário atualize o app. |

---

## 📊 2. Verificar Status do Package
Útil para verificar se o sistema está online ou se há uma atualização obrigatória antes de pedir a key.

- **Endpoint:** `GET /v1/package_status`
- **Headers:** `x-package-token: PKG-ue2RH41zFXERvXtFMZ6qNfIB4i7q6DL3`

### 📥 Resposta:
```json
{
  "status": "online",
  "message": "Sistema online",
  "package_name": "NOME_DO_SEU_PACKAGE",
  "contact": "https://t.me/seu_contato"
}
```

---

## 🛠 3. Exemplo de Integração (JavaScript/Web)
Abaixo, um exemplo de como você pode fazer a chamada usando `fetch`:

```javascript
async function validarAcesso(minhaKey, meuHwid) {
    const response = await fetch('https://authffh4x.up.railway.app/api/v1/validate_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            key: minhaKey,
            hwid: meuHwid,
            package_token: 'PKG-ue2RH41zFXERvXtFMZ6qNfIB4i7q6DL3'
        })
    });

    const data = await response.json();

    if (data.status === 'success') {
        alert('Acesso Liberado! Expira em: ' + (data.expires_in / 3600).toFixed(2) + ' horas');
    } else {
        alert('Erro: ' + data.message);
    }
}
```

---

## 📱 4. Dicas de Segurança
1. **HWID:** Sempre gere um ID único baseado no hardware do usuário (ex: Serial do HD, ID do Android, etc.) para evitar compartilhamento de contas.
2. **HTTPS:** Nunca use HTTP puro, a API da Railway exige HTTPS para garantir que os dados não sejam interceptados.
3. **Tratamento de Erros:** Sempre verifique o campo `status` da resposta antes de liberar as funções do seu projeto.
