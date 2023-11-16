(() => {
	"use strict";

	/*<script>
	    window.SCRIPT_VERSIONS = {};
	</script>
	
	<script src="./UI/Button.js"></script>
	
	<script src="./UI/View.js"></script>
	
	<script src="./UI/msgbox.js"></script>
	
	<script src="debug/vconsole.min.js"></script>*/


	const TYPE_MARK = 1; // 用于point.type,表示当前点上面存在一个标签
	const TYPE_NUMBER = 2; // 用于point.type,表示当前点上面存在一个数字
	
	window.confirm = function(name) {
		const IFRAME = document.createElement('IFRAME');
		IFRAME.style.display = 'none';
		IFRAME.setAttribute('src', 'data:text/plain,');
		document.documentElement.appendChild(IFRAME);
		let rt = window.frames[0].window.confirm(name);
		IFRAME.parentNode.removeChild(IFRAME);
		return rt;
	};

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	const MAX_HISTORY = 5;
	let tempHistoryIndex;
	let timerMoveHistory = null;
	let timerSetCheckerBoard = null;
	let Loading = false;
	let loadTimer;
	let loadStart = function() {
		Loading = true;
		loadTimer = setTimeout(function() {
			Loading = false;
			loadTimer = null;
		}, 10000);
	}
	let loadEnd = function() {
		Loading = false;
		if (loadTimer) clearTimeout(loadTimer);
		loadTimer = null;
	}


	function getHistoryIndex(x) { // 返回一个历史记录的索引;

		let index = parseInt(tempHistoryIndex);
		//alert("getHistoryIndex index=" +index + "  x=" + x)
		if (x < 0) {
			index = (index - 1) < 1 ? MAX_HISTORY : index -= 1;
			//alert("<0");
		}
		else if (x > 0) {
			index = (index + 1) > MAX_HISTORY ? 1 : index += 1;
			//alert(">0");
			//alert((index + 1)>MAX_HISTORY);
		}
		//alert("getHistoryIndex index=" +index + "  x=" + x)
		return index;
	}
	

	function loadHistoryIndex() { // 读取历史记录的索引

		let index = localStorage.getItem("HistoryIndex");
		if (index == null) { index = 1; }
		return index;
	}


	function saveMaxHistory() {

		let max = localStorage.getItem("MaxHistory");
		if (max != MAX_HISTORY) {
			localStorage.clear();
			localStorage.setItem("MaxHistory", MAX_HISTORY);
		}
	}



	function saveHistoryIndex(index) { // 保存历史记录的索引

		localStorage.setItem("HistoryIndex", index);
	}



	function delHistory(index) { // 把指定的历史记录清空

		localStorage.removeItem("pic" + index);
		localStorage.removeItem("sltx" + index);
		localStorage.removeItem("MSlength" + index);

	}


	function moveHistory(isConfirm) {

		if (Loading) return;
		loadStart();
		let r = isConfirm ? confirm("你确定删除当前记录吗？") : true;
		//alert(r)
		if (!r) { loadEnd(); return; }
		let i;
		let j;
		let srcStr;
		let left;
		let top;
		let width;
		let height;
		let ltx;
		let lty;
		let length;
		let str;
		let rNCid;
		let oldIndex = tempHistoryIndex;
		for (i = 0; i < MAX_HISTORY; i++) {

			delHistory(tempHistoryIndex);
			tempHistoryIndex = getHistoryIndex(1);
			srcStr = localStorage.getItem("pic" + tempHistoryIndex);
			if (srcStr == null) break;
			localStorage.setItem("pic" + getHistoryIndex(-1), srcStr);


			left = localStorage.getItem("left" + tempHistoryIndex);
			top = localStorage.getItem("top" + tempHistoryIndex);
			width = localStorage.getItem("width" + tempHistoryIndex);
			height = localStorage.getItem("height" + tempHistoryIndex);
			ltx = localStorage.getItem("sltx" + tempHistoryIndex);
			lty = localStorage.getItem("slty" + tempHistoryIndex);
			if (ltx == null) continue;

			localStorage.setItem("sltx" + getHistoryIndex(-1), ltx);
			localStorage.setItem("slty" + getHistoryIndex(-1), lty);
			localStorage.setItem("left" + getHistoryIndex(-1), left);
			localStorage.setItem("top" + getHistoryIndex(-1), top);
			localStorage.setItem("width" + getHistoryIndex(-1), width);
			localStorage.setItem("height" + getHistoryIndex(-1), height);


			length = localStorage.getItem("MSlength" + tempHistoryIndex);
			if (length == null || length == "0") continue;
			localStorage.setItem("MSlength" + getHistoryIndex(-1), length);

			rNCid = localStorage.getItem("rNCid" + tempHistoryIndex);
			localStorage.setItem("rNCid" + getHistoryIndex(-1), rNCid);
			for (j = 1; j <= length; j++) {
				str = localStorage.getItem("p" + tempHistoryIndex + "_" + String(j));
				localStorage.setItem("p" + getHistoryIndex(-1) + "_" + String(j), str);
			}

		}

		tempHistoryIndex = getHistoryIndex(-1);
		delHistory(tempHistoryIndex);
		saveHistoryIndex(getHistoryIndex(-1));
		tempHistoryIndex = oldIndex;
		loadEnd();
		loadHistory();
	}




	function loadHistory() {

		if (Loading) return;
		loadStart();

		let img = bkimg;
		chkLock.setChecked(false);
		img.src = null;
		resetImg();
		MS.length = 0;
		XR = 0;

		resetCmdDiv();
		setTimeout(function() {
			openImg(img, tempHistoryIndex, function() {
				setTimeout(function() {
					function* n() {
						yield* openDiv(tempHistoryIndex);
						yield* loadNum(tempHistoryIndex);
						loadEnd();
					}
					resetMDiv();
					generator = n();
					generator.next();
				}, 50);
			}, function() {
				resetMDiv();
				loadEnd();
			});
		}, 50);
	}





	function* cutImg(img, imgCanvas, l, t, w, h) {

		let imgContest = imgCanvas.getContext('2d');
		let imgContest2 = canvas2.getContext('2d');
		//android可以自动增加白边，但是iOS会出现bug
		//计算超出部分的白边
		let LW = l < 0 ? -l : 0; //裁剪超出img 部分的白边
		let RW = parseInt(img.width) - l;
		RW = RW < w ? w - RW : 0;
		let TW = t < 0 ? -t : 0;
		let DW = parseInt(img.height) - t;
		DW = DW < h ? h - DW : 0;


		//为了后面缩放图片，提前转码
		//确保canvas元素的大小和图片尺寸一致 
		imgCanvas.width = img.width;
		imgCanvas.height = img.height;
		canvas2.width = w;
		canvas2.height = h;
		//渲染图片到canvas中 
		//imgContest.fillRect(0,0,img.width,img.height);
		imgContest.drawImage(img, 0, 0, img.width, img.height);
		imgContest2.fillStyle = "#eeeeee";
		imgContest2.fillRect(0, 0, w, h);
		imgContest2.drawImage(imgCanvas, l + LW, t + TW, w - LW - RW, h - TW - DW, LW, TW, w - LW - RW, h - TW - DW);
		//用data url的形式取出 
		img.src = canvas2.toDataURL("image/png");
		img.onload = function() {
			img.onload = null;
			setTimeout(function() {
				generator.next();
			}, 50);
		}
		yield;
	}



	function saveImg(img, imgCanvas, index) {
		//存储
		//当图片加载完成时触发回调函数 
		const MAX_FILELEN = 200 * 1024; // 控制图片大小;
		let imgContest = imgCanvas.getContext('2d');
		let imgContest2 = canvas2.getContext('2d');
		let width = parseInt(img.width);
		let height = parseInt(img.height);
		let s = 1;

		//为了后面缩放图片，提前转码
		//确保canvas元素的大小和图片尺寸一致 
		imgCanvas.width = img.width;
		imgCanvas.height = img.height;
		//渲染图片到canvas中 
		imgContest.drawImage(img, 0, 0, img.width, img.height);
		//用data url的形式取出 
		let imgAsDataURL = imgCanvas.toDataURL("image/jpeg", 0.3);
		let Fileleng = imgAsDataURL.length;
		//alert("压缩前 =" + imgAsDataURL.length/1024/1024 + " - " + img.width + "×" + img.height) ;
		if (Fileleng > MAX_FILELEN) { // 图片太大时候 启用压缩启用压缩
			s = Math.sqrt(Fileleng / MAX_FILELEN);
		}

		width = parseInt(width / s);
		height = parseInt(height / s);
		canvas2.width = width;
		canvas2.height = height;
		imgContest2.drawImage(imgCanvas, 0, 0, imgCanvas.width, imgCanvas.height, 0, 0, width, height);
		imgAsDataURL = canvas2.toDataURL("image/jpeg", 0.3);

		img.src = imgAsDataURL;
		//alert("压缩前 =" + imgAsDataURL.length/1024/1024 + " - " + width + "×" + height) ;
		imgCanvas.width = 0;

		img.onload = function() {
			img.onload = null;
			//保存到本地存储中 
			localStorage.setItem("pic" + String(index), imgAsDataURL);
			//重新加载保存的图片，解决iOS下 cutimg 的bug。
			//openImg(img,index); 
		}
	}



	function openImg(img, index, callback, callback2) {

		//读取get(容器,图片) 
		callback = callback || function() {};
		callback2 = callback2 || function() {};
		let srcStr = localStorage.getItem("pic" + index);
		//alert("openimg" + index) 
		if (srcStr != null) {
			img.src = srcStr;
			img.width = parseInt(dw / 19 * 17);
			img.onload = function() {
				img.onload = null;
				setTimeout(function() { callback(); }, 50);
			};
			return true;
		}
		else {
			callback2();
			return false;
		}
	}


	function saveDiv(index) { //存储); 

		let div = mdiv;
		let left = div.offsetLeft;
		let top = div.offsetTop;
		let width = parseInt(div.style.width);
		let height = parseInt(div.style.height);
		let SLTX = String(sltx.input.value);
		let SLTY = String(slty.input.value);
		//alert("saveDiv");
		localStorage.setItem("sltx" + index, SLTX);
		localStorage.setItem("slty" + index, SLTY);

		localStorage.setItem("left" + index, left);
		localStorage.setItem("top" + index, top);
		localStorage.setItem("width" + index, width);
		localStorage.setItem("height" + index, height);
		//alert("saveDiv end" + index);
	}



	function* openDiv(index) {
		let s = mdiv.style;
		let left = localStorage.getItem("left" + index);
		let top = localStorage.getItem("top" + index);
		let width = localStorage.getItem("width" + index);
		let height = localStorage.getItem("height" + index);
		let ltx = localStorage.getItem("sltx" + index);
		let lty = localStorage.getItem("slty" + index);

		if (ltx == null) return false;
		if (ltx != null) {
			sltx.input.value = parseInt(ltx);
			sltx.setText(parseInt(ltx) + "\b列");
			SLTX = ltx;
		}
		if (lty != null) {
			slty.input.value = parseInt(lty);
			slty.setText(parseInt(lty) + "\b行");
			SLTY = lty;
		}
		setDiv(parseInt(left), parseInt(top), parseInt(width), parseInt(height), s);
		resetP(XL, XR, YT, YB, false);
		setTimeout(function() { generator.next(); }, 50)
		yield;
		printBorder();
		setTimeout(function() { generator.next(); }, 50)
		yield;
	}


	function saveNum(length, p, index)
	{
		let rNCid;
		let i;

		for (i = 1; i < 5; i++)
		{
			switch (i) {
				case 1:
					rNCid = "rNC1";
					if (rNC1.checked) i = 5;
					break;
				case 2:
					rNCid = "rNC2";
					if (rNC2.checked) i = 5;
					break;
				case 3:
					rNCid = "rNC3";
					if (rNC3.checked) i = 5;
					break;
				case 4:
					rNCid = "rNC4";
					if (rNC4.checked) i = 5;
					break;
			}
		}
		localStorage.setItem("rNCid" + index, rNCid);
		localStorage.setItem("MSlength" + index, length);
		if (p != null)
		{
			localStorage.setItem("p" + index + "_" + String(length), xyTostr(p));
			//alert(xyTostr(p));
		}
		//alert("saveNum_" +length);
	}


	function* loadNum(index)
	{
		let length = localStorage.getItem("MSlength" + index);
		if (length == null || length == "0") return false;
		let i;
		let p = tempp;
		p.setxy(0, 0);
		let str;
		let rNCid = localStorage.getItem("rNCid" + index);
		if (rNCid != null && rNCid != "") {
			switch (String(rNCid)) {
				case "rNC1":
					rNCclk(rNC1);
					break;
				case "rNC2":
					rNCclk(rNC2);
					break;
				case "rNC3":
					rNCclk(rNC3);
					break;
				case "rNC3":
					rNCclk(rNC4);
					break;
			}
		}
		chkLock.setChecked(true);
		yield* lockClk();
		for (i = 1; i <= length; i++)
		{
			str = localStorage.getItem("p" + index + "_" + String(i));
			strToxy(str, p);
			//alert(p.x +"-"+p.y);
			// if( getP(p.x,p.y).d == null) getP(p.x,p.y).setd(getfreeLb());
			wNb(getP(p.x, p.y));
			//alert(p.x +"-"+p.y);

		}
		return true;
	}





	function xyTostr(p)
	{
		return String(p.x) + "_" + String(p.y);
	}


	function strToxy(s, p)
	{
		let i = s.indexOf("_");
		if (i > 0)
		{
			p.setxy(parseInt(s.substring(0, i)), parseInt(s.substring(i + 1)));
		}
	}



	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	let touchStartX = 0; //触摸起点的坐标
	let touchStartY = 0;
	let touchMoveX = 0; //滑动坐标
	let touchMoveY = 0;
	let isTouch = false;

	let tempp = new point(0, 0, null);
	let P = new Array(225); //用来保存225个点
	P[0] = new point(null, null, null);
	let DIV = new Array(225); //原来保存225 DIV 标签的引用
	let MS = new Array(); //保存落子顺序
	MS[0] = new point(0, 0, null);
	MS.length = 0;

	let backNum = 0; // ==true 时，可以快速悔棋。

	let d = document;
	let dw = 0; //网页可见宽度
	let dh = 0; //网页可见高度
	dw = d.documentElement.clientWidth;
	dh = d.documentElement.clientHeight;
	let cWidth = dw < dh ? dw * 0.95 : dh * 0.95;
	cWidth = dw < dh ? cWidth : dh < dw / 2 ? dh : dw / 2;
	let viewport = new View(dw);

	let XL = 0; //棋盘落子范围，左右上下的4条边
	let XR = 0;
	let YT = 0;
	let YB = 0;
	let gW = 0; //棋盘格子宽度,浮点数
	let gH = 0; //棋盘格子高度,浮点数
	let SLTX = 15;
	let SLTY = 15; //默认是15×15棋盘;

	let sw = dw > dh ? cWidth * 0.95 : dw / 19 * 17 * 0.95;
	let cW = sw / 5;
	let cH = sw / 9 / 1.5;
	let cT = 0;

	let bodyDiv = document.createElement("div");
	document.body.appendChild(bodyDiv);
	bodyDiv.style.position = "absolute";
	bodyDiv.style.width = "100%";
	bodyDiv.style.height = dh * 2.2;
	bodyDiv.style.left = 0;
	bodyDiv.style.top = 0;
	let fileDiv = document.createElement("div");
	bodyDiv.appendChild(fileDiv);
	fileDiv.style.position = "absolute";
	fileDiv.style.width = sw;
	fileDiv.style.height = parseInt(dw / 18);
	//fileDiv.style.left = (dw - sw) / 2 - 10;
	//fileDiv.style.top = parseInt(dh * 0.6 + dw / 6);
	fileDiv.style.left = `${dw > dh ? parseInt((dw - cWidth * 2) / 2) + cWidth + (cWidth-sw)/2 : (dw - sw) / 2}px`;
	fileDiv.style.top = `${dw > dh ? parseInt(cH * 1.8 + cWidth/19 + (dh-cWidth)/2) : cWidth}px`;
	//fileDiv.style.backgroundColor = "white";
	let menuLeft = parseInt(fileDiv.style.left) + sw * 0.1;
	let menuWidth = sw * 0.8;
	let menuFontSize = sw / 20;
	let chkLock = new Button(fileDiv, "checkbox", cW * 0, cT, cW, cH);
	chkLock.show();
	chkLock.setText("选定棋盘");
	chkLock.setChecked(0);
	chkLock.setontouchend(function() {
		lockClkB();
	});
	let fileField = new Button(fileDiv, "file", cW * 1.33, cT, cW, cH);
	fileField.show();
	fileField.input.accept = "image/*";
	fileField.setText("选择图片");
	fileField.setonchange(function() {
		cimg();
	});
	let slty = new Button(fileDiv, "select", cW * 2.66, cT, cW, cH);
	for (let i = 15; i > 5; i--) {
		slty.addOption(i, i + "\b行");
	}
	slty.createMenu(menuLeft, null, menuWidth, null, menuFontSize);
	slty.show();
	slty.setText("15\b行");
	slty.setonchange(function(but) {
		sltyChang();
	});
	let sltx = new Button(fileDiv, "select", cW * 3.99, cT, cW, cH);
	for (let i = 15; i > 5; i--) {
		sltx.addOption(i, i + "\b列");
	}
	sltx.createMenu(menuLeft, null, menuWidth, null, menuFontSize);
	sltx.show();
	sltx.setText("15\b列");
	sltx.setonchange(function(but) {
		sltxChang();
	});

	cT -= cH * 1.8;
	const setTop = (() => {
		let topMark = document.createElement("div");
		document.body.appendChild(topMark);
		topMark.setAttribute("id", "top");
		return (top) => {
			let s = topMark.style;
			s.position = "absolute";
			s.top = top + "px";
			s.zIndex = -100;
		}
	})();
	if (dw < dh) {
		setTop(fileDiv.offsetTop + cT);
	}
	else {
		setTop(0);
	}

	let cRefresh = new Button(fileDiv, "button", cW * 0, cT, cW, cH);
	cRefresh.show();
	cRefresh.setColor("black");
	cRefresh.setText("分享图片");
	cRefresh.setontouchend(function() {
		share();
	});

	let cPrevious = new Button(fileDiv, "button", cW * 1.33, cT, cW, cH);
	cPrevious.show();
	cPrevious.setColor("black");
	cPrevious.setText("<<");
	cPrevious.setontouchend(function() {
		if (Loading) return;
		tempHistoryIndex = getHistoryIndex(-1);
		loadHistory();
	});

	let cNext = new Button(fileDiv, "button", cW * 2.66, cT, cW, cH);
	cNext.show();
	cNext.setColor("black");
	cNext.setText(">>");
	cNext.setontouchend(function() {
		if (Loading) return;
		tempHistoryIndex = getHistoryIndex(1);
		loadHistory();
	});

	let cDelete = new Button(fileDiv, "button", cW * 3.99, cT, cW, cH);
	cDelete.show();
	cDelete.setColor("black");
	cDelete.setText("删除记录");
	cDelete.setontouchend(function() {
		moveHistory(false)
	});

	let bkimg = document.createElement("img");
	bodyDiv.appendChild(bkimg);
	bkimg.style.position = "absolute";
	bkimg.style.left = 0;
	bkimg.style.top = 0;
	bkimg.style.zIndex = -1;

	//continueCutDiv
	let mdiv = document.createElement("div");
	bodyDiv.appendChild(mdiv);
	mdiv.style.position = "absolute";
	mdiv.style.border = "3px dashed red";
	mdiv.style.width = 300;
	mdiv.style.height = 300;
	//mdiv.onclick = Click;

	createDIV(bodyDiv);

	let ndiv = document.createElement("div");
	bodyDiv.appendChild(ndiv);
	ndiv.style.position = "absolute";
	//ndiv.style.backgroundColor = "white";
	ndiv.style.width = sw;
	ndiv.style.height = 100;
	ndiv.style.left = fileDiv.style.left;
	//ndiv.style.top = dw > dh ? "0px" : cWidth + "px";


	cT = 0;
	cH *= 0.9;
	let rL0 = new Button(ndiv, "radio", cW * 0, cT, cW, cH);
	//rL0.show();
	rL0.setText("添加棋子");
	rL0.setChecked(1);
	rL0.setontouchend(function() {
		rLclk(rL0);
	});
	//cT += cH*1.8;
	let rNC2 = new Button(ndiv, "radio", cW * 0, cT, cW, cH);
	rNC2.show();
	rNC2.input.setAttribute("id", "rNC2");
	rNC2.setText("黑先棋子");
	rNC2.setChecked(1);
	rNC2.setontouchend(function() {
		rNCclk(rNC2);
	});
	let rNC1 = new Button(ndiv, "radio", cW * 1.33, cT, cW, cH);
	rNC1.show();
	rNC1.input.setAttribute("id", "rNC1");
	rNC1.setText("白先棋子");
	rNC1.setontouchend(function() {
		rNCclk(rNC1);
	});
	let rNC3 = new Button(ndiv, "radio", cW * 2.66, cT, cW, cH);
	rNC3.show();
	rNC3.input.setAttribute("id", "rNC3");
	rNC3.setText("绿红数字");
	rNC3.setontouchend(function() {
		rNCclk(rNC3);
	});
	let rNC4 = new Button(ndiv, "radio", cW * 3.99, cT, cW, cH);
	rNC4.show();
	rNC4.input.setAttribute("id", "rNC4");
	rNC4.setText("红绿数字");
	rNC4.setontouchend(function() {
		rNCclk(rNC4);
	});
	cT += cH * 1.8;
	let rL1 = new Button(ndiv, "radio", cW * 0, cT, cW, cH);
	rL1.show();
	rL1.setText("■ \b标记");
	rL1.setontouchend(function() {
		rLclk(rL1);
	});
	let rL2 = new Button(ndiv, "radio", cW * 1.33, cT, cW, cH);
	rL2.show();
	rL2.setText("▲ \b标记");
	rL2.setontouchend(function() {
		rLclk(rL2);
	});
	let rL3 = new Button(ndiv, "radio", cW * 2.66, cT, cW, cH);
	rL3.show();
	rL3.setText("◆ \b标记");
	rL3.setontouchend(function() {
		rLclk(rL3);
	});
	let rL4 = new Button(ndiv, "radio", cW * 3.99, cT, cW, cH);
	rL4.show();
	rL4.setText("● \b标记");
	rL4.setontouchend(function() {
		rLclk(rL4);
	});
	cT += cH * 1.8;
	let rLC1 = new Button(ndiv, "radio", cW * 0, cT, cW, cH);
	rLC1.show();
	rLC1.setColor("black");
	rLC1.setText("黑色标记");
	rLC1.setChecked(1);
	rLC1.setontouchend(function() {
		rLCclk(rLC1);
	});
	let rLC2 = new Button(ndiv, "radio", cW * 1.33, cT, cW, cH);
	rLC2.show();
	rLC2.setColor("red");
	rLC2.setText("红色标记");
	rLC2.setontouchend(function() {
		rLCclk(rLC2);
	});
	let rLC3 = new Button(ndiv, "radio", cW * 2.66, cT, cW, cH);
	rLC3.show();
	rLC3.setColor("green");
	rLC3.setText("绿色标记");
	rLC3.setontouchend(function() {
		rLCclk(rLC3);
	});
	let rLC4 = new Button(ndiv, "radio", cW * 3.99, cT, cW, cH);
	rLC4.show();
	rLC4.setColor("white");
	rLC4.setText("白色标记");
	rLC4.setontouchend(function() {
		rLCclk(rLC4);
	});

	let ldiv = document.createElement("div");
	//bodyDiv.appendChild(ldiv);
	ldiv.style.position = "absolute";
	ldiv.style.backgroundColor = "red";
	ldiv.style.width = parseInt(dw / 19 * 17);
	ldiv.style.height = 100;


	let canvas = document.createElement("canvas");
	let canvas2 = document.createElement("canvas");
	let generator;
	let tempImg = document.createElement("img");



	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////






	function createDIV() //在document 上面创建 225个div 在用DIV 数组引用
	{
		let i = 0;
		//alert('createDIV');
		for (i = 0; i < 225; i++)
		{
			//d.write("<div id='d" + i +"'></div>");
			DIV[i] = document.createElement("div");
			bodyDiv.appendChild(DIV[i]);
			DIV[i].innerHTML = "";
			DIV[i].style.width = '50px';
			DIV[i].style.height = '50px';
			DIV[i].style.textAlign = 'center';
			DIV[i].style.lineHeight = '50px';
			DIV[i].style.border = '1px solid red';
			DIV[i].style.borderRadius = '50%';
			DIV[i].style.position = "absolute";
			DIV[i].style.fontFamily = "mHeiTi, Roboto, emjFont, Symbola";
			//DIV[i].onclick = Click;

		}
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	let isContinueSetCB = false;
	let exitContinueSetCutDivMove = false;


	function continueSetCheckerBoard()
	{
		exitContinueSetCutDivMove = false;
		continueSetCutDivMove();
	}



	function continueSetCutDivMove() {
		//log("continueSetCutDiv start");
		let x = touchMoveX;
		let y = touchMoveY;
		let p = tempp;
		if (!isOut(x, y))
		{
			p.setxy(x, y);
			setxy(p, 0.02);
			setCheckerBoard(p.x, p.y, false);
		}

		timerSetCheckerBoard = requestAnimationFrame(continueSetCutDivMove);
		if (exitContinueSetCutDivMove) {
			cancelAnimationFrame(timerSetCheckerBoard);
			timerSetCheckerBoard = null;
		}
	}



	function touchstart()
	{
		let x = event.touches[0].pageX;
		let y = event.touches[0].pageY;
		touchStartX = event.touches[0].pageX;
		touchStartY = event.touches[0].pageY;
		touchMoveX = x;
		touchMoveY = y;

		if (!isOut(x, y) && !sharing)
		{
			if ((!chkLock.checked) && isContinueSetCB)

			{
				if (event) event.preventDefault(); //阻止事件的默认行为
				if (timerSetCheckerBoard == null)
				{
					cleALb();
					timerSetCheckerBoard = setTimeout("continueSetCheckerBoard()", 1);
				}
			}
			else
			{
				//ios safari 设置定时器,长按删除记录
				if (timerMoveHistory == null) {
					timerMoveHistory = setTimeout(function() {
						keepTouch();
					}, 500);
				}
			}
		}
		//alert("touchstart");
	}




	function touchmove()
	{
		let x = event.touches[0].pageX;
		let y = event.touches[0].pageY;
		if (timerSetCheckerBoard && event) event.preventDefault();
		//console.log(this)
		clearTimeout(timerMoveHistory); //删除定时器
		timerMoveHistory = null;
		//clearTimeout(timerSetCheckerBoard);
		//timerSetCheckerBoard = null;

		touchMoveX = x;
		touchMoveY = y;

	}


	function touchcancel()
	{
		touchMoveX = 0;
		touchMoveY = 0;
		let x = event.changedTouches[0].pageX;
		let y = event.changedTouches[0].pageY;

		clearTimeout(timerMoveHistory); //删除定时器
		timerMoveHistory = null;
		clearTimeout(timerSetCheckerBoard);
		if (timerSetCheckerBoard)
		{
			timerSetCheckerBoard = null;
			exitContinueSetCutDivMove = true;
			if (!isOut(x, y))
			{
				resetP(XL, XR, YT, YB, true);
				// printBorder();
			}
			return;
		}

	}



	function touchend()
	{
		touchMoveX = 0;
		touchMoveY = 0;
		let x = event.pageX || event.changedTouches[0].pageX;
		let y = event.pageY || event.changedTouches[0].pageY;

		clearTimeout(timerMoveHistory); //删除定时器
		timerMoveHistory = null;
		clearTimeout(timerSetCheckerBoard);
		if (timerSetCheckerBoard)
		{
			timerSetCheckerBoard = null;
			exitContinueSetCutDivMove = true;
			if (!isOut(x, y) && !sharing)
			{
				resetP(XL, XR, YT, YB, true);
				//printBorder();
			}
			return;
		}

		if ((y == touchStartY) && (x == touchStartX))
		{
			if (!isOut(x, y) && !sharing)
			{
				if (event) event.preventDefault(); //阻止事件的默认行为
				//console.log(`x=${x}, y=${y}`)
				Click(parseInt(x), parseInt(y), 1);
				isContinueSetCB = true;
				setTimeout("isContinueSetCB = false", 600);
			}
		}


		if (Math.abs(y - touchStartY) > 170) return;
		if (event.changedTouches.length != 1) return;
		if (window.pageXOffset > 0 || window.pageYOffset > 50)
		{
			touchStartX = 0;
			touchStartY = 0;
		}
		else
		{
			//alert("touchend");
			let m = x - touchStartX;
			/*
			if (m < -(dw / 3))
			{
			    if (event) event.preventDefault(); //阻止事件的默认行为
			    tempHistoryIndex = getHistoryIndex(1);
			    loadHistory();
			}
			else if (m > (dw / 3))
			{
			    if (event) event.preventDefault(); //阻止事件的默认行为
			    tempHistoryIndex = getHistoryIndex(-1);
			    loadHistory();
			}
			*/
			touchStartX = 0;
			touchStartY = 0;
		}

	}







	function rLclk(t)
	{
		rL0.setChecked(false);
		rL1.setChecked(false);
		rL2.setChecked(false);
		rL3.setChecked(false);
		rL4.setChecked(false);

		rNC1.setChecked(false);
		rNC2.setChecked(false);
		rNC3.setChecked(false);
		rNC4.setChecked(false);

		t.setChecked(true);
		//alert(c);
	}




	function rNCclk(t)
	{
		rL0.setChecked(true);
		rL1.setChecked(false);
		rL2.setChecked(false);
		rL3.setChecked(false);
		rL4.setChecked(false);

		rNC1.setChecked(false);
		rNC2.setChecked(false);
		rNC3.setChecked(false);
		rNC4.setChecked(false);


		t.setChecked(true);
		resetNumColor();
		//alert(c);
	}




	function rLCclk(t)
	{
		rLC1.setChecked(false);
		rLC2.setChecked(false);
		rLC3.setChecked(false);
		rLC4.setChecked(false);

		t.setChecked(true);
		//alert(c);
	}



	function lockClkB() {
		generator = lockClk();
		generator.next();
	}





	function* lockClk()
	{
		let c = canvas;
		let v = mdiv;
		let img = bkimg;
		let s = parseInt(img.width) / ((XR - XL) * 18 / 14);
		let w = parseInt(parseInt(img.width) / 9);
		let left;
		let top;
		let width;
		let height;

		//alert("lockClk")
		if (chkLock.checked)
		{
			console.log("chkLock.checked=" + chkLock.checked)
			XL = v.offsetLeft;
			XR = XL + parseInt(v.style.width);
			YT = v.offsetTop;
			YB = YT + parseInt(v.style.height);


			if (s > 1)
			{
				left = (XL - img.offsetLeft) - parseInt(w / s);
				top = (YT - img.offsetTop) - parseInt(w / s);
				width = (XR - XL) + parseInt(w * 2 / s);
				height = (YB - YT) + parseInt(w * 2 / s);

				yield* cutImg(img, c, left, top, width, height);

				let s1 = width / height;
				// 提前计算出 img.裁剪后的尺寸,必须提前计算，
				XL = img.offsetLeft + w;
				XR = img.offsetLeft + parseInt(img.width) - w;
				YT = img.offsetTop + w;
				YB = img.offsetTop + parseInt(parseInt(img.width) / s1) - w;

			}
			else
			{
				left = 0;
				top = 0;
				width = img.width;
				height = YT - img.offsetTop + YB - YT + w;
				if ((YT - img.offsetTop) > w)
				{
					top = YT - img.offsetTop - w;
					YT = YT - top;
					YB = YB - top;
					height = height - top;
				}
				height = height > img.height ? img.height : height;
				yield* cutImg(img, c, left, top, width, height);

			}

			resetP(XL, XR, YT, YB, false);
			setTimeout(function() {
				hide();
				saveDiv(tempHistoryIndex);
				resetCmdDiv();
				setTimeout("generator.next()", 50);
			}, 50);
			yield;
		}
		else
		{
			console.log("chkLock.checked=" + chkLock.checked)
			openImg(img, tempHistoryIndex, function() {
				resetMDiv(); // 
				MS.length = 0;
				saveNum(0, null, tempHistoryIndex);
				resetCmdDiv();
				setTimeout("generator.next()", 50);
			});
			yield;

		}
	}






	function cleLb(p) //清空一个 div
	{
		//alert("cleLb sta")
		if (p.type == TYPE_NUMBER) return;
		p.cle();
	}




	function cleALb() //清空棋盘上所有 div
	{
		let i;
		for (i = 0; i < 225; i++)
		{
			//alert("i=" + i);
			if (P[i] != undefined) P[i].cle();
		}
	}


	function wLb(s, p) // 在 p div 上面输出 s
	{
		let color;
		color = rLC1.checked ? "black" : rLC2.checked ? "red" : rLC3.checked ? "green" : "white";
		p.printLb(s, color);

	}


	//在一个点上放棋子or数字
	function wNb(p)
	{
		let i;
		i = MS.length;
		//alert("i=" +i)  
		MS[i] = p;
		//MS.length++;
		//alert("wNb");

		if (rNC1.checked)
		{
			MS[i].printNb(i + 1, (i % 2) ? 'white' : 'black');
		}
		else
		{
			if (rNC2.checked)
			{
				MS[i].printNb(i + 1, (i % 2) ? 'black' : 'white');
			}
			else
			{
				if (rNC3.checked) { MS[i].printNb(i + 1, (i % 2) ? 'red' : 'green'); }
				else { MS[i].printNb(i + 1, (i % 2) ? 'green' : 'red'); }
			}
		}
		saveNum(MS.length, MS[i], tempHistoryIndex);
	}


	//悔一手
	function cleNb()
	{
		//alert("cleNb sta p=" +p)
		let i;
		i = MS.length;
		if (i == 0) return;

		MS[i - 1].cle();
		MS.length--;
		saveNum(MS.length, null, tempHistoryIndex);
		//alert("clenb");
	}


	//刷新棋盘上棋子or数字颜色
	function resetNumColor()
	{
		let i;
		let color;
		if (MS.length == 0) return;
		for (i = 0; i < MS.length; i++)
		{
			//alert("resetNumColor_i=" + i)
			if (rNC1.checked)
			{
				//alert("1")
				color = i % 2 ? 'white' : 'black';
			}
			else
			{
				//alert("2")
				if (rNC2.checked)
				{
					color = i % 2 ? 'black' : 'white';
				}
				else
				{
					if (rNC3.checked) { color = i % 2 ? 'red' : 'green'; }
					else { color = i % 2 ? 'green' : 'red'; }
				}
			}
			//alert("resetNumColor_" + color)
			MS[i].setcolor(color);
		}
	}





	function resetP(xL, xR, yT, yB, isTest) //设置棋盘所有点的坐标
	{
		let i;
		let j;
		let l;
		let x;
		let y;
		//alert("resetP STA")

		gW = (xR - xL) / (SLTX - 1);
		gH = (yB - yT) / (SLTY - 1);

		for (j = 0; j < SLTY; j++)
		{
			y = gH * j + yT;
			for (i = 0; i < SLTX; i++)
			{
				x = gW * i + xL;
				l = j * SLTX + i;
				P[l].cle();
				P[l].setxy(x, y);
				if (isTest) P[l].printBorder();
			}
		}

		//if (isTest) return;
		for (j = l + 1; j < 225; j++)
		{
			P[j].cle();
		}

	}


	function cleP() //清空所有的点
	{
		let i;
		MS.length = 0;
		for (i = 0; i < 225; i++)
		{
			if (P[i] != null) P[i].cle();
		}
	}






	//把一个div的显示清空
	function cleD(div)
	{
		div.innerHTML = "";
		div.style.borderStyle = "";
		div.style.background = "";
	}


	let cancelContextmenu = false;

	function keepTouch() {

		if (cancelContextmenu) return;
		clearTimeout(timerMoveHistory); //删除定时器
		timerMoveHistory = null;
		cancelContextmenu = true;
		setTimeout("cancelContextmenu=false", 1000);
		let out = event ? isOut(event.pageX || event.touches[0].pageX, event.pageY || event.touches[0].pageY) : false;
		if (out) return;
		//console.log("keepTouch");
		if (!sharing) {

			if (chkLock.checked) {
				moveHistory(true)
			}
			else {
				if (timerSetCheckerBoard == null && touchMoveX) {
					cleALb();
					//event.preventDefault(); //阻止事件的默认行为
					timerSetCheckerBoard = setTimeout("continueSetCheckerBoard()", 1);
				}
			}
		}
	}



	//屏幕单击触发
	function Click(x, y, speed)
	{
		if (sharing) return;
		if (typeof x == "object")
		{
			x = event.pageX;
			y = event.pageY;
			speed = 2;
		}

		if (Loading || isOut(x, y)) { return };
		if (chkLock.checked)
		{
			let p;
			p = getP(x, y);
			//console.log(`x=${x}, y=${y}, p=${p}`);

			if (p.type == null || p.type == 0)
			{
				//alert("DIV" + DIV[0].innerHTML)
				//p.setd(getfreeLb());
				if (rL0.checked)
				{
					wNb(p);
				}
				else
				{
					let s;
					s = rL1.checked ? "■" : rL2.checked ? "▲" : rL3.checked ? "◆" : "●";
					wLb(s, p);
				}

			}
			else
			{
				if (rL0.checked)
				{
					if (p.type == TYPE_NUMBER)
					{
						if (parseInt(p.text) == backNum)
						{
							//let r = confirm("你确定返回到第" +parseInt(p.text) + "手吗？");
							let i;
							if (true)
							{
								for (i = MS.length; i > parseInt(p.text); i--)
								{
									cleNb();
								}
								return;
							}

						}
						else
						{
							backNum = parseInt(p.text);
							timeOut_backNum();
						}
					}


					cleNb();
				}
				else
				{
					cleLb(p);
				}


			}
		}
		else
		{
			let p = tempp;
			p.setxy(x, y);
			setxy(p, speed);
			setCheckerBoard(p.x, p.y, true);
		}
	}




	function timeOut_backNum()
	{
		setTimeout("backNum = 0", 600);
	}




	function getP(x, y) //判断用户点击了棋盘上面的哪一个点，在返回这个点的引用
	{
		let i;
		let j;
		let l;
		let p;
		if (isOut(x, y)) return;
		x = x + parseInt(gW / 2);
		y = y + parseInt(gH / 2);
		i = parseInt((x - XL) / gW);
		if (i == SLTX) i--;
		j = parseInt((y - YT) / gH);
		if (j == SLTY) j--;
		l = SLTX * j + i;

		p = P[l];
		return P[l];

	}




	function getPIndex(x, y) //判断用户点击了棋盘上面哪一个点，返回这个点在 P数组的 index
	{
		let i;
		let j;
		let l;

		i = parseInt((x - XL) / gW);
		j = parseInt((y - YT) / gW);
		l = SLTX * j + i;
		return l;

	}


	function setxy(p, speed) //返回一个xy坐标，用来 调整棋盘边框位置，支持微调
	{
		let s = mdiv.style;
		let n = mdiv;
		let xL = n.offsetLeft;
		let xR = xL + parseInt(s.width);
		let xM = xL + parseInt((xR - xL) / 2);
		let yT = n.offsetTop;
		let yB = yT + parseInt(s.height);
		let yM = yT + parseInt((yB - yT) / 2);
		let tempx;
		let tempy;
		let w = parseInt(s.width) < parseInt(s.height) ? parseInt(s.width) : parseInt(s.height);
		w /= (5 - 0.99);
		let x = p.x;
		let y = p.y;



		if (x < xM)
		{
			if (y < yM)
			{
				tempx = xL;
				tempy = yT;
			}
			else
			{
				tempx = xL;
				tempy = yB;
			}
		}
		else
		{

			if (y < yM)
			{
				tempx = xR;
				tempy = yT;
			}
			else
			{
				tempx = xR;
				tempy = yB;
			}

		}
		// 微调//////
		//alert("微调");

		if (speed < 1)
		{
			if (Math.abs(x - tempx) < w && Math.abs(y - tempy) < w)
			{
				let temps = Math.pow((x - tempx) / w, 2);
				x = parseInt((x - tempx) * speed * temps);
				x = x || speed == 1 ? x : (x - tempx) < 0 ? -1 : 1;
				x += tempx;
				temps = Math.pow((y - tempy) / w, 2);
				y = parseInt((y - tempy) * speed * temps);
				y = y || speed == 1 ? y : (y - tempy) < 0 ? -1 : 1;
				y += tempy;
				p.setxy(x, y);
				return;
			}
		}
		else if (speed == 1)
		{
			if (Math.abs(x - tempx) < parseInt(w / 3) && Math.abs(y - tempy) < parseInt(w / 3))
			{
				x = parseInt((x - tempx) / 10 * speed);
				x = x || speed == 1 ? x : (x - tempx) < 0 ? -1 : 1;
				x += tempx;
				y = parseInt((y - tempy) / 10 * speed);
				y = y || speed == 1 ? y : (y - tempy) < 0 ? -1 : 1;
				y += tempy;
				p.setxy(x, y);
				return;
			}

			if (Math.abs(x - tempx) < parseInt(w / 3 * 2) && Math.abs(y - tempy) < parseInt(w / 3 * 2))
			{
				x = parseInt((x - tempx) / 8 * speed);
				x = x || speed == 1 ? x : (x - tempx) < 0 ? -1 : 1;
				x += tempx;
				y = parseInt((y - tempy) / 8 * speed);
				y = y || speed == 1 ? y : (y - tempy) < 0 ? -1 : 1;
				y += tempy;
				p.setxy(x, y);
				return;
			}

			if (Math.abs(x - tempx) < w && Math.abs(y - tempy) < w)
			{
				x = parseInt((x - tempx) / 6 * speed);
				x = x || speed == 1 ? x : (x - tempx) < 0 ? -1 : 1;
				x += tempx;
				y = parseInt((y - tempy) / 6 * speed);
				y = y || speed == 1 ? y : (y - tempy) < 0 ? -1 : 1;
				y += tempy;
				p.setxy(x, y);
				return;
			}
		}
		else {
			//speed == 2 not change
		}

	}




	function setCheckerBoard(x, y, isResetP) //调整棋盘的边框范围，用 mdiv 实时显示效果
	{
		let xL;
		let xM;
		let xR;
		let yT;
		let yM;
		let yB;
		let s;
		let n;
		let tempx;
		let tempy;

		n = mdiv;
		s = mdiv.style;
		xL = n.offsetLeft;
		xR = xL + parseInt(s.width);
		xM = xL + parseInt((xR - xL) / 2);
		yT = n.offsetTop;
		yB = yT + parseInt(s.height);
		yM = yT + parseInt((yB - yT) / 2);


		if (x < xM)
		{
			if (y < yM)
			{
				setDiv(x, y, xR - x, yB - y, s, isResetP);
			}
			else
			{
				setDiv(x, yT, xR - x, y - yT, s, isResetP);
			}
		}
		else
		{

			if (y < yM)
			{
				setDiv(xL, y, x - xL, yB - y, s, isResetP);
			}
			else
			{
				setDiv(xL, yT, x - xL, y - yT, s, isResetP);
			}

		}

	}




	function getrX(div)
	{
		return div.offsetLeft + parseInt(div.style.width);
	}


	function getbY(div)
	{
		return div.offsetTop + parseInt(div.style.height);
	}







	function printBorder()
	{
		let i;

		//alert('printBorder');
		for (i = 0; i < SLTX * SLTY; i++)
		{
			if (P[i] != null) P[i].printBorder();
		}

	}




	function cleBorder()
	{
		let i;
		for (i = 0; i < SLTX * SLTY; i++)
		{
			DIV[i].style.borderStyle = 'none';
		}

	}





	function setDiv(l, t, w, h, s, isResetP) //改变选定框的大小
	{
		let img = bkimg;
		s.position = 'absolute';
		s.left = img.offsetLeft < l ? l : img.offsetLeft;
		s.top = img.offsetTop < t ? t : img.offsetTop;
		s.width = w > parseInt(img.width) ? img.width : w;
		s.height = h > parseInt(img.height) ? img.height : h;
		XL = l;
		XR = XL + w;
		YT = t;
		YB = YT + h;

		if (isResetP)
		{
			resetP(XL, XR, YT, YB, true);
		}
	}





	function resetPage()
	{
		try {
			window.DEBUG = true;
			//测试脚本是否加载成功;
			if (!("Button" in self) || !("View" in self)) { location.reload(); return; }
			if (String(window.location).indexOf("http://localhost") == 0) {
				let vConsole;
				if (vConsole == null) vConsole = new VConsole();
			}
			//alert('resetPage');
			bodyDiv.addEventListener("click", Click, true);
			bodyDiv.addEventListener("contextmenu", keepTouch, true);
			bodyDiv.addEventListener("touchstart", touchstart, true);
			bodyDiv.addEventListener("touchend", touchend, true);
			bodyDiv.addEventListener("touchmove", touchmove, true);
			bodyDiv.addEventListener("touchcancel", touchcancel, true);
			bodyDiv.addEventListener("touchmove", touchmove, true);
			let i;
			for (i = 0; i < 225; i++)
			{
				P[i] = new point(0, 0, DIV[i]);
			}

			saveMaxHistory();
			tempHistoryIndex = loadHistoryIndex();
			loadHistory();
			//setTimeout(() => { window.scrollTo(0, dw > dh ? 0 : parseInt(fileDiv.style.top) - sw / 9 / 1.5 * 1.8); }, 1);
		}
		catch (err) {
			//console.log("reLoad");
			//location.reload();
		}
	}







	// 数字屏幕下面按键的位置
	function resetCmdDiv()
	{
		let n = ndiv;
		if (chkLock.checked) {
			bodyDiv.appendChild(ndiv);
			viewport.resize();
			//alert("resize")
		}
		else {
			if (ndiv.parentNode) ndiv.parentNode.removeChild(ndiv);
			viewport.userScalable();
			//alert("resize us")
		}

		n.style.position = "absolute";
		n.style.top = dw > dh ? parseInt(fileDiv.style.top) + cH * 1.8 : YB + parseInt(dw / 19 * 2 + dw / 19 * 17 / 9);

	}





	function resetImg()
	{
		let img = bkimg;
		let div = fileDiv;
		img.style.position = 'absolute';
		img.style.clip = 'auto';
		//img.style.top = div.offsetTop + dw / 19 * 2 + parseInt(div.style.height);
		img.style.width = dw > dh ? cWidth : parseInt(dw / 19 * 17);
		//img.style.left = dw / 19;
		img.style.left = `${dw > dh ? parseInt((dw - cWidth * 2) / 2) : dw / 19 }px`;
		img.style.top = `${dw > dh ? parseInt((dh - cWidth) / 2) : div.offsetTop + dw / 19 * 2  + cH }px`;

	}



	function resetMDiv() //重置选定框状态
	{
		let s = mdiv.style;
		//alert('resetMDiv');
		s.position = 'absolute';
		s.borderStyle = 'dashed';
		s.borderWidth = '3px';
		s.borderColor = 'red';
		s.zIndex = 0;

		if (XR == 0 || YB == 0)
		{
			let w = parseInt(bkimg.width) / 2;
			let h = parseInt(bkimg.height) / 2
			s.width = `${w}px`;
			s.height = `${h || w}px`;
			s.left = bkimg.offsetLeft + w / 2;
			//alert("div_left" + s.left);
			s.top = bkimg.offsetTop + (h || w) / 2;

		}

		XL = mdiv.offsetLeft;
		XR = XL + parseInt(s.width);
		YT = mdiv.offsetTop;
		YB = YT + parseInt(s.height);
		resetP(XL, XR, YT, YB, true);
		// printBorder();  
	}




	function hide() //把棋盘选定框隐藏在棋盘后面
	{
		let m = mdiv;
		m.style.borderStyle = 'none';
		m.style.zIndex = "-2";
	}




	function isOut(x, y) // 判断坐标是否出界，出界返回 true
	{
		let xL;
		let xR;
		let yT;
		let yB;
		//let test=0;

		//alert( chkLock.checked)
		if (chkLock.checked)
		{
			xR = XR + parseInt(gW / 2) - 1;
			xL = XL - parseInt(gW / 2) + 1;
			yT = YT - parseInt(gH / 2) + 1;
			yB = YB + parseInt(gW / 2) - 1;
			//test =1;
		}
		else
		{
			xL = parseInt(bkimg.offsetLeft) - dw / 19;
			//alert(xL);
			xR = xL + parseInt(bkimg.width) + dw / 19 * 2;
			//alert(xR);
			yT = parseInt(bkimg.offsetTop) - dw / 19;
			yB = yT + parseInt(bkimg.height) + dw / 19 * 2;


		}

		if (x < xL || x > xR || y < yT || y > yB)
		{
			//alert((test) ? "超出棋盘" :"超出图片")
			return true;
		}


	}




	function sltxChang()
	{

		SLTX = parseInt(sltx.input.value);
		//resetP(XL,XR,YT,YB,true);
		chkLock.setChecked(false);
		openImg(bkimg, tempHistoryIndex, function() {
			resetMDiv(); //
			resetCmdDiv();
			MS.length = 0;
		});
	}



	function sltyChang()
	{

		SLTY = parseInt(slty.input.value);
		//resetP(XL,XR,YT,YB,true);
		chkLock.setChecked(false);
		openImg(bkimg, tempHistoryIndex, function() {
			resetMDiv(); //
			resetCmdDiv();
			MS.length = 0;
		});
	}





	function cimg(name) //加载棋盘图片
	{
		//pn=name;
		// p=0

		chkLock.setChecked(false);
		bkimg.src = null;
		MS.length = 0;
		XR = 0;
		resetCmdDiv();
		putimg();

	}




	function putimg() //加载棋盘图片
	{
		let g = bkimg;
		let reader = new FileReader();
		let file = fileField.input.files[0];

		g.src = null;
		g.width = "120px";
		reader.readAsDataURL(file);
		fileField.input.value = "";
		reader.onload = function() {
			simg = 1;
			g.src = reader.result;
		}
		g.onload = function() {
			g.onload = null;
			tempHistoryIndex = loadHistoryIndex();
			//alert("soimg =" + tempHistoryIndex)
			tempHistoryIndex = getHistoryIndex(1);
			delHistory(tempHistoryIndex);
			//alert("soimg =" + tempHistoryIndex)      
			saveHistoryIndex(tempHistoryIndex);
			save();
			resetImg();
			resetMDiv();
			viewport.resize();
		}
	}






	function save()
	{
		//alert("save");
		let i = bkimg;
		let c = canvas;
		saveImg(i, c, tempHistoryIndex);
		//alert("save end");
	}



	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// 创建一个window
	let sharing = false;

	let shareWindow = document.createElement("div");
	shareWindow.ontouch = function() { if (event) event.preventDefault(); };

	let imgWindow = document.createElement("div");
	imgWindow.ontouch = function() { if (event) event.preventDefault(); };
	shareWindow.appendChild(imgWindow);

	let shareLabel = document.createElement("div");
	imgWindow.appendChild(shareLabel);

	let shareImg = document.createElement("img");
	imgWindow.appendChild(shareImg);

	let bkShareImg = document.createElement("img");
	//imgWindow.appendChild(bkShareImg);
	let bkCanvas = document.createElement("canvas");
	//imgWindow.appendChild(bkCanvas);
	//取消按钮
	let butShareCancel = new Button(imgWindow, "button", 50, 50, 50, 50);
	let timerShareClose = null;

	function xyPageToObj(p, obj) {

		let l = obj.offsetLeft;
		let t = obj.offsetTop;
		let parentNode = obj.parentNode;
		//alert (`offsetLeft = ${obj.offsetLeft} , offsetTop = ${obj.offsetTop}, l = ${l} , t = ${t}`)
		while (parentNode != document.body && parentNode != null) {

			l += parentNode.offsetLeft;
			t += parentNode.offsetTop;
			//alert (`offsetLeft = ${parentNode.offsetLeft} , offsetTop = ${parentNode.offsetTop}, l = ${l} , t = ${t}`)
			parentNode = parentNode.parentNode;

		}
		p.x = p.x - l + 1;
		p.y = p.y - t + 1;
	}

	function share(cBoardColor) {
		try {
			if (timerShareClose) clearTimeout(timerShareClose);
			sharing = true;
			document.body.appendChild(shareWindow);
			let s = shareWindow.style;
			s.position = "fixed";
			s.zIndex = 9999;
			s.width = dw + "px";
			s.height = dh * 2 + "px";
			s.top = "0px";
			s.left = "0px";
			shareWindow.setAttribute("class", "show");

			let imgWidth = dw < dh ? dw : dh;
			imgWidth = parseInt(imgWidth * 3 / 4);
			s = imgWindow.style;
			s.position = "relative";
			s.width = imgWidth + "px";
			s.height = imgWidth + "px";
			s.top = parseInt((dh - imgWidth) / 2) + "px";
			s.left = parseInt((dw - imgWidth) / 2) + "px";
			s.backgroundColor = "#666666";

			let ctx = bkCanvas.getContext("2d");
			let w = parseInt(gW < gH ? gW / 4 * 1.8 : gH / 4 * 1.8);
			let p = { x: 0, y: 0 };
			let lw = 0,
				rw = 0,
				tw = 0,
				bw = 0;
			if (MS.length) {
				let xr = -1000,
					xl = 1000,
					xt = 1000,
					xb = -1000;
				for (let i = 0; i < MS.length; i++) {
					p.x = MS[i].x;
					p.y = MS[i].y;
					xyPageToObj(p, bkimg);
					xr = p.x > xr ? p.x : xr;
					xl = p.x < xl ? p.x : xl;
					xt = p.y < xt ? p.y : xt;
					xb = p.y > xb ? p.y : xb;
				}
				xr += w;
				xl -= w;
				xt -= w;
				xb += w;
				lw = xl < 0 ? lw - xl + 2 : lw;
				rw = xr > bkimg.width ? xr - bkimg.width + 2 : rw;
				tw = xt < 0 ? tw - xt + 2 : tw;
				bw = xb > bkimg.height ? xb - bkimg.height + 2 : bw;
				//alert(`lw = ${lw}, rw = ${rw}, tw = ${tw}, bw = ${bw}`)
			}
			bkCanvas.width = bkimg.width + lw + rw;
			bkCanvas.height = bkimg.height + tw + bw;
			ctx.fillStyle = "#eeeeee";
			ctx.fillRect(0, 0, bkCanvas.width, bkCanvas.height);
			ctx.drawImage(bkimg, lw, tw, bkimg.width, bkimg.height);

			for (let i = 0; i < MS.length; i++) {
				let color;
				let numColor;
				if (MS[0].color == "black")
				{
					color = i % 2 ? 'black' : 'white';
					numColor = i % 2 ? 'white' : 'black';
				}
				else
				{
					if (MS[0].color == "white")
					{
						color = i % 2 ? 'white' : 'black';
						numColor = i % 2 ? 'black' : 'white';
					}
					else
					{
						numColor = MS[i].color;
						//if (MS[0].color == "green") { numColor = i % 2 ? 'red' : 'green'; }
						//else { numColor = i % 2 ? 'green' : 'red'; }
					}
				}
				ctx.lineWidth = 1;
				ctx.beginPath();
				p.x = MS[i].x + lw;
				p.y = MS[i].y + tw;
				xyPageToObj(p, bkimg);
				ctx.arc(p.x, p.y, w, 0, 2 * Math.PI);
				ctx.fillStyle = color;
				if (MS[0].color == "black" || MS[0].color == "white") {
					ctx.fill(); // 填充
					ctx.stroke(); // 描边
					ctx.font = "bolder " + parseInt(w * 1.08) + "px mHeiTi, Roboto, emjFont, Symbola";
				}
				else {
					ctx.font = "bolder " + parseInt(w * 1.08 / 1.8 * 3) + "px mHeiTi, Roboto, emjFont, Symbola";
				}
				ctx.fillStyle = numColor;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(i + 1, p.x, p.y);
			}
			ctx.font = "bolder " + parseInt(w * 1.08 / 1.8 * 2) + "px mHeiTi, Roboto, emjFont, Symbola";
			for (let i = 0; i < P.length; i++) {
				if (P[i].type == TYPE_MARK) {
					p.x = P[i].x + lw;
					p.y = P[i].y + tw;
					xyPageToObj(p, bkimg);
					ctx.fillStyle = P[i].color;
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillText(P[i].text, p.x, p.y);
				}
			}
			ctx = null;

			let iWidth = parseInt(imgWidth * 3 / 5);
			shareImg.src = bkCanvas.toDataURL();
			s = shareImg.style;
			s.position = "absolute";
			if (bkimg.width < bkimg.height) {
				s.width = parseInt(iWidth * (bkimg.width / bkimg.height)) + "px";
				s.height = iWidth + "px";
				s.top = parseInt((imgWidth - iWidth) / 2) + "px";
				s.left = parseInt((imgWidth - parseInt(s.width)) / 2) + "px";
			}
			else {
				s.width = iWidth + "px";
				s.height = parseInt(iWidth * (bkimg.height / bkimg.width)) + "px";
				s.top = parseInt((imgWidth - parseInt(s.height)) / 2) + "px";
				s.left = parseInt((imgWidth - iWidth) / 2) + "px";
			}

			let h = parseInt((imgWidth - iWidth) / 2 / 2);
			w = h * 3;
			let l = (imgWidth - w) / 2;
			let t = imgWidth - h - (imgWidth - iWidth) / 8;

			shareLabel.innerHTML = `<h1 style = "font-size: ${h*0.45}px;text-align: center;color:white">长按图片分享</h1>`;
			s = shareLabel.style;
			s.position = "absolute";
			s.width = w + "px";
			s.height = h + "px";
			s.top = (imgWidth - iWidth) / 8 + "px";
			s.left = l + "px";
			s.backgroundColor = "#666666";

			butShareCancel.show(l, t, w, h);
			butShareCancel.setText("关闭分享");
			butShareCancel.setontouchend(function() {
				shareClose();
			});
		}
		catch (err) {
			shareClose();
		}
	}

	function shareClose() {

		shareWindow.setAttribute("class", "hide");
		setTimeout(() => { shareWindow.parentNode.removeChild(shareWindow) }, ANIMATION_TIMEOUT);
		timerShareClose = setTimeout("sharing = false", 1000);

	}
})()