# Color Hierarchy System Documentation

## Overview

The SchoolCity game now implements a cohesive color hierarchy system that ensures visual consistency across the municipal structure. Each municipality maintains its own distinct color theme throughout all its child elements.

## How It Works

### Before the Fix
- Municipalities used colors from the municipality color palette
- Areas used colors from a separate area color palette  
- Units used colors from a separate unit color palette
- **Problem**: A blue municipality could have green areas and yellow units

### After the Fix
- Municipalities use distinct base colors from the theme palette
- Areas use **lighter shades** of their parent municipality's base color
- Units use **darker shades** of their parent municipality's base color
- **Result**: A blue municipality has light blue areas and dark blue units

## Color Generation Logic

### Municipality Colors
```typescript
// Uses predefined colors from ThemeService
const baseColors = this.themeService.getMunicipalityColors();
const baseColor = baseColors[(this.municipalities.length) % baseColors.length];
```

### Area Colors (Lighter Shades)
```typescript
// Progressive lightening: 1.2x, 1.35x, 1.5x, etc.
const shadeFactor = 1.2 + (municipality.areas.length * 0.15);
const areaColorData = this.generateShadeFromNumber(municipality.baseColor, shadeFactor);
```

### Unit Colors (Darker Shades)  
```typescript
// Progressive darkening: 0.8x, 0.7x, 0.6x, etc.
const shadeFactor = 0.8 - (area.units.length * 0.1);
const unitColorData = this.generateShadeFromNumber(municipality.baseColor, shadeFactor);
```

## Color Shade Algorithm

The `generateShadeFromNumber` method handles both lightening and darkening:

```typescript
if (factor > 1) {
  // Lighter shade: blend with white
  const lightenFactor = (factor - 1);
  newR = Math.round(r + (255 - r) * lightenFactor);
  newG = Math.round(g + (255 - g) * lightenFactor);
  newB = Math.round(b + (255 - b) * lightenFactor);
} else {
  // Darker shade: multiply by factor
  newR = Math.round(r * factor);
  newG = Math.round(g * factor);
  newB = Math.round(b * factor);
}
```

## Visual Example

```
🏛️ Municipality 1 (Mint Green #6ee7b7)
├── 📍 Area 1 (Light Mint #8aeda8)
│   ├── 🔲 Unit 1 (Dark Mint #58b692)
│   └── 🔲 Unit 2 (Darker Mint #4f9f80)
└── 📍 Area 2 (Lighter Mint #a6f3ba)
    ├── 🔲 Unit 1 (Dark Mint #58b692)
    └── 🔲 Unit 2 (Darker Mint #4f9f80)

🏛️ Municipality 2 (Sky Blue #7dd3fc)
├── 📍 Area 1 (Light Blue #9ee0fd)
│   ├── 🔲 Unit 1 (Dark Blue #64a9ca)
│   └── 🔲 Unit 2 (Darker Blue #5795b3)
└── 📍 Area 2 (Lighter Blue #bfeefe)
    ├── 🔲 Unit 1 (Dark Blue #64a9ca)
    └── 🔲 Unit 2 (Darker Blue #5795b3)
```

## Benefits

1. **Visual Consistency**: Each municipality maintains its color identity
2. **Clear Hierarchy**: Lighter shades for areas (higher level), darker for units (lower level)
3. **User Experience**: Easier to understand which elements belong to which municipality
4. **Scalability**: System works regardless of how many municipalities, areas, or units are created

## Technical Implementation

### Files Modified
- `municipality-manager.service.ts`: Updated `addArea()` and `addUnit()` methods
- `municipality-manager.service.ts`: Enhanced `generateShadeFromNumber()` method

### Methods Enhanced
- `addArea()`: Now generates area colors as lighter shades of municipality base color
- `addUnit()`: Now generates unit colors as darker shades of municipality base color  
- `generateShadeFromNumber()`: Improved to handle both lightening and darkening properly

## Testing the System

1. Create a municipality (gets a base color)
2. Add areas to it (should get lighter shades of the base color)
3. Add units to those areas (should get darker shades of the base color)
4. Create a second municipality (gets a different base color)
5. Verify that its areas and units use shades of the new base color

## Future Enhancements

- Could add saturation adjustments for even more variety
- Could implement custom color pickers for municipalities
- Could add accessibility features for color-blind users
- Could save color preferences per user
