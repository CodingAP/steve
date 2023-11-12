/**
 * @module src/plugin/site_generator
 * src/plugin/site_generator.js
 * 
 * The code to make plugins that add to the functionality of STEVE
 * 
 * by Alex Prosser
 * 11/10/2023
 */

/**
 * The options for the SiteGenerator
 * 
 * @typedef {Object} SiteGeneratorOptions
 * @property {string} staticDirectory Directory where static files are held
 * @property {string} outputDirectory Directory where the generated website will be put in
 * @property {boolean} showExtension Whether or not to show .html in the URL after generating
 */

/**
 * The options for the SingleRoute
 *
 * @typedef {Object} SingleRouteOptions
 * @property {string} render Path to the template file or raw content to be rendered
 * @property {Record<string, any>} data The data to be rendered
 * @property {boolean} isFile Whether 'render' is a file path or raw string (default to false)
 */

/**
 * The options for the GeneratorRoute
 *
 * @typedef {Object} GeneratorRouteOptions
 * @property {string} render Path to the template file or raw content to be rendered
 * @property {Record<string, any>} data The data to be rendered
 * @property {boolean} isFile Whether 'render' is a file path or raw string
 * @property {GeneratorFile[]} generator List of all the generators
 * 
 */

/**
 * GeneratorFile holds all the files and content needed to generate a file using the GeneratorRoute
 *
 * @typedef {Object} GeneratorFile
 * @property {string} name The route name for the generators
 * @property {Record<string, any>} data The data to be rendered in the generators
 */

/**
 * GeneratedFile holds all the files and content already generated
 *
 * @typedef {Object} GeneratedFile
 * @property {string} name The route name for the generators
 * @property {string} content The rendered content
 */

import fs from 'fs';
import path from 'path';
import { STEVE, STEVEPlugin } from '../../index.js';

class SingleRoute {
    /**
     * Either the raw content or the file name for the generated file
     * 
     * @type {string}
     */
    #render = null;

    /**
     * Data to be rendered
     * 
     * @type {Record<string, any>}
     */
    #data = null;

    /**
     * Creates a single route with the given options
     * 
     * @param {SingleRouteOptions} options Options for the creation of a SingleRoute
     */
    constructor(options) {
        if (options.render == null) {
            throw new Error('Please provide \'render\'!');
        }
        this.#render = options.render;
         
        if (options.data == null) {
            throw new Error('Please provide \'data\'!');
        }
        this.#data = options.data;

        if (options.isFile) {
            this.#render = fs.readFileSync(this.#render).toString();
        }
    }

