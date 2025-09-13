/**
 * Crossword Auto-Fill Module
 * Advanced backtracking algorithm based on constraint satisfaction principles
 * Implements dom/wdeg heuristic, arc consistency, and adaptive branching
 */
class CrosswordAutoFill {
    constructor(crosswordManager) {
        this.crossword = crosswordManager;
        this.wordList = [];
        this.statistics = {
            states: 0,
            backtracks: 0,
            restrictedBranchings: 0,
            retries: 0,
            totalTime: 0
        };
        
        // Algorithm parameters (optimized for better success rate)
        this.ADAPTIVE_BRANCHING_THRESHOLD = 0.2; // Increased threshold for more flexibility
        this.INTERRUPT_FREQUENCY = 10;
        this.WEIGHT_AGE_FACTOR = 0.99;
        this.RETRY_GROWTH_FACTOR = 1.2; // Increased growth for more attempts
        this.RANDOM_SLOT_WEIGHTS = [5, 3, 2, 1]; // More options for slot selection
        this.RANDOM_WORD_WEIGHTS = [5, 3, 2, 1]; // More options for word selection
        this.MAX_BACKTRACKS = 1000; // Increased backtrack limit
    }

    /**
     * Set the word list to use for auto-filling
     * @param {Array} wordList - Array of words in format "word;score" or "word:score"
     */
    setWordList(wordList) {
        this.wordList = wordList || [];
        console.log(`Auto-fill module loaded with ${this.wordList.length} words`);
    }

    /**
     * Main method to auto-fill the entire grid using advanced backtracking
     */
    async autoFillGrid() {
        console.log('=== AUTO-FILL DEBUG START ===');
        console.log('Word list length:', this.wordList ? this.wordList.length : 'null');
        
        if (!this.wordList || this.wordList.length === 0) {
            throw new Error('No word list loaded. Please load a dictionary first.');
        }

        console.log('Starting auto-fill process...');
        const startTime = Date.now();
        
        // Reset statistics
        this.statistics = {
            states: 0,
            backtracks: 0,
            restrictedBranchings: 0,
            retries: 0,
            totalTime: 0
        };

        // Get all slots (words) that need to be filled
        const slots = this.buildSlots();
        console.log('Built slots:', slots.length);
        console.log('Slot details:', slots.map(s => ({ id: s.id, pattern: s.pattern, options: s.options.length })));
        
        if (slots.length === 0) {
            return { success: true, message: 'Grid is already complete!' };
        }

        // Try simple algorithm first
        console.log('Trying simple fill algorithm first...');
        const simpleResult = await this.simpleFillAlgorithm(slots);
        if (simpleResult.success) {
            this.statistics.totalTime = Date.now() - startTime;
            console.log('Grid filled successfully with simple algorithm!', this.statistics);
            return { success: true, message: 'Grid filled successfully!' };
        }

        console.log('Simple algorithm failed, trying advanced algorithm...');
        
        // Initialize crossing weights (learn from failures)
        const crossingWeights = new Array(slots.length).fill(1.0);
        
        // Try multiple times with increasing backtrack limits
        let maxBacktracks = this.MAX_BACKTRACKS;
        
        for (let retry = 0; retry < 5; retry++) { // Reduced retry count for debugging
            console.log(`Advanced retry ${retry + 1}: max backtracks = ${maxBacktracks}`);
            
            // Reset placed words for each retry
            this.placedWords = new Set();
            
            const result = await this.findFillForSeed(slots, crossingWeights, maxBacktracks, retry);
            
            if (result.success) {
                this.statistics.totalTime = Date.now() - startTime;
                this.statistics.retries = retry;
                console.log('Grid filled successfully!', this.statistics);
                return { success: true, message: 'Grid filled successfully!' };
            }
            
            // Increase backtrack limit for next retry
            maxBacktracks = Math.max(maxBacktracks + 100, Math.floor(maxBacktracks * this.RETRY_GROWTH_FACTOR));
            
            // Reset slot eliminations for fresh attempt
            slots.forEach(slot => {
                slot.eliminations.clear();
                slot.remainingOptionCount = slot.options.length;
                slot.fixedWordId = null;
            });
        }

        this.statistics.totalTime = Date.now() - startTime;
        console.log('Could not find a valid solution', this.statistics);
        console.log('=== AUTO-FILL DEBUG END ===');
        return { success: false, message: 'Could not find a valid solution. Try adding more words to your dictionary.' };
    }

