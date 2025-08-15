export const GAME_CONSTANTS = {
  GRID: {
    SIZE: 10,
    TILE_WIDTH: 64,
    TILE_HEIGHT: 32,
    OFFSET_X: 400,
    OFFSET_Y: 100
  },
  COLORS: {
  TILE_FILL: 0xe3f6fc,      // Pastel blue (ground)
  TILE_BORDER: 0xb5d0e6,    // Muted blue border
  SCHOOL_ROOF: 0xf7b267,    // Pastel orange (roof)
  SCHOOL_BUILDING: 0xb7d6e6, // Pastel blue (building)
  SCHOOL_DOOR: 0xe57373,    // Pastel red (door)
  // Boundary colors (fresh, minimal, pastel)
  MUNICIPALITY_1: 0xe3e6ea, // Light gray
  MUNICIPALITY_2: 0xb7d6e6, // Pastel blue
  AREA_1: 0xd6e7cb,         // Light green
  AREA_2: 0xb7d6a3,         // Muted green
  UNIT_1: 0xffe066,         // Pastel yellow
  UNIT_2: 0xf7b267          // Pastel orange
  },
  SCHOOL: {
    DEFAULT_CAPACITY: 100,
    MIN_CAPACITY: 10,
    MAX_CAPACITY: 1000
  },
  GAME: {
    WIDTH: 900, // Default, will be overridden in browser
    HEIGHT: 600,
  BACKGROUND_COLOR: '#f7f7f5'
  }
} as const;
