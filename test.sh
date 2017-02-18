
node node_modules/jison/lib/cli lib/grammar.jison

mv grammar.js lib/grammar.js

tsc ./lib/parser.ts
node lib/grammar.js test/simple.json
node test/simple.js
