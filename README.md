# AI Platformer with MCTS

A simple platformer game integrated with a Monte Carlo Tree Search (MCTS) agent that solves user-created levels.

## Setup

The project is a simple index.html with css and js included. All you need to do to run the program is clone/download the repo and open the index.html file with your web browser of choice.

## Code

The project was coded in TypeScript in the **script.ts** file and can be compiled into script.js using the following command:

```
tsc script.ts --target es2024
```

## Usage

- Edit Mode: Create levels with platforms, obstacles, and goals
- Play Mode: Watch MCTS algorithm find optimal path to goal
- Adjust simulation parameters to control AI behavior

## Controls

- Left-click: Place blocks in edit mode
- Right-click: Remove blocks
- Play button: Toggle between edit and play modes
- Save/Load: Export or import custom levels

The model parameters are adjustable and can be tuned to allow for the agent to be able to complete different complexities of levels. The defaults are good for most of the included levels, for levels that require complex path finding we recommend increasing the max-depth along with the exploration rate.

- **SIMULATIONS_PER_STEP**: How many future simulations to run per frame
- **MAX_DEPTH**: How far into the future the simulations will run
- **EXPLORATION_CONSTANT**: The influence to explore alternative paths besides the current best
- **DISCOUNT_FACTOR**: How much it considers short-term vs long-term rewards


## Core MCTS Functions

#### `hashState(state: GameState): string`
Converts continuous game state into a discrete string representation. Takes player position, velocity, and grounding status and converts them to a unique string identifier. This function is for solving the continuous state space problem by discretizing positions to 2 decimal places, allowing the MCTS algorithm to efficiently reuse previously explored states.

#### `stepGame(state: GameState, action: MCTSAction): StepResult`
The physics engine that powers both simulation and gameplay. This function:
- Takes the current game state and an action (do nothing, jump, move left, move right)
- Applies physics (gravity, velocity, collision detection)
- Returns a new state, a reward value, and whether the state is terminal
- Implements rewards based on goal proximity, penalties for obstacles and falling
This function allows the MCTS algorithm to accurately predict future states during planning.

#### `simulate(state: GameState, stateHash: string, depth: number): number`
The recursive MCTS simulation function that:
- Uses UCB (Upper Confidence Bound) to select promising actions
- Calls stepGame() to predict future states
- Builds the search tree
- Returns accumulated rewards with discount factor
- Implements tree expansion and backpropagation phases
Each call explores one possible future path to help determine the best action.

#### `runMCTS(): number`
The main MCTS controller that:
- Initializes a new search from the current state
- Runs thousands of simulations by calling simulate()
- Selects the best action based on visit counts and expected rewards
- Calculates a visualization path for the UI
- Returns the chosen action for the agent to execute
Runs each frame to determine the next optimal move for the agent.