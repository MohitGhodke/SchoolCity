import { Injectable } from '@angular/core';
import { GAME_CONSTANTS } from '../constants/game-constants';

export interface Tile {
  x: number;
  y: number;
  hasSchool: boolean;
  municipalityId: string;
  areaId: string;
  unitId: string;
}

export interface GridPosition {
  x: number;
  y: number;
}

@Injectable({
  providedIn: 'root'
})
export class GridService {
  private grid: Tile[][] = [];
  private readonly gridSize: number = GAME_CONSTANTS.GRID.SIZE;

  constructor() {
    this.initializeGrid();
  }

  private initializeGrid(): void {
    // Start with completely empty tiles - no boundaries assigned
    this.grid = Array.from({ length: this.gridSize }, (_, y) =>
      Array.from({ length: this.gridSize }, (_, x) => ({ 
        x, 
        y, 
        hasSchool: false,
        municipalityId: '',
        areaId: '',
        unitId: ''
      }))
    );
  }

  cleanSlate(): void {
    this.initializeGrid();
  }

  getGrid(): Tile[][] {
    return this.grid;
  }

  getTile(x: number, y: number): Tile | null {
    if (this.isValidPosition(x, y)) {
      return this.grid[y][x];
    }
    return null;
  }

  setTileSchool(x: number, y: number, hasSchool: boolean): boolean {
    if (this.isValidPosition(x, y)) {
      this.grid[y][x].hasSchool = hasSchool;
      return true;
    }
    return false;
  }

  hasSchool(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile ? tile.hasSchool : false;
  }

  placeSchool(x: number, y: number): boolean {
    if (this.isValidPosition(x, y) && !this.hasSchool(x, y)) {
      return this.setTileSchool(x, y, true);
    }
    return false;
  }

  removeSchool(x: number, y: number): boolean {
    if (this.isValidPosition(x, y) && this.hasSchool(x, y)) {
      return this.setTileSchool(x, y, false);
    }
    return false;
  }

  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.gridSize && y < this.gridSize;
  }

  getGridSize(): number {
    return this.gridSize;
  }

  resetGrid(): void {
    this.initializeGrid();
  }
}
