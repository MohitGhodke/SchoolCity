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
            if (boundaryId.startsWith('school:')) {
              this.isPlacingSchool = true;
              this.selectedBoundary = boundaryId; // Keep the full "school:unitId" format
            } else {
              this.isPlacingSchool = false;
              this.selectedBoundary = boundaryId;
            }
          };

          // Set up input handling for click-and-drag selection
          (this as any)['input'].on('pointerdown', (pointer: any) => {
            if (this.isPlacingSchool) {
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
            if (this.isSelecting && this.selectedBoundary) {
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

        destroy(): void {
          if (this.graphics) {
            this.graphics.destroy();
          }
        }
      };
    };
  }
}
