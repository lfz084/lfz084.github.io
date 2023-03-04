window.exWindow = (() => {
    "use strict";
    const d = document;
    const dw = d.documentElement.clientWidth;
    const dh = d.documentElement.clientHeight;
    const winWidth = 980;
    const winHeight = winWidth * dh / dw;
    const scale = dw / 980;

    const EX_WINDOW = document.createElement("div");

    const IFRAME = document.createElement("div");
    IFRAME.setAttribute("id", "exWindow");
    EX_WINDOW.appendChild(IFRAME);

    const CLOSE_BUTTON = document.createElement("img");
    CLOSE_BUTTON.src = "./pic/close.svg";
    //CLOSE_BUTTON.setAttribute("class", "button");
    CLOSE_BUTTON.oncontextmenu = (event) => {
        event.preventDefault();
    }
    setButtonClick(CLOSE_BUTTON, closeWindow);
    EX_WINDOW.appendChild(CLOSE_BUTTON);

    let p = { x: 0, y: 0 };
    cBd.xyObjToPage(p, renjuCmddiv);

    const FONT_SIZE = sw / 28 + "px";
    const EX_WINDOW_LEFT = parseInt(renjuCmdSettings.positions[8].left) + p.x + "px";
    const EX_WINDOW_TOP = parseInt(renjuCmdSettings.positions[8].top) + p.y + "px";
    const EX_WINDOW_WIDTH = w * 5 - parseInt(FONT_SIZE) * 2 + "px";
    const EX_WINDOW_HEIGHT = h * 1.5 * 7 + h + "px";

    function resetStyle() {

        let s = EX_WINDOW.style;
        s.position = "absolute";
        s.left = EX_WINDOW_LEFT;
        s.top = EX_WINDOW_TOP;
        s.width = EX_WINDOW_WIDTH;
        s.height = EX_WINDOW_HEIGHT;
        s.zIndex = 9999;

        s = IFRAME.style;
        s.position = "absolute";
        s.left = 0;
        s.top = 0;
        s.width = EX_WINDOW_WIDTH;
        s.height = EX_WINDOW_HEIGHT;
        s.fontSize = FONT_SIZE;
        s.borderStyle = "solid";
        s.borderWidth = `${sw/260}px`;
        s.borderColor = "black";
        s.background = "white";
        s.fontWeight = "normal";
        s.padding = `${0} ${FONT_SIZE} ${0} ${FONT_SIZE}`;

        s = CLOSE_BUTTON.style;
        let sz = parseInt(EX_WINDOW_WIDTH) / 10 + "px";
        s.position = "absolute";
        s.left = (parseInt(EX_WINDOW_WIDTH) - parseInt(sz)) / 2 + "px";
        s.top = "0px";
        s.width = sz;
        s.height = sz;
        s.opacity = "0.5";
        s.backgroundColor = "#c0c0c0";
    }

    function openWindow() {
        if (EX_WINDOW.parentNode) return;
        resetStyle();
        EX_WINDOW.setAttribute("class", "showEXWindow");
        document.body.appendChild(EX_WINDOW); //插入body内，保证a标签可以工作。因为renjuCmddiv.parentNode屏蔽了浏览器触摸click
    }

    function closeWindow() {
        IFRAME.innerHTML = "";
        EX_WINDOW.setAttribute("class", "hideEXWindow");
        if (EX_WINDOW.parentNode) setTimeout(() => EX_WINDOW.parentNode.removeChild(EX_WINDOW), 350);
    }

    function setHTML(iHtml) {
        IFRAME.innerHTML = iHtml;
    }
    return {
        get innerHTML() {return setHTML},
        get open() {return openWindow},
        get close() {return closeWindow}
    }
})()
