/**
 * @fileoverview Main application component for the SchoolCity game.
 * 
 * This is the root component of the Angular application that serves as a 
 * minimal wrapper around the main game component. It follows Angular's
 * standalone component pattern (Angular 17+) and acts as the entry point
 * for the entire application.
 * 
 * The component does nothing more than render the GameComponent, which
 * contains all the game logic, UI controls, and Phaser.js integration.
 * 
 * @author SchoolCity Development Team
 * @version 1.0.0
 */

import { Component } from '@angular/core';
import { GameComponent } from './game/game.component';

/**
 * Root application component that renders the main game.
 * 
 * This component serves as the application entry point and simply
 * delegates all functionality to the GameComponent. It uses Angular's
 * standalone component architecture for better tree-shaking and
 * simplified bootstrapping.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GameComponent],
  template: '<app-game></app-game>',
  styleUrl: './app.css'
})
export class App {}
