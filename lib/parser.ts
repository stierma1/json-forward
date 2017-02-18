
var stringifier = require("./grammar").parse;
var num = /^[0-9]$/

function getLengthStr(buffer : NodeBuffer, idx : number){
  var lengthIdx = idx + 2;
  var lengthStr = "";
  while(num.test(buffer.toString("ascii", lengthIdx, lengthIdx + 1))){
    lengthStr += buffer.toString("ascii", lengthIdx, lengthIdx + 1);
    lengthIdx++;
  }

  return lengthStr;
}

function getFragType(buffer : NodeBuffer, idx : number) : string{
  return buffer.toString("ascii", idx, idx+2);
}

function getBodyEndIdx(buffer : NodeBuffer, idx : number) : number{
  var lengthStr = getLengthStr(buffer, idx);
  var length = parseInt(lengthStr);
  return idx + length + 2 + lengthStr.length;
}

function getBodyStartIdx(buffer : NodeBuffer, idx : number) : number{
  var lengthStr = getLengthStr(buffer, idx);
  return idx + lengthStr.length + 2;
}


function extractPAs(buffer : NodeBuffer, idx : number, endIdx : number, pairs : any[]) : any[]{
  if(idx >= endIdx || getFragType(buffer, idx) !== "PA"){
    return pairs;
  }

  var bodyStart = getBodyStartIdx(buffer, idx);
  var bodyEnd = getBodyEndIdx(buffer, idx);

  pairs.push([
    buffer.toString("utf8", bodyStart, bodyEnd),
    idx,
    bodyStart,
    bodyEnd,
    getBodyEndIdx(buffer, bodyEnd)
  ]);

  return extractPAs(buffer, getBodyEndIdx(buffer, bodyEnd), endIdx, pairs);
}

function extractElementIdxs(buffer : NodeBuffer, idx : number, endIdx : number, eles : any[]) : any[]{
  if(idx >= endIdx){
    return eles;
  }

  var bodyStart = getBodyStartIdx(buffer, idx);
  var bodyEnd = getBodyEndIdx(buffer, idx);

  eles.push([
    idx,
    bodyStart,
    bodyEnd
  ]);

  return extractElementIdxs(buffer, bodyEnd, endIdx, eles);
}

export function convertValue(buffer : NodeBuffer, idx : number, endIdx : number) : any{
  var val = getFragType(buffer, idx);

  switch(val){
    case "OB":return extractPAs(buffer, getBodyStartIdx(buffer, idx), endIdx, []).reduce((red, pa) => {
      red[pa[0]] = convertValue(buffer, pa[3], pa[4]);
      return red;
    }, {});
    case "ST": return convertString(buffer, idx, endIdx);
    case "AR":return extractElementIdxs(buffer, getBodyStartIdx(buffer, idx), endIdx, []).map((ele) => {
      return convertValue(buffer, ele[0], ele[2]);
    });
    case "NU": return convertNumber(buffer, idx, endIdx);
    case "NL": return null;
    case "BO": return getLengthStr(buffer, idx) === '4';
    default : return;
  }
}

export function convertFromRoot(buffer : NodeBuffer) : any{
  return  convertValue(buffer, 0, buffer.length);
}

function convertNumber(buffer : NodeBuffer, idx : number, endIdx : number) : number{
  var bodyStart = getBodyStartIdx(buffer, idx) + 1;
  var bodyEnd = getBodyEndIdx(buffer, idx);
  var numStr = buffer.toString("ascii", bodyStart, bodyEnd);
  return Number(numStr);
}

function convertString(buffer : NodeBuffer, idx : number, endIdx : number) : string{
  var bodyStart = getBodyStartIdx(buffer, idx);
  var bodyEnd = getBodyEndIdx(buffer, idx);
  return buffer.toString("utf8", bodyStart, bodyEnd);
}


function pluckFromObject(keyName : string, buffer : NodeBuffer, idx : number, endIdx : number) : any{
  if(idx >= endIdx || getFragType(buffer, idx) !== "PA"){
    return undefined;
  }

  var bodyStart = getBodyStartIdx(buffer, idx);
  var bodyEnd = getBodyEndIdx(buffer, idx);

  if(buffer.toString("utf8", bodyStart, bodyEnd) === keyName){
    return bodyEnd;
  }

  return pluckFromObject(keyName, buffer, getBodyEndIdx(buffer, bodyEnd), endIdx);
}

function pluckFromArray(keyIdx : number, buffer : NodeBuffer, idx : number, endIdx : number) : any{
  if(idx >= endIdx){
    return undefined;
  }

  if(keyIdx === 0){   
    return idx
  }

  var bodyStart = getBodyStartIdx(buffer, idx);
  var bodyEnd = getBodyEndIdx(buffer, idx);

  return pluckFromArray(keyIdx - 1, buffer, bodyEnd, endIdx);
}

function getType(type: string):any{
    switch(type){
        case "OB" : return Object;
        case "AR" : return Array;
        case "NU" : return Number;
        case "NL" : return null;
        case "BO" : return Boolean;
        case "ST" : return String;
        default: return undefined;
    }
}

interface Node {
  type() : string,
  value<T>(): T,
  get<S>(path:string[]): Node
}

export function get<T>(path : any[], buffer : NodeBuffer, idx:number, endIdx:number, parents:number[]) : Node{
    const fragType =  getFragType(buffer, idx);
    parents = parents || [];
    if(path.length === 0){
        return <Node>{
            type: () : any => {
                return getType(fragType);
            },
            value<T>() : T{
                return convertValue(buffer, idx, endIdx);
            },
            get<S>(path : string[]) : any{
                return get<S>(path, buffer, idx, endIdx, parents);
            }
        }
    }
    parents.push(idx);
    if(typeof(path[0]) === "string"){
        const keyIdx = pluckFromObject(path[0], buffer,  getBodyStartIdx(buffer, idx), endIdx);
        const keyEndIdx = getBodyEndIdx(buffer, keyIdx);
        path.shift();
        return get<T>(path,buffer, keyIdx, keyEndIdx, parents);
    } else {
        const keyIdx = pluckFromArray(path[0], buffer,  getBodyStartIdx(buffer, idx), endIdx);
        const keyEndIdx = getBodyEndIdx(buffer, keyIdx);
        path.shift();
        return get<T>(path,buffer, keyIdx, keyEndIdx, parents);
    }
}

export function getRoot<T>(path : any[], buffer : NodeBuffer) : Node{
    var idx = 0;
    var endIdx = buffer.length;
    const fragType =  getFragType(buffer, idx);
    var parents : number[] = parents || [];
    if(path.length === 0){
        return <Node>{
            type: () : any => {
                return getType(fragType);
            },
            value<T>() : T{
                return convertValue(buffer, idx, endIdx);
            },
            get<S>(path : string[]) : any{
                return get<S>(path, buffer, idx, endIdx, parents);
            }
        }
    }
    parents.push(idx);
    if(typeof(path[0]) === "string"){
        const keyIdx = pluckFromObject(path[0], buffer,  getBodyStartIdx(buffer, idx), endIdx);
        const keyEndIdx = getBodyEndIdx(buffer, keyIdx);
        path.shift();
        return get<T>(path,buffer, keyIdx, keyEndIdx, parents);
    } else {
        const keyIdx = pluckFromArray(path[0], buffer,  getBodyStartIdx(buffer, idx), endIdx);
        const keyEndIdx = getBodyEndIdx(buffer, keyIdx);
        path.shift();
        return get<T>(path,buffer, keyIdx, keyEndIdx, parents);
    }
}