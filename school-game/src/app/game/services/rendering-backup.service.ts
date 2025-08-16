


import { Injectable } from '@angular/core';
import { GAME_CONSTANTS } from '../constants/game-constants';
import { MunicipalityManagerService } from './municipality-manager.service';
import { ThemeService } from './theme.service';
import { Tile } from './grid.service';

export interface RenderConfig {
  tileWidth: number;
  tileHeight: number;
  mapOffsetX: number;
  mapOffsetY: number;
}

interface SpriteAssets {
  [key: string]: any; // Phaser sprite objects
}

@Injectable({
  providedIn: 'root'
})
export class RenderingService {
  private graphics: any = null;
  private scene: any = null; // Phaser scene for sprite management
  private config: RenderConfig;
  private zoom: number = 1;
  private sprites: SpriteAssets = {};
  private loadedAssets: Set<string> = new Set();

  // Simple approach: one free isometric building image for all components
  private buildingImageUrl = 'https://kenney.nl/media/pages/assets/isometric-buildings/4004797493-1609853704/preview.png';
  private buildingTexture: any = null;

  setZoom(zoom: number) {
    this.zoom = Math.max(0.5, Math.min(zoom, 2)); // Clamp between 0.5x and 2x
  }

  getZoom(): number {
    return this.zoom;
  }



  constructor(
    private municipalityManager: MunicipalityManagerService,
    private themeService: ThemeService
  ) {
    this.config = {
      tileWidth: GAME_CONSTANTS.GRID.TILE_WIDTH,
      tileHeight: GAME_CONSTANTS.GRID.TILE_HEIGHT,
      mapOffsetX: GAME_CONSTANTS.GRID.OFFSET_X,
      mapOffsetY: GAME_CONSTANTS.GRID.OFFSET_Y
    };
  }

  /**
   * Center the grid in the canvas based on canvas size and grid size.
   */
  centerGrid(canvasWidth: number, canvasHeight: number, gridSize?: number) {
    const size = gridSize ?? GAME_CONSTANTS.GRID.SIZE;
    const gridPixelWidth = size * this.config.tileWidth;
    const gridPixelHeight = size * (this.config.tileHeight / 2);
    this.setConfig({
      mapOffsetX: Math.floor((canvasWidth - gridPixelWidth) / 2 + gridPixelWidth / 2),
      mapOffsetY: Math.floor((canvasHeight - gridPixelHeight) / 2)
    });
  }

  setGraphics(graphics: any): void {
    this.graphics = graphics;
  }

  setScene(scene: any): void {
    this.scene = scene;
    this.loadBuildingImage();
  }

  /**
   * Load a single building image to use for all school components
   */
  private loadBuildingImage(): void {
    if (!this.scene || this.buildingTexture) return;

    // Use a simple fallback if the online image fails
    this.createSimpleBuildingSprite();
  }

  /**
   * Create a simple isometric building sprite as fallback
   */
  private createSimpleBuildingSprite(): void {
    if (!this.scene) return;

    const graphics = this.scene.add.graphics();
    
    // Draw a simple but clean isometric building
    graphics.fillStyle(0xD2691E); // Brown brick color
    graphics.fillRect(0, 20, 32, 32); // Base
    
    graphics.fillStyle(0x8B4513); // Darker brown for walls
    graphics.fillRect(6, 12, 20, 20); // Building body
    
    graphics.fillStyle(0x654321); // Dark brown roof
    graphics.fillRect(4, 8, 24, 8); // Roof
    
    // Add some windows
    graphics.fillStyle(0x87CEEB); // Sky blue windows
    graphics.fillRect(10, 16, 4, 4);
    graphics.fillRect(18, 16, 4, 4);
    
    // Convert to reusable texture
    this.buildingTexture = graphics.generateTexture('building', 64, 64);
    graphics.destroy();
    
    console.log('Simple building sprite created');
  }

  setConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): RenderConfig {
    return { ...this.config };
  }

  clearGraphics(): void {
    if (this.graphics) {
      this.graphics.clear();
    }
  }

  drawTile(x: number, y: number, color: number, borderColor: number, tile?: Tile): void {
    if (!this.graphics) return;

    // Default to the passed color (which should be the default tile color)
    let fillColor = color;
    
    if (tile) {
      // Check if tile has any boundary assignments - use strict string checks
      const hasMunicipality = tile.municipalityId && tile.municipalityId.trim() !== '';
      const hasArea = tile.areaId && tile.areaId.trim() !== '';
      const hasUnit = tile.unitId && tile.unitId.trim() !== '';
      
      if (hasUnit) {
        // Unit has highest priority
        fillColor = this.municipalityManager.getColorForBoundary(tile.unitId);
      } else if (hasArea) {
        // Area has medium priority
        fillColor = this.municipalityManager.getColorForBoundary(tile.areaId);
      } else if (hasMunicipality) {
        // Municipality has lowest priority
        fillColor = this.municipalityManager.getColorForBoundary(tile.municipalityId);
      } else {
        // No boundaries assigned - use default tile color from theme
        fillColor = this.themeService.getTileColors().default;
      }
    } else {
      // No tile data - use default color from theme
      fillColor = this.themeService.getTileColors().default;
    }

    const { sx, sy } = this.gridToScreen(x, y);
    const z = this.zoom;
    // Manually scale positions and sizes for zoom
    const centerX = sx;
    const centerY = sy;
    const halfTileW = (this.config.tileWidth / 2) * z;
    const halfTileH = (this.config.tileHeight / 2) * z;
    const tileH = this.config.tileHeight * z;

    this.graphics.lineStyle(1, borderColor, 1);
    this.graphics.fillStyle(fillColor, 1);
    
    // Draw diamond shape using basic path methods (compatible with Phaser 3)
    this.graphics.beginPath();
    this.graphics.moveTo(centerX, centerY);
    this.graphics.lineTo(centerX + halfTileW, centerY + halfTileH);
    this.graphics.lineTo(centerX, centerY + tileH);
    this.graphics.lineTo(centerX - halfTileW, centerY + halfTileH);
    this.graphics.closePath();
    this.graphics.fill();
    this.graphics.stroke();
  }

  drawSchool(x: number, y: number): void {
    if (!this.graphics) return;

    const { sx, sy } = this.gridToScreen(x, y);
    const z = this.zoom;
    // Manually scale positions and sizes for zoom
    const ox = sx;
    const oy = sy + (this.config.tileHeight / 2) * z;

    // Simple building icon for single tile (backwards compatibility)
    // Roof - draw as a rectangle using fillRect
    this.graphics.fillStyle(GAME_CONSTANTS.COLORS.SCHOOL_ROOF, 1);
    this.graphics.fillRect(ox - 12 * z, oy - 24 * z, 24 * z, 12 * z);

    // Building - draw as a rectangle using fillRect
    this.graphics.fillStyle(GAME_CONSTANTS.COLORS.SCHOOL_BUILDING, 1);
    this.graphics.fillRect(ox - 12 * z, oy - 12 * z, 24 * z, 24 * z);

    // Door - draw as a rectangle using fillRect
    this.graphics.fillStyle(GAME_CONSTANTS.COLORS.SCHOOL_DOOR, 1);
    this.graphics.fillRect(ox - 3 * z, oy, 6 * z, 12 * z);
  }

  /**
   * Draw enhanced multi-tile school complex
   */
  drawSchoolComplex(school: any): void {
    if (!this.graphics || !school.layout) return;

    const z = this.zoom;
    
    // Draw each component of the school using regular for loop to preserve 'this' context
    for (let i = 0; i < school.layout.length; i++) {
      const component = school.layout[i];
      const absoluteX = school.position.x + component.position.x;
      const absoluteY = school.position.y + component.position.y;
      
      this.drawSchoolComponent(
        absoluteX,
        absoluteY,
        component.type,
        component.size
      );
    }
  }

  /**
   * Draw individual school component using high-quality sprites
   */
  private drawSchoolComponent(
    x: number, 
    y: number, 
    componentType: string, 
    size: { width: number; height: number }
  ): void {
    if (!this.scene) return;

    // Draw each tile of the component with sprites
    for (let dx = 0; dx < size.width; dx++) {
      for (let dy = 0; dy < size.height; dy++) {
        const tileX = x + dx;
        const tileY = y + dy;
        const { sx, sy } = this.gridToScreen(tileX, tileY);
        
        // Use sprite instead of canvas drawing
        this.drawComponentSprite(sx, sy, componentType);
      }
    }
  }

  /**
   * Draw a sprite at the specified screen coordinates
   */
  private drawComponentSprite(screenX: number, screenY: number, componentType: string): void {
    if (!this.scene || !this.buildingTexture) return;

    // Create sprite instance using the single building texture
    const sprite = this.scene.add.image(screenX, screenY, 'building');
    
    // Scale sprite based on zoom
    sprite.setScale(this.zoom * 0.8); // Scale down a bit to fit nicely
    
    // Set origin to center for proper positioning
    sprite.setOrigin(0.5, 0.8); // Bottom center anchor
    
    // Add depth for proper layering
    sprite.setDepth(screenY);
    
    // Slightly tint different building types for variety
    switch (componentType) {
      case 'MAIN_BUILDING':
        sprite.setTint(0xffffff); // White (normal)
        break;
      case 'GYMNASIUM':
        sprite.setTint(0xaaffaa); // Light green tint
        break;
      case 'SPORTS_COURT':
        sprite.setTint(0xffaaaa); // Light red tint
        break;
      case 'CAFETERIA':
        sprite.setTint(0xaaaaff); // Light blue tint
        break;
      case 'LIBRARY':
        sprite.setTint(0xffffaa); // Light yellow tint
        break;
      default:
        sprite.setTint(0xf0f0f0); // Light gray tint
        break;
    }
    
    return sprite;
  }

  /**
   * Professional-looking building sprite (simulates 3D render)
   */
  private drawProfessionalBuilding(graphics: any, size: number): void {
    const center = size / 2;
    
    // Base foundation with gradient effect
    graphics.fillGradientStyle(0xe8e8e8, 0xe8e8e8, 0xd0d0d0, 0xd0d0d0, 1);
    graphics.fillRect(4, size - 8, size - 8, 8);
    
    // Main building structure with realistic 3D effect
    graphics.fillGradientStyle(0xd35400, 0xd35400, 0xa04000, 0xa04000, 1);
    graphics.fillRect(8, 16, size - 16, size - 24);
    
    // Roof with depth
    graphics.fillGradientStyle(0x8b4513, 0x8b4513, 0x6b3510, 0x6b3510, 1);
    graphics.fillRect(6, 12, size - 12, 8);
    
    // Windows with reflective glass effect
    graphics.fillGradientStyle(0x3498db, 0x3498db, 0x1f618d, 0x1f618d, 1);
    graphics.fillRect(12, 24, 6, 8);
    graphics.fillRect(size - 18, 24, 6, 8);
    graphics.fillRect(12, 36, 6, 8);
    graphics.fillRect(size - 18, 36, 6, 8);
    
    // Window frames
    graphics.lineStyle(1, 0x2c3e50, 1);
    graphics.strokeRect(12, 24, 6, 8);
    graphics.strokeRect(size - 18, 24, 6, 8);
    
    // Entrance door with shadow
    graphics.fillGradientStyle(0x8b4513, 0x8b4513, 0x5d2f0c, 0x5d2f0c, 1);
    graphics.fillRect(center - 4, size - 16, 8, 12);
    
    // Door handle
    graphics.fillStyle(0xf1c40f, 1);
    graphics.fillCircle(center + 2, size - 10, 1);
  }

  private drawProfessionalGym(graphics: any, size: number): void {
    const center = size / 2;
    
    // Large gym base
    graphics.fillGradientStyle(0x34495e, 0x34495e, 0x2c3e50, 0x2c3e50, 1);
    graphics.fillRect(4, 18, size - 8, size - 22);
    
    // Gym roof with metallic look
    graphics.fillGradientStyle(0x1a252f, 0x1a252f, 0x0f1419, 0x0f1419, 1);
    graphics.fillRect(2, 14, size - 4, 8);
    
    // Large gym windows
    graphics.fillGradientStyle(0x2980b9, 0x2980b9, 0x1f618d, 0x1f618d, 1);
    graphics.fillRect(8, 26, size - 16, 12);
    
    // Basketball court marking
    graphics.lineStyle(2, 0xe67e22, 1);
    graphics.strokeCircle(center, center + 8, 8);
    
    // Gym equipment shadows
    graphics.fillStyle(0x1a252f, 0.3);
    graphics.fillRect(12, size - 12, 6, 4);
    graphics.fillRect(size - 18, size - 12, 6, 4);
  }

  private drawProfessionalCourt(graphics: any, size: number): void {
    const center = size / 2;
    
    // Court surface with realistic texture
    graphics.fillGradientStyle(0xe67e22, 0xe67e22, 0xd35400, 0xd35400, 1);
    graphics.fillRect(4, 16, size - 8, size - 20);
    
    // Court edge with depth
    graphics.fillStyle(0xd35400, 1);
    graphics.fillRect(4, size - 8, size - 8, 4);
    
    // Professional court lines
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeCircle(center, center + 4, 12);
    graphics.strokeRect(8, 20, size - 16, size - 28);
    
    // Center line
    graphics.beginPath();
    graphics.moveTo(8, center + 4);
    graphics.lineTo(size - 8, center + 4);
    graphics.stroke();
    
    // Basketball hoops with shadows
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(6, center, 4, 2);
    graphics.fillRect(size - 10, center, 4, 2);
    
    // Hoop shadows
    graphics.fillStyle(0x000000, 0.2);
    graphics.fillRect(7, center + 2, 4, 1);
    graphics.fillRect(size - 9, center + 2, 4, 1);
  }

  private drawProfessionalPlayground(graphics: any, size: number): void {
    const center = size / 2;
    
    // Grass base with texture
    graphics.fillGradientStyle(0x27ae60, 0x27ae60, 0x1e8449, 0x1e8449, 1);
    graphics.fillRect(0, 16, size, size - 16);
    
    // Slide structure with 3D effect
    graphics.fillGradientStyle(0xe74c3c, 0xe74c3c, 0xc0392b, 0xc0392b, 1);
    graphics.fillRect(8, 20, 12, 16);
    
    // Slide top platform
    graphics.fillStyle(0xe74c3c, 1);
    graphics.fillRect(6, 16, 16, 4);
    
    // Slide safety rails
    graphics.lineStyle(2, 0xc0392b, 1);
    graphics.strokeRect(8, 20, 12, 16);
    
    // Swing set with realistic metal
    graphics.fillGradientStyle(0x95a5a6, 0x95a5a6, 0x7f8c8d, 0x7f8c8d, 1);
    graphics.fillRect(center + 8, 22, 3, 16);
    graphics.fillRect(center + 14, 22, 3, 16);
    
    // Swing chains
    graphics.lineStyle(1, 0x7f8c8d, 1);
    graphics.beginPath();
    graphics.moveTo(center + 9, 22);
    graphics.lineTo(center + 9, 34);
    graphics.moveTo(center + 15, 22);
    graphics.lineTo(center + 15, 34);
    graphics.stroke();
    
    // Swing seats
    graphics.fillStyle(0x8b4513, 1);
    graphics.fillRect(center + 7, 34, 4, 2);
    graphics.fillRect(center + 13, 34, 4, 2);
  }

  private drawProfessionalCafeteria(graphics: any, size: number): void {
    const center = size / 2;
    
    // Cafeteria base with modern look
    graphics.fillGradientStyle(0x1abc9c, 0x1abc9c, 0x16a085, 0x16a085, 1);
    graphics.fillRect(6, 18, size - 12, size - 22);
    
    // Modern flat roof
    graphics.fillGradientStyle(0x117a65, 0x117a65, 0x0e5d4d, 0x0e5d4d, 1);
    graphics.fillRect(4, 14, size - 8, 6);
    
    // Large panoramic windows
    graphics.fillGradientStyle(0x3498db, 0x3498db, 0x2980b9, 0x2980b9, 1);
    graphics.fillRect(10, 24, size - 20, 10);
    
    // Kitchen chimney with realistic depth
    graphics.fillGradientStyle(0x7f8c8d, 0x7f8c8d, 0x566869, 0x566869, 1);
    graphics.fillRect(size - 12, 8, 6, 12);
    
    // Ventilation on chimney
    graphics.lineStyle(1, 0x566869, 1);
    graphics.strokeRect(size - 11, 10, 4, 2);
    graphics.strokeRect(size - 11, 13, 4, 2);
    
    // Modern entrance
    graphics.fillStyle(0x117a65, 1);
    graphics.fillRect(center - 3, size - 8, 6, 8);
  }

  private drawProfessionalLibrary(graphics: any, size: number): void {
    const center = size / 2;
    
    // Academic building style
    graphics.fillGradientStyle(0x8e44ad, 0x8e44ad, 0x732d91, 0x732d91, 1);
    graphics.fillRect(6, 16, size - 12, size - 20);
    
    // Classical roof
    graphics.fillGradientStyle(0x5b2c6f, 0x5b2c6f, 0x4a235a, 0x4a235a, 1);
    graphics.fillRect(4, 12, size - 8, 6);
    
    // Tall academic windows
    graphics.fillGradientStyle(0xf39c12, 0xf39c12, 0xd68910, 0xd68910, 1);
    graphics.fillRect(10, 20, 4, 16);
    graphics.fillRect(18, 20, 4, 16);
    graphics.fillRect(26, 20, 4, 16);
    graphics.fillRect(34, 20, 4, 16);
    
    // Window dividers (academic style)
    graphics.lineStyle(1, 0x732d91, 1);
    graphics.strokeRect(10, 20, 4, 16);
    graphics.strokeRect(18, 20, 4, 16);
    graphics.strokeRect(26, 20, 4, 16);
    graphics.strokeRect(34, 20, 4, 16);
    
    // Classical entrance columns
    graphics.fillStyle(0x732d91, 1);
    graphics.fillRect(center - 6, size - 12, 3, 12);
    graphics.fillRect(center + 3, size - 12, 3, 12);
  }

  private drawProfessionalGarden(graphics: any, size: number): void {
    const center = size / 2;
    
    // Rich garden soil base
    graphics.fillGradientStyle(0x2ecc71, 0x2ecc71, 0x239954, 0x239954, 1);
    graphics.fillRect(0, 20, size, size - 20);
    
    // Realistic tree with detailed trunk
    graphics.fillGradientStyle(0x8b4513, 0x8b4513, 0x5d2f0c, 0x5d2f0c, 1);
    graphics.fillRect(center - 3, 28, 6, 16);
    
    // Tree bark texture lines
    graphics.lineStyle(1, 0x5d2f0c, 1);
    graphics.beginPath();
    graphics.moveTo(center - 2, 30);
    graphics.lineTo(center - 2, 42);
    graphics.moveTo(center + 1, 32);
    graphics.lineTo(center + 1, 40);
    graphics.stroke();
    
    // Layered tree canopy
    graphics.fillGradientStyle(0x27ae60, 0x27ae60, 0x1e8449, 0x1e8449, 1);
    graphics.fillCircle(center, 22, 12);
    graphics.fillGradientStyle(0x2ecc71, 0x2ecc71, 0x27ae60, 0x27ae60, 0.8);
    graphics.fillCircle(center - 2, 20, 8);
    
    // Flower garden beds with realistic layout
    graphics.fillStyle(0x8b4513, 1); // Soil
    graphics.fillRect(8, size - 12, 12, 6);
    graphics.fillRect(size - 20, size - 10, 10, 4);
    
    // Colorful flowers with variety
    const flowerColors = [0xe74c3c, 0xf39c12, 0x9b59b6, 0xe91e63, 0x3f51b5];
    for (let i = 0; i < 8; i++) {
      const x = 10 + (i % 4) * 3;
      const y = size - 10 + Math.floor(i / 4) * 2;
      graphics.fillStyle(flowerColors[i % flowerColors.length], 1);
      graphics.fillCircle(x, y, 1);
    }
  }

  private drawProfessionalParking(graphics: any, size: number): void {
    const center = size / 2;
    
    // Realistic asphalt texture
    graphics.fillGradientStyle(0x2c3e50, 0x2c3e50, 0x1a252f, 0x1a252f, 1);
    graphics.fillRect(0, 16, size, size - 16);
    
    // Asphalt texture noise (simplified)
    graphics.fillStyle(0x34495e, 0.3);
    for (let i = 0; i < 10; i++) {
      graphics.fillCircle(Math.random() * size, 16 + Math.random() * (size - 16), 1);
    }
    
    // Professional parking lines
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.beginPath();
    graphics.moveTo(8, 24);
    graphics.lineTo(size - 8, 28);
    graphics.moveTo(8, 32);
    graphics.lineTo(size - 8, 36);
    graphics.moveTo(8, 40);
    graphics.lineTo(size - 8, 44);
    graphics.stroke();
    
    // Realistic 3D cars with depth
    // Red car
    graphics.fillGradientStyle(0xe74c3c, 0xe74c3c, 0xc0392b, 0xc0392b, 1);
    graphics.fillRect(10, 26, 12, 6);
    graphics.fillGradientStyle(0xc0392b, 0xc0392b, 0xa93226, 0xa93226, 1);
    graphics.fillRect(12, 24, 8, 4); // Car top
    
    // Car windows
    graphics.fillStyle(0x3498db, 0.7);
    graphics.fillRect(13, 25, 6, 2);
    
    // Blue car
    graphics.fillGradientStyle(0x3498db, 0x3498db, 0x2980b9, 0x2980b9, 1);
    graphics.fillRect(size - 22, 34, 12, 6);
    graphics.fillGradientStyle(0x2980b9, 0x2980b9, 0x21618c, 0x21618c, 1);
    graphics.fillRect(size - 20, 32, 8, 4);
    
    graphics.fillStyle(0x3498db, 0.7);
    graphics.fillRect(size - 19, 33, 6, 2);
    
    // Car shadows
    graphics.fillStyle(0x000000, 0.2);
    graphics.fillRect(11, 32, 12, 2);
    graphics.fillRect(size - 21, 40, 12, 2);
  }























  gridToScreen(x: number, y: number): { sx: number; sy: number } {
    // Apply zoom to grid position so the whole grid scales from the center
    const z = this.zoom;
    // Center of the grid (for scaling around center)
    const gridSize = GAME_CONSTANTS.GRID.SIZE;
    const centerX = (gridSize - 1) / 2;
    const centerY = (gridSize - 1) / 2;
    // Calculate unscaled position
    const baseX = this.config.mapOffsetX + (x - y) * (this.config.tileWidth / 2);
    const baseY = this.config.mapOffsetY + (x + y) * (this.config.tileHeight / 2);
    // Calculate center position
    const centerBaseX = this.config.mapOffsetX + (centerX - centerY) * (this.config.tileWidth / 2);
    const centerBaseY = this.config.mapOffsetY + (centerX + centerY) * (this.config.tileHeight / 2);
    // Scale position around the center
    return {
      sx: centerBaseX + (baseX - centerBaseX) * z,
      sy: centerBaseY + (baseY - centerBaseY) * z
    };
  }

  screenToGrid(sx: number, sy: number): { x: number; y: number } {
    // Account for zoom: reverse the same transformation used in gridToScreen
    const z = this.zoom;
    
    // Calculate the grid center (same as in gridToScreen)
    const gridSize = GAME_CONSTANTS.GRID.SIZE;
    const centerX = (gridSize - 1) / 2;
    const centerY = (gridSize - 1) / 2;
    
    // Calculate center position in screen coordinates (same as in gridToScreen)
    const centerBaseX = this.config.mapOffsetX + (centerX - centerY) * (this.config.tileWidth / 2);
    const centerBaseY = this.config.mapOffsetY + (centerX + centerY) * (this.config.tileHeight / 2);
    
    // Reverse the zoom transformation: unscale relative to grid center
    const unzoomedX = centerBaseX + (sx - centerBaseX) / z;
    const unzoomedY = centerBaseY + (sy - centerBaseY) / z;
    
    // Now convert using the original coordinate system
    const adjustedX = unzoomedX - this.config.mapOffsetX;
    const adjustedY = unzoomedY - this.config.mapOffsetY;
    
    const x = Math.floor((adjustedX / (this.config.tileWidth / 2) + adjustedY / (this.config.tileHeight / 2)) / 2);
    const y = Math.floor((adjustedY / (this.config.tileHeight / 2) - adjustedX / (this.config.tileWidth / 2)) / 2);
    
    return { x, y };
  }
}
