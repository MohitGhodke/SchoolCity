import { GameStateService } from '../services/game-state.service';
import { RenderingService } from '../services/rendering.service';
import { EducationHierarchyService } from '../services/education-hierarchy.service';
import { GameEventService } from '../services/game-event.service';

export class MainSceneFactory {
  static createScene(gameStateService: GameStateService, renderingService: RenderingService, educationHierarchyService: EducationHierarchyService, gameEventService: GameEventService): any {
    // Return a function that will create the scene class when called
    return function(Phaser: any) {
      return class extends Phaser.Scene {
        private gameEventService: GameEventService;
        private graphics: any;
        private gameStateService: GameStateService;
        private renderingService: RenderingService;
        private educationHierarchyService: EducationHierarchyService;
        private isSelecting: boolean = false;
        private selectedBoundary: string | null = null;
        private isPlacingSchool: boolean = false;
        
        // Paint mode system
        private paintMode: 'municipality' | 'area' | 'unit' | 'school' | 'clear' | null = null;
        private currentMunicipalityId: string | null = null;
        private currentAreaId: string | null = null;
        private currentUnitId: string | null = null;

        constructor() {
          super({ key: 'MainScene' });
          this.gameStateService = gameStateService;
          this.renderingService = renderingService;
          this.educationHierarchyService = educationHierarchyService;
          this.gameEventService = gameEventService;
        }

        create(): void {
          this.graphics = (this as any)['add'].graphics();
          this.renderingService.setGraphics(this.graphics);

          // Start the game
          this.gameStateService.startGame();

          // Initial render
          this.gameStateService.renderGame();

          // Listen for boundary selection from Angular
          (window as any).setSelectedBoundary = (boundaryId: string) => {
            if (boundaryId.startsWith('paint:')) {
              // Handle new paint mode system
              const paintMode = boundaryId.replace('paint:', '');
              if (paintMode === 'reset_municipality') {
                // Reset current municipality to start a new one
                this.currentMunicipalityId = null;
              } else {
                this.setPaintMode(paintMode);
              }
            } else if (boundaryId.startsWith('school:')) {
              this.isPlacingSchool = true;
              this.selectedBoundary = boundaryId; // Keep the full "school:unitId" format
            } else {
              this.isPlacingSchool = false;
              this.selectedBoundary = boundaryId;
            }
          };

          // Set up input handling for click-and-drag selection
          (this as any)['input'].on('pointerdown', (pointer: any) => {
            if (this.paintMode) {
              // Use new paint system
              this.isSelecting = true;
              this.paintAt(pointer.x, pointer.y);
            } else if (this.isPlacingSchool) {
              this.tryPlaceSchoolAt(pointer.x, pointer.y);
            } else if (this.selectedBoundary) {
              this.isSelecting = true;
              this.assignBoundaryAt(pointer.x, pointer.y);
            } else {
              // Custom: Notify Angular if a school is clicked
              const { x, y } = this.renderingService.screenToGrid(pointer.x, pointer.y);
              const school = this.gameStateService["schoolService"].getSchoolAtPosition(x, y);
              if (school && this.gameEventService) {
                this.gameEventService.schoolClicked$.next({ ...school, x, y });
              }
              // DO NOT place schools when no boundary is selected - that was the bug!
              // Schools should only be placed when in explicit school placement mode
            }
          });
          (this as any)['input'].on('pointermove', (pointer: any) => {
            if (this.isSelecting && this.paintMode) {
              // Continue painting while dragging
              this.paintAt(pointer.x, pointer.y);
            } else if (this.isSelecting && this.selectedBoundary) {
              this.assignBoundaryAt(pointer.x, pointer.y);
            }
          });
          (this as any)['input'].on('pointerup', () => {
            this.isSelecting = false;
          });
        }

          assignBoundaryAt(screenX: number, screenY: number) {
            const { x, y } = this.renderingService.screenToGrid(screenX, screenY);
            const gridService = (this.gameStateService as any).gridService;
            
            if (gridService && gridService.isValidPosition(x, y)) {
            const tile = gridService.getTile(x, y);
            
            if (tile) {
              // Assign boundaries with strict hierarchy - CHECK UNITS FIRST!
              if (this.selectedBoundary?.includes('-unit-')) {
                // For unit assignment, ensure proper hierarchy but be more flexible
                const unitId = this.selectedBoundary;
                const parts = unitId.split('-');
                
                if (parts.length >= 6) { // municipality-X-area-Y-unit-Z
                  const municipalityId = `${parts[0]}-${parts[1]}`;
                  const areaId = `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}`;
                  
                  // Always set the full hierarchy when assigning a unit - don't check conditions
                  tile.municipalityId = municipalityId;
                  tile.areaId = areaId;
                  tile.unitId = unitId;
                }
              } else if (this.selectedBoundary?.includes('-area-') && !this.selectedBoundary.includes('-unit-')) {
                console.log('� Processing area assignment...');
                // Assign area - but be more flexible about requirements
                if (tile.municipalityId && !tile.unitId) {
                  tile.areaId = this.selectedBoundary;

                } else {

                }
              } else if (this.selectedBoundary?.startsWith('municipality') && !this.selectedBoundary.includes('area') && !this.selectedBoundary.includes('unit')) {

                // Only assign municipality if not already set or to change
                if (tile.municipalityId !== this.selectedBoundary) {
                  tile.municipalityId = this.selectedBoundary;
                  tile.areaId = '';
                  tile.unitId = '';

                }
              } else {

                // Clear assignment
                if (this.selectedBoundary === '') {
                  tile.municipalityId = '';
                  tile.areaId = '';
                  tile.unitId = '';

                }
              }
              

              this.gameStateService.renderGame();
            }
            } else {

            }
          }

        tryPlaceSchoolAt(screenX: number, screenY: number) {
          const { x, y } = this.renderingService.screenToGrid(screenX, screenY);
          const gridService = (this.gameStateService as any).gridService;
          
          if (gridService && gridService.isValidPosition(x, y)) {
            const tile = gridService.getTile(x, y);
            
            // Extract the unit ID from the selectedBoundary (format: "school:unitId")
            const unitId = this.selectedBoundary?.replace('school:', '') || '';
            
            // Only allow school placement if:
            // 1. Tile has the specific unit ID that was selected
            // 2. No school already exists on this tile
            if (tile && tile.unitId === unitId && !tile.hasSchool) {

              this.gameStateService.handleTileClick(screenX, screenY);
            } else {
              // School placement blocked - either unit ID mismatch or tile already has school
            }
          }
        }

        update(): void {
          // Use the hierarchy for gameplay or rendering logic
        }

        setPaintMode(mode: string): void {
          this.paintMode = mode as 'municipality' | 'area' | 'unit' | 'school' | 'clear';
          this.isPlacingSchool = (mode === 'school');
          this.selectedBoundary = null; // Clear old selection system
          
          // Reset active IDs when switching modes to start fresh with each mode
          if (mode !== 'municipality') {
            this.currentMunicipalityId = null;
          }
          if (mode !== 'area') {
            this.currentAreaId = null;
          }
          if (mode !== 'unit') {
            this.currentUnitId = null;
          }
        }

        paintAt(screenX: number, screenY: number): void {
          const { x, y } = this.renderingService.screenToGrid(screenX, screenY);
          const gridService = (this.gameStateService as any).gridService;
          
          if (!gridService || !gridService.isValidPosition(x, y)) return;
          
          const tile = gridService.getTile(x, y);
          if (!tile) return;

          switch (this.paintMode) {
            case 'municipality':
              this.paintMunicipality(tile);
              break;
            case 'area':
              this.paintArea(tile);
              break;
            case 'unit':
              this.paintUnit(tile);
              break;
            case 'school':
              this.paintSchool(tile);
              break;
            case 'clear':
              this.clearTile(tile);
              break;
          }
          
          // Re-render the game after painting
          this.gameStateService.renderGame();
          
          // Notify Angular that button states may need updating
          if (typeof window !== 'undefined') {
            // Call both callback functions to ensure proper state refresh
            if ((window as any).updatePaintToolStates) {
              (window as any).updatePaintToolStates();
            }
            if ((window as any).refreshBoundarySelector) {
              (window as any).refreshBoundarySelector();
            }
          }
        }

        paintMunicipality(tile: any): void {
          if (!tile.municipalityId) {
            const municipalityManager = (this.renderingService as any).municipalityManager;
            
            // Create a new municipality only if we don't have an active one
            if (!this.currentMunicipalityId) {
              municipalityManager.addMunicipality();
              const municipalities = municipalityManager.getMunicipalities();
              const newMunicipality = municipalities[municipalities.length - 1];
              this.currentMunicipalityId = newMunicipality.id;
            }
            
            // Assign the current active municipality to this tile
            tile.municipalityId = this.currentMunicipalityId;
            tile.areaId = '';
            tile.unitId = '';
          }
        }

        paintArea(tile: any): void {
          if (tile.municipalityId && !tile.unitId) {
            const municipalityManager = (this.renderingService as any).municipalityManager;
            
            // Create a new area only if we don't have an active one
            if (!this.currentAreaId) {
              const newArea = municipalityManager.addArea(tile.municipalityId);
              if (newArea) {
                this.currentAreaId = newArea.id;
              }
            }
            
            // Assign the current active area to this tile
            if (this.currentAreaId) {
              tile.areaId = this.currentAreaId;
              tile.unitId = '';
            }
          }
        }

        paintUnit(tile: any): void {
          if (tile.areaId && !tile.unitId) {
            const municipalityManager = (this.renderingService as any).municipalityManager;
            
            // Create a new unit only if we don't have an active one for this area
            if (!this.currentUnitId) {
              const area = municipalityManager.getAreaById(tile.areaId);
              if (area) {
                const newUnit = municipalityManager.addUnit(area.municipalityId, tile.areaId);
                if (newUnit) {
                  this.currentUnitId = newUnit.id;
                }
              }
            }
            
            // Assign the current active unit to this tile
            if (this.currentUnitId) {
              tile.unitId = this.currentUnitId;
            }
          }
        }

        paintSchool(tile: any): void {
          if (tile.unitId && !tile.hasSchool) {
            tile.hasSchool = true;
          }
        }

        clearTile(tile: any): void {
          // Store what we're clearing for cleanup
          const clearedMunicipalityId = tile.municipalityId;
          const clearedAreaId = tile.areaId;
          const clearedUnitId = tile.unitId;
          
          // Clear the tile completely - reset to default state (no boundaries)
          tile.municipalityId = '';
          tile.areaId = '';
          tile.unitId = '';
          tile.hasSchool = false;
          
          // Clean up orphaned data structures
          this.cleanupOrphanedStructures(clearedMunicipalityId, clearedAreaId, clearedUnitId);
        }
        
        cleanupOrphanedStructures(municipalityId: string, areaId: string, unitId: string): void {
          const gridService = (this.gameStateService as any).gridService;
          const municipalityManager = (this.renderingService as any).municipalityManager;
          
          if (!gridService || !municipalityManager) return;
          
          // Check if municipality is still used anywhere
          if (municipalityId) {
            let municipalityStillUsed = false;
            for (let x = 0; x < gridService.width; x++) {
              for (let y = 0; y < gridService.height; y++) {
                const tile = gridService.getTile(x, y);
                if (tile && tile.municipalityId === municipalityId) {
                  municipalityStillUsed = true;
                  break;
                }
              }
              if (municipalityStillUsed) break;
            }
            
            // If municipality is not used anywhere, remove it
            if (!municipalityStillUsed) {
              municipalityManager.removeMunicipality(municipalityId);
            }
          }
          
          // Check if area is still used anywhere
          if (areaId) {
            let areaStillUsed = false;
            for (let x = 0; x < gridService.width; x++) {
              for (let y = 0; y < gridService.height; y++) {
                const tile = gridService.getTile(x, y);
                if (tile && tile.areaId === areaId) {
                  areaStillUsed = true;
                  break;
                }
              }
              if (areaStillUsed) break;
            }
            
            // If area is not used anywhere, remove it
            if (!areaStillUsed) {
              municipalityManager.removeArea(areaId);
            }
          }
          
          // Check if unit is still used anywhere
          if (unitId) {
            let unitStillUsed = false;
            for (let x = 0; x < gridService.width; x++) {
              for (let y = 0; y < gridService.height; y++) {
                const tile = gridService.getTile(x, y);
                if (tile && tile.unitId === unitId) {
                  unitStillUsed = true;
                  break;
                }
              }
              if (unitStillUsed) break;
            }
            
            // If unit is not used anywhere, remove it
            if (!unitStillUsed) {
              municipalityManager.removeUnit(unitId);
            }
          }
        }

        destroy(): void {
          if (this.graphics) {
            this.graphics.destroy();
          }
        }
      };
    };
  }
}
