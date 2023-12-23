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
    let logDiv = null;
    let logDiv1 = null;
    let filename = "download";
    let gameIndex = -1;
    const games = [];
    const buttons = [];
    const BTNMODE_SETTINGS = [
    	-0, "残局分类", "disabled", 0,
    	-1, "VCF", "radio", puzzleCoder.MODE.VCF,
    	-2, "VCT", "radio", puzzleCoder.MODE.VCT,
    	-3, "三手胜", "radio", puzzleCoder.MODE.VCT3,
    	-4, "自由对弈", "radio", puzzleCoder.MODE.FREE,
    	-5, "四子五连", "radio", puzzleCoder.MODE.STONES4,
    	-6, "五子五连", "radio", puzzleCoder.MODE.STONES5,
    	-10, "自动分类（左边优先）", "disabled", 0,
    	-11, "VCF， VCT", "radio", puzzleCoder.MODE.VCF | puzzleCoder.MODE.VCT << 8,
    	-12, "三手胜， VCT", "radio", puzzleCoder.MODE.VCT3 | puzzleCoder.MODE.VCT << 8,
    	-13, "VCF， 三手胜， VCT", "radio", puzzleCoder.MODE.VCF | puzzleCoder.MODE.VCT3 << 8 | puzzleCoder.MODE.VCT << 16,
    	-14, "VCF， 四子五连， VCT", "radio", puzzleCoder.MODE.VCF | puzzleCoder.MODE.STONES4 << 8 | puzzleCoder.MODE.VCT << 16,
    	-15, "找狭义双杀， 找双杀防点", "radio", puzzleCoder.MODE.BASE_DOUBLE_VCF | puzzleCoder.MODE.BASE_BLOCK_DOUBLE_VCF << 8,
    	-20, "五子茶馆点点题分类", "disabled", 0,
    	-21, "找狭义双杀", "radio", puzzleCoder.MODE.BASE_DOUBLE_VCF,
    	-22, "找双杀防点", "radio", puzzleCoder.MODE.BASE_BLOCK_DOUBLE_VCF,
    	-23, "找做V点", "radio", puzzleCoder.MODE.BASE_MAKE_VCF,
    	-24, "找做四三点", "radio", puzzleCoder.MODE.BASE_MAKE_VCF_43,
    	-25, "找做四四点", "radio", puzzleCoder.MODE.BASE_MAKE_VCF_44,
    	-26, "找VCF防点", "radio", puzzleCoder.MODE.BASE_BLOCK_VCF,
    	-27, "防冲四抓禁", "radio", puzzleCoder.MODE.BASE_BLOCK_CATCH_FOUL,
    	-28, "找禁手点", "radio", puzzleCoder.MODE.BASE_FOUL,
    	-29, "找三三禁手", "radio", puzzleCoder.MODE.BASE_FOUL_33,
    	-30, "找四四禁手", "radio", puzzleCoder.MODE.BASE_FOUL_44,
    	-31, "找长连禁手", "radio", puzzleCoder.MODE.BASE_FOUL_6,
    	-32, "找活三", "radio", puzzleCoder.MODE.BASE_FREE_THREE,
    	-33, "找复活三", "radio", puzzleCoder.MODE.BASE_REVIVE_FREE_THREE,
    	-34, "找眠三", "radio", puzzleCoder.MODE.BASE_NOTFREE_THREE,
    	-35, "找活四", "radio", puzzleCoder.MODE.BASE_FREE_FOUR,
    	-36, "找冲四", "radio", puzzleCoder.MODE.BASE_NOTFREE_FOUR];
    const buttonSettings = [
        {
        	varName: "btnFile",
        	type: "file",
        	text: "打开文件",
        	change: async function() {
        		try {
        			mainUI.viewport.resize();
        			await unlockArea();
        			const file = this.files[0];
        			const games = await renjuEditor.openFile(file, this.value.split("/").pop(), outputProgress);
        			filename = getFileName(this.value);
        			for (let i = 0; i < games.length; i++) {
        				pushGame(games[i]);
        				await puzzleCoder.wait(0);
        				i == games.length - 1 && loadGame(gameIndex);
        			}
        			log(file.name);
					window.setBlockUnload(true);
        		} catch (e) { console.error(e.stack) }
        		this.value = "";
        	}
        },
        {
            type: "button",
            text: "自动识别",
            touchend: async function() {
                if (!btnLock.checked) await lockArea();
                cBoard.autoPut();
            }
        },
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
            varName: "btnLock",
            type: "checkbox",
            text: "选定棋盘",
            touchend: async function() {
            	if (btnLock.checked) await lockArea();
                else unlockArea();
            }
        },
        {
        	type: "button",
        	text: "加入题集",
        	touchend: function() {
        		if (warn && (cBoard.SLTX < 15 || cBoard.SLTY < 15)) {
        			warn = false;
        			msgbox({ text: `长按图片天元点可对齐棋盘\n（鼠标可右键代替长按）`, btnNum: 1 });
        		}
        		const array = cBoard.getArray();
        		array.find(v => v > 0) ? (pushGame(array), loadGame(gameIndex), window.setBlockUnload(true)) : window.warn("空棋盘");
        	}
        },
        {
            varName: "btnBlack",
            type: "radio",
            text: "● 棋",
            touchend: () => setColor(1)
        },
        {
            varName: "btnWhite",
            type: "radio",
            text: "○ 棋",
            touchend: () => setColor(2)
        },
        {
            type: "select",
            text: "15 行",
            options: [15, "15 行", "radio", 14, "14 行", "radio", 13, "13 行", "radio", 12, "12 行", "radio", 11, "11 行", "radio", 10, "10 行", "radio", 9, "9 行", "radio", 8, "8 行", "radio", 7, "7 行", "radio", 6, "6 行", "radio"],
			change: function() {
                cBoard.SLTY = this.input.value;
                cBoard.resetP(cBoard.cutDiv);
                if (!btnLock.checked) {
                    cBoard.cleBorder();
                    cBoard.printBorder();
                }
                else {
                    unlockArea();
                }
            },
            reset: function() {
				const option = this.getOption(15);
				option.li.click();
            }
        },
        {
            type: "select",
            text: "15 列",
            options: [15, "15 列", "radio", 14, "14 列", "radio", 13, "13 列", "radio", 12, "12 列", "radio", 11, "11 列", "radio", 10, "10 列", "radio", 9, "9 列", "radio", 8, "8 列", "radio", 7, "7 列", "radio", 6, "6 列", "radio"],
			change: function() {
                cBoard.SLTX = this.input.value;
                cBoard.resetP(cBoard.cutDiv);
                if (!btnLock.checked) {
                    cBoard.cleBorder();
                    cBoard.printBorder();
                }
                else {
                    unlockArea();
                }
            },
            reset: function() {
				const option = this.getOption(15);
				option.li.click();
            }
        },
        mainUI.createMiniBoard({varName: "miniBoard"}),
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
            text: "删一题",
            touchend: () => removeGame(gameIndex)
        },
        {
            varName: "btnRandomRotate",
            type: "select",
            options: [-1,"出题方向", "disabled", 1, "随机翻转", "radio", 0, "固定方向", "radio"],
            reset: function() { 
				const option = this.getOption(null, "随机翻转");
				option.li.click();
				this.setText("","翻转")
			},
            change: async function() {
            	
            }
        },
		{
			varName: "btnRule",
			type: "select",
			options: [2, "有禁", "radio", 0, "无禁", "radio"],
			change: function() {},
			reset: function() {
				const option = this.getOption(null, "有禁");
				option.li.click();
			},
			onhidemenu: function() {}
	    },
		{
			varName: "btnSize",
			type: "select",
			text: "15 路",
			options: [15, "15 路", "radio", 14, "14 路", "radio", 13, "13 路", "radio", 12, "12 路", "radio", 11, "11 路", "radio", 10, "10 路", "radio", 9, "9 路", "radio", 8, "8 路", "radio", 7, "7 路", "radio", 6, "6 路", "radio"],
			change: function() {
				miniBoard.setSize(this.input.value);
				loadGame(gameIndex);
			},
			reset: function() {
				const option = this.getOption(15);
				option.li.click();
			},
			onhidemenu: function() {}
	    },
		{
			varName: "btnSide",
			type: "select",
			options: [0, "自动", "radio", 1, "黑先", "radio", 2, "白先", "radio"],
			change: function() {
			},
			reset: function() {
				const option = this.getOption(null, "自动");
				option.li.click();
			},
			onhidemenu: function() {}
	    },
		{
			varName: "btnMode",
			type: "select",
			options: BTNMODE_SETTINGS.filter((v,i) => i%4 < 3),
			change: function() {
			},
			reset: function() {
				const option = this.getOption(null, "VCT");
				option.li.click();
			},
			onhidemenu: function() {}
	    },
        {
            varName: "btnEdit",
            type: "button",
            text: "编辑JSON",
            touchend: async function() {
            	setBusy(true);
                if (games.length) {
            	const puzzles = createPuzzles(games);
            	const logStr = await puzzleAI.checkPuzzles(puzzles, miniBoard, outputProgress)
            	const json = await puzzleCoder.puzzles2RenjuJSON({puzzles}, outputProgress);
            	await msg({
            		text: json,
            		type: "input",
            		enterTXT: "下载",
            		callEnter: (text) => puzzleCoder.downloadJSON(text, filename)
            	})
                }
            	setBusy(false);
            }
        },
        {
            varName: "btnSave",
            type: "select",
            options: [0, "开宝JSON", 1, "小工具JSON"],
            reset: function() { this.setText("保存","保存") },
            change: async function() {
                setBusy(true);
                if (games.length) {
                if (this.input.value * 1 == 0) {
                	const json = await puzzleCoder.games2kaibaoJSON(games, outputProgress);
                	puzzleCoder.downloadJSON(json, filename);
                }
                else {
                	const puzzles = createPuzzles(games);
            		const logStr = await puzzleAI.checkPuzzles(puzzles, miniBoard, outputProgress);
            		const json = await puzzleCoder.puzzles2RenjuJSON({puzzles}, outputProgress);
            		puzzleCoder.downloadJSON(json, filename);
                }
                }
                setBusy(false);
            }
        },
        mainUI.newTextBox({
        	varName: "commentBox",
        	width: (mainUI.buttonWidth * 4.99),
        	height: mainUI.buttonHeight * 2,
        	style: {
        		fontSize: `${mainUI.buttonHeight / 1.8}px`,
        		wordBreak: "break-all",
        		overflowY: "auto",
        		borderStyle: "solid",
        		borderWidth: `${mainUI.buttonHeight / 1.8 / 20}px`,
        		borderColor: "black",
        		background: "white",
        		padding: "0"
        	},
        	click: () => {
        	
        	}
        })
    ];
    
    buttonSettings.splice(0, 0, createLogDiv(), null,null,null);
    buttonSettings.splice(12, 0, createLogDiv1(),null);
    buttonSettings.splice(17, 0, null);
    buttonSettings.splice(20, 0, null, null);
    buttonSettings.splice(24, 0, null, null);
    buttonSettings.splice(28, 0, null, null);
    buttonSettings.splice(32, 0, null, null);
    
    function createCmdDiv() {
        const cDiv = mainUI.createCmdDiv();
        buttons.push(...mainUI.createButtons(buttonSettings));
        mainUI.addButtons(buttons, cDiv, 3);
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
                else {
                	btnFile.touchend();
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

    const cmdDiv = createCmdDiv();
    const cBoard = mainUI.createCBoard();
    const {
    	miniBoard,
    	btnFile,
    	btnRule,
    	btnSide,
    	btnSize,
    	btnMode,
    	btnLock,
    	btnBlack,
    	btnWhite,
    	btnSave,
    	btnEdit,
    	commentBox,
    	btnRandomRotate
    } = mainUI.getChildsForVarname();
    
    function setBusy(isBusy) {
    	btnSave.disabled = btnEdit.disabled = !!isBusy;
    }
    
    function outputProgress(progress) {
    	log1(`${(progress*100).toFixed(2)}%`)
    }
    
    function getFileName(path) {
        let temp = path.split(".");
        temp.pop();
        temp = temp.join(".");
        return temp.split("\\").pop();
    }
    
    //------------------------ GAMES ------------------------ 
    
    function getArray(game) {
    	const size = getSize();
    	const arr = game || new Array(226).fill(0);
    	for (let x = 0; x < 15; x++) {
    		for (let y = 0; y < 15; y++) {
    			const idx = y * 15 + x;
    			if (arr[idx] < 1) {
    				arr[idx] = x < size && y < size ? 0 : -1;
    			}
    		}
    	}
    	return arr;
    }
    
    function getSide(game) {
    	const side = btnSide.input.value * 1;
    	if (side) return side;
    	else {
    		const arr = getArray(game);
    		let numBlackStones = 0, numWhiteStones = 0;
    		arr.map(v => { v == 1 && numBlackStones++; v == 2 && numWhiteStones++ })
    		return numWhiteStones < numBlackStones ? 2 : 1;
    	}
    }
    
    function getRapfiRule() {
    	return btnRule.input.value * 1;
    }
    
    function getRenjuRule() {
    	return 	{0: 1,2: 2}[getRapfiRule()]
    }
    
    function getSize() {
    	return btnSize.input.value * 1;
    }
    
    function getComment(gameIndex) {
    	const game = games[gameIndex];
    	return game && game.comment && game.comment.split("\n").join("\\n").split("\t").join("\\t") || "";
    }
    
    function getRandomRotate() {
    	return !!btnRandomRotate.input.value;
    }
    
    function getModes(value = btnMode.input.value) {
    	const modes = BTNMODE_SETTINGS.find((v,i) => BTNMODE_SETTINGS[i-3] == value);
    	return modes
    }
    
    /**
	 * 传入 games ， 转成 puzzleAI 专用 Puzzles 对象
 	*/
    function createPuzzles(games) {
    	const puzzles = [];
    	games.map((game, i) => {
    		puzzles.push({
    			arr: getArray(game),
    			side: getSide(game),
    			rule: getRapfiRule(),
    			size: getSize(),
    			modes: getModes(),
    			comment: getComment(i),
    			randomRotate: getRandomRotate()
    		})
    	})
    	return puzzles;
    }
    
    function pushGame(array) {
        gameIndex++;
        games.splice(gameIndex, 0, array);
    }

    function nextGame() {
        if (gameIndex + 1 < games.length) {
            loadGame(++gameIndex);
        }
    }

    function preGame() {
        if (gameIndex - 1 >= 0) {
            loadGame(--gameIndex);
        }
    }

    function loadGame(idx) {
        if (0 <= idx && idx < games.length) {
            gameIndex = idx;
            miniBoard.unpackArray(games[gameIndex]);
            commentBox.value = games[gameIndex].comment || "";
            log1(`第${gameIndex+1}题 / ${games.length}题`);
        }
    }

    function removeGame(idx) {
        if (0 <= idx && idx < games.length) {
            games.splice(idx, 1);
            gameIndex = idx;
            gameIndex >= games.length && (gameIndex = games.length - 1);
            loadGame(gameIndex);
        }
    }
    
    //------------------------ 

    function setColor(color) {
        btnBlack.setChecked(color == 1);
        btnWhite.setChecked(color == 2);
    }

    function getColor() {
        return btnBlack.checked ? "black" : "white";
    }

    async function lockArea() {
        if (status == UNLOCK) {
            setFirstArea();
            btnLock.setChecked(true);
            await cBoard.lockArea();
            setColor(2);
            status = LOCK;
        }
    }
    
    async function unlockArea() {
        if (status == LOCK) {
            btnLock.setChecked(false);
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
                const arr = array2DToArray(changeCoordinate(cbd.getArray2D(), idx));
        		arr.find(v => v > 0) ? (pushGame(arr), loadGame(gameIndex), window.setBlockUnload(true)) : window.warn("空棋盘");
            }
        })
        bindEvent.addEventListener(cbd.viewBox, "zoomstart", (x1, y1, x2, y2) => {
            cbd.zoomStart(x1, y1, x2, y2)
        })
        
        bindEvent.addEventListener(miniBoard.viewBox, "zoomstart", (x1, y1, x2, y2) => {
        	miniBoard.zoomStart(x1, y1, x2, y2)
        })
        bindEvent.addEventListener(miniBoard.viewBox, "contextmenu", (x, y) => {
			miniBoard.setScale(miniBoard.scale != 1 ? 1 : 1.5, true);
		})
		commentBox.viewElem.addEventListener("input", () => games[gameIndex] && (games[gameIndex].comment = commentBox.value))
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
        btnLock.setChecked(false);
        log(`第${pageIndex}页 / ${numPages}页`);
    }
	
	//------------------ load -----------------------------
	
    addEvents(cBoard);
    mainUI.loadTheme();
    mainUI.viewport.resize();
    renjuEditor.onloadPage = onloadPage;
    log("打开(pdf,zip,jpg,png,json)");
    log1(`第${0}题 / ${0}题`);
})()
