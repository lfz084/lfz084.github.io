// 在不让浏览器奔溃的情况下，申请尽可能的大的内存
'use strict';

//  利用 wasm 可以获得更多内存
let wasm_exports;
let memory;
async function loadWASM(url) {
    try {
        return fetch(url)
            .then(response => {
                //post("alert", `response = ${response}`);
                return response.arrayBuffer()
            })
            .then(bytes => {
                //post("alert", `WebAssembly.instantiate >> ${bytes}`);
                //通过浏览器提供的标准WebAssembly接口来编译和初始化一个Wasm模块
                return WebAssembly.instantiate(bytes);
            })
            .then(results => {
                //post("alert", `666`);
                wasm_exports = results.instance.exports;
                memory = wasm_exports.memory;
                //post("alert", memory.buffer.byteLength);
            });
    } catch (e) { post("alert", e.stack) }
}

function grow(pages = 100) {
    try {
        memory.grow(pages);
        return pages;
    }
    catch (err) {
        return 0;
    }
}

//return buffers
//buffer = {uint8, uint16, uint32}
function getBuffers(scl, freeBytes, ...byteBuffers) {
    try {
        const buf = freeBytes ? new Uint8Array(freeBytes) : null;
        
        const numByteBuffers = parseInt(scl * byteBuffers.reduce((a, c) => a + c, 0));
        const numGrowPages = byteBuffers.length + Math.max(0, parseInt((numByteBuffers - memory.buffer.byteLength) / (64 * 1024))) + 1;
        if (numGrowPages != grow(numGrowPages)) throw new Error("grow error");

        let start = 0;
        const buffers = byteBuffers.map(bytes => {
            const nBytes = parseInt(bytes * scl / 4) * 4;
            const uint8 = new Uint8Array(memory.buffer, start, nBytes);
            const uint16 = new Uint16Array(memory.buffer, start, nBytes / 2);
            const uint32 = new Uint32Array(memory.buffer, start, nBytes / 4);
            uint32.fill(0);
            start += nBytes + 64*1024;
            return { uint8, uint16, uint32 };
        })
        return buffers;
    }
    catch (e) {
        //post("alert",e.stack)
        return null;
    }
}

/*
//return buffers
//buffer = {uint8, uint16, uint32}
function getBuffers(scl, freeBytes, ...byteBuffers) {
    try {
        const buf = freeBytes ? new Uint8Array(freeBytes) : null;
        const buffers = byteBuffers.map(bytes => {
            const nBytes = parseInt(bytes * scl);
            const m = nBytes % 4;
            const buffer = new ArrayBuffer(nBytes - m);
            const uint8 = new Uint8Array(buffer);
            const uint16 = new Uint16Array(buffer);
            const uint32 = new Uint32Array(buffer);
            uint32.fill(0);
            return { uint8, uint16, uint32 };
        })
        return buffers;
    }
    catch (e) {
        //alert(e.stack)
        return null;
    }
}
*/

async function getMaxBuffes(scl = 1, freeBytes = 0, ...byteBuffers) {
    return new Promise((resolve, reject) => {
        function max(scl, freeBytes, ...byteBuffers) {
            const buffers = getBuffers(scl, freeBytes, ...byteBuffers);
            scl -= 0.1;
            if (buffers) resolve(buffers);
            else if (scl > 0) setTimeout(() => max(scl, freeBytes, ...byteBuffers), 0);
            else reject(`浏览器申请内存失败,请关闭后台应用、刷新网页，再试一下`);
        }
        max(scl, freeBytes, ...byteBuffers);
    });
}
