# Sola Scriptura Bíblia - Registro do Projeto

> Registro operacional para manter o contexto técnico entre etapas. Atualizar este arquivo após mudanças estruturais relevantes.

## Estado de referência

- Branch de produção: `main`
- Aplicação: React + Vite + TypeScript
- Arquivo principal: `src/App.tsx`
- Home atualmente integrada: `HomeScreenV3`
- Deploy: Vercel acompanha `main`

## Decisões já tomadas

1. Não fazer merge integral da PR #1 (`Refactor critical fixes`). Ela é draft, contém mudanças estruturais misturadas com alterações antigas e deve ser tratada apenas como fonte de correções aproveitáveis.
2. Não usar workflows do GitHub Actions para reescrever automaticamente código-fonte da aplicação.
3. Não iniciar outro redesign da Home antes de estabilizar as funções principais.
4. Evitar substituições completas de `src/App.tsx` por operações GitHub Contents, porque o arquivo é grande e uma edição incorreta pode quebrar o aplicativo.
5. Prioridade atual: estabilidade funcional antes de novas mudanças visuais.

## Limpeza realizada

- O workflow `.github/workflows/apply-home-v4.yml` foi desativado para impedir alterações automáticas da Home.
- A Home V4 não está sendo considerada a implementação ativa.

## Pendências prioritárias

### P0 - Leitor bíblico
- Corrigir/validar rolagem dos versículos.
- Garantir atualização do versículo atualmente visível durante a rolagem.
- Corrigir `Ir para versículo` para navegar ao versículo solicitado.
- Fazer salvamento/restauração da posição usar o versículo efetivamente visível quando apropriado.
- Validar botões de rolagem superior/inferior.

### P0 - Estudo e anotações
- Auditar mecanismo real de salvamento.
- Corrigir barras/áreas de rolagem da tela de estudo.
- Garantir persistência das anotações.

### P1 - Pesquisa
- Corrigir navegação de referências no formato `Livro capítulo:versículo`.
- Preservar capítulo e versículo na navegação.

### P1 - Persistência
- Auditar localStorage e IndexedDB.
- Evitar limpeza silenciosa de dados do usuário.
- Validar exportação/importação e restauração.

### P1 - TypeScript/qualidade
- Manter `strict: true` somente se o projeto continuar compilando corretamente.
- Resolver erros reais de tipagem sem relaxar a configuração.
- Rodar `npm run lint`, `npm run build` e `npm run check` antes de considerar uma etapa concluída.

### P2 - Arquitetura
- Eliminar workflows/scripts temporários de redesign que não tenham função.
- Reduzir código morto.
- Centralizar lógica duplicada, como perfil/objetivos de estudo.
- Avaliar code splitting de serviços estáticos.

### P2 - Home/UI
- Depois da estabilidade, avaliar evolução visual da Home V3.
- Preservar funcionalidades existentes.
- Não criar nova V4 por automação.

## Problemas conhecidos levantados anteriormente

- `selectReference` reconhecia `Livro capítulo:versículo`, mas uma implementação anterior descartava o versículo.
- O estado `targetVerse` não deve ser usado sozinho para representar o versículo atualmente visível.
- O leitor possui uma área de rolagem interna em `verseContainerRef`, portanto ouvir apenas `screenScrollRef` não é suficiente para detectar a rolagem dos versículos.
- O rastreamento de atividade já foi identificado como desativado (`ENABLE_ACTIVITY_TRACKING = false`) e deve ser decidido: reativar corretamente ou remover a interface correspondente.
- O botão de IA das confissões já foi identificado como sem implementação real e deve ser removido ou conectado a uma função válida.
- O parser Strong atualmente pode não aceitar sufixos como `{H1234a}`.
- O parser de versos pode confundir linhas de continuação iniciadas por números dependendo do formato importado.

## PR #1

- Título: `Refactor critical fixes`
- Base: `main`
- Estado: aberta/draft
- Não fazer merge integral sem revisão.
- Aproveitar seletivamente apenas correções compatíveis com a arquitetura atual.

## Critério de conclusão de cada etapa

Uma etapa só deve ser marcada como concluída quando:

1. O código foi alterado de forma localizada.
2. Não houve substituição destrutiva de arquivo grande.
3. A funcionalidade afetada foi revisada.
4. `npm run lint` passa.
5. `npm run build` passa.
6. Quando aplicável, `npm run check` passa.
7. O resultado foi registrado neste arquivo.
