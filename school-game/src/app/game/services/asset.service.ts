/**
 * @fileoverview Asset service for managing game assets.
 * 
 * This service handles the placement, removal, and validation of assets
 * like roads, trees, and other decorative elements on the game map.
 * 
 * @author SchoolCity Development Team
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import {
  Asset,
  AssetCategory,
  AssetDefinition,
  RoadType,
  TreeType,
  RoadAsset,
  TreeAsset
} from '../models/asset.models';

/**
 * Service for managing all game assets
 */
@Injectable({
  providedIn: 'root'
})
export class AssetService {
  /** Map of assets by grid position (key: "x,y") */
  private assets: Map<string, Asset> = new Map();
  
  /** Counter for generating unique asset IDs */
  private assetIdCounter: number = 1;

  constructor() {}

  /**
   * Get all available asset definitions organized by category
   */
  getAssetDefinitions(): Map<AssetCategory, AssetDefinition[]> {
    const definitions = new Map<AssetCategory, AssetDefinition[]>();

    // Road definitions
    definitions.set(AssetCategory.ROADS, [
      {
        type: RoadType.STRAIGHT_HORIZONTAL,
        category: AssetCategory.ROADS,
        name: 'Horizontal Road',
        color: 0x808080,
        icon: 'remove'
      },
      {
        type: RoadType.STRAIGHT_VERTICAL,
        category: AssetCategory.ROADS,
        name: 'Vertical Road',
        color: 0x808080,
        icon: 'drag_handle'
      },
      {
        type: RoadType.CORNER_NE,
        category: AssetCategory.ROADS,
        name: 'Corner NE',
        color: 0x808080,
        icon: 'turn_sharp_right'
      },
      {
        type: RoadType.CORNER_NW,
        category: AssetCategory.ROADS,
        name: 'Corner NW',
        color: 0x808080,
        icon: 'turn_sharp_left'
      },
      {
        type: RoadType.CORNER_SE,
        category: AssetCategory.ROADS,
        name: 'Corner SE',
        color: 0x808080,
        icon: 'south_east'
      },
      {
        type: RoadType.CORNER_SW,
        category: AssetCategory.ROADS,
        name: 'Corner SW',
        color: 0x808080,
        icon: 'south_west'
      },
      {
        type: RoadType.T_JUNCTION_N,
        category: AssetCategory.ROADS,
        name: 'T-Junction North',
        color: 0x808080,
        icon: 'call_split'
      },
      {
        type: RoadType.T_JUNCTION_E,
        category: AssetCategory.ROADS,
        name: 'T-Junction East',
        color: 0x808080,
        icon: 'call_split'
      },
      {
        type: RoadType.T_JUNCTION_S,
        category: AssetCategory.ROADS,
        name: 'T-Junction South',
        color: 0x808080,
        icon: 'call_split'
      },
      {
        type: RoadType.T_JUNCTION_W,
        category: AssetCategory.ROADS,
        name: 'T-Junction West',
        color: 0x808080,
        icon: 'call_split'
      },
      {
        type: RoadType.CROSS,
        category: AssetCategory.ROADS,
        name: 'Crossroads',
        color: 0x808080,
        icon: 'add'
      }
    ]);

    // Tree definitions
    definitions.set(AssetCategory.TREES, [
      {
        type: TreeType.OAK,
        category: AssetCategory.TREES,
        name: 'Oak Tree',
        color: 0x228B22,
        icon: 'park'
      },
      {
        type: TreeType.PINE,
        category: AssetCategory.TREES,
        name: 'Pine Tree',
        color: 0x006400,
        icon: 'forest'
      },
      {
        type: TreeType.PALM,
        category: AssetCategory.TREES,
        name: 'Palm Tree',
        color: 0x32CD32,
        icon: 'spa'
      },
      {
        type: TreeType.MAPLE,
        category: AssetCategory.TREES,
        name: 'Maple Tree',
        color: 0xFF6347,
        icon: 'nature'
      },
      {
        type: TreeType.WILLOW,
        category: AssetCategory.TREES,
        name: 'Willow Tree',
        color: 0x90EE90,
        icon: 'eco'
      }
    ]);

    return definitions;
  }

