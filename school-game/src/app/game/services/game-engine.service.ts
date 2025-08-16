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
      throw new Error('Game can only be initialized in browser environment');
    }
    
    try {
      const PhaserModule = await import('phaser');
      
      // Handle different import structures
      const Phaser = PhaserModule.default || PhaserModule;
      
      if (!Phaser.Game) {
        throw new Error('Phaser.Game constructor not available');
      }
      
      // Create the scene class using the factory function
      const SceneClass = sceneFactory(Phaser);
      
      this.game = new Phaser.Game({
        type: Phaser.AUTO,
        width: config.width,
        height: config.height,
        parent: container,
        backgroundColor: config.backgroundColor,
        scene: [SceneClass]
      });

      return this.game;
      
    } catch (error) {
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
