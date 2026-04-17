import { Module } from '@nestjs/common';
import { CepController } from './cep.controller';
import { CepService } from './cep.service';
import { CepRepository } from './infra/cep.repository';

@Module({
  controllers: [CepController],
  providers: [CepService, CepRepository],
})
export class CepModule {}
