
import { Component, ElementRef, OnInit, OnDestroy, ViewChild, Inject, PLATFORM_ID, NgZone, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { BoundarySelectorComponent } from './ui/boundary-selector.component';
import { GameEngineService, GameConfig } from './services/game-engine.service';
import { GameStateService } from './services/game-state.service';
import { RenderingService } from './services/rendering.service';
import { MainSceneFactory } from './scenes/main-scene';
import { GameEventService } from './services/game-event.service';
import { EducationHierarchyService } from './services/education-hierarchy.service';
import { GAME_CONSTANTS } from './constants/game-constants';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, BoundarySelectorComponent],
  template: `
    <div class="control-bar">
      <app-boundary-selector (boundarySelected)="onBoundarySelected($event)"></app-boundary-selector>
      <button class="main-btn" (click)="zoomOut()" aria-label="Zoom Out">-</button>
      <button class="main-btn" (click)="zoomIn()" aria-label="Zoom In">+</button>
      <button class="main-btn" (click)="onCleanSlate()">Clean Slate</button>
    </div>

    <!-- School Info Modal -->
    <div class="school-info-modal" [class.modal-hidden]="!selectedSchool">
      <h3>{{ selectedSchool?.name || 'No School' }}</h3>
      <p>Students: {{ selectedSchool?.currentStudents || 0 }} / {{ selectedSchool?.capacity || 0 }}</p>
      <button (click)="addStudent()" [disabled]="!selectedSchool">Add Student</button>
      <button (click)="removeStudent()" [disabled]="!selectedSchool || selectedSchool.currentStudents === 0">Remove Student</button>
      <button (click)="removeSchool()" [disabled]="!selectedSchool">Remove School</button>
      <button (click)="closeSchoolInfo()">Close</button>
    </div>

    <div id="gameContainer" #gameContainer></div>
  `,
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  selectedSchool: any = null;
  selectedSchoolPos: { x: number, y: number } | null = null;
  private schoolClickedSubscription?: Subscription;
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
      } catch (error) {
        // (Error logging removed)
      }
    }
  }



  ngOnDestroy() {
    // Unsubscribe from school click events to prevent memory leaks and duplicate subscriptions
    if (this.schoolClickedSubscription) {
      this.schoolClickedSubscription.unsubscribe();
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
    // Optionally reset hierarchy as well if needed
  }
}
