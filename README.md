# language-html

HTML language support.

Fork of [pulsar-edit/pulsar](https://github.com/pulsar-edit/pulsar) (`packages/language-html`).

## Features

- **Grammars**: provides Tree-sitter grammars built from [tree-sitter-embedded-template](https://github.com/tree-sitter/tree-sitter-embedded-template) and [tree-sitter-html](https://github.com/tree-sitter/tree-sitter-html).
- **Syntax highlighting**: full grammar coverage for HTML files.
- **Snippets**: shortcuts for common tags and document scaffolding.
- **Code folding**: collapse elements and comments.
- **Document symbols**: navigate named `id` and `name` targets in HTML, including the HTML portions of EJS and ERB files.
- **Comment toggling**: block comment support.

## Installation

To install `language-html` search for it in the Install pane of the Lumine settings, or run the command `lumine --install lumine-code/language-html`.

## Injections

- Static Tree-sitter injections highlight URLs with `language-hyperlink`.
- Static Tree-sitter injections highlight comment markers with `language-todo`.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
