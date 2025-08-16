/**
 * @fileoverview Core rendering service for the SchoolCity isometric game engine.
 * 
 * This service handles all visual rendering operations for the game, including:
 * - Isometric grid tile rendering
 * - Coordinate system transformations (grid ↔ screen)
 * - School sprite positioning and scaling
 * - Municipality/boundary visualization
 * - Zoom and camera controls
 * - Integration with Phaser.js graphics engine
 * 
 * The service acts as a bridge between the game's logical coordinate system
 * (grid-based) and the visual coordinate system (screen pixels), handling
 * all the mathematical transformations required for isometric projection.
 * 
 * @author SchoolCity Development Team
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { GAME_CONSTANTS } from '../constants/game-constants';
import { MunicipalityManagerService } from './municipality-manager.service';
import { ThemeService } from './theme.service';
import { Tile } from './grid.service';

/**
 * Configuration interface for rendering parameters
 */
export interface RenderConfig {
  /** Width of isometric tiles in pixels */
  tileWidth: number;
  /** Height of isometric tiles in pixels */
  tileHeight: number;
  /** Horizontal offset for positioning the grid */
  mapOffsetX: number;
  /** Vertical offset for positioning the grid */
  mapOffsetY: number;
}

/**
 * Main rendering service that handles all visual aspects of the game.
 * 
 * This service is responsible for:
 * - Converting between grid coordinates and screen pixels
 * - Drawing isometric tiles with proper perspective
 * - Rendering school buildings and components
 * - Managing zoom levels and camera positioning
 * - Coordinating with Phaser.js for sprite management
 */

@Injectable({
  providedIn: 'root'
})
export class RenderingService {
  // Core Graphics Objects
  /** Phaser.js graphics object for drawing tiles and shapes */
  private graphics: any = null;
  
  /** Phaser.js scene reference for sprite management */
  private scene: any = null;
  
  // Rendering Configuration
  /** Current rendering configuration (tile sizes, offsets) */
  private config: RenderConfig;
  
  /** Current zoom level (0.5x to 2x) */
  private zoom: number = 1;

  // Camera/Pan State
  /** Camera X offset for panning */
  private cameraOffsetX: number = 0;
  
  /** Camera Y offset for panning */
  private cameraOffsetY: number = 0;
  
  /** Canvas dimensions for pan boundary calculations */
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  
  /** Grid size for pan boundary calculations */
  private gridSize: number = 0;

  /**
   * Constructor - inject required services and initialize configuration
   */
  constructor(
    private municipalityManager: MunicipalityManagerService,
    private themeService: ThemeService
  ) {
    // Initialize rendering configuration from game constants
    this.config = {
      tileWidth: GAME_CONSTANTS.GRID.TILE_WIDTH,
      tileHeight: GAME_CONSTANTS.GRID.TILE_HEIGHT,
      mapOffsetX: GAME_CONSTANTS.GRID.OFFSET_X,
      mapOffsetY: GAME_CONSTANTS.GRID.OFFSET_Y
    };
  }

  // Zoom Management Methods

  /**
   * Set the current zoom level with bounds checking
   * @param zoom - Desired zoom level (clamped between 0.5 and 2.0)
   */
  setZoom(zoom: number): void {
    this.zoom = Math.max(0.5, Math.min(zoom, 2)); // Clamp between 0.5x and 2x
    // Apply pan boundaries after zoom change as grid size changes
    this.applyPanBoundaries();
  }

  /**
   * Get the current zoom level
   * @returns Current zoom multiplier
   */
  getZoom(): number {
    return this.zoom;
  }

  // Camera/Pan Management

  /**
   * Set camera offset for panning
   * @param deltaX - Change in X offset
   * @param deltaY - Change in Y offset
   */
  panCamera(deltaX: number, deltaY: number): void {
    this.cameraOffsetX += deltaX;
    this.cameraOffsetY += deltaY;
    
    // Apply pan boundaries to prevent dragging too far from the grid
    this.applyPanBoundaries();
  }

  /**
   * Reset camera position to center
   */
  resetCameraPosition(): void {
    this.cameraOffsetX = 0;
    this.cameraOffsetY = 0;
  }

