import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GAME_CONSTANTS } from '../constants/game-constants';

interface BoundaryOption {
  id: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-boundary-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <button *ngFor="let option of boundaryOptions"
              class="boundary-btn {{option.id}}"
              [class.selected]="selected === option.id"
              (click)="select(option.id)">
        {{ option.label }}
      </button>
      <button class="boundary-btn school" [class.selected]="selected === 'school'" (click)="select('school')">
        Place School
      </button>
    </div>
  `,
  styleUrls: ['./boundary-selector.component.css']
})
export class BoundarySelectorComponent {
  @Output() boundarySelected = new EventEmitter<string>();
  selected: string | null = null;

  boundaryOptions: BoundaryOption[] = [
    { id: 'municipality-1', label: 'Municipality 1', color: '#cfc6b8' },
    { id: 'municipality-2', label: 'Municipality 2', color: '#a7bfa4' },
    { id: 'area-1', label: 'Area 1', color: '#dbeac6' },
    { id: 'area-2', label: 'Area 2', color: '#b7c7a4' },
    { id: 'unit-1', label: 'Unit 1', color: '#e7e1cb' },
    { id: 'unit-2', label: 'Unit 2', color: '#8b7b6b' }
  ];

  select(id: string) {
    this.selected = id;
    this.boundarySelected.emit(id);
  }
}
