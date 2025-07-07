/**
 * Hex - Represents a single hexagonal terrain tile
 * The fundamental building block of the Catan board
 */
class Hex {
    constructor(q, r, terrain) {
        // Axial coordinates (q, r) for hex grid
        this.q = q;
        this.r = r;
        this.s = -q - r; // Derived coordinate for cube system
        
        // Game properties
        this.terrain = terrain; // 'forest', 'hills', 'mountains', 'fields', 'pasture', 'desert', 'sea'
        this.numberToken = null; // NumberToken object
        this.hasRobber = false;
        
        // Relationships - will be populated by Board
        this.vertices = []; // 6 Vertex objects
        this.edges = []; // 6 Edge objects  
        this.neighbors = []; // Up to 6 neighboring Hex objects
        
        // 3D rendering reference
        this.mesh = null;
        
        // Debug info
        this.id = `hex_${q}_${r}`;
    }
    
    /**
     * Check if this hex can produce resources (not desert or sea)
     */
    canProduceResources() {
        return this.terrain !== 'desert' && this.terrain !== 'sea' && this.numberToken !== null;
    }
    
    /**
     * Get the resource type this hex produces
     */
    getResourceType() {
        const resourceMap = {
            'forest': 'lumber',
            'hills': 'brick', 
            'mountains': 'ore',
            'fields': 'grain',
            'pasture': 'wool'
        };
        return resourceMap[this.terrain] || null;
    }
    
    /**
     * Check if a number was rolled and this hex should produce
     */
    shouldProduce(diceRoll) {
        return this.canProduceResources() && 
               this.numberToken && 
               this.numberToken.value === diceRoll &&
               !this.hasRobber;
    }
    
    /**
     * Get all settlements/cities adjacent to this hex
     */
    getAdjacentBuildings() {
        return this.vertices
            .filter(vertex => vertex.building)
            .map(vertex => vertex.building);
    }
    
    /**
     * Convert axial coordinates to pixel coordinates for rendering
     */
    toPixelCoordinates(size = 1) {
        const x = size * (3/2 * this.q);
        const z = size * (Math.sqrt(3)/2 * this.q + Math.sqrt(3) * this.r);
        return { x, z };
    }
    
    /**
     * Get distance to another hex
     */
    distanceTo(otherHex) {
        return (Math.abs(this.q - otherHex.q) + 
                Math.abs(this.q + this.r - otherHex.q - otherHex.r) + 
                Math.abs(this.r - otherHex.r)) / 2;
    }
    
    /**
     * Debug representation
     */
    toString() {
        return `Hex(${this.q},${this.r}) [${this.terrain}${this.numberToken ? `:${this.numberToken.value}` : ''}]`;
    }
    
    /**
     * Get object for debugging/inspection
     */
    getDebugInfo() {
        return {
            id: this.id,
            coordinates: { q: this.q, r: this.r, s: this.s },
            terrain: this.terrain,
            numberToken: this.numberToken ? this.numberToken.value : null,
            hasRobber: this.hasRobber,
            canProduce: this.canProduceResources(),
            resourceType: this.getResourceType(),
            vertexCount: this.vertices.length,
            edgeCount: this.edges.length,
            neighborCount: this.neighbors.length
        };
    }
}