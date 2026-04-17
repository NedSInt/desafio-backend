# Desafio Backend - API de CEP por raio

API em NestJS que recebe um CEP de origem e um raio em KM e retorna todos os CEPs dentro da area.

## Contexto da base de dados

Neste projeto, optei por trabalhar apenas com CEPs de **Nova Friburgo (RJ)** para demonstrar a solucao funcional de ponta a ponta.

O motivo foi uma limitacao da base publica em CSV:

- os arquivos baixaveis do CepAberto em `base-dados/` nao possuem `latitude` e `longitude`;
- para calcular raio geografico com precisao, essas coordenadas sao obrigatorias.

A API do CepAberto, por outro lado, retorna latitude e longitude por CEP.  
Por isso, implementei um processo de enriquecimento:

1. ler os CEPs da base CSV;
2. consultar a API do CepAberto para cada CEP;
3. salvar coordenadas em cache local (`data/geocode-cache.json`);
4. consolidar dataset final em `data/ceps-geocoded.ndjson`.

Assim, a API de busca por raio consegue operar corretamente com dados geograficos reais.

## Requisitos

- Node.js 20+
- npm

## Instalacao

```bash
npm install
```

## Preparacao da base

1. Enriquecer coordenadas (gera/atualiza cache em `data/geocode-cache.json`):

PowerShell:

```powershell
$env:CEPABERTO_TOKEN="SEU_TOKEN_AQUI"
```

```bash
npm run enrich:coords
```

Observacoes importantes:

- o enriquecimento usa a API do CepAberto;
- e necessario informar `CEPABERTO_TOKEN`;
- a API tem limite de requisicoes (intervalo minimo e cota diaria), entao o processo deve ser executado em lotes.

2. Consolidar dataset final da API:

```bash
npm run prepare:data
```

Esse passo gera `data/ceps-geocoded.ndjson`.

## Execucao

### Desenvolvimento

```bash
npm run start:dev
```

### Producao

```bash
npm run build
npm start
```

## Endpoint

`GET /ceps/radius?cep=01001000&raioKm=5`

### Exemplo de teste

```bash
curl "http://localhost:3000/ceps/radius?cep=01001000&raioKm=5"
```

## Respostas de erro

- `400` para parametros invalidos
- `404` para CEP inexistente na base

## Telemetria

Cada requisicao gera uma linha JSON em `logs/requests.log` com:

- tempo de execucao
- uso de memoria
- uso de CPU
- rota, status e requestId

## Cliente HTML

Abra `client/index.html` no navegador e use o formulario para consultar o endpoint.
