const path = require("path");

describe("WASM Tree-sitter HTML grammars", () => {
  beforeEach(async () => {
    lumine.config.set("language.useTreeSitterParsers", true);
    await lumine.packages.activatePackage("language-html");
    // EJS injects javascript into its directives; ERB injects ruby, which is not
    // bundled, so its directives stay unhighlighted here. The fixtures assert only
    // the scopes the embedded-template grammars own, so both cases are covered.
    await lumine.packages.activatePackage("language-javascript");
  });

  it("tokenizes HTML tags, attributes and values", async () => {
    await runGrammarTests(path.join(__dirname, "fixtures", "tree-sitter-html.html"), /<!--/, /-->/);
  });

  it("tokenizes EJS directives", async () => {
    await runGrammarTests(path.join(__dirname, "fixtures", "tree-sitter-ejs.ejs"), /<!--/, /-->/);
  });

  it("tokenizes ERB directives", async () => {
    await runGrammarTests(path.join(__dirname, "fixtures", "tree-sitter-erb.erb"), /<!--/, /-->/);
  });
});
