# AUTH FFH4X – TODO

## Fase 1: Schema e Estrutura Base
- [x] Schema do banco: tabelas appUsers, keys, devices, packages, prefixes, logs, credits
- [x] Migração SQL aplicada
- [x] Seed do admin padrão (RUAN / RUAN00)

## Fase 2: Backend – Autenticação e Routers
- [x] Sistema de login próprio (usuário/senha + bcrypt + JWT)
- [x] Middleware de autenticação JWT para rotas protegidas
- [x] Router: auth (login, logout, me)
- [x] Router: admin/users (CRUD, ban, unban, alterar senha, ver keys)
- [x] Router: admin/keys (criar, listar, pausar, banir, desbanir, excluir, adicionar dias)
- [x] Router: admin/packages (criar, listar, pausar, forçar update, link contato)
- [x] Router: admin/prefixes (criar, listar, excluir)
- [x] Router: admin/credits (adicionar créditos a revendedores)
- [x] Router: admin/logs (listar logs paginados)
- [x] Router: admin/dashboard (estatísticas gerais)
- [x] Router: reseller (dashboard, keys próprias, packages próprios)

## Fase 3: API Pública iOS
- [x] POST /v1/login
- [x] POST /v1/validate_key (com HWID, inicia contagem na primeira ativação)
- [x] GET /v1/package_status
- [x] GET /v1/message
- [x] Respostas JSON padronizadas (status, message, expires_in, device)
- [x] Rate limiting nos endpoints públicos

## Fase 4: Frontend – Layout e Páginas Base
- [x] Tema visual elegante (dark, cores refinadas, tipografia premium)
- [x] Página de login customizada (sem OAuth Manus)
- [x] DashboardLayout com sidebar para admin e revendedor
- [x] Página Dashboard Admin (estatísticas, logs recentes)

## Fase 5: Frontend – Páginas Completas
- [x] Página de Keys (criar, listar, ações)
- [x] Página de Packages (criar, listar, ações)
- [x] Página de Usuários (criar, listar, ações)
- [x] Página de Prefixos (criar, listar)
- [x] Página de Créditos (admin adiciona créditos)
- [x] Página de Logs (tabela paginada)
- [x] Painel do Revendedor (dashboard, keys, packages limitados)
- [x] Documentação da API (endpoint reference)

## Fase 6: Testes e Entrega
- [x] Testes vitest para routers principais (21 testes passando)
- [x] Verificação de todas as funcionalidades
- [x] Checkpoint final
