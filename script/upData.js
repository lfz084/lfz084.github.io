// import removeServiceWorker form "serviceWorker.js"
window.upData = (function() {
    'use strict';
	const DEBUG_UPDATA = false;
    const mlog = self["mlog"] || console.warn;
    
    const keyRenjuVersion = "RENJU_APP_VERSION";
    const elements = document.getElementsByTagName("version");
    const htmlVersion = elements ? elements[0].getAttribute("v") : "";
    let oldVersion = localStorage.getItem(keyRenjuVersion); // if oldVersion == null then upDate Version
    if (oldVersion != htmlVersion && htmlVersion.indexOf("up") + 1) oldVersion = null; //强制更新

    const currentVersion = oldVersion || htmlVersion;
    let updataVersion;
    //alert(`o:${oldVersion}\nc:${currentVersion}\nn:${htmlVersion}`)
    let checkVersion = true;

    async function wait(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        })
    }
    
    function absoluteURL(url) {
    	return new Request(url).url;
    }

    async function removeAppCache(filter = () => true) {
        if ("caches" in window) {
            const cacheNames = await caches.keys();
            cacheNames && cacheNames.map(cacheName => {
            	if(filter(cacheName)) {
            		caches.delete(cacheName)
            		mlog(`delete cache: ${cacheName}`, "info")
            	}
            })
        }
    }

    async function removeOldAppCache() {
        return removeAppCache(cacheName => cacheName != currentVersion && cacheName != htmlVersion && cacheName != updataVersion)
    }

    async function resetApp() {
        await serviceWorker.removeServiceWorker()
        await removeAppCache()
    }

    function resetUpdataVersion() {
        localStorage.removeItem(keyRenjuVersion);
    }
    
    function saveAppVersion(version) {
    	localStorage.setItem(keyRenjuVersion, version);
    }

    function strLen(str, len, char = " ", align = "left") {
        if (align == "left") {
            return (str + new Array(len).join(char)).slice(0, len)
        }
        else {
            return (new Array(len).join(char) + str).slice(-len)
        }
    }

    async function logCache(cacheName) {
        if ("caches" in window) {
            let cs = `_____________________\n`;
            const cache = await caches.open(cacheName);
            const keys = cache ? await cache.keys() : [];
            if (keys.length == 0) {
            	typeof self.warn == "function" && warn(`️⚠ ️缓存异常 不能离线运行 刷新一下吧!`);
            	console.error(`upData.js: caches.open(${cacheName}).cache.keys().length == 0`)
            }
            cs += `______ [${cacheName}]  ${keys.length} 个文件 ______\n\n`
            keys.forEach(request => cs += `.\t${request.url.split("/").pop()}\n`);
            cs += `_____________________\n`;
            return cs;
        }
        return `"caches" in window === ${false}`;
    }

    async function logCaches() {
        if ("caches" in window) {
            let cs = `_____________________\n`;
            const cachesNames = await caches.keys();
            if (cachesNames.length == 0) {
            	typeof self.warn == "function" && warn(`️⚠ ️缓存异常 不能离线运行 刷新一下吧!`);
            	console.error(`upData.js: caches.keys().length == 0`)
            }
            cs += `________ 离线缓存 ${cachesNames.length}个 ________\n\n`
            for (let index in cachesNames) {
            	const cacheName = cachesNames[index];
            	cs += `.\t[${cacheName}]\n${await logCache(cacheName)}\n`;
            }
            cs += `_____________________\n`;
            return cs;
        }
        return `"caches" in window === ${false}`;
    }

    function logVersions() {
        let Msg = ` checkVersion = ${checkVersion}\n`;
        Msg += `_____________________\n\n `;
        Msg += `${strLen("主页  ", 30)}  版本号: ${currentVersion}\n`;
        for (let key in window.SCRIPT_VERSIONS) {
            Msg += `${strLen(key + ".js  ", 20, "-")}  版本号: ${window.SCRIPT_VERSIONS[key]}\n`;
        }
        Msg += `_____________________\n\n `;
        return Msg;
    }

    async function checkScriptVersion(filename) {
        const ver = window.SCRIPT_VERSIONS[filename];
        mlog(`checkScriptVersion [${[filename, ver || "undefined"]}]`, "info");
        if (ver && (ver != currentVersion)) {
            const ERR = `reload`;
            const ASK = `版本号不一致，可能影响正常运行\n_____________________\n\n${strLen("主页", 25)}版本号: ${currentVersion} \n${strLen(filename + ".js", 25)}版本号: ${window.SCRIPT_VERSIONS[filename]} \n_____________________\n\n`;
            const PS = `是否更新？\n\n${strLen("",15)}[取消] = 不更新${strLen("",10)}[确定] = 更新`;
            if (checkVersion && confirm(ASK + PS)) {
                await resetApp()
                resetUpdataVersion();
                window.reloadApp();
            }
            else {
                checkVersion = false;
            }
        }
    }

    async function checkAppVersion() {
        mlog(`checkAppVersion {currentVersion: ${htmlVersion}, htmlVersion: ${htmlVersion}}`, "info")
        if ("localStorage" in window) {
            const ASK = `有新的更新\n\n 当前版本号: ${currentVersion} \n 新的版本号: ${htmlVersion}\n\n`;
            const PS = `是否更新？\n\n${strLen("",15)}[取消] = 不更新${strLen("",10)}[确定] = 更新`;
            if (currentVersion != htmlVersion) {
                if (confirm(ASK + PS)) {
                    await serviceWorker.removeServiceWorker();
                    await removeOldAppCache();
                    resetUpdataVersion();
                    window.reloadApp()
                }
                else {
                    checkVersion = false;
                }
            }
        }
    }


    async function postVersion() {
        return new Promise(resolve => {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                let timer;
                
                function onmessage(event) {
                	const MSG = event.data;
                	if (typeof MSG == "object" && MSG.type == "NEW_VERSION" && MSG.version == currentVersion) {
                		mlog(`serviceWorker.onmessage: NEW_VERSION = ${MSG.version}`, "info");
                		rm();
                	}
                	else {
                		mlog(`serviceWorker.onmessage: ${JSON.stringify(MSG)}`, "info");
                	}
                }

                function rm() {
                	navigator.serviceWorker.removeEventListener("message", onmessage);
                	clearTimeout(timer);
                    resolve();
                }
                
            	navigator.serviceWorker.addEventListener("message", onmessage);
                navigator.serviceWorker.controller.postMessage({ type: "NEW_VERSION", version: currentVersion });
                mlog(`upData.postVersion: ${currentVersion}`, "info");
                timer = setTimeout(() => {
                    mlog("postVersion Timeout", "error");
                    rm();
                }, 3 * 1000);
            }
            else {
                resolve();
            }
        })
    }

    async function fetchTXT(url) {
        url = absoluteURL(url);
        return new Promise(resolve => {
            let text = "";
            let timer;

            function onmessage(event) {
            	if (typeof event.data == "object" && event.data.type == "text") {
            		text = event.data.text;
            		rm();
            	}
            }
            
            function rm() {
                navigator.serviceWorker.removeEventListener("message", onmessage);
                clearTimeout(timer);
                resolve(text);
            }

            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            	navigator.serviceWorker.addEventListener("message", onmessage);
                navigator.serviceWorker.controller.postMessage({ cmd: "fetchTXT", url: url });
                timer = setTimeout(rm, 30 * 1000);
            }
            else {
                resolve(text);
            }
        })
    }

    async function getUpDataVersion() {
        const txt = await fetchTXT("renju.html");
        const versionCode = (/\"v\d+\.*\d*\"/).exec(txt);
        const version = versionCode ? String(versionCode).split(/[\"\;]/)[1] : undefined;
        updataVersion = version;
        return {
            version: version,
            isNewVersion: version && version != currentVersion
        }
    }

    async function upData() { // find UpData open msg
        return new Promise(async (resolve) => {
            async function upEnd(e) {
                if (typeof e.data == "object" && e.data.cmd == "upData") {
                    if (e.data.ok) {
                        console.warn(`更新完成 ${e.data.version}`)
                        resetUpdataVersion();
                        await removeOldAppCache();
                        resolve(true);
                    }
                    else {
                        console.error(`更新失败 ${e.data.version} : ${e.data.error}`);
                        resolve(false);
                    }
                    navigator.serviceWorker.removeEventListener("message", upEnd);
                }
            }

            function postUpData(version) {
                console.info(`upData ${version}`);
                const MSG = {
                    cmd: "upData",
                    version: version,
                    files: Object.keys(window.SOURCE_FILES).map(key => absoluteURL(window.SOURCE_FILES[key]))
                }
                navigator.serviceWorker.addEventListener("message", upEnd);
                navigator.serviceWorker.controller.postMessage(MSG);
            }

            if ("caches" in self && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
                const version = await getUpDataVersion();
                if (version.isNewVersion) postUpData(version.version)
                else resolve(true)
            }
            else resolve(true)
        })
    }

    async function autoUpData() {
        if ("serviceWorker" in navigator) {
            let count = 0;
            await wait(5 * 1000);
            while (!(await upData()) && 5 > count++) {
                await wait(30 * 1000);
            }
        }
        console.info("结束更新");
    }

    function logNewVersionInfo() {
        function lineWrap(str) {
            return str.split(/\\n|<br>/).join("\n")
        }
        if ("localStorage" in window) {
            if (oldVersion != currentVersion && checkVersion) {
                let infoArr = window.UPDATA_INFO[currentVersion],
                    lineNum = infoArr ? infoArr.length + 7 : 1,
                    Msg = lineNum > 1 ? "\n " : "";

                Msg += `摆棋小工具 更新完毕`;
                if (infoArr) {
                    Msg += `\n _____________________ `;
                    Msg += `\n 版本： ${currentVersion}\n`;
                    for (let i = 0; i < infoArr.length; i++)
                        Msg += `\n${strLen(i+1, 2)}. ${lineWrap(infoArr[i])}`
                    Msg += `\n _____________________ `;
                }
                return Msg;
            } 
        }
        return "";
    }
    
    const myInit = {cache: "no-store", mode: 'cors'};
    
    function getUrlVersion(version) {
    	return "?v=" + version;
    }
    
    function formatURL(url, version) {
    	url = (absoluteURL(url).split("?")[0]).split("#")[0];
    	const URL_VERSION = getUrlVersion(version);
    	const indexHtml = url.split("/").pop().indexOf(".") == -1 ? (url.slice(-1) == "/" ? "" : "/") + "index.html" : "";
    	return url + indexHtml + URL_VERSION
    }
    
    function checkServiceWorkerAndCaches() {
    	if (!('serviceWorker' in navigator)) {
    		console.warn(`upData.js: saveCacheFiles 'serviceWorker' in navigator = false`)
    		return false;
    	}
    	if(!navigator.serviceWorker.controller) {
    		console.warn(`upData.js: saveCacheFiles navigator.serviceWorker.controller = ${navigator.serviceWorker.controller}`)
    		return false;
    	}
    	if(!("caches" in window)) {
    		console.warn(`upData.js: saveCacheFiles "caches" in window = false`)
    		return false;
    	}
    	return true;
    }
    
    async function isFinally(promise) {
    	let isF = true,
    		t = {};
    	await Promise.race([promise, t])
    		.then(v => v === t && (isF = false))
    	return isF;
    }
    
	async function removeFinallyPromise(promiseArray) {
		for (let j = promiseArray.length - 1; j >= 0; j--) {
			if (await isFinally(promiseArray[j])) {
				promiseArray.splice(j, 1);
			}
		}
	} 
    
    async function openCache(version) {
    	return await caches.open(version)
    }
    
    async function loadCache(cache, url) {
    	DEBUG_UPDATA && console.log(`upData.js: loadCache ${url}`)
    	return await cache.match(new Request(url, myInit))
    }
    
    async function putCache(cache, url, response) {
    	DEBUG_UPDATA && console.log(`upData.js: putCache ${url}`)
    	return await cache.put(new Request(url, myInit), response)
    }
    
    async function downloadToCache(url, cache) {
    	try{
			const response = await fetch(new Request(url.split("?")[0] + "?v=" + new Date().getTime(), myInit));
    		if (response.ok) {
    			await putCache(cache, url, response);
    			return await loadCache(cache, url)
    		}
    		else throw new Error(`response.ok = ${response.ok}`)
    	}catch(e){
    		console.error(`upData.js: downloadToCache ${e.stack}, url = ${url}`);
    		return false
    	}
    }
    
    async function saveCacheFile(url, cache, version = currentVersion) {
    	if(!checkServiceWorkerAndCaches()) return;
    	const response = await loadCache(cache, url);
    	if (response) {
    		DEBUG_UPDATA && console.info(`upData.js: saveCacheFile loaded "${url}" in cache ${version}`)
    		return true;
    	}
    	else {
    		return !!await downloadToCache(url, cache);
    	}
    }
    
    async function saveCacheFiles(urls, version = currentVersion) {
    	if(!checkServiceWorkerAndCaches()) return;
    	urls = urls.map(url => formatURL(absoluteURL(url), version));
    	
    	window.loadAnimation && (loadAnimation.open(), loadAnimation.lock(true));
    	const cache = await openCache(version);
    	
    	const numFiles = urls.length;
    	const errUrls = [];
    	const ps = [];
    	let countFiles = 0;
    	
    	const funPromise = async () => { 
    			const url = urls.shift();
    			!(await saveCacheFile(url, cache)) && errUrls.push(url);
    			window.loadAnimation && loadAnimation.text(`下载资源 ${++countFiles} / ${numFiles}`)
    		}
    		
    	while (urls.length) {
    		if (ps.length < 6) {
    			ps.push(funPromise());
    		}
    		else {
    			await Promise.race(ps);
    			await removeFinallyPromise(ps);
    		}
    	}
    	await Promise.all(ps);
    	
    	console[errUrls.length ? "error" : "warn"](`upData.js: saveCacheFiles finish ${errUrls.length} error in ${numFiles} urls \n${errUrls.join("\n")}`)
    	window.loadAnimation && (loadAnimation.lock(false),loadAnimation.close());
    }

    return {
        get removeAppCache() { return removeAppCache },
        get removeOldAppCache() { return removeOldAppCache },
        get upData() { return upData },
        get autoUpData() { return autoUpData },
        get postVersion() { return postVersion },
        get checkAppVersion() { return checkAppVersion },
        get checkScriptVersion() { return checkScriptVersion },
        get resetApp() { return resetApp },
        get fetchTXT() { return fetchTXT },
        get currentVersion() { return currentVersion},
        get saveAppVersion() { return saveAppVersion },
        get saveCacheFiles() { return saveCacheFiles },
        
        get logCache() { return logCache },
        get logCaches() { return logCaches },
        get logVersions() { return logVersions },
        get logNewVersionInfo() { return logNewVersionInfo },
    }
})()
