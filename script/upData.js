// import removeServiceWorker form "serviceWorker.js"
window.upData = (function() {
    'use strict';

    const elements = document.getElementsByTagName("version");
    const htmlVersion = elements ? elements[0].getAttribute("v") : "";
    let oldVersion = localStorage.getItem("RENJU_APP_VERSION"); // if oldVersion == null then upDate Version
    if (oldVersion != htmlVersion && htmlVersion.indexOf("up") + 1) oldVersion = null; //强制更新

    let currentVersion = oldVersion || htmlVersion;
    let updataVersion;
    //alert(`o:${oldVersion}\nc:${currentVersion}\nn:${htmlVersion}`)
    let checkVersion = true;

    async function wait(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        })
    }

    async function removeAppCache(filter = () => true) {
        if ("caches" in window) {
            const cacheNames = await caches.keys();
            cacheNames && cacheNames.map(cacheName => filter(cacheName) && caches.delete(cacheName))
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
        localStorage.removeItem("RENJU_APP_VERSION");
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
            keys.length == 0 && typeof warn == "function" && warn(`️⚠ ️缓存异常 不能离线运行 刷新一下吧!`);
            cs += `______ [${cacheName}]  ${keys.length} 个文件 ______\n\n`
            keys.forEach(request => cs += `.\t${request.url.split("/").pop()}\n`);
            cs += `_____________________\n`;
            console.log(cs);
        }
    }

    async function logCaches() {
        if ("caches" in window) {
            let cs = `_____________________\n`;
            const cachesNames = await caches.keys();
            cachesNames.length == 0 && typeof warn == "function" && warn(`️⚠ ️缓存异常 不能离线运行 刷新一下吧!`);
            cs += `________ 离线缓存 ${cachesNames.length}个 ________\n\n`
            cachesNames.forEach(cache => cs += `.\t[${cache}]\n`);
            cs += `_____________________\n`;
            console.warn(cs);
        }
    }

    function logVersions() {
        let Msg = ` checkVersion = ${checkVersion}\n`;
        Msg += `_____________________\n\n `;
        Msg += `${strLen("主页  ", 30)}  版本号: ${currentVersion}\n`;
        for (let key in window.SCRIPT_VERSIONS) {
            Msg += `${strLen(key + ".js  ", 20, "-")}  版本号: ${window.SCRIPT_VERSIONS[key]}\n`;
        }
        Msg += `_____________________\n\n `;
        console.warn(Msg)
    }

    async function checkScriptVersion(filename) {
        const ver = window.SCRIPT_VERSIONS[filename];
        mlog(`[index] \n>> checkScriptVersion \n[${[filename, ver || "undefined"]}]`);
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
        mlog("checkAppVersion ...")
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
                navigator.serviceWorker.onmessage = function(event) {
                    const MSG = event.data;
                    if (typeof MSG == "object" && MSG.type == "NEW_VERSION" && MSG.version == currentVersion) {
                        mlog("[NEW_VERSION]");
                        rm();
                    }
                    else {
                        mlog(`[${MSG}]`);
                    }
                }

                function rm() {
                    navigator.serviceWorker.onmessage = undefined;
                    clearTimeout(timer);
                    resolve();
                }
                navigator.serviceWorker.controller.postMessage({ type: "NEW_VERSION", version: currentVersion });
                timer = setTimeout(() => {
                    mlog("postVersion Timeout");
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

            function rm() {
                navigator.serviceWorker.onmessage = undefined;
                clearTimeout(timer);
                resolve(text);
            }

            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.onmessage = event => {
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

            if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                const version = await getUpDataVersion();
                if (version.isNewVersion) postUpData(version.version)
                else resolve(true)
            }
            else resolve(true)
        })
    }

    async function searchUpData() {
        if ("serviceWorker" in navigator) {
            let count = 0;
            await wait(5 * 1000);
            while (!(await upData()) && 5 > count++) {
                await wait(30 * 1000);
            }
        }
        console.info("结束更新");
    }

    function autoShowUpDataInformation() {
        function lineWrap(str) {
            return str.split(/\\n|<br>/).join("\n")
        }
        if ("localStorage" in window) {
            if (oldVersion != currentVersion && checkVersion) {
                let infoArr = window.UPDATA_INFO[currentVersion],
                    lineNum = infoArr ? infoArr.length + 7 : 1,
                    Msg = lineNum > 1 ? "\n " : "";

                localStorage.setItem("RENJU_APP_VERSION", currentVersion);
                Msg += `摆棋小工具 更新完毕`;
                if (infoArr) {
                    Msg += `\n _____________________ `;
                    Msg += `\n 版本： ${currentVersion}\n`;
                    for (let i = 0; i < infoArr.length; i++)
                        Msg += `\n${strLen(i+1, 2)}. ${lineWrap(infoArr[i])}`
                    Msg += `\n _____________________ `;
                }
                return lineNum == 1 ? warn(Msg) : msg({
                    text: Msg,
                    butNum: 2,
                    lineNum: lineNum,
                    textAlign: lineNum > 1 ? "left" : "center",
                    enterTXT: "关闭",
                    cancelTXT: "历史记录",
                    callEnter: () => {},
                    callCancel: () => { window.open("./help/renjuhelp/versionHistory.html", "helpWindow") }
                })
            }
            else Promise.resolve()
        }
        else Promise.resolve()
    }

    return {
        get removeAppCache() { return removeAppCache },
        get removeOldAppCache() { return removeOldAppCache },
        get searchUpData() { return searchUpData },
        get autoShowUpDataInformation() { return autoShowUpDataInformation },
        get postVersion() { return postVersion },
        get checkAppVersion() { return checkAppVersion },
        get checkScriptVersion() { return checkScriptVersion },
        get resetApp() { return resetApp },
        get fetchTXT() { return fetchTXT },
        get currentVersion() { return currentVersion}
    }
})()
