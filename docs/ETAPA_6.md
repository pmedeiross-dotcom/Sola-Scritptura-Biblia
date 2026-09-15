# Etapa 6 — Progresso de estudo

## Objetivo
Consolidar o acompanhamento real da leitura e do estudo, com persistência local e continuidade entre sessões.

## Auditoria da implementação atual

- Os planos estáticos (`READING_PLANS` e `HomeScreenV3`) ainda possuem `progress` e `currentDay` definidos diretamente no código.
- Planos personalizados são persistidos em `custom-reading-plans-v1`.
- O progresso visual dos planos personalizados é derivado da data de início (`getCurrentPlanDay`) e não de capítulos explicitamente concluídos.
- Localizações de leitura são persistidas em `reading-locations` e permitem retomar um ponto salvo.
- Metas são persistidas em `goal-targets-v1`, mas não representam capítulos/versículos efetivamente concluídos.
- `StudyPlan`/`StudySession` existe no fluxo legado de IndexedDB e não é a fonte ativa do progresso.

## Decisão técnica

A fonte ativa de progresso deverá ser uma estrutura versionada e persistida no `localStorage`, separada de `reading-locations`. O registro deverá permitir:

1. identificar o plano;
2. identificar a unidade concluída (dia/capítulo);
3. registrar a data de conclusão;
4. calcular progresso a partir de unidades concluídas;
5. sobreviver ao fechamento e reabertura do aplicativo;
6. ser incluído no backup/restauração sem alterar retroativamente o formato de backup existente.

## Estado desta etapa

**EM ANDAMENTO.**

A auditoria está concluída, mas a etapa não deve ser marcada como concluída enquanto a unidade de progresso não estiver integrada ao fluxo ativo de planos e à continuidade da Home.

## Próxima ação

Implementar a fonte única `reading-progress-v1`, integrar conclusão de unidade ao fluxo de planos e fazer a Home consumir progresso real, eliminando os valores demonstrativos apresentados como progresso pessoal.
