/**
 * Renderer3D - High-performance Three.js renderer for the Catan game
 * Efficiently renders game objects with optimized geometries and materials
 */
class Renderer3D {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Rendering assets
        this.geometries = new Map();
        this.materials = new Map();
        this.meshes = new Map(); // gameObject.id -> mesh
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 0;
        
        // Interaction
        this.raycaster = null;
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;
        
        this.isInitialized = false;
        this.id = 'renderer_main';
    }
    
    /**
     * Initialize the 3D renderer
     */
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        this.setupControls();
        this.setupInteraction();
        this.setupEventListeners();
        
        this.isInitialized = true;
        this.startRenderLoop();
        
        console.log('🎨 3D Renderer initialized');
    }
    
    /**
     * Setup Three.js scene
     */
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }
    
    /**
     * Setup camera with optimal viewing angle
     */
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60, // FOV
            window.innerWidth / window.innerHeight,
            0.1, // Near
            1000 // Far
        );
        
        // Position camera for optimal board viewing
        this.camera.position.set(0, 25, 30);
        this.camera.lookAt(0, 0, 0);
    }
    
    /**
     * Setup WebGL renderer with optimizations
     */
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable shadows for realism
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Optimize rendering
        this.renderer.sortObjects = false; // Manual sorting for performance
        this.renderer.autoClear = false; // Manual clearing for control
    }
    
    /**
     * Setup realistic lighting
     */
    setupLighting() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(20, 30, 20);
        sunLight.castShadow = true;
        
        // Optimize shadow map
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 100;
        sunLight.shadow.camera.left = -30;
        sunLight.shadow.camera.right = 30;
        sunLight.shadow.camera.top = 30;
        sunLight.shadow.camera.bottom = -30;
        
        this.scene.add(sunLight);
        
        // Fill light for softer shadows
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, 20, -10);
        this.scene.add(fillLight);
    }
    
    /**
     * Setup camera controls
     */
    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        
        // Limit camera movement for game board
        this.controls.minDistance = 10;
        this.controls.maxDistance = 80;
        this.controls.maxPolarAngle = Math.PI / 2.2; // Prevent going under board
        
        // Smooth movement
        this.controls.enableZoom = true;
        this.controls.enableRotate = true;
        this.controls.enablePan = true;
    }
    
    /**
     * Setup mouse/touch interaction
     */
    setupInteraction() {
        this.raycaster = new THREE.Raycaster();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mouse interaction
        this.canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.canvas.addEventListener('click', (event) => this.onMouseClick(event));
    }
    
    /**
     * Create shared geometries for efficiency
     */
    createGeometries() {
        // Hex tile geometry
        const hexGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 6);
        this.geometries.set('hex', hexGeometry);
        
        // Settlement geometry (house shape)
        const settlementGeometry = new THREE.Group();
        const base = new THREE.BoxGeometry(1, 1, 1);
        const roof = new THREE.ConeGeometry(0.8, 0.8, 4);
        this.geometries.set('settlement_base', base);
        this.geometries.set('settlement_roof', roof);
        
        // City geometry (larger, more complex)
        const cityBase = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const cityTower = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
        this.geometries.set('city_base', cityBase);
        this.geometries.set('city_tower', cityTower);
        
        // Road geometry
        const roadGeometry = new THREE.BoxGeometry(0.3, 0.2, 3);
        this.geometries.set('road', roadGeometry);
        
        // Robber geometry
        const robberGeometry = new THREE.CylinderGeometry(0.4, 0.6, 2, 8);
        this.geometries.set('robber', robberGeometry);
        
        // Number token geometry
        const tokenGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16);
        this.geometries.set('token', tokenGeometry);
    }
    
    /**
     * Create shared materials for efficiency
     */
    createMaterials() {
        // Terrain materials
        const terrainMaterials = {
            forest: new THREE.MeshLambertMaterial({ color: 0x228B22 }),
            hills: new THREE.MeshLambertMaterial({ color: 0xA0522D }),
            mountains: new THREE.MeshLambertMaterial({ color: 0x696969 }),
            fields: new THREE.MeshLambertMaterial({ color: 0xFFD700 }),
            pasture: new THREE.MeshLambertMaterial({ color: 0x90EE90 }),
            desert: new THREE.MeshLambertMaterial({ color: 0xF4A460 })
        };
        
        Object.entries(terrainMaterials).forEach(([terrain, material]) => {
            this.materials.set(`terrain_${terrain}`, material);
        });
        
        // Player materials
        const playerColors = [0xff0000, 0x0000ff, 0xffa500, 0xffffff];
        playerColors.forEach((color, index) => {
            const material = new THREE.MeshLambertMaterial({ color });
            this.materials.set(`player_${index}`, material);
        });
        
        // Special materials
        this.materials.set('robber', new THREE.MeshLambertMaterial({ color: 0x2F2F2F }));
        this.materials.set('token', new THREE.MeshLambertMaterial({ color: 0xffffff }));
        this.materials.set('roof', new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
    }
    
    /**
     * Render a complete game board
     */
    renderBoard(board) {
        if (!this.isInitialized) {
            console.warn('Renderer not initialized');
            return;
        }
        
        // Clear existing board
        this.clearBoard();
        
        // Create geometries and materials if needed
        if (this.geometries.size === 0) this.createGeometries();
        if (this.materials.size === 0) this.createMaterials();
        
        // Render hexes
        board.hexes.forEach(hex => this.renderHex(hex));
        
        // Render number tokens
        board.numberTokens.forEach(token => {
            if (token.hex) this.renderNumberToken(token);
        });
        
        // Render robber
        if (board.robber.hex) {
            this.renderRobber(board.robber);
        }
        
        console.log(`🎨 Rendered board: ${board.hexes.size} hexes, ${board.numberTokens.length} tokens`);
    }
    
    /**
     * Render a single hex tile
     */
    renderHex(hex) {
        const geometry = this.geometries.get('hex');
        const material = this.materials.get(`terrain_${hex.terrain}`);
        
        if (!geometry || !material) {
            console.warn(`Missing geometry or material for hex: ${hex.terrain}`);
            return;
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        const pos = hex.toPixelCoordinates(2); // Scale for visibility
        
        mesh.position.set(pos.x, 0, pos.z);
        mesh.rotation.x = -Math.PI / 2; // Lay flat
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Store reference to game object
        mesh.userData = { gameObject: hex, type: 'hex' };
        
        this.scene.add(mesh);
        this.meshes.set(hex.id, mesh);
    }
    
    /**
     * Render a number token
     */
    renderNumberToken(token) {
        const geometry = this.geometries.get('token');
        const material = this.materials.get('token');
        
        const mesh = new THREE.Mesh(geometry, material);
        const hexPos = token.hex.toPixelCoordinates(2);
        
        mesh.position.set(hexPos.x, 0.6, hexPos.z);
        mesh.castShadow = true;
        
        // Add number text (simple approach)
        this.addNumberText(mesh, token.value, token.getColor());
        
        mesh.userData = { gameObject: token, type: 'token' };
        
        this.scene.add(mesh);
        this.meshes.set(token.id, mesh);
    }
    
    /**
     * Add text to number token
     */
    addNumberText(tokenMesh, number, color) {
        // Create canvas for text texture
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // Draw number
        context.fillStyle = color === 'red' ? '#ff0000' : '#000000';
        context.font = 'bold 80px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(number.toString(), 64, 64);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true 
        });
        
        // Create text mesh
        const textGeometry = new THREE.PlaneGeometry(1.2, 1.2);
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.y = 0.11;
        textMesh.rotation.x = -Math.PI / 2;
        
        tokenMesh.add(textMesh);
    }
    
    /**
     * Render the robber
     */
    renderRobber(robber) {
        const geometry = this.geometries.get('robber');
        const material = this.materials.get('robber');
        
        const mesh = new THREE.Mesh(geometry, material);
        const hexPos = robber.hex.toPixelCoordinates(2);
        
        mesh.position.set(hexPos.x, 1.2, hexPos.z);
        mesh.castShadow = true;
        
        mesh.userData = { gameObject: robber, type: 'robber' };
        
        this.scene.add(mesh);
        this.meshes.set(robber.id, mesh);
    }
    
    /**
     * Clear all board meshes
     */
    clearBoard() {
        this.meshes.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        });
        this.meshes.clear();
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Handle mouse movement for hover effects
     */
    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Raycast for hover detection
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        
        // Reset previous hover
        if (this.hoveredObject) {
            this.hoveredObject.material.emissive.setHex(0x000000);
            this.hoveredObject = null;
        }
        
        // Set new hover
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData.gameObject) {
                this.hoveredObject = object;
                object.material.emissive.setHex(0x444444);
            }
        }
    }
    
    /**
     * Handle mouse clicks for interaction
     */
    onMouseClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            const gameObject = object.userData.gameObject;
            
            if (gameObject) {
                this.onGameObjectClick(gameObject, object.userData.type);
            }
        }
    }
    
    /**
     * Handle clicking on game objects
     */
    onGameObjectClick(gameObject, type) {
        console.log(`🖱️ Clicked ${type}:`, gameObject.toString());
        
        // Emit custom event for game logic to handle
        const event = new CustomEvent('gameObjectClick', {
            detail: { gameObject, type }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Start the render loop
     */
    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Update controls
            this.controls.update();
            
            // Track FPS
            this.updateFPS();
            
            // Render
            this.renderer.clear();
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }
    
    /**
     * Update FPS counter
     */
    updateFPS() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }
    
    /**
     * Get renderer statistics
     */
    getStats() {
        return {
            fps: this.fps,
            meshes: this.meshes.size,
            geometries: this.geometries.size,
            materials: this.materials.size,
            triangles: this.renderer.info.render.triangles,
            calls: this.renderer.info.render.calls
        };
    }
    
    /**
     * Debug representation
     */
    toString() {
        const stats = this.getStats();
        return `Renderer3D - ${stats.fps}fps, ${stats.meshes} meshes, ${stats.calls} draw calls`;
    }
}