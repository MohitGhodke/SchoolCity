
/**
 * @fileoverview Main game component for the SchoolCity simulation game.
 * 
 * This component manages the entire game interface including:
 * - Phaser.js game engine integration
 * - User interface controls (zoom, theme, save/load)
 * - School management modal system
 * - Touch and mouse input handling
 * - Game state persistence
 * 
 * The component acts as the bridge between Angular's reactive UI system
 * and the Phaser.js game engine, handling all user interactions and
 * coordinating with various game services.
 * 
 * @author SchoolCity Development Team
 * @version 1.0.0
 */

import { 
  Component, 
  ElementRef, 
  OnInit, 
  OnDestroy, 
  ViewChild, 
  Inject, 
  PLATFORM_ID, 
  NgZone, 
  ChangeDetectorRef 
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

// Game UI Components
import { BoundarySelectorComponent } from './ui/boundary-selector.component';
import { ThemeToggleComponent } from './ui/theme-toggle.component';

// Game Services
import { GameEngineService, GameConfig } from './services/game-engine.service';
import { GameStateService } from './services/game-state.service';
import { RenderingService } from './services/rendering.service';
import { ThemeService } from './services/theme.service';
import { GameDataService } from './services/game-data.service';
import { GameEventService } from './services/game-event.service';
import { EducationHierarchyService } from './services/education-hierarchy.service';

// Game Scene and Constants
import { MainSceneFactory } from './scenes/main-scene';
import { GAME_CONSTANTS } from './constants/game-constants';

/**
 * Main game component that manages the entire SchoolCity game interface.
 * 
 * This component handles:
 * - Game initialization and cleanup
 * - User input (mouse, touch, keyboard)
 * - UI state management
 * - School selection and management
 * - Game persistence (save/load)
 * - Theme and zoom controls
 */

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

    <!-- Boundary paint toolbar -->
    <app-boundary-selector (boundarySelected)="onBoundarySelected($event)"></app-boundary-selector>

    <!-- School information modal -->
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

    <!-- Phaser.js game container -->
    <div id="gameContainer" #gameContainer></div>
  `,
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  // Component Properties
  /** Currently selected school data for the modal */
  selectedSchool: any = null;
  
  /** Grid position of the currently selected school */
  selectedSchoolPos: { x: number, y: number } | null = null;
  
  /** Whether there is saved game data available to load */
  hasSavedData: boolean = false;
  
  /** Currently selected boundary type for painting */
  selectedBoundary: string | null = null;

  // Touch Input Properties  
  /** Last recorded distance between two touch points for pinch-to-zoom */
  private lastTouchDist: number | null = null;

  // Subscriptions for cleanup
  /** Subscription to school click events from Phaser */
  private schoolClickedSubscription?: Subscription;
  
  /** Subscription to theme change events */
  private themeSubscription?: Subscription;

  // View References
  /** Reference to the DOM container where Phaser renders the game */
  @ViewChild('gameContainer', { static: true }) gameContainer!: ElementRef;

  /**
   * Constructor - inject all required services
   */
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

  // School Management Methods

  /**
   * Add a student to the currently selected school
   */
  addStudent(): void {
    if (this.selectedSchool) {
      const ok = this.gameStateService["schoolService"].addStudents(this.selectedSchool.id, 1);
      if (ok) {
        this.selectedSchool.currentStudents++;
        this.gameStateService.renderGame();
      }
    }
  }

  /**
   * Remove a student from the currently selected school
   */
  removeStudent(): void {
    if (this.selectedSchool && this.selectedSchool.currentStudents > 0) {
      const ok = this.gameStateService["schoolService"].removeStudents(this.selectedSchool.id, 1);
      if (ok) {
        this.selectedSchool.currentStudents--;
        this.gameStateService.renderGame();
      }
    }
  }

  /**
   * Remove the currently selected school from the grid
   */
  removeSchool(): void {
    if (this.selectedSchoolPos) {
      this.gameStateService["schoolService"].removeSchool(this.selectedSchoolPos.x, this.selectedSchoolPos.y);
      this.selectedSchool = null;
      this.selectedSchoolPos = null;
      this.gameStateService.renderGame();
    }
  }

  /**
   * Close the school information modal
   */
  closeSchoolInfo(): void {
    this.selectedSchool = null;
    this.selectedSchoolPos = null;
    this.cdRef.detectChanges();
  }

  // Input Handling Methods

  /**
   * Handle mouse wheel zoom events
   */
  /**
   * Handle mouse wheel zoom events
   */
  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomChange = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = this.renderingService!.getZoom() + zoomChange;
    this.renderingService!.setZoom(newZoom);
    this.gameStateService!.renderGame();
  }

  /**
   * Increase zoom level
   */
  zoomIn(): void {
    const newZoom = this.renderingService.getZoom() + 0.1;
    this.renderingService.setZoom(newZoom);
    this.gameStateService.renderGame();
  }

  /**
   * Decrease zoom level  
   */
  zoomOut(): void {
    const newZoom = this.renderingService.getZoom() - 0.1;
    this.renderingService.setZoom(newZoom);
    this.gameStateService.renderGame();
  }

  /**
   * Handle touch start events for pinch-to-zoom
   */
  onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 2) {
      this.lastTouchDist = this.getTouchDist(e);
    }
  };

  /**
   * Handle touch move events for pinch-to-zoom
   */
  onTouchMove = (e: TouchEvent): void => {
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

  /**
   * Handle touch end events for pinch-to-zoom
   */
  onTouchEnd = (e: TouchEvent): void => {
    if (e.touches.length < 2) {
      this.lastTouchDist = null;
    }
  };

  /**
   * Calculate distance between two touch points
   */
  getTouchDist(e: TouchEvent): number {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Lifecycle Methods

  /**
   * Component initialization - set up the game engine and all event handlers
   */
  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      // Check if there's saved game data
      this.hasSavedData = this.gameDataService.hasSavedData();
      
      // Apply initial theme
      this.themeService.getCurrentTheme();
      
      try {
        // Wait a bit for the container to be properly sized
        await new Promise(resolve => setTimeout(resolve, 500));
        
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

  /**
   * Component cleanup - destroy game and unsubscribe from events
   */
  ngOnDestroy(): void {
    // Unsubscribe from school click events to prevent memory leaks
    if (this.schoolClickedSubscription) {
      this.schoolClickedSubscription.unsubscribe();
    }
    
    // Unsubscribe from theme changes
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    
    // Destroy the Phaser game instance
    this.gameEngineService.destroyGame();
  }

  // Game Action Methods

  /**
   * Handle boundary selection from the UI
   */
  onBoundarySelected(boundaryId: string): void {
    this.selectedBoundary = boundaryId;
    // Sync with Phaser scene
    if (typeof window !== 'undefined' && (window as any).setSelectedBoundary) {
      (window as any).setSelectedBoundary(boundaryId);
    }
  }

  /**
   * Reset the game to a clean state
   */
  onCleanSlate(): void {
    this.gameStateService.cleanSlate();
    // Also clear the municipality manager data
    const municipalityManager = (this.renderingService as any).municipalityManager;
    if (municipalityManager) {
      municipalityManager.clearAll();
    }
    // Auto-save after clean slate
    this.saveGame();
  }

  /**
   * Save the current game state to localStorage
   */
  saveGame(): void {
    const success = this.gameDataService.saveGameData();
    if (success) {
      this.hasSavedData = true;
      // TODO: Show success toast notification
    } else {
      console.error('❌ Failed to save game');
      // TODO: Show error message to user
    }
  }

  /**
   * Load game state from localStorage
   */
  loadGame(): void {
    const success = this.gameDataService.loadGameData();
    if (success) {
      // Re-render the game after loading
      this.gameStateService.renderGame();
      // TODO: Show success toast notification
    } else {
      console.error('❌ Failed to load game');
      // TODO: Show error message to user
    }
  }
}
