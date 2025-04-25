// Constants
const GRID_SIZE = 64;
const GRAVITY = 1.5;
const JUMP_FORCE = -20;
const PLAYER_SPEED = 8;


// MCTS Parameters
const SIMULATIONS_PER_STEP = 50;
const MAX_DEPTH = 10;
const EXPLORATION_CONSTANT = 1.4;

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

enum MCTSAction {
  DO_NOTHING = 0,
  MOVE_RIGHT = 1,
  MOVE_LEFT = 2,
  JUMP = 3
}

interface GameState {
  playerPos: {x:number, y:number};
  playerVelocity: {x:number, y:number};
  isGrounded: boolean;
}

interface StepResult {
  newState: GameState;
  reward: number;
  isTerminal: boolean;
}

interface MCTSNode {
  visits: number;
  totalReward: number;
  children: Array<MCTSChild>;
}

interface MCTSChild {
  action: number,
  visits: number;
  totalReward: number;
}

type PlayerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  stateHash: string;
  depth: number;
};

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
  keys: {[key:string]: boolean } = {};
  mouseDown = false;
  toolbar: HTMLElement;
  playBtn: HTMLElement;

  // Game state
  currentState: GameState = {
    playerPos: {x: 0, y: 0},
    playerVelocity: {x: 0, y: 0},
    isGrounded: false
  }

  // MCTS
  mctsTree: Map<string, MCTSNode> = new Map();
  simulationCount: number = 0;
  
  lastFrameTime = 0;
  tickRate = 60;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.toolbar = document.getElementById('toolbar')!;
    this.playBtn = document.getElementById('playBtn')!;

    this.initGrid();
    this.setupEvents();

    this.lastFrameTime = performance.now();
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
        button.classList.add('selected');

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
      for (let y=0; y<this.grid.length; y++) {
        for (let x=0; x<this.grid[y].length; x++) {
          if (this.grid[y][x] === BlockType.PLAYER) {
            this.currentState = {
              playerPos: {x, y},
              playerVelocity: {x: 0, y: 0},
              isGrounded: false
            }
            break;
          }
        }
      }

      this.toolbar.style.display = 'none';
      this.playBtn.textContent = 'EDIT';

      this.mctsTree = new Map();
      this.simulationCount = 0;
    } else {
      this.toolbar.style.display = 'flex';
      this.playBtn.textContent = 'PLAY';

      // // Reset MCTS
      // this.mctsTree = new Map();
      this.simulationCount = 0;
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
          if (this.grid[gridY][gridX] === BlockType.PLAYER) {
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

  gameLoop(timestamp: number): void {
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

  update(): void {
    if (this.mode === GameMode.PLAY) {
      const action = this.runMCTS();

      const result = this.stepGame(this.currentState, action);
      this.currentState = result.newState;

      if (result.isTerminal) {
        if (this.isAtGoal(this.currentState.playerPos)) {
          this.setMode(GameMode.EDIT);
        } else {
          this.resetPlayer();
        }
      }
      console.log(this.simulationCount);
    }
  }


  stepGame(state: GameState, action: MCTSAction): StepResult {
    const newState: GameState = {
      playerPos: { ...state.playerPos },
      playerVelocity: { ...state.playerVelocity },
      isGrounded: state.isGrounded
    };

    switch(action) {
      case MCTSAction.DO_NOTHING:
        newState.playerVelocity.x = 0;
        break;
      case MCTSAction.JUMP:
        if (newState.isGrounded) {
          newState.playerVelocity.y = JUMP_FORCE;
          newState.isGrounded = false;
        }
        break;
      case MCTSAction.MOVE_LEFT:
        newState.playerVelocity.x = -PLAYER_SPEED;
        break;
      case MCTSAction.MOVE_RIGHT:
        newState.playerVelocity.x = PLAYER_SPEED;
        break;
    }

    newState.playerVelocity.y += GRAVITY;
    const prevPos = {... newState.playerPos};


    // Horizontal
    newState.playerPos.x += newState.playerVelocity.x / this.tickRate;

    const horizontalCollision = this.checkCollisionType(newState.playerPos);
    if (horizontalCollision.collided) {
      if (newState.playerVelocity.x > 0) {
        newState.playerPos.x = Math.floor(newState.playerPos.x);
      } else {
        newState.playerPos.x = Math.ceil(newState.playerPos.x);
      }
      newState.playerVelocity.x = 0;
      
      // Terminate
      if (horizontalCollision.type === BlockType.OBSTACLE || horizontalCollision.type === BlockType.GOAL) {
        return { 
          newState, 
          reward: horizontalCollision.type === BlockType.GOAL ? 500 : -500,
          isTerminal: true 
        };
      }


    }


    // Vertical 
    newState.playerPos.y += newState.playerVelocity.y / this.tickRate;

    const verticalCollision = this.checkCollisionType(newState.playerPos);
    if (verticalCollision.collided) {
      if (newState.playerVelocity.y > 0) {
        newState.playerPos.y = Math.floor(newState.playerPos.y);
        newState.isGrounded = true;
      } else {
        newState.playerPos.y = Math.ceil(newState.playerPos.y);
      }
      newState.playerVelocity.y = 0;
      
      // Terminate
      if (verticalCollision.type === BlockType.OBSTACLE || verticalCollision.type === BlockType.GOAL) {
        return { 
          newState, 
          reward: verticalCollision.type === BlockType.GOAL ? 100 : -200,
          isTerminal: true 
        };
      }
    } else {
      newState.isGrounded = false;
    }

    let reward = -0.1;
    let isTerminal = false;

    if (newState.playerPos.y >= this.grid.length) {
      reward = -500;
      isTerminal = true;
    }

    // Reward moving towards goal
    const goalPos = this.findGoalPos();
    if (goalPos.x != -1) {
      const prevDistance = Math.sqrt(
        Math.pow(goalPos.x - prevPos.x, 2) + 
        Math.pow(goalPos.y - prevPos.y, 2)
      );

      const newDistance = Math.sqrt(
        Math.pow(goalPos.x - newState.playerPos.x, 2) + 
        Math.pow(goalPos.y - newState.playerPos.y, 2)
      );

      if (newDistance < prevDistance) {
        reward += 0.5;
      }
      
      // Might decide to reward moving up later, we'll see
      // if (newState.playerPos.y < prevPos.y) {
      //   reward += 0.2;
      // }
    }

    return { newState, reward, isTerminal };
  }


  checkCollisionType(position: {x: number, y: number}): {collided: boolean, type: BlockType} {
    const left = Math.floor(position.x);
    const right = Math.floor(position.x + 0.999);
    const top = Math.floor(position.y);
    const bottom = Math.floor(position.y + 0.999);

    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        if (y < 0 || x < 0 || y >= this.grid.length || x >= this.grid[0].length) continue;
        
        const block = this.grid[y][x];
        if (block === BlockType.PLATFORM || block === BlockType.OBSTACLE || block === BlockType.GOAL) {
          return { collided: true, type: block };
        }
      }
    }
    
    return { collided: false, type: BlockType.EMPTY };
  }

  isAtGoal(position: {x: number, y: number}): boolean {
    const left = Math.floor(position.x);
    const right = Math.floor(position.x + 0.999);
    const top = Math.floor(position.y);
    const bottom = Math.floor(position.y + 0.999);
    
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        if (y < 0 || x < 0 || y >= this.grid.length || x >= this.grid[0].length) continue;
        
        if (this.grid[y][x] === BlockType.GOAL) {
          return true;
        }
      }
    }
    
    return false;
  }

  findGoalPos(): {x: number, y: number} {
    for (let y=0; y < this.grid.length; y++) {
      for (let x=0; x < this.grid[0].length; x++) {
        if (this.grid[y][x] === BlockType.GOAL) {
          return {x,y};
        }
      }
    }
    return { x: -1, y: -1 };
  }

  resetPlayer(): void {
    for (let y=0; y < this.grid.length; y++) {
      for (let x=0; x < this.grid[0].length; x++) {
        if (this.grid[y][x] === BlockType.PLAYER) {
          this.currentState = {
            playerPos: {x,y},
            playerVelocity: {x:0, y:0},
            isGrounded: false
          };
          return;
        }
      }
    }
  }

  hashState(state: GameState): string {
    const x = Math.floor(state.playerPos.x);
    const y = Math.floor(state.playerPos.y);
    const vx = Math.floor(state.playerVelocity.x);
    const vy = Math.floor(state.playerVelocity.y);
    return `${x},${y},${vx},${vy}`;
  }

  runMCTS(): number {
    const stateHash = this.hashState(this.currentState);

    // This is really ugly and copilot got this solution
    // and its the best one I can find so ¯\_(ツ)_/¯
    if(!this.mctsTree.has(stateHash)) {
      this.mctsTree.set(stateHash, {
        visits: 0,
        totalReward: 0,
        children: [
          MCTSAction.DO_NOTHING, 
          MCTSAction.JUMP, 
          MCTSAction.MOVE_LEFT, 
          MCTSAction.MOVE_RIGHT
        ].map(action => ({
          action, visits: 0,
          totalReward: 0
        }))
      });
    }
    
    // Simulate futures
    for (let i=0; i < SIMULATIONS_PER_STEP; i++) {
      this.simulate(this.currentState, stateHash, 0);
    }

    // Choose best action
    const node = this.mctsTree.get(stateHash)!;
    let bestAction = 0;
    let bestValue = -Infinity;

    for (const child of node.children) {
      const value = child.visits > 0 ? child.totalReward/child.visits : 0;
      if (value > bestValue) {
        bestValue = value;
        bestAction = child.action;
      }
    }

    this.simulationCount = this.mctsTree.size;

    return bestAction;
  }

  simulate(state: GameState, stateHash: string, depth: number): number {
    if (depth >= MAX_DEPTH) return 0;

    const node = this.mctsTree.get(stateHash)!;

    let bestChild: MCTSChild | null = null;
    let bestUCB = -Infinity;

    for (const child of node.children) {
      let ucb;
      if (child.visits === 0) {
        ucb = Infinity;
      } else {
        const exploitation = child.totalReward / child.visits;
        const exploration = Math.sqrt(Math.log(node.visits) / child.visits);
        ucb = exploitation + (EXPLORATION_CONSTANT * exploration);
      }

      if (ucb > bestUCB) {
        bestUCB = ucb;
        bestChild = child;
      }
    }

    const action = bestChild!.action;
    const { newState, reward, isTerminal } = this.stepGame(state, action);

    if (isTerminal) {
      bestChild!.visits += 1;
      bestChild!.totalReward += reward;
      node.visits += 1;
      node.totalReward += reward;
      return reward;
    }

    const newStateHash = this.hashState(newState);
    
    // add if new state
    if (!this.mctsTree.has(newStateHash)) {
      this.mctsTree.set(newStateHash, {
        visits: 0,
        totalReward: 0,
        children: [0, 1, 2, 3].map(a => ({
          action: a,
          visits: 0,
          totalReward: 0
        }))
      });
    }

    // Recursively simulate
    const futureReward = this.simulate(newState, newStateHash, depth + 1);
    const totalReward = reward + futureReward;
    
    // Backpropagation phase
    bestChild!.visits += 1;
    bestChild!.totalReward += totalReward;
    node.visits += 1;
    node.totalReward += totalReward;

    return totalReward;
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
      Math.round(this.currentState.playerPos.x * GRID_SIZE),
      Math.round(this.currentState.playerPos.y * GRID_SIZE),
      GRID_SIZE,
      GRID_SIZE
    );

    //TODO Render Path
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