"use strict";

var recordMap = new Map();

function rotate90(centerX, centerY, _x, _y) {
    let x = centerX - _x,
        y = centerY - _y;
    return (centerX + y) + (centerY - x) * 15;
}

function reflectX(centerY, _x, _y) {
    return _x + (centerY * 2 - _y) * 15;
}

function rotatePosstion(w, h, posstion) {
    const nPosstion = new Array(225).fill(0);
    for (let i = 0; i < 225; i++) {
        if (posstion[i]) {
            const idx = rotate90((w - 1) / 2, (h - 1) / 2, i % 15, ~~(i / 15))
            nPosstion[idx] = posstion[i];
        }
    }
    return nPosstion;
}

function reflectPosstion(w, h, posstion) {
    const nPosstion = new Array(225).fill(0);
    for (let i = 0; i < 225; i++) {
        if (posstion[i]) {
            const idx = reflectX((h - 1) / 2, i % 15, ~~(i / 15))
            nPosstion[idx] = posstion[i];
        }
    }
    return nPosstion;
}

function getStones(posstion) {
    let numBlackStones = 0;
    let numWhiteStones = 0;
    const blackStones = [];
    const whiteStones = [];
    for (let x = 0; x < 15; x++) {
        for (let y = 0; y < 15; y++) {
            const idx = x + y * 15;
            if (posstion[idx] == 1) blackStones[numBlackStones++] = idx;
            else if (posstion[idx] == 2) whiteStones[numWhiteStones++] = idx;
        }
    }
    return {
        numBlackStones: numBlackStones,
        numWhiteStones: numWhiteStones,
        stones: blackStones.concat(whiteStones)
    }
}

//return l, r, -1(l == r)
function less(l, r) {
    const lx = l % 15;
    const ly = ~~(l / 15);
    const rx = r % 15;
    const ry = ~~(r / 15);
    if (lx < rx) return l;
    else if (lx > rx) return r;
    else if (ly < ry) return l;
    else if (ly > ry) return r;
    else return -1;
}

function small(stonesInfo1, stonesInfo2) {
    for (let i = 0; i < stonesInfo1.stones.length; i++) {
        const ls = less(stonesInfo1.stones[i] * 1, stonesInfo2.stones[i] * 1);
        if (ls == -1) continue;
        else if (ls == stonesInfo1.stones[i]) return stonesInfo1;
        else return stonesInfo2;
    }
    return stonesInfo1;
}

function constructDBKey(rule, boardWidth, boardHeight, sideToMove, posstion) {
    let smallStonesInfo = { stones: [1514] };
    for (let i = 0; i < 8; i++) {
        if (i == 4) {
            posstion = reflectPosstion(boardWidth, boardHeight, posstion);
        }
        else if (i) { // 1,2,3,5,6,7
            posstion = rotatePosstion(boardWidth, boardHeight, posstion);
        }
        const stonesInfo = getStones(posstion);
        smallStonesInfo = small(stonesInfo, smallStonesInfo);
    }
    const keyArray = [rule, boardWidth, boardHeight, sideToMove, smallStonesInfo.numBlackStones, smallStonesInfo.numWhiteStones].concat(smallStonesInfo.stones);
    return keyArray.toString();
}

function forEveryEmpty(posstion, callback) {
    for (let i = 0; i < 225; i++) {
        if (0 == posstion[i]) callback(i);
    }
}

function getBranchNodes(rule, boardWidth, boardHeight, sideToMove, posstion) {
    let comment = new Uint8Array();
    let records = [];
    const sKey = constructDBKey(rule, boardWidth, boardHeight, sideToMove, posstion);
    //alert(sKey)
    const recordBuffer = recordMap.get(sKey);
    if (recordBuffer) {
        const record = new DBRecord(recordBuffer);
        comment = record.text;
        //alert(comment)
    }

    forEveryEmpty(posstion, function(i) {
        const nPosstion = posstion.slice(0);
        nPosstion[i] = sideToMove + 1;
        const sKey = constructDBKey(rule, boardWidth, boardHeight, sideToMove ^ 1, nPosstion);
        //alert(`i: ${i} \n ${sKey}`)
        const recordBuffer = recordMap.get(sKey);
        if (recordBuffer) {
            const record = new DBRecord(recordBuffer);
            record.idx = i;
            records.push(record);
        }
    })
    return {
        comment: comment,
        records: records
    }
}

