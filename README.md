# Desafio Backend - API de CEP por raio

API em NestJS que recebe um CEP de origem e um raio em KM e retorna os CEPs localizados dentro da area geografica.

## Instruções de instalação

### Pré-requisitos

- Node.js 20 ou superior
- npm

### Passo a passo

1. Clone o repositório
2. Acesse a pasta do projeto
3. Instale as dependências:

```bash
npm install
```

## Como executar o projeto

> A base de dados final ja esta pronta no repositório em `data/ceps-geocoded.ndjson`.  
> Nao e necessario executar scripts de enriquecimento para validar o projeto.

### Executar em desenvolvimento

```bash
npm run start:dev
```

API disponível em: `http://localhost:3000`

### Executar em produção

```bash
npm run build
npm start
```

API disponível em: `http://localhost:3000`

## Como testar o endpoint

### Swagger

- `http://localhost:3000/docs`

### Endpoint

`GET /ceps/radius?cep=28605170&raioKm=5`

### Exemplo com curl

```bash
curl "http://localhost:3000/ceps/radius?cep=28605170&raioKm=5"
```

### Exemplo de resposta JSON

```json
{
  "cepOrigem": "28605170",
  "raioKm": 5,
  "total": 3,
  "ceps": [
    {
      "cep": "28605170",
      "complemento": "",
      "logradouro": "Rua Exemplo A",
      "bairro": "Centro",
      "cidadeId": "4852",
      "uf": "RJ",
      "cidade": "Nova Friburgo",
      "estadoId": "19",
      "estado": "Rio de Janeiro",
      "latitude": -22.281,
      "longitude": -42.531,
      "distanciaKm": 0
    },
    {
      "cep": "28605171",
      "complemento": "",
      "logradouro": "Rua Exemplo B",
      "bairro": "Centro",
      "cidadeId": "4852",
      "uf": "RJ",
      "cidade": "Nova Friburgo",
      "estadoId": "19",
      "estado": "Rio de Janeiro",
      "latitude": -22.282,
      "longitude": -42.53,
      "distanciaKm": 0.151
    }
  ]
}
```

## Respostas de erro

- `400` para parâmetros inválidos
- `404` para CEP não encontrado na base

## Telemetria

Cada requisição gera uma linha em `logs/requests.log` (JSON estruturado) com:

- tempo de execução
- uso de memória
- uso de CPU
- rota, status e requestId

## Observação sobre preparação de dados

Durante o desenvolvimento, foi necessário enriquecer a base CSV original com latitude/longitude, pois os CSVs públicos do CepAberto não trazem essas colunas.

Esse processo já foi concluído e o resultado final já está versionado em `data/ceps-geocoded.ndjson`.
