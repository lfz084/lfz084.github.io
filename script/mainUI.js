try {
    window.mainUI = (function() {
        'use strict';

        const debug = 1

        const d = document;
        const dw = d.documentElement.clientWidth;
        const dh = d.documentElement.clientHeight;

        const gridWidth = 980;
        const gridPadding = ~~(gridWidth * 0.025)
        const cmdWidth = ~~(gridWidth * 0.95); //cBoard width = 1024
        const cmdPadding = cmdWidth * 0.065;
        const bodyWidth = dw < dh ? gridWidth : Math.max(gridWidth * 2, gridWidth * dw / dh); //bodyDiv width
        const bodyHeight = dw < dh ? gridWidth * 4 : Math.max(gridWidth, gridWidth * 2 * dh / dw);
        const bodyLeft = `0px`;
        const bodyTop = `0px`;
        const bodyScale = 0 || dw / bodyWidth;
        const sw = ~~(cmdWidth * 0.87);
        const buttonWidth = sw / 5;
        const buttonHeight = sw / 9 / 1.5;
        const menuLeft = gridPadding + cmdPadding + sw * 0.1;
        const menuWidth = sw * 0.8;
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
        upDiv.style.left = dw < dh ? `${0}px` : `${(bodyWidth - gridWidth * 2) / 2}px`;
        upDiv.style.top = dw < dh ? `${gridWidth}px` : `${(bodyHeight - gridWidth) / 2}px`;
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
        downDiv.style.left = dw < dh ? upDiv.style.left : `${parseInt(upDiv.style.left) + gridWidth}px`;
        downDiv.style.top = dw < dh ? `${parseInt(upDiv.style.top) + gridWidth}px` : upDiv.style.top;
        downDiv.setAttribute("id", "downDiv");
        debug && (downDiv.style.backgroundColor = "blue");

        const settings = [];
        createSettings();

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

        function autoMenuHeight(button) {
            return Math.min(gridWidth * 0.8, (menuFontSize * 2.5 + 3) * (button.input.length + 2));
        }

        function autoMenuTop(button) {
            return (bodyHeight - ((button.menu && button.menu.menuHeight) || autoMenuHeight(button))) / 2;
        }

        function addButtons(buttons, cmdDiv, settingIndex = 0) {
            const buttonSettings = settings[settingIndex].buttonSettings;
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i] && buttons[i].move) {
                    buttons[i].move(buttonSettings[i].left, buttonSettings[i].top, buttonSettings[i].width, buttonSettings[i].height, cmdDiv);
                    switch (buttons[i].type) {
                        case "select":
                            buttons[i].createMenu(menuLeft + (dw > dh ? gridWidth : 0), autoMenuTop(buttons[i]), menuWidth, autoMenuHeight(buttons[i]), menuFontSize, true, undefined, bodyScale);
                            break;
                    }
                }
            }
            markTop.style.top = `${settings[settingIndex].marktopSetting.top}px`;
        }

        //---------------------  生成按键布局  ---------------------------------

        function createSettings() {
            let t = dw < dh ? 0 - cmdWidth - buttonHeight * 2.5 : 0;
            const buttonSettings = [];
            const marktopSetting = {};
            settings.push({ buttonSettings: buttonSettings, marktopSetting: marktopSetting });
            for (let i = 0; i < 9; i++) { // set positions
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
        }


        //----------------------------- exports ------------------------------- 

        const exports = {}
        Object.defineProperty(exports, "bodyWidth", { value: bodyWidth });
        Object.defineProperty(exports, "bodyHeight", { value: bodyHeight });
        Object.defineProperty(exports, "bodyScale", { value: bodyScale });
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
        Object.defineProperty(exports, "createCmdDiv", { value: createCmdDiv });
        Object.defineProperty(exports, "addButtons", { value: addButtons });
        return exports;
    })()
} catch (e) { alert(e.stack) }