    /**
     * Build slot objects representing each word position in the grid
     * Based on the Rust implementation's SlotConfig approach
     */
    buildSlots() {
        const slots = [];
        let slotId = 0;
        
        for (const direction of ['across', 'down']) {
            for (const word of this.crossword.words[direction]) {
                const hasEmpty = word.cells.some(cell => !cell.value || cell.value.trim() === '');
                if (hasEmpty) {
                    const pattern = this.getWordPattern(word);
                    const options = this.getWordOptions(word);
                    
                    // Create slot config like Rust implementation
                    const slotConfig = {
                        id: slotId++,
                        direction: direction,
                        word: word,
                        pattern: pattern,
                        options: options,
                        remainingOptionCount: options.length,
                        fixedWordId: null,
                        eliminations: new Set(),
                        crossings: [],
                        startCell: this.getStartCell(word),
                        length: word.cells.length,
                        cellCoords: this.getCellCoords(word)
                    };
                    
                    slots.push(slotConfig);
                }
            }
        }
        
        // Find crossings between slots (like Rust implementation)
        this.findCrossings(slots);
        
        return slots;
    }

    /**
     * Get start cell coordinates for a word
     */
    getStartCell(word) {
        const firstCell = word.cells[0];
        return {
            row: parseInt(firstCell.element.dataset.row),
            col: parseInt(firstCell.element.dataset.col)
        };
    }

    /**
     * Get all cell coordinates for a word
     */
    getCellCoords(word) {
        return word.cells.map(cell => ({
            row: parseInt(cell.element.dataset.row),
            col: parseInt(cell.element.dataset.col)
        }));
    }

    /**
     * Find crossings between all slots (like Rust implementation)
     */
    findCrossings(slots) {
        for (let i = 0; i < slots.length; i++) {
            const slot1 = slots[i];
            slot1.crossings = [];
            
            for (let j = 0; j < slots.length; j++) {
                if (i === j) continue;
                
                const slot2 = slots[j];
                const crossing = this.findSlotCrossing(slot1, slot2);
                
                if (crossing) {
                    slot1.crossings.push(crossing);
                }
            }
        }
    }

    /**
     * Find crossing between two slots
     */
    findSlotCrossing(slot1, slot2) {
        for (let i = 0; i < slot1.cellCoords.length; i++) {
            for (let j = 0; j < slot2.cellCoords.length; j++) {
                const coord1 = slot1.cellCoords[i];
                const coord2 = slot2.cellCoords[j];
                
                if (coord1.row === coord2.row && coord1.col === coord2.col) {
                    return {
                        otherSlotId: slot2.id,
                        otherSlotCell: j,
                        thisSlotCell: i,
                        crossingId: `${slot1.id}-${slot2.id}-${i}-${j}` // Unique crossing ID
                    };
                }
            }
        }
        return null;
    }


    /**
     * Get the current pattern for a word (e.g., "C?T?" for CAT with missing letters)
     */
    getWordPattern(word) {
        return word.cells.map(cell => cell.value ? cell.value.toUpperCase() : '?').join('');
    }

    /**
     * Get all possible words that match the current pattern
     */
    getWordOptions(word) {
        const pattern = this.getWordPattern(word);
        const regex = this.createPatternRegex(pattern);
        
        return this.wordList
            .filter(entry => {
                const word = this.extractWord(entry);
                return word.length === pattern.length && regex.test(word);
            })
            .map(entry => ({
                word: this.extractWord(entry),
                score: this.extractScore(entry),
                entry: entry
            }))
            .sort((a, b) => b.score - a.score); // Sort by score (highest first)
    }

