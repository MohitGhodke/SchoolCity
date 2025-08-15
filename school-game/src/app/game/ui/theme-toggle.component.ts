import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="theme-toggle"
      (click)="toggleTheme()"
      [attr.aria-label]="(isDarkMode$ | async) ? 'Switch to light mode' : 'Switch to dark mode'"
      title="Toggle theme">
      <span class="material-icons-outlined toggle-icon">
        {{ (isDarkMode$ | async) ? 'light_mode' : 'dark_mode' }}
      </span>
    </button>
  `,
  styles: [`
    .theme-toggle {
      background: var(--button-bg);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      min-height: 44px;
      font-size: 18px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .theme-toggle:hover {
      background: var(--button-hover);
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .theme-toggle:active {
      background: var(--button-active);
      transform: translateY(0);
    }

    .toggle-icon {
      font-size: 20px;
      line-height: 1;
      transition: transform 0.3s ease;
    }

    .theme-toggle:hover .toggle-icon {
      transform: scale(1.1);
    }

    @media (max-width: 768px) {
      .theme-toggle {
        min-width: 40px;
        min-height: 40px;
        padding: 6px 10px;
        font-size: 16px;
      }
    }
  `]
})
export class ThemeToggleComponent {
  constructor(private themeService: ThemeService) {}

  get isDarkMode$() {
    return this.themeService.isDarkMode$;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
