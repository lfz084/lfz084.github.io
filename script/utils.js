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

function xyPageToObj(point, htmlElement) {
    const m = coordinateMove(htmlElement);
    point.x = point.x - m.moveX;
    point.y = point.y - m.moveY;
    return point;
}

function xyObjToPage(point, htmlElement) {
    const m = coordinateMove(htmlElement);
    point.x = point.x + m.moveX;
    point.y = point.y + m.moveY;
    return point;
}

function xyObj1ToObj2(point1, htmlElement1, htmlElement2) {
    xyObjToPage(point1, htmlElement1);
    xyPageToObj(point1, htmlElement2);
    return point1;
}
