'use strict';
window.addEventListener("error", (event) => {
    let textContent = `${event.type}: ${event.message}\n`;
    console.error(textContent);
})

//------------------------------------------------------------

async function wait(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout))
}

//------------------------------------------------------------
window.alert = function(name) { //更改默认标题
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('src', 'data:text/plain,');
    document.documentElement.appendChild(iframe);
    window.frames[0].window.alert(name);
    iframe.parentNode.removeChild(iframe)
};

window.prompt = function(name) { //更改默认标题
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('src', 'data:text/plain,');
    document.documentElement.appendChild(iframe);
    setTimeout(() => {iframe.parentNode.removeChild(iframe)}, 100);
    return window.frames[0].window.prompt(name);
};

//------------------------------------------------------------

function $(id) { return document.getElementById(id) }

//-------------------  board Array ---------------------------

function getArr2D(arr, setnum = 0, x = 15, y = 15) {
    let j = 0;
    arr.length = 0;
    for (j = 0; j < y; j++) {
        arr[j] = [];
        for (let i = 0; i < x; i++) {
            arr[j][i] = setnum;
        }
    }
    return arr;
}

function arrayToArray2D(array) {
    const arr2D = [];
    for(let i = 0; i < 15; i++) {
        arr2D.push(array.slice(i * 15, (i + 1) * 15));
    }
    return arr2D;
}

function array2DToArray(arr2D) {
    const array = [];
    for(let y = 0; y < 15; y++) {
        for(let x = 0; x < 15; x++) {
            array[y * 15 + x] = arr2D[y][x];
        }
    }
    array[225] = -1;
    return array;
}

function changeCoordinate(arr, idx = 112) {
    const nArr = getArr2D([]);
    const x = idx % 15;
    const y = ~~(idx / 15);
    const l = 7 - x;
    const t = 7 - y;
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            let x1 = i - l;
            let y1 = j - t;
            if (x1 >= 0 && x1 < 15 && y1 >= 0 && y1 < 15) {
                if (arr[y1][x1]) nArr[j][i] = arr[y1][x1];
            }
        }
    }
    return nArr;
}

//-------------------  坐标原点转换 ---------------------------

function coordinateMove(htmlElement) {
    let l = htmlElement.offsetLeft;
    let t = htmlElement.offsetTop;
    let parentNode = htmlElement.parentNode;
    while (parentNode != document.body && parentNode != null) {
        l += parentNode.offsetLeft;
        t += parentNode.offsetTop;
        parentNode = parentNode.parentNode;
    }
    return { moveX: l, moveY: t }
}

function xyPageToObj(point, htmlElement) { // Page 原点坐标 转 obj 原点坐标（左上角）
    const m = coordinateMove(htmlElement);
    point.x = point.x - m.moveX;
    point.y = point.y - m.moveY;
    return point;
}

function xyObjToPage(point, htmlElement) { // obj 原点坐标 转 page 原点坐标（左上角）
    const m = coordinateMove(htmlElement);
    point.x = point.x + m.moveX;
    point.y = point.y + m.moveY;
    return point;
}

function xyObj1ToObj2(point1, htmlElement1, htmlElement2) { // obj1 原点坐标 转 obj2 原点坐标（左上角）
    xyObjToPage(point1, htmlElement1);
    xyPageToObj(point1, htmlElement2);
    return point1;
}

//--------------------- htmlElement bind click event ---------------------------------

function setClick(elem, callback = () => {}, timeout = 300) {
    let startX = 0,
        startY = 0;
    elem.onclick = (() => {
        let busy = false;
        return () => {
            if (busy) return;
            busy = true;
            setTimeout(() => { busy = false; }, 1000);
            setTimeout(() => {
                callback();
            }, timeout); //延迟，避免某些浏览器触发窗口下一层elem的click事件。
        };
    })();

    elem.addEventListener("touchstart", (event) => {
        startX = event.changedTouches[0].pageX;
        startY = event.changedTouches[0].pageY;
    }, true);
    elem.addEventListener("touchend", (event) => {
        event.preventDefault();
        let tX = event.changedTouches[0].pageX;
        let tY = event.changedTouches[0].pageY;
        if ((Math.abs(startX - tX) < 30) && (Math.abs(startY - tY) < 30)) {
            elem.onclick();
        }
    }, true);
}

function setButtonClick(elem, callback = () => {}) {
    setClick(elem, () => {
        let bkColor = elem.style.opacity;
        elem.style.opacity = "0.2";
        setTimeout(() => {
            elem.style.opacity = bkColor;
            callback();
        }, 300);
    }, 0);
}

/*------ iphone 长按弹出棋盘菜单后会误触发click事件。-----
-------- iphone 长按放大棋盘会误触发click事件-----------*/

window.iphoneCancelClick = (() => {
    let isCancelClick = false;
    document.body.addEventListener("touchstart", () => { isCancelClick = false }, true);
    document.body.addEventListener("touchend", () => { setTimeout(() => { isCancelClick = false }, 250) }, true);
    return {
        enable: () => {
            isCancelClick = !!(navigator.userAgent.indexOf("iPhone") + 1);
        },
        isCancel: () => {
            setTimeout(() => { isCancelClick = false }, 100);
            return isCancelClick;
        }
    }
})();

//----------------------  退出前确认 ------------------------------------

function setBlockUnload(enable) {
    if (enable) {
        window.onbeforeunload = function(e) {
            e = e || window.event;
            // 兼容IE8和Firefox 4之前的版本
            if (e) {
                e.returnValue = '离开提示';
            }
            // Chrome, Safari, Firefox 4+, Opera 12+ , IE 9+
            return '离开提示';
        }
        console.log("blockUnload: enable", "info");
    }
    else {
        window.onbeforeunload = null;
        console.log("blockUnload: disable", "info");
    }
}

//----------------------  bufferToBase64String ----------------

function bufferToBase64String(buffer) {
    let base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    return base64;
}

function base64StringToBuffer(str) {
    let asciiString = atob(str);
    return new Uint8Array([...asciiString].map(char => char.charCodeAt(0))).buffer;
}

