/**
 * @module src/core/steve
 * src/core/steve.ts
 *
 * the main STEVE object that holds the template engine
 *
 * by alex prosser
 * 11/18/2024
 */

import { walkSync } from '@std/fs';
import { relative } from '@std/path';
import type STEVEPlugin from './plugin.ts';

/**
 * turns an object into a string, which could include arrays, other objects, and functions.
 *
 * @param obj - object to stringify
 * @returns string representation of that object
 */
const objectStringify = (obj: Record<string, unknown>): string => {
    let result = '{';
    const keys = Object.keys(obj);
    keys.forEach((key) => {
        let value = obj[key];

        if (value === null || value === undefined) return;

        if (typeof value === 'function') {
            value = value.toString();
        } else if (Array.isArray(value) || typeof value === 'string') {
            value = JSON.stringify(value);
        } else if (typeof value === 'object') {
            value = objectStringify(value as Record<string, unknown>);
        }

        result += `\n  ${key}: ${value},`;
    });
    result += '\n}';
    return result;
};

/**
 * the STEVE class has methods to use the template engine to generate files
 *
 * use plugins to extend the features of STEVE
 */
class STEVE {
    /**
     * directory of includes and their contents
     */
    static #includes: Record<string, string>;

    /**
     * current plugin being used to generate
     */
    static activePlugin: string;

    /**
     * all plugins currently loaded into STEVE
     */
    static plugins: { [key: string]: STEVEPlugin } = {};

    /**
     * allows modules from the application to be used in file generation
     */
    static globalModules: { [key: string]: unknown } = {};

    /**
     * the values for the starting and ending tags for STEVE
     */
    static tags = { start: '<steve>', end: '</steve>' };

    /**
     * the name of the global object used in file generation
     *
     * note: cannot be the string 'STEVE'!
     */
    static globalName = 'steve';

    /**
     * sets the includeDirectory and loads all the files in it
     */
    static set includeDirectory(includePath: string) {
        this.#includes = {};

        for (const file of walkSync(includePath)) {
            if (file.isFile) {
                this.#includes[
                    relative(includePath, file.path).replace(/\\/g, '/')
                ] = Deno
                    .readTextFileSync(file.path);
            }
        }
    }

    /**
     * gets the includeDirectory's content
     */
    static get includeDirectory(): Record<string, string> {
        return this.#includes;
    }

    /**
     * adds a plugin into STEVE and sets it to be the active one
     *
     * @param plugin plugin to be added to STEVE
     */
    static addPlugin(plugin: STEVEPlugin) {
        this.plugins[plugin.PLUGIN_ID] = plugin;
        this.activePlugin = plugin.PLUGIN_ID;
    }

    /**
     * generates files according to the active plugin
     *
     * @param options options passed to the plugin
     */
    static generate(options: Record<string, unknown>): unknown {
        if (this.activePlugin === undefined) {
            throw new Error(
                'there are no plugins loaded, so this will not do anything!',
            );
        }

        return this.plugins[this.activePlugin].generate(options);
    }

    /**
     * renders the content using the data provided
     *
     * @param content the template string to render
     * @param data the data to be rendered
     * @returns the rendered template string
     */
    static render(content: string, data: Record<string, unknown>): string {
        return this.#convertText(content, data);
    }

    /**
     * renders the template file using the data provided
     *
     * @param file filename of the template file to render
     * @param data the data to be rendered
     * @returns the rendered template file
     */
    static renderFile(file: string, data: Record<string, unknown>): string {
        return this.#convertText(Deno.readTextFileSync(file), data);
    }

    /**
     * creates a global STEVE object with plugin augments that can be used in the generator files
     *
     * @param _data the data to be rendered
     * @returns the STEVE object with current plugin augments
     */
    static #createGlobalObject(
        _data: Record<string, unknown>,
    ): Record<string, unknown> {
        if (this.globalName === 'STEVE') {
            throw new Error("the global name for STEVE cannot be 'STEVE'!");
        }

        const include = (
            _file: string,
            _data: Record<string, unknown>,
        ): string => {
            if (!this.#includes) {
                throw new Error(
                    "there is no 'includeDirectory' defined to get includes!",
                );
            }

            const template = this.#includes[_file];
            if (!template) {
                throw new Error(
                    `the file '${_file}' does not exist in the includeDirectory.`,
                );
            }

            return this.#convertText(template, _data);
        };

        let augment: { [key: string]: unknown } = {};
        if (this.activePlugin && this.plugins[this.activePlugin]) {
            augment = this.plugins[this.activePlugin].augment();
        }

        const globalSTEVE: { [key: string]: unknown } = {
            include,
            data: _data,
        };

        Object.keys(augment).forEach((key) => {
            const value = augment[key];
            if (typeof value === 'function') {
                // replace all instances of 'this' with 'this.plugins[this.activePlugin]'
                globalSTEVE[key] = eval(
                    value.toString().replace(
                        /this/g,
                        'this.plugins[this.activePlugin]',
                    ),
                );
            }
        });

        return globalSTEVE;
    }

    /**
     * runs all the javascript blocks and converts to one text file
     *
     * @param content the raw content of the template file
     * @param data the data to be rendered
     * @returns the results of the conversion
     */
    static #convertText(_content: string, _data: Record<string, unknown>) {
        let _result = '', _current = '';
        let _checkForCode = false;
        for (let _i = 0; _i < _content.length; _i++) {
            _current += _content[_i];

            if (_current.includes(this.tags.start)) {
                if (_checkForCode) {
                    throw new Error(
                        `nested STEVE tags are not allowed! ...${_current}...`,
                    );
                } else {
                    _result += _current.slice(0, -this.tags.start.length);
                    _current = '';
                    _checkForCode = true;
                }
            } else if (_current.includes(this.tags.end)) {
                if (_checkForCode) {
                    try {
                        const _fragment = eval(
                            `(() => {const ${this.globalName} = ${
                                objectStringify(this.#createGlobalObject(_data))
                            }; ${_current.slice(0, -this.tags.end.length)}})()`,
                        );

                        if (_fragment != null) {
                            _result += _fragment;
                        }
                    } catch (err) {
                        throw new Error(`${err} inside STEVE tags: ${_current.slice(0, -this.tags.end.length).slice(0, 50)}...`)
                    }

                    _current = '';
                    _checkForCode = false;
                } else {
                    throw new Error(
                        `unmatched end STEVE tag found! ...${_current}...`,
                    );
                }
            }
        }

        if (_checkForCode) {
            throw new Error(
                `unmatched start STEVE tag found! ...${_current}...`,
            );
        }

        return _result + _current;
    }
}

export default STEVE;
