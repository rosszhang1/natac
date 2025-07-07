/**
 * GameRenderer - Connects the game engine to the 3D renderer
 * Handles the bridge between game objects and their visual representation
 */
class GameRenderer {
    constructor(canvas) {
        this.renderer3d = new Renderer3D(canvas);
        this.game = null;
        
        // State tracking
        this.isRendering = false;
        this.lastRenderTime = 0;
        
        this.id = 'game_renderer';
    }
    
    /**
     * Initialize the renderer
     */
    init() {
        this.renderer3d.init();
        this.setupGameEvents();
        console.log('🎮 Game Renderer initialized');
    }
    
    /**
     * Connect to a game instance
     */
    connectToGame(game) {
        this.game = game;
        
        if (game.board.isGenerated) {
            this.renderGame();
        }
        
        console.log(`🔗 Connected to game: ${game.toString()}`);
    }
    
    /**
     * Render the entire game
     */
    renderGame() {
        if (!this.game || !this.renderer3d.isInitialized) {
            console.warn('Game or renderer not ready');
            return;
        }
        
        this.isRendering = true;
        this.lastRenderTime = performance.now();
        
        // Render board
        this.renderer3d.renderBoard(this.game.board);
        
        // Render players' pieces
        this.renderAllPlayerPieces();
        
        this.isRendering = false;
        
        const renderTime = performance.now() - this.lastRenderTime;
        console.log(`🎨 Game rendered in ${renderTime.toFixed(2)}ms`);
    }
    
    /**
     * Render all player pieces (settlements, cities, roads)
     */
    renderAllPlayerPieces() {
        this.game.players.forEach((player, playerIndex) => {
            // Render settlements
            player.settlements.forEach(settlement => {
                this.renderSettlement(settlement, playerIndex);
            });
            
            // Render cities
            player.cities.forEach(city => {
                this.renderCity(city, playerIndex);
            });
            
            // Render roads
            player.roads.forEach(road => {
                this.renderRoad(road, playerIndex);
            });
        });
    }
    
    /**
     * Render a settlement
     */
    renderSettlement(settlement, playerIndex) {
        if (!settlement.vertex) return;
        
        const group = new THREE.Group();
        
        // Base
        const baseGeometry = this.renderer3d.geometries.get('settlement_base');
        const baseMaterial = this.renderer3d.materials.get(`player_${playerIndex}`);
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.5;
        group.add(base);
        
        // Roof
        const roofGeometry = this.renderer3d.geometries.get('settlement_roof');
        const roofMaterial = this.renderer3d.materials.get('roof');
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 1.4;
        roof.rotation.y = Math.PI / 4;
        group.add(roof);
        
        // Position at vertex
        const pos = settlement.vertex.toPixelCoordinates(2);
        group.position.set(pos.x, 0, pos.z);
        group.castShadow = true;
        group.receiveShadow = true;
        
        group.userData = { gameObject: settlement, type: 'settlement' };
        
        this.renderer3d.scene.add(group);
        this.renderer3d.meshes.set(settlement.id, group);
    }
    
    /**
     * Render a city
     */
    renderCity(city, playerIndex) {
        if (!city.vertex) return;
        
        const group = new THREE.Group();
        
        // Main base
        const baseGeometry = this.renderer3d.geometries.get('city_base');
        const baseMaterial = this.renderer3d.materials.get(`player_${playerIndex}`);
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.75;
        group.add(base);
        
        // Tower
        const towerGeometry = this.renderer3d.geometries.get('city_tower');
        const towerMaterial = this.renderer3d.materials.get(`player_${playerIndex}`);
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(0.5, 2, 0.5);
        group.add(tower);
        
        // Spire
        const spireGeometry = new THREE.ConeGeometry(0.2, 0.6, 8);
        const spireMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        const spire = new THREE.Mesh(spireGeometry, spireMaterial);
        spire.position.set(0.5, 3.3, 0.5);
        group.add(spire);
        
        // Position at vertex
        const pos = city.vertex.toPixelCoordinates(2);
        group.position.set(pos.x, 0, pos.z);
        group.castShadow = true;
        group.receiveShadow = true;
        
        group.userData = { gameObject: city, type: 'city' };
        
        this.renderer3d.scene.add(group);
        this.renderer3d.meshes.set(city.id, group);
    }
    
