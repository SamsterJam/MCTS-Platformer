// Constants
const GRID_SIZE = 64;
const GRAVITY = 1.5;
const JUMP_FORCE = -20;
const PLAYER_SPEED = 8;
var BlockType;
(function (BlockType) {
    BlockType[BlockType["EMPTY"] = 0] = "EMPTY";
    BlockType[BlockType["PLAYER"] = 1] = "PLAYER";
    BlockType[BlockType["PLATFORM"] = 2] = "PLATFORM";
    BlockType[BlockType["OBSTACLE"] = 3] = "OBSTACLE";
    BlockType[BlockType["GOAL"] = 4] = "GOAL";
})(BlockType || (BlockType = {}));
var GameMode;
(function (GameMode) {
    GameMode[GameMode["EDIT"] = 0] = "EDIT";
    GameMode[GameMode["PLAY"] = 1] = "PLAY";
})(GameMode || (GameMode = {}));
var MCTSAction;
(function (MCTSAction) {
    MCTSAction[MCTSAction["DO_NOTHING"] = 0] = "DO_NOTHING";
    MCTSAction[MCTSAction["MOVE_RIGHT"] = 1] = "MOVE_RIGHT";
    MCTSAction[MCTSAction["MOVE_LEFT"] = 2] = "MOVE_LEFT";
    MCTSAction[MCTSAction["JUMP"] = 3] = "JUMP";
})(MCTSAction || (MCTSAction = {}));
const COLORS = {
    [BlockType.PLAYER]: "blue",
    [BlockType.PLATFORM]: "green",
    [BlockType.OBSTACLE]: "red",
    [BlockType.GOAL]: "gold"
};
class Game {
    constructor() {
        this.grid = [];
        this.mode = GameMode.EDIT;
        this.selectedBlock = BlockType.PLATFORM;
        this.playerPos = { x: 0, y: 0 };
        this.playerVelocity = { x: 0, y: 0 };
        this.isGrounded = false;
        this.keys = {};
        this.mouseDown = false;
        // MCTS
        this.mctsTree = new Map();
        this.bestPath = [];
        this.simulationCount = 0;
        this.lastFrameTime = 0;
        this.tickRate = 60;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.toolbar = document.getElementById('toolbar');
        this.playBtn = document.getElementById('playBtn');
        this.initGrid();
        this.setupEvents();
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    initGrid() {
        const cols = Math.ceil(this.canvas.width / GRID_SIZE);
        const rows = Math.ceil(this.canvas.height / GRID_SIZE);
        this.grid = [];
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < cols; c++) {
                row.push(BlockType.EMPTY);
            }
            this.grid.push(row);
        }
    }
    setupEvents() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'Escape' && this.mode === GameMode.PLAY) {
                this.setMode(GameMode.EDIT);
            }
        });
        // Mouse
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.mode !== GameMode.EDIT)
                return;
            this.mouseDown = true;
            this.handleGridClick(e);
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.mode !== GameMode.EDIT || !this.mouseDown)
                return;
            this.handleGridClick(e);
        });
        this.canvas.addEventListener('mouseup', (e) => {
            this.mouseDown = false;
        });
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        // Block Menu
        const blockButtons = this.toolbar.querySelectorAll('.block-btn');
        blockButtons.forEach(button => {
            button.addEventListener('click', () => {
                blockButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                const type = button.getAttribute('data-type');
                if (type === 'player')
                    this.selectedBlock = BlockType.PLAYER;
                else if (type === 'platform')
                    this.selectedBlock = BlockType.PLATFORM;
                else if (type === 'obstacle')
                    this.selectedBlock = BlockType.OBSTACLE;
                else if (type === 'goal')
                    this.selectedBlock = BlockType.GOAL;
                else if (type === 'eraser')
                    this.selectedBlock = BlockType.EMPTY;
            });
        });
        blockButtons[1].classList.add('selected');
        this.playBtn.addEventListener('click', () => {
            if (this.mode === GameMode.EDIT) {
                if (this.validateLevel()) {
                    this.setMode(GameMode.PLAY);
                }
                else {
                    alert('Level must have exactly one player and at least one goal!');
                }
            }
            else {
                this.setMode(GameMode.EDIT);
            }
        });
    }
    setMode(mode) {
        this.mode = mode;
        if (mode === GameMode.PLAY) {
            let playerFound = false;
            for (let y = 0; y < this.grid.length && !playerFound; y++) {
                for (let x = 0; x < this.grid[y].length; x++) {
                    if (this.grid[y][x] === BlockType.PLAYER) {
                        this.playerPos = { x, y };
                        this.playerVelocity = { x: 0, y: 0 };
                        this.isGrounded = false;
                        playerFound = true;
                        break;
                    }
                }
            }
            this.toolbar.style.display = 'none';
            this.playBtn.textContent = 'EDIT';
            this.mctsTree = new Map();
            this.bestPath = [];
            this.simulationCount = 0;
        }
        else {
            this.toolbar.style.display = 'flex';
            this.playBtn.textContent = 'PLAY';
            // Reset MCTS
            this.mctsTree = new Map();
            this.bestPath = [];
            this.simulationCount = 0;
        }
    }
    handleGridClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / GRID_SIZE);
        const y = Math.floor((e.clientY - rect.top) / GRID_SIZE);
        if (x < 0 || y < 0 || y >= this.grid.length || x >= this.grid[0].length) {
            return;
        }
        if (e.buttons === 2) {
            this.grid[y][x] = BlockType.EMPTY;
            return;
        }
        if (this.selectedBlock === BlockType.PLAYER) {
            for (let gridY = 0; gridY < this.grid.length; gridY++) {
                for (let gridX = 0; gridX < this.grid[gridY].length; gridX++) {
                    if (this.grid[gridY][gridX] === BlockType.PLAYER) {
                        this.grid[gridY][gridX] = BlockType.EMPTY;
                    }
                }
            }
        }
        this.grid[y][x] = this.selectedBlock;
    }
    validateLevel() {
        let playerCount = 0;
        let goalCount = 0;
        for (const row of this.grid) {
            for (const cell of row) {
                if (cell === BlockType.PLAYER)
                    playerCount++;
                if (cell === BlockType.GOAL)
                    goalCount++;
            }
        }
        return (playerCount === 1 && goalCount > 0);
    }
    gameLoop(timestamp) {
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastFrameTime;
        const frameInterval = 1000 / this.tickRate;
        if (elapsed >= frameInterval) {
            this.lastFrameTime = currentTime - (elapsed % frameInterval);
            this.update();
        }
        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    update() {
        if (this.mode === GameMode.PLAY) {
            const action = this.runMCTS();
            if (action === MCTSAction.DO_NOTHING) {
                this.playerVelocity.x = 0;
            }
            else if (action === MCTSAction.JUMP && this.isGrounded) {
                this.playerVelocity.y = JUMP_FORCE;
                this.isGrounded = false;
            }
            else if (action === MCTSAction.MOVE_LEFT) {
                this.playerVelocity.x = -PLAYER_SPEED;
            }
            else if (action === MCTSAction.MOVE_RIGHT) {
                this.playerVelocity.x = PLAYER_SPEED;
            }
            this.playerVelocity.y += GRAVITY;
            this.moveWithCollisions();
            // Keep in bounds
            if (this.playerPos.y * GRID_SIZE > this.canvas.height) {
                this.resetPlayer();
            }
        }
    }
    runMCTS() {
        console.log("TODO runMCTS");
        return 0;
    }
    simulate(playerState) {
        console.log("TODO simulate");
        return 0;
    }
    simulateAction(playerState, action) {
        console.log("TODO simulateAction");
        return playerState;
    }
    moveWithCollisions() {
        // Horizontal
        this.playerPos.x += this.playerVelocity.x / this.tickRate;
        const hCollision = this.getCollision();
        if (hCollision) {
            if (this.playerVelocity.x > 0) {
                this.playerPos.x = Math.floor(this.playerPos.x);
            }
            else {
                this.playerPos.x = Math.ceil(this.playerPos.x);
            }
            this.playerVelocity.x = 0;
            this.handleSpecialBlocks(hCollision);
        }
        // Vertical
        this.playerPos.y += this.playerVelocity.y / this.tickRate;
        const vCollision = this.getCollision();
        if (vCollision) {
            if (this.playerVelocity.y > 0) {
                this.playerPos.y = Math.floor(this.playerPos.y);
                this.isGrounded = true;
            }
            else {
                this.playerPos.y = Math.ceil(this.playerPos.y);
            }
            this.playerVelocity.y = 0;
            this.handleSpecialBlocks(vCollision);
        }
        else {
            this.isGrounded = false;
        }
    }
    getCollision() {
        const left = Math.floor(this.playerPos.x);
        const right = Math.floor(this.playerPos.x + 0.999);
        const top = Math.floor(this.playerPos.y);
        const bottom = Math.floor(this.playerPos.y + 0.999);
        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                if (y < 0 || x < 0 || y >= this.grid.length || x >= this.grid[0].length)
                    continue;
                const block = this.grid[y][x];
                if (block === BlockType.PLATFORM || block === BlockType.OBSTACLE || block === BlockType.GOAL) {
                    return block;
                }
            }
        }
        return null;
    }
    handleSpecialBlocks(blockType) {
        switch (blockType) {
            case BlockType.OBSTACLE:
                this.resetPlayer();
                break;
            case BlockType.GOAL:
                this.resetPlayer();
                this.keys = {};
                this.setMode(GameMode.EDIT);
                break;
        }
    }
    resetPlayer() {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] === BlockType.PLAYER) {
                    this.playerPos = { x, y };
                    this.playerVelocity = { x: 0, y: 0 };
                    return;
                }
            }
        }
    }
    render() {
        //clear
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //draw
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.mode === GameMode.EDIT) {
            this.renderEditor();
        }
        else {
            this.renderGameplay();
        }
    }
    renderEditor() {
        // Grid
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;
        // Vertical Lines
        for (let x = 0; x <= this.canvas.width; x += GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        // Horizontal Lines
        for (let y = 0; y <= this.canvas.height; y += GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        this.renderBlocks();
    }
    renderGameplay() {
        this.renderBlocks(true);
        this.ctx.fillStyle = COLORS[BlockType.PLAYER];
        this.ctx.fillRect(Math.round(this.playerPos.x * GRID_SIZE), Math.round(this.playerPos.y * GRID_SIZE), GRID_SIZE, GRID_SIZE);
    }
    renderBlocks(hidePlayer = false) {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const block = this.grid[y][x];
                if (block === BlockType.EMPTY || (hidePlayer && block === BlockType.PLAYER)) {
                    continue;
                }
                this.ctx.fillStyle = COLORS[block];
                this.ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }
}
window.addEventListener('load', () => {
    new Game();
});
