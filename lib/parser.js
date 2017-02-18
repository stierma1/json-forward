"use strict";
var stringifier = require("./grammar").parse;
var num = /^[0-9]$/;
function getLengthStr(buffer, idx) {
    var lengthIdx = idx + 2;
    var lengthStr = "";
    while (num.test(buffer.toString("ascii", lengthIdx, lengthIdx + 1))) {
        lengthStr += buffer.toString("ascii", lengthIdx, lengthIdx + 1);
        lengthIdx++;
    }
    return lengthStr;
}
function getFragType(buffer, idx) {
    return buffer.toString("ascii", idx, idx + 2);
}
function getBodyEndIdx(buffer, idx) {
    var lengthStr = getLengthStr(buffer, idx);
    var length = parseInt(lengthStr);
    return idx + length + 2 + lengthStr.length;
}
function getBodyStartIdx(buffer, idx) {
    var lengthStr = getLengthStr(buffer, idx);
    return idx + lengthStr.length + 2;
}
function extractPAs(buffer, idx, endIdx, pairs) {
    if (idx >= endIdx || getFragType(buffer, idx) !== "PA") {
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
function extractElementIdxs(buffer, idx, endIdx, eles) {
    if (idx >= endIdx) {
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
function convertValue(buffer, idx, endIdx) {
    var val = getFragType(buffer, idx);
    switch (val) {
        case "OB": return extractPAs(buffer, getBodyStartIdx(buffer, idx), endIdx, []).reduce(function (red, pa) {
            red[pa[0]] = convertValue(buffer, pa[3], pa[4]);
            return red;
        }, {});
        case "ST": return convertString(buffer, idx, endIdx);
        case "AR": return extractElementIdxs(buffer, getBodyStartIdx(buffer, idx), endIdx, []).map(function (ele) {
            return convertValue(buffer, ele[0], ele[2]);
        });
        case "NU": return convertNumber(buffer, idx, endIdx);
        case "NL": return null;
        case "BO": return getLengthStr(buffer, idx) === '4';
        default: return;
    }
}
exports.convertValue = convertValue;
function convertFromRoot(buffer) {
    return convertValue(buffer, 0, buffer.length);
}
exports.convertFromRoot = convertFromRoot;
function convertNumber(buffer, idx, endIdx) {
    var bodyStart = getBodyStartIdx(buffer, idx) + 1;
    var bodyEnd = getBodyEndIdx(buffer, idx);
    var numStr = buffer.toString("ascii", bodyStart, bodyEnd);
    return Number(numStr);
}
function convertString(buffer, idx, endIdx) {
    var bodyStart = getBodyStartIdx(buffer, idx);
    var bodyEnd = getBodyEndIdx(buffer, idx);
    return buffer.toString("utf8", bodyStart, bodyEnd);
}
function pluckFromObject(keyName, buffer, idx, endIdx) {
    if (idx >= endIdx || getFragType(buffer, idx) !== "PA") {
        return undefined;
    }
    var bodyStart = getBodyStartIdx(buffer, idx);
    var bodyEnd = getBodyEndIdx(buffer, idx);
    if (buffer.toString("utf8", bodyStart, bodyEnd) === keyName) {
        return bodyEnd;
    }
    return pluckFromObject(keyName, buffer, getBodyEndIdx(buffer, bodyEnd), endIdx);
}
function pluckFromArray(keyIdx, buffer, idx, endIdx) {
    if (idx >= endIdx) {
        return undefined;
    }
    if (keyIdx === 0) {
        return idx;
    }
    var bodyStart = getBodyStartIdx(buffer, idx);
    var bodyEnd = getBodyEndIdx(buffer, idx);
    return pluckFromArray(keyIdx - 1, buffer, bodyEnd, endIdx);
}
function getType(type) {
    switch (type) {
        case "OB": return Object;
        case "AR": return Array;
        case "NU": return Number;
        case "NL": return null;
        case "BO": return Boolean;
        case "ST": return String;
        default: return undefined;
    }
}
function get(path, buffer, idx, endIdx, parents) {
    var fragType = getFragType(buffer, idx);
    parents = parents || [];
    if (path.length === 0) {
        return {
            type: function () {
                return getType(fragType);
            },
            value: function () {
                return convertValue(buffer, idx, endIdx);
            },
            get: function (path) {
                return get(path, buffer, idx, endIdx, parents);
            }
        };
    }
    parents.push(idx);
    if (typeof (path[0]) === "string") {
        var keyIdx = pluckFromObject(path[0], buffer, getBodyStartIdx(buffer, idx), endIdx);
        var keyEndIdx = getBodyEndIdx(buffer, keyIdx);
        path.shift();
        return get(path, buffer, keyIdx, keyEndIdx, parents);
    }
    else {
        var keyIdx = pluckFromArray(path[0], buffer, getBodyStartIdx(buffer, idx), endIdx);
        var keyEndIdx = getBodyEndIdx(buffer, keyIdx);
        path.shift();
        return get(path, buffer, keyIdx, keyEndIdx, parents);
    }
}
exports.get = get;
function getRoot(path, buffer) {
    var idx = 0;
    var endIdx = buffer.length;
    var fragType = getFragType(buffer, idx);
    var parents = parents || [];
    if (path.length === 0) {
        return {
            type: function () {
                return getType(fragType);
            },
            value: function () {
                return convertValue(buffer, idx, endIdx);
            },
            get: function (path) {
                return get(path, buffer, idx, endIdx, parents);
            }
        };
    }
    parents.push(idx);
    if (typeof (path[0]) === "string") {
        var keyIdx = pluckFromObject(path[0], buffer, getBodyStartIdx(buffer, idx), endIdx);
        var keyEndIdx = getBodyEndIdx(buffer, keyIdx);
        path.shift();
        return get(path, buffer, keyIdx, keyEndIdx, parents);
    }
    else {
        var keyIdx = pluckFromArray(path[0], buffer, getBodyStartIdx(buffer, idx), endIdx);
        var keyEndIdx = getBodyEndIdx(buffer, keyIdx);
        path.shift();
        return get(path, buffer, keyIdx, keyEndIdx, parents);
    }
}
exports.getRoot = getRoot;
