const path = require("node:path");

describe("language-html conservative indentation", () => {
  let editor;

  beforeEach(async () => {
    const pack = await lumine.packages.activatePackage(path.resolve(__dirname, ".."));
    for (const grammar of pack.grammars) {
      if (grammar.queryPaths?.indentsQuery) await grammar.getQuery("indentsQuery");
    }
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("text.html.basic"));
    editor.update({ tabLength: 2, softTabs: true });
  });

  afterEach(() => editor?.destroy());

  async function setText(source) {
    editor.setText(source);
    expect(await editor.whenGrammarSettled()).toBe(true);
  }

  async function enter(source, expected, row = 0) {
    await setText(source);
    editor.setCursorBufferPosition([row, Infinity]);
    editor.insertText("\n", { autoIndent: true, autoIndentNewline: true });
    await editor.whenGrammarSettled();
    expect(editor.lineTextForBufferRow(row + 1))
      .withContext(source)
      .toBe(" ".repeat(expected));
    expect(editor.getCursorBufferPosition().column).withContext(source).toBe(expected);
  }

  it("indents multiline attributes once and aligns the tag delimiter", async () => {
    await setText('<div\nclass="card"\nid="main"\n>\n<span></span>\n</div>');
    await editor.autoIndentBufferRows(0, 5);
    expect(editor.getText()).toBe('<div\n  class="card"\n  id="main"\n>\n  <span></span>\n</div>');
  });

  it("resumes the body after a multiline opening tag without adding to attribute indentation", async () => {
    await enter('<div\n  class="card">', 2, 1);
    await enter('<div\n  class="card"\n>', 2, 2);
  });

  it("keeps void tags and self-closing tags from opening a body", async () => {
    await enter('<input\n  type="text"\n>', 0, 2);
    await enter('<widget\n  name="card"\n/>', 0, 2);
    await enter("<div></div>", 0);
    await enter("<!-- <div> -->", 0);
  });

  it("aligns the final delimiter when typed on its own line", async () => {
    await setText('<div\n  class="card"\n  ');
    editor.setCursorBufferPosition([2, Infinity]);
    editor.insertText(">", { autoIndent: true, autoDecreaseIndent: true });
    await editor.whenGrammarSettled();
    expect(editor.lineTextForBufferRow(2)).toBe(">");
  });

  it("preserves whitespace inside multiline literals and comments when reindenting", async () => {
    const source =
      '<div title="head\n       raw attribute\n raw end">\n<!-- comment\n      aligned\n -->\n</div>';
    await setText(source);
    const before = editor.getText().split("\n");
    await editor.autoIndentBufferRows(0, editor.getLastBufferRow());
    for (const row of [1, 2, 4, 5]) {
      expect(editor.lineTextForBufferRow(row)).withContext(String(row)).toBe(before[row]);
    }
  });
});
