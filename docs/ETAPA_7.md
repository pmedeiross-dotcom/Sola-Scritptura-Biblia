# Etapa 7 — Rastreamento de atividade

## Objetivo

Estabelecer rastreamento local de atividades úteis do usuário, com limite de retenção e validação defensiva, sem registrar dados desnecessários.

## Implementação concluída

- `src/activityTracking.ts` é usado pelo fluxo ativo de `App.tsx`.
- Persistência local em `activity-events-v1`.
- Limite de retenção: 200 eventos.
- Cada evento possui `id`, `type`, `label` e `timestamp`.
- Leitura defensiva descarta JSON inválido e registros incompatíveis.
- Eventos vazios são ignorados.
- O evento `screen_view / Tela: Library` continua sendo filtrado pelo módulo central.
- `appendActivityEvent` centraliza validação, filtragem, retenção e persistência.
- O rastreamento está habilitado no fluxo ativo.
- `App.tsx` inicializa o estado a partir do armazenamento persistido, sem apagar eventos na montagem.
- Os pontos de rastreamento existentes para notas, planos, importações, metas e onboarding continuam utilizando `trackActivity`.
- Exportação/importação de backup já inclui `activityEvents`.
- Limpeza manual de atividade continua disponível e remove o armazenamento persistido.

## Validação

A alteração foi validada no workflow da etapa com `npm ci`, `npm run lint`, `npm run build` e `npm run check`, todos concluídos sem erro. O build mantém apenas os avisos existentes de chunks grandes.

## Resultado

**Etapa 7 concluída.** O rastreamento persistente está integrado ao fluxo ativo sem limpeza automática e com retenção/filtragem centralizadas.
