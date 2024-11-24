/**
 * @module src/plugin/site-generator
 * src/plugin/site-generator.ts
 *
 * the SiteGenerator plugin adds functionality to STEVE to generate static websites
 *
 * by alex prosser
 * 11/18/2024
 */

import { copySync, existsSync, walkSync } from '@std/fs';
import { join, relative } from '@std/path';
import { STEVE, STEVEPlugin } from '../../index.ts';

/**
 * the options for the SiteGenerator
 */
interface SiteGeneratorOptions {
    staticDirectory?: string;
    outputDirectory: string;
    ignoredFiles?: string[];
    showExtension?: boolean;
}

/**
 * the options for a SingleRoute
 */
interface SingleRouteOptions {
    render: string;
    data: Record<string, unknown>;
    isFile?: boolean;
}

/**
 * the options for a GeneratorRoute
 */
interface GeneratorRouteOptions {
    render: string;
    data: Record<string, unknown>;
    isFile?: boolean;
    generator: GeneratorFile[];
}

/**
 * GeneratorFile holds all the files and content needed to generate a file using the GeneratorRoute
 */
interface GeneratorFile {
    name: string;
    data: Record<string, unknown>;
}

/**
 * GeneratedFile holds all the files and content already generated
 */
interface GeneratedFile {
    name: string;
    content: string;
}

/**
 * class that holds all the necessary information to generate a single page
 */
class SingleRoute {
    #render: string;
    #data: Record<string, unknown>;

    constructor(options: SingleRouteOptions) {
        if (!options.render) {
            throw new Error('please provide \'render\'!');
        }
        this.#render = options.render;

        if (!options.data) {
            throw new Error('please provide \'data\'!');
        }
        this.#data = options.data;

        if (options.isFile) {
            // if `render` is a file path, read its content
            this.#render = Deno.readTextFileSync(this.#render);
        }
    }

