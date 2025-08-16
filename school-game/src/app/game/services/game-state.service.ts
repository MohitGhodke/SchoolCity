import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GridService } from './grid.service';
import { SchoolService } from './school.service';
import { RenderingService } from './rendering.service';
import { ThemeService } from './theme.service';
import { GameEventService } from './game-event.service';
import { MunicipalityManagerService } from './municipality-manager.service';
import { GameDataService } from './game-data.service';
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
    // Clear all game data
    this.gridService.cleanSlate();
    this.schoolService.resetSchools();
    this.municipalityManager.clearAll();
    
    // Clear localStorage for a complete fresh start
    if (isPlatformBrowser(this.platformId)) {
      this.gameDataService.deleteSavedData();
    }
    
    // Reset hierarchy initialization flag
    this.hierarchyInitialized = false;
    
    // Auto-restart the game to initialize basic hierarchy
    this.startGame();
    
    // Re-render the clean game
    this.renderGame();
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private gridService: GridService,
    private schoolService: SchoolService,
    private renderingService: RenderingService,
    private educationHierarchyService: EducationHierarchyService,
    private themeService: ThemeService,
    private gameEventService: GameEventService,
    private municipalityManager: MunicipalityManagerService,
    private gameDataService: GameDataService
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
    
    // Render grid tiles first
    const grid = this.gridService.getGrid();
    
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const tile = grid[y][x];
        const tileColors = this.themeService.getTileColors();
        
        // Determine tile color based on hierarchy (most specific wins)
        let tileColor = tileColors.default;
        let borderColor = tileColors.border;
        
        if (tile.unitId) {
          // Unit level - most specific, highest priority
          const unit = this.municipalityManager.getUnitById(tile.unitId);
          if (unit) {
            tileColor = unit.color;
            borderColor = tileColors.border; // Keep theme border for units
          }
        } else if (tile.areaId) {
          // Area level - middle priority
          const area = this.municipalityManager.getAreaById(tile.areaId);
          if (area) {
            tileColor = area.color;
            borderColor = tileColors.border; // Keep theme border for areas
          }
        } else if (tile.municipalityId) {
          // Municipality level - base level
          const municipality = this.municipalityManager.getMunicipalityById(tile.municipalityId);
          if (municipality) {
            tileColor = municipality.baseColor;
            borderColor = tileColors.border; // Keep theme border for municipalities
          }
        }
        
        this.renderingService.drawTile(
          x,
          y,
          tileColor,
          borderColor,
          tile
        );
      }
    }
    
    // Render all schools after tiles to ensure they appear on top
    const allSchools = this.schoolService.getAllSchools();
    for (const school of allSchools) {
      // Position the school sprite at the visual center of the school area
      // For a 2x2 school at position (4,4), the center is at (4.5, 4.5)
      const centerX = school.position.x + (school.size.width - 1) / 2;
      const centerY = school.position.y + (school.size.height - 1) / 2;
      
      this.renderingService.drawSchoolComponent({
        position: { x: centerX, y: centerY },
        type: 'MAIN_BUILDING'
      });
    }
  }

  handleTileClick(screenX: number, screenY: number): void {
    if (!this.isGameRunning) return;

    const { x, y } = this.renderingService.screenToGrid(screenX, screenY);
    if (!this.gridService.isValidPosition(x, y)) {
      return;
    }
    
    if (this.gridService.hasSchool(x, y)) {
      // School exists - emit event for school info display
      const school = this.schoolService.getSchoolAtPosition(x, y);
      if (school) {
        // Emit school clicked event with position for UI
        this.gameEventService.emitSchoolClicked({
          ...school,
          x: school.position.x,
          y: school.position.y
        });
      }
    } else {
      // Try to place new school using auto placement (tries largest first)
      const school = this.schoolService.placeSchoolAuto(x, y);
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
        
        // Auto-save after placing school
        if (typeof window !== 'undefined' && (window as any).autoSaveGame) {
          (window as any).autoSaveGame();
        }
        
        this.renderGame();
      } else {
        console.error('❌ Cannot place school - insufficient space or invalid tile type');
      }
    }
  }

  getGameStatus(): string {
    if (!this.isGameRunning) return 'Game Stopped';
    
    const stats = this.getGameStats();
    return `Running - ${stats.totalSchools} schools, ${stats.totalStudents}/${stats.totalCapacity} students`;
  }
}
