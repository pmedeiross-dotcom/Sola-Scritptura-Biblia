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
6. Progresso de estudo: **CONCLUÍDA**
7. Rastreamento de atividade: **CONCLUÍDA**
8. Parser bíblico e Strong: **CONCLUÍDA**
9. Confissões/IA: **PENDENTE — implementação não aplicada com segurança; fluxo atual continua exibindo a mensagem de funcionalidade removida**
10. Arquitetura e performance: **PENDENTE**
11. Qualidade, CI e Vercel: **EM ANDAMENTO**
12. Evolução visual da Home: **PENDENTE**

## Etapa 9: Confissões/IA — pendente

- O serviço `src/services/internalBibleAI.ts` já fornece análise interna baseada em Bíblia, léxico Strong e conhecimento local do aplicativo.
- O fluxo ativo de Confissões em `src/App.tsx` ainda contém um handler que retorna apenas a mensagem de que a IA foi removida.
- Foi preparada uma abordagem para conectar o botão ao mecanismo de estudo interno, mas ela não foi incorporada à produção porque a alteração segura de `src/App.tsx` não pôde ser aplicada/validada nesta execução.
- Não apresentar heurísticas locais como IA generativa externa continua sendo uma decisão permanente.
- A etapa só deve ser marcada como concluída após integrar ou remover o botão no fluxo ativo e validar `npm ci`, `npm run lint`, `npm run build` e `npm run check`.

## Etapa 6: Progresso de estudo — concluída

- `src/studyProgress.ts` é a fonte persistente versionada para dias explicitamente concluídos.
- Chave: `study-progress-v1`.
- `HomeScreenV3` consome o progresso real e permite concluir o próximo dia dos planos estáticos.
- A tela ativa de Planos de Leitura consome o mesmo estado persistente.
- O progresso percentual e o próximo dia dos planos estáticos são derivados dos registros reais.
- `Continuar Leitura` resolve o próximo dia com base no progresso persistente.
- A tela ativa permite concluir o próximo dia explicitamente.
- Backup/restauração inclui `studyProgress`.
- A integração foi validada com `npm ci`, `npm run lint` e `npm run build` no workflow da etapa.
- Planos personalizados mantêm a lógica existente baseada em cronograma/data; não houve migração automática para conclusão diária.

## Etapa 7: Rastreamento de atividade — concluída

- `src/activityTracking.ts` está integrado ao fluxo ativo de `App.tsx`.
- Persistência local em `activity-events-v1`, com retenção máxima de 200 eventos.
- Eventos inválidos, vazios e `screen_view / Tela: Library` são filtrados centralmente.
- O rastreamento está habilitado e o estado é inicializado a partir do armazenamento persistido.
- A limpeza automática na montagem foi removida; a limpeza manual continua funcionando.
- Pontos de rastreamento existentes para notas, planos, importações, metas e onboarding continuam ativos.
- Backup/restauração inclui `activityEvents`.
- `docs/ETAPA_7.md` registra a implementação final.
- Lint/build/check foram executados com sucesso no workflow da etapa.

## Etapa 8: Parser bíblico e Strong — concluída

- Marcadores Strong reconhecem `{H1234}`, `{H1234a}`, `{G3056}` e variantes equivalentes com sufixo alfabético.
- A exibição e a ocultação dos marcadores Strong usam a mesma regra de reconhecimento.
- O parser do Reader identifica um novo versículo quando o número é sequencial ao anterior, evitando interpretar uma continuação numérica como novo versículo.
- `src/services/bibleService.ts` usa a mesma regra estrutural para manter o comportamento consistente.
- O texto importado é preservado; a alteração atua na identificação estrutural dos versículos e marcadores.
- `docs/ETAPA_8.md` registra a implementação e a validação executada.

## Problemas conhecidos

- Etapa 9 continua pendente: fluxo “Estudar com IA” das confissões ainda precisa ser finalizado.
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
8. Não apresentar heurísticas locais como IA real.

## Registro de alterações

### 2026-09-15

- Etapas 6, 7 e 8 permanecem concluídas.
- Etapa 9 foi iniciada e auditada.
- Identificado que o serviço interno de análise já existe, mas o botão ativo das Confissões ainda aponta para um handler sem implementação real.
- A integração proposta não foi promovida por não haver mecanismo seguro de patch parcial do `App.tsx` nesta execução; o status permanece **PENDENTE** em vez de declarar conclusão falsa.
