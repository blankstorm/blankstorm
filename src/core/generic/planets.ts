export const planetBiomes = ['earthlike', 'volcanic', 'jungle', 'ice', 'desert', 'moon', 'islands'] as const;

export type PlanetBiome = (typeof planetBiomes)[number];
