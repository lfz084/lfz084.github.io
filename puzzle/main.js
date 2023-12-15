(() => {
	try {
		"use strict";
		const d = document;
		const dw = d.documentElement.clientWidth;
		const dh = d.documentElement.clientHeight;

		async function wait(timer = 0) { return new Promise(resolve => setTimeout(resolve, timer)) }

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

				}
			}),
		undefined, undefined, undefined,
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
				click: () => {

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
				varName: "btnReset",
				type: "button",
				text: "重来",
				touchend: function() { game.reset() }
				},
		mainUI.newLabel({
				varName: "sideLabel",
				type: "div",
				width: mainUI.buttonWidth,
				height: mainUI.buttonHeight,
				style: {
					fontSize: `${mainUI.buttonHeight / 1.8}px`,
					textAlign: "center",
					lineHeight: `${mainUI.buttonHeight}px`
				},
				click: () => {

				}
			}),
			{
				varName: "btnAIHelp",
				type: "button",
				text: "求助AI",
				touchend: function() { game.state == game.STATE.PLAYING && game.board.MSindex % 2 && puzzleAI.aiHelp(game) }
		},
			{
				varName: "btnShareURL",
				type: "button",
				text: "求助好友",
				touchend: function() {}
		},
			{
				varName: "btnShare",
				type: "button",
				text: "分享图片",
				touchend: function() {}
		},
		mainUI.newComment({
				varName: "comment",
				type: "div",
				width: mainUI.buttonWidth * 4.99 - mainUI.buttonHeight / 1.8,
				height: mainUI.buttonHeight * 9,
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
			})
		];

		const busyCmdDiv = mainUI.createCmdDiv();
		const renjuCmdDiv = mainUI.createCmdDiv();
		const cBoard = mainUI.createCBoard();
		mainUI.addButtons(mainUI.createButtons(gameButtonSettings), renjuCmdDiv, 1);

		const {
			title,
			sideLabel,
			indexLabel,
			comment
		} = mainUI.getChildsForVarname();

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
			options: undefined,
			residueStones: 0,
			puzzles: puzzleCoder.demoPuzzles,
			board: cBoard,
			async reset() {
				await this.stopThinking();
				this.board.canvas.width = this.board.canvas.height = this.board.width;
				this.board.canvas.style.width = this.board.canvas.style.height = this.board.width + "px";
				this.board.cle();
				this.board.removeTree();
				this.board.setSize(this.puzzle.size);
				this.unpackCode();
				this.board.resetNum = 0;
				this.playerSide = this.puzzle.side;
				this.residueStones = this.puzzle.mode & 0x1F;
				this.options = !this.puzzle.options ? undefined : this.board.moveCode2Points(this.puzzle.options);
				let html = "";
				if (this.puzzle.mode == puzzleCoder.MODE.COVER) {
					this.state = this.STATE.LOADING;
					outputInnerHTML({
						sideLabel: "习题封面"
					})
					this.puzzle.image && this.board.loadImgURL(this.puzzle.image).then(() => this.board.putImg())
				}
				else {
					this.state = this.STATE.PLAYING;
					outputInnerHTML({
						sideLabel: "玩家走棋"
					})
					html += `难度: ${"★★★★★".slice(0, this.puzzle.level)}\n`
					html += `玩家: ${[,"黑棋","白棋"][this.playerSide]}\n`
					html += `规则: ${["无禁",,"禁手"][this.puzzle.rule]}\n`
					html += `模式: ${puzzleCoder.getModeName(this.puzzle.mode)}\n\n`
				}
				html += this.puzzle.comment || ""
				outputInnerHTML({
					title: this.puzzle.title,
					indexLabel: `${this.puzzles.index + 1} / ${this.puzzles.length}`,
					comment: html.split("\n").join("<br>")
				})
			},
			unpackCode() {
				this.board.unpackCode(`${this.puzzle.stones}{${this.puzzle.blackStones}}{${this.puzzle.whiteStones}}`)
				const arr = this.board.getArray();
				this.board.cle();
				arr.map((side, idx) => {
					side == 1 && this.board.wNb(idx, "black", true);
					side == 2 && this.board.wNb(idx, "white", true);
				})
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
			async putStone(idx) {
				this.board.putStone(idx, TYPE_NUMBER);
				await wait(300);
				this.board.hideStone();
				this.board.wNb(idx, "auto", true);
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
				if ((game.puzzle.mode & puzzleCoder.MODE.BASE) == puzzleCoder.MODE.BASE) {
					this.board.wLb(idx, this.puzzle.mark, this.board.bNumColor)
				}
				else {
					await this.putStone(idx);
				}
				await this.checkWin(idx);
				this.state == this.STATE.PLAYING && this.think()
			},
			get state() { return this._state },
			set state(st) {
				this._state = st;
				if (this._state == this.STATE.LOADING)(canvasClick = canvasDblClick = () => {})
				else if (this._state == this.STATE.PLAYING)(canvasClick = canvasClick_playing, canvasDblClick = canvasDblClick_playing)
				else if ((this._state & 0xF0) == this.STATE.GAMEOVER)(canvasClick = canvasClick_gameover, canvasDblClick = canvasDblClick_gameover)
				return this._state;
			},
			get puzzle() { return this.puzzles.currentPuzzle },
			get playerSide() { return this.board.firstColor == "black" ? 1 : 2 },
			set playerSide(side) { this.board.firstColor = [, "black", "white"][side]; return this.playerSide },
			get aiSide() { return 3 - this.playerSide },
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
						output.tree && game.board.addTree(output.tree);
						output.warn && warn(output.warn, 1500);
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
			const labels = { title, indexLabel, sideLabel, comment };
			Object.keys(param).map(key => labels[key] && (console.warn(param[key]), labels[key].innerHTML = param[key]))
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
			bindEvent.addEventListener(cBoard.viewBox, "dbltouchstart", back);
			bindEvent.addEventListener(cBoard.viewBox, "contextmenu", back);
			/*bindEvent.addEventListener(cBoard.viewBox, "zoomstart", (x1, y1, x2, y2) => cBoard.zoomStart(x1, y1, x2, y2))*/
			function click(x, y) { canvasClick(x, y) }

			function doubleClick(x, y) { canvasDblClick(x, y) }
		}

		function canvasClick_playing(x, y) {
			const idx = cBoard.getIndex(x, y);
			if (game.state == game.STATE.PLAYING) playerTryPutStone(idx);
		}

		function canvasDblClick_playing(x, y) {
			const idx = cBoard.getIndex(x, y);
			if (idx < 0 || cBoard.MS.length % 2 || game.state != game.STATE.PLAYING) return;
			playerTryPutStone(idx);
		}

		function canvasClick_gameover(x, y) {
			const idx = cBoard.getIndex(x, y);
			if ((game.state & game.STATE.GAMEOVER) == game.STATE.GAMEOVER) {
				((cBoard.P[idx].type & 0xF0) == TYPE_MARK || cBoard.P[idx].type == TYPE_EMPTY) && game.putStone(idx);
				((cBoard.P[idx].type & 0xF0) == TYPE_NUMBER && cBoard.MSindex >= cBoard.resetNum) && cBoard.toPrevious(true);
			}
		}

		function canvasDblClick_gameover(x, y) {}

		function back(x, y) {
			if ((game.state & game.STATE.GAMEOVER) == game.STATE.GAMEOVER) {
				const idx = cBoard.getIndex(x, y);
				while ((cBoard.P[idx].type & 0xF0) == TYPE_NUMBER && cBoard.MSindex > -1) {
					if (cBoard.MSindex < cBoard.resetNum || cBoard.MS[cBoard.MSindex] == idx) return;
					cBoard.toPrevious(true)
				}
			}
		}

		cBoard.stonechange = function() {
			if (this.tree) {
				this.showBranchs(iHTML => comment.innerHTML = iHTML.split("<br><br>").join(""));
				const arr = this.getArray();
				arr.map((v, idx) => {
					this.P[idx].type == TYPE_EMPTY && isFoul(idx, arr) && this.wLb(idx, "❌", "red")
				})
			}
		}

		addEvents();
		mainUI.loadTheme();
		mainUI.viewport.resize();
		game.reset()
		puzzleAI.processOutput = processOutput;
		self.cBoard = cBoard;
	} catch (e) { console.error(e.stack) }
})()