if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["String2Buffer"] = "v2015.02";
(function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    'use strict';
    //string to UTF-8LE
    function String2Buffer(str) {
        let codePoints = [],
            buffer = [];
        for (let i = 0; i < str.length; i++) {
            let codePoint = str.codePointAt(i);
            if (codePoint < 0x80) {
                buffer.push(codePoint);
                //console.log(`${codePoint}>>1`)
            }
            else if (codePoint < 0x0800) {
                buffer.push((codePoint >> 6) & 0x1f | 0xc0);
                buffer.push(codePoint & 0x3f | 0x80);
                //console.log(`${codePoint}>>2`)
            }
            else if (codePoint < 0x10000) {
                buffer.push((codePoint >> 12) & 0x0f | 0xe0);
                buffer.push((codePoint >> 6) & 0x3f | 0x80);
                buffer.push(codePoint & 0x3f | 0x80);
                //console.log(`${codePoint}>>3`)
            }
            else {
                buffer.push((codePoint >> 18) & 0x07 | 0xf0);
                buffer.push((codePoint >> 12) & 0x3f | 0x80);
                buffer.push((codePoint >> 6) & 0x3f | 0x80);
                buffer.push(codePoint & 0x3f | 0x80);
                //console.log(`${codePoint}>>4`)
            }
        }
        buffer.push(0, 0);
        return buffer;
    }

    //UTF-8LE to string
    function Buffer2String(buffer) {
        let i = 0,
            str = "";
        while (buffer[i]) {
            if (buffer[i] < 0x80) {
                str += String.fromCodePoint(buffer[i]);
                i += 1;
            }
            else if (buffer[i] < 0xe0) {
                str += String.fromCodePoint((buffer[i] & 0x1f) << 6 | (buffer[i + 1] & 0x3f));
                i += 2;
            }
            else if (buffer[i] < 0xf0) {
                str += String.fromCodePoint((buffer[i] & 0x0f) << 12 | (buffer[i + 1] & 0x3f) << 6 | (buffer[i + 2] & 0x3f));
                i += 3;
            }
            else {
                str += String.fromCodePoint((buffer[i] & 0x07) << 18 | (buffer[i + 1] & 0x3f) << 12 | (buffer[i + 2] & 0x3f) << 6 | (buffer[i + 3] & 0x3f));
                i += 4;
            }
        }
        return str;
    }
    exports.String2Buffer = String2Buffer;
    exports.Buffer2String = Buffer2String;
})))
