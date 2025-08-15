import { Injectable } from '@angular/core';
import { GridService } from './grid.service';
import { SchoolService } from './school.service';
import { RenderingService } from './rendering.service';
import { ThemeService } from './theme.service';
import { GAME_CONSTANTS } from '../constants/game-constants';
import { EducationHierarchyService } from './education-hierarchy.service';
import { School, Municipality, Area, Unit } from '../models/education-hierarchy.models';

export interface GameStats {
  totalSchools: number;
  totalStudents: number;
  totalCapacity: number;
  averageUtilization: number;
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private isGameRunning: boolean = false;
  private gameStartTime: Date | null = null;

  private hierarchyInitialized = false;

  public cleanSlate(): void {
    this.gridService.cleanSlate();
    this.renderGame();
    // Optionally reset hierarchy as well if needed
  }

  constructor(
    private gridService: GridService,
    private schoolService: SchoolService,
    private renderingService: RenderingService,
    private educationHierarchyService: EducationHierarchyService,
    private themeService: ThemeService
  ) {}

  startGame(): void {
    this.isGameRunning = true;
    this.gameStartTime = new Date();
    if (!this.hierarchyInitialized) {
      this.initializeHierarchy();
      this.hierarchyInitialized = true;
    }
  }

  private initializeHierarchy(): void {
    // Add a single municipality, area, and unit
    const municipality: Municipality = {
      id: 'municipality-1',
      name: 'Municipality 1',
      areas: [
        {
          id: 'area-1',
          name: 'Area 1',
          units: [
            {
              id: 'unit-1',
              name: 'Unit 1',
              schools: []
            }
          ]
        }
      ]
    };
    this.educationHierarchyService.addMunicipality(municipality);
  }

  stopGame(): void {
    this.isGameRunning = false;
    this.gameStartTime = null;
  }

  isGameActive(): boolean {
    return this.isGameRunning;
  }

  getGameDuration(): number {
    if (!this.gameStartTime) return 0;
    return Date.now() - this.gameStartTime.getTime();
  }

  getGameStats(): GameStats {
    const schools = this.schoolService.getAllSchools();
    const totalSchools = schools.length;
    const totalStudents = schools.reduce((sum, school) => sum + school.currentStudents, 0);
    const totalCapacity = schools.reduce((sum, school) => sum + school.capacity, 0);
    const averageUtilization = totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0;
    return {
      totalSchools,
      totalStudents,
      totalCapacity,
      averageUtilization
    };
  }

  resetGame(): void {
    this.stopGame();
    this.schoolService.resetSchools();
    this.startGame();
  }

  renderGame(): void {
    if (!this.isGameRunning) return;
    this.renderingService.clearGraphics();
    // Render grid
    const grid = this.gridService.getGrid();
    let schoolCount = 0;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const tile = grid[y][x];
        const tileColors = this.themeService.getTileColors();
        this.renderingService.drawTile(
          x,
          y,
          tileColors.default,
          tileColors.border,
          tile
        );
        if (tile.hasSchool) {
          this.renderingService.drawSchool(x, y);
          schoolCount++;
        }
      }
    }
  }

  handleTileClick(screenX: number, screenY: number): void {
    if (!this.isGameRunning) return;

    const { x, y } = this.renderingService.screenToGrid(screenX, screenY);
    if (!this.gridService.isValidPosition(x, y)) {
      return;
    }
    if (this.gridService.hasSchool(x, y)) {
      // School exists - could show info popup later
      const school = this.schoolService.getSchoolAtPosition(x, y);
    } else {
      // Place new school
      const school = this.schoolService.placeSchool(x, y);
      if (school) {
        // Get boundary IDs from tile
        const tile = this.gridService.getTile(x, y);
        if (tile) {
          this.educationHierarchyService.addSchool(
            tile.municipalityId,
            tile.areaId,
            tile.unitId,
            {
              id: school.id,
              name: school.name,
              classes: [],
            }
          );
        }
        this.renderGame();
      }
    }
  }

  getGameStatus(): string {
    if (!this.isGameRunning) return 'Game Stopped';
    
    const stats = this.getGameStats();
    return `Running - ${stats.totalSchools} schools, ${stats.totalStudents}/${stats.totalCapacity} students`;
  }
}
