if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["button"] = "2015.02";
(function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    'use strict';

    const ANIMATION_TIMEOUT = 300;
    const TEST_BUTTON = false; // ==true >>> console.log;
    let isMenuShow = false; //控制主程序，不允许同时打开两个菜单

    function log(param, type = "log") {
        const command = {
            log: () => { console.log(param) },
            info: () => { console.info(param) },
            error: () => { console.error(param) },
            warn: () => { console.warn(param) },
            assert: () => { console.assert(param) },
            clear: () => { console.clear(param) },
            count: () => { console.count(param) },
            group: () => { console.group(param) },
            groupCollapsed: () => { console.groupCollapsed(param) },
            groupEnd: () => { console.groupEnd(param) },
            table: () => { console.table(param) },
            time: () => { console.time(param) },
            timeEnd: () => { console.timeEnd(param) },
            trace: () => { console.trace(param) },
        }
        let print = command[type] || console.log;
        if (TEST_BUTTON && DEBUG)
            print(`[Button.js]\n>>  ${ param}`);
    }

    // 定制按钮，button，file，Radio，select。
    function button(parentNode, type, left, top, width, height) {

        this.parentNode = parentNode; //保存父节点;
        this.div = document.createElement("div"); //定位
        this.button = document.createElement("button"); //显示
        this.div.appendChild(this.button);
        this.label = null;
        if (type == "select") {
            this.input = document.createElement("select"); //接受用户事件  
            this.label = document.createElement("div");
            this.label.innerHTML = "▼";
            this.div.appendChild(this.label);
        }
        else {
            this.input = document.createElement("input"); //接受用户事件  
            this.input.setAttribute("type", type);
        }


        if (type != "select" && type != "file") this.div.appendChild(this.input);
        this.menuWindow = null;
        this.menu = null;
        this._menu = null; // 闭包，控制菜单打开和关闭

        this.option = [];
        this.type = type;
        this.position = "absolute";
        this.width = width == null ? "200px" : parseInt(width) + "px";
        this.height = height == null ? "150px" : parseInt(height) + "px";
        this.left = left == null ? "0px" : parseInt(left) + "px";
        this.top = top == null ? "0px" : parseInt(top) + "px";
        this.color = "#333333"; //字体默认颜色
        this.selectColor = "black"; //按钮按下时字体颜色
        this.notChangeColor = false; // 不自动调整按钮字体颜色
        this.backgroundColor = "#f0f0f0"; //按钮颜色999999
        this.selectBackgroundColor = "#d0d0d0"; //666666
        /*if (this.type=="button") {
          let col = this.backgroundColor;
          this.backgroundColor = this.selectBackgroundColor;
          this.selectBackgroundColor = col;
        }*/
        this.margin = 0;
        this.outline = "none"; //去掉外框
        this.fontSize = parseInt(this.height) / 2.2 + "px";
        this.textAlign = "center";
        this.checked = false;
        this.borderRadius = (parseInt(this.width) > parseInt(this.height) ? parseInt(this.height) : parseInt(this.width)) / 2 + "px";
        this.text = ""; //未选中显示的文本
        this.text2 = ""; //选中时显示的文本

        this.isEventMove = false; // 记录 touchstart 到 touchend 中间 是否触发 touchmove;
        this.touchStart = [];

        this.targetScrollTop = 0;
        this.tempScrollTop = 0;
        this.animationFrameScroll = null;

        let but = this;
        let funs = []; // 保存每个事件调用 函数 的地址

        this.touchstart = function() {
            log(`default touchstart......`)
            if (event) event.cancelBubble = true;
            but.defaultontouchstart();
        }

        this.mousedown = function() {
            log(`default mousedown......`)
            if (event) event.cancelBubble = true;
            if (but.type == "select" || but.type == "file") {
                if (event) event.preventDefault();
            }
            else {
                if (event) event.preventDefault();
                //log(this.type);
            }
            if (event.button == 0) but.defaultontouchstart();
        };

        this.touchcancel = function() {
            log(`default touchcancel......`)
            if (event) event.cancelBubble = true;
            but.isEventMove = true;
            but.defaultontouchend();
        };

        this.touchleave = function() {
            log(`default touchleave......`)
            if (event) event.cancelBubble = true;
            but.isEventMove = true;
            but.defaultontouchend();
        };

        this.touchend = function() {
            log(`default touchend......`)
            if (event) event.cancelBubble = true;
            but.defaultontouchend();
        };

        this.mouseup = function() {
            log(`default mouseup......`)
            if (event) event.cancelBubble = true;
            if (event) event.preventDefault();
            but.isEventMove = false;
            if (but.type == "file") {
                //but.isEventMove = true; //cancel defaultontouchend to click();
                but.defaultontouchend(); // defaultontouchend() to onchange();
            } // if "input file" cancel this click; 
            else {
                but.touchend();
            }
        };

        this.click = function() {
            log(`default click......`)
        };

        this.change = function() {
            log(`default change......`)
            if (event) event.cancelBubble = true;
            but.defaultonchange();
        };

        this.touchmove = function() {
            log(`default touchmove......`)
            if (event) event.cancelBubble = true;
            but.defaultontouchmove();
        };

        if (type == "select" || type == "file") {
            this.div.addEventListener("touchstart", this.touchstart, true);
            this.div.addEventListener("mousedown", this.mousedown, true);
            this.div.addEventListener("touchcancel", this.touchcancel, true);
            this.div.addEventListener("touchend", this.touchend, true);
            this.div.addEventListener("touchleave", this.touchleave, true);
            this.div.addEventListener("mouseup", this.mouseup, true);
            this.div.addEventListener("click", this.click, true);
            this.div.addEventListener("touchmove", this.touchmove, true);
        }
        else {
            this.input.addEventListener("touchstart", this.touchstart, true);
            this.input.addEventListener("mousedown", this.mousedown, true);
            this.input.addEventListener("touchcancel", this.touchcancel, true);
            this.input.addEventListener("touchend", this.touchend, true);
            this.input.addEventListener("touchleave", this.touchleave, true);
            this.input.addEventListener("mouseup", this.mouseup, true);
            this.input.addEventListener("click", this.click, true);
            this.input.addEventListener("touchmove", this.touchmove, true);
        }
        this.input.addEventListener("change", this.change, true);
    }



    // 对 select 添加 option
    button.prototype.addOption = function(value, text) {

        //log(`add t=${this.text}`);
        if (this.type != "select") return;
        let op = document.createElement("option");
        op.setAttribute("value", value);
        op.innerHTML = text;
        this.input.appendChild(op);

    };
    
    
    // arr = [value, text,value, text...]
    button.prototype.addOptions = function(arr) {
        for(let i=0; i<arr.length; i+=2) {
            this.addOption(arr[i], arr[i+1])
        }
    };



    button.prototype.createMenu = function(left, top, width, height, fontSize, closeAnimation, isCancelMenuClick = () => {}) { //safari 长按棋盘会误触发click事件 isCancelMenuClick判断是否是误触发

        if (this.type != "select" || this.menuWindow) return;

        let but = this;
        let muWindow = document.createElement("div");
        let menu = document.createElement("div");
        menu.lis = [];
        muWindow.appendChild(menu);
        muWindow.onclick = menu.onclick = function() {
            if (isCancelMenuClick()) return;
            if (event) {
                event.cancelBubble = true;
                event.preventDefault()
            };
            but.hideMenu(closeAnimation ? ANIMATION_TIMEOUT : ANIMATION_TIMEOUT);
        };

        this.menuWindow = muWindow;
        this.menu = menu;
        menu.setAttribute("class", "menu");
        menu.setAttribute("id", "menu");
        let dh = document.documentElement.clientHeight;
        let dw = document.documentElement.clientWidth;
        let optionsHeight = (fontSize * 2.5 + 3) * this.input.length;
        height = (fontSize * 2.5 + 3) * (this.input.length + 2);
        height = height > dh * 0.8 ? dh * 0.8 : height;
        height = dw > dh ? height : height > dh * (0.5 - 0.05) ? dh * (0.5 - 0.05) : height;
        top = (dh - height - dh * 0.05);
        top = top > dh / 2 ? dh / 2 : top;
        this.menu.menuLeft = left;
        this.menu.menuTop = top;
        this.menu.menuHeight = height;
        this.menu.menuWidth = width;
        this.menu.fontSize = fontSize;

        if (this.input.length && ((this.menu.menuHeight - (fontSize + 3) * 1) < optionsHeight)) {
            let li = document.createElement("li");
            menu.lis["down"] = li;
            li.innerHTML = "︾";
            li.style.fontWeight = "normal";
            li.style.fontFamily = "mHeiTi";
            li.style.fontSize = parseInt(fontSize) + "px";
            li.style.lineHeight = fontSize * 2.5 + "px";
            li.style.paddingLeft = fontSize * 7 + "px";
            li.style.margin = "0";
            menu.appendChild(li);
            let input = this.input;
            li.onclick = function() {
                if (isCancelMenuClick()) return;
                if (event) event.cancelBubble = true;
                but.menuScroll(parseInt(li.style.lineHeight) * 5);
            };
        }


        for (let i = 0; i < this.input.length; i++) {

            let hr = document.createElement("hr");
            menu.appendChild(hr);
            hr.style.height = "1px";
            hr.style.marginLeft = "-1px";
            hr.style.padding = "0";
            let li = document.createElement("li");
            menu.lis.push(li);
            li.innerHTML = this.input[i].innerHTML;
            li.style.fontWeight = "normal";
            li.style.fontFamily = "mHeiTi";
            li.style.fontSize = parseInt(fontSize) + "px";
            li.style.lineHeight = fontSize * 2.5 + "px";
            li.style.height = li.style.lineHeight;
            li.style.paddingLeft = li.style.fontSize;
            li.style.margin = "0";
            menu.appendChild(li);

            let input = this.input;
            let but = this;
            li.onclick = function() {
                if (isCancelMenuClick()) return;
                if (event) event.cancelBubble = true;
                //input.value = i; //system auto set
                input.selectedIndex = i; // input.onchange();
                //alert(`onclick  ,i=${i}, idx=${input.selectedIndex}`);
                if (muWindow.parentNode) {
                    but.hideMenu(closeAnimation ? ANIMATION_TIMEOUT : ANIMATION_TIMEOUT, null/*!closeAnimation ? but.change : null*/);
                    /*if (closeAnimation)*/ but.change();
                }
            };
        }
        let hr = document.createElement("hr");
        menu.appendChild(hr);
        hr.style.height = "1px";
        hr.style.marginLeft = "-1px";
        hr.style.padding = "0";
        if (this.input.length && ((this.menu.menuHeight - (fontSize + 3) * 1) < optionsHeight)) {
            let li = document.createElement("li");
            menu.lis["up"] = li;
            li.innerHTML = "︽";
            li.style.fontWeight = "normal";
            li.style.fontFamily = "mHeiTi";
            li.style.fontSize = parseInt(fontSize) + "px";
            li.style.lineHeight = fontSize * 2.5 + "px";
            li.style.paddingLeft = fontSize * 7 + "px";
            li.style.margin = "0";
            menu.appendChild(li);
            let input = this.input;
            li.onclick = function() {
                if (isCancelMenuClick()) return;
                if (event) event.cancelBubble = true;
                but.menuScroll(-parseInt(li.style.lineHeight) * 5);
            };
        }
        else {
            this.menu.menuHeight = optionsHeight + 3;
        }

        this._menu = ((menuObj) => {

            let busy = false;
            let timerHideMenu = null;

            function show(x, y) {

                //log(`type=${this.type}, menuWindow=${this.menuWindow }, parentNode=${this.menuWindow.parentNode}`)
                if (this.type != "select" || !this.menuWindow || isMenuShow) return;
                //this.input.selectedIndex = -1;
                let muWindow = this.menuWindow;
                let s = muWindow.style;
                s.position = "fixed";
                s.zIndex = 9999;
                s.width = document.documentElement.clientWidth + "px";
                s.height = document.documentElement.clientHeight * 2 + "px";
                s.top = "0px";
                s.left = "0px";
                //s.backgroundColor = "red";
                //log(`x=${x}, y=${y}`)
                x = !x ? x : x < this.menu.fontSize * 2.5 ? this.menu.fontSize * 2.5 : (x + this.menu.menuWidth) > (document.documentElement.clientWidth - this.menu.fontSize * 2.5) ? document.documentElement.clientWidth - this.menu.menuWidth - this.menu.fontSize * 2.5 : x;
                y = !y ? y : y < this.menu.fontSize * 2.5 ? this.menu.fontSize * 2.5 : (y + this.menu.menuHeight) > (document.documentElement.clientHeight - this.menu.fontSize * 2.5) ? document.documentElement.clientHeight - this.menu.menuHeight - this.menu.fontSize * 2.5 : y;

                //log(`x=${x}, y=${y}`)
                s = this.menu.style;
                s.position = "absolute";
                s.left = `${x || this.menu.menuLeft}px`;
                s.top = `${y || this.menu.menuTop}px`;
                s.width = this.menu.menuWidth + "px";
                s.height = this.menu.menuHeight + "px";
                s.borderRadius = parseInt(this.menu.fontSize) * 1.5 + "px";
                s.border = `${parseInt(this.menu.fontSize)/3}px solid ${this.selectBackgroundColor}`;
                s.overflow = "scroll";
                s.background = this.backgroundColor;
                s.autofocus = "true";
                muWindow.setAttribute("class", "show");
                //alert(`left=${this.menu.menuLeft}, top=${this.menu.menuTop}, width=${this.menu.menuWidth}, height=${this.menu.menuHeight}`);
                document.body.appendChild(muWindow);
                isMenuShow = true; // 设置两次
                setTimeout(() => {
                    if (muWindow.getAttribute("class") == "show") isMenuShow = true;
                }, ANIMATION_TIMEOUT);
                //log(`showend`)

            }

            function hideMenu(ms, callback) {
                let muWindow = this.menuWindow;
                let input = this.input;
                callback = callback || function() {};
                if (timerHideMenu) {
                    clearTimeout(timerHideMenu);
                    timerHideMenu = null;
                }
                muWindow.setAttribute("class", `${0?"hideContextMenu":"hide"}`);
                ms = parseInt(ms);
                if (ms > 0) {
                    timerHideMenu = setTimeout(function() {
                        clearTimeout(timerHideMenu);
                        timerHideMenu = null;
                        muWindow.parentNode.removeChild(muWindow);
                        callback();
                    }, ms);
                }
                else {
                    muWindow.parentNode.removeChild(muWindow);
                    callback();
                }
            }

            return {
                "showMenu": (x, y) => {
                    log(`show=${busy}`)
                    if (busy) return;
                    busy = true;
                    setTimeout(() => { busy = false; }, ANIMATION_TIMEOUT);
                    show.call(menuObj, x, y);
                },
                "hideMenu": (ms, callback) => {
                    log(`hide=${busy}`)
                    if (busy) return;
                    busy = true;
                    isMenuShow = false;
                    setTimeout(() => { busy = false; }, ANIMATION_TIMEOUT);
                    hideMenu.call(menuObj, ms, callback);
                }
            };
        })(this);
    };



    button.prototype.menuScroll = function(top) {
        //log("menuScroll")
        let optionsHeight = (parseInt(this.menu.fontSize) * 2.5 + 3) * (this.input.length + 2);
        let maxScrollTop = optionsHeight - parseInt(this.menumenuHeight);
        let targetScrollTop = this.menu.scrollTop + top;
        let but = this;
        if (this.animationFrameScroll) cancelAnima();
        this.targetScrollTop = targetScrollTop;
        //log(`menu.scrollTop=${this.menu.scrollTop}, top=${top}`)
        this.tempScrollTop = this.menu.scrollTop;
        scrollTo();

        function scrollTo() {
            let scl = Math.abs(parseInt((but.targetScrollTop - but.tempScrollTop) / 50)) + Math.abs(top) / 50;
            //log(`scl=${scl}`)
            if ((top < 0) && (but.tempScrollTop > but.targetScrollTop)) {
                but.tempScrollTop -= scl;
            }
            else if ((top > 0) && (but.tempScrollTop < but.targetScrollTop)) {
                but.tempScrollTop += scl;
            }
            else { //  to cancelAnimationFrame
                but.tempScrollTop = top < 0 ? but.targetScrollTop - 1 : but.targetScrollTop + 1;
            }
            but.menu.scrollTop = but.tempScrollTop;
            //log(`animationFrameScroll  ${but.tempScrollTop},  targetScrollTop=${ but.targetScrollTop}`)
            but.animationFrameScroll = requestAnimationFrame(scrollTo);
            if (top < 0 ? but.tempScrollTop <= but.targetScrollTop : but.tempScrollTop >= but.targetScrollTop) {
                cancelAnima();
            }
        }

        function cancelAnima() {
            //log("exit animationFrameScroll")
            cancelAnimationFrame(but.animationFrameScroll);
            but.animationFrameScroll = null;
            but.menu.scrollTop = but.menu.scrollTop < 0 ? 0 : but.menu.scrollTop > maxScrollTop ? maxScrollTop : but.menu.scrollTop;
        }
    };



    button.prototype.defaultontouchstart = function() {

        //log(`str t=${this.text}`);
        if (this.tyle == "select" && event) event.preventDefault();
        this.isEventMove = false;
        //log(`isEventMove=${this.isEventMove}`)
        //log(this)
        this.button.style.opacity = 1;
        this.button.style.fontSize = parseInt(this.fontSize) * 0.9 + "px";
        if (this.backgroundColor != "black") {
            this.button.style.color = "black";
        }
        else {
            this.button.style.color = "#ccc";
        }
        this.button.style.backgroundColor = this.selectBackgroundColor;
        return true;
    };


    button.prototype.defaultontouchmove = function() {

        //log(`mov t=${this.text}`);
        this.isEventMove = true; // 取消单击事件
        return true;
    };




    // 默认事件，
    button.prototype.defaultontouchend = function() {

        //log(`typeof event=${typeof event}, isEventMove=${this.isEventMove}`);
        if (event) event.preventDefault();
        //   "✔  ○●",radio,checked,前面加上特殊字符。
        let s;
        let timeout;
        let cancel = false; // 判断是否取消单击

        if (this.isEventMove) cancel = true; // 不触发单击事件

        // radio, checkbox 修改 checked
        if ((!cancel) && (this.type == "radio" || this.type == "checkbox")) {
            this.checked = !this.checked;
        }
        //log(`checked = ${this.checked} ,this.isEventMove = ${this.isEventMove}`);
        if (this.checked) {
            // 选中的时，按钮外观
            s = this.type == "radio" ? "☞" : this.type == "checkbox" ? "✔" : "";
            s += this.text2 == "" ? this.text : this.text2;

            if (this.type == "select") {
                s = s + "&nbsp;" + "&nbsp" + "&nbsp;";
            }

            this.button.innerHTML = s;
            this.button.style.fontSize = this.fontSize;
            this.button.style.color = this.notChangeColor ? this.color : this.selectColor;
            this.button.style.backgroundColor = this.selectBackgroundColor;
        }
        else {
            // 未选中时的外观
            if (this.type != "select" || this.type == "checkbox") {
                timeout = 0;
            }
            else {
                timeout = 0;
            }
            s = this.type == "radio" ? "" : this.type == "checkbox" ? "" : "";
            s += this.text;

            if (this.type == "select") {
                s = s + "&nbsp;" + "&nbsp" + "&nbsp;";
            }
            this.button.innerHTML = s;

            let but = this;
            if (timeout) {
                setTimeout(function() {
                    but.button.style.fontSize = but.fontSize;
                    but.button.style.color = but.color;
                    but.button.style.backgroundColor = but.backgroundColor;
                }, timeout);
            }
            else {
                but.button.style.fontSize = but.fontSize;
                but.button.style.color = but.color;
                but.button.style.backgroundColor = but.backgroundColor;
            }
        }

        //log(`cancel=${cancel}`);
        if (this.type == "file" && !cancel) {
            //log(`cancel=${"click"}`);
            this.input.click();
        }
        else if (this.type == "select" && !cancel) {
            //log(`click t=${this.text}`);
            let top = window.scrollY + this.menu.fontSize * 2.5 * 2;
            let y = event && event.pageY ? event.pageY - top : event && event.changedTouches[0] ? event.changedTouches[0].pageY - top : undefined;
            this.showMenu(undefined, y);
        }
        return cancel ? false : true;
    };




    button.prototype.defaultonchange = function() {

        //log(`chg t=${this.text}`);
        //log(`defaultonchange  ,i=${this.input.selectedIndex==-1 ? this.input[1].text : this.input.options[this.input.selectedIndex].text} `);
        if (this.type != "select" || this.input.selectedIndex < 0) return true;
        let txt = this.input.options[this.input.selectedIndex].text;
        this.setText(txt);
        return true;
    };




    //移出节点
    button.prototype.hide = function() {
        let f = this.div;
        if (f.parentNode) f.parentNode.removeChild(f);
    };



    button.prototype.hideMenu = function(ms, callback) {
        this._menu.hideMenu(ms, callback);
    }



    //  移动和设置大小
    button.prototype.move = function(left, top, width, height) {
        let text = this.text;
        this.left = left == null ? this.left : parseInt(left) + "px";
        this.top = top == null ? this.top : parseInt(top) + "px";
        this.width = width == null ? this.width : parseInt(width) + "px";
        this.height = height == null ? this.height : parseInt(height) + "px";
        this.show();
        text && this.setText(text);
    };


    //按钮背景色
    button.prototype.setBackgroundColor = function(color) {
        //log(`sbc t=${this.text}`);
        this.backgroundColor = color;
        this.button.style.backgroundColor = color;

    };



    //  设置按钮形状
    button.prototype.setBorderRadius = function(rs) {
        //log(`sbr t=${this.text}`);
        this.borderRadius = rs;
        this.show();
    };



    button.prototype.setColor = function(color) {
        //log(`sclr t=${this.text}`);
        this.color = color;
        this.selectColor = color;
        this.button.style.color = color;
    };



    //设置选定状态    
    button.prototype.setChecked = function(checked) {
        //log(`sckd t=${this.text}`);
        if (this.checked == (checked == true)) return;
        this.checked = checked ? true : false;
        this.setText(this.text, this.text2);
        //log(this.checked);
    };


    //字体
    button.prototype.setFontSize = function(fontSize) {
        this.fontSize = parseInt(fontSize) + "px";
        if (this.checked) {
            this.button.style.fontSize = parseInt(parseInt(this.fontSize) * 0.9) + "px";
        }
        else {
            this.button.style.fontSize = this.fontSize;
        }
    };



    button.prototype.setNotChangeColor = function(nc) {
        this.notChangeColor = !!nc;
    };



    // 給事件绑定函数
    button.prototype.setonchange = function(callback) {
        let fun = this.change;
        let but = this;
        this.change = function() {
            log(`new setonchange......`)
            if (event) event.cancelBubble = true;
            if (but.defaultonchange()) callback.call(this, but)
        }
        if (this.type == "select" || this.type == "file") {
            this.input.removeEventListener("change", fun, true);
            this.input.addEventListener("change", this.change, true);
        }
        else {
            this.input.removeEventListener("change", fun, true);
            this.input.addEventListener("change", this.change, true);
        }
    };



    // 給事件绑定函数
    button.prototype.setontouchstart = function(callback) {
        let fun = this.touchstart;
        let but = this;
        this.touchstart = function() {
            log(`new touchstart......`)
            if (event) event.cancelBubble = true;
            if (but.defaultontouchstart()) callback.call(this, but);
        }
        if (this.type == "select" || this.type == "file") {
            this.div.removeEventListener("touchstart", fun, true);
            this.div.addEventListener("touchstart", this.touchstart, true);
        }
        else {
            this.input.removeEventListener("touchstart", fun, true);
            this.input.addEventListener("touchstart", this.touchstart, true);
        }
    };





    // 給事件绑定函数
    button.prototype.setontouchend = function(callback) {

        let fun = this.touchend;
        let but = this;
        this.touchend = function() {
            log(`new touchend......`)
            if (event) event.cancelBubble = true;
            if (but.defaultontouchend()) callback.call(this, but);
        }
        if (this.type == "select" || this.type == "file") {
            this.div.removeEventListener("touchend", fun, true);
            this.div.addEventListener("touchend", this.touchend, true);
        }
        else {
            this.input.removeEventListener("touchend", fun, true);
            this.input.addEventListener("touchend", this.touchend, true);
        }
    };


    // 设置文本
    button.prototype.setText = function(txt, txt2) {
        //log(`stxt t=${this.text}`);
        let s;
        this.text = txt == null ? "" : txt;
        this.text2 = txt2 == null ? "" : txt2;
        this.button.style.fontFamily = "mHeiTi";
        if (this.checked) {
            s = this.type == "radio" ? "☞" : this.type == "checkbox" ? "✔" : "";
            s += this.text2 == "" ? this.text : this.text2;
            this.button.innerHTML = s;
            this.button.style.fontSize = this.fontSize;
            this.button.style.color = this.notChangeColor ? this.color : this.selectColor;
            this.button.style.backgroundColor = this.selectBackgroundColor;
        }
        else {
            let timeout;
            if (this.type == "radio" || this.type == "checkbox") {
                timeout = 0;
            }
            else {
                timeout = 0;
            }
            s = this.type == "radio" ? "" : this.type == "checkbox" ? "" : "";
            s += this.text;
            this.button.innerHTML = s;

            let but = this;
            if (timeout) {
                setTimeout(function() {
                    but.button.style.fontSize = but.fontSize;
                    but.button.style.color = but.color;
                    but.button.style.backgroundColor = but.backgroundColor;
                }, timeout);
            }
            else
            {
                but.button.style.fontSize = but.fontSize;
                but.button.style.color = but.color;
                but.button.style.backgroundColor = but.backgroundColor;
            }
        }

        if (this.type == "select") {
            s = s + "&nbsp;" + "&nbsp" + "&nbsp;";
        }

        this.button.innerHTML = s;
    };



    //显示，刷新
    button.prototype.show = function(left, top, width, height) {

        if (!this.div.parentNode) this.parentNode.appendChild(this.div);

        this.div.style.position = this.position;
        if (width) this.width = parseInt(width) + "px";
        this.div.style.width = this.width;
        if (height) this.height = parseInt(height) + "px";
        this.div.style.height = this.height;
        if (top) this.top = parseInt(top) + "px";
        this.div.style.top = this.top;
        if (left) this.left = parseInt(left) + "px";
        this.div.style.left = this.left;
        this.div.style.borderRadius = this.borderRadius == null ? parseInt(this.width) + "px" : this.borderRadius;

        this.div.style.borderStyle = "solid";
        this.div.style.borderWidth = parseInt(this.width) < parseInt(this.height) ? parseInt(this.width) / 30 + "px" : parseInt(this.height) / 30 + "px";
        this.div.style.borderColor = this.selectBackgroundColor;
        //this.div.style.backgroundColor = "red"

        this.fontSize = parseInt(this.div.style.height) / 2.2 + "px";

        this.button.style.position = "absolute";
        this.button.style.padding = "0px 0px 0px 0px";
        this.button.style.zIndex = this.div.style.zIndex;
        this.button.style.width = this.width;
        this.button.style.height = this.height;
        this.button.style.top = "0px";
        this.button.style.left = "0px";
        this.button.style.borderWidth = "0px";
        this.button.style.margin = "0px";
        this.button.style.borderRadius = this.div.style.borderRadius
        this.button.style.outline = "none";
        this.button.style.textAlign = "center";
        this.button.style.lineHeight = parseInt(this.height) + "px";
        this.button.style.backgroundColor = this.backgroundColor;
        this.button.style.fontSize = this.fontSize;
        this.button.style.color = this.color;
        this.button.style.opacity = 0.9;
        if (this.type == "select") {
            let s = this.label.style;
            s.position = "absolute";
            s.padding = "0px 0px 0px 0px";
            s.fontSize = this.fontSize;
            s.left = `${parseInt(this.width)-parseInt(this.fontSize)*1.5}px`;
            s.top = "0px";
            s.margin = "0px";
            s.textAlign = this.button.style.textAlign;
            s.height = this.button.style.height;
            s.lineHeight = this.button.style.lineHeight;
            s.opacity = 0.9;
        }

        this.input.style.position = "absolute";
        this.input.style.zIndex = this.button.style.zIndex + 1;
        this.input.style.width = this.width;
        this.input.style.height = this.height;
        this.input.style.top = "0px";
        this.input.style.left = "0px";
        this.input.style.borderRadius = this.div.style.borderRadius
        this.input.style.opacity = 0;

        this.setText(this.text, this.text2); // 正确显示按钮文本
        if (this.type == "select") this.defaultonchange();
    };



    button.prototype.showMenu = function(x, y) {
        log(`${this}.showMenu`)
        this._menu.showMenu(x, y);
    };

    exports.ANIMATION_TIMEOUT = ANIMATION_TIMEOUT;
    exports.Button = button;
})))
