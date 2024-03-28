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
	const cmdPadding = ~~(cmdWidth * 0.065);
	const bodyWidth = dw < dh ? gridWidth : Math.max(gridWidth * 2, ~~(gridWidth * dw / dh)); //bodyDiv width
	const bodyHeight = dw < dh ? gridWidth * 4 : Math.max(gridWidth, ~~(gridWidth * 2 * dh / dw));
	const bodyLeft = 0;
	const bodyTop = 0;
	const bodyScale = dw / bodyWidth;
	const upDivLeft = dw < dh ? 0 : (bodyWidth - gridWidth * 2) >> 1;
	const upDivTop = dw < dh ? gridWidth : (bodyHeight - gridWidth) >> 1;
	const downDivLeft = dw < dh ? upDivLeft : upDivLeft + gridWidth;
	const downDivTop = dw < dh ? upDivTop + gridWidth : upDivTop;
	const sw = ~~(cmdWidth * 0.87);
	const buttonWidth = sw / 5;
	const buttonHeight = sw / 9 / 1.5;
	const menuWidth = sw * 0.8;
	const menuLeft = upDivLeft + (gridWidth - menuWidth) / 2;
	const menuFontSize = sw / 20;

	const viewport = new View();
	viewport.resize();
	document.body.style.padding = "0";
	document.body.style.margin = "0";

	/**
	 * mainUI.childs[] 保存Board 和 CmdDiv
	 * @type {{variant: Board || CmdDiv, type: string, varName: string}[]}
	 * @variant Board || CmdDiv 实例
	 * @type "Board" || "CmdDiv"
	 * @varName 变量名
	 */
	const childs = [];

	const bodyDiv = d.createElement("div");
	d.body.appendChild(bodyDiv);
	bodyDiv.style.position = "absolute";
	bodyDiv.style.width = `${bodyWidth}px`;
	bodyDiv.style.height = `${bodyHeight}px`;
	bodyDiv.style.left = `${bodyLeft}px`;
	bodyDiv.style.top = `${bodyTop}px`;
	bodyDiv.style.border = `none`;
	bodyDiv.style.opacity = "0";
	bodyDiv.style.transformOrigin = `0px 0px`;
	bodyDiv.style.transform = `scale(${bodyScale})`;
	bodyDiv.setAttribute("id", "bodyDiv");
	//bodyDiv.setAttribute("class", "finish");
	//setTimeout(() => { bodyDiv.style.opacity = "1" }, 300);
	debug && (bodyDiv.style.backgroundColor = "red");

	const upDiv = d.createElement("div");
	bodyDiv.appendChild(upDiv);
	upDiv.style.position = "absolute";
	upDiv.style.width = `${gridWidth}px`;
	upDiv.style.height = `${gridWidth}px`;
	upDiv.style.left = `${upDivLeft}px`;
	upDiv.style.top = `${upDivTop}px`;
	upDiv.style.border = `none`;
	upDiv.setAttribute("id", "upDiv");
	debug && (upDiv.style.backgroundColor = "green");

	const p = { x: 0, y: 0 };
	const markTop = d.createElement("div");
	document.body.appendChild(markTop);
	markTop.style.position = "absolute";
	markTop.style.top = `${(xyObjToPage(p, upDiv).y - gridPadding)*dw / bodyWidth}px`;
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
	downDiv.style.border = `none`;
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
					t = buttonHeight * 0;
					const p = { x: 0, y: - gridPadding };
					marktopSetting.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
				}
				else {
					t = buttonHeight * 1.2;
					const p = { x: 0, y: 0 };
					marktopSetting.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
				}
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
		const marktopSetting1 = {};
		for (let i = 0; i < 15; i++) { // set positions
			if (i === 0) {
				if (dw < dh) {
					t = 0 - gridWidth - buttonHeight * 1.5;
					const p = { x: 0, y: - gridPadding - buttonHeight * 1.5 };
					marktopSetting1.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
				}
				else {
					t = buttonHeight * 1.2;
					const p = { x: 0, y: 0 };
					marktopSetting1.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
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
				buttonSettings1.push({
					left: ~~(cmdPadding + buttonWidth * j * 1.33),
					top: ~~t,
					width: ~~buttonWidth,
					height: ~~buttonHeight
				});
			}
		}
		settings.push({ buttonSettings: buttonSettings1, marktopSetting: marktopSetting1 });

		const buttonSettings2 = [];
		const marktopSetting2 = {};
		for (let i = 0; i < 15; i++) { // set positions
			if (i === 0) {
				if (dw < dh) {
					t = 0 - gridWidth - buttonHeight * 3;
					const p = { x: 0, y: - gridPadding - buttonHeight * 3 };
					marktopSetting2.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
				}
				else {
					t = buttonHeight * 1.2;
					const p = { x: 0, y: 0 };
					marktopSetting2.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
				}
			}
			else if (i === 2) {
				if (dw < dh)
					t = buttonHeight * 0;
				else
					t += buttonHeight * 1.5;
			}
			else {
				t += buttonHeight * 1.5;
			}
			for (let j = 0; j < 4; j++) {
				buttonSettings2.push({
					left: ~~(cmdPadding + buttonWidth * j * 1.33),
					top: ~~t,
					width: ~~buttonWidth,
					height: ~~buttonHeight
				});
			}
		}
		settings.push({ buttonSettings: buttonSettings2, marktopSetting: marktopSetting2 });
		
		const buttonSettings3 = [];
		const marktopSetting3 = {};
		for (let i = 0; i < 15; i++) { // set positions
			if (i === 0) {
				if (dw < dh) {
					t = 0 - gridWidth - buttonHeight * 1.5;
					const p = { x: 0, y: -gridPadding - buttonHeight * 1.5 };
					marktopSetting1.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
				}
				else {
					t = buttonHeight * 0;
					const p = { x: 0, y: 0 };
					marktopSetting1.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
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
				buttonSettings3.push({
					left: ~~(cmdPadding + buttonWidth * j * 1.33),
					top: ~~t,
					width: ~~buttonWidth,
					height: ~~buttonHeight
				});
			}
		}
		settings.push({ buttonSettings: buttonSettings3, marktopSetting: marktopSetting3 });
		
		const buttonSettings4 = [];
		const marktopSetting4 = {};
		for (let i = 0; i < 15; i++) { // set positions
			if (i === 0) {
				if (dw < dh) {
					t = buttonHeight * 0;
					const p = { x: 0, y: - gridPadding };
					marktopSetting4.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
				}
				else {
					t = buttonHeight * 0;
					const p = { x: 0, y: 0 };
					marktopSetting4.top = xyObjToPage(p, upDiv).y * dw / bodyWidth;
				}
			}
			else {
				t += buttonHeight * 1.5;
			}
			for (let j = 0; j < 4; j++) {
				buttonSettings4.push({
					left: ~~(cmdPadding + buttonWidth * j * 1.33),
					top: ~~t,
					width: ~~buttonWidth,
					height: ~~buttonHeight
				});
			}
		}
		settings.push({ buttonSettings: buttonSettings4, marktopSetting: marktopSetting4 });
		

	}

	//----------------------- CheckerBoard  -------------------------------------------------

	function createCBoard(param = {}) {
		const cbd = new CheckerBoard(upDiv, (gridWidth - cmdWidth) / 2, (gridWidth - cmdWidth) / 2, cmdWidth, cmdWidth);
		cbd.backgroundColor = "white";
		cbd.showCheckerBoard();
		cbd.bodyScale = bodyScale;
		childs.push({
			variant: cbd,
			type: cbd.constructor.name,
			varName: param.varName
		});
		return cbd;
	}

	function createMiniBoard(param = {}) {
		const width = buttonHeight * 7;
		const left = (cmdWidth / 2 - width);
		const top = dw > dh ? buttonHeight * (1.2 + 3) : buttonHeight * 1.5;
		const cbd = new CheckerBoard(upDiv, left, top, width, width);
		cbd.backgroundColor = "white";
		cbd.showCheckerBoard();
		//cbd.viewBox.style.zIndex = -1;
		cbd.bodyScale = bodyScale;
		childs.push({
			variant: cbd,
			type: cbd.constructor.name,
			varName: param.varName
		});
		return cbd;
	}
	
	//------------------ iphoneCancelClick ---------------------------------------------------
	
	/** iphone Safari 环境下长按 body.contextmenu 后放手会触发 body.click
	 * 长按弹出 menu 后会误触发 click 事件
	 * muWindow.onclick, menu.onclick, li.onclik
	 * 三个事件同时触发
	 * 用闭包判断取消误发 click 事件
	*/
	const iphoneCancelClick = (() => {
    	let isCancelClick = false;
    	const iPhone = !!(navigator.userAgent.indexOf("iPhone") + 1);
    	bodyDiv.addEventListener("contextmenu", () => { isCancelClick = iPhone; console.log("contextmenu") }, true);
    	bodyDiv.addEventListener("touchend", () => { setTimeout(() => { isCancelClick = false }, 250); console.log("touchend") }, true);
    	return {
        	isCancel: () => {
            	setTimeout(() => { isCancelClick = false }, 100);
            	console.log(`isCancelClick === ${isCancelClick}`)
            	return isCancelClick;
        	}
    	}
	})();

	//----------------------- Menu -----------------------------------------------------------

	function autoMenuHeight(button) {
		return Math.min(gridWidth * 0.8, (menuFontSize * 2.5 + 3) * (button.input.length + 2));
	}

	function autoMenuTop(button) {
		return (bodyHeight - ((button.menu && button.menu.menuHeight) || autoMenuHeight(button))) / 2;
	}

	function _createMenu(button) {
		let menuBut;
		if (button.constructor.name === "Button") {
			menuBut = button;
		}
		else {
			menuBut = new Button(upDiv, "select", 0, 0, buttonWidth, buttonHeight);
			menuBut.index = -1;
			menuBut.addOptions(button.options);
			menuBut.setonshowmenu(button.onshowmenu);
			menuBut.setonhidemenu(button.onhidemenu);
			menuBut.setonchange(button.onchange || button.change);
		}
		return menuBut;
	}
	
	function createMenu(button) {
		const menuBut = _createMenu(button);
		menuBut.createMenu(menuLeft + (dw > dh ? gridWidth : 0), autoMenuTop(menuBut), menuWidth, autoMenuHeight(menuBut), menuFontSize, true, iphoneCancelClick.isCancel, bodyScale);
		return menuBut;
	}
	

	function createContextMenu(button) {
		const menuBut = _createMenu(button);
		menuBut.createMenu(menuLeft, autoMenuTop(menuBut), menuWidth, autoMenuHeight(menuBut), menuFontSize, true, iphoneCancelClick.isCancel, bodyScale);
		return menuBut;
	}

	//----------------------- button  -----------------------------------------------------------

	function createButtons(settings) {
		const buttons = [];
		settings.map(setting => {
			if (setting) {
				if(setting.constructor.name === "Object" && setting.type) {
					const button = new Button(document.body, setting.type, 0, 0, buttonWidth, buttonHeight);
					button.varName = setting.varName;
					button.group = setting.group;
					button.mode = setting.mode;
					setting.text && button.setText(setting.text);
					setting.accept && (button.input.accept = setting.accept);
					setting.touchend && button.setontouchend(setting.touchend);
					setting.change && button.setonchange(setting.change);
					setting.onshowmenu && button.setonshowmenu(setting.onshowmenu);
					setting.onhidemenu && button.setonhidemenu(setting.onhidemenu);
					setting.options && button.addOptions(setting.options);
					setting.type == "select" && createMenu(button);
					typeof setting.reset == "function" && setting.reset.call(button);
					buttons.push(button);
				}
				else {
					buttons.push(setting);
				}
			}
			else buttons.push(undefined);
		})
		return buttons;
	}


	function addButtons(buttons, cmdDiv, settingIndex = 1) {
		const buttonSettings = settings[settingIndex].buttonSettings;
		for (let i = 0; i < buttons.length; i++) {
			if (buttons[i] && buttons[i].move) {
				if ("Button" == buttons[i].constructor.name)
					buttons[i].move(buttonSettings[i].left, buttonSettings[i].top, buttonSettings[i].width, buttonSettings[i].height, cmdDiv.viewElem);
				else
					buttons[i].move(buttonSettings[i].left, buttonSettings[i].top, buttons[i].width, buttons[i].height, cmdDiv.viewElem);
				
				cmdDiv.addChild({
					variant: buttons[i],
					type: buttons[i].constructor.name,
					varName: buttons[i].varName
				})
			}
		}
		markTop.style.top = Math.min(parseInt(markTop.style.top), settings[settingIndex].marktopSetting.top) + `px`;
	}


	//----------------------------- format viewElem param ----------------------------- 

	function formatParam(param = {}) {
		const style = param.style || {};
		const attribute = param.attribute || {};
		const event = param.event || {};

		param.id && (attribute.id = param.id);
		(param.click || param.onclick) && (event.onclick = (param.click || param.onclick));
		(param.dblclick || param.ondblclick) && (event.ondblclick = (param.dblclick || param.ondblclick));
		(param.contextmenu || param.oncontextmenu) && (event.oncontextmenu = (param.contextmenu || param.oncontextmenu));
		(param.touchstart || param.ontouchstart) && (event.ontouchstart = (param.touchstart || param.ontouchstart));
		(param.touchend || param.ontouchend) && (event.ontouchend = (param.touchend || param.ontouchend));
		(param.touchcancel || param.ontouchcancel) && (event.ontouchcancel = (param.touchcancel || param.ontouchcancel));
		(param.touchleave || param.ontouchleave) && (event.ontouchleave = (param.touchleave || param.ontouchleave));
		(param.touchmove || param.ontouchmove) && (event.ontouchmove = (param.touchmove || param.ontouchmove));

		param.style = style;
		param.attribute = attribute;
		param.event = event;

		return param;
	}

	//----------------------------- createCmdDiv ----------------------------- 

	function createCmdDiv(param = {}) {
		param.left = (gridWidth - cmdWidth) / 2;
		param.top = (gridWidth - cmdWidth) / 2;
		param.width = cmdWidth;
		param.height = cmdWidth;
		const cmdDiv = newCmdDiv(param);
		childs.push({
			variant: cmdDiv,
			type: cmdDiv.constructor.name,
			varName: param.varName
		});
		debug && (cmdDiv.viewElem.style.backgroundColor = "white");
		return cmdDiv;
	}

	//----------------------------- logDiv  ------------------------------- 

	function createLogDiv(param = {}) {
		const label = newLabel(param);
		return label;
	}

	//----------------------------- Childs  ------------------------------- 

	function addChild(child) {
		this.childs.push(child);
	}
	
	function filterChild(param, child) {
		return (!param.type || child.type == param.type) && (!param.varName || child.varName == param.varName);
	}

	function getChild(param = {}) {
		for (let index in this.childs) {
			const child = this.childs[index];
			if (filterChild(param, child)) return child.variant;
			else if (typeof child.variant.getChild == "function") {
				const rt = child.variant.getChild(param);
				if (rt) return rt;
			}
		}
		return null;
	}

	function getChilds(param = {}) {
		const childs = [];
		for (let index in this.childs) {
			const child = this.childs[index];
			if (filterChild(param, child)) childs.push(child.variant);
			if (typeof child.variant.getChilds == "function") {
				const rt = child.variant.getChilds(param);
				if (rt.length) childs.push(...rt);
			}
		}
		return childs;
	}
	
	function getChildsForVarname(param = {}) {
		const childs = {};
		for (let index in this.childs) {
			const child = this.childs[index];
			if (child.varName && filterChild(param, child)) childs[child.varName] = child.variant;
			if (typeof child.variant.getChildsForVarname == "function") {
				const rt = child.variant.getChildsForVarname(param);
				Object.assign(childs, rt);
			}
		}
		return childs;
	}

	function getChildByName(name) {
		return this.getChild({ varName: name });
	}

	function getChildsByName(name) {
		return this.getChilds({ varName: name });
	}

	//----------------------------- class ---------------------------------
	
	function removeChildsAndNode(node) {
		[...node.children].map(child => removeChildsAndNode(child));
		//console.log(`remove: ${node.innerHTML}`);
		node.remove();
	}
	
	//---------- viewElem ------------

	class viewElem {
		constructor(left = 0, top = 0, width = 500, height = 500, parent = document.body, tagName = "div") {
			this.parent = parent;
			this.childs = [];
			this.left = left;
			this.top = top;
			this.width = width;
			this.height = height;
			this.viewElem = document.createElement(tagName);
			this.varName = void 0;
			if (this.constructor.name != "CmdDiv") {
				this.viewElem.addEventListener("touchstart", () => {
					event.cancelBubble = true;
				}, true);
				this.viewElem.addEventListener("contextmenu", () => {
					event.cancelBubble = true;
				}, true);
			}
		}

		get type() { return this.constructor.name }
		get addChild() { return addChild }
		get getChild() { return getChild }
		get getChilds() { return getChilds }
		get getChildsForVarname() { return getChildsForVarname }
		get getChildByName() { return getChildByName }
		get getChildsByName() { return getChildsByName }
		get innerHTML() { return this.viewElem.innerHTML }
		set innerHTML(html) { return this.viewElem.innerHTML = html }
		get innerText() { return this.viewElem.innerText }
		set innerText(text) { return this.viewElem.innerText = text }
	}

	viewElem.prototype.move = function(left = this.left, top = this.top, width = this.width, height = this.height, parent = this.parent, conver = false) {
		if (conver && this.viewElem.parentNode) {
			const p = xyLeftToRight({ x: left, y: top }, this.viewElem.parentNode, parent);
			left = p.x;
			top = p.y;
		}
		this.parent = parent;
		this.left = left;
		this.top = top;
		this.width = width;
		this.height = height;
		const s = this.viewElem.style;
		s.position = "absolute";
		s.left = `${this.left}px`;
		s.top = `${this.top}px`;
		s.width = `${this.width}px`;
		s.height = `${this.height}px`;
		(!this.viewElem.parentNode || this.viewElem.parentNode != this.parent) && this.parent.appendChild(this.viewElem);
	}

	viewElem.prototype.show = function() {
		!this.viewElem.parentNode && this.parent.appendChild(this.viewElem);
	}

	viewElem.prototype.hide = function() {
		this.viewElem.parentNode && this.viewElem.parentNode.removeChild(this.viewElem);
	}
	
	viewElem.prototype.loadTheme = function(theme) {
		//console.info(`loadTheme: ${this.constructor.name}`)
		this.style(theme);
	}

	viewElem.prototype.style = function(style = {}) {
		for (let key in style) {
			this.viewElem.style[key] = style[key];
		}
	}

	viewElem.prototype.attribute = function(attribute = {}) {
		for (let key in attribute) {
			this.viewElem.setAttribute(key, attribute[key]);
		}
	}

	viewElem.prototype.event = function(event = {}) {
		for (let key in event) {
			key = key.toLowerCase();
			if (key.indexOf("on") == -1) key = "on" + key;
			if (window.bindEvent)
				bindEvent.addEventListener(this.viewElem, key.slice(2), event[key].bind(this));
			else
				this.viewElem[key] = event[key];
		}
	}

	function newClass(param = {}, _class = viewElem) {
		const vElem = new _class(param.left, param.top, param.width, param.height, param.parent || param.parentNode, param.type);
		param = formatParam(param);
		param.varName && (vElem.varName = param.varName);
		vElem.style(param.style);
		vElem.attribute(param.attribute);
		vElem.event(param.event);
		vElem.move();
		vElem.show();
		return vElem;
	}

	//---------------------- CmdDiv ------------------------

	class CmdDiv extends viewElem {
		constructor(left = 0, top = 0, width = 500, height = 500) {
			super(left, top, width, height, downDiv);
		}
	}

	function newCmdDiv(param = {}) {
		const cmdDiv = newClass(param, CmdDiv);
		return cmdDiv;
	}

	//---------------------- Label ------------------------

	class Label extends viewElem {
		constructor(left = 0, top = 0, width = 500, height = 500) {
			super(left, top, width, height);
			Object.assign(this.viewElem.style, {
				whiteSpace: "nowrap",
				overflow: "hidden",
				textOverflow: "ellipsis"
			})
		}
	}

	function newLabel(param = {}) {
		const label = newClass(param, Label);
		return label;
	}
	
	//---------------------- Timer ------------------------
	
	class Timer extends viewElem {
		constructor(left = 0, top = 0, width = 500, height = 500) {
			super(left, top, width, height);
			this.startTime = new Date().getTime();
			this.timer = null;
			this.viewElem.style.fontSize = ~~(parseInt(this.height) / 1.8) + "px";
			this.viewElem.style.textAlign = "center";
			this.viewElem.style.lineHeight = parseInt(this.height) + "px";
			this.viewElem.innerHTML = `00:00:00`;
		}
	}
	
	Timer.prototype.printTimer = function() {
		let t = new Date().getTime();
		t -= this.startTime;
		let h = ~~(t / 3600000);
		h = h < 10 ? "0" + h : h;
		let m = ~~((t % 3600000) / 60000);
		m = m < 10 ? "0" + m : m;
		let s = ~~((t % 60000) / 1000);
		s = s < 10 ? "0" + s : s;
		this.viewElem.innerHTML = `${h}:${m}:${s}`;
	}
	
	Timer.prototype.reset = function(timer = 0) {
		this.startTime = new Date().getTime() - timer;
		this.printTimer();
	}
	
	Timer.prototype.start = function() {
		this.stop();
		this.timer = setInterval(() => {
			this.printTimer();
		}, 1000);
	}
	
	Timer.prototype.stop = function() {
		clearInterval(this.timer);
		this.timer = null;
	}
	
	Timer.prototype.getTimer = function() {
		return !this.timer ? 0 : new Date().getTime() - this.startTime;
	}
	
	function newTimer(param = {}) {
		param.width = param.width || buttonWidth;
		param.height = param.height || buttonHeight;
		const timer = newClass(param, Timer);
		return timer;
	}

	//---------------------- Comment ------------------------

	class Comment extends viewElem {
		constructor(left = 0, top = 0, width = 500, height = 500) {
			super(left, top, width, height);
		}
	}

	function newComment(param = {}) {
		const comment = newClass(param, Comment);
		return comment;
	}
	
	//---------------------- TextBox ------------------------
	
	class TextBox extends viewElem {
		constructor(left = 0, top = 0, width = 500, height = 500) {
			super(left, top, width, height, undefined, "textarea");
			this.div = document.createElement("div");
			this.viewElem.addEventListener("click", () => {
				this.viewElem.scrollIntoView(false);
				this.showDiv();
			})
			this.viewElem.addEventListener("input", () => {
				//this.viewElem.scrollIntoView(false);
				this.showDiv()
			})
			this.div.addEventListener("click", () => {
				this.hideDiv()
			})
		}
		get value() { return this.viewElem.value || "" }
		set value(text) { this.viewElem.value = text }
	}
	
	TextBox.prototype.showDiv = function() {
		if (this.div.parentNode) return;
		document.body.appendChild(this.div);
		const width = document.documentElement.clientWidth * 2;
		const height = document.documentElement.clientHeight * 2;
		Object.assign(this.div.style, {
			position: "fixed",
			left : -(width >> 2) + "px",
			top: -(height >> 2) + "px",
			width: width + "px",
			height: height + "px",
			zIndex: 9999
		})
	}
	
	TextBox.prototype.hideDiv = function() {
		this.div.parentNode && this.div.parentNode.removeChild(this.div);
	}
	
	function newTextBox(param = {}) {
		const textBox = newClass(param, TextBox);
		return textBox;
	}
	
	//---------------------- IndexBoard ------------------------
	
	class IndexBoard extends viewElem {
		constructor(left = 0, top = 0, width = 500, height = 500, parent) {
			const boardWidth = 5;
			super(left, top, width - boardWidth * 2, height - boardWidth * 2, parent);
			this._callback = () => {};
			Object.assign(this.viewElem.style, {
				display: "grid",
				grid: `auto-flow ${buttonWidth*0.75}px / 1fr 1fr 1fr 1fr 1fr`,
				overflowY: "auto"
			})
		}
		get callback() { return this._callback }
		set callback(fun) { return this._callback = fun }
	}
	
	IndexBoard.prototype.createIndex = function(index, style = {}) {
		const div = document.createElement("div");
		div.innerHTML = index;
		div.onclick = () => this._callback(index);
		Object.assign(div.style, {
			fontSize: `${buttonHeight*0.6}px`,
			lineHeight: `${buttonWidth*0.75}px`, 
			textAlign: "center",
			border: "1px solid black"
		})
		Object.assign(div.style, style);
		this.viewElem.appendChild(div);
	}
	
	IndexBoard.prototype.createIndexes = function(indexCount, style = {}) {
		for(let index = 1; index <= indexCount; index++) {
			this.createIndex(index, callback, style);
		}
	}
	
	IndexBoard.prototype.removeIndexes = function() {
		[...this.viewElem.children].map(child => removeChildsAndNode(child));
	}
	
	function newIndexBoard(param = {}) {
		const indexBoard = newClass(param, IndexBoard);
		return indexBoard;
	}
	
	//---------------------- ItemBoard --------------------------
	class ItemBoard extends viewElem {
		constructor(left = 0, top = 0, width = 500, height = 500, parent) {
			const boardWidth = 5;
			super(left, top, width - boardWidth * 2, height - boardWidth * 2, parent);
			this.lis = [];
			Object.assign(this.viewElem.style, {
				overflowY: "auto"
			})
		}
	}
	
	ItemBoard.prototype.addItem = function(callback = () => {}) {
		const li = document.createElement("li");
		li.style.listStyle = "none";
		li.style.border = "1px solid black";
		try{callback(li)}catch(e){console.error(e.stack)}
		this.viewElem.appendChild(li);
		this.lis.push(li);
	}
	
	ItemBoard.prototype.removeItem = function(li, callback = () => {}) {
		const index = this.lis.indexOf(li);
		if (index + 1 && li.parentNode == this.viewElem) {
			try{callback(li)}catch(e){console.error(e.stack)}
			this.viewElem.removeChild(li);
			this.lis.splice(index, 1);
			removeChildsAndNode(li);
		}
	}
	
	function newItemBoard(param = {}) {
		const itemBoard = newClass(param, ItemBoard);
		return itemBoard;
	}

	//---------------------- themes -----------------------------

	const themes = {"light":"light", "grey":"grey", "green":"green", "dark":"dark"};
	const defaultTheme = "light";
	
	async function refreshTheme(theme, themeKey, cancel) {
		Object.assign(document.body.style, theme["body"]);
		
		const childs = this.getChilds();
		for (let index in childs) {
			const child = childs[index];
			const className = child.constructor.name;
			switch (className) {
				case "CmdDiv":
				case "Label":
				case "Timer":
				case "Comment":
				case "TextBox":
				case "IndexBoard":
				case "ItemBoard":
					try{child.loadTheme(theme["body"])}catch(e){console.error(e.stack)}
					break;
				case "Board":
				case "Button":
				case "InputButton":
					try{typeof child.loadTheme === "function" && child.loadTheme(theme[className])}catch(e){console.error(e.stack)}
			}
		}
		
		self["exWindow"] && exWindow.loadTheme(theme["exWindow"]);
		self["msgWindow"] && msgWindow.loadTheme({
			"msgWindow": theme["msgWindow"],
			"Button": theme["Button"]
		});
		self["share"] && share.loadTheme(theme["share"]);
		if (!cancel && window.top.fullscreenUI && (typeof window.top.fullscreenUI.refreshTheme === "function")) window.top.fullscreenUI.refreshTheme(theme, themeKey, true);
	}
	
	async function setTheme(themeKey = defaultTheme, cancel) {
		try{
		themeKey = themes[themeKey] || defaultTheme;
		localStorage.setItem("theme", themeKey);
		const data = window.settingData && ( await settingData.getDataByKey("themes"));
		const theme = data && data.themes[themeKey] || ( await loadJSON(`UI/theme/${themeKey}/theme.json`));
		refreshTheme.call(this, theme, themeKey, cancel);
		}catch(e){console.error(e.stack)}
	}
	
	function loadTheme(cancel) {
		try{
		const themeKey = localStorage.getItem("theme");
		setTheme.call(this, themeKey, cancel);
		bodyDiv.setAttribute("class", "showBody");
		}catch(e){console.error(e.stack)}
	}
	
	function getThemeName() {
		try{
		return localStorage.getItem("theme");
		}catch(e){console.error(e.stack)}
	}

	//----------------------------- exports ------------------------------- 

	const exports = {
		childs: childs,
		get addChild() { return addChild },
		get getChild() { return getChild },
		get getChilds() { return getChilds },
		get getChildsForVarname() { return getChildsForVarname },
		get getChildByName() { return getChildByName },
		get getChildsByName() { return getChildsByName }
	}
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
	Object.defineProperty(exports, "createContextMenu", { value: createContextMenu });
	Object.defineProperty(exports, "refreshTheme", { value: refreshTheme });
	Object.defineProperty(exports, "setTheme", { value: setTheme });
	Object.defineProperty(exports, "loadTheme", { value: loadTheme });
	Object.defineProperty(exports, "getThemeName", { value: getThemeName });
	
	Object.defineProperty(exports, "newCmdDiv", { value: newCmdDiv });
	Object.defineProperty(exports, "newLabel", { value: newLabel });
	Object.defineProperty(exports, "newTimer", { value: newTimer });
	Object.defineProperty(exports, "newComment", { value: newComment });
	Object.defineProperty(exports, "newTextBox", { value: newTextBox });
	Object.defineProperty(exports, "newIndexBoard", { value: newIndexBoard });
	Object.defineProperty(exports, "newItemBoard", { value: newItemBoard });

	return exports;
})()