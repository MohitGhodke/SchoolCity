import { Injectable } from '@angular/core';
import { GridService, GridPosition } from './grid.service';
import { GAME_CONSTANTS } from '../constants/game-constants';

export interface School {
  id: string;
  position: GridPosition; // Top-left corner of the school complex
  size: { width: number; height: number }; // How many tiles the school occupies
  type: 'ELEMENTARY' | 'MIDDLE' | 'HIGH';
  name: string;
  capacity: number;
  currentStudents: number;
  createdAt: Date;
  // Layout definition for rendering different parts of the school
  layout: SchoolComponent[];
}

export interface SchoolComponent {
  type: 'MAIN_BUILDING' | 'GYMNASIUM' | 'PLAYGROUND' | 'PARKING' | 'SPORTS_COURT' | 'CAFETERIA' | 'LIBRARY' | 'GARDEN';
  position: { x: number; y: number }; // Relative to school's top-left corner
  size: { width: number; height: number }; // In tile units
}

@Injectable({
  providedIn: 'root'
})
export class SchoolService {
  private schools: Map<string, School> = new Map();
  private schoolCounter: number = 0;

  constructor(private gridService: GridService) {}

  /**
   * Generate layout for different school types
   */
  private generateSchoolLayout(type: 'ELEMENTARY' | 'MIDDLE' | 'HIGH'): SchoolComponent[] {
    switch (type) {
      case 'ELEMENTARY':
        return [
          { type: 'MAIN_BUILDING', position: { x: 0, y: 0 }, size: { width: 1, height: 1 } },
          { type: 'PLAYGROUND', position: { x: 1, y: 0 }, size: { width: 1, height: 1 } },
          { type: 'GARDEN', position: { x: 0, y: 1 }, size: { width: 1, height: 1 } },
          { type: 'PARKING', position: { x: 1, y: 1 }, size: { width: 1, height: 1 } }
        ];
      
      case 'MIDDLE':
        return [
          { type: 'MAIN_BUILDING', position: { x: 0, y: 0 }, size: { width: 2, height: 1 } },
          { type: 'GYMNASIUM', position: { x: 2, y: 0 }, size: { width: 1, height: 1 } },
          { type: 'PLAYGROUND', position: { x: 0, y: 1 }, size: { width: 1, height: 1 } },
          { type: 'SPORTS_COURT', position: { x: 1, y: 1 }, size: { width: 1, height: 1 } },
          { type: 'LIBRARY', position: { x: 2, y: 1 }, size: { width: 1, height: 1 } },
          { type: 'CAFETERIA', position: { x: 0, y: 2 }, size: { width: 2, height: 1 } },
          { type: 'PARKING', position: { x: 2, y: 2 }, size: { width: 1, height: 1 } }
        ];
      
      case 'HIGH':
        return [
          { type: 'MAIN_BUILDING', position: { x: 0, y: 0 }, size: { width: 2, height: 2 } },
          { type: 'GYMNASIUM', position: { x: 2, y: 0 }, size: { width: 1, height: 1 } },
          { type: 'LIBRARY', position: { x: 3, y: 0 }, size: { width: 1, height: 1 } },
          { type: 'CAFETERIA', position: { x: 2, y: 1 }, size: { width: 2, height: 1 } },
          { type: 'SPORTS_COURT', position: { x: 0, y: 2 }, size: { width: 2, height: 1 } },
          { type: 'PLAYGROUND', position: { x: 2, y: 2 }, size: { width: 1, height: 1 } },
          { type: 'PARKING', position: { x: 3, y: 2 }, size: { width: 1, height: 1 } }
        ];
      
      default:
        return [{ type: 'MAIN_BUILDING', position: { x: 0, y: 0 }, size: { width: 1, height: 1 } }];
    }
  }

  /**
   * Check if a school of given size can be placed at the specified position
   */
  private canPlaceSchool(x: number, y: number, size: { width: number; height: number }): boolean {
    // Check if all tiles in the school area are valid and available
    for (let dx = 0; dx < size.width; dx++) {
      for (let dy = 0; dy < size.height; dy++) {
        const checkX = x + dx;
        const checkY = y + dy;
        
        // Check if position is within grid bounds
        if (!this.gridService.isValidPosition(checkX, checkY)) {
          return false;
        }
        
        // Check if position already has a school
        if (this.gridService.hasSchool(checkX, checkY)) {
          return false;
        }
        
        // Check if tile has unit boundary (required for school placement)
        const tile = this.gridService.getTile(checkX, checkY);
        if (!tile || !tile.unitId) {
          return false;
        }
      }
    }
    return true;
  }

