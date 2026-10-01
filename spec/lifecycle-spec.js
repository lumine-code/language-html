const path = require("path");

describe("HTML injection lifecycle", () => {
  it("restores one declarative injection per script after package reactivation", async () => {
    await lumine.packages.activatePackage(
      path.resolve(__dirname, "..", "..", "language-javascript"),
    );

    const openScript = async () => {
      await lumine.packages.activatePackage("language-html");
      const editor = await lumine.workspace.open();
      editor.setGrammar(lumine.grammars.grammarForScopeName("text.html.basic"));
      editor.setText("<script>const value = 1;</script>");
      await editor.languageMode.ready;
      await editor.languageMode.atTransactionEnd();
      const layers = editor.languageMode
        .getAllInjectionLayers()
        .filter((layer) => layer.grammar.scopeName === "source.js");
      expect(layers.length).toBe(1);
      expect(layers[0].tree.rootNode.hasError).toBe(false);
      editor.destroy();
    };

    await openScript();
    await lumine.packages.deactivatePackage("language-html");
    expect(lumine.grammars.grammarForScopeName("text.html.basic")).toBeUndefined();
    await openScript();
  });
});
