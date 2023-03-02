window.main = (() => {
    "use strict";
    const d = document;
    const dw = d.documentElement.clientWidth;
    const dh = d.documentElement.clientHeight;

    function $(id) { return document.getElementById(id) }

    function log(str) { $("log") && ($("log").innerHTML = str) }

    function log1(str) { $("log1") && ($("log1").innerText = str) }

    //-------------------------------------------------------------

    const STATE_STRING = {
        0: "已经完成搜索",
        1: "点击棋盘添加、删除",
        2: "等待搜索中",
        3: "正在搜索中",
        5: "暂停中...",
        6: "保存中..."
    }
    const STATE_DONE = 0,
        STATE_EMPTY = 1,
        STATE_WAITING = 2,
        STATE_SEARCHING = 3,
        STATE_STOPPING = 5,
        STATE_SAVING = 6;
    let oldState = 1;

    const buttons = [];
    const buttonSettings = [
        {
            type: "button",
            text: "新建",
            touchend: async function() {
                const arr = cBoard.getArray();
                const numStones = arr.filter(v => v > 0).length;
                makeVCF.resetMakeVCF(arr, numStones - (numStones >>> 1), numStones >>> 1);
                makeVCF.cBoard = cBoard;
            }
        },
        {
            type: "button",
            text: "搜索",
            touchend: async function() {
                makeVCF.continueMakeVCF();
            }
        },
        {
            type: "button",
            text: "暂停",
            touchend: async function() {
                makeVCF.stop();
            }
        },
        {
            type: "button",
            text: "清空棋盘",
            touchend: async function() {
                cBoard.cle();
            }
        },
        {
            type: "button",
            text: "上一题",
            touchend: async function() {
                const vcfGame = makeVCF.preVCF();
                miniBoard.unpackArray(vcfGame.array);
                miniBoard.printMoves(vcfGame.winMove, vcfGame.firstColor);
            }
        },
        {
            type: "button",
            text: "下一题",
            touchend: async function() {
                const vcfGame = makeVCF.nextVCF();
                miniBoard.unpackArray(vcfGame.array);
                miniBoard.printMoves(vcfGame.winMove, vcfGame.firstColor);
            }
        },
        {
            type: "button",
            text: "分享连接",
            touchend: async function() {
                let hash = `${miniBoard.getCodeURL()}`,
                    url = window.location.href.split("makevcf.html")[0] + "renju.html" + `#${hash}`;
                if((/^%%%/).test(hash)) return;
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
            }
        },
        {
            type: "button",
            text: "分享图片",
            touchend: function() {
                cBoard.unpackArray(miniBoard.getArray());
                share(cBoard);
            }
        },
        {
            type: "button",
            text: "筛选条件",
            touchend: function() {
                const input = prompt(`输入最短手数,最长手数\n例：3,30`).split(/[\,|，]/) ;
                input[0] = parseInt(input[0]);
                input[1] = parseInt(input[1]);
                let min = input[0] === +input[0] ? input[0] : 0;
                let max = input[1] === +input[1] ? input[1] : 225;
                if(min > max) {const temp = min;min = max;max = temp;}
                makeVCF.filter(min, max);
            }
        },
        {
            type: "button",
            text: "导出JSON",
            touchend: async function() {
                try{
                const info = makeVCF.getStateInfo();
                const games = [];
                for (let idx = 0; idx < info.filterArr.length; idx++) {
                    miniBoard.unpackArray(makeVCF.getVCF(idx).array);
                    games.push(miniBoard.getArray2D());
                    log(`读取... ${idx+1} / ${info.filterArr.length}`);
                    await makeVCF.wait(0);
                }
                if (games.length == 0) return;
                const json = await renjuEditor.toKaiBaoJSON(games);
                renjuEditor.downloadKaiBaoJSON(json, "vcf");
                }catch(e){alert(e.stac)}
            }
        }
    ];

    buttonSettings.splice(4, 0, createLogDiv1(), null, null, null);
    buttonSettings.splice(8, 0, null, null);
    buttonSettings.splice(12, 0, null, null);
    buttonSettings.splice(16, 0, null, null);
    buttonSettings.splice(20, 0, null, null);
    if (dw > dh) {
        buttonSettings.splice(0, 0, null, null, null, null);
    }

    function createButtons(settings) {
        settings.map(setting => {
            if (setting) {
                if (setting.type == "div") {
                    buttons.push(setting);
                }
                else {
                    buttons.push(new Button(document.body, setting.type, 0, 0, mainUI.buttonWidth, mainUI.buttonHeight));
                    const button = buttons[buttons.length - 1];
                    setting.text && button.setText(setting.text);
                    setting.accept && (button.input.accept = setting.accept);
                    setting.touchend && button.setontouchend(setting.touchend);
                    setting.change && button.setonchange(setting.change);
                    setting.options && button.addOptions(setting.options);
                    setting.type == "select" && mainUI.createMenu(button);
                }
            }
            else buttons.push(undefined);
        })
        return buttons;
    }

    function createCmdDiv() {
        const cDiv = mainUI.createCmdDiv();
        const buttons = createButtons(buttonSettings);
        mainUI.addButtons(buttons, cDiv, 1);
        return cDiv;
    }

    function createLogDiv() {
        const lDiv = document.createElement("div");
        const fontSize = mainUI.buttonHeight / 1.8;
        lDiv.style.fontSize = `${fontSize}px`;
        lDiv.style.textAlign = "center";
        lDiv.style.lineHeight = mainUI.buttonHeight + "px";
        lDiv.setAttribute("id", "log");
        return {
            type: "div",
            div: lDiv,
            move: move,
            width: mainUI.cmdWidth,
            height: mainUI.buttonHeight
        }
    }

    function createLogDiv1() {
        const lDiv = document.createElement("div");
        const fontSize = mainUI.buttonHeight / 2;
        lDiv.style.fontSize = `${fontSize}px`;
        lDiv.style.textAlign = "center";
        lDiv.style.lineHeight = fontSize / 2 + "px";
        lDiv.style.backgroundColor = "white";
        lDiv.setAttribute("id", "log1");
        return {
            type: "div",
            div: lDiv,
            move: move,
            width: mainUI.buttonWidth * 2.33,
            height: fontSize / 1.8
        }
    }

    function createCBoard() {
        const cbd = new CheckerBoard(mainUI.upDiv, (mainUI.gridWidth - mainUI.cmdWidth) / 2, (mainUI.gridWidth - mainUI.cmdWidth) / 2, mainUI.cmdWidth, mainUI.cmdWidth);
        cbd.backgroundColor = "white";
        cbd.resetCBoardCoordinate();
        cbd.printEmptyCBoard();
        cbd.bodyScale = mainUI.bodyScale;
        return cbd;
    }

    function createMiniBoard() {
        const width = mainUI.buttonHeight * 7;
        const left = (mainUI.cmdWidth / 2 - width) / 1.5;
        const top = dw > dh ? mainUI.buttonHeight * (1.2 + 3) : mainUI.buttonHeight * 1.5;
        const cbd = new CheckerBoard(mainUI.upDiv, left, top, width, width);
        cbd.backgroundColor = "white";
        cbd.resetCBoardCoordinate();
        cbd.printEmptyCBoard();
        cbd.viewBox.style.zIndex = -1;
        cbd.bodyScale = mainUI.bodyScale;
        return cbd;
    }

    function move(left = this.left, top = this.top, width = this.width, height = this.height, parentNode = this.parentNode) {
        parentNode.appendChild(this.div);
        this.div.style.position = "absolute";
        this.div.style.height = height + "px";
        this.div.style.width = width + "px";
        this.div.style.left = left + "px";
        this.div.style.top = top + "px";
    }

    const cBoard = createCBoard();
    const miniBoard = createMiniBoard();
    const cmdDiv = createCmdDiv();



    function addEvents() {
        function ctnBack(idx) { // 触发快速悔棋
            if (idx + 1 && miniBoard.P[idx].type == TYPE_NUMBER) {
                if (idx != miniBoard.MS[miniBoard.MSindex]) {
                    while (miniBoard.MS[miniBoard.MSindex] != idx) {
                        miniBoard.cleNb(miniBoard.MS[miniBoard.MSindex], true);
                    }
                }
            }
        }
        bindEvent.setBodyDiv(mainUI.bodyDiv, mainUI.bodyScale);
        bindEvent.addEventListener(cBoard.viewBox, "click", (x, y) => {
            //log("click")
            let idx = cBoard.getIndex(x, y);
            if (cBoard.P[idx].type == 0) cBoard.wNb(idx, "black")
            else cBoard.clePoint(idx)
        })
        bindEvent.addEventListener(cBoard.viewBox, "dbltouchstart", (x, y) => {
            //log("dbltouch")
        })
        bindEvent.addEventListener(cBoard.viewBox, "dblclick", (x, y) => {
            //log("dbl")
        })
        bindEvent.addEventListener(cBoard.viewBox, "contextmenu", (x, y) => {
            //log("contextmenu")
        })
        bindEvent.addEventListener(miniBoard.viewBox, "click", (x, y) => {
            let idx = miniBoard.getIndex(x, y);
            if (miniBoard.P[idx].type == 0) miniBoard.wNb(idx, "auto", true)
            else miniBoard.cleNb(idx, true)
        })
        bindEvent.addEventListener(miniBoard.viewBox, "dblclick", (x, y) => {
            let idx = miniBoard.getIndex(x, y);
            ctnBack(idx)
        })
    }

    document.body.onload = () => {
        try {
            miniBoard.move(undefined, undefined, undefined, undefined, cmdDiv);
            createLogDiv().move(0, (dw > dh ? 1 : -1) * mainUI.buttonHeight * 1.1, undefined, undefined, cmdDiv);
            mainUI.viewport.resize();
            addEvents();
            setInterval(() => {
                const info = makeVCF.getStateInfo();
                log(`${STATE_STRING[info.state]}  进度${(info.progress*100).toFixed(2)}%   局面:${info.gameCount}`)
                log1(`${info.filterIdx+1} / ${info.filterArr.length} VCF`);
                if (oldState != info.state) {
                    miniBoard.cle();
                    oldState = info.state;
                }
            }, 1000)
        } catch (e) { alert(e.stack) }
    }

})()
