import { calculateBoundingBox, haversineDistanceKm } from '../../../../src/modules/cep/domain/geo';

describe('geo utils', () => {
  it('deve retornar distância zero para coordenadas iguais', () => {
    expect(haversineDistanceKm(-22.281, -42.531, -22.281, -42.531)).toBeCloseTo(0, 6);
  });

  it('deve calcular distância aproximada entre dois pontos conhecidos', () => {
    const distance = haversineDistanceKm(-22.281, -42.531, -22.271, -42.521);
    expect(distance).toBeGreaterThan(1.4);
    expect(distance).toBeLessThan(1.6);
  });

  it('deve calcular um bounding box válido ao redor do ponto', () => {
    const box = calculateBoundingBox(-22.281, -42.531, 5);
    expect(box.minLat).toBeLessThan(-22.281);
    expect(box.maxLat).toBeGreaterThan(-22.281);
    expect(box.minLon).toBeLessThan(-42.531);
    expect(box.maxLon).toBeGreaterThan(-42.531);
  });
});
