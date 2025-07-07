# 🎲 Natac - Online Catan Replica

A multiplayer online version of the classic board game Catan built with Node.js, Socket.IO, and Three.js. Features a complete 3D game experience with object-oriented architecture designed from first principles.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open in browser
http://localhost:3000/natac-3d.html
```

## 🎮 Game Features

### ✅ Complete Catan Implementation
- **19-hex board** with proper terrain distribution
- **2-6 player support** - accommodates small groups to large parties
- **Smart number placement** - red numbers (6,8) never adjacent for balanced gameplay
- **Standard game rules** - setup phase, dice rolling, resource production
- **Interactive piece placement** - settlements, cities, roads
- **Robber mechanics** - blocks production, enables stealing
- **Victory conditions** - first to 10 victory points wins

### 🎨 Immersive 3D Experience
- **Cinematic PBR rendering** with HDR lighting and tone mapping
- **Living terrain ecosystems** - forests with lumber, farms with wheat, mines with ore
- **Settlement-worthy landscapes** - players see valuable regions they want to colonize
- **Dirt road network** connecting hexes with clear territorial boundaries
- **Professional materials** - realistic textures, normal maps, environmental reflections
- **Multi-light setup** - golden hour key light, blue rim light, atmospheric ambiance
- **Interactive board** - click to place pieces, move robber
- **Smooth camera controls** - birds-eye view with unlimited rotation

### 🏗️ Object-Oriented Architecture
- **Clean separation** between game logic and rendering
- **Modular components** - each game element is a debuggable object
- **Extensible design** - easy to add new features and rules
- **First principles** - built from ground up with proper foundations

## 📂 Project Structure

```
natac/
├── public/
│   ├── js/
│   │   ├── core/               # Game engine objects
│   │   │   ├── Board.js        # Manages hex grid and relationships
│   │   │   ├── Game.js         # Turn management and rules
│   │   │   ├── Hex.js          # Individual hex tiles
│   │   │   ├── Vertex.js       # Settlement/city placement points
│   │   │   ├── Edge.js         # Road placement edges
│   │   │   ├── Player.js       # Player state and inventory
│   │   │   ├── GamePieces.js   # Settlements, cities, roads, robber
│   │   │   └── NumberToken.js  # Dice number tokens (2-12)
│   │   └── rendering/          # 3D visualization
│   │       ├── Renderer3D.js   # Three.js rendering engine
│   │       └── GameRenderer.js # Bridge between game and visuals
│   ├── natac-3d.html          # Main 3D game interface
│   ├── test-core-game.html     # Game engine testing
│   ├── test-core-objects.html  # Object system testing
│   └── test-hex-coordinates.html # Coordinate system demo
├── server.js                   # Node.js server with Socket.IO
├── package.json               # Dependencies and scripts
└── DEVELOPMENT_PLAN.md        # Strategic roadmap
```

## 🎯 Core Game Objects

### **Hex System**
- **`Hex`** - Individual terrain tiles with axial coordinates
- **`Vertex`** - Corners where 3 hexes meet (settlement/city spots)
- **`Edge`** - Sides between hexes (road spots)
- **Relationships** - Hexes know their vertices/edges, enabling rule validation

### **Game Pieces**
- **`Settlement`** - Provides 1 resource per adjacent hex
- **`City`** - Provides 2 resources per adjacent hex
- **`Road`** - Connects settlements, enables expansion
- **`Robber`** - Blocks production, enables stealing

### **Game Management**
- **`Player`** - Resources, inventory, victory points
- **`Board`** - Manages 19-hex layout and relationships
- **`Game`** - Turn management, rules enforcement, win conditions

## 🔧 Technical Architecture

### **Hexagonal Coordinate System**
- **Axial coordinates (q, r)** for mathematical hex positioning
- **Pixel conversion** for 3D world positioning
- **Relationship mapping** between hexes, vertices, and edges
- **Distance calculations** and neighbor detection

### **Advanced 3D Rendering Pipeline**
- **PBR Materials** - Physically Based Rendering with roughness, metalness, normal maps
- **HDR Environment** - Image-based lighting with custom sky gradients
- **Multi-layer lighting** - Key, rim, fill, and atmospheric point lights
- **Procedural textures** - High-quality terrain surfaces with normal detail
- **Immersive ecosystems** - Each terrain type tells a visual story
- **Road network rendering** - Connecting paths between all hex territories
- **Optimized performance** - Shared geometries, efficient material system
- **Advanced shadows** - 4K shadow maps with soft PCF filtering

### **Modular Design**
- **Game logic** completely separate from rendering
- **Small, focused classes** - easy to debug and extend
- **Clean interfaces** - objects communicate through well-defined methods
- **Comprehensive debugging** - every object has inspection capabilities

## 🎮 How to Play

### **Starting a Game**
1. Open `http://localhost:3000/natac-3d.html`
2. Click "Start Game" to generate a random board
3. Game begins with setup phase

