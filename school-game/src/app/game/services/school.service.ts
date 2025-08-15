import { Injectable } from '@angular/core';
import { GridService, GridPosition } from './grid.service';
import { GAME_CONSTANTS } from '../constants/game-constants';

export interface School {
  id: string;
  position: GridPosition;
  name: string;
  capacity: number;
  currentStudents: number;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SchoolService {
  private schools: Map<string, School> = new Map();
  private schoolCounter: number = 0;

  constructor(private gridService: GridService) {}

  placeSchool(x: number, y: number, name?: string): School | null {
    if (!this.gridService.isValidPosition(x, y)) {
      return null;
    }

    if (this.gridService.hasSchool(x, y)) {
      return null;
    }

    const schoolId = `school_${++this.schoolCounter}`;
    const school: School = {
      id: schoolId,
      position: { x, y },
      name: name || `School ${this.schoolCounter}`,
      capacity: GAME_CONSTANTS.SCHOOL.DEFAULT_CAPACITY,
      currentStudents: 0,
      createdAt: new Date()
    };

    this.schools.set(schoolId, school);
    this.gridService.placeSchool(x, y);

    return school;
  }

  removeSchool(x: number, y: number): boolean {
    const school = this.getSchoolAtPosition(x, y);
    if (school) {
      this.schools.delete(school.id);
      this.gridService.removeSchool(x, y);
      return true;
    }
    return false;
  }

  getSchoolAtPosition(x: number, y: number): School | null {
    for (const school of this.schools.values()) {
      if (school.position.x === x && school.position.y === y) {
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
      
      this.schools.set(school.id, school);
      
      // Update grid to reflect school placement
      this.gridService.placeSchool(school.position.x, school.position.y);
      
      // Extract counter from school ID (assuming format: school-N)
      const match = school.id.match(/school-(\d+)/);
      if (match) {
        const counter = parseInt(match[1], 10);
        maxCounter = Math.max(maxCounter, counter);
      }
    });
    
    this.schoolCounter = maxCounter;
  }
}
