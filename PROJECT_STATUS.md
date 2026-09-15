# Sola Scriptura Bíblia - Registro do Projeto

> Registro operacional para manter o contexto técnico entre etapas. Atualizar este arquivo após mudanças estruturais relevantes.

## Estado de referência

- Branch de produção: `main`
- Aplicação: React + Vite + TypeScript
- Arquivo principal: `src/App.tsx`
- Home atualmente integrada: `HomeScreenV3`
- Deploy: Vercel acompanha `main`

## Etapas do plano

1. Leitor: rolagem e navegação: **CONCLUÍDA**
2. Estudo: rolagem e controles: **CONCLUÍDA**
3. Salvar Estudo em Anotações: **CONCLUÍDA**
4. Auditoria de Anotações e persistência: **CONCLUÍDA — auditoria realizada; migração IndexedDB/localStorage ainda não executada**
5. Importação/exportação: **CONCLUÍDA — implementação existente auditada e documentada**
6. Progresso de estudo: **EM ANDAMENTO — integração inicial com a Home concluída; integração com a tela ativa de planos/backup ainda pendente**
7. Rastreamento de atividade: **EM ANDAMENTO — modelo persistente criado; integração com o fluxo ativo ainda pendente**
8. Parser bíblico e Strong: **PENDENTE**
9. Confissões/IA: **PENDENTE**
10. Arquitetura e performance: **PENDENTE**
11. Qualidade, CI e Vercel: **EM ANDAMENTO**
12. Evolução visual da Home: **PENDENTE**

## Etapa 6: Progresso de estudo — em andamento

- `src/studyProgress.ts` é a fonte persistente versionada para dias explicitamente concluídos.
- Chave: `study-progress-v1`.
- `HomeScreenV3` já consome o progresso real e permite concluir o próximo dia dos planos estáticos.
- Pendências: integrar a tela ativa de planos, fazer `Continuar` respeitar o próximo dia não concluído, incluir no backup/restauração e validar persistência completa.

## Etapa 7: Rastreamento de atividade — em andamento

### Implementação inicial

- Criado `src/activityTracking.ts`.
- Persistência local em `activity-events-v1`.
- Limite de retenção: 200 eventos.
- Cada evento possui `id`, `type`, `label` e `timestamp`.
- Leitura defensiva descarta JSON inválido e registros incompatíveis.
- Eventos vazios são ignorados.
- O evento `screen_view / Tela: Library`, já classificado como inútil no fluxo existente, continua sendo filtrado.
- `appendActivityEvent` centraliza validação, limite e persistência.
- Documentação registrada em `docs/ETAPA_7.md`.

### Próximo trabalho obrigatório

- Integrar o módulo ao `App.tsx` sem substituição destrutiva do arquivo.
- Remover a limpeza automática de `activity-events-v1`, se ainda presente.
- Revisar os pontos de rastreamento para manter somente eventos úteis.
- Validar lint/build/check e persistência antes de concluir a etapa.

## Problemas conhecidos

- O botão de IA das confissões está sem implementação real e deve ser removido ou conectado a uma função válida.
- O parser Strong pode não aceitar sufixos como `{H1234a}`.
- O parser de versos pode confundir linhas de continuação iniciadas por números dependendo do formato importado.
- Há duplicação de `activeGoalProfile` entre telas.
- Code splitting de serviços está inconsistente.
- `src/studyNotes.ts` deve ser revisado para confirmar se o helper está efetivamente utilizado.
- Existe persistência legada em IndexedDB que ainda não foi migrada nem removida.

## Decisões permanentes

1. Não fazer merge integral da PR #1 (`Refactor critical fixes`) sem revisão.
2. Não usar workflows do GitHub Actions como arquitetura permanente para reescrever código-fonte.
3. Não iniciar redesign da Home antes da estabilidade funcional.
4. Evitar substituições completas de `src/App.tsx` por operações GitHub Contents.
5. Priorizar estabilidade funcional antes de novas mudanças visuais.
6. Preservar dados existentes antes de qualquer migração de persistência.
7. Não tratar progresso demonstrativo como progresso real do usuário.

## Registro de alterações

### 2026-09-15

- Avançada a Etapa 7: criado `src/activityTracking.ts` e registrada sua documentação em `docs/ETAPA_7.md`.
- Mantida a Etapa 7 como **EM ANDAMENTO** até a integração com o fluxo ativo.
- Mantida a Etapa 6 como **EM ANDAMENTO** pelas pendências de integração da tela de planos e backup.
