import Vector from "./vector";
import {getRandomFrom, withoutElement, updateElement} from '../utils'
import {MAX_HEIGHT, MAX_WIDTH} from '../constants'
//Game core puts size and positions in relative to game size which then gets projected to the actual size


const DISTANCE_IN_MS = 0.005

export const MOVEMENT = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT'
}

const LEFT = new Vector(-1, 0)
const RIGHT = new Vector(1, 0)
const UP = new Vector(0, -1)
const DOWN = new Vector(0, 1)

const LEFT_UP = LEFT.add(UP).normalize()
const RIGHT_UP = RIGHT.add(UP).normalize()

/**
 * @function getInitialPaddleAndBallState - Returns the initial state of Paddle and Ball
 * @param {Number} gameWidth Game nonprojected width
 * @param {Number} gameHeight Game nonprojected Height
 * @param {Number} paddleWidth Width of the paddle per level.
 * @returns {JSON} Returns paddle and ball state
 */
export const getInitialPaddleAndBallState = (gameWidth, gameHeight, paddleWidth) => {
    //TODO: turn the paddle area and ball radius into constants
    //Paddle Y position is the height of the gamefield minus 1/3, making the paddle be the lower 1/3 of the game field
    const paddleYPosition = gameHeight - (1 / 3) - .06; //Paddle Y position is 1/3 of the height
    const paddle = {
        position: new Vector((gameWidth - paddleWidth) / 2, paddleYPosition),
        width: paddleWidth,
        height: 1/3
    }
    const ball = {
        center: new Vector(gameHeight / 2, paddleYPosition - 1 / 5 * 2),
        radius: 1 / 5,
        direction: getRandomFrom(LEFT_UP, RIGHT_UP)
      }

    return {
        paddle,
        ball
    }
}


export const getInitialLevelState = ({lives, paddleWidth, speed, blocks, width, height}) => 
{
    return {
        size: {
            width,
            height
        },
        blocks,
        speed,
        lives,
        ...getInitialPaddleAndBallState(width, height, paddleWidth)
    }
}


/**
 * @function getProjection - gets the scaling size for the screen and container size
 * @param {*} containerSize - Size of the container {width: number, height: number}
 * @param {*} gameSize - Game Size to be projected on the container {width: number, height: number}
 * @returns {Function} - Returns two functions projectDistance, and projectVector
 */

export const getProjection = (containerSize, gameSize) => {
    //Find the ratios between width and height compare to find the smallest
    const widthRatio = containerSize.width / gameSize.width;
    const heightRatio = containerSize.height / gameSize.height;
    const screenUnit = Math.min(heightRatio, widthRatio);
    return {
        /**
         * @function projectDistance - projects the distance onto the current screen size
         * @param {Number} distance - distance to project
         * @returns {Number} returns the position on screen
         */

        projectDistance: distance => distance * screenUnit,
        projectDistanceReverse : distance => distance / screenUnit,
        /**
         * @function projectVector - projects the distance onto the current screen size
         * @param {Vector} vector - vector to project to screen size
         * @returns {Vector} returns scaled vector
         */
        projectVector: vector => vector.scaleBy(screenUnit)
    }
}


/**
 * @function distortVector - adds randomness to a vector
 * @param {*} vector -input vector to distort
 * @param {*} distortionLevel - Amount to distort
 */

const distortVector = (vector, distortionLevel = 0.3) => {
    //get random components for the vector based on distortion level and create a new vector
    const getComponent = () => Math.random() * distortionLevel - distortionLevel / 2
    const distortion = new Vector(getComponent(), getComponent());
    //add it to the vector and normalize it.
    return vector.add(distortion).normalize()
}

/**
 * @function updatePaddlePosition - gets the new position of the paddle
 * @param {*} paddle - contains {positon: Vector, width, height} as paddle paramaters
 * @param {*} size - size of the play area in blocks
 * @param {*} distance - distance that it can move a tick
 * @param {*} movement - Are we moving?
 * @returns {JSON} - Returns paddle with update position
 */
const updatePaddlePosition = (paddle, size, distance, movement) => {
    //If we have no movement, return paddle
    if(!movement) return paddle;
    const movementDirection =  movement === MOVEMENT.LEFT ? LEFT : RIGHT
    //calculate new position
    const { x } = paddle.position.add(movementDirection.scaleBy(distance)) 
    
    const returnNewPosition = (x) => ({
        ...paddle,
        position: new Vector(x, paddle.position.y)
    })
    
    //Check if it falls off any of the edges
    if (x < 0) {
        return returnNewPosition(0);
    }
    if (x + paddle.width > size.width){
        return returnNewPosition(size.width - paddle.width);
    }

    return returnNewPosition(x);
}


