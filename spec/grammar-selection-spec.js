const fs = require("fs");
const path = require("path");

describe("HTML grammar selection", () => {
  let grammar;

  beforeEach(async () => {
    const pkg = await lumine.packages.activatePackage("language-html");
    expect(fs.realpathSync(pkg.path)).toBe(path.resolve(__dirname, ".."));
    grammar = lumine.grammars.grammarForScopeName("text.html.basic");
  });

  it("recognizes documents and Emacs modelines in extensionless files", () => {
    for (const text of [
      "<html>",
      "<!DOCTYPE html>",
      "<!-- -*- html -*- -->",
      "<!-- -*- html; coding: utf-8 -*- -->",
      "<!-- -*- mode: html; coding: utf-8 -*- -->",
      "<!-- -*- coding: utf-8; mode: html; tab-width: 2 -*- -->",
    ]) {
      expect(lumine.grammars.selectGrammar("modeline", text).scopeName).toBe("text.html.basic");
    }
  });

  it("recognizes vi, Vim, and ex options without ambiguous empty tokens", () => {
    for (const text of [
      "vim: set ft=html:",
      "vi:ft=xhtml",
      "vim700:syntax=html",
      "vim>700: set syntax=html:",
      " ex: set filetype=html:",
      "vim: noexpandtab tabstop=2 ft=html:",
      "vim: foo=one\\ two ft=html:",
    ]) {
      expect(lumine.grammars.selectGrammar("modeline", text).scopeName).toBe("text.html.basic");
    }
    for (const text of ["vim: set ft=python:", "-*- mode: htmlish -*-"]) {
      expect(grammar.firstLineRegex.test(text)).toBe(false);
    }
  });

  it("does not repartition colons or whitespace after an invalid Vim prefix", () => {
    const source = grammar.firstLineRegex.source;
    expect(source).not.toContain("\\w*");
    // Stop before executing the large reproducer if an ambiguous empty-token
    // pattern has been restored, so the regression fails without hanging CI.
    if (source.includes("\\w*")) return;

    for (const text of ["vim:" + " : ".repeat(10000) + "x", "vim:" + " ".repeat(10000) + "x"]) {
      expect(grammar.firstLineRegex.test(text)).toBe(false);
      expect(lumine.grammars.selectGrammar("modeline", text).scopeName).not.toBe("text.html.basic");
    }
  });
});
