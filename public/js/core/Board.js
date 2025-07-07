/**
 * Board - Manages the entire Catan board: hexes, vertices, edges, and their relationships
 * This is the central coordinator that builds and maintains the game board structure
 */
class Board {
    constructor() {
        // Core collections
        this.hexes = new Map(); // key: "q,r" -> Hex object
        this.vertices = new Map(); // key: "q,r,direction" -> Vertex object  
        this.edges = new Map(); // key: "q,r,direction" -> Edge object
        
        // Game pieces
        this.numberTokens = [];
        this.robber = new Robber();
        
        // Board metadata
        this.isGenerated = false;
        this.boardType = 'standard'; // 'standard', 'beginner', 'custom'
        
        this.id = 'board_main';
    }
    
    /**
     * Generate the standard Catan board layout
     */
    generateStandardBoard() {
        // Clear existing board
        this.clear();
        
        // Standard Catan hex layout (19 hexes)
        const hexLayout = [
            // Row -2: 3 hexes
            {q: -2, r: 0}, {q: -1, r: -1}, {q: 0, r: -2},
            // Row -1: 4 hexes  
            {q: -2, r: 1}, {q: -1, r: 0}, {q: 0, r: -1}, {q: 1, r: -2},
            // Row 0: 5 hexes (center row)
            {q: -2, r: 2}, {q: -1, r: 1}, {q: 0, r: 0}, {q: 1, r: -1}, {q: 2, r: -2},
            // Row 1: 4 hexes
            {q: -1, r: 2}, {q: 0, r: 1}, {q: 1, r: 0}, {q: 2, r: -1},
            // Row 2: 3 hexes
            {q: 0, r: 2}, {q: 1, r: 1}, {q: 2, r: 0}
        ];
        
        // Standard terrain distribution
        const terrains = [
            'forest', 'forest', 'forest', 'forest',
            'pasture', 'pasture', 'pasture', 'pasture',
            'fields', 'fields', 'fields', 'fields', 
            'hills', 'hills', 'hills',
            'mountains', 'mountains', 'mountains',
            'desert'
        ];
        
        // Shuffle terrain for randomization
        const shuffledTerrains = this.shuffleArray([...terrains]);
        
        // Create hexes
        hexLayout.forEach((coord, index) => {
            const hex = new Hex(coord.q, coord.r, shuffledTerrains[index]);
            this.addHex(hex);
        });
        
        // Build all relationships between hexes, vertices, and edges
        this.buildRelationships();
        
        // Add number tokens
        this.placeNumberTokens();
        
        // Place robber on desert
        this.placeRobberOnDesert();
        
        this.isGenerated = true;
        this.boardType = 'standard';
    }
    
    /**
     * Add a hex to the board
     */
    addHex(hex) {
        const key = `${hex.q},${hex.r}`;
        this.hexes.set(key, hex);
    }
    
    /**
     * Get hex at coordinates
     */
    getHex(q, r) {
        const key = `${q},${r}`;
        return this.hexes.get(key) || null;
    }
    
    /**
     * Build all relationships between hexes, vertices, and edges
     */
    buildRelationships() {
        // First pass: create all vertices and edges for each hex
        for (let hex of this.hexes.values()) {
            this.createVerticesForHex(hex);
            this.createEdgesForHex(hex);
        }
        
        // Second pass: link relationships
        for (let hex of this.hexes.values()) {
            this.linkHexRelationships(hex);
        }
    }
    
    /**
     * Create vertices around a hex
     */
    createVerticesForHex(hex) {
        // Each hex has 6 vertices (corners)
        for (let direction = 0; direction < 6; direction++) {
            const vertexCoords = this.getVertexCoords(hex.q, hex.r, direction);
            const key = `${vertexCoords.q},${vertexCoords.r},${vertexCoords.direction}`;
            
            // Create vertex if it doesn't exist
            if (!this.vertices.has(key)) {
                const vertex = new Vertex(vertexCoords.q, vertexCoords.r, vertexCoords.direction);
                this.vertices.set(key, vertex);
            }
            
            // Link hex to vertex
            const vertex = this.vertices.get(key);
            hex.vertices.push(vertex);
            vertex.hexes.push(hex);
        }
    }
    