    /**
     * Create regex pattern from word pattern (e.g., "C?T?" -> /^C[A-Z]T[A-Z]$/)
     */
    createPatternRegex(pattern) {
        const safe = pattern.replace(/[^A-Z?]/g, '').replace(/\?/g, '[A-Z]');
        return new RegExp(`^${safe}$`, 'i');
    }

    /**
     * Extract word from dictionary entry (handles both "word;score" and "word:score" formats)
     */
    extractWord(entry) {
        const semicolonIndex = entry.indexOf(';');
        const colonIndex = entry.indexOf(':');
        
        if (semicolonIndex !== -1) {
            return entry.substring(0, semicolonIndex).toUpperCase();
        } else if (colonIndex !== -1) {
            return entry.substring(0, colonIndex).toUpperCase();
        } else {
            return entry.toUpperCase();
        }
    }

    /**
     * Extract score from dictionary entry
     */
    extractScore(entry) {
        const semicolonIndex = entry.indexOf(';');
        const colonIndex = entry.indexOf(':');
        
        if (semicolonIndex !== -1) {
            return parseInt(entry.substring(semicolonIndex + 1)) || 0;
        } else if (colonIndex !== -1) {
            return parseInt(entry.substring(colonIndex + 1)) || 0;
        } else {
            return 0;
        }
    }

    /**
     * Main backtracking algorithm with dom/wdeg heuristic
     */
    async findFillForSeed(slots, crossingWeights, maxBacktracks, seed) {
        const choices = [];
        let lastSlotId = null;
        let lastStartingWordIdx = null;
        let consecutiveFailures = 0;
        
        // Simple random number generator for deterministic results
        let rng = this.createSimpleRNG(seed);
        
        while (true) {
            this.statistics.states++;
            
            // Choose next slot using dom/wdeg heuristic
            const slotWeights = this.calculateSlotWeights(slots, crossingWeights);
            const nextSlot = this.chooseNextSlot(slots, slotWeights, lastSlotId, rng);
            
            if (!nextSlot) {
                // All slots filled successfully
                console.log('All slots filled successfully!');
                return { success: true, choices: choices };
            }
            
            const slotId = nextSlot.id;
            const slot = slots[slotId];
            
            // Get available word options for this slot
            const availableOptions = this.getAvailableOptions(slot);
            if (availableOptions.length === 0) {
                console.log(`No options available for slot ${slotId} (${slot.pattern})`);
                return { success: false };
            }
            
            // Try multiple words for this slot if we're having trouble
            let wordPlaced = false;
            const maxAttempts = Math.min(availableOptions.length, 10); // Try up to 10 words per slot
            
            for (let attempt = 0; attempt < maxAttempts && !wordPlaced; attempt++) {
                // Choose a word using weighted random selection
                const wordChoice = this.chooseWord(availableOptions, lastStartingWordIdx, rng);
                if (!wordChoice) {
                    break;
                }
                
                const { word, wordIndex } = wordChoice;
                lastSlotId = slotId;
                lastStartingWordIdx = wordIndex;
                
                console.log(`Trying slot ${slotId} (attempt ${attempt + 1}): ${word.word} (score: ${word.score})`);
                
                // Try to place this word
                if (this.tryPlaceWord(slot, word)) {
                    choices.push({ slotId: slotId, word: word });
                    wordPlaced = true;
                    consecutiveFailures = 0;
                    break;
                } else {
                    // Mark this word as eliminated for this slot
                    slot.eliminations.add(word.word);
                    slot.remainingOptionCount--;
                    console.log(`Eliminated ${word.word} for slot ${slotId}`);
                }
            }
            
            if (!wordPlaced) {
                consecutiveFailures++;
                console.log(`Failed to place any word in slot ${slotId} after ${maxAttempts} attempts`);
                
                // If we've failed too many times in a row, try backtracking
                if (consecutiveFailures > 3) {
                    console.log('Too many consecutive failures, attempting backtrack');
                    const backtrackResult = await this.handleBacktrack(slots, choices, null, maxBacktracks);
                    if (!backtrackResult.success) {
                        return { success: false };
                    }
                    consecutiveFailures = 0;
                } else {
                    return { success: false };
                }
            }
            
            // Update lastSlotId after backtracking
            if (consecutiveFailures > 0) {
                lastSlotId = null;
                lastStartingWordIdx = null;
            }
        }
    }

