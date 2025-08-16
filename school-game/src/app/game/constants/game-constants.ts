/**
 * @fileoverview Game configuration constants for the SchoolCity simulation.
 * 
 * This file contains all the static configuration values used throughout
 * the game, including grid dimensions, color schemes, school definitions,
 * and visual component specifications. These constants ensure consistent
 * behavior and appearance across the entire application.
 * 
 * The constants are organized into logical groups:
 * - GRID: Isometric grid layout and positioning
 * - COLORS: Default color values (many overridden by theme service)
 * - SCHOOL: School types, capacities, and visual components
 * - GAME: Basic game window dimensions and settings
 * 
 * @author SchoolCity Development Team
 * @version 1.0.0
 */

/**
 * Central configuration object containing all game constants.
 * 
 * Using 'as const' ensures TypeScript treats these as immutable values
 * and provides better type inference for the constant values.
 */
export const GAME_CONSTANTS = {
  /**
   * Isometric grid configuration
   */
  GRID: {
    /** Number of tiles in each direction (creates SIZE x SIZE grid) */
    SIZE: 10,
    /** Width of each isometric tile in pixels */
    TILE_WIDTH: 64,
    /** Height of each isometric tile in pixels */
    TILE_HEIGHT: 32,
    /** Initial horizontal offset for grid positioning */
    OFFSET_X: 400,
    /** Initial vertical offset for grid positioning */
    OFFSET_Y: 100
  },

  /**
   * Color definitions for game elements.
   * Note: Many of these are now overridden by the ThemeService for light/dark mode support.
   */
  COLORS: {
    /** Default tile fill color (light theme) */
    TILE_FILL: 0xf0f7ff,
    /** Default tile border color (light theme) */
    TILE_BORDER: 0xe1ebf0,
    /** School roof color */
    SCHOOL_ROOF: 0xf472b6,    // Pink
    /** School building color */
    SCHOOL_BUILDING: 0x7dd3fc, // Light blue
    /** School door color */
    SCHOOL_DOOR: 0x10b981,    // Green
    
    // Legacy boundary colors (now handled by MunicipalityManagerService)
    MUNICIPALITY_1: 0xe3e6ea,
    MUNICIPALITY_2: 0xb7d6e6,
    AREA_1: 0xd6e7cb,
    AREA_2: 0xb7d6a3,
    UNIT_1: 0xffe066,
    UNIT_2: 0xf7b267
  },

  /**
   * School configuration and definitions
   */
  SCHOOL: {
    /** Default student capacity for basic schools */
    DEFAULT_CAPACITY: 100,
    /** Minimum allowed student capacity */
    MIN_CAPACITY: 10,
    /** Maximum allowed student capacity */
    MAX_CAPACITY: 1000,
    
    /**
     * Multi-tile school complex type definitions.
     * Each type defines the grid size and student capacity.
     */
    TYPES: {
      ELEMENTARY: {
        size: { width: 2, height: 2 },
        capacity: 150,
        name: 'Elementary School'
      },
      MIDDLE: {
        size: { width: 3, height: 3 },
        capacity: 300,
        name: 'Middle School'
      },
      HIGH: {
        size: { width: 4, height: 3 },
        capacity: 600,
        name: 'High School'
      }
    },
    
    /**
     * Visual component definitions for detailed school rendering.
     * Each component has a color and display name for building variety.
     */
    COMPONENTS: {
      MAIN_BUILDING: { color: 0x7dd3fc, name: 'Main Building' },
      GYMNASIUM: { color: 0xfbbf24, name: 'Gymnasium' },
      PLAYGROUND: { color: 0x10b981, name: 'Playground' },
      PARKING: { color: 0x6b7280, name: 'Parking' },
      SPORTS_COURT: { color: 0xf472b6, name: 'Sports Court' },
      CAFETERIA: { color: 0xa78bfa, name: 'Cafeteria' },
      LIBRARY: { color: 0x34d399, name: 'Library' },
      GARDEN: { color: 0x4ade80, name: 'Garden' }
    }
  },

  /**
   * Basic game window and display settings
   */
  GAME: {
    /** Default game window width */
    WIDTH: 900,
    /** Default game window height */
    HEIGHT: 600,
    /** Default background color (light theme) */
    BACKGROUND_COLOR: '#f8fafb'
  }
} as const;
