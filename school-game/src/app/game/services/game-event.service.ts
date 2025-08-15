import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GameEventService {
  // Emits a school object when a school tile is clicked in Phaser
  schoolClicked$ = new ReplaySubject<any>(1);
}
