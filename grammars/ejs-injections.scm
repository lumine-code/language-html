; Keep all directives in one JavaScript document, separated by their newlines.
((template
  (_ (code) @injection.content)) @injection.owner
  (#set! injection.language "javascript")
  (#set! injection.newlines-between))

((template
  (content) @injection.content) @injection.owner
  (#set! injection.language "html"))
