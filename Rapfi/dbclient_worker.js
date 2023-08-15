"use strict"
if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["dbclient_worker"] = "v2110.00";

if ("importScripts" in self) {
    self.importScripts(
        "../script/maxBuffer.js",
        "../lz4/mylz4.js",
        "./dbTypes.js",
        "./databass.js"
    );
}
else
    throw new Error("self.importScripts is undefined")

/*
cmd = [alert | log | warn | info | error | addBranch | addBranchArray | createTree | addTree | loading ...]
*/
function post(cmd, param, transfer) {
    if (typeof cmd == "object" && cmd.constructor.name == "Error")
        postMessage(cmd) //部分浏览器 不支持复制 Error
    else
        postMessage({ "cmd": cmd, "parameter": param }, transfer)
}

async function getArrBuf(file) {
    return new Promise(function(resolve, reject) {
        let fr = new FileReader();
        fr.onload = function() {
            resolve(fr.result)
        };
        fr.onerror = function() {
            reject("打开文件失败");
        };
        fr.readAsArrayBuffer(file);
    });
}

var recordDB = {
    map: new Map(),
    fileBuffer: new ArrayBuffer(0),
    listBuffer: new ArrayBuffer(0),
    get clear() {
        return function() {
            const fileBuffer = this.fileBuffer;
            const listBuffer = this.listBuffer;
            if (fileBuffer.uint8) fileBuffer.uint8 = undefined;
            if (fileBuffer.uint16) fileBuffer.uint16 = undefined;
            if (fileBuffer.uint32) fileBuffer.uint32 = undefined;
            if (listBuffer.uint8) listBuffer.uint8 = undefined;
            if (listBuffer.uint16) listBuffer.uint16 = undefined;
            if (listBuffer.uint32) listBuffer.uint32 = undefined;
        }
    },
    
    get(key) {
        const uint8 = this.fileBuffer.uint8;
        const keyStart = this.map.get(key.toString());
        if (keyStart > -1) {
            const numKeyBytes = uint8[keyStart] | uint8[keyStart + 1] << 8;
            const recordStart = keyStart + 2 + numKeyBytes;
            const numRecordBytes = uint8[recordStart] | uint8[recordStart + 1] << 8;
            return uint8.slice(recordStart + 2, recordStart + 2 + numRecordBytes);
        }
    }
    
    /*
    get search() {
        return function(key) { //search keyStart indexBytes
            const uint8 = this.fileBuffer.uint8;
            const list = this.listBuffer.uint32;
            const numCompareBytes = key.length;
            let lIndex = 0;
            let rIndex = list.length;
            let count = 0;
            while (lIndex <= rIndex && count++ < 0x20) {
                const mIndex = lIndex + ((rIndex - lIndex) >>> 1);
                const keyStart = list[mIndex];
                const diff = databaseKeyCompare(key, uint8.slice(keyStart, keyStart + numCompareBytes));
                if (diff == 0) return keyStart;
                else if (diff < 0) rIndex = mIndex - 1;
                else lIndex = mIndex + 1;
            }
            return -1;
        }
    },
    get(key) {
        const uint8 = this.fileBuffer.uint8;
        const keyStart = this.search(key);
        if (keyStart > -1) {
            const numKeyBytes = uint8[keyStart] | uint8[keyStart + 1] << 8;
            const recordStart = keyStart + 2 + numKeyBytes;
            const numRecordBytes = uint8[recordStart] | uint8[recordStart + 1] << 8;
            return uint8.slice(recordStart + 2, recordStart + 2 + numRecordBytes);
        }
    }
    */
};

function forEveryEmpty(posstion, callback) {
    for (let i = 0; i < 225; i++) {
        if (0 == posstion[i]) callback(i);
    }
}

function getBranchNodes({rule, boardWidth, boardHeight, sideToMove, posstion}) {
    let comment = new Uint8Array();
    let records = [];
    const sKey = constructDBKey(rule, boardWidth, boardHeight, sideToMove, posstion);
    //alert(sKey)
    const recordBuffer = recordDB.get(sKey);
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
        const recordBuffer = recordDB.get(sKey);
        if (recordBuffer) {
            const record = {idx: i, buffer: recordBuffer};
            records.push(record);
        }
    })
    return {
        comment: comment,
        records: records
    }
}

function outLoading(param) {
    const cmd = "loading";
    const parameter = param;
    post(cmd, parameter);
}

const CMD = {
    openDatabass: async function(file) {
        const cmd = "resolve";
        const parameter = await openDatabass(file, outLoading);
        post(cmd, parameter);
    },
    getBranchNodes: function(param) {
        const cmd = "resolve";
        const parameter = getBranchNodes(param);
        post(cmd, parameter);
    },
    close: function() {
        recordDB.map && recordDB.map.clear();
        recordDB.map = undefined;
        const cmd = "resolve";
        const parameter = undefined;
        post(cmd, parameter);
    }
}

onmessage = function(e) {
    if (e.data) {
        let cmd = e.data.cmd,
            param = e.data.parameter;
        typeof CMD[cmd] == "function" && CMD[cmd](param);
    }
}
