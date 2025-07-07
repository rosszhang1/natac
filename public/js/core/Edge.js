/**
 * Edge - Represents a side between two hexes where roads can be placed
 */
class Edge {
    constructor(q, r, direction) {
        // Edge coordinates - hex coordinates + direction (0-5)
        this.q = q;
        this.r = r;
        this.direction = direction; // 0=NE, 1=E, 2=SE, 3=SW, 4=W, 5=NW
        
        // Game state
        this.road = null; // Road object
        
        // Relationships - will be populated by Board
        this.hexes = []; // Exactly 2 Hex objects (or 1 if on board edge)
        this.vertices = []; // Exactly 2 Vertex objects
        this.adjacentEdges = []; // Edges that share a vertex with this edge
        
        // 3D rendering reference
        this.mesh = null;
        
        // Debug info
        this.id = `edge_${q}_${r}_${direction}`;
    }
    
    /**
     * Check if a road can be placed here
     * Rules: No road here, must connect to player's existing road or settlement
     */
    canPlaceRoad(player) {
        // Already has a road
        if (this.road) return false;
        
        // Check if player has a settlement/city on either vertex
        for (let vertex of this.vertices) {
            if (vertex.building && vertex.building.owner === player) {
                return true;
            }
        }
        
        // Check if connected to player's existing road network
        for (let edge of this.adjacentEdges) {
            if (edge.road && edge.road.owner === player) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Place a road on this edge
     */
    placeRoad(road) {
        if (this.canPlaceRoad(road.owner)) {
            this.road = road;
            road.edge = this;
            return true;
        }
        return false;
    }
    
    /**
     * Check if this edge is on the coast (borders sea)
     */
    isCoastal() {
        return this.hexes.some(hex => hex.terrain === 'sea') ||
               this.hexes.length < 2; // Edge of board
    }
    
    /**
     * Get the length of continuous road from this edge for a player
     */
    getRoadLength(player, visited = new Set()) {
        if (visited.has(this.id)) return 0;
        if (!this.road || this.road.owner !== player) return 0;
        
        visited.add(this.id);
        let maxLength = 0;
        
        // Check each vertex for continuing roads
        for (let vertex of this.vertices) {
            // If vertex has opponent's building, road is blocked
            if (vertex.building && vertex.building.owner !== player) {
                continue;
            }
            
            // Find adjacent edges with same player's roads
            for (let edge of vertex.edges) {
                if (edge !== this && edge.road && edge.road.owner === player) {
                    const length = edge.getRoadLength(player, visited);
                    maxLength = Math.max(maxLength, length);
                }
            }
        }
        
        return 1 + maxLength;
    }
    
    /**
     * Convert to pixel coordinates for rendering
     */
    toPixelCoordinates(hexSize = 1) {
        const hexPos = { 
            x: hexSize * (3/2 * this.q), 
            z: hexSize * (Math.sqrt(3)/2 * this.q + Math.sqrt(3) * this.r) 
        };
        
        // Edge directions: 0=NE, 1=E, 2=SE, 3=SW, 4=W, 5=NW
        const angles = [30, 90, 150, 210, 270, 330]; // degrees
        const angle = angles[this.direction] * Math.PI / 180;
        const radius = hexSize * Math.sqrt(3) / 4; // Distance from hex center to edge midpoint
        
        return {
            x: hexPos.x + radius * Math.cos(angle),
            z: hexPos.z + radius * Math.sin(angle),
            rotation: angle // For rotating the road mesh
        };
    }
    
    /**
     * Get the two vertices that this edge connects
     */
    getVertices() {
        return this.vertices.slice(); // Return copy
    }
    
    /**
     * Check if this edge connects two specific vertices
     */
    connectsVertices(vertex1, vertex2) {
        return this.vertices.includes(vertex1) && this.vertices.includes(vertex2);
    }
    
    /**
     * Debug representation
     */
    toString() {
        const road = this.road ? `[road:${this.road.owner.color}]` : '';
        return `Edge(${this.q},${this.r}:${this.direction})${road}`;
    }
    
    /**
     * Get object for debugging/inspection
     */
    getDebugInfo() {
        return {
            id: this.id,
            coordinates: { q: this.q, r: this.r, direction: this.direction },
            road: this.road ? {
                owner: this.road.owner.color
            } : null,
            hexCount: this.hexes.length,
            vertexCount: this.vertices.length,
            adjacentEdgeCount: this.adjacentEdges.length,
            isCoastal: this.isCoastal(),
            canPlaceRoad: this.road ? false : 'depends on player'
        };
    }
}