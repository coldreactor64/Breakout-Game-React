import React from 'react';
import {colors} from '../constants'
import {getRange} from '../utils'
export const GameBall = ({x,y, radius}) => (
    <circle className = 'ball' cx={x} cy={y} r = {radius}/>
)

export const Block =({ x, y, width, height, density }) => (
    <rect className='block' fill={colors[density]} x={x} y={y}  rx = {width / 16} width={width - 5} height={height-3} />
);

export const LevelLabel = ({level, unit}) => (
    <text x={unit} y = {unit * 2} className = 'level'>
        LEVEL: {level}
    </text>
)

export const PointsLabel = ({points, unit}) => (
    <text x={unit} y = {unit * 2} className = 'level'>
        LEVEL: {level}
    </text>
)


export const LivesCounter = ({lives, containerWidth, unit}) => {
    const width = unit * 2;
    return getRange(lives).map(i => (
        <rect
        className = 'life'
        rx = {unit / 4}
        height = {unit}
        width = {width}
        y = {unit}
        x = {containerWidth - unit - width * (i + 1) - (unit /2) * i}
        key = {i}
        />
    ))
}

export const Paddle = ({ x, y, width, height }) => (
    <rect className='paddle' x={x} y={y} width={width} height={height}  rx = {width / 16} />
  )