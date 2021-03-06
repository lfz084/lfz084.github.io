"use strict";
let engine = (() => {
    const COLOR_TXT = ["白棋", "黑棋", "白棋"];
    let maxThread = 4;
    let work = [];
    let works = [];
    let cObjVCF = {}; //{ arr: [], winMoves: [], color: 0, time: false }; // 保存VCF分支
    let cBd;
    let cVCF;
    let cFP;
    let cCancel;
    let labelTime;
    let closeMsg;
    let closeNoSleep;
    let saveContinueData;
    let save = {};
    let tree = null;
    let oldTree = null;
    let oldCode = "";
    let treeKeyMap = new Map();
    let threePoints = null;
    let oldThreePoints = null;

    function removeTree() {
        oldTree = cBd.oldCode == "" ? null : cBd.tree;
        oldCode = cBd.oldCode;
        cBd.oldCode = "";
        cBd.tree = new cBd.node();
        cBd.cleLb("all");
    }

    function addOldTree(oldTree) {
        if (oldTree) {
            cBd.oldCode = oldCode;
            cBd.tree = oldTree;
        }
    }

    function cleThreePoints() {
        oldThreePoints = cBd.threePoints;
        cBd.cleThreePoints();
        cBd.cleLb("all");
    }

    function addThreePoint(oldThreePoints) {
        if (oldThreePoints && oldThreePoints.arr) {
            cBd.threePoints = oldThreePoints;
            for (let i = cBd.threePoints.points.length - 1; i >= 0; i--) {
                if (cBd.threePoints.points[i]) {
                    cBd.wLb(i, cBd.threePoints.points[i].txt, cBd.threePoints.points[i].txtColor, undefined, false);
                }
            }
        }
    }

    function setCmd() { //calculate start
        cFP.hide();
        cVCF.hide();
        removeTree();
        cleThreePoints();
        cBd.showFoul(false, true);
        cBd.removeMarkArrow("all");
        cBd.removeMarkLine("all");
        cBd.removeMarkLine(cBd.autoLines);
        let but = cVCF;
        cCancel.move(but.left, but.top, but.width, but.height);
        let lb = cFP;
        labelTime.move(lb.left, lb.top, lb.width, lb.height, parseInt(parseInt(lb.width) / 4) + "px");
        openNoSleep();
        tree = null;
        treeKeyMap = new Map();
        threePoints = null;
    }

    function callback() { // calculate end
        if (work && typeof(work.terminate) == "function") {
            work.terminate();
            work = null
        }
        for (let i = 0; i < works.length; i++) {
            if (works[i] && works[i].terminate) {
                works[i].terminate();
                works[i] = null;
            }
        }
        cBd.cleSearchPoint();
        let isShowLabel;
        if (tree) {
            tree.keyMap = treeKeyMap;
            cBd.addTree(tree);
            tree = null;
            treeKeyMap = new Map();
            isShowLabel = true;
        }
        if (threePoints) {
            cBd.threePoints = threePoints;
            threePoints = null;
            isShowLabel = true;
        }
        cFP.show();
        cFP.setText("找点");
        cVCF.show();
        cVCF.setText("解题");
        cCancel.hide();
        labelTime.close();
        closeMsg();
        saveContinueData();
        closeNoSleep();
        if (isShowLabel) showLabel("点击标记 展开分支 点击 [<<] 可以退出");
    }

    function printMsg() {
        if (cObjVCF.winMoves.length) {
            showLabel("✔ " + COLOR_TXT[cObjVCF.color] + " 找到 " + cObjVCF.winMoves.length + "套 VCF,用时 " + cObjVCF.time + "秒");
        }
        else {
            showLabel(`${EMOJI_FOUL_THREE} ${COLOR_TXT[cObjVCF.color]} 查找VCF失败了 ${EMOJI_FOUL_THREE}`);
        }
    }

    function cleLb(idx) {
        cBd.cleLb(idx, false);
    }

    function wLb(idx, text, color) {
        cBd.wLb(idx, text, color, undefined, false);
    }

    function createWork(commands, workerIdx = 0) {

        let defaultCmd = {
            "addTree": (p) => {
                tree = p.node;
            },
            "showLabel": (p) => {
                showLabel(p.text, p.timeout);
            },
            "vConsole": (p) => { console.log(p) },
            "cleLb": (p) => { cleLb(p.idx); },
            "wLb": (p) => { wLb(p.idx, p.text, p.color); },
            "printMoves": (p) => { cBd.printMoves(p.winMoves, p.color); },
            "printSearchPoint": (p) => { cBd.printSearchPoint(p.workerIdx, p.idx, p.text, p.color); },
        }
        for (let cmd in commands) { // add commands
            defaultCmd[cmd] = commands[cmd];
        }
        let wk = new Worker("./script/worker.js");
        wk.postMessage({ cmd: "setWorkerIdx", parameter: { workerIdx: workerIdx } });
        wk.onmessage = (e) => {
            labelTime.setPrePostTimer(new Date().getTime());
            let cmd = e.data.cmd;
            let p = e.data.parameter;
            let f = defaultCmd;
            wk.onerror = () => {
                alert(`${cmd} worker error`);
                wk.terminate();
                wk = null;
            };
            if (typeof(f[cmd]) == "function") f[cmd](p);
        };

        return wk;
    };




    return {
        reset: (param) => {
            maxThread = param.maxThread;
            cObjVCF = param.cObjVCF;
            cBd = param.cBoard;
            cVCF = param.cFindVCF;
            cFP = param.cFindPoint;
            cCancel = param.cCancelFind;
            labelTime = param.lbTime;
            msg = param.msg;
            closeMsg = param.closeMsg;
            closeNoSleep = param.closeNoSleep;
            saveContinueData = param.saveContinueData;
            save = param.saveData;
        },
        postMsg: (cmd, param) => {
            //console.log(cmd);
            let cmdList = {
                "cancelFind": () => {
                    for (let i = cBd.SLTX * cBd.SLTY - 1; i >= 0; i--) {
                        if (typeof(cBd.P[i].text) == "number" || cBd.P[i].text == EMOJI_ROUND_BLACK || cBd.P[i].text == "⊙") {
                            cleLb(i);
                        }
                    }
                    callback();
                },
                "findThreePoint": () => {
                    let newarr = getArr([]);
                    addThreePoint(oldThreePoints);
                    findThreePoint(param.arr, param.color, newarr, param.ftype);
                    cBd.printArray(newarr, "③", param.ftype == ONLY_FREE ? "red" : "black");
                    callback();
                },
                "findTTPoint": () => {
                    addThreePoint(oldThreePoints);
                    let newarr = getArr([]);
                    findTTPoint(param.arr, 1, newarr);
                    cBd.printArray(newarr, EMOJI_FOUL, "red");
                    callback();
                },
                "findFFPoint": () => {
                    addThreePoint(oldThreePoints);
                    let newarr = getArr([]);
                    findFFPoint(param.arr, param.color, newarr);
                    cBd.printArray(newarr, EMOJI_FOUL, "red");
                    callback();
                },
                "findSixPoint": () => {
                    addThreePoint(oldThreePoints);
                    let newarr = getArr([]);
                    findSixPoint(param.arr, param.color, newarr, param.setnum);
                    cBd.printArray(newarr, EMOJI_FOUL, "red");
                    callback();
                },
                "findFoulPoint": () => {
                    addThreePoint(oldThreePoints);
                    let newarr = getArr([]);
                    findFoulPoint(param.arr, newarr, param.setnum);
                    cBd.printArray(newarr, EMOJI_FOUL, "red");
                    callback();
                },
                "findFivePoint": () => {
                    addThreePoint(oldThreePoints);
                    let newarr = getArr([]);
                    findFivePoint(param.arr, param.color, newarr, param.setnum);
                    cBd.printArray(newarr, "⑤", "red");
                    callback();
                },
                "findFourPoint": () => {
                    addThreePoint(oldThreePoints);
                    let newarr = getArr([]);
                    findFourPoint(param.arr, param.color, newarr, param.ftype);
                    cBd.printArray(newarr, "④", param.ftype == ONLY_FREE ? "red" : "black");
                    callback();
                },
                "vctSelectPoint": () => {
                    //threePoints = null;
                    let arr = param.arr;
                    let color = param.color;
                    cBd.cleLb("all");
                    let lvl;
                    work = createWork({
                        "getLevelB_End": (p) => {
                            lvl = p.level;
                            continuefun();
                        },
                        "addThreePoint": (p) => {
                            if (!threePoints) {
                                threePoints = {};
                                threePoints.arr = arr;
                                threePoints.color = color;
                                threePoints.points = [];
                                threePoints.index = -1;
                            }
                            threePoints.points[p.idx] = p.point;
                        },
                        "vctSelectPoint_End": (p) => {
                            callback();
                        },
                    });
                    work.postMessage({ "cmd": "getLevelB", parameter: param });
                    let continuefun = () => {
                        if (lvl.level >= 4) {
                            let newarr = getArr([]);
                            findFivePoint(param.arr, param.color, newarr, param.setnum);
                            cBd.printArray(newarr, "⑤", "red");
                            callback();
                            showLabel(`${param.color==1?"黑棋" : "白棋"} 有五连点`);
                        }
                        else if (lvl.level >= 3) {
                            cBd.printMoves(lvl.moves, param.color);
                            callback();
                            showLabel(`${param.color==1?"黑棋" : "白棋"} 有 ${lvl.moves.length>3?"VCF":lvl.moves.length>1?`${param.color==1?"43杀":"43杀(冲4再44,冲4冲4抓)"}`:`${param.color==1?"活四":"活四(44,冲4抓)"}`}`);
                        }
                        else {
                            work.postMessage({ "cmd": cmd, parameter: param });
                        }
                    };
                },
                "findVCT": () => {
                    let arr = param.arr;
                    let color = param.color;
                    work = createWork({
                        "findVCT_End": (p) => {
                            tree = p.node;
                            callback();
                        },
                    });
                    work.postMessage({ "cmd": cmd, parameter: param });
                },
                "blockCatchFoul": () => {
                    let lvl;
                    work = createWork({
                        "getLevelB_End": (p) => {
                            lvl = p.level;
                            continuefun();
                        },
                        "blockCatchFoul_End": (p) => {
                            callback();
                            if (p.value == -1) {
                                showLabel(`${EMOJI_FOUL_THREE} 没有找到冲四抓禁 ${EMOJI_FOUL_THREE}`);
                            }
                            else if (p.value == 0) {
                                showLabel(`${EMOJI_FOUL_THREE} 没有成立的解禁点 ${EMOJI_FOUL_THREE}`);
                            }
                        },
                    });
                    work.postMessage({ "cmd": "getLevelB", parameter: param });
                    let continuefun = () => {
                        if (lvl.level >= 4) {
                            let newarr = getArr([]);
                            findFivePoint(param.arr, 1, newarr);
                            cBd.printArray(newarr, "⑤", "red");
                            callback();
                            showLabel(`${"黑棋"} 有五连点`);
                        }
                        else if (lvl.level >= 3) {
                            cBd.printMoves(lvl.moves, 1);
                            callback();
                            showLabel(`${"黑棋"} 有 ${lvl.moves.length>3?"VCF":lvl.moves.length>1?`${"43杀"}`:`${"活四"}`}`);
                        }
                        else {
                            work.postMessage({ "cmd": cmd, parameter: param });
                        }
                    };
                },
                "findFoulNode": () => {
                    work = createWork({
                        "findFoulNode_End": () => {
                            callback();
                        },
                    });
                    work.postMessage({ "cmd": cmd, parameter: param });
                },
                "findVCF": () => {
                    work = createWork({
                        "findVCF_addVCF": (p) => {
                            cObjVCF.arr = copyArr([], p.initialArr);
                            cObjVCF.winMoves = p.winMoves;
                            cObjVCF.color = p.color;
                            cObjVCF.time = p.seconds;
                        },
                        "findVCF_End": (p) => {
                            cObjVCF.arr = copyArr([], p.initialArr);
                            cObjVCF.winMoves = p.winMoves;
                            cObjVCF.color = p.color;
                            cObjVCF.time = p.seconds;
                            cleLb("all");
                            addOldTree(oldTree);
                            if (cObjVCF.winMoves.length) setTimeout(() => { cBd.printMoves(cObjVCF.winMoves[0], cObjVCF.color); }, 1100);
                            callback();
                            printMsg();
                        },
                    });
                    work.postMessage({ "cmd": cmd, parameter: param });
                },
                "isTwoVCF": () => {
                    let color = param.color;
                    let arr = param.arr;
                    let newarr = param.newarr;
                    let colorLevel, colorLevelSimpleWin;
                    work = createWork({
                        "getLevelB_End": (p) => {
                            if (colorLevel == undefined) {
                                colorLevel = p.level;
                                work.postMessage({ cmd: "getLevelB", parameter: { arr: arr, color: color, depth: 1 } });
                            }
                            else if (colorLevelSimpleWin == undefined) {
                                colorLevelSimpleWin = p.level;
                                if (colorLevel.level >= 3) {
                                    const ASK_TITLE = `${color == 1 ? "黑棋" : "白棋"} ${`${colorLevel.level>=4 ? "进攻级别 >= 冲4" : param.ftype==ONLY_SIMPLE_WIN?"进攻级别 >= 43杀":"进攻级别 >= 活3" },\n继续计算可能会得到错误的结果`}`;
                                    if (cmd == "isLevelThreePoint") {
                                        if (param.ftype == ONLY_SIMPLE_WIN && (colorLevelSimpleWin.level < 3)) {
                                            ctnPostMsg();
                                        }
                                        else {
                                            askMsg(ASK_TITLE);
                                        }
                                    }
                                    else if (cmd == "isTwoVCF") {
                                        askMsg(ASK_TITLE);
                                    }
                                    else {
                                        if (colorLevel.level >= 4) {
                                            askMsg(ASK_TITLE);
                                        }
                                        else {
                                            ctnPostMsg();
                                        }
                                    }
                                }
                                else {
                                    ctnPostMsg();
                                }
                            }
                        },
                        "selectPoint_End": (p) => {
                            labelTime.setPrePostTimer(new Date().getTime());
                            newarr = p.newarr;
                            continuefun();
                        },
                    });

                    work.postMessage({ "cmd": "getLevelB", parameter: { arr: arr, color: color } });
                    let lvl = (cmd == "isLevelThreePoint") ? { level: 2 } : null;
                    let selFour = (cmd != "isLevelThreePoint" && cmd != "isTwoVCF");
                    let askMsg = (title) => {
                        msgbox(title, "继续",
                            function(msgStr) {
                                ctnPostMsg();
                            }, undefined,
                            function() {
                                callback();
                            }, 2);
                    }
                    let ctnPostMsg = () => {
                        work.postMessage({ "cmd": "selectPoint", parameter: { arr: arr, color: color, newarr: newarr, backstage: true, level: lvl, selFour: selFour } });
                    };

                    //selectPoint(arr, color, newarr, undefined, undefined, true, { level: 2 });
                    let continuefun = () => {
                        if (cmd == "isTwoVCF") findThreePoint(arr, color, newarr, ONLY_FREE, -9999); //排除活三
                        let sPoint = [];
                        let pnt = aroundPoint[112];
                        for (let i = 0; i < 225; i++) {
                            let x = pnt.point[i].x;
                            let y = pnt.point[i].y;
                            if (newarr[y][x] == 0) {
                                sPoint.push(y * 15 + x);
                                wLb(y * 15 + x, EMOJI_ROUND_BLACK, "#888888");
                            }
                            else {
                                cleLb(y * 15 + x);
                            }
                        }
                        if (sPoint.length == 0) { callback(); return; };

                        function ctnPost(workerIdx, idx, cmd, param) {
                            cBd.printSearchPoint(workerIdx, idx, "⊙", "green");
                            param.idx = idx;
                            works[workerIdx].postMessage({ "cmd": cmd, parameter: param });
                        }
                        let workCount = 0;
                        for (let i = 0; i < maxThread; i++) {
                            if (sPoint.length) {
                                works[i] = createWork({
                                    "addTree": (p) => {
                                        if (tree) {
                                            tree.childNode.push(p.node.childNode[0]);
                                        }
                                        else {
                                            tree = p.node;
                                        }
                                    },
                                    "addTreeKeyMap": (p) => {
                                        treeKeyMap.set(p.key, p.node);
                                    },
                                    "addThreePoint": (p) => {
                                        if (!threePoints) {
                                            threePoints = {};
                                            threePoints.arr = arr;
                                            threePoints.color = color;
                                            threePoints.points = [];
                                            threePoints.index = -1;
                                        }
                                        threePoints.points[p.idx] = p.point;
                                    },
                                    "end": (p) => {
                                        let idx = sPoint.length ? sPoint.splice(0, 1)[0] : -1;
                                        if (idx > -1) {
                                            ctnPost(i, idx, cmd, param);
                                        }
                                        else {
                                            cBd.printSearchPoint(i);
                                            workCount--;
                                            if (workCount == 0) {
                                                callback();
                                            }
                                        }
                                    },
                                }, i);
                                workCount++;

                                let idx = sPoint.splice(0, 1)[0];
                                ctnPost(i, idx, cmd, param);
                            }
                        }
                    };
                },
                "getBlockVCF": () => {
                    let sPoint = [];
                    work = createWork({
                        "findVCF_End": (p) => {
                            cleLb("all");
                            if (p.winMoves.length) {
                                showLabel(COLOR_TXT[p.color] + "找到VCF，开始分析防点...... ");
                            }
                            else {
                                //work.terminate();
                                callback();
                                showLabel(`${EMOJI_FOUL_THREE} ${COLOR_TXT[p.color]} 没有VCF ${EMOJI_FOUL_THREE}`);
                            }
                        },
                        "getBlockVCF_End": (p) => {
                            closeMsg();
                            //work.terminate();
                            callback();
                            sPoint = p.points;
                            if (sPoint.length) {
                                for (let i = sPoint.length - 1; i >= 0; i--) {
                                    cBd.wLb(sPoint[i], EMOJI_ROUND_DOUBLE, "black");
                                }
                            }
                            else {
                                callback();
                                showLabel(`${EMOJI_FOUL_THREE}没有成立的防点${EMOJI_FOUL_THREE}`);
                            }
                        },
                    });
                    work.postMessage({ "cmd": cmd, parameter: param });

                },
                "getBlockVCFb": () => {
                    let sPoint = [];
                    work = createWork({
                        "findVCF_End": (p) => {
                            cleLb("all");
                            if (p.winMoves.length) {
                                showLabel(COLOR_TXT[p.color] + "找到VCF，开始分析防点...... ");
                            }
                            else {
                                //work.terminate();
                                callback();
                                showLabel(`${EMOJI_FOUL_THREE} ${OR_TXT[p.color]} 没有VCF ${EMOJI_FOUL_THREE}`);
                            }
                        },
                        "getBlockVCFb_End": (p) => {
                            closeMsg();
                            sPoint = p.points;
                            if (sPoint.length) {
                                for (let i = 0; i < sPoint.length; i++) {
                                    wLb(sPoint[i], EMOJI_ROUND_BLACK, "#888888");
                                }
                                showLabel(COLOR_TXT[p.color - 1] + "开始验证防点...... ");
                                excludeBP("isBlockVCF");
                            }
                            else {
                                callback();
                                showLabel(`${EMOJI_FOUL_THREE}没有成立的防点${EMOJI_FOUL_THREE}`);
                            }
                        },
                    });

                    work.postMessage({ "cmd": cmd, parameter: param });

                    let excludeBP = (cmd) => {
                        function ctnPost(workerIdx, idx, cmd, param) {
                            cBd.printSearchPoint(workerIdx, idx, "⊙", "green");
                            param.idx = idx;
                            works[workerIdx].postMessage({ "cmd": cmd, parameter: param });
                        }
                        let workCount = 0;
                        for (let i = 0; i < maxThread; i++) {
                            if (sPoint.length) {
                                works[i] = createWork({
                                    "end": (p) => {
                                        let idx = sPoint.length ? sPoint.splice(0, 1)[0] : -1;
                                        if (idx > -1) {
                                            ctnPost(i, idx, cmd, param);
                                        }
                                        else {
                                            //works[i].terminate();
                                            cBd.printSearchPoint(i);
                                            workCount--;
                                            if (workCount == 0) {
                                                callback();
                                            }
                                        }
                                    },
                                }, i);
                                workCount++;
                                let idx = sPoint.splice(0, 1)[0];
                                ctnPost(i, idx, cmd, param);
                            }
                        }

                    }
                },
                "getBlockVCFTree": () => {
                    let paths = [];
                    work = createWork({
                        "findVCF_End": (p) => {
                            cleLb("all");
                            if (p.winMoves.length) {
                                showLabel(COLOR_TXT[p.color] + "找到VCF，开始分析防点...... ");
                            }
                            else {
                                callback();
                                showLabel(`${EMOJI_FOUL_THREE} ${COLOR_TXT[p.color]} 没有VCF ${EMOJI_FOUL_THREE}`);
                            }
                        },
                        "getBlockVCFTree_End": (p) => {
                            closeMsg();
                            paths = p.paths;
                            if (paths.length) {
                                for (let i = 0; i < paths.length; i++) {
                                    wLb(paths[i][0], EMOJI_ROUND_BLACK, "#888888");
                                }
                                showLabel(COLOR_TXT[p.color - 1] + "开始验证防点...... ");
                                excludePath("isBlockVCFPath");
                            }
                            else {
                                callback();
                                showLabel(`${EMOJI_FOUL_THREE}有成立的防点${EMOJI_FOUL_THREE}`);
                            }
                        },
                    });

                    work.postMessage({ "cmd": cmd, parameter: param });

                    let excludePath = (cmd) => {
                        function ctnPost(workerIdx, path, cmd, param) {
                            cBd.printSearchPoint(workerIdx, path[0], "⊙", "green");
                            param.path = path;
                            param.speed = `${PATHS_LEN-paths.length}/${PATHS_LEN}`;
                            works[workerIdx].postMessage({ "cmd": cmd, parameter: param });
                        }
                        const PATHS_LEN = paths.length;
                        let workCount = 0;
                        for (let i = 0; i < maxThread; i++) {
                            if (paths.length) {
                                works[i] = createWork({
                                    "end": (p) => {
                                        if (p.paths.length) {
                                            if (!tree) {
                                                tree = new Node();
                                                tree.firstColor = param.color == 2 ? "black" : "white";
                                            }
                                            for (let i = p.paths.length - 1; i >= 0; i--) {
                                                let nd = movesToNode(p.paths[i], tree);
                                                nd.txt = EMOJI_ROUND;
                                                let pNode = nd.parentNode;

                                                while (pNode && pNode != tree) {
                                                    if (pNode.txt) break;
                                                    pNode.txt = EMOJI_ROUND;
                                                    pNode = pNode.parentNode;
                                                }
                                            }
                                        }
                                        let path = paths.length ? paths.splice(0, 1)[0] : false;
                                        if (path) {
                                            ctnPost(i, path, cmd, param);
                                        }
                                        else {
                                            cBd.printSearchPoint(i);
                                            workCount--;
                                            if (workCount == 0) {
                                                callback();
                                            }
                                        }
                                    },
                                }, i);
                                workCount++;
                                let path = paths.splice(0, 1)[0];
                                ctnPost(i, path, cmd, param);
                            }
                        }

                    }

                },
                "default": () => {
                    work = createWork();
                    work.postMessage({ "cmd": cmd, parameter: param });
                },
            };
            cmdList.isFourWinPoint = cmdList.isThreeWinPoint = cmdList.isLevelThreePoint = cmdList.isSimpleWin = cmdList.isTwoVCF;
            save(cBd);
            if (cmd != "cancelFind") setCmd();
            typeof(cmdList[cmd]) == "function" ? (cmdList[cmd]()) : (cmdList["default"]());
        },
    };

})();