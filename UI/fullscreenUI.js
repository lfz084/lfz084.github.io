window.fullscreenUI = (function() {
	'use strict';
	const debug = 0

	const dw = document.documentElement.clientWidth;
	const dh = document.documentElement.clientHeight;
	const sw = window.screen.width;
	const sh = window.screen.height;
	const boardH = dw < dh ? dw :
		dh * 2 < dw ?
		dh : dw / 2;
	const wScale = sw / boardH / 2;
	const hScale = sh / boardH;
	const scale = dw < dh ? sw / dw :
		wScale < hScale ?
		wScale : hScale;

	const IFRAME = document.createElement("iframe");
	const fullDiv = document.createElement("fullDiv");
	const btn = document.createElement("img");
	
	document.body.appendChild(fullDiv);
	fullDiv.appendChild(IFRAME);
	fullDiv.appendChild(btn);

	document.body.onload = function() {
		fullDiv.style.top = dw < dh ? "0px" : (dh - boardH) / 2 + "px";
		fullDiv.style.width = dw + "px";
		fullDiv.style.height = dh + "px";
		IFRAME.style.width = dw + "px";
		IFRAME.style.height = dh + "px";
		IFRAME.src = "./renju.html";
	}

	btn.onclick = function() {
		if (!document.fullscreenElement) {
			fullScreen(true)
		}
		else {
			document.exitFullscreen();
		}
	};

	const fullScreen = (() => {

		function Fullenabled() {

			fullDiv.style.display = "none";
			IFRAME.style.left = `${dw<dh ? 0: (sw-dw)/2}px`;
			if (dw < dh) {
				IFRAME.style.width = dw + "px";
				IFRAME.style.height = sh / scale + "px";
			}
			else {
				IFRAME.style.top = dw < dh ? 0 : (sh - dh * scale) / 2 / scale + "px";
			}

			IFRAME.style.transform = "scale(" + scale + ")";
			IFRAME.style.webkitTransform = "scale(" + scale + ")";
			IFRAME.style.mozTransform = "scale(" + scale + ")";
			IFRAME.style.transformOrigin = `${dw<dh ? 0: dw/2}px 0px`;


			btn.style.transform = "scale(" + scale + ")";
			btn.style.webkitTransform = "scale(" + scale + ")";
			btn.style.mozTransform = "scale(" + scale + ")";
			btn.style.transformOrigin = "0 0";

			requestFullScreen(fullDiv);
			fullDiv.style.left = 0 + "px";

			fullDiv.style.width = sw + "px";
			fullDiv.style.height = sh + "px";

			fullDiv.style.display = "block"
		}

		function Fullcancle() {
			fullDiv.style.display = "none";
			fullDiv.style.left = 0 + "px";
			fullDiv.style.top = dw < dh ? "0px" : (dh - boardH) / 2 + "px";
			fullDiv.style.width = dw + "px";
			fullDiv.style.height = dh + "px";

			btn.style.transform = "scale(" + 1 + ")";
			btn.style.webkitTransform = "sacale(" + 1 + ")";
			btn.style.mozTransform = "scale(" + 1 + ")";
			btn.style.transformOrigin = "0 0";

			IFRAME.style.left = `0px`;
			IFRAME.style.top = `0px`;
			if (dw < dh) {
				IFRAME.style.width = dw + "px";
				IFRAME.style.height = sh / scale + "px";
			}
			IFRAME.style.transform = "scale(" + 1 + ")";
			IFRAME.style.webkitTransform = "scale(" + 1 + ")";
			IFRAME.style.mozTransform = "scale(" + 1 + ")";
			IFRAME.style.transformOrigin = "0 0";
			fullDiv.style.display = "block"
		}

		return (enabled) => {
			if (enabled) {
				Fullenabled()
			}
			else {
				Fullcancle()
			}
		}
	})()


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

})()