### **Setup Phase**
- Each player places 2 settlements and 2 roads
- Click vertices to place settlements
- Click edges to place roads (must connect to settlements)
- Second settlement collects initial resources

### **Normal Play**
1. **Roll Dice** - Resources produced for matching number tokens
2. **Build** - Place settlements, cities, roads (costs resources)
3. **Trade** - Exchange resources with other players
4. **End Turn** - Pass to next player

### **Victory**
- First player to reach 10 victory points wins
- Victory points from settlements (1), cities (2), longest road (2), largest army (2)

## 🛠️ Development

### **Testing & Debugging**
- **`/test-core-game.html`** - Full game engine testing
- **`/test-core-objects.html`** - Individual object inspection
- **`/test-hex-coordinates.html`** - Coordinate system visualization
- **Browser console** - Access `game` and `gameRenderer` objects

### **Performance Monitoring**
- Real-time FPS display
- Draw call and mesh count tracking
- Memory usage optimization
- Efficient geometry/material sharing

### **Extending the Game**
```javascript
// Add new terrain type
const newTerrain = new Hex(0, 0, 'volcano');
board.addHex(newTerrain);

// Create custom game piece
class Lighthouse extends GamePiece {
    constructor(owner) {
        super(owner, 'lighthouse');
        this.tradeBonus = 2;
    }
}

// Extend rendering
gameRenderer.renderCustomPiece(lighthouse);
```

## 📋 Game Rules Reference

### **Resource Production & Terrain Details**
- **🌲 Forest** → Lumber (majestic trees, fallen logs, dense undergrowth)
- **🧱 Hills** → Brick (smoking kilns, clay deposits, pottery workshops)
- **⛰️ Mountains** → Ore (exposed veins, mine shafts, mining equipment)
- **🌾 Fields** → Grain (wheat rows, farmhouses, windmills, barns)
- **🐑 Pasture** → Wool (grazing sheep, shepherd huts, hay bales, fencing)
- **🏜️ Desert** → No resources (cacti, rock formations, rare oasis)

### **Building Costs**
- **Road** - 1 Lumber + 1 Brick
- **Settlement** - 1 Lumber + 1 Brick + 1 Wool + 1 Grain
- **City** - 3 Ore + 2 Grain (upgrades settlement)

### **Special Rules**
- **Robber (7)** - Players with >7 cards discard half, move robber
- **Longest Road** - 5+ roads in continuous path = 2 victory points
- **Development Cards** - 1 Ore + 1 Wool + 1 Grain

## 🔮 Future Development

See `DEVELOPMENT_PLAN.md` for the complete 7-phase roadmap:

### **Phase 3: Complete Rules** (Next)
- Development cards and special abilities
- Trading system between players
- Ports and maritime trade
- Longest road and largest army mechanics

### **Phase 4: Multiplayer**
- Room system for multiple games
- Real-time synchronization
- Reconnection handling
- Spectator mode

### **Phase 5-7: Polish & Scale**
- Advanced UI/UX
- Mobile support
- Tournament features
- Production deployment

## 🤝 Contributing

1. **Architecture First** - Understand the object-oriented design
2. **Test Thoroughly** - Use the testing interfaces
3. **Keep it Modular** - Small, focused components
4. **Document Changes** - Update this README and code comments

## 📄 License

MIT License - Build amazing board games! 🎲

---

**Built with ❤️ using modern web technologies and first-principles design**