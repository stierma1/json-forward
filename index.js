

var jsonFStringify = require("./lib/grammar").parse;

module.exports = {
    toJsonForward : function(value){
        return Buffer.from(jsonFStringify(value), "utf8");
    },
    toJsonObj : require("./lib/parser").convertFromRoot,
    get : require("./lib/parser").getRoot
}

