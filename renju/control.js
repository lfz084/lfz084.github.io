if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["control"] = "v2109.08";
window.control = (() => {
    "use strict";
    const TEST_CONTROL = true;

    function log(param, type = "log") {
        const print = console[type] || console.log;
        TEST_CONTROL && window.DEBUG && print(`[control.js]\n>>  ${ param}`);
    }

    //--------------------------------------------------------------

    const MODE_RENJU = 0;
    const MODE_LOADIMG = 1;
    const MODE_LINE_EDIT = 2;
    const MODE_ARROW_EDIT = 3;
    const MODE_READ_TREE = 4;
    const MODE_READ_THREEPOINT = 5;
    const MODE_READ_FOULPOINT = 6;
    const MODE_RENLIB = 7;
    const MODE_READLIB = 8;
    const MODE_EDITLIB = 9;
    const MODE_RENJU_FREE = 10;

    let cBd,
        engine,
        msg,
        closeMsg,
        appData,
        dw,
        dh;

    let playMode = MODE_RENJU;
    //let oldPlayMode = playMode;
    const lbColor = [
        { "colName": "黑色标记", "color": "black" },
        { "colName": "红色标记", "color": "red" },
        { "colName": "蓝色标记", "color": "#3333ff" },
        { "colName": "绿色标记", "color": "#008000" },
        { "colName": "卡其标记", "color": "#ff8c00" },
        { "colName": "紫色标记", "color": "#ff00ff" },
        { "colName": "暗灰标记", "color": "#483D8B" },
        { "colName": "暗绿标记", "color": "#556B2F" },
        ];
    let continueLabel = ["标记1", "标记2", "标记3", "标记4", "标记5"],
        parentNode,
        renjuCmddiv = null,
        renjuCmdSettings = { positions: [], defaultButtons: [], ButtonsIdx: [], idx: 0 },
        imgCmdDiv = null,
        imgCmdSettings = { positions: [], defaultButtons: [], ButtonsIdx: [], idx: 0 },
        onLoadCmdSettings = function() {},
        scaleCBoard = function() {},
        setShowNum = function() {},
        getShowNum = function() {},
        editButtons = function() {},

        blackwhiteRadioChecked = function() {},
        markRadioChecked = function() {},
        autoblackwhiteRadioChecked = function() {},

        cMenu = null,

        cLockImg = null,
        cPutBoard = null,
        cAutoPut = null,
        cCleAll = null,
        cShownum = null,
        cNewGame = null,
        cLocknum = null,
        cAutoadd = null,
        cAddblack = null,
        cAddwhite = null,
        cAddblack2 = null,
        cAddwhite2 = null,
        cLba = null,
        cLbb = null,
        cLbc = null,
        cLbd = null,
        cLbColor = null,
        cBack = null,
        cResetnum = null,
        cReset = null,
        cNextone = null,
        cInputcode = null,
        cOutputcode = null,
        cStart = null,
        cEnd = null,
        cPrevious = null,
        cNext = null,
        cFlipX = null,
        cFlipY = null,
        cCW = null,
        cCCW = null,
        cLABC = null,
        cMoveL = null,
        cMoveR = null,
        cMoveT = null,
        cMoveB = null,
        cCutImage = null,
        cSelBlack = null,
        cSelWhite = null,
        cMode = null,
        cFindPoint = null,
        cFindVCF = null,
        cCancelFind = null,
        cLoadImg = null,
        cSLTX = null,
        cSLTY = null,
        cShare = null,
        cShareWhite = null,
        cCleLb = null,
        cHelp = null,
        cLeft = null,
        cRight = null,
        cUp = null,
        cDown = null,
        cRotate90 = null,
        cTotate180 = null,
        cPutMiniBoard = null,
        cCleMiniBoard = null,
        cZoomIn = null,
        cZoomOut = null,
        miniBoard;

    /*------ 添加定位标记 ------*/
    const setTop = (() => {
        let topMark = document.createElement("div");
        document.body.appendChild(topMark);
        topMark.setAttribute("id", "top");

        return (top) => {
            let s = topMark.style;
            s.position = "absolute";
            s.top = top + "px";
            s.zIndex = -100;
        }
    })();


    const lbTime = new function() {
        this.div = document.createElement("div");
        this.startTime = 0;
        this.timer = null;

        this.move = function(left, top, width, height, fontSize) {
            renjuCmddiv.appendChild(this.div);
            this.startTime = new Date().getTime();
            this.div.style.position = "absolute";
            this.div.style.left = left + "px";
            this.div.style.top = top + "px";
            this.div.style.height = parseInt(height) + "px";
            this.div.style.width = parseInt(width) + "px";
            this.div.style.fontFamily = "mHeiTi";
            this.div.style.fontSize = fontSize;
            this.div.style.textAlign = "center";
            this.div.style.lineHeight = height;
            this.div.style.color = "#cccccc";

            this.div.innerHTML = "00:00:00"
            let lbDiv = this.div;
            let sTime = this.startTime;
            this.timer = setInterval(function() {
                let t = new Date().getTime();
                t -= sTime;
                let h = ~~(t / 3600000);
                h = h < 10 ? "0" + h : h;
                let m = ~~((t % 3600000) / 60000);
                m = m < 10 ? "0" + m : m;
                let s = ~~((t % 60000) / 1000);
                s = s < 10 ? "0" + s : s;
                lbDiv.innerHTML = `${h}:${m}:${s}`;
            }, 1000);
        }
        this.close = function() {
            if (this.div.parentNode) this.div.parentNode.removeChild(this.div);
            clearInterval(this.timer);
        }
    }

    function _setBlockUnload() {
        const enable = isBusy(false) || [MODE_RENLIB, MODE_READLIB, MODE_EDITLIB].indexOf(playMode) + 1
        setBlockUnload(enable);
    }

    function setRadio(buttons = [], callback = () => {}) {
        function check(but) {
            for (let i = buttons.length - 1; i >= 0; i--)
                buttons[i].setChecked(false);
            but.setChecked(true);
            callback.call(but);
        }
        for (let i = buttons.length - 1; i >= 0; i--)
            buttons[i].setontouchend(check);
        return check;
    }

    function setChecked(buttons = [], callback = () => {}) {
        function check(but) {
            but.setChecked(!but.checked);
            callback();
        }
        for (let i = buttons.length - 1; i >= 0; i--)
            buttons[i].setontouchend(check);
        return check;
    }

    function newGame() {
        scaleCBoard(false);
        cBd.canvas.width = cBd.canvas.height = cBd.width;
        cBd.canvas.style.width = cBd.canvas.style.height = cBd.width + "px";
        cBd.cle();
        cBd.resetCBoardCoordinate();
        cBd.printEmptyCBoard();
        cBd.resetNum = 0;
        cBd.firstColor = "black";
        cBd.hideCutDiv();
        cBd.drawLineEnd();
        setPlayMode(MODE_RENJU);
        blackwhiteRadioChecked(cSelBlack);
        markRadioChecked(cAutoadd);
        parentNode.style.top = parentNode.offsetTop - "px";
        parentNode.appendChild(renjuCmddiv);
        imgCmdDiv.parentNode && imgCmdDiv.parentNode.removeChild(imgCmdDiv);
        viewport1.resize();
        RenjuLib.closeLib();
    }

    function setMenuCheckBox(button, idx, idxs) {
        if (idxs.indexOf(idx) > -1) {
            button.menu.lis[idx].checked = !button.menu.lis[idx].checked;
            if (button.menu.lis[idx].checked) {
                button.menu.lis[idx].innerHTML = button.input[idx].text + "  ✔";
            }
            else {
                button.menu.lis[idx].innerHTML = button.input[idx].text;
            }
        }
    }

    function setMenuRadio(button, idx, idxs) {
        for (let i = (idxs && idxs.length || button.input.length) - 1; i >= 0; i--) {
            button.menu.lis[i].checked = false;
            button.menu.lis[i].innerHTML = button.input[i].text;
        }
        button.menu.lis[idx].checked = true;
        button.menu.lis[idx].innerHTML = button.input[idx].text + "  ✔";
    }


    let putCheckerBoard = putBoard;

    function putBoard(idx, board = cBd) {
        if (idx < 0) return;
        let arr = board.getArray2D();
        newGame();
        cBd.unpackArray(!idx ? arr : changeCoordinate(arr, idx));
    }

    function changeCoordinate(arr, idx = 112) {
        const nArr = getArr2D([]);
        const x = idx % 15;
        const y = ~~(idx / 15);
        const l = 7 - x;
        const t = 7 - y;
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                let x1 = i - l;
                let y1 = j - t;
                if (x1 >= 0 && x1 < 15 && y1 >= 0 && y1 < 15) {
                    if (arr[y1][x1]) nArr[j][i] = arr[y1][x1];
                }
            }
        }
        return nArr;
    }

    function checkCommand(msgStr) {
        if (msgStr.indexOf("add") > -1) { // printMoves  || add Num
            let add = msgStr.indexOf("add");
            let str = msgStr.slice(add > -1 ? add + 3 : 0);
            let mv = []; //save moves
            let st = 0;
            let end = str.indexOf(",", st + 1);
            while (end > -1) {
                mv.push(Number(str.slice(st, end)));
                st = end + 1;
                end = str.indexOf(",", st + 1);
            }
            mv.push(Number(str.slice(st)));
            for (let i = mv.length - 1; i >= 0; i--) { // if err exit
                if (!mv[i]) return true;
            }
            let color = getRenjuSelColor();
            if (add > -1) { // add Num
                for (let i = 0; i < mv.length; i++) {
                    cBd.wNb(mv[i], "auto", true, undefined, undefined, 100);
                }
            }
            else { //printMoves
                cBd.printMoves(mv, color);
            }
            return true;
        }
        else if (msgStr.indexOf("color==") > -1) {

            let st = msgStr.indexOf("color==");
            let color = Number(msgStr.slice(st + 7, st + 8));
            st = msgStr.indexOf("[");
            let end = msgStr.indexOf("]");
            if (st > -1 && end - st >= 2) {
                let str = msgStr.slice(st + 1, end);
                let mv = [];
                st = 0;
                end = str.indexOf(",", st + 1);
                while (end > -1) {
                    mv.push(Number(str.slice(st, end)));
                    st = end + 1;
                    end = str.indexOf(",", st + 1);
                }
                mv.push(Number(str.slice(st)));
                cBd.printMoves(mv, color);
                return;
            }
        }
        else if (msgStr.indexOf("debug") > -1) {

            if (vConsole == null) {
                vConsole = new VConsole();
                appData.setKey("debug", true);
            }
            return;
        }
        else if (msgStr.indexOf("close") > -1) {

            if (vConsole) {
                vConsole.destroy();
                appData.setKey("debug", false);
            }
            vConsole = null;
            return;
        }
        else if (msgStr.indexOf("offline") > -1 || msgStr.indexOf("icon") > -1) {

            cBd.cutImg.style.width = ~~(cBd.canvas.width) + "px";
            cBd.cutImg.style.height = ~~(cBd.canvas.height) + "px";
            cBd.cutImg.src = "./icon.png";
            cBd.parentNode.appendChild(cBd.cutImg);
            let pNode = renjuCmddiv.parentNode;
            pNode.removeChild(renjuCmddiv);
            cBd.cutImg.ontouchend = cBd.cutImg.onclick = function() {
                cBd.parentNode.removeChild(cBd.cutImg);
                pNode.appendChild(renjuCmddiv);
            }
            return;
        }
        else if ((/{x:\d+\.*\d*,y:\d+\.*\d*}/).exec(msgStr)) {
            let sPoint = (/{x:\d+\.*\d*,y:\d+\.*\d*}/).exec(msgStr),
                x = String(sPoint).split(/[{x:,y}]/)[3],
                y = String(sPoint).split(/[{x:,y}]/)[6];
            RenjuLib.setCenterPos({ x: x * 1, y: y * 1 })
        }
        else if ((/\d+路/).exec(msgStr)) {
            let num = String((/\d+路/).exec(msgStr)).split("路")[0];
            RenjuLib.setCenterPos({ x: num / 2 + 0.5, y: num / 2 + 0.5 })
        }
        else if ((/postStart\(\d+\)/).exec(msgStr)) {
            let num = String((/postStart\(\d+\)/).exec(msgStr)).split(/[postStart\(\)]/)[10] || 0;
            RenjuLib.setPostStart(num * 1);
        }
        else if (msgStr.indexOf("colour") + 1) {
            RenjuLib.colour()
        }
        else {
            return false;
        }
        return true;
    }

    function execFunction(callback) {
        switch (callback.constructor.name) {
            case "Function":
                setBusy(true);
                callback();
                setBusy(false, 100);
                break;
            case "AsyncFunction":
                setBusy(true);
                callback()
                    .then(() => {}).catch(() => {})
                    .then(() => { setBusy(false, 800) })
                break;
        }
    }

    function createMenu(left, top, width, height, fontSize, options = [], onchange = () => {}) {
        let menu = new Button(cBd.parentNode, "select", left, top, width, height);
        menu.index = -1;
        menu.addOptions(options);
        menu.setonchange(onchange);
        menu.createMenu(left, undefined, width, cWidth * 0.8, fontSize, true, iphoneCancelClick.isCancel);
        return menu;
    }

    function createContextMenu(left, top, width, height = cWidth * 0.8, fontSize) {
        let p = { x: 0, y: 0 };
        xyObjToPage(p, cBd.viewBox);
        left = p.x + (parseInt(cBd.viewBox.style.width) - width) / 2;
        cMenu = createMenu(left, top, width, height, fontSize, [
                0, "设置",
                1, "打开",
                2, `保存`,
                3, `${EMOJI_SEARCH} 找点`,
                4, `${EMOJI_QUESTION} 解题`,
                5, "新棋局",
                6, "添加标记",
                7, "清空标记",
                8, "分享图片",
                9, "分享原图",
                10, `下手为${EMOJI_ROUND_ONE}`,
                11, "重置手数",
                12, "显示手数",
                13, "隐藏手数",
                14, "输入代码",
                15, "输出代码",
                16, `🔄 刷新页面`
            ],
            function(but) {
                if (isBusy()) return;
                let idx = but.idx,
                    x = but.menu.menuLeft,
                    y = but.menu.menuTop;
                const FUN = {
                    0: () => { cShownum.showMenu(x, y) },
                    1: () => { cLoadImg.showMenu(x, y) },
                    2: () => { cCutImage.showMenu(x, y) },
                    3: () => { cFindPoint.showMenu(x, y) },
                    4: () => { cFindVCF.showMenu(x, y) },
                    5: () => { cNewGame.touchend() },
                    6: () => {
                        if (cBd.P[idx].type == TYPE_MARK || cBd.P[idx].type == TYPE_MOVE || cBd.P[idx].type == TYPE_EMPTY)
                            inputLabel(idx);
                    },
                    7: () => { cCleLb.touchend() },
                    8: () => { cShareWhite.touchend() },
                    9: () => { cShare.touchend() },
                    10: () => { cNextone.touchend() },
                    11: () => { cResetnum.touchend() },
                    12: () => {
                        cBd.showNum();
                        setShowNum(true);
                        cBd.isShowNum = getShowNum();
                    },
                    13: () => {
                        cBd.hideNum();
                        setShowNum(false);
                        cBd.isShowNum = getShowNum();
                    },
                    14: () => { cInputcode.touchend() },
                    15: () => { cOutputcode.touchend() },
                    16: () => { typeof window.reloadApp == "function" ? window.reloadApp() : window.location.reload() },
                }
                FUN[but.input.value]();
            });
    }

    /*
    function setTreeInit(tree) {
        if (tree && tree.constructor.name == "Tree") {
            tree.createPath(cBd.MS.slice(0, cBd.MSindex + 1));
            tree.init && (tree.init = {
                MS: cBd.MS.slice(0, cBd.MSindex + 1).concat(tree.init.MS.slice(tree.init.MSindex + 1)),
                MSindex: cBd.MSindex,
                resetNum: (tree.init.resetNum & 1) == (cBd.MSindex + 1 & 1) ? cBd.MSindex + 1 : cBd.MSindex + 2
            })
        }
    }
    */

    async function addTree(tree) {
        if (tree && tree.constructor.name == "Tree") {
            setPlayMode(MODE_READLIB);
            cBd.addTree(tree);
        }
    }

    async function mergeTree(tree) {
        if (tree && tree.constructor.name == "Tree") {
            setPlayMode(MODE_READLIB);
            cBd.mergeTree(tree);
        }
    }

    function moveButtons(settings) {
        let buts = settings.defaultButtons,
            positions = settings.positions,
            buttonsIdx = settings.ButtonsIdx[settings.idx];
        for (let i = 0; i < buts.length; i++) {
            buts[i].hide();
        }

        for (let i = 0; i < buttonsIdx.length; i++) {
            buts[buttonsIdx[i]].move(positions[i].left, positions[i].top);
        }
    }

    function loadCmdSettings(key, settings) {
        if (settings && "ButtonsIdx" in settings && "idx" in settings) {
            if (key = "renjuCmdSettings") {
                renjuCmdSettings.ButtonsIdx = settings.ButtonsIdx || renjuCmdSettings.ButtonsIdx;
                renjuCmdSettings.idx = settings.idx || renjuCmdSettings.idx;
                moveButtons(renjuCmdSettings);
                onLoadCmdSettings();
            }
        }
    }

    function saveCmdSettings(key, settings) {
        let obj = {
            ButtonsIdx: settings.ButtonsIdx,
            idx: settings.idx
        }
        appData.setObject(key, obj);
    }

    // renju 模式控制面板
    function createRenjuCmdDiv(parentNode, left, top, width, height) {
        renjuCmddiv = document.createElement("div");
        parentNode.appendChild(renjuCmddiv);
        renjuCmddiv.style.position = "relative";
        renjuCmddiv.style.width = width / 1.15 + "px";
        renjuCmddiv.style.height = width + "px";
        renjuCmddiv.style.top = parseInt(top) + "px";
        renjuCmddiv.style.left = (dw - parseInt(renjuCmddiv.style.width)) / 2 + "px";
        if (dw > dh) renjuCmddiv.style.left = width / 13 + "px";

        let sw = parseInt(renjuCmddiv.style.width);
        let w = sw / 9;
        let h = w / 1.5;
        let t = 0;
        let menuLeft = parseInt(parentNode.style.left) + parseInt(renjuCmddiv.style.left) + sw * 0.1;
        let menuWidth = sw * 0.8;
        let menuFontSize = sw / 20;

        w = sw / 5;

        cStart = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cStart.setText("‖<<");
        cStart.setontouchend(function() {
            if (isBusy()) return;
            toStart(getShowNum());
        });

        cPrevious = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cPrevious.setText(" <<");
        cPrevious.setontouchend(function() {
            if (isBusy()) return;
            toPrevious(getShowNum());
        });

        cNext = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cNext.setText(">>");
        cNext.setontouchend(function() {
            if (isBusy()) return;
            toNext(getShowNum());
        });

        cEnd = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cEnd.setText(" >>‖");
        cEnd.setontouchend(function() {
            if (isBusy()) return;
            toEnd(getShowNum());
        });


        cMoveL = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cMoveL.setColor("black");
        cMoveL.setText("←");
        cMoveL.setontouchend(function() {
            if (isBusy()) return;
            cBd.translate(0, -1); //left
        });

        cMoveR = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cMoveR.setColor("black");
        cMoveR.setText("→ ");
        cMoveR.setontouchend(function() {
            if (isBusy()) return;
            cBd.translate(0, 1); //right
        });

        cMoveT = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cMoveT.setColor("black");
        cMoveT.setText(" ↑");
        cMoveT.setontouchend(function() {
            if (isBusy()) return;
            cBd.translate(-1, 0); //top
        });

        cMoveB = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cMoveB.setColor("black");
        cMoveB.setText("↓");
        cMoveB.setontouchend(function() {
            if (isBusy()) return;
            cBd.translate(1, 0); //down
        });

        cFlipY = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cFlipY.setText("↔180°");
        cFlipY.setontouchend(function() {
            if (isBusy()) return;
            cBd.rotateY180(getShowNum());
        });

        cCW = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cCW.setText(" ↗90°");
        cCW.setontouchend(function() {
            if (isBusy()) return;
            cBd.rotate90(getShowNum());
        });

        cCleLb = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cCleLb.setColor("black");
        cCleLb.setText(" 清空标记");
        cCleLb.setontouchend(function() {
            if (isBusy()) return;
            cBd.removeMarkLine("all");
            cBd.removeMarkArrow("all");
            cBd.cleLb("all");
        });

        cNewGame = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cNewGame.setText("新棋局");
        cNewGame.setontouchend(function() {
            if (isBusy()) return;
            newGame();
        });

        cInputcode = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cInputcode.setColor("black");
        cInputcode.setText("输入代码");

        async function inputText(initStr = "") {
            let w = cBd.width * 0.8;
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
                enterTXT: "输入代码",
                lineNum: 10
            })).inputStr
        }

        async function inputCode(initStr = "") {
            inputText(initStr)
                .then(inputStr => {
                    let type = (playMode == MODE_READLIB || playMode == MODE_EDITLIB) ? TYPE_NUMBER : undefined;
                    !checkCommand(inputStr) &&
                        cBd.unpackCode(getShowNum(), inputStr, type);
                })

        }
        cInputcode.setontouchend(function() {
            if (isBusy()) return;
            inputCode(`长按下面空白区域，粘贴棋谱代码\n-------------\n\n`);
        });

        cOutputcode = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cOutputcode.setColor("black");
        cOutputcode.setText("输出代码");
        cOutputcode.setontouchend(function() {
            if (isBusy()) return;
            let code = cBd.getCode();
            code = code == "\n{}{}" ? "空棋盘没有棋盘代码" : code;
            inputCode(`${code}\n\n\n-------------\n长按上面代码，复制棋谱代`);
        });

        let fileInput = document.createElement("input");
        fileInput.setAttribute("type", "file");
        fileInput.style.display = "none";
        renjuCmddiv.appendChild(fileInput);

        let setMemoryMenu = createMenu(menuLeft, undefined, menuWidth, cWidth * 0.8, menuFontSize,
            [4, "4倍内存",
            5, "5倍内存",
            6, "6倍内存",
            7, "7倍内存",
            8, "8倍内存"],
            function(but) {
                RenjuLib.setBufferScale(but.input.value * 1);
            });

        cLoadImg = new Button(renjuCmddiv, "select", 0, 0, w, h);
        cLoadImg.addOption(1, "打开 图片");
        cLoadImg.addOption(2, "打开 lib 棋谱");
        //cLoadImg.addOption(3, "设置内存大小");
        cLoadImg.createMenu(menuLeft, undefined, menuWidth, cWidth * 0.8, menuFontSize);
        cLoadImg.setText("打开");
        cLoadImg.setonchange(function(but) {
            but.setText(`打开`);
            if (isBusy()) return;
            const FUN = {
                1: () => {
                    fileInput.accept = "image/*";
                    fileInput.onchange = openImg;
                    fileInput.click()
                },
                2: () => {
                    fileInput.accept = "application/lib";
                    fileInput.onchange = openLib;
                    fileInput.click()
                },
                3: () => { setMemoryMenu.showMenu() },
            }
            execFunction(FUN[but.input.value]);
            but.input.value = 0;
        });

        async function openImg() {
            cBd.cle();
            scaleCBoard(false);
            cBd.drawLineEnd();
            cBd.resetCutDiv();
            parentNode.removeChild(renjuCmddiv);
            parentNode.appendChild(imgCmdDiv);
            await cBd.loadImgFile(fileInput.files[0]);
            fileInput.value = "";
            cBd.putImg(cBd.bakImg, cBd.canvas, cBd.width / 13);
            setPlayMode(MODE_LOADIMG);
            cLockImg.setChecked(0);
            cAddblack2.setChecked(1);
            cAddwhite2.setChecked(0);
            cSLTX.input.value = cBd.SLTX;
            cSLTX.setText(cSLTX.input.value + " 列");
            cSLTY.input.value = cBd.SLTY;
            cSLTY.setText(cSLTY.input.value + " 行");
            viewport1.userScalable();
            warn(`长按棋盘，拖动虚线对齐棋子`);
            miniBoard.backgroundColor = cBd.backgroundColor;
            miniBoard.setSize(cBd.size);
            miniBoard.setCoordinate(cBd.coordinateType);
            miniBoard.cle();
        }

        function openLib() {
            newGame();
            cBd.drawLineEnd();
            let file = fileInput.files[0];
            fileInput.value = "";
            RenjuLib.openLib(file)
        }

        cCutImage = new Button(renjuCmddiv, "select", 0, 0, w, h);
        //cCutImage.addOption(0, "________图片________");
        cCutImage.addOption(2, "JPEG/(*.jpg) ____ 压缩图片");
        cCutImage.addOption(3, "PNG /(*.png) ____ 清晰图片");
        cCutImage.addOption(4, "SVG /(*.svg) ____ 无损图片");
        cCutImage.addOption(5, "HTML/(*.html) ___ 无损文档");
        cCutImage.addOption(6, "PDF /(*.pdf) _____ 无损文档");
        //cCutImage.addOption(7, "________棋谱________");
        //cCutImage.addOption(8, "LIB /(*.lib) ______ 棋谱");
        cCutImage.createMenu(menuLeft, undefined, menuWidth, cWidth * 0.8, menuFontSize);
        cCutImage.setText(`保存`);
        cCutImage.setonchange(function(but) {
            but.setText(`保存`);
            if (isBusy()) return;
            const FUN = {
                2: () => { cBd.saveAsImage("jpeg") },
                3: () => { cBd.saveAsImage("png") },
                4: () => { cBd.saveAsSVG("svg") },
                5: () => { cBd.saveAsSVG("html") },
                6: () => { cBd.saveAsPDF() },
            }
            execFunction(FUN[but.input.value]);
            but.input.value = 0;
        });

        cCancelFind = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cCancelFind.setText(`${EMOJI_STOP} 停止`);
        cCancelFind.setontouchend(function(but) {
            cCancelFind.setText(`停止中...`);
            engine.cancel();
            RenjuLib.isLoading() && RenjuLib.cancal();
        });

        cAutoadd = new Button(renjuCmddiv, "radio", 0, 0, w, h);
        cAutoadd.setText(` ${EMOJI_ROUND_BLACK_WHITE} 棋`);
        cAutoadd.setChecked(1);

        cAddblack = new Button(renjuCmddiv, "radio", 0, 0, w, h);
        cAddblack.setText(` ${EMOJI_ROUND_BLACK} 棋`);

        cAddwhite = new Button(renjuCmddiv, "radio", 0, 0, w, h);
        cAddwhite.setText(` ${EMOJI_ROUND} 棋`);

        cNextone = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cNextone.setColor("black");
        cNextone.setText(`下手为${EMOJI_ROUND_ONE}`);
        cNextone.setontouchend(function() {
            if (isBusy()) return;
            cBd.setResetNum(cBd.MSindex + 1);
            cBd.isShowNum = getShowNum();
        });

        cLba = new Button(renjuCmddiv, "radio", 0, 0, w, h);
        cLba.setText(` ${EMOJI_SQUARE_BLACK} `);

        cLbb = new Button(renjuCmddiv, "radio", 0, 0, w, h);
        cLbb.setText(` ${EMOJI_ROUND_DOUBLE} `);

        cLABC = new Button(renjuCmddiv, "select", 0, 0, w, h);
        cLABC.addOption(0, "←  箭头");
        cLABC.addOption(1, "__ 线条");
        cLABC.addOption(2, "ABC...");
        cLABC.addOption(3, "abc...");
        cLABC.addOption(4, "123...");
        cLABC.addOption(5, "自定义...");
        cLABC.addOption(6, `${EMOJI_STAR} 标记`);
        cLABC.addOption(7, `${EMOJI_FOUL} 标记`);

        cLABC.createMenu(menuLeft, undefined, menuWidth, cWidth * 0.8, menuFontSize);

        cLABC.setonchange(function() {
            if (cLABC.input.value > 1) cBd.drawLineEnd();
            if (cLABC.input.value == 5) {
                let lbStr = "";
                for (let i = 0; i < continueLabel.length; i++) {
                    lbStr += (continueLabel[i] + ",");
                }
                inputText(`${lbStr}......\n\n\n,-------------\n类似(ABC...),(abc...),(123...)\n可在上面编辑 连续输入的 标记。每个标记 用英文 [,] 逗号隔开，每个标记最多3个字符`)
                    .then(inputStr => {
                        newContinueLabel(inputStr);
                    })
            }
        });

        let hm = cLABC.hideMenu;
        cLABC.hideMenu = function(ms, callback) {
            hm.call(this, ms, callback);
            if (cLABC.input.value > 1) cBd.drawLineEnd();
        };

        function newContinueLabel(msgStr) {
            let labels = [];
            let st = 0;
            let s;
            let end = msgStr.indexOf(",", st);
            while (end > st) {
                s = msgStr.slice(st, end);
                if (s.length > 0 && s.length < 4) {
                    labels.push(s);
                }
                st = end + 1;
                end = msgStr.indexOf(",", st);
            }
            if (labels.length) continueLabel = labels;
        };


        cResetnum = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cResetnum.setColor("black");
        cResetnum.setText(" 重置手数");
        cResetnum.setontouchend(function() {
            if (isBusy()) return;
            cBd.setResetNum(0);
            setShowNum(true);
            cBd.isShowNum = getShowNum();
        });

        cLbc = new Button(renjuCmddiv, "radio", 0, 0, w, h);
        cLbc.setText(` ${EMOJI_TRIANGLE_BLACK} `);

        cLbd = new Button(renjuCmddiv, "radio", 0, 0, w, h);
        cLbd.setText(` ${EMOJI_FORK} `);

        cLbColor = new Button(renjuCmddiv, "select", 0, 0, w, h);

        for (let i = 0; i < lbColor.length; i++) {
            cLbColor.addOption(i, lbColor[i].colName);
        }

        cLbColor.createMenu(menuLeft, undefined, menuWidth, cWidth * 0.8, menuFontSize);
        for (let i = cLbColor.menu.lis.length - 1; i >= 0; i--) {
            cLbColor.menu.lis[i].style.color = lbColor[i].color;
            let div = document.createElement("div");
            cLbColor.menu.menu.appendChild(div);
            div.onclick = cLbColor.menu.lis[i].onclick;
            let s = div.style;
            s.position = "absolute";
            s.width = `${(cLbColor.menu.menuWidth)/2}px`;
            s.height = `${cLbColor.menu.lis[i].style.lineHeight}`;
            s.left = `${parseInt(cLbColor.menu.lis[i].style.fontSize)*7}px`;
            s.top = `${(parseInt(cLbColor.menu.fontSize) * 2.5 + 3)*(cLbColor.menu.lis["down"] ? i +1 : i)+i}px`;
            //log(`s.height= ${s.height}, s.width=${s.width}, left=${s.left}, top=${s.top}`)
            //log(cLbColor.menu.lis["down"])
            s.backgroundColor = lbColor[i].color;
        }

        cLbColor.setText(`${EMOJI_PEN} 颜色`);
        cLbColor.setonchange(function(but) {
            but.setColor(lbColor[but.input.value].color);
            but.setText(`${EMOJI_PEN} 颜色`);
            cLba.setColor(lbColor[but.input.value].color);
            cLbb.setColor(lbColor[but.input.value].color);
            cLbc.setColor(lbColor[but.input.value].color);
            cLbd.setColor(lbColor[but.input.value].color);
            cLABC.setColor(lbColor[but.input.value].color);
        });

        cMode = new Button(renjuCmddiv, "select", 0, 0, w, h);
        cMode.addOption(1, "经典摆棋模式");
        cMode.addOption(2, "无序摆棋模式");
        cMode.addOption(3, "棋谱只读模式");
        cMode.addOption(4, "棋谱编辑模式");
        cMode.createMenu(menuLeft, undefined, menuWidth, cWidth * 0.8, menuFontSize);
        cMode.setText("摆棋");
        cMode.setonchange(function(but) {
            if (isBusy()) return;
            const FUN = {
                1: () => { setPlayMode(MODE_RENJU) },
                2: () => { setPlayMode(MODE_RENJU_FREE) },
                3: () => { setPlayMode(MODE_READLIB) },
                4: () => { setPlayMode(MODE_EDITLIB) },
            }
            execFunction(FUN[but.input.value]);
        });

        cSelBlack = new Button(renjuCmddiv, "checkbox", 0, 0, w, h);
        cSelBlack.setText("黑先");
        cSelBlack.setChecked(1);

        cSelWhite = new Button(renjuCmddiv, "checkbox", 0, 0, w, h);
        cSelWhite.setText("白先");

        const CALCULATE = 1;
        let tMsg = [["4月23日，五子茶馆解题大赛"], ["比赛结束前，暂时关闭计算功能"]];

        cFindPoint = new Button(renjuCmddiv, "select", 0, 0, w, h);
        if (CALCULATE) {
            //cFindPoint.addOption(1, "VCT选点");
            cFindPoint.addOption(2, "做V点");
            cFindPoint.addOption(3, "做43杀(白单冲4杀)");
            cFindPoint.addOption(4, "活三级别");
            cFindPoint.addOption(5, "活三");
            //cFindPoint.addOption(6, `${EMOJI_FOUL} 三三`);
            //cFindPoint.addOption(7, `${EMOJI_FOUL} 四四`);
            //cFindPoint.addOption(8, `${EMOJI_FOUL} 长连`);
            cFindPoint.addOption(9, "眠三");
            cFindPoint.addOption(10, "活四");
            cFindPoint.addOption(11, "冲四");
            cFindPoint.addOption(12, "五连");

        }
        else {
            for (let i = 0; i < tMsg.length; i++) {
                cFindPoint.addOption(i, tMsg[i]);
            }
        }

        cFindPoint.createMenu(menuLeft, undefined, menuWidth, cWidth * 0.8, menuFontSize);
        cFindPoint.setText("找点");
        cFindPoint.setonchange(function(but) {
            but.setText("找点");
            if (isBusy()) return;
            if (but.input.value < 1 || !CALCULATE) {
                but.input.value = 0;
                return;
            }
            viewport1.resize();
            let arr = cBd.getArray();
            const FUN = {
                1: async function() {
                    return engine.createTreeVCT({
                        color: getRenjuSelColor(),
                        arr: arr,
                        radius: 3,
                        ftype: FIND_ALL,
                        maxVCF: 1,
                        maxDepth: 180,
                        maxNode: 1000,
                        maxDepthVCT: 5,
                    })
                },
                2: async function() {
                    return engine.createTreeLevelThree({
                        color: getRenjuSelColor(),
                        arr: arr,
                        ftype: ONLY_VCF,
                        maxVCF: 1,
                        maxDepth: 180,
                        maxNode: 500000
                    })
                },
                3: async function() {
                    return engine.createTreeLevelThree({
                        color: getRenjuSelColor(),
                        arr: arr,
                        ftype: ONLY_SIMPLE_WIN,
                        maxVCF: 1,
                        maxDepth: 3,
                        maxNode: 500000
                    })
                },
                4: async function() {
                    return engine.createTreeLevelThree({
                        color: getRenjuSelColor(),
                        arr: arr,
                        ftype: FIND_ALL,
                        maxVCF: 1,
                        maxDepth: 180,
                        maxNode: 500000
                    })
                },
                5: async function() {
                    return engine.createTreeThree({
                        arr: arr,
                        color: getRenjuSelColor(),
                        ftype: ONLY_FREE
                    })
                },
                9: async function() {
                    return engine.createTreeThree({
                        arr: arr,
                        color: getRenjuSelColor(),
                        ftype: ONLY_NOFREE
                    })
                },
                10: async function() {
                    return engine.createTreeFour({
                        arr: arr,
                        color: getRenjuSelColor(),
                        ftype: ONLY_FREE
                    })
                },
                11: async function() {
                    return engine.createTreeFour({
                        arr: arr,
                        color: getRenjuSelColor(),
                        ftype: ONLY_NOFREE
                    })
                },
                12: async function() {
                    return engine.createTreeFive({
                        arr: arr,
                        color: getRenjuSelColor()
                    })
                },
            }
            execFunction(async function() { mergeTree((await FUN[but.input.value]())) });
            but.input.value = 0;
        });
        //cFindPoint.setontouchend(function() {});

        cFindVCF = new Button(renjuCmddiv, "select", 0, 0, w, h);
        if (CALCULATE) {
            cFindVCF.addOption(1, "找 VCF");
            cFindVCF.addOption(2, "找全VCF");
            cFindVCF.addOption(3, "找 双杀");
            cFindVCF.addOption(4, "三手胜");
            cFindVCF.addOption(5, "大道五目");
            cFindVCF.addOption(6, "五手五连");
            cFindVCF.addOption(7, "禁手判断");
            cFindVCF.addOption(8, "防冲四抓禁");
            //cFindVCF.addOption(9, "找  VCF防点");
            cFindVCF.addOption(10, "找 VCF 防点(深度+1)");
            cFindVCF.addOption(11, "找 VCF 防点(深度+∞)");
            //cFindVCF.addOption(12, "坂田三手胜(测试)");
            //cFindVCF.addOption(13, "VCT(测试）");
            //cFindVCF.addOption(12, "test two");
        }
        else {
            for (let i = 0; i < tMsg.length; i++) {
                cFindVCF.addOption(i, tMsg[i]);
            }
        }
        cFindVCF.createMenu(menuLeft, undefined, menuWidth, cWidth * 0.8, menuFontSize);
        cFindVCF.setText("解题");
        cFindVCF.setonchange(function(but) {
            but.setText("解题");
            if (isBusy()) return;
            if (but.input.value < 1 || !CALCULATE) {
                but.input.value = 0;
                return;
            }
            viewport1.resize();
            let arr = cBd.getArray(); // cBd.getArray2D();
            const FUN = {
                1: async function() {
                    return engine.createTreeVCF({
                        arr: arr,
                        color: getRenjuSelColor(),
                        maxVCF: 1,
                        maxDepth: 180,
                        maxNode: 1000000
                    })
                },
                2: async function() {
                    return engine.createTreeVCF({
                        arr: arr,
                        color: getRenjuSelColor(),
                        maxVCF: 255,
                        maxDepth: 180,
                        maxNode: 1000000
                    })
                },
                3: async function() {
                    return engine.createTreeDoubleVCF({
                        arr: arr,
                        color: getRenjuSelColor(),
                        maxVCF: 1,
                        maxDepth: 180,
                        maxNode: 1000000
                    });
                },
                4: async function() {
                    return engine.createTreeSimpleWin({
                        arr: arr,
                        color: getRenjuSelColor(),
                        maxVCF: 1,
                        maxDepth: 180,
                        maxNode: 1000000,
                        maxVCT: 1,
                        maxDepthVCT: 4 * 2 - 3,
                        maxNodeVCT: 1000000
                    })
                },
                5: async function() {
                    return engine.createTreeNumberWin({
                        arr: arr,
                        color: getRenjuSelColor(),
                        maxVCF: 1,
                        maxDepth: 4 * 2 - 3,
                        maxNode: 1000000,
                        nMaxDepth: 180
                    });
                },
                6: async function() {
                    return engine.createTreeNumberWin({
                        arr: arr,
                        color: getRenjuSelColor(),
                        maxVCF: 1,
                        maxDepth: 5 * 2 - 3,
                        maxNode: 1000000,
                        nMaxDepth: 180
                    });
                },
                7: async function() {
                    return engine.createTreeTestFoul({
                        arr: arr,
                        color: 1,
                    });
                },
                8: async function() {
                    return engine.createTreeBlockCatchFoul({
                        arr: arr,
                        color: 1,
                        maxVCF: 1,
                        maxDepth: 180,
                        maxNode: 1000000
                    });
                },
                9: async function() {
                    engine.postMsg("getBlockVCF", {
                        color: getRenjuSelColor(),
                        arr: arr
                    });
                },
                10: async function() {
                    return engine.createTreeBlockVCF({
                        arr: arr,
                        color: getRenjuSelColor(),
                        maxVCF: 1,
                        maxDepth: 180,
                        maxNode: 1000000,
                        blkDepth: 1
                    });
                },
                11: async function() {
                    return engine.createTreeBlockVCF({
                        arr: arr,
                        color: getRenjuSelColor(),
                        maxVCF: 1,
                        maxDepth: 180,
                        maxNode: 1000000,
                        blkDepth: 2
                    });
                },
                12: async function() {
                    engine.postMsg("findVCT", {
                        arr: arr,
                        color: getRenjuSelColor(),
                        node: undefined,
                        count: 1,
                        depth: 2,
                        backstage: undefined
                    });
                },
                13: async function() {
                    engine.postMsg("findVCT", {
                        arr: arr,
                        color: getRenjuSelColor(),
                        node: undefined,
                        count: 1,
                        depth: 5,
                        backstage: undefined
                    });
                },
            }
            execFunction(async function() { mergeTree(await FUN[but.input.value]()) });
            but.input.value = 0;
        });
        cFindVCF.setontouchend(function() {});

        cShareWhite = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cShareWhite.setColor("black");
        cShareWhite.setText(" 分享图片");
        cShareWhite.setontouchend(function() {
            if (isBusy()) return;
            share(cBoard);
        });

        cShare = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cShare.setColor("black");
        cShare.setText(" 分享棋局");
        cShare.setontouchend(function() {
            if (isBusy()) return;
            let hash = `${cBd.getCodeURL()}`,
                url = window.location.href.split(/[?#]/)[0] + `#${hash}`;
            window.location.hash = hash;
            //log(`share URL: ${url}`);
            if (navigator.canShare) {
                navigator.share({
                    title: "摆棋小工具",
                    text: "摆棋小工具，棋局分享",
                    url: url
                })
            }
            else {
                msg({
                    title: url,
                    type: "input",
                    butNum: 1
                })
            }
        });

        let gameRulesMenu = createMenu(menuLeft, t, menuWidth, h, menuFontSize,
                [0, "无禁规则",
                1, "禁手规则"],
                function(but) {
                    if (isBusy()) return;
                    const rules = [GOMOKU_RULES, RENJU_RULES];
                    engine.setGameRules(rules[but.input.value * 1]);
                    setMenuRadio(gameRulesMenu, gameRulesMenu.input.selectedIndex);
                }),
            coordinateMenu = createMenu(menuLeft, t, menuWidth, h, menuFontSize,
                [0, "棋盘坐标:无坐标",
                1, "棋盘坐标:上下左右",
                2, "棋盘坐标:上左",
                3, "棋盘坐标:上右",
                4, "棋盘坐标:下右",
                5, "棋盘坐标:下左"],
                function(but) {
                    if (isBusy()) return;
                    cBd.setCoordinate(but.input.value * 1);
                }),
            cBoardSizeMenu = createMenu(menuLeft, t, menuWidth, h, menuFontSize,
                [15, "15路棋盘",
                14, "14路棋盘",
                13, "13路棋盘",
                12, "12路棋盘",
                11, "11路棋盘",
                10, "10路棋盘",
                9, "9路棋盘",
                8, "8路棋盘",
                7, "7路棋盘",
                6, "6路棋盘", ],
                function(but) {
                    if (isBusy()) return;
                    //newGame();
                    cBd.setSize(but.input.value * 1);
                    scaleCBoard(false);
                    RenjuLib.setCenterPos({ x: cBd.size / 2 + 0.5, y: cBd.size / 2 + 0.5 });
                    RenjuLib.getAutoMove();
                }),
            setCBoardLineStyleMenu = createMenu(menuLeft, t, menuWidth, h, menuFontSize,
                [0, "正常",
                1, "加粗",
                2, "特粗"],
                function(but) {
                    if (isBusy()) return;
                    cBd.setLineStyle(but.input.value * 1);
                }),
            loadRenjuSettingsMenu = createMenu(menuLeft, t, menuWidth, h, menuFontSize,
                [0, "默认",
                1, "设置1",
                2, "设置2",
                3, "设置3",
                4, "设置4",
                5, "设置5"],
                function(but) {
                    if (isBusy()) return;
                    renjuCmdSettings.idx = but.input.value * 1;
                    saveCmdSettings("renjuCmdSettings", renjuCmdSettings);
                    loadCmdSettings("renjuCmdSettings", renjuCmdSettings);
                }),
            saveRenjuSettingsMenu = createMenu(menuLeft, t, menuWidth, h, menuFontSize,
                [1, "设置1",
                2, "设置2",
                3, "设置3",
                4, "设置4",
                5, "设置5"],
                function(but) {
                    if (isBusy()) return;
                    renjuCmdSettings.idx = but.input.value * 1;
                    editButtons("renjuCmdSettings", renjuCmdSettings);
                }),
            cShownumTop = new Button(renjuCmddiv, "button", 0, 0, w, h);

        cShownumTop.setText(" 设置 ");
        cShownumTop.setontouchend(function() {
            if (isBusy()) return;
            cShownum.defaultontouchend();
        });

        cShownum = new Button(renjuCmddiv, "select", 0, 0, w, h);
        cShownum.addOption(0, "显示手数");
        cShownum.addOption(1, "显示禁手");
        cShownum.addOption(2, "显示路线");
        cShownum.addOption(3, "放大棋盘");
        //cShownum.addOption(4, "彩色对称打点");
        cShownum.addOption(5, "设置规则");
        cShownum.addOption(6, "设置棋盘大小");
        cShownum.addOption(7, "设置棋盘坐标");
        cShownum.addOption(8, "设置颜色风格");
        cShownum.addOption(9, "设置线条风格");
        cShownum.addOption(10, "设置按键位置");
        cShownum.addOption(11, "加载按键设置");
        cShownum.addOption(12, "重置数据");
        cShownum.setText(EMOJI_ROUND_ONE);
        cShownum.createMenu(menuLeft, undefined, menuWidth, cWidth * 0.8, menuFontSize);
        cShownum.menu.lis[0].checked = true;
        cShownum.menu.lis[0].innerHTML = cShownum.input[0].text + "  ✔";
        //cShownum.menu.lis[4].checked = true;
        //cShownum.menu.lis[4].innerHTML = cShownum.input[4].text + "  ✔";
        cShownum.setonchange(function(but) {
            but.setText(EMOJI_ROUND_ONE);
            if (isBusy()) return;
            const FUN = {
                0: () => {
                    if (but.menu.lis[0].checked) {
                        cBd.showNum();
                    }
                    else {
                        cBd.hideNum();
                    }
                    cBd.isShowNum = but.menu.lis[0].checked;
                },
                1: () => { cBd.isShowFoul = but.menu.lis[1].checked },
                2: () => { cBd.isShowAutoLine = but.menu.lis[2].checked },
                3: () => { scaleCBoard(but.menu.lis[3].checked, 1) },
                4: () => { cBd.isTransBranch = but.menu.lis[4].checked },
                5: () => { gameRulesMenu.showMenu(but.menu.menuLeft, but.menu.menuTop) },
                6: () => { cBoardSizeMenu.showMenu(but.menu.menuLeft, but.menu.menuTop) },
                7: () => { coordinateMenu.showMenu(but.menu.menuLeft, but.menu.menuTop) },
                9: () => { setCBoardLineStyleMenu.showMenu(but.menu.menuLeft, but.menu.menuTop) },
                10: () => { saveRenjuSettingsMenu.showMenu(but.menu.menuLeft, but.menu.menuTop) },
                11: () => { loadRenjuSettingsMenu.showMenu(but.menu.menuLeft, but.menu.menuTop) },
                12: () => { location.href = "reset.html" },
            }
            setMenuCheckBox(but, but.input.selectedIndex, [0, 1, 2, 3]);
            execFunction(FUN[but.input.value]);
            cBd.stonechange();
        });
        cBd.viewchange = function() {
            if (this.scale == 1) {
                cShownum.menu.lis[3].checked = false;
                cShownum.menu.lis[3].innerHTML = cShownum.input[3].text;
            }
            else {
                cShownum.menu.lis[3].checked = true;
                cShownum.menu.lis[3].innerHTML = cShownum.input[3].text + "  ✔";
            }
        };
        cBd.sizechange = function() {
            cBoardSizeMenu.input.selectedIndex = 15 - this.size;
            setMenuRadio(cBoardSizeMenu, cBoardSizeMenu.input.selectedIndex);
            viewport1.scrollTop();
            cBoardSize = this.size;
            if (this.tree && this.tree.constructor.name == "Tree") {
                let libSize = this.tree.centerPos.x * 2 - 1;
                if (libSize != cBoardSize) msg(`${EMOJI_FOUL_THREE}${libSize}路棋谱 ${cBoardSize}路棋盘${EMOJI_FOUL_THREE}`);
            }
        };
        cBd.boardchange = function() {
            coordinateMenu.input.selectedIndex = this.coordinateType;
            setMenuRadio(coordinateMenu, coordinateMenu.input.selectedIndex);
            viewport1.scrollTop();
        };
        cBd.stonechange = function() {
            if (playMode != MODE_RENJU &&
                playMode != MODE_RENJU_FREE &&
                playMode != MODE_RENLIB &&
                playMode != MODE_READLIB &&
                playMode != MODE_EDITLIB &&
                playMode != MODE_ARROW_EDIT &&
                playMode != MODE_LINE_EDIT) return;

            if (playMode == MODE_READLIB || playMode == MODE_EDITLIB) {
                this.showBranchs();
            }
            else if (playMode == MODE_RENLIB) {
                RenjuLib.showBranchs({ path: this.MS.slice(0, this.MSindex + 1), position: this.getArray2D() });
                showFoul.call(this, (findMoves.call(this) + 1) ? false : this.isShowFoul);
            }
            else {
                showFoul.call(this, findMoves.call(this) + 1 ? false : this.isShowFoul);
                showAutoLine.call(this, findMoves.call(this) + 1 ? false : this.isShowAutoLine);
            }

            function findMoves() {
                for (let i = 0; i < this.SLTX; i++) {
                    for (let j = 0; j < this.SLTY; j++) {
                        if (this.P[i + j * 15].type == TYPE_MOVE) {
                            return i;
                        }
                    }
                }
                return -1;
            }

            function showFoul(display) {
                this.P.map((P, i) => {
                    if (P.type == TYPE_MARKFOUL) {
                        P.cle();
                        this.clePointB(i);
                        this.refreshMarkLine(i);
                        this.refreshMarkArrow(i);
                    }
                });
                if (display) {
                    this.getArray().map((color, idx, arr) => {
                        color == 0 && isFoul(idx, arr) && (
                            this.P[idx].color = "red",
                            this.P[idx].bkColor = null,
                            this.P[idx].type = TYPE_MARKFOUL,
                            this.P[idx].text = EMOJI_FOUL,
                            this.refreshMarkLine(idx),
                            this._printPoint(idx),
                            this.refreshMarkArrow(idx)
                        );
                    });
                }
            }

            function showAutoLine(display) {
                for (let i = this.autoLines.length - 1; i >= 0; i--) {
                    this.removeMarkLine(i, this.autoLines);
                }
                if (display) {
                    const OBJ_LINES = { THREE_FREE: [], FOUR_NOFREE: [], FOUR_FREE: [], FIVE: [] },
                        COLOR = { THREE_FREE: "#556B2F", FOUR_NOFREE: "#483D8B", FOUR_FREE: "#86008f", FIVE: "red" };
                    let arr = this.getArray();
                    getLines(arr, 1).map(line => OBJ_LINES[line.level].push(line));
                    getLines(arr, 2).map(line => OBJ_LINES[line.level].push(line));
                    Object.keys(OBJ_LINES).map(key => {
                        OBJ_LINES[key].map(line => this.createMarkLine(line.start, line.end, COLOR[line.level], this.autoLines));
                    });
                }
            }

        };
        onLoadCmdSettings = function() {
            setMenuRadio(loadRenjuSettingsMenu, renjuCmdSettings.idx);
            viewport1.scrollTop();
        };
        scaleCBoard = function(isScale, isAnima) {
            if (isScale) cBd.setScale(1.5, isAnima);
            else cBd.setScale(1, isAnima);
        };

        setShowNum = function(shownum) {
            cShownum.menu.lis[0].checked = !!shownum;
            if (cShownum.menu.lis[0].checked) {
                cShownum.menu.lis[0].innerHTML = cShownum.input[0].text + "  ✔";
            }
            else {
                cShownum.menu.lis[0].innerHTML = cShownum.input[0].text;
            }
        };
        getShowNum = function() {
            return cShownum.menu.lis[0].checked;
        };

        cHelp = new Button(renjuCmddiv, "button", 0, 0, w, h);
        cHelp.setColor("black");
        cHelp.setText(" 帮助 ");
        cHelp.setontouchend(function() {
            if (isBusy()) return;
            window.open("./help/renjuhelp/renjuhelp.html", "helpWindow");
        });

        blackwhiteRadioChecked = setRadio([cSelBlack, cSelWhite]);

        markRadioChecked = setRadio([cLba, cLbb, cLbc, cLbd, cAutoadd, cAddblack, cAddwhite, cLABC], function() {
            if (this != cLABC) {
                cBd.drawLineEnd();
            }
        });

        let topButtons = [
                cShareWhite,
                cShare,
                cShownumTop,
                cHelp],
            downButtons = [
                cStart,
                cPrevious,
                cNext,
                cEnd,
                cMoveL,
                cMoveR,
                cMoveT,
                cMoveB,
                cFlipY,
                cCW,
                cCleLb,
                cNewGame,
                cInputcode,
                cOutputcode,
                cLoadImg,
                cCutImage,
                cAutoadd,
                cAddblack,
                cAddwhite,
                cMode,
                cLba,
                cLbb,
                cLABC,
                cNextone,
                cLbc,
                cLbd,
                cLbColor,
                cResetnum,
                cSelBlack,
                cSelWhite,
                cFindPoint,
                cFindVCF];

        for (let i = 0; i < 9; i++) { // set positions
            if (i === 0) {
                if (dw < dh) {
                    t = 0 - cBd.width - h * 2.5;
                    setTop(parentNode.offsetTop + t)
                }
                else {
                    t = 0;
                    setTop(0);
                }
            }
            else if (i === 1) {
                if (dw < dh)
                    t = 0;
                else
                    t += h * 1.5;
            }
            else {
                t += h * 1.5;
            }
            for (let j = 0; j < 4; j++) {
                renjuCmdSettings.positions.push({
                    left: w * j * 1.33,
                    top: t
                });
            }
        }
        renjuCmdSettings.defaultButtons = dw < dh ? topButtons.concat(downButtons) : downButtons.concat(topButtons);

        renjuCmdSettings.ButtonsIdx[0] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
        renjuCmdSettings.ButtonsIdx[1] = [0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 26, 27];
        renjuCmdSettings.ButtonsIdx[2] = [0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 26, 27, 16, 17, 18, 19];
        renjuCmdSettings.ButtonsIdx[3] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 26, 27, 16, 17, 18, 19];
        renjuCmdSettings.ButtonsIdx[4] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 32, 33, 34, 35, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 16, 17, 18, 19];
        renjuCmdSettings.ButtonsIdx[5] = [0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15];

        renjuCmdSettings.idx = 0;

        moveButtons(renjuCmdSettings);

        createContextMenu(undefined, undefined, menuWidth, undefined, menuFontSize);


        editButtons = (() => {
            const VIEW = document.createElement("div"),
                IFRAME = document.createElement("div"),
                TITLE = document.createElement("div"),
                CLOSE_BUTTON = document.createElement("img");

            let p = { x: 0, y: 0 },
                settingsKey = "settingsKey",
                pSettings,
                cBdLeft = 0,
                cBdTop = 0,
                pButtonsIdx = [],
                newButtonsIdx = [],
                Positions = [],
                DefaultButtons = [];

            p = { x: cBd.viewBox.offsetLeft, y: cBd.viewBox.offsetTop };
            xyObjToPage(p, cBd.viewBox);
            cBdLeft = p.x;
            cBdTop = p.y;

            let s = VIEW.style;
            s.position = "absolute";
            s.left = p.x + "px";
            s.top = p.y + "px";
            s.width = cBd.viewBox.style.width;
            s.height = cBd.viewBox.style.height;
            s.zIndex = 9999;
            //s.background = "green";

            IFRAME.setAttribute("id", "exWindow");
            s = IFRAME.style;
            s.position = "absolute";
            s.left = 0;
            s.top = 0;
            s.width = cBd.viewBox.style.width;
            s.height = cBd.viewBox.style.height;
            s.border = `${sw/260}px solid black`;
            s.background = "white";
            VIEW.appendChild(IFRAME);

            s = TITLE.style;
            s.color = "black";
            s.background = "white";
            s.left = "0px";
            s.top = "0px";
            s.width = "100%";
            s.textAlign = "center";
            s.fontSize = ~~(cBd.width / 25) + "px";
            s.lineHeight = ~~(cBd.width / 10) + "px";
            IFRAME.appendChild(TITLE);
            TITLE.innerHTML = "点击添加按键";

            CLOSE_BUTTON.src = "./pic/close.svg";
            CLOSE_BUTTON.oncontextmenu = (event) => {
                event.preventDefault();
            };
            setButtonClick(CLOSE_BUTTON, close);
            s = CLOSE_BUTTON.style;
            let sz = cBd.width / 10 + "px";
            s.position = "absolute";
            s.left = cBd.width - parseInt(sz) + "px";
            s.top = "0px";
            s.width = sz;
            s.height = sz;
            s.opacity = "0.5";
            s.backgroundColor = "#c0c0c0";
            VIEW.appendChild(CLOSE_BUTTON);

            let divs = [];
            for (let i = 0; i < 50; i++) {
                divs[i] = document.createElement("div");
            }

            function close() {
                VIEW.setAttribute("class", "hideEXWindow");
                VIEW.parentNode && setTimeout(() => VIEW.parentNode.removeChild(VIEW), 350);
                msgbox("是否保存更改?", "保存", undefined, "取消", undefined)
                    .then(function({ butCode }) {
                        if (butCode == window.MSG_ENTER) { // save change
                            pButtonsIdx.length = 0;
                            for (let i = 0; i < newButtonsIdx.length; i++) {
                                pButtonsIdx[i] = newButtonsIdx[i];
                            }
                        }
                        saveCmdSettings(settingsKey, pSettings);
                        loadCmdSettings(settingsKey, pSettings);
                        //showButtons(pButtonsIdx, Positions, DefaultButtons);
                    })
                    .then(function() {
                        let checkSettingButton = false
                        for (let i = 0; i < pButtonsIdx.length; i++) {
                            if (DefaultButtons[pButtonsIdx[i]] == cShownumTop) {
                                checkSettingButton = true;
                                break;
                            }
                        }!checkSettingButton && msgbox("你隐藏了设置按钮，还能长按棋盘弹出设置");
                    })
            }

            function showDiv(left, top, div, but) {
                let divStyle = div.style,
                    buttonStyle = but.button.style,
                    buttonDivStyle = but.div.style;
                divStyle.position = buttonStyle.position;
                divStyle.padding = buttonStyle.padding;
                divStyle.zIndex = buttonStyle.zIndex;
                divStyle.margin = buttonStyle.margin;
                divStyle.borderRadius = buttonStyle.borderRadius;
                divStyle.outline = buttonStyle.outline;
                divStyle.textAlign = buttonStyle.textAlign;
                divStyle.lineHeight = buttonStyle.lineHeight;
                divStyle.backgroundColor = buttonStyle.backgroundColor;
                divStyle.fontSize = buttonStyle.fontSize;
                divStyle.color = buttonStyle.color;
                divStyle.opacity = buttonStyle.opacity;

                divStyle.top = top + "px";
                divStyle.left = left + "px";
                divStyle.width = buttonDivStyle.width;
                divStyle.height = buttonDivStyle.height;
                divStyle.borderStyle = buttonDivStyle.borderStyle;
                divStyle.borderWidth = buttonDivStyle.borderWidth;
                divStyle.borderColor = buttonDivStyle.borderColor;

                div.innerHTML = but.text;
                //log(`${divStyle.left}, ${divStyle.top}`)
                IFRAME.appendChild(div);
            }

            function hideDiv(div) {
                div.parentNode && div.parentNode.removeChild(div);
            }

            function hideAllDiv() {
                for (let i = 0; i < divs.length; i++) {
                    hideDiv(divs[i]);
                }
            }

            function showButton(position, button) {
                button.move(position.left, position.top);
            }

            function hideAllButton(buttons) {
                for (let i = 0; i < buttons.length; i++) {
                    buttons[i].hide();
                }
            }

            return function(key, settings) {
                let positions = settings.positions,
                    defaultButtons = settings.defaultButtons,
                    buttonsIdx = settings.ButtonsIdx[settings.idx],
                    p = { x: renjuCmddiv.offsetLeft, y: renjuCmddiv.offsetTop };
                xyObjToPage(p, renjuCmddiv.parentNode);
                let paddingLeft = p.x - cBdLeft,
                    paddingTop = ~~(CLOSE_BUTTON.offsetTop + parseInt(CLOSE_BUTTON.style.height) * 1.5);
                settingsKey = key;
                pSettings = settings;
                pButtonsIdx = buttonsIdx;
                newButtonsIdx = [];
                Positions = positions;
                DefaultButtons = defaultButtons;
                hideAllButton(defaultButtons);
                hideAllDiv();
                VIEW.setAttribute("class", "showEXWindow");
                document.body.appendChild(VIEW);
                for (let i = 0; i < defaultButtons.length; i++) {
                    let left = paddingLeft + parseInt(positions[i].left),
                        top = paddingTop + ~~(i / 4) * parseInt(defaultButtons[i].height) * 1.5;
                    showDiv(left, top, divs[i], defaultButtons[i]);
                    setButtonClick(divs[i], function() {
                        hideDiv(divs[i]);
                        showButton(positions[newButtonsIdx.length], defaultButtons[i]);
                        newButtonsIdx.push(i);
                    });
                }
            }
        })();


        let p = { x: 0, y: 0 };
        xyObjToPage(p, renjuCmddiv);
        
        const FONT_SIZE = sw / 28;
        const EX_WINDOW_LEFT = parseInt(renjuCmdSettings.positions[8].left) + p.x;
        const EX_WINDOW_TOP = parseInt(renjuCmdSettings.positions[8].top) + p.y;
        const EX_WINDOW_WIDTH = w * 5;
        const EX_WINDOW_HEIGHT = h * 1.5 * 7 + h;
        try{window.exWindow.setStyle(EX_WINDOW_LEFT, EX_WINDOW_TOP, EX_WINDOW_WIDTH, EX_WINDOW_HEIGHT, FONT_SIZE);
        }catch(e){alert(e.stack)}
        
        /*window.exWindow = (() => {
            "use strict";
            const d = document;
            const dw = d.documentElement.clientWidth;
            const dh = d.documentElement.clientHeight;
            const winWidth = 980;
            const winHeight = winWidth * dh / dw;
            const scale = dw / 980;

            const EX_WINDOW = document.createElement("div");

            const IFRAME = document.createElement("div");
            IFRAME.setAttribute("id", "exWindow");
            EX_WINDOW.appendChild(IFRAME);

            const CLOSE_BUTTON = document.createElement("img");
            CLOSE_BUTTON.src = "./pic/close.svg";
            //CLOSE_BUTTON.setAttribute("class", "button");
            CLOSE_BUTTON.oncontextmenu = (event) => {
                event.preventDefault();
            }
            setButtonClick(CLOSE_BUTTON, closeWindow);
            EX_WINDOW.appendChild(CLOSE_BUTTON);

            let p = { x: 0, y: 0 };
            xyObjToPage(p, renjuCmddiv);

            const FONT_SIZE = sw / 28 + "px";
            const EX_WINDOW_LEFT = parseInt(renjuCmdSettings.positions[8].left) + p.x + "px";
            const EX_WINDOW_TOP = parseInt(renjuCmdSettings.positions[8].top) + p.y + "px";
            const EX_WINDOW_WIDTH = w * 5 + "px";
            const EX_WINDOW_HEIGHT = h * 1.5 * 7 + h + "px";

            function resetStyle() {

                let s = EX_WINDOW.style;
                s.position = "absolute";
                s.left = EX_WINDOW_LEFT;
                s.top = EX_WINDOW_TOP;
                s.width = EX_WINDOW_WIDTH;
                s.height = EX_WINDOW_HEIGHT;
                s.zIndex = 9999;

                s = IFRAME.style;
                s.position = "absolute";
                s.left = 0;
                s.top = 0;
                s.width = parseInt(EX_WINDOW_WIDTH) - parseInt(FONT_SIZE) * 2 + "px";
                s.height = EX_WINDOW_HEIGHT;
                s.fontSize = FONT_SIZE;
                s.borderStyle = "solid";
                s.borderWidth = `${sw/260}px`;
                s.borderColor = "black";
                s.background = "white";
                s.fontWeight = "normal";
                s.padding = `${0} ${FONT_SIZE} ${0} ${FONT_SIZE}`;
                
                s = CLOSE_BUTTON.style;
                let sz = parseInt(EX_WINDOW_WIDTH) / 10 + "px";
                s.position = "absolute";
                s.left = (parseInt(EX_WINDOW_WIDTH) - parseInt(sz)) / 2 + "px";
                s.top = "0px";
                s.width = sz;
                s.height = sz;
                s.opacity = "0.5";
                s.backgroundColor = "#c0c0c0";
            }

            function openWindow() {
                if (EX_WINDOW.parentNode) return;
                resetStyle();
                EX_WINDOW.setAttribute("class", "showEXWindow");
                document.body.appendChild(EX_WINDOW); //插入body内，保证a标签可以工作。因为renjuCmddiv.parentNode屏蔽了浏览器触摸click
            }

            function closeWindow() {
                IFRAME.innerHTML = "";
                EX_WINDOW.setAttribute("class", "hideEXWindow");
                if (EX_WINDOW.parentNode) setTimeout(() => EX_WINDOW.parentNode.removeChild(EX_WINDOW), 350);
            }

            function setHTML(iHtml) {
                IFRAME.innerHTML = iHtml;
            }
            return {
                get innerHTML() { return setHTML },
                get open() { return openWindow },
                get close() { return closeWindow }
            }
        })()
        */



        setTimeout(function() {
            RenjuLib.reset({
                isBusy: isBusy,
                setBusy: setBusy,
                newGame: newGame,
                cBoard: cBd,
                getShowNum: getShowNum,
                setPlayMode: () => setPlayMode(MODE_RENLIB)
            });

        }, 1000 * 1);
    }

    function createImgCmdDiv(parentNode, left, top, width, height) {

        imgCmdDiv = document.createElement("div");
        let s = imgCmdDiv.style;
        s.position = "relative";
        s.width = width / 1.15 + "px";
        s.height = width + "px";
        s.top = parseInt(top) + "px";
        s.left = (dw - parseInt(s.width)) / 2 + "px";
        if (dw > dh) s.left = width / 13 + "px";

        let sw = parseInt(s.width);
        let w = sw / 5;
        let h = sw / 9 / 1.5;
        let t = dw < dh ? 0 - cBd.width - h * 2.5 : 0;
        let menuLeft = parseInt(parentNode.style.left) + parseInt(imgCmdDiv.style.left) + sw * 0.1;
        let menuWidth = sw * 0.8;
        let menuFontSize = sw / 20;

        cZoomIn = new Button(imgCmdDiv, "button", w * 1.33, t, w, h);
        cZoomIn.show();
        cZoomIn.setText("放大");
        cZoomIn.setontouchend(function() {
            const scale = Math.min(cBd.scale * 1.5, 3);
            cBd.setScale(scale);
        })

        cZoomOut = new Button(imgCmdDiv, "button", w * 2.66, t, w, h);
        cZoomOut.show();
        cZoomOut.setText("缩小");
        cZoomOut.setontouchend(function() {
            const scale = Math.max(cBd.scale / 1.5, 1);
            cBd.setScale(scale);
        })

        t = dw < dh ? 0 : t + h * 1.5;

        cLockImg = new Button(imgCmdDiv, "checkbox", w * 0, t, w, h);
        cLockImg.show();
        cLockImg.setText("选定棋盘");
        cLockImg.setontouchend(function() {
            if (cLockImg.checked) {
                lockImg();
            }
            else {
                unLockImg();
            }
        });

        async function unLockImg() {
            await cBd.unlockArea();
            viewport1.userScalable();
        }

        async function lockImg() {
            await cBd.lockArea();
            viewport1.resize();
        }

        cAutoPut = new Button(imgCmdDiv, "button", w * 1.33, t, w, h);
        cAutoPut.show();
        cAutoPut.setText(" 自动识别");
        cAutoPut.setontouchend(async function() {
            if (!cLockImg.checked) {
                await lockImg();
                cLockImg.setChecked(1);
            }
            cBd.autoPut();
            miniBoard.unpackArray(cBd.getArray2D());
            autoblackwhiteRadioChecked(cAddwhite2);
        });



        cPutBoard = new Button(imgCmdDiv, "button", w * 2.66, t, w, h);
        cPutBoard.show();
        cPutBoard.setText(" 摆入棋盘");
        cPutBoard.setontouchend(function() {
            if (true || cBd.SLTX == cBd.size && cBd.SLTY == cBd.size) {
                putBoard();
            }
            else {
                warn("小棋盘,长按屏幕(鼠标右键点击)定位H8");
            }
        });



        cCleAll = new Button(imgCmdDiv, "button", w * 3.99, t, w, h);
        cCleAll.show();
        cCleAll.setText(" 清空棋盘");
        cCleAll.setontouchend(function() {
            for (let i = 15 * 15 - 1; i >= 0; i--) cBd.P[i].cle();
        });

        t += h * 1.5;

        cAddblack2 = new Button(imgCmdDiv, "radio", w * 0, t, w, h);
        cAddblack2.show();
        cAddblack2.setText(` ${EMOJI_ROUND_BLACK} 棋`);
        cAddblack2.setontouchend(function() {
            autoblackwhiteRadioChecked(cAddblack2);
        });

        cAddwhite2 = new Button(imgCmdDiv, "radio", w * 1.33, t, w, h);
        cAddwhite2.show();
        cAddwhite2.setText(` ${EMOJI_ROUND} 棋`);
        cAddwhite2.setontouchend(function() {
            autoblackwhiteRadioChecked(cAddwhite2);
        });


        cSLTY = new Button(imgCmdDiv, "select", w * 2.66, t, w, h);

        for (let i = 15; i >= 5; i--) {
            cSLTY.addOption(i, i);
        }

        cSLTY.createMenu(menuLeft, undefined, menuWidth, cWidth * 0.8, menuFontSize);
        cSLTY.show();
        cSLTY.setText(cSLTY.input.value + " 行");
        cSLTY.setonchange(function(but) {
            but.setText(but.input.value + " 行");
            cBd.SLTY = but.input.value;
            cBd.resetP();
            if (!cLockImg.checked) {
                cBd.cleBorder();
                cBd.printBorder();
            }
            else {
                cLockImg.setChecked(0);
                unLockImg();
            }
        });

        cSLTX = new Button(imgCmdDiv, "select", w * 3.99, t, w, h);
        //cSLTX.addOption(16, "︾");
        for (let i = 15; i >= 5; i--) {
            cSLTX.addOption(i, i);
        }
        //cSLTX.addOption(4, "︽");
        cSLTX.createMenu(menuLeft, undefined, menuWidth, cWidth * 0.8, menuFontSize);
        cSLTX.show();
        cSLTX.setText(cSLTX.input.value + " 列");
        cSLTX.setonchange(function(but) {
            but.setText(but.input.value + " 列");
            cBd.SLTX = but.input.value;
            cBd.resetP();
            if (!cLockImg.checked) {
                cBd.cleBorder();
                cBd.printBorder();
            }
            else {
                cLockImg.setChecked(0);
                unLockImg();
            }
        });

        t += h * 1.5;

        miniBoard = new CheckerBoard(imgCmdDiv, 0, t, w * 2.5, w * 2.5);
        miniBoard.setCoordinate(5);
        miniBoard.resetCBoardCoordinate();
        miniBoard.printEmptyCBoard();
        miniBoard.viewBox.addEventListener("touchstart", () => event.preventDefault())

        t += h * 1;

        cRotate90 = new Button(imgCmdDiv, "button", w * 2.66, t, w, h);
        cRotate90.show();
        cRotate90.setText("↗90°");
        cRotate90.setontouchend(function() {
            miniBoard.rotate90()
        })

        cUp = new Button(imgCmdDiv, "button", w * 3.99, t, w, h);
        cUp.show();
        cUp.setText("↑");
        cUp.setontouchend(function() {
            miniBoard.translate(-1, 0)
        })

        t += h * 1.5;

        cLeft = new Button(imgCmdDiv, "button", w * 2.66, t, w, h);
        cLeft.show();
        cLeft.setText("←");
        cLeft.setontouchend(function() {
            miniBoard.translate(0, -1)
        })
        cRight = new Button(imgCmdDiv, "button", w * 3.99, t, w, h);
        cRight.show();
        cRight.setText("→");
        cRight.setontouchend(function() {
            miniBoard.translate(0, 1)
        })

        t += h * 1.5;

        cDown = new Button(imgCmdDiv, "button", w * 3.99, t, w, h);
        cDown.show();
        cDown.setText("↓");
        cDown.setontouchend(function() {
            miniBoard.translate(1, 0)
        })

        cTotate180 = new Button(imgCmdDiv, "button", w * 2.66, t, w, h);
        cTotate180.show();
        cTotate180.setText("↔180°");
        cTotate180.setontouchend(function() {
            miniBoard.rotateY180()
        })

        t += h * 1.5;

        cPutMiniBoard = new Button(imgCmdDiv, "button", w * 2.66, t, w, h);
        cPutMiniBoard.show();
        cPutMiniBoard.setText("摆入棋盘");
        cPutMiniBoard.setontouchend(function() {
            putBoard(null, miniBoard)
        })

        cCleMiniBoard = new Button(imgCmdDiv, "button", w * 3.99, t, w, h);
        cCleMiniBoard.show();
        cCleMiniBoard.setText("清空棋盘");
        cCleMiniBoard.setontouchend(function() {
            miniBoard.cle()
        })


        autoblackwhiteRadioChecked = setRadio([cAddblack2, cAddwhite2], function() {
            if (!cLockImg.checked) {
                lockImg();
                cLockImg.setChecked(1);
            }
        });


        for (let i = 0; i < 9; i++) { // set positions
            if (i === 0) t = 0;
            else t += h * 1.5;
            for (let j = 0; j < 4; j++) {
                imgCmdSettings.positions.push({
                    left: w * j * 1.33,
                    top: t
                });
            }
        }
        imgCmdSettings.defaultButtons = [
            cLockImg,
            cAutoPut,
            cPutBoard,
            cCleAll,
            cAddblack2,
            cAddwhite2,
            cSLTX,
            cSLTY
            ];

        imgCmdSettings.ButtonsIdx[0] = [0, 1, 2, 3, 4, 5, 6, 7];
        imgCmdSettings.idx = 0;
        //moveButtons(imgCmdSettings);
    }

    //------------------------------ setCheckerBoardEvent ------------------------------ 

    function setCheckerBoardEvent(bodyDiv) {
        //用来保存跟踪正在发送的触摸事件
        let bodyStartTouches = [];
        let bodyPreviousTouch = [];
        let continueSetCutDivX = 0;
        let continueSetCutDivY = 0;
        let isBodyClick = false; // 辅助判断单击
        let timerBodyKeepTouch = null;
        let timerContinueSetCutDiv = null;
        let exitContinueSetCutDivMove = null;

        //处理触摸开始事件
        function bodyTouchStart(evt) {
            let touches = evt.changedTouches; //记录坐标，给continueSetCutDiv使用
            continueSetCutDivX = touches[0].pageX;
            continueSetCutDivY = touches[0].pageY;
            if (bodyStartTouches.length == 0) {
                if (bodyPreviousTouch.length) { //触发滑动调整
                    //evt.preventDefault();
                    if (timerContinueSetCutDiv == null) {
                        timerContinueSetCutDiv = setTimeout(continueSetCutDivStart, 0);
                        // 触发长按事件之前删除定时器，变量timerBodyKeepTouch还要用来判断双击事件，由touchend 清空变量。
                        setTimeout(function() { clearTimeout(timerBodyKeepTouch) }, 600);
                    }
                }
                //初始化长按事件
                if (!timerBodyKeepTouch) {
                    timerBodyKeepTouch = setTimeout(bodyKeepTouch, 500);
                }
                //保存当前触摸点
                bodyStartTouches.push(copyTouch(touches[0], 1));
                //初始化单击事件
                isBodyClick = true;
            }
            else
            {
                // 多点触摸取消长按事件
                if (timerBodyKeepTouch) {
                    clearTimeout(timerBodyKeepTouch);
                    timerBodyKeepTouch = null;
                }
                let touchNum = bodyStartTouches.length + 1; //判断是第几个手指触摸屏幕
                if (touchNum > 3) return; //超过3指忽略
                // 多点触摸 取消单击事件。
                isBodyClick = false;
                bodyStartTouches.push(copyTouch(touches[0], touchNum));
            }
        }

        //处理触摸移动事件
        function bodyTouchMove(evt) {
            //evt.preventDefault();
            if (timerContinueSetCutDiv) evt.preventDefault();
            let touches = evt.changedTouches;
            if (timerBodyKeepTouch != null) { //取消长按事件
                clearTimeout(timerBodyKeepTouch);
                timerBodyKeepTouch = null;
            }
            //记录坐标，给continueSetCutDiv使用
            continueSetCutDivX = touches[0].pageX;
            continueSetCutDivY = touches[0].pageY;
            if ((bodyPreviousTouch.length && Math.abs(bodyPreviousTouch[0].pageX - touches[0].pageX) > 30) && (Math.abs(bodyPreviousTouch[0].pageY - touches[0].pageY) > 30)) {
                isBodyClick = false; // 取消单击事件。
            }
        }

        //处理触摸结束事件
        function bodyTouchEnd(evt) {
            let cancelClick = false;
            let touches = evt.changedTouches;
            let idx = onTouchesIndex(touches[0].identifier, bodyStartTouches);
            clearTimeout(timerContinueSetCutDiv); // 取消  ContinueSetCutDiv 事件
            if (timerContinueSetCutDiv) {
                timerContinueSetCutDiv = null;
                //setTimeout(continueSetCutDivEnd, 10);
            }
            if (timerBodyKeepTouch) { //取消长按事件
                clearTimeout(timerBodyKeepTouch);
                timerBodyKeepTouch = null;
            }
            else { // 触发了长按事件，取消单击
                cancelClick = true;
            }
            if (idx >= 0) {
                let sX = bodyStartTouches[idx].pageX;
                let sY = bodyStartTouches[idx].pageY;
                let tX = touches[0].pageX;
                let tY = touches[0].pageY;
                let xMove = tX - sX;
                let yMove = tY - sY;
                let touchNum = bodyStartTouches.length; //判断是第几个手指触摸屏幕

                if (touchNum > 3) { // 超过3指重置触摸跟踪
                    bodyStartTouches.length = 0; //remove it; we're done
                    return;
                }
                if ((!cancelClick) && isBodyClick) {
                    //log(`cancelClick=${cancelClick}, isBodyClick=${isBodyClick}, length=${bodyPreviousTouch.length } `);
                    if (true || !cBd.isOut(tX, tY, cBd.viewBox))
                        evt.preventDefault(); // 屏蔽浏览器双击放大 && clickEvent
                    if ((bodyPreviousTouch.length > 0) &&
                        (Math.abs(bodyPreviousTouch[0].pageX - tX) < 30) &&
                        (Math.abs(bodyPreviousTouch[0].pageY - tY) < 30)
                    ) {
                        bodyPreviousTouch.length = 0;
                        /////////这里添加双击事件////////
                        //通过 isOut 模拟 canvas事件
                        if (!cBd.isOut(tX, tY, cBd.viewBox)) {
                            setTimeout(canvasDblClick(tX, tY), 10);
                            //log("canvas 双击");
                        }
                        else {
                            //setTimeout(bodyDblClick(tX, tY), 10);
                            //log("Body 双击");
                        }
                    }
                    else {
                        bodyPreviousTouch[0] = copyTouch(touches[0], 1);
                        setTimeout(() => {
                            bodyPreviousTouch.length = 0;
                        }, 500);
                        /////////这里添加单击事件////////
                        //通过 isOut 模拟 canvas事件
                        if (!cBd.isOut(tX, tY, cBd.viewBox)) {
                            canvasClick(tX, tY);
                            //log("canvas 单击");
                        }
                        else {
                            //bodyClick(tX, tY);
                            //log("Body 单击");
                        }
                    }
                }
                bodyStartTouches.splice(idx, 1); //remove it;we're done
            }
            else { // 出错重新初始化 触摸跟踪
                bodyStartTouches.length = 0;
            }
            bodyStartTouches.length = 0;
        }

        //处理触摸对出事件
        function bodyTouchCancel(evt) {
            //log(`touchCancel`)
            evt.preventDefault();
            let touches = evt.changedTouches;
            // 取消 continueSetCutDiv 事件
            clearInterval(timerContinueSetCutDiv);
            if (timerContinueSetCutDiv) {
                timerContinueSetCutDiv = null;
                //setTimeout(continueSetCutDivEnd, 10);
            }
            if (timerBodyKeepTouch) { // 取消长按事件
                clearTimeout(timerBodyKeepTouch);
                timerBodyKeepTouch = null;
            }
            bodyStartTouches.length = 0;
        }

        function bodyClick(x, y) {

            let p = { x: 0, y: 0 };
            x = event.type == "click" ? event.pageX : x;
            y = event.type == "click" ? event.pageY : y;
            cBd.xyPageToObj(p, cBd.viewBox);
            canvasClick(p.x, p.y);
        }

        function bodyDblClick(x, y) {

            let p = { x: 0, y: 0 };
            x = event.type == "click" ? event.pageX : x;
            y = event.type == "click" ? event.pageY : y;
            cBd.xyPageToObj(p, cBd.viewBox);
            canvasDblClick(p.x, p.y);
        }

        let cancelContextmenu = false;

        function bodyKeepTouch() {

            if (cancelContextmenu) return;
            if (timerBodyKeepTouch) {
                clearTimeout(timerBodyKeepTouch); //防止与canvas重复重复
                timerBodyKeepTouch = null;
            }
            cancelContextmenu = true;
            setTimeout(() => {
                cancelContextmenu = false;
            }, 1000);
            //log(event)
            //log(`event.button=${event.button}, typeof(x)=${typeof(event)}, x=${event.pageX}`);
            let x = bodyStartTouches[0] ? bodyStartTouches[0].pageX : event.pageX;
            let y = bodyStartTouches[0] ? bodyStartTouches[0].pageY : event.pageY;
            //  针对 msg 弹窗 恢复下一次长按事件
            bodyStartTouches.length = 0;
            //通过 isOut 模拟 canvas事件
            if (!cBd.isOut(x, y, cBd.viewBox)) {
                iphoneCancelClick.enable();
                setTimeout(canvasKeepTouch(x, y), 10);
                //log("canvad 长按");
            }
            else {
                //log("Body 长按");
            }
        }

        //拷贝一个触摸对象
        function copyTouch(touch, touchNum) {

            return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY, touchNum: touchNum };
        }

        //找出正在进行的触摸
        function onTouchesIndex(idToFind, touches) {

            for (let i = 0; i < touches.length; i++) {
                let id = touches[i].identifier;
                if (id == idToFind) { return i; }
            }
            return -1; //notfound
        }

        function canvasKeepTouch(x, y) {

            if (playMode != MODE_LOADIMG) {
                renjuKeepTouch(x, y);
            }
            else {
                if (cLockImg.checked) {
                    putCheckerBoard(cBd.getIndex(x, y));
                }
                else {
                    if (!timerContinueSetCutDiv)
                        timerContinueSetCutDiv = setTimeout(continueSetCutDivStart, 10);
                }
            }

        }

        function canvasClick(x, y) {
            if (iphoneCancelClick.isCancel()) return;
            //log(`event.button=${event.button}, typeof(x)=${typeof(x)}, x=${x}, y=${y}`);
            x = event.type == "click" ? event.pageX : x;
            y = event.type == "click" ? event.pageY : y;
            //log(`get=${playMode },ren=${MODE_RENJU}`)
            if (playMode != MODE_LOADIMG) {
                renjuClick(x, y);
            }
            else if (!cLockImg.checked) {
                if (cBd.isOut(x, y, cBd.viewBox)) return;
                let p = { x: x, y: y };
                cBd.setxy(p, event.type == "click" ? 2 : 1);
                cBd.setCutDiv(p.x, p.y, true);
                cBd.resetP();
                cBd.printBorder();
            }
            else {
                let idx = cBd.getIndex(x, y);
                if (idx < 0) return;
                let color = cAddwhite2.checked ? "white" : "black";
                if (cBd.P[idx].type != TYPE_EMPTY) {
                    cBd.P[idx].cle();
                }
                else {
                    cBd.P[idx].printNb(EMOJI_STAR_BLACK, color, cBd.gW, cBd.gH, color == "white" ? cBd.wNumColor : cBd.bNumColor);
                }
            }
        }

        function canvasDblClick(x, y) {

            if (playMode != MODE_LOADIMG) {
                if (event.type == "dblclick")
                    renjuDblClick(event.pageX, event.pageY);
                else
                    renjuDblClick(x, y);
            }
        }

        function continueSetCutDivStart() {
            if (playMode != MODE_LOADIMG || cLockImg.checked) return;
            cBd.selectArea(continueSetCutDivX, continueSetCutDivY);
        }

        bodyDiv.addEventListener("contextmenu", bodyKeepTouch, true);
        bodyDiv.addEventListener("touchstart", bodyTouchStart, true);
        bodyDiv.addEventListener("touchend", bodyTouchEnd, true);
        bodyDiv.addEventListener("touchcancel", bodyTouchCancel, true);
        bodyDiv.addEventListener("touchleave", bodyTouchCancel, true);
        bodyDiv.addEventListener("touchmove", bodyTouchMove, true);
        bodyDiv.addEventListener("click", bodyClick, true);
        bodyDiv.addEventListener("dblclick", bodyDblClick, true);
    }

    //------------------------ helpWindow ------------------------- 





    function mapLb(callback) {
        cBd.map(p => {
            switch (p.type) {
                case TYPE_MARK:
                case TYPE_BLACK:
                case TYPE_WHITE:
                    callback(p);
            }
        })
    }

    function getMaxChar(startChar = "A") { // 搜索棋盘上最大的字母;
        let code = startChar.charCodeAt();
        mapLb(p => {
            if (p.text.length == 1) {
                let tcode = p.text.charCodeAt(0);
                if (tcode >= code && tcode <= (code + 25))
                    code = tcode < (code + 25) ? tcode + 1 : tcode;
            }
        })
        return String.fromCharCode(code);
    }

    function getMaxNum(minNum = 1, maxNum = 225) {
        let code = minNum;
        mapLb(p => {
            let tcode = p.text * 1;
            if (tcode >= code && tcode <= maxNum) {
                code = tcode < maxNum ? tcode + 1 : tcode;
            }
        })
        return code;
    }

    function getContinuLb() {
        let lbIdx = 0;
        mapLb(p => {
            let i = continueLabel.lastIndexOf(p.text);
            if (i >= lbIdx) {
                lbIdx = i < continueLabel.length - 1 ? i + 1 : i;
            }
        })
        return continueLabel[lbIdx];
    }

    //返回参数确认 添加棋子 还是标签
    //info = {type, boardText, isShowNum};
    function createCommandInfo() {
        let isShow = getShowNum() ? true : false,
            color = getRenjuLbColor();

        switch (true) {
            case cAutoadd.checked:
                return { type: TYPE_NUMBER, color: "auto", isShowNum: isShow };
            case cAddblack.checked:
                return { type: TYPE_BLACK, color: "black", isShowNum: isShow };
            case cAddwhite.checked:
                return { type: TYPE_WHITE, color: "white", isShowNum: isShow };
            case cLba.checked:
                return { type: TYPE_MARK, color: color, boardText: EMOJI_SQUARE_BLACK };
            case cLbb.checked:
                return { type: TYPE_MARK, color: color, boardText: EMOJI_ROUND_DOUBLE };
            case cLbc.checked:
                return { type: TYPE_MARK, color: color, boardText: EMOJI_TRIANGLE_BLACK };
            case cLbd.checked:
                return { type: TYPE_MARK, color: color, boardText: EMOJI_FORK };
            case cLABC.checked:
                switch (cLABC.input.value * 1) {
                    case 0:
                        return { type: TYPE_MARKARROW, color: color };
                    case 1:
                        return { type: TYPE_MARKLINE, color: color };
                    case 2:
                        return { type: TYPE_MARK, color: color, boardText: getMaxChar("A") };
                    case 3:
                        return { type: TYPE_MARK, color: color, boardText: getMaxChar("a") };
                    case 4:
                        return { type: TYPE_MARK, color: color, boardText: getMaxNum(1, 225) };
                    case 5:
                        return { type: TYPE_MARK, color: color, boardText: getContinuLb() };
                    case 6:
                        return { type: TYPE_MARK, color: color, boardText: EMOJI_STAR };
                    case 7:
                        return { type: TYPE_MARK, color: color, boardText: EMOJI_FOUL };
                }
        }
    }

    function getRenjuLbColor() {
        return lbColor[cLbColor.input.value].color;
    }

    function getRenjuSelColor() {
        return cSelBlack.checked ? 1 : 2;
    }

    let timerCancelKeepTouch = null; // 防止悔棋触发取消红色显示

    function cancelKeepTouch() {
        if (timerCancelKeepTouch) return true;
        timerCancelKeepTouch = setTimeout(function() { timerCancelKeepTouch = null; }, 800);
    }

    function selectBranch(point) {
        let obj = point.branchs;
        return new Promise((resolve, reject) => {
            try {
                if (obj) {
                    let i = obj.branchsInfo + 1 & 1;
                    if (obj.branchsInfo == 3) {
                        msgbox({
                            title: `请选择黑棋,白棋分支`,
                            enterTXT: "黑棋",
                            cancelTXT: "白棋",
                            butNum: 2,
                            enterFunction: () => resolve({ path: obj.branchs[0].path, nMatch: obj.branchs[0].nMatch }),
                            cancelFunction: () => resolve({ path: obj.branchs[1].path, nMatch: obj.branchs[1].nMatch })
                        })
                    }
                    else {
                        resolve({ path: obj.branchs[i].path, nMatch: obj.branchs[i].nMatch });
                    }
                }
                else {
                    resolve({ path: undefined, nMatch: 0 });
                }
            }
            catch (err) {
                reject(err);
                console.error(err);
            }
        });
    }

    function toStart(isShowNum) {
        cBoard.toStart(isShowNum);
    }

    function toPrevious(isShowNum, timeout = 0) {
        cBoard.toPrevious(isShowNum, timeout);
        cBoard.MS[cBoard.MSindex] == 225 && cBoard.toPrevious(isShowNum, timeout);
    }

    function toNext(isShowNum, timeout = 0) {
        cBoard.toNext(isShowNum, timeout);
        cBoard.MS[cBoard.MSindex] == 225 && cBoard.toNext(isShowNum, timeout);
    }

    function toEnd(isShowNum) {
        cBoard.toEnd(isShowNum);
    }

    function renjuClick(x, y) {
        if (isBusy(cBd.isOut(x, y, cBd.viewBox) ? false : true)) return;
        let idx = cBd.getIndex(x, y),
            arr = cBd.getArray(),
            isF = gameRules == RENJU_RULES && isFoul(idx, arr),
            pInfo = createCommandInfo();

        if (idx < 0) return;
        cancelKeepTouch();
        switch (playMode) {
            case MODE_RENJU:
            case MODE_RENJU_FREE:
                if (pInfo.type == TYPE_NUMBER) {
                    if (cBd.P[idx].type == TYPE_NUMBER)
                        cBd.cleNb(idx, pInfo.isShowNum); //点击棋子，触发悔棋
                    else if (cBd.P[idx].type == TYPE_EMPTY && playMode == MODE_RENJU) {
                        cBd.wNb(idx, "auto", pInfo.isShowNum, undefined, isF); // 添加棋子  
                    }
                }
                else if (pInfo.type == TYPE_BLACK) {
                    if (cBd.P[idx].type == TYPE_WHITE || cBd.P[idx].type == TYPE_BLACK)
                        cBd.cleNb(idx); //点击棋子，触发悔棋
                    else if (cBd.P[idx].type == TYPE_EMPTY)
                        cBd.wNb(idx, "black", pInfo.isShowNum, undefined, isF); // 添加棋子  
                }
                else if (pInfo.type == TYPE_WHITE) {
                    if (cBd.P[idx].type == TYPE_WHITE || cBd.P[idx].type == TYPE_BLACK)
                        cBd.cleNb(idx); //点击棋子，触发悔棋
                    else if (cBd.P[idx].type == TYPE_EMPTY)
                        cBd.wNb(idx, "white", pInfo.isShowNum); // 添加棋子 
                }
                else if (pInfo.type == TYPE_MARK) {
                    if (cBd.P[idx].type == TYPE_MARK || cBd.P[idx].type == TYPE_MOVE)
                        cBd.cleLb(idx); // 点击标记，删除标记
                    else if (cBd.P[idx].type == TYPE_EMPTY)
                        cBd.wLb(idx, pInfo.boardText, pInfo.color); // 添加标记
                    else if (cBd.P[idx].type == TYPE_WHITE || cBd.P[idx].type == TYPE_BLACK) {
                        if (cBd.P[idx].text) {
                            cBd.P[idx].text = "";
                            cBd._printPoint(idx);
                            cBd.refreshMarkArrow(idx);
                        }
                        else {
                            cBd.P[idx].text = pInfo.boardText;
                            cBd._printPoint(idx, true);
                            cBd.refreshMarkArrow(idx);
                        }
                    }
                }
                else if (pInfo.type == TYPE_MARKARROW) {
                    cBd.drawLineStart(idx, pInfo.color, "arrow");
                }
                else if (pInfo.type == TYPE_MARKLINE) {
                    cBd.drawLineStart(idx, pInfo.color, "line");
                }
                break;
            case MODE_LOADIMG:
                break;
            case MODE_READ_TREE:
                break;
            case MODE_READ_THREEPOINT:
                break;
            case MODE_RENLIB:
            case MODE_READLIB:
            case MODE_READ_FOULPOINT:
                if (cBd.P[idx].type == TYPE_NUMBER) {
                    if (pInfo.type == TYPE_NUMBER || pInfo.type == TYPE_BLACK || pInfo.type == TYPE_WHITE)
                        toPrevious(pInfo.isShowNum); //点击棋子，触发悔棋
                }
                else if (cBd.P[idx].type == TYPE_EMPTY) {
                    if (pInfo.type == TYPE_NUMBER || pInfo.type == TYPE_BLACK || pInfo.type == TYPE_WHITE) {
                        cBd.wNb(idx, "auto", pInfo.isShowNum, undefined, isF); // 添加棋子
                    }
                    else if (pInfo.type == TYPE_MARK) {
                        cBd.wLb(idx, pInfo.boardText, pInfo.color); // 添加标记
                    }
                }
                else if (cBd.P[idx].type == TYPE_MARK) {
                    selectBranch(cBd.P[idx])
                        .then(({ path, nMatch }) => {
                            if (pInfo.type == TYPE_NUMBER || pInfo.type == TYPE_BLACK || pInfo.type == TYPE_WHITE) {
                                if (path && path.length) {
                                    (path.indexOf(idx) & 1) == (cBd.MSindex & 1) &&
                                    cBd.wNb(225, "auto", pInfo.isShowNum, undefined, undefined, 100);
                                    cBd.wNb(idx, "auto", pInfo.isShowNum, undefined, isF, 100);
                                }
                                else {
                                    cBd.wNb(idx, "auto", pInfo.isShowNum, undefined, isF);
                                }
                            }
                            else if (pInfo.type == TYPE_MARK) {
                                inputLabel(idx, pInfo.boardText);
                            }
                        })
                        .catch(err => console.error(err));
                }
                break;
            case MODE_EDITLIB:
                if (cBd.P[idx].type == TYPE_NUMBER) {
                    if (pInfo.type == TYPE_NUMBER || pInfo.type == TYPE_BLACK || pInfo.type == TYPE_WHITE)
                        toPrevious(pInfo.isShowNum); //点击棋子，触发悔棋
                }
                else if (cBd.P[idx].type == TYPE_EMPTY) {
                    if (pInfo.type == TYPE_NUMBER) {
                        cBd.wNb(idx, "auto", pInfo.isShowNum, undefined, isF);
                    }
                    else if (pInfo.type == TYPE_BLACK) {
                        if (0 == (cBd.MSindex & 1)) cBd.wNb(225, "auto", pInfo.isShowNum, undefined, isF);
                        cBd.wNb(idx, "auto", pInfo.isShowNum, undefined, isF);
                    }
                    else if (pInfo.type == TYPE_WHITE) {
                        if (1 == (cBd.MSindex & 1)) cBd.wNb(225, "auto", pInfo.isShowNum, undefined, isF);
                        cBd.wNb(idx, "auto", pInfo.isShowNum, undefined, isF);
                    }
                    else if (pInfo.type == TYPE_MARK) {
                        cBd.wLb(idx, pInfo.boardText, pInfo.color); // 添加标记
                    }
                    cBd.tree.createPath(cBd.tree.transposePath(cBd.MS.slice(0, cBd.MSindex + 1)));
                }
                else if (cBd.P[idx].type == TYPE_MARK) {
                    selectBranch(cBd.P[idx])
                        .then(({ path, nMatch }) => {
                            //alert(`path: ${path}, nMatch: ${nMatch}`)
                            if (pInfo.type == TYPE_NUMBER || pInfo.type == TYPE_BLACK || pInfo.type == TYPE_WHITE) {
                                if (path && path.length) {
                                    cBd.tree.nMatch = nMatch;
                                    while (cBd.MSindex > -1) {
                                        cBd.toPrevious(pInfo.isShowNum, 100);
                                    }
                                    for (let i = 0; i < path.length; i++) {
                                        cBd.wNb(path[i], "auto", pInfo.isShowNum, undefined, i == (path.length - 1) && isF, 100);
                                    }
                                }
                                else {
                                    cBd.wNb(idx, "auto", pInfo.isShowNum, undefined, isF);
                                }
                            }
                            else if (pInfo.type == TYPE_MARK) {
                                //first save oldPath
                                path = cBd.tree.transposePath(path || cBd.MS.slice(0, cBd.MSindex + 1).concat([idx]), nMatch);
                                inputLabel(idx, pInfo.boardText)
                                    .then(function(boardText) {
                                        let node = cBd.tree.seek(path);
                                        node && (node.boardText = boardText);
                                        cBd.stonechange();
                                    })
                            }
                        })
                        .catch(err => console.error(err));
                }
                break;
        }
    }

    function renjuDblClick(x, y) {
        if (isBusy()) return;
        let idx = cBd.getIndex(x, y);
        if (idx > -1) {
            // 触发快速悔棋
            if (cBd.P[idx].type == TYPE_NUMBER) {
                if (idx != cBd.MS[cBd.MSindex]) {
                    while (cBd.MS[cBd.MSindex] != idx) {
                        cBd.cleNb(cBd.MS[cBd.MSindex], getShowNum());
                    }
                }
                else { // 
                    if (!cancelKeepTouch()) renjuKeepTouch(x, y);
                }
            } // 触发，手动输入标记
            else if ((cBd.P[idx].type == TYPE_MARK || cBd.P[idx].type == TYPE_MOVE || cBd.P[idx].type == TYPE_EMPTY) && !cAutoadd.checked && !cAddblack.checked && !cAddwhite.checked) {
                inputLabel(idx);
            }
        }
    }

    function renjuKeepTouch(x, y) {
        if (isBusy()) return;
        let idx = cBd.getIndex(x, y);
        if (idx < 0) return;

        if (idx == cBd.MS[cBd.MSindex]) {
            msgbox({
                title: `确认${cBd.hideLastMove ? "恢复" : "取消"} 最后一手红色显示。`,
                butNum: 2,
                enterFunction: () => {
                    cBd.hideLastMove = !cBd.hideLastMove;
                    if (getShowNum()) cBd.showNum();
                    else cBd.hideNum();
                }
            })
        }
        else if (cBd.P[idx].type == TYPE_MARK && playMode == MODE_EDITLIB) {
            msgbox({
                    title: `删除${idxToName(idx)}后续的结点`,
                    enterTXT: "删除",
                    butNum: 2
                })
                .then(({ butCode }) => {
                    butCode == MSG_ENTER && selectBranch(cBd.P[idx])
                        .then(({ path, nMatch }) => {
                            path = path || cBd.MS.slice(0, cBd.MSindex + 1).concat([idx]);
                            cBd.tree.removeBranch(cBd.tree.transposePath(path, nMatch));
                            cBd.stonechange();
                        })
                })
        }
        else {
            if (!cBd.isOut(x, y, cBd.viewBox, -~~(cBd.width / 8))) {
                cMenu.idx = idx;
                cMenu.showMenu(undefined, y - window.scrollY - cMenu.menu.fontSize * 2.5 * 3);
            }
            else {
                iphoneCancelClick.enable();
                scaleCBoard(cBd.scale == 1, 1);
            }
        }
    }

    function inputLabel(idx, boardText = "") {
        let w = cBd.width * 0.8;
        let h;
        let l = (dw - w) / 2;
        let t = dh / 7;
        // 设置弹窗，让用户手动输入标记
        return msg({
                text: boardText,
                type: "input",
                enterTXT: "输入标记",
                butNum: 2,
                enterFunction: msgStr => {
                    if (checkCommand(msgStr)) return;
                    let str = msgStr.substr(0, 3),
                        color = getRenjuLbColor();
                    boardText = str;
                    cBd.cleLb(idx); // 清除原来标记，打印用户选定的标记
                    if (str) cBd.wLb(idx, str, color);
                }
            })
            .then(({ inputStr }) => {
                return Promise.resolve(inputStr);
            })
    }

    function isBusy(loading = true) {
        let busy = cCancelFind.div.parentNode; //!cLoadImg.div.parentNode || !cCutImage.div.parentNode || !cFindVCF.div.parentNode || !cFindPoint.div.parentNode;
        if (busy && loading) loadAnimation.open("busy", 1600);
        return busy;
    }

    function setBusy(value, timeout = 0) {
        if (value) {
            for (let i = renjuCmdSettings.ButtonsIdx[renjuCmdSettings.idx].length - 1; i >= 0; i--) {
                renjuCmdSettings.defaultButtons[renjuCmdSettings.ButtonsIdx[renjuCmdSettings.idx][i]].hide();
            }
            cCancelFind.setText(`${EMOJI_STOP} 停止`);
            cCancelFind.move(renjuCmdSettings.positions[6].left, renjuCmdSettings.positions[6].top, renjuCmdSettings.defaultButtons[0].width, renjuCmdSettings.defaultButtons[0].height);
            lbTime.move(renjuCmdSettings.positions[5].left, renjuCmdSettings.positions[5].top, renjuCmdSettings.defaultButtons[0].width, renjuCmdSettings.defaultButtons[0].height, ~~(parseInt(renjuCmdSettings.defaultButtons[0].width) / 4) + "px");
        }
        else {
            moveButtons(renjuCmdSettings);
            cCancelFind.move(-0XFFFF, -0XFFFF);
            setTimeout(() => cCancelFind.hide(), timeout);
            lbTime.close()
        }
        _setBlockUnload();
    }

    function getPlayMode() {
        return playMode;
    }

    function setPlayMode(mode) {
        switch (playMode) {
            case MODE_RENLIB:
                //remove Tree
                if (mode != MODE_RENLIB) {
                    RenjuLib.closeLib();
                }
                case MODE_RENJU:
                    if (mode == MODE_RENJU_FREE) {
                        let arr = cBd.getArray();
                        cBd.cle();
                        arr.map((color, idx) => {
                            if (color == 1) cBd.wNb(idx, "black");
                            else if (color == 2) cBd.wNb(idx, "white");
                        })
                    }
                    case MODE_RENJU_FREE:
                        //create Tree
                        if (mode == MODE_READLIB || mode == MODE_EDITLIB) {
                            let code = cBd.getCode(),
                                centerPos = { x: cBd.size / 2 + 0.5, y: cBd.size / 2 + 0.5 },
                                tree = new RenjuTree(1, 640, centerPos);
                            playMode = MODE_EDITLIB;
                            cBd.unpackCode(getShowNum(), code, TYPE_NUMBER);
                            cBd.addTree(tree);
                            cBd.tree.createPath(cBd.MS.slice(0, cBd.MSindex + 1));
                        }
                        break;
                    case MODE_READLIB:
                    case MODE_EDITLIB:
                        //remove Tree
                        if (mode == MODE_RENJU || mode == MODE_RENLIB) {
                            let code = cBd.getCode();
                            cBd.removeTree();
                            playMode = MODE_RENJU;
                            cBd.unpackCode(getShowNum(), code);
                        }
                        else if (mode == MODE_RENJU_FREE) {
                            let arr = cBd.getArray();
                            cBd.cle();
                            cBd.removeTree();
                            playMode = MODE_RENJU;
                            arr.map((color, idx) => {
                                if (color == 1) cBd.wNb(idx, "black");
                                else if (color == 2) cBd.wNb(idx, "white");
                            })
                        }
                        break;
        }

        playMode = mode;
        cBd.isTransBranch = mode == MODE_EDITLIB;

        switch (mode) {
            case MODE_RENJU:
                cMode.setText("摆棋");
                break;
            case MODE_RENJU_FREE:
                cMode.setText("无序");
                break;
            case MODE_READLIB:
                cMode.setText("只读");
                cBd.stonechange();
                break;
            case MODE_EDITLIB:
                cMode.setText("编辑");
                cBd.stonechange();
                break;
            case MODE_RENLIB:
                cMode.setText("RenLib");
                cBd.stonechange();
                break;
        }
        _setBlockUnload();
    }


    return {
        MODE_RENJU: MODE_RENJU,
        MODE_RENJU_FREE: MODE_RENJU_FREE,
        MODE_LOADIMG: MODE_LOADIMG,
        MODE_LINE_EDIT: MODE_LINE_EDIT,
        MODE_ARROW_EDIT: MODE_ARROW_EDIT,
        MODE_READ_TREE: MODE_READ_TREE,
        MODE_READ_THREEPOINT: MODE_READ_THREEPOINT,
        MODE_RENLIB: MODE_RENLIB,
        MODE_READ_FOULPOINT: MODE_READ_FOULPOINT,
        MODE_READLIB: MODE_READLIB,
        MODE_EDITLIB: MODE_EDITLIB,

        getPlayMode: getPlayMode,
        setPlayMode: setPlayMode,
        putCheckerBoard: putCheckerBoard,
        renjuKeepTouch: renjuKeepTouch,
        renjuDblClick: renjuDblClick,
        renjuClick: renjuClick,
        getRenjuSelColor: getRenjuSelColor,
        getRenjuLbColor: getRenjuLbColor,
        loadCmdSettings: loadCmdSettings,
        cLockImgChecked: () => { return cLockImg.checked; },
        cAddwhite2Checked: () => { return cAddwhite2.checked; },
        reset: (cBoard, _engine, _msg, _closeMsg, _appData, documentWidth, documentHeight, param, bodyDiv) => {
            cBd = cBoard;
            engine = _engine;
            msg = _msg;
            closeMsg = _closeMsg;
            appData = _appData;
            dw = documentWidth;
            dh = documentHeight;
            parentNode = param[0];
            createRenjuCmdDiv(param[0], param[1], param[2], param[3], param[4]);
            createImgCmdDiv(param[0], param[1], param[2], param[3], param[4]);
            setCheckerBoardEvent(bodyDiv);
        },
    };
})();
