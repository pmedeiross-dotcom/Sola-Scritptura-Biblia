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
7. Rastreamento de atividade: **PENDENTE**
8. Parser bíblico e Strong: **PENDENTE**
9. Confissões/IA: **PENDENTE**
10. Arquitetura e performance: **PENDENTE**
11. Qualidade, CI e Vercel: **EM ANDAMENTO**
12. Evolução visual da Home: **PENDENTE**

## Etapa 6: Progresso de estudo — em andamento

### Auditoria realizada

- Existem planos estáticos em `READING_PLANS` com valores de `progress` e `currentDay` definidos no código; esses valores não representam, por si só, progresso real do usuário.
- Existem planos personalizados persistidos em `custom-reading-plans-v1`.
- O cálculo de plano personalizado usa `getCurrentPlanDay(plan)`, derivando o dia a partir da data de início e da data atual.
- `reading-locations` é persistido em `localStorage` e permite recuperar o último ponto salvo de leitura.
- `goal-targets-v1` é persistido em `localStorage` e representa metas, mas não substitui um registro consolidado de capítulos/versículos efetivamente concluídos.
- A estrutura legada `StudyPlan`/`StudySession` possui progresso e conclusão, mas pertence ao fluxo legado e não constitui a fonte ativa.

### Implementação atual

- Criado `src/studyProgress.ts` como fonte persistente versionada para dias de planos explicitamente concluídos.
- Chave: `study-progress-v1`.
- Registros usam `planId`, `day` e `completedAt`, com identificador estável `planId:day`.
- Leitura defensiva tolera JSON inválido sem quebrar a aplicação.
- `toggleStudyDay` permite concluir/desmarcar um dia sem duplicação.
- `getStudyPlanProgress` calcula o percentual somente a partir dos registros reais.
- A implementação foi integrada à `main` pela PR #8.
- `HomeScreenV3` agora lê `study-progress-v1` e calcula `progress`/`currentDay` a partir das conclusões reais.
- A Home passou a oferecer ação explícita `Concluir dia`, persistindo a conclusão e atualizando imediatamente o percentual.
- Os valores demonstrativos dos três planos estáticos não são mais usados para exibição na Home.
- Documentação registrada em `docs/ETAPA_6.md`.

### Próximo trabalho obrigatório

- Integrar a mesma fonte de progresso à tela ativa de planos em `App.tsx`.
- Fazer o fluxo de `Continuar` respeitar o próximo dia não concluído.
- Incluir `study-progress-v1` no backup/restauração.
- Validar persistência após fechar/reabrir o aplicativo.
- Validar que não haja divergência entre Home e tela de planos.

## Problemas conhecidos

- `ENABLE_ACTIVITY_TRACKING = false` e existe limpeza silenciosa de `activity-events-v1`; decidir entre reativar corretamente ou remover a interface correspondente.
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

- Integrado `HomeScreenV3` ao modelo persistente `study-progress-v1`.
- A Home passou a exibir progresso e próximo dia com base em conclusões reais.
- Adicionada ação explícita para concluir o próximo dia de cada plano estático.
- Registrada a alteração neste arquivo.
