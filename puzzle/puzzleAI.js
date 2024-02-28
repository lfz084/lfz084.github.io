window.puzzleAI = (() => {
	try {
		"use strict";

		const RAPFI_RULE = {
			freestyle: 0,
			renju: 2,
			1: 0,
			2: 2
		}

		const RENJU_RULE = {
			freestyle: 1,
			renju: 2,
			0: 1,
			2: 2
		}

		const STATE_RENJU_READY = 0x01;
		const STATE_GOMOCALC_READY = 0x02;
		const STATE_RENJU_THINKING = 0x04;
		const STATE_GOMOCALC_THINKING = 0x08;
		const STATE_AI_READY = STATE_RENJU_READY | STATE_GOMOCALC_READY;
		const STATE_AI_THINKING = STATE_RENJU_THINKING | STATE_GOMOCALC_THINKING;
		
		const MARKFOUL_33 = 0x01;
		const MARKFOUL_44_DBL_LINE = 0x02;
		const MARKFOUL_44_ONE_LINE = 0x04;
		const MARKFOUL_44 = MARKFOUL_44_DBL_LINE | MARKFOUL_44_ONE_LINE;
		const MARKFOUL_6 = 0x08;
		const MARKFOUL_5 = 0x10;

		let aiState = 0;

		let processOutput = () => {};
		self["gomocalc"] && gomocalc.init(gomocalcOutput);
		engine.ready().then(() => aiState = aiState | STATE_RENJU_READY)
		//setInterval(() => processOutput({sideLabel: aiState})}, 1000)
		function idx2Pos(idx = -1) {
			if (idx < 0 || idx > 224) return [-1, -1]
			else return [idx % 15, ~~(idx / 15)]
		}

		function strength(min, max) {
			return Math.min(100, Math.floor(min) + Math.floor(Math.random() * (max - min)))
		}

		function gomocalcOutput(output) {
			if (output.pos) {
				aiState = aiState & ~STATE_GOMOCALC_THINKING;
				processOutput(output)
			}
			else if (output.ok) {
				aiState = aiState | STATE_GOMOCALC_READY;
			}
			else {
				processOutput(output)
			}
		}

		async function waitValue(obj, key, value, timeout = 500) {
			return new Promise((resolve) => {
				let timer = setInterval(() => {
					if (obj[key] === value) {
						clearInterval(timer);
						resolve(obj[key]);
					}
				}, timeout)
			})
		}

		//------------------------- CheckMove -----------------------------------
		const CHECKMOVE_OUTPUT = {
			"-1": {
				warn: "没有冲四",
				comment: "没有冲四，不符合VCF解题规则"
			},
			"-2": {
				warn: "进攻级别不够",
				comment: "进攻级别不到活三级别，不符合VCT解题规则"
			},
			"-3": {
				warn: "超出手数",
				comment: "超出规定手数，不符合解题规则"
			}
		}
		const filterCheckMove = {};
		filterCheckMove[puzzleCoder.MODE.VCF] = async function(game, idx) {
			const level = getLevel(game.board.getArray(), game.playerSide) & 0xff;
			return level < LEVEL_NOFREEFOUR ? -1 : 0;
		}
		filterCheckMove[puzzleCoder.MODE.VCT] = async function(game, idx) {
			const level = (await getLevelB(game.board.getArray(), game.playerSide, 1, 180, 2560000)) & 0xff;
			return level < LEVEL_FREETHREE ? -2 : 0;
		}
		filterCheckMove[puzzleCoder.MODE.VCT3] = async function(game, idx) {
			const position = game.board.getArray();
			const level = (await getLevelB(position, game.playerSide, 1, 180, 2560000)) & 0xff;
			if (level < LEVEL_FREETHREE) return -2;

			if (game.residueStones > 1 || game.residueStones == 1 && level == LEVEL_FREETHREE) {
				position[game.board.MS[game.board.MSindex]] = 0;
				LEVEL_NOFREEFOUR > (getLevel(position, game.aiSide) & 0xff) && game.residueStones--
			}
			return game.residueStones == 0 ? -3 : 0;
		}
		filterCheckMove[puzzleCoder.MODE.FREE] = async function(game, idx) {

		}
		filterCheckMove[puzzleCoder.MODE.STONES3] = filterCheckMove[puzzleCoder.MODE.STONES4] = filterCheckMove[puzzleCoder.MODE.STONES5] = async function(game) {
			--game.residueStones;
			return game.residueStones == 0 ? -3 : 0;
		}

		//------------------------- Think -----------------------------------

		const filterThink = {};
		filterThink[puzzleCoder.MODE.VCF] = filterThink[puzzleCoder.MODE.VCT] = filterThink[puzzleCoder.MODE.VCT3] = filterThink[puzzleCoder.MODE.FREE] = function(game) {
			gomocalcThink(game, game.aiSide);
		}

		filterThink[puzzleCoder.MODE.STONES3] = filterThink[puzzleCoder.MODE.STONES4] = filterThink[puzzleCoder.MODE.STONES5] = async function(game) {
			filterThink[puzzleCoder.MODE.VCT](game)
		}

		//------------------------- AIHelp -----------------------------------

		const filterAIHelp = {};
		filterAIHelp[puzzleCoder.MODE.VCF] = async function(game) {
			aiState = aiState | STATE_RENJU_THINKING;
			const param = {
				arr: game.board.getArray(),
				color: game.playerSide,
				maxVCF: 1,
				maxDepth: 225,
				maxNode: 2560000
			}
			const tree = await engine.createTreeVCF(param);
			processOutput({ state: game.STATE.READ, sideLabel: "参考答案", tree: tree });
			/*
			const levelInfo = getLevel(param.arr, param.color);
			if(levelInfo >= LEVEL_NOFREEFOUR) {
				processOutput({ pos: idx2Pos(levelInfo >> 8 & 0xFF) })
			}
			else {
				const vcfMoves = (await engine.findVCF(param)).winMoves[0];
				processOutput({ pos: idx2Pos(vcfMoves[0] || -1) })
			}
			*/
			aiState = aiState & ~STATE_RENJU_THINKING;
		}

		filterAIHelp[puzzleCoder.MODE.VCT] = filterAIHelp[puzzleCoder.MODE.VCT3] = filterAIHelp[puzzleCoder.MODE.FREE] = function(game) {
			gomocalcThink(game, game.playerSide, 100, 100);
		}
		
		filterAIHelp[puzzleCoder.MODE.VCT3] = async function(game) {
			aiState = aiState | STATE_RENJU_THINKING;
			const param = {
				arr: game.board.getArray(),
				color: game.playerSide,
				maxVCF: 1,
				maxDepth: 225,
				maxNode: 2560000,
				maxVCT: 1,
				maxDepthVCT: (game.residueStones + 1) * 2 - 3,
				maxNodeVCT: 2560000
			}
			const { tree, positionMoves, isPushPass, current } = engine.createTree(param);
			await engine.addBranchSimpleWin(param, tree, current);
			current.comment = "W胜点<br>L败点<br>点击标记查看分支<br>点击或双击棋子后退"
			processOutput({ state: game.STATE.READ, sideLabel: "参考答案", tree: tree });
			aiState = aiState & ~STATE_RENJU_THINKING;
		}

		filterAIHelp[puzzleCoder.MODE.STONES3] = filterAIHelp[puzzleCoder.MODE.STONES4] = filterAIHelp[puzzleCoder.MODE.STONES5] = async function(game) {
			aiState = aiState | STATE_RENJU_THINKING;
			const param = {
				arr: game.board.getArray(),
				color: game.playerSide,
				maxVCF: 1,
				maxDepth: game.residueStones * 2 - 3,
				maxNode: 2560000,
				nMaxDepth: 180
			}
			const { tree, positionMoves, isPushPass, current } = engine.createTree(param);
			const timer = setInterval(() => {
				const nodes = current.getChilds();
				nodes.map(node => {
					if (node.boardText == "W") {
						clearInterval(timer);
						engine.cancel();
					}
				})
			}, 500)
			await engine.addBranchNumberWin(param, tree, current);
			current.comment = "W胜点<br>L败点<br>点击标记查看分支<br>点击或双击棋子后退"
			processOutput({ state: game.STATE.READ, sideLabel: "参考答案", tree: tree });
			aiState = aiState & ~STATE_RENJU_THINKING;
		}
		
		filterAIHelp[puzzleCoder.MODE.BASE] = async function(game) {
			aiState = aiState | STATE_RENJU_THINKING;
			const options = game.options  = game.options || await getOptions(game);
			processOutput({ state: game.STATE.READ, sideLabel: "参考答案", options: options });
			aiState = aiState & ~STATE_RENJU_THINKING;
		}
		
		//--------------------------------------------------------------------------
		
		const filterCallbackTree = {};
		filterCallbackTree[puzzleCoder.MODE.VCF] = createTreeVCF;
		filterCallbackTree[puzzleCoder.MODE.VCT] = createTreePointsVCT;
		filterCallbackTree[puzzleCoder.MODE.VCT3] = createTreeVCT3;
		filterCallbackTree[puzzleCoder.MODE.STONES4] = filterCallbackTree[puzzleCoder.MODE.BASE_DOUBLE_VCF_43] = createTreeDoubleVCF43;
		
		filterCallbackTree[puzzleCoder.MODE.BASE_FOUL] = filterCallbackTree[puzzleCoder.MODE.BASE_FOUL_33] = filterCallbackTree[puzzleCoder.MODE.BASE_FOUL_44] = filterCallbackTree[puzzleCoder.MODE.BASE_FOUL_6] = createTreeFoul;
		filterCallbackTree[puzzleCoder.MODE.BASE_BLOCK_CATCH_FOUL] = createTreeBlockCatchFoul;
		filterCallbackTree[puzzleCoder.MODE.BASE_FREE_THREE] = filterCallbackTree[puzzleCoder.MODE.BASE_NOTFREE_THREE] = filterCallbackTree[puzzleCoder.MODE.BASE_FREE_FOUR] = filterCallbackTree[puzzleCoder.MODE.BASE_NOTFREE_FOUR] = createTreeNodes;
		filterCallbackTree[puzzleCoder.MODE.BASE_MAKE_VCF] = filterCallbackTree[puzzleCoder.MODE.BASE_REVIVE_FREE_THREE] = filterCallbackTree[puzzleCoder.MODE.BASE_MAKE_VCF_43] = filterCallbackTree[puzzleCoder.MODE.BASE_MAKE_VCF_44] = createTreeMakeVCF;
		filterCallbackTree[puzzleCoder.MODE.BASE_BLOCK_VCF] = filterCallbackTree[puzzleCoder.MODE.BASE_BLOCK_VCF_4] = createTreeBlockVCFDepth;
		filterCallbackTree[puzzleCoder.MODE.BASE_DOUBLE_VCF] = createTreeDoubleVCF;
		filterCallbackTree[puzzleCoder.MODE.BASE_BLOCK_DOUBLE_VCF] = createTreeBlockVCFDepth;
		filterCallbackTree[puzzleCoder.MODE.BASE_DOUBLE_VCF_43] = createTreeDoubleVCF43;
		
		const filtetlrOptionsCallback = {};
		filtetlrOptionsCallback[puzzleCoder.MODE.VCF] = filtetlrOptionsCallback[puzzleCoder.MODE.VCT3] = filtetlrOptionsCallback[puzzleCoder.MODE.STONES4] = filtetlrOptionsCallback[puzzleCoder.MODE.BASE_DOUBLE_VCF_43] = function(node) { return "W" == getBoardText(node) }
		filtetlrOptionsCallback[puzzleCoder.MODE.VCT] = function(node) { return getBoardText(node) }
		
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_FREE_THREE] = function(node) { return "③" == getBoardText(node) }
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_NOTFREE_THREE] = function(node) { return  "3" == getBoardText(node) }
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_FREE_FOUR] = function(node) { return "④" == getBoardText(node) }
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_NOTFREE_FOUR] = function(node) { return "4" == getBoardText(node) }
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_FOUL] = function(node) { return "❌" == getBoardText(node) }
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_FOUL_33] = function(node, tree) {
			const foulMark = foulInfo(tree, getIdx(node));
			return filtetlrOptionsCallback[puzzleCoder.MODE.BASE_FOUL](node) && !(foulMark & MARKFOUL_5) && (foulMark & MARKFOUL_33);
		}
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_FOUL_44] = function(node, tree) {
			const foulMark = foulInfo(tree, getIdx(node));
			return filtetlrOptionsCallback[puzzleCoder.MODE.BASE_FOUL](node) && !(foulMark & MARKFOUL_5) && (foulMark & MARKFOUL_44);
		}
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_FOUL_6] = function(node, tree) {
			const foulMark = foulInfo(tree, getIdx(node));
			return filtetlrOptionsCallback[puzzleCoder.MODE.BASE_FOUL](node) && !(foulMark & MARKFOUL_5) && (foulMark & MARKFOUL_6);
		}
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_BLOCK_CATCH_FOUL] = function(node) { return "❌" != getBoardText(node)  }
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_REVIVE_FREE_THREE] = function(node, tree) {
			const boardText = getBoardText(node) ; 
			return boardText == "❸";
		}
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_MAKE_VCF] = function(node, tree) { 
			const boardText = getBoardText(node) ; 
			return boardText.indexOf("V") == 0 && boardText != "V3"; 
		}
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_MAKE_VCF_43] = function(node) { 
			const boardText = getBoardText(node) ; 
			return boardText == "V3";
		}
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_MAKE_VCF_44] = function(node, tree) { 
			const boardText = getBoardText(node) ; 
			return boardText == "㊹";
		}
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_BLOCK_VCF] = function(node) { return "L" != getBoardText(node) }
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_BLOCK_VCF_4] = function(node, tree) {
			return filtetlrOptionsCallback[puzzleCoder.MODE.BASE_BLOCK_VCF](node);
		}
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_DOUBLE_VCF] = function(node) { return "W" == getBoardText(node) }
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_BLOCK_DOUBLE_VCF] = function(node, tree) {
			return filtetlrOptionsCallback[puzzleCoder.MODE.BASE_BLOCK_VCF](node);
		}
		filtetlrOptionsCallback[puzzleCoder.MODE.BASE_DOUBLE_VCF_43] = function(node) { return "W" == getBoardText(node) }
		
		async function getOptions(game) {
			if (game.options) {
				return game.options;
			}
			else {
				aiState = aiState | STATE_RENJU_THINKING;
				const tree = await filterCallbackTree[game.puzzle.mode](game.board.getArray(), game.playerSide);
				const options = filterOptions(tree, filtetlrOptionsCallback[game.puzzle.mode]);
				aiState = aiState & ~STATE_RENJU_THINKING;
				return options;
			}
		}
		
		function filterOptions(tree, filter = ()=>true) {
			const options = [];
			const path = tree.init.MS.slice(0, tree.init.MSindex + 1)
			const nodes = tree.getBranchNodes(path);
			nodes.map(node => filter(node, tree) && options.push(getIdx(node)))
			return options;
		}
		
		function tree2Position(tree) {
			const arr = new Array(226).fill(0);
			const path = tree.init.MS.slice(0, tree.init.MSindex + 1);
			path.map((idx, i) => arr[idx] = i % 2 + 1);
			arr[225] = -1;
			return arr;
		}
		
		function pointInfo(tree, idx, color) {
			const arr = tree2Position(tree)
			return testPointFour(idx, color, arr);
		}
		
		function foulInfo(tree, idx) {
			let threeCount = 0;
			let fourCount = 0;
			let info = 0
			const arr = tree2Position(tree);
			for (let direction = 0; direction < 4; direction++) {
				let lineInfo = testLine(idx, direction, 1, arr),
					v = FOUL_MAX_FREE & lineInfo;
				if (v == FIVE) info |= MARKFOUL_5;
				else if (v == SIX) info |= MARKFOUL_6;
				else if (v == LINE_DOUBLE_FOUR) info |= MARKFOUL_44_ONE_LINE;
				else if (v >= FOUR_NOFREE) fourCount++;
				else if (v == THREE_FREE) threeCount++;
			}
			threeCount > 1 && ( info |= MARKFOUL_33 );
			fourCount > 1 && ( info |= MARKFOUL_44_DBL_LINE );
			return info;
		}
		
		function getBoardText(node) {
			return node.boardText || node.branchs[node.branchsInfo + 1 & 1].boardText;
		}
		
		function getIdx(node) {
			return node.branchs[node.branchsInfo + 1 & 1].idx;
		}
		
		//-------------------- createTree ------------------------------------
		
		async function createTreeVCF (arr, color) {
			return engine.createTreeVCF({
				arr,
				color,
				maxVCF: 1,
				maxDepth: 225,
				maxNode: 2560000
			})
		}
		
		async function createTreePointsVCT(arr, color) {
			return engine.createTreePointsVCT({
				color: color,
				arr: arr,
				ftype: FIND_ALL,
				maxVCF: 1,
				maxDepth: 225,
				maxNode: 1000
			})
		}
		
		async function createTreeVCT3(arr, color) {
			return engine.createTreeSimpleWin({
				arr,
				color,
				maxVCF: 1,
				maxDepth: 225,
				maxNode: 2560000,
				maxVCT: 1,
				maxDepthVCT: 4 * 2 - 3,
				maxNodeVCT: 2560000
			})
		}
		
		async function createTreeFoul(arr, color) {
			return engine.createTreeTestFoul({
			 	arr,
			 	color: 1,
			});
		}
		
		async function createTreeNodes(arr, color) {
			return await engine.createTreeNodes({
				arr,
				color
			})
		}
		
		async function createTreeBlockCatchFoul(arr, color) {
			return engine.createTreeBlockCatchFoul({
				arr,
				color: 1,
				maxVCF: 1,
				maxDepth: 225,
				maxNode: 2560000
			});
		}
		
		async function createTreeMakeVCF(arr, color) {
			return engine.createTreeLevelThree({
				arr,
				color,
				ftype: FIND_ALL,
				maxVCF: 1,
				maxDepth: 225,
				maxNode: 2560000
			})
		}
		
		async function createTreeBlockVCF(arr, color) {
			return engine.createTreeBlockVCF({
				arr,
				color,
				maxVCF: 1,
				maxDepth: 225,
				maxNode: 2560000,
				blkDepth: 1
			});
		}
		
		async function createTreeDoubleVCF(arr, color) {
			return engine.createTreeDoubleVCF({
				arr,
				color,
				maxVCF: 1,
				maxDepth: 225,
				maxNode: 2560000
			});
		}
		
		async function createTreeDoubleVCF43(arr, color) {
			return engine.createTreeNumberWin({
				arr,
				color,
				maxVCF: 1,
				maxDepth: 4 * 2 - 3,
				maxNode: 2560000,
				nMaxDepth: 180
			});
		}
		
		async function createTreeBlockVCFDepth(arr, color) {
			return engine.createTreeBlockVCF({
				arr,
				color,
				maxVCF: 1,
				maxDepth: 225,
				maxNode: 2560000,
				blkDepth: 2
			});
		}
		
		//--------------------------------------------------------------------------
		
		async function checkWin(game, idx) {
			engine.board = undefined;
			if ((game.puzzle.mode & puzzleCoder.MODE.BASE) == puzzleCoder.MODE.BASE) {
				//checkWinBASE(game);
			}
			else {
				const side = game.board.getArray()[idx];
				const sw = side == game.playerSide ? 1 : -1;
				let state = getGameOver(game.board.getArray(), side, idx);
				state == 0 && game.board.getArray().filter(v => v == 0).length == 0 && (state = -3 * sw)
				state = state * sw;
				const GAME_STATE = {"0": game.STATE.PLAYING, "1": game.STATE.WIN, "-1": game.STATE.LOST, "-2": game.STATE.LOST, "-5": game.STATE.LOST}
				const COMMENT = {"1": "你赢了", "-1": "你输了", "-2": "你禁手犯规，输了"}
				const WARN = {"1": "你赢了", "-1": "你输了", "-2": "禁手犯规"}
				state && processOutput({ state: GAME_STATE[state], sideLabel: "棋局结束", comment: COMMENT[state]});
			}
		}
		
		async function checkWinBASE(game) {
			engine.board = undefined;
			aiState = aiState | STATE_RENJU_THINKING;
			processOutput({ sideLabel: "计算中..." })
			const options = game.options  = game.options || await getOptions(game);
			const selectPoints = game.board.P.map((p, idx) => {
				if (p.type == TYPE_MARK && p.text == game.puzzle.mark) return idx;
				else return undefined;
			}).filter(v => v!==undefined);
			const errCount = selectPoints.map(v => options.indexOf(v) + 1).filter(v => v == 0).length;
			const lastCount = options.length - selectPoints.length + errCount;
			const isRight = selectPoints.length == options.length &&  0 == options.map(idx => selectPoints.indexOf(idx)).filter(index => index < 0).length;
			if (isRight) {
				const comment = "回答正确";
				processOutput({ state: game.STATE.WIN, sideLabel: "回答正确", comment})
			}
			else {
				const errorPoints = selectPoints.filter(idx => options.indexOf(idx) == -1);
				const comment = `解题失败\n${errorPoints.length && errorPoints.length + "处错误\n" || ""}${lastCount && lastCount + "处漏选\n" || ""}`;
				processOutput({ state: game.STATE.LOST, sideLabel: "解题失败", comment, errorPoints: errorPoints})
			}
			aiState = aiState & ~STATE_RENJU_THINKING;
		}

		async function checkMove(game, idx) {
			engine.board = undefined;
			if (game.board.getArray()[idx] != game.playerSide) return;
			const state = await (filterCheckMove[game.puzzle.mode] || function() {})(game, idx)
			if (state < 0) {
				const warn = CHECKMOVE_OUTPUT[state].warn;
				const comment = "失败原因：\n" + CHECKMOVE_OUTPUT[state].comment;
				processOutput({ state: game.STATE.LOST, sideLabel: "解题失败", comment });
			}
		}
		
		/**
		 *  测试残局是否有误, 无误返回 true, 有误返回 false,
		 * @arr		game position 
		 * @side	 playSide
		 * @rule	 rapfi rule
		 * @mode	 puzzle mode
		 * @board
		 */
		async function checkPuzzle(arr, side, rule, mode, board) {
			aiState = aiState | STATE_RENJU_THINKING;
			try{
			console.info(`checkPuzzle\narr: ${arr}\nside: ${side}\nrule: ${rule}\nmode: ${mode}`)
			engine.gameRules = RENJU_RULE[rule];
			const over = getGameOver(arr, side);
			if (over) return false;
				
			if ("function" !== typeof filterCallbackTree[mode]) {
				console.info(`typeof filterCallbackTree[mode]: ${typeof filterCallbackTree[mode]}`)
				return true;
			}
			
			engine.board = board;
			const tree = await filterCallbackTree[mode](arr, side);
			const options = filterOptions(tree, filtetlrOptionsCallback[mode]);
			return !!options.length;
			}catch(e){console.error(e.stack)}
			aiState = aiState & ~STATE_RENJU_THINKING;
		}
		
		/**
		 * 
 		*/
		async function autoSetMode(puzzle, board) {
			for (let i = 0; i < 32; i+=8) {
				const mode = (puzzle.modes >>> i) & 0xFF;
				if (mode == 0) break;
				const checked = await checkPuzzle(puzzle.arr, puzzle.side, puzzle.rule, mode, board);
				if (checked) {
					puzzle.mode = mode;
					return true;
				}
			}
			puzzle.mode = puzzleCoder.MODE.FREE;
			return false;
		}
		
		/**
		 * 传入 Puzzles 对象，根据参数自动计算后，转成 puzzleCoder 可用的 Puzzles 对象。返回一个log string
		 * @Puzzles		包含 arr， modes 对象
		 * @board		CheckBoard 对象，输出计算结果
		 * @callback	
 		*/
		async function checkPuzzles(puzzles, board, callback = () => {}) {
			let logStr = "";
			for(let i = 0; i < puzzles.length; i++) {
				const puzzle = puzzles[i];
				board.setSize(puzzle.size);
				board.unpackArray(puzzle.arr);
				const rt = await autoSetMode(puzzle, board);
				const codeArr = board.getCode().split(/{|}/);
				if (!puzzle.stones && !puzzle.blackStones && !puzzle.whiteStones) {
					puzzle.stones = codeArr[0].split("\n").join("");
					puzzle.blackStones =  codeArr[1].split("\n").join("");
					puzzle.whiteStones = codeArr[3].split("\n").join("");
				}
				logStr += `第${i + 1}题测试：${rt ? "通过" : "失败"}\n  解题模式: ${puzzleCoder.MODE_TITLE[puzzle.mode]}\n  玩家: ${[,"黑棋","白棋"][puzzle.side]}\n  规则: ${puzzle.rule==2 ? "有禁" : "无禁"}\n  棋盘: ${puzzle.size}路\n`;
				try{callback(i/puzzles.length)}catch(e){console.error(e.stack)}
			}
			console.log(logStr)
			return logStr;
		}
		
		function getPositionString(game, side) {
			let cmd = "";
			const bStones = [];
			const wStones = [];
			const arr = [];
			game.board.P.map((p, i) => arr[i] = p.type == TYPE_BLACK ? 1 : p.type == TYPE_WHITE ? 2 : 0);
			for (let x = 0; x < game.board.size; x++) {
				for (let y = 0; y < game.board.size; y++) {
					const idx = y * 15 + x;
					if (arr[idx] == 1) bStones.push(`${x},${y},${side}`)
					else if (arr[idx] == 2) wStones.push(`${x},${y},${3 - side}`)
				}
			}
			game.board.MS.map((idx, i) => {
				const x = idx % 15;
				const y = ~~(idx / 15);
				game.board.firstColor != "black" && i++
				if (i % 2 == 0) bStones.push(`${x},${y},${side}`)
				else wStones.push(`${x},${y},${3 - side}`)
			})
			while (bStones.length - wStones.length < side - 1) {
				bStones.push(`-1,-1,${side}`)
			}
			while (bStones.length - wStones.length > side - 1) {
				wStones.push(`-1,-1,${3 - side}`)
			}
			bStones.map((v, i) => {
				cmd += v + " " + (wStones[i] ? wStones[i] + " " : "")
			})
			return cmd;
		}

		function gomocalcThink(game, side, min = game.strength || 30, max = 150) {
			aiState = aiState | STATE_GOMOCALC_THINKING;
			gomocalc.sendCommand(`RELOADCONFIG config-220723.toml`);
			gomocalc.sendCommand(`INFO HASH_SIZE 262144`);
			gomocalc.sendCommand(`INFO RULE ${game.puzzle.rule}`);
			gomocalc.sendCommand(`INFO THREAD_NUM 1`);
			gomocalc.sendCommand(`INFO CAUTION_FACTOR 3`);
			gomocalc.sendCommand(`INFO STRENGTH ${strength(min, max)}`);
			gomocalc.sendCommand(`INFO TIMEOUT_TURN 7000`);
			gomocalc.sendCommand(`INFO TIMEOUT_MATCH 180000`);
			gomocalc.sendCommand(`INFO MAX_DEPTH 100`);
			gomocalc.sendCommand(`INFO MAX_NODE 0`);
			gomocalc.sendCommand(`INFO SHOW_DETAIL 3`);
			gomocalc.sendCommand(`INFO PONDERING 0`);
			gomocalc.sendCommand(`INFO SWAPABLE 1`);
			gomocalc.sendCommand(`START ${game.puzzle.size}`);
			gomocalc.sendCommand(`INFO TIME_LEFT 180000`);
			gomocalc.sendCommand(`YXBOARD ${getPositionString(game, side)} DONE`);
			gomocalc.sendCommand(`YXNBEST 1`);
		}

		function think(game) {
			if (aiState == STATE_AI_READY) {
				engine.board = undefined;
				processOutput({ sideLabel: "思考中..." })
				engine.gameRules = RENJU_RULE[game.puzzle.rule];
				if ((game.puzzle.mode & puzzleCoder.MODE.BASE) == puzzleCoder.MODE.BASE) {
					filterThink[puzzleCoder.MODE.BASE](game);
				}
				else {
					(filterThink[game.puzzle.mode] || function() {})(game);
				}
			}
		}

		function aiHelp(game) {
			if (aiState == STATE_AI_READY) {
				engine.board = game.board;
				processOutput({ sideLabel: "思考中..." })
				engine.gameRules = RENJU_RULE[game.puzzle.rule];
				if ((game.puzzle.mode & puzzleCoder.MODE.BASE) == puzzleCoder.MODE.BASE) {
					(filterAIHelp[puzzleCoder.MODE.BASE] || function() {})(game);
				}
				else {
					(filterAIHelp[game.puzzle.mode] || function() {})(game);
				}
			}
		}

		async function stopThinking(game) {
			if (aiState & STATE_GOMOCALC_THINKING) {
				aiState = aiState & ~(STATE_GOMOCALC_THINKING | STATE_GOMOCALC_READY);
				gomocalc.stopThinking();
			}
			if (aiState & STATE_RENJU_THINKING) {
				aiState = aiState & ~(STATE_RENJU_THINKING | STATE_RENJU_READY);
				await engine.cancel();
				aiState = aiState | STATE_RENJU_READY;
			}
			processOutput({ sideLabel: "stopthinking" })
			await waitValue({ get v() { return aiState } }, "v", STATE_AI_READY, 50);
			processOutput({ sideLabel: "ready" })
		}

		return {
			think,
			aiHelp,
			stopThinking,
			checkWin,
			checkWinBASE,
			checkMove,
			checkPuzzles,
			set processOutput(output) { processOutput = output }
		}
	} catch (e) { console.error(e.stack) }
})()