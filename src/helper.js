/**
 * @module src/helper
 * src/helper.js
 * 
 * The main STEVE object that holds the template engine
 * 
 * by Alex Prosser
 * 11/9/2023
 */

import fs from 'fs';
import path from 'path';

/**
 * Turns object into string, whichs includes arrays, other objects, and functions.
 * 
 * @param {Object} obj 
 * @returns {string} String representation of that object
 */
const objectToString = obj => {
    let result = '{';
    const keys = Object.keys(obj);
    keys.forEach((key, index) => {
        let value = obj[key];

        if (typeof value === 'function') {
            value = value.toString();
        } else if (value instanceof Array) {
            value = JSON.stringify(value);
        } else if (typeof value === 'object') {
            value = objectToString(value);
        } else {
            value = `"${value}"`;
        }

        result += `\n  ${key}: ${value}${index == key.length - 1 ? '' : ','}`;
    });
    result += '\n}';
    return result;
}

/**
 * Recursively reads all the content of a directory and returns all the contents of those files
 * 
 * Assumes that all files in directory are text files and will be treated as strings
 * 
 * @param {string} baseDirectory Directory you want to read the contents of  
 * @returns object with file names and content
 */
const readDirectoryAsStrings = baseDirectory => {
    let results = {};

    /**
     * Recursively file walk to find all files
     * @param {string} directory The current directory being searched
     * @param {boolean} base Whether or not it is the base directory
     */
    const fileWalk = (directory, base) => {
        const dir = path.join(baseDirectory, directory);
        const files = fs.readdirSync(dir, { recursive: true })
        files.forEach(filename => {
            let pathname = path.join(dir, filename);
            if (fs.statSync(pathname).isDirectory()) {
                fileWalk(directory + filename, false);
            } else {
                results[((base) ? '' : (directory + '/')) + path.parse(filename).name] = fs.readFileSync(pathname).toString();
            }
        });
    }

    fileWalk('/', true);
    return results;
}

export {
    objectToString,
    readDirectoryAsStrings
}