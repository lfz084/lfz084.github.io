    var VERSION = "v2015.05";
var myInit = {
    cache: "no-store"
};
var response_err = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>404 err</title><style>body{width:800px}.main-view{word-wrap:break-word;position:absolute;top:0;left:0;right:0;bottom:0;margin:auto;width:500px;height:500px;border-radius:50px;background:#ddd;text-align:center}#info{position:absolute;top:10px;width:500px;height:250px;text-align:center}#link{position:absolute;top:260px;width:500px;height:250px;text-align:center}#refresh{font-size:70px;border-radius:50%;border:0}#refresh:hover{color:#858;opacity:.38}h1{font-size:25px;font-weight:blod;line-height:1.5}a{color:#636;font-size:26px;font-weight:blod;text-decoration:underline;line-height:1.8;cursor:pointer}a:link{color:#636;text-decoration:underline}a:visited{color:#525;text-decoration:underline}a:hover{color:#858;text-decoration:underline}a:active{color:blue;text-decoration:underline}</style></head><body><script>const HOMES = [ "https://lfz084.gitee.io/renju/", "https://lfz084.github.io/", "http://localhost:7700/" ]; const HOME = location.href.indexOf(HOMES[0]) + 1 ? HOMES[0] : location.href.indexOf(HOMES[1]) + 1 ? HOMES[1] : HOMES[2]; function clk(filename) { const URL = HOME + filename; window.open(URL, "_self"); } document.body.onload = () => { document.getElementById("refresh").onclick = () => { window.location.reload(); }; document.getElementById("home").onclick = () => { clk("index.html"); }; document.getElementById("renju").onclick = () => { clk("renju.html"); }; document.getElementById("tuya").onclick = () => { clk("tuya.html"); }; document.getElementById("url").innerHTML = window.location.href; if (window.top != window.self) document.getElementById("link").style.display = "none"; }</script><div class="main-view"><div id="info"><h1 id="url"></h1><h1>没有找到你要打开的页面</h1></br><button id="refresh">🔄</button></div><div id="link"><br><a id="home">返回主页</a></br><a id="renju">摆棋小工具</a></br><a id="tuya">五子棋涂鸦</a></br></div></div></body></html>`
// 加载进度功能。
//通过监视 fetch 事件，与窗口通信实现
let load = (() => {
    let urls = [];
    let timer = null;

    function pushURL(url) {
        if (urls.indexOf(url) < 0) {
            urls.push(url);
        }
    }

    function removeURL(url) {
        let idx = urls.indexOf(url);
        if (idx + 1) {
            urls.splice(idx, 1);
        }
    }

    function interval() {
        if (urls.length == 0) {
            clearInterval(timer);
            timer = null;
            postMsg(`load finish`);
        }
    }

    return {
        loading: (msg, client) => {
            let url = msg;
            let filename = url.split("/").pop();
            if (["worker",
                "emoji",
                "Evaluator",
                "EvaluatorJScript",
                "EvaluatorWebassembly",
                "renju",
                "IntervalPost",
                "RenjuTree",
                "TypeBuffer",
                "UNICODE2GBK",
                "JFile",
                "JPoint",
                "LibraryFile",
                "MoveList",
                "MoveNode",
                "Stack",
                "RenLibDoc",
                "work",
                "RenjuLib",
                "RenLib",
                "RenLibDoc"
            ].indexOf(filename.split(/[\-\_\.]/)[0]) + 1) return;
            if (!timer) {
                timer = setInterval(interval, 300);
            }
            postMsg(`loading......${url}`, client);
            pushURL(url);

        },
        finish: (msg) => {
            let url = msg;
            removeURL(url);
        }
    };
})();

function postMsg(msg, client) {
    if (client && typeof client.postMessage == "function") {
        client.postMessage(msg);
    }
    else {
        self.clients.matchAll().then(clients => clients.map(client => client.postMessage(msg)));
    }
}

function getUrlVersion(version) {
    return "?v=" + version;
}

function initCaches() {
    return caches.open(VERSION)
        .then(cache => cache.addAll(['./404.html']))
}

function deleteOldCaches() {
    return caches.keys().then(cacheNames =>
        Promise.all(
            cacheNames.map(cacheName =>
                // 如果当前版本和缓存版本不一致
                cacheName !== VERSION && caches.delete(cacheName)
            )
        )
    )
}

function myFetch(url, version, clientID) {
    let url_version = getUrlVersion(version);
    return new Promise((resolve, reject) => {
        let req = url == "https://lfz084.github.io/icon.ico" + url_version ?
            new Request("https://lfz084.gitee.io/renju/icon.ico" + "?v=" + new Date().getTime(), myInit) :
            url == "https://lfz084.github.io/icon.png" + url_version ?
            new Request("https://lfz084.gitee.io/renju/icon.png" + "?v=" + new Date().getTime(), myInit) :
            new Request(url, myInit),
            nRequest = new Request(req.url.split("?")[0] + "?v=" + new Date().getTime(), myInit);
        fetch(nRequest)
            .then(response => {
                load.finish(url);
                if (!response.ok) throw new Error(`response.ok = ${response.ok}, ${nRequest.url}`);
                clientID != undefined && postMsg(`下载资源完成 url=${url}`, clientID);
                let cloneRes = response.clone();
                if (url.indexOf("blob:http") == -1) {
                    caches.open(version).then(cache => cache.put(new Request(url, myInit), response))
                }
                resolve(cloneRes);
            })
            .catch(err => {
                load.finish(url);
                reject(err);
            })
    })
}

function loadCache(url, version, clientID) {
    return caches.open(version)
        .then(cache => {
            return cache.match(new Request(url, myInit))
        })
        .then(response => {
            load.finish(url);
            if (response.constructor.name != "Response") throw new Error(`response.ok = ${response.ok}, ${nRequest.url}`);
            postMsg(`加载资源完成 url=${url}`, clientID);
            return response;
        })
}

function fetchErr(err, url, version) {
    const type = url.split("?")[0].split(".").pop();
    const myHeaders = { "Content-Type": 'text/html; charset=utf-8' };
    const init = {
        status: 200,
        statusText: "OK",
        headers: myHeaders
    }
    if (["htm", "html"].indexOf(type) + 1) {
        let request = new Request("./404.html");
        postMsg(`fetchErr >> 1`)
        return caches.open(version)
            .then(cache => {
                postMsg(`fetchErr >> 2`)
                return cache.match(request);
            })
            .then(response => {
                postMsg(`fetchErr >> 3`)
                if (response.constructor.name != "Response") throw new Error("");
                return response;
            })
            .catch(() => {
                postMsg(`fetchErr >> 4`)
                return new Response(response_err, init)
            })
    }
    else {
        return Promise.reject(err);
    }
}

function cacheFirst(url, version, clientID) {
    return loadCache(url, version, clientID)
        .catch(() => {
            //postMsg(`没有缓存，从网络下载资源 url=${_URL}`, clientID);
            return myFetch(url, version, clientID);
        })
        .catch(err => {
            //postMsg(`404.html ${err.message}`, clientID);
            return fetchErr(err, url, version);
        })
}

function netFirst(url, version, clientID) {
    return myFetch(url, version, clientID)
        .catch(() => {
            return loadCache(url, version, clientID)
        })
        .catch(err => {
            return fetchErr(err, url, version)
        })
}

function upData(files, version, clientID) {
    return new Promise((resolve, reject) => {
        let count = 0,
            maxCount = files.length;
        function nextFile() {
            if (files.length) {
                let url = files.shift();
                postMsg(`upData file: ${url}`)
                cacheFirst(url, version, clientID)
                    .then(() => setTimeout(nextFile, 100))
                    .catch(() => {
                        if (count++ < maxCount) {
                            files.push(url); 
                            setTimeout(nextFile, 100)
                        }
                        else reject()
                    })
            }
            else {
                resolve()
            }
        }
        
        caches.open(version)
            .then(cache => cache.keys())
            .then(keys => {
                for (let i = 0; i < keys.length; i++) {
                    let index = files.indexOf(keys[i].url)
                    if (index + 1) files.splice(index, 1)
                }
            })
            .then(nextFile)
    })
}


// 缓存
self.addEventListener('install', function(event) {
    //postMsg(`service worker install...`, event.clientID);
    self.skipWaiting();
    /*
    event.waitUntil(
        initCaches()
    );*/
});

// 缓存更新
self.addEventListener('activate', function(event) {
    //postMsg(`service worker activate...`, event.clientID);
    /*event.waitUntil(
        deleteOldCaches()
    );*/
});

// 捕获请求并返回缓存数据
self.addEventListener('fetch', function(event) {

    const URL_VERSION = getUrlVersion(VERSION);
    const _URL = event.request.url.split("?")[0] + URL_VERSION;
    const filename = _URL.split("?")[0].split("/").pop();
    const type = _URL.split("?")[0].split(".").pop();
    const NEW_CACHE = ["html", "htm"].indexOf(type) + 1 > 0;
    if (filename.indexOf(type) + 1) {
        load.loading(_URL, event.clientID);
    }
    else {
        postMsg(`fetch [${_URL}]`, event.clientID);
    }
    //postMsg(`请求资源 url=${_URL}`, event.clientID);
    /*
    if (NEW_CACHE)
        event.respondWith(netFirst())
    else*/
    event.respondWith(cacheFirst(_URL, VERSION, event.clientID))
});

self.addEventListener('message', function(event) {
    if (typeof event.data == "object") {
        if (event.data.type == "NEW_VERSION") {
            if (event.data.version != VERSION) {
                VERSION = event.data.version;
                myInit = {
                    cache: "no-store"
                };
            }
            postMsg(event.data, event.clientID)
        }
        else if (event.data.cmd == "upData") {
            let version = event.data.version,
                files = event.data.files.map(url => url.split("?")[0] + getUrlVersion(version));
            upData(files, version, event.clientID)
                .then(() => {
                    postMsg({ cmd: "upData", ok: true, version: version }, event.clientID)
                })
                .catch(err => {
                    postMsg({ cmd: "upData", ok: false, version: version, error: err }, event.clientID)
                })
        }
        else if (event.data.cmd == "fetchTXT") {
            let url = event.data.url.split("?")[0];
            //postMsg(`fetchTXT: ${url}`)
            fetch(new Request(url, myInit))
                .then(response => {
                    return response.ok ? response.text() : Promise.reject(`response.ok = ${response.ok}`)
                })
                .then(text => {
                    postMsg({ type: "text", text: text }, event.clientID)
                })
                .catch(err => {
                    postMsg({ type: "text", text: `${err}` }, event.clientID)
                })
        }
    }
    else {
        postMsg(`serverWorker post: ${event.data}`, event.clientID)
    }
});