const updatePaddlePositionMouse = (paddle, gameSize, containerSize, oldMousePosition, newMousePosition, projectDistanceReverse) => {
  if(oldMousePosition === newMousePosition) return paddle;
  const  x  = projectDistanceReverse(newMousePosition.mouseX);
  const returnNewPosition = (newMousePosition) =>({
        ...paddle,
        position: new Vector(x, paddle.position.y)
    })

    //Check if it falls off any of the edges
  if (x < 0) {
      return returnNewPosition(0);
  }
  if (x + paddle.width > gameSize.width){
      return returnNewPosition(gameSize.width - paddle.width);
  }

}



/**
 * @function boundaryCheck - checks if we are inside another objects boundaries
 * @param {*} objectSide -Object we are checking side 1
 * @param {*} objectSide2 -object checking side 2
 * @param {*} boundarySide - boundary object side 1
 * @param {*} boundarySide2 - boundary object side 2
 */
const boundaryCheck = (objectSide, objectSide2, boundarySide, boundarySide2) => (
    (objectSide >= boundarySide && objectSide <= boundarySide2) ||
    (objectSide2 >= boundarySide && objectSide2 <= boundarySide2)  
)

/**
 * @function adjustVector - Adjusts ball so it never goes below certain degrees +90 and -90 degrees
 */
const adjustVector = (normal, vector, minAngle = 15) => {
    const angle = normal.angleBetween(vector)
    const maxAngle = 90 - minAngle
    if (angle < 0) {
      if (angle > -minAngle) {
        return normal.rotate(-minAngle)
      }
      if (angle < -maxAngle) {
        return normal.rotate(-maxAngle)
      }
    } else {
      if (angle < minAngle) {
        return normal.rotate(minAngle)
      }
      if (angle > maxAngle) {
        return normal.rotate(maxAngle)
      }
    }
    return vector
}
/**
 * @function updateGameState - update the game state
 * @param {*} state - current game state
 * @param {*} movement - is the paddle moving
 * @param {*} timespan - time between last update and now
 * @returns {*} - new state of the game
 */


export const updateGameState = (state, movement, timespan) => {
    //Step 1: Update Position of the paddle from current state
    const { size, speed, lives, containerSize } = state
    const distance = timespan * DISTANCE_IN_MS * speed
    const paddle = updatePaddlePosition(state.paddle, size, distance, movement)

    
    const mousePaddlePosition = updatePaddlePositionMouse(state.paddle, size, containerSize, state.oldMousePosition, state.newMousePosition, state.projectDistanceReverse)
    //console.log(mousePaddlePosition.position.x);

    const { radius } = state.ball
    const oldDirection = state.ball.direction
    const newBallCenter = state.ball.center.add(oldDirection.scaleBy(distance))
    const ballBottom = newBallCenter.y + radius

    if (ballBottom > size.height) {
      return {
        ...state,
        ...getInitialPaddleAndBallState(size.width, size.height, paddle.width),
        lives: lives - 1
      }
    }
    
    const withNewBallProps = props => ({
      ...state,
      paddle,
      ball: {
        ...state.ball,
        ...props
      }
    })
  
    const withNewBallDirection = normal => {
      const distorted = distortVector(oldDirection.reflect(normal))
      const direction = adjustVector(normal, distorted)
      return withNewBallProps({ direction })
    }
    const ballLeft = newBallCenter.x - radius
    const ballRight = newBallCenter.x + radius
    const ballTop = newBallCenter.y - radius
    const paddleLeft = paddle.position.x
    const paddleRight = paddleLeft+ paddle.width
    const paddleTop = paddle.position.y
  
    const ballGoingDown = Math.abs(UP.angleBetween(oldDirection)) > 90
    const hitPaddle = ballGoingDown && ballBottom >= paddleTop && ballRight >= paddleLeft && ballLeft <= paddleRight
    if (hitPaddle) return withNewBallDirection(UP)
    if (ballTop <= 0) return withNewBallDirection(DOWN)
    if (ballLeft <= 0) return withNewBallDirection(RIGHT)
    if (ballRight >= size.width) return withNewBallDirection(LEFT)
  
    const block = state.blocks.find(({ position, width, height }) => (
      boundaryCheck(ballTop, ballBottom, position.y, position.y + height) &&
      boundaryCheck(ballLeft, ballRight, position.x, position.x + width) 
    ))


    if (block) {
      const density = block.density - 1
      const newBlock = { ...block, density }
      const blocks = density < 0 ? withoutElement(state.blocks, block) : updateElement(state.blocks, block, newBlock)
      
      const getNewBallNormal = () => {
        const blockTop = block.position.y
        const blockBottom = blockTop + block.height
        const blockLeft = block.position.x
        if (ballTop > blockTop - radius && ballBottom < blockBottom + radius) {
          if (ballLeft < blockLeft) return LEFT
          if (ballRight > blockLeft + block.width) return RIGHT
        }
        if (ballTop > blockTop) return DOWN
        if (ballTop <= blockTop) return UP
      }
      return {
        ...withNewBallDirection(getNewBallNormal()),
        blocks
      }
    }
    return withNewBallProps({ center: newBallCenter })
  
}