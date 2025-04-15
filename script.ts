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

  setMode(mode: GameMode): void {
    this.mode = mode;

    if(mode === GameMode.PLAY) {
      let playerFound = false;

      for (let y=0; y<this.grid.length && !playerFound; y++) {
        for (let x=0; x<this.grid[y].length; x++) {
          if (this.grid[y][x] === BlockType.PLAYER) {
            this.playerPos = { x, y };
            this.playerVelocity = {x:0, y:0};
            this.isGrounded = false;
            playerFound = true;
            break;
          }
        }
      }

      this.toolbar.style.display = 'none';
      this.playBtn.textContent = 'EDIT';
    } else {
      this.toolbar.style.display = 'flex';
      this.playBtn.textContent = 'PLAY';
    }
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

  update(deltaTime: number): void {
    if (this.mode === GameMode.PLAY) {
      this.updateGameplay(deltaTime);
    }
  }

  updateGameplay(deltaTime: number): void {
    // Move
    if (this.keys['ArrowLeft']) {
      this.playerVelocity.x = -PLAYER_SPEED;
    } else if (this.keys['ArrowRight']) {
      this.playerVelocity.x = PLAYER_SPEED;
    } else {
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
    const newPos = {
      x: this.playerPos.x + this.playerVelocity.x * deltaTime,
      y: this.playerPos.y + this.playerVelocity.y * deltaTime
    }

    // Collisions
    this.handleCollisions(newPos);

    // Out of world check
    if (this.playerPos.y * GRID_SIZE > this.canvas.height) {
      this.resetPlayer();
    }
  }

  handleCollisions(newPos: {x:number, y:number}) : void {
    // Horizontal
    const horizontalPos = {
      x: newPos.x,
      y: this.playerPos.y
    };
    
    if (!this.checkBlockCollision(horizontalPos)) {
      this.playerPos.x = horizontalPos.x;
    } else {
      this.playerVelocity.x = 0;
    }
    
    // Vertical
    const verticalPos = {
      x: this.playerPos.x,
      y: newPos.y
    };
    
    this.isGrounded = false;
    
    if (!this.checkBlockCollision(verticalPos)) {
      this.playerPos.y = verticalPos.y;
    } else {
      if (this.playerVelocity.y > 0) {
        this.isGrounded = true;
      }
      this.playerVelocity.y = 0;
    }
  }

  checkBlockCollision(pos:{x:number,y:number}): boolean {
    // I found this article that showed me how to do this:
    // https://www.jeffreythompson.org/collision-detection/rect-rect.php
    const gridPositions = [
      [Math.floor(pos.x), Math.floor(pos.y)],
      [Math.floor(pos.x + 0.95), Math.floor(pos.y)],
      [Math.floor(pos.x), Math.floor(pos.y + 0.95)],
      [Math.floor(pos.x + 0.95), Math.floor(pos.y + 0.95)]
    ];
    
    for (const [x, y] of gridPositions) {
      if (y < 0 || x < 0 || y >= this.grid.length || x >= this.grid[0].length) continue;
      
      const block = this.grid[y][x];
      
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
  }

  resetPlayer(): void {
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

  gameLoop(timestamp: number): void {
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.render();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  render(): void {
    //clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);


    //draw
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.mode === GameMode.EDIT) {
      this.renderEditor();
    } else {
      this.renderGameplay();
    }
  }

  renderEditor(): void {
    // Grid
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.lineWidth = 1;
    
    // Vertical Lines
    for (let x=0; x<= this.canvas.width; x+= GRID_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(x,0);
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

  renderGameplay(): void {
    this.renderBlocks(true);

    this.ctx.fillStyle = COLORS[BlockType.PLAYER];
    this.ctx.fillRect(
      Math.round(this.playerPos.x * GRID_SIZE),
      Math.round(this.playerPos.y * GRID_SIZE),
      GRID_SIZE,
      GRID_SIZE
    );
  }


  renderBlocks(hidePlayer = false): void {
    for(let y=0; y<this.grid.length; y++){
      for(let x=0; x<this.grid[y].length; x++){
        const block = this.grid[y][x];

        if(block === BlockType.EMPTY || (hidePlayer && block === BlockType.PLAYER)) {
          continue;
        }

        this.ctx.fillStyle = COLORS[block];
        this.ctx.fillRect(x * GRID_SIZE, y*GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }
    }
  }
}


window.addEventListener('load', () => {
  new Game();
})