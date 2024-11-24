/**
 * test/site-generator.test.ts
 *
 * tests the SingleRoute's, GeneratorRoute's, and SiteGenerator's functions
 *
 * by alex prosser
 * 11/18/2024
 */

import { assertEquals, assertThrows } from '@std/assert';
import { ensureDir, exists } from 'jsr:@std/fs';
import { GeneratorRoute, SingleRoute, SiteGenerator, STEVE } from '../index.ts';
import { join } from '@std/path/join';

// ~~~~~ SingleRoute testing ~~~~~
Deno.test('SingleRoute: generates a single route with render content', () => {
    const route = new SingleRoute({
        render: 'Hello, <steve> return steve.data.name </steve>!',
        data: { name: 'STEVE' },
        isFile: false,
    });

    const generated = route.generate('home');
    assertEquals(generated.length, 1);
    assertEquals(generated[0].name, 'home');
    assertEquals(generated[0].content, 'Hello, STEVE!');
});

Deno.test('SingleRoute: throws error when render is empty', () => {
    assertThrows(
        () => new SingleRoute({ render: '', data: {}, isFile: false }),
        Error,
        "please provide 'render'!",
    );
});

Deno.test('SingleRoute: reads template from file when isFile is true', async () => {
    const tempDir = await Deno.makeTempDir();
    const templateFile = `${tempDir}/template.html`;

    await Deno.writeTextFile(
        templateFile,
        'Hello, <steve> return steve.data.name </steve>!',
    );

    const route = new SingleRoute({
        render: templateFile,
        data: { name: 'STEVE' },
        isFile: true,
    });

    const generated = route.generate('home');
    assertEquals(generated.length, 1);
    assertEquals(generated[0].name, 'home');
    assertEquals(generated[0].content, 'Hello, STEVE!');

    await Deno.remove(tempDir, { recursive: true });
});

Deno.test('SingleRoute: throws error for missing file when isFile is true', () => {
    assertThrows(
        () =>
            new SingleRoute({
                render: 'nonexistent.html',
                data: { name: 'Test' },
                isFile: true,
            }),
        Deno.errors.NotFound,
    );
});

// ~~~~~ GeneratorRoute testing ~~~~~
Deno.test('GeneratorRoute: generates multiple files from a template', () => {
    const route = new GeneratorRoute({
        render: 'Item: <steve> return steve.data.item </steve>',
        data: {},
        isFile: false,
        generator: [
            { name: 'file1', data: { item: 'Item 1' } },
            { name: 'file2', data: { item: 'Item 2' } },
        ],
    });

    const generated = route.generate('items');
    assertEquals(generated.length, 2);
    assertEquals(generated[0].name, 'items.file1');
    assertEquals(generated[0].content, 'Item: Item 1');
    assertEquals(generated[1].name, 'items.file2');
    assertEquals(generated[1].content, 'Item: Item 2');
});

Deno.test("GeneratorRoute: throws error when 'render' is empty", () => {
    assertThrows(
        () =>
            new GeneratorRoute({
                render: '',
                data: {},
                isFile: false,
                generator: [{ name: 'test', data: {} }],
            }),
        Error,
        "please provide 'render'!",
    );
});

Deno.test('GeneratorRoute: reads template from file when isFile is true', async () => {
    const tempDir = await Deno.makeTempDir();
    const templateFile = `${tempDir}/template.html`;

    await Deno.writeTextFile(
        templateFile,
        'Item: <steve> return steve.data.item </steve>',
    );

    const route = new GeneratorRoute({
        render: templateFile,
        data: {},
        isFile: true,
        generator: [
            { name: 'file1', data: { item: 'Item 1' } },
            { name: 'file2', data: { item: 'Item 2' } },
        ],
    });

    const generated = route.generate('items');
    assertEquals(generated.length, 2);
    assertEquals(generated[0].name, 'items.file1');
    assertEquals(generated[0].content, 'Item: Item 1');
    assertEquals(generated[1].name, 'items.file2');
    assertEquals(generated[1].content, 'Item: Item 2');

    await Deno.remove(tempDir, { recursive: true });
});

Deno.test('GeneratorRoute: throws error for missing file when isFile is true', () => {
    assertThrows(
        () =>
            new GeneratorRoute({
                render: 'nonexistent.html',
                data: {},
                isFile: true,
                generator: [{ name: 'file1', data: { item: 'Item 1' } }],
            }),
        Deno.errors.NotFound,
    );
});

// ~~~~~ SiteGenerator testing ~~~~~
Deno.test('SiteGenerator: generates files and directories correctly', async () => {
    // Set up test directories and files
    const tempDir = await Deno.makeTempDir();
    const staticDir = `${tempDir}/static`;
    const outputDir = `${tempDir}/output`;

    await Deno.mkdir(staticDir);
    await Deno.writeTextFile(`${staticDir}/test.txt`, 'Static file content');

    const generator = new SiteGenerator({
        staticDirectory: staticDir,
        outputDirectory: outputDir,
        ignoredFiles: ['ignore.txt'],
        showExtension: true,
    });

    const routes = {
        home: new SingleRoute({
            render: 'Welcome to <steve> return steve.data.siteName; </steve>',
            data: { siteName: 'My Site' },
            isFile: false,
        }),
    };

    generator.generate(routes);

    const outputFiles = Array.from(Deno.readDirSync(outputDir)).map((f) =>
        f.name
    );
    assertEquals(outputFiles.includes('static'), true);
    assertEquals(outputFiles.includes('home.html'), true);

    const homeContent = await Deno.readTextFile(`${outputDir}/home.html`);
    assertEquals(homeContent, 'Welcome to My Site');

    // Cleanup
    await Deno.remove(tempDir, { recursive: true });
});

