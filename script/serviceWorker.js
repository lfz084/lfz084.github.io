window.serviceWorker = (() => {
    "use strict";

    const TEST_SERVER_WORKER = false;
    let serviceWorker_state;

    async function registerServiceWorker() {
        const sWorker = await new Promise(resolve => {
            if ('serviceWorker' in navigator) {
                let serviceWorker;

                function _statechange(state) {
                    serviceWorker_state = state;
                    if (serviceWorker_state == "activated" ||
                        serviceWorker_state == "waiting" ||
                        serviceWorker_state == "redundant")
                        resolve(serviceWorker)
                	console.warn(`serviceWorker._statechange: ${state}`)
                }

                function registerError() {
                    resolve()
                }
                
				if(window === window.top) {
                	navigator.serviceWorker.addEventListener("message", event => TEST_SERVER_WORKER && console.info(`serviceWorker.message: ${JSON.stringify(event.data)}`));
                }
                // 开始注册service workers
                navigator.serviceWorker.register('./sw.js', { scope: './' })
                    .then(registration => {
                        if (registration.installing) {
                            serviceWorker = registration.installing;
                        } else if (registration.waiting) {
                            serviceWorker = registration.waiting;
                        } else if (registration.active) {
                            serviceWorker = registration.active;
                        }
                        if (serviceWorker) {
                            _statechange(serviceWorker.state)
                            serviceWorker.addEventListener('statechange', e => _statechange(e.target.state));
                            setTimeout(registerError, 15 * 1000);
                        }
                        else registerError()
                    })
                    .catch(registerError);
            }
            else resolve()
        })
        //首次使用 ServiceWorker 没有正常工作就刷新
        if (sWorker && !navigator.serviceWorker.controller) {
            console.warn(`ServiceWorker 没有正常工作,刷新网页...`)
            window.reloadApp();
        }
    }
    
    async function removeServiceWorker() {
        return new Promise(resolve => {
            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistrations()
                    .then(registrations => {
                        registrations.map(registration => {
                            if (window.location.href.indexOf(registration.scope) + 1) {
                                registration.unregister()
                            }
                        })
                    })
                    .then(() => resolve())
                    .catch(() => {
                        resolve();
                        alert("删除serviceWorker失败")
                    })
            }
            else resolve()
        })
    }
    
    return{
        get registerServiceWorker() {return registerServiceWorker},
        get removeServiceWorker() {return removeServiceWorker}
    }

})()
