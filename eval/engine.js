if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["engine"] = "v2110.06";
window.engine = (function() {
            "use strict";
            const TEST_ENGINE = false;

            function log(param, type = "log") {
                const print = console[type] || console.log;
                TEST_ENGINE && window.DEBUG && print(`[engine.js]\n>>  ${ param}`);
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
                selectPointsLevel: function(param) { this.result = param.selectArr },
            };

            function onmessage(e) {
                if (typeof e.data == "object") {
                    if (e.data.cmd == "resolve") {
                        this.result = e.data.param || this.result;
                        this.resolve(this.result);
                        this.isBusy = false;
                    } //log("resolve", "warn");
                    else if (typeof COMMAND[e.data.cmd] == "function") {
                        COMMAND[e.data.cmd].call(this, e.data.param)
                    }
                }
            }

            function onerror(e) {
                this.resolve(this.result);
                this.isBusy = false;
                log(e, "error");
            }

            //------------------------ Thread --------------------

            const UNLOCK = 0;
            const LOCK1 = 1;
            const LOCK2 = 2;

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
                    this.ID = `thread` + `0000${index}`.slice(-2);
                    this.init();
                }
            }

            Thread.prototype.init = async function() {
                this.isBusy = false;
                this.lockCode = UNLOCK;
                this.lockCount = 0;
                this.resolve = function() {};
                //this.reject = function() {};
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
                return new Promise((resolve) => {
                    if (this.isBusy) { throw new Error("Thread is busy"); return };
                    this.isBusy = true;
                    this.result = undefined;
                    this.resolve = resolve;
                    //this.reject = reject;
                    this.onmessage = onmessage;
                    this.onerror = onerror;
                    if (canceling) this.onmessage({ data: { cmd: "resolve" } });
                    else this.postMessage({ cmd: cmd, param: param });
                });
            }

            Thread.prototype.cancel = async function(param) {
                this.onmessage({ data: { cmd: "resolve" } });
                return this.reset()
            }

            Thread.prototype.lock = function(code = LOCK1) {
                this.lockCode < code && (this.lockCode = code);
            }

            Thread.prototype.unlock = function(code = LOCK1) {
                this.lockCode <= code && (this.lockCode = UNLOCK);
                //console.log(`unlock ${this.lockCode}`)
            }

            Thread.prototype.postMessage = function(param) {
                this.work.postMessage(param);
            }

            //------------------------ THREADS --------------------

            const HD_CURRENT = window.navigator.hardwareConcurrency || 4,
                MAX_THREAD_NUM = 0xf8 & HD_CURRENT ? HD_CURRENT - 2 : 0xfe & HD_CURRENT ? HD_CURRENT - 1 : HD_CURRENT;
            let THREADS = new Array(MAX_THREAD_NUM),
                canceling = false;
            let waitThreadList = [], //[resolve1, resolve2, ...]
                waitThreadInterval = null;
            for (let i = 0; i < MAX_THREAD_NUM; i++) THREADS[i] = new Thread(document.currentScript.src.replace("engine.js", "worker.js"), i + 1);

            function getFreeThreads(threads = THREADS) {
                //threads.map(thread => console.log(`${!thread.isBusy}  ${thread.lockCode}`))
                //console.log(waitThreadList.length);
                return threads.filter(thread => {
                    if (thread.lockCount > 100) alert(`${thread.ID} ERROR...`)
                    if (!thread.isBusy) {
                        if (thread.lockCode == UNLOCK) {
                            thread.lockCount = 0;
                            return true;
                        }
                        else thread.lockCount++
                    }
                })
            }

            async function waitFreeThread(threads = THREADS) {
                !waitThreadInterval && loopWaitThreadList()
                return new Promise((resolve) => {
                    waitThreadList.push(resolve)
                });
            }

            function loopWaitThreadList() {
                THREADS.map(thread => (thread.isBusy = false, thread.unlock(LOCK2)));
                waitThreadInterval && clearInterval(waitThreadInterval);
                waitThreadInterval = setInterval(() => {
                    try {
                        if (waitThreadList.length)
                            getFreeThreads().map(thread => {
                                waitThreadList.length && (thread.lock(), waitThreadList.shift()(thread)); //resolve(thread)
                            })
                        else if (getFreeThreads().length == MAX_THREAD_NUM)
                            stopWaitThreadList();

                    }
                    catch (e) {
                        alert(e.stack)
                    }
                }, 0)
            }

            function stopWaitThreadList() {
                waitThreadInterval && clearInterval(waitThreadInterval);
                waitThreadInterval = null;
            }

            async function run(cmd, param) {
                //log(param, "log");
                let thread = await waitFreeThread();
                let result = await thread.run({ cmd: cmd, param: param });
                thread.unlock(LOCK1);
                return result;
            }

            function reset() {
                return Promise.all(THREADS.map(thread => thread.cancel()));
            }

            function cancel() {
                return new Promise((resolve) => {
                    if (canceling) {
                        resolve();
                    }
                    else {
                        THREADS.map(thread => thread.lock(LOCK2));
                        reset()
                            .then(() => {
                                canceling = true;
                                THREADS.map(thread => thread.unlock(LOCK2));
                                let count = 0,
                                    timer = setInterval(() => {
                                        count = THREADS.find(thread => thread.isBusy) ? 0 : count + 1;
                                        if (count > 15) {
                                            clearInterval(timer);
                                            resolve();
                                            setTimeout(() => canceling = false, 1500)
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
            const DIRECTION_NAME = ["→ 线", "↓ 线", "↘ 线", "↗ 线"];
            const BLOCK_MODE = "selectPointsLevel",
                AROUND_MODE = "selectPoints";
            const SCORE_MAX = 0xFF,
                SCORE_MIN = 0x00,
                SCORE_WIN = 0xFE,
                SCORE_LOST = 0x01,
                SCORE_WAIT = 0x01,
                SCORE_RESOLVE = 0x02,
                SCORE_REJECT = 0x03;

            const FILTER_FOUL_THREE_NODE = {
                    0: node => (node.lineInfo & FOUL) || THREE_NOFREE == (node.lineInfo & FOUL_MAX),
                    1: node => (node.lineInfo & FOUL) || THREE_FREE == (node.lineInfo & FOUL_MAX_FREE),
                    2: node => (node.lineInfo & FOUL) || THREE_NOFREE == (node.lineInfo & FOUL_MAX_FREE)
                },
                FILTER_FOUL_FOUR_NODE = {
                    0: node => (node.lineInfo & FOUL) || FOUR_NOFREE == (node.lineInfo & FOUL_MAX),
                    1: node => (node.lineInfo & FOUL) || FOUR_FREE == (node.lineInfo & FOUL_MAX_FREE),
                    2: node => (node.lineInfo & FOUL) || FOUR_NOFREE == (node.lineInfo & FOUL_MAX_FREE)
                },
                FILTER_THREE_NODE = {
                    0: node => THREE_NOFREE == (node.lineInfo & FOUL_MAX),
                    1: node => THREE_FREE == (node.lineInfo & FOUL_MAX_FREE),
                    2: node => THREE_NOFREE == (node.lineInfo & FOUL_MAX_FREE)
                },
                FILTER_FOUR_NODE = {
                    0: node => FOUR_NOFREE == (node.lineInfo & FOUL_MAX),
                    1: node => FOUR_FREE == (node.lineInfo & FOUL_MAX_FREE),
                    2: node => FOUR_NOFREE == (node.lineInfo & FOUL_MAX_FREE)
                },
                FILTER_VCF_NODE = {
                    0: node => true,
                    1: node => node.winMoves && node.winMoves.length > 3,
                    2: node => node.winMoves && node.winMoves.length == 3
                },
                FILTER_THREE = {
                    0: (lineInfo, idx) => THREE_NOFREE == (lineInfo & FOUL_MAX) ? idx : undefined,
                    1: (lineInfo, idx) => THREE_FREE == (lineInfo & FOUL_MAX_FREE) ? idx : undefined,
                    2: (lineInfo, idx) => THREE_NOFREE == (lineInfo & FOUL_MAX_FREE) ? idx : undefined
                },
                FILTER_FOUR = {
                    0: (lineInfo, idx) => FOUR_NOFREE == (lineInfo & FOUL_MAX) ? idx : undefined,
                    1: (lineInfo, idx) => FOUR_FREE == (lineInfo & FOUL_MAX_FREE) ? idx : undefined,
                    2: (lineInfo, idx) => FOUR_NOFREE == (lineInfo & FOUL_MAX_FREE) ? idx : undefined
                },
                FILTER_FIVE_NODE = node => FIVE == (node.lineInfo & FOUL_MAX_FREE);


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
                let node = tree.getPositionNodes(path, 7, 1)[0];
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

            function filterBlockPoints(bPoints, color, arr) {
                let infoArr = new Array(226),
                    fourPoints = [],
                    elsePoints = [];
                testFour(arr, color, infoArr);
                for (let i = bPoints.length - 1; i >= 0; i--) {
                    let idx = bPoints[i];
                    if (FOUR_NOFREE == (FOUL_MAX & infoArr[idx])) fourPoints.push(idx);
                    else elsePoints.push(idx);
                }
                return { fourPoints: fourPoints, elsePoints: elsePoints }
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
            // node: {idx: idx, boardText: string, lineInfo: info}
            function infoArrToNodes(infoArr) {
                return infoArr.map((info, idx) => {
                    let isFoul = info & FOUL,
                        isFree = info & FREE,
                        foul_max_free = info & FOUL_MAX_FREE;
                    if (isFoul) {
                        return { idx: idx, boardText: EMOJI_FOUL, lineInfo: info }
                    }
                    else {
                        switch (foul_max_free) {
                            case FIVE:
                                return { idx: idx, boardText: EMOJI_ROUND_FIVE, lineInfo: info }
                                case FOUR_FREE:
                                    return { idx: idx, boardText: EMOJI_ROUND_FOUR, lineInfo: info }
                                    case FOUR_NOFREE:
                                        return { idx: idx, boardText: "4", lineInfo: info }
                                        case THREE_FREE:
                                            return { idx: idx, boardText: EMOJI_ROUND_THREE, lineInfo: info }
                                            case THREE_NOFREE:
                                                return { idx: idx, boardText: "3", lineInfo: info }
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
            // node: {idx: idx, boardText: string, lineInfo: info}
            function getNodesThree(param) {
                return getNodes(param, FILTER_THREE_NODE[param.ftype])
            }

            //param: {arr, color, ftype}
            //return array[node1,node2,node3...], 
            // node: {idx: idx, boardText: string, lineInfo: info}
            function getNodesFour(param, filterArr = new Array(225).fill(1)) {
                return getNodes(param, FILTER_FOUR_NODE[param.ftype])
                    .filter(node => filterArr[node.idx])
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
            async function getLevelThreeNode(idx, lineInfo, param) {
                if (param.arr[idx] || THREE_FREE < (lineInfo & FOUL_MAX_FREE)) return;
                let arr = param.arr.slice(0);
                arr[idx] = param.color;

                let winMoves = await _findVCF({ arr: arr, color: param.color, maxVCF: param.maxVCF, maxDepth: param.maxDepth, maxNode: param.maxNode });
                if (winMoves.length) return { idx: idx, lineInfo: lineInfo, winMoves: winMoves };
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode, ?nMaxDepth}
            //node: { idx: 0 - 224, lineInfo: Uint16, winMoves: [idx1,idx2,idx3...] }
            //return Promise resolve: nodes[node1,node2,node3...] || []
            async function getLevelThreeNodes(param, filterArr) {
                let infoArr = getTestThreeInfo(param),
                    sltArr = filterArr || await _selectPoints(param, BLOCK_MODE),
                    nodes = [],
                    ps = [];

                for (let idx = 0; idx < 225; idx++) {
                    if (sltArr[idx]) {
                        ps.push(getLevelThreeNode(idx, infoArr[idx], param)
                            .then(node => node && nodes.push(node))
                        );
                        /*if (ps.length >= MAX_THREAD_NUM) {
                            await Promise.race(ps);
                            await removeFinallyPromise(ps);
                        }*/
                    }
                }
                await Promise.all(ps);
                return nodes;
            }

            //param: {arr, color, ?radius, maxVCF, maxDepth, maxNode}
            //return Promise resolve: points[idx1,idx2,idx3...] || []
            async function getLevelThreePoints(param, filterArr) {
                return (await getLevelThreeNodes(param, filterArr)).map(node => node.idx);
            }

            //param: {arr, color, ?radius, maxVCF, maxDepth, maxNode, ?nMaxDepth}
            //return Promise resolve: {fourNodes, threeNodes, twoNodes}
            async function getContinueNodes(param) {
                let filterArr = await _selectPoints(param, BLOCK_MODE),
                    fourNodes = getNodesFour({ arr: param.arr, color: param.color, ftype: FIND_ALL }, filterArr),
                    threeNodes = await getLevelThreeNodes(param, filterArr),
                    radiusArr = selectPoints(param.arr, param.color, 3, 0, 0, 0),
                    twoNodes = [],
                    elseNodes = [];
                fourNodes.map(node => filterArr[node.idx] = 0);
                threeNodes.map(node => filterArr[node.idx] = 0);
                filterArr.map((v, idx) => {
                    if (v) {
                        if (radiusArr[idx]) twoNodes.push({ idx: idx })
                        else elseNodes.push({ idx: idx })
                    }
                });
                return { fourNodes, threeNodes, twoNodes, elseNodes };
            }

            //param: {arr, color, ?radius, maxVCF, maxDepth, maxNode, ftype}
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

            //param: {arr, color, ?radius, maxVCF, maxDepth, maxNode}
            async function _nextMoves(param) {
                let infoArr = [],
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

            //return Promise resolve: isFinally
            async function isFinally(promise) {
                let isF = true,
                    t = {};
                await Promise.race([promise, t])
                    .then(v => v === t && (isF = false))
                return isF;
            }

            //loop promiseArray removeFinallyPromise
            async function removeFinallyPromise(promiseArray) {
                for (let j = promiseArray.length - 1; j >= 0; j--) {
                    if (await isFinally(promiseArray[j])) {
                        promiseArray.splice(j, 1);
                    }
                }
            }

            //wait if obj[key] == value resolve
            //return Promise resolve: obj[key]
            async function waitValue(obj, key, value, timeout = 500) {
                return new Promise((resolve) => {
                    let timer = setInterval(() => {
                        if (obj[key] == value) {
                            clearInterval(timer);
                            resolve(obj[key]);
                        }
                    }, timeout)
                })
            }

            //wait if obj[key] != value resolve
            //return Promise resolve: obj[key]
            async function waitValueChange(obj, key, value, timeout = 500) {
                return new Promise((resolve) => {
                    let timer = setInterval(() => {
                        if (obj[key] != value) {
                            clearInterval(timer);
                            resolve(obj[key]);
                        }
                    }, timeout)
                })
            }

            //wait if node.score != oScore resolve
            //return Promise resolve: node.score
            async function waitNodeScore(node, oScore, timeout = 100) {
                return waitValueChange(node, "score", oScore, timeout);
            }

            //return Promise resolve: node
            async function hasPositionNode(arr, tree) {
                let path = positionToMoves(arr),
                    hasNode = hasPosition(path, tree),
                    hasScore = hasNode && hasNode.score || 0;

                if (hasScore == SCORE_WAIT) {
                    hasScore = await waitNodeScore(hasNode, SCORE_WAIT);
                }
                return hasNode;
            }

            //return Promise resolve: score
            async function hasPositionScore(arr, tree) {
                return await hasPositionNode(arr, tree).score;
            }

            async function wait(timeout) {
                return new Promise(resolve => setTimeout(resolve, timeout))
            }

            async function putMove(idx, waitTime = 500) {
                cBoard.wNb(idx, "auto", true);
                await wait(waitTime);
            }

            async function takeMove(idx, waitTime = 500) {
                cBoard.cleNb(idx, true);
                await wait(waitTime);
            }

            //param: {arr, color, ?radius, maxVCF, maxDepth, maxNode, ?nMaxDepth}
            //mode: BLOCK_MODE || AROUND_MODE
            //return Promise resolve: arr[225];
            async function _selectPoints(param, mode = AROUND_MODE) {
                return (await run(mode, param)) || new Array(225);
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //return Promise resolve: vcfWinMoves || []
            async function _findVCF(param) {
                let vInfo = (await run("findVCF", param)) || { winMoves: [] };
                return vInfo.winMoves[0] || [];
            }

            //param: {arr, color, vcfMoves, includeFour}
            //return Promise resolve: points[idx1, idx2, idx3...]
            async function _getBlockVCF(param) {
                return await run("getBlockVCF", param) || [];
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //return Promise resolve: levelBInfo
            async function _getLevelB(param) {
                return await run("getLevelB", param) || levelBInfo;
            }
            
            //param: {arr, color, moves}
            //return Promise resolve: isVCF
            async function isVCF(param) {
                return await run("isVCF", param);
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //return Promise resolve: vcfInfo
            async function findVCF(param) {
                return await run("findVCF", param) || vcfInfo;
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
                        param.arr[idx] = INVERT_COLOR[param.color];
                        ps.push(_findVCF(param).then(winMoves => 0 == winMoves.length && (result[idx] = idx)));
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

            //param: {arr, color, ?radius, maxVCF, maxDepth, maxNode}
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
                let iHtml = `解题<br>先手: ${COLOR_NAME[param.color]}<br>规则: 找VCF<br>结果:<br>`,
                    vcfInfo = await findVCF(param),
                    { tree, positionMoves, isPushPass, current } = createTree(param);

                if (vcfInfo.winMoves.length) {
                    vcfInfo.winMoves.map(vcfMoves => {
                        tree.createPathVCF(current, vcfMoves);
                        iHtml += `[${movesToName(vcfMoves)}]<br>`;
                    });
                }
                else {
                    iHtml += `没有VCF<br>`;
                }
                tree.createPath(positionMoves).comment = iHtml;
                tree.init.MS = getInitMoves(tree);
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
            //return Promise resolve: RenjuTree | undefined
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
                    tree.createPath(positionMoves).comment = `棋局已结束<br>`;
                    return tree;
                }
                else if (level >= LEVEL_NOFREEFOUR) {
                    let node = tree.newNode();
                    node.idx = fiveIdx;
                    node.boardText = "W";
                    current.addChild(node);
                    tree.createPath(positionMoves).comment = `${COLOR_NAME[param.color]} 可以五连<br>`;
                    return tree;
                }
                else if (level == LEVEL_VCF) {
                    tree.createPathVCF(current, levelBInfo.winMoves);
                    tree.init.MS = getInitMoves(tree);
                    tree.createPath(positionMoves).comment = `${COLOR_NAME[param.color]} 有杀<br>`;
                    return tree;
                }
                return undefined;
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode, ftype}
            //return Promise resolve: RenjuTree
            async function _createTreeLevelThree(param) {
                let { tree, positionMoves, isPushPass, current } = createTree(param),
                    filterArr = await _selectPoints(param, AROUND_MODE),
                    nodes = await getLevelThreeNodes(param, filterArr);

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
                let wTree = await createTreeWin(param);
                if (wTree) return wTree;

                let tree = await _createTreeLevelThree(param);
                return tree;
            }

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //return Promise resolve: RenjuTree
            async function createTreePointsVCT(param) {
                let wTree = await createTreeWin(param);
                if (wTree) return wTree;

                let tree = await _createTreeLevelThree(param);
                tree.mergeTree(createTreeFour(param));
                return tree;
            }

            //------------------------ VCT ----------------------

            //param: {arr, color, maxVCF, maxDepth, maxNode}
            //return {blkPoints: [idx1, idx2, idx3...], bestMove: [idx1, idx2, idx3...]}
            async function _getBlockVCT(param, tree, vctRoot) {
                let arr = param.arr,
                    color = param.color,
                    infoArr = getTestThreeInfo({ arr: arr, color: INVERT_COLOR[color] }),
                    markArr = new Array(225),
                    bestMove = new Array(225),
                    blkPoints = [],
                    moves = [],
                    stack = [],
                    idx = vctRoot.idx,
                    next = vctRoot.down;

                arr[idx] = color;
                markArr[idx] = idx;
                moves.push(idx);

                while (next) {
                    let back = true;
                    idx = next.idx
                    if (0 <= idx && idx < 225) {
                        let right = next.right,
                            down = next.down;
                        if (right) stack.push({ node: right, depth: moves.length })

                        arr[idx] = (moves.length & 1) ? INVERT_COLOR[color] : color;
                        markArr[idx] = idx;
                        moves.push(idx);

                        if (arr[idx] == INVERT_COLOR[color]) { // 搜索反防
                            const AND = INVERT_COLOR[color] == 1 && gameRules == RENJU_RULES ? FOUL_MAX : MAX;
                            for (let direction = 0; direction < 4; direction++) {
                                let lineInfoList = new Array(9);
                                testLinePointFour(idx, direction, arr[idx], arr, lineInfoList);
                                for (let j = 0; j < 9; j++) {
                                    if (FOUR_NOFREE == (AND & lineInfoList[j])) {
                                        let nIdx = moveIdx(idx, j - 4, direction);
                                        markArr[nIdx] = nIdx;
                                    }
                                }
                            }
                        }

                        if (down) {
                            next = down;
                            back = false;
                        }
                        else {
                            let level = getLevelPoint(idx, color, arr);
                            //console.log(`[${idxToName(idx)}], ${0xff & level}`)
                            if (LEVEL_CATCHFOUL > (0xff & level)) {
                                let path = positionToMoves(arr),
                                    pNodes = tree.getPositionNodes(path, 7, 0xffff),
                                    node = pNodes.find(node => node.down);
                                //console.log('aaaaa [idxToName(idx)], ${node}')
                                if (node) {
                                    next = node.down;
                                    back = false;
                                }
                            }
                            else {
                                arr[idx] = 0;
                                let bPoint = getBlockVCF(arr, color, [idx], true);
                                bPoint.map(idx => markArr[idx] = idx);
                                if (bestMove.length > moves.length) bestMove = moves.slice(0);
                            }
                        }
                    }
                    if (back) {
                        if (stack.length) {
                            let { node, depth } = stack.pop();
                            while (depth < moves.length) arr[moves.pop()] = 0;
                            next = node;
                        }
                        else next = undefined;
                    }
                }
                idx = moves[0];
                for (let i = moves.length - 1; i >= 0; i--) arr[moves.pop()] = 0;

                //add fourPoints
                infoArr.map((info, idx) => FOUR_NOFREE == (FOUL_MAX & info) && (markArr[idx] = idx))

                //add levelThreePoints
                param.color = INVERT_COLOR[color];
                let threePoints = await getLevelThreePoints(param);
                threePoints.map(idx => markArr[idx] = idx)
                param.color = color;

                blkPoints = markArr.filter(idx => (idx != undefined) && !(FOUL & infoArr[idx]));
                return { blkPoints, bestMove }
            }

            //param: {arr, color, ?radius, maxVCF, maxDepth, maxNode, maxVCT, maxDepthVCT, maxNodeVCT, ftype}
            //return Promise resolve: RenjuTree
            async function createTreeVCT(param) {
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
    
    //param {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: count
    async function _addBranchBlockSimpleWin(param, blkPoints, tree, current, moves) {
        param = copyParam(param);
        param.arr = param.arr.slice(0);
        moves = moves.slice(0);
        let ps = [],
            count = 0,
            done = false,
            isFour = FOUR_NOFREE == (FOUL_MAX & testPointFour(current.idx, param.color, param.arr));
        
        for (let i = blkPoints.length - 1; i >= 0; i--) {
            let idx = blkPoints[i],
                arr = param.arr,
                blkCur = tree.newNode(idx, DEFAULT_BOARD_TXT[INVERT_COLOR[param.color]]),
                nIsFour = isFour || FOUR_NOFREE == (FOUL_MAX & testPointFour(idx, INVERT_COLOR[param.color], arr));
                
            current.addChild(blkCur);
            arr[idx] = INVERT_COLOR[param.color];
            moves.push(idx);
            
            !nIsFour && (param.maxDepthVCT -= 2);
            ps.push(_addBranchSimpleWin(param, tree, blkCur, moves)
                .then(wNode => {
                    if (wNode) count++
                    else {
                        done = true;
                        blkCur.comment = `${COLOR_NAME[INVERT_COLOR[param.color]]} 防守:<br>[${idxToName(idx)}]<br>${COLOR_NAME[param.color]} 不能在 ${~~(param.maxDepthVCT / 2)} 手内取胜<br>`;
                    }
                })
            )
            !nIsFour && (param.maxDepthVCT += 2);
            
            moves.pop();
            arr[idx] = 0;
            if (ps.length == 1) {
                await Promise.all(ps);
                ps = [];
            }
            if (done) break;
        }
        ps.length && await Promise.all(ps);
        return count;
    }
    
    //return Promise resolve: winNode
    async function _addBranchSimpleVCT1(param, nodes, tree, current, moves) {
        let ps = [],
            winNode = undefined,
            done = false,
            arr = param.arr,
            color = param.color;
        for (let i = nodes.length - 1; i >= 0; i--) {
            let node = nodes[i],
                idx = node.idx,
                cur = tree.newNode(idx, DEFAULT_BOARD_TXT[color]),
                blkPoints;
            arr[idx] = color;
            moves.push(idx);
            current.addChild(cur);
                    
            if (node.winMoves) { //levelThreeNode
                blkPoints = getBlockVCF(arr, color, node.winMoves, true);
                cur.comment = `<br><br>${COLOR_NAME[color]} 做杀:<br>[${movesToName(node.winMoves)}]<br>${COLOR_NAME[INVERT_COLOR[color]]} 防点:<br>[${movesToName(blkPoints)}]<br>`;
                let { fourPoints, elsePoints } = filterBlockPoints(blkPoints, INVERT_COLOR[color], arr),
                    nParam = copyParam(param),
                    nMoves = moves.slice(0);
                nParam.arr = nParam.arr.slice(0);
                ps.push(_addBranchBlockSimpleWin(param, elsePoints, tree, cur, moves)
                    .then(ct => {
                        if (ct == elsePoints.length) {
                            return _addBranchBlockSimpleWin(nParam, fourPoints, tree, cur, nMoves)
                                .then(ct => {
                                    if (ct == fourPoints.length) {
                                        cur.boardText = "W";
                                        winNode = cur;
                                        done = true;
                                    }
                                })
                        }
                    })
                    .then(() => {
                        if (1 >= moves.length) {
                            if (canceling) current.removeChild(cur);
                            else cBoard.wLb(cur.idx, cur.boardText, "black");
                        }
                    })
                    .then(() => idx)
                )
            }
            else { //fourNode
                let bIdx = getBlockFourPoint(idx, arr, node.lineInfo);
                blkPoints = [bIdx];
                ps.push(_addBranchBlockSimpleWin(param, blkPoints, tree, cur, moves)
                    .then(ct => {
                        if (ct == blkPoints.length) {
                            cur.boardText = "W";
                            winNode = cur;
                            done = true;
                        }
                    })
                    .then(() => {
                        if (1 >= moves.length) {
                            if (canceling) current.removeChild(cur);
                            else cBoard.wLb(cur.idx, cur.boardText, "black");
                        }
                    })
                    .then(() => idx)
                )
            }
            moves.pop();
            arr[idx] = 0;
            moves.length == 0 && cBoard.printSearchPoint(idx, idx, "green");
            if (ps.length >= MAX_THREAD_NUM) {
                await Promise.race(ps)
                    .then(idx => moves.length == 0 && cBoard.cleSearchPoint(idx))
                await removeFinallyPromise(ps);
            }
            if (done) break;
        }
        ps.length && await Promise.all(ps);
        moves.length == 0 && cBoard.cleSearchPoint();
        return winNode;
    }
    
    //return Promise resolve: winNode
    async function _addBranchSimpleVCT(param, tree, current, moves) {
        let winNode = undefined,
            { fourNodes, threeNodes } = await getContinueNodes(param);
        winNode = winNode || await _addBranchSimpleVCT1(param, threeNodes, tree, current, moves);
        winNode = winNode || await _addBranchSimpleVCT1(param, fourNodes, tree, current, moves);
        return winNode;
    }
    
    //return Promise resolve: winNode
    async function _addBranchSimpleWin(param, tree, current, moves = []) {
        param = copyParam(param);
        param.arr = param.arr.slice(0);
        moves = moves.slice(0);
        let winNode = undefined,
            arr = param.arr,
            hasNode = await hasPositionNode(arr, tree),
            hasScore = hasNode && hasNode.score;
            
        if (hasScore == SCORE_RESOLVE) winNode = hasNode;
        else if (hasScore == SCORE_REJECT) winNode = undefined;
        else if (param.maxDepthVCT >= 0) {
            current.score = SCORE_WAIT;
            winNode = winNode || await _addBranchVCF(param, tree, current, moves);
            if (param.maxDepthVCT >= 2) {
                winNode = winNode || await _addBranchSimpleVCT(param, tree, current, moves);
            }
        }
        winNode && (current.boardText = "L");
        current.score = winNode ? SCORE_RESOLVE : SCORE_REJECT;
        return winNode;
    }
    
    //param: {arr, color, maxVCF, maxDepth, maxNode, maxVCT, maxDepthVCT, maxNodeVCT}
    //return Promise resolve: RenjuTree
    async function createTreeSimpleWin(param) {
        let wTree = await createTreeWin(param);
        if (wTree) return wTree;
        
        let { tree, positionMoves, isPushPass, current } = createTree(param),
            winNode = await _addBranchSimpleWin(param, tree, current);
        
        tree.createPath(positionMoves).comment = `解题<br>先手: ${COLOR_NAME[param.color]}<br>规则: 坂田三手胜<br>.先手方要在三手内取胜<br>.最后的VCF算一手棋<br>.被动防冲四不增加手数<br>-----点击棋盘查看计算结果-----<br>`;
        
        return tree;
    }
    
    //------------------------ DoubleVCF ----------------------

    //return Promise resolve: isDoubleVCF
    async function _addBranchIsDoubleVCF3(param, tree, current, depth = 0) {
        param = copyParam(param);
        param.arr = param.arr.slice(0);
        
        let idx = current.idx,
            isDoubleVCF = false,
            winMoves = await _findVCF(param);
        if (winMoves.length) {
            current.comment = `<br><br>${COLOR_NAME[INVERT_COLOR[param.color]]} 防 ${idxToName(idx)} 不成立<br> ${COLOR_NAME[param.color]} 还有 VCF:<br> [${movesToName(winMoves)}]<br>`;
            tree.createPathVCF(current, winMoves);
            isDoubleVCF = true;
        }
        else {
            let lineInfo = testPointFour(idx, INVERT_COLOR[param.color], param.arr);
            if (FOUR_NOFREE == (FOUL_MAX & lineInfo)) {
                let bIdx = getBlockFourPoint(idx, param.arr, lineInfo),
                    cur = tree.newNode(bIdx, DEFAULT_BOARD_TXT[param.color]);
                param.arr[bIdx] = param.color;
                current.addChild(cur);
                current.comment = `<br><br>${COLOR_NAME[INVERT_COLOR[param.color]]} 先手防于 ${idxToName(idx)}<br>`;
                let wMoves = await _findVCF(param);
                if (wMoves.length) {
                    let bPoints = getBlockVCF(param.arr, param.color, wMoves, true);
                    cur.comment = `<br><br>${COLOR_NAME[param.color]} 挡四后有 VCF:<br>[${movesToName(wMoves)}]<br>${COLOR_NAME[INVERT_COLOR[param.color]]}防点:<br>[${movesToName(bPoints)}]<br>`;
                    isDoubleVCF = await _addBranchIsDoubleVCF(param, bPoints, tree, cur, depth + 1);
                }
                else{
                    cur.comment = `<br><br>${COLOR_NAME[param.color]} 挡四后无 VCF<br>`;
                    isDoubleVCF = false
                }
            }
            else{
                current.comment = `<br><br>${COLOR_NAME[INVERT_COLOR[param.color]]} 防 ${idxToName(idx)}<br>${COLOR_NAME[param.color]} 没有 VCF，防点成立<br>`;
                isDoubleVCF = false
            }
        }
        isDoubleVCF && (current.boardText = "L");
        return isDoubleVCF;
    }
    
    //return Promise resolve: count
    async function _addBranchIsDoubleVCF2(param, blkPoints, tree, current, depth = 0) {
        let ps = [],
            count = 0,
            done = false;
        for (let i = blkPoints.length - 1; i >= 0; i--) {
            let idx = blkPoints[i],
                arr = param.arr,
                cur = tree.newNode(idx, DEFAULT_BOARD_TXT[INVERT_COLOR[param.color]]);
            arr[idx] = INVERT_COLOR[param.color];
            current.addChild(cur);
            ps.push(_addBranchIsDoubleVCF3(param, tree, cur, depth)
                .then(wNode => {
                    if (wNode) count++;
                    else if (depth) done = true;
                })
            );
            arr[idx] = 0;
            if (ps.length >= MAX_THREAD_NUM) {
                await Promise.race(ps);
                await removeFinallyPromise(ps);
            }
            if (done) break;
        }
        ps.length && await Promise.all(ps);
        return count;
    }
    
    //param: {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: isDoubleVCF
    async function _addBranchIsDoubleVCF(param, blkPoints, tree, current, depth = 0) {
        param = copyParam(param);
        param.arr = param.arr.slice(0);
        let count = 0,
            hasScore = await hasPositionScore(param.arr, tree);
        
        if (hasScore == SCORE_RESOLVE) count = blkPoints.length;
        else if (hasScore == SCORE_REJECT) count = 0;
        else {
            current.score = SCORE_WAIT;
            let {fourPoints, elsePoints} = filterBlockPoints(blkPoints, INVERT_COLOR[param.color], param.arr);
            count += await _addBranchIsDoubleVCF2(param, elsePoints, tree, current, depth);
            if (count == elsePoints.length) count += await _addBranchIsDoubleVCF2(param, fourPoints, tree, current, depth);
        }
        
        if (count == blkPoints.length) {
            current.score = SCORE_RESOLVE;
            current.boardText = "W";
            return true;
        }
        else {
            current.score = SCORE_REJECT;
            return false;
        }
    }
    
    //param {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: RenjuTree
    async function createTreeBlockVCF(param) {
        param.color = INVERT_COLOR[param.color];
        let wTree = await createTreeWin(param, LEVEL_NOFREEFOUR);
        if (wTree) return wTree;
        
        let iHtml = `解题<br>先手: ${COLOR_NAME[INVERT_COLOR[param.color]]}<br>规则: 找VCF防点<br>结果:<br>`,
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
                    cur.comment = `<br><br>${COLOR_NAME[param.color]} VCF:<br>[${movesToName(vcfInfo.winMoves[0])}]<br>已经不成立<br>`;
                })
            }
            else {
                await _addBranchIsDoubleVCF(param, blkPoints, tree, current);
            }
                
            iHtml += `${COLOR_NAME[INVERT_COLOR[param.color]]}防点:<br>`;
            iHtml += `[${movesToName(blkPoints)}]<br>${param.blkDepth > 1 ? "***找到成立的直接防点，不会算先手防***" : ""}<br>-----点击棋盘查看计算结果-----<br>`;
        }
        else {
            iHtml += `${COLOR_NAME[param.color]} 没有找到 VCF<br>`;
        }
        tree.createPath(positionMoves).comment = iHtml;
        return tree;
    }
    
    //param {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: RenjuTree
    async function createTreeDoubleVCF(param) {
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
                        cur.comment = `<br><br>${COLOR_NAME[param.color]} 做杀:<br>[${movesToName(node.winMoves)}]<br>${COLOR_NAME[INVERT_COLOR[param.color]]} 防点:<br>[${movesToName(blkPoints)}]<br>双杀 ${isDoubleVCF?"成立":"不成立"}<br>`;
                        if (canceling) current.removeChild(cur);
                        else cBoard.wLb(cur.idx, cur.boardText, "black");
                    })
                    .then(() => idx)
                )
                cBoard.printSearchPoint(idx, idx, "green");
                if (ps.length >= MAX_THREAD_NUM) {
                    await Promise.race(ps)
                        .then(idx => cBoard.cleSearchPoint(idx))
                    await removeFinallyPromise(ps);
                }
            }
        }
        await Promise.all(ps);
        tree.createPath(positionMoves).comment = `解题<br>先手: ${COLOR_NAME[param.color]}<br>规则: 茶馆双杀点<br>. 双杀点不包括直接活三点<br>-----点击棋盘查看计算结果-----<br>`;
        return tree;
    }
    
    //------------------------ isFoul ----------------------
    
    //return isFoul: [FOUL, FIVE, 0]
    function _addBranchIsFoul(idx, arr, tree, current, depth = 0) {
        let ov = arr[idx],
            rt = 0,
            fiveCount = 0,
            foulCount = 0,
            fourCount = 0,
            threeCount = 0,
            lineInfos = [],
            iHtml = `<br><br>判断 ${idxToName(idx)} 是否为禁手......<br>`,
            pCur = 0 == depth ? current : current.getChild(225),
            bCur = tree.newNode(idx, DEFAULT_BOARD_TXT[1]);
        
        if (!pCur) {
            pCur = tree.newNode(225);
            current.addChild(pCur);
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
                iHtml += `判断 ${dirName}是否为活三......<br>`;
                if (len) {
                    arr[ps[1]] = 1;
                    pointInfo = _addBranchIsFoul(ps[1], arr, tree, bCur, depth+1);
                    arr[ps[1]] = 0;
                    if (!pointInfo) {
                        iHtml += `[${idxToName(ps[1])}] 是活四点 ${dirName}是活三<br>`;
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
                        iHtml += `[${idxToName(ps[2])}] 是活四点 ${dirName}是活三<br>`;
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
        let { tree, positionMoves, isPushPass, current} = createTree(param, 1),
            infoArr = getTestThreeInfo(param);
        tree.createPath(positionMoves).comment = `解题<br>先手: ${COLOR_NAME[param.color]}<br>规则: 全盘禁手分析<br>-----点击棋盘查看计算结果-----<br>`;
        for (let idx = 0; idx < 225; idx++) {
            let fmf = infoArr[idx] & FOUL_MAX_FREE;
            if (fmf >= THREE_FREE) {
                _addBranchIsFoul(idx, param.arr, tree, current);
            }
        }
        return tree;
    }
    
    //param: {arr, color, maxVCF, maxDepth, maxNode}
    //return catchFoulArray[[idx1],[idx2],[idx3]...]
    function getCatchFoulArray(param) {
        param.color = 2;
        let infoArr = getTestFourInfo(param),
            arr = param.arr,
            catchFoulArray = [];
        infoArr.map((info, idx) => {
            if (FOUR_NOFREE == (FOUL_MAX_FREE & info)) {
                arr[idx] = 2;
                let lvl = getLevelPoint(idx, 2, arr);
                if (LEVEL_CATCHFOUL == (lvl & 0xff)) catchFoulArray.push({winMoves: [idx], foulIdx: lvl >> 8 & 0xff});
                arr[idx] = 0;
            }
        })
        return catchFoulArray;
    }
    
    function _addBranchCatchFoul(idx, foulIdx, arr, tree, current) {
        if (0 == arr[idx] && 0 == arr[foulIdx]) {
            let cur = tree.newNode(idx, DEFAULT_BOARD_TXT[2]);
            current.addChild(cur);
            arr[idx] = 2;
            _addBranchIsFoul(foulIdx, arr, tree, cur, 0);
            arr[idx] = 0;
        }
    }
    
    function _addBranchBlockCatchFoul(catchFoulArray, arr, tree, current) {
        let markArr = new Array(225).fill(0),
            blkPoints = [];
        catchFoulArray.map(catchFoul => {
            let bPoints = getBlockVCF(arr, 2, catchFoul.winMoves);
            bPoints.map(idx => markArr[idx]++)
        })
        markArr.map((v, idx) => v == catchFoulArray.length && blkPoints.push(idx))
        blkPoints.map(bIdx => {
            let cur = tree.newNode(bIdx, DEFAULT_BOARD_TXT[1]);
            current.addChild(cur);
            arr[bIdx] = 1;
            catchFoulArray.map(catchFoul => {
                _addBranchCatchFoul(catchFoul.winMoves[0], catchFoul.foulIdx, arr, tree, cur)
            })
            arr[bIdx] = 0;
        })
        if (catchFoulArray.length == 1) {
            let charList = new Array(225),
                idx = catchFoulArray[0].winMoves[0],
                foulIdx = catchFoulArray[0].foulIdx;
            charList[idx] = "A";
            charList[foulIdx] = "B";
            arr[idx] = 2;
            for (let direction = 0; direction < 4; direction++) {
                let lineInfo = testLineThree(foulIdx, direction, 1, arr);
                if (FOUR_NOFREE == (FOUL_MAX & lineInfo) || LINE_DOUBLE_FOUR == (FOUL_MAX_FREE & lineInfo)) {
                    for (let abs = -1; abs < 2; abs += 2) {
                        for (let move = 1; move < 6; move++) {
                            let mIdx = moveIdx(foulIdx, move * abs, direction);
                            if (mIdx < 0 || mIdx > 224 || arr[mIdx] == 2) break;
                            if(arr[mIdx]) continue;
                            arr[mIdx] = 1;
                            let info = FOUL_MAX & testLineThree(foulIdx, direction, 1, arr);
                            (FOUR_NOFREE != info) && (charList[mIdx] = EMOJI_FORK);
                            arr[mIdx] = 0;
                        }
                    }
                }
                else if (THREE_FREE == (FOUL_MAX_FREE & lineInfo)) {
                    for (let abs = -1; abs < 2; abs += 2) {
                        for (let move = 1; move < 6; move++) {
                            let mIdx = moveIdx(foulIdx, move * abs, direction);
                            if (mIdx < 0 || mIdx > 224 || arr[mIdx] == 2) break;
                            if(arr[mIdx]) continue;
                            arr[mIdx] = 1;
                            let info = testLineThree(foulIdx, direction, 1, arr);
                            if (FOUR_NOFREE == (FOUL_MAX & info)) charList[mIdx] = EMOJI_SQUARE_BLACK;
                            else if(THREE_FREE != (FOUL_MAX_FREE & info)) charList[mIdx] = EMOJI_FORK;
                            arr[mIdx] = 0;
                        }
                    }
                }
            }
            arr[idx] = 0;
            blkPoints.map(bIdx => {
                current.getChild(bIdx).boardText = charList[bIdx] || EMOJI_ROUND_DOUBLE;
            })
        }
        return blkPoints;
    }
    
    function isCatchFoul(catchFoul, arr) {
        let isCatch = false,
            idx = catchFoul.winMoves[0],
            foulIdx =catchFoul.foulIdx;
        arr[idx] = 2;
        isCatch = isFoul(foulIdx, arr);
        arr[idx] = 0;
        return isCatch;
    }
    
    async function _addBranchContinueBlockFoul(catchFoulArray, markArr, arr, tree, current, depth = 0) {
        let isBlock = false,
            fourNodes = getNodesFour({arr: arr, color: 1, ftype: FIND_ALL}),
            ctnInfo = [];
        
        await wait(0);
        if (canceling) return false;
        
        for (let i = fourNodes.length - 1; i >= 0; i--) {
            let info = fourNodes[i].lineInfo,
                idx = fourNodes[i].idx,
                isBlk = false,
                done = false;
            arr[idx] = 1;
            
            0 == depth && cBoard.printSearchPoint(0, idx, "green");
            let hasScore = await hasPositionScore(arr, tree);
            if (hasScore == SCORE_RESOLVE) (isBlk = true, done = true)
            else if (hasScore == SCORE_REJECT) (isBlk = false, done = true)
            
            if (!done) {
                let hasCatch = false,
                    isCatch = false,
                    cur = tree.newNode(idx, "先"),
                    bIdx = getBlockFourPoint(idx, arr, info);
                current.addChild(cur);
                for (let j = catchFoulArray.length - 1; j >= 0; j--) {
                    let catchFoul = catchFoulArray[j];
                    if (isCatchFoul(catchFoul, arr)) {
                        hasCatch = true;
                        isCatch = isCatch || catchFoul.winMoves[0] == bIdx;
                        break;
                    }
                }
                if (!hasCatch) {
                    if (depth) {
                        if (!markArr[idx] || markArr[idx] > 1) {
                            cur.boardText = "新";
                            cur.comment = "先手冲四解禁点";
                            !markArr[idx] && (markArr[idx] = depth + 1);
                            isBlk = true;
                        }
                    }
                    else {
                        markArr[idx] = depth + 1;
                        isBlk = true;
                    }
                    (!isBlk) && (cur.score = SCORE_REJECT);
                }
                else if(isCatch) {
                    cur.score = SCORE_REJECT;
                }
                else {
                    let bCur = tree.newNode(bIdx, DEFAULT_BOARD_TXT[2]),
                        bPoints = [];
                    cur.addChild(bCur);
                    arr[bIdx] = 2;
                    bPoints = _addBranchBlockCatchFoul(catchFoulArray, arr, tree, bCur);
                    for (let j = bPoints.length - 1; j >= 0; j--) {
                        let blkIdx = bPoints[j];
                        if (!markArr[blkIdx] || markArr[blkIdx] > 1) {
                            let nCur = bCur.getChild(blkIdx);
                            nCur.boardText = "新";
                            nCur.comment = "先手增加解禁点";
                            !markArr[blkIdx] && (markArr[blkIdx] = depth + 1);
                            isBlk = true;
                        }
                    }
                    if (!isBlk) ctnInfo.push({idx: idx, bIdx: bIdx, cur: cur, bCur: bCur});
                    arr[bIdx] = 0;
                }
                isBlk && (cur.score = SCORE_RESOLVE);
            }
            isBlock = isBlock || isBlk;
            arr[idx] = 0;
        }
        
        for (let i = ctnInfo.length - 1; i >= 0; i--) {
            let info = ctnInfo[i];
            arr[info.idx] = 1;
            arr[info.bIdx] = 2;
            0 == depth && cBoard.printSearchPoint(0, info.idx, "green");
            let isBlk = await _addBranchContinueBlockFoul(catchFoulArray, markArr, arr, tree, info.bCur, depth + 1);
            info.cur.score = isBlk ? SCORE_RESOLVE : SCORE_REJECT;
            isBlock = isBlock || isBlk;
            arr[info.idx] = 0;
            arr[info.bIdx] = 0;
        }
        
        if (0 == depth) {
            cBoard.cleSearchPoint();
            current.map(cur => {
                let nodes = cur.getChilds();
                nodes.map(node => {
                    if (SCORE_REJECT == node.score) cur.removeChild(node);
                })
            })
        }
        
        return isBlock;
    }
    
    //param: {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: RenjuTree
    async function createTreeBlockCatchFoul(param) {
        let wTree = await createTreeWin(param);
        if (wTree) return wTree;
        
        let { tree, positionMoves, isPushPass, current} = createTree(param, 1),
            infoArr = getTestThreeInfo(param),
            catchFoulArray = getCatchFoulArray(param),
            markArr = new Array(225),
            iHtml = `解题<br>先手: ${COLOR_NAME[1]}<br>规则: 针对白棋冲四抓禁，分类解禁<br>.直接防点: A, B<br>.反防点: ${EMOJI_SQUARE_BLACK}<br>.六腐防点: ${EMOJI_FORK}<br>.多层禁手防点: ${EMOJI_ROUND_DOUBLE}<br>.双抓共防点: ${EMOJI_ROUND_BLACK}<br>.先手防点: 先<br>.先手增加防点: 新<br>`;
        
        if (catchFoulArray.length) {
            let bPoints = _addBranchBlockCatchFoul(catchFoulArray, param.arr, tree, current);
            bPoints.map(idx => markArr[idx] = 1);
            await _addBranchContinueBlockFoul(catchFoulArray, markArr, param.arr, tree, current);
            
            iHtml += `<br>找到冲四抓禁:<br>${catchFoulArray.map(catchFoul => `冲 [${idxToName(catchFoul.winMoves[0])}] 抓 [${idxToName(catchFoul.foulIdx)}]<br>`)}`;
        }
        else {
            iHtml = `<br><br>没有找到冲四抓禁<br>`;
        }
        tree.createPath(positionMoves).comment = iHtml;
        return tree;
    }
    
    //------------------------ NumberWin ----------------------
    
    //param {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: count
    async function _addBranchBlockNumberWin(param, blkPoints, tree, current, moves) {
        param = copyParam(param);
        param.arr = param.arr.slice(0);
        moves = moves.slice(0);
        let ps = [],
            count = 0,
            done = false;
        
        for (let i = blkPoints.length - 1; i >= 0; i--) {
            let idx = blkPoints[i],
                arr = param.arr,
                blkCur = tree.newNode(idx, DEFAULT_BOARD_TXT[INVERT_COLOR[param.color]]);
        
            current.addChild(blkCur);
            arr[idx] = INVERT_COLOR[param.color];
            moves.push(idx);
            ps.push(_addBranchNumberWin(param, tree, blkCur, moves)
                .then(wNode => {
                    if (wNode) count++
                    else {
                        done = true;
                        blkCur.comment = `${COLOR_NAME[INVERT_COLOR[param.color]]} 防守:<br>[${idxToName(idx)}]<br>${COLOR_NAME[param.color]} 不能在 ${~~(param.maxDepth / 2) + 2} 手内五连<br>`;
                    }
                })
            )
            moves.pop();
            arr[idx] = 0;
            if (ps.length == 1) {
                await Promise.all(ps);
                ps = [];
            }
            if (done) break;
        }
        ps.length && await Promise.all(ps);
        return count;
    }
    
    //return Promise resolve: winNode
    async function _addBranchVCF(param, tree, current, moves) {
        let winNode = undefined,
            vcfMoves = await _findVCF(param);
        if (vcfMoves.length) {
            tree.createPathVCF(current, vcfMoves);
            winNode = current.getChild(vcfMoves[0]);
        }
        return winNode;
    }
    
    //return Promise resolve: winNode
    async function _addBranchNumberVCT1(param, nodes, tree, current, moves) {
        let ps = [],
            winNode = undefined,
            done = false,
            arr = param.arr,
            color = param.color;
        for (let i = nodes.length - 1; i >= 0; i--) {
            let node = nodes[i],
                idx = node.idx,
                cur = tree.newNode(idx, DEFAULT_BOARD_TXT[color]),
                blkPoints;
            arr[idx] = color;
            moves.push(idx);
            current.addChild(cur);
                    
            if (node.winMoves) { //levelThreeNode
                blkPoints = getBlockVCF(arr, color, node.winMoves, true);
                cur.comment = `<br><br>${COLOR_NAME[color]} 做杀:<br>[${movesToName(node.winMoves)}]<br>${COLOR_NAME[INVERT_COLOR[color]]} 防点:<br>[${movesToName(blkPoints)}]<br>`;
                let { fourPoints, elsePoints } = filterBlockPoints(blkPoints, INVERT_COLOR[color], arr),
                    nParam = copyParam(param),
                    nMoves = moves.slice(0);
                nParam.arr = nParam.arr.slice(0);
                ps.push(_addBranchBlockNumberWin(param, elsePoints, tree, cur, moves)
                    .then(ct => {
                        if (ct == elsePoints.length) {
                            return _addBranchBlockNumberWin(nParam, fourPoints, tree, cur, nMoves)
                                .then(ct => {
                                    if (ct == fourPoints.length) {
                                        cur.boardText = "W";
                                        winNode = cur;
                                        done = moves.length > 1;
                                    }
                                })
                        }
                    })
                    .then(() => {
                        if (1 >= moves.length) {
                            if (canceling) current.removeChild(cur);
                            else cBoard.wLb(cur.idx, cur.boardText, "black");
                        }
                    })
                    .then(() => idx)
                )
            }
            else { //fourNode
                let bIdx = getBlockFourPoint(idx, arr, node.lineInfo);
                blkPoints = [bIdx];
                ps.push(_addBranchBlockNumberWin(param, blkPoints, tree, cur, moves)
                    .then(ct => {
                        if (ct == blkPoints.length) {
                            cur.boardText = "W";
                            winNode = cur;
                            done = moves.length > 1;
                        }
                    })
                    .then(() => {
                        if (1 >= moves.length) {
                            if (canceling) current.removeChild(cur);
                            else cBoard.wLb(cur.idx, cur.boardText, "black");
                        }
                    })
                    .then(() => idx)
                )
            }
            moves.pop();
            arr[idx] = 0;
            moves.length == 0 && cBoard.printSearchPoint(idx, idx, "green");
            if (ps.length >= MAX_THREAD_NUM) {
                await Promise.race(ps)
                    .then(idx => moves.length == 0 && cBoard.cleSearchPoint(idx))
                await removeFinallyPromise(ps);
            }
            if (done) break;
        }
        ps.length && await Promise.all(ps);
        moves.length == 0 && cBoard.cleSearchPoint();
        return winNode;
    }
    
    //return Promise resolve: winNode
    async function _addBranchNumberVCT(param, tree, current, moves) {
        param.maxDepth -= 2;
        let winNode = undefined,
            { fourNodes, threeNodes } = await getContinueNodes(param);
        winNode = winNode || await _addBranchNumberVCT1(param, threeNodes, tree, current, moves);
        winNode = winNode || await _addBranchNumberVCT1(param, fourNodes, tree, current, moves);
        param.maxDepth += 2;
        return winNode;
    }
    
    //return Promise resolve: winNode
    async function _addBranchVC2_1(param, nodes, tree, current, moves) {
        let ps = [],
            winNode = undefined,
            done = false,
            arr = param.arr,
            color = param.color;
        for (let i = nodes.length - 1; i >= 0; i--) {
            let node = nodes[i],
                idx = node.idx,
                cur = tree.newNode(idx, DEFAULT_BOARD_TXT[color]),
                blkPoints = node.blkPoints;
            arr[idx] = color;
            moves.push(idx);
            current.addChild(cur);
            cur.comment = `<br><br>${COLOR_NAME[color]} 做VCT:<br>[${movesToName(node.bestMove)}]<br>${COLOR_NAME[INVERT_COLOR[color]]} 防点:<br>[${movesToName(blkPoints)}]<br>`;
                
            let { fourPoints, elsePoints } = filterBlockPoints(blkPoints, INVERT_COLOR[color], arr),
                nParam = copyParam(param),
                nMoves = moves.slice(0);
            nParam.arr = nParam.arr.slice(0);
            ps.push(_addBranchBlockNumberWin(param, elsePoints, tree, cur, moves)
                .then(ct => {
                    if (ct == elsePoints.length) {
                        return _addBranchBlockNumberWin(nParam, fourPoints, tree, cur, nMoves)
                            .then(ct => {
                                if (ct == fourPoints.length) {
                                    cur.boardText = "W";
                                    winNode = cur;
                                    done = true;
                                }
                            })
                    }
                })
                .then(() => {
                    if (1 >= moves.length) {
                        if (canceling) current.removeChild(cur);
                        else cBoard.wLb(cur.idx, cur.boardText, "black");
                    }
                })
            )
            
            moves.pop();
            arr[idx] = 0;
            moves.length == 0 && cBoard.printSearchPoint(ps.length, idx, "green");
            if (ps.length == MAX_THREAD_NUM) {
                await Promise.all(ps);
                ps = [];
            }
            if (done) break;
        }
        ps.length && await Promise.all(ps);
        moves.length == 0 && cBoard.cleSearchPoint();
        return winNode;
    }
    
    //return Promise resolve: VCFNodes || []
    async function getVC2Node(param, filterNodes) {
        let { tree, positionMoves, isPushPass, current} = createTree(param),
            ps = [],
            moves = [],
            vc2Nodes = [];
        for (let i = filterNodes.length - 1; i >= 0; i--) {
            let idx = filterNodes[i].idx,
                cur = tree.newNode(idx),
                pCur = tree.newNode(225);
            param.arr[idx] = param.color;
            moves.push(idx, 225);
            current.addChild(cur);
            cur.addChild(pCur);
            let nParam = copyParam(param);
            nParam.arr = nParam.arr.slice(0);
            ps.push(_addBranchNumberWin(param, tree, pCur, moves)
                    .then(async (wNode) => {
                        if (wNode) {
                            let {bestMove, blkPoints} =  await _getBlockVCT(nParam, tree, wNode);
                            filterNodes[i].bestMove = bestMove;
                            filterNodes[i].blkPoints = blkPoints;
                            vc2Nodes.push(filterNodes[i])
                        }
                    })
                    .then(() => idx)
            )
            moves.length -= 2;
            param.arr[idx] = 0;
            moves.length == 0 && cBoard.printSearchPoint(idx, idx, "green");
            if (ps.length >= MAX_THREAD_NUM) {
                await Promise.race(ps)
                    .then(idx => moves.length == 0 && cBoard.cleSearchPoint(idx))
                await removeFinallyPromise(ps);
            }
        }
        ps.length && await Promise.all(ps);
        moves.length == 0 && cBoard.cleSearchPoint();
        //vc2Nodes.map(node => {
            //(idxToName(node.idx) == "G9" || idxToName(node.idx) =="F8") && console.log(`[${idxToName(node.idx)}], blkP: [${movesToName(node.blkPoints)}]`)
        //})
        return vc2Nodes;
    }
    
    //return Promise resolve: winNode
    async function _addBranchVCT2(param, tree, current, moves) {
        param.maxDepth -= 2;
        let winNode = undefined,
            {twoNodes} = await getContinueNodes(param),
            vc2Nodes = await getVC2Node(param, twoNodes);
        //console.log(`vc2Nodes: [${movesToName(vc2Nodes.map(node => node.idx))}]`)
        winNode = winNode || await _addBranchVC2_1(param, vc2Nodes, tree, current, moves);
        param.maxDepth += 2;
        return winNode;
    }
    
    //param {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: winNode
    async function _addBranchNumberWin(param, tree, current, moves = []) {
        param = copyParam(param);
        param.arr = param.arr.slice(0);
        moves = moves.slice(0);
        let winNode = undefined,
            arr = param.arr,
            hasNode = await hasPositionNode(arr, tree),
            hasScore = hasNode && hasNode.score;
            
        if (hasScore == SCORE_RESOLVE) winNode = hasNode;
        else if (hasScore == SCORE_REJECT) winNode = undefined;
        else if (param.maxDepth >= 0) {
            current.score = SCORE_WAIT;
            winNode = winNode || await _addBranchVCF(param, tree, current, moves);
            if (param.maxDepth >= 2) {
                winNode = winNode || await _addBranchNumberVCT(param, tree, current, moves);
                if (0 == moves.length && param.maxDepth >= 4) {
                    winNode = winNode || await _addBranchVCT2(param, tree, current, moves);
                }
            }
        }
        winNode && (current.boardText = "L");
        current.score = winNode ? SCORE_RESOLVE : SCORE_REJECT;
        return winNode;
    }
    
    //param {arr, color, maxVCF, maxDepth, maxNode}
    //return Promise resolve: RenjuTree
    async function createTreeNumberWin(param) {
        let wTree = await createTreeWin(param, LEVEL_FREEFOUR);
        if (wTree) return wTree;
        
        let { tree, positionMoves, isPushPass, current} = createTree(param),
            winNode = await _addBranchNumberWin(param, tree, current);
        
        tree.createPath(positionMoves).comment = `解题<br>先手: ${COLOR_NAME[param.color]}<br>规则: ${["零","一","二","三","四","五","六","七"][(param.maxDepth + 3) / 2]}手五连<br>.${{1: "黑白", 2: "白黑"}[param.color]}双方依次落子<br>.${COLOR_NAME[param.color]}只有 ${["0","1","2","3","4","5","6","7"][(param.maxDepth + 3) / 2]} 次落子机会<br>.${COLOR_NAME[param.color]}必须在落子机会内完成五连<br>-----点击棋盘查看计算结果-----<br>`;
        
        return tree;
    }

    //------------------------ exports ----------------------
    async function exe(param, callback) {
        try {
            cBoard.cleLb("all");
            //loopWaitThreadList();
            let result =  await callback(param);
            //stopWaitThreadList();
            cBoard.cleSearchPoint();
            return result;
        }
        catch(err) {
            console.log(err.stack);
        }
    }
    return {
        // const //
        MAX_THREAD_NUM: MAX_THREAD_NUM,
        // function //
        setGameRules: _setGameRules,
        waitFreeThread: waitFreeThread,
        stopWaitThreadList: stopWaitThreadList,
        loopWaitThreadList: loopWaitThreadList,
        cancel: cancel,
        // async function //
        wait: wait,
        removeFinallyPromise: removeFinallyPromise,
        isVCF: async (param) => isVCF(copyParam(param)),
        findVCF: async (param) => findVCF(copyParam(param)),
        createTreeVCF: async (param) => exe(param, createTreeVCF),
        createTreeFive: async (param) => exe(param, createTreeFive),
        createTreeFour: async (param) => exe(param, createTreeFour),
        createTreeThree: async (param) => exe(param, createTreeThree),
        createTreePointsVCT: async (param) => exe(param, createTreePointsVCT),
        createTreeLevelThree: async (param) => exe(param, createTreeLevelThree),
        createTreeBlockVCF: async (param) => exe(param, createTreeBlockVCF),
        createTreeDoubleVCF: async (param) => exe(param, createTreeDoubleVCF),
        createTreeTestFoul: async (param) => exe(param, createTreeTestFoul),
        createTreeNumberWin: async (param) => exe(param, createTreeNumberWin),
        createTreeBlockCatchFoul: async (param) => exe(param, createTreeBlockCatchFoul),
        createTreeSimpleWin: async (param) => exe(param, createTreeSimpleWin),
        // test function //
        excludeBlockVCF: excludeBlockVCF,
        getBlockPoints: getBlockPoints,
        createTreeVCT: createTreeVCT,
        getBlockVCF: _getBlockVCF,
        getLevelB: _getLevelB,
        _findVCF: _findVCF,
        _nextMoves: _nextMoves,
        _addBranchIsFoul: _addBranchIsFoul,
        getLevelThreeNodes: getLevelThreeNodes,
        getLevelThreePoints: getLevelThreePoints,
        getPointsVCT: getPointsVCT
    };
})();
