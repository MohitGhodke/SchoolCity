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

  // Dark theme - soft, easy on the eyes, minimal eye strain
  private darkTheme: ColorTheme = {
    background: '#1a1a1a',         // Soft dark gray instead of blue-black
    surface: '#2d2d2d',           // Warm dark gray for surfaces
    
    tileDefault: 0x2a2a2a,         // Very subtle gray for default tiles
    tileBorder: 0x404040,          // Soft, muted border - not too bright
    
    primary: '#6b7280',            // Muted blue-gray
    secondary: '#9ca3af',          // Light gray
    accent: '#10b981',             // Keep the green accent for important actions
    text: '#e5e5e5',              // Soft white, not pure white
    textSecondary: '#a1a1aa',      // Muted gray text
    
    buttonBg: '#2d2d2d',
    buttonHover: '#3a3a3a',
    buttonActive: '#454545',
    buttonDisabled: '#1f1f1f',
    
    // Soft, muted colors for dark mode - easy on the eyes
    municipalities: [
      0x4ade80,  // Soft green
      0x60a5fa,  // Soft blue
      0xfbbf24,  // Warm yellow
      0xf472b6,  // Soft pink
      0xa78bfa,  // Soft purple
      0xff7875,  // Soft coral
      0x34d399,  // Soft emerald
      0x38bdf8   // Soft cyan
    ],
    areas: [
      0x22c55e,  // Medium green
      0x3b82f6,  // Medium blue
      0xf59e0b,  // Medium amber
      0xec4899,  // Medium pink
      0x8b5cf6,  // Medium purple
      0xef4444,  // Medium red
      0x059669,  // Medium emerald
      0x0ea5e9   // Medium sky
    ],
    units: [
      0x16a34a,  // Darker green
      0x2563eb,  // Darker blue
      0xd97706,  // Darker amber
      0xdb2777,  // Darker pink
      0x7c3aed,  // Darker purple
      0xdc2626,  // Darker red
      0x047857,  // Darker emerald
      0x0284c7   // Darker sky
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
