"use strict";
const ACTUAL_BOARD_SIZE = 15;

/// Rule is the fundamental rule of the game
const Rule = { 
    FREESTYLE: 0, 
    STANDARD: 1, 
    RENJU: 2, 
    RULE_NB: 3 
};


const Color = {
    BLACK: 0,
    WHITE: 1,
    WALL: 2,
    EMPTY: 3,
    COLOR_NB: 4, // Total number of color on board
    SIDE_NB: 2 // Two side of stones (Black and White)
};
/*
// Returns the opposite of a color (Black <-> White, Wall <-> Empty)
constexpr Color operator~(Color p)
{
    return Color(p ^ 1);
}
*/
async function getArrBuf(file) {
    return new Promise((resolve, reject) => {
        let fr = new FileReader();
        fr.onload = () => {
            resolve(fr.result);
        }
        fr.onerror = err => {
            reject(err)
        }
        fr.readAsArrayBuffer(file);
    });
}

async function load(uint8, ignoreCorrupted, callback = ()=>{}) {
    try{
    let u8Index = 0;
    const numRecords = uint8[u8Index++] | uint8[u8Index++] << 8 | uint8[u8Index++] << 16 | uint8[u8Index++] << 24;

    //$("status").innerHTML = `numRecords: ${numRecords} <br>`
    let byteBuffer; // reserve initial space
    
    next_record: for (let recordIdx = 0; recordIdx < numRecords; recordIdx++) {
        if (0 == (recordIdx & 0x1FFF)) {
            callback(recordIdx / numRecords);
            await wait(0);
        }
        
        // Read record key
        const numKeyBytes = uint8[u8Index++] | uint8[u8Index++] << 8;
        if (numKeyBytes == 0)
            continue;
        byteBuffer = uint8.slice(u8Index, u8Index += numKeyBytes);
        
        // Parse record key
        const rule = byteBuffer[0];
        if (rule >= Rule.RULE_NB) {
            if (ignoreCorrupted) continue;
            throw new Error(`with invalid rule at index ${recordIdx}: {${rule}}`);
        }

        const boardXLen = byteBuffer[1];
        const boardYLen = byteBuffer[2];
        if (boardXLen > ACTUAL_BOARD_SIZE || boardYLen > ACTUAL_BOARD_SIZE) {
            if (ignoreCorrupted) continue;
            throw new Error(`with invalid board size at index ${recordIdx}: {${boardXLen} X ${boardYLen}}`);
        }

        const numStones = (numKeyBytes - 3) >>> 1;
        if (numStones > boardXLen * boardYLen) {
            if (ignoreCorrupted) continue;
            throw new Error(`with invalid number of stones at index ${recordIdx}: {${numStones}}`);
        }

        const numBlackStones = (numStones + 1) >>> 1;
        const numWhiteStones = numStones >>> 1;
        const sideToMove = numBlackStones == numWhiteStones ? Color.BLACK : Color.WHITE;

        const stones = [];
        let stoneIdx = 0;
        for (let blackIdx = 0; blackIdx < numBlackStones; blackIdx++) {
            const x = byteBuffer[3 + blackIdx * 2];
            const y = byteBuffer[4 + blackIdx * 2];
            if (x == 0xFF && y == 0xFF) // the last pass move
                break;
            else if (x >= 0 && y >= 0 && x < boardXLen && y < boardYLen)
                stones[stoneIdx++] = x + y * 15;
            else if (ignoreCorrupted)
                continue next_record;
            else
                throw new Error(`with invalid black pos at index ${recordIdx}: {x:${x}, y:${y}}`);
        }
        for (let whiteIdx = 0; whiteIdx < numWhiteStones; whiteIdx++) {
            const x = byteBuffer[3 + (numBlackStones + whiteIdx) * 2];
            const y = byteBuffer[4 + (numBlackStones + whiteIdx) * 2];
            if (x == 0xFF && y == 0xFF) // the last pass move
                break;
            else if (x >= 0 && y >= 0 && x < boardXLen && y < boardYLen)
                stones[stoneIdx++] = x + y * 15;
            else if (ignoreCorrupted)
                continue next_record;
            else
                throw new Error(`with invalid white pos at index ${recordIdx}: {x:${x}, y:${y}}`);
        }
        
        // Read record message
        const numRecordBytes = uint8[u8Index++] | uint8[u8Index++] << 8;
        byteBuffer = uint8.slice(u8Index, u8Index += numRecordBytes);

        const keyArray = [rule, boardXLen, boardYLen, sideToMove, numBlackStones, numWhiteStones].concat(stones);
        const sKey = keyArray.toString();//bufferToBase64String(sbuf);
        recordMap.set(sKey, byteBuffer);
        /*
        if (recordIdx < 0x25) {
            const cmpDBKey = new CompactDBKey(rule, boardXLen, boardYLen, sideToMove, numBlackStones, numWhiteStones, stones);
            const dbRecord = new DBRecord(byteBuffer);
            $("status") && ($("status").innerHTML += `recordIdx: ${recordIdx}<br>key: "${sKey}"<br>
            rule: ${cmpDBKey.rule},width: ${cmpDBKey.boardWidth}, height: ${cmpDBKey.boardWidth}, side: ${cmpDBKey.sideToMove}, numBlacks: ${cmpDBKey.numBlackStones}, numWhites: ${cmpDBKey.numWhiteStones}<br>
            [${cmpDBKey.uint8.slice(cmpDBKey.blackStonesBegin(), cmpDBKey.blackStonesEnd())}]<br>
            [${cmpDBKey.uint8.slice(cmpDBKey.whiteStonesBegin(), cmpDBKey.whiteStonesEnd())}]<br>
            label: ${String.fromCharCode(dbRecord.label)}, value: ${dbRecord.value}, depth: ${dbRecord.depth}, bound: ${dbRecord.bound}, text: "${TextCoder.decode(dbRecord.text, "GBK")}"<br>`);
        }
        */
    }
    }catch(e){alert(e.stack)}
}


async function openDatabass(file, callback) {
    try{
    let uint8 = new Uint8Array(await getArrBuf(file));
    if ( 0x184D2204 == (uint8[0] | uint8[1] << 8 | uint8[2] << 16 | uint8[3] << 24))
        uint8 = new Uint8Array(lz4.decompress(uint8));
    recordMap.clear();
    await load(uint8, false, callback);
    }catch(e){alert(e.stack)}
}
