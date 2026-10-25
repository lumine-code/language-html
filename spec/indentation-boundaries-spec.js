describe("language-html indentation boundaries", () => {
  let editor;
  beforeEach(async () => {
    await lumine.packages.activatePackage("language-html");
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("text.html.basic"));
    editor.update({ tabLength: 4, softTabs: true });
    await editor.whenGrammarSettled();
  });
  afterEach(() => editor?.destroy());

  it("does not indent after uppercase void tags", async () => {
    for (const source of ["<BR>", '<InPuT type="text">', "<Img>"]) {
      editor.setText(source);
      await editor.whenGrammarSettled();
      editor.setCursorBufferPosition([0, Infinity]);
      editor.insertText("\n", { autoIndent: true, autoIndentNewline: true });
      await editor.whenGrammarSettled();
      expect(editor.lineTextForBufferRow(1)).toBe("");
      expect(editor.getCursorBufferPosition().column).toBe(0);
    }
  });

  it("does not indent after lowercase void tags", async () => {
    editor.setText("<br>");
    await editor.whenGrammarSettled();
    editor.setCursorBufferPosition([0, Infinity]);
    editor.insertText("\n", { autoIndent: true, autoIndentNewline: true });
    await editor.whenGrammarSettled();
    expect(editor.lineTextForBufferRow(1)).toBe(" ".repeat(0));
    expect(editor.getCursorBufferPosition().column).toBe(0);
  });

  it("still indents normal elements", async () => {
    editor.setText("<div>\n</div>");
    await editor.whenGrammarSettled();
    editor.setCursorBufferPosition([0, Infinity]);
    editor.insertText("\n", { autoIndent: true, autoIndentNewline: true });
    await editor.whenGrammarSettled();
    expect(editor.lineTextForBufferRow(1)).toBe(" ".repeat(4));
    expect(editor.getCursorBufferPosition().column).toBe(4);
  });
});
