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
removeServiceWorker();