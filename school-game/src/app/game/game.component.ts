
import { Component, ElementRef, OnInit, OnDestroy, ViewChild, Inject, PLATFORM_ID, NgZone, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { BoundarySelectorComponent } from './ui/boundary-selector.component';
import { ThemeToggleComponent } from './ui/theme-toggle.component';
import { GameEngineService, GameConfig } from './services/game-engine.service';
import { GameStateService } from './services/game-state.service';
import { RenderingService } from './services/rendering.service';
import { ThemeService } from './services/theme.service';
import { GameDataService } from './services/game-data.service';
import { MainSceneFactory } from './scenes/main-scene';
import { GameEventService } from './services/game-event.service';
import { EducationHierarchyService } from './services/education-hierarchy.service';
import { GAME_CONSTANTS } from './constants/game-constants';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, BoundarySelectorComponent, ThemeToggleComponent],
  template: `
    <!-- Top control bar with utilities and theme toggle -->
    <div class="control-bar">
      <div class="control-group">
        <button class="main-btn" (click)="zoomOut()" aria-label="Zoom Out">
          <span class="material-icons-outlined">zoom_out</span>
        </button>
        <button class="main-btn" (click)="zoomIn()" aria-label="Zoom In">
          <span class="material-icons-outlined">zoom_in</span>
        </button>
        <button class="main-btn save-btn" (click)="saveGame()" title="Save Game">
          <span class="material-icons-outlined">save</span>
        </button>
        <button class="main-btn load-btn" (click)="loadGame()" [disabled]="!hasSavedData" title="Load Game">
          <span class="material-icons-outlined">folder_open</span>
        </button>
        <button class="main-btn clean-slate-btn" (click)="onCleanSlate()">
          <span class="material-icons-outlined">cleaning_services</span>
          Clean Slate
        </button>
      </div>
      <app-theme-toggle></app-theme-toggle>
    </div>

    <!-- Separate paint toolbar -->
    <app-boundary-selector (boundarySelected)="onBoundarySelected($event)"></app-boundary-selector>

    <!-- School Info Modal -->
    <div class="school-info-modal" [class.modal-hidden]="!selectedSchool">
      <div class="modal-content">
        <h3>{{ selectedSchool?.name || 'No School' }}</h3>
        <p>Students: {{ selectedSchool?.currentStudents || 0 }} / {{ selectedSchool?.capacity || 0 }}</p>
        <div class="modal-actions">
          <button class="modal-btn primary" (click)="addStudent()" [disabled]="!selectedSchool">Add Student</button>
          <button class="modal-btn secondary" (click)="removeStudent()" [disabled]="!selectedSchool || selectedSchool.currentStudents === 0">Remove Student</button>
          <button class="modal-btn danger" (click)="removeSchool()" [disabled]="!selectedSchool">Remove School</button>
          <button class="modal-btn" (click)="closeSchoolInfo()">Close</button>
        </div>
      </div>
    </div>

    <div id="gameContainer" #gameContainer></div>
  `,
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  selectedSchool: any = null;
  selectedSchoolPos: { x: number, y: number } | null = null;
  hasSavedData: boolean = false;
  private schoolClickedSubscription?: Subscription;
  private themeSubscription?: Subscription;
  // Handle click on the game grid to select a school
  onGameContainerClick(event: MouseEvent) {
    // Get click position relative to the canvas
    const rect = this.gameContainer.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // Convert to grid position
    const gridPos = this.renderingService.screenToGrid(x, y);
    // Check if a school exists at this position
    if (this.gameStateService && this.gameStateService.isGameActive()) {
      const school = this.gameStateService["schoolService"].getSchoolAtPosition(gridPos.x, gridPos.y);
      if (school) {
        this.selectedSchool = { ...school };
        this.selectedSchoolPos = { x: gridPos.x, y: gridPos.y };
      } else {
        this.selectedSchool = null;
        this.selectedSchoolPos = null;
      }
    }
  }

  addStudent() {
    if (this.selectedSchool) {
      const ok = this.gameStateService["schoolService"].addStudents(this.selectedSchool.id, 1);
      if (ok) {
        this.selectedSchool.currentStudents++;
        this.gameStateService.renderGame();
      }
    }
  }

  removeStudent() {
    if (this.selectedSchool && this.selectedSchool.currentStudents > 0) {
      const ok = this.gameStateService["schoolService"].removeStudents(this.selectedSchool.id, 1);
      if (ok) {
        this.selectedSchool.currentStudents--;
        this.gameStateService.renderGame();
      }
    }
  }

  removeSchool() {
    if (this.selectedSchoolPos) {
      this.gameStateService["schoolService"].removeSchool(this.selectedSchoolPos.x, this.selectedSchoolPos.y);
      this.selectedSchool = null;
      this.selectedSchoolPos = null;
      this.gameStateService.renderGame();
    }
  }

  closeSchoolInfo() {
    this.selectedSchool = null;
    this.selectedSchoolPos = null;
    this.cdRef.detectChanges();
  }
  private lastTouchDist: number | null = null;
  selectedBoundary: string | null = null;
  @ViewChild('gameContainer', { static: true }) gameContainer!: ElementRef;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private gameEngineService: GameEngineService,
    private gameStateService: GameStateService,
    private renderingService: RenderingService,
    private educationHierarchyService: EducationHierarchyService,
    private gameEventService: GameEventService,
    private themeService: ThemeService,
    private gameDataService: GameDataService,
    private ngZone: NgZone,
    private cdRef: ChangeDetectorRef
  ) {}

  // Mouse wheel zoom handler
  onWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomChange = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = this.renderingService!.getZoom() + zoomChange;
    this.renderingService!.setZoom(newZoom);
    this.gameStateService!.renderGame();
  }

    zoomIn() {
      const newZoom = this.renderingService.getZoom() + 0.1;
      this.renderingService.setZoom(newZoom);
      this.gameStateService.renderGame();
    }

    zoomOut() {
      const newZoom = this.renderingService.getZoom() - 0.1;
      this.renderingService.setZoom(newZoom);
      this.gameStateService.renderGame();
    }

    // Touch pinch-to-zoom handlers
    onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        this.lastTouchDist = this.getTouchDist(e);
      }
    };

    onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && this.lastTouchDist !== null) {
        e.preventDefault();
        const newDist = this.getTouchDist(e);
        const delta = newDist - this.lastTouchDist;
        if (Math.abs(delta) > 5) {
          const zoomChange = delta > 0 ? 0.05 : -0.05;
          const newZoom = this.renderingService.getZoom() + zoomChange;
          this.renderingService.setZoom(newZoom);
          this.gameStateService.renderGame();
          this.lastTouchDist = newDist;
        }
      }
    };

    onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        this.lastTouchDist = null;
      }
    };

    getTouchDist(e: TouchEvent): number {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Check if there's saved game data
      this.hasSavedData = this.gameDataService.hasSavedData();
      
      // Apply initial theme
      this.themeService.getCurrentTheme();
      
      try {
        // Wait a bit for the container to be properly sized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try to load saved data first
        if (this.hasSavedData) {
          const loadSuccess = this.gameDataService.loadGameData();
        }
        
        // Configure game
        const container = this.gameContainer.nativeElement;
        if (!container) {
          console.error('❌ Game container element not found!');
          return;
        }
        // Use full window size in browser
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Get theme background color for Phaser (as string for GameConfig)
        const theme = this.themeService.getCurrentTheme();
        const backgroundColor = theme.background; // Keep as hex string
        
        const gameConfig: GameConfig = {
          width,
          height,
          backgroundColor
        };
        // Create scene factory function
        const sceneFactory = MainSceneFactory.createScene(this.gameStateService, this.renderingService, this.educationHierarchyService, this.gameEventService);
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
        
        // Set up callback for paint tool state updates
        (window as any).updatePaintToolStates = () => {
          this.ngZone.run(() => {
            // Force change detection by marking for check
            this.cdRef.markForCheck();
            this.cdRef.detectChanges();
          });
        };
        
        // Set up auto-save callback
        (window as any).autoSaveGame = () => {
          this.ngZone.run(() => {
            this.saveGame();
          });
        };
        
        // Add pinch-to-zoom support for touch devices
        container.addEventListener('touchstart', this.onTouchStart, { passive: false });
        container.addEventListener('touchmove', this.onTouchMove, { passive: false });
        container.addEventListener('touchend', this.onTouchEnd, { passive: false });
        // Add mouse wheel zoom support
        container.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

        // Listen for school tile clicks from Phaser scene via GameEventService
        this.schoolClickedSubscription = this.gameEventService.schoolClicked$.subscribe((school: any) => {
          this.ngZone.run(() => {
            this.selectedSchool = { ...school };
            this.selectedSchoolPos = { x: school.x, y: school.y };
            this.cdRef.markForCheck();
            this.cdRef.detectChanges();
            // Double-check: force another detection cycle
            setTimeout(() => this.cdRef.detectChanges(), 0);
          });
        });

        // Listen for theme changes to update Phaser canvas background
        this.themeSubscription = this.themeService.isDarkMode$.subscribe((isDarkMode: boolean) => {
          this.ngZone.run(() => {
            const theme = this.themeService.getCurrentTheme();
            const canvas = document.querySelector('canvas');
            if (canvas) {
              canvas.style.backgroundColor = theme.background;
              canvas.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
            }
            
            // Update Phaser game background if game engine exists
            if (this.gameEngineService.getGame()) {
              const hexColor = parseInt(theme.background.replace('#', ''), 16);
              this.gameEngineService.getGame().scene.scenes.forEach((scene: any) => {
                if (scene.cameras && scene.cameras.main) {
                  scene.cameras.main.setBackgroundColor(hexColor);
                }
              });
            }
          });
        });
      } catch (error) {
        console.error('❌ Error during game initialization:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      }
    }
  }



  ngOnDestroy() {
    // Unsubscribe from school click events to prevent memory leaks and duplicate subscriptions
    if (this.schoolClickedSubscription) {
      this.schoolClickedSubscription.unsubscribe();
    }
    
    // Unsubscribe from theme changes
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    
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
    // Also clear the municipality manager data
    const municipalityManager = (this.renderingService as any).municipalityManager;
    if (municipalityManager) {
      municipalityManager.clearAll();
    }
    // Auto-save after clean slate
    this.saveGame();
  }

  saveGame() {
    const success = this.gameDataService.saveGameData();
    if (success) {
      this.hasSavedData = true;
      // You could show a toast notification here
    } else {
      console.error('❌ Failed to save game');
      // You could show an error message here
    }
  }

  loadGame() {
    const success = this.gameDataService.loadGameData();
    if (success) {
      // Re-render the game after loading
      this.gameStateService.renderGame();
      // You could show a toast notification here
    } else {
      console.error('❌ Failed to load game');
      // You could show an error message here
    }
  }
}
