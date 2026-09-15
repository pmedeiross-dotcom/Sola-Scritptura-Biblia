# Etapa 7 — Rastreamento de atividade

## Objetivo

Estabelecer rastreamento local de atividades úteis do usuário, com limite de retenção e validação defensiva, sem registrar dados desnecessários.

## Implementação inicial

- Criado `src/activityTracking.ts`.
- Persistência em `localStorage` com a chave `activity-events-v1`.
- Limite de retenção: 200 eventos.
- Eventos possuem `id`, `type`, `label` e `timestamp`.
- Leitura tolera JSON inválido e descarta registros incompatíveis.
- Eventos vazios e o evento considerado inútil `screen_view / Tela: Library` são ignorados.
- `appendActivityEvent` centraliza a inclusão e a persistência.

## Pendências

- Integrar o módulo ao fluxo ativo de `App.tsx`.
- Remover a limpeza automática que apaga `activity-events-v1` a cada montagem, caso ainda esteja presente.
- Revisar os pontos de chamada para registrar somente ações úteis.
- Validar que a atividade não interfira no desempenho nem na privacidade local.
- Executar lint/build/check antes de marcar a etapa como concluída.
