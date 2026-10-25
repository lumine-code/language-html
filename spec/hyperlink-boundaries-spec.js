const { Range } = require("lumine");

describe("HTML destination boundaries", () => {
  let editor;

  beforeEach(async () => {
    await lumine.packages.activatePackage("language-hyperlink");
    await lumine.packages.activatePackage("language-html");
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("text.html.basic"));
  });

  afterEach(() => editor.destroy());

  for (const source of [
    "https://example.com/?last=&amp;",
    "https://example.com/my manual.pdf",
    "https://example.com/manual_(draft).pdf?q=*",
    "mailto:hello@example.com",
  ]) {
    it(`keeps the complete explicit destination ${source}`, async () => {
      const text = `<a href="${source}" title="Manual">Label</a>`;
      editor.setText(text);
      await editor.whenGrammarSettled();
      const range = new Range([0, 9], [0, 9 + source.length]);
      for (const column of [range.start.column, range.start.column + 10, range.end.column - 1])
        expect(editor.bufferRangeForScopeAtPosition(".markup.underline.link", [0, column])).toEqual(
          range,
        );
      expect(
        editor.bufferRangeForScopeAtPosition(".markup.underline.link", [0, 8]),
      ).toBeUndefined();
      expect(
        editor.bufferRangeForScopeAtPosition(".markup.underline.link", range.end),
      ).toBeUndefined();
    });
  }

  it("keeps ordinary attribute prose and comments on the prose URL rules", async () => {
    const source = "https://example.com/manual.pdf";
    editor.setText(`<div data-note="\\href{${source}}{Manual}"></div><!-- ${source}. -->`);
    await editor.whenGrammarSettled();
    expect(editor.bufferRangeForScopeAtPosition(".markup.underline.link", [0, 25])).toEqual(
      new Range([0, 22], [0, 22 + source.length]),
    );
    const text = editor.getText();
    const start = text.lastIndexOf(source);
    expect(editor.bufferRangeForScopeAtPosition(".markup.underline.link", [0, start])).toEqual(
      new Range([0, start], [0, start + source.length]),
    );
  });

  it("keeps descriptive attributes on prose boundaries when their text starts with a URL", async () => {
    const source = "https://example.com/manual.pdf";
    for (const name of ["title", "aria-label", "data-note"]) {
      const text = `<div ${name}="${source} is the manual."></div>`;
      editor.setText(text);
      await editor.whenGrammarSettled();
      const start = text.indexOf(source);
      const range = new Range([0, start], [0, start + source.length]);
      expect(editor.bufferRangeForScopeAtPosition(".markup.underline.link", range.start))
        .withContext(name)
        .toEqual(range);
      expect(editor.bufferRangeForScopeAtPosition(".markup.underline.link", range.end))
        .withContext(name)
        .toBeUndefined();
    }
  });

  it("keeps quoted and unquoted destinations in every URI attribute", async () => {
    const source = "https://example.com/manual.pdf.";
    for (const name of ["href", "src", "action", "formaction", "poster", "cite", "data"]) {
      for (const quote of ['"', "'", ""]) {
        const text = `<a ${name}=${quote}${source}${quote}>Label</a>`;
        editor.setText(text);
        await editor.whenGrammarSettled();
        const start = text.indexOf(source);
        const range = new Range([0, start], [0, start + source.length]);
        for (let column = start; column < range.end.column; column++) {
          expect(editor.bufferRangeForScopeAtPosition(".markup.underline.link.html", [0, column]))
            .withContext(`${name} with ${JSON.stringify(quote)}`)
            .toEqual(range);
        }
        expect(editor.bufferRangeForScopeAtPosition(".markup.underline.link", [0, start - 1]))
          .withContext(name)
          .toBeUndefined();
        expect(editor.bufferRangeForScopeAtPosition(".markup.underline.link", range.end))
          .withContext(name)
          .toBeUndefined();
      }
    }
  });

  it("matches URI attribute names and schemes without regard to letter case", async () => {
    for (const [name, source] of [
      ["hReF", "hTtPs://example.com/manual.pdf?q=*"],
      ["SRC", "HTTP://example.com/manual.pdf."],
      ["HrEf", "MaIlTo:reader@example.com"],
    ]) {
      const text = `<a ${name}="${source}">Label</a>`;
      editor.setText(text);
      await editor.whenGrammarSettled();
      const start = text.indexOf(source);
      expect(editor.bufferRangeForScopeAtPosition(".markup.underline.link.html", [0, start]))
        .withContext(name)
        .toEqual(new Range([0, start], [0, start + source.length]));
    }
  });

  it("does not annotate a nested URL inside a different URI destination", async () => {
    const nested = "https://example.com/manual.pdf";
    for (const source of [`javascript:open('${nested}')`, `/redirect?next=${nested}`]) {
      const text = `<a href="${source}">Label</a>`;
      editor.setText(text);
      await editor.whenGrammarSettled();
      for (let column = 0; column < text.length; column++) {
        expect(editor.bufferRangeForScopeAtPosition(".markup.underline.link", [0, column]))
          .withContext(source)
          .toBeUndefined();
      }
    }
  });
});
