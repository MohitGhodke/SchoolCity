


import { Injectable } from '@angular/core';
import { GAME_CONSTANTS } from '../constants/game-constants';
import { MunicipalityManagerService } from './municipality-manager.service';
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
  private config: RenderConfig;
  private zoom: number = 1;

  setZoom(zoom: number) {
    this.zoom = Math.max(0.5, Math.min(zoom, 2)); // Clamp between 0.5x and 2x
  }

  getZoom(): number {
    return this.zoom;
  }



  constructor(private municipalityManager: MunicipalityManagerService) {
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

    // Use the most specific boundary color: unit > area > municipality
    let fillColor = color;
    if (tile) {
      // Use dynamic municipality manager for colors
      if (tile.unitId) {
        fillColor = this.municipalityManager.getColorForBoundary(tile.unitId);
      } else if (tile.areaId) {
        fillColor = this.municipalityManager.getColorForBoundary(tile.areaId);
      } else if (tile.municipalityId) {
        fillColor = this.municipalityManager.getColorForBoundary(tile.municipalityId);
      } else {
        fillColor = GAME_CONSTANTS.COLORS.TILE_FILL; // Default if no boundary
      }
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
    this.graphics.beginPath();
    this.graphics.moveTo(centerX, centerY);
    this.graphics.lineTo(centerX + halfTileW, centerY + halfTileH);
    this.graphics.lineTo(centerX, centerY + tileH);
    this.graphics.lineTo(centerX - halfTileW, centerY + halfTileH);
    this.graphics.closePath();
    this.graphics.fillPath();
    this.graphics.strokePath();
  }

  drawSchool(x: number, y: number): void {
  if (!this.graphics) return;

  const { sx, sy } = this.gridToScreen(x, y);
  const z = this.zoom;
  // Manually scale positions and sizes for zoom
  const ox = sx;
  const oy = sy + (this.config.tileHeight / 2) * z;

  // Roof - draw as a rectangle using lines and fill
  this.graphics.fillStyle(GAME_CONSTANTS.COLORS.SCHOOL_ROOF, 1);
  this.graphics.beginPath();
  this.graphics.moveTo(ox - 12 * z, oy - 24 * z);
  this.graphics.lineTo(ox + 12 * z, oy - 24 * z);
  this.graphics.lineTo(ox + 12 * z, oy - 12 * z);
  this.graphics.lineTo(ox - 12 * z, oy - 12 * z);
  this.graphics.closePath();
  this.graphics.fillPath();

  // Building - draw as a rectangle using lines and fill
  this.graphics.fillStyle(GAME_CONSTANTS.COLORS.SCHOOL_BUILDING, 1);
  this.graphics.beginPath();
  this.graphics.moveTo(ox - 12 * z, oy - 12 * z);
  this.graphics.lineTo(ox + 12 * z, oy - 12 * z);
  this.graphics.lineTo(ox + 12 * z, oy + 12 * z);
  this.graphics.lineTo(ox - 12 * z, oy + 12 * z);
  this.graphics.closePath();
  this.graphics.fillPath();

  // Door - draw as a rectangle using lines and fill
  this.graphics.fillStyle(GAME_CONSTANTS.COLORS.SCHOOL_DOOR, 1);
  this.graphics.beginPath();
  this.graphics.moveTo(ox - 3 * z, oy);
  this.graphics.lineTo(ox + 3 * z, oy);
  this.graphics.lineTo(ox + 3 * z, oy + 12 * z);
  this.graphics.lineTo(ox - 3 * z, oy + 12 * z);
  this.graphics.closePath();
  this.graphics.fillPath();
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
