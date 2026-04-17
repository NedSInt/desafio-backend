# Proposta Técnica - API de CEP por Raio (NestJS)

## 1) Objetivo

Construir uma API em **Node.js + NestJS** que receba um `cep` de origem e um `raioKm`, retornando todos os CEPs dentro da área geográfica informada, com:

- alta performance para leitura e consulta;
- boa organização de código (clean code + arquitetura simples);
- suporte a múltiplas requisições simultâneas sem bloquear o event loop;
- telemetria estruturada e assíncrona em arquivo.

---

## 2) Premissas e cenário atual

- A base CSV do CepAberto já está disponível em `base-dados/`.
- Os CSVs **não possuem latitude/longitude**, então será necessário um processo de enriquecimento de dados.
- O enriquecimento deve ocorrer **fora do fluxo da API**, executado uma única vez (ou sob demanda operacional).

---

## 3) Arquitetura proposta (simples e escalável)

### Visão em camadas

1. **Controller (HTTP)**  
   Recebe requisição, valida DTO e delega para a camada de aplicação.

2. **Application Service (Use Case)**  
   Executa regra principal: localizar CEP origem, calcular área e filtrar CEPs no raio.

3. **Domain Utilities**  
   Funções puras: normalização de CEP, cálculo de distância (Haversine), validações.

4. **Infrastructure (Data Access + Logs)**  
   Carrega índice em memória a partir de arquivo consolidado e grava logs estruturados de telemetria.

Essa divisão mantém o projeto limpo, testável e sem over-engineering.

---

## 4) Estratégia de dados (essencial para performance)

### 4.1 Enriquecimento offline (uma vez)

Criar script separado, por exemplo em `scripts/enrich-coordinates.ts`, que:

1. Lê todos os CSVs de `base-dados/` em stream;
2. Normaliza CEP (apenas dígitos);
3. Consulta uma API de geocoding para cada registro sem coordenada;
4. Respeita rate limit (concorrência controlada + retry com backoff);
5. Gera arquivo final consolidado (ex.: `data/ceps-geocoded.ndjson` ou `data/ceps-geocoded.csv`).

> Recomendação simples: usar **cache local** (`data/geocode-cache.json`) para não consultar o mesmo endereço/CEP repetidamente durante o enriquecimento.

### 4.2 Modelo de dado sugerido

Para consulta eficiente, manter somente o necessário:

- `cep` (string normalizada)
- `uf` (string)
- `cidade` (string)
- `bairro` (string)
- `logradouro` (string)
- `latitude` (number)
- `longitude` (number)

### 4.3 Índice em memória na inicialização da API

Na inicialização:

- carregar dataset consolidado para memória;
- criar:
  - `Map<string, CepRecord>` para busca O(1) por CEP;
  - lista/array de coordenadas para varredura por bounding box + Haversine.

Com isso, as consultas ficam rápidas e evitam I/O por requisição.

---

## 5) Fluxo da API

Endpoint sugerido:

- `GET /ceps/radius?cep=01001000&raioKm=5`

Fluxo:

1. Valida parâmetros (`cep`, `raioKm`);
2. Busca CEP de origem no índice;
3. Calcula bounding box aproximada com base no raio;
4. Filtra candidatos dentro da bounding box (pré-filtro rápido);
5. Aplica Haversine para distância real;
6. Retorna JSON com CEPs encontrados.

---

## 6) Contrato de resposta

### Sucesso (200)

```json
{
  "cepOrigem": "01001000",
  "raioKm": 5,
  "total": 42,
  "ceps": [
    {
      "cep": "01002000",
      "uf": "SP",
      "cidade": "Sao Paulo",
      "bairro": "Se",
      "logradouro": "Rua X",
      "latitude": -23.55,
      "longitude": -46.63,
      "distanciaKm": 1.37
    }
  ]
}
```

### Erros

- `400 Bad Request`
  - CEP inválido (formato)
  - `raioKm` inválido
- `404 Not Found`
  - CEP não encontrado na base
- `500 Internal Server Error`
  - falhas inesperadas

---

## 7) Telemetria (assíncrona e leve)

Implementar interceptor/middleware que registre por requisição:

- `timestamp`
- `requestId`
- `route`
- `method`
- `statusCode`
- `durationMs`
- `memoryRssMb`
- `memoryHeapUsedMb`
- `cpuUserMs`
- `cpuSystemMs`

Regras:

- formato JSON por linha (NDJSON) em `logs/requests.log`;
- escrita assíncrona com stream (`fs.createWriteStream`);
- sem bloqueio do fluxo da requisição.

---

## 8) Estrutura de pastas sugerida

```text
src/
  main.ts
  app.module.ts
  modules/
    cep/
      cep.controller.ts
      cep.service.ts
      dto/
        search-radius.dto.ts
      domain/
        haversine.ts
        bounding-box.ts
        cep-normalizer.ts
      infra/
        cep-repository.ts
  common/
    telemetry/
      telemetry.interceptor.ts
      telemetry.logger.ts
scripts/
  enrich-coordinates.ts
data/
  ceps-geocoded.ndjson
  geocode-cache.json
logs/
  requests.log
```

---

## 9) Boas práticas (sem over-engineering)

- Validar DTO com `class-validator` e `ValidationPipe`;
- Usar funções puras para cálculo geográfico;
- Evitar dependência de banco inicialmente (in-memory já atende bem para esse desafio);
- Padronizar tratamento de erro com exceptions do NestJS;
- Criar testes unitários para utilitários (Haversine/normalização) e e2e para endpoint.

---

## 10) Plano de implementação (passo a passo)

1. Inicializar projeto NestJS;
2. Criar módulo `cep` com endpoint de busca por raio;
3. Implementar carregamento do dataset consolidado em memória;
4. Implementar cálculo bounding box + Haversine;
5. Implementar telemetria assíncrona via interceptor;
6. Criar script de enriquecimento geográfico (`scripts/enrich-coordinates.ts`);
7. Gerar dataset final com lat/long;
8. Validar performance com testes simples de carga local;
9. Documentar no `README.md`:
   - instalação
   - execução
   - endpoint
   - script de enriquecimento
   - observabilidade/logs.

---

## 11) Estratégia de geocoding (prática)

Para enriquecer lat/long:

- Entrada: CEP + UF + cidade + logradouro (quando existir);
- Ordem de consulta:
  1. CEP (preferencial);
  2. fallback por endereço textual completo;
- Controles:
  - concorrência máxima baixa (ex.: 5 simultâneas);
  - retry com backoff exponencial para HTTP 429/5xx;
  - persistência incremental de progresso para retomar execução.

> Resultado: processo robusto, simples, e executado fora da API para não afetar latência de produção.

---

## 12) Critérios de aceite

- Endpoint retorna CEPs por raio corretamente;
- Erros funcionais tratados conforme especificação;
- API responde de forma consistente sob múltiplas requisições simultâneas;
- Telemetria registrada em JSON sem impacto relevante na performance;
- Script de geocoding gera base consolidada com latitude/longitude.

