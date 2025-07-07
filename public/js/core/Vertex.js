/**
 * Vertex - Represents a corner where exactly 3 hexes meet
 * This is where settlements and cities can be placed
 */
class Vertex {
    constructor(q, r, direction) {
        // Vertex coordinates - hex coordinates + direction (0-5)
        this.q = q;
        this.r = r; 
        this.direction = direction; // 0=N, 1=NE, 2=SE, 3=S, 4=SW, 5=NW
        
        // Game state
        this.building = null; // Settlement or City object
        this.port = null; // Port object if this vertex has a harbor
        
        // Relationships - will be populated by Board
        this.hexes = []; // Exactly 3 Hex objects that meet at this vertex
        this.edges = []; // 3 Edge objects connected to this vertex
        this.adjacentVertices = []; // Vertices connected by roads
        
        // 3D rendering reference
        this.mesh = null;
        
        // Debug info
        this.id = `vertex_${q}_${r}_${direction}`;
    }
    
    /**
     * Check if a settlement can be placed here
     * Rules: No other building here, no buildings on adjacent vertices
     */
    canPlaceSettlement(player) {
        // Already has a building
        if (this.building) return false;
        
        // Check adjacent vertices for settlements (distance rule)
        for (let adjacentVertex of this.adjacentVertices) {
            if (adjacentVertex.building) return false;
        }
        
        // In initial setup, must be adjacent to own road (except first 2 settlements)
        // This will be handled by Game logic
        
        return true;
    }
    
    /**
     * Check if a city can be placed here (upgrade settlement)
     */
    canPlaceCity(player) {
        return this.building && 
               this.building.type === 'settlement' && 
               this.building.owner === player;
    }
    
    /**
     * Place a settlement on this vertex
     */
    placeSettlement(settlement) {
        if (this.canPlaceSettlement(settlement.owner)) {
            this.building = settlement;
            settlement.vertex = this;
            return true;
        }
        return false;
    }
    
    /**
     * Upgrade settlement to city
     */
    upgradeToCity(city) {
        if (this.canPlaceCity(city.owner)) {
            const oldSettlement = this.building;
            this.building = city;
            city.vertex = this;
            return oldSettlement;
        }
        return null;
    }
    
    /**
     * Get all hexes that would produce resources for a building here
     */
    getResourceHexes() {
        return this.hexes.filter(hex => hex.canProduceResources());
    }
    
    /**
     * Check if this vertex is connected to a specific player's road network
     */
    isConnectedToPlayer(player) {
        return this.edges.some(edge => 
            edge.road && edge.road.owner === player
        );
    }
    
    /**
     * Get adjacent vertices connected by roads of the same player
     */
    getConnectedVertices(player) {
        const connected = [];
        for (let edge of this.edges) {
            if (edge.road && edge.road.owner === player) {
                const otherVertex = edge.vertices.find(v => v !== this);
                if (otherVertex) connected.push(otherVertex);
            }
        }
        return connected;
    }
    
    /**
     * Convert to pixel coordinates for rendering
     */
    toPixelCoordinates(hexSize = 1) {
        const hexPos = { 
            x: hexSize * (3/2 * this.q), 
            z: hexSize * (Math.sqrt(3)/2 * this.q + Math.sqrt(3) * this.r) 
        };
        
        // Offset from hex center based on direction
        const angles = [0, 60, 120, 180, 240, 300]; // degrees
        const angle = angles[this.direction] * Math.PI / 180;
        const radius = hexSize * Math.sqrt(3) / 2; // Distance from hex center to vertex
        
        return {
            x: hexPos.x + radius * Math.cos(angle),
            z: hexPos.z + radius * Math.sin(angle)
        };
    }
    
    /**
     * Debug representation
     */
    toString() {
        const building = this.building ? `[${this.building.type}:${this.building.owner.color}]` : '';
        return `Vertex(${this.q},${this.r}:${this.direction})${building}`;
    }
    
    /**
     * Get object for debugging/inspection
     */
    getDebugInfo() {
        return {
            id: this.id,
            coordinates: { q: this.q, r: this.r, direction: this.direction },
            building: this.building ? {
                type: this.building.type,
                owner: this.building.owner.color
            } : null,
            port: this.port ? this.port.type : null,
            hexCount: this.hexes.length,
            edgeCount: this.edges.length,
            adjacentVertexCount: this.adjacentVertices.length,
            canPlaceSettlement: this.canPlaceSettlement(),
            resourceHexes: this.getResourceHexes().map(h => h.terrain)
        };
    }
}