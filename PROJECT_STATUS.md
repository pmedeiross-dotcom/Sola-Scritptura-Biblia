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
12. Evolução visual da Home: **CONCLUÍDA**

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

## Etapa 12: Evolução visual da Home — concluída

Objetivo: evoluir a Home atual (`HomeScreenV3`) com foco em hierarquia visual, clareza das ações principais, continuidade de leitura/estudo e acabamento profissional, preservando as funcionalidades e a estabilidade conquistadas nas etapas anteriores.

### Resultado final — 2026-09-16

- Mantida a implementação ativa em `HomeScreenV3` sem alteração de lógica funcional.
- Consolidada a camada de refinamento visual em `src/home-v3-hierarchy.css`.
- Mobile até 640px recebeu ajustes finais de densidade, espaçamento, proporção dos cartões, leitura dos títulos e área de toque dos botões.
- Larguras muito estreitas (até 380px) receberam tratamento específico para evitar compressão das quatro ações rápidas, excesso horizontal e botões pequenos.
- O tema escuro recebeu reforço de contraste para textos secundários, bordas, fundos de cartões, ícones e barra de progresso.
- A hierarquia final permanece: versículo do dia como abertura, ações principais em seguida, continuidade da leitura com destaque próprio, recursos como navegação secundária e planos como conteúdo complementar.
- Nenhuma alteração foi feita em navegação, persistência, progresso, busca, compartilhamento, anotações, planos, Reader ou Study.
- PR #17 foi integrada à `main` com merge commit `d2c0b5552aaf942b826ba5e1e2e86a11612c27fa`.
- CI do PR #17 concluído com sucesso: instalação, type check e build aprovados.
- Vercel do commit da revisão visual concluído com estado `success`.
- Nenhuma alteração funcional foi necessária durante a finalização.

## Próxima etapa

Etapa 13: análise geral do projeto e definição/executação do próximo ciclo com base no estado real do código, priorizando impacto, risco e preservação das funcionalidades existentes.

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

### 2026-09-16

- Etapa 12 concluída após revisão visual final da Home para mobile, larguras muito estreitas e tema escuro.
- PR #17 foi integrada à `main` com merge commit `d2c0b5552aaf942b826ba5e1e2e86a11612c27fa`.
- CI do PR #17 aprovado: `quality`, type check e build com sucesso.
- Vercel do commit da revisão visual validado como `success`.
- `PROJECT_STATUS.md` atualizado para registrar a conclusão da Etapa 12.

### 2026-09-15

- Etapas 6, 7, 8, 9 e 10 permanecem concluídas.
- CI e build da `main` validados com sucesso.
- Status Vercel do commit de produção validado como `success`.
- Workflow legado de Home V4 confirmado como desativado.
- Etapa 11 concluída sem necessidade de alteração funcional.
- Etapa 12 segue em andamento com a primeira camada visual, o refinamento da hierarquia e a diferenciação das ações rápidas já registrados.
- PR #16 foi integrado à `main`, consolidando o refinamento visual das ações rápidas, recursos e comportamento mobile.
