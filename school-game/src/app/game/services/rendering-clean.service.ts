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

@Injectable({
  providedIn: 'root'
})
export class RenderingService {
  private graphics: any = null;
  private scene: any = null; // Phaser scene for sprite management
  private config: RenderConfig;
  private zoom: number = 1;
  
  // Simple approach: one building image for all components
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

  setGraphics(graphics: any): void {
    this.graphics = graphics;
  }

  setScene(scene: any): void {
    this.scene = scene;
    this.loadBuildingImage();
  }

  /**
   * Load a simple building image to use for all school components
   */
  private loadBuildingImage(): void {
    if (!this.scene || this.buildingTexture) return;

    // Create a simple isometric building sprite
    this.createSimpleBuildingSprite();
  }

  /**
   * Create a simple isometric building sprite
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

    // Draw municipality center
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(sx, sy + halfTileH, 4 * z);
    this.graphics.lineStyle(1, 0x000000, 1);
    this.graphics.strokeCircle(sx, sy + halfTileH, 4 * z);
  }

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
