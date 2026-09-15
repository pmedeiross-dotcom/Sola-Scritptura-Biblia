# Etapa 4 — Auditoria de Anotações e Persistência

## Resultado

A aplicação possui dois mecanismos de persistência de anotações:

1. **Fluxo ativo:** `src/App.tsx` usa `localStorage` com a chave `notes` e entrega o mesmo estado à `LibraryScreen` ativa.
2. **Fluxo legado/paralelo:** `components/Library.tsx` usa `services/db.ts`, que mantém a store `notes` no IndexedDB `SolaScripturaDB`.

Esses mecanismos não devem ser tratados como um único banco: atualmente não há sincronização entre eles.

## Fluxo ativo

- Criação: `addNote(reference, content)` adiciona a anotação ao estado `notes`.
- Persistência: um `useEffect` grava `notes` em `localStorage('notes')`.
- Biblioteca: a `LibraryScreen` ativa recebe `notes`, `onUpdateNote` e `onDeleteNote` diretamente do `App.tsx`.
- Estudo: o resultado do estudo pode ser salvo em Anotações pelo fluxo ativo.
- Exclusão: `deleteNote` do fluxo ativo remove o item do estado; a persistência decorre do efeito de `notes`.

## Modelo de dados

O tipo `Note` foi alinhado ao uso real do fluxo ativo. Além dos campos básicos, ele aceita opcionalmente:

- `tags?: string[]`
- `notebook?: string`
- `pinned?: boolean`

Isso preserva compatibilidade com anotações antigas que não possuam esses campos.

## Fluxo legado IndexedDB

`services/db.ts` possui operações independentes para:

- `getStoredNotes()`
- `saveNote()`
- `deleteNote()`

`components/Library.tsx` também cria e exclui notas diretamente nesse banco.

## Riscos identificados

- Não migrar ou apagar a store IndexedDB `notes` sem uma estratégia explícita.
- Não substituir `localStorage('notes')` sem importar os dados existentes.
- Backup/restauração precisa preservar os campos opcionais de anotação.
- O componente legado `components/Library.tsx` não deve voltar a ser conectado ao fluxo ativo sem uma decisão arquitetural.

## Decisão desta etapa

Esta etapa **não migra nem apaga dados**. A primeira correção aplicada é apenas de tipagem: `types.ts` agora representa também os campos de anotação já utilizados pelo fluxo ativo.

A unificação dos dois mecanismos fica para uma etapa posterior, depois de definir uma fonte única de verdade e uma migração reversível.
