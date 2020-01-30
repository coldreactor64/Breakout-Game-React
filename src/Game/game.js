import React, { useRef, useEffect, useState, useReducer } from 'react'
import {registerListener} from '../utils'
import {GameBall, Block, LevelLabel, LivesCounter, Paddle, PointsLabel} from './gameComponents'
import { levelConfiguration } from '../Engine/levels'
import { getInitialLevelState, getProjection } from '../Engine/core'
import {reducer, ACTION} from './state'
import {UPDATE_EVERY} from '../constants'


export const GamePage = () => {
    const gameContainer = useRef();
    const [size, setSize] = useState();
    const [mouseX, setMouseX] = useState();
    useEffect(() => {
        const onResize = ()=>{
            //On resize get the current size ofthe screen and set it
            const {width, height} = gameContainer.current.getBoundingClientRect(); 
            setSize({width, height})
        }
        const unregisterResizeListener = registerListener('resize', onResize);

        const onMouseOver = (e) => {
          setMouseX(e.clientX);
        }
        const unregisterMouseListener = registerListener('mousemove',(e)=> onMouseOver(e));
        onResize();

        return {unregisterResizeListener, unregisterMouseListener}; //unregister the listener when not rendered anymore
    }, [])


    return (
        <div className = 'page'>
            <div className = 'scene-container' ref = {gameContainer}>
                {size && <Scene width = {size.width} height = {size.height} mouseX ={mouseX} variable2= {3} />}
            </div>
        </div>
    )

    // {size && makes it not render at first, only when we have the size}
}

/**
 * @function getSavedLevel - gets the current level saved in local storage, or if none 0
 * @returns {Number} - returns the level saved in local storage
 */
const getSavedLevel = () => {
    const inState = localStorage.getItem('level')
    return inState ? parseInt(inState, 10) : 0
  }
  
  /**
   * @function getInitialState - gets the inital state of the level
   * @param {*} containerSize 
   * @returns State 
   */
  const getInitialState = containerSize => {
    const level = getSavedLevel(); //Grabs level we're at
    const game = getInitialLevelState(levelConfiguration[level]); //
    const { projectDistance, projectVector, projectDistanceReverse } = getProjection(containerSize, game.size);
    return {
      level,
      game,
      containerSize,
      projectDistance,
      projectVector,
      projectDistanceReverse,
      oldMousePosition: 0,
      newMousePosition: 0,
      points: 0,
      time: Date.now(),
      stopTime: undefined,
      movement: undefined
    }
  }
  
  /**
   * @param {props} containerSize - width and height props
   */
  const Scene = (containerSize) => {
    //UseReducer to manage state like redux
    const [state, dispatch] = useReducer(reducer, containerSize, getInitialState)
    //act as an action dispatcher to the state, for useReducer
    const act = (type, payload) => dispatch({ type, payload })

    //Extract each component from the current State
    const {
      projectDistance,
      projectVector,
      projectDistanceReverse,
      level,
      game: {
        blocks,
        paddle,
        ball,
        size: {
          width,
          height
        },
        lives
      }
    } = state;
    //when the size of the screen size changes, update container size.
    useEffect(() => act(ACTION.CONTAINER_SIZE_CHANGE, {width: containerSize.width, height: containerSize.height}),
    [containerSize.width, containerSize.height]);


    useEffect(()=>act(ACTION.MOUSE_MOVE, {mouseX: containerSize.mouseX}),[containerSize.mouseX])
    useEffect(() => {
        const tick = () => act(ACTION.TICK, state)//Tick tock, update state
        const timerId = setInterval(tick, UPDATE_EVERY)//update state based on constant
        //see what pressed the keyboard, and what to do
        const onKeyDown = ({ which }) => act(ACTION.KEY_DOWN, which);
        const onKeyUp = ({ which }) => act(ACTION.KEY_UP, which)
        const unregisterKeydown = registerListener('keydown', onKeyDown)
        const unregisterKeyup = registerListener('keyup', onKeyUp)
        //unregister when unmounting
        return () => {
        clearInterval(timerId)
        unregisterKeydown()
        unregisterKeyup()
        }
    }, [])
  
    //get current sizes for objects
    const viewWidth = projectDistance(width);
    const viewHeight = projectDistance(height);
    const unit = projectDistance(ball.radius)
    
    return (
      <svg width={viewWidth} height={viewHeight} className='scene'>
        <LevelLabel unit={unit} level={level + 1} />
        <LivesCounter
          lives={lives}
          containerWidth={viewWidth}
          unit={unit}
        />
          {blocks.map(({ density, position, width, height }) => (
            <Block
              density={density}
              key={`${position.x}-${position.y}`}
              width={projectDistance(width)}
              height={projectDistance(height)}
              {...projectVector(position)}
            />)
          )}
        <Paddle width={projectDistance(paddle.width)} height={projectDistance(paddle.height)} {...projectVector(paddle.position)} />
        <GameBall {...projectVector(ball.center)} radius={unit} />
      </svg>
    )
  }