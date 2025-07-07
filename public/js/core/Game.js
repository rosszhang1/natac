/**
 * Game - Manages the entire Catan game: rules, turns, players, win conditions
 * The central game coordinator that enforces rules and manages game flow
 */
class Game {
    constructor() {
        // Core game components
        this.board = new Board();
        this.players = [];
        this.dice = [new Dice(), new Dice()];
        
        // Game state
        this.gamePhase = 'waiting'; // 'waiting', 'setup', 'playing', 'finished'
        this.currentPlayerIndex = 0;
        this.turnNumber = 0;
        this.setupRound = 1; // Setup has 2 rounds
        this.setupDirection = 1; // 1 = forward, -1 = reverse
        
        // Turn state
        this.hasRolledDice = false;
        this.diceResult = null;
        this.canBuild = false;
        this.canTrade = false;
        
        // Game history and events
        this.eventLog = [];
        this.winner = null;
        
        // Game settings
        this.targetVictoryPoints = 10;
        this.maxPlayers = 6;
        
        this.id = 'game_main';
    }
    
    /**
     * Add a player to the game
     */
    addPlayer(color, name = null) {
        if (this.players.length >= this.maxPlayers) {
            return null;
        }
        
        if (this.gamePhase !== 'waiting') {
            return null;
        }
        
        const player = new Player(color, name);
        this.players.push(player);
        this.logEvent(`${player.name} joined the game`);
        
        return player;
    }
    
    /**
     * Start the game (move to setup phase)
     */
    startGame() {
        if (this.players.length < 2) {
            return false;
        }
        
        // Generate board
        this.board.generateStandardBoard();
        
        // Start setup phase
        this.gamePhase = 'setup';
        this.currentPlayerIndex = 0;
        this.logEvent('Game started - Setup phase begins');
        
        return true;
    }
    
    /**
     * Get current player
     */
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    /**
     * Place a settlement during setup or normal play
     */
    placeSettlement(vertex, player = null) {
        player = player || this.getCurrentPlayer();
        
        if (this.gamePhase === 'setup') {
            return this.placeSetupSettlement(vertex, player);
        } else if (this.gamePhase === 'playing') {
            return this.placeNormalSettlement(vertex, player);
        }
        
        return null;
    }
    
    /**
     * Place settlement during setup phase
     */
    placeSetupSettlement(vertex, player) {
        if (!vertex.canPlaceSettlement(player)) {
            return null;
        }
        
        const settlement = player.buildSettlement(vertex);
        if (settlement) {
            // In setup, settlement is free
            player.payFor = () => true; // Override cost for setup
            
            // Collect initial resources (round 2 only)
            if (this.setupRound === 2) {
                const resources = settlement.collectResources();
                resources.forEach(resource => player.addResources(resource));
            }
            
            this.logEvent(`${player.name} placed settlement at ${vertex.id}`);
            return settlement;
        }
        
        return null;
    }
    
    /**
     * Place settlement during normal play
     */
    placeNormalSettlement(vertex, player) {
        if (!this.canBuild || this.hasRolledDice === false) {
            return null;
        }
        
        return player.buildSettlement(vertex);
    }
    
    /**
     * Place a road
     */
    placeRoad(edge, player = null) {
        player = player || this.getCurrentPlayer();
        
        if (this.gamePhase === 'setup') {
            return this.placeSetupRoad(edge, player);
        } else if (this.gamePhase === 'playing') {
            return this.placeNormalRoad(edge, player);
        }
        
        return null;
    }
    
    /**
     * Place road during setup phase  
     */
    placeSetupRoad(edge, player) {
        const road = player.buildRoad(edge);
        if (road) {
            player.payFor = () => true; // Override cost for setup
            this.logEvent(`${player.name} placed road at ${edge.id}`);
            return road;
        }
        return null;
    }
    
    /**
     * Place road during normal play
     */
    placeNormalRoad(edge, player) {
        if (!this.canBuild || this.hasRolledDice === false) {
            return null;
        }
        
        return player.buildRoad(edge);
    }
    
    /**
     * Roll dice and handle resource production
     */
    rollDice() {
        if (this.gamePhase !== 'playing' || this.hasRolledDice) {
            return null;
        }
        
        const die1 = this.dice[0].roll();
        const die2 = this.dice[1].roll();
        const total = die1 + die2;
        
        this.diceResult = { die1, die2, total };
        this.hasRolledDice = true;
        this.canBuild = true;
        this.canTrade = true;
        
        this.logEvent(`${this.getCurrentPlayer().name} rolled ${total} (${die1}, ${die2})`);
        
        if (total === 7) {
            this.handleRobberRoll();
        } else {
            this.handleResourceProduction(total);
        }
        
        return this.diceResult;
    }
    
