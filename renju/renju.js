self.SCRIPT_VERSIONS["renju"] = "v2109.02";
var loadApp = () => { // 按顺序加载应用
        "use strict";
        const TEST_LOADAPP = true;
        const TEST_SERVER_WORKER = false;
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

        window.logCaches = async function() {
            if ("caches" in window) {
                let cs = `_____________________\n`;
                const cachesNames = await caches.keys();
                cachesNames.length == 0 && typeof warn == "function" && warn(`️⚠ ️缓存异常 不能离线运行 刷新一下吧!`);
                cs += `________ 离线缓存 ${cachesNames.length}个 ________\n\n`
                cachesNames.forEach(cache => cs += `.\t[${cache}]\n`);
                cs += `_____________________\n`;
                log(cs, "warn");
            }
        }

        window.logCache = async function(cacheName) {
            if ("caches" in window) {
                let cs = `_____________________\n`;
                const cache = await caches.open(cacheName);
                const keys = cache ? await cache.keys() : [];
                keys.length == 0 && typeof warn == "function" && warn(`️⚠ ️缓存异常 不能离线运行 刷新一下吧!`);
                cs += `______ [${cacheName}]  ${keys.length} 个文件 ______\n\n`
                keys.forEach(request => cs += `.\t${request.url.split("/").pop()}\n`);
                cs += `_____________________\n`;
                log(cs);
            }
        }

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

        let serviceWorker_state;
        let serviceWorker_state_history = [];

        async function registerServiceWorker() {
            const sWorker = await new Promise(resolve => {
                if ('serviceWorker' in navigator) {
                    let serviceWorker;
                    function _statechange(state) {
                        serviceWorker_state = state;
                        serviceWorker_state_history.push(serviceWorker_state);
                        if (serviceWorker_state == "activated" ||
                            serviceWorker_state == "waiting" ||
                            serviceWorker_state == "redundant")
                            resolve(serviceWorker)
                    }
                    function registerError() {
                        resolve()
                    }

                    navigator.serviceWorker.addEventListener('statechange', e => log(' >>> ' + e.target.state));
                    navigator.serviceWorker.addEventListener("message", event => TEST_SERVER_WORKER && log(`[serviceWorker onmessage: ${event.data}]`, "warn"));
                    // 开始注册service workers
                    navigator.serviceWorker.register('./sw.js', { scope: './' })
                        .then(registration => {
                            if (registration.installing) {
                                serviceWorker = registration.installing;
                            } else if (registration.waiting) {
                                serviceWorker = registration.waiting;
                            } else if (registration.active) {
                                serviceWorker = registration.active;
                            }
                            if (serviceWorker) {
                                _statechange(serviceWorker.state)
                                serviceWorker.addEventListener('statechange', e => _statechange(e.target.state));
                                setTimeout(registerError, 15 * 1000);
                            }
                            else registerError()
                        })
                        .catch(registerError);
                }
                else resolve()
            })
            //首次使用， ServiceWorker 没有正常工作就刷新
            if (sWorker && "controller" in navigator.serviceWorker) {
                if (!navigator.serviceWorker.controller) window.reloadApp(window.codeURL)
            }
        }

        async function fetchTXT(url) {
            url = absoluteURL(url);
            return new Promise(resolve => {
                let text = "",
                    timer;
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    function rm() {
                        navigator.serviceWorker.onmessage = undefined;
                        clearTimeout(timer);
                        resolve(text);
                    }
                    navigator.serviceWorker.onmessage = function(event) {
                        if (typeof event.data == "object" && event.data.type == "text") {
                            text = event.data.text;
                            rm();
                        }
                    }
                    navigator.serviceWorker.controller.postMessage({ cmd: "fetchTXT", url: url });
                    timer = setTimeout(rm, 30 * 1000);
                }
                else {
                    resolve(text);
                }
            })
        }

        async function getNewVersion() {
            const txt = await fetchTXT("renju.html");
            const versionCode = (/\"v\d+\.*\d*\"\;/).exec(txt);
            const version = versionCode ? String(versionCode).split(/[\"\;]/)[1] : undefined;
            return {
                version: version,
                isNewVersion: version && version != window.CURRENT_VERSION
            }
        }

        async function upData() { // find UpData open msg
            return new Promise((resolve, reject) => {
                function upEnd(e) {
                    if (typeof e.data == "object" && e.data.cmd == "upData") {
                        if (e.data.ok) {
                            log(`更新完成 ${e.data.version}`, "warn")
                            window.setUpdataVersion()
                            window.removeOldAppCache()
                                .then(() => {})
                                .catch(() => {})
                                .then(resolve)
                        }
                        else {
                            log(`更新失败 ${e.data.version} : ${e.data.error}`, "error")
                            reject()
                        }
                        navigator.serviceWorker.removeEventListener("message", upEnd);
                    }
                }

                function postUpData(version) {
                    log(`upData ${version}`, "warn")
                    navigator.serviceWorker.addEventListener("message", upEnd);
                    navigator.serviceWorker.controller.postMessage({ cmd: "upData", version: version, files: Object.keys(SOURCE_FILES).map(key => absoluteURL(SOURCE_FILES[key])) });
                }

                if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                    if (window.NEW_VERSION != window.CURRENT_VERSION) {
                        postUpData(window.NEW_VERSION)
                    }
                    else {
                        getNewVersion()
                            .then(version => {
                                if (version.isNewVersion) postUpData(version.version)
                                else resolve()
                            })
                            .catch(reject)
                    }
                }
                else {
                    resolve()
                }
            })
        }

        function searchUpData() {
            const TIMER_NEXT = 30 * 1000;
            let count = 0;

            function search() {
                if (count++< 2) upData().catch(err => setTimeout(search, TIMER_NEXT))
        }
        if ("serviceWorker" in navigator) {
            setTimeout(search, 5 * 1000);
        }
    }

    function autoShowUpDataInformation() {
        function lineWrap(str){
            return str.split(/\\n|<br>/).join("\n")
        }
        if ("localStorage" in window) {
            if (window.OLD_VERDION != window.CURRENT_VERSION &&
                window.CHECK_VERSION &&
                (serviceWorker_state == "activated" ||
                    serviceWorker_state == "redundant" ||
                    serviceWorker_state == undefined)
            )
            {
                let infoArr = window.UPDATA_INFO[window.CURRENT_VERSION],
                    lineNum = infoArr ? infoArr.length + 7 : 1,
                    Msg = lineNum > 1 ? "\n\t" : "";
                
                localStorage.setItem("RENJU_APP_VERSION", window.CURRENT_VERSION);
                Msg += `摆棋小工具 更新完毕`;
                if (infoArr) {
                    Msg += `\n\t_____________________ `;
                    Msg += `\n\t版本： ${window.CURRENT_VERSION}\n`;
                    for (let i = 0; i < infoArr.length; i++)
                        Msg += `\n\t${strLen(i+1, 2)}. ${lineWrap(infoArr[i])}`
                    Msg += `\n\t_____________________ `;
                }
                return lineNum==1 ? warn(Msg): msg({ text: Msg, 
                        butNum: 2, 
                        lineNum: lineNum, 
                        textAlign: lineNum > 1 ? "left" : "center",
                        enterTXT: "关闭",
                        cancelTXT: "历史记录", 
                        callEnter: () => {}, 
                        callCancel: () => {window.open("./help/renjuhelp/versionHistory.html","helpWindow")}
                    })
            }
            else Promise.resolve()
        }
        else Promise.resolve()
    }

    function logVersions() {
        let Msg = ` CHECK_VERSION = ${window.CHECK_VERSION}\n`;
        Msg += `_____________________\n\n `;
        Msg += `${strLen("主页  ", 30)}  版本号: ${window.CURRENT_VERSION}\n`;
        for (let key in window.SCRIPT_VERSIONS) {
            Msg += `${strLen(key + ".js  ", 20, "-")}  版本号: ${self.SCRIPT_VERSIONS[key]}\n`;
        }
        Msg += `_____________________\n\n `;
        log(Msg, "warn")
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
                    log(`serviceWorker.state: ${serviceWorker_state_history.join(" --> ")}`, "warn");
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
    

    return registerServiceWorker()
        .then(() => {
            window.checkScriptVersion("renju")
        })
        .then(() => {
            return window.postVersion()
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
            log(window.TEST_INFORMATION, "info");
            logVersions();
        })
        .then(() => {
            console.info(`autoShowUpDataInformation`)
            return autoShowUpDataInformation() //更新已经完成，弹窗提示
        })
        .then(()=>{
            console.info(`logCaches`)
            return logCaches()  // print caches information
        })
        .then(() => {
            return logCache(window.CURRENT_VERSION)
        })
        .then(() => {searchUpData()})
};
