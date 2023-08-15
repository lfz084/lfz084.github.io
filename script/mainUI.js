// import View from "./View.js"
// import xyObjToPage from "./utils.js"

window.mainUI = (function() {
    'use strict';
    const debug = 0

    //--------------------------- 设置主界面框架，调整窗口比例 --------------------------------------------------

    const d = document;
    const dw = d.documentElement.clientWidth;
    const dh = d.documentElement.clientHeight;

    const gridWidth = 980;
    const gridPadding = ~~(gridWidth * 0.025)
    const cmdWidth = ~~(gridWidth * 0.95); //cBoard width = 1024
    const cmdPadding = cmdWidth * 0.065;
    const bodyWidth = dw < dh ? gridWidth : Math.max(gridWidth * 2, gridWidth * dw / dh); //bodyDiv width
    const bodyHeight = dw < dh ? gridWidth * 4 : Math.max(gridWidth, gridWidth * 2 * dh / dw);
    const bodyLeft = 0;
    const bodyTop = 0;
    const bodyScale = dw / bodyWidth;
    const upDivLeft = dw < dh ? 0 : (bodyWidth - gridWidth * 2) / 2;
    const upDivTop = dw < dh ? gridWidth : (bodyHeight - gridWidth) / 2;
    const downDivLeft = dw < dh ? upDivLeft : upDivLeft + gridWidth;
    const downDivTop = dw < dh ? upDivTop + gridWidth : upDivTop;
    const sw = ~~(cmdWidth * 0.87);
    const buttonWidth = sw / 5;
    const buttonHeight = sw / 9 / 1.5;
    const menuWidth = sw * 0.8;
    const menuLeft = upDivLeft + (gridWidth - menuWidth) / 2;
    const menuFontSize = sw / 20;

    const viewport = new View();
    document.body.style.padding = "0";
    document.body.style.margin = "0";

    const bodyDiv = d.createElement("div");
    d.body.appendChild(bodyDiv);
    bodyDiv.style.position = "absolute";
    bodyDiv.style.width = `${bodyWidth}px`;
    bodyDiv.style.height = `${bodyHeight}px`;
    bodyDiv.style.left = `${bodyLeft}px`;
    bodyDiv.style.top = `${bodyTop}px`;
    bodyDiv.style.opacity = "0";
    bodyDiv.style.transformOrigin = `0px 0px`;
    bodyDiv.style.transform = `scale(${bodyScale})`;
    bodyDiv.setAttribute("id", "bodyDiv");
    bodyDiv.setAttribute("class", "finish");
    setTimeout(() => { bodyDiv.style.opacity = "1" }, 300);
    debug && (bodyDiv.style.backgroundColor = "red");

    const upDiv = d.createElement("div");
    bodyDiv.appendChild(upDiv);
    upDiv.style.position = "absolute";
    upDiv.style.width = `${gridWidth}px`;
    upDiv.style.height = `${gridWidth}px`;
    upDiv.style.left = `${upDivLeft}px`;
    upDiv.style.top = `${upDivTop}px`;
    upDiv.setAttribute("id", "upDiv");
    debug && (upDiv.style.backgroundColor = "green");

    const p = { x: 0, y: 0 };
    const markTop = d.createElement("div");
    document.body.appendChild(markTop);
    markTop.style.position = "absolute";
    markTop.style.top = `${xyObjToPage(p, upDiv).y*dw / bodyWidth}px`;
    markTop.setAttribute("id", "top");
    !debug && (markTop.style.zIndex = -100);
    debug && (markTop.style.width = "50px");
    debug && (markTop.style.height = "50px");
    debug && (markTop.style.backgroundColor = "yellow");

    const downDiv = d.createElement("div");
    bodyDiv.appendChild(downDiv);
    downDiv.style.position = "absolute";
    downDiv.style.width = `${gridWidth}px`;
    downDiv.style.height = `${gridWidth}px`;
    downDiv.style.left = `${downDivLeft}px`;
    downDiv.style.top = `${downDivTop}px`;
    downDiv.setAttribute("id", "downDiv");
    debug && (downDiv.style.backgroundColor = "blue");

    const settings = [];
    createSettings();

    //---------------------  生成按键布局  ---------------------------------

    function createSettings() {
        let t = dw < dh ? 0 - cmdWidth - buttonHeight * 2.5 : 0;
        const buttonSettings = [];
        const marktopSetting = {};
        for (let i = 0; i < 15; i++) { // set positions
            if (i === 0) {
                if (dw < dh) {
                    t = 0 - gridWidth - buttonHeight * 1.5;
                    const p = { x: 0, y: gridPadding - buttonHeight * 1.5 };
                    marktopSetting.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
                }
                else {
                    t = buttonHeight * 1.2;
                    const p = { x: 0, y: 0 };
                    marktopSetting.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
                }
            }
            else if (i === 1) {
                if (dw < dh)
                    t = buttonHeight * 0;
                else
                    t += buttonHeight * 1.5;
            }
            else {
                t += buttonHeight * 1.5;
            }
            for (let j = 0; j < 4; j++) {
                buttonSettings.push({
                    left: ~~(cmdPadding + buttonWidth * j * 1.33),
                    top: ~~t,
                    width: ~~buttonWidth,
                    height: ~~buttonHeight
                });
            }
        }
        settings.push({ buttonSettings: buttonSettings, marktopSetting: marktopSetting });

        const buttonSettings1 = [];
        const marktopSetting1 = [];
        for (let i = 0; i < 15; i++) { // set positions
            if (i === 0) {
                if (dw < dh) {
                    t = buttonHeight * 0;
                    const p = { x: 0, y: 0 };
                    marktopSetting1.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
                }
                else {
                    t = buttonHeight * 1.2;
                    const p = { x: 0, y: 0 };
                    marktopSetting1.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
                }
            }
            else {
                t += buttonHeight * 1.5;
            }
            for (let j = 0; j < 4; j++) {
                buttonSettings1.push({
                    left: ~~(cmdPadding + buttonWidth * j * 1.33),
                    top: ~~t,
                    width: ~~buttonWidth,
                    height: ~~buttonHeight
                });
            }
        }
        settings.push({ buttonSettings: buttonSettings1, marktopSetting: marktopSetting1 });
    }

    //----------------------- CheckerBoard  -------------------------------------------------


    function createCBoard() {
        const cbd = new CheckerBoard(upDiv, (gridWidth - cmdWidth) / 2, (gridWidth - cmdWidth) / 2, cmdWidth, cmdWidth);
        cbd.backgroundColor = "white";
        cbd.resetCBoardCoordinate();
        cbd.printEmptyCBoard();
        cbd.bodyScale = bodyScale;
        return cbd;
    }

    function createMiniBoard() {
        const width = buttonHeight * 7;
        const left = (cmdWidth / 2 - width) / 1.5;
        const top = dw > dh ? buttonHeight * (1.2 + 3) : buttonHeight * 1.5;
        const cbd = new CheckerBoard(upDiv, left, top, width, width);
        cbd.backgroundColor = "white";
        cbd.resetCBoardCoordinate();
        cbd.printEmptyCBoard();
        cbd.viewBox.style.zIndex = -1;
        cbd.bodyScale = bodyScale;
        return cbd;
    }

    //----------------------- Menu -----------------------------------------------------------

    function autoMenuHeight(button) {
        return Math.min(gridWidth * 0.8, (menuFontSize * 2.5 + 3) * (button.input.length + 2));
    }

    function autoMenuTop(button) {
        return (bodyHeight - ((button.menu && button.menu.menuHeight) || autoMenuHeight(button))) / 2;
    }

    function createMenu(button) {
        button.createMenu(menuLeft + (dw > dh ? gridWidth : 0), autoMenuTop(button), menuWidth, autoMenuHeight(button), menuFontSize, true, undefined, bodyScale);
    }

    function createConTextMenu(parentNode, options = [], onchange = () => {}) {
        const button = new Button(parentNode, "select", 0, 0, buttonWidth, buttonHeight);
        button.index = -1;
        button.addOptions(options);
        button.setonchange(onchange);
        button.createMenu(menuLeft, autoMenuTop(button), menuWidth, autoMenuHeight(button), menuFontSize, true, iphoneCancelClick.isCancel, bodyScale);
        return button.menu;
    }

    //----------------------- button  -----------------------------------------------------------

    function createButtons(settings) {
        const buttons = [];
        settings.map(setting => {
            if (setting) {
                if (setting.type == "div") {
                    buttons.push(setting);
                }
                else {
                    buttons.push(new Button(document.body, setting.type, 0, 0, mainUI.buttonWidth, mainUI.buttonHeight));
                    const button = buttons[buttons.length - 1];
                    setting.text && button.setText(setting.text);
                    setting.accept && (button.input.accept = setting.accept);
                    setting.touchend && button.setontouchend(setting.touchend);
                    setting.change && button.setonchange(setting.change);
                    setting.options && button.addOptions(setting.options);
                    setting.type == "select" && mainUI.createMenu(button);
                }
            }
            else buttons.push(undefined);
        })
        return buttons;
    }

    function addButtons(buttons, cmdDiv, settingIndex = 0) {
        const buttonSettings = settings[settingIndex].buttonSettings;
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i] && buttons[i].move) {
                    if (buttons[i].type == "div" || buttons[i].type == "canvas") buttons[i].move(buttonSettings[i].left, buttonSettings[i].top, buttons[i].width, buttons[i].height, cmdDiv);
                    else buttons[i].move(buttonSettings[i].left, buttonSettings[i].top, buttonSettings[i].width, buttonSettings[i].height, cmdDiv);
                }
            }
            markTop.style.top = `${settings[settingIndex].marktopSetting.top}px`;
    }

    //----------------------------- logDiv  ------------------------------- 

    function move(left = this.left, top = this.top, width = this.width, height = this.height, parentNode = this.parentNode) {
        const elem = this.viewElem;
        parentNode.appendChild(elem);
        elem.style.position = "absolute";
        elem.style.height = height + "px";
        elem.style.width = width + "px";
        elem.style.left = left + "px";
        elem.style.top = top + "px";
    }

    function createLogDiv(param) {
        const elem = document.createElement(param.type);
        for (let key in param.style) {
            elem.style[key] = param.style[key];
        }
        elem.setAttribute("id", param.id);
        "function" === typeof param.click && setButtonClick(elem, param.click);
        return {
            type: param.type,
            viewElem: elem,
            move: move,
            left: param.left,
            top: param.top,
            width: param.width,
            height: param.height
        }
        return elem;
    }

    //----------------------------- exWindow  ------------------------------- 

    function createEXWindow() {
        const parentNode = downDiv;
        const BORDER_WIDTH = 5;
        const FONT_SIZE = 38;
        const EX_WINDOW_LEFT = gridPadding;
        const EX_WINDOW_TOP = buttonHeight * 3;
        const EX_WINDOW_WIDTH = cmdWidth;
        const EX_WINDOW_HEIGHT = cmdWidth - buttonHeight * 3;

        const exWindow = document.createElement("div");
        const iframe = document.createElement("div");
        iframe.setAttribute("id", "exWindow");
        exWindow.appendChild(iframe);
        const closeButton = document.createElement("img");
        closeButton.src = "./pic/close.svg";
        //closeButton.setAttribute("class", "button");
        closeButton.oncontextmenu = (event) => event.preventDefault();
        setButtonClick(closeButton, closeWindow);
        exWindow.appendChild(closeButton);

        function resetStyle() {

            let s = exWindow.style;
            s.position = "absolute";
            s.left = `${EX_WINDOW_LEFT}px`;
            s.top = `${EX_WINDOW_TOP}px`;
            s.width = `${EX_WINDOW_WIDTH}px`;
            s.height = `${EX_WINDOW_HEIGHT}px`;
            s.zIndex = 9999;

            const PADDING = 50;
            s = iframe.style;
            s.position = "absolute";
            s.left = 0;
            s.top = 0;
            s.width = `${EX_WINDOW_WIDTH - PADDING * 2 - BORDER_WIDTH * 2}px`;
            s.height = `${EX_WINDOW_HEIGHT - PADDING * 2 - BORDER_WIDTH * 2}px`;
            s.fontSize = `${FONT_SIZE}px`;
            s.borderStyle = "solid";
            s.borderWidth = `${BORDER_WIDTH}px`;
            s.borderColor = "black";
            s.background = "white";
            s.fontWeight = "normal";
            s.padding = `${PADDING}px ${PADDING}px ${PADDING}px ${PADDING}px`;

            const sz = FONT_SIZE * 2;
            s = closeButton.style;
            s.position = "absolute";
            s.left = (cmdWidth - sz) / 2 + "px";
            s.top = "0px";
            s.width = sz + "px";
            s.height = sz + "px";
            s.opacity = "0.5";
            s.backgroundColor = "#c0c0c0";
        }

        function openWindow() {
            if (exWindow.parentNode) return;
            resetStyle();
            exWindow.setAttribute("class", "showEXWindow");
            parentNode.appendChild(exWindow);
        }

        function closeWindow() {
            iframe.innerHTML = "";
            exWindow.setAttribute("class", "hideEXWindow");
            if (exWindow.parentNode) setTimeout(() => exWindow.parentNode.removeChild(exWindow), 350);
        }

        function setHTML(iHtml) {
            iframe.innerHTML = iHtml;
        }

        function getHTML() {
            return iframe.innerHTML;
        }

        return {
            set innerHTML(iHtml) { setHTML(iHtml) },
            get innerHTML() { return getHTML() },
            get open() { return openWindow },
            get close() { return closeWindow }
        }
    }

    //----------------------------- cmdDiv  ------------------------------- 

    function createCmdDiv() {
        const cmdDiv = d.createElement("div");
        downDiv.appendChild(cmdDiv);
        cmdDiv.style.position = "absolute";
        cmdDiv.style.width = `${cmdWidth}px`;
        cmdDiv.style.height = `${cmdWidth}px`;
        cmdDiv.style.left = `${(gridWidth - cmdWidth) / 2}px`;
        cmdDiv.style.top = `${(gridWidth - cmdWidth) / 2}px`;
        debug && (cmdDiv.style.backgroundColor = "white");
        return cmdDiv;
    }

    //----------------------------- exports ------------------------------- 

    const exports = {}
    Object.defineProperty(exports, "bodyWidth", { value: bodyWidth });
    Object.defineProperty(exports, "bodyHeight", { value: bodyHeight });
    Object.defineProperty(exports, "bodyScale", { value: bodyScale });
    Object.defineProperty(exports, "upDivLeft", { value: upDivLeft });
    Object.defineProperty(exports, "upDivTop", { value: upDivTop });
    Object.defineProperty(exports, "downDivLeft", { value: downDivLeft });
    Object.defineProperty(exports, "downDivTop", { value: downDivTop });
    Object.defineProperty(exports, "gridWidth", { value: gridWidth });
    Object.defineProperty(exports, "gridPadding", { value: gridPadding });
    Object.defineProperty(exports, "boardWidth", { value: cmdWidth });
    Object.defineProperty(exports, "boardPadding", { value: cmdPadding });
    Object.defineProperty(exports, "cmdWidth", { value: cmdWidth });
    Object.defineProperty(exports, "cmdPadding", { value: cmdPadding });
    Object.defineProperty(exports, "buttonWidth", { value: buttonWidth });
    Object.defineProperty(exports, "buttonHeight", { value: buttonHeight });
    Object.defineProperty(exports, "menuLeft", { value: menuLeft });
    Object.defineProperty(exports, "menuWidth", { value: menuWidth });
    Object.defineProperty(exports, "menuFontSize", { value: menuFontSize });
    Object.defineProperty(exports, "bodyDiv", { value: bodyDiv });
    Object.defineProperty(exports, "upDiv", { value: upDiv });
    Object.defineProperty(exports, "downDiv", { value: downDiv });
    Object.defineProperty(exports, "viewport", { value: viewport });
    Object.defineProperty(exports, "addButtons", { value: addButtons });
    Object.defineProperty(exports, "createMenu", { value: createMenu });
    Object.defineProperty(exports, "createButtons", { value: createButtons });
    Object.defineProperty(exports, "createCBoard", { value: createCBoard });
    Object.defineProperty(exports, "createMiniBoard", { value: createMiniBoard });
    Object.defineProperty(exports, "createLogDiv", { value: createLogDiv });
    Object.defineProperty(exports, "createCmdDiv", { value: createCmdDiv });
    Object.defineProperty(exports, "createConTextMenu", { value: createConTextMenu });
    Object.defineProperty(exports, "createEXWindow", { value: createEXWindow });

    return exports;
})()
