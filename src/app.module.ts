import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CepModule } from './modules/cep/cep.module';
import { TelemetryInterceptor } from './common/telemetry/telemetry.interceptor';
import { TelemetryLogger } from './common/telemetry/telemetry.logger';

@Module({
  imports: [CepModule],
  providers: [
    TelemetryLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: TelemetryInterceptor,
    },
  ],
})
export class AppModule {}
