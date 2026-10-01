((script_element
  (raw_text) @injection.content) @injection.owner
  (#set! injection.language "javascript"))

((style_element
  (raw_text) @injection.content) @injection.owner
  (#set! injection.language "css"))

((comment) @injection.owner @injection.content
  (#set! injection.language "hyperlink")
  (#set! injection.language-scope "none")
  (#set! injection.include-children))

((attribute_value) @injection.owner @injection.content
  (#set! injection.language "hyperlink")
  (#set! injection.language-scope "none"))
((comment) @injection.owner @injection.content
  (#set! injection.language "todo")
  (#set! injection.language-scope "none")
  (#set! injection.include-children))
