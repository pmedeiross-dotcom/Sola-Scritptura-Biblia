# Etapa 6 — Progresso de estudo

## Objetivo

Criar uma fonte persistente e explícita para registrar dias de planos concluídos, sem tratar valores demonstrativos ou passagem do tempo como progresso real do usuário.

## Implementação

- Adicionado `src/studyProgress.ts`.
- Persistência versionada em `localStorage` com a chave `study-progress-v1`.
- Cada conclusão é identificada por `planId + day` e registra `completedAt`.
- Leitura do armazenamento é defensiva: JSON inválido ou estrutura incompatível retorna estado vazio.
- `toggleStudyDay` permite concluir/desmarcar um dia sem duplicação.
- `getStudyPlanProgress` calcula dias concluídos e percentual a partir dos registros reais.

## Limite desta etapa

A integração visual dos planos existentes em `App.tsx` e `HomeScreenV3.tsx` ainda requer alteração localizada nesses componentes. Esta entrega estabelece o modelo persistente sem substituir arquivos grandes.
