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
    console.log('🎮 GameEngineService.initializeGame called');
    console.log('🌐 Platform check:', isPlatformBrowser(this.platformId));
    
    if (!isPlatformBrowser(this.platformId)) {
      console.error('❌ Not in browser environment');
      throw new Error('Game can only be initialized in browser environment');
    }

    console.log('📦 Loading Phaser library...');
    const Phaser = await import('phaser');
    console.log('✅ Phaser loaded successfully:', !!Phaser);
    
    // Create the scene class using the factory function
    console.log('🏗️ Creating scene class from factory...');
    const SceneClass = sceneFactory(Phaser);
    console.log('✅ Scene class created:', !!SceneClass);
    
    console.log('🎮 Creating Phaser.Game instance...');
    console.log('🎮 Game config:', config);
    console.log('🎮 Container:', container);
    
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: config.width,
      height: config.height,
      parent: container,
      backgroundColor: config.backgroundColor,
      scene: [SceneClass]
    });
    
    console.log('✅ Phaser.Game created successfully:', !!this.game);

    return this.game;
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
