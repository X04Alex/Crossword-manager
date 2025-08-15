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
        
        this.init();
    }
    
    init() {
        this.createGrid();
        this.setupEventListeners();
        this.updateClues();
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
    
        gridContainer.style.gridTemplateColumns = `repeat(${this.gridSize}, 35px)`;
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
        
        document.getElementById('toggleMode').addEventListener('click', () => {
            this.toggleMode();
        });
        
        document.getElementById('clearGrid').addEventListener('click', () => {
            this.clearGrid();
        });
        
        document.getElementById('fillRandom').addEventListener('click', () => {
            this.fillRandom();
        });
        
        document.getElementById('addBlackSquares').addEventListener('click', () => {
            this.showBlackSquareInstructions();
        });

        document.getElementById('playCrossword').addEventListener('click', () => {
            this.loadCrossword(true); // true = play mode
			this.isEditMode = true; // allow typing
			this.isPlayMode = true; // mark play mode for completion checking
			this.puzzleCompleted = false;
            document.getElementById('currentMode').textContent = 'Play';
            document.getElementById('toggleMode').style.display = 'none'; // hide toggle in play
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
        
        // Tab switching
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
                if (nextCol < this.gridSize) break;
                nextRow++;
                nextCol = 0;
            }
            if (nextRow < this.gridSize && nextCol < this.gridSize) this.selectCell(nextRow, nextCol);
    
        } else {
            let nextRow = row + 1;
            let nextCol = col;
    
            while (nextCol < this.gridSize) {
                while (nextRow < this.gridSize && this.grid[nextRow][nextCol].isBlack) nextRow++;
                if (nextRow < this.gridSize) break;
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
    
    showBlackSquareInstructions() {
        const instructions = document.getElementById('blackSquareInstructions');
        instructions.style.display = 'inline';
        
        // Hide after 5 seconds
        setTimeout(() => {
            instructions.style.display = 'none';
        }, 5000);
        
        alert('Black Square Instructions:\n\n• Right-click on any cell to make it black\n• Press Space bar on a selected cell to toggle black\n• Black squares block words and cannot be filled\n• Right-click again to make a black square white again');
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
    
    toggleMode() {
        this.isEditMode = !this.isEditMode;
        document.getElementById('currentMode').textContent = this.isEditMode ? 'Edit' : 'View';
        document.getElementById('toggleMode').textContent = this.isEditMode ? 'View Mode' : 'Edit Mode';
        
        // Update input fields
        document.querySelectorAll('.cell input').forEach(input => {
            input.readOnly = !this.isEditMode;
        });
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
    
    fillRandom() {
        const sampleWords = [
            'HELLO', 'WORLD', 'PUZZLE', 'CROSSWORD', 'GAME', 'FUN', 'PLAY', 'SOLVE',
            'BRAIN', 'TEASER', 'LOGIC', 'THINK', 'SMART', 'CLEVER', 'WISE', 'QUICK',
            'FAST', 'SLOW', 'EASY', 'HARD', 'DIFFICULT', 'SIMPLE', 'BASIC', 'ADVANCED'
        ];
        
        let wordIndex = 0;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (wordIndex < sampleWords.length) {
                    const word = sampleWords[wordIndex];
                    if (col + word.length <= this.gridSize) {
                        for (let i = 0; i < word.length; i++) {
                            const c = this.grid[row][col + i];
                            // Ensure input is attached
                            if (c.input && !c.element.contains(c.input)) c.element.appendChild(c.input);
                            c.value = word[i];
                            c.input.value = word[i];
}

                        wordIndex++;
                        col += word.length;
                    }
                }
            }
        }
        
        this.updateClues();
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
}

// Initialize the crossword manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CrosswordManager();
}); 