Deno.test('SiteGenerator: generates multiple files using GeneratorRoute', async () => {
    const tempDir = await Deno.makeTempDir();
    const staticDir = `${tempDir}/static`;
    const outputDir = `${tempDir}/output`;

    // Prepare a template file
    const templateFile = `${tempDir}/template.html`;
    await Deno.writeTextFile(
        templateFile,
        'Item: <steve> return steve.data.item; </steve>',
    );

    // Prepare static files
    await ensureDir(staticDir);
    await Deno.writeTextFile(
        `${staticDir}/style.css`,
        'body { font-family: sans-serif; }',
    );

    // Create SiteGenerator instance
    const generator = new SiteGenerator({
        staticDirectory: staticDir,
        outputDirectory: outputDir,
        ignoredFiles: [],
        showExtension: true,
    });

    // Define routes
    const routes = {
        items: new GeneratorRoute({
            render: templateFile,
            data: {},
            isFile: true,
            generator: [
                { name: 'item1', data: { item: 'Item 1' } },
                { name: 'item2', data: { item: 'Item 2' } },
            ],
        }),
    };

    // Generate the site
    generator.generate(routes);

    // Validate output files
    assertEquals(await exists(`${outputDir}/static/style.css`), true);
    assertEquals(await exists(`${outputDir}/items/item1.html`), true);
    assertEquals(await exists(`${outputDir}/items/item2.html`), true);

    const item1Content = await Deno.readTextFile(
        `${outputDir}/items/item1.html`,
    );
    assertEquals(item1Content, 'Item: Item 1');

    const item2Content = await Deno.readTextFile(
        `${outputDir}/items/item2.html`,
    );
    assertEquals(item2Content, 'Item: Item 2');

    // Cleanup
    await Deno.remove(tempDir, { recursive: true });
});

Deno.test('SiteGenerator: handles ignored files correctly', async () => {
    const tempDir = await Deno.makeTempDir();
    const outputDir = `${tempDir}/output`;

    // Create output directory with ignored files
    await ensureDir(outputDir);
    await Deno.writeTextFile(
        `${outputDir}/ignore.txt`,
        'This file should not be deleted.',
    );
    await Deno.writeTextFile(
        `${outputDir}/delete.txt`,
        'This file should be deleted.',
    );
    await Deno.writeTextFile(
        `${outputDir}/.system`,
        'This file should not be deleted.',
    );
    await ensureDir(join(outputDir, '.git'));
    await Deno.writeTextFile(
        join(outputDir, '.git', 'HEAD'),
        'This file should not be deleted.',
    );

    // Create SiteGenerator instance
    const generator = new SiteGenerator({
        outputDirectory: outputDir,
        ignoredFiles: ['ignore.txt'],
    });

    // Define routes (empty for simplicity)
    const routes = {};

    // Generate the site
    generator.generate(routes);

    // Validate that ignored files remain
    assertEquals(await exists(`${outputDir}/ignore.txt`), true);
    assertEquals(await exists(`${outputDir}/.system`), true);
    assertEquals(await exists(`${outputDir}/.git/HEAD`), true);

    // Validate that non-ignored files are deleted
    assertEquals(await exists(`${outputDir}/delete.txt`), false);

    // Cleanup
    await Deno.remove(tempDir, { recursive: true });
});

Deno.test('SiteGenerator: throws error for invalid static file', () => {
    const generator = new SiteGenerator({
        staticDirectory: 'static',
        outputDirectory: 'output',
        ignoredFiles: [],
        showExtension: false,
    });

    const staticFile = generator.augment()['staticFile'] as (
        file: string,
    ) => string;
    assertThrows(
        () => staticFile('nonexistent.txt'),
        Error,
        "the file, nonexistent.txt, does not exist in the 'staticDirectory' (static)!",
    );
});

Deno.test('SiteGenerator: throws error when outputDirectory is not provided', () => {
    assertThrows(
        () =>
            new SiteGenerator({
                staticDirectory: 'static',
                outputDirectory: '',
                ignoredFiles: [],
                showExtension: false,
            }),
        Error,
        "please provide an 'outputDirectory' for the files to go to!",
    );
});

Deno.test('SiteGenerator: check to see if global modules work', async () => {
    const tempDir = await Deno.makeTempDir();
    const outputDir = `${tempDir}/output`;

    // Create SiteGenerator instance
    STEVE.addPlugin(
        new SiteGenerator({
            outputDirectory: outputDir,
        }),
    );

    // Generate the site
    STEVE.generate({
        root: new SingleRoute({
            render:
                '<steve> return steve.joinPaths(...steve.data.paths); </steve>',
            data: { paths: ['hello', 'world'] },
        }),
    });

    const text = await Deno.readTextFile(`${outputDir}/index.html`);
    assertEquals(text.includes('hello'), true);

    // Cleanup
    await Deno.remove(tempDir, { recursive: true });
});
