import {MAX_WIDTH, MAX_HEIGHT} from '../constants'
import { flatten } from '../utils'
import Vector from './vector'
//TODO: generate Block other position parameters based on position

const generateBlocks = (arr, height, width) => {
    let createDensity = () => Math.floor(Math.random() * 3);
    const blocksStartVertical =  ((MAX_HEIGHT - height)/ 2) + MAX_HEIGHT * (1/8)
    const blocksStartHorizontal = ((MAX_WIDTH - width) / 2);
    const rowsOfBlocks = arr.map((row, i) =>
        row.map((density, j) => ({
            density: createDensity(),
            position: new Vector(j + blocksStartHorizontal, blocksStartVertical + (i * 1 / 3)),
            width: 1,
            height: 1/4
        })
    ))
    return rowsOfBlocks;
}
/**
 * @function generateLevels - generate levels
 * @param {*} columns - width of the game field up to 9
 * @param {*} rows - rows of the game field up to max of 11;
 */
const generateLevels = (columns, rows) => {
    let levelArray = [...Array(rows)];
    levelArray = levelArray.map(x => {
        return [...Array(columns)]
    });
    levelArray = generateBlocks(levelArray, rows, columns);
    return flatten(levelArray);
}


export const levelConfiguration = [
    {
        lives: 3,
        paddleWidth: 2.5,
        speed: 1,
        blocks: generateLevels(6, 4),
        width: 9,
        height: 11,
    },
    {
        lives: 4,
        paddleWidth: 3,
        speed: 1.4,
        blocks: generateLevels(7, 5),
        width: 9,
        height: 11,
    },
    {
        lives: 5,
        paddleWidth: 2.5,
        speed: 1.8,
        blocks: generateLevels(8, 7),
        width: 9,
        height: 11,
    },
    {
        lives: 6,
        paddleWidth: 2,
        speed: 2.0,
        blocks: generateLevels(9, 11),
        width: 9,
        height: 11,
    },
];