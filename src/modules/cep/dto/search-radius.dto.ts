import { Transform, Type } from 'class-transformer';
import { IsNumber, IsString, Matches, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchRadiusDto {
  @ApiProperty({
    example: '01001000',
    description: 'CEP de origem para busca de vizinhanca',
  })
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP inválido' })
  cep!: string;

  @ApiProperty({
    example: 5,
    description: 'Raio da busca em quilometros',
    minimum: 0.1,
    maximum: 200,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1, { message: 'raioKm deve ser maior que 0' })
  @Max(200, { message: 'raioKm deve ser menor ou igual a 200' })
  raioKm!: number;
}
