class CatanGame {
    constructor() {
        this.socket = io();
        this.board = new CatanBoard3D();
        this.players = [];
        this.currentPlayer = 0;
        this.gameState = 'waiting';
        
        this.initSocketEvents();
    }
    
    initSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updatePlayerCount(1);
            this.board.generateBoard();
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
        
        this.socket.on('player-joined', (data) => {
            this.updatePlayerCount(data.playerCount);
        });
        
        this.socket.on('player-left', (data) => {
            this.updatePlayerCount(data.playerCount);
        });
    }
    
    updatePlayerCount(count) {
        document.getElementById('player-count').textContent = count;
    }
    
    startGame() {
        this.gameState = 'playing';
        this.socket.emit('start-game');
    }
}