# STEVE Template Engine

### by AP
#### Last Modified 11/10/23

***ST***atic Sit***E*** Generator (***VE***ry cool)

## Features

`STEVE` supports many features including:
- Template engine that uses JavaScript to process the text
- Built-in site generator plugin with highly customizable options
- Plugin support to create different types of generators
- ExpressJS support to use for actual routing and SSR (Not implemented)

## Template Engine:
Any file can be processed by `STEVE`. All it uses is `%{= // javascript code here =}%` to create a block that can be ran. Anything returned will be rendered. For example...

```javascript
%{=
    const items = ['Hello', 'World', 'Hello', 'STEVE'];
    let content = '<ul>';
    for (let i = 0; i < items.length; i++) {
        content += `<li>${items[i]}</li>`;
    }
    return content + '</ul>';
=}%
```

...would render...

```html
<ul>
    <li>Hello</li>
    <li>World</li>
    <li>Hello</li>
    <li>STEVE</li>
</ul>
```

These JavaScript blocks also have access to a global `STEVE` object that includes some methods to add outside code in the file. The `STEVE` object has these methods/variables:
- `data`: The data provided from the function who is rendering the file
- `include(file, data)`: Loads the file from the `includeDirectory` with the data provided.

To create a engine, use the `STEVE` object in NodeJS...

Example:
`template.steve`
```html
<h1>Hello <steve> return STEVE.data.name </steve>!</h1>
<p>Your number squared is <steve> return Math.pow(STEVE.data.number, 2) </steve>!</p>
```

`index.js`
```javascript
import fs from 'fs';
import { STEVE } from 'steve';

STEVE.renderFile('./template.steve', { number: 123, name: 'AP' });
```
`output`
```
<h1>Hello AP!</h1>
<p>Your number squared is 15129!</p>
```

To use `include(file, data)`, please define the `includeDirectory` using...

```javascript
STEVE.includeDirectory = 'path/to/includes';
```

...or it will throw an error.

You can also modify how `STEVE` reads and compiles files as well. Such settings include...
- Defining the start/end tag for `STEVE` (current defaults to `<steve></steve>`)
  - To modify, use this code...
    ```javascript
    STEVE.tags = { start: ..., end: ... }
    ```
- Name of the global `STEVE` object (current defaults to `Steve`)
  - To modify, use this code...
    ```javascript
    STEVE.globalName = ...;
    ```
- Methods/variables included with the global `STEVE` object (see plugins) 

## Plugin Support
The plugin system allows for different generators to be created while providing a easy-to-use interface between `STEVE`, the plugin, and the files. Plugins allows code to generate to be packaged together to provide the end-user with a method to create and customize the output. It will also allow for the global `STEVE` object to be augmented with data and functions that can be called in the files. To get started, create a new class that extends the `STEVEPlugin` class...

```javascript
class ExamplePlugin extends STEVEPlugin {
    PLUGIN_ID = 'EXAMPLE';

    generate(options) {
        ...
    }

    augment() {
        ...
    }
}
```

`STEVEPlugin` has some data/functions that need to be overriden to be useful:
- `PLUGIN_ID`: ID to make sure plugins don't conflict (will throw error is duplicate plugins are found)
- `generate(options)`: Generates the files needed by the plugin
- `augment()`: Adds the data/functions to the global `STEVE` object that is accessible to the files

Anything else can be added to the plugin without the need for `STEVE` to know.

To add and use the plugin to `STEVE`, use this code...
```javascript
STEVE.addPlugin(new ExamplePlugin())

STEVE.generate({ /* options */ })
```

For multiple plugins, you can specify which plugin is currently used by using `activePlugin`...

```javascript
...

STEVE.activePlugin = 'EXAMPLE1';
// some code here
STEVE.activePlugin = 'EXAMPLE2';
// some other code here

...
```

Sometimes, you might want to add NodeJS modules into a `STEVEPlugin`. By default, there are no modules, but you can add modules to be used in the `augment` using the `globalModules` variable. Just add a module by using it like an object. For example...

```javascript
...
augment() {
    STEVE.globalModules['moduleName'] = module;
}
...
```

To see how a plugin in written, for example, this is the `StaticSiteGenerator` provided...

```javascript
class SiteGenerator extends STEVEPlugin {
    PLUGIN_ID = 'SITE_GENERATOR';

    // TODO: Put code for SiteGenerator here
}
```

## Site Generator Plugin
`STEVE` has built-in site generator (that uses the plugin system) that allows for websites to be generated from several files that can be modified from the code rather than the pages themselves.

