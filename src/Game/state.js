import { levelConfiguration } from '../Engine/levels'
import { MOVEMENT, updateGameState, getInitialLevelState, getProjection } from '../Engine/core'

 
export const ACTION = {
    CONTAINER_SIZE_CHANGE: 'CONTAINER_SIZE_CHANGE',
    KEY_DOWN: 'KEY_DOWN',
    KEY_UP: 'KEY_UP',
    MOUSE_MOVE: 'MOUSE_MOVE',
    TICK: 'TICK'
  }
  
 /** Game Constants */
  const MOVEMENT_KEYS = {
    LEFT: [65, 37, "ArrowLeft"],
    RIGHT: [68, 39, "ArrowRight"]
  }

  const STOP_KEY = 32

export const reducer = (state, { type, payload }) => {
    switch(type) {
        case ACTION.CONTAINER_SIZE_CHANGE:
            console.log(payload);
            return containerSizeChange(state, payload);
        case ACTION.KEY_UP:
            return onKeyUp(state, payload);
        case ACTION.KEY_DOWN:
            return onKeyDown(state, payload)
        case ACTION.MOUSE_MOVE:
            return mouseMove(state, payload);
        case ACTION.TICK:
            return tick(state);
            
        default:
             return state;
    }
  }
  
const containerSizeChange = (state, containerSize)=> ({
    ...state,
    containerSize,
    ...getProjection(containerSize, state.game.size)
  })

const onKeyDown = (state, key) => {
    if (MOVEMENT_KEYS.LEFT.includes(key)) {
        console.log(state);
      return { ...state, movement: MOVEMENT.LEFT }
    } else if (MOVEMENT_KEYS.RIGHT.includes(key)) {
      return { ...state, movement: MOVEMENT.RIGHT }
    }
    return state
  }
const mouseMove = (state, mousePosition) => {
    return {
        ...state,
        oldMousePosition: state.newMousePosition,
        newMousePosition: mousePosition
    }
  }
const onKeyUp = (state, key) => {
    const newState = { ...state, movement: undefined }
    if (key === STOP_KEY) {
        console.log("stop key")
      if (state.stopTime) {
        return { ...newState, stopTime: undefined, time: state.time + Date.now() - state.stopTime}
      } else {
        return { ...newState, stopTime: Date.now() }
      }
    }
    return newState
}

const tick = (state) => {

    if (state.stopTime) return state;
    const time = Date.now()
    const newGame = updateGameState(
    {
    ...state.game,
    ...state
    }, state.movement, time - state.time)
    const newState = { ...state, time }

    if (newGame.lives < 1) {
      return { ...newState, game: getInitialLevelState(levelConfiguration[state.level]) }

    } else if (newGame.blocks.length < 1) {

      const level = state.level === levelConfiguration.length ? state.level : state.level + 1
      localStorage.setItem('level', level)
      const game = getInitialLevelState(levelConfiguration[state.level])

      return {
        ...newState,
        level,
        game,
        ...getProjection(state.containerSize, game.size)
      }

    }
    return { ...newState, game: newGame }
}

