import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface GameConfig {
  width: number;
  height: number;
  backgroundColor: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameEngineService {
  private game: any = null;
  private scene: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async initializeGame(container: HTMLElement, config: GameConfig, sceneFactory: any): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) {
      console.error('❌ Not in browser environment');
      throw new Error('Game can only be initialized in browser environment');
    }

    console.log('🎮 Starting game initialization...');
    console.log('📦 Loading Phaser...');
    
    try {
      const Phaser = await import('phaser');
      console.log('✅ Phaser loaded successfully');
      
      // Create the scene class using the factory function
      console.log('🏗️ Creating scene...');
      const SceneClass = sceneFactory(Phaser);
      
      console.log('🎯 Container dimensions:', container.clientWidth, 'x', container.clientHeight);
      console.log('🎯 Config dimensions:', config.width, 'x', config.height);
      
      this.game = new Phaser.Game({
        type: Phaser.AUTO,
        width: config.width,
        height: config.height,
        parent: container,
        backgroundColor: config.backgroundColor,
        scene: [SceneClass]
      });

      console.log('🎮 Phaser game created successfully');
      return this.game;
      
    } catch (error) {
      console.error('❌ Failed to initialize game:', error);
      throw error;
    }
  }

  getGame(): any {
    return this.game;
  }

  getScene(): any {
    return this.scene;
  }

  setScene(scene: any): void {
    this.scene = scene;
  }

  destroyGame(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
      this.scene = null;
    }
  }
}
