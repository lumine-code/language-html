// Runs Sublime-style syntax test fixtures against a TextMate grammar.
//
// A fixture opens with a header naming the grammar to load:
//
//     <!-- SYNTAX TEST "text.html.basic" -->
//
// and then interleaves ordinary content with assertion lines. An assertion is a
// comment holding a position marker and the scopes expected there, and it
// applies to the *preceding* content line:
//
//     <script><!--
//     <!-- ^ entity.name.tag.script.html -->
//     <div>
//     <!-- <- punctuation.definition.tag.html -->
//
// `^` asserts at the column the caret itself sits in; `<-` asserts at the column
// the comment opener sits in. Columns are 1-based, matching the token ranges
// built below. A scope matches when it agrees segment by segment as far as the
// shorter of the two runs, so `source.js` is satisfied by `source.js.embedded`.
//
// Replaces the archived atom-grammar-test, which implemented the same format
// through a chevrotain grammar. Only the two position markers these fixtures use
// are supported; anything else fails loudly rather than being skipped.

const fs = require("fs");

const HEADER_REGEX = /^(\S+?)\s+SYNTAX TEST\s+(['"])(.+?)\2\s*(\S*)$/i;

function parseHeader(line, filePath) {
  const match = HEADER_REGEX.exec(line);
  if (!match) {
    throw new Error(`${filePath} is not a syntax test: ${line}`);
  }
  const [, openToken, , scopeName, closeToken] = match;
  return { openToken, scopeName, closeToken };
}

// Returns null when the line is ordinary content rather than an assertion.
function parseAssertion(line, openToken, closeToken) {
  const openIndex = line.indexOf(openToken);
  if (openIndex === -1) return null;

  let body = line.slice(openIndex + openToken.length);
  if (closeToken && body.endsWith(closeToken)) {
    body = body.slice(0, -closeToken.length);
  }

  const caret = /^(\s*)(\^+)\s+(\S.*?)\s*$/.exec(body);
  if (caret) {
    const [, leading, carets, scopes] = caret;
    // The caret's own column, 1-based. A run of carets asserts each column it
    // covers, which is how the format reads even though these fixtures use one.
    const firstColumn = openIndex + openToken.length + leading.length + 1;
    return {
      columns: carets.split("").map((_, i) => firstColumn + i),
      scopes: scopes.split(/\s+/),
    };
  }

  const beginning = /^\s*<-\s+(\S.*?)\s*$/.exec(body);
  if (beginning) {
    // `<-` asserts at the comment opener's own column, 1-based.
    return { columns: [openIndex + 1], scopes: beginning[1].split(/\s+/) };
  }

  // A comment that is not an assertion at all -- ordinary markup.
  if (/^\s*(<<|>>|only:|not:|[=!])/.test(body)) {
    throw new Error(`Unsupported syntax-test assertion: ${line.trim()}`);
  }
  return null;
}

// A scope matches when every segment agrees as far as the shorter run reaches.
function scopeMatches(actual, expected) {
  const a = actual.split(".");
  const b = expected.split(".");
  const shared = Math.min(a.length, b.length);
  for (let i = 0; i < shared; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Tokens carry 1-based half-open column ranges. Column 0 addresses the scopes
// the line started in and -1 those it ended in, so an assertion can target a
// boundary where no token exists.
function segmentTokens(tokens, startScopes, endScopes) {
  const segments = [{ matches: (column) => column === 0, scopes: startScopes }];
  let column = 1;
  for (const token of tokens) {
    const start = column;
    column += token.value.length;
    const end = column;
    segments.push({
      matches: (c) => start <= c && c < end,
      scopes: token.scopes,
    });
  }
  segments.push({ matches: (c) => c === -1, scopes: endScopes });
  return segments;
}

function ruleStackScopes(ruleStack) {
  return ruleStack.map((rule) => rule.scopeName).filter(Boolean);
}

module.exports = function runSyntaxTest(filePath) {
  const contents = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const [headerLine, ...rest] = contents;
  const { openToken, scopeName, closeToken } = parseHeader(headerLine, filePath);

  // Group assertions onto the content line each one describes.
  const contentLines = [];
  rest.forEach((line, index) => {
    const assertion = parseAssertion(line, openToken, closeToken);
    if (assertion) {
      if (contentLines.length === 0) {
        throw new Error(`${filePath}: assertion before any content: ${line.trim()}`);
      }
      const target = contentLines[contentLines.length - 1];
      for (const column of assertion.columns) {
        target.assertions.push({ column, scopes: assertion.scopes });
      }
    } else {
      contentLines.push({ line, lineNumber: index + 2, assertions: [] });
    }
  });

  describe(`syntax test ${filePath.split(/[\\/]/).pop()}`, function () {
    let grammar = null;

    beforeEach(function () {
      grammar ??= atom.grammars.grammarForScopeName(scopeName);
      expect(grammar).toBeTruthy();
    });

    for (const [index, contentLine] of contentLines.entries()) {
      if (contentLine.assertions.length === 0) continue;

      it(`tokenizes line ${contentLine.lineNumber}: ${contentLine.line.trim()}`, function () {
        // Tokenization is stateful, so replay from the top of the fixture to
        // reach this line with the rule stack it would really have.
        let startRuleStack = null;
        let endRuleStack = null;
        let tokens = [];

        for (let i = 0; i <= index; i++) {
          startRuleStack = endRuleStack;
          const result = grammar.tokenizeLine(
            contentLines[i].line,
            endRuleStack,
            endRuleStack === null,
          );
          tokens = result.tokens;
          endRuleStack = result.ruleStack;
        }

        const segments = segmentTokens(
          tokens,
          ruleStackScopes(startRuleStack ?? [{ scopeName }]),
          ruleStackScopes(endRuleStack),
        );

        for (const assertion of contentLine.assertions) {
          const segment = segments.find((s) => s.matches(assertion.column));
          expect(segment)
            .withContext(
              `no token at column ${assertion.column} of line ${contentLine.lineNumber}`,
            )
            .toBeTruthy();

          for (const expected of assertion.scopes) {
            const found = segment.scopes.some((actual) => scopeMatches(actual, expected));
            expect(found)
              .withContext(
                `expected ${expected} at ${contentLine.lineNumber}:${assertion.column}, ` +
                  `found ${segment.scopes.join(", ")}`,
              )
              .toBe(true);
          }
        }
      });
    }
  });
};
