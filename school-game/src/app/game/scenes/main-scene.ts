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
            if (boundaryId === 'school') {
              this.isPlacingSchool = true;
              this.selectedBoundary = null;
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
                console.log('[Phaser] School tile clicked:', { ...school, x, y });
                this.gameEventService.schoolClicked$.next({ ...school, x, y });
              } else {
                this.gameStateService.handleTileClick(pointer.x, pointer.y);
              }
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
              // Assign boundaries with strict hierarchy
              if (this.selectedBoundary?.startsWith('municipality')) {
                // Only assign municipality if not already set or to change
                if (tile.municipalityId !== this.selectedBoundary) {
                  tile.municipalityId = this.selectedBoundary;
                  tile.areaId = '';
                  tile.unitId = '';
                }
              } else if (this.selectedBoundary?.startsWith('area')) {
                // Only assign area if tile has a municipality and no area/unit
                if (tile.municipalityId && !tile.areaId && !tile.unitId) {
                  tile.areaId = this.selectedBoundary;
                }
              } else if (this.selectedBoundary?.startsWith('unit')) {
                // Only assign unit if tile has an area and no unit
                if (tile.areaId && !tile.unitId) {
                  tile.unitId = this.selectedBoundary;
                }
              }
              this.gameStateService.renderGame();
            }
          }
        }

        tryPlaceSchoolAt(screenX: number, screenY: number) {
          const { x, y } = this.renderingService.screenToGrid(screenX, screenY);
          const gridService = (this.gameStateService as any).gridService;
          if (gridService && gridService.isValidPosition(x, y)) {
            const tile = gridService.getTile(x, y);
            // Only allow school placement if unit is assigned and no school exists
            if (tile && tile.unitId && !tile.hasSchool) {
              this.gameStateService.handleTileClick(screenX, screenY);
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
