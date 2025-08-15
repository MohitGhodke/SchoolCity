export const GAME_CONSTANTS = {
  GRID: {
    SIZE: 10,
    TILE_WIDTH: 64,
    TILE_HEIGHT: 32,
    OFFSET_X: 400,
    OFFSET_Y: 100
  },
  COLORS: {
  TILE_FILL: 0xd3ccb8,      // Slightly darker beige for visible grid
    TILE_BORDER: 0xcfc6b8,    // Muted beige (tile border)
    SCHOOL_ROOF: 0x8b7b6b,    // Brown roof
    SCHOOL_BUILDING: 0xdbeac6, // Light green building
    SCHOOL_DOOR: 0x9e4b3c,    // Red door
    // Boundary colors (soft, muted, natural)
    MUNICIPALITY_1: 0xcfc6b8, // Beige
    MUNICIPALITY_2: 0xa7bfa4, // Muted green
    AREA_1: 0xdbeac6,         // Light green
    AREA_2: 0xb7c7a4,         // Muted olive
    UNIT_1: 0xe7e1cb,         // Soft sand
    UNIT_2: 0x8b7b6b          // Brown
  },
  SCHOOL: {
    DEFAULT_CAPACITY: 100,
    MIN_CAPACITY: 10,
    MAX_CAPACITY: 1000
  },
  GAME: {
    WIDTH: 900, // Default, will be overridden in browser
    HEIGHT: 600,
    BACKGROUND_COLOR: '#e7e1cb'
  }
} as const;
