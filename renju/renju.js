self.SCRIPT_VERSIONS["renju"] = "v2109.03";
var loadApp = () => { // 按顺序加载应用
        "use strict";
        const TEST_LOADAPP = true;
        let logCommands = [];

        function log(param, type = "log") {
            const command = {
                log: () => { console.log(param) },
                info: () => { console.info(param) },
                error: () => { console.error(param) },
                warn: () => { console.warn(param) },
                assert: () => { console.assert(param) },
                clear: () => { console.clear(param) },
                count: () => { console.count(param) },
                group: () => { console.group(param) },
                groupCollapsed: () => { console.groupCollapsed(param) },
                groupEnd: () => { console.groupEnd(param) },
                table: () => { console.table(param) },
                time: () => { console.time(param) },
                timeEnd: () => { console.timeEnd(param) },
                trace: () => { console.trace(param) },
            }
            let print = command[type] || console.log;
            if (TEST_LOADAPP && DEBUG) {
                const MSG = `${param}`;
                print(`[renju.js]\n>>  ${MSG}`);
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

        window.URL_HOMES = ["https://lfz084.gitee.io/renju/",
        "https://lfz084.github.io/",
        "http://localhost:7700/"];
        window.URL_HOME = location.href.indexOf(URL_HOMES[0]) + 1 ? URL_HOMES[0] :
            location.href.indexOf(URL_HOMES[1]) + 1 ? URL_HOMES[1] : URL_HOMES[2];

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
        };

        window.absoluteURL = function(url) {
            return new Request(url).url;
        }

        window.addEventListener("error", function(err) {
            log(err.stack || err.message || err, "error");
            //alert(err.Stack || err.message || err);
        });

        

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

        


    function openVConsole() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const IS_DEBUG = localStorage.getItem("debug");
                    if (IS_DEBUG == "true") {
                        if (vConsole == null) vConsole = new VConsole();
                        resolve(vConsole)
                    }
                    else{
                        resolve()
                    }
                }
                catch (err) {
                    resolve(err)
                }
            }, 0)
        })
    }

    function testBrowser() {
        let Msg = "";
        Msg += `_____________________\n\n `;
        Msg += `Worker: ${"Worker" in window}\n`;
        Msg += `caches: ${"caches" in window}\n`;
        Msg += `serviceWorker: ${"serviceWorker" in navigator}\n`;
        const canvas = document.createElement("canvas");
        Msg += `canvas: ${!!canvas.getContext}\n`
        Msg += `canvas.toBlob: ${typeof canvas.toBlob=="function"}\n`;
        Msg += `canvas.toDataURL: ${typeof canvas.toDataURL=="function"}\n`;
        Msg += `localStorage: ${"localStorage" in window}\n`;
        Msg += `msSaveOrOpenBlob in navigator: ${"msSaveOrOpenBlob" in navigator}\n`;
        Msg += `download in HTMLAnchorElement.prototype: ${"download"  in HTMLAnchorElement.prototype}\n`;
        Msg += `_____________________\n\n `;
        Msg += `\nuserAgent: ${window.navigator.userAgent}\n`
        Msg += `_____________________\n\n `;
        window.TEST_INFORMATION = window.BROWSER_INFORMATION = "\nBROWSER_INFORMATION:\n" + Msg;
        //log("testBrowser:\n" + Msg);
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
            upDiv.style.left = dw > dh ? ~~((dw - cWidth * 2) / 2) + "px" : ((cWidth/0.95) - cWidth) / 2 + "px";
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
    
            let {firstColor, resetNum, moves, whiteMoves, blackMoves, cBoardSize, coordinateType, renjuCmdSettings} = appData.loadData();
            if(window.codeURL) {
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
    
    const sources = [
        {
            progress: "0%",
            type: "cssAll",
            isAsync: true,
            sources: [[SOURCE_FILES["loaders"]],
                [SOURCE_FILES["main"]]]
        },{
            progress: "5%",
            type: "fontAll",
            isAsync: true,
            sources:[[SOURCE_FILES["PFSCMedium1_woff"]],
                [SOURCE_FILES["PFSCHeavy1_woff"]],
                [SOURCE_FILES["PFSCMedium1_ttf"]],
                [SOURCE_FILES["PFSCHeavy1_ttf"]],
                [SOURCE_FILES["Evaluator_wasm"]]]
        },{
            progress: "20%",
            type: "scriptAll",
            isAsync: false,
            sources:[[SOURCE_FILES["Viewport"], () => window.viewport1 = new View(cWidth / 0.95)],
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
                [SOURCE_FILES["helpWindow"]]]
        },{
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
    

    return serviceWorker.registerServiceWorker()
        .then(() => {
            upData.checkScriptVersion("renju")
        })
        .then(() => {
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
        .then(()=>{
            console.info(`logCaches`)
            //return logCaches()  // print caches information
        })
        .then(() => {
            //return logCache(window.CURRENT_VERSION)
        })
        .then(() => {upData.searchUpData()})
};
