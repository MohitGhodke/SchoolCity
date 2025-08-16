import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GridService, Tile } from './grid.service';
import { MunicipalityManagerService, MunicipalityDefinition } from './municipality-manager.service';
import { SchoolService, School } from './school.service';
import { ThemeService } from './theme.service';

export interface GameSaveData {
  version: string;
  timestamp: string;
  grid: Tile[][];
  municipalities: MunicipalityDefinition[];
  schools: School[];
  municipalityCounter: number;
  theme: 'light' | 'dark';
  metadata: {
    gridSize: number;
    totalTiles: number;
    totalMunicipalities: number;
    totalAreas: number;
    totalUnits: number;
    totalSchools: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GameDataService {
  private readonly SAVE_KEY = 'schoolCity-gameData';
  private readonly VERSION = '1.0.0';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private gridService: GridService,
    private municipalityManager: MunicipalityManagerService,
    private schoolService: SchoolService,
    private themeService: ThemeService
  ) {}

  /**
   * Save the current game state to localStorage
   */
  saveGameData(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('Save functionality only available in browser environment');
      return false;
    }

    try {
      const saveData = this.createSaveData();
      const jsonData = JSON.stringify(saveData, null, 2);
      
      localStorage.setItem(this.SAVE_KEY, jsonData);
      return true;
    } catch (error) {
      console.error('❌ Failed to save game data:', error);
      return false;
    }
  }

  /**
   * Load game state from localStorage
   */
  loadGameData(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('Load functionality only available in browser environment');
      return false;
    }

    try {
      const savedData = localStorage.getItem(this.SAVE_KEY);
      if (!savedData) {
        return false;
      }

      const gameData: GameSaveData = JSON.parse(savedData);
      
      // Validate the save data
      if (!this.validateSaveData(gameData)) {
        console.error('❌ Invalid save data format');
        return false;
      }

      // Load the data into services
      this.restoreGameState(gameData);
      return true;
    } catch (error) {
      console.error('❌ Failed to load game data:', error);
      return false;
    }
  }

  /**
   * Check if saved game data exists
   */
  hasSavedData(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }

  /**
   * Get save data metadata without loading the full game
   */
  getSaveMetadata(): any | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const savedData = localStorage.getItem(this.SAVE_KEY);
      if (!savedData) return null;

      const gameData: GameSaveData = JSON.parse(savedData);
      return {
        timestamp: gameData.timestamp,
        version: gameData.version,
        metadata: gameData.metadata
      };
    } catch (error) {
      console.error('Failed to get save metadata:', error);
      return null;
    }
  }

  /**
   * Delete saved game data
   */
  deleteSavedData(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    try {
      localStorage.removeItem(this.SAVE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to delete save data:', error);
      return false;
    }
  }

  /**
   * Export game data as downloadable JSON file
   */
  exportGameData(): string | null {
    try {
      const saveData = this.createSaveData();
      return JSON.stringify(saveData, null, 2);
    } catch (error) {
      console.error('Failed to export game data:', error);
      return null;
    }
  }

  /**
   * Import game data from JSON string
   */
  importGameData(jsonData: string): boolean {
    try {
      const gameData: GameSaveData = JSON.parse(jsonData);
      
      if (!this.validateSaveData(gameData)) {
        console.error('❌ Invalid import data format');
        return false;
      }

      this.restoreGameState(gameData);
      this.saveGameData(); // Save to localStorage as well
      return true;
    } catch (error) {
      console.error('❌ Failed to import game data:', error);
      return false;
    }
  }

  /**
   * Create a save data object from current game state
   */
  private createSaveData(): GameSaveData {
    const grid = this.gridService.getGrid();
    const municipalities = this.municipalityManager.getMunicipalities();
    const schools = this.schoolService.getAllSchools();
    
    // Calculate metadata
    const totalTiles = grid.length * grid[0].length;
    const totalAreas = municipalities.reduce((sum, m) => sum + m.areas.length, 0);
    const totalUnits = municipalities.reduce((sum, m) => 
      sum + m.areas.reduce((aSum, a) => aSum + a.units.length, 0), 0
    );

    const saveData: GameSaveData = {
      version: this.VERSION,
      timestamp: new Date().toISOString(),
      grid: grid,
      municipalities: municipalities,
      schools: schools,
      municipalityCounter: (this.municipalityManager as any).counter || 1,
      theme: this.themeService.getIsDarkMode() ? 'dark' : 'light',
      metadata: {
        gridSize: grid.length,
        totalTiles: totalTiles,
        totalMunicipalities: municipalities.length,
        totalAreas: totalAreas,
        totalUnits: totalUnits,
        totalSchools: schools.length
      }
    };

    return saveData;
  }

  /**
   * Restore game state from save data
   */
  private restoreGameState(gameData: GameSaveData): void {
    // Restore grid state
    this.gridService.loadGrid(gameData.grid);
    
    // Restore municipality definitions
    this.municipalityManager.loadMunicipalities(gameData.municipalities, gameData.municipalityCounter);
    
    // Restore schools
    this.schoolService.loadSchools(gameData.schools);
    
    // Don't restore theme - let ThemeService handle its own persistence
    // The theme is already loaded from localStorage in ThemeService constructor
    // and we don't want to override the user's current theme preference
  }

  /**
   * Validate save data structure
   */
  private validateSaveData(data: any): data is GameSaveData {
    return (
      data &&
      typeof data.version === 'string' &&
      typeof data.timestamp === 'string' &&
      Array.isArray(data.grid) &&
      Array.isArray(data.municipalities) &&
      Array.isArray(data.schools) &&
      data.metadata &&
      typeof data.metadata.gridSize === 'number'
    );
  }
}
