const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

class Steve {
    // Process the file to check for header, and return the options that the header represents
    static processHeader(file) {
        // Create options to store info in later
        let options = {};

        // Split file into lines for easier processing (uses unix line breaks)
        let lines = file.replace(/[\r]/g, '').split('\n');
        let start = -1, end = -1;

        // Goes through line by line to look for steve headers
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('%steve')) {
                let variable = lines[i].replace(/[%]/g, '').split('.')[1];
                if (variable == 'start') start = i + 1;
                else if (variable == 'end') end = i;
            }
        }

        // For removing the header after using it
        options.end = end;

        // Goes through line by line tokenizing and parsing what the header says
        let headerLines = lines.slice(start, end);
        headerLines.forEach(element => {
            let tokens = element.split('=');
            options[tokens[0]] = tokens[1];
        });

        return options;
    }

    // Parses the file and replace the variables with the correct content
    static parseFile(file, header, templates) {
        // Parse the template tree
        let templateStack = [];
        let root = templates[header.template];
        templateStack.unshift(root.file);
        while (root.parent != '') {
            root = templates[root.parent];
            templateStack.unshift(root.file);
        }

        // create the template
        let result = templateStack[0];
        for (let i = 1; i < templateStack.length; i++) {
            result = result.split('%steve.content%').join(templateStack[i]);
        }

        // replace the variables
        Object.entries(header).forEach(([key, value]) => {
            result = result.split(`%steve.${key}%`).join(value);
        });
        result = result.split('%steve.content%').join(file);

        return result;
    }

    // Generates file based on settings
    static generateFiles(folderPath, options, templates) {
        if (options.gentype == 'singlefile') {
            // Read from source directory
            let files = fs.readdirSync(folderPath + options.path_from);
            let content = '';
            files.forEach(element => {
                let file = fs.readFileSync(folderPath + options.path_from + '/' + element).toString().replace(/[\r]/g, '');

                // Process header variables
                let header = Steve.processHeader(file);
                header.template = options.gen_template;
                let partFinal = Steve.parseFile('', header, templates);
                content += partFinal;
            });

            let final = Steve.parseFile(content, options, templates);
            let newPath = folderPath + '/.generated' + options.path_to;
            let dirname = path.dirname(newPath);

            if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });
            fs.writeFileSync(newPath, final);
        } else if (options.gentype == 'multifile') { // Multifile generation
            // Read from source directory
            let files = fs.readdirSync(folderPath + options.path_from);
            files.forEach(element => {
                let file = fs.readFileSync(folderPath + options.path_from + '/' + element).toString().replace(/[\r]/g, '');

                // Process header variables
                let header = Steve.processHeader(file);
                file = file.split('\n').slice(header.end + 1).join('\n');
                header.template = options.template;
                if (options.filetype == 'md') file = marked.parse(file); // Markdown or HTML parsing

                let final = Steve.parseFile(file, header, templates);

                // Create new directory based on file name and link setting
                let newPath = folderPath + '/.generated' + options.path_to + '/';
                let linkFormatting = element.split('.')[0].split('-');
                options.link.split('-').forEach((formattingElement, index) => {
                    if (formattingElement == 'dir') newPath += linkFormatting[index] + '/';
                    else if (formattingElement == 'name') newPath += linkFormatting[index] + '.html';
                });
                let dirname = path.dirname(newPath);

                // Write content to that file
                if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });
                fs.writeFileSync(newPath, final);
            });
        }
    }

    static compile(folderPath) {
        // read current directory for testing
        let directories = fs.readdirSync(folderPath, { withFileTypes: true });

        // recursive directory search
        let searchDirectory = dir => {
            let files = [];

            // Read directories
            let subdir = fs.readdirSync(folderPath + '/' + dir, { withFileTypes: true });

            // If it is empty, add the directory name to stack with / prefixing it
            if (subdir.length == 0) files.push('/' + dir);

            // Go through and recursively open directories and adding their name and extension to the files
            subdir.forEach(element => {
                if (element.isDirectory()) dir.push(...searchDirectory(element.name));
                else files.push(dir + '/' + element.name);
            });
            return files;
        }

        // Find all files in directory and sort them between normal and STEVE files
        let steveDirectories = [], otherFiles = [];
        directories.forEach(element => {
            if (element.isDirectory() && element.name[0] == '.') steveDirectories.push(element.name);
            else {
                if (element.isDirectory()) otherFiles.push(...searchDirectory(element.name));
                else otherFiles.push(element.name);
            }
        });

        // Load all templates
        let templates = {};
        if (steveDirectories.includes('.templates')) {
            let templateDirectory = fs.readdirSync(folderPath + '/.templates');

            templateDirectory.forEach(element => {
                let file = fs.readFileSync(folderPath + '/.templates/' + element).toString().replace(/[\r]/g, '');

                let header = Steve.processHeader(file);
                file = file.split('\n').slice(header.end + 1).join('\n');

                templates[element.split('.')[0]] = { file, parent: header.template || '' };
            });
        }

        // delete old .generated folder
        if (fs.existsSync(folderPath + '/.generated')) fs.rmSync(folderPath + '/.generated', { recursive: true, force: true });
        fs.mkdirSync(folderPath + '/.generated');

        // Generate needed files
        if (steveDirectories.includes('.generators')) {
            let generatorDirectory = fs.readdirSync(folderPath + '/.generators');

            generatorDirectory.forEach(element => {
                let file = fs.readFileSync(folderPath + '/.generators/' + element).toString().replace(/[\r]/g, '');

                let header = Steve.processHeader(file);
                
                Steve.generateFiles(folderPath, header, templates);
            });
        }

        // create files
        otherFiles.forEach(element => {
            if (element[0] == '/') {
                // create empty directory
                fs.mkdirSync(folderPath + '/.generated' + element);
            } else {
                // create directory if has not been created
                let file = fs.readFileSync(folderPath + '/' + element).toString();
                let newPath = folderPath + '/.generated/' + element;
                let dirname = path.dirname(newPath);

                if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });

                // process header for templates/variables
                let header = Steve.processHeader(file);
                file = file.split('\n').slice(header.end + 1).join('\n');

                // replace all the variables
                let final = Steve.parseFile(file, header, templates);

                // write to .generated
                fs.writeFileSync(folderPath + '/.generated/' + element, final);
            }
        });
    }
}

module.exports = Steve;