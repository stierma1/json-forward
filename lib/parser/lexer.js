
var regexTokens = [
  "@",
  /[0-9]+/,
  "true"
]

"@"                   return "@"
[0-9]+                 return "NUMBER"
"true"                return 'TRUE'
"false"               return 'FALSE'
\s+                   return 'WHITESPACE'
[e]                   return "e"
[E]                   return 'E'
"null"                return 'NULL'
":"                   return ":"
"+"                   return "PLUS"
"-"                   return "HYPHON"
"."                   return "DOT"
"\""                  return "D_QUOTE"
"\\"                  return "ESCAPE_CHAR"
"{"                   return "{"
"}"                   return "}"
"["                   return "["
"]"                   return "]"
","                   return ","
.                     return 'OTHER_CHAR'
