import { Component } from '@angular/core';
import { GameComponent } from './game/game.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GameComponent],
  template: '<app-game></app-game>',
  styleUrl: './app.css'
})
export class App {}