    /**
     * Calculate slot weights using dom/wdeg heuristic (like Rust implementation)
     */
    calculateSlotWeights(slots, crossingWeights) {
        return slots.map(slot => {
            let weight = 0;
            for (const crossing of slot.crossings) {
                const otherSlot = slots.find(s => s.id === crossing.otherSlotId);
                if (otherSlot && otherSlot.remainingOptionCount > 1) {
                    // Use crossing ID to get weight, fallback to slot ID
                    const weightKey = crossing.crossingId || crossing.otherSlotId;
                    weight += crossingWeights[weightKey] || 1.0;
                }
            }
            return Math.max(weight, 0.1); // Ensure minimum weight like Rust version
        });
    }

    /**
     * Choose next slot using dom/wdeg priority with adaptive branching
     */
    chooseNextSlot(slots, slotWeights, lastSlotId, rng) {
        const availableSlots = slots.filter(slot => 
            slot.fixedWordId === null && slot.remainingOptionCount > 0
        );
        
        if (availableSlots.length === 0) {
            return null;
        }
        
        // Calculate priorities (lower is better)
        const priorities = availableSlots.map(slot => {
            const weight = Math.max(slotWeights[slot.id] || 0.1, 0.1); // Avoid division by zero
            return slot.remainingOptionCount / weight;
        });
        
        // Sort slots by priority
        const sortedSlots = availableSlots.map((slot, index) => ({
            slot: slot,
            priority: priorities[index]
        })).sort((a, b) => a.priority - b.priority);
        
        // Find best priority
        const bestPriority = sortedSlots[0].priority;
        
        // Check adaptive branching - if last slot is close to best, stick with it
        if (lastSlotId !== null) {
            const lastSlot = slots.find(s => s.id === lastSlotId);
            if (lastSlot && lastSlot.remainingOptionCount > 0) {
                const lastPriority = lastSlot.remainingOptionCount / Math.max(slotWeights[lastSlotId] || 0.1, 0.1);
                if (lastPriority - bestPriority < this.ADAPTIVE_BRANCHING_THRESHOLD) {
                    this.statistics.restrictedBranchings++;
                    return lastSlot;
                }
            }
        }
        
        // Choose from top slots using weighted random selection
        // Include more slots to give more variety
        const topSlots = sortedSlots.filter(item => 
            item.priority <= bestPriority * 2.0 // More generous inclusion
        ).map(item => item.slot);
        
        const weights = topSlots.map((slot, index) => {
            const rank = Math.min(index, this.RANDOM_SLOT_WEIGHTS.length - 1);
            return this.RANDOM_SLOT_WEIGHTS[rank];
        });
        
        const selectedIndex = this.weightedRandomChoice(weights, rng);
        return topSlots[selectedIndex];
    }

    /**
     * Get available word options for a slot (excluding eliminated words)
     */
    getAvailableOptions(slot) {
        return slot.options.filter(option => !slot.eliminations.has(option.word));
    }