    /**
     * Generates a single file given the name of the route
     * 
     * @param {string} name Name of the route
     * @return {GeneratedFile[]} List of generated files (should be length of 1)
     */
    generate(name) {
        return [{ name: name, content: STEVE.render(this.#render, this.#data) }];
    }
}

class GeneratorRoute {
    /**
     * Either the raw content or the file name for the template file
     * 
     * @type {string}
     */
    #render = null;

    /**
     * Data to be rendered
     * 
     * @type {Record<string, any>}
     */
    #data = null;

    /**
     * The different files to be rendered
     * 
     * @type {FileGenerator[]}
     */
    #generator = null;

    /**
     * Creates multiple routes with the given options
     * 
     * @param {GeneratorRouteOptions} options Options for the creation of a GeneratorRoute
     */
    constructor(options) {
        if (options.render == null) {
            throw new Error('Please provide \'render\'!');
        }
        this.#render = options.render;

        if (options.data == null) {
            throw new Error('Please provide \'data\'!');
        }
        this.#data = options.data;

        if (options.generator == null) {
            throw new Error('Please provide \'generator\'!');
        }
        this.#generator = options.generator;

        if (options.isFile) {
            this.#render = fs.readFileSync(this.#render).toString();
        }
    }

    /**
     * Generates multiple files given the name of the route
     * 
     * @param {string} name Name of the route
     * @return {GeneratedFile[]} List of generated files
     */
    generate(name) {
        let files = [];
        for (let i = 0; i < this.#generator.length; i++) {
            const data = {...this.#data, ...this.#generator[i].data};
            files.push({ name: `${name}.${this.#generator[i].name}`, content: STEVE.render(this.#render, data) });
        }
        return files;
    }
}

class SiteGenerator extends STEVEPlugin {
    PLUGIN_ID = 'SITE_GENERATOR';

    /**
     * Directory where static files are held
     * 
     * @type {string}
     */
    staticDirectory = null;

    /**
     * Directory where the generated website will be put in
     * 
     * @type {string}
     */
    #outputDirectory = null;

    /**
     * Whether or not to show .html in the URL after generating
     * 
     * @type {boolean}
     */
    #showExtension = false;

    /**
     * Set up the site generator
     * 
     * @param {SiteGeneratorOptions} options The options for the SiteGenerator 
     */
    constructor(options) {
        super();
        this.staticDirectory = options.staticDirectory;

        if (options.outputDirectory == null) {
            throw new Error('Please provide an \'outputDirectory\' for the files to go to!');
        } else {
            this.#outputDirectory = options.outputDirectory;
        }

        if (options.showExtension != null) {
            this.#showExtension = options.showExtension;
        }
    }

    /**
     * Generates a website from the given routes.
     * 
     * @param {Record<string, any>} options Given options for the plugin 
     * @returns {void}
     */
    generate(options) {
        // clean up output directory
        if (fs.existsSync(this.#outputDirectory)) {
            fs.readdirSync(this.#outputDirectory, { recursive: true }).forEach(name => {
                const filename = path.join(this.#outputDirectory, name);
                if (fs.statSync(filename).isDirectory()) {
                    fs.rmSync(filename, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(filename);
                }
            });
        }

        // if staticDirectory exists, copy it to static in output
        if (this.staticDirectory != null) {
            fs.cpSync(this.staticDirectory, `${this.#outputDirectory}/static`, { recursive: true });
        }

        /**
         * Generate all the routes in an object
         * 
         * @param {Record<string, SingleRoute|GeneratorRoute>} object Mapping of names to routes
         * @param {string} filepath File path to where to generate it to
         */
        const generateRoutes = (object, filepath) => {
            Object.keys(object).forEach(route => {
                if (object[route] instanceof SingleRoute || object[route] instanceof GeneratorRoute) {
                    let files = object[route].generate(route);
                    for (let file of files) {
                        let routes = file.name.split('.');
                        if (routes.at(-1) == 'root') {
                            fs.writeFileSync(path.join(filepath, ...routes.slice(0, -1), 'index.html'), file.content);
                        } else {
                            if (this.#showExtension) {
                                fs.writeFileSync(path.join(filepath, ...routes.slice(0, -1), `${file.name}.html`), file.content);
                            } else {
                                fs.mkdirSync(path.join(filepath, ...routes), { recursive: true });
                                fs.writeFileSync(path.join(filepath, ...routes, 'index.html'), file.content);
                            }
                        }
                    }
                } else if (typeof object[route] == 'object') {
                    fs.mkdirSync(path.join(filepath, route), { recursive: true });
                    generateRoutes(object[route], path.join(filepath, route));
                } else {
                    throw new Error(`'${route}' is the wrong type! Use SingleRoute, GeneratorRoute, or nest it!`);
                }
            });
        }

        generateRoutes(options, this.#outputDirectory);
    }

    /**
     * Add static to the global STEVE object used in files
     * 
     * @returns {Record<string, any>}
     */
    augment() {
        // add path module to STEVE global modules to be used in file generators
        STEVE.globalModules.path = path;

        /**
         * Generates the file path for a static file
         * 
         * @param {string} file File name of the static file 
         * @returns {string} Full path for static file
         */
        const staticFile = file => {
            if (this.staticDirectory == null) {
                throw new Error('There is no \'staticDirectory\' defined to get static file!');
            }

            const filePath = STEVE.globalModules.path.join(this.staticDirectory, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`The file, ${file}, does not exist in the \'staticDirectory\' (${this.staticDirectory})!`);
            }

            return STEVE.globalModules.path.join('./static', file); 
        }

        return {
            staticFile
        };
    }
}

export {
    SingleRoute,
    GeneratorRoute,
    SiteGenerator
}