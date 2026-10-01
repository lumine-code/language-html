((template
  (_ (code) @injection.content)) @injection.owner
  (#set! injection.language "ruby")
  (#set! injection.newlines-between))

((template
  (content) @injection.content) @injection.owner
  (#set! injection.language "html"))
