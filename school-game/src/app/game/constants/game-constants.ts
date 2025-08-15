export const GAME_CONSTANTS = {
  GRID: {
    SIZE: 10,
    TILE_WIDTH: 64,
    TILE_HEIGHT: 32,
    OFFSET_X: 400,
    OFFSET_Y: 100
  },
  COLORS: {
  TILE_FILL: 0xf0f7ff,      // Light theme default - will be overridden by theme service
  TILE_BORDER: 0xe1ebf0,    // Light theme default - will be overridden by theme service
  SCHOOL_ROOF: 0xf472b6,    // Pink roof
  SCHOOL_BUILDING: 0x7dd3fc, // Light blue building
  SCHOOL_DOOR: 0x10b981,    // Green door
  // Legacy colors - now handled by theme service
  MUNICIPALITY_1: 0xe3e6ea,
  MUNICIPALITY_2: 0xb7d6e6,
  AREA_1: 0xd6e7cb,
  AREA_2: 0xb7d6a3,
  UNIT_1: 0xffe066,
  UNIT_2: 0xf7b267
  },
  SCHOOL: {
    DEFAULT_CAPACITY: 100,
    MIN_CAPACITY: 10,
    MAX_CAPACITY: 1000
  },
  GAME: {
    WIDTH: 900,
    HEIGHT: 600,
  BACKGROUND_COLOR: '#f8fafb' // Light theme default
  }
} as const;