    /**
     * Create edges around a hex
     */
    createEdgesForHex(hex) {
        // Each hex has 6 edges (sides)
        for (let direction = 0; direction < 6; direction++) {
            const edgeCoords = this.getEdgeCoords(hex.q, hex.r, direction);
            const key = `${edgeCoords.q},${edgeCoords.r},${edgeCoords.direction}`;
            
            // Create edge if it doesn't exist
            if (!this.edges.has(key)) {
                const edge = new Edge(edgeCoords.q, edgeCoords.r, edgeCoords.direction);
                this.edges.set(key, edge);
            }
            
            // Link hex to edge
            const edge = this.edges.get(key);
            hex.edges.push(edge);
            edge.hexes.push(hex);
        }
    }
    
    /**
     * Calculate vertex coordinates for a hex direction
     */
    getVertexCoords(hexQ, hexR, direction) {
        // Vertex coordinates based on hex position and direction
        // This ensures vertices are shared between adjacent hexes
        const vertexOffsets = [
            {q: 1, r: -1, d: 4}, // NE vertex
            {q: 1, r: 0, d: 5},  // E vertex  
            {q: 0, r: 1, d: 0},  // SE vertex
            {q: -1, r: 1, d: 1}, // SW vertex
            {q: -1, r: 0, d: 2}, // W vertex
            {q: 0, r: -1, d: 3}  // NW vertex
        ];
        
        const offset = vertexOffsets[direction];
        return {
            q: hexQ + offset.q,
            r: hexR + offset.r, 
            direction: offset.d
        };
    }
    
    /**
     * Calculate edge coordinates for a hex direction
     */
    getEdgeCoords(hexQ, hexR, direction) {
        // Edge coordinates based on hex position and direction
        // This ensures edges are shared between adjacent hexes
        return {
            q: hexQ,
            r: hexR,
            direction: direction
        };
    }
    
    /**
     * Link all relationships after vertices and edges are created
     */
    linkHexRelationships(hex) {
        // Link hex neighbors
        const neighborOffsets = [
            {q: 1, r: -1}, {q: 1, r: 0}, {q: 0, r: 1},
            {q: -1, r: 1}, {q: -1, r: 0}, {q: 0, r: -1}
        ];
        
        neighborOffsets.forEach(offset => {
            const neighbor = this.getHex(hex.q + offset.q, hex.r + offset.r);
            if (neighbor) {
                hex.neighbors.push(neighbor);
            }
        });
        
        // Link vertex-edge relationships
        hex.vertices.forEach((vertex, vertexIndex) => {
            // Each vertex connects to 3 edges
            const edgeIndices = [
                (vertexIndex + 5) % 6, // Previous edge
                vertexIndex,           // Current edge  
                (vertexIndex + 1) % 6  // Next edge
            ];
            
            edgeIndices.forEach(edgeIndex => {
                const edge = hex.edges[edgeIndex];
                if (edge && !vertex.edges.includes(edge)) {
                    vertex.edges.push(edge);
                }
                if (edge && !edge.vertices.includes(vertex)) {
                    edge.vertices.push(vertex);
                }
            });
        });
    }
    
    /**
     * Place number tokens on resource hexes
     */
    placeNumberTokens() {
        // Create standard set of number tokens
        this.numberTokens = NumberToken.createStandardSet();
        
        // Get non-desert hexes
        const resourceHexes = Array.from(this.hexes.values()).filter(hex => hex.terrain !== 'desert');
        
        // Separate red (6,8) and non-red tokens
        const redTokens = this.numberTokens.filter(token => token.isHighProbability());
        const nonRedTokens = this.numberTokens.filter(token => !token.isHighProbability());
        
        // Shuffle both groups
        const shuffledRedTokens = this.shuffleArray([...redTokens]);
        const shuffledNonRedTokens = this.shuffleArray([...nonRedTokens]);
        
        // Place red tokens first with adjacency constraint
        this.placeRedTokensWithConstraint(shuffledRedTokens, resourceHexes);
        
        // Place remaining non-red tokens
        this.placeRemainingTokens(shuffledNonRedTokens, resourceHexes);
    }
    
