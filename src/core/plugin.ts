/**
 * @module src/core/plugin
 * src/core/plugin.ts
 *
 * the code to make plugins that add to the functionality of STEVE
 *
 * by alex prosser
 * 11/18/2024
 */

/**
 * generic STEVE plugin that can be modified to generate any type of file(s)
 */
class STEVEPlugin {
    /**
     * the plugin id for the plugin. used to check for unique plugins for conflicts
     */
    PLUGIN_ID = 'DEFAULT';

    /**
     * an abstract method that should overriden to generate files.
     *
     * @param _options options to pass through to generation
     */
    generate(_options: Record<string, unknown>): unknown {
        throw new Error("The subclass must implement this method, 'generate'!");
    }

    /**
     * an abstract method that should overriden to add methods/data to the global STEVE object used in files
     *
     * @returns extra data to be added to the global STEVE object
     */
    augment(): Record<string, unknown> {
        throw new Error("The subclass must implement this method, 'augment'!");
    }
}

export default STEVEPlugin;