    /**
     * Render a road
     */
    renderRoad(road, playerIndex) {
        if (!road.edge) return;
        
        const geometry = this.renderer3d.geometries.get('road');
        const material = this.renderer3d.materials.get(`player_${playerIndex}`);
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position and orient road along edge
        const edgePos = road.edge.toPixelCoordinates(2);
        mesh.position.set(edgePos.x, 0.1, edgePos.z);
        mesh.rotation.y = edgePos.rotation || 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        mesh.userData = { gameObject: road, type: 'road' };
        
        this.renderer3d.scene.add(mesh);
        this.renderer3d.meshes.set(road.id, mesh);
    }
    
    /**
     * Setup event listeners for game changes
     */
    setupGameEvents() {
        // Listen for game object clicks
        window.addEventListener('gameObjectClick', (event) => {
            this.handleGameObjectClick(event.detail);
        });
        
        // Listen for game state changes
        window.addEventListener('gameStateChanged', () => {
            this.renderGame();
        });
    }
    
    /**
     * Handle clicks on game objects
     */
    handleGameObjectClick(detail) {
        const { gameObject, type } = detail;
        
        if (!this.game) return;
        
        switch (type) {
            case 'hex':
                this.handleHexClick(gameObject);
                break;
            case 'vertex':
                this.handleVertexClick(gameObject);
                break;
            case 'edge':
                this.handleEdgeClick(gameObject);
                break;
            default:
                console.log(`Clicked ${type}:`, gameObject.toString());
        }
    }
    
    /**
     * Handle hex clicks (for robber movement)
     */
    handleHexClick(hex) {
        if (this.game.diceResult && this.game.diceResult.total === 7) {
            const moved = this.game.moveRobber(hex);
            if (moved) {
                this.renderGame(); // Re-render to show robber movement
            }
        }
    }
    
    /**
     * Handle vertex clicks (for settlement/city placement)
     */
    handleVertexClick(vertex) {
        if (this.game.gamePhase === 'setup' || this.game.canBuild) {
            const currentPlayer = this.game.getCurrentPlayer();
            
            // Try to place settlement
            if (vertex.canPlaceSettlement(currentPlayer)) {
                const settlement = this.game.placeSettlement(vertex);
                if (settlement) {
                    this.renderGame(); // Re-render to show new settlement
                }
            }
            // Try to upgrade to city
            else if (vertex.canPlaceCity(currentPlayer)) {
                const result = this.game.getCurrentPlayer().buildCity(vertex);
                if (result) {
                    this.renderGame(); // Re-render to show new city
                }
            }
        }
    }
    
    /**
     * Handle edge clicks (for road placement)
     */
    handleEdgeClick(edge) {
        if (this.game.gamePhase === 'setup' || this.game.canBuild) {
            const currentPlayer = this.game.getCurrentPlayer();
            
            if (edge.canPlaceRoad(currentPlayer)) {
                const road = this.game.placeRoad(edge);
                if (road) {
                    this.renderGame(); // Re-render to show new road
                }
            }
        }
    }
    
    /**
     * Update rendering for specific game object
     */
    updateGameObject(gameObject) {
        // Remove old mesh
        const oldMesh = this.renderer3d.meshes.get(gameObject.id);
        if (oldMesh) {
            this.renderer3d.scene.remove(oldMesh);
            this.renderer3d.meshes.delete(gameObject.id);
        }
        
        // Re-render specific object
        // This could be optimized further by object type
        this.renderGame();
    }
    
    /**
     * Get camera to look at specific object
     */
    focusOnObject(gameObject) {
        if (!gameObject.toPixelCoordinates) return;
        
        const pos = gameObject.toPixelCoordinates(2);
        this.renderer3d.controls.target.set(pos.x, 0, pos.z);
        this.renderer3d.controls.update();
    }
    
    /**
     * Reset camera to default position
     */
    resetCamera() {
        this.renderer3d.controls.reset();
    }
    
    /**
     * Get rendering statistics
     */
    getStats() {
        return {
            renderer: this.renderer3d.getStats(),
            isRendering: this.isRendering,
            lastRenderTime: this.lastRenderTime,
            gameConnected: this.game !== null
        };
    }
    
    /**
     * Debug representation
     */
    toString() {
        const stats = this.getStats();
        return `GameRenderer - ${stats.renderer.fps}fps, Connected: ${stats.gameConnected}`;
    }
}