
var num = /[0-9]/;

function firstCharGuess(blob, idx){
  var startChar = blob[idx];
  if(startChar === "{"){
    return "object-open"
  } else if(startChar === "["){
    return "array-open"
  } else if(startChar === "\""){
    return "string"
  } else if(startChar === "}"){
    return "object-close"
  } else if(startChar === "]"){
    return "array-close"
  }
  return null;
}

function selectAction(blob, idx, history, scope){

}
