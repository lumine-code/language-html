# language-html

HTML language support.

## Features

- **Grammars**: provides Tree-sitter grammars built from [tree-sitter-embedded-template](https://github.com/tree-sitter/tree-sitter-embedded-template) and [tree-sitter-html](https://github.com/tree-sitter/tree-sitter-html) and TextMate grammars derived from [atom/language-html](https://github.com/atom/language-html).
- **Syntax highlighting**: full grammar coverage for HTML files.
- **Snippets**: shortcuts for common tags and document scaffolding.
- **Code folding**: collapse elements and comments.
- **Comment toggling**: block comment support.

## Installation

To install `language-html` search for it in the Install pane of the Lumine settings, or run the command `lumine --install lumine-code/language-html`.

## Services

- `hyperlink.injection`: consumed to highlight URLs inside markup as clickable links.
- `todo.injection`: consumed to highlight `TODO`-style markers inside comments.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
