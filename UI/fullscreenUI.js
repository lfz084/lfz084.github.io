window.fullscreenUI = (() => {
		const svgFullscreen = "./pic/fullscreen-alt-svgrepo-com.svg";
		const svgExitFullscreen = "./pic/fullscreen-exit-alt-svgrepo-com.svg";
		const svgRefresh = "./pic/arrow-cw-svgrepo-com.svg";
		const svgRight2l_Down = "./pic/arrow-turn-right-down-svgrepo-com.svg";
		const svgDown_Right = "./pic/arrow-turn-down-right-svgrepo-com.svg";
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
		const scale = dw < dh ? sw / dw :
			w_scale < h_scale ?
			w_scale : h_scale;
		
		const bodyDiv = document.createElement("div");
		const fullscreenDiv = document.createElement("div")
		const IFRAME = document.createElement("iframe");
		const btnFullscreen = document.createElement("img");
		const btnRefresh = document.createElement("img");
		const btnRotateRight = document.createElement("img");
		const btnRotateDown = document.createElement("img");

		document.body.appendChild(bodyDiv);
		bodyDiv.appendChild(fullscreenDiv);
		fullscreenDiv.appendChild(IFRAME);

		Object.assign(bodyDiv.style, {
			padding: "0px 0px 0px 0px",
			borderStyle: "none",
			border: "hidden",
			position: "absolute",
			left: "0px",
			top: "0px",
			width: dw + "px",
			height: dh + "px"
		})
		
		Object.assign(fullscreenDiv.style, {
			padding: "0px 0px 0px 0px",
			borderStyle: "none",
			border: "hidden",
			position: "absolute",
			left: "0px",
			top: "0px",
			width: dw + "px",
			height: dh + "px",
			zIndex: "1"
		})

		Object.assign(IFRAME.style, {
			padding: "0px 0px 0px 0px",
			borderStyle: "none",
			background: "#fff",
			border: "hidden",
			overflow: "hidden",
			scroll: "no",
			position: "absolute",
			left: "0px",
			top: "0px",
			width: dw + "px",
			height: dh + "px"
		})
		
		const butWidth = ~~(boardH * 180 / gridWidth);
		const butStyle = {
			position: "fixed",
			width: butWidth + "px",
			height: butWidth + "px",
			opacity: "0.638",
			borderRadius: butWidth / 2 + "px",
			border: "none",
			zIndex: "#ffffff",
			opacity: "0.33",
			backgroundColor: "#999"
		};
		
		Object.assign(btnRefresh.style, butStyle)
		Object.assign(btnFullscreen.style, butStyle)
		butStyle.position = "fixed";
		Object.assign(btnRotateRight.style, butStyle)
		Object.assign(btnRotateDown.style, butStyle)
	
		const fullscreenButtons = (() => {
			let touchmoveCount;
			let touchendCount;
			let lastTime;
			let timer;
			let rotate = 0;
			const funClick = (callback) => {
				event.cancelBubble = true;
				event.preventDefault();
				callback();
			};
			const autoFullscreen = () => { hide();  document.fullscreenElement && fullscreenCancle() || fullscreenEnabled() }
			const refresh = () => { hide(); (IFRAME.contentWindow.reloadApp || window.location.reload)() }
			
			IFRAME.addEventListener("load", () => {
				//window.console = IFRAME.contentWindow.console;
				IFRAME.contentWindow.addEventListener("scroll", touchmove, true);
				IFRAME.contentWindow.addEventListener("touchmove", touchmove, true);
				IFRAME.contentWindow.addEventListener("mousemove", touchmove, true);
				IFRAME.contentWindow.addEventListener("touchend", touchend, true);
				IFRAME.contentWindow.addEventListener("mouseup", touchend, true);
				show(3000);
			}, true);
			
			bodyDiv.addEventListener("fullscreenchange", function(e) {
				if (document.fullscreenElement) {
					setRotateButtonStyle();
					showRotateButtons();
					rotate = 0
				}
				else {
					fullscreenCancle();
					hideRotateButtons();
					rotate = 0;
				}
			});
			
			btnFullscreen.addEventListener("touchend", () => funClick(autoFullscreen), true);
			btnFullscreen.addEventListener("mouseup", () => funClick(autoFullscreen), true);
			btnRefresh.addEventListener("touchend", () => funClick(refresh), true);
			btnRefresh.addEventListener("mouseup", () => funClick(refresh), true);
			
			btnRotateRight.addEventListener("touchend", () => funClick(rotateIframeRight), true);
			btnRotateRight.addEventListener("mouseup", () => funClick(rotateIframeRight), true);
			
			btnRotateDown.addEventListener("touchend", () => funClick(rotateIframeDown), true);
			btnRotateDown.addEventListener("mouseup", () => funClick(rotateIframeDown), true);
			
			reset();
			
			function reset() {
				touchmoveCount = 0;
				touchendCount = 0;
				lastTime = 0;
				timer = clearInterval(timer) && null;
			}
			
			function show(delay = 1200) {
				//console.debug("show")
				lastTime = new Date().getTime();
				timer = setInterval(() => {
					new Date().getTime() - lastTime > delay && hide()
				}, 1000);
				setFullscreenButtonStyle();
				showFullscreenButtons();
			}
			
			function hide() {
				reset();
				hideFullscreenButtons();
			}
			
			function touchmove() {
				const time = new Date().getTime();
				time - lastTime < 500 && touchmoveCount++;
				lastTime = time;
				!timer && touchmoveCount > 5 && show();
				//window.console.log(`touchmoveCount: ${touchmoveCount}`)
			}
			
			function touchend() {
				touchmoveCount = 0;
				timer && ++touchendCount > 1 && hide();
				//window.console.log(`${event.type}: ${touchendCount}`)
			}
			
			function showFullscreenButtons() {
				fullscreenDiv.appendChild(btnFullscreen);
				fullscreenDiv.appendChild(btnRefresh);
			}
			
			function hideFullscreenButtons() {
				fullscreenDiv.removeChild(btnFullscreen);
				fullscreenDiv.removeChild(btnRefresh);
			}
			
			function showRotateButtons() {
				bodyDiv.appendChild(btnRotateRight);
				bodyDiv.appendChild(btnRotateDown);
			
			}
			
			function hideRotateButtons() {
				bodyDiv.removeChild(btnRotateRight);
				bodyDiv.removeChild(btnRotateDown);
			}
			
			function setFullscreenButtonStyle() {
				const isFull = document.fullscreenElement;
				const nowWidth = parseInt(fullscreenDiv.style.width);
				const nowHeight = parseInt(fullscreenDiv.style.height);
				
				let color = IFRAME.contentWindow.document.body.style.color || "black";
				let backgroundColor = IFRAME.contentWindow.document.body.style.backgroundColor || "white";
				
				let left = dw < dh && isFull ? ( nowWidth - butWidth) / 2 - butWidth + "px" :
					(nowWidth- butWidth) / 2 + "px";
				let top = dw < dh && isFull ? nowHeight - butWidth * 1.5 + "px" :
					nowHeight - butWidth * 3.5 + "px";
					
				Object.assign(btnFullscreen.style, { left, top })
				btnFullscreen.src = isFull ? svgExitFullscreen : svgFullscreen;
				//console.debug(`setFullscreenButtonStyle: ${left},${top}`)
				
				dw < dh && isFull ? left = parseInt(left) + butWidth * 2 + "px" :
					top = parseInt(top) + butWidth * 2 + "px"
				
				Object.assign(btnRefresh.style, { left, top })
				btnRefresh.src = svgRefresh;
				//console.debug(`setFullscreenButtonStyle: ${left},${top}`)
			}
			
			function setRotateButtonStyle() {
				const isFull = document.fullscreenElement;
				let transformOrigin = `${ butWidth / 2 }px ${ butWidth / 2 }px`;
				let transform = isFull ? `scale(${scale})` : `scale(${1})`;
				let color = IFRAME.contentWindow.document.body.style.color || "black";
				let backgroundColor = IFRAME.contentWindow.document.body.style.backgroundColor || "white";
				
				let left = dw < dh ? ((isFull ? sw : dw) - butWidth) / 2 + boardH * (isFull ? scale : 1) + "px" :
					((isFull ? sw : dw) - butWidth) / 2 + boardH / 2 * (isFull ? scale : 1) + "px"
				let top = dw < dh ? ((isFull ? sh : dh) - butWidth) / 2 - boardH / 2 * (isFull ? scale : 1) + "px" :
					((isFull ? sh : dh) - butWidth) / 2 + "px"
				
				Object.assign(btnRotateRight.style, { left, top, transformOrigin, transform })
				btnRotateRight.src = svgDown_Right;
				
				left = dw < dh ? ((isFull ? sw : dw) - butWidth) / 2 + "px" :
					((isFull ? sw : dw) - butWidth) / 2 - boardH / 2 * (isFull ? scale : 1) + "px"
				top = dw < dh ? ((isFull ? sh : dh) - butWidth) / 2 + boardH / 2 * (isFull ? scale : 1) + "px" :
					((isFull ? sh : dh) - butWidth) / 2 + boardH * (isFull ? scale : 1) + "px"
				
				Object.assign(btnRotateDown.style, { left, top, transformOrigin, transform })
				btnRotateDown.src = svgRight2l_Down;
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
			
			return { show, hide, touchmove, touchend };
		})()

		function fullscreenEnabled() {
			const styleScale = `scale(${scale})`;
			
			if (dw < dh) {
				fullscreenDiv.style.height = IFRAME.style.height = `${parseInt(fullscreenDiv.style.width) * sh / sw }px`;
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

			requestFullScreen(bodyDiv);
		}

		function fullscreenCancle() {
			const styleScale = `scale(1)`;

			document.exitFullscreen();

			fullscreenDiv.style.left = `0px`;
			fullscreenDiv.style.top = `0px`;
			fullscreenDiv.style.height = IFRAME.style.height = dh + "px";
			fullscreenDiv.style.transformOrigin = "0px 0px";
			fullscreenDiv.style.transform = styleScale;
			
			bodyDiv.style.width = dw + "px";
			bodyDiv.style.height = dh + "px";
		}


		function requestFullScreen(element) {
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

		return {
			get iframe() { return IFRAME },
			get contentWindow() { return IFRAME.contentWindow },
			get src() { return IFRAME.src; },
			set src(url) {  return IFRAME.src = url; },
		}
		
})()