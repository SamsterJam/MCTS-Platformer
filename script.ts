// Constants
const GRID_SIZE = 64;
const GRAVITY = 125;
const JUMP_FORCE =  -25;
const PLAYER_SPEED = 10;

enum BlockType {
  EMPTY = 0,
  PLAYER = 1,
  PLATFORM = 2,
  OBSTACLE = 3,
  GOAL = 4
}

enum GameMode {
  EDIT,
  PLAY
}

const COLORS = {
  [BlockType.PLAYER]: "blue",
  [BlockType.PLATFORM]: "green",
  [BlockType.OBSTACLE]: "red",
  [BlockType.GOAL]: "gold"
}

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  grid: BlockType[][] = [];
  mode: GameMode = GameMode.EDIT;
  selectedBlock: BlockType = BlockType.PLATFORM;
  playerPos = {x: 0, y: 0};
  playerVelocity = {x:0, y:0};
  isGrounded = false;
  keys: {[key:string]: boolean } = {};
  mouseDown = false;
  toolbar: HTMLElement;
  playBtn: HTMLElement;
  lastTime = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.toolbar = document.getElementById('toolbar')!;
    this.playBtn = document.getElementById('playBtn')!;

    this.initGrid();
    this.setupEvents();

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  initGrid(): void {
    const cols = Math.ceil(this.canvas.width/GRID_SIZE);
    const rows = Math.ceil(this.canvas.height/GRID_SIZE);

    this.grid = [];

    for(let r=0; r < rows; r++){
      const row: BlockType[] = [];
      for(let c=0; c < cols; c++){
        row.push(BlockType.EMPTY);
      }
      this.grid.push(row);
    }
  }


  gameLoop(): void {
    console.log(`TODO: Gameloop`);
  }

  setupEvents(): void {
    console.log(`TODO: Event Listener Setup`);
  }
}
