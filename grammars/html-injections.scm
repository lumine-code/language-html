((script_element
  (raw_text) @injection.content) @injection.owner
  (#set! injection.language "javascript"))

((style_element
  (raw_text) @injection.content) @injection.owner
  (#set! injection.language "css"))
