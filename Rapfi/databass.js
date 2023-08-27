"use strict";

/*
// Returns the opposite of a color (Black <-> White, Wall <-> Empty)
constexpr Color operator~(Color p)
{
    return Color(p ^ 1);
}
*/

//----------------------- AVL ----------------------------

function resetAVL() {
    const avlBuffer = recordDB.avlBuffer.uint32;
    const dataBuffer = recordDB.fileBuffer.uint8;
    AVL.init(avlBuffer, dataBuffer);
    AVL.compare = function(lPtr, rPtr) {
        const lUint8 = getKeyBuffer(dataBuffer, lPtr);
        const rUint8 = getKeyBuffer(dataBuffer, rPtr);
        const cmp = databaseKeyCompare(lUint8, rUint8);
        return cmp;
    };
    AVL.get = function(key) {
        let node = AVL.root;
        let cmp = 0;
        while (node) {
            const rPtr = AVL.nodeValue(node);
            const rUint8 = getKeyBuffer(dataBuffer, rPtr);
            cmp = databaseKeyCompare(key, rUint8);
            if (cmp === 0) {
                return AVL.nodeValue(node);
            }
            else if (cmp < 0) node = AVL.nodeLeft(node);
            else node = AVL.nodeRight(node);
        }
        return -1;
    }
    recordDB.map = AVL;
}

function loadTest_AVL(ignoreCorrupted, outputProgress = () => {}) {
    let progress = 0;
    const uint8 = recordDB.fileBuffer.uint8;

    progress = forEveryRecord(function(key, recordStart) {
        return recordDB.map.set(recordStart);
    }, outputProgress);

    post("alert", `numRecords: ${getNumRecords(uint8)} \nsize: ${recordDB.map.size}, \nheight: ${recordDB.map.height}`)

    progress = forEveryRecord(function(key, recordStart) {
        const rt = recordDB.map.get(key);
        if (rt > -1) return rt;
        else throw new Error(`recordDB.map.get(key) = ${rt}\nkey: = [${key}]`);
    }, outputProgress);

    return progress;
}

//-------------------- HashTable -------------------------

function resetHashTable() {
    const MOVE = 2;
    const numAnd = HashTable.tableSize - 1;
    const nodeBuffer = recordDB.avlBuffer.uint32;
    const dataBuffer = recordDB.fileBuffer.uint8;
    HashTable.init(nodeBuffer, dataBuffer);
    HashTable.toHash = function(key) {
        return hash(0, key, 0, key.length) & numAnd;
    };
    HashTable.toKey = function(ptr) {
        return getKeyBuffer(dataBuffer, ptr);
    };
    HashTable.compare = function(lUint8, rUint8) {
        const cmp = databaseKeyCompare(lUint8, rUint8);
        return cmp;
    };

    recordDB.map = HashTable;
}

function loadTest_HashTable(ignoreCorrupted, outputProgress = () => {}) {
    let progress = 0;
    const uint8 = recordDB.fileBuffer.uint8;

    progress = forEveryRecord(function(key, recordStart) {
        return recordDB.map.set(key, recordStart);
    }, outputProgress);

    post("alert", `numRecords: ${getNumRecords(uint8)} \nsize: ${recordDB.map.size}, \nMaxLength: ${recordDB.map.getMaxLength()}`)

    /*progress = forEveryRecord(function(key, recordStart) {
        const rt = recordDB.map.get(key);
        if (rt > -1) return rt;
        else throw new Error(`recordDB.map.get(key) = ${rt}\nkey: = [${key}]`);
    }, outputProgress);*/

    return progress;
}

//--------------------------------------------------------

function forEveryRecord(callbackRecord, outputProgress) {
    const uint8 = recordDB.fileBuffer.uint8;
    let u8Index = 0;
    const u8IndexEnd = uint8.length;
    const numRecords = uint8[u8Index++] | uint8[u8Index++] << 8 | uint8[u8Index++] << 16 | uint8[u8Index++] << 24;

    let maxNum = 0;
    let recordIdx;
    for (recordIdx = 0; recordIdx < numRecords; recordIdx++) {
        if (0 == (recordIdx & 0x7FFF)) {
            outputProgress(recordIdx / numRecords);
        }

        const recordStart = u8Index;

        // Read record key
        if (u8Index + 2 > u8IndexEnd) break;
        const numKeyBytes = uint8[u8Index++] | uint8[u8Index++] << 8;
        if (numKeyBytes == 0) continue;

        if (u8Index + numKeyBytes > u8IndexEnd) break;
        u8Index += numKeyBytes;

        // Read record message
        if (u8Index + 2 > u8IndexEnd) break;
        const numRecordBytes = uint8[u8Index++] | uint8[u8Index++] << 8;
        if (u8Index + numRecordBytes > u8IndexEnd) break;
        u8Index += numRecordBytes;

        const key = getKeyBuffer(uint8, recordStart);
        const rt = callbackRecord(key, recordStart);
        if (rt < 1) break;
    }

    return recordIdx / numRecords;
}

