import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

interface City {
  name: string;
  stateId: string;
}

interface State {
  id: string;
  name: string;
  uf: string;
}

interface Coord {
  lat: number;
  lon: number;
}

async function loadStates(baseDir: string): Promise<Map<string, State>> {
  const states = new Map<string, State>();
  const file = path.join(baseDir, 'states.csv');
  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const [id, name, uf] = line.split(',');
    if (!id || !uf) {
      continue;
    }
    states.set(id.trim(), {
      id: id.trim(),
      name: (name ?? '').trim(),
      uf: uf.trim(),
    });
  }

  return states;
}

async function loadCities(baseDir: string): Promise<Map<string, City>> {
  const cities = new Map<string, City>();
  const file = path.join(baseDir, 'cities.csv');
  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const [id, name, stateId] = line.split(',');
    if (!id || !name || !stateId) {
      continue;
    }
    cities.set(id, {
      name: name.trim(),
      stateId: stateId.trim(),
    });
  }

  return cities;
}

function loadCoordsMap(dataDir: string): Map<string, Coord> {
  const file = path.join(dataDir, 'geocode-cache.json');
  if (!fs.existsSync(file)) {
    return new Map<string, Coord>();
  }
  const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<string, Coord>;
  return new Map(Object.entries(parsed));
}

async function processCepFiles(baseDir: string): Promise<void> {
  const dataDir = path.resolve(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const outputFile = path.join(dataDir, 'ceps-geocoded.ndjson');
  const output = fs.createWriteStream(outputFile, { flags: 'w' });

  const states = await loadStates(baseDir);
  const cities = await loadCities(baseDir);
  const coords = loadCoordsMap(dataDir);
  const files = fs
    .readdirSync(baseDir)
    .filter((fileName) => fileName.endsWith('.csv') && fileName.includes('.cepaberto_parte_'));

  let total = 0;
  let withCoords = 0;

  for (const fileName of files) {
    const filePath = path.join(baseDir, fileName);
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) {
        continue;
      }
      total += 1;
      const [cep, logradouro, complemento, bairro, cityId, rowStateId] = line.split(',');
      const normalizedCityId = (cityId ?? '').trim();
      const normalizedRowStateId = (rowStateId ?? '').trim();
      const city = cities.get(normalizedCityId);
      const resolvedStateId = city?.stateId ?? normalizedRowStateId;
      const state = states.get(resolvedStateId);
      const coord = coords.get((cep ?? '').trim());

      if (!coord) {
        continue;
      }

      withCoords += 1;
      output.write(
        `${JSON.stringify({
          cep: (cep ?? '').trim(),
          logradouro: (logradouro ?? '').trim(),
          complemento: (complemento ?? '').trim(),
          bairro: (bairro ?? '').trim(),
          cidadeId: normalizedCityId,
          cidade: city?.name ?? '',
          estadoId: resolvedStateId,
          estado: state?.name ?? '',
          uf: state?.uf ?? '',
          latitude: coord.lat,
          longitude: coord.lon,
        })}\n`,
      );
    }
  }

  output.end();
  await new Promise<void>((resolve) => output.on('finish', () => resolve()));
  console.log(`Total de linhas lidas: ${total}`);
  console.log(`Total com coordenadas: ${withCoords}`);
  console.log(`Arquivo gerado em: ${outputFile}`);
}

processCepFiles(path.resolve(process.cwd(), 'base-dados')).catch((error: unknown) => {
  console.error('Falha ao preparar dataset', error);
  process.exit(1);
});
