'use strict';
// loaders.css
window.loadAnimation = (function() { //控制加载动画
    let timer = null;
    const WIN_LOADING = document.createElement("div"),
        ANIMA = document.createElement("div"),
        LABEL = document.createElement("div"),
        DW = document.documentElement.clientWidth,
        DH = document.documentElement.clientHeight;
    const triangle = `<div class="center-body"><div class="loader-ball-51"><div></div><div></div><div></div></div></div>`,
        ball = `<div class="center-body"><div class="loader-ball-38"><div></div><div></div><div></div><div></div><div></div></div></div>`,
        black_white = `<div class="center-body"><div class="loader-ball-11"></div></div>`,
        busy = `<div class="center-body"><div class="loader-circle-101"></div></div>`;
    const ANIMA_NANE = {
        "triangle": triangle,
        "ball": ball,
        "black_white": black_white,
        "busy": busy,
    }
    let lock = false;
    let s = WIN_LOADING.style;
    s.position = "fixed";
    s.width = "150px";
    s.height = "150px";
    s.left = (DW - 150) / 2 + "px";
    s.top = (DH - 150) / 2 + "px";
    s.zIndex = 0xffffff;
    s.transform = `scale(${Math.min(DW, DH)/430})`;
    WIN_LOADING.setAttribute("class", "finish");

    s = ANIMA.style;
    s.position = "absolute";
    s.width = "150px";
    s.height = "150px";
    s.left = "0px";
    s.top = "0px";
    WIN_LOADING.appendChild(ANIMA);

    s = LABEL.style;
    s.position = "absolute";
    s.width = "150px";
    s.height = "25px";
    s.left = "0px";
    s.top = "150px";
    s.fontSize = "15px";
    s.textAlign = "center";
    s.lineHeight = "25px";
    s.background = "none";
    s.opacity = 0.7;
    WIN_LOADING.appendChild(LABEL);

    return {
        open: (animaName, _timeout) => { //打开动画
            if (lock) return
            //log("loadAnimation.open","warn");
            if (!WIN_LOADING.parentNode) {
                ANIMA.innerHTML = ANIMA_NANE[animaName] || black_white;
                document.body.appendChild(WIN_LOADING);
            }
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                if (!lock && WIN_LOADING.parentNode) WIN_LOADING.parentNode.removeChild(WIN_LOADING);
            }, _timeout || 30 * 1000);
        },
        close: () => { //关闭动画
            if (lock) return
            //log("loadAnimation.close","warn");
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                if (WIN_LOADING.parentNode) WIN_LOADING.parentNode.removeChild(WIN_LOADING);
                LABEL.innerHTML = "";
                LABEL.style.background = "none";
            }, 500);
        },
        lock: (value = false) => { lock = value }, //锁定后，不开打开或关闭
        text: (text = "") => { //动画标题，可以用来显示进度百分百
            LABEL.innerHTML = text;
            if (text) LABEL.style.background = "white";
        },
    };
})();

"serviceWorker" in navigator && navigator.serviceWorker.addEventListener("message", event => {
    if (typeof event.data == "string") {
        const MSG = event.data;
        if (MSG.indexOf("loading...") + 1) {
            loadAnimation.open();
            console.info(`open`);
        }
        else if (MSG.indexOf("load finish") + 1) {
            loadAnimation.close();
            console.info(`close`);
        }
    }
})