#### Use cases:
- Blogs and portfolios as it allows for content to be generated without complicated HTML formatting.
- Simple website with simple routing
- Server-side rendering (with use of a server)

#### `SiteGenerator`
The generation comes from this plugin, where it takes it in all the routes and generates a website. You can create an instance of it with...

```javascript
...
STEVE.addPlugin(new SiteGenerator({
    staticDirectory: 'path/to/static',
    outputDirectory: 'path/to/output',
    showExtension: false
}));
...
```

The options provided are the following:
- `staticDirectory`: path to the directory that stores all static files (javascript, images, styles, etc.). Can be left out if there is no static files.
- `outputDirectory`: path to the output where the generated site will be.
- `showExtension`: boolean to indicate whether or not to show .html after every page. If true, the file will generate to html file of route name; If false, the file will generate to index.html and be put in folder of route name.

#### `showExtension = true`
List of URLS:
- `example.com`
- `example.com/route.html`
- `example.com/generator-route/generated-1.html`
- `example.com/generator-route/generated-2.html`
  
```
output/
|
+-- index.html
|
+-- route.html
|
+-- generator-route/
|   |
|   +-- generated-1.html
|   |
|   +-- generated-2.html
|
+-- static
```
#### `showExtension = false`
List of URLS:
- `example.com`
- `example.com/route`
- `example.com/generator-route/generated-1`
- `example.com/generator-route/generated-2`
  
```
output/
|
+-- index.html
|
+-- route
|   |
|   +-- index.html
|
+-- generator-route/
|   |
|   +-- generated-1
|   |   |
|   |   +-- index.html
|   |   
|   +-- generated-2
|   |   |
|   |   +-- index.html
|
+-- static
```

`SiteGenerator` also augments the global `STEVE` object, which adds these functions/data:
- `static`: Generates a link to the static directory to allows for correct routing

To generate the site, you use the `generate` function with the routes needed...

```javascript
STEVE.generate({
    root: new SingleRoute(...),
    route1: new SingleRoute(...),
    route2: new GeneratorRoute(...),
    nestedRoutes: {
        root: new SingleRoute(...),
        nestedRoute1: new SingleRoute(...),
        nestedRoute2: new GeneratorRoute(...)
    }
});
```

This would generate this site format (if `showExtension` is false)...

```
output/
|
+-- index.html
|
+-- route1
|   |
|   +-- index.html
|
+-- route2
|   |
|   +-- generated-1
|   |   |
|   |   +-- index.html 
|   |
|   +-- generated-2
|       |
|       +-- index.html
|
+-- nestedRoutes/
|   |
|   +-- nestedRoute1
|   |   |
|   |   +-- index.html
|   |   
|   +-- nestedRoute2
|       |
|       +-- generated-1
|       |   |
|       |   +-- index.html
|       |   
|       +-- generated-2
|           |
|           +-- index.html
|
+-- static
```

There are different types of routes that allow different generated files, which are listed below...

#### `SingleRoute`
The route compiles to one html file that is generated from the data provided. This is created with the following code...

```javascript
const route = new SingleRoute({
    render: 'url/to/template/file',
    data: { string: 'hello', number: 123 },
    isFile: true
});
```

Then, this gets passed through the `generate` function and would create this file structure...

```
route/
|
+-- index.html
```

Here are the options for a `SingleRoute`:
- `render`: Either the raw template file or the file path for the template file
- `data`: The data to be rendered
- `isFile`: boolean to determine whether `render` is a path or raw string

#### `GeneratorRoute`
The route takes all the data provided in the options and compiles it into multiple html files. This is created with the following code...

```javascript
const route = new GeneratorRoute({
    render: 'url/to/template/file',
    data: { string: 'hello', number: 123 },
    isFile: true,
    generator: [
        { name: 'generated-1', data: { special: 1 } },
        { name: 'generated-2', data: { special: 2 } },
        { name: 'generated-3', data: { special: 3 } }
    ]
});
```

Then, this gets passed through the `generate` function and would create this file structure...

```
route/
|
+-- generated-1
|   |
|   +-- index.html
|
+-- generated-2
|   |
|   +-- index.html
|
+-- generated-3
    |
    +-- index.html
```

Here are the options for a `Generator`:
- `render`: Either the raw template file or the file path for the template file
- `data`: The common data to be rendered to all files
- `isFile`: boolean to determine whether `render` is a path or raw string
- `generator`: List of files to be generated
  - `name`: Name of the route
  - `data`: Data specific to the generated files

## ExpressJS Support
Not implemented yet!