  placeSchool(x: number, y: number, schoolType?: 'ELEMENTARY' | 'MIDDLE' | 'HIGH', name?: string): School | null {
    // Default to elementary school if no type specified
    const type = schoolType || 'ELEMENTARY';
    const schoolConfig = GAME_CONSTANTS.SCHOOL.TYPES[type];
    
    if (!this.canPlaceSchool(x, y, schoolConfig.size)) {
      return null;
    }

    const schoolId = `school_${++this.schoolCounter}`;
    const school: School = {
      id: schoolId,
      position: { x, y },
      size: schoolConfig.size,
      type: type,
      name: name || `${schoolConfig.name} ${this.schoolCounter}`,
      capacity: schoolConfig.capacity,
      currentStudents: 0,
      createdAt: new Date(),
      layout: this.generateSchoolLayout(type)
    };

    this.schools.set(schoolId, school);
    
    // Mark all tiles occupied by the school
    for (let dx = 0; dx < schoolConfig.size.width; dx++) {
      for (let dy = 0; dy < schoolConfig.size.height; dy++) {
        this.gridService.placeSchool(x + dx, y + dy);
      }
    }

    return school;
  }

  /**
   * Place school with automatic type selection based on available space
   * Smart placement: finds the best position for a school that includes the clicked tile
   */
  placeSchoolAuto(x: number, y: number, name?: string): School | null {
    // Try to place largest school first, then fall back to smaller ones
    const types: Array<'ELEMENTARY' | 'MIDDLE' | 'HIGH'> = ['HIGH', 'MIDDLE', 'ELEMENTARY'];
    
    for (const type of types) {
      const schoolConfig = GAME_CONSTANTS.SCHOOL.TYPES[type];
      const bestPosition = this.findBestSchoolPosition(x, y, schoolConfig.size);
      
      if (bestPosition) {
        return this.placeSchool(bestPosition.x, bestPosition.y, type, name);
      }
    }
    
    return null; // No school type can fit
  }

  /**
   * Find the best position for a school that includes the clicked tile
   * Returns the top-left corner position of the school area
   */
  private findBestSchoolPosition(clickX: number, clickY: number, size: { width: number; height: number }): { x: number; y: number } | null {
    console.log(`🔍 Finding best position for ${size.width}x${size.height} school around clicked tile (${clickX}, ${clickY})`);
    
    // Get the unit ID of the clicked tile - school must be within the same unit
    const clickedTile = this.gridService.getTile(clickX, clickY);
    if (!clickedTile || !clickedTile.unitId) {
      console.log(`  ❌ Clicked tile has no unitId`);
      return null;
    }
    
    const requiredUnitId = clickedTile.unitId;
    console.log(`  📍 Clicked tile unit: ${requiredUnitId}`);
    
    // Check all possible positions where the clicked tile could be part of the school
    // For a 2x2 school, the clicked tile could be at positions (0,0), (0,1), (1,0), or (1,1) within the school
    const possiblePositions: { x: number; y: number }[] = [];
    
    for (let dx = 0; dx < size.width; dx++) {
      for (let dy = 0; dy < size.height; dy++) {
        // Calculate the top-left corner if clicked tile is at position (dx, dy) within school
        const topLeftX = clickX - dx;
        const topLeftY = clickY - dy;
        
        if (this.canPlaceSchoolInSameUnit(topLeftX, topLeftY, size, requiredUnitId)) {
          possiblePositions.push({ x: topLeftX, y: topLeftY });
          console.log(`  ✅ Valid position found: (${topLeftX}, ${topLeftY}) with clicked tile at offset (${dx}, ${dy})`);
        }
      }
    }
    
    if (possiblePositions.length === 0) {
      console.log(`  ❌ No valid positions found for ${size.width}x${size.height} school around (${clickX}, ${clickY}) within unit ${requiredUnitId}`);
      return null;
    }
    
    // Prefer the position where clicked tile is closest to center of school
    const centerOffsetX = (size.width - 1) / 2;
    const centerOffsetY = (size.height - 1) / 2;
    
    let bestPosition = possiblePositions[0];
    let bestScore = Infinity;
    
    for (const pos of possiblePositions) {
      // Calculate how close the clicked tile is to the center of this school placement
      const offsetX = clickX - pos.x;
      const offsetY = clickY - pos.y;
      const distanceToCenter = Math.abs(offsetX - centerOffsetX) + Math.abs(offsetY - centerOffsetY);
      
      if (distanceToCenter < bestScore) {
        bestScore = distanceToCenter;
        bestPosition = pos;
      }
    }
    
    console.log(`  🎯 Best position selected: (${bestPosition.x}, ${bestPosition.y}) for ${size.width}x${size.height} school`);
    return bestPosition;
  }

