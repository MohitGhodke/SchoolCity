/**
 * Color Hierarchy Demo
 * This file demonstrates how the color hierarchy system works in the SchoolCity game.
 * 
 * The system ensures that each municipality has its own distinct base color,
 * and all areas and units within that municipality use shades of the same color.
 */

import { MunicipalityManagerService } from './municipality-manager.service';
import { ThemeService } from './theme.service';

export class ColorHierarchyDemo {
  
  /**
   * Demonstrates the color hierarchy with examples
   */
  static demonstrateColorHierarchy(): void {
    console.log('=== SchoolCity Color Hierarchy System ===\n');
    
    // Example municipality base colors (from ThemeService)
    const municipalityColors = [
      { name: 'Mint Green', hex: 0x6ee7b7 },
      { name: 'Sky Blue', hex: 0x7dd3fc },
      { name: 'Warm Yellow', hex: 0xfbbf24 },
      { name: 'Pink', hex: 0xf472b6 },
      { name: 'Purple', hex: 0xa78bfa }
    ];
    
    municipalityColors.forEach((baseColor, index) => {
      console.log(`Municipality ${index + 1}: ${baseColor.name} (#${baseColor.hex.toString(16).padStart(6, '0')})`);
      
      // Show area colors (lighter shades)
      const areaShades = this.generateAreaShades(baseColor.hex, 3);
      areaShades.forEach((shade, areaIndex) => {
        console.log(`  └─ Area ${areaIndex + 1}: ${shade.description} (#${shade.hex.toString(16).padStart(6, '0')})`);
        
        // Show unit colors (darker shades)
        const unitShades = this.generateUnitShades(baseColor.hex, 2);
        unitShades.forEach((unitShade, unitIndex) => {
          console.log(`      └─ Unit ${unitIndex + 1}: ${unitShade.description} (#${unitShade.hex.toString(16).padStart(6, '0')})`);
        });
      });
      console.log('');
    });
    
    console.log('Key Benefits:');
    console.log('✅ Each municipality has a unique base color');
    console.log('✅ Areas use lighter shades of their municipality color');
    console.log('✅ Units use darker shades of their municipality color');
    console.log('✅ Visual hierarchy is maintained throughout the system');
    console.log('✅ Colors remain consistent and related within each municipality');
  }
  
  /**
   * Generate area shades (lighter than base)
   */
  private static generateAreaShades(baseColor: number, count: number): Array<{hex: number, description: string}> {
    const shades = [];
    for (let i = 0; i < count; i++) {
      const factor = 1.2 + (i * 0.15); // Progressive lightening
      const shade = this.generateShade(baseColor, factor);
      shades.push({
        hex: shade,
        description: `Light shade ${i + 1}`
      });
    }
    return shades;
  }
  
  /**
   * Generate unit shades (darker than base)
   */
  private static generateUnitShades(baseColor: number, count: number): Array<{hex: number, description: string}> {
    const shades = [];
    for (let i = 0; i < count; i++) {
      const factor = 0.8 - (i * 0.1); // Progressive darkening
      const shade = this.generateShade(baseColor, factor);
      shades.push({
        hex: shade,
        description: `Dark shade ${i + 1}`
      });
    }
    return shades;
  }
  
  /**
   * Generate a shade of a color (same logic as in MunicipalityManagerService)
   */
  private static generateShade(colorNumber: number, factor: number): number {
    // Convert hex number to RGB
    const r = (colorNumber >> 16) & 255;
    const g = (colorNumber >> 8) & 255;
    const b = colorNumber & 255;

    let newR, newG, newB;

    if (factor > 1) {
      // Lighter shade: blend with white
      const lightenFactor = (factor - 1);
      newR = Math.round(r + (255 - r) * lightenFactor);
      newG = Math.round(g + (255 - g) * lightenFactor);
      newB = Math.round(b + (255 - b) * lightenFactor);
    } else {
      // Darker shade: multiply by factor
      newR = Math.round(r * factor);
      newG = Math.round(g * factor);
      newB = Math.round(b * factor);
    }

    // Ensure values are within valid range
    newR = Math.max(0, Math.min(255, newR));
    newG = Math.max(0, Math.min(255, newG));
    newB = Math.max(0, Math.min(255, newB));

    // Convert back to hex number
    return (newR << 16) | (newG << 8) | newB;
  }
}

// Run the demo if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - can be called from console
  (window as any).ColorHierarchyDemo = ColorHierarchyDemo;
  console.log('Color hierarchy demo available. Run ColorHierarchyDemo.demonstrateColorHierarchy() in console to see examples.');
}
