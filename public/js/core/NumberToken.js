/**
 * NumberToken - Represents the circular number chits (2-12) placed on terrain hexes
 */
class NumberToken {
    constructor(value) {
        this.value = value; // 2-12 (no 7 in standard game)
        this.hex = null; // Hex this token is placed on
        
        // Calculate probability (number of ways to roll this number with 2 dice)
        this.probability = this.calculateProbability(value);
        this.dots = this.probability; // Red dots on token indicating probability
        
        // 3D rendering reference
        this.mesh = null;
        
        // Debug info
        this.id = `token_${value}`;
    }
    
    /**
     * Calculate how many ways to roll this number with 2 dice
     */
    calculateProbability(value) {
        const probabilities = {
            2: 1,  // (1,1)
            3: 2,  // (1,2), (2,1)
            4: 3,  // (1,3), (2,2), (3,1)
            5: 4,  // (1,4), (2,3), (3,2), (4,1)
            6: 5,  // (1,5), (2,4), (3,3), (4,2), (5,1)
            7: 6,  // (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) - not used in standard game
            8: 5,  // (2,6), (3,5), (4,4), (5,3), (6,2)
            9: 4,  // (3,6), (4,5), (5,4), (6,3)
            10: 3, // (4,6), (5,5), (6,4)
            11: 2, // (5,6), (6,5)
            12: 1  // (6,6)
        };
        return probabilities[value] || 0;
    }
    
    /**
     * Get the statistical probability as a percentage
     */
    getProbabilityPercent() {
        return Math.round((this.probability / 36) * 100 * 10) / 10; // Round to 1 decimal
    }
    
    /**
     * Check if this is a high-probability number (6 or 8)
     */
    isHighProbability() {
        return this.value === 6 || this.value === 8;
    }
    
    /**
     * Check if this is a low-probability number (2 or 12)
     */
    isLowProbability() {
        return this.value === 2 || this.value === 12;
    }
    
    /**
     * Get the color this token should be rendered in
     * Red numbers are typically the high-probability ones
     */
    getColor() {
        return this.isHighProbability() ? 'red' : 'black';
    }
    
    /**
     * Place this token on a hex
     */
    placeOnHex(hex) {
        // Remove from previous hex if any
        if (this.hex) {
            this.hex.numberToken = null;
        }
        
        // Place on new hex
        this.hex = hex;
        if (hex) {
            hex.numberToken = this;
        }
    }
    
    /**
     * Remove this token from its hex
     */
    removeFromHex() {
        if (this.hex) {
            this.hex.numberToken = null;
            this.hex = null;
        }
    }
    
    /**
     * Get all buildings that would receive resources when this number is rolled
     */
    getAffectedBuildings() {
        if (!this.hex) return [];
        
        return this.hex.vertices
            .filter(vertex => vertex.building)
            .map(vertex => vertex.building);
    }
    
    /**
     * Check if this token is blocked by the robber
     */
    isBlockedByRobber() {
        return this.hex && this.hex.hasRobber;
    }
    
    /**
     * Debug representation
     */
    toString() {
        const hexInfo = this.hex ? ` on ${this.hex.terrain}` : '';
        return `NumberToken(${this.value})${hexInfo} [${this.probability} ways, ${this.getProbabilityPercent()}%]`;
    }
    
    /**
     * Get object for debugging/inspection
     */
    getDebugInfo() {
        return {
            id: this.id,
            value: this.value,
            probability: this.probability,
            probabilityPercent: this.getProbabilityPercent(),
            dots: this.dots,
            color: this.getColor(),
            isHighProbability: this.isHighProbability(),
            isLowProbability: this.isLowProbability(),
            hex: this.hex ? this.hex.terrain : null,
            isBlocked: this.isBlockedByRobber(),
            affectedBuildingCount: this.getAffectedBuildings().length
        };
    }
}

/**
 * Factory function to create the standard set of number tokens for Catan
 */
NumberToken.createStandardSet = function() {
    // Standard distribution: 2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12
    const values = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
    return values.map(value => new NumberToken(value));
};