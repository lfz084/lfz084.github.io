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

function load(ignoreCorrupted, callback = () => {}) {
    const list = recordDB.listBuffer.uint32;
    const uint8 = recordDB.fileBuffer.uint8;
    let u8Index = 0;
    let listIndex = 0;
    const u8IndexEnd = uint8.length;
    const listIndexEnd = list.length;
    const numRecords = uint8[u8Index++] | uint8[u8Index++] << 8 | uint8[u8Index++] << 16 | uint8[u8Index++] << 24;

    let byteBuffer; // reserve initial space
    
    let compareBufferL = new Uint8Array([3,0,0,0,0,]);

    let maxNum = 0;
    let recordIdx;
    next_record: for (recordIdx = 0; recordIdx < numRecords; recordIdx++) {
        if (0 == (recordIdx & 0x3FFFF)) {
            callback(recordIdx / numRecords);
        }

        const listValue = u8Index;

        // Read record key
        if (u8Index + 2 > u8IndexEnd) break;
        const numKeyBytes = uint8[u8Index++] | uint8[u8Index++] << 8;
        if (numKeyBytes == 0)
            continue;
        
        //----------- debug start -----------------------
        //----------- 测试 record 是否按 key 排除好------
        
        const compareBufferR = uint8.slice(u8Index-2, u8Index + numKeyBytes);
        /*
        const diff = databaseKeyCompare(compareBufferL, compareBufferR);
        if (diff <= 0) compareBufferL = compareBufferR;
        else throw new Error(`db文件record记录的排序可能不对\ndiff = ${diff}\nL:[${compareBufferL}]\nR:[${compareBufferR}]`);
        */
        //----------- debug end -------------------------
        
        if (u8Index + numKeyBytes > u8IndexEnd) break;
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
        //let blackPass = 0;
        let stoneIdx = 0;
        for (let blackIdx = 0; blackIdx < numBlackStones; blackIdx++) {
            const x = byteBuffer[3 + blackIdx * 2];
            const y = byteBuffer[4 + blackIdx * 2];
            if (x == 0xFF && y == 0xFF) { // the last pass move 
                //blackPass = 1;
                break;
            }
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
            if (x == 0xFF && y == 0xFF) { // the last pass move 
                //if(blackPass) throw new Error(`${recordIdx}: blackPass + whitePass`);
                break;
            }
            else if (x >= 0 && y >= 0 && x < boardXLen && y < boardYLen)
                stones[stoneIdx++] = x + y * 15;
            else if (ignoreCorrupted)
                continue next_record;
            else
                throw new Error(`with invalid white pos at index ${recordIdx}: {x:${x}, y:${y}}`);
        }



        // Read record message
        if (u8Index + 2 > u8IndexEnd) break;
        const numRecordBytes = uint8[u8Index++] | uint8[u8Index++] << 8;
        if (u8Index + numRecordBytes > u8IndexEnd) break;
        byteBuffer = uint8.slice(u8Index, u8Index += numRecordBytes);
        
        recordDB.map.set(compareBufferR.toString(), listValue);
        
        /*
        list[listIndex++] = listValue;
        if (listIndex > listIndexEnd) break;
        */
        
        /*
        if((recordIdx > 380 && recordIdx < 388)) {
            const cmpDBKey = new CompactDBKey(rule, boardXLen, boardYLen, sideToMove, numBlackStones, numWhiteStones, stones);
            const dbRecord = new DBRecord(byteBuffer);
            $("status") && ($("status").innerHTML += `recordIdx: ${recordIdx}<br>key: "${sKey}"<br>
        rule: ${cmpDBKey.rule},width: ${cmpDBKey.boardWidth}, height: ${cmpDBKey.boardWidth}, numKeyBytes:.${numKeyBytes}, side: ${cmpDBKey.sideToMove}<br>
        [${cmpDBKey.uint8.slice(cmpDBKey.blackStonesBegin(), cmpDBKey.blackStonesEnd())}]<br>
        [${cmpDBKey.uint8.slice(cmpDBKey.whiteStonesBegin(), cmpDBKey.whiteStonesEnd())}]<br>
        label: ${String.fromCharCode(dbRecord.label)}, value: ${dbRecord.value}, depth: ${dbRecord.depth}, bound: ${dbRecord.bound}, text: "${TextCoder.decode(dbRecord.text, "GBK")}"<br>`);
        }

        const newNum = stones.length; //numBlackStones + numWhiteStones;
        if (newNum < maxNum) throw new Error(`index ${recordIdx}: ${newNum} < ${maxNum}`)
        else if (newNum > maxNum) maxNum = newNum;
        if (recordIdx > 389) break;*/
    }

    return recordIdx / numRecords;
}

function isLZ4(uint8) {
    return 0x184D2204 == (uint8[0] | uint8[1] << 8 | uint8[2] << 16 | uint8[3] << 24);
}

// 读取db记录数，方便分配内存
function getNumRecords(uint8) {
    if (isLZ4(uint8)) {
        uint8 = lz4.decompress(uint8, 1 << 16);
    }
    return uint8[0] | uint8[1] << 8 | uint8[2] << 16 | uint8[3] << 24;
}

async function openDatabass(file, callback) {
    try {
        recordDB.clear();
        callback("打开文件......");
        let uint8 = new Uint8Array(await getArrBuf(file));

        const _islz4 = isLZ4(uint8);
        const listBytes = getNumRecords(uint8) * 4;
        const fileBytes = _islz4 ? lz4.decompressBound(uint8) : 0;
        callback(`申请内存......`) //
        const buffers = await getMaxBuffes(1, 0, listBytes, fileBytes);

        if (!buffers) return;
        callback(`${fileBytes == buffers[1].uint8.length ? "完全" : "部分"}解压文件......`);
        if (_islz4) lz4.decompressFrame(uint8, buffers[1].uint8, callback);

        recordDB.listBuffer = buffers[0];
        recordDB.fileBuffer = { uint8: _islz4 ? buffers[1].uint8 : uint8 };

        uint8 = undefined;

        return load(false, callback);

    } catch (e) { post("onerror", e.stack || e) }
}