function load(ignoreCorrupted, outputProgress = () => {}) {
    const uint8 = recordDB.fileBuffer.uint8;
    let u8Index = 0;
    const u8IndexEnd = uint8.length;
    const numRecords = uint8[u8Index++] | uint8[u8Index++] << 8 | uint8[u8Index++] << 16 | uint8[u8Index++] << 24;

    let byteBuffer; // reserve initial space

    let compareBufferL = new Uint8Array([3, 0, 0, 0, 0, ]);


    let maxNum = 0;
    let recordIdx;
    next_record: for (recordIdx = 0; recordIdx < numRecords; recordIdx++) {
        if (0 == (recordIdx & 0x3FFFF)) {
            outputProgress(recordIdx / numRecords);
        }

        const recordStart = u8Index;

        // Read record key
        if (u8Index + 2 > u8IndexEnd) break;
        const numKeyBytes = uint8[u8Index++] | uint8[u8Index++] << 8;
        if (numKeyBytes == 0)
            continue;

        //----------- debug start -----------------------
        //----------- 测试 record 是否按 key 排除好------

        /*
        const compareBufferR = uint8.slice(u8Index - 2, u8Index + numKeyBytes);
        const diff = databaseKeyCompare(compareBufferL, compareBufferR);
        compareBufferL = compareBufferR;
        */
        //----------- debug end -------------------------

        if (u8Index + numKeyBytes > u8IndexEnd) break;
        u8Index += numKeyBytes;

        /*
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
        */

        // Read record message
        if (u8Index + 2 > u8IndexEnd) break;
        const numRecordBytes = uint8[u8Index++] | uint8[u8Index++] << 8;
        if (u8Index + numRecordBytes > u8IndexEnd) break;
        u8Index += numRecordBytes;
        /*
        byteBuffer = uint8.slice(u8Index, u8Index += numRecordBytes);
        */
        const key = getKeyBuffer(uint8, recordStart);
        const rt = recordDB.map.set(key, recordStart);
        //post("alert", `set: ${recordStart}, rt: ${rt}`);
        if (rt == 0) break;
    }
    //post("alert", `AVL size: ${AVL.size}, height: ${AVL.height} \n root: ${AVL.root} \n parent: ${AVL.nodeParent(AVL.root)},left: ${AVL.nodeLeft(AVL.root)},right: ${AVL.nodeRight(AVL.root)},value: ${AVL.nodeValue(AVL.root)}, balanceFactor: ${AVL.nodeBalanceFactor(AVL.root)}\n [${getRecordBuffer(uint8, AVL.nodeValue(AVL.root))}]\n [${getKeyBuffer(uint8, AVL.nodeValue(AVL.root))}]\n [${getValueBuffer(uint8, AVL.nodeValue(AVL.root))}]\n [${getRecordMessage(uint8, AVL.nodeValue(AVL.root))}] \n minNode: ${AVL.getMinNode()}\n parent: ${AVL.nodeParent(AVL.getMinNode())},left: ${AVL.nodeLeft(AVL.getMinNode())},right: ${AVL.nodeRight(AVL.getMinNode())},value: ${AVL.nodeValue(AVL.getMinNode())}, balanceFactor: ${AVL.nodeBalanceFactor(AVL.getMinNode())}\n [${getRecordBuffer(uint8, AVL.nodeValue(AVL.getMinNode()))}]\n [${getKeyBuffer(uint8, AVL.nodeValue(AVL.getMinNode()))}]\n [${getValueBuffer(uint8, AVL.nodeValue(AVL.getMinNode()))}]\n [${getRecordMessage(uint8, AVL.nodeValue(AVL.getMinNode()))}]`);
    return recordIdx / numRecords;
}

function getRecordBuffer(uint8, ptr) {
    const numKeyBytes = uint8[ptr] | uint8[ptr + 1] << 8;
    const recordStart = ptr + 2 + numKeyBytes;
    const numRecordBytes = uint8[recordStart] | uint8[recordStart + 1] << 8;
    return uint8.slice(ptr, ptr + 4 + numKeyBytes + numRecordBytes);
}

function getKeyBuffer(uint8, ptr) {
    const numKeyBytes = uint8[ptr] | uint8[ptr + 1] << 8;
    return uint8.slice(ptr, ptr + 2 + numKeyBytes);
}

function getValueBuffer(uint8, ptr) {
    const numKeyBytes = uint8[ptr] | uint8[ptr + 1] << 8;
    const recordStart = ptr + 2 + numKeyBytes;
    const numRecordBytes = uint8[recordStart] | uint8[recordStart + 1] << 8;
    return uint8.slice(recordStart, recordStart + 2 + numRecordBytes);
}

function getRecordMessage(uint8, ptr) {
    const numKeyBytes = uint8[ptr] | uint8[ptr + 1] << 8;
    const recordStart = ptr + 2 + numKeyBytes;
    const numRecordBytes = uint8[recordStart] | uint8[recordStart + 1] << 8;
    return uint8.slice(recordStart + 2, recordStart + 2 + numRecordBytes);
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
        const avlBytes = (getNumRecords(uint8) + 1) * HashTable.nodeBytes;

        const fileBytes = _islz4 ? lz4.decompressBound(uint8) : 0;
        callback(`申请内存......`) //
        await loadWASM("../script/maxBuffer.wasm");
        const buffers = await getMaxBuffes(1, 0, fileBytes, avlBytes);

        if (!buffers) return;
        callback(`${fileBytes == buffers[0].uint8.length ? "完全" : "部分"}解压文件......`);
        if (_islz4) lz4.decompressFrame(uint8, buffers[0].uint8, callback);

        recordDB.avlBuffer = buffers[1];
        recordDB.fileBuffer = { uint8: _islz4 ? buffers[0].uint8 : uint8 };

        //resetAVL();
        resetHashTable();

        uint8 = undefined;

        //return loadTest_AVL(false, callback);
        //return loadTest_HashTable(false, callback);
        return load(false, callback);

    } catch (e) { post("onerror", e.stack || e) }
}
