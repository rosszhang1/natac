class CatanBoard3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.hexTiles = [];
        this.wireframe = false;
        this.gamePieces = null;
        
        // Official Catan 19-hex board layout
        this.layout = [
            [null, null, null, 'sea', 'sea', 'sea', null, null, null],
            [null, null, 'sea', 'forest', 'pasture', 'fields', 'sea', null, null],
            [null, 'sea', 'hills', 'mountains', 'pasture', 'hills', 'fields', 'sea', null],
            ['sea', 'forest', 'desert', 'fields', 'forest', 'pasture', 'mountains', 'sea'],
            [null, 'sea', 'hills', 'fields', 'mountains', 'pasture', 'forest', 'sea', null],
            [null, null, 'sea', 'hills', 'fields', 'forest', 'sea', null, null],
            [null, null, null, 'sea', 'sea', 'sea', null, null, null]
        ];
        
        // Standard Catan terrain distribution: 4 forest, 4 pasture, 4 fields, 3 hills, 3 mountains, 1 desert
        this.terrainTypes = [
            'forest', 'forest', 'forest', 'forest',
            'pasture', 'pasture', 'pasture', 'pasture', 
            'fields', 'fields', 'fields', 'fields',
            'hills', 'hills', 'hills',
            'mountains', 'mountains', 'mountains',
            'desert'
        ];
        
        // 18 number tokens (no 7, desert gets no number)
        this.numberTokens = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
        this.currentNumberIndex = 0;
        
        this.resourceMaterials = {
            forest: new THREE.MeshLambertMaterial({ color: 0x228B22 }),
            hills: new THREE.MeshLambertMaterial({ color: 0xA0522D }),
            mountains: new THREE.MeshLambertMaterial({ color: 0x696969 }),
            fields: new THREE.MeshLambertMaterial({ color: 0xFFD700 }),
            pasture: new THREE.MeshLambertMaterial({ color: 0x90EE90 }),
            desert: new THREE.MeshLambertMaterial({ color: 0xF4A460 }),
            sea: new THREE.MeshLambertMaterial({ color: 0x4682B4, transparent: true, opacity: 0.6 })
        };
        
        this.init();
    }
    
    init() {
        const canvas = document.getElementById('game-canvas');
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Controls setup
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI / 2;
        
        // Lighting
        this.setupLighting();
        
        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        document.getElementById('reset-camera').addEventListener('click', () => this.resetCamera());
        document.getElementById('toggle-wireframe').addEventListener('click', () => this.toggleWireframe());
        
        // Initialize game pieces
        this.gamePieces = new GamePieces(this.scene);
        
        // Start animation loop
        this.animate();
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 20, 20);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);
        
        // Point light for warmth
        const pointLight = new THREE.PointLight(0xffa500, 0.3, 100);
        pointLight.position.set(0, 10, 0);
        this.scene.add(pointLight);
    }
    
    createHexGeometry() {
        const hexRadius = 2;
        const hexHeight = 0.5;
        const shape = new THREE.Shape();
        
        // Create hexagon shape
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * hexRadius;
            const y = Math.sin(angle) * hexRadius;
            if (i === 0) {
                shape.moveTo(x, y);
            } else {
                shape.lineTo(x, y);
            }
        }
        
        const extrudeSettings = {
            depth: hexHeight,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 2,
            bevelSize: 0.1,
            bevelThickness: 0.1
        };
        
        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
    
    createHexTile(resource, number, row, col) {
        const geometry = this.createHexGeometry();
        const baseMaterial = this.resourceMaterials[resource];
        if (!baseMaterial) {
            console.error('Unknown resource type:', resource);
            return null;
        }
        const material = baseMaterial.clone();
        
        const hex = new THREE.Mesh(geometry, material);
        hex.receiveShadow = true;
        hex.castShadow = true;
        
        // Position calculation for hex grid
        const hexRadius = 2;
        const hexWidth = hexRadius * 2;
        const hexHeight = hexRadius * Math.sqrt(3);
        
        const x = col * hexWidth * 0.75;
        const z = row * hexHeight + (col % 2) * hexHeight * 0.5;
        
        hex.position.set(x - 12, 0, z - 8);
        hex.rotation.x = -Math.PI / 2;
        
        hex.userData = { resource, number, row, col };
        
        // Add number token if applicable
        if (resource !== 'sea' && resource !== 'desert' && number) {
            this.addNumberToken(hex, number);
        }
        
        this.hexTiles.push(hex);
        this.scene.add(hex);
        
        return hex;
    }
    
    addNumberToken(hex, number) {
        const tokenGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 8);
        const tokenMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const token = new THREE.Mesh(tokenGeometry, tokenMaterial);
        
        token.position.copy(hex.position);
        token.position.y += 0.6;
        token.castShadow = true;
        
        // Add number text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        context.fillStyle = 'black';
        context.font = 'bold 40px Arial';
        context.textAlign = 'center';
        context.fillText(number.toString(), 32, 45);
        
        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const textGeometry = new THREE.PlaneGeometry(1, 1);
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        textMesh.position.copy(token.position);
        textMesh.position.y += 0.11;
        textMesh.rotation.x = -Math.PI / 2;
        
        this.scene.add(token);
        this.scene.add(textMesh);
    }
    
    generateBoard() {
        // Clear existing tiles
        this.hexTiles.forEach(tile => this.scene.remove(tile));
        this.hexTiles = [];
        this.currentNumberIndex = 0;
        
        // Shuffle terrain types and number tokens for randomization
        const shuffledTerrain = [...this.terrainTypes].sort(() => Math.random() - 0.5);
        const shuffledNumbers = [...this.numberTokens].sort(() => Math.random() - 0.5);
        
        let terrainIndex = 0;
        let numberIndex = 0;
        
        this.layout.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell !== null) {
                    let resource, number = null;
                    
                    if (cell === 'sea') {
                        resource = 'sea';
                    } else {
                        // Use shuffled terrain for land tiles
                        if (terrainIndex < shuffledTerrain.length) {
                            resource = shuffledTerrain[terrainIndex++];
                            
                            // Add number token if not desert
                            if (resource !== 'desert' && numberIndex < shuffledNumbers.length) {
                                number = shuffledNumbers[numberIndex++];
                            }
                        } else {
                            console.error('Not enough terrain types for layout');
                            return;
                        }
                    }
                    
                    if (resource) {
                        this.createHexTile(resource, number, rowIndex, colIndex);
                    }
                }
            });
        });
        
        // Add some demo game pieces
        this.addDemoGamePieces();
    }
    
    addDemoGamePieces() {
        // Demo settlements
        this.gamePieces.createSettlement(0xff0000, new THREE.Vector3(-4, 0, -2));
        this.gamePieces.createSettlement(0x0000ff, new THREE.Vector3(4, 0, -2));
        
        // Demo cities
        this.gamePieces.createCity(0xff0000, new THREE.Vector3(-4, 0, 2));
        this.gamePieces.createCity(0x0000ff, new THREE.Vector3(4, 0, 2));
        
        // Demo roads
        this.gamePieces.createRoad(0xff0000, new THREE.Vector3(-4, 0, -2), new THREE.Vector3(-2, 0, -1));
        this.gamePieces.createRoad(0x0000ff, new THREE.Vector3(4, 0, -2), new THREE.Vector3(2, 0, -1));
        
        // Demo robber on desert
        const desertTile = this.hexTiles.find(tile => tile.userData.resource === 'desert');
        if (desertTile) {
            this.gamePieces.createRobber(new THREE.Vector3(desertTile.position.x, 1, desertTile.position.z));
        }
        
        // Demo dice
        this.gamePieces.createDice(0xffff00, new THREE.Vector3(-8, 2, -6)); // Yellow
        this.gamePieces.createDice(0xff4500, new THREE.Vector3(-6, 2, -6)); // Red
    }
    
    resetCamera() {
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    }
    
    toggleWireframe() {
        this.wireframe = !this.wireframe;
        this.hexTiles.forEach(tile => {
            tile.material.wireframe = this.wireframe;
        });
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}