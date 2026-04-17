import { Controller, Get, Query } from '@nestjs/common';
import { SearchRadiusDto } from './dto/search-radius.dto';
import { CepService } from './cep.service';

@Controller('ceps')
export class CepController {
  constructor(private readonly cepService: CepService) {}

  @Get('radius')
  searchByRadius(@Query() query: SearchRadiusDto) {
    return this.cepService.searchByRadius(query);
  }
}
