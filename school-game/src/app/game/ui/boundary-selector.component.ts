import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MunicipalityManagerService } from '../services/municipality-manager.service';

@Component({
  selector: 'app-boundary-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolbar-container">
      <!-- Current Mode Indicator -->
      <div class="mode-indicator">
        <span class="mode-label">{{ getModeLabel() }}</span>
        <button class="clear-btn" (click)="clearSelection()" *ngIf="selected">Clear</button>
      </div>

      <!-- Quick Actions Bar -->
      <div class="quick-actions">
        <!-- Municipality Tools -->
        <div class="tool-group">
          <label>Municipality:</label>
          <button 
            *ngFor="let municipality of municipalityManager.getMunicipalities()" 
            class="tool-btn municipality-btn"
            [class.active]="selected === municipality.id"
            [style.background-color]="municipality.baseColorString"
            (click)="selectAndAutoCreate('municipality', municipality.id)">
            {{ municipality.name }}
          </button>
          <button class="tool-btn add-btn" (click)="quickAdd('municipality')">+ New</button>
        </div>

        <!-- Area Tools -->
        <div class="tool-group">
          <label>Area:</label>
          <button 
            *ngFor="let area of getAvailableAreas()" 
            class="tool-btn area-btn"
            [class.active]="selected === area.id"
            [style.background-color]="area.colorString"
            (click)="selectAndAutoCreate('area', area.id)">
            {{ area.name }}
          </button>
          <button class="tool-btn add-btn" (click)="quickAdd('area')" [disabled]="!canAddArea()">
            + New Area
          </button>
        </div>

        <!-- Unit Tools -->
        <div class="tool-group">
          <label>Unit:</label>
          <button 
            *ngFor="let unit of getAvailableUnits()" 
            class="tool-btn unit-btn"
            [class.active]="selected === unit.id"
            [style.background-color]="unit.colorString"
            (click)="selectAndAutoCreate('unit', unit.id)">
            {{ unit.name }}
          </button>
          <button class="tool-btn add-btn" (click)="quickAdd('unit')" [disabled]="!canAddUnit()">
            + New Unit
          </button>
        </div>

        <!-- School Tool -->
        <div class="tool-group">
          <label>School:</label>
          <button 
            class="tool-btn school-btn"
            [class.active]="isSchoolMode"
            [disabled]="!canPlaceSchool()"
            (click)="enterSchoolMode()">
            🏫 {{ isSchoolMode ? 'Placing...' : 'Place School' }}
          </button>
        </div>
      </div>

      <!-- Instructions -->
      <div class="instructions">
        {{ getInstructions() }}
      </div>
    </div>
  `,
  styleUrls: ['./boundary-selector.component.css']
})
export class BoundarySelectorComponent {
  @Output() boundarySelected = new EventEmitter<string>();
  selected: string | null = null;
  selectedUnitForSchool: string | null = null; // Track which unit is selected for school placement
  isSchoolMode: boolean = false; // Track if we're in school placement mode

  constructor(public municipalityManager: MunicipalityManagerService) {}

  // New methods for improved UX
  getModeLabel(): string {
    if (this.isSchoolMode && this.selectedUnitForSchool) {
      const unit = this.municipalityManager.getUnitById(this.selectedUnitForSchool);
      return `🏫 Placing Schools in ${unit?.name || 'Unit'}`;
    }
    
    if (this.selected) {
      const municipality = this.municipalityManager.getMunicipalityById(this.selected);
      if (municipality) return `🏛️ Paint ${municipality.name}`;
      
      const area = this.municipalityManager.getAreaById(this.selected);
      if (area) return `📍 Paint ${area.name}`;
      
      const unit = this.municipalityManager.getUnitById(this.selected);
      if (unit) return `🔲 Paint ${unit.name}`;
    }
    
    return '🎨 Select a tool to paint tiles';
  }

  getInstructions(): string {
    if (this.isSchoolMode) {
      return 'Click on dark green unit tiles to place schools';
    }
    
    if (this.selected) {
      const type = this.getSelectedType();
      return `Drag on tiles to paint them as ${type}. Click a different tool or "Clear" to switch.`;
    }
    
    const municipalities = this.municipalityManager.getMunicipalities();
    const areas = this.getAvailableAreas();
    const units = this.getAvailableUnits();
    
    if (municipalities.length === 0) {
      return 'Start by creating a Municipality, then paint some tiles with it.';
    } else if (areas.length === 0) {
      return 'Create an Area, then paint some tiles within your municipality.';
    } else if (units.length === 0) {
      return 'Create a Unit, then paint some tiles within your area.';
    } else {
      return 'Create boundaries step by step: Municipality → Area → Unit → School';
    }
  }

  getSelectedType(): string {
    if (this.municipalityManager.getMunicipalityById(this.selected || '')) return 'Municipality';
    if (this.municipalityManager.getAreaById(this.selected || '')) return 'Area';
    if (this.municipalityManager.getUnitById(this.selected || '')) return 'Unit';
    return '';
  }

  selectAndAutoCreate(type: string, id: string) {
    this.isSchoolMode = false;
    this.selectedUnitForSchool = null;
    this.selected = id;
    this.boundarySelected.emit(id);
  }

  quickAdd(type: string) {
    if (type === 'municipality') {
      const newMunicipality = this.municipalityManager.addMunicipality();
      this.selectAndAutoCreate('municipality', newMunicipality.id);
    } else if (type === 'area') {
      const municipalityId = this.getSelectedOrFirstMunicipalityId();
      if (municipalityId) {
        const newArea = this.municipalityManager.addArea(municipalityId);
        if (newArea) {
          this.selectAndAutoCreate('area', newArea.id);
        }
      }
    } else if (type === 'unit') {
      const areaId = this.getSelectedOrFirstAreaId();
      const municipalityId = this.getSelectedOrFirstMunicipalityId();
      if (areaId && municipalityId) {
        const newUnit = this.municipalityManager.addUnit(municipalityId, areaId);
        if (newUnit) {
          this.selectAndAutoCreate('unit', newUnit.id);
        }
      }
    }
  }

  getAvailableAreas() {
    return this.municipalityManager.getMunicipalities()
      .flatMap(m => m.areas);
  }

  getAvailableUnits() {
    return this.municipalityManager.getMunicipalities()
      .flatMap(m => m.areas)
      .flatMap(a => a.units);
  }

  canAddArea(): boolean {
    // Can add area if there's at least one municipality
    return this.municipalityManager.getMunicipalities().length > 0;
  }

  canAddUnit(): boolean {
    // Can add unit if there's at least one area  
    return this.getAvailableAreas().length > 0;
  }

  canPlaceSchool(): boolean {
    // Can place schools if there are units available
    return this.getAvailableUnits().length > 0;
  }

  getSelectedOrFirstMunicipalityId(): string | null {
    // Try to get municipality from current selection
    const municipality = this.municipalityManager.getMunicipalityById(this.selected || '');
    if (municipality) return municipality.id;
    
    const area = this.municipalityManager.getAreaById(this.selected || '');
    if (area) return area.municipalityId;
    
    const unit = this.municipalityManager.getUnitById(this.selected || '');
    if (unit) return unit.municipalityId;
    
    // Default to first municipality
    const municipalities = this.municipalityManager.getMunicipalities();
    return municipalities.length > 0 ? municipalities[0].id : null;
  }

  getSelectedOrFirstAreaId(): string | null {
    // Try to get area from current selection
    const area = this.municipalityManager.getAreaById(this.selected || '');
    if (area) return area.id;
    
    const unit = this.municipalityManager.getUnitById(this.selected || '');
    if (unit) return unit.areaId;
    
    // Default to first area
    const areas = this.getAvailableAreas();
    return areas.length > 0 ? areas[0].id : null;
  }

  enterSchoolMode() {
    const unitId = this.getSelectedOrFirstUnitId();
    console.log('🏫 Entering school mode:', {
      selectedUnitId: unitId,
      allUnits: this.getAvailableUnits().map(u => ({ id: u.id, name: u.name }))
    });
    if (unitId) {
      this.selectedUnitForSchool = unitId;
      this.isSchoolMode = true;
      this.boundarySelected.emit(`school:${unitId}`);
    }
  }

  getSelectedOrFirstUnitId(): string | null {
    const unit = this.municipalityManager.getUnitById(this.selected || '');
    if (unit) return unit.id;
    
    const units = this.getAvailableUnits();
    return units.length > 0 ? units[0].id : null;
  }

  // Keep existing methods for compatibility
  select(id: string) {
    // If trying to select 'school' mode, only allow if a unit is currently selected
    if (id === 'school') {
      const currentUnit = this.municipalityManager.getUnitById(this.selected || '');
      if (!currentUnit) {
        // Don't switch to school mode if no unit is selected
        return;
      }
      // Enter school placement mode but keep the unit selected
      this.selectedUnitForSchool = currentUnit.id;
      this.isSchoolMode = true;
      this.boundarySelected.emit(`school:${currentUnit.id}`);
      return;
    }
    
    // If selecting a different boundary, exit school mode
    this.isSchoolMode = false;
    this.selectedUnitForSchool = null;
    this.selected = id;
    this.boundarySelected.emit(id);
  }

  clearSelection() {
    this.selected = null;
    this.isSchoolMode = false;
    this.selectedUnitForSchool = null;
    this.boundarySelected.emit('');
  }

  addMunicipality() {
    this.municipalityManager.addMunicipality();
  }

  addArea(municipalityId: string) {
    this.municipalityManager.addArea(municipalityId);
  }

  addUnit(municipalityId: string, areaId: string) {
    this.municipalityManager.addUnit(municipalityId, areaId);
  }

  getSelectionLabel(): string {
    if (this.isSchoolMode && this.selectedUnitForSchool) {
      const unit = this.municipalityManager.getUnitById(this.selectedUnitForSchool);
      return `Place School Mode - Selected Unit: ${unit?.name || 'Unknown'}`;
    }
    
    const municipality = this.municipalityManager.getMunicipalityById(this.selected || '');
    if (municipality) return `${municipality.name} (Municipality)`;
    
    const area = this.municipalityManager.getAreaById(this.selected || '');
    if (area) return `${area.name} (Area)`;
    
    const unit = this.municipalityManager.getUnitById(this.selected || '');
    if (unit) return `${unit.name} (Unit - Ready for school placement)`;
    
    return 'Unknown';
  }
}
