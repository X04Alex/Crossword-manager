# Crossword Manager

A modern, interactive web-based crossword puzzle editor and manager built with HTML, CSS, and JavaScript.

## Features

### 🎯 Core Functionality
- **15×15 Grid**: Standard crossword puzzle size
- **Interactive Editing**: Click and type to fill in letters
- **Word Detection**: Automatically identifies and highlights words
- **Dual Mode**: Toggle between Edit and View modes
- **Keyboard Navigation**: Use arrow keys to move between cells

### 🎨 User Interface
- **Modern Design**: Clean, responsive interface with gradient backgrounds
- **Visual Feedback**: Selected cells and connected words are highlighted
- **Sidebar**: Shows across and down clues with word information
- **Tabbed Interface**: Switch between across and down clues

### 💾 File Management
- **Save/Load**: Save your crossword as JSON files
- **Export**: Export to plain text format
- **New Crossword**: Start fresh with a clean grid

### 🎮 Interactive Features
- **Auto-advance**: Automatically moves to the next cell when typing
- **Word Highlighting**: Shows connected words when selecting a cell
- **Clue Navigation**: Click on clues to jump to corresponding words
- **Random Fill**: Fill the grid with sample words for testing

## How to Use

### Getting Started
1. Open `index.html` in your web browser
2. The crossword manager will load with a blank 15×15 grid
3. Start typing to fill in letters

### Basic Navigation
- **Click** on any cell to select it
- **Type** letters to fill in the grid
- **Arrow keys** to move between cells
- **Backspace** to clear cells
- **Tab** to toggle between Edit and View modes

### Editing Features
- **Edit Mode**: Type letters directly into cells
- **View Mode**: Browse the puzzle without editing
- **Clear Grid**: Remove all letters from the grid
- **Fill Random**: Populate with sample words

### Word Management
- **Automatic Detection**: Words are automatically identified
- **Clue Display**: View all across and down words in the sidebar
- **Word Details**: See information about selected words
- **Clue Navigation**: Click on clues to select corresponding words

### File Operations
- **Save**: Download your crossword as a JSON file
- **Load**: Upload a previously saved crossword file
- **Export**: Create a text file with the grid and clues
- **New**: Start a new crossword (clears current grid)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow Keys | Navigate between cells |
| Backspace | Clear current cell or move to previous |
| Tab | Toggle Edit/View mode |
| Any letter | Fill current cell and advance |

## File Formats

### Save Format (JSON)
```json
{
  "grid": [
    [{"value": "H", "isBlack": false}, ...],
    ...
  ],
  "clues": {
    "across": {},
    "down": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Export Format (Text)
```
CROSSWORD PUZZLE

GRID:
HELLO....WORLD
.....

CLUES:
ACROSS:
1. HELLO
6. WORLD

DOWN:
1. HELLO
...
```

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

The application is built with vanilla JavaScript and doesn't require any build tools or dependencies. Simply open `index.html` in a web browser to run.

### File Structure
```
crossword-manager/
├── index.html      # Main HTML file
├── styles.css      # CSS styles
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Future Enhancements

- Custom grid sizes
- Clue editing interface
- Word validation
- Print-friendly layouts
- Theme customization
- Undo/redo functionality
- Word suggestions
- Crossword solving mode

## License

This project is open source and available under the MIT License. 