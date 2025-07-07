# 🔧 Natac API Reference

Complete reference for the Natac game engine objects and methods.

## 🎲 Core Game Objects

### **Hex**
Represents a single hexagonal terrain tile.

```javascript
// Constructor
const hex = new Hex(q, r, terrain);

// Properties
hex.q              // Axial Q coordinate
hex.r              // Axial R coordinate  
hex.s              // Derived S coordinate (-q - r)
hex.terrain        // 'forest', 'hills', 'mountains', 'fields', 'pasture', 'desert'
hex.numberToken    // NumberToken object or null
hex.hasRobber      // Boolean
hex.vertices       // Array of 6 Vertex objects
hex.edges          // Array of 6 Edge objects
hex.neighbors      // Array of neighboring Hex objects

// Methods
hex.canProduceResources()        // Returns boolean
hex.getResourceType()            // Returns 'lumber', 'brick', 'ore', 'grain', 'wool', or null
hex.shouldProduce(diceRoll)      // Returns boolean if should produce for dice roll
hex.getAdjacentBuildings()       // Returns array of settlements/cities
hex.toPixelCoordinates(size)     // Returns {x, z} for 3D positioning
hex.distanceTo(otherHex)         // Returns distance between hexes
hex.toString()                   // Returns debug string
hex.getDebugInfo()               // Returns debug object
```

### **Vertex**
Represents a corner where exactly 3 hexes meet (settlement/city placement).

```javascript
// Constructor
const vertex = new Vertex(q, r, direction);

// Properties
vertex.q               // Hex Q coordinate
vertex.r               // Hex R coordinate
vertex.direction       // Direction 0-5 (N, NE, SE, S, SW, NW)
vertex.building        // Settlement or City object or null
vertex.port            // Port object or null
vertex.hexes           // Array of 3 Hex objects
vertex.edges           // Array of 3 Edge objects
vertex.adjacentVertices // Array of connected vertices

// Methods
vertex.canPlaceSettlement(player)    // Returns boolean
vertex.canPlaceCity(player)          // Returns boolean
vertex.placeSettlement(settlement)   // Returns boolean, places settlement
vertex.upgradeToCity(city)           // Returns old settlement or null
vertex.getResourceHexes()            // Returns hexes that produce resources
vertex.isConnectedToPlayer(player)   // Returns boolean if connected by roads
vertex.getConnectedVertices(player)  // Returns vertices connected by player's roads
vertex.toPixelCoordinates(hexSize)   // Returns {x, z} for 3D positioning
vertex.toString()                    // Returns debug string
vertex.getDebugInfo()                // Returns debug object
```

### **Edge**
Represents a side between two hexes (road placement).

```javascript
// Constructor
const edge = new Edge(q, r, direction);

// Properties
edge.q              // Hex Q coordinate
edge.r              // Hex R coordinate
edge.direction      // Direction 0-5 (NE, E, SE, SW, W, NW)
edge.road           // Road object or null
edge.hexes          // Array of 1-2 Hex objects
edge.vertices       // Array of 2 Vertex objects
edge.adjacentEdges  // Array of connected edges

// Methods
edge.canPlaceRoad(player)           // Returns boolean
edge.placeRoad(road)                // Returns boolean, places road
edge.isCoastal()                    // Returns boolean if borders sea
edge.getRoadLength(player, visited) // Returns continuous road length
edge.toPixelCoordinates(hexSize)    // Returns {x, z, rotation} for 3D positioning
edge.getVertices()                  // Returns copy of vertices array
edge.connectsVertices(v1, v2)       // Returns boolean
edge.toString()                     // Returns debug string
edge.getDebugInfo()                 // Returns debug object
```

### **NumberToken**
Represents number chits (2-12) placed on terrain hexes.

