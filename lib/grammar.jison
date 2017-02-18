
/* description: Parses and executes mathematical expressions. */

/* lexical grammar */
%lex
%%

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
<<EOF>>               return 'EOF'


/lex

/* operator associations and precedence */

%start expressions

%% /* language grammar */

expressions
    : value optionalWhiteSpace EOF
        { return $1; }
    ;

optionalWhiteSpace
    : /**/ -> ""
    | optionalWhiteSpace WHITESPACE -> $1 + $2
    ;

tokensNoEscapeOrQuote
    : "@"
    | DOT
    | "}"
    | "{"
    | ":"
    | "["
    | "]"
    | ","
    | NULL
    | "e"
    | "E"
    | HYPHON
    | PLUS
    | boolean
    ;

decimal
    : NUMBER frac -> $1 + $2
    ;

frac
    : DOT NUMBER -> $1 + $2
    ;

intOrDecimal
    : HYPHON NUMBER -> $1 + $2
    | NUMBER
    | HYPHON decimal -> $1 + $2
    | decimal
    ;

scientific
    : intOrDecimal "e" NUMBER -> $1 + $2 + $3
    | intOrDecimal "e" HYPHON NUMBER -> $1 + $2 + $3 + $4
    | intOrDecimal "e" PLUS NUMBER -> $1 + $2 + $3 + $4
    | intOrDecimal "E" NUMBER -> $1 + $2 + $3
    | intOrDecimal "E" HYPHON NUMBER -> $1 + $2 + $3 + $4
    | intOrDecimal "E" PLUS NUMBER -> $1 + $2 + $3 + $4
    ;

number
    : intOrDecimal
    | scientific
    ;

boolean
    : TRUE
    | FALSE
    ;

escapedChar
    : ESCAPE_CHAR tokensNoEscapeOrQuote -> $1 + $2
    | ESCAPE_CHAR OTHER_CHAR -> $1 + $2
    | ESCAPE_CHAR ESCAPE_CHAR -> $1 + $2
    | ESCAPE_CHAR D_QUOTE -> $1 + $2
    | ESCAPE_CHAR NUMBER -> $1 + $2
    | ESCAPE_CHAR WHITESPACE -> $1 + $2
    ;

escapeStringContent
    : escapedChar
    | tokensNoEscapeOrQuote
    | WHITESPACE
    | NUMBER
    | OTHER_CHAR
    | escapeStringContent escapedChar -> $1 + $2
    | escapeStringContent tokensNoEscapeOrQuote -> $1 + $2
    | escapeStringContent WHITESPACE -> $1 + $2
    | escapeStringContent NUMBER -> $1 + $2
    | escapeStringContent OTHER_CHAR -> $1 + $2
    ;

escapeString
    : D_QUOTE escapeStringContent D_QUOTE -> $2
    | D_QUOTE D_QUOTE -> ""
    ;

value
    : optionalWhiteSpace escapeString  {
        function byteCount(s) {
          return encodeURI(s).split(/%(?:u[0-9A-F]{2})?[0-9A-F]{2}|./).length - 1;
        }
        $$ = "ST" + byteCount($2) + $2
      }
    | optionalWhiteSpace object {
        function byteCount(s) {
          return encodeURI(s).split(/%(?:u[0-9A-F]{2})?[0-9A-F]{2}|./).length - 1;
        }
        $$ = "OB" + byteCount($2) + $2
      }
    | optionalWhiteSpace array  {
        function byteCount(s) {
          return encodeURI(s).split(/%(?:u[0-9A-F]{2})?[0-9A-F]{2}|./).length - 1;
        }
        $$ = "AR" + byteCount($2) + $2
      }
    | optionalWhiteSpace boolean  {
        function byteCount(s) {
          return encodeURI(s).split(/%(?:u[0-9A-F]{2})?[0-9A-F]{2}|./).length - 1;
        }
        $$ = "BO" + byteCount($2) + $2
      }
    | optionalWhiteSpace NULL  {
        function byteCount(s) {
          return encodeURI(s).split(/%(?:u[0-9A-F]{2})?[0-9A-F]{2}|./).length - 1;
        }
        $$ = "NL" + 0
      }
    | optionalWhiteSpace number   {
        function byteCount(s) {
          return encodeURI(s).split(/%(?:u[0-9A-F]{2})?[0-9A-F]{2}|./).length - 1;
        }
        $$ = "NU" + (byteCount($2) + 1) + "#" + $2
      }
    ;

array
    : "[" optionalWhiteSpace "]" -> ""
    | "[" elements "]" -> $2
    ;

elements
    : value optionalWhiteSpace -> $1
    | elements "," value optionalWhiteSpace -> $1 + $3
    ;

object
    : "{" optionalWhiteSpace "}" -> ""
    | "{" members "}" -> $2
    ;

members
    : pair optionalWhiteSpace -> $1
    | members "," pair optionalWhiteSpace -> $1 + $3
    ;

pair
    : optionalWhiteSpace key ":" value {

         function byteCount(s) {
           return encodeURI(s).split(/%(?:u[0-9A-F]{2})?[0-9A-F]{2}|./).length - 1;
         }
         $$ = "PA" + byteCount($2) + $2 + $4
    }
    ;

key
    : D_QUOTE keyName D_QUOTE optionalWhiteSpace -> $2
    ;

keyName
    : escapeStringContent
    ;
