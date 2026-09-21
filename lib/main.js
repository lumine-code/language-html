let injectionRegistrations = [];

exports.activate = function () {
  injectionRegistrations.push(
    lumine.grammars.addInjectionPoint("text.html.basic", {
      type: "script_element",
      language() {
        return "javascript";
      },
      content(node) {
        return node.child(1);
      },
    }),
  );

  injectionRegistrations.push(
    lumine.grammars.addInjectionPoint("text.html.basic", {
      type: "style_element",
      language() {
        return "css";
      },
      content(node) {
        return node.child(1);
      },
    }),
  );

  // EMBEDDED

  injectionRegistrations.push(
    lumine.grammars.addInjectionPoint("text.html.ejs", {
      type: "template",
      language() {
        return "javascript";
      },
      content(node) {
        return node.descendantsOfType("code");
      },
      newlinesBetween: true,
    }),
  );

  injectionRegistrations.push(
    lumine.grammars.addInjectionPoint("text.html.ejs", {
      type: "template",
      language() {
        return "html";
      },
      content(node) {
        return node.descendantsOfType("content");
      },
    }),
  );

  injectionRegistrations.push(
    lumine.grammars.addInjectionPoint("text.html.erb", {
      type: "template",
      language() {
        return "ruby";
      },
      content(node) {
        return node.descendantsOfType("code");
      },
      newlinesBetween: true,
    }),
  );

  injectionRegistrations.push(
    lumine.grammars.addInjectionPoint("text.html.erb", {
      type: "template",
      language() {
        return "html";
      },
      content(node) {
        return node.descendantsOfType("content");
      },
    }),
  );
};

exports.consumeHyperlinkInjection = (hyperlink) => {
  // TODO: Inject hyperlink grammar into plain text?
  return hyperlink.addInjectionPoint("text.html.basic", {
    types: ["comment", "attribute_value"],
  });
};

exports.consumeTodoInjection = (todo) => {
  return todo.addInjectionPoint("text.html.basic", { types: ["comment"] });
};

exports.deactivate = function () {
  for (const registration of injectionRegistrations.splice(0)) registration.dispose();
};
