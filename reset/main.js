(async () => {
	try{
    "use strict";
    const d = document;
    const dw = d.documentElement.clientWidth;
    const dh = d.documentElement.clientHeight;
    
    
    function $(id) { return document.getElementById(id) };

    function log(text) { 
    	const logDiv = $("log");
    	logDiv.innerHTML += text;
    	logDiv.scrollTop += 500;
    }
    
    //-----------------------------------------------------------------------
    class removeButton {
    	constructor(parent, src, title, callback = () => {}) {
    		const div = document.createElement("div");
    		const img = document.createElement("img");
    		const label = document.createElement("label");
    
    		const height = mainUI.buttonHeight * 1.8;
    		const fontSize = mainUI.buttonHeight;
    
    		parent.appendChild(div);
    		div.appendChild(img);
    		div.appendChild(label);
    
    		img.src = src;
    		label.innerHTML = title;
    
    		Object.assign(div.style, {
    			position: "relative",
    			height: height + "px"
    		})
    
    		Object.assign(img.style, {
    			position: "absolute",
    			left: "0px",
    			top: "5px",
    			width: height - 10 + "px",
    			height: height - 10 + "px",
    			borderRadius: "50%",
    			opacity: 0.6
    		})
    
    		Object.assign(label.style, {
    			position: "absolute",
    			left: parseInt(img.style.width) + 15 + "px",
    			top: img.style.top,
    			fontSize: fontSize + "px",
    			lientHeight: fontSize + "px"
    		})
    		div.addEventListener("click", callback, true);
    	}
    }
    
    async function removeServiceWorker() {
    	return "serviceWorker" in navigator &&
    		"getRegistrations" in navigator.serviceWorker &&
    		navigator.serviceWorker.getRegistrations()
    		.then(registrations => {
    			registrations.map(registration => {
    				if (window.location.href.indexOf(registration.scope) + 1) {
    					registration.unregister();
    					log(`删除 serviceWorker ${registration.scope}<br>`);
    				}
    			})
    		})
    }
    
    async function removeCaches() {
    	return "caches" in window &&
    		caches.keys()
    		.then(keys => {
    			keys.map(key => {
    				caches.delete(key);
    				log(`删除 caches ${key}<br>`);
    			})
    		})
    }
    
    async function removeLocalStorage() {
    	"localStorage" in window &&
    		Object.keys(localStorage).map(key => {
    			localStorage.removeItem(key);
    			log(`删除 localStorage ${key}<br>`);
    		})
    }
    
    async function removeDatabass() {
    	await IndexedDB.delete("lfz084");
    	log(`删除本地数据库<br>`);
    }
    
    function toIndex() {
    	let s = 5;
    	log(`<font id = "sec">${s}</font>秒后回到首页<br>`);
    	let timer = setInterval(() => {
    		s--;
    		$("sec").innerHTML = s;
    		if(s <= 0) {
    			clearInterval(timer);
    			timer = null;
    			window.top.location.href = "index.html";
    		}
    	}, 1000);
    }
    
    //------------------ --- -----------------------------
	
	const btnSettkng = [
		{
			src: "settings.png",
			title: "删除数据后更新",
			callback: async function() {
				msg({
					title: "请确认删除本地缓存后，更新到最新版本。本地数据库不会被删除",
					butNum: 2,
					enterFunction: async () => {
						await removeServiceWorker()
						await removeLocalStorage()
						await removeCaches()
						toIndex()
					}
				})
			}
		},
		{
			src: "settings.png",
			title: "删除 localStorage",
			callback: async function() {
				msg({
					title: "请确认删除 localStorage",
					butNum: 2,
					enterFunction: removeLocalStorage
				})
			}
		},
		{
			src: "settings.png",
			title: "删除离线缓存",
			callback: async function() {
				msg({
					title: "请确认删除离线缓存。删除后需要联网下载缓存后，才能使用。",
					butNum: 2,
					enterFunction: removeCaches
				})
			}
		},
		{
			src: "settings.png",
			title: "删除本地数据库",
			callback: async function() {
				msg({
					title: "请确认删除本地数据库。答题器进度，答题器题集，你保存的主题会被删除，请做好备份。",
					butNum: 2,
					enterFunction: removeDatabass
				})
			}
		}
	];
	
	const divWidth = mainUI.cmdWidth / 1.5;
	const divStyle = {
		position: "absolute",
		left: (mainUI.cmdWidth - divWidth)/ 2 + "px",
		top: mainUI.cmdPadding + "px",
		width: divWidth + "px",
		height: mainUI.cmdWidth - mainUI.cmdPadding * 2 + "px",
		overflowY: "auto"
	}
	
	const btnDiv = document.createElement("div");
	Object.assign(btnDiv.style, divStyle);
	mainUI.upDiv.appendChild(btnDiv);
	btnSettkng.map(setting => {
		new removeButton(btnDiv, setting.src, setting.title, setting.callback)
	})
	
	const logDiv = mainUI.newComment({
		id: "log",
		type: "div",
		width: mainUI.cmdWidth - mainUI.cmdPadding * 2,
		height: mainUI.cmdWidth - mainUI.cmdPadding * 2,
		style: {
			fontSize: `${mainUI.buttonHeight / 1.8}px`,
			lineHeight: `${mainUI.buttonHeight}px`
		},
		reset: function() { this.viewElem.setAttribute("class", "textarea") }
	})
	logDiv.move(mainUI.cmdPadding, mainUI.cmdPadding, undefined, undefined, downDiv);
    
	//------------------ load -----------------------------
	
	mainUI.loadTheme().then(() => mainUI.viewport.resize());
	}catch(e){alert(e.stack)}
})()
