var _a;
// Constants
var GRID_SIZE = 64;
var GRAVITY = 125;
var JUMP_FORCE = -25;
var PLAYER_SPEED = 10;
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
var COLORS = (_a = {},
    _a[BlockType.PLAYER] = "blue",
    _a[BlockType.PLATFORM] = "green",
    _a[BlockType.OBSTACLE] = "red",
    _a[BlockType.GOAL] = "gold",
    _a);
var Game = /** @class */ (function () {
    function Game() {
        this.grid = [];
        this.mode = GameMode.EDIT;
        this.selectedBlock = BlockType.PLATFORM;
        this.playerPos = { x: 0, y: 0 };
        this.playerVelocity = { x: 0, y: 0 };
        this.isGrounded = false;
        this.keys = {};
        this.mouseDown = false;
        this.lastTime = 0;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.toolbar = document.getElementById('toolbar');
        this.playBtn = document.getElementById('playBtn');
        this.initGrid();
        this.setupEvents();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    Game.prototype.initGrid = function () {
        var cols = Math.ceil(this.canvas.width / GRID_SIZE);
        var rows = Math.ceil(this.canvas.height / GRID_SIZE);
        this.grid = [];
        for (var r = 0; r < rows; r++) {
            var row = [];
            for (var c = 0; c < cols; c++) {
                row.push(BlockType.EMPTY);
            }
            this.grid.push(row);
        }
    };
    Game.prototype.setupEvents = function () {
        var _this = this;
        // Keyboard
        window.addEventListener('keydown', function (e) {
            _this.keys[e.code] = true;
        });
        window.addEventListener('keyup', function (e) {
            _this.keys[e.code] = false;
            if (e.code === 'Escape' && _this.mode === GameMode.PLAY) {
                _this.setMode(GameMode.EDIT);
            }
        });
        // Mouse
        this.canvas.addEventListener('mousedown', function (e) {
            if (_this.mode !== GameMode.EDIT)
                return;
            _this.mouseDown = true;
            _this.handleGridClick(e);
        });
        this.canvas.addEventListener('mousemove', function (e) {
            if (_this.mode !== GameMode.EDIT || !_this.mouseDown)
                return;
            _this.handleGridClick(e);
        });
        this.canvas.addEventListener('mouseup', function (e) {
            _this.mouseDown = false;
        });
        this.canvas.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });
        // Block Menu
        var blockButtons = this.toolbar.querySelectorAll('.block-btn');
        blockButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                blockButtons.forEach(function (btn) { return btn.classList.remove('selected'); });
                _this.playBtn.classList.add('selected');
                var type = button.getAttribute('data-type');
                if (type === 'player')
                    _this.selectedBlock = BlockType.PLAYER;
                else if (type === 'platform')
                    _this.selectedBlock = BlockType.PLATFORM;
                else if (type === 'obstacle')
                    _this.selectedBlock = BlockType.OBSTACLE;
                else if (type === 'goal')
                    _this.selectedBlock = BlockType.GOAL;
                else if (type === 'eraser')
                    _this.selectedBlock = BlockType.EMPTY;
            });
        });
        blockButtons[1].classList.add('selected');
        this.playBtn.addEventListener('click', function () {
            if (_this.mode === GameMode.EDIT) {
                if (_this.validateLevel()) {
                    _this.setMode(GameMode.PLAY);
                }
                else {
                    alert('Level must have exactly one player and at least one goal!');
                }
            }
            else {
                _this.setMode(GameMode.EDIT);
            }
        });
    };
    Game.prototype.setMode = function (mode) {
        this.mode = mode;
        if (mode === GameMode.PLAY) {
            var playerFound = false;
            for (var y = 0; y < this.grid.length && !playerFound; y++) {
                for (var x = 0; x < this.grid[y].length; x++) {
                    if (this.grid[y][x] === BlockType.PLAYER) {
                        this.playerPos = { x: x, y: y };
                        this.playerVelocity = { x: 0, y: 0 };
                        this.isGrounded = false;
                        playerFound = true;
                        break;
                    }
                }
            }
            this.toolbar.style.display = 'none';
            this.playBtn.textContent = 'EDIT';
        }
        else {
            this.toolbar.style.display = 'flex';
            this.playBtn.textContent = 'PLAY';
        }
    };
    Game.prototype.handleGridClick = function (e) {
        var rect = this.canvas.getBoundingClientRect();
        var x = Math.floor((e.clientX - rect.left) / GRID_SIZE);
        var y = Math.floor((e.clientY - rect.top) / GRID_SIZE);
        if (x < 0 || y < 0 || y >= this.grid.length || x >= this.grid[0].length) {
            return;
        }
        if (e.buttons === 2) {
            this.grid[y][x] = BlockType.EMPTY;
            return;
        }
        if (this.selectedBlock === BlockType.PLAYER) {
            for (var gridY = 0; gridY < this.grid.length; gridY++) {
                for (var gridX = 0; gridX < this.grid[gridY].length; gridX++) {
                    if (this.grid[y][x] === BlockType.PLAYER) {
                        this.grid[gridY][gridX] = BlockType.EMPTY;
                    }
                }
            }
        }
        this.grid[y][x] = this.selectedBlock;
    };
    Game.prototype.validateLevel = function () {
        var playerCount = 0;
        var goalCount = 0;
        for (var _i = 0, _a = this.grid; _i < _a.length; _i++) {
            var row = _a[_i];
            for (var _b = 0, row_1 = row; _b < row_1.length; _b++) {
                var cell = row_1[_b];
                if (cell === BlockType.PLAYER)
                    playerCount++;
                if (cell === BlockType.GOAL)
                    goalCount++;
            }
        }
        return (playerCount === 1 && goalCount > 0);
    };
    Game.prototype.update = function (deltaTime) {
        if (this.mode === GameMode.PLAY) {
            this.updateGameplay(deltaTime);
        }
    };
    Game.prototype.updateGameplay = function (deltaTime) {
        // Move
        if (this.keys['ArrowLeft']) {
            this.playerVelocity.x = -PLAYER_SPEED;
        }
        else if (this.keys['ArrowRight']) {
            this.playerVelocity.x = PLAYER_SPEED;
        }
        else {
            this.playerVelocity.x = 0;
        }
        // Jump
        if ((this.keys['ArrowUp']) && this.isGrounded) {
            this.playerVelocity.y = JUMP_FORCE;
            this.isGrounded = false;
        }
        // Gravity
        this.playerVelocity.y += GRAVITY * deltaTime;
        // Velocity
        var newPos = {
            x: this.playerPos.x + this.playerVelocity.x * deltaTime,
            y: this.playerPos.y + this.playerVelocity.y * deltaTime
        };
        // Collisions
        this.handleCollisions(newPos);
        // Out of world check
        if (this.playerPos.y * GRID_SIZE > this.canvas.height) {
            this.resetPlayer();
        }
    };
    Game.prototype.handleCollisions = function (newPos) {
        // Horizontal
        var horizontalPos = {
            x: newPos.x,
            y: this.playerPos.y
        };
        if (!this.checkBlockCollision(horizontalPos)) {
            this.playerPos.x = horizontalPos.x;
        }
        else {
            this.playerVelocity.x = 0;
        }
        // Vertical
        var verticalPos = {
            x: this.playerPos.x,
            y: newPos.y
        };
        this.isGrounded = false;
        if (!this.checkBlockCollision(verticalPos)) {
            this.playerPos.y = verticalPos.y;
        }
        else {
            if (this.playerVelocity.y > 0) {
                this.isGrounded = true;
            }
            this.playerVelocity.y = 0;
        }
    };
    Game.prototype.checkBlockCollision = function (pos) {
        // I found this article that showed me how to do this:
        // https://www.jeffreythompson.org/collision-detection/rect-rect.php
        var gridPositions = [
            [Math.floor(pos.x), Math.floor(pos.y)],
            [Math.floor(pos.x + 0.95), Math.floor(pos.y)],
            [Math.floor(pos.x), Math.floor(pos.y + 0.95)],
            [Math.floor(pos.x + 0.95), Math.floor(pos.y + 0.95)]
        ];
        for (var _i = 0, gridPositions_1 = gridPositions; _i < gridPositions_1.length; _i++) {
            var _a = gridPositions_1[_i], x = _a[0], y = _a[1];
            if (y < 0 || x < 0 || y >= this.grid.length || x >= this.grid[0].length)
                continue;
            var block = this.grid[y][x];
            switch (block) {
                case BlockType.PLATFORM: return true;
                case BlockType.OBSTACLE:
                    this.resetPlayer();
                    return true;
                case BlockType.GOAL:
                    this.resetPlayer();
                    // alert('Level Complete!');
                    this.keys = {};
                    this.setMode(GameMode.EDIT);
                    return false;
            }
        }
        return false;
    };
    Game.prototype.resetPlayer = function () {
        for (var y = 0; y < this.grid.length; y++) {
            for (var x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] === BlockType.PLAYER) {
                    this.playerPos = { x: x, y: y };
                    this.playerVelocity = { x: 0, y: 0 };
                    return;
                }
            }
        }
    };
    Game.prototype.gameLoop = function (timestamp) {
        var deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        this.update(deltaTime);
        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    };
    Game.prototype.render = function () {
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
    };
    Game.prototype.renderEditor = function () {
        // Grid
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;
        // Vertical Lines
        for (var x = 0; x <= this.canvas.width; x += GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        // Horizontal Lines
        for (var y = 0; y <= this.canvas.height; y += GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        this.renderBlocks();
    };
    Game.prototype.renderGameplay = function () {
        this.renderBlocks(true);
        this.ctx.fillStyle = COLORS[BlockType.PLAYER];
        this.ctx.fillRect(Math.round(this.playerPos.x * GRID_SIZE), Math.round(this.playerPos.y * GRID_SIZE), GRID_SIZE, GRID_SIZE);
    };
    Game.prototype.renderBlocks = function (hidePlayer) {
        if (hidePlayer === void 0) { hidePlayer = false; }
        for (var y = 0; y < this.grid.length; y++) {
            for (var x = 0; x < this.grid[y].length; x++) {
                var block = this.grid[y][x];
                if (block === BlockType.EMPTY || (hidePlayer && block === BlockType.PLAYER)) {
                    continue;
                }
                this.ctx.fillStyle = COLORS[block];
                this.ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    };
    return Game;
}());
window.addEventListener('load', function () {
    new Game();
});
