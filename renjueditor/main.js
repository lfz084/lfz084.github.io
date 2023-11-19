(() => {
    "use strict";
    const d = document;
    const dw = d.documentElement.clientWidth;
    const dh = d.documentElement.clientHeight;
    
    function log(text) {document.getElementById("log").innerText = text}
    
    function log1(text) {document.getElementById("log1").innerText = text}
    
    //-----------------------------------------------------------------------
    
    const MANUAL = 0;
    const UNLOCK = 1;
    const LOCK = 2;

    let warn = true;
    let status = MANUAL;
    let butLock = null;
    let butBlack = null;
    let butWhite = null;
    let logDiv = null;
    let logDiv1 = null;
    let filename = "download";
    let gameIndex = -1;
    const games = [];
    const buttons = [];
    const buttonSettings = [
        {
            type: "button",
            text: "上一页",
            touchend: async function() {
                await unlockArea();
                await renjuEditor.prePage();
            }
        },
        {
            type: "button",
            text: "下一页",
            touchend: async function() {
                await unlockArea();
                await renjuEditor.nextPage();
            }
        },
        {
            type: "file",
            text: "打开文件",
            change: async function() {
                try {
                	mainUI.viewport.resize();
                    await unlockArea();
                    const games = await renjuEditor.openFile(this.files[0], this.value.split("/").pop(), log);
                    filename = getFileName(this.value);
                    setTimeout(() => this.value = "", 0);
                    for(let i = 0; i < games.length; i++) {
                    	pushGame(renjuEditor.gameToArr2D(games[i], i < games.length - 1));
                    	await renjuEditor.wait(0);
                    }
                } catch (e) { alert(e.stack) }
            }
        },
        {
            type: "checkbox",
            text: "选定棋盘",
            touchend: async function() {
                this.checked = !this.checked;
                if (butLock.checked) await lockArea();
                else unlockArea();
            }
        },
        {
            type: "button",
            text: "加入题集",
            touchend: function() {
                if (warn && (cBoard.SLTX < 15 || cBoard.SLTY < 15)) {
                    warn = false;
                    alert(`长按图片天元点可对齐棋盘\n（鼠标可右键代替长按）`);
                }
                const array = cBoard.getArray();
                array.find(v => v > 0) && pushGame(cBoard.getArray2D());
            }
        },
        {
            type: "button",
            text: "自动识别",
            touchend: async function() {
                if (!butLock.checked) await lockArea();
                cBoard.autoPut();
            }
        },
        {
            type: "radio",
            text: "● 棋",
            touchend: () => setColor(1)
        },
        {
            type: "radio",
            text: "○ 棋",
            touchend: () => setColor(2)
        },
        {
            type: "select",
            text: "15 行",
            options: [15, "15 行", 14, "14 行", 13, "13 行", 12, "12 行", 11, "11 行", 10, "10 行", 9, "9 行", 8, "8 行", 7, "7 行", 6, "6 行"],
            change: function() {
                cBoard.SLTY = this.input.value;
                cBoard.resetP(cBoard.cutDiv);
                if (!butLock.checked) {
                    cBoard.cleBorder();
                    cBoard.printBorder();
                }
                else {
                    unlockArea();
                }
            }
        },
        {
            type: "select",
            text: "15 列",
            options: [15, "15 列", 14, "14 列", 13, "13 列", 12, "12 列", 11, "11 列", 10, "10 列", 9, "9 列", 8, "8 列", 7, "7 列", 6, "6 列"],
            change: function() {
                cBoard.SLTX = this.input.value;
                cBoard.resetP(cBoard.cutDiv);
                if (!butLock.checked) {
                    cBoard.cleBorder();
                    cBoard.printBorder();
                }
                else {
                    unlockArea();
                }
            }
        },
        {
            type: "button",
            text: "↗90°",
            touchend: () => {
                miniBoard.rotate90();
                games[gameIndex] = miniBoard.getArray2D();
            }
        },
        {
            type: "button",
            text: "↔180°",
            touchend: () => {
                miniBoard.rotateY180();
                games[gameIndex] = miniBoard.getArray2D();
            }
        },
        {
            type: "button",
            text: "←",
            touchend: () => {
                miniBoard.translate(0, -1);
                games[gameIndex] = miniBoard.getArray2D();
            }
        },
        {
            type: "button",
            text: "→",
            touchend: () => {
                miniBoard.translate(0, 1);
                games[gameIndex] = miniBoard.getArray2D();
            }
        },
        {
        	type: "button",
        	text: "↑",
        	touchend: () => {
        		miniBoard.translate(-1, 0);
        		games[gameIndex] = miniBoard.getArray2D();
        	}
        },
        {
        	type: "button",
        	text: "↓",
        	touchend: () => {
        		miniBoard.translate(1, 0);
        		games[gameIndex] = miniBoard.getArray2D();
        	}
        },
        {
            type: "button",
            text: "上一题",
            touchend: () => preGame()
        },
        {
            type: "button",
            text: "下一题",
            touchend: () => nextGame()
        },
        {
            type: "button",
            text: "删除这题",
            touchend: () => removeGame(gameIndex)
        },
        {
            type: "button",
            text: "输出文件",
            touchend: async () => {
                if (games.length == 0) return;
                const json = await renjuEditor.toKaiBaoJSON(games, log);
                renjuEditor.downloadKaiBaoJSON(json, filename);
            }
        }
    ];

    buttonSettings.splice(0, 0, createLogDiv(), null,null,null);
    buttonSettings.splice(4, 0, createLogDiv1(), null);
    buttonSettings.splice(8, 0, null, null);
    buttonSettings.splice(12, 0, null, null);
    buttonSettings.splice(16, 0, null, null);
    buttonSettings.splice(20, 0, null, null);
    buttonSettings.splice(24, 0, null, null);
    
    function createCmdDiv() {
        const cDiv = mainUI.createCmdDiv();
        buttons.push(...mainUI.createButtons(buttonSettings));
        mainUI.addButtons(buttons, cDiv, 1);
        return cDiv;
    }

    function createLogDiv() {
        const fontSize = mainUI.buttonHeight / 2;
        return mainUI.newLabel({
            id: "log",
            type: "div",
            width: mainUI.buttonWidth * 4.99,
            height: mainUI.buttonHeight,
            style: {
                fontSize: `${fontSize}px`,
                textAlign: "center",
                lineHeight: `${mainUI.buttonHeight}px`
            },
            click: async () => {
                if (status == LOCK || status == UNLOCK) {
                    const numPage = parseInt(prompt(`输入要跳转的页码（1 - ${renjuEditor.numPages})`));
                    if (numPage === +numPage && 0 < numPage && numPage <= renjuEditor.numPages) {
                        unlockArea();
                        renjuEditor.loadPage(numPage);
                    }
                }
            }
        })
    }

    function createLogDiv1() {
        const fontSize = mainUI.buttonHeight / 2;
        return mainUI.newLabel({
            id: "log1",
            type: "div",
            width: mainUI.buttonWidth * 2.33,
            height: mainUI.buttonHeight,
            style: {
                fontSize: `${fontSize}px`,
                textAlign: "center",
                lineHeight: mainUI.buttonHeight + "px",
                backgroundColor: "white"
            },
            click: () => {
                if (games.length) {
                    const idx = parseInt(prompt(`输入要跳转的题号（1 - ${games.length})`));
                    if (idx === +idx && 0 < idx && idx <= games.length) {
                        loadGame(idx - 1);
                    }
                }
            }
        })
    }

    const cBoard = mainUI.createCBoard();
    const miniBoard = mainUI.createMiniBoard();
    const cmdDiv = createCmdDiv();
    butLock = getButton("checkbox", "选定棋盘");
    butBlack = getButton("radio", "● 棋");
    butWhite = getButton("radio", "○ 棋");
    
    function getFileName(path) {
        let temp = path.split(".");
        temp.pop();
        temp = temp.join(".");
        return temp.split("\\").pop();
    }

    //------------------------ GAMES ------------------------ 
    
    function pushGame(arr2D, unpack = true) {
        gameIndex++;
        games.splice(gameIndex, 0, arr2D);
        if (!unpack) return;
        miniBoard.unpackArray(arr2D);
        log1(`第${gameIndex+1}题 / ${games.length}题`);
    }

    function nextGame() {
        if (gameIndex + 1 < games.length) {
            miniBoard.unpackArray(games[++gameIndex]);
            log1(`第${gameIndex+1}题 / ${games.length}题`);
        }
    }

    function preGame() {
        if (gameIndex - 1 >= 0) {
            miniBoard.unpackArray(games[--gameIndex]);
            log1(`第${gameIndex+1}题 / ${games.length}题`);
        }
    }

    function loadGame(idx) {
        if (0 <= idx && idx < games.length) {
            gameIndex = idx;
            miniBoard.unpackArray(games[gameIndex]);
            log1(`第${gameIndex+1}题 / ${games.length}题`);
        }
    }

    function removeGame(idx) {
        if (0 <= idx && idx < games.length) {
            games.splice(idx, 1);
            gameIndex = idx;
            gameIndex >= games.length && (gameIndex = games.length - 1);
            log1(`第${gameIndex+1}题 / ${games.length}题`);
            gameIndex >= 0 ? loadGame(gameIndex) : miniBoard.cle();

        }
    }

    //------------------------ 

    function getButton(type, text) {
        return buttons.filter(but => but && but.type == type && but.text == text)[0];
    }

    function setColor(color) {
        butBlack.setChecked(color == 1);
        butWhite.setChecked(color == 2);
    }

    function getColor() {
        return butBlack.checked ? "black" : "white";
    }

    async function lockArea() {
        if (status == UNLOCK) {
            setFirstArea();
            butLock.setChecked(true);
            await cBoard.lockArea();
            setColor(2);
            status = LOCK;
        }
    }
    
    async function unlockArea() {
        if (status == LOCK) {
            butLock.setChecked(false);
            cBoard.unlockArea();
            status = UNLOCK;
        }
    }

    //------------------------ firstArea -----------------------

    let canSetFirstArea = true;
    let firstArea = null;

    function setFirstArea() {
        if (canSetFirstArea) {
            firstArea = {
                scale: cBoard.scale,
                scrollLeft: cBoard.viewBox.scrollLeft,
                scrollTop: cBoard.viewBox.scrollTop,
                left: parseInt(cBoard.cutDiv.style.left),
                top: parseInt(cBoard.cutDiv.style.top)
            };
            canSetFirstArea = false;
        }
    }

    function getFirstArea() {
        return {
            scale: firstArea ? firstArea.scale : 1,
            scrollLeft: firstArea ? firstArea.scrollLeft : 0,
            scrollTop: firstArea ? firstArea.scrollTop : 0,
            left: firstArea ? firstArea.left : 0,
            top: firstArea ? firstArea.top : 0
        }
    }
    
    //------------------------ Events ---------------------------

    function addEvents(cbd) {
        function ctnBack(idx) { // 触发快速悔棋
            if (idx + 1 && cbd.P[idx].type == TYPE_NUMBER) {
                if (idx != cbd.MS[cbd.MSindex]) {
                    while (cbd.MS[cbd.MSindex] != idx) {
                        cbd.cleNb(cbd.MS[cbd.MSindex], true);
                    }
                }
            }
        }
        bindEvent.setBodyDiv(mainUI.bodyDiv, mainUI.bodyScale, mainUI.upDiv);
        bindEvent.addEventListener(cbd.viewBox, "click", (x, y) => {
            if (status == LOCK) {
                const idx = cbd.getIndex(x, y);
                if (idx < 0) return;
                const color = getColor();
                if (cbd.P[idx].type != TYPE_EMPTY) {
                    cbd.P[idx].cle();
                }
                else {
                    cbd.P[idx].printNb(EMOJI_STAR_BLACK, color, cbd.gW, cbd.gH, color == "white" ? cbd.wNumColor : cbd.bNumColor);
                }
            }
            else if (status == UNLOCK) {
                const p = { x: x, y: y };
                cbd.setxy(p, event && event.type == "click" ? 2 : 1);
                cbd.setCutDiv(p.x, p.y, true);
                cbd.resetP();
                cbd.printBorder();
            }
            else if (status == MANUAL) {
                const idx = cbd.getIndex(x, y);
                if (idx < 0) return;
                if (cbd.P[idx].type != TYPE_EMPTY) {
                    cbd.cleNb(idx, true);
                }
                else {
                    cbd.wNb(idx, "auto", true);
                }
            }
        })
        bindEvent.addEventListener(cbd.viewBox, "dblclick", (x, y) => {
            if (status == MANUAL) {
                let idx = cbd.getIndex(x, y);
                ctnBack(idx)
            }
        })
        bindEvent.addEventListener(cbd.viewBox, "dbltouchstart", (x, y) => {
            status == UNLOCK && cbd.selectArea(x, y)
        })
        bindEvent.addEventListener(cbd.viewBox, "contextmenu", (x, y) => {
            if (status == UNLOCK) cbd.selectArea(x, y)
            else if (status == LOCK) {
                const idx = cbd.getIndex(x, y);
                if (idx < 0) return;
                const arr2d = cbd.getArray2D();
                pushGame(changeCoordinate(arr2d, idx));
            }
        })
        bindEvent.addEventListener(cbd.viewBox, "zoomstart", (x1, y1, x2, y2) => {
            cbd.zoomStart(x1, y1, x2, y2)
        })
        
        bindEvent.addEventListener(miniBoard.viewBox, "zoomstart", (x1, y1, x2, y2) => {
        	miniBoard.zoomStart(x1, y1, x2, y2)
        })
    }

    async function onloadPage(pageIndex, numPages, url) {
        const {scale, scrollLeft, scrollTop, left, top} = getFirstArea();
        canSetFirstArea = true;
        await cBoard.loadImgURL(url);
        cBoard.putImg(cBoard.bakImg, cBoard.canvas);
        cBoard.zoom(scale);
        cBoard.viewBox.scrollLeft = scrollLeft;
        cBoard.viewBox.scrollTop = scrollTop;
        if (cBoard.cutDiv.parentNode) cBoard.moveArea(left, top);
        else cBoard.resetCutDiv();
        status = UNLOCK;
        butLock.setChecked(false);
        log(`第${pageIndex}页 / ${numPages}页`);
    }
	
	//------------------ load -----------------------------
	
    addEvents(cBoard);
    miniBoard.move(undefined, undefined, undefined, undefined, cmdDiv.viewElem);
    mainUI.loadTheme();
    mainUI.viewport.resize();
    renjuEditor.onloadPage = onloadPage;
    log("打开(pdf,zip,jpg,png)");
    log1(`第${0}题 / ${0}题`);
})()
