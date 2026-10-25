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

; URI attributes use their complete native destination. Descriptive values
; retain prose URL boundaries, even when the URL is their first word.
((attribute
  (attribute_name) @_IGNORE_.uri-attribute
  [
    (attribute_value) @injection.content
    (quoted_attribute_value
      (attribute_value) @injection.content)
  ]) @injection.owner
  (#not-match? @_IGNORE_.uri-attribute "^([hH][rR][eE][fF]|[sS][rR][cC]|[aA][cC][tT][iI][oO][nN]|[fF][oO][rR][mM][aA][cC][tT][iI][oO][nN]|[pP][oO][sS][tT][eE][rR]|[cC][iI][tT][eE]|[dD][aA][tT][aA])$")
  (#set! injection.language "hyperlink")
  (#set! injection.language-scope "none"))
((comment) @injection.owner @injection.content
  (#set! injection.language "todo")
  (#set! injection.language-scope "none")
  (#set! injection.include-children))
