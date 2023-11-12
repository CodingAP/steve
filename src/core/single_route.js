/**
 * Type that defines the options of a single route
 * @typedef {Object} SingleRouteOptions
 * 
 * @property {name} name Name of route
 * @property {string} render Template file to render
 * @property {Record<string, any>} data Data related to route for rendering
 */

/**
 * Class that holds all the necessary information to generate a static page
 * 
 * It will take the form of this structure:
 * 
 * ```
 * /[name]
 * |
 * +-- index.html
 * ```
 */
class SingleRoute {
    /**
     * Creates a single route that generates based on the data given
     * @param {SingleRouteOptions} options 
     */
    constructor(options) {
        this.name = options.name;
        this
    }
}