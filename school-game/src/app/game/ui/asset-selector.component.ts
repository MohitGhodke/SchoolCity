/**
 * @fileoverview Asset selector UI component for the SchoolCity game.
 * 
 * This component provides the user interface for selecting and placing
 * different types of assets (roads, trees, etc.) on the game map.
 * 
 * @author SchoolCity Development Team
 * @version 1.0.0
 */

import { Component, EventEmitter, Output, ChangeDetectorRef, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AssetService } from '../services/asset.service';
import { AssetCategory, AssetDefinition } from '../models/asset.models';

/**
 * Event emitted when an asset is selected for placement
 */
export interface AssetSelectedEvent {
  category: AssetCategory | null;
  type: string | null;
  isEraseMode: boolean;
}

@Component({
  selector: 'app-asset-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="asset-toolbar" [class.expanded]="isExpanded">
      <!-- Toggle button -->
      <button class="asset-toggle-btn" (click)="toggleExpanded()" title="Toggle Asset Menu">
        <span class="material-icons-outlined">{{ isExpanded ? 'close' : 'category' }}</span>
        <span class="btn-label">{{ isExpanded ? 'Close' : 'Assets' }}</span>
      </button>

      <!-- Expanded asset menu -->
      <div class="asset-menu" *ngIf="isExpanded">
        <!-- Asset categories tabs -->
        <div class="asset-categories">
          <button 
            *ngFor="let category of categories"
            class="category-tab"
            [class.active]="selectedCategory === category"
            (click)="selectCategory(category)"
            [title]="getCategoryLabel(category)">
            <span class="material-icons-outlined">{{ getCategoryIcon(category) }}</span>
            <span>{{ getCategoryLabel(category) }}</span>
          </button>
        </div>

        <!-- Asset palette for selected category -->
        <div class="asset-palette" *ngIf="selectedCategory">
          <div class="palette-header">
            <h4>{{ getCategoryLabel(selectedCategory) }}</h4>
          </div>
          <div class="asset-grid">
            <button
              *ngFor="let asset of getAssetsForCategory(selectedCategory)"
              class="asset-item"
              [class.active]="selectedAssetType === asset.type"
              (click)="selectAsset(asset)"
              [title]="asset.name">
              <span class="material-icons-outlined" *ngIf="asset.icon">{{ asset.icon }}</span>
              <span class="asset-preview" 
                    *ngIf="!asset.icon"
                    [style.background-color]="getColorHex(asset.color)"></span>
              <span class="asset-name">{{ asset.name }}</span>
            </button>
          </div>
        </div>

        <!-- Asset mode controls -->
        <div class="asset-controls">
          <button 
            class="control-btn erase-btn"
            [class.active]="isEraseMode"
            (click)="toggleEraseMode()"
            title="Erase Asset Mode">
            <span class="material-icons-outlined">delete</span>
            <span>Erase Asset</span>
          </button>
          <button 
            class="control-btn clear-btn"
            (click)="clearSelection()"
            title="Clear Selection">
            <span class="material-icons-outlined">clear</span>
            <span>Clear Selection</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./asset-selector.component.css']
})
export class AssetSelectorComponent {
  @Output() assetSelected = new EventEmitter<AssetSelectedEvent>();

  /** Whether the asset menu is expanded */
  isExpanded: boolean = false;

  /** Available asset categories */
  categories: AssetCategory[] = [AssetCategory.ROADS, AssetCategory.TREES];

  /** Currently selected category */
  selectedCategory: AssetCategory | null = null;

  /** Currently selected asset type */
  selectedAssetType: string | null = null;

  /** Whether in erase mode */
  isEraseMode: boolean = false;

  constructor(
    private assetService: AssetService,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Set up window callbacks for external updates
    if (isPlatformBrowser(this.platformId)) {
      (window as any).refreshAssetSelector = () => {
        this.ngZone.run(() => {
          this.cdRef.markForCheck();
          this.cdRef.detectChanges();
        });
      };
    }
  }

  /**
   * Toggle the expanded state of the asset menu
   */
  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    
    // If closing, clear selection
    if (!this.isExpanded) {
      this.clearSelection();
    } else if (!this.selectedCategory && this.categories.length > 0) {
      // Auto-select first category when opening
      this.selectedCategory = this.categories[0];
    }
  }

  /**
   * Select an asset category
   */
  selectCategory(category: AssetCategory): void {
    this.selectedCategory = category;
    this.selectedAssetType = null;
    this.isEraseMode = false;
    this.emitSelection();
  }

  /**
   * Select a specific asset for placement
   */
  selectAsset(asset: AssetDefinition): void {
    this.selectedAssetType = asset.type;
    this.isEraseMode = false;
    this.emitSelection();
  }

  /**
   * Toggle erase mode for removing assets
   */
  toggleEraseMode(): void {
    this.isEraseMode = !this.isEraseMode;
    if (this.isEraseMode) {
      this.selectedAssetType = null;
    }
    this.emitSelection();
  }

  /**
   * Clear current selection
   */
  clearSelection(): void {
    this.selectedCategory = null;
    this.selectedAssetType = null;
    this.isEraseMode = false;
    this.emitSelection();
  }

  /**
   * Get assets for a specific category
   */
  getAssetsForCategory(category: AssetCategory): AssetDefinition[] {
    const definitions = this.assetService.getAssetDefinitions();
    return definitions.get(category) || [];
  }

  /**
   * Get label for a category
   */
  getCategoryLabel(category: AssetCategory): string {
    switch (category) {
      case AssetCategory.ROADS:
        return 'Roads';
      case AssetCategory.TREES:
        return 'Trees';
      case AssetCategory.DECORATIONS:
        return 'Decorations';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get icon for a category
   */
  getCategoryIcon(category: AssetCategory): string {
    switch (category) {
      case AssetCategory.ROADS:
        return 'route';
      case AssetCategory.TREES:
        return 'park';
      case AssetCategory.DECORATIONS:
        return 'stars';
      default:
        return 'category';
    }
  }

  /**
   * Convert color number to hex string
   */
  getColorHex(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }

  /**
   * Emit the current selection to parent component
   */
  private emitSelection(): void {
    this.assetSelected.emit({
      category: this.isEraseMode ? null : this.selectedCategory,
      type: this.selectedAssetType,
      isEraseMode: this.isEraseMode
    });
  }
}
