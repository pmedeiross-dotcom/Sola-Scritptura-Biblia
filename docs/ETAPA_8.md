# ETAPA 8 — Parser bíblico e Strong

## Resultado

**CONCLUÍDA.**

### Ajustes realizados

- Números Strong agora aceitam o formato básico e sufixos alfabéticos, como `{H1234}`, `{H1234a}` e `{G3056}`.
- A ocultação dos Strong e a renderização visual usam a mesma regra de reconhecimento.
- O parser de versículos do Reader passou a aceitar apenas um novo número quando ele é sequencial ao versículo anterior; linhas numéricas de continuação deixam de iniciar um novo versículo.
- O parser equivalente de `bibleService` foi alinhado ao mesmo comportamento.
- O texto original é preservado; a alteração atua somente na identificação estrutural dos versículos e dos marcadores Strong.

### Validação

Casos cobertos conceitualmente: `1`, `1.`, `1:`; continuação textual iniciada por número; `{H1234}`, `{H1234a}`, `{G3056}` e ocultação dos marcadores.