    /**
     * Handle robber roll (7)
     */
    handleRobberRoll() {
        // Players with >7 cards discard half
        this.players.forEach(player => {
            if (player.getTotalResources() > 7) {
                const discarded = player.discardHalf();
                this.logEvent(`${player.name} discarded ${discarded.length} cards`);
            }
        });
        
        // Current player must move robber (handled by UI)
        this.logEvent('Robber activated - move robber and steal');
    }
    
    /**
     * Handle resource production for dice roll
     */
    handleResourceProduction(diceRoll) {
        const producingHexes = this.board.getProducingHexes(diceRoll);
        
        this.players.forEach(player => {
            const collected = player.collectFromDiceRoll(diceRoll);
            if (collected.length > 0) {
                this.logEvent(`${player.name} collected: ${collected.join(', ')}`);
            }
        });
    }
    
    /**
     * End current player's turn
     */
    endTurn() {
        if (this.gamePhase === 'setup') {
            this.endSetupTurn();
        } else if (this.gamePhase === 'playing') {
            this.endNormalTurn();
        }
        
        // Check for winner
        this.checkWinCondition();
    }
    
    /**
     * End turn during setup phase
     */
    endSetupTurn() {
        // Move to next player
        this.currentPlayerIndex += this.setupDirection;
        
        // Check if we need to reverse direction or end setup
        if (this.setupDirection === 1 && this.currentPlayerIndex >= this.players.length) {
            if (this.setupRound === 1) {
                // Start round 2 in reverse
                this.setupRound = 2;
                this.setupDirection = -1;
                this.currentPlayerIndex = this.players.length - 1;
            } else {
                // Setup complete
                this.gamePhase = 'playing';
                this.currentPlayerIndex = 0;
                this.logEvent('Setup complete - Game begins!');
            }
        } else if (this.setupDirection === -1 && this.currentPlayerIndex < 0) {
            // Setup complete
            this.gamePhase = 'playing';
            this.currentPlayerIndex = 0;
            this.logEvent('Setup complete - Game begins!');
        }
    }
    
    /**
     * End turn during normal play
     */
    endNormalTurn() {
        // Reset turn state
        this.hasRolledDice = false;
        this.diceResult = null;
        this.canBuild = false;
        this.canTrade = false;
        
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.turnNumber++;
        
        this.logEvent(`Turn ${this.turnNumber} - ${this.getCurrentPlayer().name}'s turn`);
    }
    
    /**
     * Check if any player has won
     */
    checkWinCondition() {
        for (let player of this.players) {
            player.updateVictoryPoints();
            if (player.victoryPoints >= this.targetVictoryPoints) {
                this.winner = player;
                this.gamePhase = 'finished';
                this.logEvent(`${player.name} wins with ${player.victoryPoints} victory points!`);
                return true;
            }
        }
        return false;
    }
    
    /**
     * Move robber to a new hex
     */
    moveRobber(hex) {
        if (this.diceResult && this.diceResult.total === 7) {
            this.board.robber.moveTo(hex);
            this.logEvent(`Robber moved to ${hex.terrain}`);
            return true;
        }
        return false;
    }
    
    /**
     * Log game event
     */
    logEvent(message) {
        const event = {
            turn: this.turnNumber,
            phase: this.gamePhase,
            player: this.getCurrentPlayer()?.name,
            message: message,
            timestamp: Date.now()
        };
        this.eventLog.push(event);
        console.log(`[Game] ${message}`);
    }
    
    /**
     * Get game state summary
     */
    getGameState() {
        return {
            phase: this.gamePhase,
            currentPlayer: this.getCurrentPlayer()?.name,
            turnNumber: this.turnNumber,
            playerCount: this.players.length,
            hasRolledDice: this.hasRolledDice,
            diceResult: this.diceResult,
            canBuild: this.canBuild,
            canTrade: this.canTrade,
            winner: this.winner?.name,
            setupRound: this.setupRound,
            setupDirection: this.setupDirection
        };
    }
    
    /**
     * Debug representation
     */
    toString() {
        const state = this.getGameState();
        return `Game(${state.phase}) - ${state.playerCount} players, Turn ${state.turnNumber}`;
    }
    
    /**
     * Get comprehensive debug info
     */
    getDebugInfo() {
        return {
            id: this.id,
            gameState: this.getGameState(),
            board: this.board.getStats(),
            players: this.players.map(p => ({
                name: p.name,
                color: p.color,
                victoryPoints: p.victoryPoints,
                resources: p.getTotalResources()
            })),
            recentEvents: this.eventLog.slice(-5).map(e => e.message),
            settings: {
                targetVictoryPoints: this.targetVictoryPoints,
                maxPlayers: this.maxPlayers
            }
        };
    }
}

/**
 * Simple Dice class
 */
class Dice {
    constructor() {
        this.lastRoll = null;
    }
    
    roll() {
        this.lastRoll = Math.floor(Math.random() * 6) + 1;
        return this.lastRoll;
    }
    
    toString() {
        return `Dice(${this.lastRoll || '?'})`;
    }
}