  /**
   * Apply boundaries to prevent panning too far from the grid
   */
  private applyPanBoundaries(): void {
    if (this.gridSize === 0) return;
    
    // For isometric grids, calculate the diamond-shaped bounds more accurately
    // The grid forms a diamond, so we need to account for the actual rendered size
    const tileWidth = this.config.tileWidth * this.zoom;
    const tileHeight = this.config.tileHeight * this.zoom;
    
    // Calculate the actual diamond size
    // In isometric view, the total width and height are determined by the diamond shape
    const totalGridWidth = this.gridSize * tileWidth;  // Diamond width (left to right)
    const totalGridHeight = this.gridSize * tileHeight; // Diamond height (top to bottom)
    
    // Define how much we can pan beyond the grid edges (in pixels)
    const panBuffer = 300; // Increased buffer for better mobile experience
    
    // Calculate maximum pan offsets
    // For isometric grids, we need more generous boundaries especially for height
    const maxPanX = Math.max(panBuffer, (totalGridWidth - this.canvasWidth) / 2 + panBuffer);
    const maxPanY = Math.max(panBuffer, (totalGridHeight - this.canvasHeight) / 2 + panBuffer);
    
    // Clamp camera offsets within boundaries
    this.cameraOffsetX = Math.max(-maxPanX, Math.min(maxPanX, this.cameraOffsetX));
    this.cameraOffsetY = Math.max(-maxPanY, Math.min(maxPanY, this.cameraOffsetY));
  }

  /**
   * Get current camera offset
   * @returns Object with camera X and Y offsets
   */
  getCameraOffset(): { x: number; y: number } {
    return { x: this.cameraOffsetX, y: this.cameraOffsetY };
  }

  // Graphics Context Management

  /**
   * Set the Phaser graphics object for drawing operations
   * @param graphics - Phaser.js graphics context
   */
  setGraphics(graphics: any): void {
    this.graphics = graphics;
  }

  /**
   * Set the Phaser scene for sprite management
   * @param scene - Phaser.js scene instance
   */
  setScene(scene: any): void {
    this.scene = scene;
  }

  // Configuration Management

  /**
   * Update rendering configuration
   * @param config - Partial configuration object to merge with current config
   */
  setConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get a copy of the current rendering configuration
   * @returns Current rendering configuration
   */
  getConfig(): RenderConfig {
    return { ...this.config };
  }

  // Grid Positioning

  /**
   * Center the isometric grid within the given canvas dimensions
   * @param canvasWidth - Width of the canvas in pixels
   * @param canvasHeight - Height of the canvas in pixels  
   * @param gridSize - Size of the grid (number of tiles per side)
   */
  centerGrid(canvasWidth: number, canvasHeight: number, gridSize: number): void {
    // Store canvas dimensions and grid size for pan boundary calculations
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.gridSize = gridSize;
    
    // For isometric grid, calculate the actual rendered size
    const tileWidth = this.config.tileWidth;
    const tileHeight = this.config.tileHeight;
    
    // The grid forms a diamond shape when viewed isometrically
    // Total width: gridSize tiles across the diagonal = gridSize * tileWidth
    // Total height: gridSize tiles down the diagonal = gridSize * tileHeight  
    const totalGridWidth = gridSize * tileWidth;
    const totalGridHeight = gridSize * tileHeight;
    
    // Center the grid in the available space
    this.config.mapOffsetX = (canvasWidth - totalGridWidth) / 2 + (totalGridWidth / 2);
    this.config.mapOffsetY = (canvasHeight - totalGridHeight) / 2 + (totalGridHeight / 4);
  }

  // Graphics Clearing

  /**
   * Clear all graphics and sprites to prepare for re-rendering
   */
  clearGraphics(): void {
    // Clear the graphics canvas for tiles (they get redrawn each frame)
    if (this.graphics) {
      this.graphics.clear();
    }
    
    // Clear any existing school sprites to avoid duplicates
    if (this.scene) {
      const schoolSprites = this.scene.children.list.filter((child: any) => 
        child.texture && child.texture.key === 'school'
      );
      schoolSprites.forEach((sprite: any) => sprite.destroy());
    }
  }

  // Tile Rendering

