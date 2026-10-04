; Named anchors and controls are useful navigation targets; anonymous tags,
; text, links and ordinary attribute values stay out of the symbol list.
(attribute
  (attribute_name) @_attribute
  [(attribute_value) @name
   (quoted_attribute_value (attribute_value) @name)]
  (#match? @_attribute "^([iI][dD]|[nN][aA][mM][eE])$")) @definition.object
