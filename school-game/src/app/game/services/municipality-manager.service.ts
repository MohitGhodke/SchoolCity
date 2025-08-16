import { Injectable } from '@angular/core';
import { ThemeService } from './theme.service';

export interface MunicipalityDefinition {
  id: string;
  name: string;
  baseColor: number; // Hex number for Phaser
  baseColorString: string; // Hex string for CSS
  areas: AreaDefinition[];
}

export interface AreaDefinition {
  id: string;
  name: string;
  municipalityId: string;
  color: number; // Hex number for Phaser
  colorString: string; // Hex string for CSS
  units: UnitDefinition[];
}

export interface UnitDefinition {
  id: string;
  name: string;
  areaId: string;
  municipalityId: string;
  color: number; // Hex number for Phaser
  colorString: string; // Hex string for CSS
}

@Injectable({
  providedIn: 'root'
})
export class MunicipalityManagerService {
  private municipalities: MunicipalityDefinition[] = [];
  private counter = 1;

  constructor(private themeService: ThemeService) {
    // Start with empty municipalities - let user create them via paint mode
  }

  getMunicipalities(): MunicipalityDefinition[] {
    return this.municipalities;
  }

  /**
   * Load municipalities from saved data
   */
  loadMunicipalities(savedMunicipalities: MunicipalityDefinition[], savedCounter: number): void {
    this.municipalities = savedMunicipalities.map(m => ({ ...m })); // Deep copy
    this.counter = savedCounter;
  }

  addMunicipality(): MunicipalityDefinition {
    const baseColors = this.themeService.getMunicipalityColors();
    const baseColor = baseColors[(this.municipalities.length) % baseColors.length];
    const municipality: MunicipalityDefinition = {
      id: `municipality-${this.counter}`,
      name: `Municipality ${this.counter}`,
      baseColor: baseColor,
      baseColorString: this.hexNumberToString(baseColor),
      areas: []
    };
    
    this.municipalities.push(municipality);
    this.counter++;
    return municipality;
  }

  addArea(municipalityId: string): AreaDefinition | null {
    const municipality = this.municipalities.find(m => m.id === municipalityId);
    if (!municipality) return null;

    const areaIndex = municipality.areas.length + 1;
    
    // Generate area color as a shade of the municipality's base color
    // Use different lightness factors for different areas within the same municipality
    const shadeFactor = 1.2 + (municipality.areas.length * 0.15); // Makes areas progressively lighter
    const areaColorData = this.generateShadeFromNumber(municipality.baseColor, shadeFactor);
    
    const area: AreaDefinition = {
      id: `${municipalityId}-area-${areaIndex}`,
      name: `Area ${areaIndex}`,
      municipalityId: municipalityId,
      color: areaColorData.color,
      colorString: areaColorData.colorString,
      units: []
    };

    municipality.areas.push(area);
    return area;
  }

  addUnit(municipalityId: string, areaId: string): UnitDefinition | null {
    const municipality = this.municipalities.find(m => m.id === municipalityId);
    const area = municipality?.areas.find(a => a.id === areaId);
    if (!municipality || !area) return null;

    const unitIndex = area.units.length + 1;
    
    // Generate unit color as a different shade of the municipality's base color
    // Use a different shading approach for units - make them darker than the municipality
    const shadeFactor = 0.8 - (area.units.length * 0.1); // Makes units progressively darker
    const unitColorData = this.generateShadeFromNumber(municipality.baseColor, shadeFactor);
    
    const unit: UnitDefinition = {
      id: `${areaId}-unit-${unitIndex}`,
      name: `Unit ${unitIndex}`,
      areaId: areaId,
      municipalityId: municipalityId,
      color: unitColorData.color,
      colorString: unitColorData.colorString
    };

    area.units.push(unit);
    return unit;
  }

