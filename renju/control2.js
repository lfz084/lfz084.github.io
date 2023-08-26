if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["control"] = "v2110.02";
window.main = (() => {
    "use strict";
    const TEST_CONTROL = true;

    function log(param, type = "log") {
        const print = console[type] || console.log;
        TEST_CONTROL && window.DEBUG && print(`[control.js]\n>>  ${ param}`);
    }

    //--------------------------------------------------------------

    const MODE_RENJU = 0;
    const MODE_LOADIMG = 1;
    const MODE_LINE_EDIT = 2;
    const MODE_ARROW_EDIT = 3;
    const MODE_READ_TREE = 4;
    const MODE_READ_THREEPOINT = 5;
    const MODE_READ_FOULPOINT = 6;
    const MODE_RENLIB = 7;
    const MODE_READLIB = 8;
    const MODE_EDITLIB = 9;
    const MODE_RENJU_FREE = 10;
    
    let playMode = MODE_RENJU;
    const lbColor = [
        { "colName": "黑色标记", "color": "black" },
        { "colName": "红色标记", "color": "red" },
        { "colName": "蓝色标记", "color": "#3333ff" },
        { "colName": "绿色标记", "color": "#008000" },
        { "colName": "卡其标记", "color": "#ff8c00" },
        { "colName": "紫色标记", "color": "#ff00ff" },
        { "colName": "暗灰标记", "color": "#483D8B" },
        { "colName": "暗绿标记", "color": "#556B2F" },
        ];
    let continueLabel = ["标记1", "标记2", "标记3", "标记4", "标记5"];
    const cBoard = mainUI.createCBoard();
    const miniBoard = mainUI.createMiniBoard();
})()