  /**
   * Get asset definition by type
   */
  getAssetDefinition(type: string): AssetDefinition | undefined {
    const definitions = this.getAssetDefinitions();
    for (const [category, assetList] of definitions) {
      const found = assetList.find(def => def.type === type);
      if (found) return found;
    }
    return undefined;
  }

  /**
   * Place an asset at the specified grid position
   * @returns The placed asset, or null if placement failed
   */
  placeAsset(x: number, y: number, type: string, category: AssetCategory): Asset | null {
    const key = this.getPositionKey(x, y);
    
    // Check if position is already occupied
    if (this.assets.has(key)) {
      console.log(`Cannot place asset at (${x}, ${y}) - position already occupied`);
      return null;
    }

    const definition = this.getAssetDefinition(type);
    if (!definition) {
      console.error(`Asset definition not found for type: ${type}`);
      return null;
    }

    // Create the asset based on category
    let asset: Asset;
    
    if (category === AssetCategory.ROADS) {
      asset = {
        id: `asset-${this.assetIdCounter++}`,
        category: AssetCategory.ROADS,
        type: type as RoadType,
        x,
        y,
        name: definition.name,
        color: definition.color
      } as RoadAsset;
    } else if (category === AssetCategory.TREES) {
      asset = {
        id: `asset-${this.assetIdCounter++}`,
        category: AssetCategory.TREES,
        type: type as TreeType,
        x,
        y,
        name: definition.name,
        color: definition.color
      } as TreeAsset;
    } else {
      asset = {
        id: `asset-${this.assetIdCounter++}`,
        category,
        type,
        x,
        y,
        name: definition.name,
        color: definition.color
      };
    }

    this.assets.set(key, asset);
    console.log(`✅ Placed ${asset.name} at (${x}, ${y})`);
    return asset;
  }

  /**
   * Remove an asset at the specified grid position
   * @returns true if an asset was removed, false otherwise
   */
  removeAsset(x: number, y: number): boolean {
    const key = this.getPositionKey(x, y);
    const removed = this.assets.delete(key);
    if (removed) {
      console.log(`✅ Removed asset at (${x}, ${y})`);
    }
    return removed;
  }

  /**
   * Get asset at the specified grid position
   */
  getAssetAt(x: number, y: number): Asset | undefined {
    const key = this.getPositionKey(x, y);
    return this.assets.get(key);
  }

  /**
   * Check if a position has an asset
   */
  hasAssetAt(x: number, y: number): boolean {
    const key = this.getPositionKey(x, y);
    return this.assets.has(key);
  }

  /**
   * Get all assets
   */
  getAllAssets(): Asset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Clear all assets
   */
  clearAllAssets(): void {
    this.assets.clear();
    this.assetIdCounter = 1;
    console.log('✅ Cleared all assets');
  }

  /**
   * Get assets by category
   */
  getAssetsByCategory(category: AssetCategory): Asset[] {
    return this.getAllAssets().filter(asset => asset.category === category);
  }

  /**
   * Export assets data for saving
   */
  exportData(): any {
    const assetsArray = Array.from(this.assets.values());
    return {
      assets: assetsArray,
      assetIdCounter: this.assetIdCounter
    };
  }

  /**
   * Import assets data from saved state
   */
  importData(data: any): void {
    this.assets.clear();
    
    if (data && data.assets) {
      for (const asset of data.assets) {
        const key = this.getPositionKey(asset.x, asset.y);
        this.assets.set(key, asset);
      }
      
      if (data.assetIdCounter !== undefined) {
        this.assetIdCounter = data.assetIdCounter;
      }
      
      console.log(`✅ Imported ${data.assets.length} assets`);
    }
  }

  /**
   * Generate a position key for the asset map
   */
  private getPositionKey(x: number, y: number): string {
    return `${x},${y}`;
  }
}
