class GamePieces {
    constructor(scene) {
        this.scene = scene;
        this.playerColors = [0xff0000, 0x0000ff, 0xffa500, 0xffffff]; // Red, Blue, Orange, White
        this.settlements = [];
        this.cities = [];
        this.roads = [];
        this.robber = null;
        this.dice = [];
    }
    
    // Create 3D settlement (house-shaped)
    createSettlement(color, position) {
        const group = new THREE.Group();
        
        // Base (cube)
        const baseGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: color });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.4;
        group.add(base);
        
        // Roof (pyramid)
        const roofGeometry = new THREE.ConeGeometry(0.6, 0.6, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown roof
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 1.1;
        roof.rotation.y = Math.PI / 4;
        group.add(roof);
        
        group.position.copy(position);
        group.castShadow = true;
        group.receiveShadow = true;
        
        this.scene.add(group);
        this.settlements.push(group);
        return group;
    }
    
    // Create 3D city (church-shaped)
    createCity(color, position) {
        const group = new THREE.Group();
        
        // Main building (larger cube)
        const mainGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        const mainMaterial = new THREE.MeshLambertMaterial({ color: color });
        const main = new THREE.Mesh(mainGeometry, mainMaterial);
        main.position.y = 0.6;
        group.add(main);
        
        // Tower (cylinder)
        const towerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        const towerMaterial = new THREE.MeshLambertMaterial({ color: color });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(0.4, 1.5, 0.4);
        group.add(tower);
        
        // Spire (cone)
        const spireGeometry = new THREE.ConeGeometry(0.2, 0.6, 8);
        const spireMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 }); // Gold spire
        const spire = new THREE.Mesh(spireGeometry, spireMaterial);
        spire.position.set(0.4, 2.5, 0.4);
        group.add(spire);
        
        // Main roof
        const roofGeometry = new THREE.ConeGeometry(0.9, 0.8, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 1.6;
        roof.rotation.y = Math.PI / 4;
        group.add(roof);
        
        group.position.copy(position);
        group.castShadow = true;
        group.receiveShadow = true;
        
        this.scene.add(group);
        this.cities.push(group);
        return group;
    }
    
    // Create 3D road (bar-shaped)
    createRoad(color, startPos, endPos) {
        const direction = new THREE.Vector3().subVectors(endPos, startPos);
        const distance = direction.length();
        
        const roadGeometry = new THREE.BoxGeometry(0.3, 0.2, distance);
        const roadMaterial = new THREE.MeshLambertMaterial({ color: color });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        
        // Position road at midpoint
        const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        road.position.copy(midpoint);
        road.position.y = 0.1;
        
        // Rotate road to align with direction
        road.lookAt(endPos);
        road.rotateX(Math.PI / 2);
        
        road.castShadow = true;
        road.receiveShadow = true;
        
        this.scene.add(road);
        this.roads.push(road);
        return road;
    }
    
    // Create 3D robber (dark hooded figure)
    createRobber(position) {
        const group = new THREE.Group();
        
        // Body (cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.6, 1.5, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        group.add(body);
        
        // Head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        group.add(head);
        
        // Hood (cone)
        const hoodGeometry = new THREE.ConeGeometry(0.4, 0.6, 8);
        const hoodMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
        hood.position.y = 2.2;
        group.add(hood);
        
        group.position.copy(position);
        group.castShadow = true;
        
        this.scene.add(group);
        this.robber = group;
        return group;
    }
    
    // Create 3D dice
    createDice(color, position) {
        const diceGeometry = new THREE.BoxGeometry(1, 1, 1);
        const diceMaterial = new THREE.MeshLambertMaterial({ color: color });
        const dice = new THREE.Mesh(diceGeometry, diceMaterial);
        
        // Add rounded edges
        diceGeometry.computeVertexNormals();
        
        // Add dots (simple approach with small spheres)
        const dotGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const dotMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        // Add dots for face 1 (center dot)
        const dot1 = new THREE.Mesh(dotGeometry, dotMaterial);
        dot1.position.set(0, 0, 0.51);
        dice.add(dot1);
        
        dice.position.copy(position);
        dice.castShadow = true;
        dice.receiveShadow = true;
        
        this.scene.add(dice);
        this.dice.push(dice);
        return dice;
    }
    
    // Animate dice roll
    rollDice(dice, targetValue, duration = 2000) {
        const startTime = Date.now();
        const startRotation = { x: dice.rotation.x, y: dice.rotation.y, z: dice.rotation.z };
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                // Spinning animation
                dice.rotation.x = startRotation.x + progress * Math.PI * 8;
                dice.rotation.y = startRotation.y + progress * Math.PI * 6;
                dice.rotation.z = startRotation.z + progress * Math.PI * 4;
                
                requestAnimationFrame(animate);
            } else {
                // Final rotation based on target value
                this.setDiceFace(dice, targetValue);
            }
        };
        
        animate();
    }
    
    // Set dice to show specific face
    setDiceFace(dice, value) {
        // Reset rotation
        dice.rotation.set(0, 0, 0);
        
        // Rotate to show the correct face
        switch(value) {
            case 1: dice.rotation.set(0, 0, 0); break;
            case 2: dice.rotation.set(0, 0, Math.PI/2); break;
            case 3: dice.rotation.set(0, -Math.PI/2, 0); break;
            case 4: dice.rotation.set(0, Math.PI/2, 0); break;
            case 5: dice.rotation.set(0, 0, -Math.PI/2); break;
            case 6: dice.rotation.set(Math.PI, 0, 0); break;
        }
    }
    
    // Remove all pieces of a specific type
    clearPieces(type) {
        const pieces = this[type];
        pieces.forEach(piece => this.scene.remove(piece));
        this[type] = [];
    }
    
    // Get player color
    getPlayerColor(playerIndex) {
        return this.playerColors[playerIndex % this.playerColors.length];
    }
}