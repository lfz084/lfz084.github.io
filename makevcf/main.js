(() => {
	"use strict";
	const d = document;
	const dw = d.documentElement.clientWidth;
	const dh = d.documentElement.clientHeight;

	function $(id) { return document.getElementById(id) }

	function log(str) { $("log") && ($("log").innerHTML = str) }

	function log1(str) { $("log1") && ($("log1").innerText = str) }

	async function inputText(initStr = "") {
		return (await msg({
			text: initStr,
			type: "input",
			butNum: 1,
			lineNum: 10
		})).inputStr
	}

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
				makeVCF.resetMakeVCF(arr, numStones - (numStones >>> 1), numStones >>> 1, log);
				makeVCF.continueMakeVCF(arr => cBoard.unpackArray(arr));
			}
        },
		{
			type: "button",
			text: "搜索",
			touchend: async function() {
				makeVCF.continueMakeVCF(arr => cBoard.unpackArray(arr));
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
			text: "暂停",
			touchend: async function() {
				makeVCF.stop();
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
				const hash = `${miniBoard.getCodeURL()}`;
				const url = window.location.href.split("makevcf.html")[0] + "renju.html" + `#${hash}`;
				if ((/^%%%/).test(hash)) return;
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
				const input = prompt(`输入最短手数,最长手数\n例：3,30`).split(/[\,|，]/);
				input[0] = parseInt(input[0]);
				input[1] = parseInt(input[1]);
				let min = input[0] === +input[0] ? input[0] : 0;
				let max = input[1] === +input[1] ? input[1] : 225;
				if (min > max) {
					const temp = min;
					min = max;
					max = temp;
				}
				makeVCF.filter(min, max);
			}
        },
		{
			type: "button",
			text: "导出JSON",
			touchend: async function() {
				try {
					const games = makeVCF.games();
					const gamesL = games.slice(0);
					for (let idx = 0; idx < games.length; idx++) {
						games[idx] = renjuEditor.gameToArr2D(games[idx]);
						miniBoard.unpackArray(games[idx]);
						log1(`读取... ${idx+1} / ${games.length}`);
						await makeVCF.wait(0);
					}
					if (games.length == 0) return;
					const json = await renjuEditor.toKaiBaoJSON(games, log1);
					const gamesR = renjuEditor.json2Games(json);
					renjuEditor.downloadKaiBaoJSON(json, "vcf");
				} catch (e) { alert(e.stack) }
			}
        },
		{
			type: "button",
			text: "测试题集",
			touchend: async function() {
				const games = makeVCF.games();
				await testGames(games);
			}
        },
		{
			type: "file",
			text: "导入JSON",
			change: async function() {
				try {
					const games = await renjuEditor.openFile(this.files[0], this.value.split("/").pop(), log);
					setTimeout(() => this.value = "", 0);
					const result = await testGames(games);
					makeVCF.pushGames(result.log, arr => miniBoard.unpackArray(arr));
				} catch (e) { alert(e.stack) }
			}
        }

    ];


	buttonSettings.splice(0, 0, createLogDiv(), null, null, null);
	buttonSettings.splice(4, 0, createLogDiv1(), null);
	buttonSettings.splice(8, 0, null, null);
	buttonSettings.splice(12, 0, null, null);
	buttonSettings.splice(16, 0, null, null);
	buttonSettings.splice(20, 0, null, null);
	buttonSettings.splice(24, 0, null, null);
	
	function createCmdDiv() {
		try{
		const cDiv = mainUI.createCmdDiv();
		const buttons = mainUI.createButtons(buttonSettings);
		mainUI.addButtons(buttons, cDiv, 1);
		return cDiv;
		}catch(e){alert(e.stack)}
	}

	function createLogDiv() {
		return mainUI.newLabel({
			id: "log",
			type: "div",
			width: mainUI.buttonWidth * 4.99,
			height: mainUI.buttonHeight,
			style: {
				fontSize: `${mainUI.buttonHeight / 1.8}px`,
				textAlign: "center",
				lineHeight: `${mainUI.buttonHeight}px`,
				backgroundColor: "white"
			}
		})
	}

	function createLogDiv1() {
		const lineHeight = mainUI.buttonHeight;
		return mainUI.newLabel({
			id: "log1",
			type: "div",
			width: mainUI.buttonWidth * 2.33,
			height: mainUI.buttonHeight,
			style: {
				fontSize: `${mainUI.buttonHeight / 2}px`,
				textAlign: "center",
				lineHeight: `${mainUI.buttonHeight}px`,
				backgroundColor: "white",
			},
			click: () => {
				const info = makeVCF.getStateInfo();
				const filterArr = info.filterArr;
				if (filterArr.length) {
					const idx = parseInt(prompt(`输入要跳转的题号（1 - ${filterArr.length})`));
					if (idx === +idx && 0 < idx && idx <= filterArr.length) {
						const vcfGame = makeVCF.getVCF(idx-1);
						miniBoard.unpackArray(vcfGame.array);
						miniBoard.printMoves(vcfGame.winMove, vcfGame.firstColor);
					}
				}
			}
		})
	}

	const cBoard = mainUI.createCBoard();
	const miniBoard = mainUI.createMiniBoard();
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
		bindEvent.setBodyDiv(mainUI.bodyDiv, mainUI.bodyScale, mainUI.upDiv);
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

	async function testGames(games) {
		let result = await makeVCF.testGames(games, (arr, i) => {
			miniBoard.unpackArray(arr);
			log1(`${i}/${games.length}`)
		});
		const log = result.log.map(v => {
			const idx = v.idx;
			const count = v.winMoves.length;
			return `第${idx + 1}题，找到${count}个VCF,最短${v.winMoves[0] && v.winMoves[0].length || "[ ]"}手`;
		}).join("\n");
		const error = result.error.map(v => {
			const idx = v.idx;
			const count = v.winMoves.length;
			return `第${idx + 1}题，找到${count}个VCF,最短${v.winMoves[0] && v.winMoves[0].length || "[ ]"}手`;
		}).join("\n");
		const warn = result.warn.map(v => {
			const idx = v.idx;
			const count = v.winMoves.length;
			return `第${idx + 1}题，找到${count}个VCF,最短${v.winMoves[0] && v.winMoves[0].length || "[ ]"}手`;
		}).join("\n");
		inputText(`错误: ${result.error.length} 个\n${error || "没有发现错误"}\n提示: ${result.warn.length} 个\n${warn || "没有发现问题"}\n测试通过: ${result.log.length} 个\n${log || "没有记录"}`);
		return result;
	}

	function cmpGame(gameL, gameR) {
		for (let i = 0; i < 226; i++) {
			if (gameL[i] != gameR[i]) {
				return false;
			}
		}
		return true;
	}

	function cmpGames(gamesL, gamesR) {
		if (gamesL.length != gamesR.length) return false;
		for (let i = 0; i < gamesL.length; i++) {
			if (!cmpGame(gamesL[i], gamesR[i])) return false;
		}
		return true;
	}
	
	//------------------- load -------------------------
	
	miniBoard.move(undefined, undefined, undefined, undefined, cmdDiv.viewElem);
	//createLogDiv().move(0, (dw > dh ? 1 : -1) * mainUI.buttonHeight * 1.1, undefined, undefined, cmdDiv.viewElem);
	mainUI.loadTheme();
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
})()