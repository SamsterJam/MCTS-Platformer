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

The model parameters are adjustable and can be tuned to allow for the agent to be able to complete different complexities of levels. The defaults are good for most of the included levels, for levels that require complex path finding we reccomend increasing the max-depth along with the exploration rate.

- **SIMULATIONS_PER_STEP**: How many future simulations to run per frame
- **MAX_DEPTH**: How far into the future the simulations will run
- **EXPLORATION_CONSTANT**: The influence to explore alternative paths besides the current best
- **DISCOUNT_FACTOR**: How much it considers short-term vs long-term rewards
