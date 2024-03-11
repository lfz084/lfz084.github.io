
(function(global, factory) {
    (global = global || self, factory(global));
}(this, (async function(exports) {
	try{
	'use strict';
	const DATABASS_NAME = "lfz084";
	const STORE_NAME = "puzzle";
	const KEY = "key";
	const INDEXNAMES = ["title","progress","json","time","index01","index02","index03","index04","index05","index06","index07","index08","index09","index"];
	const INDEX = {
		TITLE: INDEXNAMES[0],
		PROGRESS: INDEXNAMES[1],
		"JSON": INDEXNAMES[2],
		TIME: INDEXNAMES[3],
		TIMERS: INDEXNAMES[4],
		INDEX: INDEXNAMES[5],
		DATE: INDEXNAMES[6]
	}
	await IndexedDB.open(DATABASS_NAME, 1, (db) => {
		try {
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const objectStore = db.createObjectStore(STORE_NAME, {
					keyPath: KEY,
					autoIncrement: false
				});
				INDEXNAMES.map(indexName => {
					objectStore.createIndex(indexName, indexName, { unique: false, multiEntry: false });
				})
				console.log(`indexNames: ${[...objectStore.indexNames]}`)
			}
			/*
			if (db.objectStoreNames.contains(STORE_NAME)) {
				db.deleteObjectStore(STORE_NAME);
			}
			*/
		} catch (e) { console.error(e.stack)}
	})
	
	async function getDataByKey(key) {
		try{
			const data = await IndexedDB.getDataByKey(STORE_NAME, key);
			return data;
		}catch(e){console.error(e.stack)}
	}
	
	async function getDataByIndex(indexName, value) {
		try {
			const data = await IndexedDB.getDataByIndex(STORE_NAME, indexName, value);
			return data;
		} catch (e) { console.error(e.stack) }
	}
	
	async function addData(obj) {
		try {
			return await IndexedDB.addData(STORE_NAME, obj)
		} catch (e) { console.error(e.stack) }
	}
	
	async function putData(obj) {
		try {
			return await IndexedDB.putData(STORE_NAME, obj)
		} catch (e) { console.error(e.stack) }
	}
	
	async function deleteDataByKey(key) {
		try {
			return await IndexedDB.deleteDataByKey(STORE_NAME, key)
		} catch (e) { console.error(e.stack) }
	}
	
	async function deleteDataByIndex(indexName, value) {
		try {
			const data = await this.getDataByIndex(indexName, value);
			return await this.deleteDataByKey(data.key);
		} catch (e) { console.error(e.stack) }
	}
	
	async function openCursorByKey(callback) {
		try {
			return await IndexedDB.openCursorByKey(STORE_NAME, undefined, callback)
		} catch (e) { console.error(e.stack) }
	}
	
	async function openCursorByIndex(indexName, callback) {
		try {
			return await IndexedDB.openCursorByIndex(STORE_NAME, indexName, undefined, callback)
		} catch (e) { console.error(e.stack) }
	}
	
	/**
	 * 返回一个Promise
	 * resolve: 返回一个 puzzle Data 对象
	 * @fileOrJSONString
 	*/
	async function jsonFile2Data(fileOrJSONString, callback = () => {}) {
		const isString = "string" == typeof fileOrJSONString;
		const puzzles = await puzzleCoder.loadJSON2Puzzles(fileOrJSONString, callback);
		const key = isString ? fileOrJSONString : await fileOrJSONString.text();
		const json = await puzzleCoder.puzzles2RenjuJSON(puzzles);
		const title = puzzles.defaultSettings.title || puzzles.currentPuzzle.title;
		const progress = new Array(puzzles.length).fill(0);
		const time = new Date().getTime();
		const newData = {
			key,
			json,
			title,
			progress,
			time
		}
		return newData;
	}
	
	async function addDefaultPuzzles(_path, defaultPuzzleTimes = [], callback = () => {}) {
		const rt = defaultPuzzleTimes;
		const path = _path || document.currentScript.src.slice(0, document.currentScript.src.lastIndexOf("/") + 1) + "json/";
		const fileNames = [
			"例题演示.json",
			"错题复习.json",
			"每日练习.json",
			"每日残局.json",
			"每日三手胜.json",
			"每日VCT.json",
			"每日VCF.json",
			"每日限珠题.json",
			"每日点点题.json",
			"每日做43杀.json",
			"每日做VCF.json",
			"每日双杀题.json",
			"每日防抓禁.json",
    		"入门-一手詰_puzzle.json",
    		"入门-三手詰_puzzle.json",
    		"入门-五手詰_puzzle.json",
    		"入门-四追い_puzzle.json",
    		"入门-白先三手詰_puzzle.json",
    		"一手の詰連珠HT_puzzle.json",
    		"五子棋阶梯训练第一章_puzzle.json",
			"ひとりでも楽しめる詰連珠の部屋_puzzle.json",
			"詰連珠・入門 ～5までの追詰め問題～_puzzle.json",
			"珠々の詰連珠_puzzle.json",
    		"異着・正着詰連珠_puzzle.json",
    		"連珠苦楽部詰連珠_puzzle.json",
    		"黑先胜100题_puzzle.json",
			"白先胜100题_puzzle.json",
    		"三手胜五子棋题解_puzzle.json",
    		"冈部宽连珠习题_puzzle.json",
    		"趣味连珠习题_puzzle.json",
    		"实战VCF.json",
    		"黑先VCF_puzzle.json",
    		"白先VCF_puzzle.json",
    		"六路连珠习题1_puzzle.json",
    		"六路连珠习题2_puzzle.json",
    		"六路连珠习题3_puzzle.json",
    		"六路连珠习题4_puzzle.json",
    		"六路连珠习题5_puzzle.json",
    		"大道五目_puzzle.json",
    		"美味诘连珠.中村茂_puzzle.json",
    		"天狗道场_puzzle.json",
    		"新图巧百番_puzzle.json",
    		"超级五子棋_puzzle.json",
    		"连珠俱乐部_puzzle.json",
    		"坂田吾郎九段连珠教室_puzzle.json",
    		"高村政则诘连珠_puzzle.json",
    		"五子棋发阳论残本1.4_puzzle.json",
    		"五子茶馆小题目大全.json",
    		"第一届画眉杯双杀赛_puzzle.json",
    		"解题大赛合集_01_(12,22,23)_puzzle.json",
    		"解题大赛合集_02_(25,28,31)_puzzle.json",
    		"解题大赛合集_03_(36,40,42,43)_puzzle.json",
    		"解题大赛合集_04_(46,48,49,50)_puzzle.json",
    		"解题大赛合集_05_(1~10)_puzzle.json",
    		"解题大赛合集_06_(11~20)_puzzle.json",
    		"解题大赛合集_07_(21~47)_puzzle.json"
			];
		for (let i = 0; i < fileNames.length; i++) {
			const jsonString = await window.loadTxT(path + fileNames[i]);
			const oldData = await this.getDataByKey(jsonString);
			if (oldData) {
				rt.push(oldData.time);
				i == 0 && callback(oldData.json)
			}
			else {
				const data  = await this.jsonFile2Data(jsonString);
				this.addData(data);
				rt.push(data.time);
				i == 0 && callback(data.json)
			}
		}
		return rt;
	}
	
	async function saveProgress(game) {
		try{
		console.log("saveProgress");
		if(!game.data || !game.data.key) return;
		localStorage.setItem("puzzle_progress", `${game.data.time},${game.puzzles.index}`);
		if (game.state == game.STATE.WIN || game.puzzle.mode == puzzleCoder.MODE.COVER) {
			game.data.progress[game.puzzles.index] = 1;
			if (game.puzzle.progress) { // 找到原题集，更新解题进度
				const sourceData = await getDataByIndex("time", game.puzzle.progress.time);
				if (sourceData && sourceData.progress && sourceData.progress[game.puzzle.progress.index] == 0) {
					sourceData.progress[game.puzzle.progress.index] = 1;
					await putData(sourceData);
				}
			}
		}
		game.data[INDEX.TIMERS] = game.data[INDEX.TIMERS] || new Array(game.data.progress.length).fill(0);
		if (game.timer > 0) game.data[INDEX.TIMERS][game.puzzles.index] = Math.max(game.timer, game.data[INDEX.TIMERS][game.puzzles.index] || 0);
		game.data[INDEX.INDEX] = game.puzzles.index;
		if (game.data[INDEX.DATE]) { //  判断是否退出保存每日练习进度
			const data = await getDataByIndex("time", game.data.time);
			if(data && data[INDEX.DATE] != new Date().toDateString()) return;
		}
		await putData(game.data);
		}catch(e){console.error(e.stack)}
	}
	
	async function getProgress() {
		const value = localStorage.getItem("puzzle_progress");
		if ("string" == typeof value) {
			const rt = value.split(",");
			return {
				time: rt[0] * 1,
				index: rt[1] * 1
			}
		}
	}
	
	function copyPuzzle(puzzle) {
		return {
			stones: puzzle.stones || undefined,
			blackStones: puzzle.blackStones || undefined,
			whiteStones: puzzle.whiteStones || undefined,
			labels: puzzle.labels || undefined,
			options: puzzle.options || undefined,
			size: puzzle.size,
			side: puzzle.side,
			rule: puzzle.rule,
			mode: puzzle.mode,
			title: puzzle.title,
			comment: puzzle.comment,
			level: puzzle.level,
			rotate: puzzle.rotate,
			delayHelp: puzzle.delayHelp,
			sequence: puzzle.sequence,
			progress: puzzle.progress || undefined
		}
	}
	
	async function getErrorPuzzlesData() {
		return getDataByIndex("title", "错题复习")
	}
	
	function equalPuzzle(puzzle1, puzzle2) {
		const keys = ["stones",
		"blackStones",
		"whiteStones",
		"size",
		"side",
		"rule",
		//"mode",
		"rotate"
		];
		for (let i=0; i < keys.length; i++) {
			if(puzzle1[keys[i]] != puzzle2[keys[i]]) return false;
		}
		return true;
	}
	
	function puzzleIndex(puzzles, puzzle) {
		let rt = -1;
		for (let i = 0; i < puzzles.length; i++) {
			if (equalPuzzle(puzzles[i], puzzle)) {
				rt = i;
				if (puzzles[i].mode == puzzle.mode) return i;
			}
		}
		return rt;
	}
	
	async function addErrorPuzzle(game) {
	try{
		const puzzle = game.puzzle;
		const newPuzzle = copyPuzzle(puzzle);
		newPuzzle.title = game.data ? game.data.title + `(${game.puzzles.index + 1})${game.data[INDEX.DATE] ? " - " + game.data[INDEX.DATE] : ""}` : "";
		game.data && game.data.key && (newPuzzle.progress = puzzle.progress || {time: game.data.time, index: game.puzzles.index});
		const data = await getErrorPuzzlesData();
		if (data) {
			const puzzles = JSON.parse(data.json);
			const index = puzzleIndex(puzzles.puzzles, newPuzzle);
			if (index + 1) {
				puzzles.puzzles.splice(index, 1);
				data.progress.splice(index, 1);
				data[INDEX.TIMERS].splice(index, 1);
			}
			puzzles.puzzles.push(newPuzzle);
			data.progress.push(0);
			data[INDEX.TIMERS].push(0);
			if (puzzles.puzzles.length > 200) {
				puzzles.puzzles.splice(0, puzzles.puzzles.length - 200);
				data.progress.splice(0, puzzles.puzzles.length - 200);
				data[INDEX.TIMERS].splice(0, puzzles.puzzles.length - 200);
			}
			data.json = JSON.stringify(puzzles);
			await putData(data);
		}
	}catch(e){console.error(e.stack)}
	}
	
	async function removeErrorPuzzle() {
		const data = await getErrorPuzzlesData();
		if (data) {
			const puzzles = JSON.parse(data.json);
			for (let i = puzzles.puzzles.length - 1; i >= 0; i--) {
				if (data.progress[i]) {
					puzzles.puzzles.splice(i, 1);
					data.progress.splice(i, 1);
					data[INDEX.TIMERS].splice(i, 1);
				}
				data.json = JSON.stringify(puzzles);
				await putData(data);
			}
		}
	}
	
	function randomArray(arr, loop = 1) {
		for(let j = 0; j < loop; j++) {
    	for (let i = 0; i < arr.length; i++) {
        	const iRand = parseInt(arr.length * Math.random());
        	const temp = arr[i];
        	arr[i] = arr[iRand];
        	arr[iRand] = temp;
		}
		}
	}
	
	async function saveRandomPuzzlesJSON(newPuzzlesLower, randomInfo) {
		const title = randomInfo.title;
		const mode = randomInfo.mode;
		const modes = randomInfo.modes;
		const data = await getDataByIndex("title", title);
		if (!data) {
			console.log(`没有找到${title}`);
		}
		else if(data[INDEX.DATE] == new Date().toDateString()) {
			console.log(`今天已有${title}`);
		}
		else {
			const puzzles = JSON.parse(data.json);
			puzzles.puzzles.length = 0;
			for (let i = 0; i < modes.length; i++) {
				const puzzle = newPuzzlesLower[modes[i]].shift();
				mode && (puzzle.mode = mode, puzzle.comment = puzzle.title = undefined);
				puzzles.puzzles.push(puzzle);
			}
			data.json = JSON.stringify(puzzles);
			data.progress = new Array(puzzles.puzzles.length).fill(0);
			data[INDEX.TIMERS] = new Array(puzzles.puzzles.length).fill(0);
			data[INDEX.INDEX] = 0;
			data[INDEX.DATE] = new Date().toDateString();
			await putData(data);
			console.log(`成功生成${title}`);
		}
	}
	
	async function createRandomPuzzles() {
		try{
		function pushPuzzle(key, puzzles, puzzle, maxLevel) {
			if (puzzles[key].length < 200) {
				puzzle = copyPuzzle(puzzle);
				puzzle.level <= maxLevel ? puzzles[key].splice(0, 0, puzzle) : puzzles[key].push(puzzle);
			}
		}
		console.log(new Date().getTime())
		const times = [];
		let donePuzzlesCount = 0;
		await puzzleData.openCursorByIndex("time", cursor => {
			const data = cursor && cursor.value;
			times.push(data.time);
			if (data.progress) {
				donePuzzlesCount += data.progress.filter(v => v).length;
			}
		})
		const maxLevel = Math.min(5, 3 + parseInt(5 * donePuzzlesCount / 5000));
		randomArray(times, 31);
		console.log(`maxLevel: ${maxLevel}`)
		
		const newPuzzlesLower = {
			32: [],
			64: [],
			67: [],
			96: [],
			160: [],
			192: [],
			193: [],
			203: [],
			204: [],
			205: [],
			209: [],
			210: []
		};
		const newPuzzlesUp = {
			32: [],
			64: [],
			67: [],
			96: [],
			160: [],
			192: [],
			193: [],
			203: [],
			204: [],
			205: [],
			209: [],
			210: []
		};
		const donePuzzles = {
			32: [],
			64: [],
			67: [],
			96: [],
			160: [],
			192: [],
			193: [],
			203: [],
			204: [],
			205: [],
			209: [],
			210: []
		};
		const ramdomPuzzles = [
			{
				title: "每日练习",
				modes: [67, 67, 64, 64, 32, 32,	160,193,192,192,203,205,204,209,210]
			},
			{
				title: "每日残局",
				mode: 96,
				modes: new Array(15).fill(1).map(() => [64, 67, 32][parseInt(3 * Math.random())])
			},
			{
				title: "每日三手胜",
				modes: new Array(15).fill(67)
			},
			{
				title: "每日VCT",
				modes: new Array(15).fill(64)
			},
			{
				title: "每日VCF",
				modes: new Array(15).fill(32)
			},
			{
				title: "每日限珠题",
				modes: new Array(15).fill(160)
			},
			{
				title: "每日点点题",
				modes: new Array(15).fill(1).map(() => [192, 193, 192][parseInt(3 * Math.random())])
			},
			{
				title: "每日做43杀",
				modes: new Array(15).fill(205)
			},
			{
				title: "每日做VCF",
				modes: new Array(15).fill(204)
			},
			{
				title: "每日双杀题",
				modes: new Array(15).fill(1).map(() => [209, 210][parseInt(2 * Math.random())])
			},
			{
				title: "每日防抓禁",
				modes: new Array(15).fill(203)
			}
		];
		const puzzleInfo = {"总题数": 0};
		
		for (let i = 0; i < times.length; i++) {
			const data = await getDataByIndex("time", times[i]);
			const puzzles = puzzleCoder.renjuJSON2Puzzles(data.json);
			const indexs = new Array(puzzles.length).fill(0).map((v,i) => i);
			if (data.title.indexOf("每日") + 1 || data.title == "错题复习") continue;
			randomArray(indexs, 31);
			for (let j = 0; j < indexs.length; j++) {
				puzzles.index = indexs[j];
				const puzzle = puzzles.currentPuzzle;
				puzzle.title = data.title + `(${indexs[j] + 1})`
				puzzle.progress = {time: data.time, index: indexs[j]};
				
				const key = `${puzzle.mode} - ${puzzleCoder.MODE_TITLE[puzzle.mode]}`;
				puzzleInfo[key] = puzzleInfo[key] || 0;
				puzzleInfo[key]++;
				(puzzle.mode & 0xE0) && puzzleInfo["总题数"]++;
				
				const sPuzzles = data.progress[indexs[j]] == 0 ? puzzle.level <= maxLevel ? newPuzzlesLower : newPuzzlesUp : donePuzzles;
				if (newPuzzlesLower[puzzle.mode]) {
					
					pushPuzzle(puzzle.mode, sPuzzles, puzzle, maxLevel);
				}
				else if ((puzzle.mode & 0xE0) == 160 || (puzzle.mode & 0xE0) == 192) {
					pushPuzzle(puzzle.mode & 0xE0, sPuzzles, puzzle, maxLevel);
				}
			}
		}
		Object.keys(newPuzzlesLower).map(key => {
			randomArray(newPuzzlesLower[key], 31);
			//newPuzzlesLower[key].sort((a, b) => a.level-b.level);
			randomArray(newPuzzlesUp[key], 31);
			//newPuzzlesUp[key].sort((a, b) => a.level-b.level);
			randomArray(donePuzzles[key], 31);
			//donePuzzles[key].sort((a, b) => a.level-b.level);
			newPuzzlesLower[key] = newPuzzlesLower[key].concat(newPuzzlesUp[key], donePuzzles[key]);
		});
		console.log(newPuzzlesLower);
		//console.log(newPuzzlesUp);
		//console.log(donePuzzles);
		console.log(puzzleInfo);
		for (let i = 0; i < ramdomPuzzles.length; i++) {
			await saveRandomPuzzlesJSON(newPuzzlesLower, ramdomPuzzles[i]);
		}
		console.log(new Date().getTime())
		}catch(e){console.error(e.stack)}
	}
	
	function loadURL2JSON(url) {
		const hash = replaceAll(url.split(/#/)[1] || "", "%", "&");
		const arr = hash.split("&");
		if (arr.length < 11) return ""
		const labels = [];
		const tempArr = (arr[11] || "").split(",");
		tempArr.length > 1 && tempArr.length % 2 == 0 && tempArr.map((v,i) => {
			if (i % 2) labels[i >> 1] += `,${v}`
			else labels[i >> 1] = v;
		})
		const puzzle = {
			stones: arr[0] || undefined,
			blackStones: arr[1] || undefined,
			whiteStones: arr[2] || undefined,
			size: arr[3],
			resetNum: arr[4],
			side: arr[5],
			rule: arr[6],
			mode: arr[7],
			rotate: arr[8],
			level: arr[9],
			options: arr[10] || undefined,
			labels: labels.length ? labels : undefined
		}
		return JSON.stringify({puzzles: [puzzle]});
	}
	
	function puzzle2URL(puzzle) {
		puzzle.labels && puzzle.labels.map((v,i) => puzzle.labels[i] = v.slice(0, v.indexOf(",") + 1) + String.fromCharCode(Math.min(255,v.charCodeAt(v.indexOf(",") + 1))));
		let codeURL = (puzzle.stones || "");
		codeURL += "&" + (puzzle.blackStones || "");
		codeURL += "&" + (puzzle.whiteStones || "");
		codeURL += "&" + puzzle.size;
		codeURL += "&" + 0;
		codeURL += "&" + puzzle.side;
		codeURL += "&" + puzzle.rule;
		codeURL += "&" + puzzle.mode;
		codeURL += "&" + puzzle.rotate;
		codeURL += "&" + puzzle.level;
		codeURL += "&" + (puzzle.options || "");
		codeURL += "&" + (puzzle.labels || "");
		return codeURL;
	}
	
	exports.puzzleData = {
		INDEX,
		addData,
		putData,
		getDataByKey,
		getDataByIndex,
		deleteDataByKey,
		deleteDataByIndex,
		openCursorByKey,
		openCursorByIndex,
		jsonFile2Data,
		addDefaultPuzzles,
		saveProgress,
		getProgress,
		addErrorPuzzle,
		createRandomPuzzles,
		removeErrorPuzzle,
		loadURL2JSON,
		puzzle2URL
	}
	
	}catch(e){console.error(e.stack)}
})))