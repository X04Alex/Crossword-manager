class CrosswordManager {
    constructor() {
        this.gridSize = 15;
        this.typingDirection = 'across'; // Default direction
        this.grid = [];
        this.isEditMode = true;
        this.selectedCell = null;
        this.activeClueIndex = 0;
		this.isPlayMode = false;
		this.solutionGrid = null; // 2D array of solution letters for play mode
		this.puzzleCompleted = false;
        this.words = {
            across: [],
            down: []
        };
        this.clues = {
            across: {},
            down: {}
        };
        
        // Settings
        this.settings = {
            skipFilledLetters: false,
            gridSize: 15
        };
        
        // Auto-fill module (will be initialized after autofill.js loads)
        this.autoFill = null;
        
        this.loadSettings();
        this.init();
    }
    
    init() {
        this.createGrid();
        this.setupEventListeners();
        this.updateClues();
        this.loadDefaultWordList();
        this.initializeAutoFill();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('crosswordSettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
                this.gridSize = this.settings.gridSize || 15;
            } catch (e) {
                console.warn('Failed to load settings:', e);
            }
        }
    }
    
    saveSettings() {
        localStorage.setItem('crosswordSettings', JSON.stringify(this.settings));
    }
    
    updateGridSize() {
        // Calculate available space (accounting for sidebar and padding)
        const availableWidth = window.innerWidth - 320; // sidebar + padding
        const availableHeight = window.innerHeight - 120; // header + padding
        
        // Calculate cell size to fit the grid
        const cellSize = Math.min(
            Math.floor(availableWidth / this.gridSize),
            Math.floor(availableHeight / this.gridSize),
            80 // maximum cell size
        );
        
        // Ensure minimum cell size
        const finalCellSize = Math.max(cellSize, 25);
        
        // Calculate proportional font size
        const fontSize = Math.max(Math.floor(finalCellSize * 0.4), 12);
        
        // Set CSS custom properties
        document.documentElement.style.setProperty('--cell-size', `${finalCellSize}px`);
        document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
        
        // Update grid template
        const gridContainer = document.getElementById('crosswordGrid');
        if (gridContainer) {
            gridContainer.style.gridTemplateColumns = `repeat(${this.gridSize}, ${finalCellSize}px)`;
            gridContainer.style.gridTemplateRows = `repeat(${this.gridSize}, ${finalCellSize}px)`;
        }
    }
    
    createGrid() {
        const gridContainer = document.getElementById('crosswordGrid');
        gridContainer.innerHTML = '';
    
        // Clear existing grid data
        this.grid = [];
    
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
    
                // Number badge
                const numberSpan = document.createElement('div');
                numberSpan.className = 'cell-number';
                cell.appendChild(numberSpan);
    
                // Input
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.row = row;
                input.dataset.col = col;
    
                input.addEventListener('keydown', (e) => {
                    this.handleInputKeydown(e);
                });
                input.addEventListener('input', (e) => {
                    this.handleInput(e);
                });
    
                cell.appendChild(input);
                gridContainer.appendChild(cell);
    
                this.grid[row][col] = {
                    element: cell,
                    input,
                    value: '',
                    isBlack: false,
                    number: null
                };
            }
        }
    
        this.updateGridSize();
    }
    
    
    setupEventListeners() {
        // Grid interaction
        document.addEventListener('click', (e) => {
            const clueEl = e.target.closest('.clue-item');
            if (clueEl) {
                this.selectWordFromClue(clueEl);
            }
        });
        

        

        document.getElementById('saveClue').addEventListener('click', () => {
            if (!this.selectedCell) return;
            const row = parseInt(this.selectedCell.element.dataset.row);
            const col = parseInt(this.selectedCell.element.dataset.col);
            const dir = this.typingDirection;
            const word = this.getWordAt(row, col, dir);
            if (!word) return;
        
            const number = this.getWordNumber(word.startRow, word.startCol);
            const clueText = document.getElementById('clueInput').value;
            this.clues[dir][number] = clueText;
            this.updateClues();
        });
        
        
        // Right-click to toggle black squares
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const cell = e.target.classList.contains('cell') ? e.target : e.target.closest('.cell');
            if (cell) {
                this.handleRightClick(e);
            }
        });
        
        // Input handling
        document.addEventListener('input', (e) => {
            console.log('Document input event:', e.target.tagName, e.target.dataset.row, 'value:', e.target.value);
            if (e.target.tagName === 'INPUT' && e.target.dataset.row !== undefined) {
                this.handleInput(e);
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });
        
        // Control buttons
        document.getElementById('newCrossword').addEventListener('click', () => {
            this.newCrossword();
        });
        
        document.getElementById('saveCrossword').addEventListener('click', () => {
            this.saveCrossword();
        });
        
        document.getElementById('loadCrossword').addEventListener('click', () => {
            this.loadCrossword();
        });
        
        document.getElementById('exportCrossword').addEventListener('click', () => {
            this.exportCrossword();
        });
        
        document.getElementById('clearGrid').addEventListener('click', () => {
            this.clearGrid();
        });

        document.getElementById('playCrossword').addEventListener('click', () => {
            this.loadCrossword(true); // true = play mode
			this.isEditMode = true; // allow typing
			this.isPlayMode = true; // mark play mode for completion checking
			this.puzzleCompleted = false;
            this.resetTimer();
            this.updateTimerDisplay();
            document.getElementById('currentMode').textContent = 'Play';
            const tools = document.getElementById('playTools');
            if (tools) tools.style.display = 'flex';
        });
        
        
        // Add a debug method to check grid state
        window.debugGrid = () => {
            console.log('=== GRID DEBUG ===');
            console.log('Grid size:', this.gridSize);
            console.log('Selected cell:', this.selectedCell);
            if (this.selectedCell) {
                console.log('Selected cell input:', this.selectedCell.input);
                console.log('Selected cell element:', this.selectedCell.element);
            }
            console.log('Grid data:', this.grid);
        };
        
        // Add a method to test typing on the selected cell
        window.testTyping = () => {
            if (this.selectedCell && this.selectedCell.input) {
                console.log('Testing typing on selected cell');
                this.selectedCell.input.focus();
                this.selectedCell.input.value = 'X';
                this.selectedCell.input.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('Typed X, check if it appears');
            } else {
                console.log('No selected cell or input field');
            }
        };
        
        // Add a method to test keyboard events
        window.testKeyboard = () => {
            if (this.selectedCell && this.selectedCell.input) {
                console.log('Testing keyboard events on selected cell');
                this.selectedCell.input.focus();
                
                // Simulate pressing 'A' key
                const keydownEvent = new KeyboardEvent('keydown', { key: 'A', bubbles: true });
                this.selectedCell.input.dispatchEvent(keydownEvent);
                
                // Simulate typing 'A'
                this.selectedCell.input.value = 'A';
                const inputEvent = new Event('input', { bubbles: true });
                this.selectedCell.input.dispatchEvent(inputEvent);
                
                console.log('Simulated typing A, check if it appears');
            } else {
                console.log('No selected cell or input field');
            }
        };
        
        // Add a method to force focus on selected cell
        window.forceFocus = () => {
            if (this.selectedCell && this.selectedCell.input) {
                console.log('Forcing focus on selected cell');
                
                // Check if input is in DOM
                if (!document.contains(this.selectedCell.input)) {
                    console.log('Input field is not in DOM, reattaching it');
                    this.selectedCell.element.appendChild(this.selectedCell.input);
                }
                
                // Check input field properties
                console.log('Input field properties:', {
                    display: this.selectedCell.input.style.display,
                    visibility: this.selectedCell.input.style.visibility,
                    opacity: this.selectedCell.input.style.opacity,
                    pointerEvents: this.selectedCell.input.style.pointerEvents,
                    readOnly: this.selectedCell.input.readOnly,
                    disabled: this.selectedCell.input.disabled,
                    tabIndex: this.selectedCell.input.tabIndex
                });
                
                // Set tabIndex to make it focusable
                this.selectedCell.input.tabIndex = 0;
                
                // Try multiple focus methods
                this.selectedCell.input.click();
                this.selectedCell.input.focus();
                
                // Also try focusing the parent cell
                this.selectedCell.element.focus();
                
                setTimeout(() => {
                    if (document.activeElement === this.selectedCell.input) {
                        console.log('Focus forced successfully');
                    } else {
                        console.log('Focus still not working, active element:', document.activeElement);
                        console.log('Trying to recreate input field completely');
                        
                        // Recreate the input field completely
                        const row = parseInt(this.selectedCell.element.dataset.row);
                        const col = parseInt(this.selectedCell.element.dataset.col);
                        this.recreateInputField(row, col);
                    }
                }, 100);
            } else {
                console.log('No selected cell or input field');
            }
        };
        
        // Menu tab switching
        document.querySelectorAll('.menu-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMenuTab(e.target.dataset.tab);
            });
        });

        // Clue tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Grid cell click handling (single/double click via timing)
        const gridContainer = document.getElementById('crosswordGrid');
        gridContainer.addEventListener('click', (e) => {
            const cell = e.target.classList.contains('cell') ? e.target : e.target.closest('.cell');
            if (cell) {
                this.handleCellClick(e);
            }
        });

        // Clue interaction
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('clue-item')) {
                this.selectWordFromClue(e.target);
            }
        });

        // Play tools
        const tools = document.getElementById('playTools');
        if (tools) {
            const bind = (id, fn) => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('click', fn);
            };
            bind('checkCell', () => this.checkSelection('cell'));
            bind('checkWord', () => this.checkSelection('word'));
            bind('checkGrid', () => this.checkSelection('grid'));
            bind('revealLetter', () => this.revealSelection('cell'));
            bind('revealWord', () => this.revealSelection('word'));
            bind('revealGrid', () => this.revealSelection('grid'));
        }

        // Pattern search UI
        const patternInput = document.getElementById('patternInput');
        const patternResults = document.getElementById('patternResults');
        const wordListStatus = document.getElementById('wordListStatus');
        const useCurrentBtn = document.getElementById('useCurrentPattern');
        const searchBtn = document.getElementById('searchPattern');
        const loadWordListBtn = document.getElementById('loadWordList');
        const useOneLookCheckbox = document.getElementById('useOneLook');

        if (loadWordListBtn) {
            loadWordListBtn.addEventListener('click', async () => {
                console.log('Load Dictionary button clicked');
                // First try to load the default dictionary automatically
                if (this.patternWordList.length === 0) {
                    console.log('Pattern word list is empty, trying to load default dictionary');
                    await this.loadDefaultWordList();
                    if (this.patternWordList.length > 0) {
                        console.log('Successfully loaded default dictionary');
                        return; // Successfully loaded default dictionary
                    }
                }
                
                // If default loading failed, show file picker
                console.log('Triggering file picker');
                this.triggerFilePicker();
            });
        } else {
            console.error('Load Dictionary button not found!');
        }

        if (useCurrentBtn) {
            useCurrentBtn.addEventListener('click', () => {
                const cells = this.getCurrentWordCells();
                if (!cells.length) return;
                const pattern = cells.map(cell => (cell.value ? cell.value.toUpperCase() : '?')).join('');
                if (patternInput) patternInput.value = pattern;
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', async () => {
                if (!patternInput || !patternResults) return;
                const pattern = (patternInput.value || '').trim().toUpperCase();
                if (!pattern) {
                    patternResults.innerHTML = '<div style="color:#e53e3e">Enter a pattern</div>';
                    return;
                }
                const useOneLook = !!(useOneLookCheckbox && useOneLookCheckbox.checked);
                let matches = [];
                if (useOneLook) {
                    patternResults.innerHTML = '<div style="color:#718096">Searching OneLook…</div>';
                    try {
                        matches = await this.searchOneLook(pattern);
                    } catch (err) {
                        console.error('OneLook search failed', err);
                        matches = [];
                    }
                } else {
                    patternResults.innerHTML = '<div style="color:#718096">Searching word list…</div>';
                    const regex = this.convertPatternToRegex(pattern);
                    matches = await this.searchPattern(regex, pattern.length);
                }
                this.renderPatternResults(matches);
            });
        }

        // Settings dropdown
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsMenu = document.getElementById('settingsMenu');
        
        if (settingsBtn && settingsMenu) {
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsMenu.classList.toggle('show');
            });
            
            // Close settings menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
                    settingsMenu.classList.remove('show');
                }
            });
        }

        // Settings event listeners
        const skipFilledLettersCheckbox = document.getElementById('skipFilledLetters');
        if (skipFilledLettersCheckbox) {
            // Load current setting
            skipFilledLettersCheckbox.checked = this.settings.skipFilledLetters;
            
            skipFilledLettersCheckbox.addEventListener('change', (e) => {
                this.settings.skipFilledLetters = e.target.checked;
                this.saveSettings();
            });
        }

        // Grid size selector
        const gridSizeSelect = document.getElementById('gridSizeSelect');
        if (gridSizeSelect) {
            gridSizeSelect.value = this.gridSize;
            gridSizeSelect.addEventListener('change', (e) => {
                this.gridSize = parseInt(e.target.value);
                this.settings.gridSize = this.gridSize;
                this.createGrid();
                this.updateClues();
                this.saveSettings();
            });
        }

        // Window resize listener to update grid size
        window.addEventListener('resize', () => {
            this.updateGridSize();
        });

        // Auto Fill button
        const autoFillBtn = document.getElementById('autoFillGrid');
        if (autoFillBtn) {
            autoFillBtn.addEventListener('click', () => {
                this.autoFillGrid();
            });
        }

    }
    
    handleCellClick(e) {
        const cellEl = e.target.classList.contains('cell') ? e.target : e.target.closest('.cell');
        if (!cellEl) return;
    
        const row = parseInt(cellEl.dataset.row);
        const col = parseInt(cellEl.dataset.col);
    
        const now = Date.now();
        if (this.lastClickTime && (now - this.lastClickTime) < 300 && this.lastClickedCell === cellEl) {
            // This is a double-click → toggle typing direction
            this.typingDirection = (this.typingDirection === 'across') ? 'down' : 'across';
            console.log('Typing direction switched to:', this.typingDirection);
        } else {
            // Single click → select the cell
            this.selectCell(row, col);
        }
    
        this.lastClickTime = now;
        this.lastClickedCell = cellEl;
    
        if (this.isEditMode) {
            if (this.grid[row][col] && this.grid[row][col].input) {
                this.grid[row][col].input.focus();
            }
        }

        if (this.typingDirection === 'across' || this.typingDirection === 'down') {
            this.highlightConnectedWords(row, col);
        }
        this.syncActiveClueHighlight();
        
    }
    
    
    handleRightClick(e) {
        const cell = e.target.classList.contains('cell') ? e.target : e.target.closest('.cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        console.log('Right-click detected on cell:', row, col);
        this.toggleBlackSquare(row, col);
    }
    
    handleInput(e) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        let value = (e.target.value || '').slice(0, 1).toUpperCase();
    
        // Keep the input in sync and never replace the DOM
        e.target.value = value;
        this.grid[row][col].value = value;
        // If this cell was marked incorrect previously, clear that mark on edit
        this.grid[row][col].element.classList.remove('incorrect');
    
        // Determine if the current word just became complete
        let completedWord = false;
        let nextClueIndexSnapshot = null;
        const currentWordForCompletion = this.getWordAt(row, col, this.typingDirection);
        if (currentWordForCompletion) {
            completedWord = currentWordForCompletion.cells.every(c => (c.value || '').trim() !== '');
            if (completedWord) {
                nextClueIndexSnapshot = this.activeClueIndex + 1;
            }
        }

        // Auto-advance only when a character is typedelement.textContent = ''
        if (value && this.isEditMode) {
            this.advanceToNextCell(row, col);
        }
    
        this.updateClues();
        this.updateWordDetails();

        // If word is complete, move/highlight to next clue; otherwise ensure highlight persists
        if (completedWord) {
            this.goToClueByIndex(nextClueIndexSnapshot);
        } else {
            this.syncActiveClueHighlight();
        }

        // In play mode, after any input change, check completion
        this.checkPuzzleCompletion();
    
        // Keep the input editable/focused even when cleared
        if (!value) {
            setTimeout(() => {
                this.grid[row][col].input.readOnly = false;
                this.grid[row][col].input.disabled = false;
                this.grid[row][col].input.focus();
            }, 10);
        }
    }
    
    
    handleKeydown(e) {
        // This is now for global keyboard shortcuts only
        switch (e.key) {
            case 'Tab':
                e.preventDefault();
                //this.toggleMode();
                break;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            const order = this.getClueOrder();
            if (order.length === 0) return;
        
            const direction = e.shiftKey ? -1 : 1;
            this.goToClueByIndex(this.activeClueIndex + direction);
        }
        
    }
    
    handleInputKeydown(e) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        
        console.log('Input keydown:', e.key, 'on cell:', row, col);
        
        // If the key is a single letter, replace current cell's value
        if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
            e.preventDefault();
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);

            const value = e.key.toUpperCase();
            this.grid[row][col].value = value;
            this.grid[row][col].input.value = value;
            // Clear incorrect mark on edit
            this.grid[row][col].element.classList.remove('incorrect');

            // Determine if the current word just became complete
            let completedWord = false;
            let nextClueIndexSnapshot = null;
            const currentWordForCompletion = this.getWordAt(row, col, this.typingDirection);
            if (currentWordForCompletion) {
                completedWord = currentWordForCompletion.cells.every(c => (c.value || '').trim() !== '');
                if (completedWord) {
                    nextClueIndexSnapshot = this.activeClueIndex + 1;
                }
            }

            // Automatically move to the next cell like normal typing
            this.advanceToNextCell(row, col);

            this.updateClues();
            this.updateWordDetails();

            // If word is complete, move/highlight to next clue; otherwise ensure highlight persists
            if (completedWord) {
                this.goToClueByIndex(nextClueIndexSnapshot);
            } else {
                this.syncActiveClueHighlight();
            }

            // In play mode, after any input change, check completion
            this.checkPuzzleCompletion();
            return; // Stop further handling of this key
        }

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.selectNextCell(row, col, 'up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.selectNextCell(row, col, 'down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.selectNextCell(row, col, 'left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.selectNextCell(row, col, 'right');
                break;
            case 'Backspace':
                e.preventDefault();
                console.log('Backspace pressed on cell:', row, col, 'Value:', this.grid[row][col].value);
                if (this.grid[row][col].value) {
                    // Clear current cell
                    this.grid[row][col].value = '';
                    this.grid[row][col].input.value = '';
                    console.log('Cleared current cell');
                    // Clear incorrect mark when cleared
                    this.grid[row][col].element.classList.remove('incorrect');
                    
                    // Completely recreate the input field to ensure it's fresh
                    //this.recreateInputField(row, col);
                    
                    this.updateClues();
                    this.updateWordDetails();
                    this.syncActiveClueHighlight();
                    this.checkPuzzleCompletion();
                } else {
                    // Move to previous cell and clear it
                    this.advanceToPreviousCell(row, col);
                    if (this.selectedCell && this.selectedCell.value) {
                        this.selectedCell.value = '';
                        //this.selectedCell.element.textContent = '';
                        this.selectedCell.input.value = '';
                        console.log('Cleared previous cell');
                        // Clear incorrect mark on the cleared previous cell
                        this.selectedCell.element.classList.remove('incorrect');
                        
                        // Recreate the input field for the selected cell
                        //const selectedRow = parseInt(this.selectedCell.element.dataset.row);
                        //const selectedCol = parseInt(this.selectedCell.element.dataset.col);
                        //this.recreateInputField(selectedRow, selectedCol);
                        
                        this.updateClues();
                        this.updateWordDetails();
                        this.syncActiveClueHighlight();
                        this.checkPuzzleCompletion();
                    }
                }
                break;
            case 'Delete':
                e.preventDefault();
                console.log('Delete pressed on cell:', row, col, 'Value:', this.grid[row][col].value);
                // Clear current cell
                this.grid[row][col].value = '';
                this.grid[row][col].input.value = '';
                console.log('Cleared cell with Delete');
                // Clear incorrect mark when cleared
                this.grid[row][col].element.classList.remove('incorrect');
                
                // Completely recreate the input field to ensure it's fresh
                //this.recreateInputField(row, col);
                
                this.updateClues();
                this.updateWordDetails();
                this.syncActiveClueHighlight();
                this.checkPuzzleCompletion();
                break;
            case ' ':
                e.preventDefault();
                console.log('Space bar pressed on cell:', row, col);
                this.toggleBlackSquare(row, col);
                break;
        }
        
        if (this.selectedCell) {
            this.selectedCell.input.focus();
        }
    }
    
    selectCell(row, col) {
        // Clear previous selection
        if (this.selectedCell) {
            this.selectedCell.element.classList.remove('selected');
        }
        
        // Set new selection
        this.selectedCell = this.grid[row][col];
        this.selectedCell.element.classList.add('selected');
        
        // Highlight connected words
        this.highlightConnectedWords(row, col);
        
        this.updateWordDetails();

        // Highlight matching clue
        const activeWord = this.getWordAt(row, col, this.typingDirection);
        if (activeWord) {
            const num = this.getWordNumber(activeWord.startRow, activeWord.startCol);
            this.highlightClue(this.typingDirection, num);

            // Sync activeClueIndex
            const order = this.getClueOrder();
            const clueIndex = order.findIndex(o =>
                o.direction === this.typingDirection &&
                this.words[o.direction][o.index].startRow === activeWord.startRow &&
                this.words[o.direction][o.index].startCol === activeWord.startCol
            );
            if (clueIndex !== -1) {
                this.activeClueIndex = clueIndex;
            }
        }


        
        // Ensure the selected cell's input is properly focused if in edit mode
        // Ensure the selected cell's input is properly focused if in edit mode
        if (this.isEditMode && this.selectedCell) {
            const inp = this.selectedCell.input;

            // If the input reference exists but isn't in the DOM, re-attach it
            if (inp && !this.selectedCell.element.contains(inp)) {
                this.selectedCell.element.appendChild(inp);
            }

            if (inp) {
                inp.readOnly = false;
                inp.disabled = false;
                inp.style.display = 'block';
                inp.style.visibility = 'visible';
                inp.style.pointerEvents = 'auto';
                inp.focus();
            }
        }

        this.updateClues();
        this.syncActiveClueHighlight();


    }
    
    advanceToNextCell(row, col) {
        if (this.typingDirection === 'across') {
            let nextRow = row;
            let nextCol = col + 1;
    
            while (nextRow < this.gridSize) {
                while (nextCol < this.gridSize && this.grid[nextRow][nextCol].isBlack) nextCol++;
                if (nextCol < this.gridSize) {
                    // If skip filled letters is enabled, skip over cells that already have letters
                    if (this.settings.skipFilledLetters && this.grid[nextRow][nextCol].value) {
                        nextCol++;
                        continue;
                    }
                    break;
                }
                nextRow++;
                nextCol = 0;
            }
            if (nextRow < this.gridSize && nextCol < this.gridSize) this.selectCell(nextRow, nextCol);
    
        } else {
            let nextRow = row + 1;
            let nextCol = col;
    
            while (nextCol < this.gridSize) {
                while (nextRow < this.gridSize && this.grid[nextRow][nextCol].isBlack) nextRow++;
                if (nextRow < this.gridSize) {
                    // If skip filled letters is enabled, skip over cells that already have letters
                    if (this.settings.skipFilledLetters && this.grid[nextRow][nextCol].value) {
                        nextRow++;
                        continue;
                    }
                    break;
                }
                nextCol++;
                nextRow = 0;
            }
            if (nextRow < this.gridSize && nextCol < this.gridSize) this.selectCell(nextRow, nextCol);
        }
    
        // 🔑 Now that selection moved, rebuild clues & apply highlight deterministically
        this.syncActiveClueHighlight();
    }
    
    

    getClueOrder() {
        const order = [];
    
        // Across first
        this.words.across.forEach((word, index) => {
            order.push({
                direction: 'across',
                index: index,
                number: this.getWordNumber(word.startRow, word.startCol)
            });
        });
    
        // Then Down
        this.words.down.forEach((word, index) => {
            order.push({
                direction: 'down',
                index: index,
                number: this.getWordNumber(word.startRow, word.startCol)
            });
        });
    
        return order;
    }
    

    highlightClue(direction, number) {
        // Remove highlight from all clues
        document.querySelectorAll('.clue-item').forEach(item => {
            item.classList.remove('selected');
        });
    
        // Find the clue that matches
        const clueList = document.getElementById(`${direction}Clues`);
        const clue = Array.from(clueList.querySelectorAll('.clue-item'))
            .find(item => {
                const numSpan = item.querySelector('.clue-number');
                return numSpan && parseInt(numSpan.textContent) === number;
            });
    
        if (clue) {
            clue.classList.add('selected');
            clue.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    
    
    toggleBlackSquare(row, col) {
        const cell = this.grid[row][col];
    
        // Calculate the symmetrical position
        const symRow = this.gridSize - 1 - row;
        const symCol = this.gridSize - 1 - col;
        const symCell = this.grid[symRow][symCol];
    
        // Determine the new black state (toggle from current)
        const newIsBlack = !cell.isBlack;
    
        // Apply to both the clicked cell and its symmetrical cell
        [ [row, col, cell], [symRow, symCol, symCell] ].forEach(([r, c, targetCell]) => {
            targetCell.isBlack = newIsBlack;
            targetCell.element.classList.toggle('black', newIsBlack);
    
            // Ensure input exists in the DOM
            if (targetCell.input && !targetCell.element.contains(targetCell.input)) {
                targetCell.element.appendChild(targetCell.input);
            }
    
            targetCell.value = '';
            targetCell.input.value = '';
    
            targetCell.input.readOnly = newIsBlack;
            targetCell.input.disabled = newIsBlack;
            targetCell.input.style.display = newIsBlack ? 'none' : 'block';
            targetCell.input.style.visibility = newIsBlack ? 'hidden' : 'visible';
        });
    
        this.updateClues();
        this.updateWordDetails();
    }
    
    
    
    selectNextCell(row, col, direction) {
        let newRow = row;
        let newCol = col;
        
        switch (direction) {
            case 'up':
                newRow = Math.max(0, row - 1);
                break;
            case 'down':
                newRow = Math.min(this.gridSize - 1, row + 1);
                break;
            case 'left':
                newCol = Math.max(0, col - 1);
                break;
            case 'right':
                newCol = Math.min(this.gridSize - 1, col + 1);
                break;
        }
        
        // If the target cell is black, try to find the next non-black cell
        if (this.grid[newRow][newCol].isBlack) {
            // Try to find the next available cell in that direction
            let attempts = 0;
            const maxAttempts = this.gridSize;
            
            while (this.grid[newRow][newCol].isBlack && attempts < maxAttempts) {
                attempts++;
                switch (direction) {
                    case 'up':
                        newRow = Math.max(0, newRow - 1);
                        break;
                    case 'down':
                        newRow = Math.min(this.gridSize - 1, newRow + 1);
                        break;
                    case 'left':
                        newCol = Math.max(0, newCol - 1);
                        break;
                    case 'right':
                        newCol = Math.min(this.gridSize - 1, newCol + 1);
                        break;
                }
            }
        }
        
        this.selectCell(newRow, newCol);
    }
    
    
    testDelete() {
        if (this.selectedCell) {
            console.log('Testing delete on selected cell');
            this.selectedCell.value = '';
            //this.selectedCell.element.textContent = '';
            this.selectedCell.input.value = '';
            
            // Reset the input field for the selected cell
            const selectedRow = parseInt(this.selectedCell.element.dataset.row);
            const selectedCol = parseInt(this.selectedCell.element.dataset.col);
            this.recreateInputField(selectedRow, selectedCol);
            
            this.updateClues();
            this.updateWordDetails();
            
            alert('Test delete completed. Try clicking on the cell and typing to see if it works.');
        } else {
            alert('Please select a cell first by clicking on it.');
        }
    }
    
    recreateInputField(row, col) {
        console.log('Recreating input field for cell:', row, col);
        
        const cell = this.grid[row][col];
        
        if (!cell) {
            console.error('Cell is null for:', row, col);
            return;
        }
        
        // If input field is null or missing, recreate it completely
        if (!cell.input) {
            console.log('Input field is null, recreating it');
            
            // Create a new input field
            const newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.maxLength = 1;
            newInput.dataset.row = row;
            newInput.dataset.col = col;
            
            // Add event listeners
            newInput.addEventListener('keydown', (e) => {
                this.handleInputKeydown(e);
            });
            
            newInput.addEventListener('input', (e) => {
                this.handleInput(e);
            });
            
            // Add to the cell
            cell.element.appendChild(newInput);
            cell.input = newInput;
            
            console.log('New input field created and attached');
        }
        
        // Reset the input field properties
        cell.input.value = '';
        cell.input.readOnly = false;
        cell.input.disabled = false;
        cell.input.style.display = 'block';
        cell.input.style.visibility = 'visible';
        cell.input.style.opacity = '1';
        cell.input.style.pointerEvents = 'auto';
        
        // Remove any attributes that might block input
        cell.input.removeAttribute('disabled');
        cell.input.removeAttribute('readonly');
        
        // Force select this cell to ensure it's properly configured
        this.selectCell(row, col);
        
        // Ensure the cell is properly selected and the input is ready
        this.selectedCell = cell;
        
        // Focus the input field with multiple attempts
        if (cell.input) {
            // Try immediate focus
            cell.input.focus();
            
            // Also try with a timeout to ensure DOM is ready
            setTimeout(() => {
                cell.input.focus();
                console.log('Input field focused with timeout');
                
                // Verify focus
                if (document.activeElement === cell.input) {
                    console.log('Input field is properly focused after timeout');
                } else {
                    console.log('Input field still not focused, trying click focus');
                    cell.input.click();
                    cell.input.focus();
                }
            }, 50);
            
            console.log('Input field reset and ready for input');
        } else {
            console.error('Input field is still null after reset');
        }
    }
    
    testInput() {
        if (this.selectedCell) {
            console.log('Testing input on selected cell');
            
            // If input field is null, try to recreate it
            if (!this.selectedCell.input) {
                console.log('Input field is null, attempting to recreate it');
                const row = parseInt(this.selectedCell.element.dataset.row);
                const col = parseInt(this.selectedCell.element.dataset.col);
                this.recreateInputField(row, col);
                
                // Check if recreation worked
                if (!this.selectedCell.input) {
                    console.error('Failed to recreate input field');
                    alert('Failed to recreate input field. Please try clicking on a different cell.');
                    return;
                }
            }
            
            console.log('Input field properties:', {
                readOnly: this.selectedCell.input.readOnly,
                disabled: this.selectedCell.input.disabled,
                display: this.selectedCell.input.style.display,
                value: this.selectedCell.input.value
            });
            
            // Try to focus and type
            this.selectedCell.input.focus();
            console.log('Input field focused');
            
            // Test if we can set a value
            this.selectedCell.input.value = 'TEST';
            console.log('Value set to TEST');
            
            // Try to trigger input event
            const inputEvent = new Event('input', { bubbles: true });
            this.selectedCell.input.dispatchEvent(inputEvent);
            console.log('Input event dispatched');
            
            alert('Input test completed. Check console for details and see if "TEST" appears in the cell.');
        } else {
            console.log('No selected cell');
            alert('Please select a cell first by clicking on it.');
        }
    }
    

    
    advanceToPreviousCell(row, col) {
        if (this.typingDirection === 'across') {
            if (col > 0) {
                this.selectCell(row, col - 1);
            } else if (row > 0) {
                this.selectCell(row - 1, this.gridSize - 1);
            }
        } else if (this.typingDirection === 'down') {
            if (row > 0) {
                this.selectCell(row - 1, col);
            } else if (col > 0) {
                this.selectCell(this.gridSize - 1, col - 1);
            }
        }
    }
    
    
    highlightConnectedWords(row, col) {
        // Clear previous highlights
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('highlighted');
        });
    
        // Highlight only the current typing direction
        const word = this.getWordAt(row, col, this.typingDirection);
        if (word) {
            word.cells.forEach(cell => {
                cell.element.classList.add('highlighted');
            });
        }
    }

    goToClueByIndex(index) {
        const order = this.getClueOrder();
        if (order.length === 0) return;
    
        // Wrap around if needed
        if (index < 0) index = order.length - 1;
        if (index >= order.length) index = 0;
    
        this.activeClueIndex = index;
    
        const { direction, index: wordIndex } = order[this.activeClueIndex];
        const word = this.words[direction][wordIndex];
    
        if (word) {
            this.typingDirection = direction;
            this.selectCell(word.startRow, word.startCol);
    
            // Highlight clue
            const clueList = document.getElementById(`${direction}Clues`);
            const clueEl = clueList.querySelectorAll('.clue-item')[wordIndex];
            if (clueEl) {
                document.querySelectorAll('.clue-item').forEach(item => {
                    item.classList.remove('selected');
                });
                clueEl.classList.add('selected');
                clueEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    
    
    
    getWordAt(row, col, direction) {
        if (this.grid[row][col].isBlack) return null;
        
        const cells = [];
        let startRow = row, startCol = col;
        
        if (direction === 'across') {
            // Find start of word
            while (startCol > 0 && !this.grid[startRow][startCol - 1].isBlack) {
                startCol--;
            }
            
            // Collect all cells in the word
            for (let c = startCol; c < this.gridSize && !this.grid[startRow][c].isBlack; c++) {
                cells.push(this.grid[startRow][c]);
            }
        } else {
            // Find start of word
            while (startRow > 0 && !this.grid[startRow - 1][startCol].isBlack) {
                startRow--;
            }
            
            // Collect all cells in the word
            for (let r = startRow; r < this.gridSize && !this.grid[r][startCol].isBlack; r++) {
                cells.push(this.grid[r][startCol]);
            }
        }
        
        if (cells.length < 2) return null;
        
        return {
            cells: cells,
            word: cells.map(cell => cell.value || ' ').join(''),
            startRow: startRow,
            startCol: startCol,
            direction: direction
        };
    }
    
    updateClues() {
        this.generateNumbers();

        this.words.across = [];
        this.words.down = [];
        
        // Find all words
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (!this.grid[row][col].isBlack) {
                    // Check if this is the start of an across word
                    if (col === 0 || this.grid[row][col - 1].isBlack) {
                        const word = this.getWordAt(row, col, 'across');
                        if (word && word.cells.length > 1) {
                            this.words.across.push(word);
                        }
                    }
                    
                    // Check if this is the start of a down word
                    if (row === 0 || this.grid[row - 1][col].isBlack) {
                        const word = this.getWordAt(row, col, 'down');
                        if (word && word.cells.length > 1) {
                            this.words.down.push(word);
                        }
                    }
                }
            }
        }
        
        // Update clue displays
        this.updateClueDisplay('across');
        this.updateClueDisplay('down');
    }
    
    updateClueDisplay(direction) {
        const clueList = document.getElementById(`${direction}Clues`);
        clueList.innerHTML = '';
    
        this.words[direction].forEach((word, index) => {
            const clueItem = document.createElement('div');
            clueItem.className = 'clue-item';
            clueItem.dataset.direction = direction;
            clueItem.dataset.index = index;
            clueItem.dataset.startRow = word.startRow;
            clueItem.dataset.startCol = word.startCol;
    
            // ✅ define the number once and reuse it
            const wordNumber = this.getWordNumber(word.startRow, word.startCol);
            clueItem.dataset.number = String(wordNumber);
    
            const displayWord = word.word.replace(/\s/g, '•');
            const clueText = this.clues[direction][wordNumber] || '';
    
            clueItem.innerHTML = `
                <span class="clue-number">${wordNumber}.</span>
                <span class="clue-text">${clueText || displayWord}</span>
            `;
    
            clueList.appendChild(clueItem);
        });
    }
    
    
    getWordNumber(row, col) {
        if (!this.numberGrid) this.generateNumbers();
        return this.numberGrid[row][col] || '';
    }

    syncActiveClueHighlight() {
        if (!this.selectedCell) return;
    
        const r = +this.selectedCell.element.dataset.row;
        const c = +this.selectedCell.element.dataset.col;
    
        const dir = this.typingDirection;
        const word = this.getWordAt(r, c, dir);
        if (!word) return;
    
        // Find index of this word
        const wordIndex = this.words[dir].findIndex(
            w => w.startRow === word.startRow && w.startCol === word.startCol
        );
        if (wordIndex === -1) return;
    
        // Update activeClueIndex for Tab navigation
        const order = this.getClueOrder();
        const idxInOrder = order.findIndex(o => o.direction === dir && o.index === wordIndex);
        if (idxInOrder !== -1) this.activeClueIndex = idxInOrder;
    
        // Clear previous selection & highlight
        document.querySelectorAll('.clue-item').forEach(el => el.classList.remove('selected'));
        const list = document.getElementById(`${dir}Clues`);
        const el = list?.querySelector(`.clue-item[data-direction="${dir}"][data-index="${wordIndex}"]`);
        if (el) {
            el.classList.add('selected');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    
    

    generateNumbers() {
        let num = 1;
        this.numberGrid = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(null));
      
        // Clear all visible numbers first
        for (let r = 0; r < this.gridSize; r++) {
          for (let c = 0; c < this.gridSize; c++) {
            const span = this.grid[r][c].element.querySelector('.cell-number');
            if (span) span.textContent = '';
          }
        }
      
        // Assign numbers
        for (let row = 0; row < this.gridSize; row++) {
          for (let col = 0; col < this.gridSize; col++) {
            if (this.grid[row][col].isBlack) continue;
      
            const startsAcross = (col === 0 || this.grid[row][col - 1].isBlack) &&
                                 (col + 1 < this.gridSize && !this.grid[row][col + 1].isBlack);
            const startsDown   = (row === 0 || this.grid[row - 1][col].isBlack) &&
                                 (row + 1 < this.gridSize && !this.grid[row + 1][col].isBlack);
      
            if (startsAcross || startsDown) {
              this.numberGrid[row][col] = num;
              const span = this.grid[row][col].element.querySelector('.cell-number');
              if (span) span.textContent = String(num);
              num++;
            }
          }
        }
    }
      
    
    
    selectWordFromClue(clueElement) {
        const direction = clueElement.dataset.direction;
        const index = parseInt(clueElement.dataset.index);
        const word = this.words[direction][index];
    
        if (word) {
            // Set typing direction based on clicked clue
            this.typingDirection = direction;
    
            // Select the first cell of the word
            this.selectCell(word.startRow, word.startCol);
    
            // Highlight the clue in the list
            document.querySelectorAll('.clue-item').forEach(item => {
                item.classList.remove('selected');
            });
            clueElement.classList.add('selected');
    
            // Scroll clue into view
            clueElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }

        // Update activeClueIndex so Tab starts from here
        const order = this.getClueOrder();
        const clickedIndex = order.findIndex(o =>
            o.direction === direction && o.index === index
        );
        if (clickedIndex !== -1) {
            this.activeClueIndex = clickedIndex;
        }

    }
    
    
    updateWordDetails() {
        const detailsContainer = document.getElementById('wordDetails');
        
        if (!this.selectedCell) {
            detailsContainer.innerHTML = '<p>Select a word to see details</p>';
            return;
        }
        
        const row = parseInt(this.selectedCell.element.dataset.row);
        const col = parseInt(this.selectedCell.element.dataset.col);
        
        const acrossWord = this.getWordAt(row, col, 'across');
        const downWord = this.getWordAt(row, col, 'down');
        
        let details = '';
        
        if (acrossWord) {
            details += `
                <div class="word-detail">
                    <strong>Across:</strong> ${acrossWord.word.replace(/\s/g, '•')} (${acrossWord.cells.length} letters)
                </div>
            `;
        }
        
        if (downWord) {
            details += `
                <div class="word-detail">
                    <strong>Down:</strong> ${downWord.word.replace(/\s/g, '•')} (${downWord.cells.length} letters)
                </div>
            `;
        }
        
        if (!details) {
            details = '<p>No word found at this position</p>';
        }
        
        detailsContainer.innerHTML = details;

        const dir = this.typingDirection;
        const activeWord = dir === 'across' ? acrossWord : downWord;
        if (activeWord) {
            const num = this.getWordNumber(activeWord.startRow, activeWord.startCol);
            document.getElementById('clueInput').value = this.clues[dir][num] || '';
        } else {
            document.getElementById('clueInput').value = '';
}

    }
    
    
    clearGrid() {
        if (confirm('Are you sure you want to clear the entire grid?')) {
            console.log('Clearing grid...');
            
            // Ensure we're in edit mode
            if (!this.isEditMode) {
                console.log('Switching to edit mode');
                this.isEditMode = true;
                document.getElementById('currentMode').textContent = 'Edit';
                document.getElementById('toggleMode').textContent = 'View Mode';
            }
            
            // Simply recreate the entire grid
            this.createGrid();
            this.updateClues();
            
            console.log('Grid cleared and recreated');
        }
    }
    
    
    switchMenuTab(tab) {
        // Update menu tab buttons
        document.querySelectorAll('.menu-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update menu tab content
        document.querySelectorAll('.menu-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}Tab`).classList.add('active');
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update clue lists
        document.querySelectorAll('.clue-list').forEach(list => {
            list.classList.remove('active');
        });
        document.getElementById(`${tab}Clues`).classList.add('active');
    }
    
    newCrossword() {
        if (confirm('Are you sure you want to create a new crossword? This will clear the current grid.')) {
            this.createGrid();
            this.updateClues();
        }
    }
    
    saveCrossword() {
        const data = {
            grid: this.grid.map(row => 
                row.map(cell => ({
                    value: cell.value,
                    isBlack: cell.isBlack
                }))
            ),
            clues: this.clues,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crossword-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    loadCrossword(playMode = false) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.loadGridData(data, playMode);
                    } catch (error) {
                        alert('Error loading file: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    
    loadGridData(data, playMode = false) {
        if (data.grid && data.grid.length === this.gridSize) {
			// Set mode and prepare solution grid if playing
			this.isPlayMode = !!playMode;
			this.puzzleCompleted = false;
			if (this.isPlayMode) {
				// Snapshot the solution from the loaded data
				this.solutionGrid = data.grid.map(row =>
					row.map(cell => cell.isBlack ? null : ((cell.value || '').toUpperCase()))
				);
			} else {
				this.solutionGrid = null;
			}

            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    const cellData = data.grid[row][col];
                    const cell = this.grid[row][col];
    
                    if (cell.input && !cell.element.contains(cell.input)) {
                        cell.element.appendChild(cell.input);
                    }
    
                    cell.isBlack = !!cellData.isBlack;
                    cell.element.classList.toggle('black', cell.isBlack);
    
                    if (cell.isBlack) {
                        cell.input.readOnly = true;
                        cell.input.disabled = true;
                        cell.input.style.display = 'none';
                        cell.input.style.visibility = 'hidden';
                    } else {
                        cell.input.readOnly = !this.isEditMode;
                        cell.input.disabled = false;
                        cell.input.style.display = 'block';
                        cell.input.style.visibility = 'visible';
                    }
    
					// In play mode, leave it blank; otherwise restore saved letters
					cell.value = playMode ? '' : (cellData.value || '');
					cell.input.value = playMode ? '' : (cellData.value || '');
                }
            }
    
            if (data.clues) {
                this.clues = data.clues;
            }
    
            this.updateClues();

            // Start timer when entering play mode after load
            if (this.isPlayMode) {
                this.resetTimer();
                this.startTimer();
                const tools = document.getElementById('playTools');
                if (tools) tools.style.display = 'flex';
            }
        }
    }

	// Check if the user has completed the puzzle correctly (play mode only)
	checkPuzzleCompletion() {
		if (!this.isPlayMode || !this.solutionGrid || this.puzzleCompleted) return;

		for (let r = 0; r < this.gridSize; r++) {
			for (let c = 0; c < this.gridSize; c++) {
				const sol = this.solutionGrid[r][c];
				if (sol === null) continue; // black square
				const val = (this.grid[r][c].value || '').toUpperCase();
				if (!val || val !== sol) {
					return; // not complete or incorrect yet
				}
			}
		}

		this.puzzleCompleted = true;
		this.showCompletionOverlay();
		this.stopTimer();
	}

	showCompletionOverlay() {
		if (document.getElementById('completionOverlay')) return;

		const overlay = document.createElement('div');
		overlay.id = 'completionOverlay';
		overlay.style.position = 'fixed';
		overlay.style.inset = '0';
		overlay.style.background = 'rgba(0,0,0,0.6)';
		overlay.style.display = 'flex';
		overlay.style.alignItems = 'center';
		overlay.style.justifyContent = 'center';
		overlay.style.zIndex = '9999';

		const card = document.createElement('div');
		card.style.background = 'white';
		card.style.borderRadius = '12px';
		card.style.padding = '24px 28px';
		card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
		card.style.textAlign = 'center';
		card.style.maxWidth = '420px';
		card.style.margin = '16px';

		const title = document.createElement('div');
		title.textContent = '🎉 Puzzle Completed!';
		title.style.fontSize = '22px';
		title.style.fontWeight = '700';
		title.style.marginBottom = '8px';
		title.style.color = '#2d3748';

		const msg = document.createElement('div');
		msg.textContent = 'Great job, you solved the crossword correctly.';
		msg.style.fontSize = '16px';
		msg.style.color = '#4a5568';
		msg.style.marginBottom = '16px';

		const btn = document.createElement('button');
		btn.textContent = 'Close';
		btn.className = 'btn primary';
		btn.style.padding = '10px 16px';
		btn.style.border = 'none';
		btn.style.background = '#667eea';
		btn.style.color = 'white';
		btn.style.borderRadius = '8px';
		btn.style.cursor = 'pointer';
		btn.addEventListener('click', () => overlay.remove());

		card.appendChild(title);
		card.appendChild(msg);
		card.appendChild(btn);
		overlay.appendChild(card);
		document.body.appendChild(overlay);

		// Hide tools on completion
		const tools = document.getElementById('playTools');
		if (tools) tools.style.display = 'none';
	}
    
    
    exportCrossword() {
        const gridText = this.grid.map(row => 
            row.map(cell => cell.isBlack ? '#' : (cell.value || '.')).join('')
        ).join('\n');
        
        const cluesText = this.generateCluesText();
        
        const exportText = `CROSSWORD PUZZLE\n\nGRID:\n${gridText}\n\nCLUES:\n${cluesText}`;
        
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crossword-export-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    generateCluesText() {
        let text = 'ACROSS:\n';
        this.words.across.forEach((word, index) => {
            const number = this.getWordNumber(word.startRow, word.startCol);
            text += `${number}. ${word.word.replace(/\s/g, '•')}\n`;
        });
        
        text += '\nDOWN:\n';
        this.words.down.forEach((word, index) => {
            const number = this.getWordNumber(word.startRow, word.startCol);
            text += `${number}. ${word.word.replace(/\s/g, '•')}\n`;
        });
        
        return text;
    }

    // ===== Timer helpers =====
    startTimer() {
        if (this.timerRunning) return;
        this.timerRunning = true;
        this.timerStartEpoch = Date.now() - this.timerElapsedMs;
        this.timerIntervalId = setInterval(() => this.tickTimer(), 1000);
        this.tickTimer();
    }

    stopTimer() {
        if (!this.timerRunning) return;
        this.timerRunning = false;
        clearInterval(this.timerIntervalId);
        this.timerIntervalId = null;
        this.tickTimer();
    }

    resetTimer() {
        this.timerElapsedMs = 0;
        if (this.timerRunning) {
            this.timerStartEpoch = Date.now();
        }
        this.updateTimerDisplay();
    }

    tickTimer() {
        if (this.timerRunning) {
            this.timerElapsedMs = Date.now() - this.timerStartEpoch;
        }
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const el = document.getElementById('timerDisplay');
        if (!el) return;
        el.textContent = this.formatTime(this.timerElapsedMs);
    }

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // ===== Check / Reveal =====
    getCurrentWordCells() {
        if (!this.selectedCell) return [];
        const r = +this.selectedCell.element.dataset.row;
        const c = +this.selectedCell.element.dataset.col;
        const word = this.getWordAt(r, c, this.typingDirection);
        return word ? word.cells : [];
    }

    checkSelection(scope) {
        if (!this.isPlayMode || !this.solutionGrid) return;
        const clearMarks = () => {
            document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('incorrect'));
        };
        clearMarks();

        const markIncorrect = (cells) => {
            cells.forEach(cell => {
                const r = +cell.element.dataset.row;
                const c = +cell.element.dataset.col;
                const sol = this.solutionGrid[r][c];
                if (sol === null) return;
                const val = (cell.value || '').toUpperCase();
                if (val && val !== sol) {
                    cell.element.classList.add('incorrect');
                }
            });
        };

        if (scope === 'cell' && this.selectedCell) {
            markIncorrect([this.selectedCell]);
        } else if (scope === 'word') {
            markIncorrect(this.getCurrentWordCells());
        } else if (scope === 'grid') {
            const all = [];
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (!this.grid[r][c].isBlack) all.push(this.grid[r][c]);
                }
            }
            markIncorrect(all);
        }
    }

    revealSelection(scope) {
        if (!this.isPlayMode || !this.solutionGrid) return;
        const revealCells = (cells) => {
            cells.forEach(cell => {
                const r = +cell.element.dataset.row;
                const c = +cell.element.dataset.col;
                const sol = this.solutionGrid[r][c];
                if (sol === null) return;
                cell.value = sol;
                cell.input.value = sol;
                cell.element.classList.add('revealed');
                // Clear incorrect mark if present
                cell.element.classList.remove('incorrect');
            });
        };

        if (scope === 'cell' && this.selectedCell) {
            revealCells([this.selectedCell]);
        } else if (scope === 'word') {
            revealCells(this.getCurrentWordCells());
        } else if (scope === 'grid') {
            const all = [];
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (!this.grid[r][c].isBlack) all.push(this.grid[r][c]);
                }
            }
            revealCells(all);
        }

        this.updateClues();
        this.updateWordDetails();
        this.syncActiveClueHighlight();
        this.checkPuzzleCompletion();
    }

    // ===== Pattern Search =====
    convertPatternToRegex(pattern) {
        // ? matches one letter A-Z; letters are fixed; ignore non A-Z/?
        const safe = pattern.replace(/[^A-Z?]/g, '').replace(/\?/g, '[A-Z]');
        return new RegExp(`^${safe}$`, 'i');
    }

    async searchPattern(regex, length) {
        // Ensure dictionary is loaded
        if (this.patternWordList.length === 0) {
            await this.ensureDictionaryLoaded();
        }
        
        // Use loaded word list if available; otherwise derive from grid entries
        let candidates = [];
        if (Array.isArray(this.patternWordList) && this.patternWordList.length > 0) {
            candidates = this.patternWordList;
        } else {
            const set = new Set();
            for (const dir of ['across', 'down']) {
                for (const w of this.words[dir]) {
                    set.add(w.word.replace(/\s/g, '').toUpperCase());
                }
            }
            candidates = Array.from(set);
        }
        
        // Filter and score words
        const matches = candidates
            .filter(w => w.length === length && regex.test(w))
            .map(word => {
                // Extract score from word list format (word:score or word;score)
                const colonParts = word.split(':');
                const semicolonParts = word.split(';');
                
                if (colonParts.length === 2) {
                    return {
                        word: colonParts[0].toUpperCase(),
                        score: parseInt(colonParts[1]) || 0
                    };
                } else if (semicolonParts.length === 2) {
                    return {
                        word: semicolonParts[0].toUpperCase(),
                        score: parseInt(semicolonParts[1]) || 0
                    };
                }
                return {
                    word: word.toUpperCase(),
                    score: 0
                };
            })
            .sort((a, b) => b.score - a.score); // Sort by score (highest first)
        
        return matches;
    }

    renderPatternResults(matches) {
        const el = document.getElementById('patternResults');
        if (!el) return;
        if (!matches || matches.length === 0) {
            el.innerHTML = '<div style="color:#718096">No matches</div>';
            return;
        }
        
        el.innerHTML = matches
            .slice(0, 100) // Show top 100 results
            .map(match => {
                const word = match.word || match;
                const score = match.score !== undefined ? match.score : '';
                const scoreDisplay = score ? ` <span style="color:#666;font-size:11px;">(${score})</span>` : '';
                return `<div class="pattern-result-item" data-word="${word}">${word}${scoreDisplay}</div>`;
            })
            .join('');

        // Click a result to fill current word (play or edit)
        el.querySelectorAll('.pattern-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const word = item.getAttribute('data-word') || '';
                const cells = this.getCurrentWordCells();
                if (!cells.length) return;
                for (let i = 0; i < cells.length && i < word.length; i++) {
                    const letter = word[i].toUpperCase();
                    cells[i].value = letter;
                    cells[i].input.value = letter;
                    cells[i].element.classList.remove('incorrect');
                }
                this.updateClues();
                this.updateWordDetails();
                this.syncActiveClueHighlight();
                this.checkPuzzleCompletion();
            });
        });
    }

    async searchOneLook(pattern) {
        // Convert ? to ? for OneLook's pattern; keep letters as-is
        // Use Datamuse API compatible endpoint for wildcard matching
        // We'll call: https://api.datamuse.com/words?sp=PATTERN&max=500
        const sp = encodeURIComponent(pattern.replace(/[^A-Z?]/g, '').toLowerCase());
        const url = `https://api.datamuse.com/words?sp=${sp}&max=500`;
        const resp = await fetch(url, { mode: 'cors' });
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}`);
        }
        const data = await resp.json();
        // Data items like { word: 'apple', score: ..., tags: [...] }
        // Filter exact length and alphabetic words, uppercase
        return data
            .map(d => (d && d.word ? d.word : ''))
            .filter(Boolean)
            .map(w => w.toUpperCase())
            .filter(w => w.length === pattern.replace(/[^A-Z?]/g, '').length)
            .filter(w => /^[A-Z]+$/.test(w));
    }

    // Auto-fill the grid using the dedicated module
    async autoFillGrid() {
        if (!this.autoFill) {
            alert('Auto-fill module not available. Please refresh the page.');
            return;
        }

        // Ensure dictionary is loaded first
        if (this.patternWordList.length === 0) {
            await this.ensureDictionaryLoaded();
        }

        if (!Array.isArray(this.patternWordList) || this.patternWordList.length === 0) {
            alert('Please load a word list first to use auto-fill.');
            return;
        }

        // Set the word list in the auto-fill module
        this.autoFill.setWordList(this.patternWordList);

        // Show grid statistics
        const stats = this.autoFill.getGridStats();
        console.log(`Grid stats: ${stats.filledWords}/${stats.totalWords} words filled (${stats.completionPercentage}%)`);

        if (stats.emptyWords === 0) {
            alert('Grid is already complete!');
            return;
        }

        // Show progress
        const progressMsg = `Starting auto-fill...\n${stats.emptyWords} words to fill\n${stats.filledWords}/${stats.totalWords} already complete`;
        console.log(progressMsg);

        try {
            const result = await this.autoFill.autoFillGrid();
            
            if (result.success) {
                alert(result.message);
                // Update the UI
                this.updateClues();
                this.updateWordDetails();
                this.checkPuzzleCompletion();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Auto-fill error:', error);
            alert('Auto-fill failed: ' + error.message);
        }
    }


    async loadDefaultWordList() {
        console.log('=== DICTIONARY LOADING DEBUG ===');
        console.log('Current working directory:', window.location.href);
        console.log('Attempting to load spreadthewordlist.dict...');
        
        // Check if we're running from a server (http/https) or local file (file://)
        const isLocalFile = window.location.protocol === 'file:';
        
        if (isLocalFile) {
            console.log('Running from local file - browsers block fetch() for security');
            this.updateWordListStatus('Local file mode - click "Load Dictionary" to select spreadthewordlist.dict');
            
            // Automatically trigger the file picker for local files
            setTimeout(() => {
                this.triggerFilePicker();
            }, 1000);
            return;
        }
        
        try {
            // Try to load the dictionary file from server
            const response = await fetch('./spreadthewordlist.dict');
            console.log('Fetch response status:', response.status);
            console.log('Fetch response ok:', response.ok);
            
            if (!response.ok) {
                console.log('Dictionary file not found at ./spreadthewordlist.dict');
                this.patternWordList = [];
                this.updateWordListStatus('Dictionary not found - click "Load Dictionary" to select file');
                return;
            }
            
            const text = await response.text();
            console.log('Raw text length:', text.length);
            console.log('First 200 characters:', text.substring(0, 200));
            
            // Parse the dictionary
            this.parseDictionaryText(text);
            
        } catch (error) {
            console.error('Error loading default word list:', error);
            this.patternWordList = [];
            this.updateWordListStatus('Error loading dictionary - click "Load Dictionary" to select file manually');
        }
    }

    /**
     * Ensure dictionary is loaded, load it if needed
     */
    async ensureDictionaryLoaded() {
        if (this.patternWordList.length > 0) {
            return; // Already loaded
        }
        
        console.log('Dictionary not loaded, attempting to load...');
        this.updateWordListStatus('Loading dictionary...');
        
        // Check if we're running from a server (http/https) or local file (file://)
        const isLocalFile = window.location.protocol === 'file:';
        
        if (isLocalFile) {
            // For local files, browsers block fetch() for security reasons
            // Use the file picker to let user select the dictionary file
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.txt,.dict';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            try {
                                const text = e.target.result;
                                this.parseDictionaryText(text);
                                this.updateWordListStatus(`Loaded ${this.patternWordList.length} words from ${file.name}`);
                                console.log(`Successfully loaded ${this.patternWordList.length} words from file`);
                                resolve();
                            } catch (error) {
                                console.error('Error parsing file:', error);
                                this.updateWordListStatus('Error parsing file');
                                resolve();
                            }
                        };
                        reader.readAsText(file);
                    } else {
                        resolve();
                    }
                };
                input.click();
            });
        } else {
            // For server, try to fetch the dictionary
            try {
                const response = await fetch('./spreadthewordlist.dict');
                if (response.ok) {
                    const text = await response.text();
                    this.parseDictionaryText(text);
                    this.updateWordListStatus(`Loaded ${this.patternWordList.length} words from spreadthewordlist.dict`);
                } else {
                    this.updateWordListStatus('Dictionary not found on server');
                }
            } catch (error) {
                console.error('Error loading dictionary:', error);
                this.updateWordListStatus('Error loading dictionary');
            }
        }
    }

    /**
     * Parse dictionary text and populate patternWordList
     */
    parseDictionaryText(text) {
        const lines = text.split('\n').filter(line => line.trim());
        console.log('Total lines:', lines.length);
        console.log('First 5 lines:', lines.slice(0, 5));
        
        // Simple parsing - just split by semicolon
        this.patternWordList = [];
        let validWords = 0;
        let errors = 0;
        
        for (const line of lines) {
            if (errors > 100) break;
            
            const parts = line.split(';');
            if (parts.length >= 1) {
                const word = parts[0].trim().toUpperCase();
                const score = parts.length >= 2 ? parseInt(parts[1].trim()) || 50 : 50;
                
                if (word && word.length > 0 && /^[A-Z]+$/.test(word)) {
                    this.patternWordList.push(`${word};${score}`);
                    validWords++;
                } else {
                    errors++;
                }
            }
        }
        
        console.log(`Parsed ${validWords} valid words, ${errors} errors`);
        console.log('First 5 parsed words:', this.patternWordList.slice(0, 5));
        
        this.updateWordListStatus(`Loaded ${this.patternWordList.length} words from spreadthewordlist.dict`);
        console.log('=== DICTIONARY LOADING COMPLETE ===');
    }

    /**
     * Trigger file picker for dictionary loading
     */
    triggerFilePicker() {
        console.log('triggerFilePicker called');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.dict';
        console.log('File input created, clicking...');
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const text = e.target.result;
                        this.parseDictionaryText(text);
                        this.updateWordListStatus(`Loaded ${this.patternWordList.length} words from ${file.name}`);
                        console.log(`Successfully loaded ${this.patternWordList.length} words from file`);
                        
                    } catch (error) {
                        console.error('Error parsing file:', error);
                        this.updateWordListStatus('Error parsing file');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    /**
     * Normalize word like the Rust implementation
     */
    normalizeWord(word) {
        return word
            .toLowerCase()
            .replace(/[^a-z]/g, '') // Remove non-letters
            .toUpperCase();
    }

    updateWordListStatus(message) {
        const statusEl = document.getElementById('wordListStatus');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    initializeAutoFill() {
        // Initialize the auto-fill module if available
        if (typeof CrosswordAutoFill !== 'undefined') {
            this.autoFill = new CrosswordAutoFill(this);
            console.log('Auto-fill module initialized');
        } else {
            console.log('Auto-fill module not available');
        }
    }
}

// Initialize the crossword manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CrosswordManager();
}); 