    /**
     * Place red tokens (6,8) ensuring no two are adjacent
     */
    placeRedTokensWithConstraint(redTokens, hexes) {
        const availableHexes = [...hexes];
        
        for (let token of redTokens) {
            // Find hexes where we can place this red token without being adjacent to another red token
            const validHexes = availableHexes.filter(hex => {
                return !hex.neighbors.some(neighbor => 
                    neighbor.numberToken && neighbor.numberToken.isHighProbability()
                );
            });
            
            if (validHexes.length > 0) {
                // Place on a random valid hex
                const randomIndex = Math.floor(Math.random() * validHexes.length);
                const selectedHex = validHexes[randomIndex];
                token.placeOnHex(selectedHex);
                
                // Remove this hex from available hexes
                const hexIndex = availableHexes.indexOf(selectedHex);
                availableHexes.splice(hexIndex, 1);
            } else {
                // Fallback: place on any available hex (constraint couldn't be satisfied)
                console.warn('Could not satisfy red token adjacency constraint');
                if (availableHexes.length > 0) {
                    token.placeOnHex(availableHexes.pop());
                }
            }
        }
    }
    
    /**
     * Place remaining non-red tokens on available hexes
     */
    placeRemainingTokens(tokens, hexes) {
        const availableHexes = hexes.filter(hex => !hex.numberToken);
        const shuffledAvailable = this.shuffleArray([...availableHexes]);
        
        for (let i = 0; i < tokens.length && i < shuffledAvailable.length; i++) {
            tokens[i].placeOnHex(shuffledAvailable[i]);
        }
    }
    
    /**
     * Place robber on desert hex
     */
    placeRobberOnDesert() {
        const desertHex = Array.from(this.hexes.values()).find(hex => hex.terrain === 'desert');
        if (desertHex) {
            this.robber.moveTo(desertHex);
        }
    }
    
    /**
     * Get all hexes that should produce resources for a dice roll
     */
    getProducingHexes(diceRoll) {
        return Array.from(this.hexes.values()).filter(hex => hex.shouldProduce(diceRoll));
    }
    
    /**
     * Get all valid settlement placement locations for initial setup
     */
    getValidSettlementPlacements() {
        return Array.from(this.vertices.values()).filter(vertex => 
            vertex.canPlaceSettlement()
        );
    }
    
    /**
     * Get all valid road placement locations for a player
     */
    getValidRoadPlacements(player) {
        return Array.from(this.edges.values()).filter(edge => 
            edge.canPlaceRoad(player)
        );
    }
    
    /**
     * Clear the entire board
     */
    clear() {
        this.hexes.clear();
        this.vertices.clear();
        this.edges.clear();
        this.numberTokens = [];
        this.robber = new Robber();
        this.isGenerated = false;
    }
    
    /**
     * Utility: shuffle array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    /**
     * Get board statistics
     */
    getStats() {
        return {
            hexes: this.hexes.size,
            vertices: this.vertices.size,
            edges: this.edges.size,
            numberTokens: this.numberTokens.length,
            isGenerated: this.isGenerated,
            boardType: this.boardType
        };
    }
    
    /**
     * Debug representation
     */
    toString() {
        const stats = this.getStats();
        return `Board(${stats.boardType}) - ${stats.hexes} hexes, ${stats.vertices} vertices, ${stats.edges} edges`;
    }
    
    /**
     * Get comprehensive debug info
     */
    getDebugInfo() {
        const stats = this.getStats();
        
        // Terrain distribution
        const terrainCount = {};
        for (let hex of this.hexes.values()) {
            terrainCount[hex.terrain] = (terrainCount[hex.terrain] || 0) + 1;
        }
        
        // Number token distribution
        const tokenValues = this.numberTokens.map(token => token.value).sort((a, b) => a - b);
        
        return {
            id: this.id,
            stats: stats,
            terrainDistribution: terrainCount,
            numberTokens: tokenValues,
            robberLocation: this.robber.hex ? this.robber.hex.terrain : 'unplaced',
            sampleHexes: Array.from(this.hexes.values()).slice(0, 3).map(h => h.toString()),
            sampleVertices: Array.from(this.vertices.values()).slice(0, 3).map(v => v.toString()),
            sampleEdges: Array.from(this.edges.values()).slice(0, 3).map(e => e.toString())
        };
    }
}