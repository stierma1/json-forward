var fs = require("fs");
var JsonForward = require("../index");
var assert = require("assert");

var fTest = fs.readFileSync(__dirname + "/f-test.jsonf");

//String Test 
var jsonForward = JsonForward.toJsonForward(JSON.stringify("I am a string"));
assert.equal(jsonForward.toString("utf8"), "ST13I am a string")

var jsonReparse = JsonForward.toJsonObj(jsonForward);
assert.equal(jsonReparse, "I am a string")

var got = JsonForward.get([], jsonForward);
assert.equal(got.value(), "I am a string");

got = JsonForward.get([], jsonForward);
assert.equal(got.type(), String);

//Object Test

var jsonForward = JsonForward.toJsonForward(JSON.stringify({"a":1}));
assert.equal(jsonForward.toString("utf8"), "OB9PA1aNU2#1")

var jsonReparse = JsonForward.toJsonObj(jsonForward);
assert.equal(jsonReparse.a, 1)

var got = JsonForward.get([],jsonForward);
assert.equal(got.value().a, 1);

got = JsonForward.get([], jsonForward);
assert.equal(got.type(), Object);

//Array Test

var jsonForward = JsonForward.toJsonForward(JSON.stringify([1,2]));
assert.equal(jsonForward.toString("utf8"), "AR10NU2#1NU2#2")

var jsonReparse = JsonForward.toJsonObj(jsonForward);
assert.equal(jsonReparse[0], 1)

var got = JsonForward.get([],jsonForward);
assert.equal(got.value()[1], 2);

got = JsonForward.get([], jsonForward);
assert.equal(got.type(), Array);


//console.log(parser.get(["dsa", "what"], fTest, 0, fTest.length).value()))