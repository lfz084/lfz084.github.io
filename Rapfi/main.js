(() => {
    "use strict";
    const d = document;
    const dw = d.documentElement.clientWidth;
    const dh = d.documentElement.clientHeight;

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
            type: "file",
            text: "打开文件",
            change: async function() {
                try {
                    const file = this.files[0];
                    const path = this.value;
                    this.value = "";
                    await openDatabass(file, v => { log(`${~~(v * 10000)/100}%`) });
                    log(getFileName(path));
                    game.toStart();
                    game.showBranchNodes();
                } catch (e) { alert(e.stack) }
            }
        },
        {
            type: "select",
            text: "renju",
            options: [2, "renju", 1, "standard", 0, "freestyle"],
            change: function() {
                game.rule = this.input.value;
            }
        },
        {
            type: "select",
            text: "gbk",
            options: [0, "gbk", 1, "big5", 2, "utf-8"],
            change: function() {
                textDecoder = new TextDecoder(options[this.input.value * 2 + 1]);
            }
        },
        {
            type: "select",
            text: "15 路",
            options: [15, "15 路", 14, "14 路", 13, "13 路", 12, "12 路", 11, "11 路", 10, "10 路", 9, "9 路", 8, "8 路", 7, "7 路", 6, "6 路"],
            change: function() {
                game.boardSize = this.input.value;
            }
        }
    ];

    buttonSettings.splice(0, 0, createLogDiv(), null, null, null);
    //dw > dh && buttonSettings.splice(0, 0, null, null, null, null);

    function log(text) { document.getElementById("log").innerText = text }

    function createLogDiv() {
        return mainUI.createLogDiv({
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

    function resetEXWindow() {
        try {
            const but = buttons[8];
            const FONT_SIZE = parseInt(cmdDiv.style.width) / 28;
            const EX_WINDOW_LEFT = parseInt(but.left);
            const EX_WINDOW_TOP = parseInt(but.top);
            const EX_WINDOW_WIDTH = parseInt(but.width) * 5;
            const EX_WINDOW_HEIGHT = parseInt(cmdDiv.style.height) - parseInt(but.top);
            const EX_PARENTNODE = cmdDiv;

            window.exWindow.setStyle(EX_WINDOW_LEFT, EX_WINDOW_TOP, EX_WINDOW_WIDTH, EX_WINDOW_HEIGHT, FONT_SIZE, EX_PARENTNODE);
            //window.exWindow.innerHTML = "test,jjkkk";
            //window.exWindow.open();
        } catch (e) { alert(e.stack) }
    }

    //------------------------ 

    let textDecoder = new TextDecoder("gbk");

    function readLabel(label) {
        let nLabel = "";
        if (label > LABEL_RESULT_MARKS_BEGIN && label < LABEL_RESULT_MARKS_END)
            nLabel = String.fromCharCode(label);
        else
            nLabel = [EMOJI_ROUND_BLACK, EMOJI_ROUND][game.sideToMove];
        return nLabel.toLocaleUpperCase();
    }

    //------------------------ 

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
        ctnBack: function(idx) { // 触发快速悔棋
            if (idx + 1 && cBoard.P[idx].type == TYPE_NUMBER) {
                if (idx != cBoard.MS[cBoard.MSindex]) {
                    while (cBoard.MS[cBoard.MSindex] != idx) {
                        cBoard.cleNb(cBoard.MS[cBoard.MSindex], true);
                    }
                }
            }
        },
        showBranchNodes: function() {
            try {
                const info = getBranchNodes(game.rule, game.boardWidth, game.boardHeight, game.sideToMove, cBoard.getArray());
                if (info.comment) {
                    const text = textDecoder.decode(info.comment);
                    exWindow.innerHTML = text;
                    text && exWindow.open();
                }
                cBoard.cleLb("all");
                info.records.map(record => {
                    const label = readLabel(record.label);
                    cBoard.wLb(record.idx, label, "black");
                })
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

    //------------------------ 

    function getButton(type, text) {
        return buttons.filter(but => but && but.type == type && but.text == text)[0];
    }

    //------------------------ Events ---------------------------

    game.cBoard.stonechange = function() { game.showBranchNodes() };

    function addEvents() {
        bindEvent.setBodyDiv(mainUI.bodyDiv, mainUI.bodyScale);
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
        /*
        bindEvent.addEventListener(game.cBoard.viewBox, "dbltouchstart", (x, y) => {
            
        })
        bindEvent.addEventListener(game.cBoard.viewBox, "contextmenu", (x, y) => {
            
        })
        bindEvent.addEventListener(game.cBoard.viewBox, "zoomstart", (x1, y1, x2, y2) => {
            
        })
        */
    }

    addEventListener("load", () => {
        try {
            addEvents();
            resetEXWindow();
            mainUI.viewport.resize();
            log("你可以打开rapfi保存的db棋谱")
        } catch (e) { alert(e.stack) }
    })
})()