```javascript
// Constructor
const token = new NumberToken(value);

// Properties
token.value         // Number 2-12
token.hex           // Hex this token is on
token.probability   // Number of ways to roll with 2 dice
token.dots          // Red dots indicating probability

// Methods
token.calculateProbability(value)    // Returns probability count
token.getProbabilityPercent()        // Returns percentage (1 decimal)
token.isHighProbability()            // Returns true for 6, 8
token.isLowProbability()             // Returns true for 2, 12
token.getColor()                     // Returns 'red' or 'black'
token.placeOnHex(hex)                // Places token on hex
token.removeFromHex()                // Removes from current hex
token.getAffectedBuildings()         // Returns buildings that get resources
token.isBlockedByRobber()            // Returns boolean
token.toString()                     // Returns debug string
token.getDebugInfo()                 // Returns debug object

// Static method
NumberToken.createStandardSet()      // Returns array of 18 standard tokens
```

## 🏠 Game Pieces

### **GamePiece** (Base Class)
Base class for all placeable game pieces.

```javascript
// Properties
piece.owner        // Player object
piece.type         // 'settlement', 'city', 'road', 'robber'
piece.id           // Unique identifier
piece.mesh         // 3D mesh reference
piece.placedAt     // Vertex, Edge, or Hex depending on type
piece.placedTurn   // Turn number when placed

// Methods
piece.remove()         // Remove from board
piece.getDebugInfo()   // Returns debug object
```

### **Settlement**
Provides 1 resource per adjacent hex, 1 victory point.

```javascript
// Constructor
const settlement = new Settlement(owner);

// Properties
settlement.victoryPoints      // Always 1
settlement.resourceMultiplier // Always 1
settlement.vertex            // Vertex where placed

// Methods
settlement.placeOn(vertex)           // Returns boolean, places on vertex
settlement.getResourceHexes()        // Returns adjacent resource hexes
settlement.collectResources(diceRoll) // Returns array of resources collected
settlement.canUpgradeToCity()        // Returns boolean
settlement.toString()                // Returns debug string
```

### **City**
Provides 2 resources per adjacent hex, 2 victory points.

```javascript
// Constructor
const city = new City(owner);

// Properties
city.victoryPoints      // Always 2
city.resourceMultiplier // Always 2
city.vertex            // Vertex where placed

// Methods
city.placeOn(vertex)           // Returns old settlement or null
city.getResourceHexes()        // Returns adjacent resource hexes
city.collectResources(diceRoll) // Returns array of resources (2x settlement)
city.toString()                // Returns debug string
```

### **Road**
Connects settlements/cities, enables expansion.

```javascript
// Constructor
const road = new Road(owner);

// Properties
road.edge  // Edge where placed

// Methods
road.placeOn(edge)               // Returns boolean, places on edge
road.getRoadNetworkLength()      // Returns length of connected road network
road.connectsVertices(v1, v2)    // Returns boolean
road.getConnectedVertices()      // Returns vertices connected by this road
road.toString()                  // Returns debug string
```

### **Robber**
Blocks resource production, enables stealing.

```javascript
// Constructor
const robber = new Robber();

// Properties
robber.hex  // Hex where robber is placed

// Methods
robber.moveTo(hex)              // Move to new hex
robber.getAdjacentPlayers()     // Returns players with adjacent buildings
robber.isBlocking(hex)          // Returns boolean
robber.toString()               // Returns debug string
robber.getDebugInfo()           // Returns debug object with adjacent players
```

## 👤 Player

Represents a player with resources, pieces, and game state.

```javascript
// Constructor
const player = new Player(color, name);

// Properties
player.id                    // Unique identifier
player.color                 // 'red', 'blue', 'orange', 'white'
player.name                  // Player name
player.settlements           // Array of Settlement objects
player.cities               // Array of City objects
player.roads                // Array of Road objects
player.settlementsRemaining // Number remaining to place
player.citiesRemaining      // Number remaining to place
player.roadsRemaining       // Number remaining to place
player.resources            // Object with lumber, brick, ore, grain, wool counts
player.developmentCards     // Object with card counts
player.victoryPoints        // Current victory points
player.knightsPlayed        // Number of knights played
player.hasLongestRoad       // Boolean
player.hasLargestArmy       // Boolean

// Resource Management
player.addResources(type, amount)     // Add resources
player.removeResources(type, amount)  // Remove resources
player.getTotalResources()            // Returns total resource count
player.canAfford(buildingType)        // Returns boolean
player.payFor(buildingType)           // Returns boolean, deducts cost

// Building
player.buildSettlement(vertex)        // Returns Settlement or null
player.buildCity(vertex)              // Returns {city, oldSettlement} or null
player.buildRoad(edge)                // Returns Road or null

// Game State
player.updateVictoryPoints()          // Calculate and update VP
player.getLongestRoadLength()         // Returns longest continuous road
player.collectFromDiceRoll(diceRoll)  // Returns resources collected
player.discardHalf()                  // Returns discarded resources (robber)
player.toString()                     // Returns debug string
player.getDebugInfo()                 // Returns comprehensive debug object
```

