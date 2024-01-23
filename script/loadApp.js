window.SCRIPT_VERSIONS = [];
self.SCRIPT_VERSIONS["renju"] = "v2024.03";
window.loadApp = (() => { // 按顺序加载应用
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

    

    function logTestBrowser() {
        let Msg = "";
        Msg += `__________ logTestBrowser ___________\n\n `;
        Msg += `Worker: ${"Worker" in window}\n`;
        Msg += `caches: ${"caches" in window}\n`;
        Msg += `serviceWorker: ${"serviceWorker" in navigator}\n`;
        Msg += `localStorage: ${"localStorage" in window}\n`;
        Msg += `msSaveOrOpenBlob in navigator: ${"msSaveOrOpenBlob" in navigator}\n`;
        Msg += `download in HTMLAnchorElement.prototype: ${"download"  in HTMLAnchorElement.prototype}\n`;
        Msg += `_____________________\n\n `;
        Msg += `\nuserAgent: ${window.navigator.userAgent}\n`
        Msg += `_____________________\n\n `;
        return Msg;
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
    		"green": {
    			"color": "#333333",
    			"backgroundColor": "#118800"
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
    const isTopWindow = window === window.top;
	const fullscreenEnabled = document.fullscreenEnabled && isTopWindow && !localStorage.getItem("fullscreenCancel");
		
    
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
    
    window.fullscreenCancel = function(){localStorage.setItem("fullscreenCancel", "true")}
    
    
    window.openVconsole = function (open) {
    	const IS_DEBUG = open ? "true" : localStorage.getItem("debug");
    	if (isTopWindow && IS_DEBUG == "true") {
    		localStorage.setItem("debug", true);
    		if (vConsole == null) vConsole = new VConsole();
    		console.log(new Array(128).fill("---- reset vConsole touch ----").join("\n"))
    		return vConsole;
    	}
    }
    
    window.closeVconsole = function () {
    	if (vConsole) {
			vConsole.destroy();
			localStorage.setItem("debug", false);
		}
		vConsole = null;
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
        return function(message, type = "log") {
        	if (timer) clearTimeout(timer);
            if (!BUT.parentNode) return;
            BUT.innerHTML = message;
            BUT.removeAttribute("class");
            
            console[type || "log"](message);
            
            timer = setTimeout(() => {
                BUT.innerHTML = `<a href="renju.html" target="_self">点击刷新</a>`;
                BUT.setAttribute("class", "refresh")
            }, 15 * 1000)
        }
    })()

    window.reloadApp = async function(codeURL) {
    	let reloadCount = localStorage.getItem("reloadCount") * 1 || 0;
        localStorage.setItem("reloadCount", ++reloadCount);
        const url = window.location.href.split("?")[0] + `?v=${new Date().getTime()}${codeURL ? "#" + codeURL : ""}`
        reloadCount > 16 && (localStorage.removeItem("reloadCount"),  window.upData && (await upData.resetApp()));
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

	document.body.onload = async function load() {
    try {
    	window.console = window.top.console;
    	if (isTopWindow) {
    		await loadScript("debug/vconsole.min.js");
    	}
    	openVconsole();
    	console.info(`isTopWindow: ${isTopWindow}`)
    	console.info(`fullscreenEnabled: ${fullscreenEnabled}`)
    	console.info(logTestBrowser());
    	
        window.SOURCE_FILES = window.SOURCE_FILES || await loadJSON("Version/SOURCE_FILES.json");
        window.UPDATA_INFO = await loadJSON("Version/UPDATA_INFO.json");
		
		const sources = window.appSources;
		const uiSources = fullscreenEnabled && 
			[{
				progress: "0%",
				type: "cssAll",
				isAsync: true,
				sources: [[SOURCE_FILES["loaders"]],
				[SOURCE_FILES["fullscreen"]]]
			},{
			 	progress: "1%",
			 	type: "fontAll",
			 	isAsync: true,
			 	sources: [[SOURCE_FILES["enMedium_ttf"]],
				[SOURCE_FILES["enBold_ttf"]],
				[SOURCE_FILES["enHeavy_ttf"]]]
			},{
			 	progress: "2%",
				type: "scriptAll",
				isAsync: false,
				sources:[[SOURCE_FILES["Button"]],
				[SOURCE_FILES["ImgButton"]],
				[SOURCE_FILES["fullscreenUI"]]]
			}] || 
			[{
				progress: "3%",
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
				[SOURCE_FILES["cnBold_ttf"]],
				[SOURCE_FILES["cnHeavy_ttf"]],
				[SOURCE_FILES["emjMedium_ttf"]],
				[SOURCE_FILES["emjBold_ttf"]],
				[SOURCE_FILES["emjHeavy_ttf"]],
				[SOURCE_FILES["Symbola_ttf"]]]
			},{
				progress: "25%",
				type: "scriptAll",
				isAsync: false,
				sources:[[SOURCE_FILES["emoji"]],
				[SOURCE_FILES["utils"]],
                [SOURCE_FILES["bindevent"]],
                [SOURCE_FILES["Button"]],
                [SOURCE_FILES["ImgButton"]],
                [SOURCE_FILES["mainUI"]]]
			}];
		
		loadTheme();
        
        mlog(`body onload`)
        await loadScriptAll([
        	[SOURCE_FILES["loadAnimation"]],
        	[SOURCE_FILES["upData"]],
        	[SOURCE_FILES["serviceWorker"]],
        	[SOURCE_FILES["Viewport"]]
    	], false)
    	
    	await upData.checkAppVersion();
        mlog("removeOldAppCache ......");
        await upData.removeOldAppCache();
        
        if (localStorage.getItem("debug") && window.location.href.indexOf("http://") > -1) {
        	mlog("removeServiceWorker ......");
        	await serviceWorker.removeServiceWorker();
        }
    	else {
        	mlog("registerServiceWorker ......");
        	await serviceWorker.registerServiceWorker();
        	mlog("postVersion ......");
        	await upData.postVersion();
        	
        	mlog("upData CacheFiles ......");
        	const urls = Object.keys(SOURCE_FILES).map(key => SOURCE_FILES[key])
    		isTopWindow && await upData.saveCacheFiles(urls, upData.currentVersion)
    	}
        
        mlog(`loading ${fullscreenEnabled ? "fullscreenUI" : "mainUI"}......`);
        await loadSources(uiSources);
        
        if ("fullscreenUI" in self) {
        	mlog(`fullscreenUI.src = ${window.location.href}`, "warn")
        	fullscreenUI.src = window.location.href;
        	return;
        }
        
        await loadSources(sources);
        localStorage.removeItem("reloadCount");
        loadAnimation.lock(false);
        loadAnimation.close();
        
        removeMlog();
        initNoSleep();
        window.DEBUG = true;
        window.jsPDF = window.jspdf && window.jspdf.jsPDF;
         
        upData.saveAppVersion(upData.currentVersion);
        const str = upData.logNewVersionInfo();
    	if (str) { //更新已经完成，弹窗提示
    		str.indexOf(`\n`) == -1 ? warn(str) : msg({
                	text: str,
                	butNum: 1,
                	lineNum: 10,
                	textAlign: "left",
                	enterTXT: "关闭",
                	callEnter: () => {},
                	callCancel: () => { window.open("./help/renjuhelp/versionHistory.html", "helpWindow") }
        	})
        }
        console.info(`logCaches`)
        console.info(await upData.logCaches());
        console.info(upData.logVersions());
        
    }catch(err) {
    	const ASK = `❌加载过程出现了错误...\n${err && err.stack}\n\n`;
    	const PS = `是否重置数据\n\n`;
    	confirm(ASK + PS) ? window.location.href = "reset.html" : 	window.reloadApp();
    }
    }
})()
