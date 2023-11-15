/**
 * @module src/core/steve
 * src/core/steve.js
 * 
 * The main STEVE object that holds the template engine
 * 
 * by Alex Prosser
 * 11/15/2023
 */

import fs from 'fs';
import { readDirectoryAsStrings, objectToString } from '../helper.js';
import STEVEPlugin from './plugin.js';

/**
 * The STEVE class has methods to use the template engine to generate files
 * 
 * Use plugins to extend the features of STEVE
 */
class STEVE {
    /**
     * Directory of includes and their contents
     * 
     * @type {Record<string, string>}
     */
    static #includes = null;

    /**
     * Current plugin being used to generate
     * 
     * @type {string}
     */
    static activePlugin = null;
    
    /**
     * All plugins current loaded into STEVE
     * @type {Record<string, STEVEPlugin>}
     */
    static plugins = {};

    /**
     * Allows modules from Node to be used in file generation
     * 
     * @type {Record<string, any>}
     */
    static globalModules = {};

    /**
     * The values for the starting and ending tags for STEVE
     */
    static tags = { start: '<steve>', end: '</steve>' };

    /**
     * The name of the global object used in file generation
     * 
     * NOTE: Cannot be the string 'STEVE'!
     * 
     * @type {string}
     */
    static globalName = 'Steve';

    /**
     * Sets the includeDirectory and load all the files in it
     * 
     * @param {string} includePath Path to the includes directory
     */
    static set includeDirectory(includePath) {
        this.#includes = readDirectoryAsStrings(includePath);
    }

    /**
     * Gets the includeDirectory's content
     */
    static get includeDirectory() {
        return this.#includes;
    }

    /**
     * Adds plugin into STEVE and sets it to be the active one
     * 
     * @param {STEVEPlugin} plugin Plugin to be added to STEVE 
     */
    static addPlugin(plugin) {
        this.plugins[plugin.PLUGIN_ID] = plugin;
        this.activePlugin = plugin.PLUGIN_ID;
    }

    /**
     * Generate files according to the active plugin
     * 
     * @param {Record<string, any>} options 
     */
    static generate(options) {
        if (this.activePlugin == null) {
            throw new Error('There are no plugins loaded, so this will not do anything!');
        }

        return this.plugins[this.activePlugin].generate(options);
    }

    /**
     * Render the content using the data provided
     * 
     * @param {string} content Filename of the template file to render
     * @param {Record<string, any>} data The date to be rendered
     * @returns {string} The rendered template file
     */
    static render(content, data) {
        return this.#convertText(content, data);
    }
    
    /**
     * Render the template file using the data provided
     * 
     * @param {string} file Filename of the template file to render
     * @param {Record<string, any>} data The date to be rendered
     * @returns {string} The rendered template file
     */
    static renderFile(file, data) {
        return this.#convertText(fs.readFileSync(file).toString(), data);
    }

    /**
     * Create a global STEVE object with plugin augments that can be used in the generator files
     * 
     * @param {Record<string, any>} data The data to be rendered
     * @returns STEVE object with current plugin augments
     */
    static #createGlobalObject(data) {
        // check for globalName =/= STEVE
        if (this.globalName == 'STEVE') {
            throw new Error('The global name for STEVE cannot be \'STEVE\'');
        }

        /**
         * Grab the include template file from the includeDirectory and render it to pass to the other template file
         * 
         * @param {string} file Filename for the include (relative to the includeDirectory) 
         * @param {Record<string, any>} data The include data to be rendered
         */
        const include = (file, data) => {
            if (this.#includes == null) {
                throw new Error('There is no \'includeDirectory\' defined to get includes!');
            }

            return this.#convertText(this.#includes[file], data)
        }

        // grab the augments from the current plugin
        let augment = {};
        if (this.activePlugin != null) {
            augment = this.plugins[this.activePlugin].augment();
        }

        // change the this in augment functions to the plugin relative to STEVE object
        // i don't like how this is written, but I don't see a way to make it better...
        Object.keys(augment).forEach(key => {
            augment[key] = eval(augment[key].toString().replace(/this/g, 'this.plugins[this.activePlugin]'));
        });

        const STEVE = {
            include,
            data,
            ...augment
        }

        return STEVE;
    }

    /**
     * Runs all the JavaScript blocks and converts to one text file
     * 
     * @param {string} _content The raw content of the template file 
     * @param {Record<string, any>} _data The data to be rendered 
     * @returns {string} The results of the conversion
     */
    static #convertText(_content, _data) {
        // all the underscored variables is to not interfere with the code running in the file generator
        let _result = '', _current = '';
        let _checkForCode = false;
        for (let _i = 0; _i < _content.length; _i++) {
            _current += _content[_i];

            // if we just found the start tag
            if (_current.includes(this.tags.start)) {
                // check current state, throw errors if necessary
                if (_checkForCode) {
                    throw new Error(`Nested STEVE tags are not allowed! ...${_current}...`);
                } else {
                    // remove tag and add text to end result and start code checking
                    _result += _current.slice(0, -this.tags.start.length);

                    _current = '';
                    _checkForCode = true;
                }
            // if we just found the end tag
            } else if (_current.includes(this.tags.end)) {
                // check current state, throw errors if necessary
                if (_checkForCode) {
                    // create code that is localized only to itself and the global STEVE object
                    // WARNING: using eval here is bad, probably should replace it with something better
                    const _fragment = eval(`(() => {const ${this.globalName} = ${objectToString(this.#createGlobalObject(_data))}; ${_current.slice(0, -this.tags.end.length) }})()`);
                    if (_fragment != null) {
                        _result += _fragment;
                    }

                    _current = '';
                    _checkForCode = false;
                } else {
                    throw new Error(`Unmatched end STEVE tag found! ...${_current}...`);
                }
            }
        }

        if (_checkForCode) {
            throw new Error(`Unmatched start STEVE tag found! ...${_current}...`);
        }

        return _result + _current;
    }
}

export default STEVE;