    generate(name: string): GeneratedFile[] {
        // generate a single file by rendering the template with provided data
        return [{ name, content: STEVE.render(this.#render, this.#data) }];
    }
}

/**
 * class that holds all the necessary information to generate multiple pages
 */
class GeneratorRoute {
    #render: string;
    #data: Record<string, unknown>;
    #generator: GeneratorFile[];

    constructor(options: GeneratorRouteOptions) {
        if (!options.render) {
            throw new Error('please provide \'render\'!');
        }
        this.#render = options.render;

        if (!options.data) {
            throw new Error('please provide \'data\'!');
        }
        this.#data = options.data;

        if (!options.generator) {
            throw new Error('please provide \'generator\'!');
        }
        this.#generator = options.generator;

        if (options.isFile) {
            // if `render` is a file path, read its content
            this.#render = Deno.readTextFileSync(this.#render);
        }
    }

    generate(name: string): GeneratedFile[] {
        // iterate over each generator file, merging its data with the main data
        return this.#generator.map((genFile) => {
            const data = { ...this.#data, ...genFile.data };
            return {
                name: `${name}.${genFile.name}`,
                content: STEVE.render(this.#render, data),
            };
        });
    }
}

/**
 * class that takes all the SingleRoutes and GeneratorRoutes and compiles a website
 */
class SiteGenerator extends STEVEPlugin {
    override PLUGIN_ID = 'SITE_GENERATOR';

    staticDirectory: string | null;
    #ignoredFiles: string[];
    #outputDirectory: string;
    #showExtension: boolean = false;

    constructor(options: SiteGeneratorOptions) {
        super();
        this.staticDirectory = options.staticDirectory ?? null;
        this.#ignoredFiles = options.ignoredFiles ?? [];
        if (!options.outputDirectory) {
            throw new Error(
                'please provide an \'outputDirectory\' for the files to go to!',
            );
        }
        this.#outputDirectory = options.outputDirectory;
        this.#showExtension = options.showExtension ?? false;
    }

    override generate(
        options: Record<string, SingleRoute | GeneratorRoute>,
    ): void {
        // clean up the output directory by removing non-ignored files and directories
        if (existsSync(this.#outputDirectory)) {
            const files = [...walkSync(this.#outputDirectory)].filter(file => {
                const filename = relative(this.#outputDirectory, file.path);
                return this.#ignoredFiles?.filter((f) =>
                    filename.includes(f)
                ).length == 0 && !filename.startsWith('.') && filename != ''
            });

            for (const file of files) {
                if (existsSync(file.path)) {
                    Deno.removeSync(file.path, { recursive: true });
                }
            }
        } else {
            // create the output directory if it doesn't exist
            Deno.mkdirSync(this.#outputDirectory, { recursive: true });
        }

        // copy static files into the output directory
        if (this.staticDirectory !== null) {
            copySync(this.staticDirectory, `${this.#outputDirectory}/static`);
        }

        /**
         * recursively generate routes, handling both SingleRoute and GeneratorRoute instances.
         * creates directories and files based on the route structure.
         *
         * @param object - the mapping of route names to route instances
         * @param filepath - the current path where the routes are being generated
         */
        const generateRoutes = (
            object: { [key: string]: SingleRoute | GeneratorRoute },
            filepath: string,
        ) => {
            Object.keys(object).forEach((route) => {
                const routeInstance = object[route];
                if (
                    routeInstance instanceof SingleRoute ||
                    routeInstance instanceof GeneratorRoute
                ) {
                    routeInstance.generate(route).forEach((file) => {
                        const routes = file.name.split('.');
                        const content = new TextEncoder().encode(file.content);

                        if (routes.at(-1) === 'root') {
                            // handle 'root' routes by creating an index.html file in the parent directory
                            Deno.writeFileSync(
                                join(
                                    filepath,
                                    ...routes.slice(0, -1),
                                    'index.html',
                                ),
                                content,
                            );
                        } else if (this.#showExtension) {
                            // write files with .html extension
                            Deno.mkdirSync(
                                join(filepath, ...routes.slice(0, -1)),
                                {
                                    recursive: true,
                                },
                            );
                            Deno.writeFileSync(
                                join(
                                    filepath,
                                    ...routes.slice(0, -1),
                                    `${routes.at(-1)}.html`,
                                ),
                                content,
                            );
                        } else {
                            // write files into directories without the .html extension
                            Deno.mkdirSync(join(filepath, ...routes), {
                                recursive: true,
                            });
                            Deno.writeFileSync(
                                join(filepath, ...routes, 'index.html'),
                                content,
                            );
                        }
                    });
                } else if (typeof routeInstance === 'object') {
                    // recursively process nested routes
                    Deno.mkdirSync(join(filepath, route), {
                        recursive: true,
                    });
                    generateRoutes(
                        routeInstance as {
                            [key: string]: SingleRoute | GeneratorRoute;
                        },
                        join(filepath, route),
                    );
                } else {
                    throw new Error(
                        `'${route}' is the wrong type! use SingleRoute, GeneratorRoute, or nest it!`,
                    );
                }
            });
        };

        generateRoutes(options, this.#outputDirectory);
    }

    override augment(): Record<string, unknown> {
        // add path and file utilities to the global STEVE modules for use in templates
        STEVE.globalModules.existsSync = existsSync;
        STEVE.globalModules.join = join;

        /**
         * generates the relative URL for a static file.
         *
         * @param file - the name of the static file
         * @returns the URL to the static file
         */
        const staticFile = (file: string): string => {
            const existsSync = STEVE.globalModules.existsSync as (
                path: string,
            ) => boolean;
            const join = STEVE.globalModules.join as (
                ...paths: string[]
            ) => string;

            if (!this.staticDirectory) {
                throw new Error(
                    'there is no \'staticDirectory\' defined to get static file!',
                );
            }

            const filePath = join(this.staticDirectory, file);
            if (!existsSync(filePath)) {
                throw new Error(
                    `the file, ${file}, does not exist in the \'staticDirectory\' (${this.staticDirectory})!`,
                );
            }

            return join('/static', file);
        };

        /**
         * joins paths together, ensuring a valid and consistent file
         *
         * @param paths - the list of path segments to join
         * @returns the final joined path
         */
        const joinPaths = (...paths: string[]): string => {
            const join = STEVE.globalModules.join as (
                ...paths: string[]
            ) => string;
            return join(...paths);
        };

        return {
            staticFile,
            joinPaths,
        };
    }
}

export { GeneratorRoute, SingleRoute, SiteGenerator };