## 🗺️ Board

Manages the entire game board: hexes, vertices, edges, relationships.

```javascript
// Constructor
const board = new Board();

// Properties
board.hexes         // Map: "q,r" -> Hex object
board.vertices      // Map: "q,r,direction" -> Vertex object
board.edges         // Map: "q,r,direction" -> Edge object
board.numberTokens  // Array of NumberToken objects
board.robber        // Robber object
board.isGenerated   // Boolean
board.boardType     // 'standard', 'beginner', 'custom'

// Board Generation
board.generateStandardBoard()         // Generate 19-hex Catan board
board.addHex(hex)                    // Add hex to board
board.getHex(q, r)                   // Returns hex at coordinates
board.clear()                        // Clear entire board

// Relationships
board.buildRelationships()           // Build all hex-vertex-edge relationships
board.createVerticesForHex(hex)      // Create vertices around hex
board.createEdgesForHex(hex)         // Create edges around hex
board.linkHexRelationships(hex)      // Link neighbors and vertex-edge connections

// Coordinate Calculations
board.getVertexCoords(hexQ, hexR, direction)  // Returns vertex coordinates
board.getEdgeCoords(hexQ, hexR, direction)    // Returns edge coordinates

// Game Mechanics
board.placeNumberTokens()            // Place random number tokens
board.placeRobberOnDesert()          // Place robber on desert hex
board.getProducingHexes(diceRoll)    // Returns hexes that produce resources
board.getValidSettlementPlacements() // Returns valid vertex placements
board.getValidRoadPlacements(player) // Returns valid edge placements for player

// Utilities
board.shuffleArray(array)            // Returns shuffled copy
board.getStats()                     // Returns board statistics
board.toString()                     // Returns debug string
board.getDebugInfo()                 // Returns comprehensive debug object
```

## 🎮 Game

Manages the entire game: rules, turns, players, win conditions.

```javascript
// Constructor
const game = new Game();

// Properties
game.board              // Board object
game.players            // Array of Player objects
game.dice               // Array of 2 Dice objects
game.gamePhase          // 'waiting', 'setup', 'playing', 'finished'
game.currentPlayerIndex // Index of current player
game.turnNumber         // Current turn number
game.setupRound         // Setup round (1 or 2)
game.setupDirection     // Setup direction (1 forward, -1 reverse)
game.hasRolledDice      // Boolean for current turn
game.diceResult         // {die1, die2, total} or null
game.canBuild           // Boolean
game.canTrade           // Boolean
game.eventLog           // Array of game events
game.winner             // Player object or null
game.targetVictoryPoints // Win condition (default 10)

// Player Management
game.addPlayer(color, name)     // Returns Player or null
game.getCurrentPlayer()         // Returns current Player
game.startGame()               // Returns boolean, starts game

// Piece Placement
game.placeSettlement(vertex, player)  // Returns Settlement or null
game.placeRoad(edge, player)          // Returns Road or null
game.placeSetupSettlement(vertex, player)  // Setup phase settlement
game.placeSetupRoad(edge, player)          // Setup phase road

// Turn Management
game.rollDice()                // Returns {die1, die2, total} or null
game.endTurn()                 // Advance to next player
game.endSetupTurn()            // Handle setup phase turns
game.endNormalTurn()           // Handle normal play turns

// Special Mechanics
game.handleRobberRoll()        // Handle rolling 7
game.handleResourceProduction(diceRoll)  // Distribute resources
game.moveRobber(hex)           // Returns boolean
game.checkWinCondition()       // Returns boolean, checks for winner

// Game State
game.logEvent(message)         // Add event to log
game.getGameState()           // Returns game state summary
game.toString()               // Returns debug string
game.getDebugInfo()           // Returns comprehensive debug object
```

