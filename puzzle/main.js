(async () => {
	try {
		"use strict";
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
					puzzle.rotate = game.rotate;
					shareURL(puzzle);
				}
		},
			{
				varName: "btnAIHelp",
				type: "button",
				text: "求助 AI",
				touchend: function() { game.state == game.STATE.PLAYING && game.board.MSindex % 2 && puzzleAI.aiHelp(game) }
		},
			{
				varName: "btnOpenPuzzles",
				type: "button",
				text: "选择题集",
				touchend: function() {openItemBoard()}
			},
			{
				varName: "btnOpenJSON",
				type: "file",
				text: "导入JSON",
				change: async function() {
    			try {
        			mainUI.viewport.resize();
        			await game.openJSON(this.files[0]);
        		} catch (e) { console.error(e.stack) }
        		this.value = "";
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
		
		const hideCmdDiv = mainUI.createCmdDiv();
		const renjuCmdDiv = mainUI.createCmdDiv();
		const cBoard = mainUI.createCBoard();
		hideCmdDiv.hide();
		mainUI.addButtons(mainUI.createButtons(menuSettings), hideCmdDiv, 0);
		mainUI.addButtons(mainUI.createButtons(gameButtonSettings), renjuCmdDiv, 1);

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
			btnRule,
			btnMode,
			btnRotate,
			btnStrength,
			btnOpenPuzzles
		} = mainUI.getChildsForVarname();
		
		const boardWidth = 5;
		const fontSize = mainUI.buttonHeight * 0.6;
		const liHeight = mainUI.buttonHeight * 1.2;
		function createItem(data) {
			try{
			const item = document.createElement("div");
			const title = document.createElement("div");
			const progress = document.createElement("div");
			const close = document.createElement("div");
			
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
				left: "0px",
				top: "0px",
				width: mainUI.cmdWidth * 0.75 + "px",
				height: liHeight + "px"
			})
			Object.assign(progress.style, {
				overflow: "hidden",
				textOverflow: "ellipsis",
				position: "relative",
				left: parseInt(title.style.width) + "px",
				top: -liHeight + "px",
				width: mainUI.cmdWidth * 0.15 + "px",
				height: liHeight + "px",
				textAlign: "right"
			})
			Object.assign(close.style, {
				overflow: "hidden",
				textOverflow: "ellipsis",
				position: "relative",
				fontSize: fontSize * 1.5 + "px",
				left: parseInt(progress.style.left) + parseInt(progress.style.width) + "px",
				top: -liHeight * 2 + "px",
				width: mainUI.cmdWidth * 0.1 + "px",
				height: liHeight + "px",
				textAlign: "center"
			})
			title.innerHTML = data.title;
			progress.innerHTML = `${data.progress.filter(v => v).length}/${data.progress.length}`;
			close.innerHTML = "✕";
			title.onclick = async function(){
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
		
		async function loadDeafultItems() {
			for (let i = 0; i < game.defaultPuzzleTimes.length; i++) {
				const data = await puzzleData.getDataByIndex("time", game.defaultPuzzleTimes[i]);
				data && itemBoard.addItem((li) => {
					const item = createItem(data);
					li.appendChild(item);
					li.time = data.time;
				})
			}
		}
		
		async function loadUserAddedItems() {
			puzzleData.openCursorByIndex("title", cursor => {
				//console.log(`cursor: ${cursor && cursor.value && cursor.value.title}`)
				const data = cursor && cursor.value;
				data && game.defaultPuzzleTimes.indexOf(data.time) == -1 && itemBoard.addItem((li) => {
					const item = createItem(data);
					li.appendChild(item);
					li.time = data.time;
				})
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
				const style = {opacity: `${game.data && game.data.progress && game.data.progress[i] ? 1 : 0.5}`};
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
		
		
		const itemButWidth = mainUI.cmdWidth / 2;
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
		
		const btnDefault = document.createElement("div");
		btnDefault.innerHTML = "默认题集";
		Object.assign(btnDefault.style, itemButStyle);
		btnDefault.onclick = () => {removeItemAll(); loadDeafultItems()}
		
		const btnUserAdded = document.createElement("div");
		btnUserAdded.innerHTML = "用户添加";
		itemButStyle.left = itemButWidth * 1 + "px";
		Object.assign(btnUserAdded.style, itemButStyle);
		btnUserAdded.onclick = () => {removeItemAll(); loadUserAddedItems()}
		
		const buttons = document.createElement("div");
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
					end = new Date().getTime() + timeout;
					if (!timer) timer = setInterval(() => {
						if (new Date().getTime() > end) {
							try{ callback() }catch(e){ console.error(e.stack) }
							clearInterval(timer);
							timer = null;
						}
					}, Math.min(60 * 1000, timeout))
				}
				})()
		}
		
		function hideAIHelp() {
			lbTimer.move(parseInt(btnAIHelp.left), parseInt(btnAIHelp.top), undefined, undefined, btnAIHelp.parentNode);
			lbTimer.reset();
			lbTimer.start();
			btnAIHelp.hide();
		}
		
		function showAIHelp() {
			btnAIHelp.show();
			lbTimer.hide();
			lbTimer.stop();
		}
		
		const delayAIHelp = createDelayCallback(() => showAIHelp());
		
		const delayCheckWin = createDelayCallback(() => puzzleAI.checkWin(game));
		
		const delaySaveProgress = createDelayCallback(() => puzzleData.saveProgress(game))
		
		const game = {
			STATE: {
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
				await this.stopThinking();
				this.strength = this._strength;
				this.notRotate = this._notRotate;
				inputButton.hide();
				const isLocation = window.location.href.indexOf("http://") > -1;
				const delay = isLocation ? 0 : this.puzzle.delayHelp * 60 * 1000;
				hideAIHelp();
				delayAIHelp(delay);
				//!this.data && (this.data = {progress: new Array(this.puzzles.length).fill(0)});
				this.board.canvas.width = this.board.canvas.height = this.board.width;
				this.board.canvas.style.width = this.board.canvas.style.height = this.board.width + "px";
				this.board.cle();
				this.board.removeTree();
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
					this.puzzle.image && this.board.loadImgURL(this.puzzle.image).then(() => this.board.putImg());
				}
				else {
					this.state = this.STATE.PLAYING;
					delaySaveProgress(5000);
					outputInnerHTML({
						sideLabel: "玩家走棋"
					})
					html += `难度: ${"★★★★★".slice(0, this.puzzle.level)}\n`;
					html += `玩家: ${[,"● 棋","○ 棋"][this.playerSide]}\n`;
					html += `规则: ${ruleStr}\n`;
					html += `模式: ${modeStr}\n\n`;
					(this.puzzle.randomRotate || rotate != undefined) && !this.notRotate ? this.randomRotate(rotate) : (this.rotate = 0);
					!isLocation && (this.puzzle.mode & puzzleCoder.MODE.BASE) == puzzleCoder.MODE.BASE &&  delayCheckWin(1800);
				}
				html += this.puzzle.comment || ""
				outputInnerHTML({
					title: this.puzzle.title,
					ruleLabel: ruleStr,
					modeLabel: modeStr.replaceAll("模式",""),
					indexLabel: `${this.data && this.data.progress && this.data.progress[this.puzzles.index] && "✔" || ""}  ${this.index}`,
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
				console.log(this.puzzle.labels)
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
				for(let i = n % 4; i >= 0; i--) {
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
					warn("不用重复添加题集");
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
			async addDefaultPuzzles(path) {
				this.defaultPuzzleTimes = await puzzleData.addDefaultPuzzles(path);
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
				if (this._state == this.STATE.LOADING)(canvasClick = canvasDblClick = () => {})
				else if (this._state == this.STATE.PLAYING)(canvasClick = canvasClick_playing, canvasDblClick = canvasDblClick_playing)
				else if ((this._state & 0xF0) == this.STATE.GAMEOVER)(canvasClick = canvasClick_gameover, canvasDblClick = canvasDblClick_gameover)
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
						game.state == game.STATE.WIN && puzzleData.saveProgress(game);
						output.tree && game.board.addTree(output.tree);
						output.options && (game.board.cleLb("all"), game.continuePutStone(output.options))
						output.warn && warn(output.warn, 1500);
						output.comment && (output.comment += `\n\n\n解题结束\n开始复盘\n1.点击空格落子\n2.点击棋子悔棋`)
						output.errorPoints && game.continuePutStone(output.errorPoints, "✕", game.board.bNumColor)
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
			Object.keys(param).map(key => labels[key] && (console.warn(param[key]), labels[key].innerHTML = param[key].replaceAll("\n", "<br>")))
		}

		function playerTryPutStone(idx) {
			if (idx < 0 || (cBoard.MSindex + 1 + (cBoard.firstColor == "black" ? 0 : 1)) % 2 + 1 == game.aiSide || game.state != game.STATE.PLAYING) return;
			const startColor = cBoard.wNumColor;
			const borderColor = cBoard.bNumColor;
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

		let canvasClick, canvasDblClick;

		function addEvents() {
			bindEvent.setBodyDiv(mainUI.bodyDiv, mainUI.bodyScale, mainUI.upDiv);
			bindEvent.addEventListener(cBoard.viewBox, "click", click);
			bindEvent.addEventListener(cBoard.viewBox, "dblclick", doubleClick);
			bindEvent.addEventListener(cBoard.viewBox, "dbltouchstart", continueBack);
			bindEvent.addEventListener(cBoard.viewBox, "contextmenu", continueBack);
			/*bindEvent.addEventListener(cBoard.viewBox, "zoomstart", (x1, y1, x2, y2) => cBoard.zoomStart(x1, y1, x2, y2))*/
			function click(x, y) { canvasClick(x, y) }

			function doubleClick(x, y) { canvasDblClick(x, y) }
		}

		function canvasClick_playing(x, y) {
			const idx = cBoard.getIndex(x, y);
			if (game.state == game.STATE.PLAYING) {
				if (game.puzzle.mode < puzzleCoder.MODE.BASE) {
					playerTryPutStone(idx);
				}
				else {
					playerTryPutStone(idx);
				}
			}
		}

		function canvasDblClick_playing(x, y) {
			const idx = cBoard.getIndex(x, y);
			if (idx < 0 || cBoard.MS.length % 2 || game.state != game.STATE.PLAYING) return;
			if (game.puzzle.mode < puzzleCoder.MODE.BASE) {
				playerTryPutStone(idx);
			}
			else {
				playerTryPutStone(idx);
			}
		}

		function canvasClick_gameover(x, y) {
			const idx = cBoard.getIndex(x, y);
			if ((game.state & game.STATE.GAMEOVER) == game.STATE.GAMEOVER) {
				if (game.puzzle.mode < puzzleCoder.MODE.BASE) {
					((cBoard.P[idx].type & 0xF0) == TYPE_MARK || cBoard.P[idx].type == TYPE_EMPTY) && game.putStone(idx);
					((cBoard.P[idx].type & 0xF0) == TYPE_NUMBER && cBoard.MSindex >= 0) && cBoard.toPrevious(true);
				}
				else {
					cBoard.P[idx].type == TYPE_EMPTY && game.putStone(idx);
					(cBoard.P[idx].type & 0xF0) == TYPE_MARK && game.board.cleLb(idx);
				}
			}
		}

		function canvasDblClick_gameover(x, y) {}

		function continueBack(x, y) {
			if ((game.state & game.STATE.GAMEOVER) == game.STATE.GAMEOVER) {
				const idx = cBoard.getIndex(x, y);
				while ((cBoard.P[idx].type & 0xF0) == TYPE_NUMBER && cBoard.MSindex > -1) {
					if (cBoard.MSindex < 0 || cBoard.MS[cBoard.MSindex] == idx) return;
					cBoard.toPrevious(true)
				}
			}
		}

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
		await game.addDefaultPuzzles(path);
		if (!jsonStr && !game.data && game.defaultPuzzleTimes.length) {
			const data = await puzzleData.getDataByIndex("time", game.defaultPuzzleTimes[0]);
			game.loadJSON(data.json)
		}
	} catch (e) { console.error(e.stack) }
})()