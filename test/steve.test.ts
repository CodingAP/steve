/**
 * test/steve.test.ts
 *
 * tests STEVE's functions
 *
 * by alex prosser
 * 11/18/2024
 */

import { assertEquals, assertThrows } from 'jsr:@std/assert';
import { STEVE, STEVEPlugin } from '../index.ts';

class MockPlugin extends STEVEPlugin {
    override PLUGIN_ID = 'MOCK_PLUGIN';
    testValue = 'test';

    override augment() {
        return {
            testFunction: () => this.testValue,
        };
    }

    override generate(options: Record<string, unknown>) {
        return `Generated with options: ${JSON.stringify(options)}`;
    }
}

Deno.test('STEVE: set and get includeDirectory', async () => {
    const tempDir = await Deno.makeTempDir();
    const templateFile = `${tempDir}/template.html`;
    await Deno.writeTextFile(templateFile, 'Hello, World!');

    STEVE.includeDirectory = tempDir;

    const includes = STEVE.includeDirectory;
    assertEquals(Object.keys(includes).length, 1);
    assertEquals(includes['template.html'], 'Hello, World!');

    await Deno.remove(tempDir, { recursive: true });
});

Deno.test('STEVE: throw error when no active plugin is set', () => {
    assertThrows(
        () => STEVE.generate({ key: 'value' }),
        Error,
        'there are no plugins loaded, so this will not do anything!',
    );
});

Deno.test('STEVE: add plugin and set active plugin', () => {
    const plugin = new MockPlugin();
    STEVE.addPlugin(plugin);

    assertEquals(STEVE.activePlugin, plugin.PLUGIN_ID);
    assertEquals(STEVE.plugins[plugin.PLUGIN_ID], plugin);
});

Deno.test('STEVE: generate using active plugin', () => {
    const plugin = new MockPlugin();
    STEVE.addPlugin(plugin);

    const output = STEVE.generate({ key: 'value' });
    assertEquals(output, 'Generated with options: {"key":"value"}');
});

Deno.test('STEVE: augment adds testFunction to global object', () => {
    const plugin = new MockPlugin();
    STEVE.addPlugin(plugin);

    const content = '<steve> return steve.testFunction(); </steve>';
    const data = {};

    const result = STEVE.render(content, data);

    assertEquals(result, 'test');

    plugin.testValue = 'new test';

    const newResult = STEVE.render(content, data);

    assertEquals(newResult, 'new test');
});

Deno.test('STEVE: multiple plugins coexist and switch correctly', () => {
    const plugin1 = new MockPlugin();
    const plugin2 = new MockPlugin();
    plugin2.PLUGIN_ID = 'MOCK_PLUGIN_2';
    plugin2.testValue = 'second test';

    STEVE.addPlugin(plugin1);
    STEVE.addPlugin(plugin2);

    // Activate first plugin and test render
    STEVE.activePlugin = plugin1.PLUGIN_ID;
    const content1 = '<steve> return steve.testFunction(); </steve>';
    const result1 = STEVE.render(content1, {});
    assertEquals(result1, 'test');

    // Activate second plugin and test render
    STEVE.activePlugin = plugin2.PLUGIN_ID;
    const content2 = '<steve> return steve.testFunction(); </steve>';
    const result2 = STEVE.render(content2, {});
    assertEquals(result2, 'second test');
});

Deno.test('STEVE: render template with data', () => {
    const content = 'Hello, <steve> return steve.data.name; </steve>!';
    const data = { name: 'STEVE' };
    const rendered = STEVE.render(content, data);

    assertEquals(rendered, 'Hello, STEVE!');
});

Deno.test('STEVE: render template file with data', async () => {
    const tempDir = await Deno.makeTempDir();
    const templateFile = `${tempDir}/template.html`;
    await Deno.writeTextFile(
        templateFile,
        'Hello, <steve> return steve.data.name; </steve>!',
    );

    const data = { name: 'STEVE' };
    const rendered = STEVE.renderFile(templateFile, data);

    assertEquals(rendered, 'Hello, STEVE!');

    await Deno.remove(tempDir, { recursive: true });
});

Deno.test('STEVE: unmatched start tag throws error', () => {
    const content = 'Hello, <steve>missing end tag';
    const data = {};

    assertThrows(
        () => STEVE.render(content, data),
        Error,
        'unmatched start STEVE tag found!',
    );
});

Deno.test('STEVE: unmatched end tag throws error', () => {
    const content = 'Hello, missing start tag</steve>';
    const data = {};

    assertThrows(
        () => STEVE.render(content, data),
        Error,
        'unmatched end STEVE tag found!',
    );
});

Deno.test('STEVE: nested STEVE tags throw error', () => {
    const content = 'Hello, <steve><steve>nested</steve></steve>';
    const data = {};

    assertThrows(
        () => STEVE.render(content, data),
        Error,
        'nested STEVE tags are not allowed!',
    );
});