  /**
   * Draw a single isometric tile with the specified colors
   * @param x - Grid X coordinate
   * @param y - Grid Y coordinate  
   * @param color - Fill color for the tile
   * @param borderColor - Border color for the tile
   * @param tile - Optional tile data for boundary coloring
   */
  drawTile(x: number, y: number, color: number, borderColor: number, tile?: Tile): void {
    if (!this.graphics) return;

    const { sx, sy } = this.gridToScreen(x, y);
    const z = this.zoom;
    const halfTileW = (this.config.tileWidth / 2) * z;
    const halfTileH = (this.config.tileHeight / 2) * z;
    const tileH = this.config.tileHeight * z;

    // Draw tile diamond shape
    this.graphics.fillStyle(color, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(sx, sy);
    this.graphics.lineTo(sx + halfTileW, sy + halfTileH);
    this.graphics.lineTo(sx, sy + tileH);
    this.graphics.lineTo(sx - halfTileW, sy + halfTileH);
    this.graphics.closePath();
    this.graphics.fill();

    // Draw border
    this.graphics.lineStyle(1, borderColor, 1);
    this.graphics.strokePath();
  }

  // Municipality/Boundary Rendering

  /**
   * Draw a municipality boundary visualization
   * @param x - Grid X coordinate
   * @param y - Grid Y coordinate
   * @param municipality - Municipality data with color and properties
   */
  drawMunicipality(x: number, y: number, municipality: any): void {
    if (!this.graphics) return;

    const { sx, sy } = this.gridToScreen(x, y);
    const z = this.zoom;
    const halfTileW = (this.config.tileWidth / 2) * z;
    const halfTileH = (this.config.tileHeight / 2) * z;

    // Draw municipality base
    this.graphics.fillStyle(municipality.color, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(sx, sy);
    this.graphics.lineTo(sx + halfTileW, sy + halfTileH);
    this.graphics.lineTo(sx, sy + this.config.tileHeight * z);
    this.graphics.lineTo(sx - halfTileW, sy + halfTileH);
    this.graphics.closePath();
    this.graphics.fill();

    // Draw municipality border
    this.graphics.lineStyle(2, 0x000000, 1);
    this.graphics.strokePath();

    // Draw municipality center marker
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(sx, sy + halfTileH, 4 * z);
    this.graphics.lineStyle(1, 0x000000, 1);
    this.graphics.strokeCircle(sx, sy + halfTileH, 4 * z);
  }

  // School Component Rendering

  /**
   * Draw a school component (building, playground, etc.)
   * @param component - Component data with position and type information
   */
  drawSchoolComponent(component: any): void {
    if (!this.graphics) return;

    // Get component position and info
    const { x, y } = component.position;
    const componentType = component.type;
    
    // Draw sprite instead of canvas drawing
    const { sx, sy } = this.gridToScreen(x, y);
    this.drawComponentSprite(sx, sy, componentType);
  }

  /**
   * Draw a school sprite at the specified screen coordinates
   * @param screenX - Screen X coordinate in pixels
   * @param screenY - Screen Y coordinate in pixels
   * @param componentType - Type of school component for visual variation
   * @returns The created Phaser sprite object
   */
  private drawComponentSprite(screenX: number, screenY: number, componentType: string): any {
    if (!this.scene) return;

    // Create sprite using the school texture
    const sprite = this.scene.add.image(screenX, screenY, 'school');
    
    // Scale to fit exactly within 4 diamond tiles (2x2 area)
    sprite.setScale(this.zoom * 0.035);
    
    // Set origin to center the sprite exactly on the grid position
    // (0.5, 0.5) centers the sprite perfectly on the grid coordinate
    sprite.setOrigin(0.5, 0.5);
    
    // Add depth for proper layering (schools render above tiles)
    sprite.setDepth(screenY + 1000);
    
    return sprite;
  }

  // Coordinate System Transformations

  /**
   * Convert grid coordinates to screen pixel coordinates
   * @param x - Grid X coordinate
   * @param y - Grid Y coordinate
   * @returns Object with screen coordinates {sx, sy}
   */
  gridToScreen(x: number, y: number): { sx: number; sy: number } {
    // Simple isometric conversion with zoom and camera offset applied
    const z = this.zoom;
    const sx = this.config.mapOffsetX + (x - y) * (this.config.tileWidth / 2) * z + this.cameraOffsetX;
    const sy = this.config.mapOffsetY + (x + y) * (this.config.tileHeight / 2) * z + this.cameraOffsetY;
    
    return { sx, sy };
  }

  /**
   * Convert screen pixel coordinates to grid coordinates
   * @param sx - Screen X coordinate in pixels
   * @param sy - Screen Y coordinate in pixels
   * @returns Object with grid coordinates {x, y}
   */
  screenToGrid(sx: number, sy: number): { x: number; y: number } {
    // Simple reverse isometric conversion with camera offset
    const z = this.zoom;
    const adjustedX = (sx - this.config.mapOffsetX - this.cameraOffsetX) / z;
    const adjustedY = (sy - this.config.mapOffsetY - this.cameraOffsetY) / z;
    
    const x = Math.round((adjustedX / (this.config.tileWidth / 2) + adjustedY / (this.config.tileHeight / 2)) / 2);
    const y = Math.round((adjustedY / (this.config.tileHeight / 2) - adjustedX / (this.config.tileWidth / 2)) / 2);
    
    return { x, y };
  }
}
