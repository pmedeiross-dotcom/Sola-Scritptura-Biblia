# Etapa 9 — Estudo das Confissões e recursos internos

## Objetivo
Tornar o fluxo de estudo das Confissões funcional e transparente, sem apresentar a análise local como uma IA generativa externa.

## Implementação
- O botão de estudo da Confissão utiliza `runInternalBibleAI` e `formatInternalBibleAIReportMarkdown`.
- A análise é executada localmente com o texto bíblico e os recursos confessionais/notas disponíveis no aplicativo.
- O rótulo da ação passou de `Estudar com IA` para `Estudar com recursos internos`.
- A resposta informa explicitamente que não é uma resposta de modelo generativo externo.
- Estados de carregamento e erro permanecem tratados pelo fluxo da tela.

## Limitação conhecida
O estudo usa como foco o título da seção selecionada (ou o título da Confissão quando não há seção estruturada) e consulta os recursos internos relacionados. Portanto, trata-se de um estudo relacionado ao tema, não de uma análise generativa direta do texto integral da seção.

## Validação
A implementação foi integrada ao fluxo ativo da tela de Confissões. A validação final de CI/Vercel permanece vinculada à Etapa 11.

## Resultado
Etapa 9 funcionalmente implementada; documentação registrada. A remoção do workflow temporário `stage-9-patch.yml` deve ser concluída no repositório antes do fechamento administrativo da etapa.
