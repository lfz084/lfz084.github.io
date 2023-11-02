(() => {
    "use strict";
    const d = document;
    const dw = d.documentElement.clientWidth;
    const dh = d.documentElement.clientHeight;

    const DBREAD_HELP = `DB阅读器使用技巧<br>1.点击棋子悔棋<br>2.双击棋子悔到双击的那一手<br>3.长按棋盘放大、缩小棋盘<br>4.棋谱注解乱码可以选择gbk以外的编码<br>5.棋谱规则和棋盘大小需要设置正确才能正常显示`

    //-----------------------------------------------------------------------

    const buttons = [];
    const buttonSettings = [
        {
            type: "button",
            text: "‖<<",
            touchend: async function() {
                game.toStart(true);
            }
        },
        {
            type: "button",
            text: "<<",
            touchend: async function() {
                game.toPrevious(true);
            }
        },
        {
            type: "button",
            text: ">>",
            touchend: async function() {
                game.toNext(true);
            }
        },
        {
            type: "button",
            text: ">>‖",
            touchend: async function() {
                game.toEnd(true);
            }
        },
        {
            type: "button",
            text: "↔180°",
            touchend: async function() {
                game.rotateY180();
            }
        },
        {
            type: "button",
            text: " ↗90°",
            touchend: async function() {
                game.rotate90();
            }
        },
        {
            type: "file",
            text: "打开文件",
            change: async function() {
                try {
                	mainUI.viewport.resize();
                	const file = this.files[0];
                    const path = this.value;
                    this.value = "";
                    const ratio = await game.openDatabass(file);
                    if (ratio > 0) {
                        log(getFileName(path));
                        game.toStart();
                        await game.showBranchNodes();
                    }
                    else log("");
                } catch (e) { alert(e.stack) }
            }
        },
        {
            type: "button",
            text: "保存图片",
            touchend: async function() {
                game.saveAsImage();
            }
        },
        {
            type: "button",
            text: "清空标记",
            touchend: async function() {
                game.cleLabel();
            }
        },
        {
            type: "button",
            text: "分享图片",
            touchend: async function() {
                share(cBoard);
            }
        },
        {
            type: "button",
            text: "下手为❶",
            touchend: async function() {
                game.resetNum(1);
            }
        },
        {
            type: "button",
            text: "输出代码",
            touchend: async function() {
                try {
                    game.outCode();
                } catch (e) { alert(e.stack) }
            }
        },

        {
            type: "button",
            text: "重置手数",
            touchend: async function() {
                game.resetNum(0);
            }
        },
        {
            type: "select",
            text: "renju",
            options: [2, "renju", 1, "standard", 0, "freestyle"],
            change: function() {
                game.rule = this.input.value;
                game.showBranchNodes();
            }
        },
        {
            type: "select",
            text: "15 路",
            options: [15, "15 路", 14, "14 路", 13, "13 路", 12, "12 路", 11, "11 路", 10, "10 路", 9, "9 路", 8, "8 路", 7, "7 路", 6, "6 路"],
            change: function() {
                game.boardSize = this.input.value;
                game.showBranchNodes();
            }
        },
        {
            type: "select",
            text: "gbk",
            options: [0, "gbk", 1, "big5", 2, "utf-8"],
            change: function() {
                const encoding = ["gbk", "big5", "utf-8"];
                textDecoder = new TextDecoder(encoding[this.input.value]);
                game.showBranchNodes();
            }
        }
    ];

    buttonSettings.splice(0, 0, createLogDiv(), null, null, null);
    buttonSettings.splice(8, 0, createCommentDiv(), null);
    buttonSettings.splice(12, 0, null, null);
    buttonSettings.splice(16, 0, null, null);
    buttonSettings.splice(20, 0, null, null);
    buttonSettings.splice(24, 0, null, null);
    buttonSettings.splice(28, 0, null, null);
    buttonSettings.splice(32, 0, null, null);
    //dw > dh && buttonSettings.splice(0, 0, null, null, null, null);

    function $(id) { return document.getElementById(id) };

    function log(text) { $("log").innerText = text }

    function createLogDiv() {
        return mainUI.newLabel({
            id: "log",
            type: "div",
            width: mainUI.cmdWidth - mainUI.cmdPadding * 2,
            height: mainUI.buttonHeight,
            style: {
                fontSize: `${mainUI.buttonHeight / 1.8}px`,
                textAlign: "center",
                lineHeight: `${mainUI.buttonHeight}px`
            }
        })
    }

    function createCommentDiv() {
        const fontSize = mainUI.cmdWidth / 28;
        return mainUI.newComment({
            id: "comment",
            type: "div",
            width: mainUI.buttonWidth * 2.33,
            height: mainUI.buttonHeight * 8.5,
            style: {
            	posstion: "absolute",
        		fontSize: `${fontSize}px`,
            	wordBreak: "break-all",
            	overflowY: "auto",
            	borderStyle: "solid",
            	borderWidth: `${fontSize / 20}px`,
            	borderColor: "black",
            	background: "white",
            	padding: `${fontSize/2}px ${fontSize/2}px ${fontSize/2}px ${fontSize/2}px`
            }
        })
    }

    function createCmdDiv() {
        const cDiv = mainUI.createCmdDiv();
        buttons.push(...mainUI.createButtons(buttonSettings));
        mainUI.addButtons(buttons, cDiv, 0);
        return cDiv;
    }

    const cBoard = mainUI.createCBoard();
    const cmdDiv = createCmdDiv();

    function getFileName(path) {
        let temp = path.split(".");
        //temp.pop();
        temp = temp.join(".");
        return temp.split("\\").pop();
    }

    //------------------------ 

    let textDecoder = new TextDecoder("gbk");
    let output = "";


    /*
    if (record.label > 0) {
        displayLabel.push_back(record.label);
    
        if (record.label == LABEL_WIN || record.label == LABEL_LOSE) {
            Value mateValue = Value(-record.value);
            if (record.label == LABEL_WIN && mateValue > VALUE_MATE_IN_MAX_PLY ||
                record.label == LABEL_LOSE && mateValue < VALUE_MATED_IN_MAX_PLY)
                displayLabel += std::to_string(mate_step(mateValue, -1));
            else
                displayLabel.push_back('*');
        }
    }
    else if (record.label == LABEL_NONE && record.bound() == BOUND_EXACT) {
        float winRate = Config::valueToWinRate(Value(-record.value));
        int winRateLabel = std::clamp(int(winRate * 100), 0, 99);
    
        displayLabel = std::to_string(winRateLabel);
        displayLabel.push_back('%');
    }
    
    
    i
    

*/
    function Uint16ToInt16(value) {
        return value & 0x8000 ? value - 0x10000: value;
    }

    function clamp(min, v, max) {
        return v < min ? min : v > max ? max : v;
    }

    function valueToWinRate(v) {
        if (v >= Value.VALUE_MATE_IN_MAX_PLY)
            return 1;
        if (v <= Value.VALUE_MATED_IN_MAX_PLY)
            return 0;
        return 1 / (1 + Math.exp(-v * (1 / 200)));
    }

    /// Get number of steps to mate from value and current ply
    function mate_step(v, ply) {
        return Value.VALUE_MATE - ply - (v < 0 ? -v : v);
    }

    function readLabel(buffer) {
        const record = new DBRecord(buffer);
        const label = record.label;
        const value = Uint16ToInt16(record.value);
        let sLabel = "";
        if (0 < label && label < 0xFF) {
            sLabel += String.fromCharCode(label);
            if (label == LABEL_WIN || label == LABEL_LOSE) {
                const mateValue = -value;
                if (label == LABEL_WIN && mateValue > Value.VALUE_MATE_IN_MAX_PLY ||
                    label == LABEL_LOSE && mateValue < Value.VALUE_MATED_IN_MAX_PLY)
                    sLabel += mate_step(mateValue, -1).toString();
                else
                    sLabel += '*';
            }
            sLabel.length < 3 && (sLabel = "  ".slice(0,3 - sLabel.length) + sLabel);
        }
        else if (label == LABEL_NONE && record.bound == 0b11) {
            const winRate = valueToWinRate(-value);
            const winRateLabel = parseInt(clamp(0, winRate * 100, 99)).toString();
            sLabel = `${"  ".slice(0,2 - winRateLabel.length)}${winRateLabel}%`;
        }
        else {
            sLabel = [EMOJI_ROUND_BLACK, EMOJI_ROUND][game.sideToMove];
        }
        output += `${sLabel}: ${label}, ${value}, ${record.depth}, ${record.bound}\n`
        return sLabel.toLocaleUpperCase();
    }

    async function inputText(initStr = "") {
        let w = cBoard.width * 0.8;
        let h = w;
        let l = (dw - w) / 2;
        let t = (dh - dw) / 4;
        t = t < 0 ? 1 : t;
        return (await msg({
            text: initStr,
            type: "input",
            left: l,
            top: t,
            width: w,
            height: h,
            butNum: 1,
            lineNum: 10
        })).inputStr
    }

    //------------------------ 


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

    const game = {
        rule: Rule.RENJU,
        cBoard: cBoard,

        toStart: function(isShowNum) {
            cBoard.toStart(isShowNum);
        },
        toPrevious: function(isShowNum, timeout = 0) {
            cBoard.toPrevious(isShowNum, timeout);
            cBoard.MS[cBoard.MSindex] == 225 && cBoard.toPrevious(isShowNum, timeout);
        },
        toNext: function(isShowNum, timeout = 0) {
            cBoard.toNext(isShowNum, timeout);
            cBoard.MS[cBoard.MSindex] == 225 && cBoard.toNext(isShowNum, timeout);
        },
        toEnd: function(isShowNum) {
            cBoard.toEnd(isShowNum);
        },
        rotate90: function(isShowNum) {
            cBoard.rotate90();
        },
        rotateY180: function(isShowNum) {
            cBoard.rotateY180();
        },
        cleLabel: function() {
            cBoard.cleLb("all");
        },
        resetNum: function(i) {
            const num = i ? cBoard.MSindex + 1 : 0;
            cBoard.setResetNum(num);
        },
        saveAsImage: function() {
            cBoard.saveAsImage();
        },
        outCode: function() {
            const code = cBoard.getCode().split(/{}/).join("");
            inputText(code);
        },
        scaleBoard: function() {
            const scale = cBoard.scale != 1 ? 1 : 2;
            cBoard.setScale(scale, true);
        },
        ctnBack: function(idx) { // 触发快速悔棋
            if (idx + 1 && cBoard.P[idx].type == TYPE_NUMBER) {
                if (idx != cBoard.MS[cBoard.MSindex]) {
                    while (cBoard.MS[cBoard.MSindex] != idx) {
                        cBoard.cleNb(cBoard.MS[cBoard.MSindex], true);
                    }
                }
            }
        },
        openDatabass: async function(file) {
            const ratio = await DBClient.openDatabass(file, v => {
                if (typeof v == "number") {
                    if (v <= 1) log(`${~~(v * 10000)/100}%`);
                    else if (v >= (1024 * 1024 * 1024)) {
                        log(`正在解压 ${parseInt(v / (1024 * 1024 * 1024) * 100) / 100}GB`);
                    }
                    else if (v >= 2 * (1024 * 1024)) {
                        log(`正在解压 ${parseInt(v / (1024 * 1024) * 100) / 100}MB`);
                    }
                }
                else if (typeof v == "string") log(v);
            });
            if (ratio < 1) alert(`浏览器内存不足，只打开了${parseInt(ratio*10000)/100}%棋谱`);
            return ratio;
        },
        showBranchNodes: async function() {
            try {
                const info = await DBClient.getBranchNodes({
                    rule: game.rule,
                    boardWidth: game.boardWidth,
                    boardHeight: game.boardHeight,
                    sideToMove: game.sideToMove,
                    posstion: cBoard.getArray()
                });
                //alert(info.comment)
                if (!isEqual(info.posstion, cBoard.getArray())) return;
                if (info.comment) {
                    const text = textDecoder.decode(info.comment);
                    $("comment").innerHTML = text || DBREAD_HELP;
                }
                else $("comment").innerHTML = DBREAD_HELP;
                cBoard.cleLb("all");
                output = "";
                //alert(info.records);
                info.records.map(record => {
                    const label = readLabel(record.buffer);
                    cBoard.wLb(record.idx, label, "black");
                })
                game.rule == Rule.RENJU && game.sideToMove == 0 && info.posstion.map((v,i) => {
                    if (v == 0 && ("isFoul" in self) && isFoul(i, info.posstion)) {
                        cBoard.wLb(i, EMOJI_FOUL, "red");
                    }
                })
                //inputText(output);
            } catch (e) { alert(e.stack) }
        },

        get boardWidth() {
            return cBoard.SLTX;
        },
        get boardHeight() {
            return cBoard.SLTY;
        },
        get sideToMove() {
            return (cBoard.MSindex + 1) % 2;
        },
        get numBlackStones() {
            let count = 0;
            for (let i = 0; i <= cBoard.MSindex; i += 2) {
                if (cBoard.MS[i] >= 0) count++
            }
            return count;
        },
        get numWhiteStones() {
            let count = 0;
            for (let i = 1; i <= cBoard.MSindex; i += 2) {
                if (cBoard.MS[i] >= 0) count++
            }
            return count;
        },

        set boardSize(size) {
            cBoard.setSize(size);
        },
    }
    
    function isEqual(arr1, arr2) {
        for (let i = 0; i < arr1.length; i++) {
            for (let j = 0; j < arr1[i].length; j++) {
                if (arr1[i][j] != arr2[i][j])
                    return false;
            }
        }
        return true;
    }

    //------------------------ 

    function getButton(type, text) {
        return buttons.filter(but => but && but.type == type && but.text == text)[0];
    }

    //------------------------ Events ---------------------------

    game.cBoard.stonechange = function() { game.showBranchNodes() };

    function addEvents() {
        bindEvent.setBodyDiv(mainUI.bodyDiv, mainUI.bodyScale, mainUI.upDiv);
        bindEvent.addEventListener(game.cBoard.viewBox, "click", (x, y, type) => {
            const idx = game.cBoard.getIndex(x, y);
            if (game.cBoard.P[idx].type == TYPE_NUMBER) {
                game.toPrevious(true); //点击棋子，触发悔棋
            }
            else if (game.cBoard.P[idx].type == TYPE_EMPTY || game.cBoard.P[idx].type == TYPE_MARK) {
                game.cBoard.wNb(idx, "auto", true); // 添加棋子
            }
        })
        bindEvent.addEventListener(game.cBoard.viewBox, "dblclick", (x, y) => {
            const idx = game.cBoard.getIndex(x, y);
            game.ctnBack(idx);
        })
        bindEvent.addEventListener(game.cBoard.viewBox, "contextmenu", (x, y) => {
            game.scaleBoard();
        })
        /*
        bindEvent.addEventListener(game.cBoard.viewBox, "dbltouchstart", (x, y) => {
            
        })
        bindEvent.addEventListener(game.cBoard.viewBox, "zoomstart", (x1, y1, x2, y2) => {
            
        })
        */
    }

    addEventListener("load", () => {
        try {
            addEvents();
            mainUI.loadTheme();
            mainUI.viewport.scrollTop();
            log("你可以打开Rapfi保存的db棋谱")
        } catch (e) { alert(e.stack) }
    })
})()