  /**
   * Check if a school can be placed at the position with all tiles in the same unit
   */
  private canPlaceSchoolInSameUnit(x: number, y: number, size: { width: number; height: number }, requiredUnitId: string): boolean {
    console.log(`    🔍 Checking if ${size.width}x${size.height} school can be placed at (${x}, ${y}) in unit ${requiredUnitId}`);
    
    // Check if all tiles in the school area are valid, available, and compatible with the unit
    for (let dx = 0; dx < size.width; dx++) {
      for (let dy = 0; dy < size.height; dy++) {
        const checkX = x + dx;
        const checkY = y + dy;
        
        console.log(`      Checking tile (${checkX}, ${checkY})`);
        
        // Check if position is within grid bounds
        if (!this.gridService.isValidPosition(checkX, checkY)) {
          console.log(`      ❌ Tile (${checkX}, ${checkY}) is out of bounds`);
          return false;
        }
        
        // Check if position already has a school
        if (this.gridService.hasSchool(checkX, checkY)) {
          console.log(`      ❌ Tile (${checkX}, ${checkY}) already has a school`);
          return false;
        }
        
        // Check if tile is compatible with the unit
        const tile = this.gridService.getTile(checkX, checkY);
        if (!tile) {
          console.log(`      ❌ Tile (${checkX}, ${checkY}) not found`);
          return false;
        }
        
        console.log(`      📍 Tile (${checkX}, ${checkY}) has unitId: '${tile.unitId}'`);
        
        // Require that all tiles belong to the same non-empty unit
        if (tile.unitId !== requiredUnitId || !tile.unitId) {
          console.log(`      ❌ Tile (${checkX}, ${checkY}) unit mismatch: '${tile.unitId}' vs required '${requiredUnitId}'`);
          return false;
        }
        
        console.log(`      ✅ Tile (${checkX}, ${checkY}) is compatible (same unit)`);
      }
    }
    console.log(`    ✅ All tiles valid for ${size.width}x${size.height} school at (${x}, ${y})`);
    return true;
  }

  removeSchool(x: number, y: number): boolean {
    const school = this.getSchoolAtPosition(x, y);
    if (school) {
      // Remove school from all tiles it occupies
      for (let dx = 0; dx < school.size.width; dx++) {
        for (let dy = 0; dy < school.size.height; dy++) {
          this.gridService.removeSchool(school.position.x + dx, school.position.y + dy);
        }
      }
      
      this.schools.delete(school.id);
      return true;
    }
    return false;
  }

  getSchoolAtPosition(x: number, y: number): School | null {
    for (const school of this.schools.values()) {
      // Check if the clicked position is within this school's bounds
      const withinX = x >= school.position.x && x < school.position.x + school.size.width;
      const withinY = y >= school.position.y && y < school.position.y + school.size.height;
      
      if (withinX && withinY) {
        return school;
      }
    }
    return null;
  }

  getSchoolById(id: string): School | null {
    return this.schools.get(id) || null;
  }

  getAllSchools(): School[] {
    return Array.from(this.schools.values());
  }

  getSchoolsCount(): number {
    return this.schools.size;
  }

  updateSchoolCapacity(schoolId: string, newCapacity: number): boolean {
    const school = this.schools.get(schoolId);
    if (school) {
      const clampedCapacity = Math.max(
        GAME_CONSTANTS.SCHOOL.MIN_CAPACITY,
        Math.min(GAME_CONSTANTS.SCHOOL.MAX_CAPACITY, newCapacity)
      );
      school.capacity = clampedCapacity;
      return true;
    }
    return false;
  }

  addStudents(schoolId: string, count: number): boolean {
    const school = this.schools.get(schoolId);
    if (school) {
      const newTotal = school.currentStudents + count;
      if (newTotal <= school.capacity) {
        school.currentStudents = newTotal;
        return true;
      }
    }
    return false;
  }

  removeStudents(schoolId: string, count: number): boolean {
    const school = this.schools.get(schoolId);
    if (school) {
      const newTotal = Math.max(0, school.currentStudents - count);
      school.currentStudents = newTotal;
      return true;
    }
    return false;
  }

  getSchoolUtilization(schoolId: string): number {
    const school = this.schools.get(schoolId);
    if (school && school.capacity > 0) {
      return (school.currentStudents / school.capacity) * 100;
    }
    return 0;
  }

  resetSchools(): void {
    this.schools.clear();
    this.schoolCounter = 0;
    this.gridService.resetGrid();
  }

  /**
   * Load schools from saved data
   */
  loadSchools(savedSchools: School[]): void {
    this.schools.clear();
    
    // Find the highest school counter to resume from
    let maxCounter = 0;
    
    savedSchools.forEach(school => {
      // Restore Date object from string if necessary
      if (typeof school.createdAt === 'string') {
        school.createdAt = new Date(school.createdAt);
      }
      
      // Handle legacy single-tile schools
      if (!school.size) {
        school.size = { width: 1, height: 1 };
        school.type = 'ELEMENTARY';
        school.layout = this.generateSchoolLayout('ELEMENTARY');
      }
      
      this.schools.set(school.id, school);
      
      // Update grid to reflect school placement for all tiles
      for (let dx = 0; dx < school.size.width; dx++) {
        for (let dy = 0; dy < school.size.height; dy++) {
          this.gridService.placeSchool(school.position.x + dx, school.position.y + dy);
        }
      }
      
      // Extract counter from school ID (assuming format: school_N)
      const match = school.id.match(/school_(\d+)/);
      if (match) {
        const counter = parseInt(match[1], 10);
        maxCounter = Math.max(maxCounter, counter);
      }
    });
    
    this.schoolCounter = maxCounter;
  }
}
