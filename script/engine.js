if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["engine"] = "v2015.05";
window.engine = (function() {
            "use strict";
            const TEST_ENGINE = false;

            function log(param, type = "log") {
                const command = {
                    log: () => { console.log(param) },
                    info: () => { console.info(param) },
                    error: () => { console.error(param) },
                    warn: () => { console.warn(param) },
                    assert: () => { console.assert(param) },
                    clear: () => { console.clear(param) },
                    count: () => { console.count(param) },
                    group: () => { console.group(param) },
                    groupCollapsed: () => { console.groupCollapsed(param) },
                    groupEnd: () => { console.groupEnd(param) },
                    table: () => { console.table(param) },
                    time: () => { console.time(param) },
                    timeEnd: () => { console.timeEnd(param) },
                    trace: () => { console.trace(param) },
                }
                let print = command[type] || console.log;
                if (TEST_ENGINE && DEBUG)
                    print(`[engine.js]\n>>  ${ param}`);
            }

            //------------------------  ListNode   ------------------------ 

            class ListNode extends RenjuNode {
                get bestValue() {
                    return this.score;
                }
                set bestValue(value) {
                    this.score = value;
                    this.boardText = value.toString(10) //(~~(value / 0xFE * 100)).toString(10);
                }
                constructor(node, alpha, beta) {
                    super(node.nodeBuf, node.commentBuf, node.pointer);
                    this.alpha = alpha;
                    this.beta = beta;
                }
            }

            //-------------------------- COMMAND -------------------------------

            let isPrintMoves = false;
            const COLOR_NAME = { "-1": "出界", 0: "空格", 1: "黑棋", 2: "白棋" };
            const COMMAND = {
                log: function(param) { log(param, "log") },
                info: function(param) { log(param, "info") },
                error: function(param) { log(param, "error") },
                warn: function(param) { log(param, "warn") },
                moves: function(param) { isPrintMoves && cBoard.printMoves(param.moves, param.firstColor) },
                vcfInfo: function(param) { this.result = param.vcfInfo },
                points: function(param) { this.result = param.points },
                levelBInfo: function(param) { this.result = param.levelBInfo },
                selectPoints: function(param) { this.result = param.selectArr },
            };

            function onmessage(e) {
                if (typeof e.data == "object") {
                    if (e.data.cmd == "resolve")(this.resolve(this.result), this.isBusy = false, log("resolve", "warn"));
                    else typeof COMMAND[e.data.cmd] == "function" && COMMAND[e.data.cmd].call(this, e.data.param);
                }
            }

            function onerror(e) {
                this.resolve(this.result);
                this.isBusy = false;
                log(e, "error");
            }

            //------------------------ Thread --------------------

            class Thread {
                set onmessage(fun) {
                    if (typeof fun == "function") {
                        this.work.onmessage = fun.bind(this);
                    }
                }
                set onerror(fun) {
                    if (typeof fun == "function") {
                        this.work.onerror = fun.bind(this);
                    }
                }
                get onmessage() {
                    return this.work.onmessage;
                }
                get onerror() {
                    return this.work.onerror;
                }
                constructor(url, index = "") {
                    this.url = url;
                    this.isLock = false;
                    this.ID = `thread` + `0000${index}`.slice(-2);
                    this.init();
                }
            }

            Thread.prototype.init = async function() {
                this.isBusy = false;
                this.resolve = function() {};
                this.reject = function() {};
                this.result = undefined;
                this.work = new Worker(this.url);
                if (this.work) return this.run({ cmd: "setGameRules", param: { rules: gameRules } });
                else throw new Error(`createThread Error: work = ${this.work}`)
            }

            Thread.prototype.reset = async function() {
                log(`${this.ID} Reset`, "warn");
                if (this.work) this.work.terminate();
                return this.init();
            }

            Thread.prototype.run = async function({ cmd, param }) {
                return new Promise((resolve, reject) => {
                    if (this.isBusy) { reject(new Error("Thread is busy")); return };
                    this.isBusy = true;
                    this.result = undefined;
                    this.resolve = resolve;
                    this.reject = reject;
                    this.onmessage = onmessage;
                    this.onerror = onerror;
                    if (canceling) this.onmessage({data: {cmd: "resolve"}});
                    else this.postMessage({ cmd: cmd, param: param });
                });
            }

            Thread.prototype.cancel = async function(param) {
                this.onmessage({data: {cmd: "resolve"}});
                return  this.reset()
            }

            Thread.prototype.lock = function() {
                this.isLock = true;
            }

            Thread.prototype.unlock = function() {
                this.isLock = false;
            }

            Thread.prototype.postMessage = function(param) {
                this.work.postMessage(param);
            }

            //------------------------ THREADS --------------------

            const HD_CURRENT = window.navigator.hardwareConcurrency || 4,
                MAX_THREAD_NUM = 0xf8 & HD_CURRENT ? HD_CURRENT - 2 : 0xfe & HD_CURRENT ? HD_CURRENT - 1 : HD_CURRENT;
            let THREADS = new Array(MAX_THREAD_NUM),
                canceling = false;

            for (let i = 0; i < MAX_THREAD_NUM; i++) THREADS[i] = new Thread("./script/worker.js", i+1);

            function getFreeThread(threads = THREADS) {
                return new Promise((resolve, reject) => {
                    let timer = setInterval(() => {
                        for (let i = threads.length - 1; i >= 0; i--) {
                            if (!threads[i].isBusy && !threads[i].isLock) {
                                clearInterval(timer);
                                resolve(threads[i]);
                                //log(`getFreeThread ${threads[i].ID}`, "log")
                                return;
                            }
                        }
                    }, 0);
                });
            }

            function getThread() {
                return new Promise((resolve, reject) => {
                    let timer = setInterval(() => {
                        for (let i = threads.length - 1; i >= 0; i--) {
                            if (!threads[i].isLock) {
                                threads[i].lock();
                                clearInterval(timer);
                                resolve(threads[i]);
                                return;
                            }
                        }
                    }, 0);
                });
            }

            async function run(cmd, param, thread) {
                //log(param, "log");
                thread = thread || await getFreeThread();
                return thread.run({ cmd: cmd, param: param });
            }

            function reset() {
                return Promise.all(THREADS.map(thread => thread.cancel()));
            }

            function cancel() {
                return new Promise((resolve, reject) => {
                    if (canceling) {
                        resolve();
                    }
                    else {
                        THREADS.map(thread => thread.lock());
                        reset()
                            .then(() => {
                                canceling = true;
                                THREADS.map(thread => thread.unlock());
                                let count = 0,
                                    timer = setInterval(() => {
                                        count = THREADS.find(thread => thread.isBusy) ? 0 : count + 1;
                                        if (count > 15) {
                                            clearInterval(timer);
                                            resolve();
                                            setTimeout(()=>canceling = false, 1500)
                                            log("engine.cancel", "warn")
                                        }
                                    }, 100)
                            })
                    }
                })
            }

            //------------------------ Evaluator -------------------
            const NEWLINE = String.fromCharCode(10);
            const DEFAULT_BOARD_TXT = ["", "●", "○", "◐"];
            const DIRECTION_NAME = ["→", "↓", "↘", "↗"]; 
            const SCORE_MAX = 0xFF,
                SCORE_MIN = 0x00,
                SCORE_WIN = 0xFE,
                SCORE_LOST = 0x01,
                SCORE_WAIT = 0x01,
                SCORE_RESOLVE = 0x02,
                SCORE_REJECT = 0x03;
        
            const FILTER_FOUL_THREE_NODE = {
                    0: node => (node.info & FOUL) || THREE_NOFREE == (node.info & FOUL_MAX),
                    1: node => (node.info & FOUL) || THREE_FREE == (node.info & FOUL_MAX_FREE),
                    2: node => (node.info & FOUL) || THREE_NOFREE == (node.info & FOUL_MAX_FREE)
                },
                FILTER_FOUL_FOUR_NODE = {
                    0: node => (node.info & FOUL) || FOUR_NOFREE == (node.info & FOUL_MAX),
                    1: node => (node.info & FOUL) || FOUR_FREE == (node.info & FOUL_MAX_FREE),
                    2: node => (node.info & FOUL) || FOUR_NOFREE == (node.info & FOUL_MAX_FREE)
                },
                FILTER_THREE_NODE = {
                    0: node => THREE_NOFREE == (node.info & FOUL_MAX),
                    1: node => THREE_FREE == (node.info & FOUL_MAX_FREE),
                    2: node => THREE_NOFREE == (node.info & FOUL_MAX_FREE)
                },
                FILTER_FOUR_NODE = {
                    0: node => FOUR_NOFREE == (node.info & FOUL_MAX),
                    1: node => FOUR_FREE == (node.info & FOUL_MAX_FREE),
                    2: node => FOUR_NOFREE == (node.info & FOUL_MAX_FREE)
                },
                FILTER_VCF_NODE = {
                    0: node => true,
                    1: node => node.winMoves && node.winMoves.length > 3,
                    2: node => node.winMoves && node.winMoves.length == 3
                },
                FILTER_THREE = {
                    0: (info, idx) => THREE_NOFREE == (info & FOUL_MAX) ? idx : undefined,
                    1: (info, idx) => THREE_FREE == (info & FOUL_MAX_FREE) ? idx : undefined,
                    2: (info, idx) => THREE_NOFREE == (info & FOUL_MAX_FREE) ? idx : undefined
                },
                FILTER_FOUR = {
                    0: (info, idx) => FOUR_NOFREE == (info & FOUL_MAX) ? idx : undefined,
                    1: (info, idx) => FOUR_FREE == (info & FOUL_MAX_FREE) ? idx : undefined,
                    2: (info, idx) => FOUR_NOFREE == (info & FOUL_MAX_FREE) ? idx : undefined
                },
                FILTER_FIVE_NODE = node => FIVE == (node.info & FOUL_MAX_FREE);
                

            const LEVEL_THREE_POINTS_TXT = new Array(225);
            LEVEL_THREE_POINTS_TXT.fill(1).map((v, i) => {
                if (i < 2) LEVEL_THREE_POINTS_TXT[i] = `V`;
                else if (i < 100) LEVEL_THREE_POINTS_TXT[i] = `V${i}`;
                else LEVEL_THREE_POINTS_TXT[i] = `V++`;
            })
            
            //return param
            function copyParam(param) {
                let nParam = {};
                Object.keys(param).map(key => nParam[key] = param[key])
                return nParam;
            }

            //把棋局转成手顺，包含pass (idx = 225)
            //return moves: [idx1, idx2, idx3...]
            function positionToMoves(position) {
                let blackMoves = [],
                    whiteMoves = [],
                    moves = [];
                position.map((color, idx) => {
                    switch (color) {
                        case 1:
                            blackMoves.splice(0, 0, idx);
                            break;
                        case 2:
                            whiteMoves.splice(0, 0, idx);
                            break;
                    }
                })

                //log(`[${movesToName(blackMoves)}]\n[${movesToName(whiteMoves)}]\n[${movesToName(moves)}]`, "warn")
                for (let i = blackMoves.length - 1; i >= 0; i--) {
                    moves.push(blackMoves.pop());
                    if (whiteMoves.length) moves.push(whiteMoves.pop());
                    else break;
                }

                if (blackMoves.length) {
                    !(moves.length & 1) && moves.push(blackMoves.pop());
                    for (let i = blackMoves.length - 1; i >= 0; i--) {
                        moves.push(225, blackMoves.pop());
                    }
                }
                else if (whiteMoves.length) {
                    (moves.length & 1) && moves.push(whiteMoves.pop());
                    for (let i = whiteMoves.length - 1; i >= 0; i--) {
                        moves.push(225, whiteMoves.pop());
                    }
                }
                //log(`[${movesToName(blackMoves)}]\n[${movesToName(whiteMoves)}]\n[${movesToName(moves)}]`, "warn")
                return moves;
            }

            //return first Node || undefined
            function hasPosition(path, tree) {
                let node = tree.getPositionNodes(path, 0, 1)[0];
                return node;
            }

            //return initMoves: [idx1, idx2, idx3...]
            function getInitMoves(tree) {
                let initMoves = [],
                    current = tree.root.down;
                while (current) {
                    initMoves.push(current.idx);
                    current = current.down;
                }
                initMoves[initMoves.length - 1] == 225 && initMoves.pop();
                return initMoves;
            }

            //param: {arr, ?color}
            //return object: { tree, positionMoves, isPushPass, current }
            function createTree(param, nextColor = param.color, isInitMove = true) {
                let tree = new RenjuTree(undefined, undefined, { x: (cBoardSize + 1) / 2, y: (cBoardSize + 1) / 2 }),
                    positionMoves = positionToMoves(param.arr),
                    isPushPass = (positionMoves.length & 1) == (nextColor & 1),
                    current;

                current = tree.createPath(positionMoves.concat(isPushPass ? [225] : []));
                isInitMove && (tree.init = {
                    MS: positionMoves,
                    MSindex: positionMoves.length - 1,
                    resetNum: positionMoves.length + (isPushPass ? 1 : 0)
                })
                return { tree, positionMoves, isPushPass, current };
            }

            //param: {arr, color}
            //return infoArr[226]: info is Uint32
            function getTestThreeInfo(param) {
                let infoArr = new Array(226);
                testThree(param.arr, param.color, infoArr);
                return infoArr;
            }
            
            //param: {arr, color}
            //return infoArr[226]: info is Uint32
            function getTestFourInfo(param) {
                let infoArr = new Array(226);
                testFour(param.arr, param.color, infoArr);
                return infoArr;
            }

            //return array[node1,node2,node3...], 
            // node: {idx: idx, boardText: string, info: info}
            function infoArrToNodes(infoArr) {
                return infoArr.map((info, idx) => {
                    let isFoul = info & FOUL,
                        isFree = info & FREE,
                        foul_max_free = info & FOUL_MAX_FREE;
                    if (isFoul) {
                        return { idx: idx, boardText: EMOJI_FOUL, info: info }
                    }
                    else {
                        switch (foul_max_free) {
                            case FIVE:
                                return { idx: idx, boardText: EMOJI_ROUND_FIVE, info: info }
                                case FOUR_FREE:
                                    return { idx: idx, boardText: EMOJI_ROUND_FOUR, info: info }
                                    case FOUR_NOFREE:
                                        return { idx: idx, boardText: "4", info: info }
                                        case THREE_FREE:
                                            return { idx: idx, boardText: EMOJI_ROUND_THREE, info: info }
                                            case THREE_NOFREE:
                                                return { idx: idx, boardText: "3", info: info }
                        }
                    }
                }).filter(node => !!node)
            }

            //param: {arr, color}
            //return array[node1,node2,node3...], 
            // node: {idx: idx, boardText: string, info: Uint32}
            function getNodes(param, callback) {
                let nodes = infoArrToNodes(getTestThreeInfo(param));
                return nodes.filter(callback);
            }

            //param: {arr, color, ftype}
            //return array[node1,node2,node3...], 
            // node: {idx: idx, boardText: string, info: info}
            function getNodesThree(param) {
                return getNodes(param, FILTER_THREE_NODE[param.ftype])
            }

            //param: {arr, color, ftype}
            //return array[node1,node2,node3...], 
            // node: {idx: idx, boardText: string, info: info}
            function getNodesFour(param) {
                return getNodes(param, FILTER_FOUR_NODE[param.ftype])
            }

            //param: {arr, color}
            //return points: [idx1, idx2 idx3...]
            function getPoints(param, callback) {
                let infoArr = getTestThreeInfo(param);
                return infoArr.map(callback).filter(idx => idx != undefined);
            }

            //param: {arr, color}
            function createTreeNodes(param, callback) {
                let { tree, positionMoves, isPushPass, current } = createTree(param),
                    nodes = getNodes(param, callback);

                nodes.map(node => {
                    let nNode = tree.newNode();
                    nNode.idx = node.idx;
                    nNode.boardText = node.boardText;
                    current.addChild(nNode);
                })
                return tree;
            }

            //param: {arr, color, ftype}
            function getPointsThree(param) {
                return getPoints(param, FILTER_THREE[param.ftype])
            }

            //param: {arr, color, ftype}
            function getPointsFour(param) {
                return getPoints(param, FILTER_FOUR[param.ftype])
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //node: { idx: 0 - 224, lineInfo: Uint16, winMoves: [idx1,idx2,idx3...] }
            //return Promise resolve: node || undefined
            async function getLevelThreeNode(idx, lineInfo, param, thread) {
                if (param.arr[idx] || THREE_FREE < (lineInfo & FOUL_MAX_FREE)) return;
                let arr = param.arr.slice(0);
                arr[idx] = param.color;

                let winMoves = await _findVCF({ arr: arr, color: param.color, maxVCF: param.maxVCF, maxDepth: param.maxDepth, maxNode: param.maxNode }, thread);
                if (winMoves.length) return { idx: idx, lineInfo: lineInfo, winMoves: winMoves };
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //node: { idx: 0 - 224, lineInfo: Uint16, winMoves: [idx1,idx2,idx3...] }
            //return Promise resolve: nodes[node1,node2,node3...] || []
            async function getLevelThreeNodes(param) {
                let infoArr = getTestThreeInfo(param),
                    sltArr = await _selectPoints(param),
                    ps = [];

                for (let idx = 0; idx < 225; idx++) {
                    if (sltArr[idx]) {
                        let thread = await getFreeThread();
                        if (canceling) break;
                        ps.push(getLevelThreeNode(idx, infoArr[idx], param, thread));
                    }
                }
                return (await Promise.all(ps) || []).filter(node => !!node);
            }

            //param: {arr, color, radius, maxVCF, maxDepth, maxNode}
            //return Promise resolve: points[idx1,idx2,idx3...] || []
            async function getLevelThreePoints(param, nextMoves) {
                let infoArr = getTestThreeInfo(param),
                    ps = [];
                for (let i = nextMoves.length - 1; i >= 0; i--) {
                    let thread = await getFreeThread(),
                        idx = nextMoves[i];
                    if (canceling) break;
                    ps.push(getLevelThreeNode(idx, infoArr[idx], param, thread));
                }
                return (await Promise.all(ps) || []).filter(node => !!node).map(node => node.idx);
            }

            //param: {arr, color, radius, maxVCF, maxDepth, maxNode, ftype}
            async function getPointsVCT(param) {
                let nextMoves = [],
                    sortArr = new Array(225).fill(0),
                    fPoints = getPointsFour(param),
                    tPoints;
                param.color = INVERT_COLOR[param.color];
                nextMoves = await _nextMoves(param);
                param.color = INVERT_COLOR[param.color];

                tPoints = await getLevelThreePoints(param, nextMoves);
                nextMoves.map(idx => sortArr[idx] = 2)
                fPoints.map(idx => sortArr[idx]++);
                tPoints.map(idx => sortArr[idx]++);

                return sortArr.map((v, idx) => v > 2 ? idx : undefined).filter(idx => idx != undefined);
            }

            //param: {arr, color, radius, maxVCF, maxDepth, maxNode}
            async function _nextMoves(param) {
                let thread,
                    infoArr = [],
                    blkPoints = [],
                    ps = [];

                ps.push(getBlockPoints(param)
                    .then(points => blkPoints = points))
                param.color = INVERT_COLOR[param.color];
                infoArr = getTestThreeInfo(param);
                param.color = INVERT_COLOR[param.color];
                await Promise.all(ps);

                return blkPoints.filter(idx => !(infoArr[idx] & FOUL));
            }

            //------------------------- exports --------------------

            function _setGameRules(rules) {
                setGameRules(rules);
                reset();
            }
            
            //wait if obj[key] == value resolve
            //return Promise resolve: obj[key]
            async function waitValue(obj, key, value, time = 500) {
                return new Promise((resolve, reject) => {
                    let timer = setInterval(() => {
                        if (obj[key] == value) {
                            clearInterval(timer);
                            resolve(obj[key]);
                        }
                    }, time)
                })
            }
            
            //wait if obj[key] != value resolve
            //return Promise resolve: obj[key]
            async function waitValueChange(obj, key, value, time = 500) {
                return new Promise((resolve, reject) => {
                    let timer = setInterval(() => {
                        if (obj[key] != value) {
                            clearInterval(timer);
                            resolve(obj[key]);
                        }
                    }, time)
                })
            }
            
            //wait if node.score != oScore resolve
            //return Promise resolve: node.score
            async function waitNodeScore(node, oScore, time = 100) {
                return waitValueChange(node, "score", oScore, time);
            }
            
            async function wait(time) {
                return new Promise(resolve => setTimeout(resolve, time))
            }
            
            async function putMove(idx, waitTime = 500) {
                cBoard.wNb(idx, "auto", true);
                await wait(waitTime);
            }

            async function takeMove(idx, waitTime = 500) {
                cBoard.cleNb(idx, true);
                await wait(waitTime);
            }

            //param: {arr, color, radius, maxVCF, maxDepth, maxNode}
            //return Promise resolve: arr[225];
            async function _selectPoints(param, thread) {
                thread = thread || await getFreeThread();
                return await run("selectPoints", param, thread) || new Array(225);
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //return Promise resolve: vcfWinMoves || []
            async function _findVCF(param, thread) {
                thread = thread || await getFreeThread();
                let vInfo = (await run("findVCF", param, thread)) || {winMoves: []};
                return vInfo.winMoves[0] || [];
            }

            //param: {arr, color, vcfMoves, includeFour}
            //return Promise resolve: points[idx1, idx2, idx3...]
            async function _getBlockVCF(param, thread) {
                thread = thread || await getFreeThread();
                return await run("getBlockVCF", param, thread) || [];
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //return Promise resolve: levelBInfo
            async function _getLevelB(param, thread) {
                thread = thread || await getFreeThread();
                return await run("getLevelB", param, thread) || levelBInfo;
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //return Promise resolve: vcfInfo
            async function findVCF(param, thread) {
                thread = thread || await getFreeThread();
                return await run("findVCF", param, thread) || vcfInfo;
            }

            //param: {points, arr, color, maxVCF, maxDepth, maxNode}
            //return Promise resolve: points[idx1, idx2, idx3...]
            async function _excludeBlockVCF(param) {
                let i = param.points.length - 1,
                    ps = [],
                    result = new Array(225);
                while (i >= 0) {
                    let idx = param.points[i--];
                    if (param.arr[idx] == 0) {
                        let thread = await getFreeThread();
                        param.arr[idx] = INVERT_COLOR[param.color];
                        ps.push(_findVCF(param, thread).then(winMoves => 0 == winMoves.length && (result[idx] = idx)));
                        param.arr[idx] = 0;
                    }
                }
                await Promise.all(ps);
                return result.filter(v => v != undefined);
            }


            //param: {arr, color, vcfMoves, includeFour, maxVCF, maxDepth, maxNode}
            //return Promise resolve: points[idx1, idx2, idx3...]
            async function excludeBlockVCF(param) {
                param.points = await _getBlockVCF(param);
                return _excludeBlockVCF(param);
            }

            //param: {arr, color, radius, maxVCF, maxDepth, maxNode}
            //return Promise resolve: points[idx1, idx2, idx3...]
            async function getBlockPoints(param) {
                let levelBInfo = await _getLevelB(param),
                    levelInfo = levelBInfo.levelInfo,
                    level = levelInfo & 0xff,
                    result = [];
                switch (level) {
                    case LEVEL_WIN:
                    case LEVEL_FREEFOUR:
                        break;
                    case LEVEL_NOFREEFOUR:
                        result.push(levelInfo >> 8 & 0xff);
                        break;
                    case LEVEL_DOUBLEFREETHREE:
                    case LEVEL_DOUBLEVCF:
                    case LEVEL_FREETHREE:
                    case LEVEL_VCF:
                        let winMoves = levelBInfo.winMoves;
                        if (winMoves.length) {
                            param.vcfMoves = winMoves;
                            param.includeFour = true;
                            result = await excludeBlockVCF(param);
                        }
                        break;
                    case LEVEL_VCT:
                    case LEVEL_NONE:
                        param.color = INVERT_COLOR[param.color];
                        result = (await _selectPoints(param)).map((v, idx) => v > 0 ? idx : -1).filter(idx => idx > -1);
                        param.color = INVERT_COLOR[param.color];
                        break;
                }
                return result;
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //return Promise resolve: RenjuTree
            async function createTreeVCF(param) {
                let wTree = await createTreeWin(param, LEVEL_NOFREEFOUR)
                if (wTree) return wTree;
                
                isPrintMoves = true;
                let iHtml = "<br><br>",
                    vcfInfo = await findVCF(param),
                    { tree, positionMoves, isPushPass, current } = createTree(param);

                if (vcfInfo.winMoves.length) {
                    iHtml += `解题找${COLOR_NAME[param.color]}VCF:<br>`;
                    vcfInfo.winMoves.map(vcfMoves => {
                        tree.createPathVCF(current, vcfMoves);
                        iHtml += `[${movesToName(vcfMoves)}]<br>`;
                    });
                    tree.createPath(positionMoves).comment = iHtml;
                    tree.init.MS = getInitMoves(tree);
                }
                else {
                    warn(`${EMOJI_FOUL_THREE} ${COLOR_NAME[param.color]} 查找VCF失败了 ${EMOJI_FOUL_THREE}`);
                }
                isPrintMoves = false;
                return tree;
            }

            //param: {arr, color}
            //return Promise resolve: RenjuTree
            function createTreeFive(param) {
                return createTreeNodes(param, FILTER_FIVE_NODE)
            }

            //param: {arr, color, ftype}
            //return Promise resolve: RenjuTree
            function createTreeFour(param) {
                return createTreeNodes(param, FILTER_FOUL_FOUR_NODE[param.ftype])
            }

            //param: {arr, color, ftype}
            //return Promise resolve: RenjuTree
            function createTreeThree(param) {
                return createTreeNodes(param, FILTER_FOUL_THREE_NODE[param.ftype])
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //return Promise resolve: RenjuTree , reject: undefined
            async function createTreeWin(param, winLevel = LEVEL_VCF) {
                let { tree, positionMoves, isPushPass, current } = createTree(param),
                    levelBInfo,
                    level,
                    fiveIdx;

                if (winLevel > LEVEL_VCF) {
                    levelBInfo = getLevel(param.arr, param.color);
                    level = levelBInfo & 0xff;
                    fiveIdx = levelBInfo >> 8 & 0xff;
                }
                else {
                    levelBInfo = await _getLevelB(param);
                    level = levelBInfo.levelInfo & 0xff;
                    fiveIdx = levelBInfo.levelInfo >> 8 & 0xff;
                }

                if (LEVEL_WIN == (getLevel(param.arr, 1) & 0xff) || LEVEL_WIN == (getLevel(param.arr, 2) & 0xff)) {
                    tree.createPath(positionMoves).comment = `<br><br>棋局已结束`;
                    return tree;
                }
                else if (level >= LEVEL_NOFREEFOUR) {
                    let node = tree.newNode();
                    node.idx = fiveIdx;
                    node.boardText = "W";
                    current.addChild(node);
                    tree.createPath(positionMoves).comment = `<br><br>${COLOR_NAME[param.color]} 可以五连`;
                    return tree;
                }
                else if (level == LEVEL_VCF) {
                    tree.createPathVCF(current, levelBInfo.winMoves);
                    tree.init.MS = getInitMoves(tree);
                    tree.createPath(positionMoves).comment = `<br><br>${COLOR_NAME[param.color]} 有杀`;
                    return tree;
                }
                return undefined;
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode, ftype}
            //return Promise resolve: RenjuTree
            async function _createTreeLevelThree(param) {
                let { tree, positionMoves, isPushPass, current } = createTree(param),
                    nodes = await getLevelThreeNodes(param);

                nodes.filter(FILTER_VCF_NODE[param.ftype]).map(node => {
                    let nNode = tree.newNode(),
                        nodePass = tree.newNode();
                    nNode.idx = node.idx;
                    nNode.boardText = LEVEL_THREE_POINTS_TXT[node.winMoves.length];
                    current.addChild(nNode);
                    nNode.addChild(nodePass);
                    tree.createPathVCF(nodePass, node.winMoves);
                })
                return tree;
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode, ftype}
            //return Promise resolve: RenjuTree
            async function createTreeLevelThree(param) {
                cBoard.cleLb("all");
                let wTree = await createTreeWin(param);
                if (wTree) return wTree;
                
                let tree = await _createTreeLevelThree(param);
                return tree;
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //return Promise resolve: RenjuTree
            async function createTreePointsVCT(param) {
                cBoard.cleLb("all");
                let wTree = await createTreeWin(param);
                if (wTree) return wTree;
                
                let tree = await _createTreeLevelThree(param);
                tree.mergeTree(createTreeFour(param));
                return tree;
            }

            //param: {arr, color, radius, maxVCF, maxDepth, maxNode, maxVCT, maxDepthVCT, maxNodeVCT, ftype}
            //return Promise resolve: RenjuTree
            async function createTreeVCT(param) {
                cBoard.cleLb("all");
                    let wTree = await createTreeWin(param);
                    if (wTree) return wTree;

                    let { tree, positionMoves, isPushPass, current } = createTree(param),
                        arr = param.arr,
                        moveList = new MoveList(),
                        bestValue = 0,
                        moves = [],
                        count = 0,
                        curDepthVCT,
                        maxDepthVCT;

                    moveList.setRoot(new ListNode(current, SCORE_MIN, SCORE_MAX));
                    moveList.getRoot().score = SCORE_MIN;

                    while (current) {
                        console.log(`>> [${movesToName(moves)}]\n alpha: ${current.alpha}, beta: ${current.beta}, bestValue: ${current.bestValue}`)
                        while (true) { //选择当前最优分支
                            let nextChild = moves.length & 1 ? current.getMinChild() : current.getMaxChild();
                            if (nextChild) {
                                current = nextChild;
                                let cur = moveList.current();
                                arr[current.idx] = moves.length & 1 ? INVERT_COLOR[param.color] : param.color;
                                moves.push(current.idx);
                                moveList.add(new ListNode(current, cur.alpha, cur.beta));
                                //await putMove(current.idx);
                            }
                            else break;
                        }
                        let vList = [],
                            curIdx = -1,
                            endIdx = moveList.index();
                        while (curIdx++<= endIdx) {
                vList.push(moveList.get(curIdx).bestValue);
            }

            console.info(`>> [${movesToName(moves)}]\nvList: ${vList}`)

            curDepthVCT = moves.length;
            maxDepthVCT = curDepthVCT == 0 ? 3 : curDepthVCT + 4;
            while (current) { // alpha-beta 估值
                //count++;
                if (moves.length < maxDepthVCT) {
                    let points = moves.length & 1 ? await _nextMoves(param) : await getPointsVCT(param),
                        color = moves.length & 1 ? INVERT_COLOR[param.color] : param.color,
                        score = moves.length & 1 ? SCORE_MIN : SCORE_MAX;
                    for (let i = points.length - 1; i >= 0; i--) {
                        let nNode = tree.newNode(points[i], DEFAULT_BOARD_TXT[color]);
                        nNode.score = score;
                        tree.addChild(current, nNode);
                    }
                    count++;
                }

                current = current.down;

                if (current) {
                    let cur = moveList.current();
                    arr[current.idx] = moves.length & 1 ? INVERT_COLOR[param.color] : param.color;
                    moves.push(current.idx);
                    moveList.add(new ListNode(current, cur.alpha, cur.beta));
                    //await putMove(current.idx);
                }
                else {
                    //count++;
                    bestValue = moves.length >= maxDepthVCT ? getScore(moves[moves.length - 1], param.color, arr) : moves.length & 1 ? SCORE_WIN : SCORE_LOST;
                    moveList.current().bestValue = bestValue;
                    //console.log(bestValue);

                    current = undefined;
                    while (moves.length > curDepthVCT) {
                        let right = moveList.current().right;
                        arr[moves.pop()] = 0;
                        moveList.decrement();
                        //await takeMove(moveList.current().idx);

                        let cur = moveList.current();
                        if (moves.length & 1) {
                            cur.bestValue = Math.min(cur.bestValue, bestValue);
                            cur.beta = Math.min(cur.beta, cur.bestValue);
                            if (cur.bestValue == SCORE_LOST || cur.alpha >= cur.beta) right = undefined;
                        }
                        else {
                            cur.bestValue = Math.max(cur.bestValue, bestValue);
                            cur.alpha = Math.max(cur.alpha, cur.bestValue);
                            if (cur.bestValue == SCORE_WIN || cur.alpha >= cur.beta) right = undefined;
                        }
                        bestValue = cur.bestValue;

                        if (right) {
                            current = right;
                            arr[current.idx] = moves.length & 1 ? INVERT_COLOR[param.color] : param.color;
                            moves.push(current.idx);
                            moveList.add(new ListNode(current, cur.alpha, cur.beta));
                            //await putMove(current.idx);
                            break;
                        }
                    }
                }
                if (canceling) break;
            }

            if (canceling) break;

            while (true) {
                if (moves.length) {
                    arr[moves.pop()] = 0;
                    moveList.decrement();
                    current = moveList.current();
                    //await takeMove(current.idx);

                    let { maxScore, minScore } = current.getMaxMinScore(),
                        oldBestValue = current.bestValue;
                    if (moves.length & 1) {
                        current.bestValue = minScore;
                        current.beta = Math.min(current.beta, current.bestValue);
                        console.log(`min << alpha: ${current.alpha}, beta: ${current.beta}, bestValue: ${current.bestValue}, maxScore: ${maxScore}, minScore: ${minScore}`)
                        if (current.bestValue < oldBestValue || current.bestValue == SCORE_LOST || (current.bestValue == SCORE_WIN && maxScore == minScore)) {

                        }
                        else break;
                    }
                    else {
                        current.bestValue = maxScore;
                        current.alpha = Math.max(current.alpha, current.bestValue);
                        console.log(`max << alpha: ${current.alpha}, beta: ${current.beta}, bestValue: ${current.bestValue}, maxScore: ${maxScore}, minScore: ${minScore}`)
                        if (current.bestValue < oldBestValue || current.bestValue == SCORE_WIN || (current.bestValue == SCORE_LOST && maxScore == minScore)) {

                        }
                        else break;
                    }
                }
                else break;
            }

            console.info(`<< [${movesToName(moves)}]`)
            if (moves.length) {
                continue;
                arr[moves.pop()] = 0;
                moveList.decrement();
                current = moveList.current();
                //await takeMove(current.idx)
            }
            else {
                current = moveList.current()
                let bestValue = current.bestValue;
                console.error(`[bestValue: ${bestValue}]`)
                if (bestValue == SCORE_WIN || bestValue == SCORE_LOST) break;
            }
        }

        console.warn(`count: ${count}`)
        return tree;
    }
    
    //param: {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: isBlockVCF
    async function _addBranchIsDoubleVCF(param, blkPoints, tree, current) {
        let ps = [],
            count = 0,
            path = positionToMoves(param.arr),
            hasNode = hasPosition(path, tree),
            hasScore = hasNode && hasNode.score || 0;
        
        //console.log(`path[${path}]\nhas [${hasScore}]`)
        if (hasScore) {
            switch(hasScore) {
                case SCORE_WAIT:
                    ps.push(waitNodeScore(hasNode, SCORE_WAIT)
                        .then(sc => {
                            if (sc == SCORE_RESOLVE) count = blkPoints.length;
                            else count = 0;
                        })
                    );
                    break;
                case SCORE_RESOLVE:
                    count = blkPoints.length;
                    break;
                case SCORE_REJECT:
                    count = 0;
                    break;
            }
        }
        else {
            current.score = SCORE_WAIT;
            for (let i = blkPoints.length - 1; i >= 0; i--) {
            //blkPoints.map(idx => {
                let idx = blkPoints[i],
                    arr = param.arr.slice(0),
                    cur = tree.newNode(idx, DEFAULT_BOARD_TXT[INVERT_COLOR[param.color]]);
                arr[idx] = INVERT_COLOR[param.color];
                current.addChild(cur);
                ps.push(_findVCF({arr: arr, color: param.color, maxVCF: param.maxVCF, maxDepth: param.maxDepth, maxNode: param.maxNode})
                    .then(winMoves => {
                        if (winMoves.length) {
                            cur.boardText = "L";
                            cur.comment = `<br><br>${COLOR_NAME[INVERT_COLOR[param.color]]} 防 ${idxToName(idx)} 不成立<br> ${COLOR_NAME[param.color]} 还有 VCF:<br> [${movesToName(winMoves)}]`;
                            tree.createPathVCF(cur, winMoves);
                            count++;
                        }
                        else {
                            let levelInfo = getLevel(arr, INVERT_COLOR[param.color]),
                                bIdx = (levelInfo >>> 8) & 0xff,
                                level = levelInfo & 0xff,
                                narr = arr.slice(0);
                            narr[bIdx] = param.color;
                            if (level == LEVEL_FREEFOUR || level == LEVEL_NOFREEFOUR) {
                                return _findVCF({arr: narr, color: param.color, maxVCF: param.maxVCF, maxDepth: param.maxDepth, maxNode: param.maxNode})
                                    .then(wMoves => {
                                        let ncur = tree.newNode(bIdx, DEFAULT_BOARD_TXT[param.color]);
                                        cur.addChild(ncur); 
                                        cur.comment = `<br><br>${COLOR_NAME[INVERT_COLOR[param.color]]} 先手防于 ${idxToName(idx)}`;
                                        if (wMoves.length) {
                                            return _getBlockVCF({arr: narr, color: param.color, vcfMoves: wMoves, includeFour: true})
                                                .then(bPoints => {
                                                    ncur.comment = `<br><br>${COLOR_NAME[param.color]} 挡四后有 VCF:<br>[${movesToName(wMoves)}]<br>${COLOR_NAME[INVERT_COLOR[param.color]]}防点:<br>[${movesToName(bPoints)}]`;
                                                    return _addBranchIsDoubleVCF({arr: narr, color: param.color, maxVCF: param.maxVCF, maxDepth: param.maxDepth, maxNode: param.maxNode}, bPoints, tree, ncur)
                                                        .then(r => {
                                                            if (r) {
                                                                cur.boardText = "L";
                                                                ncur.boardText = "W";
                                                                count++;
                                                            }
                                                        })
                                                })
                                        }
                                        else {
                                            ncur.comment = `<br><br>${COLOR_NAME[param.color]} 挡四后无 VCF`;
                                        }
                                    })
                            }
                            else {
                                cur.comment = `<br><br>${COLOR_NAME[INVERT_COLOR[param.color]]} 防 ${idxToName(idx)}<br>${COLOR_NAME[param.color]} 没有 VCF，防点成立<br>`;
                            }
                        }
                    })
                )
                if (0 == ps.length % MAX_THREAD_NUM) {
                    await Promise.all(ps);
                    ps = [];
                }
            //})
            }
        }
        
        return Promise.all(ps)
            .then(() => {
                if (count == blkPoints.length) {
                    current.score = SCORE_RESOLVE;
                    return true;
                }
                else {
                    current.score = SCORE_REJECT;
                    return false;
                }
            })
    }
    
    //param {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: RenjuTree
    async function createTreeBlockVCF(param) {
        cBoard.cleLb("all");
        param.color = INVERT_COLOR[param.color];
        let wTree = await createTreeWin(param, LEVEL_NOFREEFOUR);
        if (wTree) return wTree;
        
        let iHtml = "<br><br>",
            vcfInfo = await findVCF(param),
            { tree, positionMoves, isPushPass, current} = createTree(param, INVERT_COLOR[param.color]);
            
        if (vcfInfo.winMoves.length) {
            iHtml += `找到${COLOR_NAME[param.color]}VCF:<br>`;
            iHtml += `[${movesToName(vcfInfo.winMoves[0])}]<br>`;
            
            param.vcfMoves = vcfInfo.winMoves[0];
            param.includeFour = true;
            let blkPoints = await _getBlockVCF(param);
            if (param.blkDepth == 1) {
                current.addChilds(tree.createNodes(blkPoints, {boardText: DEFAULT_BOARD_TXT[INVERT_COLOR[param.color]]})).map(cur => {
                    cur.comment = `<br><br>${COLOR_NAME[param.color]} VCF:<br>[${movesToName(vcfInfo.winMoves[0])}]<br>已经不成立`;
                })
            }
            else {
                await _addBranchIsDoubleVCF(param, blkPoints, tree, current);
            }
                
            iHtml += `${COLOR_NAME[INVERT_COLOR[param.color]]}防点:<br>`;
            iHtml += `[${movesToName(blkPoints)}]<br>-----点击棋盘查看计算结果-----<br>`;
            tree.createPath(positionMoves).comment = iHtml;
        }
        else {
            warn(`${EMOJI_FOUL_THREE} ${COLOR_NAME[param.color]} 查找VCF失败了 ${EMOJI_FOUL_THREE}`);
        }
        return tree;
    }
    
    //param {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: RenjuTree
    async function createTreeDoubleVCF(param) {
        cBoard.cleLb("all");
        let wTree = await createTreeWin(param);
        if (wTree) return wTree;
        
        let { tree, positionMoves, isPushPass, current} = createTree(param),
            nodes = await getLevelThreeNodes(param),
            infoArr = getTestThreeInfo(param),
            ps = [];
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i],
                idx = node.idx;
            if (THREE_FREE != (infoArr[idx] & FOUL_MAX_FREE)) {
                let narr = param.arr.slice(0),
                    nParam = {arr: narr, color: param.color, maxVCF: param.maxVCF, maxDepth: param.maxDepth, maxNode: param.maxNode},
                    cur = tree.newNode(idx, DEFAULT_BOARD_TXT[param.color]),
                    blkPoints = [];
                        
                current.addChild(cur);
                narr[idx] = param.color;
                nParam.vcfMoves = node.winMoves;
                nParam.includeFour = true;
                blkPoints = await _getBlockVCF(nParam);
                    
                ps.push(_addBranchIsDoubleVCF(nParam, blkPoints, tree, cur)
                    .then(isDoubleVCF => {
                        if (isDoubleVCF) {
                            cur.boardText = "W";
                        }
                        cur.comment = `<br><br>${COLOR_NAME[param.color]} 做杀:<br>[${movesToName(node.winMoves)}]<br>${COLOR_NAME[INVERT_COLOR[param.color]]} 防点:<br>[${movesToName(blkPoints)}]<br>双杀 ${isDoubleVCF?"成立":"不成立"}`;
                        if (canceling) current.removeChild(cur);
                        else cBoard.wLb(cur.idx, cur.boardText, "black");
                    })
                )
                cBoard.printSearchPoint(ps.length, idx, "green");
                if (0 == ps.length % MAX_THREAD_NUM) {
                    await Promise.all(ps);
                    cBoard.cleSearchPoint();
                    ps = [];
                }
            }
        }
        await Promise.all(ps);
        tree.createPath(positionMoves).comment = `<br><br>${COLOR_NAME[param.color]} 找 茶馆双杀点:<br>双杀点不包括直接活三点<br>-----点击棋盘查看计算结果-----<br>`;
        cBoard.cleSearchPoint();
        return tree;
    }
    
    //return isFoul: [FOUL, FIVE, 0]
    function _addBranchIsFoul(idx, arr, tree, blackCurrent, depth = 0) {
        let ov = arr[idx],
            rt = 0,
            fiveCount = 0,
            foulCount = 0,
            fourCount = 0,
            threeCount = 0,
            lineInfos = [],
            iHtml = `<br><br>判断 ${idxToName(idx)} 是否为禁手......<br>`,
            pCur = blackCurrent.getChild(225),
            bCur = tree.newNode(idx, DEFAULT_BOARD_TXT[1]);
        
        if (!pCur) {
            pCur = tree.newNode(225);
            blackCurrent.addChild(pCur);
        }
        pCur.addChild(bCur);
        arr[idx] = 1;
        for (let direction = 0; direction < 4; direction++) {
            let info = testLineThree(idx, direction, 1, arr),
                v = FOUL_MAX_FREE & info;
            if (v == FIVE) { // not foul
                fiveCount++;
                break;
            }
            else if (v > FOUL) foulCount++;
            else if (v >= FOUR_NOFREE) fourCount++;
            else if (v == THREE_FREE) {
                threeCount++;
                lineInfos.push(info & 0x8fff | (direction << 12))
            }
        }
        if (fiveCount) {
            rt = FIVE;
            iHtml += `${idxToName(idx)} 是五连点<br>    五连否定禁手<br>    五连否定活四<br>`;
        }
        else if (foulCount || fourCount > 1){
            rt = FOUL;
            iHtml += `${idxToName(idx)} 是简单禁手<br>    禁手否定活四<br>`;
        }
        else if (threeCount > 1) {
            iHtml += `找到三三形状,继续判断活四点...<br>有活四点的才是活三......<br>`;
            threeCount = 0;
            while (lineInfos.length + threeCount > 1) {
                if (threeCount > 1) break;
                let lineInfo = lineInfos.pop(),
                    dirName = DIRECTION_NAME[(lineInfo >> 12) & 7],
                    ps = getFreeFourPoint(idx, arr, lineInfo),
                    len = ps[0],
                    pointInfo = 0;
                //console.log(`idx: ${idxToName(idx)} [${movesToName(ps.slice(1, ps[0]+1))}]`)
                iHtml += `判断 ${dirName} 线是否为活三......<br>`;
                if (len) {
                    arr[ps[1]] = 1;
                    pointInfo = _addBranchIsFoul(ps[1], arr, tree, bCur, depth+1);
                    arr[ps[1]] = 0;
                    if (!pointInfo) {
                        iHtml += `[${idxToName(ps[1])}] 是活四点 ${dirName} 线是活三<br>`;
                        threeCount++;
                        continue;
                    }
                    else {
                        iHtml += `[${idxToName(ps[1])}] 是 ${LINE_NAME[pointInfo]}点, 不是活四点<br>`;
                    }
                }
                
                if (len == 2) {
                    arr[ps[2]] = 1;
                    pointInfo = _addBranchIsFoul(ps[2], arr, tree, bCur, depth+1);
                    arr[ps[2]] = 0;
                    if (!pointInfo) {
                        iHtml += `[${idxToName(ps[2])}] 是活四点 ${dirName} 线是活三<br>`;
                        threeCount++;
                    }
                    else {
                        iHtml += `[${idxToName(ps[2])}] 是 ${LINE_NAME[pointInfo]}点, 不是活四点<br>`;
                    }
                }
            }
            if (threeCount > 1) {
                rt = FOUL;
                iHtml += `找到两个活三<br>  [${idxToName(idx)}] 是三三禁手<br>    禁手否定活四<br>`;
            }
            else {
                iHtml += `不够两个活三<br>  [${idxToName(idx)}] 不是三三禁手,${depth?"是活四点":""}<br>`;
            }
        }
        else {
            iHtml += `[${idxToName(idx)}] 没有禁手形状,不是禁手,${depth?"是活四点":""}<br>`;
            depth==0 && (pCur.removeChild(bCur));
        }
        arr[idx] = ov;
        if (rt) bCur.boardText = {10: EMOJI_ROUND_FIVE, 16: EMOJI_FOUL}[rt];
        else depth && (bCur.boardText = EMOJI_ROUND_FOUR)
        bCur.comment += iHtml; //concat comment
        return rt;
    }
    
    //param: {arr, color}
    //return Promise resolve: RenjuTree
    async function createTreeTestFoul(param) {
        cBoard.cleLb("all");
        let { tree, positionMoves, isPushPass, current} = createTree(param, 2),
            infoArr = getTestThreeInfo(param);
        tree.createPath(positionMoves).comment = `<br><br>解题 全盘禁手分析<br>-----点击棋盘查看计算结果-----<br>`;
        for (let idx = 0; idx < 225; idx++) {
            let fmf = infoArr[idx] & FOUL_MAX_FREE;
            if (fmf >= THREE_FREE) {
                _addBranchIsFoul(idx, param.arr, tree, current);
            }
        }
        return tree;
    }
    
    //param {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: isWin
    async function _addBranchBlockNumberWin(param, blkPoints, tree, current, depth = 0) {
        param = copyParam(param);
        param.arr = param.arr.slice(0);
        let ps = [],
            isWin = true;
        
        for (let i = blkPoints.length - 1; i >= 0; i--) {
            let idx = blkPoints[i],
                arr = param.arr,
                blkCur = tree.newNode(idx, "L");
        
            current.addChild(blkCur);
            arr[idx] = INVERT_COLOR[param.color];
            ps.push(_addBranchNumberWin(param, tree, blkCur, depth + 1)
                .then(isW => {
                    if (!isW) {
                        isWin = false;
                        blkCur.boardText = DEFAULT_BOARD_TXT[INVERT_COLOR[param.color]];
                        blkCur.comment = `${COLOR_NAME[INVERT_COLOR[param.color]]} 防守:<br>[${idxToName(idx)}]<br>${COLOR_NAME[param.color]} 不能在 ${~~(param.maxDepth / 2) + 2} 手内五连`;
                    }
                })
            )
            arr[idx] = 0;
            if (0 == ps.length % MAX_THREAD_NUM) {
                await Promise.all(ps);
                ps = [];
            }
            //if (!isWin) break;
        }
        await Promise.all(ps);
        return isWin;
    }
    
    //param {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: isWin
    async function _addBranchNumberWin(param, tree, current, depth = 0) {
        param = copyParam(param);
        param.arr = param.arr.slice(0);
        let ps = [],
            isWin = false,
            arr = param.arr,
            path = positionToMoves(arr),
            hasNode = hasPosition(path, tree),
            hasScore = hasNode && hasNode.score || 0;
        
        if (hasScore) {
            switch (hasScore) {
                case SCORE_WAIT:
                    isWin = SCORE_RESOLVE == await waitNodeScore(hasNode, SCORE_WAIT);
                    break;
                case SCORE_RESOLVE:
                    isWin = true;
                    break;
                case SCORE_REJECT:
                    isWin = false;
                    break;
            }
        }
        else if (param.maxDepth >= 0) {
            current.score = SCORE_WAIT;
            let vcfMoves = await _findVCF(param)
            
            if (vcfMoves.length) {
                tree.createPathVCF(current, vcfMoves);
                isWin = true;
            }
            else if (param.maxDepth >= 2) {
                param.maxDepth -= 2;
                let fourNodes = getNodesFour({arr: arr, color: param.color, ftype: FIND_ALL});
                for (let i = fourNodes.length - 1; i >= 0; i--) {
                    let idx = fourNodes[i].idx,
                        cur = tree.newNode(idx, DEFAULT_BOARD_TXT[param.color]),
                        bIdx;
                        
                    arr[idx] = param.color;
                    current.addChild(cur);
                    bIdx = getBlockFourPoint(idx, arr, fourNodes[i].info);
                    ps.push(_addBranchBlockNumberWin(param, [bIdx], tree, cur, depth + 1)
                        .then(isW => {
                            if (isW) {
                                isWin = true;
                                cur.boardText = "W";
                            }
                            cur.comment = `${COLOR_NAME[param.color]} 冲四:<br>[${idxToName(idx)}]<br>防点:<br>[${idxToName(bIdx)}]`;
                            if (0 == depth) {
                                if (canceling) current.removeChild(cur);
                                else cBoard.wLb(cur.idx, cur.boardText, "black");
                            }
                        })
                    )
                    arr[idx] = 0;
                    0 == depth && cBoard.printSearchPoint(ps.length, idx, "green");
                    if (0 == ps.length % MAX_THREAD_NUM) {
                        await Promise.all(ps);
                        0 == depth && cBoard.cleSearchPoint();
                        ps = [];
                    }
                }
                
                let nodes = await getLevelThreeNodes(param);
                for (let i = nodes.length - 1; i >= 0; i--) {
                    let node = nodes[i],
                        idx = node.idx,
                        cur = tree.newNode(idx, DEFAULT_BOARD_TXT[param.color]),
                        blkPoints;
                        
                    arr[idx] = param.color;
                    current.addChild(cur);
                    param.vcfMoves = node.winMoves;
                    param.includeFour = true;
                    blkPoints = await _getBlockVCF(param);
                    ps.push(_addBranchBlockNumberWin(param, blkPoints, tree, cur, depth + 1)
                        .then(isW => {
                            if (isW) {
                                isWin = true;
                                cur.boardText = "W";
                            }
                            cur.comment = `${COLOR_NAME[param.color]} 做杀:<br>[${movesToName(node.winMoves)}]<br>防点:<br>[${movesToName(blkPoints)}]`;
                            if (0 == depth) {
                                if (canceling) current.removeChild(cur);
                                else cBoard.wLb(cur.idx, cur.boardText, "black");
                            }
                        })
                    )
                    arr[idx] = 0;
                    0 == depth && cBoard.printSearchPoint(ps.length, idx, "green");
                    if (0 == ps.length % MAX_THREAD_NUM) {
                        await Promise.all(ps);
                        0 == depth && cBoard.cleSearchPoint();
                        ps = [];
                    }
                }
            }
        }
        
        await Promise.all(ps);
        if (isWin) current.score = SCORE_RESOLVE;
        else current.score = SCORE_REJECT;
        return isWin;
    }
    
    //param {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: isWin
    async function _addBranchNumberWinVC2(param, tree, current, depth = 0) {
    }
    
    //param {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: RenjuTree
    async function createTreeFourWin(param) {
        cBoard.cleLb("all");
        let wTree = await createTreeWin(param, LEVEL_FREEFOUR);
        if (wTree) return wTree;
        try{
        let { tree, positionMoves, isPushPass, current} = createTree(param),
            isWin = await _addBranchNumberWin(param, tree, current);
        
        tree.createPath(positionMoves).comment = `<br><br>解题 大道五目:<br>解题规则 <br>1.要求在四手棋内五连<br>2.第一手活三级别`;
        cBoard.cleSearchPoint();
        return tree;
        }
        catch(err){
            alert(err.stack)
        }
    }

    //------------------------ exports ----------------------

    return {
        MAX_THREAD_NUM: MAX_THREAD_NUM,
        setGameRules: _setGameRules,
        getFreeThread: getFreeThread,
        cancel: cancel,
        findVCF: findVCF,
        getBlockVCF: _getBlockVCF,
        getLevelB: _getLevelB,
        createTreeVCF: createTreeVCF,
        createTreeFive: createTreeFive,
        createTreeFour: createTreeFour,
        createTreeThree: createTreeThree,
        createTreePointsVCT: createTreePointsVCT,
        createTreeLevelThree: createTreeLevelThree,
        createTreeBlockVCF: createTreeBlockVCF,
        createTreeDoubleVCF: createTreeDoubleVCF,
        createTreeTestFoul: createTreeTestFoul,
        createTreeFourWin: createTreeFourWin,
        excludeBlockVCF: excludeBlockVCF,
        getBlockPoints: getBlockPoints,
        createTreeVCT: createTreeVCT,
        reset: () => {},
        //test
        _findVCF: _findVCF,
        _nextMoves: _nextMoves,
        _addBranchIsFoul: _addBranchIsFoul,
        getLevelThreeNodes: getLevelThreeNodes,
        getLevelThreePoints: getLevelThreePoints,
        getPointsVCT: getPointsVCT
    };

})();
