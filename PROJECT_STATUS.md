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
9. Confissões/IA: **CONCLUÍDA**
10. Arquitetura e performance: **CONCLUÍDA**
11. Qualidade, CI e Vercel: **CONCLUÍDA**
12. Evolução visual da Home: **EM ANDAMENTO**

## Etapa 11: Qualidade, CI e Vercel — concluída

Validação final realizada sobre o estado consolidado da `main`.

- Commit de referência validado: `53a315edde7b160467dec2cb9ee3aa1b8faed5df`.
- GitHub Actions `quality`: concluído com sucesso.
- Instalação de dependências (`npm ci`): sucesso.
- Type check (`npm run lint`): sucesso.
- Build (`npm run build`): sucesso.
- Status do commit na integração GitHub: `Vercel` com estado `success`.
- Deploy Vercel associado ao commit confirmado pelo status do GitHub.
- Workflow legado `Home V4 (disabled)` permanece explicitamente desativado e não reescreve código-fonte.
- Nenhuma falha atual de CI foi identificada na validação da etapa.
- Nenhuma alteração funcional foi necessária durante a validação final.

## Etapa 12: Evolução visual da Home — em andamento

Objetivo: evoluir a Home atual (`HomeScreenV3`) com foco em hierarquia visual, clareza das ações principais, continuidade de leitura/estudo e acabamento profissional, preservando as funcionalidades e a estabilidade conquistadas nas etapas anteriores.

### Avanços registrados — 2026-09-15

- A Home ativa permanece `HomeScreenV3`.
- Foi aplicada a primeira camada visual dedicada da Home por meio de `src/home-v3.css`, importada diretamente pelo componente ativo.
- A camada visual estabelece hierarquia para cabeçalho, versículo do dia, ações primárias, recursos, planos de leitura e continuidade da leitura.
- Foram incluídos comportamentos responsivos para desktop, tablet e mobile, além de estados visuais para tema escuro.
- A implementação preserva a lógica existente de navegação, progresso dos planos, compartilhamento do versículo e retomada da leitura.
- Foi refinado o bloco de continuidade da leitura para assumir maior protagonismo visual, com destaque lateral, contraste, espaçamento e botão de ação mais evidente.
- As ações rápidas foram refinadas visualmente: “Ler Bíblia” e “Estudar” receberam maior peso como ações primárias, enquanto “Pesquisar” e “Anotações” permanecem acessíveis com menor competição visual.
- A grade de recursos foi compactada visualmente para funcionar como navegação secundária, preservando os oito atalhos existentes.
- A experiência mobile recebeu ajustes específicos de altura e proporção dos cartões, sem alterar a lógica de navegação.
- A alteração permaneceu exclusivamente visual; nenhuma lógica de navegação, progresso ou persistência foi modificada.
- Commit da primeira camada visual: `4de77862f238813ec6da760c0575d51b9a1ca58c`.
- Refinamento anterior da hierarquia: `cc500ca4d1a6f9ce31b92a8d5dcab0b407472977`.
- Refinamento de ações rápidas em validação: `769fc6f1b296efdbd06c3679f7f7bdf00d91c173`.
- Vercel do commit de validação: `success`.

Próximo foco: revisar o bloco de recursos e a composição geral da Home em larguras móveis, buscando reduzir densidade e melhorar legibilidade sem alterar a lógica funcional.

## Problemas conhecidos / pontos para revisão posterior

- `App.tsx` continua altamente concentrado; uma decomposição maior deve ser feita somente com testes e baixo risco.
- `services/db.ts` mantém persistência em IndexedDB por ainda possuir uso ativo.
- O build pode continuar apresentando avisos de tamanho de chunks; a melhoria feita na Etapa 10 reduz um dos pontos de carregamento inicial, mas não constitui uma refatoração integral de `App.tsx`.

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

- Etapas 6, 7, 8, 9 e 10 permanecem concluídas.
- CI e build da `main` validados com sucesso.
- Status Vercel do commit de produção validado como `success`.
- Workflow legado de Home V4 confirmado como desativado.
- Etapa 11 concluída sem necessidade de alteração funcional.
- Etapa 12 segue em andamento com a primeira camada visual, o refinamento da hierarquia e a diferenciação das ações rápidas já registrados.
