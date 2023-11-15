/**
 * @module src/core/plugin
 * src/core/plugin.js
 * 
 * The code to make plugins that add to the functionality of STEVE
 * 
 * by Alex Prosser
 * 11/15/2023
 */

/**
 * Generic STEVE plugin that can be modified to generate any type of file(s) 
 */
class STEVEPlugin {
    /**
     * The plugin id for the plugin. Used to check for unique plugins for conflicts
     */
    PLUGIN_ID = 'DEFAULT';

    /**
     * An abstract method that should overriden to generate files.
     * 
     * @abstract
     * @param {Record<string, any>} options Given options for the plugin 
     * @returns {any}
     */
    generate(options) {
        throw new Error('The subclass must implement this method, \'generate\'!');
    }

    /**
     * An abstract method that should overriden to add methods/data to the global STEVE object used in files
     * 
     * @abstract
     * @returns {Record<string, any>}
     */
    augment() {
        throw new Error('The subclass must implement this method, \'augment\'!');
    }
}

export default STEVEPlugin;