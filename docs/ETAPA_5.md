# Etapa 5 — Importação e exportação

## Resultado da auditoria

O fluxo ativo de backup/restauração está implementado em `src/App.tsx`.

### Exportação

- `exportAppData()` monta um JSON versionado (`version: 1`) com `exportedAt` e um bloco `data`.
- O backup é gerado no navegador como `Blob` e baixado como arquivo `.json`.
- O estado de Anotações (`notes`) participa do backup.
- O fluxo também contempla os dados locais utilizados pelo aplicativo, conforme o payload montado em `App.tsx`.

### Importação

- `importAppData(file)` lê o arquivo com `file.text()` e interpreta o conteúdo com `JSON.parse`.
- O fluxo verifica a estrutura de `parsed.data` antes de restaurar coleções.
- Anotações são verificadas com `Array.isArray(parsed.data.notes)` e normalizadas antes de entrarem no estado ativo.
- A restauração preserva campos opcionais das anotações (`tags`, `notebook` e `pinned`) quando presentes.
- O fluxo de restauração mantém a persistência ativa baseada em `localStorage`.

### Importação de versão da Bíblia

- `importBibleVersionData(file)` é um fluxo separado da restauração do backup do aplicativo.
- Ele processa o arquivo de uma versão bíblica e valida a existência de versículos antes de aceitar os dados.

## Decisão

Não foi necessária alteração funcional nesta etapa: a infraestrutura de importação/exportação já estava presente e o código foi auditado sem migração destrutiva ou substituição de `src/App.tsx`.

A etapa será considerada concluída após o CI validar `npm run lint` e `npm run build` no commit que registra esta auditoria.
