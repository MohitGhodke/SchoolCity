# SchoolGame - Technical Documentation

This is an Angular-based educational city planning simulation game that integrates with Phaser.js for game engine functionality. The application allows users to create and manage educational districts on an isometric grid system.

## Architecture Overview

The application follows a modular Angular architecture with distinct separation between UI components, game services, and the Phaser.js game engine. The main game logic is handled through a collection of specialized services that manage different aspects of the simulation.

## Core Components

### GameComponent (`game.component.ts`)
The main orchestrator component that:
- Manages the Phaser.js game engine integration
- Handles user input (mouse, touch, keyboard)
- Coordinates between Angular UI and game state
- Manages school selection and modal interactions
- Provides zoom controls and touch gestures
- Handles game persistence (save/load functionality)

### UI Components

#### BoundarySelectorComponent (`ui/boundary-selector.component.ts`)
- Provides boundary painting tools for municipal organization
- Handles selection of municipality, area, and unit boundaries
- Communicates boundary selections to the game engine

#### ThemeToggleComponent (`ui/theme-toggle.component.ts`)
- Manages light/dark theme switching
- Coordinates with ThemeService for consistent theming

## Game Services Architecture

### Core Game Services

#### GameEngineService (`services/game-engine.service.ts`)
- Initializes and manages the Phaser.js game instance
- Handles game configuration and scene management
- Provides interface between Angular and Phaser.js
- Manages game lifecycle (creation/destruction)

#### GameStateService (`services/game-state.service.ts`)
- Central state management for the entire game
- Coordinates between all other services
- Handles game rendering triggers
- Manages clean slate functionality
- Integrates SchoolService for school management

#### RenderingService (`services/rendering.service.ts`)
- Manages all visual rendering operations
- Handles zoom and camera controls
- Manages grid positioning and centering
- Integrates with MunicipalityManagerService for boundary rendering
- Coordinates theme-based visual updates

### Specialized Services

#### SchoolService (`services/school.service.ts`)
- Manages school placement and removal on the grid
- Handles student capacity management
- Validates school placement rules
- Manages school data persistence

#### EducationHierarchyService (`services/education-hierarchy.service.ts`)
- Manages the educational organization structure
- Handles Municipality > Area > Unit > School > Class > Group > Student hierarchy
- Provides data models for educational entities

#### GridService (`services/grid.service.ts`)
- Manages the isometric grid system
- Handles coordinate transformations
- Provides grid-based positioning utilities
- Manages tile-based operations

#### MunicipalityManagerService (`services/municipality-manager.service.ts`)
- Manages municipal boundary definitions
- Handles area and unit boundary painting
- Provides boundary color management
- Manages hierarchical boundary relationships

#### ThemeService (`services/theme.service.ts`)
- Manages light/dark theme states
- Provides theme-specific color schemes
- Handles theme persistence
- Coordinates theme changes across components

#### GameDataService (`services/game-data.service.ts`)
- Handles game state persistence to localStorage
- Manages save/load operations
- Provides data serialization/deserialization
- Manages saved game validation

#### GameEventService (`services/game-event.service.ts`)
- Provides event communication between Angular and Phaser
- Handles school click events
- Manages cross-component event messaging
- Uses RxJS Subjects for reactive event handling

## Game Engine Integration

### MainScene (`scenes/main-scene.ts`)
The primary Phaser.js scene that handles:
- Grid rendering and isometric projection
- School sprite management and PNG loading
- Mouse and touch interaction handling
- Boundary painting system
- School placement validation
- Event communication with Angular services

### Scene Factory Pattern
- Uses factory pattern to inject Angular services into Phaser scenes
- Enables dependency injection compatibility between Angular and Phaser
- Provides clean separation of concerns

## Data Models

### Education Hierarchy (`models/education-hierarchy.models.ts`)
Defines the complete educational structure:
- `Municipality` - Top-level administrative division
- `Area` - Regional subdivision within municipality
- `Unit` - Local administrative unit
- `School` - Individual educational institution
- `SchoolClass` - Classroom within school
- `Group` - Student groups within classes
- `Student` - Individual student entities
- `Teacher` - Educational staff

## Game Constants (`constants/game-constants.ts`)

### Grid Configuration
- Isometric tile dimensions (64x32 pixels)
- Grid size (10x10 default)
- Positioning offsets and calculations

### School Types
- Elementary (2x2 grid, 150 capacity)
- Middle (3x3 grid, 300 capacity)
- High (4x3 grid, 600 capacity)

### Visual Components
- Building components (gymnasium, playground, parking, etc.)
- Color schemes for different elements
- Theme-specific visual definitions

## Development Commands

### Development server
```bash
ng serve
```
Starts local development server at `http://localhost:4200/`

### Building
```bash
ng build
```
Creates production build in `dist/` directory

### Testing
```bash
ng test        # Unit tests with Karma
ng e2e         # End-to-end tests
```

### Code Generation
```bash
ng generate component component-name
ng generate service service-name
ng generate --help  # View all available schematics
```

## Technical Features

### Isometric Grid System
- 2D grid projected in isometric view
- Coordinate transformation utilities
- Multi-tile school placement support

### State Management
- Centralized state through GameStateService
- Reactive updates using RxJS
- Persistent storage with localStorage

### Input Handling
- Mouse wheel zoom
- Touch pinch-to-zoom gestures
- Click/tap interactions for school management
- Boundary painting with mouse/touch

### Theme System
- Light/dark mode support
- Dynamic color scheme switching
- Persistent theme preferences
- Canvas background synchronization

### Asset Management
- PNG sprite loading for schools
- Fallback texture generation
- Dynamic asset scaling and positioning

## Performance Considerations

- Efficient grid rendering with Phaser.js
- Optimized state updates and re-renders
- Memory management for game instances
- Proper cleanup of subscriptions and event listeners

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
