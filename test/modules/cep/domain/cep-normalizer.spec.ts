import { isValidCepFormat, normalizeCep } from '../../../../src/modules/cep/domain/cep-normalizer';

describe('cep-normalizer', () => {
  it('deve remover caracteres não numéricos do CEP', () => {
    expect(normalizeCep('28605-170')).toBe('28605170');
    expect(normalizeCep(' 28.605-170 ')).toBe('28605170');
  });

  it('deve validar apenas CEP com 8 dígitos', () => {
    expect(isValidCepFormat('28605170')).toBe(true);
    expect(isValidCepFormat('28605-170')).toBe(false);
    expect(isValidCepFormat('1234567')).toBe(false);
  });
});
