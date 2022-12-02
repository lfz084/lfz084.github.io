(function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    try {
        let count = 0,
            max = 0,
            min = 0xFFFFFFFF,
            gbkDecoder = new TextDecoder("GBK"),
            utf8Decoder = new TextDecoder(),
            encoder = new TextEncoder(),
            GBK2Unicode = new Uint16Array(0xFFFF).fill(-1),
            Unicode2GBK = new Uint16Array(0xFFFF).fill(-1),
            uint8 = new Uint8Array(2);
        const DECODER = {
            GBK: gbkDecoder,
            GB2312: gbkDecoder,
            GB18030: gbkDecoder,
            "UTF-8": utf8Decoder
        }

        function newChar(i, j) {
            uint8[0] = i;
            uint8[1] = j;
            let char = gbkDecoder.decode(uint8),
                p = char.codePointAt();
            GBK2Unicode[(i << 8) + j] = p;
            Unicode2GBK[p] = (i << 8) + j;
            max < p && (max = p);
            min > p && (min = p);
            count++
        }
        for (let i = 0; i <= 127; i++) { //128
            GBK2Unicode[i] = Unicode2GBK[i] = i;
        }
        //846
        for (let i = 0xA1; i <= 0xA9; i++) { //9
            for (let j = 0xA1; j <= 0xFE; j++) { //94
                newChar(i, j)
            }
        }
        //6768
        for (let i = 0xB0; i <= 0xF7; i++) { //72
            for (let j = 0xA1; j <= 0xFE; j++) { //94
                newChar(i, j)
            }
        }
        //6080
        for (let i = 0x81; i <= 0xA0; i++) { //32
            for (let j = 0x40; j <= 0xFE; j++) { //190
                if (j != 0x7F) {
                    newChar(i, j)
                }
            }
        }
        //192
        for (let i = 0xA8; i <= 0xA9; i++) { //2
            for (let j = 0x40; j <= 0xA0; j++) { //96
                if (j != 0x7F) {
                    newChar(i, j)
                }
            }
        }
        //8160
        for (let i = 0xAA; i <= 0xFE; i++) { //85
            for (let j = 0x40; j <= 0xA0; j++) { //96
                if (j != 0x7F) {
                    newChar(i, j)
                }
            }
        }
        console.log(`max = ${max}\nmin = ${min}\ncount = ${count}`)

        //U+ 0000 ~ U+ 007F: 0X XXXXXX
        //U+ 0080 ~ U+ 07FF: 110 XXXXX 10 XXXXXX
        //U+ 0800 ~ U+ FFFF: 1110 XXXX 10 XXXXXX 10 XXXXXX
        //U+10000 ~ U+1FFFF: 11110 XXX 10 XXXXXX 10 XXXXXX 10 XXXXXX
        function codePointToUTF8CodePoint(uCode) {
            if (uCode < 0x0080)
                return uCode;
            else if (uCode < 0x0800)
                return 0xC080 | (uCode & 0x07C0) << 2 | (uCode & 0x3F);
            else if (uCode < 0x10000)
                return 0xE08080 | (uCode & 0xF000) << 4 | (uCode & 0x0FC0) << 2 | (uCode & 0x3F);
            else
                return 0xF0808080 | (uCode & 0x1C0000) << 6 | (uCode & 0x03F000) << 4 | (uCode & 0x0FC0) << 2 | (uCode & 0x3F);
        }

        function utf8CodePointToCodePoint(u8Code) {
            if (u8Code < 0x0080)
                return u8Code;
            else if (u8Code < 0xE08080)
                return (u8Code & 0x1F00) >>> 2 | (u8Code & 0x3F);
            else if (u8Code < 0xF0808080)
                return (u8Code & 0x0F0000) >>> 4 | (u8Code & 0x3F00) >>> 2 | (u8Code & 0x3F);
            else
                return (u8Code & 0x07000000) >> 6 | (u8Code & 0x3F0000) >>> 4 | (u8Code & 0x3F00) >>> 2 | (u8Code & 0x3F);
        }

        function utf8CodePointToGBKCodePoint(u8Code) {
            return Unicode2GBK[utf8CodePointToCodePoint(u8Code)];
        }

        function gbkCodePointToUTF8CodePoint(gbkCode) {
            return codePointToUTF8CodePoint(GBK2Unicode[gbkCode]);
        }

        function putUTF8Buffer(gbkBuffer, gStart, gEnd, utf8Buffer, uStart) {
            let start = uStart;
            while (gStart < gEnd) {
                let gCode = gbkBuffer[gStart++];
                if (gCode < 0x0080) {
                    utf8Buffer[uStart++] = gCode;
                }
                else {
                    gCode = gCode << 8 | gbkBuffer[gStart++];
                    let uCode = gbkCodePointToUTF8CodePoint(gCode);
                    if (uCode < 0xE08080) {
                        utf8Buffer[uStart++] = uCode >> 8 & 0xFF;
                        utf8Buffer[uStart++] = uCode & 0xFF;
                    }
                    else if (uCode < 0xF0808080) {
                        utf8Buffer[uStart++] = uCode >> 16 & 0xFF;
                        utf8Buffer[uStart++] = uCode >> 8 & 0xFF;
                        utf8Buffer[uStart++] = uCode & 0xFF;
                    }
                    else {
                        utf8Buffer[uStart++] = uCode >> 24 & 0xFF;
                        utf8Buffer[uStart++] = uCode >> 16 & 0xFF;
                        utf8Buffer[uStart++] = uCode >> 8 & 0xFF;
                        utf8Buffer[uStart++] = uCode & 0xFF;
                    }
                }
            }
            return uStart - start;
        }

        function putGBKBuffer(utf8Buffer, uStart, uEnd, gbkBuffer, gStart) {
            let start = gStart;
            while (uStart < uEnd) {
                let uCode = utf8Buffer[uStart++];
                if (uCode < 0x0080) {
                    gbkBuffer[gStart++] = uCode;
                }
                else {
                    if (uCode < 0xE0) {
                        uCode = uCode << 8 | utf8Buffer[uStart++];
                    }
                    else if (uCode < 0xF0) {
                        uCode = uCode << 16 | utf8Buffer[uStart++] << 8 | utf8Buffer[uStart++];
                    }
                    else {
                        uCode = uCode << 24 | utf8Buffer[uStart++] << 16 | utf8Buffer[uStart++] << 8 | utf8Buffer[uStart++];
                    }
                    let gCode = utf8CodePointToGBKCodePoint(uCode);
                    gbkBuffer[gStart++] = gCode >> 8 & 0xFF;
                    gbkBuffer[gStart++] = gCode & 0xFF;
                }
            }
            return gStart - start;
        }

        function gbkBuffer2UTF8Buffer(gbkBuffer) {
            let tempBuffer = new Uint8Array(parseInt(gbkBuffer.length * 1.5)),
                len = putUTF8Buffer(gbkBuffer, 0, gbkBuffer.length, tempBuffer, 0);
            return new Uint8Array(tempBuffer.slice(0, len));
        }

        function utf8Buffer2GBKBuffer(utf8Buffer) {
            let tempBuffer = new Uint8Array(utf8Buffer.length),
                len = putGBKBuffer(utf8Buffer, 0, utf8Buffer.length, tempBuffer, 0);
            return new Uint8Array(tempBuffer.slice(0, len));
        }

        function decode(buffer, encoding = "utf-8") {
            encoding = encoding.toUpperCase();
            return (DECODER[encoding] || utf8Decoder).decode(buffer);
        }

        function encode(str, encoding = "utf-8") {
            let result = encoder.encode(str);
            switch (encoding.toUpperCase()) {
                case "GBK":
                case "GB2312":
                case "GB18030":
                    result = utf8Buffer2GBKBuffer(result);
                    break;
            }
            return result;
        }

        function string2Code(str, encoding) {
            const NEWCODE = {
                GBK: utf8CodePointToGBKCodePoint,
                GB2312: utf8CodePointToGBKCodePoint,
                GB18030: utf8CodePointToGBKCodePoint,
                UNICODE: utf8CodePointToCodePoint
            }
            let utf8Buffer = encoder.encode(str),
                uStart = 0,
                uEnd = utf8Buffer.length,
                codeArr = [];
            encoding = encoding.toUpperCase();
            while (uStart < uEnd) {
                let uCode = utf8Buffer[uStart++];
                if (uCode < 0x0080) {
                    codeArr.push(uCode);
                }
                else {
                    if (uCode < 0xE0) {
                        uCode = uCode << 8 | utf8Buffer[uStart++];
                    }
                    else if (uCode < 0xF0) {
                        uCode = uCode << 16 | utf8Buffer[uStart++] << 8 | utf8Buffer[uStart++];
                    }
                    else {
                        uCode = uCode << 24 | utf8Buffer[uStart++] << 16 | utf8Buffer[uStart++] << 8 | utf8Buffer[uStart++];
                    }
                    let code = (NEWCODE[encoding] || utf8CodePointToCodePoint)(uCode);
                    codeArr.push(code);
                }
            }
            return codeArr;
        }

        function code2String(codeArr, encoding) {
            const ISGBK = {
                GBK: true,
                GB2312: true,
                GB18030: true,
                UNICODE: false
            }
            let buffer = new Uint8Array(parseInt(codeArr.length * 4)),
                len = 0,
                start = 0,
                end = codeArr.length;
            encoding = encoding.toUpperCase();
            while (start < end) {
                let code = codeArr[start++];
                if (code < 0x0080) {
                    buffer[len++] = code;
                }
                else if (ISGBK[encoding]) {
                    buffer[len++] = code >> 8 & 0xFF;
                    buffer[len++] = code & 0xFF;
                }
                else if (code < 0x0800) {
                    buffer[len++] = 0xC0 | (code >> 6 & 0x1F);
                    buffer[len++] = 0x80 | (code & 0x3F);
                }
                else if (code < 0x10000) {
                    buffer[len++] = 0xE0 | (code >> 12 & 0x0F);
                    buffer[len++] = 0x80 | (code >> 6 & 0x3F);
                    buffer[len++] = 0x80 | (code & 0x3F);
                }
                else {
                    buffer[len++] = 0XF0 | (code >> 18 & 0x07);
                    buffer[len++] = 0x80 | (code >> 12 & 0x3F);
                    buffer[len++] = 0x80 | (code >> 6 & 0x3F);
                    buffer[len++] = 0x80 | (code & 0x3F);
                }
            }
            return decode(new Uint8Array(buffer.slice(0, len)), encoding);
        }
    
        function autoEncoding(buffer) {

        }

        exports.TextCoder = {
            decode: decode,
            encode: encode,
            string2Code: string2Code,
            code2String: code2String,
            autoEncoding: autoEncoding,
            putUTF8Buffer: putUTF8Buffer,
            putGBKBuffer: putGBKBuffer,
            gbkBuffer2UTF8Buffer: gbkBuffer2UTF8Buffer,
            utf8Buffer2GBKBuffer: utf8Buffer2GBKBuffer
        }
    }
    catch (e) { console.error(e.stack) }
})))
