"use strict";

/// DBLabel represents a one-byte tag that attached to a node in the game DAG.
const LABEL_NULL = 0; /// Null record, default constructed, only stores key in database
const LABEL_NONE = 0xFF //c++ = -1; /// Undetermined result

const LABEL_RESULT_MARKS_BEGIN = 32;

const LABEL_FORCEMOVE = '!'.charCodeAt(); /// the forced move (will be used as root move if exist)
const LABEL_WIN = 'w'.charCodeAt(); /// a winning position
const LABEL_LOSE = 'l'.charCodeAt(); /// a losing position
const LABEL_DRAW = 'd'.charCodeAt(); /// a draw position
const LABEL_BLOCKMOVE = 'x'.charCodeAt(); /// a blocked position (will not be considered in search)

const LABEL_RESULT_MARKS_END = 127;

class CompactDBKey {
    constructor(rule, boardWidth, boardHeight, sideToMove, numBlackStones, numWhiteStones, stones) {
        this.uint8 = new Uint8Array([rule, boardWidth, boardHeight, sideToMove, numBlackStones, numWhiteStones].concat(...stones)); //(stones.length + 6);
    }

    get rule() { return this.uint8[0] };
    get boardWidth() { return this.uint8[1] };
    get boardHeight() { return this.uint8[2] };
    get sideToMove() { return this.uint8[3] };
    get numBlackStones() { return this.uint8[4] };
    get numWhiteStones() { return this.uint8[5] };

    set rule(r) { this.uint8[0] = r };
    set boardWidth(w) { this.uint8[1] = w };
    set boardHeight(h) { this.uint8[2] = h };
    set sideToMove(s) { this.uint8[3] = s };
    set numBlackStones(b) { this.uint8[4] = b };
    set numWhiteStones(w) { this.uint8[5] = w };

    static isEqual(key1, key2) {

    }

    static toStringKey(key) {
        return String.fromCharCode(...key.uint8);
    }
}

CompactDBKey.prototype.blackStonesBegin = function() { return 6 };
CompactDBKey.prototype.blackStonesEnd = function() { return 6 + this.uint8[4] };
CompactDBKey.prototype.whiteStonesBegin = function() { return 6 + this.uint8[4] };
CompactDBKey.prototype.whiteStonesEnd = function() { return 6 + this.uint8[4] + this.uint8[5] };

/*
class DBKey extends CompactDBKey{
    constructor(rule, boardWidth, boardHeight, sideToMove, numBlackStones, numWhiteStones, stones) {
        super(rule, boardWidth, boardHeight, sideToMove, numBlackStones, numWhiteStones, stones);
    }
}
*/





/// DBRecordMask specify what parts of a record are selected.
const RECORD_MASK_NONE = 0x0;
const RECORD_MASK_LABEL = 0x1;
const RECORD_MASK_VALUE = 0x2;
const RECORD_MASK_DEPTHBOUND = 0x4;
const RECORD_MASK_TEXT = 0x8;

const RECORD_MASK_LVDB = RECORD_MASK_LABEL | RECORD_MASK_VALUE | RECORD_MASK_DEPTHBOUND;
const RECORD_MASK_ALL = RECORD_MASK_LVDB | RECORD_MASK_TEXT;

//this.label      // label ('l' or 'w' or '\0', 1 byte)
//this.value      // value (int16, 2 bytes, optional)
//this.depthbound // depth & bound (int16, 2 bytes, optional)
//this.text       // utf-8 text message (string ending with '\0', (n3 - 5) bytes, optional)

class DBRecord {
    constructor(buf, encoding) {
        this.uint8 = new Uint8Array(buf)
    }

    get label() { return this.uint8[0] }
    get value() { return this.uint8[1] | this.uint8[2] << 8 }
    get depthbound() { return this.uint8[3] | this.uint8[4] << 8 }
    get text() { return this.uint8.slice(5) }

    /// Return the depth component of a depth bound.
    get depth() { return this.depthbound >> 2 }
    /// Return the bound component of a depth bound.
    get bound() { return this.depthbound & 0b11 }

    set depthbound(depthbound) {
        this.uint8[3] = depthbound;
        this.uint8[4] = depthbound >>> 8;
    }

    set text(codebuf) {
        this.uint8 = new Uint8Array([this.uint8.slice(0, 5)].concat(...codebuf));
    }
}

/// Set a new depth and bound for this record.
DBRecord.prototype.setDepthBound = function(depth, bound) {
    const depthbound = depth << 2 | bound;
    this.uint8[3] = depthbound;
    this.uint8[4] = depthbound >>> 8;
    return depthbound;
}


/// Checks if this record is a null record
DBRecord.prototype.isNull = function() {
    return this.label == LABEL_NULL;
}

/// Update label, value, depth, bound of this record
DBRecord.prototype.update = function(rhs, mask) {
    if (mask & RECORD_MASK_LABEL)
        this.label = rhs.label;
    if (mask & RECORD_MASK_VALUE)
        this.value = rhs.value;
    if (mask & RECORD_MASK_DEPTHBOUND)
        this.depthbound = rhs.depthbound;
    if (mask & RECORD_MASK_TEXT) {
        this.text = rhs.text;
        // Make sure text is not saved as null label
        if (this.label == LABEL_NULL && !text.empty())
            this.label = LABEL_NONE;
    }
}
