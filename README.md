# Sola Scriptura App

Aplicativo React + Vite para leitura bíblica, estudo e consulta dos símbolos de fé reformados.

## Requisitos

1. Node.js 20+
2. npm 10+

## Execução local

1. Instalar dependências:
   npm install
2. Iniciar ambiente de desenvolvimento:
   npm run dev
3. Abrir no navegador:
   http://localhost:3000

## Scripts

1. Desenvolvimento:
   npm run dev
2. Validação de tipos:
   npm run lint
3. Build de produção:
   npm run build
4. Checagem completa local:
   npm run check

## Qualidade e CI

Pipeline configurada em [ .github/workflows/ci.yml ](.github/workflows/ci.yml):

1. npm ci
2. npm run lint
3. npm run build

Executa em push e pull request.

## Recursos profissionais já implementados

1. Onboarding de primeira execução
2. Error boundary global
3. Busca bíblica com tratamento de erro
4. Organização de confissões por índice (Westminster, Heidelberg e Belga)
5. Backup local (exportar/importar) e reset seguro
6. Indicador de status offline
7. Service Worker para cache básico do shell do app

## Backup de dados do usuário

No menu Ajustes:

1. Exportar backup: gera arquivo JSON
2. Importar backup: restaura dados locais
3. Limpar dados locais: remove dados salvos no navegador

## Estrutura principal

1. Aplicação principal: [ src/App.tsx ](src/App.tsx)
2. Entrada do app: [ index.tsx ](index.tsx)
3. Estilos globais: [ src/index.css ](src/index.css)
4. Dados das confissões: [ src/data ](src/data)
5. Service worker: [ public/sw.js ](public/sw.js)

## Observações

1. Caso haja erro ENOSPC, libere espaço em disco antes de instalar novas dependências.
2. O service worker é registrado apenas em build de produção.
