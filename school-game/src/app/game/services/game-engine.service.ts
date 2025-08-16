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
      const PhaserModule = await import('phaser');
      console.log('✅ Phaser module loaded:', PhaserModule);
      console.log('🔍 PhaserModule keys:', Object.keys(PhaserModule));
      console.log('🔍 PhaserModule.default:', PhaserModule.default);
      console.log('🔍 Direct Game access:', PhaserModule.Game);
      console.log('🔍 Default Game access:', PhaserModule.default?.Game);
      
      // Handle different import structures
      const Phaser = PhaserModule.default || PhaserModule;
      console.log('🔍 Using Phaser object:', Phaser);
      console.log('🔍 Phaser.Game exists:', !!Phaser.Game);
      console.log('🔍 Phaser.AUTO exists:', !!Phaser.AUTO);
      
      if (!Phaser.Game) {
        console.error('❌ Phaser.Game not found!');
        console.log('Available Phaser properties:', Object.keys(Phaser));
        throw new Error('Phaser.Game constructor not available');
      }
      
      // Create the scene class using the factory function
      console.log('🏗️ Creating scene...');
      const SceneClass = sceneFactory(Phaser);
      
      console.log('🎯 Container dimensions:', container.clientWidth, 'x', container.clientHeight);
      console.log('🎯 Config dimensions:', config.width, 'x', config.height);
      
      console.log('🎮 Creating Phaser.Game instance...');
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
