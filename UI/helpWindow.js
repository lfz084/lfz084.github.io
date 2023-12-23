(function createHelpWindow() {
    "use strict";
    let busy = false;
    const dw = document.documentElement.clientWidth;
    const dh = document.documentElement.clientHeight;
    const gridWidth = 980;
    const tempWidth = gridWidth * (dw > dh ? 2 : 1);
    const scale = dw / (dw / dh > 2 ? dw / dh * gridWidth : tempWidth);
    const winWidth = dw / scale;
    const winHeight = dh / scale;
    const padding = dw > dh ? winWidth / 2 : winHeight / 2;
    
    const FULL_DIV = document.createElement("div");
    document.body.appendChild(FULL_DIV);
    FULL_DIV.style.zIndex = -99999;
    FULL_DIV.style.display = "none";

    const WIN_DIV = document.createElement("div");
    FULL_DIV.appendChild(WIN_DIV);

    const IFRAME_DIV = document.createElement("div");
    IFRAME_DIV.setAttribute("id", "wrapper");
    WIN_DIV.appendChild(IFRAME_DIV);

    const IFRAME = document.createElement("iframe");
    IFRAME.setAttribute("id", "helpWindow");
    IFRAME.setAttribute("name", "helpWindow");
    IFRAME_DIV.appendChild(IFRAME);

    const BUT_DIV = document.createElement("div");
    WIN_DIV.appendChild(BUT_DIV);

    const ICO_BACK = document.createElement("img");
    BUT_DIV.appendChild(ICO_BACK);
    ICO_BACK.src = "./pic/chevron-left.svg";
    //ICO_BACK.setAttribute("class", "button");
    ICO_BACK.oncontextmenu = (event) => {
        event.preventDefault();
    };
    setButtonClick(ICO_BACK, () => {
        IFRAME.src = "./help/renjuhelp/renjuhelp.html";
    });

    const ICO_CLOSE = document.createElement("img");
    BUT_DIV.appendChild(ICO_CLOSE);
    ICO_CLOSE.src = "./pic/close.svg";
    //ICO_CLOSE.setAttribute("class", "button");
    ICO_CLOSE.oncontextmenu = (event) => {
        event.preventDefault();
    }
    setButtonClick(ICO_CLOSE, closeHelpWindow);

    const CHILD_WINDOW = IFRAME.contentWindow;
    let getDocumentHeight = () => {};
    let getScrollPoints = () => {};

    function getScrollY() {
        return IFRAME_DIV.scrollTop;
    }

    function setScrollY(top) {
        //log(`IFRAME_DIV setScrollY, ${top}`)
        IFRAME_DIV.scrollTop = top;
    }

    function openHelpWindow(url) {
        if (busy) return;
        busy = true;
        let s = FULL_DIV.style;
        s.position = "fixed";
        s.backgroundColor = "#666";
        s.left = 0 + "px";
        s.top = 0 + "px";
        s.width = winWidth + padding * 2 + "px";
        s.height = winHeight + padding * 2 + "px";
        s.transformOrigin = `${0}px ${0}px`;
        s.transform = `scale(${scale})`;

    	s = WIN_DIV.style;
        s.backgroundColor = "#666";
        s.position = "relative";
        s.left = (winWidth * (window.fullscreenUIWidth || document.documentElement.clientWidth) / dw - 820) / 2 + "px";
        s.top = (winHeight * (window.fullscreenUIHeight || document.documentElement.clientHeight) / dh - winHeight) / 2 + "px";
        s.width = 820 + "px";
        s.height = winHeight + "px";

        s = IFRAME_DIV.style;
        s.backgroundColor = "#ddd";
        s.position = "absolute";
        s.left = 10 + "px";
        s.top = 10 + "px";
        s.width = 800 + "px";
        s.height = parseInt(WIN_DIV.style.height) + "px";
        //s.zIndex = -1;

        s = IFRAME.style;
        s.backgroundColor = "#ddd";
        s.position = "absolute";
        s.left = 0 + "px";
        s.top = 0 + "px";
        s.width = "800px";
        s.height = s.height || "100%"; //保存旧高度，防止滚到顶部

        s = BUT_DIV.style;
        s.position = "absolute";
        s.left = (820 - 197) / 2 + "px";
        s.top = parseInt(WIN_DIV.style.height) - 78 - 3 + "px";
        s.width = "197px";
        s.height = "78px";
        s.opacity = "0.5";
        s.zIndex = 99999;

        s = ICO_BACK.style;
        s.backgroundColor = "#c0c0c0";
        s.position = "absolute";
        s.left = 0 + "px";
        s.top = 0 + "px";
        s.width = "78px";
        s.height = "78px";
        s.borderStyle = "solid";
        s.borderColor = "#fff";
        s.borderWidth = "0px";

        s = ICO_CLOSE.style;
        s.backgroundColor = "#c0c0c0";
        s.position = "absolute";
        s.left = 117 + "px";
        s.top = 0 + "px";
        s.width = "78px";
        s.height = "78px";
        s.borderStyle = "solid";
        s.borderColor = "#fff";
        s.borderWidth = "0px";

        FULL_DIV.style.display = "block";
        FULL_DIV.style.zIndex = 99999;
        WIN_DIV.setAttribute("class", "show");

        if (IFRAME.src.indexOf(url) + 1) {
            IFRAME.src = url; //保持上次滚动值，防止滚到顶部
            IFRAME.contentWindow.onhashchange(); //onhashchange 滚动目标元素到可视区域
        }
        else {
            IFRAME.src = url;
        }
    }

    function closeHelpWindow() {
        WIN_DIV.setAttribute("class", "hide");
        setTimeout(() => {
            FULL_DIV.style.zIndex = -99999;
            FULL_DIV.style.display = "none";
            //IFRAME.src = "";
            busy = false;
        }, 500);
    }

    IFRAME.onload = () => {
        if (navigator.userAgent.indexOf("iPhone") < 0) return;
        const SRC = IFRAME.contentWindow.location.href;

        getDocumentHeight = (() => { //添加结束标记，准确判断文档高度

            let iDoc = IFRAME.Document || IFRAME.contentWindow.document;
            const MARK_END = iDoc.createElement("a");
            iDoc.body.appendChild(MARK_END);
            return () => {
                return CHILD_WINDOW.getAbsolutePos(MARK_END).y;
            }
        })();

        getScrollPoints = CHILD_WINDOW.getScrollPoints;
        if (navigator.userAgent.indexOf("iPhone") + 1) {
            CHILD_WINDOW.setScrollY = setScrollY;
            CHILD_WINDOW.getScrollY = getScrollY;
            const temp = CHILD_WINDOW.scrollToAnimation;
            CHILD_WINDOW.scrollToAnimation = (top) => {
                //alert(`>>>parent animationFrameScroll ${getDocumentHeight()}`)
                temp(top);
            }
        };

        CHILD_WINDOW.setScrollHeight = () => {
            IFRAME.style.height = getDocumentHeight() + "px";
        };

        CHILD_WINDOW.setScrollHeight();
    }


    const tempF = window.open;
    window.open = (url, target) => {
        //log(`url=${url}, target=${target}`)
        if (target == "helpWindow") {
            openHelpWindow(url);
        }
        else {
            tempF(url, target);
        }
    }
})()
