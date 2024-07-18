const scriptURL = './sw.js';

async function registerServiceWorker() {
	const sWorker = await new Promise(resolve => {
		if ('serviceWorker' in navigator) {
			let serviceWorker;

			function statechange(state) {
				serviceWorker_state = state;
				if (serviceWorker_state == "activated" ||
					serviceWorker_state == "waiting" ||
					serviceWorker_state == "redundant")
					resolve(serviceWorker)
				console.warn(`serviceWorker.statechange: ${state}`)
			}

			function registerError(err) {
				resolve()
			}

			navigator.serviceWorker.addEventListener("message", onmessage, true);
			navigator.serviceWorker.addEventListener("messageerror", messageerror, true);
			navigator.serviceWorker.getRegistrations()
				.then(registrations => {
					registrations.map(registration => {
						if (window.location.href.indexOf(registration.scope) + 1) {
							registration.addEventListener("updatefound", updatefound, true);
						}
					})
				})
			if (navigator.serviceWorker.controller) {
				console.log(`"${scriptURL}" ......`);
				navigator.serviceWorker.ready.then(registration => resolve(registration))
				return;
			}
			/*---开始注册service workers---*/
			console.log(`registering "${scriptURL}" ......`);
			navigator.serviceWorker.register(scriptURL, { scope: './', updateViaCache: `all` })
				.then(registration => {

					if (registration.installing) {
						serviceWorker = registration.installing;
					} else if (registration.waiting) {
						serviceWorker = registration.waiting;
					} else if (registration.active) {
						serviceWorker = registration.active;
					}
					if (serviceWorker) {
						statechange(serviceWorker.state)
						serviceWorker.addEventListener('statechange', e => statechange(e.target.state));
						setTimeout(() => registerError("timeout"), 15 * 1000);
					}
					else registerError("serviceWorker: undefined")
				})
				.catch(registerError);
		}
		else resolve()
	})
	if (sWorker) {
		/** 首次使用 ServiceWorker 没有正常工作就刷新 */
		if (!navigator.serviceWorker.controller) {
			console.warn(`ServiceWorker 没有正常工作,刷新网页...`)
			await window.location.reload();
		}
	}
}

async function removeServiceWorker() {
	const ps = [];
	return "serviceWorker" in navigator &&
		"getRegistrations" in navigator.serviceWorker &&
		navigator.serviceWorker.getRegistrations()
		.then(registrations => {
			registrations.map(registration => {
				if (window.location.href.indexOf(registration.scope) + 1) {
					ps.push(registration.unregister());
				}
			})
		})
		.then(() => Promise.all(ps))
		.catch(() => alert("删除serviceWorker失败"))
}



/* 五子棋小工具网站移动到 renju 子目录 */
/* 删除根目录 serviceWorker */
//removeServiceWorker();

registerServiceWorker();