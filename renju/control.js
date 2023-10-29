if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["control"] = "v2110.07";
window.control = (() => {
	try {
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

		const d = document;
		const dw = d.documentElement.clientWidth;
		const dh = d.documentElement.clientHeight;

		const menuLeft = mainUI.menuLeft;
		const menuWidth = mainUI.menuWidth;
		const menuFontSize = mainUI.menuFontSize;
		const cWidth = mainUI.cmdWidth;


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
			renjuCmdSettings = { positions: [], defaultButtons: [], ButtonsIdx: [], idx: 0 },
			imgCmdSettings = { positions: [], defaultButtons: [], ButtonsIdx: [], idx: 0 },
			onLoadCmdSettings = function() {},
			scaleCBoard = function() {},
			setShowNum = function() {},
			getShowNum = function() {},
			editButtons = function() {};

			function markRadioChecked() {
				if (this != cLABC) {
					cBoard.drawLineEnd();
				}
			}
			
			function autoblackwhiteRadioChecked() {
				if (!cLockImg.checked) {
					lockImg();
					cLockImg.setChecked(1);
				}
			}









		const CALCULATE = true;
		const NO_CALCULATE_MENU = [0, "4月23日，五子茶馆解题大赛", 1, "比赛结束前，暂时关闭计算功能"];

		window.cBoard = mainUI.createCBoard();
		const miniBoard = mainUI.createMiniBoard();
		miniBoard.viewBox.addEventListener("touchstart", () => event.preventDefault())

		const busyCmdDiv = mainUI.createCmdDiv();
		const renjuCmdDiv = mainUI.createCmdDiv();
		const imgCmdDiv = mainUI.createCmdDiv();

		busyCmdDiv.hide();
		//renjuCmdDiv.hide();
		imgCmdDiv.hide();


		//---------------------- renjuCmdDiv ----------------------

		const busyButtonSettings = [
		null, null, null, null,
		null, mainUI.newTimer({ varName: "lbTimer" }),
			{
				varName: "cCancelFind",
				type: "button",
				text: `${EMOJI_STOP} 停止`,
				touchend: function(but) {
					cCancelFind.setText(`停止中...`);
					engine.cancel();
					RenjuLib.cancal();
				}
		}];
		mainUI.addButtons(mainUI.createButtons(busyButtonSettings), busyCmdDiv, 0);

		const renjuButtonSettings = [
			{
				varName: "cShareWhite",
				type: "button",
				text: "分享图片",
				touchend: function() {
					if (isBusy()) return;
					share(cBoard);
				}
			},
			{
				varName: "cShare",
				type: "button",
				text: "分享棋局",
				touchend: function() {
					if (isBusy()) return;
					let hash = `${cBoard.getCodeURL()}`,
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
				}
			},
			{
				varName: "cShownumTop",
				type: "button",
				text: "设置",
				touchend: function() {
					if (isBusy()) return;
					cShownum.defaultontouchend();
				}
			},
			{
				varName: "cHelp",
				type: "button",
				text: "帮助",
				touchend: function() {
					if (isBusy()) return;
					window.open("./help/renjuhelp/renjuhelp.html", "helpWindow");
				}
			},
			{
				varName: "cStart",
				type: "button",
				text: "‖<<",
				touchend: function() {
					if (isBusy()) return;
					toStart(getShowNum());
				}
	        },
			{
				varName: "cPrevious",
				type: "button",
				text: "<<",
				touchend: function() {
					if (isBusy()) return;
					toPrevious(getShowNum());
				}
	        },
			{
				varName: "cNext",
				type: "button",
				text: ">>",
				touchend: function() {
					if (isBusy()) return;
					toNext(getShowNum());
				}
	        },
			{
				varName: "cEnd",
				type: "button",
				text: ">>‖",
				touchend: function() {
					if (isBusy()) return;
					toEnd(getShowNum());
				}
	        },
			{
				varName: "cMoveL",
				type: "button",
				text: "←",
				touchend: function() {
					if (isBusy()) return;
					cBoard.translate(0, -1); //left
				}
	        },
			{
				varName: "cMoveR",
				type: "button",
				text: "→",
				touchend: function() {
					if (isBusy()) return;
					cBoard.translate(0, 1); //right
				}
	        },
			{
				varName: "cMoveT",
				type: "button",
				text: "↑",
				touchend: function() {
					if (isBusy()) return;
					cBoard.translate(-1, 0); //top
				}
	        },
			{
				varName: "cMoveB",
				type: "button",
				text: "↓",
				touchend: function() {
					if (isBusy()) return;
					cBoard.translate(1, 0); //down
				}
	        },
			{
				varName: "cFlipY",
				type: "button",
				text: "↔180°",
				touchend: function() {
					if (isBusy()) return;
					cBoard.rotateY180(getShowNum());
				}
	        },
			{
				varName: "cCW",
				type: "button",
				text: "↗90°",
				touchend: function() {
					if (isBusy()) return;
					cBoard.rotate90(getShowNum());
				}
	        },
			{
				varName: "cCleLb",
				type: "button",
				text: "清空标记",
				touchend: function() {
					if (isBusy()) return;
					cBoard.removeMarkLine("all");
					cBoard.removeMarkArrow("all");
					cBoard.cleLb("all");
				}
	        },
			{
				varName: "cNewGame",
				type: "button",
				text: "新棋局",
				touchend: function() {
					if (isBusy()) return;
					newGame();
				}
	        },
			{
				varName: "cInputcode",
				type: "button",
				text: "输入代码",
				touchend: function() {
					if (isBusy()) return;
					inputCode(`长按下面空白区域，粘贴棋谱代码\n-------------\n\n`);
				}
	        },
			{
				varName: "cOutputcode",
				type: "button",
				text: "输出代码",
				touchend: function() {
					if (isBusy()) return;
					let code = cBoard.getCode();
					code = code == "\n{}{}" ? "空棋盘没有棋盘代码" : code;
					inputCode(`${code}\n\n\n-------------\n长按上面代码，复制棋谱代`);
				}
	        },
			{
				varName: "cLoadImg",
				type: "select",
				text: "打开",
				options: [1, "打开 图片", 2, "打开 lib 棋谱"],
				change: function(but) {
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
						}
					}
					FUN[but.input.value]();
					but.input.value = 0;
				}
	        },
			{
				varName: "cCutImage",
				type: "select",
				text: "保存",
				options: [2, "JPEG/ (*.jpg) ____ 压缩图片",
 					3, "PNG / (*.png) ____ 清晰图片",
 					4, "SVG / (*.svg) ____ 无损图片",
 					5, "HTML/(*.html) ___ 无损文档",
 					6, "PDF / (*.pdf) _____ 无损文档"],
				change: function(but) {
					but.setText(`保存`);
					if (isBusy()) return;
					const FUN = {
						2: () => { cBoard.saveAsImage("jpeg") },
						3: () => { cBoard.saveAsImage("png") },
						4: () => { cBoard.saveAsSVG("svg") },
						5: () => { cBoard.saveAsSVG("html") },
						6: () => { cBoard.saveAsPDF() },
					}
					FUN[but.input.value]();
					but.input.value = 0;
				}
	        },
			{
				varName: "cAutoadd",
				type: "radio",
				text: ` ${EMOJI_ROUND_BLACK_WHITE} 棋`,
				group: "stone_mark",
				mode: "radio"
	        },
			{
				varName: "cAddblack",
				type: "radio",
				text: ` ${EMOJI_ROUND_BLACK} 棋`,
				group: "stone_mark",
				mode: "radio"
	        },
			{
				varName: "cAddwhite",
				type: "radio",
				text: ` ${EMOJI_ROUND} 棋`,
				group: "stone_mark",
				mode: "radio"
	        },
			{
				varName: "cNextone",
				type: "button",
				text: `下手为${EMOJI_ROUND_ONE}`,
				touchend: function() {
					if (isBusy()) return;
					cBoard.setResetNum(cBoard.MSindex + 1);
					cBoard.isShowNum = getShowNum();
				}
	        },
			{
				varName: "cLba",
				type: "radio",
				text: ` ${EMOJI_SQUARE_BLACK} `,
				group: "stone_mark",
				mode: "radio"
	        },
			{
				varName: "cLbb",
				type: "radio",
				text: ` ${EMOJI_ROUND_DOUBLE} `,
				group: "stone_mark",
				mode: "radio"
	        },
			{
				varName: "cLABC",
				type: "select",
				group: "stone_mark",
				mode: "radio",
				options: [0, "←  箭头",
	 				1, "__ 线条",
	 				2, "ABC...",
	 				3, "abc...",
	 				4, "123...",
	 				5, "自定义...",
	 				6, `${EMOJI_STAR} 标记`,
	 				7, `${EMOJI_FOUL} 标记`, ],
				change: function() {
					if (cLABC.input.value > 1) cBoard.drawLineEnd();
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
				}
	        },
			{
				varName: "cResetnum",
				type: "button",
				text: "重置手数",
				touchend: function() {
					if (isBusy()) return;
					cBoard.setResetNum(0);
					setShowNum(true);
					cBoard.isShowNum = getShowNum();
				}
	        },
			{
				varName: "cLbc",
				type: "radio",
				text: ` ${EMOJI_TRIANGLE_BLACK} `,
				group: "stone_mark",
				mode: "radio"
	        },
			{
				varName: "cLbd",
				type: "radio",
				text: ` ${EMOJI_FORK} `,
				group: "stone_mark",
				mode: "radio",
				touchend: markRadioChecked
	        },
			{
				varName: "cLbColor",
				type: "select",
				text: `${EMOJI_PEN} 颜色`,
				options: lbColor.map((v, i) => [i, v.colName]).reduce((a, c) => a.concat(...c), []),
				change: function(but) {
					but.setText(`${EMOJI_PEN} 颜色`);
					but.setColor(lbColor[but.input.value].color);
					cLba.setColor(lbColor[but.input.value].color);
					cLbb.setColor(lbColor[but.input.value].color);
					cLbc.setColor(lbColor[but.input.value].color);
					cLbd.setColor(lbColor[but.input.value].color);
					cLABC.setColor(lbColor[but.input.value].color);
				}
	        },
			{
				varName: "cMode",
				type: "select",
				text: "摆棋",
				options: [1, "经典摆棋模式",
					2, "无序摆棋模式",
					3, "棋谱只读模式",
					4, "棋谱编辑模式"],
				change: function(but) {
					if (isBusy()) return;
					const FUN = {
						1: () => { setPlayMode(MODE_RENJU) },
						2: () => { setPlayMode(MODE_RENJU_FREE) },
						3: () => { setPlayMode(MODE_READLIB) },
						4: () => { setPlayMode(MODE_EDITLIB) },
					}
					FUN[but.input.value]();
				}
			},
			{
				varName: "cSelBlack",
				type: "checkbox",
				text: "黑先",
				group: "side",
				mode: "radio"
			},
			{
				varName: "cSelWhite",
				type: "checkbox",
				text: "白先",
				group: "side",
				mode: "radio"
			},
			{
				varName: "cFindPoint",
				type: "select",
				text: "找点",
				options: (
					!CALCULATE &&
					NO_CALCULATE_MENU
				) || (
				[1, "VCT选点",
				2, "做V点",
				3, "做43杀(白单冲4杀)",
				4, "活三级别",
				5, "活三",
				//6, `${EMOJI_FOUL} 三三`,
		  		//7, `${EMOJI_FOUL} 四四`,
				//8, `${EMOJI_FOUL} 长连`,
				9, "眠三",
				10, "活四",
				11, "冲四",
				12, "五连"]
				),
				change: function(but) {
					but.setText("找点");
					if (isBusy()) return;
					if (but.input.value < 1 || !CALCULATE) {
						but.input.value = 0;
						return;
					}
					viewport1.resize();
					let arr = cBoard.getArray();
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
				}
			},
			{
				varName: "cFindVCF",
				type: "select",
				text: "解题",
				options: (
					!CALCULATE &&
					NO_CALCULATE_MENU
				) || (
				[1, "找 VCF",
						 2, "找全VCF",
						 3, "找 双杀",
						 4, "三手胜",
						 5, "大道五目",
						 6, "五手五连",
						 7, "禁手判断",
						 8, "防冲四抓禁",
						 //9, "找  VCF防点",
						 10, "找 VCF 防点(深度+1)",
						 11, "找 VCF 防点(深度+∞)",
						 //12, "坂田三手胜(测试)",
						 //13, "VCT(测试）",
						 //12, "test two"
						 ]
				),
				chenge: function(but) {
					but.setText("解题");
					if (isBusy()) return;
					if (but.input.value < 1 || !CALCULATE) {
						but.input.value = 0;
						return;
					}
					viewport1.resize();
					let arr = cBoard.getArray(); // cBoard.getArray2D();
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
				}
		}];
		dw > dh && renjuButtonSettings.push(...renjuButtonSettings.splice(0, 4));
		mainUI.addButtons(mainUI.createButtons(renjuButtonSettings), renjuCmdDiv, 0);

		const imgButtonSettings = [
			{
				varName: "cZoomIn",
				type: "button",
				text: "放大",
				touchend: function() {
					const scale = Math.min(cBoard.scale * 1.5, 3);
					cBoard.setScale(scale);
				}
			},
			{
				varName: "cZoomOut",
				type: "button",
				text: "缩小",
				touchend: function() {
					const scale = Math.max(cBoard.scale / 1.5, 1);
					cBoard.setScale(scale);
				}
			},
			{
				varName: "cLockImg",
				type: "checkbox",
				text: "选定棋盘",
				touchend: function() {
					if (cLockImg.checked) {
						lockImg();
					}
					else {
						unLockImg();
					}
				}
			},
			{
				varName: "cAutoPut",
				type: "button",
				text: "自动识别",
				touchend: async function() {
					if (!cLockImg.checked) {
						await lockImg();
						cLockImg.setChecked(1);
					}
					cBoard.autoPut();
					miniBoard.unpackArray(cBoard.getArray2D());
					autoblackwhiteRadioChecked(cAddwhite2);
				}
			},
			{
				varName: "cPutBoard",
				type: "button",
				text: "摆入棋盘",
				touchend: function() {
					if (true || cBoard.SLTX == cBoard.size && cBoard.SLTY == cBoard.size) {
						putBoard();
					}
					else {
						warn("小棋盘,长按屏幕(鼠标右键点击)定位H8");
					}
				}
			},
			{
				varName: "cCleAll",
				type: "button",
				text: "清空棋盘",
				touchend: function() {
					for (let i = 15 * 15 - 1; i >= 0; i--) cBoard.P[i].cle();
				}
			},
			{
				varName: "cAddblack2",
				type: "radio",
				text: ` ${EMOJI_ROUND_BLACK} 棋`,
				group: "side1",
				mode: "radio",
				touchend: function() {
					autoblackwhiteRadioChecked(cAddblack2);
				}
			},
			{
				varName: "cAddwhite2",
				type: "radio",
				text: ` ${EMOJI_ROUND} 棋`,
				group: "side1",
				mode: "radio",
				touchend: function() {
					autoblackwhiteRadioChecked(cAddwhite2);
				}
			},
			{
				varName: "cSLTY",
				type: "select",
				text: "15 行",
				options: [15, "15 行", "radio", 14, "14 行", "radio", 13, "13 行", "radio", 12, "12 行", "radio", 11, "11 行", "radio", 10, "10 行", "radio", 9, "9 行", "radio", 8, "8 行", "radio", 7, "7 行", "radio", 6, "6 行", "radio"],
				onshowmenu: function(but) {
					[...this.input].map(op => op.checked = op.value == cBoard.SLTY);
				},
				change: function(but) {
					cBoard.SLTY = but.input.value;
					cBoard.resetP();
					if (!cLockImg.checked) {
						cBoard.cleBorder();
						cBoard.printBorder();
					}
					else {
						cLockImg.setChecked(0);
						unLockImg();
					}
				}
			},
			{
				varName: "cSLTX",
				type: "select",
				text: "15 列",
				options: [15, "15 列", "radio", 14, "14 列", "radio", 13, "13 列", "radio", 12, "12 列", "radio", 11, "11 列", "radio", 10, "10 列", "radio", 9, "9 列", "radio", 8, "8 列", "radio", 7, "7 列", "radio", 6, "6 列", "radio"],
				onshowmenu: function(but) {
					[...this.input].map(op => op.checked = op.value == cBoard.SLTX);
				},
				touchend: function(but) {
					but.setText(but.input.value + " 列");
					cBoard.SLTX = but.input.value;
					cBoard.resetP();
					if (!cLockImg.checked) {
						cBoard.cleBorder();
						cBoard.printBorder();
					}
					else {
						cLockImg.setChecked(0);
						unLockImg();
					}
				}
			},
			{
				varName: "cRotate90",
				type: "button",
				text: "↗90°",
				touchend: function() {
					miniBoard.rotate90()
				}
			},
			{
				varName: "cUp",
				type: "button",
				text: "↑",
				touchend: function() {
					miniBoard.translate(-1, 0)
				}
			},
			{
				varName: "cLeft",
				type: "button",
				text: "←",
				touchend: function() {
					miniBoard.translate(0, -1)
				}
			},
			{
				varName: "cRight",
				type: "button",
				text: "→",
				touchend: function() {
					miniBoard.translate(0, 1)
				}
			},
			{
				varName: "cTotate180",
				type: "button",
				text: "↔180°",
				touchend: function() {
					miniBoard.rotateY180()
				}
			},
			{
				varName: "cDown",
				type: "button",
				text: "↓",
				touchend: function() {
					miniBoard.translate(1, 0)
				}
			},
			{
				varName: "cPutMiniBoard",
				type: "button",
				text: "摆入棋盘",
				touchend: function() {
					putBoard(null, miniBoard)
				}
			},
			{
				varName: "cCleMiniBoard",
				type: "button",
				text: "清空棋盘",
				touchend: function() {
					miniBoard.cle()
				}
		}];
		imgButtonSettings.splice(0, 0, null);
		imgButtonSettings.splice(3, 0, null);
		imgButtonSettings.splice(12, 0, miniBoard, null, null, null);
		imgButtonSettings.splice(16, 0, null, null);
		imgButtonSettings.splice(20, 0, null, null);
		imgButtonSettings.splice(24, 0, null, null);
		imgButtonSettings.splice(28, 0, null, null);

		mainUI.addButtons(mainUI.createButtons(imgButtonSettings), imgCmdDiv, 0);


		function _setBlockUnload() {
			const enable = isBusy(false) || [MODE_RENLIB, MODE_READLIB, MODE_EDITLIB].indexOf(playMode) + 1
			setBlockUnload(enable);
		}

		function newGame() {
			try{
			scaleCBoard(false);
			cBoard.canvas.width = cBoard.canvas.height = cBoard.width;
			cBoard.canvas.style.width = cBoard.canvas.style.height = cBoard.width + "px";
			cBoard.cle();
			cBoard.resetCBoardCoordinate();
			cBoard.printEmptyCBoard();
			cBoard.resetNum = 0;
			cBoard.firstColor = "black";
			cBoard.hideCutDiv();
			cBoard.drawLineEnd();
			setPlayMode(MODE_RENJU);
			cSelBlack.touchend();
			cAutoadd.touchend();
			renjuCmdDiv.show();
			imgCmdDiv.hide();
			busyCmdDiv.hide();
			viewport1.resize();
			RenjuLib.closeLib();
			}catch(e){console.error(e.stack)}
		}


		let putCheckerBoard = putBoard;

		function putBoard(idx, board = cBoard) {
			if (idx < 0) return;
			let arr = board.getArray2D();
			newGame();
			cBoard.unpackArray(!idx ? arr : changeCoordinate(arr, idx));
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
						cBoard.wNb(mv[i], "auto", true, undefined, undefined, 100);
					}
				}
				else { //printMoves
					cBoard.printMoves(mv, color);
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
					cBoard.printMoves(mv, color);
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

				cBoard.cutImg.style.width = ~~(cBoard.canvas.width) + "px";
				cBoard.cutImg.style.height = ~~(cBoard.canvas.height) + "px";
				cBoard.cutImg.src = "./icon.png";
				cBoard.parentNode.appendChild(cBoard.cutImg);
				renjuCmdDiv.hide();
				cBoard.cutImg.ontouchend = cBoard.cutImg.onclick = function() {
					cBoard.parentNode.removeChild(cBoard.cutImg);
					renjuCmdDiv.show();
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

		function createMenu(left, top, width, height, fontSize, options = [], onchange = () => {}, onshowmenu = () => {}) {
			return mainUI.createMenu({ options, onchange, onshowmenu });
		}

		function createContextMenu(left, top, width, height = cWidth * 0.8, fontSize) {
			return mainUI.createContextMenu({
				options: [0, "设置",
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
				onchange: function(but) {
					if (isBusy()) return;
					let idx = but.idx,
						x = but.menu.showX,
						y = but.menu.showY;
					const FUN = {
						0: () => { cShownum.showMenu(x, y) },
						1: () => { cLoadImg.showMenu(x, y) },
						2: () => { cCutImage.showMenu(x, y) },
						3: () => { cFindPoint.showMenu(x, y) },
						4: () => { cFindVCF.showMenu(x, y) },
						5: () => { cNewGame.touchend() },
						6: () => {
							if (cBoard.P[idx].type == TYPE_MARK || cBoard.P[idx].type == TYPE_MOVE || cBoard.P[idx].type == TYPE_EMPTY)
								inputLabel(idx);
						},
						7: () => { cCleLb.touchend() },
						8: () => { cShareWhite.touchend() },
						9: () => { cShare.touchend() },
						10: () => { cNextone.touchend() },
						11: () => { cResetnum.touchend() },
						12: () => { setShowNum(true) },
						13: () => { setShowNum(false) },
						14: () => { cInputcode.touchend() },
						15: () => { cOutputcode.touchend() },
						16: () => { typeof window.reloadApp == "function" ? window.reloadApp() : window.location.reload() },
					}
					FUN[but.input.value]();
				}
			});
		}


		async function addTree(tree) {
			if (tree && tree.constructor.name == "Tree") {
				setPlayMode(MODE_READLIB);
				cBoard.addTree(tree);
			}
		}

		async function mergeTree(tree) {
			if (tree && tree.constructor.name == "Tree") {
				setPlayMode(MODE_READLIB);
				cBoard.mergeTree(tree);
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

		async function inputText(initStr = "") {
			let w = cBoard.width * 0.8;
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
						cBoard.unpackCode(getShowNum(), inputStr, type);
				})
		}

		async function openImg() {
			cBoard.cle();
			scaleCBoard(false);
			cBoard.drawLineEnd();
			cBoard.resetCutDiv();
			renjuCmdDiv.hide()
			imgCmdDiv.show();
			await cBoard.loadImgFile(fileInput.files[0]);
			fileInput.value = "";
			cBoard.putImg(cBoard.bakImg, cBoard.canvas, cBoard.width / 13);
			setPlayMode(MODE_LOADIMG);
			cLockImg.setChecked(0);
			cAddblack2.setChecked(1);
			cAddwhite2.setChecked(0);
			cSLTX.input.value = cBoard.SLTX;
			cSLTX.setText(cSLTX.input.value + " 列");
			cSLTY.input.value = cBoard.SLTY;
			cSLTY.setText(cSLTY.input.value + " 行");
			viewport1.userScalable();
			warn(`长按棋盘，拖动虚线对齐棋子`);
			miniBoard.backgroundColor = cBoard.backgroundColor;
			miniBoard.setSize(cBoard.size);
			miniBoard.setCoordinate(cBoard.coordinateType);
			miniBoard.cle();
		}

		async function openLib() {
			if (isBusy()) return;
			setBusy(true);
			newGame();
			cBoard.drawLineEnd();
			let file = fileInput.files[0];
			fileInput.value = "";
			if (await RenjuLib.openLib(file)) setPlayMode(MODE_RENLIB);
			setBusy(false);
		}

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


		async function unLockImg() {
			await cBoard.unlockArea();
			viewport1.userScalable();
		}

		async function lockImg() {
			await cBoard.lockArea();
			viewport1.resize();
		}


		const gameRulesMenu = createMenu(menuLeft, undefined, menuWidth, undefined, menuFontSize,
	                [0, "无禁规则",
	                1, "禁手规则"],
			function(but) {
				if (isBusy()) return;
				const rules = [GOMOKU_RULES, RENJU_RULES];
				engine.gameRules = rules[but.input.value * 1];
			},
			function(but) {
				const rules = [GOMOKU_RULES, RENJU_RULES];
				[...but.input].map(op => op.checked = op.value == rules.indexOf(engine.gameRules));
			});
		const coordinateMenu = createMenu(menuLeft, undefined, menuWidth, undefined, menuFontSize,
	                [0, "棋盘坐标:无坐标",
	                1, "棋盘坐标:上下左右",
	                2, "棋盘坐标:上左",
	                3, "棋盘坐标:上右",
	                4, "棋盘坐标:下右",
	                5, "棋盘坐标:下左"],
			function(but) {
				if (isBusy()) return;
				cBoard.setCoordinate(but.input.value * 1);
			},
			function(but) {
				[...but.input].map((op, i) => op.checked = i === cBoard.coordinateType);
			});
		const cBoardSizeMenu = createMenu(menuLeft, undefined, menuWidth, undefined, menuFontSize,
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
				cBoard.setSize(but.input.value * 1);
				scaleCBoard(false);
				RenjuLib.setCenterPos({ x: cBoard.size / 2 + 0.5, y: cBoard.size / 2 + 0.5 });
				RenjuLib.getAutoMove();
			},
			function(but) {
				[...but.input].map(op => op.checked = op.value == cBoard.size);
			});
		const setCBoardLineStyleMenu = createMenu(menuLeft, undefined, menuWidth, undefined, menuFontSize,
	                [0, "正常",
	                1, "加粗",
	                2, "特粗"],
			function(but) {
				if (isBusy()) return;
				setLineStyle(but.input.value * 1);
			},
			function(but) {
				[...but.input].map((op, i) => op.checked = i === getLineStyle());
			});
		const loadRenjuSettingsMenu = createMenu(menuLeft, undefined, menuWidth, undefined, menuFontSize,
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
			});
		const saveRenjuSettingsMenu = createMenu(menuLeft, undefined, menuWidth, undefined, menuFontSize,
	                [1, "设置1",
	                2, "设置2",
	                3, "设置3",
	                4, "设置4",
	                5, "设置5"],
			function(but) {
				if (isBusy()) return;
				renjuCmdSettings.idx = but.input.value * 1;
				editButtons(xyObjToPage({ x: renjuCmdDiv.viewElem.offsetLeft, y: renjuCmdDiv.viewElem.offsetTop }, renjuCmdDiv.viewElem.parentNode), "renjuCmdSettings", renjuCmdSettings);
			});

		const cShownum = createMenu(menuLeft, undefined, menuWidth, undefined, menuFontSize,
				[0, "显示手数",
					 1, "显示禁手",
					 2, "显示路线",
					 3, "放大棋盘",
					 //4, "彩色对称打点",
					 5, "设置规则",
					 6, "设置棋盘大小",
					 7, "设置棋盘坐标",
					 8, "设置颜色风格",
					 9, "设置线条风格",
					 10, "设置按键位置",
					 11, "加载按键设置",
					 12, "重置数据"],
			function(but) {
				but.setText("设置");
				if (isBusy()) return;
				const FUN = {
					0: () => { setShowNum(!getShowNum()) },
					1: () => { cBoard.isShowFoul = !cBoard.isShowFoul },
					2: () => { cBoard.isShowAutoLine = !cBoard.isShowAutoLine },
					3: () => { scaleCBoard(cBoard.scale == 1, true) },
					//4: () => { cBoard.isTransBranch = !cBoard.isTransBranch },
					5: () => { gameRulesMenu.showMenu(but.menu.showX, but.menu.showY) },
					6: () => { cBoardSizeMenu.showMenu(but.menu.showX, but.menu.showY) },
					7: () => { coordinateMenu.showMenu(but.menu.showX, but.menu.showY) },
					9: () => { setCBoardLineStyleMenu.showMenu(but.menu.showX, but.menu.showY) },
					10: () => { saveRenjuSettingsMenu.showMenu(but.menu.showX, but.menu.showY) },
					11: () => { loadRenjuSettingsMenu.showMenu(but.menu.showX, but.menu.showY) },
					12: () => { location.href = "reset.html" },
				}
				FUN[but.input.value]();
			},
			function(but) {
				but.input[0].checked = cBoard.isShowNum;
				but.input[1].checked = cBoard.isShowFoul;
				but.input[2].checked = cBoard.isShowAutoLine;
				but.input[3].checked = cBoard.scale > 1;
				//but.input[4].checked = cBoard.isTransBranch;
			}
		);

		const cMenu = createContextMenu();

		const fileInput = document.createElement("input");
		fileInput.setAttribute("type", "file");
		fileInput.style.display = "none";
		renjuCmdDiv.viewElem.appendChild(fileInput);

		const cLockImg = mainUI.getChild({ varName: "cLockImg" });
		const cPutBoard = mainUI.getChild({ varName: "cPutBoard" });
		const cAutoPut = mainUI.getChild({ varName: "cAutoPut" });
		const cCleAll = mainUI.getChild({ varName: "cCleAll" });
		const cNewGame = mainUI.getChild({ varName: "cNewGame" });
		const cLocknum = mainUI.getChild({ varName: "cLocknum" });
		const cAutoadd = mainUI.getChild({ varName: "cAutoadd" });
		const cAddblack = mainUI.getChild({ varName: "cAddblack" });
		const cAddwhite = mainUI.getChild({ varName: "cAddblack2" });
		const cAddblack2 = mainUI.getChild({ varName: "cAddblack2" });
		const cAddwhite2 = mainUI.getChild({ varName: "cAddwhite2" });
		const cLba = mainUI.getChild({ varName: "cLba" });
		const cLbb = mainUI.getChild({ varName: "cLbb" });
		const cLbc = mainUI.getChild({ varName: "cLbc" });
		const cLbd = mainUI.getChild({ varName: "cLbd" });
		const cLbColor = mainUI.getChild({ varName: "cLbColor" });
		const cResetnum = mainUI.getChild({ varName: "cResetnum" });
		const cNextone = mainUI.getChild({ varName: "cNextone" });
		const cInputcode = mainUI.getChild({ varName: "cInputcode" });
		const cOutputcode = mainUI.getChild({ varName: "cOutputcode" });
		const cStart = mainUI.getChild({ varName: "cStart" });
		const cEnd = mainUI.getChild({ varName: "cEnd" });
		const cPrevious = mainUI.getChild({ varName: "cPrevious" });
		const cNext = mainUI.getChild({ varName: "cNext" });
		const cFlipX = mainUI.getChild({ varName: "cFlipX" });
		const cFlipY = mainUI.getChild({ varName: "cFlipY" });
		const cCW = mainUI.getChild({ varName: "cCW" });
		const cLABC = mainUI.getChild({ varName: "cLABC" });
		const cMoveL = mainUI.getChild({ varName: "cMoveL" });
		const cMoveR = mainUI.getChild({ varName: "cMoveR" });
		const cMoveT = mainUI.getChild({ varName: "cMoveT" });
		const cMoveB = mainUI.getChild({ varName: "cMoveB" });
		const cCutImage = mainUI.getChild({ varName: "cCutImage" });
		const cSelBlack = mainUI.getChild({ varName: "cSelBlack" });
		const cSelWhite = mainUI.getChild({ varName: "cSelWhite" });
		const cMode = mainUI.getChild({ varName: "cMode" });
		const cFindPoint = mainUI.getChild({ varName: "cFindPoint" });
		const cFindVCF = mainUI.getChild({ varName: "cFindVCF" });
		const cCancelFind = mainUI.getChild({ varName: "cCancelFind" });
		const cLoadImg = mainUI.getChild({ varName: "cLoadImg" });
		const cSLTX = mainUI.getChild({ varName: "cSLTX" });
		const cSLTY = mainUI.getChild({ varName: "cSLTY" });
		const cShare = mainUI.getChild({ varName: "cShare" });
		const cShareWhite = mainUI.getChild({ varName: "cShareWhite" });
		const cCleLb = mainUI.getChild({ varName: "cCleLb" });
		const cHelp = mainUI.getChild({ varName: "cHelp" });
		const cLeft = mainUI.getChild({ varName: "cLeft" });
		const cRight = mainUI.getChild({ varName: "cRight" });
		const cUp = mainUI.getChild({ varName: "cUp" });
		const cDown = mainUI.getChild({ varName: "cDown" });
		const cRotate90 = mainUI.getChild({ varName: "cRotate90" });
		const cTotate180 = mainUI.getChild({ varName: "cTotate180" });
		const cPutMiniBoard = mainUI.getChild({ varName: "cPutMiniBoard" });
		const cCleMiniBoard = mainUI.getChild({ varName: "cCleMiniBoard" });
		const cZoomIn = mainUI.getChild({ varName: "cZoomIn" });
		const cZoomOut = mainUI.getChild({ varName: "cZoomOut" });
		const lbTimer = mainUI.getChild({ varName: "lbTimer" });

		
		
		cAutoadd.touchend();
		cSelWhite.touchend();

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

		setCheckerBoardEvent()
		
		const hm = cLABC.hideMenu;
		cLABC.hideMenu = function(ms, callback) {
			hm.call(this, ms, callback);
			if (cLABC.input.value > 1) cBoard.drawLineEnd();
		};
	
		cBoard.sizechange = function() {
			cBoardSizeMenu.input.selectedIndex = 15 - this.size;
			viewport1.scrollTop();
			cBoardSize = this.size;
			if (this.tree && this.tree.constructor.name == "Tree") {
				let libSize = this.tree.centerPos.x * 2 - 1;
				if (libSize != cBoardSize) msg(`${EMOJI_FOUL_THREE}${libSize}路棋谱 ${cBoardSize}路棋盘${EMOJI_FOUL_THREE}`);
			}
		};
		cBoard.boardchange = function() {
			coordinateMenu.input.selectedIndex = this.coordinateType;
			viewport1.scrollTop();
		};
		cBoard.stonechange = function() {
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
			viewport1.scrollTop();
		};
		scaleCBoard = function(isScale, isAnima) {
			if (isScale) cBoard.setScale(1.5, isAnima);
			else cBoard.setScale(1, isAnima);
		};

		setShowNum = function(shownum) {
			(cBoard.isShowNum = !!shownum) ? cBoard.showNum() : cBoard.hideNum();
			return cBoard.isShowNum;
		};
		getShowNum = function() {
			return cBoard.isShowNum;
		};
		
		function setLineStyle(index) {
			const WEIGHT = ["normal", "bold", "heavy"];
        	WEIGHT[index] && (cBoard.setLineStyle(WEIGHT[index]));
		}
		
		function getLineStyle() {
			const WEIGHT = ["normal", "bold", "heavy"];
        	const index = WEIGHT.indexOf(cBoard.lineStyle);
        	return Math.max(0, index);
		}











		/*
		let p = { x: 0, y: 0 };
		xyObjToPage(p, renjuCmdDiv.viewElem);

		const FONT_SIZE = mainUI.cmdWidth / 28;
		const EX_WINDOW_LEFT = mainUI.upDivLeft + p.x;
		const EX_WINDOW_TOP = mainUI.upDivTop + p.y;
		const EX_WINDOW_WIDTH = mainUI.cmdWidth;
		const EX_WINDOW_HEIGHT = mainUI.cmdWidth * 2;
		try {
			window.exWindow.setStyle(EX_WINDOW_LEFT, EX_WINDOW_TOP, EX_WINDOW_WIDTH, EX_WINDOW_HEIGHT, FONT_SIZE);
		} catch (e) { alert(e.stack) }
		*/

		editButtons = createEditButtons(cBoard);

		setTimeout(function() {
			RenjuLib.reset({
				newGame: newGame,
				cBoard: cBoard,
				getShowNum: getShowNum
			});

		}, 1000 * 1);









		




		//------------------------------ setCheckerBoardEvent ------------------------------ 

		function setCheckerBoardEvent() {
			bindEvent.setBodyDiv(mainUI.bodyDiv, mainUI.bodyScale, mainUI.upDiv);
			bindEvent.addEventListener(cBoard.viewBox, "click", canvasClick);
			bindEvent.addEventListener(cBoard.viewBox, "dblclick", canvasDblClick);
			bindEvent.addEventListener(cBoard.viewBox, "dbltouchstart", continueSetCutDivStart);
			bindEvent.addEventListener(cBoard.viewBox, "contextmenu", canvasKeepTouch);



			function canvasKeepTouch(x, y) {
				try {
					iphoneCancelClick.enable();
					if (playMode != MODE_LOADIMG) {
						renjuKeepTouch(x, y);
					}
					else {
						if (cLockImg.checked) {
							putCheckerBoard(cBoard.getIndex(x, y));
						}
						else {
							setTimeout(() => continueSetCutDivStart(x, y), 10);
						}
					}
				} catch (e) { console.error(e.stack) }
			}

			function canvasClick(x, y) {
				try {
					if (iphoneCancelClick.isCancel()) return;
					//log(`event.button=${event.button}, typeof(x)=${typeof(x)}, x=${x}, y=${y}`);
					//log(`get=${playMode },ren=${MODE_RENJU}`)
					if (playMode != MODE_LOADIMG) {
						renjuClick(x, y);
					}
					else if (!cLockImg.checked) {
						if (cBoard.isOut(x, y, cBoard.viewBox)) return;
						let p = { x: x, y: y };
						cBoard.setxy(p, 2);
						cBoard.setCutDiv(p.x, p.y, true);
						cBoard.resetP();
						cBoard.printBorder();
					}
					else {
						let idx = cBoard.getIndex(x, y);
						if (idx < 0) return;
						let color = cAddwhite2.checked ? "white" : "black";
						if (cBoard.P[idx].type != TYPE_EMPTY) {
							cBoard.P[idx].cle();
						}
						else {
							cBoard.P[idx].printNb(EMOJI_STAR_BLACK, color, cBoard.gW, cBoard.gH, color == "white" ? cBoard.wNumColor : cBoard.bNumColor);
						}
					}
				} catch (e) { console.error(e.stack) }
			}

			function canvasDblClick(x, y) {
				try {
					if (playMode != MODE_LOADIMG) {
						renjuDblClick(x, y);
					}
				} catch (e) { console.error(e.stack) }
			}

			function continueSetCutDivStart(x, y) {
				try {
					if (playMode != MODE_LOADIMG || cLockImg.checked) return;
					cBoard.selectArea(x, y);
				} catch (e) { console.error(e.stack) }
			}
		}



		//------------------------ helpWindow ------------------------- 





		function mapLb(callback) {
			cBoard.map(p => {
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
			if (isBusy(cBoard.isOut(x, y, cBoard.viewBox) ? false : true)) return;
			let idx = cBoard.getIndex(x, y),
				arr = cBoard.getArray(),
				isF = gameRules == RENJU_RULES && isFoul(idx, arr),
				pInfo = createCommandInfo();

			if (idx < 0) return;
			cancelKeepTouch();
			switch (playMode) {
				case MODE_RENJU:
				case MODE_RENJU_FREE:
					if (pInfo.type == TYPE_NUMBER) {
						if (cBoard.P[idx].type == TYPE_NUMBER)
							cBoard.cleNb(idx, pInfo.isShowNum); //点击棋子，触发悔棋
						else if (cBoard.P[idx].type == TYPE_EMPTY && playMode == MODE_RENJU) {
							cBoard.wNb(idx, "auto", pInfo.isShowNum, undefined, isF); // 添加棋子  
						}
					}
					else if (pInfo.type == TYPE_BLACK) {
						if (cBoard.P[idx].type == TYPE_WHITE || cBoard.P[idx].type == TYPE_BLACK)
							cBoard.cleNb(idx); //点击棋子，触发悔棋
						else if (cBoard.P[idx].type == TYPE_EMPTY)
							cBoard.wNb(idx, "black", pInfo.isShowNum, undefined, isF); // 添加棋子  
					}
					else if (pInfo.type == TYPE_WHITE) {
						if (cBoard.P[idx].type == TYPE_WHITE || cBoard.P[idx].type == TYPE_BLACK)
							cBoard.cleNb(idx); //点击棋子，触发悔棋
						else if (cBoard.P[idx].type == TYPE_EMPTY)
							cBoard.wNb(idx, "white", pInfo.isShowNum); // 添加棋子 
					}
					else if (pInfo.type == TYPE_MARK) {
						if (cBoard.P[idx].type == TYPE_MARK || cBoard.P[idx].type == TYPE_MOVE)
							cBoard.cleLb(idx); // 点击标记，删除标记
						else if (cBoard.P[idx].type == TYPE_EMPTY)
							cBoard.wLb(idx, pInfo.boardText, pInfo.color); // 添加标记
						else if (cBoard.P[idx].type == TYPE_WHITE || cBoard.P[idx].type == TYPE_BLACK) {
							if (cBoard.P[idx].text) {
								cBoard.P[idx].text = "";
								cBoard._printPoint(idx);
								cBoard.refreshMarkArrow(idx);
							}
							else {
								cBoard.P[idx].text = pInfo.boardText;
								cBoard._printPoint(idx, true);
								cBoard.refreshMarkArrow(idx);
							}
						}
					}
					else if (pInfo.type == TYPE_MARKARROW) {
						cBoard.drawLineStart(idx, pInfo.color, "arrow");
					}
					else if (pInfo.type == TYPE_MARKLINE) {
						cBoard.drawLineStart(idx, pInfo.color, "line");
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
					if (cBoard.P[idx].type == TYPE_NUMBER) {
						if (pInfo.type == TYPE_NUMBER || pInfo.type == TYPE_BLACK || pInfo.type == TYPE_WHITE)
							toPrevious(pInfo.isShowNum); //点击棋子，触发悔棋
					}
					else if (cBoard.P[idx].type == TYPE_EMPTY) {
						if (pInfo.type == TYPE_NUMBER || pInfo.type == TYPE_BLACK || pInfo.type == TYPE_WHITE) {
							cBoard.wNb(idx, "auto", pInfo.isShowNum, undefined, isF); // 添加棋子
						}
						else if (pInfo.type == TYPE_MARK) {
							cBoard.wLb(idx, pInfo.boardText, pInfo.color); // 添加标记
						}
					}
					else if (cBoard.P[idx].type == TYPE_MARK) {
						selectBranch(cBoard.P[idx])
							.then(({ path, nMatch }) => {
								if (pInfo.type == TYPE_NUMBER || pInfo.type == TYPE_BLACK || pInfo.type == TYPE_WHITE) {
									if (path && path.length) {
										(path.indexOf(idx) & 1) == (cBoard.MSindex & 1) &&
										cBoard.wNb(225, "auto", pInfo.isShowNum, undefined, undefined, 100);
										cBoard.wNb(idx, "auto", pInfo.isShowNum, undefined, isF, 100);
									}
									else {
										cBoard.wNb(idx, "auto", pInfo.isShowNum, undefined, isF);
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
					if (cBoard.P[idx].type == TYPE_NUMBER) {
						if (pInfo.type == TYPE_NUMBER || pInfo.type == TYPE_BLACK || pInfo.type == TYPE_WHITE)
							toPrevious(pInfo.isShowNum); //点击棋子，触发悔棋
					}
					else if (cBoard.P[idx].type == TYPE_EMPTY) {
						if (pInfo.type == TYPE_NUMBER) {
							cBoard.wNb(idx, "auto", pInfo.isShowNum, undefined, isF);
						}
						else if (pInfo.type == TYPE_BLACK) {
							if (0 == (cBoard.MSindex & 1)) cBoard.wNb(225, "auto", pInfo.isShowNum, undefined, isF);
							cBoard.wNb(idx, "auto", pInfo.isShowNum, undefined, isF);
						}
						else if (pInfo.type == TYPE_WHITE) {
							if (1 == (cBoard.MSindex & 1)) cBoard.wNb(225, "auto", pInfo.isShowNum, undefined, isF);
							cBoard.wNb(idx, "auto", pInfo.isShowNum, undefined, isF);
						}
						else if (pInfo.type == TYPE_MARK) {
							cBoard.wLb(idx, pInfo.boardText, pInfo.color); // 添加标记
						}
						cBoard.tree.createPath(cBoard.tree.transposePath(cBoard.MS.slice(0, cBoard.MSindex + 1)));
					}
					else if (cBoard.P[idx].type == TYPE_MARK) {
						selectBranch(cBoard.P[idx])
							.then(({ path, nMatch }) => {
								//alert(`path: ${path}, nMatch: ${nMatch}`)
								if (pInfo.type == TYPE_NUMBER || pInfo.type == TYPE_BLACK || pInfo.type == TYPE_WHITE) {
									if (path && path.length) {
										cBoard.tree.nMatch = nMatch;
										while (cBoard.MSindex > -1) {
											cBoard.toPrevious(pInfo.isShowNum, 100);
										}
										for (let i = 0; i < path.length; i++) {
											cBoard.wNb(path[i], "auto", pInfo.isShowNum, undefined, i == (path.length - 1) && isF, 100);
										}
									}
									else {
										cBoard.wNb(idx, "auto", pInfo.isShowNum, undefined, isF);
									}
								}
								else if (pInfo.type == TYPE_MARK) {
									//first save oldPath
									path = cBoard.tree.transposePath(path || cBoard.MS.slice(0, cBoard.MSindex + 1).concat([idx]), nMatch);
									inputLabel(idx, pInfo.boardText)
										.then(function(boardText) {
											let node = cBoard.tree.seek(path);
											node && (node.boardText = boardText);
											cBoard.stonechange();
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
			let idx = cBoard.getIndex(x, y);
			if (idx > -1) {
				// 触发快速悔棋
				if (cBoard.P[idx].type == TYPE_NUMBER) {
					if (idx != cBoard.MS[cBoard.MSindex]) {
						while (cBoard.MS[cBoard.MSindex] != idx) {
							cBoard.cleNb(cBoard.MS[cBoard.MSindex], getShowNum());
						}
					}
					else { // 
						if (!cancelKeepTouch()) renjuKeepTouch(x, y);
					}
				} // 触发，手动输入标记
				else if ((cBoard.P[idx].type == TYPE_MARK || cBoard.P[idx].type == TYPE_MOVE || cBoard.P[idx].type == TYPE_EMPTY) && !cAutoadd.checked && !cAddblack.checked && !cAddwhite.checked) {
					inputLabel(idx);
				}
			}
		}

		function renjuKeepTouch(x, y) {
			if (isBusy()) return;
			let idx = cBoard.getIndex(x, y);
			if (idx < 0) return;

			if (idx == cBoard.MS[cBoard.MSindex]) {
				msgbox({
					title: `确认${cBoard.hideLastMove ? "恢复" : "取消"} 最后一手红色显示。`,
					butNum: 2,
					enterFunction: () => {
						cBoard.hideLastMove = !cBoard.hideLastMove;
						if (getShowNum()) cBoard.showNum();
						else cBoard.hideNum();
					}
				})
			}
			else if (cBoard.P[idx].type == TYPE_MARK && playMode == MODE_EDITLIB) {
				msgbox({
						title: `删除${idxToName(idx)}后续的结点`,
						enterTXT: "删除",
						butNum: 2
					})
					.then(({ butCode }) => {
						butCode == MSG_ENTER && selectBranch(cBoard.P[idx])
							.then(({ path, nMatch }) => {
								path = path || cBoard.MS.slice(0, cBoard.MSindex + 1).concat([idx]);
								cBoard.tree.removeBranch(cBoard.tree.transposePath(path, nMatch));
								cBoard.stonechange();
							})
					})
			}
			else {
				if (!cBoard.isOut(x, y, cBoard.viewBox, -~~(cBoard.width / 8))) {
					cMenu.idx = idx;
					cMenu.showMenu(undefined, y - window.scrollY - cMenu.menu.fontSize * 2.5 * 3);
				}
				else {
					iphoneCancelClick.enable();
					scaleCBoard(cBoard.scale == 1, true);
				}
			}
		}

		function inputLabel(idx, boardText = "") {
			let w = cBoard.width * 0.8;
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
						cBoard.cleLb(idx); // 清除原来标记，打印用户选定的标记
						if (str) cBoard.wLb(idx, str, color);
					}
				})
				.then(({ inputStr }) => {
					return Promise.resolve(inputStr);
				})
		}

		function isBusy(loading = true) {
			let busy = busyCmdDiv.viewElem.parentNode;
			if (busy && loading) loadAnimation.open("busy", 1600);
			return busy;
		}

		function setBusy(value, timeout = 0) {
			if (value) {
				renjuCmdDiv.hide();
				busyCmdDiv.show();
				lbTimer.reset();
				lbTimer.start();
			}
			else {
				setTimeout(() => {
					busyCmdDiv.hide();
					renjuCmdDiv.show();
				}, timeout);
				lbTimer.stop();
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
						let arr = cBoard.getArray();
						cBoard.cle();
						arr.map((color, idx) => {
							if (color == 1) cBoard.wNb(idx, "black");
							else if (color == 2) cBoard.wNb(idx, "white");
						})
					}
				case MODE_RENJU_FREE:
					//create Tree
					if (mode == MODE_READLIB || mode == MODE_EDITLIB) {
						let code = cBoard.getCode(),
							centerPos = { x: cBoard.size / 2 + 0.5, y: cBoard.size / 2 + 0.5 },
							tree = new RenjuTree(1, 640, centerPos);
						playMode = MODE_EDITLIB;
						cBoard.unpackCode(getShowNum(), code, TYPE_NUMBER);
						cBoard.addTree(tree);
						cBoard.tree.createPath(cBoard.MS.slice(0, cBoard.MSindex + 1));
					}
					break;
				case MODE_READLIB:
				case MODE_EDITLIB:
					//remove Tree
					if (mode == MODE_RENJU || mode == MODE_RENLIB) {
						let code = cBoard.getCode();
						cBoard.removeTree();
						playMode = MODE_RENJU;
						cBoard.unpackCode(getShowNum(), code);
					}
					else if (mode == MODE_RENJU_FREE) {
						let arr = cBoard.getArray();
						cBoard.cle();
						cBoard.removeTree();
						playMode = MODE_RENJU;
						arr.map((color, idx) => {
							if (color == 1) cBoard.wNb(idx, "black");
							else if (color == 2) cBoard.wNb(idx, "white");
						})
					}
					break;
			}

			playMode = mode;
			cBoard.isTransBranch = mode == MODE_EDITLIB;

			switch (mode) {
				case MODE_RENJU:
					cMode.setText("摆棋");
					break;
				case MODE_RENJU_FREE:
					cMode.setText("无序");
					break;
				case MODE_READLIB:
					cMode.setText("只读");
					cBoard.stonechange();
					break;
				case MODE_EDITLIB:
					cMode.setText("编辑");
					cBoard.stonechange();
					break;
				case MODE_RENLIB:
					cMode.setText("RenLib");
					cBoard.stonechange();
					break;
			}
			_setBlockUnload();
		}
		
		const game = {
			get MODE_RENJU() { return MODE_RENJU },
			get MODE_RENJU_FREE() { return MODE_RENJU_FREE },
			get MODE_LOADIMG() { return MODE_LOADIMG },
			get MODE_LINE_EDIT() { return MODE_LINE_EDIT },
			get MODE_ARROW_EDIT() { return MODE_ARROW_EDIT },
			get MODE_READ_TREE() { return MODE_READ_TREE },
			get MODE_READ_THREEPOINT() { return MODE_READ_THREEPOINT },
			get MODE_RENLIB() { return MODE_RENLIB },
			get MODE_READ_FOULPOINT() { return MODE_READ_FOULPOINT },
			get MODE_READLIB() { return MODE_READLIB },
			get MODE_EDITLIB() { return MODE_EDITLIB },
			
			get getPlayMode() { return getPlayMode },
			get setPlayMode() { return setPlayMode },
			get loadCmdSettings() { return loadCmdSettings },
		}

		return game;
		
	} catch (e) { alert(e.stack) }
})();