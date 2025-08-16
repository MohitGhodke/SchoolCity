import { Component, EventEmitter, Output, ChangeDetectorRef, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MunicipalityManagerService } from '../services/municipality-manager.service';

@Component({
  selector: 'app-boundary-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="paint-toolbar">
      <div class="tool-set">
        <!-- Paint Tools -->
        <button class="paint-tool municipality-tool" 
                [class.active]="paintMode === 'municipality'"
                (click)="setPaintMode('municipality')"
                (dblclick)="startNewMunicipality()"
                title="Paint Municipality (Double-click to start new municipality)">
          <span class="material-icons-outlined">location_city</span>
          <span>Municipality</span>
        </button>
        
        <button class="paint-tool area-tool" 
                [class.active]="paintMode === 'area'"
                (click)="setPaintMode('area')"
                [disabled]="!hasAnyMunicipality()"
                title="Paint Area">
          <span class="material-icons-outlined">map</span>
          <span>Area</span>
        </button>
        
        <button class="paint-tool unit-tool" 
                [class.active]="paintMode === 'unit'"
                (click)="setPaintMode('unit')"
                [disabled]="!hasAnyArea()"
                title="Paint Unit">
          <span class="material-icons-outlined">domain</span>
          <span>Unit</span>
        </button>
        
        <button class="paint-tool school-tool" 
                [class.active]="paintMode === 'school'"
                (click)="setPaintMode('school')"
                [disabled]="!hasAnyUnit()"
                title="Place School">
          <span class="material-icons-outlined">school</span>
          <span>School</span>
        </button>
        
        <!-- Clear Tool -->
        <button class="paint-tool clear-tool" 
                [class.active]="paintMode === 'clear'"
                (click)="setPaintMode('clear')"
                title="Erase">
          <span class="material-icons-outlined">backspace</span>
          <span>Erase</span>
        </button>
        
        <!-- Pan Mode -->
        <button class="paint-tool pan-tool" 
                [class.active]="paintMode === null"
                (click)="setPanMode()"
                title="Pan Mode - Navigate around the grid">
          <span class="material-icons-outlined">pan_tool</span>
          <span>Pan</span>
        </button>
      </div>
      
      <!-- Status (desktop only) -->
      <div class="paint-status desktop-only">
        <span class="current-tool">{{ getPaintModeLabel() }}</span>
        <span class="instruction">{{ getPaintInstruction() }}</span>
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
  
  // Simple paint mode system
  paintMode: 'municipality' | 'area' | 'unit' | 'school' | 'clear' | null = null;

  constructor(
    public municipalityManager: MunicipalityManagerService,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only set up window callbacks in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Set up auto-refresh mechanism that can be called from outside Angular
      (window as any).refreshBoundarySelector = () => {
        this.ngZone.run(() => {
          this.cdRef.markForCheck();
          this.cdRef.detectChanges();
        });
      };
    }
  }

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

  getSelectedMunicipalityId(): string | null {
    // Only return if a municipality is actually selected (no fallback)
    const municipality = this.municipalityManager.getMunicipalityById(this.selected || '');
    if (municipality) return municipality.id;
    
    const area = this.municipalityManager.getAreaById(this.selected || '');
    if (area) return area.municipalityId;
    
    const unit = this.municipalityManager.getUnitById(this.selected || '');
    if (unit) return unit.municipalityId;
    
    return null; // No fallback for hierarchy filtering
  }

  getSelectedAreaId(): string | null {
    // Only return if an area is actually selected (no fallback)
    const area = this.municipalityManager.getAreaById(this.selected || '');
    if (area) return area.id;
    
    const unit = this.municipalityManager.getUnitById(this.selected || '');
    if (unit) return unit.areaId;
    
    return null; // No fallback for hierarchy filtering
  }

  getAvailableAreas() {
    // Only show areas from the currently selected municipality
    const selectedMunicipalityId = this.getSelectedMunicipalityId();
    if (!selectedMunicipalityId) return [];
    
    const municipality = this.municipalityManager.getMunicipalityById(selectedMunicipalityId);
    return municipality ? municipality.areas : [];
  }

  getAvailableUnits() {
    // Only show units from the currently selected area
    const selectedAreaId = this.getSelectedAreaId();
    if (!selectedAreaId) return [];
    
    const area = this.municipalityManager.getAreaById(selectedAreaId);
    return area ? area.units : [];
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

  // New methods for hierarchical UI
  getSelectedUnitId(): string | null {
    const unit = this.municipalityManager.getUnitById(this.selected || '');
    return unit ? unit.id : null;
  }

  getCurrentSelectionName(): string {
    const municipality = this.municipalityManager.getMunicipalityById(this.selected || '');
    if (municipality) return `${municipality.name} (Municipality)`;
    
    const area = this.municipalityManager.getAreaById(this.selected || '');
    if (area) return `${area.name} (Area)`;
    
    const unit = this.municipalityManager.getUnitById(this.selected || '');
    if (unit) return `${unit.name} (Unit)`;
    
    return 'Unknown';
  }

  onMunicipalityChange(event: any) {
    const municipalityId = event.target.value;
    if (municipalityId) {
      this.selectAndAutoCreate('municipality', municipalityId);
    } else {
      this.clearSelection();
    }
  }

  onAreaChange(event: any) {
    const areaId = event.target.value;
    if (areaId) {
      this.selectAndAutoCreate('area', areaId);
    } else {
      // Keep municipality selected but clear area
      const municipalityId = this.getSelectedMunicipalityId();
      if (municipalityId) {
        this.selectAndAutoCreate('municipality', municipalityId);
      }
    }
  }

  onUnitChange(event: any) {
    const unitId = event.target.value;
    if (unitId) {
      this.selectAndAutoCreate('unit', unitId);
    } else {
      // Keep area selected but clear unit
      const areaId = this.getSelectedAreaId();
      if (areaId) {
        this.selectAndAutoCreate('area', areaId);
      }
    }
  }

  // Simple Paint Mode System
  setPaintMode(mode: 'municipality' | 'area' | 'unit' | 'school' | 'clear') {
    this.paintMode = mode;
    this.isSchoolMode = (mode === 'school');
    
    // Emit the paint mode to the game scene
    this.boundarySelected.emit(`paint:${mode}`);
  }
  
  setPanMode() {
    // Clear paint mode to enable panning
    this.paintMode = null;
    this.isSchoolMode = false;
    
    // Emit pan mode to the game scene
    this.boundarySelected.emit('paint:pan');
  }
  
  startNewMunicipality() {
    // Reset the current municipality to start a new one
    this.boundarySelected.emit('paint:reset_municipality');
    this.setPaintMode('municipality');
  }
  
  updateButtonStates() {
    // Force change detection to update button states immediately
    // This method is called from the paint system to refresh UI
    this.ngZone.run(() => {
      this.cdRef.markForCheck();
      this.cdRef.detectChanges();
    });
  }

  getPaintModeLabel(): string {
    switch (this.paintMode) {
      case 'municipality': return 'Municipality Brush';
      case 'area': return 'Area Brush';
      case 'unit': return 'Unit Brush';
      case 'school': return 'School Placer';
      case 'clear': return 'Eraser';
      case null: return 'Pan Mode';
      default: return 'Select a tool';
    }
  }

  getPaintInstruction(): string {
    switch (this.paintMode) {
      case 'municipality': return 'Click/drag to paint tiles with the same municipality color. Double-click Municipality button to start a new municipality.';
      case 'area': return 'Click/drag on municipality tiles (colored) to create areas within them.';
      case 'unit': return 'Click/drag on area tiles to create units within them.';
      case 'school': return 'Click on unit tiles to place schools. Schools can only be placed on units.';
      case 'clear': return 'Click/drag on any painted tile to erase it and return it to green.';
      case null: return 'Pan mode active - tap/drag to move the camera. Select a tool below to start painting.';
      default: return 'Choose a paint tool to start building your city hierarchy';
    }
  }

  hasAnyMunicipality(): boolean {
    return this.municipalityManager.getMunicipalities().length > 0;
  }

  hasAnyArea(): boolean {
    return this.municipalityManager.getMunicipalities()
      .some(m => m.areas.length > 0);
  }

  hasAnyUnit(): boolean {
    return this.municipalityManager.getMunicipalities()
      .some(m => m.areas.some(a => a.units.length > 0));
  }
}