  // Helper functions to convert between hex formats
  private hexNumberToString(hexNumber: number): string {
    return `#${hexNumber.toString(16).padStart(6, '0')}`;
  }

  private hexStringToNumber(hexString: string): number {
    return parseInt(hexString.replace('#', ''), 16);
  }

  // Generate a lighter or darker shade of a color (works with hex numbers)
  private generateShadeFromNumber(colorNumber: number, factor: number): { color: number, colorString: string } {
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

    // Convert back to hex number and string
    const newColorNumber = (newR << 16) | (newG << 8) | newB;
    const newColorString = `#${newColorNumber.toString(16).padStart(6, '0')}`;
    
    return { color: newColorNumber, colorString: newColorString };
  }

  // Get all boundary options for UI
  getAllBoundaryOptions(): Array<{id: string, label: string, color: string, type: 'municipality' | 'area' | 'unit'}> {
    const options: Array<{id: string, label: string, color: string, type: 'municipality' | 'area' | 'unit'}> = [];

    this.municipalities.forEach(municipality => {
      // Add municipality
      options.push({
        id: municipality.id,
        label: municipality.name,
        color: municipality.baseColorString,
        type: 'municipality'
      });

      // Add areas
      municipality.areas.forEach(area => {
        options.push({
          id: area.id,
          label: `${area.name} (${municipality.name})`,
          color: area.colorString,
          type: 'area'
        });

        // Add units
        area.units.forEach(unit => {
          options.push({
            id: unit.id,
            label: `${unit.name} (${area.name})`,
            color: unit.colorString,
            type: 'unit'
          });
        });
      });
    });

    return options;
  }

  getMunicipalityById(id: string): MunicipalityDefinition | undefined {
    return this.municipalities.find(m => m.id === id);
  }

  getAreaById(areaId: string): AreaDefinition | undefined {
    for (const municipality of this.municipalities) {
      const area = municipality.areas.find(a => a.id === areaId);
      if (area) return area;
    }
    return undefined;
  }

  getUnitById(unitId: string): UnitDefinition | undefined {
    for (const municipality of this.municipalities) {
      for (const area of municipality.areas) {
        const unit = area.units.find(u => u.id === unitId);
        if (unit) return unit;
      }
    }
    return undefined;
  }

  // Get color for rendering (returns hex number for Phaser)
  getColorForBoundary(boundaryId: string): number {
    // Return default color for empty/null boundary IDs
    if (!boundaryId || boundaryId.trim() === '') {
      return this.themeService.getTileColors().default;
    }
    
    const municipality = this.getMunicipalityById(boundaryId);
    if (municipality) return municipality.baseColor;

    const area = this.getAreaById(boundaryId);
    if (area) return area.color;

    const unit = this.getUnitById(boundaryId);
    if (unit) return unit.color;

    return this.themeService.getTileColors().default; // Default color from theme
  }

  // Remove methods for cleanup
  removeMunicipality(municipalityId: string): boolean {
    const index = this.municipalities.findIndex(m => m.id === municipalityId);
    if (index !== -1) {
      this.municipalities.splice(index, 1);
      return true;
    }
    return false;
  }

  removeArea(areaId: string): boolean {
    for (const municipality of this.municipalities) {
      const areaIndex = municipality.areas.findIndex(a => a.id === areaId);
      if (areaIndex !== -1) {
        municipality.areas.splice(areaIndex, 1);
        return true;
      }
    }
    return false;
  }

  removeUnit(unitId: string): boolean {
    for (const municipality of this.municipalities) {
      for (const area of municipality.areas) {
        const unitIndex = area.units.findIndex(u => u.id === unitId);
        if (unitIndex !== -1) {
          area.units.splice(unitIndex, 1);
          return true;
        }
      }
    }
    return false;
  }

  // Clear all data (for clean slate)
  clearAll(): void {
    this.municipalities = [];
    this.counter = 1;
    // Don't auto-add municipality - let user create via paint mode
  }
}
