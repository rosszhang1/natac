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
        this.scene.background = new THREE.Color(0x1a1a1a); // Dark gray
        this.scene.fog = new THREE.Fog(0x1a1a1a, 50, 200);
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
        
        // Position camera for birds-eye view (looking straight down at XY plane)
        this.camera.position.set(0, 0, 30);
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
        
        // Enable tone mapping for better HDR rendering
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Enable physically correct lights
        this.renderer.physicallyCorrectLights = true;
    }
    
    /**
     * Setup realistic HDR lighting with multiple sources
     */
    setupLighting() {
        // Environment lighting setup
        this.setupEnvironmentLighting();
        
        // Key light (main sun) - warm golden hour lighting
        const keyLight = new THREE.DirectionalLight(0xfff4e6, 3.0);
        keyLight.position.set(15, 10, 25);
        keyLight.castShadow = true;
        
        // High resolution shadow map
        keyLight.shadow.mapSize.width = 4096;
        keyLight.shadow.mapSize.height = 4096;
        keyLight.shadow.camera.near = 0.1;
        keyLight.shadow.camera.far = 100;
        keyLight.shadow.camera.left = -25;
        keyLight.shadow.camera.right = 25;
        keyLight.shadow.camera.top = 25;
        keyLight.shadow.camera.bottom = -25;
        keyLight.shadow.bias = -0.0001;
        keyLight.shadow.normalBias = 0.02;
        
        this.scene.add(keyLight);
        
        // Rim light (back light) - cooler blue tone
        const rimLight = new THREE.DirectionalLight(0x87ceeb, 1.5);
        rimLight.position.set(-10, -8, 20);
        this.scene.add(rimLight);
        
        // Fill light (bounce light) - subtle warm fill
        const fillLight = new THREE.DirectionalLight(0xfff8dc, 0.8);
        fillLight.position.set(8, -12, 15);
        this.scene.add(fillLight);
        
        // Add atmospheric point lights for extra ambiance
        this.addAtmosphericLights();
    }
    
    setupEnvironmentLighting() {
        // Create HDR environment map using gradient
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        const envTexture = this.createEnvironmentTexture();
        const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
        
        // Set as scene environment
        this.scene.environment = envMap;
        
        // Ambient light - much more subtle now
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        pmremGenerator.dispose();
    }
    
    createEnvironmentTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Create sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue top
        gradient.addColorStop(0.7, '#E6E6FA'); // Lavender middle
        gradient.addColorStop(1, '#F5F5DC'); // Beige horizon
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 256);
        
        return new THREE.CanvasTexture(canvas);
    }
    
    addAtmosphericLights() {
        // Subtle warm point light
        const warmPoint = new THREE.PointLight(0xffaa88, 0.5, 30, 2);
        warmPoint.position.set(8, 8, 10);
        this.scene.add(warmPoint);
        
        // Cool accent light
        const coolPoint = new THREE.PointLight(0x88aaff, 0.3, 25, 2);
        coolPoint.position.set(-8, -8, 8);
        this.scene.add(coolPoint);
    }
    
    /**
     * Setup camera controls
     */
    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        
        // Limit camera movement for board viewing
        this.controls.minDistance = 15;
        this.controls.maxDistance = 60;
        this.controls.maxPolarAngle = Math.PI; // Allow full rotation
        
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
        // Hex tile geometry (flat disk in XY plane, thickness along Z)
        const hexGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 6);
        // Rotate to make it lie flat in XY plane with thickness along Z
        hexGeometry.rotateX(Math.PI / 2);
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
        // Rotate robber to stand upright in XY coordinate system
        robberGeometry.rotateX(Math.PI / 2);
        this.geometries.set('robber', robberGeometry);
        
        // Number token geometry
        const tokenGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16);
        // Rotate to match hex orientation (flat in XY plane)
        tokenGeometry.rotateX(Math.PI / 2);
        this.geometries.set('token', tokenGeometry);
        
        // Terrain detail geometries for immersion
        this.createTerrainDetailGeometries();
    }
    
    /**
     * Create immersive terrain details that make players want to settle here
     */
    createTerrainDetailGeometries() {
        // FOREST - Dense woodlands with valuable lumber
        this.createDenseForestGeometry();
        
        // FIELDS - Rich farmland with golden wheat ready for harvest
        this.createRichFarmlandGeometry();
        
        // MOUNTAINS - Mineral-rich peaks with visible ore veins
        this.createMineralMountainsGeometry();
        
        // PASTURE - Lush grazing lands with livestock
        this.createLushPastureGeometry();
        
        // HILLS - Clay deposits and brick-making facilities
        this.createClayHillsGeometry();
        
        // DESERT - Harsh but navigable terrain
        this.createDesertTerrainGeometry();
        
        // HEX BOUNDARIES - Dirt paths connecting regions
        this.createHexBoundaryPaths();
    }
    
    createDenseForestGeometry() {
        // Tall, majestic trees that look valuable for lumber
        const treeTrunk = new THREE.CylinderGeometry(0.08, 0.12, 1.4, 8);
        treeTrunk.rotateX(Math.PI / 2);
        
        // Detailed bark texture through geometry
        const trunkPositions = treeTrunk.attributes.position.array;
        for (let i = 0; i < trunkPositions.length; i += 9) {
            const noise = (Math.random() - 0.5) * 0.015;
            trunkPositions[i] += noise;
            trunkPositions[i + 3] += noise;
            trunkPositions[i + 6] += noise;
        }
        this.geometries.set('forest_trunk', treeTrunk);
        
        // Layered, lush canopy
        const canopyLower = new THREE.DodecahedronGeometry(0.35, 1);
        canopyLower.translate(0, 0, 0.7);
        this.geometries.set('forest_canopy_lower', canopyLower);
        
        const canopyUpper = new THREE.DodecahedronGeometry(0.28, 1);
        canopyUpper.translate(0, 0, 1.0);
        this.geometries.set('forest_canopy_upper', canopyUpper);
        
        // Fallen logs (lumber resources)
        const fallenLog = new THREE.CylinderGeometry(0.06, 0.08, 0.8, 8);
        fallenLog.rotateY(Math.PI / 2);
        this.geometries.set('forest_log', fallenLog);
        
        // Undergrowth
        const bush = new THREE.IcosahedronGeometry(0.12, 1);
        bush.scale(1, 0.6, 1);
        this.geometries.set('forest_bush', bush);
    }
    
    createRichFarmlandGeometry() {
        // Organized wheat fields in rows
        const wheatRow = new THREE.BufferGeometry();
        const positions = [];
        const normals = [];
        
        // Create a row of wheat stalks
        for (let i = 0; i < 12; i++) {
            const x = (i - 6) * 0.08;
            const height = 0.4 + Math.random() * 0.1;
            
            positions.push(x, 0, 0, x, 0, height);
            normals.push(0, 1, 0, 0, 1, 0);
        }
        
        wheatRow.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        wheatRow.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        wheatRow.rotateX(Math.PI / 2);
        this.geometries.set('field_wheat_row', wheatRow);
        
        // Farmhouse - a place settlers would want to live
        const farmhouseBase = new THREE.BoxGeometry(0.25, 0.18, 0.22);
        farmhouseBase.rotateX(Math.PI / 2);
        this.geometries.set('field_farmhouse', farmhouseBase);
        
        const farmhouseRoof = new THREE.ConeGeometry(0.18, 0.12, 4);
        farmhouseRoof.rotateX(Math.PI / 2);
        farmhouseRoof.rotateZ(Math.PI / 4);
        this.geometries.set('field_roof', farmhouseRoof);
        
        // Windmill for grain processing
        const millBase = new THREE.CylinderGeometry(0.06, 0.08, 0.9, 8);
        millBase.rotateX(Math.PI / 2);
        this.geometries.set('field_windmill', millBase);
        
        // Storage barn
        const barn = new THREE.BoxGeometry(0.3, 0.15, 0.2);
        barn.rotateX(Math.PI / 2);
        this.geometries.set('field_barn', barn);
    }
    
    createMineralMountainsGeometry() {
        // Exposed ore veins (visible resources)
        const oreVein = new THREE.BoxGeometry(0.4, 0.08, 0.15);
        oreVein.rotateX(Math.PI / 2);
        this.geometries.set('mountain_ore_vein', oreVein);
        
        // Mining cart on rails
        const miningCart = new THREE.BoxGeometry(0.12, 0.08, 0.08);
        miningCart.rotateX(Math.PI / 2);
        this.geometries.set('mountain_cart', miningCart);
        
        // Mine shaft entrance with support beams
        const mineShaft = new THREE.BoxGeometry(0.25, 0.3, 0.25);
        mineShaft.rotateX(Math.PI / 2);
        this.geometries.set('mountain_shaft', mineShaft);
        
        // Support timber
        const supportBeam = new THREE.BoxGeometry(0.25, 0.04, 0.04);
        supportBeam.rotateX(Math.PI / 2);
        this.geometries.set('mountain_support', supportBeam);
        
        // Rocky outcrops showing mineral wealth
        const mineralRock = new THREE.DodecahedronGeometry(0.18, 1);
        this.geometries.set('mountain_rock', mineralRock);
        
        // Pickaxe (tool left by miners)
        const pickaxeHandle = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 6);
        pickaxeHandle.rotateX(Math.PI / 2);
        this.geometries.set('mountain_pickaxe', pickaxeHandle);
    }
    
    createLushPastureGeometry() {
        // Sheep with realistic proportions
        const sheepBody = new THREE.SphereGeometry(0.16, 12, 8);
        sheepBody.scale(1.3, 0.9, 1.1);
        this.geometries.set('pasture_sheep_body', sheepBody);
        
        const sheepHead = new THREE.SphereGeometry(0.08, 8, 6);
        this.geometries.set('pasture_sheep_head', sheepHead);
        
        const sheepLeg = new THREE.CylinderGeometry(0.015, 0.02, 0.12, 6);
        sheepLeg.rotateX(Math.PI / 2);
        this.geometries.set('pasture_sheep_leg', sheepLeg);
        
        // Shepherd's hut
        const shepherdHut = new THREE.BoxGeometry(0.2, 0.12, 0.15);
        shepherdHut.rotateX(Math.PI / 2);
        this.geometries.set('pasture_hut', shepherdHut);
        
        // Wooden fence posts
        const fencePost = new THREE.CylinderGeometry(0.01, 0.015, 0.2, 6);
        fencePost.rotateX(Math.PI / 2);
        this.geometries.set('pasture_fence', fencePost);
        
        // Water trough
        const waterTrough = new THREE.BoxGeometry(0.15, 0.08, 0.05);
        waterTrough.rotateX(Math.PI / 2);
        this.geometries.set('pasture_trough', waterTrough);
        
        // Hay bales
        const hayBale = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 8);
        hayBale.rotateX(Math.PI / 2);
        this.geometries.set('pasture_hay', hayBale);
    }
    
    createClayHillsGeometry() {
        // Brick kiln with smoking chimney
        const kilnBase = new THREE.CylinderGeometry(0.22, 0.28, 0.35, 12);
        kilnBase.rotateX(Math.PI / 2);
        this.geometries.set('hills_kiln', kilnBase);
        
        const kilnChimney = new THREE.CylinderGeometry(0.04, 0.05, 0.5, 8);
        kilnChimney.rotateX(Math.PI / 2);
        this.geometries.set('hills_chimney', kilnChimney);
        
        // Clay deposits (raw materials)
        const clayDeposit = new THREE.IcosahedronGeometry(0.12, 0);
        clayDeposit.scale(1.5, 0.4, 1.2);
        this.geometries.set('hills_clay', clayDeposit);
        
        // Stacked bricks (finished product)
        const brickStack = new THREE.BoxGeometry(0.12, 0.08, 0.06);
        brickStack.rotateX(Math.PI / 2);
        this.geometries.set('hills_bricks', brickStack);
        
        // Pottery workshop
        const workshop = new THREE.BoxGeometry(0.18, 0.12, 0.15);
        workshop.rotateX(Math.PI / 2);
        this.geometries.set('hills_workshop', workshop);
    }
    
    createDesertTerrainGeometry() {
        // Cactus - hardy desert vegetation
        const cactusMain = new THREE.CylinderGeometry(0.05, 0.07, 0.6, 8);
        cactusMain.rotateX(Math.PI / 2);
        this.geometries.set('desert_cactus_main', cactusMain);
        
        const cactusArm = new THREE.CylinderGeometry(0.03, 0.04, 0.25, 6);
        cactusArm.rotateX(Math.PI / 2);
        this.geometries.set('desert_cactus_arm', cactusArm);
        
        // Desert rocks and formations
        const desertRock = new THREE.DodecahedronGeometry(0.15, 0);
        desertRock.scale(1.4, 0.7, 1.1);
        this.geometries.set('desert_rock', desertRock);
        
        // Oasis (rare water source)
        const oasisWater = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 12);
        oasisWater.rotateX(Math.PI / 2);
        this.geometries.set('desert_oasis', oasisWater);
        
        // Palm tree at oasis
        const palmTrunk = new THREE.CylinderGeometry(0.04, 0.06, 0.8, 8);
        palmTrunk.rotateX(Math.PI / 2);
        this.geometries.set('desert_palm_trunk', palmTrunk);
        
        const palmFrond = new THREE.BoxGeometry(0.4, 0.08, 0.02);
        palmFrond.rotateX(Math.PI / 2);
        this.geometries.set('desert_palm_frond', palmFrond);
    }
    
    createHexBoundaryPaths() {
        // Dirt road connecting hexes - where settlers would travel
        const roadSegment = new THREE.BoxGeometry(0.12, 3.8, 0.03);
        roadSegment.rotateX(Math.PI / 2);
        this.geometries.set('boundary_road', roadSegment);
        
        // Road intersection where 3 hexes meet
        const intersection = new THREE.CylinderGeometry(0.15, 0.15, 0.03, 6);
        intersection.rotateX(Math.PI / 2);
        this.geometries.set('boundary_intersection', intersection);
        
        // Milestone markers
        const milestone = new THREE.CylinderGeometry(0.03, 0.04, 0.2, 6);
        milestone.rotateX(Math.PI / 2);
        this.geometries.set('boundary_milestone', milestone);
    }
    
    /**
     * Create shared materials for efficiency
     */
    createMaterials() {
        // Terrain materials with procedural textures
        const terrainMaterials = this.createProceduralTextures();
        
        Object.entries(terrainMaterials).forEach(([terrain, material]) => {
            this.materials.set(`terrain_${terrain}`, material);
        });
        
        // Player materials (6 players)
        const playerColors = [0xff0000, 0x0000ff, 0xffa500, 0xffffff, 0x00ff00, 0x800080]; // red, blue, orange, white, green, purple
        playerColors.forEach((color, index) => {
            const material = new THREE.MeshLambertMaterial({ color });
            this.materials.set(`player_${index}`, material);
        });
        
        // Special materials
        this.materials.set('robber', new THREE.MeshLambertMaterial({ color: 0x2F2F2F }));
        this.materials.set('token', new THREE.MeshLambertMaterial({ color: 0xffffff }));
        this.materials.set('roof', new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
        
        // Immersive terrain detail materials
        // Forest materials
        this.materials.set('forest_trunk', new THREE.MeshStandardMaterial({ color: 0x4a2c17, roughness: 0.9, metalness: 0.0 }));
        this.materials.set('forest_canopy', new THREE.MeshStandardMaterial({ color: 0x0d4d0d, roughness: 0.8, metalness: 0.0 }));
        this.materials.set('forest_log', new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.7, metalness: 0.0 }));
        this.materials.set('forest_bush', new THREE.MeshStandardMaterial({ color: 0x2d5a2d, roughness: 0.8, metalness: 0.0 }));
        
        // Field materials
        this.materials.set('field_wheat', new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.9, metalness: 0.0 }));
        this.materials.set('field_building', new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.7, metalness: 0.0 }));
        this.materials.set('field_roof', new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.6, metalness: 0.0 }));
        this.materials.set('field_windmill', new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.8, metalness: 0.0 }));
        
        // Mountain materials  
        this.materials.set('mountain_ore', new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.3, metalness: 0.8 }));
        this.materials.set('mountain_cart', new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8, metalness: 0.0 }));
        this.materials.set('mountain_shaft', new THREE.MeshStandardMaterial({ color: 0x2c1810, roughness: 0.9, metalness: 0.0 }));
        this.materials.set('mountain_rock', new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, metalness: 0.1 }));
        this.materials.set('mountain_tool', new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7, metalness: 0.0 }));
        
        // Pasture materials
        this.materials.set('pasture_sheep_body', new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.0 }));
        this.materials.set('pasture_sheep_head', new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.0 }));
        this.materials.set('pasture_building', new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.8, metalness: 0.0 }));
        this.materials.set('pasture_fence', new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9, metalness: 0.0 }));
        this.materials.set('pasture_hay', new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.8, metalness: 0.0 }));
        
        // Hills materials
        this.materials.set('hills_kiln', new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8, metalness: 0.0 }));
        this.materials.set('hills_clay', new THREE.MeshStandardMaterial({ color: 0x6b3d1f, roughness: 0.9, metalness: 0.0 }));
        this.materials.set('hills_brick', new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.7, metalness: 0.0 }));
        this.materials.set('hills_chimney', new THREE.MeshStandardMaterial({ color: 0x2f2f2f, roughness: 0.6, metalness: 0.1 }));
        
        // Desert materials
        this.materials.set('desert_cactus', new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8, metalness: 0.0 }));
        this.materials.set('desert_rock', new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.9, metalness: 0.0 }));
        this.materials.set('desert_oasis', new THREE.MeshStandardMaterial({ color: 0x4682b4, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.7 }));
        this.materials.set('desert_palm', new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8, metalness: 0.0 }));
        this.materials.set('desert_frond', new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.7, metalness: 0.0 }));
        
        // Road materials
        this.materials.set('road_dirt', new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.95, metalness: 0.0 }));
        this.materials.set('road_stone', new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.8, metalness: 0.0 }));
    }
    
    /**
     * Create high-quality PBR materials with textures and normal maps
     */
    createProceduralTextures() {
        const materials = {};
        
        // Forest - rich organic material
        materials.forest = this.createAdvancedForestMaterial();
        
        // Fields - detailed wheat/grain texture
        materials.fields = this.createAdvancedFieldsMaterial();
        
        // Mountains - realistic rocky surface
        materials.mountains = this.createAdvancedMountainMaterial();
        
        // Pasture - lush grass with variation
        materials.pasture = this.createAdvancedPastureMaterial();
        
        // Hills - clay and earth tones
        materials.hills = this.createAdvancedHillsMaterial();
        
        // Desert - sandy dunes with detail
        materials.desert = this.createAdvancedDesertMaterial();
        
        return materials;
    }
    
    createAdvancedForestMaterial() {
        // Create detailed forest floor texture
        const diffuseCanvas = document.createElement('canvas');
        diffuseCanvas.width = 256;
        diffuseCanvas.height = 256;
        const diffuseCtx = diffuseCanvas.getContext('2d');
        
        // Rich forest floor base with moss and leaves
        const gradient = diffuseCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, '#2d5a3d');
        gradient.addColorStop(0.6, '#1a4a1a');
        gradient.addColorStop(1, '#0f2f1f');
        diffuseCtx.fillStyle = gradient;
        diffuseCtx.fillRect(0, 0, 256, 256);
        
        // Add organic debris and leaf patterns
        for (let i = 0; i < 120; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const size = 3 + Math.random() * 8;
            const hue = 90 + Math.random() * 60; // Green to brown
            const sat = 40 + Math.random() * 30;
            const light = 15 + Math.random() * 25;
            
            diffuseCtx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${0.6 + Math.random() * 0.4})`;
            diffuseCtx.beginPath();
            diffuseCtx.ellipse(x, y, size, size * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            diffuseCtx.fill();
        }
        
        // Create normal map for surface detail
        const normalCanvas = this.createNormalMap(diffuseCanvas, 0.8);
        
        const diffuseTexture = new THREE.CanvasTexture(diffuseCanvas);
        const normalTexture = new THREE.CanvasTexture(normalCanvas);
        
        diffuseTexture.wrapS = diffuseTexture.wrapT = THREE.RepeatWrapping;
        normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
        diffuseTexture.repeat.set(3, 3);
        normalTexture.repeat.set(3, 3);
        
        return new THREE.MeshStandardMaterial({
            map: diffuseTexture,
            normalMap: normalTexture,
            normalScale: new THREE.Vector2(0.5, 0.5),
            roughness: 0.9,
            metalness: 0.0,
            envMapIntensity: 0.3
        });
    }
    
    createNormalMap(sourceCanvas, strength = 1.0) {
        const canvas = document.createElement('canvas');
        canvas.width = sourceCanvas.width;
        canvas.height = sourceCanvas.height;
        const ctx = canvas.getContext('2d');
        
        const sourceCtx = sourceCanvas.getContext('2d');
        const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const normalData = ctx.createImageData(sourceCanvas.width, sourceCanvas.height);
        
        for (let i = 0; i < sourceData.data.length; i += 4) {
            const x = (i / 4) % sourceCanvas.width;
            const y = Math.floor((i / 4) / sourceCanvas.width);
            
            // Sample surrounding pixels for gradient
            const tl = this.getPixelBrightness(sourceData, x - 1, y - 1, sourceCanvas.width);
            const tr = this.getPixelBrightness(sourceData, x + 1, y - 1, sourceCanvas.width);
            const bl = this.getPixelBrightness(sourceData, x - 1, y + 1, sourceCanvas.width);
            const br = this.getPixelBrightness(sourceData, x + 1, y + 1, sourceCanvas.width);
            
            const dX = (tr + br) - (tl + bl);
            const dY = (bl + br) - (tl + tr);
            
            normalData.data[i] = ((dX * strength + 1) * 0.5 * 255) | 0;     // R = normal X
            normalData.data[i + 1] = ((dY * strength + 1) * 0.5 * 255) | 0; // G = normal Y  
            normalData.data[i + 2] = 255;                                    // B = normal Z (up)
            normalData.data[i + 3] = 255;                                    // Alpha
        }
        
        ctx.putImageData(normalData, 0, 0);
        return canvas;
    }
    
    getPixelBrightness(imageData, x, y, width) {
        x = Math.max(0, Math.min(width - 1, x));
        y = Math.max(0, Math.min(imageData.height - 1, y));
        const i = (y * width + x) * 4;
        return (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / (3 * 255);
    }
    
    createAdvancedFieldsMaterial() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Rich farmland base
        ctx.fillStyle = '#8b7d00';
        ctx.fillRect(0, 0, 256, 256);
        
        // Add detailed wheat field patterns
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 12; col++) {
                const x = col * 21 + Math.random() * 10;
                const y = row * 32 + Math.random() * 10;
                
                // Wheat bundles
                ctx.fillStyle = `hsl(${45 + Math.random() * 15}, 80%, ${60 + Math.random() * 20}%)`;
                ctx.fillRect(x, y, 3 + Math.random() * 2, 20 + Math.random() * 8);
                
                // Individual stalks
                ctx.strokeStyle = `hsl(${50 + Math.random() * 10}, 70%, ${65 + Math.random() * 15}%)`;
                ctx.lineWidth = 0.5;
                for (let s = 0; s < 3; s++) {
                    ctx.beginPath();
                    ctx.moveTo(x + s, y);
                    ctx.lineTo(x + s + Math.random() * 2 - 1, y + 25);
                    ctx.stroke();
                }
            }
        }
        
        const normalCanvas = this.createNormalMap(canvas, 0.6);
        const diffuseTexture = new THREE.CanvasTexture(canvas);
        const normalTexture = new THREE.CanvasTexture(normalCanvas);
        
        diffuseTexture.wrapS = diffuseTexture.wrapT = THREE.RepeatWrapping;
        normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
        diffuseTexture.repeat.set(4, 4);
        normalTexture.repeat.set(4, 4);
        
        return new THREE.MeshStandardMaterial({
            map: diffuseTexture,
            normalMap: normalTexture,
            normalScale: new THREE.Vector2(0.3, 0.3),
            roughness: 0.8,
            metalness: 0.0,
            envMapIntensity: 0.2
        });
    }
    
    // Create remaining advanced materials using the same pattern
    createAdvancedMountainMaterial() {
        return this.createSimplePBRMaterial('#3d3d3d', 0.95, 0.1, 'rocky stone surface');
    }
    
    createAdvancedPastureMaterial() {
        return this.createSimplePBRMaterial('#4a6b4a', 0.8, 0.0, 'grassy pasture');
    }
    
    createAdvancedHillsMaterial() {
        return this.createSimplePBRMaterial('#6b3d1f', 0.85, 0.0, 'clay hills');
    }
    
    createAdvancedDesertMaterial() {
        return this.createSimplePBRMaterial('#8b6914', 0.7, 0.0, 'sandy desert');
    }
    
    createSimplePBRMaterial(baseColor, roughness, metalness, type) {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(baseColor),
            roughness: roughness,
            metalness: metalness,
            envMapIntensity: 0.3
        });
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
        
        // Render hex boundary roads for immersion
        this.renderHexBoundaries(board);
        
        console.log(`🎨 Rendered board: ${board.hexes.size} hexes, ${board.numberTokens.length} tokens`);
    }
    
    /**
     * Render dirt roads between hexes for settlement connectivity
     */
    renderHexBoundaries(board) {
        const processedEdges = new Set();
        
        board.hexes.forEach(hex => {
            hex.neighbors.forEach(neighbor => {
                const edgeKey = [hex.id, neighbor.id].sort().join('-');
                if (!processedEdges.has(edgeKey)) {
                    processedEdges.add(edgeKey);
                    this.renderRoadBetweenHexes(hex, neighbor);
                }
            });
        });
    }
    
    renderRoadBetweenHexes(hex1, hex2) {
        const pos1 = hex1.toPixelCoordinates(2);
        const pos2 = hex2.toPixelCoordinates(2);
        
        // Calculate road position (midpoint between hexes)
        const roadX = (pos1.x + pos2.x) / 2;
        const roadY = (pos1.z + pos2.z) / 2;
        
        // Calculate road rotation to connect hexes
        const dx = pos2.x - pos1.x;
        const dy = pos2.z - pos1.z;
        const angle = Math.atan2(dy, dx);
        
        const road = new THREE.Mesh(
            this.geometries.get('boundary_road'),
            this.materials.get('road_dirt')
        );
        
        road.position.set(roadX, roadY, 0.01);
        road.rotation.z = angle;
        road.receiveShadow = true;
        
        this.scene.add(road);
        this.meshes.set(`road_${hex1.id}_${hex2.id}`, road);
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
        
        mesh.position.set(pos.x, pos.z, 0);
        // Geometry is already rotated to lay flat
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Store reference to game object
        mesh.userData = { gameObject: hex, type: 'hex' };
        
        this.scene.add(mesh);
        this.meshes.set(hex.id, mesh);
        
        // Add terrain-specific details
        this.addTerrainDetails(hex, pos);
    }
    
    /**
     * Add terrain-specific 3D details to make each hex feel like an ecosystem
     */
    addTerrainDetails(hex, pos) {
        const detailGroup = new THREE.Group();
        
        switch(hex.terrain) {
            case 'forest':
                this.addForestDetails(detailGroup);
                break;
            case 'fields':
                this.addFieldsDetails(detailGroup);
                break;
            case 'mountains':
                this.addMountainDetails(detailGroup);
                break;
            case 'pasture':
                this.addPastureDetails(detailGroup);
                break;
            case 'hills':
                this.addHillsDetails(detailGroup);
                break;
            case 'desert':
                this.addDesertDetails(detailGroup);
                break;
        }
        
        if (detailGroup.children.length > 0) {
            detailGroup.position.set(pos.x, pos.z, 0.25);
            this.scene.add(detailGroup);
            this.meshes.set(`${hex.id}_details`, detailGroup);
        }
    }
    
    addForestDetails(group) {
        // Dense forest with valuable lumber resources
        const treeCount = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < treeCount; i++) {
            const angle = (Math.PI * 2 / treeCount) * i + Math.random() * 0.8;
            const distance = 0.4 + Math.random() * 0.9;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            // Majestic tree trunk
            const trunk = new THREE.Mesh(
                this.geometries.get('forest_trunk'),
                this.materials.get('forest_trunk')
            );
            trunk.position.set(x, y, 0.35);
            trunk.castShadow = true;
            group.add(trunk);
            
            // Layered canopy for realism
            const canopyLower = new THREE.Mesh(
                this.geometries.get('forest_canopy_lower'),
                this.materials.get('forest_canopy')
            );
            canopyLower.position.set(x, y, 0.7);
            canopyLower.castShadow = true;
            group.add(canopyLower);
            
            const canopyUpper = new THREE.Mesh(
                this.geometries.get('forest_canopy_upper'),
                this.materials.get('forest_canopy')
            );
            canopyUpper.position.set(x, y, 1.0);
            canopyUpper.castShadow = true;
            group.add(canopyUpper);
        }
        
        // Fallen logs showing lumber potential
        const logCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < logCount; i++) {
            const log = new THREE.Mesh(
                this.geometries.get('forest_log'),
                this.materials.get('forest_log')
            );
            log.position.set(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                0.05
            );
            log.rotation.z = Math.random() * Math.PI;
            log.castShadow = true;
            group.add(log);
        }
        
        // Undergrowth
        const bushCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < bushCount; i++) {
            const bush = new THREE.Mesh(
                this.geometries.get('forest_bush'),
                this.materials.get('forest_bush')
            );
            bush.position.set(
                (Math.random() - 0.5) * 2.5,
                (Math.random() - 0.5) * 2.5,
                0.05
            );
            bush.scale.setScalar(0.8 + Math.random() * 0.4);
            group.add(bush);
        }
    }
    
    addFieldsDetails(group) {
        // Add wheat stalks and a small farmhouse
        const wheatCount = 8 + Math.floor(Math.random() * 6);
        for (let i = 0; i < wheatCount; i++) {
            const x = (Math.random() - 0.5) * 2.5;
            const y = (Math.random() - 0.5) * 2.5;
            
            const wheat = new THREE.Mesh(
                this.geometries.get('wheat'),
                this.materials.get('wheat')
            );
            wheat.position.set(x, y, 0.1);
            wheat.rotation.z = Math.random() * 0.2 - 0.1; // Slight random tilt
            group.add(wheat);
        }
        
        // Small farmhouse
        const house = new THREE.Mesh(
            this.geometries.get('house'),
            this.materials.get('house')
        );
        house.position.set(0.8, 0.8, 0.1);
        house.castShadow = true;
        group.add(house);
    }
    
    addMountainDetails(group) {
        // Add rocks and mine entrance
        const rockCount = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < rockCount; i++) {
            const angle = (Math.PI * 2 / rockCount) * i + Math.random() * 0.8;
            const distance = 0.4 + Math.random() * 0.8;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            const rock = new THREE.Mesh(
                this.geometries.get('rock'),
                this.materials.get('rock')
            );
            rock.position.set(x, y, 0.1 + Math.random() * 0.1);
            rock.rotation.x = Math.random() * Math.PI;
            rock.rotation.y = Math.random() * Math.PI;
            rock.rotation.z = Math.random() * Math.PI;
            rock.castShadow = true;
            group.add(rock);
        }
        
        // Mine entrance
        const mine = new THREE.Mesh(
            this.geometries.get('mine'),
            this.materials.get('mine')
        );
        mine.position.set(-0.5, -0.5, 0.1);
        mine.castShadow = true;
        group.add(mine);
    }
    
    addPastureDetails(group) {
        // Add sheep grazing
        const sheepCount = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < sheepCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 0.3 + Math.random() * 0.9;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            // Sheep body
            const body = new THREE.Mesh(
                this.geometries.get('sheep_body'),
                this.materials.get('sheep_body')
            );
            body.position.set(x, y, 0.1);
            body.castShadow = true;
            group.add(body);
            
            // Sheep head
            const head = new THREE.Mesh(
                this.geometries.get('sheep_head'),
                this.materials.get('sheep_head')
            );
            head.position.set(x + 0.1, y, 0.15);
            head.castShadow = true;
            group.add(head);
        }
    }
    
    addHillsDetails(group) {
        // Add brick kilns and small rocks
        const kiln = new THREE.Mesh(
            this.geometries.get('kiln'),
            this.materials.get('kiln')
        );
        kiln.position.set(0, 0, 0.1);
        kiln.castShadow = true;
        group.add(kiln);
        
        // Small rocks around the kiln
        const rockCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < rockCount; i++) {
            const angle = (Math.PI * 2 / rockCount) * i;
            const x = Math.cos(angle) * 0.8;
            const y = Math.sin(angle) * 0.8;
            
            const rock = new THREE.Mesh(
                this.geometries.get('rock'),
                this.materials.get('rock')
            );
            rock.position.set(x, y, 0.05);
            rock.scale.setScalar(0.5);
            rock.rotation.x = Math.random() * Math.PI;
            rock.rotation.y = Math.random() * Math.PI;
            group.add(rock);
        }
    }
    
    addDesertDetails(group) {
        // Add sparse rocks and maybe a cactus-like structure
        const rockCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < rockCount; i++) {
            const x = (Math.random() - 0.5) * 2;
            const y = (Math.random() - 0.5) * 2;
            
            const rock = new THREE.Mesh(
                this.geometries.get('rock'),
                this.materials.get('rock')
            );
            rock.position.set(x, y, 0.05);
            rock.scale.setScalar(0.7);
            rock.rotation.x = Math.random() * Math.PI;
            rock.rotation.y = Math.random() * Math.PI;
            group.add(rock);
        }
    }
    
    /**
     * Render a number token
     */
    renderNumberToken(token) {
        const geometry = this.geometries.get('token');
        const material = this.materials.get('token');
        
        const mesh = new THREE.Mesh(geometry, material);
        const hexPos = token.hex.toPixelCoordinates(2);
        
        mesh.position.set(hexPos.x, hexPos.z, 0.3);
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
        textMesh.position.z = 0.06;
        // No rotation needed since token is already in XY plane
        
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
        
        mesh.position.set(hexPos.x, hexPos.z, 1.25);
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