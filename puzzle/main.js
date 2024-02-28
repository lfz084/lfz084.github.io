(async () => {
	try {
		"use strict";
		let iswarn = true;
		const d = document;
		const dw = d.documentElement.clientWidth;
		const dh = d.documentElement.clientHeight;
		const CUR_PATH = document.currentScript.src.slice(0, document.currentScript.src.lastIndexOf("/") + 1);
		
		async function wait(timeout = 0) { return new Promise(resolve => setTimeout(resolve, timeout)) }
		
		const menuSettings = [{
				varName: "btnRule",
				type: "select",
				text: "有禁",
				options: [
					2, "有禁规则", "radio", 
					0, "无禁规则", "radio"
				],
				onshowmenu: function() {
					[...this.input].map(op => op.checked = op.value == game.puzzle.rule);
				},
				change: function() {
					if (game.puzzle.rule == this.input.value) return
					game.puzzle.rule = this.input.value;
					game.reset(game.rotate, game.puzzle)
				}
			},
			{
				varName: "btnMode",
				type: "select",
				text: "VCT",
				options: [
					puzzleCoder.MODE.VCT, "VCT模式", "radio",
					puzzleCoder.MODE.VCF, "VCF模式", "radio",
					puzzleCoder.MODE.VCT3, "三手胜模式", "radio",
					puzzleCoder.MODE.FREE, "自由对弈模式", "radio"
				],
				onshowmenu: function() {
					[...this.input].map(op => op.checked = op.value == game.puzzle.mode);
				},
				change: function() {
					if (game.puzzle.mode == this.input.value) return
					game.puzzle.mode = this.input.value;
					game.puzzle.comment = puzzleCoder.MODE_COMMENT[game.puzzle.mode];
					game.reset(game.rotate, game.puzzle)
				}
			},
			{
				varName: "btnRotate",
				type: "select",
				text: "旋转",
				options: [
					0, "允许旋转棋局", "radio",
					1, "禁止旋转棋局", "radio"
				],
				onshowmenu: function() {
					[...this.input].map(op => op.checked = !!(op.value*1) == game.notRotate);
				},
				change: function() {
					game.notRotate = !!(this.input.value*1)
				}
			},
			{
				varName: "btnStrength",
				type: "select",
				text: "随机",
				options: [
					30, "AI随机变招", "radio",
					100, "AI最强招法", "radio"
				],
				onshowmenu: function() {
					[...this.input].map(op => op.checked = op.value == game.strength);
				},
				change: function() {
					game.strength = this.input.value;
				}
			},
			{
				varName: "btnFile",
				type: "file"
			},
			{
				varName: "btnFileMenu",
				type: "select",
				options: [
					0, "打开图片",
					1, "导入JSON"
				],
				change:  function() {
					if (this.input.value == 0) {
						btnFile.input.removeEventListener("change", openJSON, true);
						btnFile.input.addEventListener("change", openImg, true);
    					btnFile.input.accept = "image/*";
    				}
    				else if(this.input.value == 1) {
    					btnFile.input.removeEventListener("change", openImg, true);
						btnFile.input.addEventListener("change", openJSON, true);
    					btnFile.input.accept = ".json";
    				}
    				btnFile.input.click();
				}
			}];
				
		const gameButtonSettings = [
		mainUI.newLabel({
				varName: "title",
				type: "div",
				width: mainUI.buttonWidth * 4.99,
				height: mainUI.buttonHeight,
				style: {
					fontSize: `${mainUI.buttonHeight / 1.8}px`,
					textAlign: "center",
					lineHeight: `${mainUI.buttonHeight}px`
				},
				click: () => {
					btnOpenPuzzles.touchend()
				}
			}),
		mainUI.newComment({
				varName: "comment",
				type: "div",
				width: (mainUI.buttonWidth * 4.99 - mainUI.buttonHeight / 1.8) / 2,
				height: mainUI.buttonHeight * 11,
				style: {
					fontSize: `${mainUI.buttonHeight / 1.8}px`,
					wordBreak: "break-all",
					overflowY: "auto",
					borderStyle: "solid",
					borderWidth: `${mainUI.buttonHeight / 1.8 / 20}px`,
					borderColor: "black",
					background: "white",
					padding: `${mainUI.buttonHeight / 1.8/2}px ${mainUI.buttonHeight / 1.8/2}px ${mainUI.buttonHeight / 1.8/2}px ${mainUI.buttonHeight / 1.8/2}px`
				},
				click: () => {
			
				}
			}),
		mainUI.newLabel({
				varName: "sideLabel",
				type: "div",
				width: mainUI.buttonWidth * 2.33,
				height: mainUI.buttonHeight,
				style: {
					fontSize: `${mainUI.buttonHeight / 1.8}px`,
					textAlign: "center",
					lineHeight: `${mainUI.buttonHeight}px`
				},
				click: () => {

				}
			}),
		mainUI.newLabel({
				varName: "strengthLabel",
				type: "div",
				width: mainUI.buttonWidth,
				height: mainUI.buttonHeight,
				style: {
					fontSize: `${mainUI.buttonHeight / 1.8}px`,
					textAlign: "center",
					lineHeight: `${mainUI.buttonHeight}px`
				},
				click: () => {
					game.puzzle.mode != puzzleCoder.MODE.COVER && game.puzzle.mode < puzzleCoder.MODE.BASE && btnStrength.defaultontouchend()
				}
			}),
		mainUI.newLabel({
				varName: "rotateLabel",
				type: "div",
				width: mainUI.buttonWidth,
				height: mainUI.buttonHeight,
				style: {
					fontSize: `${mainUI.buttonHeight / 1.8}px`,
					textAlign: "center",
					lineHeight: `${mainUI.buttonHeight}px`
				},
				click: () => {
					btnRotate.defaultontouchend()
				}
			}),
		mainUI.newLabel({
			varName: "ruleLabel",
			type: "div",
			width: mainUI.buttonWidth,
			height: mainUI.buttonHeight,
			style: {
				fontSize: `${mainUI.buttonHeight / 1.8}px`,
				textAlign: "center",
				lineHeight: `${mainUI.buttonHeight}px`
			},
			click: function() {
				game.puzzle.mode != puzzleCoder.MODE.COVER && game.puzzle.mode < puzzleCoder.MODE.BASE && btnRule.defaultontouchend()
			}
		}),
		mainUI.newLabel({
			varName: "modeLabel",
			type: "div",
			width: mainUI.buttonWidth,
			height: mainUI.buttonHeight,
			style: {
				fontSize: `${mainUI.buttonHeight / 1.8}px`,
				textAlign: "center",
				lineHeight: `${mainUI.buttonHeight}px`
			},
			click: function() {
				game.puzzle.mode != puzzleCoder.MODE.COVER && game.puzzle.mode < puzzleCoder.MODE.BASE && btnMode.defaultontouchend()
			}
		}),
		mainUI.newLabel({
				varName: "indexLabel",
				type: "div",
				width: mainUI.buttonWidth,
				height: mainUI.buttonHeight,
				style: {
					fontSize: `${mainUI.buttonHeight / 1.8}px`,
					textAlign: "center",
					lineHeight: `${mainUI.buttonHeight}px`
				},
				click: function() {
					openIndexBoard();
				}
			}),
		mainUI.newLabel({
			varName: "progressLabel",
			type: "div",
			width: mainUI.buttonWidth,
			height: mainUI.buttonHeight,
			style: {
				fontSize: `${mainUI.buttonHeight / 1.8}px`,
				textAlign: "center",
				lineHeight: `${mainUI.buttonHeight}px`
			},
			click: function() {
				openIndexBoard();
			}
		}),
			{
				varName: "btnPrevious",
				type: "button",
				text: "上一题",
				touchend: function() { game.previous() }
				},
			{
				varName: "btnNext",
				type: "button",
				text: "下一题",
				touchend: function() { game.next() }
				},
			{
				varName: "btnShare",
				type: "button",
				text: "分享图片",
				touchend: function() { window.share(cBoard) }
			},
			{
				varName: "btnReset",
				type: "button",
				text: "重新开始",
				touchend: function() { game.reset(game.rotate, game.puzzle) }
				},
			{
				varName: "btnShareURL",
				type: "button",
				text: "求助好友",
				touchend: function() {
					const puzzle = game.puzzle;
					shareURL(puzzle);
				}
		},
			{
				varName: "btnAIHelp",
				type: "button",
				text: "求助 AI",
				touchend: function() { this.enabled = false; game.state == game.STATE.PLAYING && game.board.MSindex % 2 && puzzleAI.aiHelp(game); }
		},
			{
				varName: "btnOpenPuzzles",
				type: "button",
				text: "选择题集",
				touchend: function() {openItemBoard()}
			},
			{
				varName: "btnOpenFile",
				type: "button",
				text: "打开文件",
				touchend: function() {
					btnFileMenu.defaultontouchend()
				}
			},
			{
				varName: "btnCommit",
				type: "button",
				text: "提交答案",
				touchend: function() {
					this.hide();
					puzzleAI.checkWinBASE(game);
				}
			}
		];
		
		gameButtonSettings.splice(1,0,null,null,null);
		gameButtonSettings.splice(5,0,null);
		gameButtonSettings.splice(7,0,null);
		gameButtonSettings.splice(8,0,null,null);
		gameButtonSettings.splice(12,0,null,null);
		gameButtonSettings.splice(16,0,null,null);
		gameButtonSettings.splice(20,0,null,null);
		gameButtonSettings.splice(24,0,null,null);
		gameButtonSettings.splice(28,0,null,null);
		gameButtonSettings.splice(32,0,null,null);
		
		const imgButtonSettings = [
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
            text: "自动识别",
            touchend: async function() {
                if (!btnLock.checked) await lockArea();
                cBoard.autoPut();
            }
        },
        {
            varName: "btnBlack",
            type: "radio",
            text: "● 棋",
            group: "side1"
        },
        {
            varName: "btnWhite",
            type: "radio",
            text: "○ 棋",
            group: "side1"
        },
        mainUI.createMiniBoard({varName: "miniBoard"}),
        null,
        {
        	type: "button",
        	text: "摆入棋盘",
        	touchend: function() {
        		const array = cBoard.getArray();
        		if (array.find(v => v > 0)) {
        			putMiniBoard();
        		}
        		else window.warn("空棋盘");
        	}
        },
        {
            varName: "btnAuto",
            type: "radio",
            text: "◐ 棋",
            group: "side1"
        },
        null,
        null,
        {
            varName: "btnSLY",
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
            varName: "btnSLX",
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
        null,
        null,
        {
            type: "btnUp",
            text: "↑",
            touchend: () => {
            	miniBoard.translate(-1, 0);
				changeGame();
            }
        },
        {
            type: "btnDown",
            text: "↓",
            touchend: () => {
            	miniBoard.translate(1, 0);
				changeGame();
            }
        },
        null,
        null,
        {
            type: "btnLeft",
            text: "←",
            touchend: () => {
            	miniBoard.translate(0, -1);
				changeGame();
            }
        },
        {
            type: "btnRight",
            text: "→",
            touchend: () => {
            	miniBoard.translate(0, 1);
				changeGame();
            }
        },
        null,
        null,
        {
			varName: "btnSize",
			type: "select",
			text: "15 路",
			options: [15, "15 路", "radio", 14, "14 路", "radio", 13, "13 路", "radio", 12, "12 路", "radio", 11, "11 路", "radio", 10, "10 路", "radio", 9, "9 路", "radio", 8, "8 路", "radio", 7, "7 路", "radio", 6, "6 路", "radio"],
			change: function() {
				miniBoard.setSize(this.input.value);
			},
			reset: function() {
				const option = this.getOption(15);
				option.li.click();
			},
			onhidemenu: function() {}
	    },
        {
        	type: "button",
        	text: "开始解题",
        	touchend: async function() {
        		const array = miniBoard.getArray();
        		if (array.find(v => v > 0)) {
        			loadMiniBoardPuzzle()
        		}
        		else window.warn("小棋盘没有棋子");
        	}
        },
		];
    
		
		const hideCmdDiv = mainUI.createCmdDiv();
		const renjuCmdDiv = mainUI.createCmdDiv();
		const imgCmdDiv = mainUI.createCmdDiv();
		const cBoard = mainUI.createCBoard();
		hideCmdDiv.hide();
		imgCmdDiv.hide();
		mainUI.addButtons(mainUI.createButtons(menuSettings), hideCmdDiv, 0);
		mainUI.addButtons(mainUI.createButtons(gameButtonSettings), renjuCmdDiv, 1);
		mainUI.addButtons(mainUI.createButtons(imgButtonSettings), imgCmdDiv, 0);
		const {
			title,
			sideLabel,
			ruleLabel,
			modeLabel,
			indexLabel,
			strengthLabel,
			rotateLabel,
			progressLabel,
			comment,
			btnAIHelp,
			btnReset,
			btnCommit,
			btnRule,
			btnMode,
			btnRotate,
			btnStrength,
			btnOpenPuzzles,
			btnOpenFile,
			btnFileMenu,
			btnFile,
			btnLock,
			btnBlack,
			btnWhite,
			btnAuto,
			btnSLY,
			btnSLX,
			btnSize,
			miniBoard
		} = mainUI.getChildsForVarname();
		btnCommit.move(btnReset.left, btnReset.top);
		const boardWidth = 5;
		const fontSize = mainUI.buttonHeight * 0.6;
		const liHeight = mainUI.buttonHeight * 1.2;
		function createItem(data) {
			try{
			const item = document.createElement("div");
			const title = document.createElement("div");
			const progress = document.createElement("div");
			const close = document.createElement("div");
			const innerWidth = mainUI.cmdWidth - boardWidth * 2;
			
			Object.assign(item.style, {
				overflow: "hidden",
				fontSize: fontSize + "px",
				height: liHeight + "px",
				lineHeight: liHeight + "px"
			})
			Object.assign(title.style, {
				overflow: "hidden",
				textOverflow: "ellipsis",
				position: "relative",
				left: innerWidth * 0.03  + "px",
				top: "0px",
				width: innerWidth * 0.75 + "px",
				height: liHeight + "px"
			})
			Object.assign(progress.style, {
				overflow: "hidden",
				textOverflow: "ellipsis",
				position: "relative",
				left: parseInt(title.style.width) + "px",
				top: -liHeight + "px",
				width: innerWidth * 0.15 + "px",
				height: liHeight + "px",
				textAlign: "right"
			})
			Object.assign(close.style, {
				overflow: "hidden",
				textOverflow: "ellipsis",
				position: "relative",
				fontSize: fontSize * 1.5 + "px",
				left: innerWidth * 0.9 + "px",
				top: -liHeight * 2 + "px",
				width: innerWidth * 0.1 + "px",
				height: liHeight + "px",
				textAlign: "center"
			})
			title.innerHTML = data.title;
			progress.innerHTML = `${data.progress.filter(v => v).length}/${data.progress.length}`;
			close.innerHTML = "✕";
			title.onclick = progress.onclick = async function(){
				try{
				event.cancelBubble = true;
				const data = await puzzleData.getDataByIndex("time", item.parentNode.time);
				await game.loadJSON(data.json);
				}catch(e){console.error(e.stack)}
			}
			close.onclick = function(){
				event.cancelBubble = true;
				msgbox({
					butNum: 2,
					title: `确定删除《${title.innerHTML}》`,
					enterFunction: () => itemBoard.removeItem(item.parentNode,(li) => puzzleData.deleteDataByIndex("time", li.time))
				})
			}
			item.appendChild(title);
			item.appendChild(progress);
			game.defaultPuzzleTimes.indexOf(data.time) == -1 && item.appendChild(close);
			item.childs = [title,progress,close];
			return item;
			}catch(e){console.error(e.stack)}
		}
		
		const addItemCallBack = function(data, li) {
			const item = createItem(data);
			li.appendChild(item);
			li.time = data.time;
			game.data && game.data.time == data.time && (li.style.borderWidth = "5px");
		}
		
		async function loadDeafultItems(filter = () => true) {
			for (let i = 0; i < game.defaultPuzzleTimes.length; i++) {
				const data = await puzzleData.getDataByIndex("time", game.defaultPuzzleTimes[i]);
				data && filter(data) && itemBoard.addItem(li => addItemCallBack(data, li));
			}
		}
		
		async function loadUserAddedItems() {
			puzzleData.openCursorByIndex("time", cursor => {
				const data = cursor && cursor.value;
				data && game.defaultPuzzleTimes.indexOf(data.time) == -1 && itemBoard.addItem(li => addItemCallBack(data, li));
			})
		}
		
		async function openItemBoard() {
			if (!itemBoard.viewElem.parentNode) {
				itemBoard.show();
				mainUI.viewport.resize();
				await loadDeafultItems();
				await loadUserAddedItems();
			}
		}
		
		function removeItemAll() {
			for (let i = itemBoard.lis.length - 1; i >=0; i--){
				itemBoard.removeItem(itemBoard.lis[i])
			}
		}
		
		function closeItemBoard() {
			itemBoard.hide();
			removeItemAll();
		}
		
		function openIndexBoard() {
			indexBoard.show();
			mainUI.viewport.resize();
			indexBoard.removeIndexes();
			for(let i = 0;  i < game.puzzles.length; i++) {
				const style = {
					opacity: `${game.data && game.data.progress && game.data.progress[i] ? 1 : 0.5}`
				};
				indexBoard.createIndex(i+1, style)
			}
			inputButton.bindButton(indexLabel, mainUI.bodyScale);
			inputButton.value = game.index;
		}
	
		function closeIndexBoard() {
			indexBoard.hide();
			indexBoard.removeIndexes();
			inputButton.hide();
		}
		
		function closeBoards() {
			itemBoard.viewElem.parentNode && closeItemBoard();
			indexBoard.viewElem.parentNode && closeIndexBoard();
		}
		
		function shareURL(puzzle) {
			const hash = `${puzzleData.puzzle2URL(puzzle)}`;
			const url = window.location.href.split(/[?#]/)[0] + `#${hash}`;
			window.location.hash = hash;
			//log(`share URL: ${url}`);
			if (navigator.canShare) {
				navigator.share({
					title: "连珠答题器",
					text: "这道题我解不出来，可以教教我吗",
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
		
		
		const itemButWidth = (mainUI.cmdWidth - boardWidth * 2 - 2) / 3;
		const itemButHeight = mainUI.buttonHeight;
		const itemButStyle = {
			position: "absolute",
			left: "0px",
			top: "0px",
			width: itemButWidth + "px",
			height: itemButHeight + "px",
			fontSize: ~~(itemButHeight * 0.75) + "px",
			textAlign: "center",
			lineHeight: itemButHeight + "px"
		}
		
		const btnDailyPuzzles = document.createElement("div");
		btnDailyPuzzles.innerHTML = "每日题集";
		Object.assign(btnDailyPuzzles.style, itemButStyle);
		btnDailyPuzzles.onclick = () => { event.cancelBubble = true; removeItemAll(); loadDeafultItems(data => data.title.indexOf("每日") + 1 || data.title.indexOf("错题") + 1)}
		
		const btnDefault = document.createElement("div");
		btnDefault.innerHTML = "默认题集";
		itemButStyle.left = itemButWidth * 1 + "px";
		Object.assign(btnDefault.style, itemButStyle);
		btnDefault.onclick = () => { event.cancelBubble = true; removeItemAll(); loadDeafultItems(data => -1 == data.title.indexOf("每日") && -1 == data.title.indexOf("错题"))}
		
		const btnUserAdded = document.createElement("div");
		btnUserAdded.innerHTML = "你的题集";
		itemButStyle.left = itemButWidth * 2 + "px";
		Object.assign(btnUserAdded.style, itemButStyle);
		btnUserAdded.onclick = () => { event.cancelBubble = true; removeItemAll(); loadUserAddedItems()}
		
		const buttons = document.createElement("div");
		buttons.appendChild(btnDailyPuzzles)
		buttons.appendChild(btnDefault)
		buttons.appendChild(btnUserAdded)
		Object.assign(buttons.style, {
			borderColor: "black",
			borderStyle: "solid",
			borderWidth: `${1}px`,
			height: mainUI.buttonHeight + "px"
		})
		
		const itemBoard = mainUI.newItemBoard({
			left: mainUI.gridPadding,
			top: mainUI.gridPadding,
			width: mainUI.cmdWidth,
			height: mainUI.cmdWidth,
			parent: mainUI.upDiv,
			style: {
				borderColor: "black",
				background: "white",
				borderStyle: "solid",
				borderWidth: `${boardWidth}px`
			}
		})
		itemBoard.viewElem.appendChild(buttons)
		itemBoard.hide();
		mainUI.addChild({
			variant: itemBoard,
			type: itemBoard.constructor.name,
			varName: "itemBoard"
		});
		
		const indexBoard = mainUI.newIndexBoard({
			left: mainUI.gridPadding,
			top: mainUI.gridPadding,
			width: mainUI.cmdWidth,
			height: mainUI.cmdWidth,
			parent: mainUI.upDiv,
			style: {
				borderColor: "black",
				background: "white",
				borderStyle: "solid",
				borderWidth: `${boardWidth}px`
			}
		})
		indexBoard.hide();
		indexBoard.callback = function(index) { 
			event.cancelBubble = true; 
			game.index = parseInt(index);
			closeBoards();
		};
		mainUI.addChild({
			variant: indexBoard,
			type: indexBoard.constructor.name,
			varName: "indexBoard"
		});
		
		const lbTimer = mainUI.newTimer();
		lbTimer.printTimer = function() {
			const now = new Date().getTime();
			const k = now - (this.lastTime || now);
			this.backTimer = (this.backTimer || 0) + (k > 6000 ? k : 0);
			this.lastTime = now;
			let t = Math.max(0, game.puzzle.delayHelp * 60 * 1000 + this.backTimer - this.getTimer());
			let h = ~~(t / 3600000);
			h = h < 10 ? "0" + h : h;
			let m = ~~((t % 3600000) / 60000);
			m = m < 10 ? "0" + m : m;
			let s = ~~((t % 60000) / 1000);
			s = s < 10 ? "0" + s : s;
			this.viewElem.innerHTML = `${h}:${m}:${s}`;
			if (t==0) {
				game.timer = lbTimer.getTimer();
				puzzleData.saveProgress(game);
				showAIHelp();
			}
		}
		lbTimer.stop = function() {
			this.backTimer = this.lastTime = undefined;
			clearInterval(this.timer);
			this.timer = null;
		}
		lbTimer.hide();
		mainUI.addChild({
			variant: lbTimer,
			type: lbTimer.constructor.name,
			varName: "lbTimer"
		});
		
		const inputButton = new InputButton(document.body, 0, 0, indexLabel.with, indexLabel.height);
		inputButton.callback = indexBoard.callback;
		mainUI.addChild({
			variant: inputButton,
			type: inputButton.constructor.name,
			varName: "inputButton"
		});
		
		function createDelayCallback(callback = () => {}) {
			return (() => {
				let timer;
				let end = 0;
				return (timeout) => {
					timer && clearInterval(timer);
					end = new Date().getTime() + timeout;
					timer = setInterval(() => {
						if (new Date().getTime() > end) {
							clearInterval(timer);
							timer = null;
							try{ callback() }catch(e){ console.error(e.stack) }
						}
					}, Math.min(60 * 1000, timeout))
				}
				})()
		}
		
		function hideAIHelp() {
			lbTimer.move(parseInt(btnAIHelp.left), parseInt(btnAIHelp.top), undefined, undefined, btnAIHelp.parentNode);
			const timer = game.data && game.data[puzzleData.INDEX.TIMERS] && game.data[puzzleData.INDEX.TIMERS][game.puzzles.index] || 0;
			lbTimer.reset(timer);
			lbTimer.start();
			btnAIHelp.hide();
		}
		
		function showAIHelp() {
			btnAIHelp.show();
			lbTimer.hide();
			lbTimer.stop();
			//console.log("stop")
		}
		
		const delayAIHelp = createDelayCallback(() => showAIHelp());
		
		const delayCheckWinBASE = createDelayCallback(() => puzzleAI.checkWinBASE(game));
		
		const delaySaveProgress = createDelayCallback(() => {
			game.timer = lbTimer.getTimer();
			puzzleData.saveProgress(game);
			lbTimer.viewElem.parentNode && delaySaveProgress(60*1000);
		})
		const game = {
			STATE: {
				IMAGELOADIMG: -1,
				LOADING: 0,
				PLAYING: 1 << 4,
				GAMEOVER: 2 << 4,
				WIN: 2 << 4 | 1,
				LOST: 2 << 4 | 2,
				FOUL: 2 << 4 | 4,
				READ: 2 << 4 | 8,
			},
			_state: 0,
			_strength: 30,
			_notRotate: false,
			options: undefined,
			residueStones: 0,
			puzzle: null,
			puzzles: puzzleCoder.demoPuzzles,
			board: cBoard,
			defaultPuzzleTimes: [],
			rotate: 0,
			async reset(rotate, puzzle) {
				try{
				this.puzzle = typeof puzzle === "object" ? puzzle : this.puzzles.currentPuzzle;
				rotate == undefined && (rotate = this.puzzle.rotate)
				
				const isLocation = 0 && window.location.href.indexOf("http://") > -1;
				const completed = this.data && this.data.progress && this.data.progress[this.puzzles.index];
				const delay = this.puzzle.delayHelp * 60 * 1000;
				const isTimeout = (this.data && this.data[puzzleData.INDEX.TIMERS] && this.data[puzzleData.INDEX.TIMERS][this.puzzles.index] || 0) > delay;
				if(puzzle == undefined) {
					(isLocation || completed || isTimeout) ? showAIHelp() : hideAIHelp();
				}
				await this.stopThinking();
				this.strength = this._strength;
				this.notRotate = this._notRotate;
				this.board.canvas.width = this.board.canvas.height = this.board.width;
				this.board.canvas.style.width = this.board.canvas.style.height = this.board.width + "px";
				this.board.cle();
				this.board.removeTree();
				this.board.resetCBoardCoordinate();
				this.board.printEmptyCBoard();
				this.board.setSize(this.puzzle.size);
				this.unpackCode();
				this.printLabels();
				this.playerSide = this.puzzle.side;
				this.residueStones = this.puzzle.mode & 0x1F;
				this.options = !this.puzzle.options ? undefined : this.board.moveCode2Points(this.puzzle.options);

				let html = "";
				const ruleStr = ["无禁",,"有禁"][this.puzzle.rule];
				const modeStr = puzzleCoder.MODE_NAME[this.puzzle.mode];
				if (this.puzzle.mode == puzzleCoder.MODE.COVER) {
					this.state = this.STATE.LOADING;
					puzzleData.saveProgress(this);
					outputInnerHTML({
						sideLabel: "习题封面"
					})
					html += `这是封面，请跳到下一题再开始解题\n\n`,
					this.puzzle.title = this.puzzle.title + "（封面）" ;
					btnAIHelp.enabled = false;
					this.board.setCoordinate(0);
					this.puzzle.image && this.board.loadImgURL(this.puzzle.image).then(() => this.board.putImg());
				}
				else {
					this.state = this.STATE.PLAYING;
					delaySaveProgress(5000);
					outputInnerHTML({
						sideLabel: "玩家走棋"
					})
					html += `难度: ${"★★★★★".slice(0, this.puzzle.level)}\n`;
					html += `玩家: ${[,"● 黑棋","○ 白棋"][this.playerSide]}\n`;
					html += `规则: ${ruleStr}\n`;
					html += `模式: ${modeStr}\n\n`;
					this.board.setCoordinate(1);
					(this.puzzle.randomRotate || rotate != undefined) && !this.notRotate ? this.randomRotate(rotate) : (this.rotate = 0);
					this.puzzle.rotate = this.rotate;
					btnAIHelp.enabled = true;
					//!isLocation && (this.puzzle.mode & puzzleCoder.MODE.BASE) == puzzleCoder.MODE.BASE &&  delayCheckWinBASE(1800);
				}
				(this.puzzle.mode & puzzleCoder.MODE.BASE) == puzzleCoder.MODE.BASE ? btnCommit.show() : btnCommit.hide();
				html += this.puzzle.comment || "";
				html += this.state == this.STATE.PLAYING ? (this.puzzle.mode & puzzleCoder.MODE.BASE) == puzzleCoder.MODE.BASE ? "\n\n开始答题......\n点击空格：标记选点\n点击标记：删除选点\n答题结束后提交答案" : "\n\n开始解题......\n单击：两次确认落子\n双击：直接落子" : "";
				html += this.state == this.STATE.PLAYING && lbTimer.viewElem.parentNode ? `\n\n坚持答题${this.puzzle.delayHelp}分钟后......\n解锁"求助AI"按钮` : "";
				outputInnerHTML({
					title: this.puzzle.title,
					ruleLabel: ruleStr,
					modeLabel: modeStr.replace("模式",""),
					indexLabel: `${completed && "✔" || ""}  ${this.index}`,
					progressLabel: `(${this.data && this.data.progress ? this.data.progress.filter(v => v).length + "/" : ""}${this.puzzles.length})`,
					comment: html.split("\n").join("<br>")
				})
				closeBoards();
				}catch(e){console.error(e.stack)}
			},
			unpackCode() {
				this.board.unpackCode(`${this.puzzle.stones}{${this.puzzle.blackStones}}{${this.puzzle.whiteStones}}`)
				const arr = this.board.getArray();
				if (this.puzzle.sequence == 0) {
					this.board.resetNum = 0;
					this.board.cle();
					arr.map((side, idx) => {
						side == 1 && this.board.wNb(idx, "black", true);
						side == 2 && this.board.wNb(idx, "white", true);
					})
				}
				else {
					this.board.resetNum = -this.puzzle.sequence;
					this.board.MS.length = 0;
					this.board.MSindex = -1;
					arr.map((v, i) => {
						v == 1 && (this.board.P[i].type = TYPE_BLACK);
						v == 2 && (this.board.P[i].type = TYPE_WHITE);
					})
				}
			},
			printLabels() {
				//console.log(this.puzzle.labels)
				this.puzzle.labels && this.puzzle.labels.length && this.puzzle.labels.map(str => {
					const [code, char] = str.split(",");
					const idx = this.board.moveCode2Points(code)[0];
					if (this.board.P[idx].type == TYPE_EMPTY) {
						this.board.wLb(idx, char, this.board.bNumColor);
					}
					else if ((this.board.P[idx].type & 0xF0) == TYPE_NUMBER) {
						this.board.P[idx].text = char;
						this.board._printPoint(idx, true);
					}
				})
			},
			randomRotate(n	= Math.floor(Math.random() * 7)) {
				this.rotate = n;
				if (n >>> 2) {
					this.board.rotateY180();
					this.board.rotateMovesY180(this.options || []);
				}
				for(let i = n % 4; i > 0; i--) {
					this.board.rotate90();
					this.board.rotateMoves90(this.options || []);
				}
			},
			next() {
				if (this.puzzles.next()) {
					this.reset();
				}
			},
			previous() {
				if (this.puzzles.previous()) {
					this.reset();
				}
			},
			think() {
				const isBase = (this.puzzle.mode & puzzleCoder.MODE.BASE) == puzzleCoder.MODE.BASE;
				this.state == this.STATE.PLAYING && (!isBase || !this.options) && puzzleAI.think(this);
			},
			async stopThinking() {
				await puzzleAI.stopThinking(this);
				this.board.cle();
				this.board.hideStone();
			},
			async putStone(idx, markChar, markColor, timeout = 300) {
				this.board.putStone(idx, TYPE_NUMBER);
				await wait(timeout);
				this.board.hideStone();
				if ((this.board.P[idx].type & TYPE_NUMBER) == TYPE_NUMBER) return;
				if (game.puzzle.mode < puzzleCoder.MODE.BASE) this.board.wNb(idx, "auto", true);
				else this.board.wLb(idx, markChar || this.puzzle.mark, markColor || this.board.bNumColor)
			},
			async continuePutStone(moves, markChar, markColor, timeout) {
				while(moves.length) {
					const idx = moves.splice(0,1);
					await this.putStone(idx, markChar, markColor, timeout);
				}
			},
			async checkWin(idx) {
				await puzzleAI.checkWin(this, idx);
				this.state == this.STATE.PLAYING && await puzzleAI.checkMove(this, idx);
			},
			async aiPutStone(idx) {
				if ((this.state & this.STATE.GAMEOVER) == this.STATE.GAMEOVER) return;
				await this.putStone(idx);
				await this.checkWin(idx);
				btnAIHelp.enabled = true;
			},
			async playerPutStone(idx) {
				if ((this.state & this.STATE.GAMEOVER) == this.STATE.GAMEOVER) return;
				await this.putStone(idx);
				await this.checkWin(idx);
				this.state == this.STATE.PLAYING && this.think()
			},
			async openJSON(file) {
				try{
				const newData = await puzzleData.jsonFile2Data(file, (progress) => outputInnerHTML({ indexLabel: `${(progress*100).toFixed(2)}%`, title: `${(progress*100).toFixed(2)}%` }));
				const oldData = await puzzleData.getDataByKey(newData.key) || {};
				
				if(Object.keys(oldData).length) {
					window.warn("不用重复添加题集");
				}
				else puzzleData.addData(newData);
				//IndexedDB.clearStore("puzzle")
				await this.loadJSON(newData.json)
				}catch(e){console.error(e.stack)}
			},
			async loadJSON(jsonString) {
				this.puzzles = puzzleCoder.renjuJSON2Puzzles(jsonString);
				this.data = await puzzleData.getDataByIndex("json", jsonString);
				this.puzzles.index = this.data && this.data[puzzleData.INDEX.INDEX] || 0;
				this.reset();
			},
			async addDefaultPuzzles(path, callback) {
				this.defaultPuzzleTimes.length = 0;
				await puzzleData.addDefaultPuzzles(path, this.defaultPuzzleTimes, callback);
			},
			async continuePlay() {
				try{
				const proge = await puzzleData.getProgress();
				if (proge) {
					const data = await puzzleData.getDataByIndex("time", proge.time);
					if (data) {
						await this.loadJSON(data.json)
						return;
					}
				}
				}catch(e){console.error(e.stack)}
			},
			get state() { return this._state },
			set state(st) {
				this._state = st;
				if (this._state == this.STATE.IMAGELOADIMG) {
					canvasClick = canvasClick_imageLoading;
					canvasDblClick = canvasDblClick_imageLoading;
					canvasDblTouchStart = canvasDblTouchStart_imageLoading;
					canvasContextMenu = canvasContextMenu_imageLoading;
				}
				else if (this._state == this.STATE.LOADING) {
					canvasClick = canvasDblClick = canvasDblTouchStart = canvasContextMenu = () => {
						if (this.puzzle.mode == puzzleCoder.MODE.COVER) msgbox({ 
							text: "跳过封面开始做题", 
							btnNum: 1,
							enterFunction: () => {
								let i=0;
								while(i++ < game.puzzles.length) {
									game.puzzles.next();
									if (game.puzzles.currentPuzzle.mode) {
										game.reset();
										return;
									}
								}
							}
						});
					};
				}
				else if (this._state == this.STATE.PLAYING) {
					canvasClick = canvasClick_playing;
					canvasDblClick = canvasDblClick_playing;
					canvasDblTouchStart = canvasDblTouchStart_playing;
					canvasContextMenu = canvasContextMenu_playing;
				}
				else if ((this._state & 0xF0) == this.STATE.GAMEOVER) {
					canvasClick = canvasClick_gameover;
					canvasDblClick = canvasDblClick_gameover;
					canvasDblTouchStart = canvasDblTouchStart_gameover;
					canvasContextMenu = canvasContextMenu_gameover;
				}
				return this._state;
			},
			get strength() { return this._strength },
			set strength(s) {
				this._strength = s; 
				outputInnerHTML({strengthLabel: this._strength < 100 ? "随机" : "最强" })
			},
			get notRotate() { return this._notRotate },
			set notRotate(b) {
				this._notRotate = b; 
				outputInnerHTML({ rotateLabel: this._notRotate  ? "固定" : "旋转" })
			},
			get playerSide() { return this.board.firstColor == "black" ? 1 : 2 },
			set playerSide(side) { this.board.firstColor = [, "black", "white"][side]; return this.playerSide },
			get aiSide() { return 3 - this.playerSide },
			get index() { return this.puzzles.index + 1 },
			set index(i) { 
				const oldIndex = this.puzzles.index;
				this.puzzles.index = i - 1;  
				if (this.puzzles.index != oldIndex) this.reset();
				return this.puzzles.index + 1;
			},
			get length() { return this.puzzles.length }
		}

		function processOutput(output) {
			try {
				if (output.realtime && output.realtime.pos) {
					const idx = output.realtime.pos[1] * 15 + output.realtime.pos[0];
					cBoard.showStone(idx, TYPE_NUMBER);
				}
				if (output.pos) {
					const idx = output.pos[1] * 15 + output.pos[0];
					cBoard.hideStone();
					cBoard.MSindex % 2 ? game.playerPutStone(idx) : game.aiPutStone(idx);
					if (game.puzzle.mode == puzzleCoder.MODE.VCT3 || ((game.puzzle.mode & puzzleCoder.MODE.STONES) == puzzleCoder.MODE.STONES))
						outputInnerHTML({ sideLabel: `还剩${game.residueStones}手` })
					else outputInnerHTML({ sideLabel: "玩家走棋" })
				}
				if (output.state) {
					game.state = output.state;
					if ((game.state & game.STATE.GAMEOVER) == game.STATE.GAMEOVER) {
						btnCommit.hide();
						if (game.state == game.STATE.LOST) {
							game.data.title != "错题复习" && puzzleData.addErrorPuzzle(game);
						}
						if (game.state == game.STATE.WIN) {
							showAIHelp();
							puzzleData.saveProgress(game);
						}
						output.tree && game.board.addTree(output.tree);
						output.options && (game.board.cleLb("all"), game.continuePutStone(output.options))
						output.warn && window.warn(output.warn, 1500);
						output.comment && (output.comment += `\n\n\n解题结束\n开始复盘......\n1.点击空格落子\n2.点击棋子悔棋`)
						output.errorPoints && game.continuePutStone(output.errorPoints, "✕", game.board.bNumColor)
						outputInnerHTML({
							indexLabel: `${game.data && game.data.progress && game.data.progress[game.puzzles.index] && "✔" || ""}  ${game.index}`,
							progressLabel: `(${game.data && game.data.progress ? game.data.progress.filter(v => v).length + "/" : ""}${game.puzzles.length})`
						})
					}
					outputInnerHTML(output);
					return;
				}
				if (output.sideLabel) {
					outputInnerHTML({ sideLabel: output.sideLabel })
				}
				if (output.comment) {
					outputInnerHTML({ comment: output.comment })
				}
			} catch(e){ console.error(e.stack) }
		}

		function outputInnerHTML(param) {
			const labels = { title, indexLabel, strengthLabel, rotateLabel, progressLabel, sideLabel, ruleLabel, modeLabel, comment };
			Object.keys(param).map(key => labels[key] && (console.warn(param[key]), labels[key].innerHTML = replaceAll(param[key], "\n", "<br>")))
		}

		function playerTryPutStone(idx) {
			if (idx < 0 || (cBoard.MSindex + 1 + (cBoard.firstColor == "black" ? 0 : 1)) % 2 + 1 == game.aiSide || game.state != game.STATE.PLAYING) return;
			if ((cBoard.P[idx].type & TYPE_NUMBER) == TYPE_NUMBER) {
				cBoard.hideStone();
			}
			else if (cBoard.startIdx == idx) {
				cBoard.hideStone();
				game.playerPutStone(idx);
			}
			else {
				cBoard.showStone(idx, TYPE_NUMBER);
			}
		}
		
		async function unlockArea() {
			btnLock.setChecked(false);
			await cBoard.unlockArea();
			mainUI.viewport.userScalable();
		}
		
		async function lockArea() {
			btnLock.setChecked(true);
			await cBoard.lockArea();
			mainUI.viewport.resize();
		}
		
		function newGame() {
			closeBoards();
			btnLock.checked && unlockArea();
			btnBlack.defaultontouchend();
			btnSLX.input.value = btnSLY.input.value = btnSize.input.value = 15;
			cBoard.setSize(15);
			cBoard.cle();
			cBoard.setScale(1, false);
			cBoard.resetCBoardCoordinate();
			cBoard.printEmptyCBoard();
			cBoard.resetNum = 0;
			cBoard.firstColor = "black";
			miniBoard.setSize(15);
			miniBoard.cle();
			miniBoard.setScale(1, false);
			miniBoard.game = undefined;
		}
		
		function imageMode() {
			newGame();
			game.state = game.STATE.IMAGELOADIMG;
			cBoard.resetCutDiv();
			renjuCmdDiv.hide();
			imgCmdDiv.show();
			[btnSLX, btnSLY, btnSize].map(btn => {
				const option = btn.getOption(15);
				option.li.click();
			})
		}
		
		function puzzleMode() {
			newGame();
			game.state = game.STATE.LOADIMG;
			cBoard.hideCutDiv();
			renjuCmdDiv.show();
			imgCmdDiv.hide();
		}
		
		async function openImg() {
			try {
				imageMode();
				await cBoard.loadImgFile(this.files[0]);
				cBoard.putImg(cBoard.bakImg, cBoard.canvas, cBoard.width / 13);
			} catch (e) { console.error(e.stack) }
			this.value = "";
		}
		
		async function openJSON() {
			try {
				mainUI.viewport.resize();
				await game.openJSON(this.files[0]);
			} catch (e) { console.error(e.stack) }
			this.value = "";
		}
		
		function getArray(game) {
			const size = miniBoard.size;
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
    		const arr = getArray(game);
    		let numBlackStones = 0, numWhiteStones = 0;
    		arr.map(v => { v == 1 && numBlackStones++; v == 2 && numWhiteStones++ })
    		return numWhiteStones < numBlackStones ? 2 : 1;
    	}
		
		function setStones(game, board) {
			game.stones = board.getCodeType(TYPE_NUMBER) || undefined;
			game.blackStones = board.getCodeType(TYPE_BLACK) || undefined;
			game.whiteStones = board.getCodeType(TYPE_WHITE) || undefined;
			game.sequence = board.MSindex + 1;
		}
		
		function createGame(array, board) {
			board.getCodeType(TYPE_NUMBER) && setStones(array, board);
			return array;
		}
		
		function changeGame() {
			const array = miniBoard.getArray();
			miniBoard.game.sequence && setStones(array, miniBoard);
			Object.assign(miniBoard.game, array);
		}
		
		function createPuzzle(game) {
			return {
				arr: getArray(game),
				side: getSide(game),
				rule: 2,
				size: miniBoard.size,
				mode: 96,
				randomRotate: false,
				stones: game.stones,
				blackStones: game.blackStones,
				whiteStones: game.whiteStones,
				sequence: game.sequence
			}
		}
		
		function loadGame(game) {
			if (game.stones || game.blackStones || game.whiteStones) {
				miniBoard.unpackCode(`${game.stones}{${game.blackStones}}{${game.whiteStones}}`, undefined, true);
			}
			else {
				miniBoard.unpackArray(game);
			}
		}
		
		function putMiniBoard() {
        	if (iswarn && (cBoard.SLTX != miniBoard.size || cBoard.SLTY != miniBoard.size)) {
        		iswarn = false;
        		msgbox({ text: `长按图片天元点可对齐棋盘\n（鼠标可右键代替长按）`, btnNum: 1 });
        	}
			const game = createGame(cBoard.getArray(), cBoard);
			miniBoard.game = game;
			loadGame(game);
			if (cBoard.SLTX == miniBoard.size && cBoard.SLTY == miniBoard.size) {
				loadMiniBoardPuzzle();
			}
		}
		
		async function createJSON() {
			const puzzles = [createPuzzle(miniBoard.game)];
			const logStr = await puzzleAI.checkPuzzles(puzzles, miniBoard, ()=>{});
            const json = await puzzleCoder.puzzles2RenjuJSON({puzzles}, ()=>{});
        	return json;
		}
		
		async function loadMiniBoardPuzzle() {
			try{
			const jsonStr = await createJSON();
			puzzleMode();
			await game.loadJSON(jsonStr);
			}catch(e){console.error(e.stack)}
		}

		let canvasClick, canvasDblClick, canvasDblTouchStart, canvasContextMenu;

		function addEvents() {
			bindEvent.setBodyDiv(mainUI.bodyDiv, mainUI.bodyScale, mainUI.upDiv);
			bindEvent.addEventListener(cBoard.viewBox, "click", click);
			bindEvent.addEventListener(cBoard.viewBox, "dblclick", doubleClick);
        	bindEvent.addEventListener(cBoard.viewBox, "dbltouchstart", dbltouchstart);
        	bindEvent.addEventListener(cBoard.viewBox, "contextmenu", contextmenu);
        	/*bindEvent.addEventListener(cBoard.viewBox, "zoomstart", (x1, y1, x2, y2) => cBoard.zoomStart(x1, y1, x2, y2))*/
			function click(x, y) { canvasClick(x, y) }
			function doubleClick(x, y) { canvasDblClick(x, y) }
			function dbltouchstart(x, y) { canvasDblTouchStart(x, y) }
			function contextmenu(x, y) { canvasContextMenu(x, y) }
		}
		
		function autoStoneLockMode(idx) {
			if ((cBoard.P[idx].type & TYPE_NUMBER) == TYPE_NUMBER) {
				cBoard.cleNb(idx, true);
			}
			else if (cBoard.P[idx].type == TYPE_EMPTY) {
				cBoard.wNb(idx, "auto", true);
			}
		}
		
		function blackStoneLockMode(idx) {
			if (cBoard.P[idx].type == TYPE_NUMBER) {
				cBoard.cleNb(idx, true);
			}
			else if ((cBoard.P[idx].type & TYPE_NUMBER) == TYPE_NUMBER) {
				cBoard.P[idx].cle();
			}
			else if (cBoard.P[idx].type == TYPE_EMPTY) {
				cBoard.P[idx].printNb(EMOJI_STAR_BLACK, "black", cBoard.gW, cBoard.gH, cBoard.bNumColor);
			}
		}
		
		function whiteStoneLockMode(idx) {
			if (cBoard.P[idx].type == TYPE_NUMBER) {
				cBoard.cleNb(idx, true);
			}
			else if ((cBoard.P[idx].type & TYPE_NUMBER) == TYPE_NUMBER) {
				cBoard.P[idx].cle();
			}
			else if (cBoard.P[idx].type == TYPE_EMPTY) {
				cBoard.P[idx].printNb(EMOJI_STAR_BLACK, "white", cBoard.gW, cBoard.gH, cBoard.wNumColor);
			}
		}
		
		function canvasClick_imageLoading(x, y) {
			if (btnLock.checked) {
				const idx = cBoard.getIndex(x, y);
				if (btnAuto.checked) autoStoneLockMode(idx);
				else if (btnBlack.checked) blackStoneLockMode(idx);
				else if (btnWhite.checked) whiteStoneLockMode(idx);
			}
			else {
				const p = { x: x, y: y };
                cBoard.setxy(p, event && event.type == "click" ? 2 : 1);
                cBoard.setCutDiv(p.x, p.y, true);
                cBoard.resetP();
                cBoard.printBorder();
			}
		}
		
		function canvasDblClick_imageLoading(x, y) {}
		
		function canvasDblTouchStart_imageLoading(x, y) {
			if (!btnLock.checked) cBoard.selectArea(x, y)
		}
		
		function canvasContextMenu_imageLoading(x, y) {
			if (btnLock.checked) {
				const idx = cBoard.getIndex(x, y);
				if (idx < 0) return;
				const moveX = ~~((miniBoard.size - 1) / 2) - (idx % 15);
				const moveY = ~~((miniBoard.size - 1) / 2) - ~~(idx / 15);
				const arr = cBoard.getArray();
				if (arr.find(v => v > 0)) {
					putMiniBoard();
					miniBoard.translate(moveY, moveX);
					changeGame();
				}
				else window.warn("空棋盘");
			}
			else {
				cBoard.selectArea(x, y)
			}
		}
		
		function canvasClick_playing(x, y) {
			console.log("canvasClick_playing")
			const idx = cBoard.getIndex(x, y);
			if (game.state == game.STATE.PLAYING) {
				if (game.puzzle.mode < puzzleCoder.MODE.BASE) {
					playerTryPutStone(idx);
				}
				else {
					if ((cBoard.P[idx].type & 0xF0) == TYPE_MARK && cBoard.P[idx].text == game.puzzle.mark) {
						game.board.cleLb(idx);
						if (game.puzzle.labels && game.puzzle.labels.length) {
							const charArr = [];
							const points = [];
							game.puzzle.labels.map(str => {
								const [code, char] = str.split(",");
								const _idx = game.board.moveCode2Points(code)[0];
								charArr.push(char);
								points.push(_idx);
							})
							if (game.rotate >>> 2) {
								game.board.rotateMovesY180(points);
							}
							for (let i = game.rotate % 4; i > 0; i--) {
								game.board.rotateMoves90(points);
							}
							
							const char = charArr[points.indexOf(idx)];
							char && game.board.wLb(idx, char, game.board.bNumColor);
						}
					}
					else if (cBoard.P[idx].type == TYPE_EMPTY || (cBoard.P[idx].type & 0xF0) == TYPE_MARK && cBoard.P[idx].text != game.puzzle.mark) {
						game.board.wLb(idx, game.puzzle.mark, game.board.bNumColor);
					}
				}
			}
		}

		function canvasDblClick_playing(x, y) {
			console.log("canvasDblClick_playing")
			const idx = cBoard.getIndex(x, y);
			if (idx < 0 || (cBoard.MSindex + 1 + (cBoard.firstColor == "black" ? 0 : 1)) % 2 + 1 == game.aiSide || game.state != game.STATE.PLAYING) return;
			if (game.puzzle.mode < puzzleCoder.MODE.BASE) {
				playerTryPutStone(idx);
				//cBoard.hideStone();
				//cBoard.P[idx].type == TYPE_EMPTY && game.playerPutStone(idx);
			}
			else {
			}
		}
		
		function canvasDblTouchStart_playing(x, y) {}
		
		function canvasContextMenu_playing(x, y) {}
		
		function toPrevious(isShowNum, timeout = 0) {
			if (cBoard.tree && cBoard.MSindex <= cBoard.tree.init.MSindex) return false;
			cBoard.toPrevious(isShowNum, timeout);
			cBoard.MS[cBoard.MSindex] == 225 && cBoard.toPrevious(isShowNum, timeout);
			return true;
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

		function canvasClick_gameover(x, y) {
			const idx = cBoard.getIndex(x, y);
			if ((game.state & game.STATE.GAMEOVER) == game.STATE.GAMEOVER) {
				if (game.puzzle.mode < puzzleCoder.MODE.BASE) {
					if ((cBoard.P[idx].type & 0xF0) == TYPE_NUMBER && cBoard.MSindex >= 0) {
						toPrevious(true);
					}
					else if(cBoard.P[idx].type == TYPE_EMPTY) {
						cBoard.wNb(idx, "auto", true);
					}
					else if((cBoard.P[idx].type & 0xF0) == TYPE_MARK) {
						selectBranch(cBoard.P[idx])
						.then(({ path, nMatch }) => {
							if (path && path.length) {
								(path.indexOf(idx) & 1) == (cBoard.MSindex & 1) && cBoard.wNb(225, "auto", true, undefined, undefined, 100);
								cBoard.wNb(idx, "auto", true);
							}
							else {
								cBoard.wNb(idx, "auto", true);
							}
						})
					}
				}
				else {
					if ((cBoard.P[idx].type & 0xF0) == TYPE_MARK) game.board.cleLb(idx);
					else if (cBoard.P[idx].type == TYPE_EMPTY) game.board.wLb(idx, game.puzzle.mark, game.board.bNumColor);
				}
			}
		}

		function canvasDblClick_gameover(x, y) {
			if ((game.state & game.STATE.GAMEOVER) == game.STATE.GAMEOVER) {
				const idx = cBoard.getIndex(x, y);
				while ((cBoard.P[idx].type & 0xF0) == TYPE_NUMBER && cBoard.MSindex > -1) {
					if (cBoard.MSindex < 0 || cBoard.MS[cBoard.MSindex] == idx) return;
					if (!toPrevious(true, 100)) return;
				}
			}
		}

		function canvasDblTouchStart_gameover(x, y) {}
		
		const canvasContextMenu_gameover = canvasDblClick_gameover;

		cBoard.stonechange = function() {
			if (this.tree) {
				this.showBranchs(iHTML => comment.innerHTML = iHTML.split("<br><br>").join("") || "<br>1.点击棋子悔棋<br>2.双击棋子悔到双击的那一手");
				if (this.MSindex % 2) {
					const arr = this.getArray();
					arr.map((v, idx) => {
						(this.P[idx].type & TYPE_NUMBER) != TYPE_NUMBER && isFoul(idx, arr) && this.wLb(idx, "❌", "red")
					})
				}
			}
		}

		addEvents();
		mainUI.loadTheme();
		mainUI.viewport.resize();
		puzzleAI.processOutput = processOutput;
		self.cBoard = cBoard;
		window.setBlockUnload(true);
		
		const path = CUR_PATH + "json/";
		await waitValueChange({get v() {return window.puzzleData}}, "v", undefined)
		
		const jsonStr = puzzleData.loadURL2JSON(window.location.href);
		if (jsonStr) await game.loadJSON(jsonStr)
		else await game.continuePlay();
		
		await game.addDefaultPuzzles(path, (json) => {
			if (!jsonStr && !game.data) {
				game.loadJSON(json)
			}
		});
		
		setTimeout(async () => {
			await puzzleData.removeErrorPuzzle();
			await puzzleData.createRandomPuzzles();
		},10000)
		
	} catch (e) { alert(e.stack) }
})()