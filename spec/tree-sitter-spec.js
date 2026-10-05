const fs = require("fs");
const path = require("path");
const { Point } = require("lumine");

const HIGHLIGHTS_PATH = path.join(__dirname, "..", "grammars", "html-highlights.scm");
const SYMBOL_FIXTURES = require("./fixtures/symbols.json");
const specPackagePath = (name) => {
  const sibling = path.resolve(__dirname, "..", "..", name);
  return fs.existsSync(path.join(sibling, "package.json")) ? sibling : name;
};

describe("WASM Tree-sitter HTML grammars", () => {
  beforeEach(async () => {
    await lumine.packages.activatePackage("language-html");
    // EJS injects javascript into its directives; ERB injects ruby, which is not
    // bundled, so its directives stay unhighlighted here. The fixtures assert only
    // the scopes the embedded-template grammars own, so both cases are covered.
    await lumine.packages.activatePackage(
      path.resolve(__dirname, "..", "..", "language-javascript"),
    );
  });

  it("tokenizes HTML tags, attributes and values", async () => {
    await runGrammarTests(path.join(__dirname, "fixtures", "tree-sitter-html.html"), /<!--/, /-->/);
  });

  for (const [scopeName, fixture] of Object.entries(SYMBOL_FIXTURES)) {
    it(`navigates useful named HTML targets in ${scopeName}`, async () => {
      await lumine.packages.activatePackage(specPackagePath("language-ruby"));
      const symbolPackage = await lumine.packages.activatePackage(
        specPackagePath("symbol-tree-sitter"),
      );
      const provider = symbolPackage.mainModule.provideDocumentSymbolProvider();
      const editor = await lumine.workspace.open();
      editor.setGrammar(lumine.grammars.grammarForScopeName(scopeName));
      editor.setText(fixture.text);
      await editor.whenGrammarSettled();
      expect(
        (
          await provider.getDocumentSymbolSources(editor, { signal: new AbortController().signal })
        )[0].score,
      ).toBe(0.999);
      const symbols = await provider.getDocumentSymbols(editor, {
        sourceId: "symbol-tree-sitter",
        signal: new AbortController().signal,
      });
      const namesAndTags = symbols.map(({ name, tag }) => ({ name, tag }));
      if (fixture.only) expect(namesAndTags).toEqual(fixture.symbols);
      for (const expected of fixture.symbols) expect(namesAndTags).toContain(expected);
      for (const absent of fixture.absent || [])
        expect(symbols.map(({ name }) => name)).not.toContain(absent);
      for (const symbol of symbols) {
        expect(symbol.range.containsPoint(symbol.position)).toBe(true);
        expect(editor.getTextInBufferRange(symbol.range)).toContain(symbol.name);
      }
    });
  }

  it("injects separate script and style bodies without including their tags", async () => {
    await lumine.packages.activatePackage(path.resolve(__dirname, "..", "..", "language-css"));
    const editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("text.html.basic"));
    const text =
      "<script>const first = 1;</script><script>const second = 2;</script><style>.card { color: red; }</style><script></script><style></style>";
    editor.setText(text);
    await editor.languageMode.ready;
    await editor.languageMode.atTransactionEnd();
    const layers = editor.languageMode.getAllInjectionLayers();
    expect(layers.filter((layer) => layer.grammar.scopeName === "source.js").length).toBe(2);
    expect(layers.filter((layer) => layer.grammar.scopeName === "source.css").length).toBe(1);
    for (const [needle, scope] of [
      ["first", "source.js"],
      [".card", "source.css"],
    ]) {
      const point = editor.getBuffer().positionForCharacterIndex(text.indexOf(needle));
      expect(editor.scopeDescriptorForBufferPosition(point).getScopesArray()).toContain(scope);
    }
    expect(editor.scopeDescriptorForBufferPosition([0, 2]).getScopesArray()).not.toContain(
      "source.js",
    );
  });

  it("parses code split across EJS directives as one JavaScript document", async () => {
    const editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("text.html.ejs"));
    editor.setText("<% if (ready) { %>\n<p>content</p>\n<% } %>");
    await editor.languageMode.ready;
    await editor.languageMode.atTransactionEnd();
    const layers = editor.languageMode
      .getAllInjectionLayers()
      .filter((layer) => layer.grammar.scopeName === "source.js");
    expect(layers.length).toBe(1);
    expect(layers[0].tree.rootNode.hasError).toBe(false);
    expect(editor.scopeDescriptorForBufferPosition([1, 1]).getScopesArray()).toContain(
      "entity.name.tag.block.p.html",
    );
    expect(editor.scopeDescriptorForBufferPosition([1, 1]).getScopesArray()).not.toContain(
      "source.js",
    );
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
