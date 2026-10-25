
((start_tag) @indent
  ; Only indent if this isn't a self-closing tag.
  (#not-match? @indent "^<(?:[aA][rR][eE][aA]|[bB][aA][sS][eE]|[bB][rR]|[cC][oO][lL]|[eE][mM][bB][eE][dD]|[hH][rR]|[iI][mM][gG]|[iI][nN][pP][uU][tT]|[kK][eE][yY][gG][eE][nN]|[lL][iI][nN][kK]|[mM][eE][tT][aA]|[pP][aA][rR][aA][mM]|[sS][oO][uU][rR][cC][eE]|[tT][rR][aA][cC][kK]|[wW][bB][rR])(?=\\s|>)"))

; `end_tag` will still match when only `</div` is present. Without enforcing
; the presence of `>`, the dedent happens too soon.
((end_tag) @dedent
  (#match? @dedent ">$"))
