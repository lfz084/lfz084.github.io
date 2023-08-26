window.SCRIPT_VERSIONS = [];
self.SCRIPT_VERSIONS["renju"] = "v2110.02";
(() => { // 按顺序加载应用
    "use strict";
    window.DEBUG = true;
    const TEST_LOADAPP = true;

    //--------------------- log -----------------------

    function log(param, type = "log") {
        const print = console[type] || console.log;
        if (TEST_LOADAPP && window.DEBUG) {
            const MSG = `${param}`;
            print(`[loadApp.js]\n>>  ${MSG}`);
            "mlog" in window && typeof mlog == "function" && mlog(MSG);
        }
    }

    function testConsole() {
        console.clear("clear")
        console.info("info")
        console.error("error")
        console.warn("warn")
        console.assert("assert")
        console.count("count")
        console.group("group")
        console.group("group1")
        console.groupEnd("groupEnd")
        console.groupCollapsed("groupCollapsed")
        console.groupCollapsed("groupCollapsed1")
        console.groupEnd("groupEnd")
        console.table("table")
        console.time("time")
        console.timeEnd("timeEnd")
        console.trace("trace")
    }

    function openVConsole() {
        return new Promise((resolve, reject) => {
            try {
                const IS_DEBUG = localStorage.getItem("debug");
                if (IS_DEBUG == "true") {
                    if (vConsole == null) vConsole = new VConsole();
                    resolve(vConsole)
                }
                else {
                    resolve()
                }
            }
            catch (err) {resolve()}
        })
    }

    function testBrowser() {
        let Msg = "";
        Msg += `_____________________\n\n `;
        Msg += `Worker: ${"Worker" in window}\n`;
        Msg += `caches: ${"caches" in window}\n`;
        Msg += `serviceWorker: ${"serviceWorker" in navigator}\n`;
        Msg += `localStorage: ${"localStorage" in window}\n`;
        Msg += `msSaveOrOpenBlob in navigator: ${"msSaveOrOpenBlob" in navigator}\n`;
        Msg += `download in HTMLAnchorElement.prototype: ${"download"  in HTMLAnchorElement.prototype}\n`;
        Msg += `_____________________\n\n `;
        Msg += `\nuserAgent: ${window.navigator.userAgent}\n`
        Msg += `_____________________\n\n `;
        log("testBrowser:\n" + Msg);
    }

    //-----------------------------------------------

    window.d = document;
    window.dw = d.documentElement.clientWidth;
    window.dh = d.documentElement.clientHeight;
    window.cWidth = dw < dh ? dw * 0.95 : dh * 0.95;
    cWidth = dw < dh ? cWidth : dh < ~~(dw / 2 * 0.985) ? dh : ~~(dw / 2 * 0.985);

    window.viewport1 = null; // 控制缩放
    window.vConsole = null; // 调试工具
    window.openNoSleep = () => {}; //打开防休眠
    window.closeNoSleep = () => {}; //关闭防休眠
    window.cBoard = null; //棋盘对象

    window.alert = function(name) { //更改默认标题
        const IFRAME = document.createElement('IFRAME');
        IFRAME.style.display = 'none';
        IFRAME.setAttribute('src', 'data:text/plain,');
        document.documentElement.appendChild(IFRAME);
        window.frames[0].window.alert(name);
        IFRAME.parentNode.removeChild(IFRAME);
    }

    window.absoluteURL = function(url) {
        return new Request(url).url;
    }

    window.addEventListener("error", function(err) {
        log(err.stack || err.message || err, "error");
        //alert(err.Stack || err.message || err);
    })

    const BUT = document.createElement("div");
    BUT.setAttribute("id", "mlog");
    document.body.appendChild(BUT);

    function removeMlog() {
        if (BUT && BUT.parentNode) BUT.parentNode.removeChild(BUT);
        window.mlog = undefined;
    }

    window.mlog = (function() {
        let timer;
        return function(message) {
            if (timer) clearTimeout(timer);
            if (!BUT.parentNode) return;
            BUT.innerHTML = message;
            BUT.removeAttribute("class");
            console.log(message);
            timer = setTimeout(() => {
                BUT.innerHTML = `<a href="renju.html" target="_self">点击刷新</a>`;
                BUT.setAttribute("class", "refresh")
            }, 15 * 1000)
        }
    })()

    window.reloadApp = async function(codeURL) {
        let reloadCount = localStorage.getItem("reloadCount") || 0;
        const url = window.location.href.split("?")[0] + `?v=${new Date().getTime()}${codeURL ? "#" + codeURL : ""}`
            //如果反复刷新，就删除缓存文件
            ++reloadCount > 5 && await upData.resetApp();
        localStorage.setItem("reloadCount", reloadCount);
        window.onbeforeunload = null;
        window.location.href = url;
    }

    window.codeURL = window.location.href.split(/#/)[1] || "";

    function initNoSleep() { //设置防休眠
        let noSleep;
        let isNoSleep = false; // bodyTouchStart 防止锁屏
        let noSleepTime = 0;
        if (typeof NoSleep == "function") {
            noSleep = new NoSleep();
            setInterval(function() {
                if (isNoSleep) {
                    noSleep.enable();
                    //log("noSleep.enable()")
                }
                else {
                    noSleep.disable();
                    //log("noSleep.disable()")
                }
            }, 15 * 1000);
        }
        window.openNoSleep = function() {
            if (noSleep) {
                isNoSleep = true;
            }
        };
        window.closeNoSleep = function() {
            isNoSleep = false;
        };
    }

    function createUI() {
        try {
            let bodyDiv = d.createElement("div");
            d.body.appendChild(bodyDiv);
            bodyDiv.style.position = "absolute";
            bodyDiv.style.width = dw < dh ? `${cWidth}px` : `${cWidth * 2}px`;
            bodyDiv.style.height = dw < dh ? `${cWidth * 4}px` : `${cWidth}px`;
            bodyDiv.style.left = "0px";
            bodyDiv.style.top = "0px";
            bodyDiv.style.opacity = "0";
            //bodyDiv.style.backgroundColor = "black";
            bodyDiv.setAttribute("class", "finish");
            setTimeout(() => { bodyDiv.style.opacity = "1" }, 300);

            let upDiv = d.createElement("div");
            bodyDiv.appendChild(upDiv);
            upDiv.style.position = "absolute";
            upDiv.style.width = "0px";
            upDiv.style.height = "0px";
            upDiv.style.left = dw > dh ? ~~((dw - cWidth * 2) / 2) + "px" : ((cWidth / 0.95) - cWidth) / 2 + "px";
            upDiv.style.top = dw > dh ? (dh - cWidth) / 2 + "px" : cWidth + "px";
            //upDiv.style.backgroundColor = "green";

            let downDiv = d.createElement("div");
            bodyDiv.appendChild(downDiv);
            downDiv.style.position = "absolute";
            downDiv.style.width = "0px";
            downDiv.style.height = "0px";
            downDiv.style.left = dw > dh ? ~~((dw - cWidth * 2) / 2) + cWidth + "px" : "0px";
            downDiv.style.top = dw > dh ? parseInt(upDiv.style.top) + ~~(cWidth / 13) + "px" : cWidth * 2.06 + "px";
            //downDiv.style.backgroundColor = "blue";

            cBoard = new CheckerBoard(upDiv, 0, 0, cWidth, cWidth);
            cBoard.resetCBoardCoordinate();
            cBoard.printEmptyCBoard();

            control.reset(cBoard, engine, msg, closeMsg, appData, dw, dh, [downDiv, 0, 0, cWidth, cWidth], bodyDiv);

            let { firstColor, resetNum, moves, whiteMoves, blackMoves, cBoardSize, coordinateType, renjuCmdSettings } = appData.loadData();
            if (window.codeURL) {
                let obj = cBoard.parserCodeURL(window.codeURL);
                resetNum = obj.resetNum;
                cBoardSize = obj.cBoardSize;
                moves = obj.moves;
                whiteMoves = obj.whiteMoves;
                blackMoves = obj.blackMoves;
            }
            //alert(`${window.codeURL}\n${moves}\n${blackMoves}\n${whiteMoves}\n${cBoardSize}`)
            appData.renjuLoad({
                firstColor: firstColor,
                resetNum: resetNum,
                moves: moves,
                whiteMoves: whiteMoves,
                blackMoves: blackMoves,
                cBoardSize: cBoardSize,
                coordinateType: coordinateType,
                renjuCmdSettings: renjuCmdSettings
            });

            return bodyDiv;
        }
        catch (err) {
            document.body.innerHTML = `<div><h1>出错啦</h1><h3><p>${err.stack || err.message}</p></h3><h2><a onclick="window.reloadApp()">点击刷新</a></h2></div>`;
        }
    }


    document.body.onload = async () => {
        window.SOURCE_FILES = await loadJSON("Version/SOURCE_FILES.json");
        window.UPDATA_INFO = await loadJSON("Version/UPDATA_INFO.json");

        const sources = [
            {
                progress: "0%",
                type: "cssAll",
                isAsync: true,
                sources: [[SOURCE_FILES["loaders"]],
                [SOURCE_FILES["main"]]]
        }, {
                progress: "5%",
                type: "fontAll",
                isAsync: true,
                sources: [[SOURCE_FILES["PFSCMedium1_woff"]],
                [SOURCE_FILES["PFSCHeavy1_woff"]],
                [SOURCE_FILES["PFSCMedium1_ttf"]],
                [SOURCE_FILES["PFSCHeavy1_ttf"]],
                [SOURCE_FILES["Evaluator_wasm"]]]
        }, {
                progress: "20%",
                type: "scriptAll",
                isAsync: false,
                sources: [[SOURCE_FILES["Viewport"], () => window.viewport1 = new View(cWidth / 0.95)],
                [SOURCE_FILES["vconsole"], async () => {
                        testBrowser();
                        await openVConsole();
                    }],
                [SOURCE_FILES["utils"]],
                [SOURCE_FILES["emoji"]], // first load emoji
                [SOURCE_FILES["EvaluatorWebassembly"]],
                [SOURCE_FILES["EvaluatorJScript"]],
                [SOURCE_FILES["TypeBuffer"]],
                [SOURCE_FILES["CheckerBoard"]],
                [SOURCE_FILES["image2board"]],
                [SOURCE_FILES["markLine"]],
                [SOURCE_FILES["pdf"]],
                [SOURCE_FILES["saveFile"]],
                [SOURCE_FILES["svg"]],
                [SOURCE_FILES["tree"]],
                [SOURCE_FILES["share"]],
                [SOURCE_FILES["exWindow"]],
                [SOURCE_FILES["helpWindow"]]]
        }, {
                progress: "30%",
                type: "scriptAll",
                isAsync: true,
                sources: [[SOURCE_FILES["Button"]],
                [SOURCE_FILES["Evaluator"]],
                [SOURCE_FILES["RenjuTree"]]]
        }, {
                progress: "35%",
                type: "scriptAll",
                isAsync: true,
                sources: [[SOURCE_FILES["control"]],
                [SOURCE_FILES["msgbox"]],
                [SOURCE_FILES["appData"]],
                [SOURCE_FILES["engine"]],
                [SOURCE_FILES["NoSleep"]],
                [SOURCE_FILES["jspdf"]]]
        }, {
                progress: "50%",
                type: "scriptAll",
                isAsync: true,
                sources: [[SOURCE_FILES["PFSCMedium"]],
                [SOURCE_FILES["PFSCHeavy"]]]
        }, {
                progress: "63%",
                type: "scriptAll",
                isAsync: true,
                sources: [[SOURCE_FILES["TextCoder"]],
                [SOURCE_FILES["MoveList"]],
                [SOURCE_FILES["Stack"]],
                [SOURCE_FILES["RenjuLib"]],
                [SOURCE_FILES["IndexedDB"]],
                [SOURCE_FILES["gif"]],
                [SOURCE_FILES["gifFile"]],
                [SOURCE_FILES["CheckerBoardGIF"]]]
        }, {
                progress: "78%",
                type: "fileAll",
                isAsync: true,
                sources: [[SOURCE_FILES["JFile"]],
                [SOURCE_FILES["JPoint"]],
                [SOURCE_FILES["MoveNode"]],
                [SOURCE_FILES["LibraryFile"]],
                [SOURCE_FILES["worker"]],
                [SOURCE_FILES["work_ReadLib"]],
                [SOURCE_FILES["IntervalPost"]],
                [SOURCE_FILES["RenLibDoc"]],
                [SOURCE_FILES["RenLibDoc_wasm"]],
                [SOURCE_FILES["RenLib_wasm"]],
                [SOURCE_FILES["gifWorker"]]]
        }, {
                progress: "91%",
                type: "fileAll",
                isAsync: true,
                sources: [[SOURCE_FILES["404_html"]],
                [SOURCE_FILES["renju_html"]]]
        }
     ];

        mlog(`body onload`)
        loadScriptAll([[SOURCE_FILES["upData"]], [SOURCE_FILES["serviceWorker"]]], false)
            .then(() => {
                return upData.checkAppVersion()
            })
            .then(() => {
                mlog("removeOldAppCache ......");
                return upData.removeOldAppCache()
            })
            .then(() => {
                mlog("registerServiceWorker ......");
                return serviceWorker.registerServiceWorker()
            })
            .then(() => {
                mlog("postVersion ......");
                return upData.postVersion()
            })
            .then(() => {
                return loadSources(sources)
            })
            .then(() => {
                initNoSleep();
                removeMlog();
                const UI = createUI();
                window.viewport1.resize();
                window.DEBUG = true;
                window.jsPDF = window.jspdf.jsPDF;
            })
            .then(() => {
                console.info(`autoShowUpDataInformation`)
                return upData.autoShowUpDataInformation() //更新已经完成，弹窗提示
            })
            .then(() => {
                console.info(`logCaches`)
                //return logCaches()  // print caches information
            })
            .then(() => {
                //return logCache(window.CURRENT_VERSION)
            })
            .then(() => { upData.searchUpData() })
            .then(() => {
                localStorage.removeItem("reloadCount"); //window.reloadApp Count
                //_loadScript(SOURCE_FILES["debugModule"]);
            })
            .then(() => {
                //window.SOURCE_FILES = undefined;
                //window.SCRIPT_VERSIONS = undefined;
                //window.UPDATA_INFO = undefined;
            })
            .catch((err) => {
                const MSG = "❌" + "加载过程出现了错误，准备刷新" + "\n" + (err.stack || err)
                alert(MSG)
                window.reloadApp()
            })
    }
})()
