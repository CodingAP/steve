### Design Doc

# STEVE

***ST*** atic Sit ***E*** Generator (***VE*** ry cool)

These are the features that I want STEVE to have:
- Automatic file finding
  - Makes any file/folder accessible to the end-user without needing to point to anything
  - Any folder with a . at the start (ex: .templates) will not be turned into a page
- Templates
  - Takes templates created by the user and replaces the variables and content where needed
  - This is done recursively to create many different files (example: one template can be for header/footer, one for project files, etc.)
- Generators
  - Generates using single file and multiple files
    - Single file: Generate many templates to be used in one file
    - Multiple files: Generate many files and pages (such as blog posts)
- Markdown to HTML Converter
  - Converts a md file to a html file so that formatting is easier (useful for project pages or blogs)
- Variables
  - Allows templates/generators to actual be useful
  - They are set in the header
  - Format: %steve.(variable_name)%
    - Some built in variables
      - content: The content is set to the text after the header
      - start: part of the header
      - end: part of the header
      - link: holds the function for the link generator
- Header
  - Where all the data is stored
  - Format: %steve.start% - %steve.end%

Normal Operation
- Create a folder and put other directories that have files needed to generator site
- .templates
  - Holds all the templates for the html files to use
- .generators
  - Holds all the generator files that the user creates to generate
- .generated
  - Holds the generated site after all the work is done