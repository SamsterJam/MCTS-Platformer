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

  setupEvents(): void {
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
      if (this.mode !== GameMode.EDIT) return;

      this.mouseDown = true;
      this.handleGridClick(e);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.mode !== GameMode.EDIT || !this.mouseDown) return;
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
        this.playBtn.classList.add('selected');

        const type = button.getAttribute('data-type');
        if (type === 'player') this.selectedBlock = BlockType.PLAYER;
        else if (type === 'platform') this.selectedBlock = BlockType.PLATFORM;
        else if (type === 'obstacle') this.selectedBlock = BlockType.OBSTACLE;
        else if (type === 'goal') this.selectedBlock = BlockType.GOAL;
        else if (type === 'eraser') this.selectedBlock = BlockType.EMPTY;
      });
    });

    blockButtons[1].classList.add('selected');

    this.playBtn.addEventListener('click', () => {
      if(this.mode === GameMode.EDIT) {
        if (this.validateLevel()) {
          this.setMode(GameMode.PLAY);
        } else {
          alert('Level must have exactly one player and at least one goal!');
        }
      } else {
        this.setMode(GameMode.EDIT);
      }
    });
  }

  gameLoop(): void {
    console.log(`TODO: Gameloop`);
  }

  setMode(mode: GameMode): void {
    console.log(`TODO: setMode`);
  }

  handleGridClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left)/GRID_SIZE);
    const y = Math.floor((e.clientY - rect.top)/GRID_SIZE);

    if(x<0 || y<0 || y>= this.grid.length || x >= this.grid[0].length) {
      return;
    }

    if (e.buttons === 2) {
      this.grid[y][x] = BlockType.EMPTY;
      return;
    }

    if (this.selectedBlock === BlockType.PLAYER) {
      for (let gridY=0; gridY<this.grid.length; gridY++) {
        for(let gridX=0; gridX<this.grid[gridY].length; gridX++){
          if (this.grid[y][x] === BlockType.PLAYER) {
            this.grid[gridY][gridX] = BlockType.EMPTY;
          }
        }
      }
    }

    this.grid[y][x] = this.selectedBlock;
  }

  validateLevel(): boolean {
    let playerCount = 0;
    let goalCount = 0;

    for (const row of this.grid) {
      for (const cell of row) {
        if (cell === BlockType.PLAYER) playerCount++;
        if (cell === BlockType.GOAL) goalCount++;
      }
    }

    return (playerCount === 1 && goalCount > 0);
  }
}


window.addEventListener('load', () => {
  new Game();
})