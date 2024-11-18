/**
 * @module index
 * index.ts
 *
 * allows all the exports to be in one file
 *
 * by alex prosser
 * 11/18/2024
 */

import STEVE from './src/core/steve.ts';
import STEVEPlugin from './src/core/plugin.ts';
import {
    GeneratorRoute,
    SingleRoute,
    SiteGenerator,
} from './src/plugin/site-generator.ts';

export { GeneratorRoute, SingleRoute, SiteGenerator, STEVE, STEVEPlugin };
