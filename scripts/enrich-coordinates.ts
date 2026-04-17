import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

type CacheMap = Record<string, { lat: number; lon: number }>;

const CEPABERTO_BASE_URL = 'https://www.cepaberto.com/api/v3/cep';
const CACHE_FILE = path.resolve(process.cwd(), 'data', 'geocode-cache.json');
const BASE_DIR = path.resolve(process.cwd(), 'base-dados');
const MAX_REQUESTS = Number(process.env.GEOCODE_MAX_REQUESTS ?? 500);
const REQUEST_DELAY_MS = Number(process.env.GEOCODE_DELAY_MS ?? 250);
const CEPABERTO_TOKEN = process.env.CEPABERTO_TOKEN;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadCache(): CacheMap {
  if (!fs.existsSync(CACHE_FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')) as CacheMap;
}

function saveCache(cache: CacheMap): void {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function fetchCoordByCep(cep: string): Promise<{ lat: number; lon: number } | null> {
  const normalized = cep.trim();
  const url = `${CEPABERTO_BASE_URL}?cep=${normalized}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Token token=${CEPABERTO_TOKEN}`,
      'User-Agent': 'desafio-backend/1.0 (cep geocode enricher)',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    if (response.status === 429 || response.status >= 500) {
      throw new Error(`HTTP ${response.status}`);
    }
    const body = await response.text();
    throw new Error(`Falha na API CepAberto (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    latitude?: string | number;
    longitude?: string | number;
  };

  const lat = Number(data.latitude);
  const lon = Number(data.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  return { lat, lon };
}

async function collectUniqueCeps(): Promise<string[]> {
  const files = fs
    .readdirSync(BASE_DIR)
    .filter((fileName) => fileName.endsWith('.csv') && fileName.includes('.cepaberto_parte_'));
  const ceps = new Set<string>();

  for (const fileName of files) {
    const rl = readline.createInterface({
      input: fs.createReadStream(path.join(BASE_DIR, fileName), { encoding: 'latin1' }),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const [cep] = line.split(',');
      if (cep && /^\d{8}$/.test(cep)) {
        ceps.add(cep);
      }
    }
  }

  return Array.from(ceps.values());
}

async function run(): Promise<void> {
  if (!CEPABERTO_TOKEN) {
    throw new Error(
      'Variável de ambiente CEPABERTO_TOKEN não informada. Defina seu token antes de executar.',
    );
  }

  const cache = loadCache();
  const ceps = await collectUniqueCeps();
  let attempts = 0;
  let hits = 0;

  console.log(`Total de CEPs únicos: ${ceps.length}`);
  console.log(`Já em cache: ${Object.keys(cache).length}`);
  console.log(`Máximo de novas consultas nesta execução: ${MAX_REQUESTS}`);

  for (const cep of ceps) {
    if (cache[cep]) {
      continue;
    }
    if (attempts >= MAX_REQUESTS) {
      break;
    }

    attempts += 1;
    try {
      const coord = await fetchCoordByCep(cep);
      if (coord) {
        cache[cep] = coord;
        hits += 1;
      }
      if (attempts % 25 === 0) {
        saveCache(cache);
        console.log(
          `Progresso: ${attempts} consultas, novos enriquecidos ${hits}, cache total ${Object.keys(cache).length}`,
        );
      }
    } catch (error) {
      console.error(`Erro ao geocodificar ${cep}, tentando novamente em 3s`, error);
      await sleep(3000);
      continue;
    }

    await sleep(REQUEST_DELAY_MS);
  }

  saveCache(cache);
  console.log(`Enriquecimento finalizado. Novos CEPs com coordenada nesta execução: ${hits}`);
}

run().catch((error: unknown) => {
  console.error('Falha no enriquecimento de coordenadas', error);
  process.exit(1);
});
