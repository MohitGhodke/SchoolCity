import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface ColorTheme {
  // Background colors
  background: string;
  surface: string;
  
  // Grid colors
  tileDefault: number;
  tileBorder: number;
  
  // UI colors
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  
  // Button colors
  buttonBg: string;
  buttonHover: string;
  buttonActive: string;
  buttonDisabled: string;
  
  // Municipality colors (pastel)
  municipalities: number[];
  areas: number[];
  units: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkMode = false;
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  
  public isDarkMode$ = this.darkModeSubject.asObservable();

  // Light theme - inspired by the clean, minimal images you shared
  private lightTheme: ColorTheme = {
    background: '#f8fafb',
    surface: '#ffffff',
    
    tileDefault: 0xf0f7ff,      // Very light blue
    tileBorder: 0xe1ebf0,       // Soft blue-gray
    
    primary: '#4a90e2',         // Clean blue
    secondary: '#7dd3fc',       // Light blue
    accent: '#10b981',          // Fresh green
    text: '#1f2937',            // Dark gray
    textSecondary: '#6b7280',   // Medium gray
    
    buttonBg: '#ffffff',
    buttonHover: '#f3f4f6',
    buttonActive: '#e5e7eb',
    buttonDisabled: '#f9fafb',
    
    // Soft, modern pastels - distinct colors for municipalities
    municipalities: [
      0x6ee7b7,  // Mint green
      0x7dd3fc,  // Sky blue  
      0xfbbf24,  // Warm yellow
      0xf472b6,  // Pink
      0xa78bfa,  // Purple
      0xfb7185,  // Coral
      0x34d399,  // Emerald
      0x60a5fa   // Blue
    ],
    areas: [
      0x86efac,  // Light green
      0x93c5fd,  // Light blue
      0xfde047,  // Light yellow
      0xf9a8d4,  // Light pink
      0xc4b5fd,  // Light purple
      0xfda4af,  // Light coral
      0x4ade80,  // Medium green
      0x38bdf8   // Light cyan
    ],
    units: [
      0xa7f3d0,  // Very light green
      0xbfdbfe,  // Very light blue
      0xfef08a,  // Very light yellow
      0xfce7f3,  // Very light pink
      0xddd6fe,  // Very light purple
      0xfecaca,  // Very light coral
      0x6ee7b7,  // Light mint
      0x93c5fd   // Pale blue
    ]
  };

  // Dark theme - modern, not too contrasty, warm and cozy
  private darkTheme: ColorTheme = {
    background: '#0f172a',      // Deep blue-black
    surface: '#1e293b',        // Dark slate
    
    tileDefault: 0x334155,      // Slate gray
    tileBorder: 0x475569,       // Lighter slate
    
    primary: '#60a5fa',         // Bright blue
    secondary: '#38bdf8',       // Cyan
    accent: '#34d399',          // Emerald
    text: '#f1f5f9',            // Light gray
    textSecondary: '#cbd5e1',   // Medium light gray
    
    buttonBg: '#334155',
    buttonHover: '#475569',
    buttonActive: '#64748b',
    buttonDisabled: '#1e293b',
    
    // Vibrant but not harsh colors for dark mode
    municipalities: [
      0x6ee7b7,  // Bright mint
      0x7dd3fc,  // Bright sky
      0xfbbf24,  // Bright yellow
      0xf472b6,  // Bright pink
      0xa78bfa,  // Bright purple
      0xfb7185,  // Bright coral
      0x34d399,  // Bright emerald
      0x60a5fa   // Bright blue
    ],
    areas: [
      0x4ade80,  // Medium green
      0x60a5fa,  // Medium blue
      0xf59e0b,  // Medium yellow
      0xec4899,  // Medium pink
      0x8b5cf6,  // Medium purple
      0xef4444,  // Medium red
      0x10b981,  // Medium emerald
      0x3b82f6   // Medium blue
    ],
    units: [
      0x22c55e,  // Darker green
      0x3b82f6,  // Darker blue
      0xd97706,  // Darker yellow
      0xdb2777,  // Darker pink
      0x7c3aed,  // Darker purple
      0xdc2626,  // Darker red
      0x059669,  // Darker emerald
      0x2563eb   // Darker blue
    ]
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Only check localStorage in browser environment
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('schoolCity-theme');
      if (savedTheme === 'dark') {
        this.isDarkMode = true;
        this.darkModeSubject.next(true);
        this.applyTheme();
      }
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.darkModeSubject.next(this.isDarkMode);
    this.applyTheme();
    
    // Save preference only in browser environment
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('schoolCity-theme', this.isDarkMode ? 'dark' : 'light');
    }
  }

  getCurrentTheme(): ColorTheme {
    return this.isDarkMode ? this.darkTheme : this.lightTheme;
  }

  private applyTheme(): void {
    // Only apply theme in browser environment
    if (!isPlatformBrowser(this.platformId)) return;
    
    const theme = this.getCurrentTheme();
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--bg-primary', theme.background);
    root.style.setProperty('--bg-surface', theme.surface);
    root.style.setProperty('--text-primary', theme.text);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--button-bg', theme.buttonBg);
    root.style.setProperty('--button-hover', theme.buttonHover);
    root.style.setProperty('--button-active', theme.buttonActive);
    root.style.setProperty('--button-disabled', theme.buttonDisabled);
    
    // Apply theme to Phaser canvas if it exists
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.backgroundColor = theme.background;
      canvas.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
    }
  }

  // Method for game rendering to get current colors
  getTileColors(): { default: number; border: number } {
    const theme = this.getCurrentTheme();
    return {
      default: theme.tileDefault,
      border: theme.tileBorder
    };
  }

  getMunicipalityColors(): number[] {
    return this.getCurrentTheme().municipalities;
  }

  getAreaColors(): number[] {
    return this.getCurrentTheme().areas;
  }

  getUnitColors(): number[] {
    return this.getCurrentTheme().units;
  }
}
