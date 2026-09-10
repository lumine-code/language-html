const fs = require("fs");
const path = require("path");
const { Point } = require("lumine");

const HIGHLIGHTS_PATH = path.join(__dirname, "..", "grammars", "html-highlights.scm");

describe("WASM Tree-sitter HTML grammars", () => {
  beforeEach(async () => {
    await lumine.packages.activatePackage("language-html");
    // EJS injects javascript into its directives; ERB injects ruby, which is not
    // bundled, so its directives stay unhighlighted here. The fixtures assert only
    // the scopes the embedded-template grammars own, so both cases are covered.
    await lumine.packages.activatePackage("language-javascript");
  });

  it("tokenizes HTML tags, attributes and values", async () => {
    await runGrammarTests(path.join(__dirname, "fixtures", "tree-sitter-html.html"), /<!--/, /-->/);
  });

  it("distinguishes both delimiters of empty quoted attributes", async () => {
    const editor = await lumine.workspace.open("empty-attributes.html");
    const text = `<input first="" second=''>`;
    editor.setText(text);
    await editor.languageMode.ready;

    const scopesAt = (needle, occurrence) => {
      let index = -1;
      for (let count = 0; count <= occurrence; count++) index = text.indexOf(needle, index + 1);
      return editor
        .scopeDescriptorForBufferPosition(editor.getBuffer().positionForCharacterIndex(index))
        .getScopesArray();
    };

    for (const [quote, opening, closing] of [
      ['"', 0, 1],
      ["'", 0, 1],
    ]) {
      expect(scopesAt(quote, opening)).toContain("punctuation.definition.string.begin.html");
      expect(scopesAt(quote, opening)).not.toContain("punctuation.definition.string.end.html");
      expect(scopesAt(quote, closing)).toContain("punctuation.definition.string.end.html");
      expect(scopesAt(quote, closing)).not.toContain("punctuation.definition.string.begin.html");
    }
  });

  it("preserves structural, block, inline, custom, and delimiter tag scopes", async () => {
    const editor = await lumine.workspace.open("tag-scopes.html");
    const text = [
      "<html>",
      "<div>",
      "<span>",
      "<custom data-double=\"value\" data-single='other' data-plain=plain />",
      "</span>",
      "</div>",
      "</html>",
    ].join("\r\n");
    editor.setText(text);
    await editor.languageMode.ready;

    const scopesAt = (needle, offset = 0, occurrence = 0) => {
      let index = -1;
      for (let count = 0; count <= occurrence; count++) index = text.indexOf(needle, index + 1);
      return editor
        .scopeDescriptorForBufferPosition(
          editor.getBuffer().positionForCharacterIndex(index + offset),
        )
        .getScopesArray();
    };

    for (const occurrence of [0, 1]) {
      expect(scopesAt("html", 0, occurrence)).toContain("entity.name.tag.structure.html.html");
      expect(scopesAt("div", 0, occurrence)).toContain("entity.name.tag.block.div.html");
      expect(scopesAt("span", 0, occurrence)).toContain("entity.name.tag.inline.span.html");
    }
    expect(scopesAt("custom")).toContain("entity.name.tag.html");
    expect(scopesAt("<custom")).toContain("punctuation.definition.tag.begin.html");
    expect(scopesAt("/>", 1)).toContain("punctuation.definition.tag.end.html");
    expect(scopesAt("</span>")).toContain("punctuation.definition.tag.begin.html");
    expect(scopesAt("</span>", "</span>".length - 1)).toContain(
      "punctuation.definition.tag.end.html",
    );
    expect(scopesAt("data-double")).toContain("entity.other.attribute-name.html");
    expect(scopesAt('"value"', 1)).toContain("string.quoted.double.html");
    expect(scopesAt("'other'", 1)).toContain("string.quoted.single.html");
    expect(scopesAt("plain", 0, 1)).toContain("string.unquoted.html");
  });

  it("keeps a six-row tile local inside a 6000-attribute start tag", async () => {
    const editor = await lumine.workspace.open("large-start-tag.html");
    const lines = [
      "<root",
      ...Array.from({ length: 6000 }, (_, index) => `  key_${index}="value_${index}"`),
      ">body</root>",
    ];
    editor.setText(lines.join("\r\n"));
    const languageMode = editor.getBuffer().languageMode;
    await languageMode.ready;
    expect(languageMode.tree.rootNode.hasError).toBe(false);

    const startRow = 2998;
    const endRow = startRow + 6;
    const layer = languageMode.rootLanguageLayer;
    const captures = layer.queries.highlightsQuery.captures(layer.tree.rootNode, {
      startPosition: new Point(startRow, 0),
      endPosition: new Point(endRow, 0),
    });

    expect(captures.length).toBeLessThanOrEqual(60);
    expect(
      captures.every(
        ({ node }) => node.startPosition.row >= startRow && node.startPosition.row < endRow,
      ),
    ).toBe(true);
  });

  it("keeps unbounded tag contexts leaf-rooted", () => {
    const query = fs.readFileSync(HIGHLIGHTS_PATH, "utf8");
    expect(query).not.toMatch(/^\((?:start_tag|end_tag|self_closing_tag)\b/m);
    expect(query).toContain('(#is? test.childOfType "start_tag end_tag")');
    expect(query).toContain('(#is? test.childOfType "start_tag end_tag self_closing_tag")');
  });

  it("tokenizes EJS directives", async () => {
    await runGrammarTests(path.join(__dirname, "fixtures", "tree-sitter-ejs.ejs"), /<!--/, /-->/);
  });

  it("tokenizes ERB directives", async () => {
    await runGrammarTests(path.join(__dirname, "fixtures", "tree-sitter-erb.erb"), /<!--/, /-->/);
  });
});