## 🎨 3D Rendering

### **Renderer3D**
High-performance Three.js renderer.

```javascript
// Constructor
const renderer = new Renderer3D(canvas);

// Core Setup
renderer.init()                    // Initialize Three.js
renderer.setupScene()              // Create scene
renderer.setupCamera()             // Position camera
renderer.setupRenderer()           // Configure WebGL
renderer.setupLighting()           // Add lights
renderer.setupControls()           // Enable camera controls
renderer.setupInteraction()        // Enable clicking

// Asset Management
renderer.createGeometries()        // Create shared geometries
renderer.createMaterials()         // Create shared materials

// Rendering
renderer.renderBoard(board)        // Render complete board
renderer.renderHex(hex)            // Render single hex
renderer.renderNumberToken(token)  // Render number token
renderer.renderRobber(robber)      // Render robber
renderer.clearBoard()              // Remove all board meshes

// Interaction
renderer.onMouseMove(event)        // Handle hover effects
renderer.onMouseClick(event)       // Handle clicks
renderer.onGameObjectClick(gameObject, type)  // Handle game object clicks

// Utilities
renderer.onWindowResize()          // Handle window resize
renderer.startRenderLoop()         // Begin animation loop
renderer.updateFPS()               // Track performance
renderer.getStats()                // Returns performance stats
renderer.toString()                // Returns debug string
```

### **GameRenderer**
Bridge between game objects and 3D renderer.

```javascript
// Constructor
const gameRenderer = new GameRenderer(canvas);

// Setup
gameRenderer.init()                    // Initialize renderer
gameRenderer.connectToGame(game)       // Connect to game instance

// Rendering
gameRenderer.renderGame()              // Render entire game
gameRenderer.renderAllPlayerPieces()   // Render settlements, cities, roads
gameRenderer.renderSettlement(settlement, playerIndex)  // Render settlement
gameRenderer.renderCity(city, playerIndex)              // Render city
gameRenderer.renderRoad(road, playerIndex)              // Render road

// Interaction
gameRenderer.handleGameObjectClick(detail)  // Handle clicks
gameRenderer.handleHexClick(hex)            // Handle hex clicks (robber)
gameRenderer.handleVertexClick(vertex)      // Handle vertex clicks (settlement/city)
gameRenderer.handleEdgeClick(edge)          // Handle edge clicks (road)

// Updates
gameRenderer.updateGameObject(gameObject)   // Update specific object
gameRenderer.focusOnObject(gameObject)      // Camera focus
gameRenderer.resetCamera()                  // Reset camera position
gameRenderer.getStats()                     // Returns performance stats
gameRenderer.toString()                     // Returns debug string
```

## 🎲 Dice

Simple dice implementation.

```javascript
// Constructor
const dice = new Dice();

// Properties
dice.lastRoll  // Last rolled value or null

// Methods
dice.roll()      // Returns 1-6, updates lastRoll
dice.toString()  // Returns debug string
```

## 🔍 Debugging & Inspection

All objects include comprehensive debugging methods:

```javascript
// Every object has these methods
object.toString()       // Human-readable string representation
object.getDebugInfo()   // Detailed object state for inspection

// Browser console helpers (when using test pages)
inspectHex(index)       // Inspect specific hex
inspectPlayer(index)    // Inspect specific player
inspectToken(index)     // Inspect specific token
window.game            // Access main game object
window.gameRenderer    // Access 3D renderer
```

## 📊 Performance Monitoring

```javascript
// Renderer stats
const stats = renderer.getStats();
console.log(stats.fps);        // Frames per second
console.log(stats.meshes);     // Number of meshes
console.log(stats.triangles);  // Triangle count
console.log(stats.calls);      // Draw calls

// Game stats  
const gameStats = game.getDebugInfo();
console.log(gameStats.gameState);  // Current game state
console.log(gameStats.players);    // Player information
```

---

**💡 Tip**: Use the browser's developer console with the test pages to interactively explore and debug the game objects!