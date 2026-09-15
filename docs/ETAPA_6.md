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
- `App.tsx` mantém o estado persistente de progresso em memória e grava as alterações no armazenamento.
- A tela ativa de Planos de Leitura passou a exibir progresso e próximo dia com base nos registros reais.
- O botão `Continuar Leitura` usa o próximo dia derivado do progresso persistente.
- A tela ativa permite concluir o próximo dia explicitamente.
- O backup geral exporta e restaura `study-progress-v1`.
- A Home continua usando o mesmo modelo persistente para resolver o próximo alvo do plano.

## Validação

- A integração foi executada em branch isolada.
- `npm ci`, `npm run lint` e `npm run build` foram executados com sucesso antes da consolidação da branch.
- A validação contínua do repositório também passou no commit de integração anterior.

## Resultado

Etapa 6 concluída para os planos estáticos ativos. O modelo persistente está integrado à Home, à tela ativa de Planos de Leitura e ao backup/restauração.

## Limite

Planos personalizados continuam com a lógica própria baseada em `startDate`/cronograma existente; não foram convertidos automaticamente para o modelo de conclusão diária da Etapa 6 para evitar mudança de comportamento sem uma regra explícita de migração.
