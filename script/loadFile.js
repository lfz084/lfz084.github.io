    
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
        });
    }

    function loadCss(url) { //加载css
        url = url.split("?")[0] + (window.URL_VERSION || "");
        const filename = url.split("/").pop().split("?")[0];
        return new Promise((resolve, reject) => {
            let head = document.getElementsByTagName('head')[0];
            let _link = document.createElement('link');
            _link.rel = "preload";
            _link.as = "style";
            _link.href = url;
            head.appendChild(_link);
            let link = document.createElement('link');
            link.type = 'text/css';
            link.rel = 'stylesheet';
            link.onload = () => {
                //log(`loadCss "${filename}"`);
                setTimeout(() => {
                    resolve()
                }, 0)
            }
            link.onerror = (event) => {
                let message = `${filename}: ${event}`;
                reject(message);
                //log(message);
            }
            link.href = url;
            head.appendChild(link);
        });
    }

    function loadFile(url, msgTitle = "loadFile_Error") { //加载文件
        url = url.split("?")[0] + (window.URL_VERSION || "");
        const filename = url.split("/").pop().split("?")[0];
        return new Promise((resolve, reject) => {
            function reqListener() {
                //log(`${msgTitle} "${filename}"`);
                setTimeout(() => {
                    resolve()
                }, 0)
            }

            function err(event) {
                let message = `${filename}: ${event}`;
                reject(message);
                //log(message);
            }
            let oReq = new XMLHttpRequest();
            oReq.addEventListener("load", reqListener);
            oReq.addEventListener("error", err);
            oReq.open("GET", url);
            oReq.send();
        });
    }

    function loadFont(url) { //加载字体文件
        return loadFile(url, "loadFont_Error");
    }

    function loadTxT(url) { //加载文件
        return loadFile(url, "loadTxT_Error");
    }

    function loadScript(url) { //加载脚本
        url = url.split("?")[0] + (window.URL_VERSION || "");
        const filename = url.split("/").pop().split("?")[0];
        return new Promise((resolve, reject) => {
            let oHead = document.getElementsByTagName('HEAD').item(0);
            let oScript = document.createElement("script");
            oHead.appendChild(oScript);
            oScript.type = "text/javascript";
            oScript.rel = "preload";
            oScript.as = "script";
            oScript.onload = () => {
                //log(`loadScript "${filename}"`);
                setTimeout(() => {
                    let key = filename.split(/[\-\_\.]/)[0];
                    window.checkScriptVersion(key)
                    setTimeout(resolve, 0)
                }, 0);
            }
            oScript.onerror = (event) => {
                let message = `${filename}: ${event}`;
                reject(message);
                //log(message,"error");
            }
            oScript.src = url;
        });
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
                                    reject(err)
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
    
    exports.createScript = createScript;
    exports.loadCss = loadCss;
    exports.loadFile = loadFile;
    exports.loadFont = loadFont;
    exports.loadTxT = loadTxT;
    exports.loadScript = loadScript;
    exports.loadAll = loadAll;
    exports.loadCssAll = loadCssAll;
    exports.loadFontAll = loadFontAll;
    exports.loadFileAll = loadFileAll;
    exports.loadScriptAll = loadScriptAll;

})))
