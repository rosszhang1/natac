class CatanBoard {
    constructor() {
        this.layout = [
            [null, null, 'water', 'water', 'water', null, null],
            [null, 'water', 'forest', 'pasture', 'fields', 'water', null],
            ['water', 'hills', 'mountains', 'pasture', 'hills', 'fields', 'water'],
            ['water', 'forest', 'desert', 'fields', 'forest', 'pasture', 'water'],
            [null, 'water', 'mountains', 'fields', 'hills', 'water', null],
            [null, null, 'water', 'water', 'water', null, null]
        ];
        
        this.numberTokens = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
        this.currentNumberIndex = 0;
    }
    
    createHexagon(resource, number, row, col) {
        const hex = document.createElement('div');
        hex.className = `hex ${resource}`;
        hex.dataset.row = row;
        hex.dataset.col = col;
        
        const content = document.createElement('div');
        content.className = 'hex-content';
        
        if (resource !== 'water' && resource !== 'desert' && number) {
            const numberDiv = document.createElement('div');
            numberDiv.className = 'hex-number';
            numberDiv.textContent = number;
            content.appendChild(numberDiv);
        }
        
        const resourceDiv = document.createElement('div');
        resourceDiv.className = 'hex-resource';
        resourceDiv.textContent = resource === 'water' ? '' : resource.toUpperCase();
        content.appendChild(resourceDiv);
        
        hex.appendChild(content);
        return hex;
    }
    
    generateBoard() {
        const hexGrid = document.getElementById('hex-grid');
        hexGrid.innerHTML = '';
        this.currentNumberIndex = 0;
        
        this.layout.forEach((row, rowIndex) => {
            const hexRow = document.createElement('div');
            hexRow.className = 'hex-row';
            
            row.forEach((resource, colIndex) => {
                if (resource !== null) {
                    let number = null;
                    if (resource !== 'water' && resource !== 'desert' && this.currentNumberIndex < this.numberTokens.length) {
                        number = this.numberTokens[this.currentNumberIndex++];
                    }
                    const hex = this.createHexagon(resource, number, rowIndex, colIndex);
                    hexRow.appendChild(hex);
                } else {
                    const spacer = document.createElement('div');
                    spacer.className = 'hex';
                    spacer.style.visibility = 'hidden';
                    hexRow.appendChild(spacer);
                }
            });
            
            hexGrid.appendChild(hexRow);
        });
    }
}