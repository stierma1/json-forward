
var num = /^[0-9]$/

function getLengthStr(buffer, idx){
  var lengthIdx = idx + 2;
  var lengthStr = "";
  while(num.test(buffer.toString("ascii", lengthIdx, lengthIdx + 1))){
    lengthStr += buffer.toString("ascii", lengthIdx, lengthIdx + 1);
    lengthIdx++;
  }

  return lengthStr;
}

function getFragType(buffer, idx){
  return buffer.toString("ascii", idx, idx+2);
}

function getBodyEndIdx(buffer, idx){
  var lengthStr = getLengthStr(buffer, idx);

  var length = parseInt(lengthStr);
  return idx + length + 2 + lengthStr.length;
}

function getBodyStartIdx(buffer, idx){
  var lengthStr = getLengthStr(buffer, idx);
  return idx + lengthStr.length + 2;
}

function OB(buffer, idx, object, history){
  history.push(object);

}

function extractPAs(buffer, idx, endIdx, pairs){
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

function extractElementIdxs(buffer, idx, endIdx, eles){
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

function convertValue(buffer, idx, endIdx){
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

function convertNumber(buffer, idx, endIdx){
  var bodyStart = getBodyStartIdx(buffer, idx, endIdx) + 1;
  var bodyEnd = getBodyEndIdx(buffer, idx, endIdx);
  var numStr = buffer.toString("ascii", bodyStart, bodyEnd);
  return Number(numStr);
}

function convertString(buffer, idx, endIdx){
  var bodyStart = getBodyStartIdx(buffer, idx, endIdx);
  var bodyEnd = getBodyEndIdx(buffer, idx, endIdx);
  return buffer.toString("utf8", bodyStart, bodyEnd);
}


module.exports = convertValue;

function pluckFromObject(keyName, buffer, idx, endIdx){
  if(idx >= endIdx || getFragType(buffer, idx) !== "PA"){
    return undefined;
  }

  var bodyStart = getBodyStartIdx(buffer, idx);
  var bodyEnd = getBodyEndIdx(buffer, idx);

  if(buffer.toString("utf8", bodyStart, bodyEnd) === keyName){
    return bodyStart;
  }

  return pluckFromObject(keyName, buffer, getBodyEndIdx(buffer, bodyEnd), endIdx);
}

function pluckFromArray(keyIdx, buffer, idx, endIdx){
  if(idx >= endIdx){
    return undefined;
  }

  var bodyStart = getBodyStartIdx(buffer, idx);
  var bodyEnd = getBodyEndIdx(buffer, idx);

  if(keyIdx === 0){
    return bodyStart
  }

  return extractElementIdxs(keyIdx - 1, buffer, bodyEnd, endIdx);
}
