import { Injectable, NotFoundException } from '@nestjs/common';
import { SearchRadiusDto } from './dto/search-radius.dto';
import { normalizeCep } from './domain/cep-normalizer';
import { calculateBoundingBox, haversineDistanceKm } from './domain/geo';
import { CepRepository } from './infra/cep.repository';

interface CepResult {
  cep: string;
  uf: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  latitude: number;
  longitude: number;
  distanciaKm: number;
}

@Injectable()
export class CepService {
  constructor(private readonly cepRepository: CepRepository) {}

  searchByRadius(dto: SearchRadiusDto): {
    cepOrigem: string;
    raioKm: number;
    total: number;
    ceps: CepResult[];
  } {
    const normalizedCep = normalizeCep(dto.cep);
    const origin = this.cepRepository.getByCep(normalizedCep);

    if (!origin) {
      throw new NotFoundException('CEP não encontrado na base');
    }

    const bbox = calculateBoundingBox(origin.latitude, origin.longitude, dto.raioKm);
    const results: CepResult[] = [];

    for (const record of this.cepRepository.getAll()) {
      if (
        record.latitude < bbox.minLat ||
        record.latitude > bbox.maxLat ||
        record.longitude < bbox.minLon ||
        record.longitude > bbox.maxLon
      ) {
        continue;
      }

      const distance = haversineDistanceKm(
        origin.latitude,
        origin.longitude,
        record.latitude,
        record.longitude,
      );

      if (distance <= dto.raioKm) {
        results.push({
          cep: record.cep,
          uf: record.uf,
          cidade: record.cidade,
          bairro: record.bairro,
          logradouro: record.logradouro,
          latitude: record.latitude,
          longitude: record.longitude,
          distanciaKm: Number(distance.toFixed(3)),
        });
      }
    }

    results.sort((a, b) => a.distanciaKm - b.distanciaKm);

    return {
      cepOrigem: origin.cep,
      raioKm: dto.raioKm,
      total: results.length,
      ceps: results,
    };
  }
}
