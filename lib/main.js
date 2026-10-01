exports.consumeHyperlinkInjection = (hyperlink) => {
  // TODO: Inject hyperlink grammar into plain text?
  return hyperlink.addInjectionPoint("text.html.basic", {
    types: ["comment", "attribute_value"],
  });
};

exports.consumeTodoInjection = (todo) => {
  return todo.addInjectionPoint("text.html.basic", { types: ["comment"] });
};