    /**
     * Choose a word using weighted random selection with score prioritization
     */
    chooseWord(availableOptions, lastStartingWordIdx, rng) {
        if (availableOptions.length === 0) {
            return null;
        }
        
        // Sort by score (highest first) and take top options
        const sortedOptions = availableOptions.sort((a, b) => b.score - a.score);
        const topOptions = sortedOptions.slice(0, this.RANDOM_WORD_WEIGHTS.length);
        
        // Use weights that favor higher-scoring words
        const weights = topOptions.map((option, index) => {
            const baseWeight = this.RANDOM_WORD_WEIGHTS[index] || this.RANDOM_WORD_WEIGHTS[this.RANDOM_WORD_WEIGHTS.length - 1];
            // Boost weight for higher scores
            const scoreBoost = Math.max(1, option.score / 50);
            return baseWeight * scoreBoost;
        });
        
        const selectedIndex = this.weightedRandomChoice(weights, rng);
        return {
            word: topOptions[selectedIndex],
            wordIndex: selectedIndex
        };
    }

    /**
     * Try to place a word in a slot
     */
    tryPlaceWord(slot, word) {
        // Check for conflicts with existing letters
        if (this.hasConflicts(slot.word, word.word)) {
            return false;
        }
        
        // Check for duplicate words (prevent same word appearing multiple times)
        if (this.isDuplicateWord(word.word)) {
            console.log(`Skipping duplicate word: ${word.word}`);
            return false;
        }
        
        // Place the word
        this.placeWord(slot.word, word.word);
        slot.fixedWordId = word.word;
        slot.remainingOptionCount = 1;
        
        // Track placed words to prevent duplicates
        this.placedWords = this.placedWords || new Set();
        this.placedWords.add(word.word);
        
        return true;
    }

    /**
     * Check if a word has already been placed
     */
    isDuplicateWord(word) {
        if (!this.placedWords) {
            this.placedWords = new Set();
            return false;
        }
        return this.placedWords.has(word);
    }

    /**
     * Handle backtracking when a word placement fails
     */
    async handleBacktrack(slots, choices, failedChoice, maxBacktracks) {
        let currentChoice = failedChoice;
        
        while (true) {
            this.statistics.backtracks++;
            
            if (this.statistics.backtracks > maxBacktracks) {
                console.log(`Exceeded backtrack limit: ${this.statistics.backtracks}`);
                return { success: false };
            }
            
            // Try to eliminate the failed choice
            const slot = slots.find(s => s.id === currentChoice.slotId);
            if (slot) {
                slot.eliminations.add(currentChoice.word.word);
                slot.remainingOptionCount--;
                
                // Remove from placed words if it was placed
                if (this.placedWords && this.placedWords.has(currentChoice.word.word)) {
                    this.placedWords.delete(currentChoice.word.word);
                }
            }
            
            // Check if we can continue with this slot
            const availableOptions = this.getAvailableOptions(slot);
            if (availableOptions.length > 0) {
                return { success: true };
            }
            
            // If no options left, we need to backtrack further
            if (choices.length === 0) {
                console.log('No more choices to backtrack');
                return { success: false };
            }
            
            // Undo the last choice
            const lastChoice = choices.pop();
            const lastSlot = slots.find(s => s.id === lastChoice.slotId);
            if (lastSlot) {
                this.removeWord(lastSlot.word);
                lastSlot.fixedWordId = null;
                lastSlot.remainingOptionCount = this.getAvailableOptions(lastSlot).length;
                
                // Remove from placed words
                if (this.placedWords && this.placedWords.has(lastChoice.word.word)) {
                    this.placedWords.delete(lastChoice.word.word);
                }
            }
            
            currentChoice = lastChoice;
        }
    }

    /**
     * Check if placing a word would conflict with existing letters
     */
    hasConflicts(word, newWord) {
        for (let i = 0; i < newWord.length; i++) {
            const cell = word.cells[i];
            if (cell.value && cell.value.toUpperCase() !== newWord[i]) {
                return true;
            }
        }
        return false;
    }

