# Development Guidelines for Agents

## Build/Lint/Test Commands

### Build Commands
- No build needed. User will manually test using live web server.

### Lint Commands
- No linting needed

### Test Commands  
- No testing needed

## Code Style Guidelines

### Imports
- Avoid external dependencies
- Use explicit relative imports for local modules
- Group imports in order: external libraries, internal modules, local modules
- Sort imports alphabetically within each group
- Avoid wildcard imports (`import * as foo from 'foo'`)

### Formatting
- Follow Prettier formatting standards (configured via .prettierrc)
- Use 2-space indentation (unless otherwise specified)
- Prefer single quotes for strings
- No trailing commas in function parameters
- Use consistent spacing around operators and after commas

### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for component names
- Use UPPER_SNAKE_CASE for constants
- Use descriptive names that clearly indicate purpose
- Avoid abbreviations unless they are widely known

### Error Handling
- Handle errors gracefully with try/catch blocks
- Provide meaningful error messages
- Log errors appropriately using console.error
- Don't ignore errors or let them bubble up unhandled

### General Best Practices
- Write small, focused functions that do one thing well
- Avoid deeply nested code structures
- Use descriptive variable and function names
- Comment complex logic with clear explanations
- Follow component-based architecture patterns
- Keep components reusable and generic where possible

## Project Structure
This is a static gallery application with:
- `index.html` - Main HTML structure
- `styles.css` - CSS styling for the gallery interface
- `app.js` - JavaScript functionality for drag-drop, navigation, and slideshow

## Special Considerations
- The gallery app uses only standard web APIs (no external dependencies)
- All functionality is contained in three separate files
- Application works completely client-side with no server requirements
- Responsive design supports both desktop and mobile devices
- Keyboard navigation supported (arrow keys and spacebar)
- Touch swipe gestures for mobile navigation

## File-Specific Guidelines
- HTML files should maintain semantic structure and proper accessibility attributes
- CSS should follow BEM methodology for class naming where appropriate
- JavaScript should be modular with clear separation of concerns
- All code should be self-contained without external dependencies