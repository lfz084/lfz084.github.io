(function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    'use strict';

    Promise.queue = function(thenables) { // 顺序执行 thenable
        return new Promise((resolve, reject) => {
            function nextPromise() {
                if (thenables.length) {
                    let t = thenables[0];
                    thenables.splice(0, 1);
                    Promise.resolve(t)
                        .then(nextPromise)
                        .catch(reject)
                }
                else {
                    return resolve();
                }
            }
            nextPromise();
        })
    }

    function createScript(code) { // 用code 创建脚步
        return new Promise((resolve, reject) => {
            let oHead = document.getElementsByTagName('HEAD').item(0);
            let oScript = document.createElement("script");
            oHead.appendChild(oScript);
            oScript.type = "text/javascript";
            oScript.text = code;
            setTimeout(resolve, 100);
        })
    }

    function loadCss(url) { //加载css
        url = url.split("?")[0];
        const filename = url.split("/").pop().split("?")[0];
        return new Promise((resolve, reject) => {
            const head = document.getElementsByTagName('head')[0];
            const link = document.createElement('link');
            link.type = 'text/css';
            link.rel = 'stylesheet';
            link.onload = () => setTimeout(resolve, 0);
            link.onerror = () => reject(`加载css出错: ${filename}`);
            link.href = url;
            head.appendChild(link);
        })
    }

    function loadFile(url, responseType = "text") { //加载文件
        url = url.split("?")[0];
        const filename = url.split("/").pop().split("?")[0];
        return new Promise((resolve, reject) => {
            const oReq = new XMLHttpRequest();
            oReq.responseType = responseType;
            oReq.addEventListener("load", () => setTimeout(resolve, 0, oReq.response));
            oReq.addEventListener("error", () => reject(`加载文件出错: ${filename}`));
            oReq.open("GET", url);
            oReq.send();
        })
    }

    function loadFont(url) { //加载字体文件
        return loadFile(url, "arraybuffer");
    }

    function loadTxT(url) {
        return loadFile(url, "text");
    }
    
    function loadJSON(url) {
        return loadFile(url, "json");
    }

    function loadScript(url) { //加载脚本
        url = url.split("?")[0];
        const filename = url.split("/").pop().split("?")[0];
        return new Promise((resolve, reject) => {
            const oHead = document.getElementsByTagName('HEAD').item(0);
                const oScript = document.createElement("script");
                oHead.appendChild(oScript);
                oScript.type = "text/javascript";
                oScript.rel = "preload";
                oScript.as = "script";
                oScript.onload = () => {
                    setTimeout(() => {
                        const ver = filename.split(/[\-\_\.]/)[0];
                        upData.checkScriptVersion(ver);
                        resolve();
                    }, 0);
                }
                oScript.onerror = (event) => {
                    reject(`加载Script出错: ${filename}`)
                }
                oScript.src = url;
        })
    }

    function createThenable(loadFun, fileName, callback) { // 返回thenable
        return {
            then: function(onFulfill, onReject) {
                onFulfill(
                    Promise.resolve()
                    .then(() => {
                        return new Promise((resolve, reject) => {
                            function _timeout() {
                                reject(`Error: 连接网络超时\n文件"${fileName}"下载失败`);
                            }
                            setTimeout(_timeout, 60 * 1000);
                            loadFun(fileName)
                                .then(resolve)
                                .catch(reject)
                        })
                    })
                    .then(() => {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                try {
                                    let p;
                                    if (typeof callback == "function") p = callback();
                                    if (typeof p == "object" &&
                                        typeof p.then == "function" &&
                                        typeof p.catch == "function") {
                                        p.then(resolve).catch(reject) // p == Promise
                                    }
                                    else {
                                        resolve();
                                    }
                                }
                                catch (err) {
                                    reject(err.stack)
                                }
                            }, 0)
                        });
                    })
                )
            },
        };
    }

    function createThenables(loadFun, config) {
        let ts = [];
        for (let i = 0; i < config.length; i++) {
            ts.push(createThenable(loadFun, config[i][0], config[i][1]));
        }
        return ts;
    }

    function loadAll(loadFun, config, ayc = false) {
        const thenables = createThenables(loadFun, config);
        if (ayc) {
            let ps = [];
            for (let i = 0; i < thenables.length; i++) {
                ps.push(Promise.resolve(thenables[i]));
            }
            return Promise.all(ps);
        }
        else {
            return Promise.queue(thenables);
        }
    }

    function loadCssAll(config, ayc = false) {
        return loadAll(loadCss, config, ayc);
    }

    function loadFontAll(config, ayc = false) {
        return loadAll(loadFont, config, ayc);
    }

    function loadFileAll(config, ayc = false) {
        return loadAll(loadFile, config, ayc);
    }

    function loadScriptAll(config, ayc = false) {
        return loadAll(loadScript, config, ayc);
    }

    async function loadSources(sources) {
        try {
            const fun = {
                cssAll: loadCssAll,
                fileAll: loadFileAll,
                fontAll: loadFontAll,
                scriptAll: loadScriptAll
            }
            "loadAnimation" in window == false && await loadScript("script/loadAnimation.js");
            loadAnimation.open();
            loadAnimation.lock(true);
            let source;
            while (source = sources.shift()) {
                loadAnimation.text(source.progress);
                console.info(source.progress);
                await fun[source.type](source.sources, source.isAsync);
            }
            loadAnimation.lock(false);
            loadAnimation.close();
        } catch (e) {
            return Promise.reject(e.stack)
        }
    }

    exports.createScript = createScript;
    exports.loadCss = loadCss;
    exports.loadTxT = loadTxT;
    exports.loadJSON = loadJSON;
    exports.loadFile = loadFile;
    exports.loadFont = loadFont;
    exports.loadScript = loadScript;
    exports.loadAll = loadAll;
    exports.loadCssAll = loadCssAll;
    exports.loadFontAll = loadFontAll;
    exports.loadFileAll = loadFileAll;
    exports.loadScriptAll = loadScriptAll;
    exports.loadSources = loadSources;
})))
