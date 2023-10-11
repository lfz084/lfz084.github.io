window.renjuEditor = (() => {
    "use strict";
    
    function log(msg) {
        let elm = document.getElementById("log");
        elm && (elm.innerText = `${msg}\n`);
    }
    
    
    async function wait(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        })
    }
    
    function code2Idx(code) {
    	const x = code.charCodeAt(0) - 97;
    	const y = 15 - code.slice(1);
    	return y * 15 + x;
    }
    
    function gameToArr2D(game) {
    	const arr2D = [];
    	for (let i = 0; i < 15; i++) {
    		arr2D[i] = game.slice(i * 15, (i + 1) * 15);
    	}
    	return arr2D;
    }

    //---------------------- save file -----------------------
    
    function text2blob(text) {
        return new Blob([text], { type: "application/json" })
    }

    function saveFile(blob, filename) {
        if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
            navigator.msSaveOrOpenBlob(blob, filename);
            console.log("msSaveOrOpenBlob...");
        }
        else {
            // if iphone open file;
            if (navigator.userAgent.indexOf("iPhone") + 1) {
                let url = URL.createObjectURL(blob);
                window.open(url, "helpWindow");
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 1000 * 60);
                console.log("open downloading...");
            }
            else { // download file;
                let save_link = document.createElement("a");
                save_link.href = URL.createObjectURL(blob);
                save_link.download = filename;
                save_link.target = "download";
                document.body.appendChild(save_link);
                save_link.click();
                save_link.parentNode.removeChild(save_link);
                setTimeout(() => { URL.revokeObjectURL(save_link.href); }, 1000 * 60);
                console.log("click downloading...");
            }
        }
    }
    
    //------------------------ renjueditor json ---------------------------

    const cBoard = new CheckerBoard(document.createElement("div"), 0, 0, 500, 500);
    cBoard.backgroundColor = "white";
    cBoard.showCheckerBoard();
        
    // index ，转字母数字坐标
    function idxToName(idx) {
        let alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let x = idx % 15;
        let y = ~~(idx / 15);
        if (x < 0 || x >= 15 || y < 0 || y >= 15)
            return "--";
        else
            return alpha.charAt(x) + (15 - y);
    }

    function toKaiBaoCode() {
        let code = [],
            codeArray = cBoard.codeString2CodeArray(cBoard.getCodeType(TYPE_NUMBER)),
            idx = -1,
            len = codeArray.length;
        while(++idx < len) {
            code.push(`${codeArray[idx]},${(idx & 1) + 1}`)
        }
        
        codeArray = cBoard.codeString2CodeArray(cBoard.getCodeType(TYPE_BLACK));
        idx = -1;
        len = codeArray.length;
        while (++idx < len) {
            code.push(`${codeArray[idx]},1`)
        }
        
        codeArray = cBoard.codeString2CodeArray(cBoard.getCodeType(TYPE_WHITE));
        idx = -1;
        len = codeArray.length;
        while (++idx < len) {
            code.push(`${codeArray[idx]},2`)
        }

        return code;
    }

    function autoRotate(index) {
        let i = 0;
        while (i++ < 4) {
            let arr = cBoard.getArray();
            if (arr.slice(0, 15).filter(v => v > 0).length)
                cBoard.rotate90();
            else
                return true;
        }
        alert(`第${index + 1}题在棋盘第15行上面，不可避免的出现了棋子。这题在开宝五子棋里面会缺少第15行的棋子（这是开宝五子棋的bug）`)
    }

    async function toKaiBaoJSON(games, callback = () => {}) {
        try {
            let codes = [];
            for (let j = 0; j < games.length; j++) {
                await wait(0);
                cBoard.unpackArray(games[j]);
                autoRotate(j) && codes.push(toKaiBaoCode());
                callback(`生成json...${j+1}/${games.length}`);
            }
            callback(`成功${codes.length}题`);
            return JSON.stringify(codes);
        } catch (e) { alert(e.stack) }
    }

    function downloadKaiBaoJSON(jsonText, filename = "新文件") {
        const blob = text2blob(jsonText);
        saveFile(blob, filename);
    }
    
    async function json2Games(jsonText, callback = () => {}) {
    	const games = [];
    	const json = JSON.parse(jsonText);
    	for (let i = 0; i < json.length; i++) {
    		const game = new Array(226).fill(0);
    		const gameJSON = json[i];
    		game[225] = -1;
    		for (let j = 0; j < gameJSON.length; j++) {
    			const stone = gameJSON[j].toLowerCase().split(",");
    			const idx = code2Idx(stone[0]);
    			const color = stone[1] * 1;
    			game[idx] = color;
    		}
    		games.push(game);
    		callback(`${i + 1}/${json.length}`);
    		await wait(0);
    	}
    	return games;
    }
    
    async function loadKaiBaoJSON(file, callback = () => {}) {
    	return json2Games(await file.text(), callback);
    }
    
    //----------------------- open Image ------------------------
    
    let onloadPage = () => {};
    
    function readAsDataURL(file) {
        return new Promise(function(resolve) {
            try {
                let fr = new FileReader();
                fr.onload = function() {
                    resolve(fr.result)
                };
                fr.onerror = function() {
                    resolve("")
                };
                fr.readAsDataURL(file)
            } catch (e) {
                alert(e.stack);
                resolve("");
            }
        });
    }
    
    async function openImage(file) {
        setTimeout(onloadPage, 0, 1, 1, await readAsDataURL(file));
    }

    //------------------------ 
    
    const EMPTY = 0;
    const PDF = 1;
    const ZIP = 2;
    const IMAGE = 3;
    
    let mode = 0;
    
    function setnloadPage(callback) {
        myPDFJS.onloadPage = callback;
        myZip.onloadPage = callback;
        onloadPage = callback;
    }
    
    async function openFile(file, filename, callback = () => {}) {
    	filename = filename.toLowerCase();
        if(/\.pdf$/i.test(filename)) {
            await myPDFJS.openPDF(file);
            mode = PDF;
        }
        else if (/\.zip$/i.test(filename)) {
            await myZip.openZIP(file);
            mode = ZIP;
        }
        else if (/\.json$/i.test(filename)) {
        	return await loadKaiBaoJSON(file, callback);
        }
        else {
            await openImage(file);
            mode = IMAGE;
        }
        return [];
    }
    
    async function loadPage(numPage) {
        if (mode == PDF) return myPDFJS.loadPage(numPage)
        else if (mode == ZIP) return myZip.loadPage(numPage)
    }
    
    async function nextPage() {
        if (mode == PDF) return myPDFJS.nextPage()
        else if (mode == ZIP) return myZip.nextPage()
    }
    
    async function prePage() {
        if (mode == PDF) return myPDFJS.prePage()
        else if (mode == ZIP) return myZip.prePage()
    }
    
    function getNumPage() {
        if (mode == PDF) return myPDFJS.numPages
        else if (mode == ZIP) return myZip.numPages
        else if (mode == IMAGE) return 1
        return 0;
    }
    
    //------------------------ 
    
    return {
        set onloadPage(callback) { setnloadPage(callback) },
        get wait() { return wait },
        get toKaiBaoJSON() { return toKaiBaoJSON },
        get downloadKaiBaoJSON() { return downloadKaiBaoJSON },
        get json2Games() { return json2Games },
        get loadKaiBaoJSON() { return loadKaiBaoJSON },
        get gameToArr2D() { return gameToArr2D },
        get openFile() { return openFile },
        get nextPage() { return nextPage },
        get prePage() { return prePage },
        get loadPage() { return loadPage },
        get numPages() { return getNumPage() }
    }
})()
