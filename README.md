## STEVE
`STEVE` is a configurable template engine that allows JavaScript to run in files to create files. It has a plugin system to allow for custom generation and a built-in site generation.

***ST***atic Sit***E*** Generator (***VE***ry cool)

### by AP
#### Last Modified 11/12/23

## Features

`STEVE` supports many features including:
- Template engine that uses JavaScript to process the text
- Built-in site generator plugin with highly customizable options
- Plugin support to create different types of generators
- ExpressJS support to use for actual routing and SSR (Not implemented)

## About The Project
I wanted to make a more official repository as my original goal, but I also wanted to create a file generator that I can use and expand upon because I do file generation a lot more than I thought I would. The product of this is `STEVE`, which has a template engine and plugin system.

### Documentation
All the features and explanations are in the documentation markdown file.
[Documentation Link](https://github.com/CodingAP/steve/blob/main/documentation.md)

## How to Run

To install, run:
`npm install steve-template-engine`
   
### Usage

```javascript
import { STEVE } from 'steve-template-engine';

STEVE.render('Hello <steve> return Steve.data.name; </steve>!', { name: 'STEVE' });
```

Output:
```
Hello STEVE!
```

To see more instances of `STEVE` being used, go to the [Documentation](https://github.com/CodingAP/steve/blob/main/documentation.md)