/**
 * @fileoverview Asset models for the SchoolCity game.
 * 
 * This file defines the data structures for various game assets such as roads,
 * trees, and other decorative elements that can be placed on the map.
 * 
 * @author SchoolCity Development Team
 * @version 1.0.0
 */

/**
 * Asset categories for organizing different types of assets
 */
export enum AssetCategory {
  ROADS = 'roads',
  TREES = 'trees',
  DECORATIONS = 'decorations'
}

/**
 * Road types with different styles and connection patterns
 */
export enum RoadType {
  STRAIGHT_HORIZONTAL = 'straight-horizontal',
  STRAIGHT_VERTICAL = 'straight-vertical',
  CORNER_NE = 'corner-ne',
  CORNER_NW = 'corner-nw',
  CORNER_SE = 'corner-se',
  CORNER_SW = 'corner-sw',
  T_JUNCTION_N = 't-junction-n',
  T_JUNCTION_E = 't-junction-e',
  T_JUNCTION_S = 't-junction-s',
  T_JUNCTION_W = 't-junction-w',
  CROSS = 'cross'
}

/**
 * Tree types with different visual styles
 */
export enum TreeType {
  OAK = 'oak',
  PINE = 'pine',
  PALM = 'palm',
  MAPLE = 'maple',
  WILLOW = 'willow'
}

/**
 * Base interface for all assets
 */
export interface Asset {
  /** Unique identifier for the asset instance */
  id: string;
  /** Category of the asset */
  category: AssetCategory;
  /** Type/variant of the asset within its category */
  type: string;
  /** Grid X position */
  x: number;
  /** Grid Y position */
  y: number;
  /** Display name */
  name: string;
  /** Optional color override for the asset */
  color?: number;
}

/**
 * Road asset with specific road type
 */
export interface RoadAsset extends Asset {
  category: AssetCategory.ROADS;
  type: RoadType;
}

/**
 * Tree asset with specific tree type
 */
export interface TreeAsset extends Asset {
  category: AssetCategory.TREES;
  type: TreeType;
}

/**
 * Asset definition for the asset library/palette
 */
export interface AssetDefinition {
  /** Unique type identifier */
  type: string;
  /** Category this asset belongs to */
  category: AssetCategory;
  /** Display name */
  name: string;
  /** Default color for rendering */
  color: number;
  /** Icon for UI (Material Icons name) */
  icon?: string;
}
