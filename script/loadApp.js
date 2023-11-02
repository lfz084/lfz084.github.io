window.SCRIPT_VERSIONS = [];
self.SCRIPT_VERSIONS["renju"] = "v2111.03";
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
            catch (err) { resolve() }
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
   
    
    function loadTheme() {
    	const themes = {
    		"light": {
    			"color": "#333333",
    			"backgroundColor": "white"
    		},
    		"grey": {
    			"color": "#333333",
    			"backgroundColor": "white"
    		},
    		"dark": {
    			"color": "#d0d0d0",
    			"backgroundColor": "#333333"
    		}
    	}
    	const themeKey = localStorage.getItem("theme") || "light";
    	Object.assign(document.body.style, themes[themeKey]);
    }
    

    //-----------------------------------------------

    window.d = document;
    window.dw = d.documentElement.clientWidth;
    window.dh = d.documentElement.clientHeight;
    
    window.vConsole = null; // 调试工具
    window.cBoard = null; //棋盘对象

    window.alert = function(name) { //更改默认标题
        const IFRAME = document.createElement('IFRAME');
        IFRAME.style.display = 'none';
        IFRAME.setAttribute('src', 'data:text/plain,');
        document.documentElement.appendChild(IFRAME);
        window.frames[0].window.alert(name);
        IFRAME.parentNode.removeChild(IFRAME);
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
        let reloadCount = localStorage.getItem("reloadCount") * 1 || 0;
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
        if (self["NoSleep"] && typeof NoSleep == "function") {
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
                sources: [[SOURCE_FILES["enMedium_ttf"]],
                [SOURCE_FILES["enBold_ttf"]],
                [SOURCE_FILES["enHeavy_ttf"]],
                [SOURCE_FILES["cnMedium_ttf"]],
                [SOURCE_FILES["cnHeavy_ttf"]],
                [SOURCE_FILES["cnBold_ttf"]],
                [SOURCE_FILES["emjMedium_ttf"]],
                [SOURCE_FILES["emjBold_ttf"]],
                [SOURCE_FILES["emjHeavy_ttf"]],
                [SOURCE_FILES["Symbola_ttf"]],
                [SOURCE_FILES["Evaluator_wasm"]]]
        }, {
                progress: "20%",
                type: "scriptAll",
                isAsync: false,
                sources: [[SOURCE_FILES["Viewport"]],
                [SOURCE_FILES["utils"]],
                [SOURCE_FILES["bindevent"]],
                [SOURCE_FILES["mainUI"]],
                [SOURCE_FILES["vconsole"], async () => {
                        await openVConsole();
                        testBrowser();
                 }],
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
                [SOURCE_FILES["editButtons"]],
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
                sources: [[SOURCE_FILES["msgbox"]],
                [SOURCE_FILES["appData"]],
                [SOURCE_FILES["engine"]],
                [SOURCE_FILES["NoSleep"]],
                [SOURCE_FILES["jspdf"]]]
        }, {
                progress: "50%",
                type: "scriptAll",
                isAsync: true,
                sources: [[SOURCE_FILES["PFSCMedium_js"]],
                [SOURCE_FILES["PFSCHeavy_js"]]]
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
                [SOURCE_FILES["index_html"]]]
        }, {
        	progress: "99%",
            type: "scriptAll",
            isAsync: false,
            sources: [[SOURCE_FILES["control"]]]
        }
        
     ];

        loadTheme();
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
                window.DEBUG = true;
                window.jsPDF = window.jspdf.jsPDF;
            })
            .then(() => {
                upData.saveAppVersion(upData.currentVersion);
                const str = upData.logNewVersionInfo();
                if (str) { //更新已经完成，弹窗提示
                	str.indexOf(`\n`) == -1 ? warn(str) : msg({
                		text: str,
                		butNum: 2,
                		lineNum: 10,
                		textAlign: "left",
                		enterTXT: "关闭",
                		cancelTXT: "历史记录",
                		callEnter: () => {},
                		callCancel: () => { window.open("./help/renjuhelp/versionHistory.html", "helpWindow") }
                	})
                }
            })
            .then(async () => {
                console.info(`logCaches`)
                console.info(await upData.logCaches());
                console.info(upData.logVersions());
            })
            .then(() => {
                localStorage.removeItem("reloadCount"); //window.reloadApp Count
                //_loadScript(SOURCE_FILES["debugModule"]);
            })
            .then(() => { upData.autoUpData() })
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
