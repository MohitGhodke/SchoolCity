
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
    <!-- Status message overlay -->
    <div class="status-message" [class.visible]="isStatusMessageVisible">
      {{ statusMessage }}
    </div>

    <!-- Top control bar with utilities and theme toggle -->
    <div class="control-bar">
      <div class="control-group">
        <button class="main-btn" (click)="zoomOut()" aria-label="Zoom Out">
          <span class="material-icons-outlined">zoom_out</span>
        </button>
        <button class="main-btn" (click)="zoomIn()" aria-label="Zoom In">
          <span class="material-icons-outlined">zoom_in</span>
        </button>
        <button class="main-btn" (click)="resetCamera()" aria-label="Center View" title="Center View">
          <span class="material-icons-outlined">center_focus_strong</span>
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

  // Status Message Properties
  /** Current status message to display */
  statusMessage: string = '';
  
  /** Whether status message is visible */
  isStatusMessageVisible: boolean = false;
  
  /** Timeout reference for hiding status message */
  private statusMessageTimeout: any = null;

  // Touch Input Properties  
  /** Last recorded distance between two touch points for pinch-to-zoom */
  private lastTouchDist: number | null = null;

  // Pan/Drag Properties
  /** Whether the user is currently panning/dragging the grid */
  private isPanning: boolean = false;
  
  /** Whether the user is actively dragging for paint operations */
  private isPaintDragging: boolean = false;
  
  /** Last recorded pointer position for calculating pan delta */
  private lastPointerPos: { x: number; y: number } | null = null;
  
  /** Whether the current gesture is a pan (for preventing clicks during pan) */
  private gestureIsPan: boolean = false;

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
  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomChange = e.deltaY > 0 ? -0.05 : 0.05;
    const currentZoom = this.renderingService.getZoom();
    const newZoom = currentZoom + zoomChange;
    
    // Get mouse position relative to canvas
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate the grid point the mouse is over before zoom
    const beforeGrid = this.renderingService.screenToGrid(mouseX, mouseY);
    
    // Apply zoom
    this.renderingService.setZoom(newZoom);
    
    // Calculate where that same grid point is after zoom
    const afterScreen = this.renderingService.gridToScreen(beforeGrid.x, beforeGrid.y);
    
    // Calculate how much to pan to keep the mouse over the same grid point
    const panDeltaX = mouseX - afterScreen.sx;
    const panDeltaY = mouseY - afterScreen.sy;
    
    // Apply the pan correction
    this.renderingService.panCamera(panDeltaX, panDeltaY);
    
    this.gameStateService.renderGame();
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
   * Reset camera position to center the grid
   */
  resetCamera(): void {
    this.renderingService.resetCameraPosition();
    this.gameStateService.renderGame();
  }

  /**
   * Handle touch start events for pinch-to-zoom and pan gestures
   */
  onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 2) {
      // Two finger gesture - prepare for pinch zoom
      this.lastTouchDist = this.getTouchDist(e);
      this.isPanning = false;
      this.isPaintDragging = false;
    } else if (e.touches.length === 1) {
      // Single finger gesture
      if (this.isPaintModeActive()) {
        // Start paint dragging
        this.isPaintDragging = true;
      } else {
        // Prepare for pan
        this.startPan(e.touches[0].clientX, e.touches[0].clientY);
      }
    }
  };

  /**
   * Handle touch move events for pinch-to-zoom and pan gestures
   */
  onTouchMove = (e: TouchEvent): void => {
    if (e.touches.length === 2 && this.lastTouchDist !== null) {
      // Two finger pinch zoom
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
    } else if (e.touches.length === 1) {
      if (this.isPanning && !this.isPaintModeActive()) {
        // Single finger pan - only when not in paint mode
        e.preventDefault();
        this.updatePan(e.touches[0].clientX, e.touches[0].clientY);
      } else if (this.isPaintDragging && this.isPaintModeActive()) {
        // Paint mode dragging - only when actively dragging
        e.preventDefault();
        this.handlePaintDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }
  };

  /**
   * Handle touch end events for pinch-to-zoom and pan gestures
   */
  onTouchEnd = (e: TouchEvent): void => {
    if (e.touches.length < 2) {
      this.lastTouchDist = null;
    }
    if (e.touches.length === 0) {
      this.endPan();
      this.isPaintDragging = false; // Stop paint dragging
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

  // Pan/Drag Methods

  /**
   * Start a pan gesture
   */
  startPan(x: number, y: number): void {
    this.isPanning = true;
    this.gestureIsPan = false;
    this.lastPointerPos = { x, y };
  }

  /**
   * Update pan position during drag
   */
  updatePan(x: number, y: number): void {
    if (!this.isPanning || !this.lastPointerPos) return;
    
    const deltaX = x - this.lastPointerPos.x;
    const deltaY = y - this.lastPointerPos.y;
    
    // If movement is significant, mark this as a pan gesture
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      this.gestureIsPan = true;
    }
    
    // Apply pan to the rendering service
    this.renderingService.panCamera(deltaX, deltaY);
    this.gameStateService.renderGame();
    
    // Update last position
    this.lastPointerPos = { x, y };
  }

  /**
   * End a pan gesture
   */
  endPan(): void {
    this.isPanning = false;
    this.lastPointerPos = null;
    
    // Reset gesture flag after a short delay to prevent accidental clicks
    setTimeout(() => {
      this.gestureIsPan = false;
    }, 100);
  }

  /**
   * Handle mouse down for pan start
   */
  onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0 && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      if (this.isPaintModeActive()) {
        // Start paint dragging
        this.isPaintDragging = true;
      } else {
        // Start pan
        this.startPan(e.clientX, e.clientY);
      }
    }
  };

  /**
   * Handle mouse move for pan update
   */
  onMouseMove = (e: MouseEvent): void => {
    if (this.isPanning && !this.isPaintModeActive()) {
      e.preventDefault();
      this.updatePan(e.clientX, e.clientY);
    } else if (this.isPaintDragging && this.isPaintModeActive()) {
      // Paint mode dragging - only when actively dragging
      e.preventDefault();
      this.handlePaintDrag(e.clientX, e.clientY);
    }
  };

  /**
   * Handle mouse up for pan end
   */
  onMouseUp = (e: MouseEvent): void => {
    if (this.isPanning) {
      this.endPan();
    }
    // Always stop paint dragging on mouse up
    this.isPaintDragging = false;
  };

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

        // Add mouse pan/drag support
        container.addEventListener('mousedown', this.onMouseDown, { passive: false });
        container.addEventListener('mousemove', this.onMouseMove, { passive: false });
        container.addEventListener('mouseup', this.onMouseUp, { passive: false });
        
        // Add mouse leave to handle when mouse exits the canvas during drag
        container.addEventListener('mouseleave', this.onMouseUp, { passive: false });

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
    
    // Clear status message timeout
    if (this.statusMessageTimeout) {
      clearTimeout(this.statusMessageTimeout);
    }
    
    // Destroy the Phaser game instance
    this.gameEngineService.destroyGame();
  }

  // Game Action Methods

  /**
   * Check if any paint mode is currently active
   */
  private isPaintModeActive(): boolean {
    return this.selectedBoundary !== null && this.selectedBoundary.startsWith('paint:') && !this.selectedBoundary.includes('pan');
  }

  /**
   * Handle paint dragging operations
   */
  private handlePaintDrag(clientX: number, clientY: number): void {
    // Trigger paint operation at the current position
    if (typeof window !== 'undefined' && (window as any).handleGridClick) {
      // Convert screen coordinates to canvas-relative coordinates
      const gameContainer = this.gameContainer?.nativeElement;
      if (gameContainer) {
        const rect = gameContainer.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;
        
        // Call the Phaser paint handler
        (window as any).handleGridClick(canvasX, canvasY);
      }
    }
  }

  /**
   * Show a temporary status message
   */
  private showStatusMessage(message: string, duration: number = 3000): void {
    // Clear any existing timeout
    if (this.statusMessageTimeout) {
      clearTimeout(this.statusMessageTimeout);
    }
    
    // Set message and show it
    this.statusMessage = message;
    this.isStatusMessageVisible = true;
    this.cdRef.detectChanges();
    
    // Hide after duration
    this.statusMessageTimeout = setTimeout(() => {
      this.isStatusMessageVisible = false;
      this.cdRef.detectChanges();
    }, duration);
  }

  /**
   * Handle boundary selection from the UI
   */
  onBoundarySelected(boundaryId: string): void {
    // Show status message for mode changes
    if (boundaryId.startsWith('paint:')) {
      const mode = boundaryId.replace('paint:', '');
      switch (mode) {
        case 'municipality':
          this.selectedBoundary = boundaryId;
          this.showStatusMessage('Paint Mode: Municipality Brush activated');
          break;
        case 'area':
          this.selectedBoundary = boundaryId;
          this.showStatusMessage('Paint Mode: Area Brush activated');
          break;
        case 'unit':
          this.selectedBoundary = boundaryId;
          this.showStatusMessage('Paint Mode: Unit Brush activated');
          break;
        case 'school':
          this.selectedBoundary = boundaryId;
          this.showStatusMessage('Paint Mode: School Placer activated');
          break;
        case 'clear':
          this.selectedBoundary = boundaryId;
          this.showStatusMessage('Paint Mode: Eraser activated');
          break;
        case 'pan':
          this.selectedBoundary = null; // Clear paint mode to enable pan
          this.showStatusMessage('Pan Mode activated');
          console.log('Pan mode activated, selectedBoundary set to null');
          break;
        default:
          this.selectedBoundary = boundaryId;
          this.showStatusMessage('Paint Mode activated');
      }
    } else {
      this.selectedBoundary = boundaryId;
    }
    
    // Sync with Phaser scene
    if (typeof window !== 'undefined' && (window as any).setSelectedBoundary) {
      (window as any).setSelectedBoundary(this.selectedBoundary);
    }
    
    // Update visual feedback for the new mode immediately and after a slight delay
    this.updatePaintModeVisuals();
    setTimeout(() => {
      this.updatePaintModeVisuals();
    }, 10);
  }

  /**
   * Update visual feedback for paint vs pan mode
   */
  private updatePaintModeVisuals(): void {
    const gameContainer = this.gameContainer?.nativeElement;
    if (gameContainer) {
      const isPaintActive = this.isPaintModeActive();
      console.log('updatePaintModeVisuals: isPaintActive =', isPaintActive, 'selectedBoundary =', this.selectedBoundary);
      
      if (isPaintActive) {
        gameContainer.classList.add('paint-mode-active');
        gameContainer.classList.remove('pan-mode-active');
        console.log('Added paint-mode-active class, removed pan-mode-active');
      } else {
        gameContainer.classList.remove('paint-mode-active');
        gameContainer.classList.add('pan-mode-active');
        console.log('Removed paint-mode-active class, added pan-mode-active');
      }
      
      // Force a style recalculation to ensure cursor change is applied immediately
      gameContainer.offsetHeight;
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
