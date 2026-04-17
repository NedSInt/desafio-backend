import { Transform, Type } from 'class-transformer';
import { IsNumber, IsString, Matches, Max, Min } from 'class-validator';

export class SearchRadiusDto {
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP inválido' })
  cep!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1, { message: 'raioKm deve ser maior que 0' })
  @Max(200, { message: 'raioKm deve ser menor ou igual a 200' })
  raioKm!: number;
}
