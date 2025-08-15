import { Component, ElementRef, OnInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { BoundarySelectorComponent } from './ui/boundary-selector.component';
import { GameEngineService, GameConfig } from './services/game-engine.service';
import { GameStateService } from './services/game-state.service';
import { RenderingService } from './services/rendering.service';
import { MainSceneFactory } from './scenes/main-scene';
import { EducationHierarchyService } from './services/education-hierarchy.service';
import { GAME_CONSTANTS } from './constants/game-constants';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, BoundarySelectorComponent],
  template: `
    <div class="control-bar">
      <app-boundary-selector (boundarySelected)="onBoundarySelected($event)"></app-boundary-selector>
      <button class="main-btn" (click)="onCleanSlate()">Clean Slate</button>
    </div>
    <div id="gameContainer" #gameContainer></div>
  `,
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  selectedBoundary: string | null = null;
  @ViewChild('gameContainer', { static: true }) gameContainer!: ElementRef;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private gameEngineService: GameEngineService,
    private gameStateService: GameStateService,
    private renderingService: RenderingService,
    private educationHierarchyService: EducationHierarchyService
  ) {}

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        // Wait a bit for the container to be properly sized
        await new Promise(resolve => setTimeout(resolve, 100));
        // Configure game
        const container = this.gameContainer.nativeElement;
        // Use full window size in browser
        const width = window.innerWidth;
        const height = window.innerHeight;
        const gameConfig: GameConfig = {
          width,
          height,
          backgroundColor: GAME_CONSTANTS.GAME.BACKGROUND_COLOR
        };
        // Create scene factory function
  const sceneFactory = MainSceneFactory.createScene(this.gameStateService, this.renderingService, this.educationHierarchyService);
        // Initialize game with the scene factory
        await this.gameEngineService.initializeGame(
          container,
          gameConfig,
          sceneFactory
        );
        // Center the grid in the canvas after game is initialized
        this.renderingService.centerGrid(
          gameConfig.width,
          gameConfig.height,
          GAME_CONSTANTS.GRID.SIZE
        );
        // (Debug canvas code removed)
      } catch (error) {
        // (Error logging removed)
      }
    }
  }

  ngOnDestroy() {
    this.gameEngineService.destroyGame();
  }

  onBoundarySelected(boundaryId: string) {
    this.selectedBoundary = boundaryId;
    // Sync with Phaser scene
    if (typeof window !== 'undefined' && (window as any).setSelectedBoundary) {
      (window as any).setSelectedBoundary(boundaryId);
    }
  }

  onCleanSlate() {
    this.gameStateService.cleanSlate();
    // Optionally reset hierarchy as well if needed
  }
}