    /**
     * Place a word in the grid
     */
    placeWord(word, newWord) {
        for (let i = 0; i < newWord.length; i++) {
            const cell = word.cells[i];
            cell.value = newWord[i];
            if (cell.input) {
                cell.input.value = newWord[i];
            }
        }
    }

    /**
     * Remove a word from the grid (backtrack)
     */
    removeWord(word) {
        for (let i = 0; i < word.cells.length; i++) {
            const cell = word.cells[i];
            // Only remove if this cell isn't locked by another complete word
            if (!this.isCellLocked(cell)) {
                cell.value = '';
                if (cell.input) {
                    cell.input.value = '';
                }
            }
        }
    }

    /**
     * Check if a cell is locked (part of a complete word)
     */
    isCellLocked(cell) {
        const row = parseInt(cell.element.dataset.row);
        const col = parseInt(cell.element.dataset.col);
        
        // Check if this cell is part of a complete word in either direction
        const acrossWord = this.crossword.getWordAt(row, col, 'across');
        const downWord = this.crossword.getWordAt(row, col, 'down');
        
        return (acrossWord && acrossWord.cells.every(c => c.value && c.value.trim() !== '')) ||
               (downWord && downWord.cells.every(c => c.value && c.value.trim() !== ''));
    }

    /**
     * Simple weighted random choice
     */
    weightedRandomChoice(weights, rng) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = rng() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return i;
            }
        }
        
        return weights.length - 1;
    }

    /**
     * Simple random number generator for deterministic results
     */
    createSimpleRNG(seed) {
        let state = seed;
        return () => {
            state = (state * 1664525 + 1013904223) % 4294967296;
            return state / 4294967296;
        };
    }

    /**
     * Simple fallback algorithm for when advanced algorithm fails
     */
    async simpleFillAlgorithm(slots) {
        console.log('=== SIMPLE FILL ALGORITHM DEBUG ===');
        console.log('Input slots:', slots.length);
        
        // Reset placed words
        this.placedWords = new Set();
        
        // Sort slots by number of options (fewest first)
        const sortedSlots = slots.sort((a, b) => a.options.length - b.options.length);
        console.log('Sorted slots:', sortedSlots.map(s => ({ id: s.id, pattern: s.pattern, options: s.options.length })));
        
        for (const slot of sortedSlots) {
            if (slot.fixedWordId) {
                console.log(`Skipping already filled slot ${slot.id}`);
                continue;
            }
            
            const availableOptions = this.getAvailableOptions(slot);
            console.log(`Slot ${slot.id} (${slot.pattern}): ${availableOptions.length} available options`);
            
            if (availableOptions.length === 0) {
                console.log(`No options for slot ${slot.id} (${slot.pattern})`);
                return { success: false };
            }
            
            // Try each option until one works
            let placed = false;
            for (let i = 0; i < Math.min(availableOptions.length, 5); i++) { // Limit to first 5 options
                const option = availableOptions[i];
                console.log(`Trying option ${i + 1}: ${option.word} (score: ${option.score})`);
                
                if (this.tryPlaceWord(slot, option)) {
                    console.log(`✓ Placed ${option.word} in slot ${slot.id}`);
                    placed = true;
                    break;
                } else {
                    console.log(`✗ Failed to place ${option.word} in slot ${slot.id}`);
                }
            }
            
            if (!placed) {
                console.log(`Could not place any word in slot ${slot.id}`);
                return { success: false };
            }
        }
        
        console.log('Simple fill algorithm completed successfully!');
        console.log('=== SIMPLE FILL ALGORITHM DEBUG END ===');
        return { success: true };
    }

    /**
     * Get statistics about the current grid state
     */
    getGridStats() {
        const totalWords = this.crossword.words.across.length + this.crossword.words.down.length;
        const slots = this.buildSlots();
        const filledWords = totalWords - slots.length;
        
        return {
            totalWords,
            filledWords,
            emptyWords: slots.length,
            completionPercentage: Math.round((filledWords / totalWords) * 100)
        };
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrosswordAutoFill;
}
