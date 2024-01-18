
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
		INDEX: INDEXNAMES[5]
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
	
	async function addDefaultPuzzles(_path) {
		const rt = [];
		const path = _path || document.currentScript.src.slice(0, document.currentScript.src.lastIndexOf("/") + 1) + "json/";
		const fileNames = [
			"例题演示.json",
    		"一手の詰連珠HT_puzzle.json",
			"ひとりでも楽しめる詰連珠の部屋_puzzle.json",
			"詰連珠・入門 ～5までの追詰め問題～_puzzle.json",
			"珠々の詰連珠_puzzle.json",
			"白先胜100题_puzzle.json",
    		"三手胜五子棋题解_puzzle.json",
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
    		"高村政则诘连珠_puzzle.json",
    		"五子棋发阳论残本1.4_puzzle.json",
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
			}
			else {
				const data  = await this.jsonFile2Data(jsonString);
				this.addData(data);
				rt.push(data.time);
			}
		}
		return rt;
	}
	
	async function saveProgress(game) {
		console.log("saveProgress");
		if (game.data && (game.state == game.STATE.WIN || game.puzzle.mode == puzzleCoder.MODE.COVER)) {
			game.data.progress[game.puzzles.index] = 1;
		}
		if(!game.data || !game.data.key) return;
		localStorage.setItem("puzzle_progress", `${game.data.time},${game.puzzles.index}`);
		game.data[INDEX.INDEX] = game.puzzles.index;
		puzzleData.putData(game.data);
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
	
	function loadURL2JSON(url) {
		const hash = (url.split(/#/)[1] || "").replaceAll("%","&");
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
		loadURL2JSON,
		puzzle2URL
	}
	
	}catch(e){console.error(e.stack)}
})))