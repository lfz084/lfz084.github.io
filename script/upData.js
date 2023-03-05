// import removeServiceWorker form "serviceWorker.js"
window.upData = (function() {
    'use strict';

    const elements = document.getElementsByTagName("version");
    const newVersion = elements ? elements[0].getAttribute("v") : "";
    let oldVersion = localStorage.getItem("RENJU_APP_VERSION"); // if oldVersion == null then upDate Version
    if (oldVersion != newVersion && newVersion.indexOf("up") + 1) oldVersion = null; //强制更新

    let currentVersion = oldVersion || newVersion;
    //alert(`o:${oldVersion}\nc:${currentVersion}\nn:${newVersion}`)
    //window.URL_VERSION = "?v=" + currentVersion;
    let checkVersion = true;
    window.SOURCE_FILES = {
        loaders: "style/loaders.css",
        main: "style/main.css",

        PFSCMedium1_woff: "style/font/PFSCMedium1.woff",
        PFSCMedium1_ttf: "style/font/PFSCMedium1.ttf",
        PFSCHeavy1_ttf: "style/font/PFSCHeavy1.ttf",
        PFSCHeavy1_woff: "style/font/PFSCHeavy1.woff",

        debugModule: "debug/debugModule.js",
        vconsole: "debug/vconsole.min.js",

        appData: "historyGames/appData.js",

        emoji: "emoji/emoji.js",

        CheckerBoard: "CheckerBoard/CheckerBoard.js",
        image2board: "CheckerBoard/image2board.js",
        markLine: "CheckerBoard/markLine.js",
        pdf: "CheckerBoard/pdf.js",
        saveFile: "CheckerBoard/saveFile.js",
        svg: "CheckerBoard/svg.js",
        tree: "CheckerBoard/tree.js",

        loadAnimation: "script/loadAnimation.js",
        loadFile: "script/loadFile.js",
        Viewport: "script/View.js",
        Button: "script/Button.js",
        msgbox: "script/msgbox.js",
        utils: "script/utils.js",
        upData: "script/upData.js",

        TextCoder: "script/TextCoder.js",
        NoSleep: "script/NoSleep.min.js",
        IntervalPost: "script/IntervalPost.js",
        RenjuTree: "script/RenjuTree.js",

        Evaluator_wasm: "eval/Evaluator.wasm",
        EvaluatorWebassembly: "eval/EvaluatorWebassembly.js",
        EvaluatorJScript: "eval/EvaluatorJScript.js",
        Evaluator: "eval/Evaluator.js",
        worker: "eval/worker.js",
        engine: "eval/engine.js",

        TypeBuffer: "TypeBuffer/TypeBuffer.js",

        jspdf: "pdf/jspdf.umd_01.js",
        PFSCMedium: "pdf/PFSCMedium.js",
        PFSCHeavy: "pdf/PFSCHeavy.js",

        control: "renju/control.js",
        renju_js: "renju/renju.js",
        share: "renju/share.js",
        helpWindow: "renju/helpWindow.js",

        "close_svg": "pic/close.svg",
        "chevron-left_svg": "pic/chevron-left.svg",
        "close-white_svg": "pic/close-white.svg",
        "docusign-white_svg": "pic/docusign-white.svg",
        "icon_png": "https://lfz084.github.io/icon.png",
        "icon_ico": "https://lfz084.github.io/icon.ico",

        JFile: "ReadLib/script/JFile.js",
        JPoint: "ReadLib/script/JPoint.js",
        LibraryFile: "ReadLib/script/LibraryFile.js",
        MoveList: "ReadLib/script/MoveList.js",
        MoveNode: "ReadLib/script/MoveNode.js",
        Stack: "ReadLib/script/Stack.js",
        RenLibDoc: "ReadLib/script/RenLibDoc.js",
        work_ReadLib: "ReadLib/script/work_ReadLib.js",
        RenjuLib: "ReadLib/script/RenjuLib.js",
        RenLibDoc_wasm: "ReadLib/script/RenLibDoc_wasm.js",
        RenLib_wasm: "ReadLib/script/RenLib.wasm",

        IndexedDB: "IndexedDB/IndexedDB.js",

        gif: "gif/gif.js",
        gifWorker: "gif/gif.worker.js",
        gifFile: "gif/gifFile.js",
        CheckerBoardGIF: "gif/CheckerBoardGIF.js",

        '404_html': "404.html",
        renju_html: "renju.html",
    }
    window.SCRIPT_VERSIONS = {
        viewport: "???",
        button: "???",
        CheckerBoard: "???",
        control: "???",
        msgbox: "???",
        appData: "???",
        Evaluator: "???",
        engine: "???",
        worker: "???",
        renju: "???"
    };
    window.UPDATA_INFO = {
        "v0912.00": ["更新说明:增加了lib棋谱读取功能，适合读取一些小棋谱。建议打开1MB以下的棋谱，5M以内勉强可以应付。以后会支持打开更大的棋谱"],
        "v0928.02": ["支持lib棋谱增加到 30M",
                         "打开大棋谱时间缩短 30%",
                         "暂时还不支持显示对称点", ],
        "v0929.02": ["更新说明: lib 棋谱已支持显示对称点。之前因为不支持对称点，导致很多棋谱分支显示不完整的bug已被修复。"],
        "v0929.03": ["更新说明: 增加 设置 lib棋谱棋盘大小 的功能。修复了 小棋盘棋谱 不能正确显示对称点的bug"],
        "v1006.00": ["更新内容: 兼容 Rapfi制谱 保存的 lib棋谱。"],
        "v1031.02": ["重写了lib棋谱的解码程序,打开速度不再蜗牛",
                         "已经支持打开 100M 以上的lib棋谱",
                         "调整了部分按键位置"],
        "v1101.03": ["更新内容: 再次优化lib文件打开速度。",
                         "要体验快速模式,需要浏览器支持 WebAssembly"],
        "v1108.03": ["增加设置棋盘大小功能",
                         "增加设置棋盘坐标功能",
                         "暂时只支持15路棋盘计算"],
        "v1111.06": ["增加棋盘放大功能",
                         "长按棋盘边框放大/缩小",
                         "增加退出提示,防止误操作丢失数据"],
        "v1116.05": ["增加设置按钮位置功能",
                         "你可以保存5个按钮布局"],
        "v1202.12": ["修复了,浏览lib棋谱时,部分节点丢失文字标记的bug"],
        "v1623.09": ["增加无禁模式",
                         "增加3种摆棋模式"],
        "v1718.02": ["支持打开大棋谱(64位浏览器)",
                        "浏览器内存不够时,打开部分棋谱"],
        "v2015.05": ["添加lib转sgf功能"],
        "v2108.01": ["修复了解题功能的bug"],
        "v2109.00": ["输入图片支持双指缩放",
                        "添加习题编辑器（支持开宝JSON）",
                        "习题编辑器从帮助页面进入"],
        "v2109.03": ["更新制作VCF功能（导出开宝JSON）",
                        "制作VCF从帮助页面进入"]
    };

    async function removeAppCache(filter = () => true) {
        return new Promise(resolve => {
            if ("caches" in window) {
                caches.keys()
                    .then(function(cacheNames) {
                        cacheNames.map(function(cacheName) {
                            filter(cacheName) && caches.delete(cacheName);
                        })
                    })
                    .then(() => resolve())
                    .catch(err => {
                        resolve();
                        alert(`删除缓存失败，请手动删除缓存\n${err.stack}`)
                    })
            }
            else resolve()
        })
    }

    async function removeOldAppCache() {
        return removeAppCache(cacheName => cacheName != currentVersion && cacheName != newVersion)
    }

    async function resetApp() {
        await serviceWorker.removeServiceWorker()
        await removeAppCache()
    }

    function resetUpdataVersion() {
        localStorage.removeItem("RENJU_APP_VERSION");
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
            Msg += `${strLen(key + ".js  ", 20, "-")}  版本号: ${self.SCRIPT_VERSIONS[key]}\n`;
        }
        Msg += `_____________________\n\n `;
        console.warn(Msg)
    }

    async function checkScriptVersion(filename) {
        return new Promise(resolve => {
            let ver = self.SCRIPT_VERSIONS[filename];
            mlog(`[index] \n>> checkScriptVersion \n[${[filename, ver || "undefined"]}]`);
            if (ver && (ver != currentVersion)) {
                const ERR = `reload`;
                const ASK = `版本号不一致，可能影响正常运行\n_____________________\n\n${strLen("主页", 25)}版本号: ${currentVersion} \n${strLen(filename + ".js", 25)}版本号: ${self.SCRIPT_VERSIONS[filename]} \n_____________________\n\n`;
                const PS = `是否更新？\n\n${strLen("",15)}[取消] = 不更新${strLen("",10)}[确定] = 更新`;
                if (checkVersion&& confirm(ASK + PS)) {
                    resetApp()
                        .then(() => {
                            resetUpdataVersion();
                            window.reloadApp()
                        })
                        .then(resolve)
                }
                else {
                    resolve();
                    checkVersion= false;
                }
            }
            else resolve();
        })
    }

    async function checkAppVersion() {
        return new Promise(resolve => {
            mlog("checkAppVersion ...")
            if ("localStorage" in window) {
                const ASK = `有新的更新\n\n 当前版本号: ${currentVersion} \n 新的版本号: ${newVersion}\n\n`;
                const PS = `是否更新？\n\n${strLen("",15)}[取消] = 不更新${strLen("",10)}[确定] = 更新`;
                if (currentVersion != newVersion) {
                    if (confirm(ASK + PS)) {
                        serviceWorker.removeServiceWorker()
                            .then(removeOldAppCache)
                            .then(() => {
                                resetUpdataVersion();
                                window.reloadApp()
                            })
                            .then(resolve)
                    }
                    else {
                        resolve()
                        checkVersion= false;
                    }
                }
                else resolve()
            }
            else resolve()
        })
    }


    async function postVersion() {
        return new Promise(resolve => {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                let timer;
                navigator.serviceWorker.onmessage = function(event) {
                    const MSG = event.data;
                    if (typeof MSG == "object" && MSG.type == "newVersion" && MSG.version == currentVersion) {
                        mlog("[newVersion]");
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
                navigator.serviceWorker.controller.postMessage({ type: "newVersion", version: currentVersion });
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

    async function getNewVersion() {
        const txt = await fetchTXT("renju.html");
        const versionCode = (/\"v\d+\.*\d*\"\;/).exec(txt);
        const version = versionCode ? String(versionCode).split(/[\"\;]/)[1] : undefined;
        return {
            version: version,
            isNewVersion: version && version != currentVersion
        }
    }

    async function upData() { // find UpData open msg
        return new Promise((resolve, reject) => {
            function upEnd(e) {
                if (typeof e.data == "object" && e.data.cmd == "upData") {
                    if (e.data.ok) {
                        console.warn(`更新完成 ${e.data.version}`)
                        resetUpdataVersion()
                        removeOldAppCache()
                            .then(() => {})
                            .catch(() => {})
                            .then(resolve)
                    }
                    else {
                        console.error(`更新失败 ${e.data.version} : ${e.data.error}`)
                        reject()
                    }
                    navigator.serviceWorker.removeEventListener("message", upEnd);
                }
            }

            function postUpData(version) {
                console.warn(`upData ${version}`);
                navigator.serviceWorker.addEventListener("message", upEnd);
                navigator.serviceWorker.controller.postMessage({ cmd: "upData", version: version, files: Object.keys(SOURCE_FILES).map(key => absoluteURL(SOURCE_FILES[key])) });
            }

            if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                if (newVersion != currentVersion) {
                    postUpData(newVersion)
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
            if (2 > count++) upData().catch(err => setTimeout(search, TIMER_NEXT));
        }
        "serviceWorker" in navigator && setTimeout(search, 5 * 1000)
    }

    function autoShowUpDataInformation() {
        function lineWrap(str) {
            return str.split(/\\n|<br>/).join("\n")
        }
        if ("localStorage" in window) {
            if (oldVersion != currentVersion && checkVersion) {
                let infoArr = window.UPDATA_INFO[currentVersion],
                    lineNum = infoArr ? infoArr.length + 7 : 1,
                    Msg = lineNum > 1 ? "\n\t" : "";

                localStorage.setItem("RENJU_APP_VERSION", currentVersion);
                Msg += `摆棋小工具 更新完毕`;
                if (infoArr) {
                    Msg += `\n\t_____________________ `;
                    Msg += `\n\t版本： ${currentVersion}\n`;
                    for (let i = 0; i < infoArr.length; i++)
                        Msg += `\n\t${strLen(i+1, 2)}. ${lineWrap(infoArr[i])}`
                    Msg += `\n\t_____________________ `;
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
        get searchUpData() { return searchUpData },
        get autoShowUpDataInformation() { return autoShowUpDataInformation },
        get postVersion() { return postVersion },
        get checkAppVersion() { return checkAppVersion },
        get checkScriptVersion() { return checkScriptVersion },
        get resetApp() {return resetApp}
    }
})()
