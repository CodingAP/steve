/**
 * @module index
 * index.js
 * 
 * Combines all the modules for one import
 * 
 * by Alex Prosser
 * 11/12/2023
 */

import STEVEPlugin from './src/core/plugin.js';
import STEVE from './src/core/steve.js';
import { SiteGenerator, SingleRoute, GeneratorRoute } from './src/plugin/site_generator.js';

export {
    STEVEPlugin,
    STEVE,
    SiteGenerator, SingleRoute, GeneratorRoute
}