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
  private scene: any = null; // Phaser scene for loading PNG image
  private config: RenderConfig;
  private zoom: number = 1;

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
  }

  setConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): RenderConfig {
    return { ...this.config };
  }

  centerGrid(canvasWidth: number, canvasHeight: number, gridSize: number): void {
    // For isometric grid, we need to calculate the diamond shape bounds
    const tileWidth = this.config.tileWidth;
    const tileHeight = this.config.tileHeight;
    
    // In isometric view, the grid forms a diamond shape
    // The width is: gridSize * tileWidth (diagonal extent)
    // The height is: gridSize * tileHeight (diagonal extent)
    const totalGridWidth = gridSize * (tileWidth / 2) + gridSize * (tileWidth / 2); // Left diagonal + right diagonal
    const totalGridHeight = gridSize * (tileHeight / 2) + gridSize * (tileHeight / 2); // Top diagonal + bottom diagonal
    
    // Center the diamond in the canvas
    this.config.mapOffsetX = canvasWidth / 2;
    this.config.mapOffsetY = (canvasHeight - totalGridHeight) / 2 + (tileHeight / 2);
  }

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
   * Draw your PNG image at the specified screen coordinates
   */
  private drawComponentSprite(screenX: number, screenY: number, componentType: string): void {
    if (!this.scene) return;

    // Simply place your beautiful school PNG image on the grid
    const sprite = this.scene.add.image(screenX, screenY, 'school');
    
    // Scale to fit exactly within 4 diamond tiles (2x2 area)
    sprite.setScale(this.zoom * 0.035);
    
    // Set origin to center the sprite exactly on the grid position
    // (0.5, 0.5) centers the sprite perfectly on the grid coordinate
    sprite.setOrigin(0.5, 0.5);
    
    // Add depth for proper layering
    sprite.setDepth(screenY + 1000); // Higher depth to ensure schools render above tiles
    
    return sprite;
  }

  gridToScreen(x: number, y: number): { sx: number; sy: number } {
    // Simple isometric conversion without complex zoom scaling
    const z = this.zoom;
    const sx = this.config.mapOffsetX + (x - y) * (this.config.tileWidth / 2) * z;
    const sy = this.config.mapOffsetY + (x + y) * (this.config.tileHeight / 2) * z;
    
    return { sx, sy };
  }

  screenToGrid(sx: number, sy: number): { x: number; y: number } {
    // Simple reverse isometric conversion
    const z = this.zoom;
    const adjustedX = (sx - this.config.mapOffsetX) / z;
    const adjustedY = (sy - this.config.mapOffsetY) / z;
    
    const x = Math.round((adjustedX / (this.config.tileWidth / 2) + adjustedY / (this.config.tileHeight / 2)) / 2);
    const y = Math.round((adjustedY / (this.config.tileHeight / 2) - adjustedX / (this.config.tileWidth / 2)) / 2);
    
    return { x, y };
  }
}
