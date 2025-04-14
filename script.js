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
    Game.prototype.gameLoop = function () {
        console.log("TODO: Gameloop");
    };
    Game.prototype.setupEvents = function () {
        console.log("TODO: Event Listener Setup");
    };
    return Game;
}());
