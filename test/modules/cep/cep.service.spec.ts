import { NotFoundException } from '@nestjs/common';
import { CepService } from '../../../src/modules/cep/cep.service';
import { CepRecord } from '../../../src/modules/cep/infra/cep.types';
import { CepRepository } from '../../../src/modules/cep/infra/cep.repository';

describe('CepService', () => {
  const records: CepRecord[] = [
    {
      cep: '28605170',
      logradouro: 'Rua Origem',
      complemento: '',
      bairro: 'Centro',
      cidadeId: '4852',
      cidade: 'Nova Friburgo',
      estadoId: '19',
      estado: 'Rio de Janeiro',
      uf: 'RJ',
      latitude: -22.281,
      longitude: -42.531,
    },
    {
      cep: '28605171',
      logradouro: 'Rua Perto',
      complemento: '',
      bairro: 'Centro',
      cidadeId: '4852',
      cidade: 'Nova Friburgo',
      estadoId: '19',
      estado: 'Rio de Janeiro',
      uf: 'RJ',
      latitude: -22.282,
      longitude: -42.53,
    },
    {
      cep: '28605199',
      logradouro: 'Rua Longe',
      complemento: '',
      bairro: 'Centro',
      cidadeId: '4852',
      cidade: 'Nova Friburgo',
      estadoId: '19',
      estado: 'Rio de Janeiro',
      uf: 'RJ',
      latitude: -22.35,
      longitude: -42.6,
    },
  ];

  function buildService(): CepService {
    const repoMock: Pick<CepRepository, 'getByCep' | 'getAll'> = {
      getByCep: (cep: string) => records.find((item) => item.cep === cep),
      getAll: () => records,
    };

    return new CepService(repoMock as CepRepository);
  }

  it('deve lançar NotFoundException quando o CEP de origem não existir', () => {
    const service = buildService();

    expect(() => service.searchByRadius({ cep: '99999999', raioKm: 5 })).toThrow(NotFoundException);
  });

  it('deve retornar apenas CEPs dentro do raio informado', () => {
    const service = buildService();

    const result = service.searchByRadius({ cep: '28605-170', raioKm: 2 });

    expect(result.cepOrigem).toBe('28605170');
    expect(result.total).toBe(2);
    expect(result.ceps.map((item) => item.cep)).toEqual(['28605170', '28605171']);
  });

  it('deve ordenar o resultado pela menor distância', () => {
    const service = buildService();

    const result = service.searchByRadius({ cep: '28605170', raioKm: 20 });

    expect(result.total).toBe(3);
    expect(result.ceps[0].cep).toBe('28605170');
    expect(result.ceps[1].distanciaKm).toBeLessThanOrEqual(result.ceps[2].distanciaKm);
  });
});
