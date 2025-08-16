import { GameStateService } from '../services/game-state.service';
import { RenderingService } from '../services/rendering.service';
import { EducationHierarchyService } from '../services/education-hierarchy.service';
import { GameEventService } from '../services/game-event.service';

export class MainSceneFactory {
  static createScene(gameStateService: GameStateService, renderingService: RenderingService, educationHierarchyService: EducationHierarchyService, gameEventService: GameEventService): any {
    // Return a function that will create the scene class when called
    return function(Phaser: any) {
      // Handle different import formats for production builds
      const PhaserModule = Phaser.default || Phaser;
      const Scene = PhaserModule.Scene || Phaser.Scene;
      
      console.log('🔍 Phaser import check:', { 
        hasDefault: !!Phaser.default, 
        hasDirectScene: !!Phaser.Scene, 
        hasModuleScene: !!(PhaserModule?.Scene),
        SceneFound: !!Scene
      });
      
      if (!Scene) {
        console.error('❌ No Scene class found!', { Phaser, PhaserModule });
        throw new Error('Phaser.Scene not available in any format');
      }
      
      console.log('✅ Using Scene class:', Scene);
      
      return class extends Scene {
        private gameEventService: GameEventService;
        private graphics: any;
        private gameStateService: GameStateService;
        private renderingService: RenderingService;
        private educationHierarchyService: EducationHierarchyService;
        private municipalityManager: any;
        private isSelecting: boolean = false;
        private selectedBoundary: string | null = null;
        private isPlacingSchool: boolean = false;
        
        // Paint mode system
        private paintMode: 'municipality' | 'area' | 'unit' | 'school' | 'clear' | null = null;
        private currentMunicipalityId: string | null = null;
        private currentAreaId: string | null = null;
        private currentUnitId: string | null = null;

        constructor() {
          console.log('🏗️ MainScene constructor called');
          super({ key: 'MainScene' });
          console.log('✅ Super constructor completed');
          this.gameStateService = gameStateService;
          this.renderingService = renderingService;
          this.educationHierarchyService = educationHierarchyService;
          this.gameEventService = gameEventService;
          // Access municipalityManager through renderingService (which has it injected)
          this.municipalityManager = (renderingService as any).municipalityManager;
          
          if (!this.municipalityManager) {
            console.error('❌ MunicipalityManager not found in RenderingService!');
          }
          console.log('✅ MainScene constructor completed');
        }

        preload(): void {
          console.log('🏗️ MainScene preload called');
          // Load the school PNG image during preload phase
          (this as any)['load'].image('school', 'assets/images/school.png');
          
          // Handle loading errors
          (this as any)['load'].on('loaderror', (file: any) => {
            console.error('Failed to load:', file.key);
            if (file.key === 'school') {
              // Create a fallback texture if PNG loading fails
              this.createFallbackTexture();
            }
          });
          console.log('✅ MainScene preload completed');
        }

        createFallbackTexture(): void {
          const graphics = (this as any)['add'].graphics();
          
          // Create a simple school building as fallback
          graphics.fillStyle(0xD2691E);
          graphics.fillRect(8, 32, 48, 32);
          
          graphics.fillStyle(0x8B4513);
          graphics.fillRect(12, 24, 40, 24);
          
          graphics.fillStyle(0x654321);
          graphics.fillRect(8, 16, 48, 12);
          
          graphics.fillStyle(0x87CEEB);
          graphics.fillRect(18, 32, 8, 8);
          graphics.fillRect(38, 32, 8, 8);
          
          graphics.generateTexture('school', 64, 64);
          graphics.destroy();
        }

        create(): void {
          console.log('🏗️ MainScene create called');
          
          try {
            console.log('🎨 Creating graphics...');
            
            // Try different ways to access graphics
            const addObject = (this as any).add;
            console.log('✅ Add object available:', !!addObject);
            
            if (addObject && typeof addObject.graphics === 'function') {
              this.graphics = addObject.graphics();
              console.log('✅ Graphics created successfully');
              
              // Draw a simple test rectangle to show the canvas is working
              this.graphics.fillStyle(0x00ff00, 1);
              this.graphics.fillRect(100, 100, 200, 100);
              console.log('✅ Test rectangle drawn');
              
              this.renderingService.setGraphics(this.graphics);
              console.log('✅ Graphics set in rendering service');
              
              this.renderingService.setScene(this); // Initialize sprite system
              console.log('✅ Scene set in rendering service');

              // Start the game
              console.log('🚀 Starting game...');
              this.gameStateService.startGame();
              console.log('✅ Game started');

              // Initial render
              console.log('🎨 Initial render...');
              this.gameStateService.renderGame();
              console.log('✅ Initial render completed');
              
              console.log('🎮 MainScene create completed successfully!');
            } else {
              console.error('❌ Graphics function not available');
              console.log('Add object type:', typeof addObject);
              console.log('Graphics function type:', typeof addObject?.graphics);
            }
          } catch (error) {
            console.error('❌ Error in MainScene create:', error);
            if (error instanceof Error) {
              console.error('Error details:', error.stack);
            }
          }

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
            
            // Allow school placement if:
            // 1. Tile has a unit ID (is within a unit boundary)
            // 2. No school already exists on this tile or in the surrounding area
            if (tile && tile.unitId && !tile.hasSchool) {
              const schoolService = (this.gameStateService as any).schoolService;
              if (schoolService) {
                const school = schoolService.placeSchoolAuto(x, y);
                if (school) {
                  // Re-render the game after placing school
                  this.gameStateService.renderGame();
                  
                  // Auto-save after school placement
                  if (typeof window !== 'undefined' && (window as any).autoSaveGame) {
                    (window as any).autoSaveGame();
                  }
                } else {
                  console.error('❌ Could not place school at position', x, y);
                }
              }
            } else {
              // School placement blocked - either no unit or area already has school
              if (!tile.unitId) {
                console.error('❌ Cannot place school - tile is not within a unit boundary');
              } else if (tile.hasSchool) {
                console.error('❌ Cannot place school - area already has a school');
              }
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
              this.paintSchool(tile, x, y); // Pass coordinates to paintSchool
              break;
            case 'clear':
              this.clearTile(tile, x, y); // Pass coordinates to clearTile
              break;
          }
          
          // Re-render the game after painting
          this.gameStateService.renderGame();
          
          // Auto-save after each paint action
          if (typeof window !== 'undefined' && (window as any).autoSaveGame) {
            (window as any).autoSaveGame();
          }
          
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
            // Create a new municipality only if we don't have an active one
            if (!this.currentMunicipalityId) {
              this.municipalityManager.addMunicipality();
              const municipalities = this.municipalityManager.getMunicipalities();
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
            // Create a new area only if we don't have an active one for this municipality
            if (!this.currentAreaId) {
              const newArea = this.municipalityManager.addArea(tile.municipalityId);
              if (newArea) {
                this.currentAreaId = newArea.id;
              }
            }
            
            // Always assign the current active area to this tile (if it exists)
            if (this.currentAreaId) {
              // Verify the area belongs to the same municipality
              const area = this.municipalityManager.getAreaById(this.currentAreaId);
              if (area && area.municipalityId === tile.municipalityId) {
                tile.areaId = this.currentAreaId;
                tile.unitId = ''; // Clear unit when assigning area
              }
            }
          }
        }

        paintUnit(tile: any): void {
          if (tile.areaId && !tile.unitId) {
            // Create a new unit only if we don't have an active one for this area
            if (!this.currentUnitId) {
              const area = this.municipalityManager.getAreaById(tile.areaId);
              if (area) {
                const newUnit = this.municipalityManager.addUnit(area.municipalityId, tile.areaId);
                if (newUnit) {
                  this.currentUnitId = newUnit.id;
                }
              }
            }
            
            // Always assign the current active unit to this tile (if it exists)
            if (this.currentUnitId) {
              // Verify the unit belongs to the same area
              const unit = this.municipalityManager.getUnitById(this.currentUnitId);
              if (unit && unit.areaId === tile.areaId) {
                tile.unitId = this.currentUnitId;
              }
            }
          }
        }

        paintSchool(tile: any, x: number, y: number): void {
          if (tile.unitId && !tile.hasSchool) {
            // Use the school service to place a school with automatic type selection
            const schoolService = (this.gameStateService as any).schoolService;
            if (schoolService) {
              const school = schoolService.placeSchoolAuto(x, y);
              if (!school) {
                console.error('❌ Could not place school at position', x, y);
              }
            }
          }
        }

        clearTile(tile: any, x: number, y: number): void {
          // Store what we're clearing for cleanup
          const clearedMunicipalityId = tile.municipalityId;
          const clearedAreaId = tile.areaId;
          const clearedUnitId = tile.unitId;
          
          // First, check if there's a school here and remove it properly
          if (tile.hasSchool) {
            const schoolService = (this.gameStateService as any).schoolService;
            if (schoolService) {
              // Remove school using school service
              schoolService.removeSchool(x, y);
            }
          }
          
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
          
          if (!gridService || !this.municipalityManager) return;
          
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
              this.municipalityManager.removeMunicipality(municipalityId);
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
              this.municipalityManager.removeArea(areaId);
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
              this.municipalityManager.removeUnit(unitId);
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
