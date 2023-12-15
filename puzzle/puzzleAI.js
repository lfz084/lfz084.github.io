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
		gomocalc.init(gomocalcOutput);
		engine.ready().then(() => aiState = aiState | STATE_RENJU_READY)
		//setInterval(() => processOutput({sideLabel: aiState})}, 1000)
		function idx2Pos(idx = -1) {
			if (idx < 0 || idx > 224) return [-1, -1]
			else return [idx % 15, ~~(idx / 15)]
		}

		function strength(min, max) {
			return Math.floor(min) + Math.floor(Math.random() * (max - min))
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

		const filterCheckMove = {};
		filterCheckMove[puzzleCoder.MODE.VCF] = async function(game, idx) {
			const level = getLevel(game.board.getArray(), game.playerSide) & 0xff;
			return level < LEVEL_NOFREEFOUR ? -5 : 0;
		}
		filterCheckMove[puzzleCoder.MODE.VCT] = async function(game, idx) {
			const level = (await getLevelB(game.board.getArray(), game.playerSide, 1, 180, 1000000)) & 0xff;
			return level < LEVEL_FREETHREE ? -5 : 0;
		}
		filterCheckMove[puzzleCoder.MODE.VCT3] = async function(game, idx) {
			const position = game.board.getArray();
			const level = (await getLevelB(position, game.playerSide, 1, 180, 1000000)) & 0xff;
			if (level < LEVEL_FREETHREE) return -5;

			if (game.residueStones > 1 || game.residueStones == 1 && level == LEVEL_FREETHREE) {
				position[game.board.MS[game.board.MSindex]] = 0;
				LEVEL_NOFREEFOUR > (getLevel(position, game.aiSide) & 0xff) && game.residueStones--
			}
			return game.residueStones == 0 ? -5 : 0;
		}
		filterCheckMove[puzzleCoder.MODE.FREE] = async function(game, idx) {

		}
		filterCheckMove[puzzleCoder.MODE.STONES3] = filterCheckMove[puzzleCoder.MODE.STONES4] = filterCheckMove[puzzleCoder.MODE.STONES5] = async function(game) {
			--game.residueStones;
			return game.residueStones == 0 ? -5 : 0;
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
				maxDepth: 180,
				maxNode: 1000000
			}
			const levelInfo = getLevel(param.arr, param.color);
			if(levelInfo >= LEVEL_NOFREEFOUR) {
				processOutput({ pos: idx2Pos(levelInfo >> 8 & 0xFF) })
			}
			else {
				engine.board = game.board;
				const vcfMoves = (await engine.findVCF(param)).winMoves[0];
				processOutput({ pos: idx2Pos(vcfMoves[0] || -1) })
			}
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
				maxDepth: 180,
				maxNode: 1000000,
				maxVCT: 1,
				maxDepthVCT: (game.residueStones + 1) * 2 - 3,
				maxNodeVCT: 1000000
			}
			engine.board = game.board;
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
				maxNode: 1000000,
				nMaxDepth: 180
			}
			engine.board = game.board;
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
		
		//--------------------------------------------------------------------------
		
		const filterCallbackTree = {};
		filterCallbackTree[puzzleCoder.MODE.BASE_FOUL] = filterCallbackTree[puzzleCoder.MODE.BASE_FOUL_33] = filterCallbackTree[puzzleCoder.MODE.BASE_FOUL_44] = filterCallbackTree[puzzleCoder.MODE.BASE_FOUL_6] = getFoulPoints;
		filterCallbackTree[puzzleCoder.MODE.BASE_CATCH_FOUL] = getBlockCatchFoulPoints;
		filterCallbackTree[puzzleCoder.MODE.BASE_FREE_THREE] = filterCallbackTree[puzzleCoder.MODE.BASE_NOTFREE_THREE] = filterCallbackTree[puzzleCoder.MODE.BASE_FREE_FOUR] = filterCallbackTree[puzzleCoder.MODE.BASE_NOTFREE_FOUR] = getPoints;
		filterCallbackTree[puzzleCoder.MODE.BASE_REVIVE_FREE_THREE] = getReviveFreeThreePoints;
		filterCallbackTree[puzzleCoder.MODE.BASE_MAKE_VCF] = filterCallbackTree[puzzleCoder.MODE.BASE_MAKE_VCF_43] = filterCallbackTree[puzzleCoder.MODE.BASE_MAKE_VCF_44] = getMakeVCFPoints;
		filterCallbackTree[puzzleCoder.MODE.BASE_BLOCK_VCF] = filterCallbackTree[puzzleCoder.MODE.BASE_BLOCK_VCF_4] = getBlockVCFPoints;
		filterCallbackTree[puzzleCoder.MODE.BASE_DOUBLE_VCF] = getDoubleVCFPoints;
		filterCallbackTree[puzzleCoder.MODE.BASE_BLOCK_DOUBLE_VCF] = getBlockDoubleVCFPoints;
		
		const filtetlrCallbackOptions = {};
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_FREE_THREE] = function(node) { return "③" == getBoardText(node) }
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_NOTFREE_THREE] = function(node) { return  "3" == getBoardText(node) }
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_FREE_FOUR] = function(node) { return "④" == getBoardText(node) }
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_NOTFREE_FOUR] = function(node) { return "4" == getBoardText(node) }
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_FOUL] = function(node) { return "❌" == getBoardText(node) }
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_FOUL_33] = function(node, tree) {
			const foulMark = foulInfo(tree, getIdx(node));
			return filtetlrCallbackOptions[puzzleCoder.MODE.BASE_FOUL](node) && !(foulMark & MARKFOUL_5) && (foulMark & MARKFOUL_33);
		}
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_FOUL_44] = function(node, tree) {
			const foulMark = foulInfo(tree, getIdx(node));
			return filtetlrCallbackOptions[puzzleCoder.MODE.BASE_FOUL](node) && !(foulMark & MARKFOUL_5) && (foulMark & MARKFOUL_44);
		}
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_FOUL_6] = function(node, tree) {
			const foulMark = foulInfo(tree, getIdx(node));
			return filtetlrCallbackOptions[puzzleCoder.MODE.BASE_FOUL](node) && !(foulMark & MARKFOUL_5) && (foulMark & MARKFOUL_6);
		}
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_CATCH_FOUL] = function(node) { return "❌" != getBoardText(node)  }
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_REVIVE_FREE_THREE] = function(node, tree) {
			const boardText = getBoardText(node) ; 
			const color = (node.branchsInfo + 1 & 1) + 1;
			const infoArr = new Array(226);
			testThree(tree2Position(tree), color, infoArr)
			return boardText == "V" && ( infoArr[getIdx(node)] & FOUL_MAX_FREE ) != THREE_FREE;
		}
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_MAKE_VCF] = function(node) { 
			const boardText = getBoardText(node) ; 
			const depth = parseInt(boardText.slice(1));
			let vcfDepth = 5;
			return boardText.indexOf("V") == 0 && depth >= vcfDepth; 
		}
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_MAKE_VCF_43] = function(node) { 
			const boardText = getBoardText(node) ; 
			return boardText == "V3" 
		}
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_MAKE_VCF_44] = function(node, tree) { 
			const boardText = getBoardText(node) ; 
			const color = (node.branchsInfo + 1 & 1) + 1;
			const infoArr = new Array(226);
			testThree(tree2Position(tree), color, infoArr)
			return boardText == "V" && ( infoArr[getIdx(node)] & FOUL_MAX_FREE ) == THREE_NOFREE;
		}
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_BLOCK_VCF] = function(node) { return "L" != getBoardText(node) }
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_BLOCK_VCF_4] = function(node, tree) {
			return filtetlrCallbackOptions[puzzleCoder.MODE.BASE_BLOCK_VCF](node);
		}
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_DOUBLE_VCF] = function(node) { return "W" == getBoardText(node) }
		filtetlrCallbackOptions[puzzleCoder.MODE.BASE_BLOCK_DOUBLE_VCF] = function(node, tree) {
			return filtetlrCallbackOptions[puzzleCoder.MODE.BASE_BLOCK_VCF](node);
		}
		
		/*
		BASE_FREE_THREE: { value: 6 << 5 | 2, name: "点点题模式" },
		BASE_REVIVE_FREE_THREE: { value: 6 << 5 | 3, name: "点点题模式" },
		BASE_NOTFREE_THREE: { value: 6 << 5 | 4, name: "点点题模式" },
		BASE_FREE_FOUR: { value: 6 << 5 | 5, name: "点点题模式" },
		BASE_NOTFREE_FOUR: { value: 6 << 5 | 6, name: "点点题模式" },
		
		BASE_FOUL: { value: 6 << 5 | 7, name: "点点题模式" },
		BASE_FOUL_33: { value: 6 << 5 | 8, name: "点点题模式" },
		BASE_FOUL_44: { value: 6 << 5 | 9, name: "点点题模式" },
		BASE_FOUL_6: { value: 6 << 5 | 10, name: "点点题模式" },
		BASE_CATCH_FOUL: { value: 6 << 5 | 11, name: "点点题模式" },
		
		BASE_MAKE_VCF: { value: 6 << 5 | 12, name: "点点题模式" },
		BASE_MAKE_VCF_43: { value: 6 << 5 | 13, name: "点点题模式" },
		BASE_MAKE_VCF_44: { value: 6 << 5 | 14, name: "点点题模式" },
		BASE_BLOCK_VCF: { value: 6 << 5 | 15, name: "点点题模式" },
		BASE_BLOCK_VCF_4: { value: 6 << 5 | 16, name: "点点题模式" },
		
		BASE_DOUBLE_VCF: { value: 6 << 5 | 17, name: "点点题模式" },
		BASE_BLOCK_DOUBLE_VCF: { value: 6 << 5 | 18, name: "点点题模式" },
		*/
		
		async function getOptions(game) {
			if (game.options) return;
			aiState = aiState | STATE_RENJU_THINKING;
			const tree = await filterCallbackTree[game.puzzle.mode](game);
			game.options = await filterOption(tree, filtetlrCallbackOptions[game.puzzle.mode]);
			console.log(`game.options: ${game.options}`)
			aiState = aiState & ~STATE_RENJU_THINKING;
			return game.options;
		}
		
		function filterOption(tree, filter = ()=>true) {
			try{
			const options = [];
			const path = tree.init.MS.slice(0, tree.init.MSindex + 1)
			const nodes = tree.getBranchNodes(path);
			console.log(`filter: ${filter.toString()}\nnodes: ${nodes}`)
			nodes.map(node => filter(node, tree) && options.push(getIdx(node)))
			return options;
			}catch(e){alert(e.stack)}
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
			let out = `idx: ${idx}\n`
			let info = 0
			const arr = tree2Position(tree);
			console.log(testLine.toString())
			console.log(arr.map((v,i) => v>0 && `[${v},${i}]`).filter(v=>v).toString())
			for (let direction = 0; direction < 4; direction++) {
				let lineInfo = testLine(idx, direction, 1, arr),
					v = FOUL_MAX_FREE & lineInfo;
				if (v == FIVE) info |= MARKFOUL_5;
				else if (v == SIX) info |= MARKFOUL_6;
				else if (v == LINE_DOUBLE_FOUR) info |= MARKFOUL_44_ONE_LINE;
				else if (v >= FOUR_NOFREE) fourCount++;
				else if (v == THREE_FREE) threeCount++;
				out += `${("0000000000000000" + lineInfo.toString(2)).slice(-16)}\n`
			}
			out += `fourCount: ${fourCount}\nthreeCount: ${threeCount}`
			console.log(out);
			threeCount > 1 && ( info |= MARKFOUL_33 );
			fourCount > 1 && ( info |= MARKFOUL_44_DBL_LINE );
			console.log(`info: ${("00000000" + info.toString(2)).slice(-8)}`)
			return info;
		}
		
		function getBoardText(node) {
			return node.boardText || node.branchs[node.branchsInfo + 1 & 1].boardText;
		}
		
		function getIdx(node) {
			return node.branchs[node.branchsInfo + 1 & 1].idx;
		}
		
		async function getFoulPoints(game) {
			return engine.createTreeTestFoul({
			 	arr: game.board.getArray(),
			 	color: 1,
			});
		}
		
		async function getPoints(game) {
			return await engine.createTreeNodes({
				arr: game.board.getArray(),
				color: game.playerSide
			})
		}
		
		async function getReviveFreeThreePoints(game) {
			return engine.createTreeLevelThree({
				arr: game.board.getArray(),
				color: game.playerSide,
				ftype: FIND_ALL,
				maxVCF: 1,
				maxDepth: 1,
				maxNode: 1000000
			})
		}
		
		async function getBlockCatchFoulPoints(game) {
			return engine.createTreeBlockCatchFoul({
				arr: game.board.getArray(),
				color: 1,
				maxVCF: 1,
				maxDepth: 180,
				maxNode: 1000000
			});
		}
		
		async function getMakeVCFPoints(game) {
			return engine.createTreeLevelThree({
				arr: game.board.getArray(),
				color: game.playerSide,
				ftype: FIND_ALL,
				maxVCF: 1,
				maxDepth: 180,
				maxNode: 1000000
			})
		}
		
		async function getBlockVCFPoints(game) {
			return engine.createTreeBlockVCF({
				arr: game.board.getArray(),
				color: game.playerSide,
				maxVCF: 1,
				maxDepth: 180,
				maxNode: 1000000,
				blkDepth: 2
			});
		}
		
		async function getDoubleVCFPoints(game) {
			return engine.createTreeDoubleVCF({
				arr: game.board.getArray(),
				color: game.playerSide,
				maxVCF: 1,
				maxDepth: 180,
				maxNode: 1000000
			});
		}
		
		async function getBlockDoubleVCFPoints(game) {
			return engine.createTreeBlockVCF({
				arr: game.board.getArray(),
				color: game.playerSide,
				maxVCF: 1,
				maxDepth: 180,
				maxNode: 1000000,
				blkDepth: 2
			});
		}
		
		//--------------------------------------------------------------------------
		
		async function checkWin(game, idx) {
			if ((game.puzzle.mode & puzzleCoder.MODE.BASE) == puzzleCoder.MODE.BASE) {
				return checkWinBASE(game);
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
				state && processOutput({ state: GAME_STATE[state], sideLabel: "棋局结束", comment: COMMENT[state], warn: WARN[state]});
			}
		}
		
		async function checkWinBASE(game) {
			try{
			aiState = aiState | STATE_RENJU_THINKING;
			processOutput({ sideLabel: "计算中..." })
			const options = game.options || await getOptions(game);
			const selectPoints = game.board.P.map((p, idx) => {
				if (p.type == TYPE_MARK && p.text == game.puzzle.mark) return idx;
				else return undefined;
			}).filter(v => v!==undefined);
			const errCount = selectPoints.map(v => options.indexOf(v) + 1).filter(v => v == 0).length;
			const lastCount = options.length - selectPoints.length + errCount;
			if (options.length == selectPoints.length && errCount == 0 && lastCount == 0) {
				processOutput({ state: game.STATE.WIN, sideLabel: "答题结束", warn: "回答正确"})
			}
			else if(errCount) {
				processOutput({ state: game.STATE.PLAYING, sideLabel: `错${errCount}` })
			}
			else {
				processOutput({ sideLabel: "继续答题" })
			}
			aiState = aiState & ~STATE_RENJU_THINKING;
			}catch(e){alert(e.stack)}
		}

		async function checkMove(game, idx) {
			if (game.board.getArray()[idx] != game.playerSide) return;
			const state = await (filterCheckMove[game.puzzle.mode] || function() {})(game, idx)
			const GAME_STATE = {"0": game.STATE.PLAYING, "1": game.STATE.WIN, "-1": game.STATE.LOST, "-2": game.STATE.LOST, "-5": game.STATE.LOST}
			const COMMENT = {"-5": "不符合解题规则"}
			const WARN = {"-5": "不合规则"}
			state && processOutput({ state: GAME_STATE[state], sideLabel: "棋局结束", comment: COMMENT[state], warn: WARN[state]});
		}

		function gomocalcThink(game, side, min = 30, max = 100) {
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
				if ((game.puzzle.mode & puzzleCoder.MODE.BASE) == puzzleCoder.MODE.BASE) {
					
				}
				else {
					processOutput({ sideLabel: "思考中..." })
					engine.gameRules = RENJU_RULE[game.puzzle.rule];
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

		return {
			think,
			aiHelp,
			stopThinking,
			checkWin,
			checkMove,
			set processOutput(output) { processOutput = output }
		}
	} catch (e) { console.error(e.stack) }
})()