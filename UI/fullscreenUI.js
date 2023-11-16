window.fullscreenUI = (() => {
	try{
		
		const svgFullscreen = "./UI/theme/light/fullscreen-alt-svgrepo-com.svg";
		const svgExitFullscreen = "./UI/theme/light/fullscreen-exit-alt-svgrepo-com.svg";
		const svgRefresh = "./UI/theme/light/arrow-cw-svgrepo-com.svg";
		const svgTuya = "./UI/theme/light/pen-tool-svgrepo-com.svg";
		
		const svgRenju = "./UI/theme/light/contrast-setting-svgrepo-com.svg";
		const svgDBRead = "./UI/theme/light/alpha-w.svg";
		const svgEditor = "./UI/theme/light/alpha-k.svg";
		const svgMakeVCF = "./UI/theme/light/alpha-v.svg";
		
		const svgTheme01 = "./UI/theme/light/sun-svgrepo-com.svg";
		const svgTheme02 = "./UI/theme/light/exposure-2-svgrepo-com.svg";
		const svgTheme03 = "./UI/theme/light/eye-svgrepo-com.svg";
		const svgTheme04 = "./UI/theme/light/moon-svgrepo-com.svg";
		
		const svgRight_Down = "./UI/theme/light/arrow-cw-svgrepo-com.svg";
		const svgDown_Right = "./UI/theme/light/arrow-ccw-svgrepo-com.svg";
		const dw = document.documentElement.clientWidth;
		const dh = document.documentElement.clientHeight;
		const sw = window.screen.width;
		const sh = window.screen.height;
		const gridWidth = 980;
		const boardH = dw < dh ? dw :
			dh * 2 < dw ?
			dh : dw / 2;
			
		const w_scale = sw / 2 / boardH;
		const h_scale = sh / boardH;
		const scale = dw < dh ? sw / dw:
			w_scale < h_scale ?
			w_scale : h_scale;
			
		const numButtons = 4;
		const btnTag = "div";
		
		const butWidth = ~~(boardH * 98 / gridWidth);
		const imgWidth = butWidth / 1.8;
		const butPadding = (butWidth - imgWidth) / 2;
		
		const bodyDiv = document.createElement("div");
		
		const fullscreenDiv = document.createElement("div")
		const IFRAME = document.createElement("iframe");
		
		const btnBoard = new ButtonBoard(fullscreenDiv, (dw - butWidth) / 2, dh - butWidth * 1.5, butWidth, butWidth, 8)
		btnBoard.board.style.zIndex = "8";
		const [btnRenju, btnDBRead, btnRenjuEditor, btnMakeVCF] = btnBoard.rightButtons;
		
		btnRenju.setText("R");
		btnDBRead.setText("W");
		btnRenjuEditor.setText("E");
		btnMakeVCF.setText("V");
		
		btnRenju.setontouchend(()=>IFRAME.src = "renju.html")
		btnRenju.setIcons(svgRenju)
		
		btnDBRead.setontouchend(()=>IFRAME.src = "dbread.html")
		btnDBRead.setIcons(svgDBRead)
		
		btnRenjuEditor.setontouchend(()=>IFRAME.src = "renjueditor.html")
		btnRenjuEditor.setIcons(svgEditor)
		
		btnMakeVCF.setontouchend(()=>IFRAME.src = "makevcf.html")
		btnMakeVCF.setIcons(svgMakeVCF)
		
		const [btnHome, btnFullscreen, btnTheme, btnRefresh] = btnBoard.leftButtons;
		
		btnHome.setText("P");
		btnFullscreen.setText("F");
		btnRefresh.setText("O");
		btnTheme.setText("T");
		
		btnHome.setontouchend(()=>IFRAME.src = "tuya.html")
		btnHome.setIcons(svgTuya)
		
		btnFullscreen.setClickFunctions([requestFullscreen, exitFullscreen]);
		btnFullscreen.setIcons([svgFullscreen, svgExitFullscreen])
		
		btnRefresh.setontouchend(() => fullscreenButtons.refresh());
		btnRefresh.setIcons([svgRefresh])
		
		const themeNames = ["light", "green", "dark"];
		btnTheme.setontouchend([() => setTheme(themeNames[0]), () => setTheme(themeNames[1]), () => setTheme(themeNames[2])])
		btnTheme.setIcons([svgTheme01, svgTheme03, svgTheme04])
		
		const btnRotateRight = new ImgButton(bodyDiv, 0, 0, butWidth * 3, butWidth * 3);
		const btnRotateDown = new ImgButton(bodyDiv, 0, 0, butWidth * 3, butWidth * 3);
		btnRotateRight.setText("R")
		btnRotateDown.setText("D")
		btnRotateRight.setIcons(svgDown_Right)
		btnRotateDown.setIcons(svgRight_Down)
		
		document.body.appendChild(bodyDiv);
		bodyDiv.appendChild(fullscreenDiv);
		fullscreenDiv.appendChild(IFRAME);
		
		Object.assign(bodyDiv.style, {
			padding: "0px 0px 0px 0px",
			mrgin: "0px 0px 0px 0px",
			border: "none",
			position: "absolute",
			left: "0px",
			top: "0px",
			width: dw + "px",
			height: dh + "px"
		})
		
		Object.assign(fullscreenDiv.style, {
			padding: "0px 0px 0px 0px",
			mrgin: "0px 0px 0px 0px",
			border: "none",
			position: "absolute",
			left: "0px",
			top: "0px",
			width: dw + "px",
			height: dh + "px",
			border: "0px dashed black",
			zIndex: "1"
		})
		
		Object.assign(IFRAME.style, {
			padding: "0px 0px 0px 0px",
			mrgin: "0px 0px 0px 0px",
			background: "#fff",
			border: "none",
			scroll: "no",
			position: "absolute",
			left: `0px`,
			top: `0px`,
			width: dw + "px",
			height: dh + "px",
			zIndex: "2"
		})
		
		const fullscreenButtons = (() => {
			let touchmoveCount;
			let touchendCount;
			let lastTime;
			let timer;
			let rotate = 0;
			const defaultDelay = 5000;
			
			const autoFullscreen = () => { document.fullscreenElement && exitFullscreen() || requestFullscreen() }
			const refresh = () => { (IFRAME.contentWindow.reloadApp || window.location.reload)() }
			
			window.addEventListener("mousemove", touchmove, true);
			window.addEventListener("mouseup", touchend, true);
			IFRAME.addEventListener("load", () => {
				//window.console = IFRAME.contentWindow.console;
				IFRAME.contentWindow.addEventListener("scroll", touchmove, true);
				IFRAME.contentWindow.addEventListener("touchmove", touchmove, true);
				IFRAME.contentWindow.addEventListener("mousemove", touchmove, true);
				IFRAME.contentWindow.addEventListener("touchend", touchend, true);
				IFRAME.contentWindow.addEventListener("mouseup", touchend, true);
				firstRequestFullscreen(IFRAME.contentWindow);
				show();
				loadTheme();
			}, true);
			
			btnBoard.board.addEventListener("touchstart", () => { lastTime = new Date().getTime() + defaultDelay}, true)
			btnBoard.board.addEventListener("mousedown", () => { lastTime = new Date().getTime() + defaultDelay }, true)
			
			bodyDiv.addEventListener("fullscreenchange", function(e) {
				if (document.fullscreenElement) {
					setFullscreenStyle();
					setRotateButtonStyle();
					showRotateButtons();
					rotate = 0
				}
				else {
					exitFullscreenStyle();
					hideRotateButtons();
					rotate = 0;
				}
			});
			
			
			btnRotateRight.setontouchend(rotateIframeRight);
			
			btnRotateDown.setontouchend(rotateIframeDown);
			
			reset();
			
			function reset() {
				touchmoveCount = 0;
				touchendCount = 0;
				lastTime = 0;
				timer = clearInterval(timer) && null;
			}
			
			function show(delay = defaultDelay) {
				console.info("show")
				lastTime = new Date().getTime();
				timer = setInterval(() => {
					new Date().getTime() - lastTime > delay && hide()
				}, 1000);
				btnBoard.show()
			}
			
			function hide() {
				reset();
				btnBoard.state == 1 && btnBoard.topButtons[0].defaultontouchend();
				btnBoard.hide();
			}
			
			function touchmove() {
				const time = new Date().getTime();
				time - lastTime < 500 && touchmoveCount++;
				lastTime = time;
				!timer && touchmoveCount > 5 && show();
				//window.console.log(`fullscreenButtons.touchmove: event.type = ${event.type}, touchmoveCount = ${touchmoveCount}`)
			}
			
			function touchend() {
				touchmoveCount = 0;
				//timer && ++touchendCount > 1 && hide();
				//window.console.log(`fullscreenButtons.touchend: event.type = ${event.type}, touchmoveCount = ${touchendCount}`)
			}
			
			function showRotateButtons() {
				btnRotateRight.show()
				btnRotateDown.show()
				//console.log("showRotateButtons")
			}
			
			function hideRotateButtons() {
				btnRotateRight.hide()
				btnRotateDown.hide()
				//console.log("hideRotateButtons")
			}
		
			function setRotateButtonStyle() {
				const isFull = document.fullscreenElement;
				const _width =  parseInt(btnRotateRight.width);
				let transformOrigin = `${ _width / 2 }px ${ _width / 2 }px`;
				let transform = isFull ? `scale(${scale}) rotate(0.25turn)` : `scale(${1}) rotate(0.25turn)`;
				
				let left = dw < dh ? ((isFull ? sw : dw) - _width) / 2 + boardH * (isFull ? scale : 1) :
					((isFull ? sw : dw) - _width) / 2 + boardH / 2 * (isFull ? scale : 1)
				let top = dw < dh ? ((isFull ? sh : dh) - _width) / 2 - boardH / 2 * (isFull ? scale : 1) :
					((isFull ? sh : dh) - _width) / 2
				
				Object.assign(btnRotateRight.div.style, { transformOrigin, transform })
				btnRotateRight.move(left, top)
				
				left = dw < dh ? ((isFull ? sw : dw) - _width) / 2 :
					((isFull ? sw : dw) - _width) / 2 - boardH / 2 * (isFull ? scale : 1)
				top = dw < dh ? ((isFull ? sh : dh) - _width) / 2 + boardH / 2 * (isFull ? scale : 1) :
					((isFull ? sh : dh) - _width) / 2 + boardH * (isFull ? scale : 1)
				
				Object.assign(btnRotateDown.div.style, { transformOrigin, transform })
				btnRotateDown.move(left, top)
			}
			
			function rotateIframeRight() {
				const h = Math.max(sw, sh);
				const w = Math.min(sw, sh);
				rotate -= 0.25;
				Object.assign(fullscreenDiv.style, {
					left: parseInt(fullscreenDiv.style.left) + (h - w) / 2 + "px",
					top: parseInt(fullscreenDiv.style.top) - (h - w) / 2 + "px",
					transform: `scale(${scale}) rotate(${rotate}turn)`
				})
			}
			
			function rotateIframeDown() {
				const h = Math.max(sw, sh);
				const w = Math.min(sw, sh);
				rotate += 0.25;
				Object.assign(fullscreenDiv.style, {
					left: parseInt(fullscreenDiv.style.left) - (h - w) / 2 + "px",
					top: parseInt(fullscreenDiv.style.top) + (h - w) / 2 + "px",
					transform: `scale(${scale}) rotate(${rotate}turn)`
				})
			}
			
			return { show, hide, autoFullscreen, refresh, touchmove, touchend };
		})()
		
		function requestFullscreen(element = bodyDiv) {
			if (document.fullscreenElement) return;
			if (element.requestFullscreen) {
				element.requestFullscreen();
			}
			//FireFox
			else if (element.mozRequestFullScreen) {
				element.mozRequestFullScreen();
			}
			//Chrome等
			else if (element.webkitRequestFullScreen) {
				element.webkitRequestFullScreen();
			}
			//IE11
			else if (element.msRequestFullscreen) {
				element.msRequestFullscreen();
			}
		}
		
		function exitFullscreen() {
			if (!document.fullscreenElement) return;
			document.exitFullscreen();
		}
			
		function setFullscreenStyle() {
			if (!document.fullscreenElement) return;
			const styleScale = `scale(${scale})`;
			
			if (dw < dh) {
				fullscreenDiv.style.height = `${parseInt(fullscreenDiv.style.width) * sh / sw }px`;
				IFRAME.style.height = parseInt(fullscreenDiv.style.height) + "px";
			}
			fullscreenDiv.style.left = `${ (sw - parseInt(fullscreenDiv.style.width)) / 2 }px`;
			fullscreenDiv.style.top = `${ (sh - parseInt(fullscreenDiv.style.height)) / 2 }px`;
			fullscreenDiv.style.transformOrigin = `${ parseInt(fullscreenDiv.style.width) / 2 }px ${ parseInt(fullscreenDiv.style.height) / 2 }px`;
			fullscreenDiv.style.transform = styleScale;
			
			bodyDiv.style.width = sw + "px";
			bodyDiv.style.height = sh + "px";

			//去掉全屏黑边
			const contentDocument = IFRAME.contentWindow.document;
			const backgroundColor = contentDocument.body.style.backgroundColor || contentDocument.body.style.background || "white";
			bodyDiv.style.backgroundColor = backgroundColor;
			
			btnBoard.moveCenter(dw / 2, parseInt(IFRAME.style.height) / 2 + sh / 2 / scale - butWidth)
			
			btnBoard.leftButtons[1].clickFunctionIndex = 1;
			btnBoard.leftButtons[1].show();
		}

		function exitFullscreenStyle() {
			if (document.fullscreenElement) return;
			const styleScale = `scale(1)`;
			
			fullscreenDiv.style.left = `0px`;
			fullscreenDiv.style.top = `0px`;
			fullscreenDiv.style.height = dh + "px";
			IFRAME.style.height = parseInt(fullscreenDiv.style.height) + "px"
			fullscreenDiv.style.transformOrigin = "0px 0px";
			fullscreenDiv.style.transform = styleScale;
			
			bodyDiv.style.width = dw + "px";
			bodyDiv.style.height = dh + "px";
			
			btnBoard.moveCenter(dw / 2, dh - butWidth)
			
			btnBoard.leftButtons[1].clickFunctionIndex = 0;
			btnBoard.leftButtons[1].show();
		}
		
		const firstRequestFullscreen = (() => {
			let count = 0;
			function firstRequestFullscreen(element) {
				function first() {
					element.removeEventListener("touchmove", first, true);
					element.removeEventListener("mousemove", first, true);
					element.removeEventListener("touchend", first, true);
					element.removeEventListener("mouseup", first, true);
					element.removeEventListener("keydown", first, true);
					element.removeEventListener("keyup", first, true);
					console.warn(`fullscreenUI.js: ${element} ${event.type} first requestFullscreen`)
					requestFullscreen()
				}
			
				element.addEventListener("touchmove", first, true);
				element.addEventListener("mousemove", first, true);
				element.addEventListener("touchend", first, true);
				element.addEventListener("mouseup", first, true);
				element.addEventListener("keydown", first, true);
				element.addEventListener("keyup", first, true);
			}
			return (element) => {count++ == 0 && firstRequestFullscreen(element)}
		})()

//---------------------- themes ------------------------

	const themes = {"light":"light", "grey":"grey", "green":"green", "dark":"dark"};
	const defaultTheme = "light";
	
	async function _theme(themeKey, cancel) {
		const theme = await loadJSON(`UI/theme/${themeKey}/theme.json`);
		Object.assign(document.body.style, theme["body"]);
		Object.assign(bodyDiv.style, theme["body"]);
		Object.assign(fullscreenDiv.style, theme["body"]);
		Object.assign(IFRAME.style, theme["body"]);
		
		const btnTheme = theme["Button"];
		Object.assign(btnTheme, theme["fullscreenUI"]["btnRotateRight"]);
		btnRotateRight.loadTheme(btnTheme);
		
		Object.assign(btnTheme, theme["fullscreenUI"]["btnRotateDown"]);
		btnRotateDown.loadTheme(btnTheme);
		
		btnBoard.loadTheme({ ButtonBoard: theme["ButtonBoard"], btnBoard: theme["fullscreenUI"]["btnBoard"], Button: btnTheme })
		
	    btnBoard.leftButtons[2].clickFunctionIndex = (themeNames.indexOf(themeKey) + 1) % themeNames.length;
	    btnBoard.leftButtons[2].show();
	    if (!cancel && IFRAME.contentWindow.mainUI && (typeof IFRAME.contentWindow.mainUI.loadTheme === "function")) IFRAME.contentWindow.mainUI.loadTheme(true)
	}
	
	function setTheme(themeKey = defaultTheme, cancel) {
		themeKey = themes[themeKey] || defaultTheme;
		localStorage.setItem("theme", themeKey);
		_theme.call(this, themeKey, cancel);
	}
	
	function loadTheme(cancel) {
		let themeKey = localStorage.getItem("theme");
		setTheme.call(this, themeKey, cancel);
	}
	
	function getThemeName() {
		return localStorage.getItem("theme");
	}

//----------------------------------------------------------------------------------

		return {
			get loadTheme() { return loadTheme },
			get iframe() { return IFRAME },
			get contentWindow() { return IFRAME.contentWindow },
			get src() { return IFRAME.src; },
			set src(url) {  return IFRAME.src = url; },
		}
}catch(e){alert(e.stack)}
})()