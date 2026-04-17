import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchRadiusDto } from './dto/search-radius.dto';
import { CepService } from './cep.service';

@ApiTags('ceps')
@Controller('ceps')
export class CepController {
  constructor(private readonly cepService: CepService) {}

  @ApiOperation({ summary: 'Busca CEPs dentro de um raio em KM' })
  @ApiQuery({ name: 'cep', required: true, example: '01001000' })
  @ApiQuery({ name: 'raioKm', required: true, example: 5 })
  @ApiOkResponse({
    description: 'Lista de CEPs encontrados dentro do raio informado.',
    schema: {
      example: {
        cepOrigem: '01001000',
        raioKm: 5,
        total: 2,
        ceps: [
          {
            cep: '01002000',
            uf: 'SP',
            cidade: 'Sao Paulo',
            bairro: 'Se',
            logradouro: 'Rua Exemplo',
            latitude: -23.55,
            longitude: -46.63,
            distanciaKm: 1.23,
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Parâmetros inválidos (CEP ou raioKm).' })
  @ApiNotFoundResponse({ description: 'CEP não encontrado na base.' })
  @Get('radius')
  searchByRadius(@Query() query: SearchRadiusDto) {
    return this.cepService.searchByRadius(query);
  }
}
