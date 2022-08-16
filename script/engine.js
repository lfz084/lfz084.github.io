if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["engine"] = "v2015.01";
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

    const COLOR_NAME = { "-1": "出界", 0: "空格", 1: "黑棋", 2: "白棋" };
    const COMMAND = {
        log: function(param) { log(param, "log") },
        info: function(param) { log(param, "info") },
        error: function(param) { log(param, "error") },
        warn: function(param) { log(param, "warn") },
        moves: function(param) { cBoard.printMoves(param.moves, param.firstColor) },
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
        this.reject(this.result);
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
        constructor(url) {
            this.url = url;
            this.isLock = false;
            this.init();
        }
    }

    Thread.prototype.init = function() {
        this.isBusy = false;
        this.resolve = function() {};
        this.reject = function() {};
        this.result = undefined;
        this.work = new Worker(this.url);
        if (this.work) this.run({ cmd: "setGameRules", param: { rules: gameRules } })
        else throw new Error(`createThread Error: work = ${this.work}`)
    }

    Thread.prototype.reset = function() {
        log("Thread Reset", "warn");
        if (this.work) this.work.terminate();
        this.init();
    }

    Thread.prototype.run = function({ cmd, param }) {
        return new Promise((resolve, reject) => {
            if (this.isBusy) { reject(new Error("Thread is busy")); return };
            this.isBusy = true;
            this.resolve = resolve;
            this.reject = reject;
            this.onmessage = onmessage;
            this.onerror = onerror;
            this.postMessage({ cmd: cmd, param: param });
        });
    }

    Thread.prototype.cancel = function(param) {
        return new Promise((resolve) => {
            this.reject(this.result);
            this.reset();
            resolve();
        });
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

    for (let i = 0; i < MAX_THREAD_NUM; i++) THREADS[i] = new Thread("./script/worker.js");

    function getFreeThread(threads = THREADS) {
        return new Promise((resolve, reject) => {
            let timer = setInterval(() => {
                for (let i = threads.length - 1; i >= 0; i--) {
                    if (!threads[i].isBusy) {
                        clearInterval(timer);
                        resolve(threads[i]);
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
        log(param, "log");
        thread = thread || await getFreeThread();
        return thread.run({ cmd: cmd, param: param });
    }

    function reset() {
        return Promise.all(THREADS.map(thread => thread.cancel()));
    }

    function cancel() {
        return new Promise((resolve, reject) => {
            if (canceling) resolve();
            canceling = true;
            let count = 0,
                timer = setInterval(() => {
                    count = THREADS.find(thread => thread.isBusy) ? 0 : count + 1;
                    console.log(count)
                    if (count > 10) {
                        clearInterval(timer);
                        canceling = false;
                        console.log("engine.cancel", "warn")
                    }
                    else resolve()
                }, 100)
        })
    }

    //------------------------ Evaluator -------------------

    const DEFAULT_BOARD_TXT = ["", "●", "○", "◐"];
    const FILTER_THREE_NODE = {
            0: node => (node.info & FOUL) || THREE_NOFREE == (node.info & FOUL_MAX),
            1: node => (node.info & FOUL) || THREE_FREE == (node.info & FOUL_MAX_FREE),
            2: node => (node.info & FOUL) || THREE_NOFREE == (node.info & FOUL_MAX_FREE)
        },
        FILTER_FOUR_NODE = {
            0: node => (node.info & FOUL) || FOUR_NOFREE == (node.info & FOUL_MAX),
            1: node => (node.info & FOUL) || FOUR_FREE == (node.info & FOUL_MAX_FREE),
            2: node => (node.info & FOUL) || FOUR_NOFREE == (node.info & FOUL_MAX_FREE)
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
        FILTER_VCF = {
            0: (info, idx) => idx,
            1: (info, idx) => node.winMoves && node.winMoves.length > 3 ? idx : undefined,
            2: (info, idx) => node.winMoves && node.winMoves.length == 3 ? idx : undefined
        };

    const LEVEL_THREE_POINTS_TXT = new Array(225);
    LEVEL_THREE_POINTS_TXT.fill(1).map((v, i) => {
        if (i < 2) LEVEL_THREE_POINTS_TXT[i] = `V`;
        else if (i < 100) LEVEL_THREE_POINTS_TXT[i] = `V${i}`;
        else LEVEL_THREE_POINTS_TXT[i] = `V++`;
    })

    //把棋局转成手顺，包含pass
    function positionToMoves(position) {
        let blackMoves = [],
            whiteMoves = [],
            moves = [];
        position.map((color, idx) => {
            switch (color) {
                case 1:
                    blackMoves.push(idx);
                    break;
                case 2:
                    whiteMoves.push(idx);
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

    //param: {arr, color}
    function createTree(param, isInitMove = true) {
        let tree = new RenjuTree(undefined, undefined, { x: (cBoardSize + 1) / 2, y: (cBoardSize + 1) / 2 }),
            positionMoves = positionToMoves(param.arr),
            isPushPass = (positionMoves.length & 1) == (param.color & 1),
            current = tree.createPath(positionMoves.concat(isPushPass ? [225] : []));
        isInitMove && (tree.init = {
            MS: positionMoves,
            MSindex: positionMoves.length - 1,
            resetNum: positionMoves.length + (isPushPass ? 1 : 0)
        })
        return { tree, positionMoves, isPushPass, current };
    }

    //param: {arr, color}
    function getTestThreeInfo(param) {
        let infoArr = new Array(226);
        testThree(param.arr, param.color, infoArr);
        return infoArr;
    }

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
    function getNodes(param, callback) {
        let nodes = infoArrToNodes(getTestThreeInfo(param));
        return nodes.filter(callback);
    }

    //param: {arr, color}
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
    function getNodesThree(param) {
        return getNodes(param, FILTER_THREE_NODE[param.ftype])
    }

    //param: {arr, color, ftype}
    function getNodesFour(param) {
        return getNodes(param, FILTER_FOUR_NODE[param.ftype])
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
    async function getLevelThreeNode(idx, lineInfo, param, thread) {
        if (param.arr[idx] || THREE_FREE < (lineInfo & FOUL_MAX_FREE)) return;
        let arr = param.arr.slice(0);
        arr[idx] = param.color;

        let winMoves = await _findVCF({ arr: arr, color: param.color, maxVCF: param.maxVCF, maxDepth: param.maxDepth, maxNode: param.maxNode }, thread);
        if (winMoves.length) return { idx: idx, lineInfo: lineInfo, winMoves: winMoves };
    }

    //param: {arr, color, maxVCF, maxDepth, maxNode}
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
    async function _selectPoints(param, thread) {
        thread = thread || await getFreeThread();
        return await run("selectPoints", param, thread) || new Array(225);
    }

    async function _findVCF({ arr, color, maxVCF, maxDepth, maxNode }, thread) {
        thread = thread || await getFreeThread();
        return (await thread.run({ cmd: "findVCF", param: { arr: arr, color: color, maxVCF: maxVCF, maxDepth: maxDepth, maxNode: maxNode } })).winMoves[0] || [];
    }

    //parm: {arr, color, vcfMoves, includeFour}
    async function _getBlockVCF(param, thread) {
        thread = thread || await getFreeThread();
        return await run("getBlockVCF", param, thread) || [];
    }

    //parm: {arr, color, maxVCF, maxDepth, maxNode}
    async function _getLevelB(param, thread) {
        thread = thread || await getFreeThread();
        return await run("getLevelB", param, thread) || levelBInfo;
    }

    //parm: {arr, color, maxVCF, maxDepth, maxNode}
    async function findVCF(param, thread) {
        thread = thread || await getFreeThread();
        return await run("findVCF", param, thread) || vcfInfo;
    }

    //param: {points, arr, color, maxVCF, maxDepth, maxNode}
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
    async function excludeBlockVCF(param) {
        param.points = await _getBlockVCF(param);
        return _excludeBlockVCF(param);
    }

    //param: {arr, color, radius, maxVCF, maxDepth, maxNode}
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

    //parm: {arr, color, maxVCF, maxDepth, maxNode}
    async function createTreeVCF(param) {
        let tree = await createTreeWin(param, LEVEL_NOFREEFOUR);
        if (!tree) {
            let vcfInfo = await findVCF(param),
                { tree, positionMoves, isPushPass, current } = createTree(param);

            vcfInfo.winMoves.map(vcfMoves => tree.createPathVCF(current, vcfMoves));
            tree.init.MS = getInitMoves(tree);

            0 == vcfInfo.winMoves.length && warn(`${EMOJI_FOUL_THREE} ${COLOR_NAME[param.color]} 查找VCF失败了 ${EMOJI_FOUL_THREE}`);
            return tree;
        }
        return tree;
    }

    //parm: {arr, color}
    function createTreeFive(param) {
        return createTreeNodes(param, node => FIVE == (node.info & FOUL_MAX_FREE))
    }

    //parm: {arr, color, ftype}
    function createTreeFour(param) {
        return createTreeNodes(param, FILTER_FOUR_NODE[param.ftype])
    }

    //parm: {arr, color, ftype}
    function createTreeThree(param) {
        return createTreeNodes(param, FILTER_THREE_NODE[param.ftype])
    }

    //parm: {arr, color}
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
            warn(`棋局已结束`);
            return tree;
        }
        else if (level >= LEVEL_NOFREEFOUR) {
            let node = tree.newNode();
            node.idx = fiveIdx;
            node.boardText = "W";
            current.addChild(node);
            warn(`${COLOR_NAME[param.color]} 可以五连`);
            return tree;
        }
        else if (level == LEVEL_VCF) {
            tree.createPathVCF(current, levelBInfo.winMoves);
            tree.init.MS = getInitMoves(tree);
            warn(`${COLOR_NAME[param.color]} 有杀`);
            return tree;
        }
        return undefined;
    }

    //parm: {arr, color, ftype}
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

    //parm: {arr, color, ftype}
    async function createTreeLevelThree(param) {
        let tree = await createTreeWin(param);
        if (!tree) {
            tree = await _createTreeLevelThree(param);
        }
        return tree;
    }

    //parm: {arr, color}
    async function createTreePointsVCT(param) {
        let tree = await createTreeWin(param);
        if (!tree) {
            tree = await _createTreeLevelThree(param);
            tree.mergeTree(createTreeFour(param));
        }
        return tree;
    }

    //parm: {arr, color, radius, maxVCF, maxDepth, maxNode, maxVCT, maxDepthVCT, maxNodeVCT, ftype}
    async function createTreeVCT(param) {
        let winTree = await createTreeWin(param);
        if (winTree) return winTree;

        const MAX = 0xFF,
            MIN = 0x00,
            WIN = 0xFE,
            LOST = 0x01;
        let { tree, positionMoves, isPushPass, current } = createTree(param),
            arr = param.arr,
            moveList = new MoveList(),
            bestValue = 0,
            moves = [],
            count = 0,
            curDepthVCT,
            maxDepthVCT;

        moveList.setRoot(new ListNode(current, MIN, MAX));
        moveList.getRoot().score = MIN;

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
            while (curIdx++ <= endIdx) {
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
                        score = moves.length & 1 ? MIN : MAX;
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
                    bestValue = moves.length >= maxDepthVCT ? getScore(moves[moves.length - 1], param.color, arr) : moves.length & 1 ? WIN : LOST;
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
                            if (cur.bestValue == LOST || cur.alpha >= cur.beta) right = undefined;
                        }
                        else {
                            cur.bestValue = Math.max(cur.bestValue, bestValue);
                            cur.alpha = Math.max(cur.alpha, cur.bestValue);
                            if (cur.bestValue == WIN || cur.alpha >= cur.beta) right = undefined;
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
                        if (current.bestValue < oldBestValue || current.bestValue == LOST || (current.bestValue == WIN && maxScore == minScore)) {

                        }
                        else break;
                    }
                    else {
                        current.bestValue = maxScore;
                        current.alpha = Math.max(current.alpha, current.bestValue);
                        console.log(`max << alpha: ${current.alpha}, beta: ${current.beta}, bestValue: ${current.bestValue}, maxScore: ${maxScore}, minScore: ${minScore}`)
                        if (current.bestValue < oldBestValue || current.bestValue == WIN || (current.bestValue == LOST && maxScore == minScore)) {

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
                if (bestValue == WIN || bestValue == LOST) break;
            }
        }

        console.warn(`count: ${count}`)
        return tree;
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
        excludeBlockVCF: excludeBlockVCF,
        getBlockPoints: getBlockPoints,
        createTreeVCT: createTreeVCT,
        reset: () => {},
        //test
        _findVCF: _findVCF,
        _nextMoves: _nextMoves,
        getLevelThreeNodes: getLevelThreeNodes,
        getLevelThreePoints: getLevelThreePoints,
        getPointsVCT: getPointsVCT
    };

})();