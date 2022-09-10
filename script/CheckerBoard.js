self.SCRIPT_VERSIONS["CheckerBoard"] = "v2108.01";
(function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    'use strict';

    const TEST_CHECKER_BOARD = true;
    const TYPE_EMPTY = 0;
    const TYPE_MARK = 1; // 标记
    const TYPE_NUMBER = 2; // 顺序添加的棋子
    const TYPE_BLACK = 3; // 无序号 添加的黑棋
    const TYPE_WHITE = 4; // 无序号 添加的黑棋
    const TYPE_MOVE = 5; //VCF手顺
    const TYPE_MARKFOUL = 6;
    const TYPE_MARKARROW = 7;
    const TYPE_MARKLINE = 8;

    const COORDINATE_NONE = 0;
    const COORDINATE_ALL = 1;
    const COORDINATE_LEFT_UP = 2;
    const COORDINATE_RIGHT_UP = 3;
    const COORDINATE_RIGHT_DOWN = 4;
    const COORDINATE_LEFT_DOWN = 5;

    const ALL_STAR_POINTS = {
        15: [112, 48, 56, 168, 176],
        14: [96, 97, 111, 112, 32, 41, 167, 176],
        13: [96, 32, 40, 152, 160],
        12: [80, 81, 95, 96, 16, 25, 151, 160],
        11: [80, 16, 24, 136, 144],
        10: [64, 65, 79, 80],
        9: [64],
        8: [48, 49, 63, 64],
        7: [48],
        6: []
    };

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
        if (TEST_CHECKER_BOARD && DEBUG)
            print(`[CheckerBoard.js]\n>>  ${ param}`);
    }

    function bind(callback, _this) {
        return function() {
            callback.call(_this);
        }
    }

    let scaleAnimation = (() => {
        let cBoard,
            moves_x = [],
            moves_y = [],
            width_arr = [],
            animationFrameScroll = null;

        function scrollTo() {
            width_arr.length && (cBoard.canvas.style.width = parseInt(cBoard.canvas.style.width) + width_arr.splice(0, 1)[0] + "px",
                cBoard.canvas.style.height = cBoard.canvas.style.width);
            moves_x.length && (cBoard.viewBox.scrollLeft += moves_x.splice(0, 1)[0]);
            moves_y.length && (cBoard.viewBox.scrollTop += moves_y.splice(0, 1)[0]);
            if (moves_x.length || moves_y.length || width_arr.length) {
                animationFrameScroll = requestAnimationFrame(scrollTo);
            }
            else {
                cancelAnima();
                if (cBoard.scale == 1) {
                    cBoard.setViewBoxBorder(false);
                }
            }
        }

        function cancelAnima() {
            cancelAnimationFrame(animationFrameScroll);
            moves_x = [];
            moves_y = [];
            width_arr = [];
            animationFrameScroll = null;
        }
        return (cBd) => {
            cancelAnima();
            cBoard = cBd;
            let points;
            if (cBoard.scale == 1) {
                points = getPoints(cBoard.width - parseInt(cBoard.canvas.style.width));
                moves_x = getMoveLine(-cBoard.viewBox.scrollLeft, points);
                moves_y = getMoveLine(-cBoard.viewBox.scrollTop, points);
                width_arr = getMoveLine(cBoard.width - parseInt(cBoard.canvas.style.width), points);
            }
            else {
                cBoard.setViewBoxBorder(true);

                points = getPoints(cBoard.width * (cBoard.scale - 1));
                moves_x = getMoveLine(cBoard.width * (cBoard.scale - 1) / 2, points);
                moves_y = getMoveLine(cBoard.width * (cBoard.scale - 1) / 2, points);
                width_arr = getMoveLine(cBoard.width * (cBoard.scale - 1), points);
            }
            scrollTo();
        }
    })();

    function getMoveLine(move, points) {
        let rt = [],
            sum = 0;
        for (let i = 0; i < points.length - 1; i++) {
            rt[i] = ~~(move * points[i]);
            sum += rt[i];
        }
        rt[rt.length] = (Math.abs(move) - Math.abs(sum)) * (move < 0 ? -1 : 1);
        //log(`${rt}`,"info")
        return rt;
    }

    function getPoints(move) {
        const PAR = 1.1;
        const PAR2 = move < 0 ? 1.38 : 1.38;
        const MAX_MOVE = 5000;
        let sum = Math.abs(move);
        let tempMove = 0;
        let tempMoves = [0]; //保证最少有一个
        while (sum) {
            tempMove = Math.pow(tempMove, PAR) * PAR2 || sum / 300;
            tempMove = tempMove > MAX_MOVE ? MAX_MOVE : tempMove;
            tempMoves.push(tempMove);
            sum -= tempMove;
            if (sum < tempMove) {
                tempMoves[tempMoves.length - 1] = tempMoves[tempMoves.length - 1] + sum;
                sum = 0;
            }
        }
        let rtHs = [];
        for (let i = 0; i < tempMoves.length; i++) {
            rtHs.push(tempMoves[i] / Math.abs(move));
        }
        //log(`${rtHs}`,"info")
        return rtHs;
    }

    var tempp = new point(0, 0, undefined);
    //定义棋盘上的一个点
    function point(x, y, d) {

        this.x = x; // 棋盘一个点的坐标，相对于BODY
        this.y = y;
        this.d = d; // 对div标签的引用，null为空;
        this.type = 0; // 这个点是否有棋子，=TYPE_EMPTY为空，棋子=TYPE_NUMBER,bi标记=TYPE_MARK
        this.text = "";
        this.color = null;
        this.bkColor = null;
        this.branchs = null;
    }


    //清空这个点上面的棋子，数字，标记              
    point.prototype.cle = function() {
        if (this.d != null) {
            this.d.innerHTML = "";
            this.d.style.background = "";
            this.d.style.borderStyle = "none";
            this.d.style.zIndex = -100;
        }
        // this.d = null;
        this.type = 0;
        this.text = "";
        this.color = null;
        this.bkColor = null;
        this.branchs = null;
        //alert("p.cle")
    };


    point.prototype.printBorder = function(gW, gH) {
        var size;
        var temp;
        if (this.x == null || this.y == null) { return };
        temp = (gW < gH) ? gW : gH;
        size = ~~(temp / 4 * 3.6);
        this.d.style.position = "absolute";
        this.d.style.width = size + "px";
        this.d.style.height = size + "px";
        this.d.style.left = this.x - ~~(size / 2) + "px";
        this.d.style.top = this.y - ~~(size / 2) + "px";
        this.d.style.borderStyle = "dashed";
        this.d.style.borderWidth = "1px";
        this.d.style.borderColor = "red";
        this.d.style.zIndex = 0;

    };



    //在这个点上记一个标记
    point.prototype.printLb = function(s, color, gW, gH) {
        //alert("printLb")
        var size;
        var temp;
        this.type = TYPE_MARK;
        this.text = s;
        this.color = color;

        this.d.innerHTML = this.text;
        temp = (gW < gH) ? gW : gH;
        size = ~~(temp / 4 * 3);
        this.d.style.fontSize = size + "px";
        this.d.style.color = color;
        this.d.style.position = "absolute";
        this.d.style.background = "";
        this.d.style.width = size + "px";
        this.d.style.height = size + "px";
        this.d.style.lineHeight = size + "px";
        this.d.style.left = this.x - ~~(size / 2) + "px";
        this.d.style.top = this.y - ~~(size / 2) + "px";
        this.d.style.zIndex = 0;

    };


    // 在这个点上放一个棋子or数字;
    point.prototype.printNb = function(n, color, gW, gH, numColor) {
        var size;
        var temp;

        this.color = numColor;
        this.type = TYPE_NUMBER;
        this.text = String(n);
        this.d.innerHTML = this.text;
        temp = (gW < gH) ? gW : gH;
        size = (color == "black" || color == "white") ? ~~(temp / 4 * 1.5) : ~~(temp / 4 * 3);
        this.d.style.fontSize = size + "px";
        size = ~~(temp / 4 * 2);
        this.d.style.color = color == "white" ? "black" : "white";
        this.d.style.position = "absolute";
        this.d.style.background = (color == "white") ? "white" : (color == "black") ? "black" : "";
        this.d.style.width = size + "px";
        this.d.style.height = size + "px";
        this.d.style.lineHeight = size + "px";
        this.d.style.left = this.x - ~~(size / 2) + "px";
        this.d.style.top = this.y - ~~(size / 2) + "px";
        this.d.style.borderStyle = "";
        this.d.style.zIndex = 0;
        if (color == "black" || color == "white")
        {
            this.d.style.borderStyle = "solid";
            this.d.style.borderWidth = "1px";
            this.d.style.borderColor = color;
            if (color == "white") this.d.style.borderColor = "black";
        }
    };


    //改变一个棋子or数字颜色
    point.prototype.setcolor = function(color) {
        this.printNb(parseInt(this.text), color);
    };


    //设置一个div标签
    point.prototype.setd = function(d) { this.d = d; };


    point.prototype.setxy = function(x, y) {
        this.x = x;
        this.y = y;
    };


    function markLine(points, color, direction) {

        this.P = points;
        this.color = color;
        this.direction = direction;
    }


    function markArrow(points, color, direction) {

        this.P = points;
        this.color = color;
        this.direction = direction;
    }



    //定义一个棋盘
    function CheckerBoard(parentNode, left, top, width, height) {

        if (!width || !height) {
            width = dw < dh ? dw + "px" : dh + "px";
            height = this.viewBox.style.width;
        }
        this.parentNode = parentNode;
        this.left = parseInt(left);
        this.top = parseInt(top);
        this.width = parseInt(width);
        this.height = parseInt(height);

        this.isShowNum = true; // 是否显示手顺
        this.isShowFoul = false;
        this.isShowAutoLine = false;
        this.isTransBranch = true;
        this.timerAutoShow = null;

        this.P = new Array(226); //用来保存225个点
        this.DIV = new Array(226); //原来保存225 DIV 标签的引用
        this.MS = []; //保存落子顺序,index
        this.MS.length = 0;
        this.MSindex = -1; //  指针，指向当前棋盘最后一手在MS索引   
        this.onMove = function() {};
        this.autoLines = [];
        this.LINES = [];
        this.ARROWS = [];
        this.Moves = ""; // 保存棋谱代码;
        this.resetNum = 0; //重置显示的手数，控制从第几手开始显示序号
        this.notShowLastNum = false; // = true ,取消最后一手高亮显示
        this.alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.printMovesTimer = 0;

        this.XL = 0; //棋盘落子范围，左右上下的4条边
        this.XR = 0;
        this.YT = 0;
        this.YB = 0;
        this.oldXL = 0;
        this.oldXR = 0;
        this.oldYT = 0;
        this.oldYB = 0;
        this.gW = 0; //棋盘格子宽度,浮点数
        this.gH = 0; //棋盘格子高度,浮点数
        this.size = 15;
        this.onSetSize = function() {};
        this.coordinateType = COORDINATE_ALL;
        this.onSetCoordinate = function() {};
        this.SLTX = this.size;
        this.SLTY = this.SLTX; //默认是15×15棋盘;
        this.searchIdx = []; // 记录正在计算的点
        this.searchPoints = [];
        for (let i = 0; i < 225; i++) {
            this.searchPoints[i] = document.createElement("div");
            //this.parentNode.appendChild(this.searchPoints[i]);
            this.searchPoints[i].style.zIndex = 1;
            this.searchPoints[i].style.borderRadius = "50%";
            this.searchPoints[i].style.borderStyle = "";
            this.searchPoints[i].style.margin = "";
            this.searchPoints[i].style.padding = "";
        }

        for (let i = 0; i < 30; i++) { this.searchIdx[i] = -1; };
        this.backgroundColor = "#f0f0f0"; //888888
        this.wNumColor = "white"; 
        this.bNumColor = "#000000"; //333333
        this.wNumFontColor = "#000000"; //333333
        this.bNumFontColor = "#ffffff"; //333333
        this.LbBackgroundColor = "#f0f0f0"; //888888
        this.coordinateColor = "#000000"; //111111
        this.lineColor = "#000000"; //111111
        this.wLastNumColor = "#ff0000"; //dd0000
        this.bLastNumColor = "#ffaaaa"; //dd0000
        this.moveWhiteColor = "#bbbbbb"; //bbbbbb
        this.moveBlackColor = "#bbbbbb"; //666666
        this.moveWhiteFontColor = "#ffffff"; //ffffff
        this.moveBlackFontColor = "#000000"; //000000
        this.moveLastFontColor = "red"; //ff0000
        this.firstColor = "black";
        this.lineStyle = "normal";

        this.oldFirstColor = "black";
        this.oldResetNum = 0;
        this.tree = undefined;

        //页面显示的棋盘
        this.scale = 1;
        this.onScale = function() {};
        this.viewBox = d.createElement("div");
        this.viewBox.style.position = "absolute";
        this.viewBox.style.width = this.width + "px";
        this.viewBox.style.height = this.height + "px";
        this.viewBox.style.left = this.left + "px";
        this.viewBox.style.top = this.top + "px";
        //this.viewBox.style.background = "green";
        this.viewBox.setAttribute("id", "viewBox");
        this.parentNode.appendChild(this.viewBox);

        this.canvas = d.createElement("canvas");
        this.canvas.style.position = "absolute";
        this.canvas.style.width = this.viewBox.style.width;
        this.canvas.style.height = this.canvas.style.width;
        this.canvas.style.left = "0px";
        this.canvas.style.top = "0px";
        //this.canvas.style.transformOrigin = `0px 0px`;
        //this.canvas.style.transform = `scale(${this.scale})`;
        this.viewBox.appendChild(this.canvas);

        //后台保存的空棋盘
        this.bakCanvas = d.createElement("canvas");
        this.bakCanvas.style.position = "absolute";
        this.bakCanvas.style.width = this.canvas.style.width;
        this.bakCanvas.style.height = this.canvas.style.height;
        this.bakCanvas.style.left = this.canvas.offsetLeft + "px";
        this.bakCanvas.style.top = this.canvas.offsetTop + "px";
        //this.parentNode.appendChild(this.bakCanvas);
        //后台裁剪图片的canvas
        this.cutCanvas = d.createElement("canvas");

        //后台处理图片的img     
        this.bakImg = d.createElement("img");
        this.bakImg.style.position = "absolute";
        this.cutImg = d.createElement("img");
        this.cutImg.style.position = "absolute";
        //this.parentNode.appendChild(this.cutImg);


        this.cutDiv = document.createElement("div");
        this.parentNode.appendChild(this.cutDiv);
        this.cutDiv.ontouchend = function() { if (event) event.preventDefault(); };
        this.cutDiv.ontouchmove = function() { if (event) event.preventDefault(); };

        for (var i = 0; i < 226; i++) {
            this.DIV[i] = document.createElement("div");
            this.DIV[i].style.borderRadius = "50%";
            this.parentNode.appendChild(this.DIV[i]);
            this.DIV[i].ontouchend = function() { if (event) event.preventDefault(); };
            this.DIV[i].ontouchmove = function() { if (event) event.preventDefault(); };
            this.P[i] = new point(-500, -500, this.DIV[i]);
        }

        this.startIdx = -1;
        this.selectLine = null;
        this.selectArrow = null;
        this.selectIdx = -1;
        this.drawLine = { startPoint: null, selectDiv: null, dashedLine: [] };
        this.drawLine.startPoint = document.createElement("div");
        let s = this.drawLine.startPoint.style;
        s.position = "absolute";
        s.borderStyle = "solid";
        s.borderWidth = "0px";
        s.borderColor = "red";
        s.borderRadius = "50%";
        s.width = this.gW / 3 + "px";
        s.height = this.gH / 3 + "px";
        s.backgroundColor = "red";
        s.zIndex = -100;
        for (let i = 0; i < 4; i++) {
            this.drawLine.dashedLine.push(document.createElement("div"));
            s = this.drawLine.dashedLine[i].style;
            s.position = "absolute";
            s.borderStyle = "dashed";
            s.borderWidth = "1px";
            s.borderColor = "red";
            s.zIndex = -100;
            this.parentNode.appendChild(this.drawLine.dashedLine[i]);
        }
        this.parentNode.appendChild(this.drawLine.startPoint);
        this.drawLine.selectDiv = document.createElement("div");
        s = this.drawLine.selectDiv.style;
        s.position = "absolute";
        s.borderStyle = "dashed";
        s.borderWidth = "1px";
        s.borderColor = "red";
        s.zIndex = -100;
        this.parentNode.appendChild(this.drawLine.selectDiv);

        this.delay = function() { // 设置延迟执行
            let timer;
            return function(callback, t) {
                if (timer) clearTimeout(timer);
                timer = setTimeout(callback, t);
            }
        }();

        this.autoDelay = function(cBoard) {
            return function(callback, time) {
                if (time == "now") {
                    callback();
                }
                else {
                    cBoard.delay(callback, time);
                }
            }
        }(this)
    }



    CheckerBoard.prototype.addTree = function(tree) {
        this.oldFirstColor = this.firstColor; // 在this.cle 前面
        this.firstColor = "black";
        this.oldResetNum = this.resetNum;
        this.resetNum = 0;
        //log(tree);
        this.tree = tree;
        if (tree.init) {
            this.cle();
            this.MS = tree.init.MS;
            this.resetNum = tree.init.resetNum;
            while (this.MSindex < tree.init.MSindex) this.toNext(true, 100);
            console.log(`addTree this.MS = [${this.MS}]\n[${this.MS.slice(0, this.MSindex + 1)}]`)
        }
    };



    CheckerBoard.prototype.mergeTree = function(tree) {
        if (this.tree && tree.init) {
            let targetPath = this.MS.slice(0, this.MSindex + 1),
                branchRootPath = tree.init.MS.slice(0, tree.init.MSindex + 1);
                
            tree.init.MS = targetPath.concat(tree.init.MS.slice(tree.init.MSindex + 1));
            tree.init.MSindex = this.MSindex;
            tree.init.resetNum = (tree.init.MS[targetPath.length] == 225 ? 1 : 0 ) + targetPath.length;
            //console.log(`targetPath: [${targetPath}] len: ${targetPath.length}\n branchRootPath: [${branchRootPath}] len: ${branchRootPath.length}`)
            let target = this.tree.createPath(targetPath),
                branchRoot = tree.createPath(branchRootPath);
                
            target.comment = branchRoot.comment + target.comment;
            if ((targetPath.length & 1) == (branchRootPath.length & 1)) {
                this.tree.insertBranch(target, branchRoot);
                //console.log(`insertBranch(target, branchRoot)`)
            }
            else {
                let passNode = branchRoot.getChild(225);
                if (passNode) {
                    this.tree.insertBranch(target,passNode);
                    branchRoot.removeChild(passNode);
                    //console.log(`insertBranch(target, passNode)`)
                }
                passNode = this.tree.createPath(targetPath.concat([225]));
                this.tree.insertBranch(passNode, branchRoot);
                //console.log(`insertBranch(passNode, branchRoot)`)
            }
        }
        else {
            this.tree = this.tree || new RenjuTree();
            this.tree.mergeTree(tree);
        }
        this.tree.init = tree.init;
        console.log(`mergeTree tree.init.MS = ${tree.init.MS}`)
        this.addTree(this.tree);
    }



    CheckerBoard.prototype.map = function(callback) {
        this.P.map(p => { callback(p) });
    }



    CheckerBoard.prototype.autoShow = function(timer = 50) {

        let playMode = control.getPlayMode();
        //log(`playmofel=${control.getPlayMode()}`)
        if (playMode != control.renjuMode &&
            playMode != control.renjuFreeMode &&
            playMode != control.renlibMode &&
            playMode != control.readLibMode &&
            playMode != control.editLibMode &&
            playMode != control.arrowMode &&
            playMode != control.lineMode) return;

        if (this.timerAutoShow) {
            clearTimeout(this.timerAutoShow);
            this.timerAutoShow = null;
        }
        let cBoard = this;
        this.timerAutoShow = setTimeout(show, parseInt(timer));
    
        function show() {
            if (playMode == control.readLibMode || playMode == control.editLibMode) {
                cBoard.unpackTree();
            }
            else if (playMode == control.renlibMode) {
                RenjuLib.showBranchs({ path: cBoard.MS.slice(0, cBoard.MSindex + 1), position: cBoard.getArray2D() });
                cBoard.showFoul((findMoves() + 1) ? false : cBoard.isShowFoul, true);
            }
            else {
                cBoard.showFoul((findMoves() + 1) ? false : cBoard.isShowFoul, true);
                cBoard.showAutoLine((findMoves() + 1) ? false : cBoard.isShowAutoLine, true);
            }
        }

        function findMoves() {
            for (let i = 0; i < cBoard.SLTX; i++) {
                for (let j = 0; j < cBoard.SLTY; j++) {
                    if (cBoard.P[i + j * 15].type == TYPE_MOVE) {
                        return i;
                    }
                }
            }
            return -1;
        }
    }



    // 将传入的二维数组顺时针90°
    CheckerBoard.prototype.CW = function(arr2D, count) {

        let x;
        let y;
        let nx;
        let ny;
        //复制二维数组
        let arrs = [];
        for (y = 0; y < this.SLTY; y++) {

            arrs[y] = [];
            for (x = 0; x < this.SLTX; x++) {
                arrs[y][x] = arr2D[y][x];
            }

        }
        //旋转
        for (y = 0; y < this.SLTY; y++) {

            for (x = 0; x < this.SLTX; x++) {
                nx = this.SLTX - 1 - x;
                arr2D[y][x] = arrs[nx][y];
            }

        }

    };



    // 将传入的二维数组逆时针90°
    CheckerBoard.prototype.CCW = function(arr2D, count) {

        let x;
        let y;
        let nx;
        let ny;
        //复制二维数组
        let arrs = [];
        for (y = 0; y < this.SLTY; y++) {

            arrs[y] = [];
            for (x = 0; x < this.SLTX; x++) {
                arrs[y][x] = arr2D[y][x];
            }

        }
        //旋转
        for (y = 0; y < this.SLTY; y++) {

            for (x = 0; x < this.SLTX; x++) {
                ny = this.SLTY - 1 - y;
                arr2D[y][x] = arrs[x][ny];
            }

        }

    };



    // 二维数组上下反转
    CheckerBoard.prototype.flipX = function(arr2D) {

        let x;
        let y;
        let nx;
        let ny;

        let arrs = [];
        for (y = 0; y < this.SLTY; y++) {

            arrs[y] = [];
            for (x = 0; x < this.SLTX; x++) {
                arrs[y][x] = arr2D[y][x];
            }

        }

        for (y = 0; y < this.SLTY; y++) {

            for (x = 0; x < this.SLTX; x++) {
                ny = this.SLTY - 1 - y;
                arr2D[y][x] = arrs[ny][x];
            }

        }

    };



    // 二维数组左右翻转
    CheckerBoard.prototype.flipY = function(arr2D) {

        let x;
        let y;
        let nx;
        let ny;
        // 复制二维数组
        let arrs = [];
        for (y = 0; y < this.SLTY; y++) {

            arrs[y] = [];
            for (x = 0; x < this.SLTX; x++) {
                arrs[y][x] = arr2D[y][x];
            }

        }
        // 翻转
        for (y = 0; y < this.SLTY; y++) {

            for (x = 0; x < this.SLTX; x++) {
                nx = this.SLTX - 1 - x;
                arr2D[y][x] = arrs[y][nx];
            }

        }
    };




    // 顺时针 翻转棋盘90°
    CheckerBoard.prototype.boardCW = function(isShowNum) {
        let tMS = [];
        let tMS1 = [];
        let wMS = [];
        let bMS = [];
        let tMSindex = this.MSindex;
        let idx;
        let x;
        let y;
        let nx;
        let ny;
        for (let x = 0; x < this.SLTX; x++) {
            for (let y = 0; y < this.SLTY; y++) {
                let idx = x + y * 15;
                if (this.P[idx].type == TYPE_WHITE) {
                    wMS.push(idx);
                }
                else if (this.P[idx].type == TYPE_BLACK) {
                    bMS.push(idx);
                }
            }
        }

        for (let j = 0; j < 3; j++) {
            tMS = [];
            tMS1 = j == 0 ? wMS : j == 1 ? bMS : this.MS;
            for (let i = 0; i < tMS1.length; i++) {

                idx = tMS1[i];
                if (idx >= 0 && idx <= 224) {
                    y = ~~(idx / 15);
                    nx = this.SLTY - 1 - y; // 新的 x坐标是原来 y坐标的翻转;
                    ny = idx % 15; // 旋转后新的 y坐标是原来的 x坐标

                    idx = ny * 15 + nx;
                }
                tMS[i] = idx;

            }
            if (j == 0) {
                wMS = tMS.slice();
            }
            else if (j == 1) {
                bMS = tMS.slice();
            }
        }
        let resetNum = this.resetNum;
        let firstColor = this.firstColor;
        this.cle(); // 清空棋盘
        this.resetNum = resetNum;
        this.firstColor = firstColor;
        this.MS = tMS;

        //  打印棋盘
        for (let i = 0; i <= tMSindex; i++) {
            this.toNext(isShowNum, 100);
        }
        for (let i = 0; i < wMS.length; i++) {
            this.wNb(wMS[i], `white`, undefined, undefined, undefined, 100);
        }
        for (let i = 0; i < bMS.length; i++) {
            this.wNb(bMS[i], `black`, undefined, undefined, undefined, 100);
        }
        //this.autoShow(100);
    };



    // 逆时针 翻转棋盘90°
    CheckerBoard.prototype.boardCCW = function(isShowNum) {

        let tMS = [];
        let tMS1 = [];
        let wMS = [];
        let bMS = [];
        let tMSindex = this.MSindex;
        let idx;
        let x;
        let y;
        let nx;
        let ny;

        for (let x = 0; x < this.SLTX; x++) {
            for (let y = 0; y < this.SLTY; y++) {
                let idx = x + y * 15;
                if (this.P[idx].type == TYPE_WHITE) {
                    wMS.push(idx);
                }
                else if (this.P[idx].type == TYPE_BLACK) {
                    bMS.push(idx);
                }
            }
        }

        for (let j = 0; j < 3; j++) {
            tMS = [];
            tMS1 = j == 0 ? wMS : j == 1 ? bMS : this.MS;
            for (let i = 0; i < tMS1.length; i++) {

                idx = tMS1[i]; // 取得旧的index
                if (idx >= 0 && idx <= 224) {
                    // 新的 x坐标是原来 y坐标;   
                    nx = ~~(idx / 15);
                    // 旋转后新的 y坐标是原来的 x坐标翻转
                    x = idx % 15;
                    ny = this.SLTX - 1 - x;
                    // 求得新的index，暂时保存
                    idx = ny * 15 + nx;
                }
                tMS[i] = idx;

            }
            if (j == 0) {
                wMS = tMS.slice();
            }
            else if (j == 1) {
                bMS = tMS.slice();
            }
        }

        let resetNum = this.resetNum;
        let firstColor = this.firstColor;
        this.cle(); // 清空棋盘
        this.resetNum = resetNum;
        this.firstColor = firstColor;
        this.MS = tMS;

        //  打印棋盘
        for (let i = 0; i <= tMSindex; i++) {
            this.toNext(isShowNum, 100);
        }
        for (let i = 0; i < wMS.length; i++) {
            this.wNb(wMS[i], `white`, undefined, undefined, undefined, 100);
        }
        for (let i = 0; i < bMS.length; i++) {
            this.wNb(bMS[i], `black`, undefined, undefined, undefined, 100);
        }

    };



    // 上下 翻转棋盘
    CheckerBoard.prototype.boardFlipX = function(isShowNum) {

        let tMS = [];
        let tMS1 = [];
        let wMS = [];
        let bMS = [];
        let tMSindex = this.MSindex;
        let idx;
        let x;
        let y;
        let nx;
        let ny;

        for (let x = 0; x < this.SLTX; x++) {
            for (let y = 0; y < this.SLTY; y++) {
                let idx = x + y * 15;
                if (this.P[idx].type == TYPE_WHITE) {
                    wMS.push(idx);
                }
                else if (this.P[idx].type == TYPE_BLACK) {
                    bMS.push(idx);
                }
            }
        }

        for (let j = 0; j < 3; j++) {
            tMS = [];
            tMS1 = j == 0 ? wMS : j == 1 ? bMS : this.MS;
            for (let i = 0; i < tMS1.length; i++) {

                idx = tMS1[i]; // 取得旧的index
                if (idx >= 0 && idx <= 224) {
                    nx = idx % 15; // 新的 x坐标是原来 x坐标不变;
                    y = ~~(idx / 15);
                    ny = this.SLTY - 1 - y; // 旋转后新的 y坐标是原来的 y坐标翻转;

                    idx = ny * 15 + nx;
                }
                tMS[i] = idx;

            }
            if (j == 0) {
                wMS = tMS.slice();
            }
            else if (j == 1) {
                bMS = tMS.slice();
            }
        }

        let resetNum = this.resetNum;
        let firstColor = this.firstColor;
        this.cle(); // 清空棋盘
        this.resetNum = resetNum;
        this.firstColor = firstColor;
        this.MS = tMS;

        //  打印棋盘
        for (let i = 0; i <= tMSindex; i++) {
            this.toNext(isShowNum, 100);
        }
        for (let i = 0; i < wMS.length; i++) {
            this.wNb(wMS[i], `white`, undefined, undefined, undefined, 100);
        }
        for (let i = 0; i < bMS.length; i++) {
            this.wNb(bMS[i], `black`, undefined, undefined, undefined, 100);
        }

    };



    // 左右 翻转棋盘180°
    CheckerBoard.prototype.boardFlipY = function(isShowNum) {

        let tMS = [];
        let tMS1 = [];
        let wMS = [];
        let bMS = [];
        let tMSindex = this.MSindex;
        let idx;
        let x;
        let y;
        let nx;
        let ny;

        for (let x = 0; x < this.SLTX; x++) {
            for (let y = 0; y < this.SLTY; y++) {
                let idx = x + y * 15;
                if (this.P[idx].type == TYPE_WHITE) {
                    wMS.push(idx);
                }
                else if (this.P[idx].type == TYPE_BLACK) {
                    bMS.push(idx);
                }
            }
        }

        for (let j = 0; j < 3; j++) {
            tMS = [];
            tMS1 = j == 0 ? wMS : j == 1 ? bMS : this.MS;
            for (let i = 0; i < tMS1.length; i++) {

                idx = tMS1[i]; // 取得旧的index              
                if (idx >= 0 && idx <= 224) {
                    x = idx % 15;
                    nx = this.SLTX - 1 - x; // 新的 x坐标是原来 x坐标的翻转;
                    ny = ~~(idx / 15); // 新的 y坐标是原来的 y坐标不变;

                    idx = ny * 15 + nx;
                }
                tMS[i] = idx;
            }
            if (j == 0) {
                wMS = tMS.slice();
            }
            else if (j == 1) {
                bMS = tMS.slice();
            }
        }

        let resetNum = this.resetNum;
        let firstColor = this.firstColor;
        this.cle(); // 清空棋盘
        this.resetNum = resetNum;
        this.firstColor = firstColor;
        this.MS = tMS;

        //  打印棋盘
        for (let i = 0; i <= tMSindex; i++) {
            this.toNext(isShowNum, 100);
        }
        for (let i = 0; i < wMS.length; i++) {
            this.wNb(wMS[i], `white`, undefined, undefined, undefined, 100);
        }
        for (let i = 0; i < bMS.length; i++) {
            this.wNb(bMS[i], `black`, undefined, undefined, undefined, 100);
        }
        //this.autoShow(100);
    };



    // 清空棋盘上每一个点的显示，和记录
    CheckerBoard.prototype.cle = function() {

        this.MSindex = -1;
        this.MS.length = 0;
        for (let i = 0; i < 225; i++) {
            this.clePoint(i);
        }
        this.removeMarkArrow("all");
        this.removeMarkLine("all");
        this.removeMarkLine(this.autoLines);
        this.drawLineEnd();
        //this.removeTree();
    };



    // 取消虚线显示棋子位置
    CheckerBoard.prototype.cleAllPointBorder = function() {

        for (let i = 0; i < 225; i++) {
            this.DIV[i].style.borderStyle = "none";
        }

    };



    // 删除一个标记
    CheckerBoard.prototype.cleLb = function(idx) {

        if (typeof(idx) == "string" && idx == "all") {
            for (let i = 0; i < 15 * 15; i++) {
                if (this.P[i].type == TYPE_MARK || this.P[i].type == TYPE_MOVE) {
                    this.clePoint(i);
                    refreshLine.call(this, i);
                }
            }
        }
        else {
            if (this.P[idx].type == TYPE_MARK || this.P[idx].type == TYPE_MOVE) {
                this.clePoint(idx);
                refreshLine.call(this, idx);
            }
        }


        function refreshLine(idx) {
            let mv = [0, -this.SLTX, this.SLTX, -1, 1];
            for (let i = mv.length - 1; i >= 0; i--) {
                let nIdx = idx + mv[i];
                if (nIdx >= 0 && nIdx < this.P.length) {
                    this.refreshMarkLine(nIdx, this.autoLines);
                    this.refreshMarkLine(nIdx);
                    this.refreshMarkArrow(nIdx);
                }
            }
        }
    };



    // 删除一颗棋子,不删除MS的记录
    CheckerBoard.prototype.cleNb = function(idx, showNum, timer = "now") {

        if (idx < 0 || idx > 225) return;
        if (idx == 225 || this.P[idx].type == TYPE_NUMBER) {
            this.cletLbMoves();
            let i = this.MSindex;
            if (i < 0) return;
            this.clePoint(this.MS[i]);
            refreshLine.call(this, this.MS[i]);
            this.MSindex--;
            this.showLastNb(showNum);
        }
        else if (this.P[idx].type == TYPE_BLACK || this.P[idx].type == TYPE_WHITE) {
            if (control.getPlayMode() == control.readLibMode || control.getPlayMode() == control.editLibMode) return;
            this.cletLbMoves();
            this.clePoint(idx);
            refreshLine.call(this, idx);
        }

        this.autoDelay(bind(function() {
            this.onMove(idx);
            this.autoShow();
        }, this), timer);

        function refreshLine(idx) {

            let mv = [0, -this.SLTX, this.SLTX, -1, 1];
            for (let i = mv.length - 1; i >= 0; i--) {
                let nIdx = idx + mv[i];
                if (nIdx >= 0 && nIdx < this.P.length) {
                    this.refreshMarkLine(nIdx);
                    this.refreshMarkArrow(nIdx);
                }
            }
        }
    };



    CheckerBoard.prototype.cletLbMoves = function() {

        for (let i = 0; i < 15 * 15; i++) {
            if (this.P[i].type == TYPE_MOVE) {
                this.cleLb(i);
            }
        }
    }



    // 清空棋盘对象记录的棋谱
    CheckerBoard.prototype.cleMoves = function() {
        this.Moves = "";
    };



    CheckerBoard.prototype.cleMarkLine = function(markLine) {

        let oldIdx = -1;
        let color = markLine.color;
        markLine.color = this.backgroundColor;
        this._printMarkLine(markLine, undefined, true);
        markLine.color = color;
        for (let i = markLine.P.length - 1; i >= 0; i--) {
            let idx = markLine.P[i];
            let w = markLine.direction == 0 ? this.gW : markLine.direction == 4 ? this.gW : this.gW / 3;
            let h = markLine.direction == 2 ? this.gH : markLine.direction == 6 ? this.gH : this.gH / 3;
            //log(`w=${w}, h=${h}`)
            this.clePointB(idx, w + 1, h + 1);
            if (oldIdx + 1) {
                this.refreshMarkLine(oldIdx, this.autoLines);
                this.refreshMarkLine(oldIdx);
                this._printPoint(oldIdx, this.isShowNum);
                this.refreshMarkArrow(oldIdx);
            }
            oldIdx = idx;
            if (markLine.direction & 1) {
                let nIdx = idx + (markLine.direction < 5 ? 0 - this.SLTX : this.SLTX);
                let nIdx1 = idx + (nIdx < idx ? (markLine.direction == 1 ? -1 : 1) : (markLine.direction == 5 ? 1 : -1));
                if (nIdx >= 0 && nIdx < this.P.length) {
                    this.refreshMarkLine(nIdx, this.autoLines);
                    this.refreshMarkLine(nIdx);
                    this._printPoint(nIdx, this.isShowNum);
                    this.refreshMarkArrow(nIdx);
                }
                if (nIdx1 >= 0 && nIdx1 < this.P.length) {
                    this.refreshMarkLine(nIdx1, this.autoLines);
                    this.refreshMarkLine(nIdx1);
                    this._printPoint(nIdx1, this.isShowNum);
                    this.refreshMarkArrow(nIdx1);
                }
            }
        }
        if (oldIdx + 1) {
            this.refreshMarkLine(oldIdx, this.autoLines);
            this.refreshMarkLine(oldIdx);
            this._printPoint(oldIdx, this.isShowNum);
            this.refreshMarkArrow(oldIdx);
        }
        if ((markLine.direction + 1) & 1) {
            let idx1, idx2;
            switch (markLine.direction) {
                case 0:
                    idx1 = markLine.P[0] + 1;
                    idx2 = markLine.P[markLine.P.length - 1] - 1;
                    break;
                case 4:
                    idx1 = markLine.P[0] - 1;
                    idx2 = markLine.P[markLine.P.length - 1] + 1;
                    break;
                case 2:
                    idx1 = markLine.P[0] + this.SLTX;
                    idx2 = markLine.P[markLine.P.length - 1] - this.SLTX;
                    break;
                case 6:
                    idx1 = markLine.P[0] - this.SLTX;
                    idx2 = markLine.P[markLine.P.length - 1] + this.SLTX;
                    break;
            }
            this.refreshMarkArrow(idx1);
            this.refreshMarkArrow(idx2);
        }
    }



    CheckerBoard.prototype.cleMarkArrow = function(markArrow) {

        let oldIdx = -1;
        let color = markArrow.color;
        markArrow.color = this.backgroundColor;
        this._printMarkArrow(markArrow, undefined, true);
        markArrow.color = color;
        for (let i = markArrow.P.length - 1; i >= 0; i--) {
            let idx = markArrow.P[i];
            let w = markArrow.direction == 0 ? this.gW : markArrow.direction == 4 ? this.gW : this.gW / 3;
            let h = markArrow.direction == 2 ? this.gH : markArrow.direction == 6 ? this.gH : this.gH / 3;
            //log(`w=${w}, h=${h}`)
            this.clePointB(idx, w + 1, h + 1);
            if (oldIdx + 1) {
                this.refreshMarkLine(oldIdx, this.autoLines);
                this.refreshMarkLine(oldIdx);
                this._printPoint(oldIdx, this.isShowNum);
                this.refreshMarkArrow(oldIdx);
            }
            oldIdx = idx;
            if (markArrow.direction & 1) {
                let nIdx = idx + (markArrow.direction < 5 ? 0 - this.SLTX : this.SLTX);
                let nIdx1 = idx + (nIdx < idx ? (markArrow.direction == 1 ? -1 : 1) : (markArrow.direction == 5 ? 1 : -1));
                if (nIdx >= 0 && nIdx < this.P.length) {
                    this.refreshMarkLine(nIdx, this.autoLines);
                    this.refreshMarkLine(nIdx);
                    this._printPoint(nIdx, this.isShowNum);
                    this.refreshMarkArrow(nIdx);
                }
                if (nIdx1 >= 0 && nIdx1 < this.P.length) {
                    this.refreshMarkLine(nIdx1, this.autoLines);
                    this.refreshMarkLine(nIdx1);
                    this._printPoint(nIdx1, this.isShowNum);
                    this.refreshMarkArrow(nIdx1);
                }
            }

        }
        if (oldIdx + 1) {
            this.refreshMarkLine(oldIdx, this.autoLines);
            this.refreshMarkLine(oldIdx);
            this._printPoint(oldIdx, this.isShowNum);
            this.refreshMarkArrow(oldIdx);
        }
        if ((markArrow.direction + 1) & 1) {
            let idx1, idx2;
            switch (markArrow.direction) {
                case 0:
                    idx1 = markArrow.P[0] + 1;
                    idx2 = markArrow.P[markArrow.P.length - 1] - 1;
                    break;
                case 4:
                    idx1 = markArrow.P[0] - 1;
                    idx2 = markArrow.P[markArrow.P.length - 1] + 1;
                    break;
                case 2:
                    idx1 = markArrow.P[0] + this.SLTX;
                    idx2 = markArrow.P[markArrow.P.length - 1] - this.SLTX;
                    break;
                case 6:
                    idx1 = markArrow.P[0] - this.SLTX;
                    idx2 = markArrow.P[markArrow.P.length - 1] + this.SLTX;
                    break;
            }
            this.refreshMarkArrow(idx1);
            this.refreshMarkArrow(idx2);
        }

    }



    CheckerBoard.prototype.center = function() {
        if (this.scale == 1) return;
        let x = this.canvas.width * (this.scale - 1) / 2,
            y = this.canvas.height * (this.scale - 1) / 2;
        this.viewBox.scrollLeft = x;
        this.viewBox.scrollTop = y;
    }



    CheckerBoard.prototype.cleSearchPoint = function(num) {
        if (num >= 0 && num < this.searchPoints.length) {
            this.printSearchPoint(num);
        }
        else for (let i = this.searchPoints.length - 1; i >= 0; i--) {
            this.printSearchPoint(i);
        }
    }



    CheckerBoard.prototype.createMarkArrow = function(start, end, color) {

        let x1 = start % 15;
        let y1 = ~~(start / 15);
        let x2 = end % 15;
        let y2 = ~~(end / 15);
        let direction;
        let P = [];
        let n;
        if (x1 == x2 && y1 != y2) {
            direction = start > end ? 2 : 6;
            n = direction == 2 ? 0 - 15 : 15;
        }
        else if (y1 == y2 && x1 != x2) {
            direction = start > end ? 0 : 4;
            n = direction == 0 ? 0 - 1 : 1;
        }
        else if (Math.abs(y1 - y2) == Math.abs(x1 - x2) && x1 != x2) {
            direction = start > end ? (x1 > x2 ? 1 : 3) : (x1 > x2 ? 7 : 5);
            n = direction == 1 ? 0 - 15 - 1 : direction == 3 ? 0 - 15 + 1 : direction == 5 ? 15 + 1 : 15 - 1;
        }
        else {
            return;
        }
        for (let idx = start; idx != end; idx += n) {
            P.push(idx);
        }
        P.push(end);
        let mkArrow = new markArrow(P, color, direction);
        this.ARROWS.push(mkArrow);
        this.printMarkArrow(mkArrow);
        return mkArrow;
    }



    CheckerBoard.prototype.createMarkLine = function(start, end, color, lines) {
        let x1 = start % 15;
        let y1 = ~~(start / 15);
        let x2 = end % 15;
        let y2 = ~~(end / 15);
        let direction;
        let P = [];
        let n;
        lines = lines || this.LINES;
        if (x1 == x2 && y1 != y2) {
            direction = start > end ? 2 : 6;
            n = direction == 2 ? 0 - 15 : 15;
        }
        else if (y1 == y2 && x1 != x2) {
            direction = start > end ? 0 : 4;
            n = direction == 0 ? 0 - 1 : 1;
        }
        else if (Math.abs(y1 - y2) == Math.abs(x1 - x2) && x1 != x2) {
            direction = start > end ? (x1 > x2 ? 1 : 3) : (x1 > x2 ? 7 : 5);
            n = direction == 1 ? 0 - 15 - 1 : direction == 3 ? 0 - 15 + 1 : direction == 5 ? 15 + 1 : 15 - 1;
        }
        else {
            return;
        }
        for (let idx = start; idx != end; idx += n) {
            P.push(idx);
        }
        P.push(end);
        let mkLine = new markLine(P, color, direction);
        lines.push(mkLine);
        this.printMarkLine(mkLine);
        return mkLine;
    }



    //棋盘上清空一个棋子,标记的显示
    CheckerBoard.prototype.clePoint = function(idx, refresh, width, height) {
        if (!refresh) this.P[idx].cle(); // 清除点的数据
        // 棋盘上打印空点
        let p = tempp,
            ctx = this.canvas.getContext("2d"),
            x,
            y;
        p.setxy(this.P[idx].x, this.P[idx].y);
        width = width || this.gW + 1;
        height = height || this.gH + 1;
        x = p.x - (width / 2);
        y = p.y - (height / 2);
        if (x < 0) {
            width += x;
            x = 0;
        }
        if (y < 0) {
            height += y;
            y = 0;
        }
        if (x + width > this.bakCanvas.width) {
            width = this.bakCanvas.width - x;
        }
        if (y + height > this.bakCanvas.height) {
            height = this.bakCanvas.height - y;
        }
        (0 <= idx && idx <= 224) && ctx.drawImage(this.bakCanvas, x, y, width, height, x, y, width, height);
        ctx = null;
        if (appData.renjuSave && !refresh) appData.renjuSave(this);
    };



    CheckerBoard.prototype.clePointB = function(idx, width, height) {
        this.clePoint(idx, true, width, height);
    }



    //裁剪指定canvas一块区域的图像，返回包含新图像的canvas;
    CheckerBoard.prototype.cutToCanvas = function(originCanvas, x, y, width, height) {
        let c = this.cutCanvas,
            ctx = c.getContext("2d");
        c.width = width;
        c.height = height;
        ctx.drawImage(originCanvas, x, y, width, height, 0, 0, width, height);
        ctx = null;
        return c;
    };
    
    
    CheckerBoard.prototype.getViewBoxRect = function(scale = 1) {
        return {
            x: ~~(this.viewBox.scrollLeft / this.scale * scale),
            y: ~~(this.viewBox.scrollTop / this.scale * scale),
            width: ~~(this.width / this.scale * scale),
            height: ~~(this.height / this.scale * scale)
        }
    }
    
    
    CheckerBoard.prototype.cutViewBox = function() {
        let rect = this.getViewBoxRect();
        return this.cutToCanvas(this.canvas, rect.x, rect.y, rect.width, rect.height)
    }


    CheckerBoard.prototype.drawLineStart = function(idx, color, cmd) {

        const SIN45 = 0.707105;
        let s = this.drawLine.startPoint.style;
        if (this.startIdx < 0) {
            //log(`offsetLeft=${this.canvas.offsetLeft}, offsetTop=${this.canvas.offsetTop}`)
            if (idx < 0 || idx >= this.P.length) return;
            s.width = this.gW / 3 + "px";
            s.height = this.gW / 3 + "px";
            s.borderWidth = this.gW / 6 + "px";
            s.borderColor = "white";
            s.left = this.P[idx].x - this.gW / 3 + this.canvas.offsetLeft + "px";
            s.top = this.P[idx].y - this.gW / 3 + this.canvas.offsetTop + "px";
            s.backgroundColor = color;
            s.zIndex = 0;
            this.startIdx = idx;
            this.drawLine.startPoint.setAttribute("class", "startPoint");

            let x = idx % 15;
            let y = ~~(idx / 15);
            let lw = x;
            let rw = this.SLTX - 1 - x;
            let uh = y;
            let bh = this.SLTY - 1 - y;
            for (let i = 0; i < 4; i++) {

                let lWidth, rWidth;
                this.parentNode.appendChild(this.drawLine.dashedLine[i]);
                s = this.drawLine.dashedLine[i].style;
                s.borderWidth = this.gW / 20 + "px";
                s.height = this.gW / 20 + "px";
                s.top = this.P[idx].y - this.gW * 3 / 40 + this.canvas.offsetTop + "px";
                s.borderColor = color;
                s.backgroundColor = "white";
                switch (i) {
                    case 0:
                        s.width = this.gW * (this.SLTX - 1) + "px";
                        s.left = this.P[idx].x - this.gW * lw - parseInt(s.borderWidth) + this.canvas.offsetLeft + "px";
                        break;
                    case 1:
                        s.width = this.gH * (this.SLTY - 1) + "px";
                        s.left = this.P[idx].x - this.gH * uh - parseInt(s.borderWidth) + this.canvas.offsetLeft + "px";
                        s.transformOrigin = `${~~(this.gH * uh+parseInt(s.borderWidth))}px ${this.gW*3/40}px`;
                        s.transform = `rotate(${90}deg)`;
                        break;
                    case 2:
                        lWidth = min(lw, uh);
                        rWidth = min(rw, bh);
                        s.width = this.gW * (lWidth + rWidth) / SIN45 + "px";
                        s.left = this.P[idx].x - this.gW * lWidth / SIN45 - parseInt(s.borderWidth) + this.canvas.offsetLeft + "px";
                        s.transformOrigin = `${~~(this.gW * lWidth/SIN45)+parseInt(s.borderWidth)}px ${this.gW*3/40}px`;
                        s.transform = `rotate(${45}deg)`;
                        break;
                    case 3:
                        lWidth = min(lw, bh);
                        rWidth = min(rw, uh);
                        s.width = this.gH * (lWidth + rWidth) / SIN45 + "px";
                        s.left = this.P[idx].x - this.gH * lWidth / SIN45 - parseInt(s.borderWidth) + this.canvas.offsetLeft + "px";
                        s.transformOrigin = `${~~(this.gH * lWidth / SIN45)+parseInt(s.borderWidth)}px ${this.gW*3/40}px`;
                        s.transform = `rotate(${-45}deg)`;
                        break;
                }
                s.opacity = 0.5;
                s.zIndex = 0;
                //log(`left=${s.left}, top=${s.top}, width=${s.width}, height=${s.height}`)
            }

            this.selectIdx = findIdx(this.ARROWS, idx);
            let mk = null;
            if (this.selectIdx + 1) {
                this.selectArrow = true;
                mk = this.ARROWS[this.selectIdx];
            }
            else {
                this.selectIdx = findIdx(this.LINES, idx);
                if (this.selectIdx + 1) {
                    this.selectLine = true;
                    mk = this.LINES[this.selectIdx];
                }
            }

            if (mk) {
                let x = this.P[mk.P[mk.P.length - 1]].x;
                let y = this.P[mk.P[mk.P.length - 1]].y;
                this.drawLine.selectDiv.onmousedown = function() {
                    //log(1);
                }
                this.parentNode.appendChild(this.drawLine.selectDiv);
                s = this.drawLine.selectDiv.style;
                s.borderWidth = this.getMarkLineWidth() + "px";
                s.borderColor = mk.color;
                s.width = mk.direction & 1 ? this.gW * (mk.P.length - 1) / SIN45 + "px" : this.gW * (mk.P.length - 1) + "px";
                s.height = this.gH / 2 + "px";
                s.left = x - parseInt(s.borderWidth) + this.canvas.offsetLeft + "px";
                s.top = y - parseInt(s.height) / 2 - parseInt(s.borderWidth) + this.canvas.offsetTop + "px";
                s.transformOrigin = `${parseInt(s.borderWidth)}px ${parseInt(s.height)/2+parseInt(s.borderWidth)}px`;
                s.transform = `rotate(${45*mk.direction}deg)`;
                s.zIndex = 0;
                this.drawLine.selectDiv.setAttribute("class", "selectLine");
            }
            this.parentNode.appendChild(this.drawLine.startPoint);

            this.setScale(1);

        }
        else {
            let cancel = false;
            if (this.selectArrow) {
                cancel = this.ARROWS[this.selectIdx].P.indexOf(idx) + 1;
                if (cancel) this.removeMarkArrow(this.selectIdx);
            }
            else if (this.selectLine) {
                cancel = this.LINES[this.selectIdx].P.indexOf(idx) + 1;
                if (cancel) this.removeMarkLine(this.selectIdx);
            }
            if (!cancel && cmd == "arrow") {
                this.createMarkArrow(this.startIdx, idx, color);
            }
            else if (!cancel && cmd == "line") {
                this.createMarkLine(this.startIdx, idx, color);
            }

            this.drawLineEnd();
        }

        function findIdx(lineOrArrow, idx) {
            for (let i = lineOrArrow.length - 1; i >= 0; i--) {
                if (lineOrArrow[i].P.indexOf(idx) + 1) {
                    return i;
                }
            }
            return -1;
        }

        function min(num1, num2) {
            return num1 < num2 ? num1 : num2;
        }
    }



    CheckerBoard.prototype.drawLineEnd = function() {

        this.drawLine.startPoint.style.zIndex = -100;
        this.drawLine.selectDiv.style.zIndex = -100;
        if (this.drawLine.startPoint.parentNode) this.drawLine.startPoint.parentNode.removeChild(this.drawLine.startPoint);
        if (this.drawLine.selectDiv.parentNode) this.drawLine.selectDiv.parentNode.removeChild(this.drawLine.selectDiv);
        for (let i = 0; i < 4; i++) {
            this.drawLine.dashedLine[i].style.zIndex = -100;
            if (this.drawLine.dashedLine[i].parentNode) this.drawLine.dashedLine[i].parentNode.removeChild(this.drawLine.dashedLine[i]);
        }
        this.startIdx = -1;
        this.selectIdx = -1;
        this.selectArrow = false;
        this.selectLine = false;
        this.drawLine.startPoint.setAttribute("class", "none");
        this.drawLine.selectDiv.setAttribute("class", "none");
    }



    //判断用户点击了棋盘上面的哪一个点，在返回这个点的index
    CheckerBoard.prototype.getPIndex = function(x, y) {

        let i;
        let j;
        if (this.isOut(x, y, this.viewBox)) return -1;

        let p = tempp;
        p.setxy(x, y); // page 坐标 转 canvas 坐标
        this.xyPageToObj(p, this.canvas);
        p.x = (this.viewBox.scrollLeft + p.x) / this.scale;
        p.y = (this.viewBox.scrollTop + p.y) / this.scale;

        x = p.x + ~~(this.gW / 2);
        y = p.y + ~~(this.gH / 2);
        i = ~~((x - this.XL) / this.gW);
        if (i == this.SLTX) i--;
        j = ~~((y - this.YT) / this.gH);
        if (j == this.SLTY) j--;
        return ~~(15 * j + i);

    };



    CheckerBoard.prototype.getCode = function() {
        let code = this.getMoves();
        code += "\n{" + this.getMoves(TYPE_BLACK) + "}";
        code += "{" + this.getMoves(TYPE_WHITE) + "}";
        return code;
    };

    CheckerBoard.prototype.getCodeURL = function() {
        let codeURL = this.getMoves();
        codeURL += "%" + this.getMoves(TYPE_BLACK);
        codeURL += "%" + this.getMoves(TYPE_WHITE);
        codeURL += "%" + this.size;
        codeURL += "%" + this.resetNum;
        return codeURL;
    };

    CheckerBoard.prototype.loadCodeURL = function(codeURL) {
        let code = codeURL.split("%"),
            moves = this.setMoves(code[0]) || "",
            blackMoves = this.setMoves(code[1]) || "",
            whiteMoves = this.setMoves(code[2]) || "",
            cBoardSize = parseInt(code[3]) < 6 ? 6 : parseInt(code[3]) > 15 ? 15 : parseInt(code[3]),
            resetNum = parseInt(code[4]);
        return {
            moves: moves,
            blackMoves: blackMoves,
            whiteMoves: whiteMoves,
            cBoardSize: cBoardSize,
            resetNum: resetNum
        }
    }


    // 当前棋盘显示的棋子， 转成棋谱 返回
    CheckerBoard.prototype.getMoves = function(type) {

        var ml = "";
        if (type == TYPE_WHITE || type == TYPE_BLACK) {
            for (let x = 0; x < this.SLTX; x++) {
                for (let y = 0; y < this.SLTY; y++) {
                    let idx = x + y * 15;
                    if (this.P[idx].type == type) {
                        ml += this.idxToName(idx);
                    }
                }
            }
        }
        else {
            for (let i = 0; i <= this.MSindex; i++) {
                ml = ml + this.idxToName(this.MS[i]);
            }
        }

        return ml;
    };



    // 传一个一维 空数组进来转成二维数组，把当前棋盘MS记录写入数组
    CheckerBoard.prototype.getArray2D = function() {
        let arr2D = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], []];

        for (let x = 0; x < 15; x++) {
            for (let y = 0; y < 15; y++) {
                let idx = x + y * 15;
                if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
                    arr2D[y][x] = -1;
                }
                else {
                    switch (this.P[idx].type) {
                        case TYPE_NUMBER:
                            arr2D[y][x] = this.P[idx].color == this.bNumColor ? 1 : 2;
                            break;
                        case TYPE_WHITE:
                            arr2D[y][x] = 2;
                            break;
                        case TYPE_BLACK:
                            arr2D[y][x] = 1;
                            break;
                        default:
                            arr2D[y][x] = 0;
                    }
                }
            }
        }
        return arr2D;
    };



    CheckerBoard.prototype.getArray = function() {
        let arr = new Array(225 + 1);
        for (let idx = 0; idx < 225; idx++) {
            let x = idx % 15,
                y = ~~(idx / 15);
            if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
                arr[idx] = -1;
            }
            else {
                switch (this.P[idx].type) {
                    case TYPE_NUMBER:
                        arr[idx] = this.P[idx].color == this.bNumColor ? 1 : 2;
                        break;
                    case TYPE_WHITE:
                        arr[idx] = 2;
                        break;
                    case TYPE_BLACK:
                        arr[idx] = 1;
                        break;
                    default:
                        arr[idx] = 0;
                }
            }
        }
        arr[225] = -1;
        return arr;
    };



    // 自动识别图片中的棋子
    CheckerBoard.prototype.autoPut = function() {

        let arr = getArr2D([], 0, this.SLTX, this.SLTY);
        let max = 0;
        let min = 255;
        let test = false;
        let cNum;
        let rgb;
        let idx;
        let wBoard = true; // 默认白色棋盘
        let ctx = this.canvas.getContext("2d");
        let imgData = ctx.getImageData(0, 0, this.width, this.height).data;

        for (let i = this.SLTY - 1; i >= 0; i--) {
            for (let j = this.SLTX - 1; j >= 0; j--) {
                idx = i * 15 + j;
                rgb = getPointColor(idx, this);
                //alert(rgb.r+"\n"+rgb.g+"\n"+rgb.b);
                cNum = (rgb.r + rgb.g + rgb.b) / 3;
                // 黑，白以外-1000，表示空子。
                //log(`cNum=${cNum}, ${j} - ${i} `);
                //log(`r=${rgb.r},g=${rgb.g}, b=${rgb.b}`);
                if (Math.abs(rgb.r - rgb.g) < 60 && Math.abs(rgb.r - rgb.b) < 60 && Math.abs(rgb.g - rgb.b) < 60) {
                    arr[i][j] = cNum;
                    max = cNum > max ? cNum : max; // 设置最白，最黑
                    min = cNum < min ? cNum : min;
                }
                else {
                    arr[i][j] = -1000;
                    wBoard = false;
                }
            }
        }

        //alert("end");
        //log("max="+max);
        //log("min="+min);
        //log("wBoard="+wBoard);


        imgData = null;
        ctx = null;
        // 棋盘上只有一种颜色时重新设置 max，min
        if (Math.abs(max - min) < 30) {
            if ((max + min) / 2 < 128) {
                max = 255;
            }
            else {
                min = 0;
            }
        }
        for (let i = this.SLTY - 1; i >= 0; i--) {
            for (let j = this.SLTX - 1; j >= 0; j--) {
                idx = i * 15 + j;
                if (Math.abs(arr[i][j] - max) < (wBoard || max > 250 ? 20 : 50)) {
                    //arr[i][j] = 2;
                    this.P[idx].printNb(EMOJI_STAR_BLACK, "white", this.gW, this.gH, this.wNumColor);
                }
                else if (Math.abs(arr[i][j] - min) < (wBoard || min < 5 ? 30 : 60)) {
                    //arr[i][j] = 1;
                    this.P[idx].printNb(EMOJI_STAR_BLACK, "black", this.gW, this.gH, this.bNumColor);
                }
                else if (test) {
                    this.P[idx].printNb(EMOJI_TRIANGLE_BLACK, "black", this.gW, this.gH, this.bNumColor);
                }
            }
        }



        //取得一个点的平均颜色
        function getPointColor(idx, cBoard) {

            //alert("getPointc");
            let width = ~~(cBoard.width);
            let w = ~~(cBoard.gW / 2);
            let h = ~~(cBoard.gH / 2);
            let l = ~~(cBoard.P[idx].x + (cBoard.gW - w) / 2 - cBoard.gW / 2);
            let t = ~~(cBoard.P[idx].y + (cBoard.gH - h) / 2 - cBoard.gH / 2);
            let r = 0;
            let g = 0;
            let b = 0;
            let arr = []; //  记录彩色
            let narr = []; // 记录黑白色

            for (let i = 0; i < w; i++) {
                arr[i] = [];
                for (let j = 0; j < h; j++) {
                    //let black = (i>w/4*1.5 && i<w/4*2.5 || j>h/4*1.5 && j<h/4*2.5) && c[0]<50 && c[1]<50 && c[2]<50 ? -38 : 0;
                    arr[i][j] = [];
                    arr[i][j][0] = imgData[(width * (t + j) + l + i) * 4];
                    arr[i][j][1] = imgData[(width * (t + j) + l + i) * 4 + 1];
                    arr[i][j][2] = imgData[(width * (t + j) + l + i) * 4 + 2];
                    arr[i][j][3] = imgData[(width * (t + j) + l + i) * 4 + 3];
                    r += arr[i][j][0];
                    g += arr[i][j][1];
                    b += arr[i][j][2];
                }
            }

            //alert("Set arr end");
            if (isLine((r + g + b) / h / w / 3, cBoard)) {
                //log("line");
                return ({ r: 255, g: 125, b: 255 }); //网格, 无棋子
            }
            else if (isLine((r + g + b) / h / w / 3 + 18, cBoard)) {
                //log("line");
                return ({ r: 255, g: 125, b: 255 }); //网格, 无棋子
            }
            else if (isLine((r + g + b) / h / w / 3 - 18, cBoard)) {
                //log("line");
                return ({ r: 255, g: 125, b: 255 }); //网格, 无棋子
            }
            else {
                //log("not Line");
                return ({ r: r / w / h, g: g / w / h, b: b / w / h }); //不是网格
            }



            function isLine(cnum, cboard) {
                let tx;
                let ty; //网格的x，y 线
                let x = idx % 15;
                let y = ~~(idx / 15);
                let count = 0; // 记录黑点
                let c;
                for (let i = 0; i < w; i++) {
                    narr[i] = [];
                    for (let j = 0; j < h; j++) {
                        c = arr[i][j];
                        if (c[0] < cnum && c[1] < cnum && c[2] < cnum) {
                            narr[i][j] = 1;
                            count++;
                        }
                        else {
                            narr[i][j] = 0;
                        }
                    }
                }
                if (count > w * h / 8 * 3) return false;

                /*
                    // 测试
                let str = idx+"\n";
                for (let j=0; j<h; j++)  {
                    for (let i=0; i<w; i++)  {
                        str+=narr[i][j];
                    }
                    str+="\n"
                }
                //alert(str)
                */

                // 针对白底棋盘，搜索棋盘网格线
                if (y == null) {
                    x = idx % 15;
                    y = ~~(idx / 15);
                }

                if (x == 0) {
                    if (idx == 0) {
                        if (right() && buttom()) return true;
                    }
                    else if (idx == 15 * (cboard.SLTY - 1)) {
                        if (right() && top()) return true;
                    }
                    else {
                        if (right() && buttom() && top()) return true;
                    }
                }
                else if (x == cboard.SLTX - 1) {
                    if (idx == cboard.SLTX - 1) {
                        if (left() && buttom()) return true;
                    }
                    else if (idx == 15 * cboard.SLTY - 1) {
                        if (left() && top()) return true;
                    }
                    else {
                        if (left() && top() && buttom()) return true;
                    }
                }
                else if (y == 0) {
                    if (left() && right() && buttom()) return true;
                }
                else if (y == cboard.SLTY - 1) {
                    if (left() && right() && top()) return true;
                }
                else {
                    if (left() && right() && top() && buttom()) return true;
                }

                function left() {
                    let i;
                    let j;
                    for (i = 0; i < h; i++) {
                        let c = narr[0][i];
                        if (c == 1) {
                            if (ty != null) {
                                if (Math.abs(i - ty) > h * 0.3 || Math.abs(i - ty) == 0) { return false; }
                            }
                            else {
                                ty = i;
                            }
                            for (j = 1; j < w / 5; j++) {
                                c = narr[j][i];
                                if (c == 0 && narr[j + 2][i] == 0 && !(narr[j + 3][i] == 1 && narr[j + 4][i] == 1 && narr[j + 5][i] == 1)) break;
                            }
                            if (j >= w / 5) return true;
                            return false;
                        }
                    }
                    //alert("__left")
                }

                function right() {
                    let i;
                    let j;
                    for (i = h - 1; i >= 0; i--) {
                        let c = narr[w - 1][i];
                        if (c == 1) {
                            if (ty != null) {
                                if (Math.abs(i - ty) > h * 0.3 || Math.abs(i - ty) == 0) { return false; }
                            }
                            else {
                                ty = i;
                            }
                            for (j = w - 2; j > w * 4 / 5; j--) {
                                c = narr[j][i];
                                if (c == 0 && narr[j - 2][i] == 0 && !(narr[j - 3][i] == 1 && narr[j - 4][i] == 1 && narr[j - 5][i] == 1)) break;
                            }
                            if (j <= w * 4 / 5) return true;
                            return false;
                        }
                    }
                    //alert("__right")
                }

                function top() {
                    let i;
                    let j;
                    for (i = 0; i < w; i++) {
                        let c = narr[i][0];
                        if (c == 1) {
                            if (tx != null) {
                                if (Math.abs(i - tx) > w * 0.3 || Math.abs(i - tx) == 0) { return false; }
                            }
                            else {
                                tx = i;
                            }
                            for (j = 1; j < h / 5; j++) {
                                c = narr[i][j];
                                if (c == 0 && narr[i][j + 2] == 0 && !(narr[i][j + 3] == 1 && narr[i][j + 4] == 1 && narr[i][j + 5] == 1)) break;
                            }
                            if (j >= h / 5) return true;
                            return false;
                        }
                    }
                    //alert("__top")
                }

                function buttom() {
                    let i;
                    let j;
                    for (i = w - 1; i >= 0; i--) {
                        let c = narr[i][h - 1];
                        if (c == 1) {
                            if (tx != null) {
                                if (Math.abs(i - tx) > w * 0.3 || Math.abs(i - tx) == 0) { return false; }
                            }
                            else {
                                tx = i;
                            }
                            for (j = h - 2; j > h * 4 / 5; j--) {
                                c = narr[i][j];
                                if (c == 0 && narr[i][j - 2] == 0 && !(narr[i][j - 3] == 1 && narr[i][j - 4] == 1 && narr[i][j - 5] == 1)) break;
                            }
                            if (j <= h * 4 / 5) return true;
                            return false;
                        }
                    }
                    //alert("__buttom")
                }
            }

        }

    };

    CheckerBoard.prototype.getBoardPointInfo = function(idx, showNum) {
        let txt = "",
            x = this.P[idx].x,
            y = this.P[idx].y,
            w = Math.min(this.gW, this.gH) / 2 * 0.85,
            fontSize = ~~(w * 1.08),
            radius = w,
            pointInfo;
                    
        let type = this.P[idx].type;
        if (type == TYPE_NUMBER || type == TYPE_WHITE || type == TYPE_BLACK) {
            if (showNum && this.P[idx].text) { // 显示数字
                txt = this.P[idx].type == TYPE_NUMBER ? String(parseInt(this.P[idx].text) - this.resetNum) : this.P[idx].text;
                txt = parseInt(txt) < 1 ? "" : txt;
            }
            pointInfo = {
                circle: {
                    x: x,
                    y: y,
                    radius: radius,
                    color: "black",
                    lineWidth: this.lineStyle == "bolder" ? w/9 : this.lineStyle == "bold" ? w/15 : 1,
                    fill: this.P[idx].color
                },
                text: {
                    txt: txt,
                    x: x,
                    y: y,
                    color: this.P[idx].color == this.wNumColor ? this.wNumFontColor : this.bNumFontColor,
                    weight: "bolder",
                    family: "mHeiTi",
                    size: fontSize
                }
            }
        }
        else {
            txt = this.P[idx].text || "";
            radius = this.P[idx].bkColor || this.P[idx].type == TYPE_MARKFOUL ? w : txt.length > 1 ? w * 0.8 : w / 2;
            if (txt.length == 1) { // 两位数数数字不需要放大字体
                let code = txt.charCodeAt();// 再把一位数字排除
                if (code < "0".charCodeAt() || code > "9".charCodeAt()) {
                    switch (txt) {
                        case EMOJI_TRIANGLE_BLACK:
                        case EMOJI_SQUARE_BLACK:
                        case EMOJI_STAR:
                        case EMOJI_ROUND_DOUBLE:
                        case EMOJI_FORK:
                            fontSize = ~~(w * 1.1);
                            break;
                        default: // 把数字和特殊标记排除，其它一位字符统一放大字体
                            fontSize = ~~(w * 1.5);
                            break;
                    }
                }
            }
            else if (txt.length == 3) {
                fontSize = ~~(w * 0.9);
            }
            pointInfo = {
                circle: {
                    x: x,
                    y: y,
                    radius: radius,
                    color: this.P[idx].bkColor || this.LbBackgroundColor,
                    lineWidth: 0,
                    fill: this.P[idx].bkColor || this.LbBackgroundColor
                },
                text: {
                    txt: txt,
                    x: x,
                    y: y,
                    color: this.P[idx].color,
                    weight: "bolder",
                    family: "mHeiTi",
                    size: fontSize
                }
            }
        }
        
        if (idx == this.MS[this.MSindex] && !this.notShowLastNum) {
            pointInfo.text.color = this.P[idx].color == this.wNumColor ? this.wLastNumColor : this.bLastNumColor;
            if (!showNum) {
                let w = Math.min(this.gW, this.gH) / 2 * 0.85;
                pointInfo.text.txt = "◤";
                pointInfo.text.x -= w * 0.15;
                pointInfo.text.y -= w * 0.15;
            }
        }
        return pointInfo;
    }

    CheckerBoard.prototype.getBoardLinesInfo = function() {
        let boardLines = [],
            normalLineWidth = this.lineStyle == "bolder" ? Math.min(this.gW, this.gH) / 18 : this.lineStyle == "bold" ? Math.min(this.gW, this.gH) / 23 : this.width / 500,
            boldLineWidth = normalLineWidth * 2;
        for (let i = 0; i < this.SLTX; i++) {
            let lineWidth = i == 0 || i == (this.SLTX - 1) ? boldLineWidth : normalLineWidth,
                x1 = this.P[i].x,
                y1 = this.P[i].y,
                x2 = this.P[i + (this.SLTY - 1) * 15].x,
                y2 = this.P[i + (this.SLTY - 1) * 15].y;
            boardLines.push({ x1: x1, y1: y1, x2: x2, y2: y2, color: this.lineColor, lineWidth: lineWidth })
        }
        // 划横线
        for (let j = 0; j < this.SLTY*15; j+=15) {
            let lineWidth = j == 0 || j == (this.SLTY - 1)*15 ? boldLineWidth : normalLineWidth,
                x1 = this.P[j].x,
                y1 = this.P[j].y,
                x2 = this.P[j + (this.SLTX - 1)].x,
                y2 = this.P[j + (this.SLTX - 1)].y;
            boardLines.push({ x1: x1, y1: y1, x2: x2, y2: y2, color: this.lineColor, lineWidth: lineWidth })
        }
        return boardLines;
    }

    CheckerBoard.prototype.getStarPointsInfo = function() {
        let points = ALL_STAR_POINTS[this.size],
            circles = [];
        for (let i = points.length - 1; i >= 0; i--) {
            circles.push({
                x: this.P[points[i]].x,
                y: this.P[points[i]].y,
                radius: this.getBoardLinesInfo()[1].lineWidth*3,
                color: this.lineColor,
                lineWidth: 0,
                fill: this.lineColor
            });
        }
        return circles;
    }

    CheckerBoard.prototype.getCoordinateInfo = function() {
        let textArr = [],
            m;
        for (let i = 0; i < this.SLTX; i++) {
            for (let j = 0; j <= 15 * (this.SLTY - 1); j += 15 * (this.SLTY - 1)) {
                m = j == 0 ? -this.gH : this.gH;
                textArr.push({
                    txt: this.alpha.charAt(i),
                    x: this.P[i + j].x,
                    y: this.P[i + j].y + m,
                    color: this.coordinateColor,
                    weight: "normal",
                    family: "mHeiTi",
                    size: ~~(this.gW * 0.5)
                })
            }
        }
        for (let i = 0; i < this.SLTY; i++) {
            for (let j = 0; j <= this.SLTX - 1; j += this.SLTX - 1) {
                m = j == 0 ? -this.gW : this.gW;
                textArr.push({
                    txt: String(this.SLTY - i),
                    x: this.P[i * 15 + j].x + m,
                    y: this.P[i * 15 + j].y,
                    color: this.coordinateColor,
                    weight: "normal",
                    family: "mHeiTi",
                    size: ~~(this.gW * 0.5)
                })
            }
        }
        return textArr;
    }
    

    CheckerBoard.prototype.printLine = function({x1, y1, x2, y2, color, lineWidth}, ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    CheckerBoard.prototype.printLinePDF = function({x1, y1, x2, y2, color, lineWidth}, doc, scale) {
        /*const middleX = (x, l, r) => (x < l ? l : x > r ? r : x) - l,
            middleY = (y, t, b) => (y < t ? t : y > b ? b : y) - t;
        let rect = this.getViewBoxRect(),
            l = rect.x,
            r = rect.x + rect.width,
            t = rect.y,
            b = rect.y + rect.height;
        x1 = middleX(x1, l, r) * this.scale;
        x2 = middleX(x2, l, r) * this.scale;
        y1 = middleY(y1, t, b) * this.scale;
        y2 = middleY(y2, t, b) * this.scale;*/
        
        doc.setLineWidth(~~(lineWidth * scale + 1));
        doc.setDrawColor(color);
        doc.line(~~(x1 * scale + this.pdfOriginPoint.x), ~~(y1 * scale + this.pdfOriginPoint.y), ~~(x2 * scale + this.pdfOriginPoint.x), ~~(y2 * scale + this.pdfOriginPoint.y));
    }

    CheckerBoard.prototype.printLineSVG = function({x1, y1, x2, y2, color, lineWidth}, scale) {
        return `<line x1="${~~(x1*scale)}" y1="${~~(y1*scale)}" x2="${~~(x2*scale)}" y2="${~~(y2*scale)}" stroke="${color}" stroke-width="${~~(lineWidth*scale + 1)}"/>`;
    }

    CheckerBoard.prototype.printCircle = function({x, y, radius, color, lineWidth, fill}, ctx) {
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = color;
        lineWidth && ctx.stroke();
    }

    CheckerBoard.prototype.printCirclePDF = function({x, y, radius, color, lineWidth, fill}, doc, scale) {
        doc.setLineWidth(~~(lineWidth * scale + 1));
        doc.setDrawColor(color);
        doc.setFillColor(fill);
        doc.circle(~~(x * scale + this.pdfOriginPoint.x), ~~(y * scale + this.pdfOriginPoint.y), ~~(radius * scale), lineWidth?"DF":"F");
    }

    CheckerBoard.prototype.printCircleSVG = function({x, y, radius, color, lineWidth, fill}, scale) {
        return `<circle cx="${~~(x*scale)}" cy="${~~(y*scale)}" r="${~~(radius*scale)}" ${lineWidth ? `stroke="${color}" stroke-width="${~~(lineWidth*scale + 1)}"` : ""} fill="${fill}"/>`;
    }

    CheckerBoard.prototype.printText = function({txt, x, y, color, weight, family, size}, ctx) {
        ctx.font = `${weight} ${size}px ${family}`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(txt, x, y);
    }

    CheckerBoard.prototype.printTextPDF = function({txt, x, y, color, weight, family, size}, doc, scale) {
        let fontName_normal = "PFSCMedium", //"arial";
            fontName_bold = "PFSCHeavy";    //"arial";
        txt = txt.split("").map(char => char==EMOJI_FOUL?"×":char).join("")
        doc.setTextColor(color);
        doc.setFont(weight == "bolder" ? fontName_bold : fontName_normal, "normal", "normal");
        doc.setFontSize(~~(size * scale));
        doc.text(txt, ~~(x * scale + this.pdfOriginPoint.x), ~~(y * scale + this.pdfOriginPoint.y), {baseline: "middle", align: "center"});
    }

    CheckerBoard.prototype.printTextSVG = function({txt, x, y, color, weight, family, size}, scale) {
        family = "黑体"
        return !txt ? "" : `<text x="${~~(x*scale)}" y="${~~(y*scale)}" stroke="${color}" fill="${color}" font-weight="${weight}" font-family="${family}" font-size="${~~(size*scale)}" text-anchor="middle" dominant-baseline="central">${txt}</text>`;
    }

    CheckerBoard.prototype.printTriangle = function({points, color}, ctx) {
        ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
        points.map(point => ctx.lineTo(point.x, point.y));
        ctx.fillStyle = color;
        ctx.fill();
    }

    CheckerBoard.prototype.printTrianglePDF = function({points, color}, doc, scale) {
        let x1 = ~~(points[0].x * scale + this.pdfOriginPoint.x),
            y1 = ~~(points[0].y * scale + this.pdfOriginPoint.y),
            x2 = ~~(points[1].x * scale + this.pdfOriginPoint.x),
            y2 = ~~(points[1].y * scale + this.pdfOriginPoint.y),
            x3 = ~~(points[2].x * scale + this.pdfOriginPoint.x),
            y3 = ~~(points[2].y * scale + this.pdfOriginPoint.y);
        doc.setFillColor(color);
        doc.triangle(x1, y1, x2, y2, x3, y3, 'F');
    }

    CheckerBoard.prototype.printTriangleSVG = function({points, color}, scale) {
        let pointStr = points.reduce((pre, cur) => `${pre}${~~(cur.x*scale)}, ${~~(cur.y*scale)} `, "")
        return `<polygon points="${pointStr}" style="fill:${color}"/>`;
    }
    
    CheckerBoard.prototype.printBoardPointsPDF = function(doc, scale) {
        for (let i = 0; i < 225; i++) {
            if (this.P[i].type != TYPE_EMPTY) {
                let pointInfo = this.getBoardPointInfo(i, this.isShowNum);
                this.printCirclePDF(pointInfo.circle, doc, scale);
                this.printTextPDF(pointInfo.text, doc, scale);
            }
        }
    }

    CheckerBoard.prototype.printBoardPointsSVG = function(scale) {
        let svgText = "";
        for (let i = 0; i < 225; i++) {
            if (this.P[i].type != TYPE_EMPTY) {
                let pointInfo = this.getBoardPointInfo(i, this.isShowNum);
                svgText += this.printCircleSVG(pointInfo.circle, scale);
                svgText += this.printTextSVG(pointInfo.text, scale);
            }
        }
        return svgText;
    }
    
    CheckerBoard.prototype.printMarkLinesPDF = function(doc, scale, lines = this.LINES) {
        let x1, x2, y1, y2;
        for (let i = 0; i < lines.length; i++) {
            let points = this.getMarkLinePoints(lines[i]);
            x1 = points.line[0].x;
            x2 = points.line[1].x;
            y1 = points.line[0].y;
            y2 = points.line[1].y;
            this.printLinePDF({x1: x1, y1: y1, x2: x2, y2: y2, color: lines[i].color, lineWidth: ~~this.getMarkLineWidth()}, doc, scale);
        }
    }
    
    CheckerBoard.prototype.printMarkLinesSVG = function(scale, lines = this.LINES) {
        let x1, x2, y1, y2, svgText = "";
        for (let i = 0; i < lines.length; i++) {
            let points = this.getMarkLinePoints(lines[i]);
            x1 = points.line[0].x;
            x2 = points.line[1].x;
            y1 = points.line[0].y;
            y2 = points.line[1].y;
            svgText += this.printLineSVG({x1: x1, y1: y1, x2: x2, y2: y2, color: lines[i].color, lineWidth: ~~this.getMarkLineWidth()}, scale);
        }
        return svgText;
    }
    
    CheckerBoard.prototype.printMarkArrowsPDF = function(doc, scale, arrows = this.ARROWS) {
        let x1, x2, y1, y2;
        for (let i = 0; i < arrows.length; i++) {
            let points = this.getMarkArrowPoints(arrows[i]);
            x1 = points.line[0].x;
            x2 = points.line[1].x;
            y1 = points.line[0].y;
            y2 = points.line[1].y;
            this.printLinePDF({x1: x1, y1: y1, x2: x2, y2: y2, color: arrows[i].color, lineWidth:~~this.getMarkLineWidth()}, doc, scale);
            this.printTrianglePDF({points: points.arrow, color: arrows[i].color}, doc, scale);
        }
    }

    CheckerBoard.prototype.printMarkArrowsSVG = function(scale, arrows = this.ARROWS) {
        let x1, x2, y1, y2, svgText = "";
        for (let i = 0; i < arrows.length; i++) {
            let points = this.getMarkArrowPoints(arrows[i]);
            x1 = points.line[0].x;
            x2 = points.line[1].x;
            y1 = points.line[0].y;
            y2 = points.line[1].y;
            svgText += this.printLineSVG({x1: x1, y1: y1, x2: x2, y2: y2, color: arrows[i].color, lineWidth:~~this.getMarkLineWidth()}, scale);
            svgText += this.printTriangleSVG({points: points.arrow, color: arrows[i].color}, scale);
        }
        return svgText;
    }

    // 把棋盘图片转成SVG,返回SVG代码
    CheckerBoard.prototype.getSVG = function() {
        let svgSize = 800,
            scale = svgSize / this.canvas.width,
            viewBox = this.getViewBoxRect(scale),
            svgText = `<svg role="img" xmlns="http://www.w3.org/2000/svg" style ="width:100%;height:100%;background-color:#ffffff" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}" version="1.1"><clipPath id="clip"><rect x="${viewBox.x}" y="${viewBox.y}" width="${viewBox.width}" height="${viewBox.height}" /></clipPath><g style="clip-path: url(#clip);">`;
        svgText += this.refreshCheckerBoardSVG(scale);
        svgText += "</g></svg>";
        return svgText;
    };



    // 顺序棋盘上棋子，隐藏手数
    CheckerBoard.prototype.hideNum = function() {

        let color;
        for (let i = 0; i <= this.MSindex; i++)
        {
            color = (i & 1) ? this.wNumColor : this.bNumColor;
            this.printPoint(this.MS[i]);
            this.refreshMarkArrow(this.MS[i]);
        }

    };



    CheckerBoard.prototype.hideCutDiv = function() {

        this.cutDiv.style.borderStyle = "none";
        this.cutDiv.style.zIndex = -100;
    };



    // P 数组的index ，转字母数字坐标
    CheckerBoard.prototype.idxToName = function(idx) {

        let x = (idx % 15);
        let y = ~~(idx / 15);
        //if (x < 0 || x >= this.size || y < 0 || y >= this.size)
        //return "--";
        //else
        return this.alpha.charAt(x) + (15 - y);
    };



    //  判断坐标是否出界，出界返回 true
    CheckerBoard.prototype.isOut = function(x, y, htmlObj, width) {
        width = width ? width : 0;
        let xL = 0 - width;
        let xR = xL + parseInt(htmlObj.style.width) + 2 * width;
        let yT = 0 - width;
        let yB = yT + parseInt(htmlObj.style.height) + 2 * width;
        let p = tempp;
        p.setxy(x, y);
        this.xyPageToObj(p, htmlObj);
        x = p.x;
        y = p.y;
        if (x < xL || x > xR || y < yT || y > yB) { // out cBoard
            return true;
        }
        return false;
    };



    CheckerBoard.prototype.nextColor = function() {
        return this.MSindex & 1 ? 1 : 2;
    }



    // 字母数字坐标，返回 P数组的index
    CheckerBoard.prototype.nameToIndex = function(name) {

        let x = name.toLowerCase().charCodeAt() - "a".charCodeAt();
        name = name.substr(1);
        let y = 15 - name; //转换成第一行为0，依次为1,2,3...
        return x + y * 15;

    };



    // 平移棋盘
    CheckerBoard.prototype.moveCheckerBoard = function(move) {
        let i;
        let j;
        let idx;
        switch (move) {
            case "left":
                for (i = 0; i < 15 * 15; i += 15) {
                    if (this.P[i].type != TYPE_EMPTY) break;
                }
                if (i < 15 * 15) return;
                // 转换MS数组
                this.MS.length = this.MSindex + 1;
                for (i = 0; i < this.MS.length; i++) {
                    if (this.MS[i] >= 0 && this.MS[i] <= 224)
                        this.MS[i] = this.MS[i] - 1;
                }
                // 复制棋盘每个落子点
                for (i = 1; i < 15; i++) {
                    for (j = 0; j < 15; j++) {
                        idx = i + j * 15;
                        copyP(this, idx - 1, idx);
                    }
                }
                break;
            case "right":
                for (i = 15 - 1; i < 15 * 15; i += 15) {
                    if (this.P[i].type != TYPE_EMPTY) break;
                }
                if (i < 15 * 15) return;
                this.MS.length = this.MSindex + 1;
                for (i = 0; i < this.MS.length; i++) {
                    if (this.MS[i] >= 0 && this.MS[i] <= 224)
                        this.MS[i] = this.MS[i] + 1;
                }
                for (i = 15 - 2; i >= 0; i--) {
                    for (j = 0; j < 15; j++) {
                        idx = i + j * 15;
                        copyP(this, idx + 1, idx);
                    }
                }
                break;
            case "top":
                for (i = 0; i < 15; i++) {
                    if (this.P[i].type != TYPE_EMPTY) break;
                }
                if (i < 15) return;
                this.MS.length = this.MSindex + 1;
                for (i = 0; i < this.MS.length; i++) {
                    if (this.MS[i] >= 0 && this.MS[i] <= 224)
                        this.MS[i] = this.MS[i] - 15;
                }
                for (i = 1; i < 15; i++) {
                    for (j = 0; j < 15; j++) {
                        idx = i * 15 + j;
                        copyP(this, idx - 15, idx);
                    }
                }
                break;
            case "bottom":
                for (i = 15 * (15 - 1); i < 15 * 15; i++) {
                    if (this.P[i].type != TYPE_EMPTY) break;
                }
                if (i < 15 * 15) return;
                this.MS.length = this.MSindex + 1;
                for (i = 0; i < this.MS.length; i++) {
                    if (this.MS[i] >= 0 && this.MS[i] <= 224)
                        this.MS[i] = this.MS[i] + 15;
                }
                for (i = 15 - 2; i >= 0; i--) {
                    for (j = 0; j < 15; j++) {
                        idx = i * 15 + j;
                        copyP(this, idx + 15, idx);
                    }
                }
                break;
        }

        this.removeMarkArrow("all");
        this.removeMarkLine("all");
        this.MSToMoves();
        //this.removeTree();
        //this.autoShow();

        // 复制一个点，同时打印出来
        function copyP(board, idx, idx1) {
            board.clePoint(idx);
            board.P[idx].text = board.P[idx1].text;
            board.P[idx].type = board.P[idx1].type;
            board.P[idx].color = board.P[idx1].color;
            if (board.P[idx].type != TYPE_EMPTY) {
                board.printPoint(idx, board.isShowNum);
                board.clePoint(idx1);
            }
        }
    };



    // MS 数组记录 转成棋谱代码
    CheckerBoard.prototype.MSToMoves = function() {

        this.Moves = "";
        for (let i = 0; i <= this.MSindex; i++) {
            this.Moves += this.idxToName(this.MS[i]);
        }

    };



    CheckerBoard.prototype.printArray = function(arr, txt, color) {

        let idx = 0;
        this.showFoul(false, true);
        this.showAutoLine(false, true);
        for (let y = 0; y < this.SLTY; y++) {
            for (let x = 0; x < this.SLTX; x++) {

                if (arr[y][x] > 0) {
                    this.wLb(y * 15 + x, txt, color, undefined, false);
                }
            }
        }
    };



    CheckerBoard.prototype.getMarkArrowPoints = function(markArrow, idx, cleArrow) {
        const SIN45 = 0.707105;
        let x = this.P[markArrow.P[0]].x;
        let y = this.P[markArrow.P[0]].y;
        let w = this.gW * 1.07 / 2;
        let h = this.gH * 1.07 / 2;
        let points = {
            line: [],
            arrow: [],
        };
        if (idx == undefined || idx == null) {
            points.line.push({ x: x, y: y });
            x = this.P[markArrow.P[markArrow.P.length - 1]].x;
            y = this.P[markArrow.P[markArrow.P.length - 1]].y;
            switch (markArrow.direction) {
                case 1:
                    x += w;
                    y += h;
                    break;
                case 3:
                    x -= w;
                    y += h;
                    break;
                case 5:
                    x -= w;
                    y -= h;
                    break;
                case 7:
                    x += w;
                    y -= h;
                    break;
                case 0:
                    x += w;
                    break;
                case 2:
                    y += h;
                    break;
                case 4:
                    x -= w;
                    break;
                case 6:
                    y -= h;
                    break;
            }
            points.line.push({ x: x, y: y });
            points.arrow = getArrow(this, markArrow.P[markArrow.P.length - 1], markArrow.color, markArrow.direction);
        }
        else {
            if (markArrow.P.indexOf(idx) == -1) return;
            let x1, x2, y1, y2;
            if (idx == markArrow.P[0]) {
                x1 = this.P[idx].x;
                y1 = this.P[idx].y;
                switch (markArrow.direction) {
                    case 0:
                        x2 = x1 - w;
                        y2 = y1;
                        break;
                    case 1:
                        x2 = x1 - w - 1;
                        y2 = y1 - h - 1;
                        break;
                    case 2:
                        x2 = x1;
                        y2 = y1 - h;
                        break;
                    case 3:
                        x2 = x1 + w + 1;
                        y2 = y1 - h - 1;
                        break;
                    case 4:
                        x2 = x1 + w;
                        y2 = y1;
                        break;
                    case 5:
                        x2 = x1 + w + 1;
                        y2 = y1 + h + 1;
                        break;
                    case 6:
                        x2 = x1;
                        y2 = y1 + h;
                        break;
                    case 7:
                        x2 = x1 - w - 1;
                        y2 = y1 + h + 1;
                        break;
                }
            }
            else if (idx == markArrow.P[markArrow.P.length - 1]) {
                x1 = this.P[idx].x;
                y1 = this.P[idx].y;
                switch (markArrow.direction) {
                    case 4:
                        x1 -= w;
                        x2 = x1 - w;
                        y2 = y1;
                        break;
                    case 5:
                        x1 -= w;
                        y1 -= h;
                        x2 = x1 - w - 1;
                        y2 = y1 - h - 1;
                        break;
                    case 6:
                        y1 -= h;
                        x2 = x1;
                        y2 = y1 - h;
                        break;
                    case 7:
                        x1 += w;
                        y1 -= h;
                        x2 = x1 + w + 1;
                        y2 = y1 - h - 1;
                        break;
                    case 0:
                        x1 += w;
                        x2 = x1 + w;
                        y2 = y1;
                        break;
                    case 1:
                        x1 += w;
                        y1 += h;
                        x2 = x1 + w + 1;
                        y2 = y1 + h + 1;
                        break;
                    case 2:
                        y1 += h;
                        x2 = x1;
                        y2 = y1 + h;
                        break;
                    case 3:
                        x1 -= w;
                        y1 += h;
                        x2 = x1 - w - 1;
                        y2 = y1 + h + 1;
                        break;
                }

            }
            else {
                x = this.P[idx].x;
                y = this.P[idx].y;
                if (markArrow.direction == 0 || markArrow.direction == 4) {
                    x1 = x - w;
                    y1 = y;
                    x2 = x + w;
                    y2 = y;
                }
                else if (markArrow.direction == 1 || markArrow.direction == 5) {
                    x1 = x - w - 1;
                    y1 = y - h - 1;
                    x2 = x + w + 1;
                    y2 = y + h + 1;
                }
                else if (markArrow.direction == 2 || markArrow.direction == 6) {
                    x1 = x;
                    y1 = y - h;
                    x2 = x;
                    y2 = y + h;
                }
                else {
                    x1 = x - w - 1;
                    y1 = y + h + 1;
                    x2 = x + w + 1;
                    y2 = y - h - 1;
                }
            }
            points.line.push({ x: x1, y: y1 });
            points.line.push({ x: x2, y: y2 });
            if (idx == markArrow.P[markArrow.P.length - 1]) points.arrow = getArrow(this, markArrow.P[markArrow.P.length - 1], markArrow.color, markArrow.direction);
        }
        return points;


        function getArrow(cBd, idx, color, direction) {

            let x1, x2, y1, y2;
            let tx, ty;
            let arrow = [];
            let lineWidth = cBd.gW / 8;
            lineWidth *= cleArrow ? 1.6 : 1;
            let arrowWidth = direction & 1 ? cBd.gW * 0.8 * SIN45 : cBd.gW * 0.8;
            let arrowHeight = direction & 1 ? lineWidth * 4 * SIN45 : lineWidth * 4;
            arrowWidth += cleArrow ? 1 : 0;
            arrowHeight += cleArrow ? 1 : 0;
            switch (direction) {
                case 0:
                    x1 = x2 = cBd.P[idx].x + arrowWidth;
                    y1 = cBd.P[idx].y - arrowHeight / 2;
                    y2 = cBd.P[idx].y + arrowHeight / 2;
                    break;
                case 1:
                    tx = cBd.P[idx].x + arrowWidth;
                    ty = cBd.P[idx].y + arrowWidth;
                    x1 = tx - arrowHeight / 2;
                    y1 = ty + arrowHeight / 2;
                    x2 = tx + arrowHeight / 2;
                    y2 = ty - arrowHeight / 2;
                    break;
                case 2:
                    x1 = cBd.P[idx].x - arrowHeight / 2;
                    x2 = cBd.P[idx].x + arrowHeight / 2;
                    y1 = y2 = cBd.P[idx].y + arrowWidth;
                    break;
                case 3:
                    tx = cBd.P[idx].x - arrowWidth;
                    ty = cBd.P[idx].y + arrowWidth;
                    x1 = tx - arrowHeight / 2;
                    y1 = ty - arrowHeight / 2;
                    x2 = tx + arrowHeight / 2;
                    y2 = ty + arrowHeight / 2;
                    break;
                case 4:
                    x1 = x2 = cBd.P[idx].x - arrowWidth;
                    y1 = cBd.P[idx].y - arrowHeight / 2;
                    y2 = cBd.P[idx].y + arrowHeight / 2;
                    break;
                case 5:
                    tx = cBd.P[idx].x - arrowWidth;
                    ty = cBd.P[idx].y - arrowWidth;
                    x1 = tx + arrowHeight / 2;
                    y1 = ty - arrowHeight / 2;
                    x2 = tx - arrowHeight / 2;
                    y2 = ty + arrowHeight / 2;
                    break;
                case 6:
                    x1 = cBd.P[idx].x - arrowHeight / 2;
                    x2 = cBd.P[idx].x + arrowHeight / 2;
                    y1 = y2 = cBd.P[idx].y - arrowWidth;
                    break;
                case 7:
                    tx = cBd.P[idx].x + arrowWidth;
                    ty = cBd.P[idx].y - arrowWidth;
                    x1 = tx - arrowHeight / 2;
                    y1 = ty - arrowHeight / 2;
                    x2 = tx + arrowHeight / 2;
                    y2 = ty + arrowHeight / 2;
                    break;
            }
            arrow.push({ x: cBd.P[idx].x, y: cBd.P[idx].y });
            arrow.push({ x: x1, y: y1 });
            arrow.push({ x: x2, y: y2 });
            return arrow;
        }

    }


    CheckerBoard.prototype.getMarkLineWidth = function() {
        return Math.min(this.gW, this.gH) / 8;
    }

    //print and clear
    CheckerBoard.prototype._printMarkArrow = function(markArrow, idx, cleArrow) {
        let arrowDrawPoints = this.getMarkArrowPoints(markArrow, idx, cleArrow);
        let ctx = this.canvas.getContext("2d");
        this.printLine({
            x1: arrowDrawPoints.line[0].x,
            y1: arrowDrawPoints.line[0].y,
            x2: arrowDrawPoints.line[1].x,
            y2: arrowDrawPoints.line[1].y,
            color: markArrow.color,
            lineWidth: this.getMarkLineWidth()*(cleArrow ? 1.6 : 1)
        }, ctx);
        if (arrowDrawPoints.arrow.length) {
            this.printTriangle({
                points: arrowDrawPoints.arrow,
                color: markArrow.color
            }, ctx)
        }
        ctx = null;
    }

    //print
    CheckerBoard.prototype.printMarkArrow = function(markArrow, idx) {
        this._printMarkArrow(markArrow, idx);
    }


    CheckerBoard.prototype.getMarkLinePoints = function(markLine, idx) {
        let points = {
            line: [],
        }
        let x = this.P[markLine.P[0]].x;
        let y = this.P[markLine.P[0]].y;
        if (idx == undefined || idx == null) {
            points.line.push({ x: x, y: y });
            x = this.P[markLine.P[markLine.P.length - 1]].x;
            y = this.P[markLine.P[markLine.P.length - 1]].y;
            points.line.push({ x: x, y: y });
        }
        else {
            if (markLine.P.indexOf(idx) == -1) return;
            let w = this.gW / 2 * 1.07;
            let h = this.gH / 2 * 1.07;
            let x1, x2, y1, y2;
            if (idx == markLine.P[0]) {
                x1 = this.P[idx].x;
                y1 = this.P[idx].y;
                switch (markLine.direction) {
                    case 0:
                        x2 = x1 - w;
                        y2 = y1;
                        break;
                    case 1:
                        x2 = x1 - w - 1;
                        y2 = y1 - h - 1;
                        break;
                    case 2:
                        x2 = x1;
                        y2 = y1 - h;
                        break;
                    case 3:
                        x2 = x1 + w + 1;
                        y2 = y1 - h - 1;
                        break;
                    case 4:
                        x2 = x1 + w;
                        y2 = y1;
                        break;
                    case 5:
                        x2 = x1 + w + 1;
                        y2 = y1 + h + 1;
                        break;
                    case 6:
                        x2 = x1;
                        y2 = y1 + h;
                        break;
                    case 7:
                        x2 = x1 - w - 1;
                        y2 = y1 + h + 1;
                        break;
                }
            }
            else if (idx == markLine.P[markLine.P.length - 1]) {
                x1 = this.P[idx].x;
                y1 = this.P[idx].y;
                switch (markLine.direction) {
                    case 4:
                        x2 = x1 - w;
                        y2 = y1;
                        break;
                    case 5:
                        x2 = x1 - w - 1;
                        y2 = y1 - h - 1;
                        break;
                    case 6:
                        x2 = x1;
                        y2 = y1 - h;
                        break;
                    case 7:
                        x2 = x1 + w + 1;
                        y2 = y1 - h - 1;
                        break;
                    case 0:
                        x2 = x1 + w;
                        y2 = y1;
                        break;
                    case 1:
                        x2 = x1 + w + 1;
                        y2 = y1 + h + 1;
                        break;
                    case 2:
                        x2 = x1;
                        y2 = y1 + h;
                        break;
                    case 3:
                        x2 = x1 - w - 1;
                        y2 = y1 + h + 1;
                        break;
                }
            }
            else {
                x = this.P[idx].x;
                y = this.P[idx].y;
                if (markLine.direction == 0 || markLine.direction == 4) {
                    x1 = x - w;
                    y1 = y;
                    x2 = x + w;
                    y2 = y;
                }
                else if (markLine.direction == 1 || markLine.direction == 5) {
                    x1 = x - w - 1;
                    y1 = y - h - 1;
                    x2 = x + w + 1;
                    y2 = y + h + 1;
                }
                else if (markLine.direction == 2 || markLine.direction == 6) {
                    x1 = x;
                    y1 = y - h;
                    x2 = x;
                    y2 = y + h;
                }
                else {
                    x1 = x - w - 1;
                    y1 = y + h + 1;
                    x2 = x + w + 1;
                    y2 = y - h - 1;
                }
            }
            points.line.push({ x: x1, y: y1 });
            points.line.push({ x: x2, y: y2 });
        }
        return points;

    }

    //print and clear
    CheckerBoard.prototype._printMarkLine = function(markLine, idx, cleLine) {
        let lineDrawPoints = this.getMarkLinePoints(markLine, idx);
        let ctx = this.canvas.getContext("2d");
        this.printLine({
            x1: lineDrawPoints.line[0].x,
            y1: lineDrawPoints.line[0].y,
            x2: lineDrawPoints.line[1].x,
            y2: lineDrawPoints.line[1].y,
            color: markLine.color,
            lineWidth: this.getMarkLineWidth()*(cleLine ? 1.6 : 1)
        }, ctx);
        ctx = null;
    }
    
    //print
    CheckerBoard.prototype.printMarkLine = function(markLine, idx) {
        function refreshIdx(idx) {
            let txt = "";
            if (this.P[idx].text) txt = this.P[idx].text;
            this._printPoint(idx, this.isShowNum);
            this.refreshMarkArrow(idx);
        }
        
        this._printMarkLine(markLine, idx);
        if (idx == undefined || idx == null) {
            for (let i = markLine.P.length - 1; i >= 0; i--) {
                idx = markLine.P[i];
                refreshIdx.call(this, idx);
            }
        }
        else {
            refreshIdx.call(this, idx);
        }
    }


    //  用虚线表示棋子的位置
    CheckerBoard.prototype.printBorder = function() {
        for (let y = 0; y < this.SLTY; y++) {
            for (let x = 0; x < this.SLTX; x++) {
                let i = x + y * 15;
                if (this.P[i] != null) this.P[i].printBorder(this.gW, this.gH);
            }
        }
    };
    

    CheckerBoard.prototype.printEmptyCBoard = function() {
        let canvas = this.bakCanvas; // 准备在后台画棋盘
        // 画图之前，设置画布大小
        canvas.width = this.width;
        canvas.height = this.height;
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        let boardLinesInfo = this.getBoardLinesInfo();
        boardLinesInfo.map(lineInfo => this.printLine(lineInfo, ctx))
        
        let starPointsInfo = this.getStarPointsInfo();
        starPointsInfo.map(starPointInfo => this.printCircle(starPointInfo, ctx))

        let coordinateTypeInfo = this.getCoordinateInfo();
        coordinateTypeInfo.map(textInfo => this.printText(textInfo, ctx))
        
        let canvas2 = this.canvas;
        ctx = canvas2.getContext("2d");
        canvas2.width = canvas.width;
        canvas2.height = canvas.height;
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
        ctx = null;
    };


    CheckerBoard.prototype.printEmptyCBoardPDF = function(doc, scale) {
        let boardLinesInfo = this.getBoardLinesInfo();
        boardLinesInfo.map(lineInfo => this.printLinePDF(lineInfo, doc, scale))
        
        let starPointsInfo = this.getStarPointsInfo();
        starPointsInfo.map(starPointInfo => this.printCirclePDF(starPointInfo, doc, scale))

        let coordinateTypeInfo = this.getCoordinateInfo();
        coordinateTypeInfo.map(textInfo => this.printTextPDF(textInfo, doc, scale))
    };
    
    
    CheckerBoard.prototype.printEmptyCBoardSVG = function(scale) {
        let svgText = "";
        let boardLinesInfo = this.getBoardLinesInfo();
        svgText += boardLinesInfo.map(lineInfo => this.printLineSVG(lineInfo, scale)).join("")
        
        let starPointsInfo = this.getStarPointsInfo();
        svgText += starPointsInfo.map(starPointInfo => this.printCircleSVG(starPointInfo, scale)).join("")

        let coordinateTypeInfo = this.getCoordinateInfo();
        svgText += coordinateTypeInfo.map(textInfo => this.printTextSVG(textInfo, scale)).join("")
        return svgText;
    };
    
    
    // 画空棋盘
    CheckerBoard.prototype.resetCBoardCoordinate = function() {
        this.SLTX = this.size;
        this.SLTY = this.SLTX;
        let padding = this.coordinateType == 0 ? ~~(this.width / this.SLTX / 2) :
            this.coordinateType == 1 ? ~~(this.width / (this.SLTX + 2) * 1.5) :
            ~~(this.width / (this.SLTX + 1) * 1.5);

        switch (this.coordinateType) {
            case COORDINATE_ALL:
            case COORDINATE_NONE:
                this.XL = padding;
                this.XR = this.width - padding;
                this.YT = padding;
                this.YB = this.height - padding;
                break;
            case COORDINATE_LEFT_UP:
                this.XL = padding;
                this.XR = this.width - ~~(padding / 3);
                this.YT = padding;
                this.YB = this.height - ~~(padding / 3);
                break;
            case COORDINATE_RIGHT_UP:
                this.XL = ~~(padding / 3);
                this.XR = this.width - padding;
                this.YT = padding;
                this.YB = this.height - ~~(padding / 3);
                break;
            case COORDINATE_RIGHT_DOWN:
                this.XL = ~~(padding / 3);
                this.XR = this.width - padding;
                this.YT = ~~(padding / 3);
                this.YB = this.height - padding;
                break;
            case COORDINATE_LEFT_DOWN:
                this.XL = padding;
                this.XR = this.width - ~~(padding / 3);
                this.YT = ~~(padding / 3);
                this.YB = this.height - padding;
                break;
        }

        this.resetP(this.XL, this.XR, this.YT, this.YB);
    };



    // 在棋盘上面打印一个VCF手顺   
    CheckerBoard.prototype.printMoves = function(moves, firstColor) {

        let nowTimer = new Date().getTime();
        let idx = 0;
        if (nowTimer - this.printMovesTimer < 1000) return;
        this.printMovesTimer = nowTimer;
        for (let y = 0; y < this.SLTY; y++) {
            for (let x = 0; x < this.SLTX; x++) {
                idx = y * 15 + x;
                if (this.P[idx].type == TYPE_MARK || this.P[idx].type == TYPE_MOVE) {
                    this.cleLb(idx);
                }
            }
        }
        this.removeMarkArrow("all");
        this.removeMarkLine("all");
        this.removeMarkLine(this.autoLines);
        for (let i = 0; i < moves.length; i++) {
            let color;
            let fontColor;
            if (i == moves.length - 1) {
                fontColor = this.moveLastFontColor;
                if (firstColor == 1) {
                    color = i & 1 ? this.moveWhiteColor : this.moveBlackColor;
                }
                else {
                    color = i & 1 ? this.moveBlackColor : this.moveWhiteColor;
                }
            }
            else if (firstColor == 1) {
                color = i & 1 ? this.moveWhiteColor : this.moveBlackColor;
                fontColor = i & 1 ? this.moveWhiteFontColor : this.moveBlackFontColor;
            }
            else {
                color = i & 1 ? this.moveBlackColor : this.moveWhiteColor;
                fontColor = i & 1 ? this.moveBlackFontColor : this.moveWhiteFontColor;
            }

            this.wLb(moves[i], i + 1, fontColor, color, false);
        }
    };


    CheckerBoard.prototype.printNb = function(idx, showNum) {
        let ctx = this.canvas.getContext("2d"),
            pointInfo = this.getBoardPointInfo(idx, showNum);
        this.printCircle(pointInfo.circle, ctx);
        this.printText(pointInfo.text, ctx);
        ctx = null;
    }


    CheckerBoard.prototype.printLb = function(idx) {
        this.printNb(idx);
    }


    CheckerBoard.prototype._printPoint = function(idx, showNum) {
        if (idx < 0 || idx > 224 || this.P[idx].type == TYPE_EMPTY) return;
        let type = this.P[idx].type;
        if (type == TYPE_NUMBER || type == TYPE_WHITE || type == TYPE_BLACK) {
            this.printNb(idx, showNum);
        }
        else { //  打印标签
            this.printLb(idx);
        }
    }


    // 在棋盘上打印一个点
    CheckerBoard.prototype.printPoint = function(idx, showNum) {
        if (idx < 0 || idx > 224 || this.P[idx].type == TYPE_EMPTY) return;
        let type = this.P[idx].type;
        this._printPoint(idx, showNum);
        //log(`text=${text}, notShowLastNum=${notShowLastNum}`)
        if (type == TYPE_NUMBER && idx == this.MS[this.MSindex] && !this.notShowLastNum) {
            this.showLastNb(showNum);
        }
        if (appData.renjuSave) appData.renjuSave(this);
    };


    // 在棋盘上打印当前正在计算的点
    CheckerBoard.prototype.printSearchPoint = function(num, idx, color) {
        let size;
        let temp;
        num = num ? parseInt(num) : 0;
        //清除旧标记
        if (this.searchIdx[num] > -1 && this.searchIdx[num] != idx) {
            this.searchPoints[num].setAttribute("class", "");
            if (this.searchPoints[num] && this.searchPoints[num].parentNode) this.searchPoints[num].parentNode.removeChild(this.searchPoints[num])
        }
        //写入新标记
        if (idx > -1) {
            this.searchIdx[num] = idx;
            temp = 1.3 * ((this.gW < this.gH) ? this.gW : this.gH);
            size = ~~(temp / 9);
            this.searchPoints[num].innerHTML = "";
            this.searchPoints[num].style.fontSize = size + "px";
            this.searchPoints[num].style.color = color;
            this.searchPoints[num].style.position = "absolute";
            this.searchPoints[num].style.backgroundColor = this.backgroundColor;
            this.searchPoints[num].style.width = temp / 9 + "px";
            this.searchPoints[num].style.height = temp / 9 + "px";
            this.searchPoints[num].style.lineHeight = temp / 9 + "px";
            this.searchPoints[num].style.textAlign = "center";
            this.searchPoints[num].style.padding = "";
            this.searchPoints[num].style.margin = "";
            this.searchPoints[num].style.borderStyle = "solid";
            this.searchPoints[num].style.borderWidth = temp / 9 + "px";
            this.searchPoints[num].style.borderColor = "green";
            this.searchPoints[num].style.left = this.P[idx].x - ~~(temp / 6) + this.canvas.offsetLeft + "px";
            this.searchPoints[num].style.top = this.P[idx].y - ~~(temp / 6) + this.canvas.offsetTop + "px";
            this.parentNode.appendChild(this.searchPoints[num]);
            this.searchPoints[num].setAttribute("class", "startPoint");
            this.cleLb(idx);
        }
    };


    CheckerBoard.prototype.refreshBoardPoint = function(idx) {
        let ctx = this.canvas.getContext("2d"),
            st = 0,
            end = 225;
        typeof idx == "number" && 0 <= idx && idx <= 224 && (st = idx, end = idx + 1)
        for (let i = st; i < end; i++) {
            if (this.P[i].type != TYPE_EMPTY) {
                let pointInfo = this.getBoardPointInfo(i, this.isShowNum);
                this.printCircle(pointInfo.circle, ctx);
                this.printText(pointInfo.text, ctx);
            }
        }
        ctx = null;
    }
    
    
    CheckerBoard.prototype.refreshMarkLine = function(idx, lines = this.LINES) {
        lines = idx === this.autoLines ? this.autoLines : lines;
        if (idx == "all" || idx == "All") {
            for (let i = 0; i < lines.length; i++) {
                this.printMarkLine(lines[i]);
            }
        }
        else {
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].P.indexOf(idx) + 1) {
                    this.printMarkLine(lines[i], idx);
                }
            }
        }
    }


    CheckerBoard.prototype.refreshMarkArrow = function(idx, arrows = this.ARROWS) {
        if (idx == "all" || idx == "All") {
            for (let i = 0; i < arrows.length; i++) {
                this.printMarkArrow(arrows[i]);
            }
        }
        else {
            for (let i = 0; i < arrows.length; i++) {
                if (arrows[i].P.indexOf(idx) + 1) {
                    this.printMarkArrow(arrows[i]);
                }
            }
        }
    }


    CheckerBoard.prototype.refreshCheckerBoard = function() {
        this.printEmptyCBoard();
        this.refreshMarkLine("all");
        this.refreshBoardPoint("all");
        this.refreshMarkArrow("all");
        this.autoShow();
    }
    
    
    CheckerBoard.prototype.refreshCheckerBoardPDF = function(doc, scale) {
        this.printEmptyCBoardPDF(doc, scale);
        this.printMarkLinesPDF(doc, scale);
        this.printBoardPointsPDF(doc, scale);
        this.printMarkArrowsPDF(doc, scale);
    }
    
    
    CheckerBoard.prototype.refreshCheckerBoardSVG = function(scale) {
        let svgText = "";
        svgText += this.printEmptyCBoardSVG(scale);
        svgText += this.printMarkLinesSVG(scale);
        svgText += this.printBoardPointsSVG(scale);
        svgText += this.printMarkArrowsSVG(scale);
        return svgText;
    }


    // 边框初始化
    CheckerBoard.prototype.resetCutDiv = function() {
        let canvas = this.canvas;
        let w = ~~(canvas.width);
        let h = ~~(canvas.height);
        let XL = this.oldXL == this.oldXR ? w / 3 : this.oldXL;
        let XR = this.oldXL == this.oldXR ? w / 3 * 2 : this.oldXR;
        let YT = this.oldXL == this.oldXR ? h / 3 : this.oldYT;
        let YB = this.oldXL == this.oldXR ? h / 3 * 2 : this.oldYB;
        let div = this.cutDiv;
        let s = this.cutDiv.style;
        s.position = "absolute";
        s.borderStyle = "dashed";
        s.borderWidth = "3px";
        s.borderColor = "red";
        s.zIndex = 0;
        s.width = XR - XL + "px";
        s.height = YB - YT + "px";
        s.left = XL + "px";
        s.top = YT + "px";

        /*
        if (XR == 0  || YB == 0)  {
            s.width = "300px";
            s.height = "300px";
            s.left = canvas.offsetLeft;
            s.top = canvas.offsetTop;
        }
        */

        this.XL = div.offsetLeft;
        this.XR = XL + parseInt(s.width);
        this.YT = div.offsetTop;
        this.YB = YT + parseInt(s.height);
        this.resetP(this.XL, this.XR, this.YT, this.YB);
        this.printBorder();
    };



    // 后台设置棋盘所有点的坐标。不会改变棋盘的显示
    CheckerBoard.prototype.resetP = function(xL, xR, yT, yB) {
        let i;
        let j;
        let l;
        let x;
        let y;
        if (xL == null || xR == null || yT == null || yB == null) {
            xL = this.oldXL = this.XL;
            xR = this.oldXR = this.XR;
            yT = this.oldYT = this.YT;
            yB = this.oldYB = this.YB;
        }
        let SLTY = this.SLTY;
        let SLTX = this.SLTX;
        //cleP();
        this.gW = (xR - xL) / (SLTX - 1);
        this.gH = (yB - yT) / (SLTY - 1);

        for (j = 0; j < 15; j++)
        {
            y = ~~(this.gH * j) + yT;
            for (i = 0; i < 15; i++)
            {
                x = ~~(this.gW * i) + xL;
                l = j * 15 + i;
                this.P[l].setxy(x, y);
            }
        }
    };



    CheckerBoard.prototype.removeTree = function() {

        this.firstColor = "black";
        this.tree = undefined;
        this.cleLb("all");
        control.getEXWindow().close();
    }



    CheckerBoard.prototype.removeMarkArrow = function(idx, arrows = this.ARROWS) {
        if (idx == "all" || idx == "All") {
            while (arrows.length) {
                let mkArrow = arrows.pop();
                this.cleMarkArrow(mkArrow);
            }
        }
        else {
            if (idx < 0 || idx >= arrows.length) return;
            let mkArrow = arrows.splice(idx, 1);
            this.cleMarkArrow(mkArrow[0]);
        }
        return true;
    }



    CheckerBoard.prototype.removeMarkLine = function(idx, lines = this.LINES) {
        lines = idx === this.autoLines ? this.autoLines : lines;
        if (idx == "all" || idx == "All" || idx === this.autoLines) {
            while (lines.length) {
                let mkLine = lines.pop();
                this.cleMarkLine(mkLine);
            }
        }
        else {
            if (idx < 0 || idx >= lines.length) return;
            let mkLine = lines.splice(idx, 1);
            this.cleMarkLine(mkLine[0]);
        }
        return true;
    }



    CheckerBoard.prototype.saveAsImage = function(type) {
        function toBlob(callback, type, quality) {
            function reqListener() {
                let blob = new Blob([oReq.response]);
                callback(blob);
            }
            let url = this.toDataURL(type, quality);
            let oReq = new XMLHttpRequest();
            oReq.addEventListener("load", reqListener);
            oReq.open("GET", url);
            oReq.responseType = "arraybuffer";
            oReq.send();
        }

        let canvas = this.cutViewBox(),
            filename = `${this.autoFileName()}.${type}`;
        //保存
        canvas.toBlob = canvas.toBlob || toBlob.bind(canvas);
        canvas.toBlob(blob => {
            this.saveFile(blob, filename);
        }, "image/" + type, 0.1);
    };



    // 棋盘保存PDF文件
    CheckerBoard.prototype.saveAsPDF = function(fontName) {
        if (typeof jsPDF != "function") {
            warn(`${EMOJI_FOUL_THREE}缺少 jsPDF 插件`);
            return;
        }
        //新建文档
        let doc = new jsPDF("p", "pt", "a4"); // 594.3pt*840.51pt
        this.pdfOriginPoint = {
            x: 594 * 0.0252525,
            y: (840 - (594 - 594 * 0.0252525 * 2)) / 2
        };
        let scale = (594 - 594 * 0.0252525 * 2) / this.canvas.width;
        
        this.refreshCheckerBoardPDF(doc, scale);
        
        //var doc = new jsPDF();
        //doc.lines([[50, 0], [0, 50], [-50, 0], [0, -50]], 20, 20, [1.0, 1.0], null, true); // horizontal line
        //doc.clip();
        //doc.rect(50, 50, 100, 100, `F`)
        //doc.lines([[100,100],[-100,100],[50,50,80,100,150,150],[20,10]], 212,110, [1,1], 'F', false)
        let filename = this.autoFileName();
        doc.save(filename + ".pdf"); //保存文档
    };



    CheckerBoard.prototype.saveAsSVG = function(type) {

        let filename = this.autoFileName();
        filename += type == "html" ? ".html" : ".svg";
        let mimetype = type == "html" ? "text/html" : "image/svg+xml";
        let blob = new Blob([this.getSVG()], { type: mimetype });
        this.saveFile(blob, filename);
    };



    CheckerBoard.prototype.saveFile = function(blob, filename) {

        if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {

            navigator.msSaveOrOpenBlob(blob, filename);
            log("msSaveOrOpenBlob...");
        }
        else {
            // if iphone open file;
            if (navigator.userAgent.indexOf("iPhone") + 1) {
                let url = URL.createObjectURL(blob);
                window.open(url, "helpWindow");
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 1000 * 60);
                log("open downloading...");
            }
            else { // download file;
                let save_link = document.createElement("a");
                save_link.href = URL.createObjectURL(blob);
                save_link.download = filename;
                save_link.target = "download";
                document.body.appendChild(save_link);
                save_link.click();
                save_link.parentNode.removeChild(save_link);
                setTimeout(() => { URL.revokeObjectURL(save_link.href); }, 1000 * 60);
                log("click downloading...");
            }
        }
    }



    CheckerBoard.prototype.autoFileName = function() {

        let d = new Date();
        let filename = `${d.getFullYear()}_${(f(d.getMonth() + 1))}${f(d.getDate())}_${f(d.getHours())}${f(d.getMinutes())}${f(d.getSeconds())}`;
        return filename;

        function f(s) {
            s = s < 10 ? `0${s}` : s;
            return s;
        }
    }



    //涂鸦模式 手动调整选择棋盘边框
    CheckerBoard.prototype.setCutDiv = function(x, y, passResetP) { //调整棋盘的边框范围，用 mdiv 实时显示效果
        let xL;
        let xM;
        let xR;
        let yT;
        let yM;
        let yB;
        let cutDiv = this.cutDiv;
        let s = cutDiv.style;
        let tempx;
        let tempy;

        x = ~~(x);
        y = ~~(y);

        xL = cutDiv.offsetLeft;
        xR = xL + parseInt(s.width);
        xM = xL + ~~((xR - xL) / 2);
        yT = cutDiv.offsetTop;
        yB = yT + parseInt(s.height);
        yM = yT + ~~((yB - yT) / 2);

        let l;
        let t;
        let w;
        let h;

        if (x < xM)
        {
            if (y < yM)
            {
                l = x;
                t = y;
                w = xR - x;
                h = yB - y;
            }
            else
            {
                l = x;
                t = yT;
                w = xR - x;
                h = y - yT;
            }
        }
        else
        {

            if (y < yM)
            {
                l = xL;
                t = y;
                w = x - xL;
                h = yB - y;
            }
            else
            {
                l = xL;
                t = yT;
                w = x - xL;
                h = y - yT;
            }

        }

        let canvas = this.canvas;
        s.position = "absolute";
        s.left = canvas.offsetLeft < l ? l + "px" : canvas.offsetLeft + "px";
        s.top = canvas.offsetTop < t ? t + "px" : canvas.offsetTop + "px";
        s.width = w > parseInt(canvas.style.width) - l ? parseInt(canvas.style.width) - l + "px" : w + "px";
        s.height = h > parseInt(canvas.style.height) - t ? parseInt(canvas.style.height) - t + "px" : h + "px";

        this.XL = l;
        this.XR = this.XL + w;
        this.YT = t;
        this.YB = this.YT + h;

        if (passResetP) return;
        this.resetP(this.XL, this.XR, this.YT, this.YB);
    };



    CheckerBoard.prototype.setCoordinate = function(coordinateType) {
        if (coordinateType < 0 || coordinateType > 5) return;
        this.coordinateType = coordinateType;
        this.resetCBoardCoordinate();
        this.refreshCheckerBoard();
        this.onSetCoordinate.call(this);
    }



    // 设置最后一手是否高亮显示
    CheckerBoard.prototype.setNotShowLastNum = function(value) {

        this.notShowLastNum = value;
    };



    //设置棋谱
    CheckerBoard.prototype.setMoves = function(codeStr) {

        // 对传入的棋谱代码排错;
        let m = codeStr ? codeStr.toUpperCase() : "";
        codeStr = "";
        let d;
        let a;
        let n;
        while (m.length) {
            a = "";
            n = "";
            while (m.length) {

                a = m.substr(0, 1);
                m = m.substr(1);
                d = a.charCodeAt() - "A".charCodeAt();

                if (d >= 0 && d <= 14) break; // 找到英文字母为止;
            }

            while (m.length) {

                n = m.substr(0, 1);
                m = m.substr(1);
                d = n.charCodeAt() - "0".charCodeAt();
                if (d >= 0 && d <= 9) break; // 找到一个数字为止;

            }

            //每个棋子落点横坐标用A-O表示，纵坐标用1-15来表
            //判断棋子纵坐标是否是2位，是则继续截取，补足3位。
            d = m.charCodeAt() - "0".charCodeAt();
            if (d >= 0 && d <= 9) {
                n += m.substr(0, 1);
                m = m.substr(1);
            }

            let isPass = (a + n).toLowerCase() == "a0";
            // 排除不存在的坐标，同时去掉重复的坐标
            if ((~~(n) <= 15 && ~~(n) > 0) || isPass) {
                let index = codeStr.indexOf(a + n);
                if (index < 0 || isPass) {
                    // 没有重复
                    codeStr = codeStr + a + n;
                }
                else if (~~(n) <= 9) { // 如果Y坐标是一位数字，再确认是否重复
                    let r = codeStr.substr(index + 2, 1).charCodeAt() - "0".charCodeAt();
                    // 没有重复
                    if (r >= 0 && r <= 9) codeStr = codeStr + a + n;
                }
            }

        }
        if (codeStr != "") {
            this.Moves = codeStr;
            return codeStr;
        }
        else {
            return "";
        }

    };



    // 设置从第几手开始显示序号， 默认==0 时第一手开始显示，==1 时第二手显示❶
    CheckerBoard.prototype.setResetNum = function(num) {

        this.resetNum = parseInt(num);
        this.showNum();
    };



    CheckerBoard.prototype.setSize = function(size = 15) {
        size = ~~(size);
        size = size < 6 ? 6 : size > 15 ? 15 : size;
        this.size = size;
        this.resetCBoardCoordinate();
        this.refreshCheckerBoard();
        this.onSetSize.call(this);
    }
    
    
    CheckerBoard.prototype.setLineStyle = function(keyNum) {
        const WEIGHT = ["normal","bold","bolder"];
        WEIGHT[keyNum] && (this.lineStyle = WEIGHT[keyNum]);
        this.refreshCheckerBoard();
    }


    CheckerBoard.prototype.setScale = function(scl, timer = "now") {
        this.scale = scl;
        //log(`scl=${scl}`,"info")
        if (timer == "now") {
            if (scl == 1) {
                this.setViewBoxBorder(false);
            }
            else {
                this.setViewBoxBorder(true);
            }
            this.canvas.style.width = `${this.width*scl}px`;
            this.canvas.style.height = `${this.height*scl}px`;
            this.center();
        }
        else {
            scaleAnimation(this);
        }

        this.onScale.call(this);
    }



    CheckerBoard.prototype.setViewBoxBorder = function(value) {
        if (value) {
            let bw = ~~(this.width / 100),
                p = { x: 0, y: 0 };
            this.xyObjToPage(p, this.viewBox);
            this.viewBox.style.border = `${bw}px solid #ccc`; // ridge groove
            //this.viewBox.style.borderRadius = `${bw}px`;
            this.viewBox.style.left = `${p.x < bw ? -p.x : -bw}px`;
            this.viewBox.style.top = `${p.y < bw ? -p.y : -bw}px`;
        }
        else {
            this.viewBox.style.border = `0px`;
            this.viewBox.style.left = `0px`;
            this.viewBox.style.top = `0px`;
        }
    }



    // 选取棋盘边框模式，设置一个移动的坐标点
    CheckerBoard.prototype.setxy = function(p, speed) { //返回一个xy坐标，用来 调整棋盘边框位置，支持微调

        let s = this.cutDiv.style;
        let n = this.cutDiv;
        let xL = n.offsetLeft;
        let xR = xL + parseInt(s.width);
        let xM = xL + ~~((xR - xL) / 2);
        let yT = n.offsetTop;
        let yB = yT + parseInt(s.height);
        let yM = yT + ~~((yB - yT) / 2);
        let tempx;
        let tempy;
        let w = parseInt(s.width) < parseInt(s.height) ? parseInt(s.width) : parseInt(s.height);
        w /= (5 - 0.99);
        this.xyPageToObj(p, this.canvas);
        let x = ~~(p.x);
        let y = ~~(p.y);
        if (x < xM)
        {
            if (y < yM)
            {
                tempx = xL;
                tempy = yT;
            }
            else
            {
                tempx = xL;
                tempy = yB;
            }
        }
        else
        {

            if (y < yM)
            {
                tempx = xR;
                tempy = yT;
            }
            else
            {
                tempx = xR;
                tempy = yB;
            }

        }
        // 微调//////
        //alert("微调");
        if (speed < 1) { // speed < 1, touchMove
            if (Math.abs(x - tempx) < w && Math.abs(y - tempy) < w)
            {
                var temps = Math.pow((x - tempx) / w, 2);
                x = ~~((x - tempx) * speed * temps);
                x = x ? x : (x - tempx) < 0 ? -1 : 1;
                x += tempx;
                temps = Math.pow((y - tempy) / w, 2);
                y = ~~((y - tempy) * speed * temps);
                y = y ? y : (y - tempy) < 0 ? -1 : 1;
                y += tempy;
                p.x = x;
                p.y = y;
                return;
            }
        }
        else if (speed == 1) { // speed = 1 touchClick
            if (Math.abs(x - tempx) < ~~(w / 3) && Math.abs(y - tempy) < ~~(w / 3))
            {
                x = ~~((x - tempx) / 10 * speed);
                x += tempx;
                y = ~~((y - tempy) / 10 * speed);
                y += tempy;
                p.x = x;
                p.y = y;
                return;
            }

            if (Math.abs(x - tempx) < ~~(w / 3 * 2) && Math.abs(y - tempy) < ~~(w / 3 * 2))
            {
                x = ~~((x - tempx) / 8 * speed);
                x += tempx;
                y = ~~((y - tempy) / 8 * speed);
                y += tempy;
                p.x = x;
                p.y = y;
                return;
            }

            if (Math.abs(x - tempx) < w && Math.abs(y - tempy) < w)
            {
                x = ~~((x - tempx) / 6 * speed);
                x += tempx;
                y = ~~((y - tempy) / 6 * speed);
                y += tempy;
                p.x = x;
                p.y = y;
                return;
            }
        }
        else {
            // speed = 2, mouseClick not change
        }

    };



    CheckerBoard.prototype.showAutoLine = function(display, notChange) {
        for (let i = this.autoLines.length - 1; i >= 0; i--) {
            this.removeMarkLine(i, this.autoLines);
        }
        if (display) {
            const OBJ_LINES = { THREE_FREE: [], FOUR_NOFREE: [], FOUR_FREE: [], FIVE: [] },
                COLOR = { THREE_FREE: "#556B2F", FOUR_NOFREE: "#483D8B", FOUR_FREE: "#86008f", FIVE: "red" };
            let arr = this.getArray();
            getLines(arr, 1).map(line => OBJ_LINES[line.level].push(line));
            getLines(arr, 2).map(line => OBJ_LINES[line.level].push(line));
            Object.keys(OBJ_LINES).map(key => {
                OBJ_LINES[key].map(line => this.createMarkLine(line.start, line.end, COLOR[line.level], this.autoLines));
            });
        }

        if (!notChange) this.isShowAutoLine = display;
    }



    CheckerBoard.prototype.showFoul = function(display, notChange) {

        this.P.map((P, i) => {
            if (P.type == TYPE_MARKFOUL) {
                P.cle();
                this.clePointB(i);
                this.refreshMarkLine(i);
                this.refreshMarkArrow(i);
            }
        });
        if (display) {
            this.getArray().map((color, idx, arr) => {
                color == 0 && isFoul(idx, arr) && (
                    this.P[idx].color = "red",
                    this.P[idx].bkColor = null,
                    this.P[idx].type = TYPE_MARKFOUL,
                    this.P[idx].text = EMOJI_FOUL,
                    this.refreshMarkLine(idx),
                    this._printPoint(idx),
                    this.refreshMarkArrow(idx)
                );
            });
        }
        if (!notChange) this.isShowFoul = display;
    };



    // 根据用户设置 决定是否高亮显示 最后一手棋
    CheckerBoard.prototype.showLastNb = function(showNum) {

        let p = tempp;
        let idx;
        if (this.MSindex >= 0) { // 存在倒数第1手，特殊标记
            idx = this.MS[this.MSindex];
        }
        else { // 不存在倒数第1手，退出
            return;
        }
        this.printNb(idx, showNum);
        this.refreshMarkArrow(idx);

        let preIndex = this.MSindex;
        while (--preIndex >= 0) { // 存在倒数第二手，恢复正常标记
            idx = this.MS[preIndex];
            if (idx != 225) {
                this.printNb(idx, showNum);
                this.refreshMarkArrow(idx);
                return;
            }
        }
    };



    // 刷新棋盘上棋子显示手数
    CheckerBoard.prototype.showNum = function() {

        let color;
        for (let i = 0; i <= this.MSindex; i++) {
            color = (i & 1) ? this.wNumColor : this.bNumColor;
            this.printPoint(this.MS[i], true);
            this.refreshMarkArrow(this.MS[i]);
        }
    };

    // 跳到第 0 手。
    CheckerBoard.prototype.toStart = function(isShowNum) {
        while (this.MSindex > -1) {
            this.toPrevious(isShowNum, 100);
        }
    };

    //跳到最后一手
    CheckerBoard.prototype.toEnd = function(isShowNum) {
        while (this.MSindex < this.MS.length - 1) {
            this.toNext(isShowNum, 100);
        }
    };

    // 返回上一手
    CheckerBoard.prototype.toPrevious = function(isShowNum, timer = "now") {
        if (this.MSindex >= 0) {
            this.cleNb(this.MS[this.MSindex], isShowNum, timer);
        }
    };

    // 跳到下一手
    CheckerBoard.prototype.toNext = function(isShowNum, timer = "now") {
        if (this.MS.length - 1 > this.MSindex) {
            this.wNb(this.MS[this.MSindex + 1], "auto", isShowNum, undefined, undefined, timer);
        }
    };


    CheckerBoard.prototype.unpackCode = function(showNum, codeStr, resetNum = 0, firstColor = "black") {
        let st = 0;
        let end = codeStr.indexOf("{");
        end = end == -1 ? codeStr.length : end;
        let moves;
        let blackMoves;
        let whiteMoves;
        moves = this.setMoves(codeStr.slice(st, end));
        st = end + 1;
        end = codeStr.indexOf("}{", st);
        end = end == -1 ? codeStr.length : end;
        blackMoves = this.setMoves(codeStr.slice(st, end));
        st = end + 2;
        end = codeStr.length;
        whiteMoves = this.setMoves(codeStr.slice(st, end));
        if (moves || blackMoves || whiteMoves) {
            this.cle();
            this.resetNum = resetNum;
            this.firstColor = firstColor;
            if (moves) this.unpackMoves(showNum, "auto", moves);
            if (blackMoves) this.unpackMoves(showNum, "black", blackMoves);
            if (whiteMoves) this.unpackMoves(showNum, "white", whiteMoves);
        }
    };



    //解析（已经通过this.getMoves 格式化）棋谱,摆棋盘
    CheckerBoard.prototype.unpackMoves = function(showNum, color, moves) {
        color = color || "auto";
        if (color == "auto") {
            this.MS.length = 0; //清空数组
            this.MSindex = -1;
        }
        let m = moves || this.Moves;
        while (m.length) {
            let a = m.substr(0, 2); //取前两个字符
            m = m.substr(2); //去掉前两个字符
            //每个棋子落点横坐标用A-O表示，纵坐标用1-15来表
            //判断棋子纵坐标是否是2位，是则继续截取，补足3位。
            let d = m.charCodeAt() - "0".charCodeAt();
            if (d >= 0 && d <= 9) {
                a += m.substr(0, 1);
                m = m.substr(1);
            }
            // 棋谱坐标转成 index 后添加棋子
            if (color == "auto") {
                //console.log(`unpackMoves color == "auto"`);
                this.wNb(this.nameToIndex(a), "auto", showNum, undefined, undefined, 100);
            }
            else if (color == "black") {
                //console.log(`unpackMoves color == "black"`);
                switch (control.getPlayMode()) {
                    case control.renlibMode:
                    case control.readLibMode:
                    case control.editLibMode:
                        if (0 == (this.MSindex & 1)) this.wNb(225, "auto", showNum, undefined, undefined, 100);
                        this.wNb(this.nameToIndex(a), "auto", showNum, undefined, undefined, 100);
                        break;
                    case control.renjuMode:
                        this.wNb(this.nameToIndex(a), "black", showNum, undefined, undefined, 100);
                        break;
                }
            }
            else if (color == "white") {
                //console.log(`unpackMoves color == "white"`);
                switch (control.getPlayMode()) {
                    case control.renlibMode:
                    case control.readLibMode:
                    case control.editLibMode:
                        if (1 == (this.MSindex & 1)) this.wNb(225, "auto", showNum, undefined, undefined, 100);
                        this.wNb(this.nameToIndex(a), "auto", showNum, undefined, undefined, 100);
                        break;
                    case control.renjuMode:
                        this.wNb(this.nameToIndex(a), "white", showNum, undefined, undefined, 100);
                        break;
                }
            }
        }
    };



    CheckerBoard.prototype.unpackTree = function() {
        //log(this.tree)
        this.cleLb("all");
        let path = this.MS.slice(0, this.MSindex + 1),
            nodes = this.tree.getBranchNodes(path),
            iHtml = this.tree.getInnerHtml(path),
            nextMove = { idx: -1, level: -2, idxColor: undefined },
            level = ["l", "L", "c", "c5", "c4", "c3", "c2", "c1", "w", "W", "a", "a5", "a4", "a3", "a2", "a1"];
        console.log(`unpackTree path = ${path}`)
        nodes.map(cur => {
            if (cur) {
                //console.log(`cur.branchsInfo: ${cur.branchsInfo}`)
                let i = cur.branchsInfo + 1 & 1,
                    idx = cur.branchs[i].idx,
                    txt = cur.boardText || cur.branchs[i].boardText,
                    color = !this.isTransBranch ? "black" :
                    cur.branchsInfo < 3 ? cur.branchs[i].color :
                    cur.branchs[0] && cur.branchs[0].color == "black" ?
                    "black" : cur.branchs[1].color;

                this.wLb(idx, txt, color);
                this.P[idx].branchs = cur;

                if (nextMove.level < level.indexOf(txt)) {
                    nextMove.level = level.indexOf(txt);
                    nextMove.idx = idx;
                    nextMove.idxColor = i + 1;
                }
            }
        });
        
        let exWindow = control.getEXWindow();
        exWindow.innerHTML(iHtml);
        iHtml && exWindow.openWindow();
        
        if (this.MSindex + 1 === this.MS.length && nextMove.idx > -1 && nextMove.idx < 225) {
            (this.MSindex & 1) + 1 == nextMove.idxColor && this.MS.push(225);
            this.MS.push(nextMove.idx);
        }
    }



    // 解析二维数组后，摆棋
    CheckerBoard.prototype.unpackArray = function(arr2D, isShowNum) {

        let bNarr = [];
        let wNarr = [];
        this.MS.length = 0; //清空数组
        this.MSindex = -1;
        this.resetNum = 0;
        for (let y = 0; y < this.SLTY; y++) {
            for (let x = 0; x < this.SLTX; x++) {
                let idx = x + 15 * y;
                switch (String(arr2D[y][x])) {
                    case "0":
                        this.clePoint(idx);
                        break;
                    case "1":
                        bNarr.push(idx);
                        break;
                    case "2":
                        wNarr.push(idx);
                        break;
                }
            }
        }
        if (bNarr.length - wNarr.length == 1 || bNarr.length - wNarr.length == 0) {
            for (let i = 0; i < wNarr.length; i++) {
                bNarr.splice((i + 1) * 2 - 1, 0, wNarr[i]);
            }
            this.resetNum = bNarr.length;
            for (let i = 0; i < bNarr.length; i++) {
                this.wNb(bNarr[i], "auto", isShowNum, TYPE_NUMBER, undefined, 100);
            }
        }
        else {
            for (let i = 0; i < bNarr.length; i++) {
                this.wNb(bNarr[i], "black", isShowNum, TYPE_BLACK, undefined, 100);
            }
            for (let i = 0; i < wNarr.length; i++) {
                this.wNb(wNarr[i], "white", isShowNum, TYPE_WHITE, undefined, 100);
            }
        }
    };



    //  在棋盘的一个点上面，打印一个标记
    CheckerBoard.prototype.wLb = function(idx, text, color, backgroundColor) {
        if (idx < 0 || idx > 224) return;
        if (this.P[idx].type != TYPE_EMPTY) {
            if (this.P[idx].type == TYPE_MARK || this.P[idx].type == TYPE_MOVE) {
                this.cleLb(idx);
            }
            else {
                this.cleNb(idx);
            }
        }
        this.P[idx].color = color;
        this.P[idx].bkColor = backgroundColor || null;
        //log(backgroundColor)
        this.P[idx].type = backgroundColor ? TYPE_MOVE : TYPE_MARK;
        this.P[idx].text = String(text);
        //this.refreshMarkLine(idx);
        this.printPoint(idx);
        this.refreshMarkArrow(idx);
    };



    // 在棋盘的一个点上面，摆一颗棋子
    CheckerBoard.prototype.wNb = function(idx, color, showNum, type, isFoulPoint, timer = "now") {

        if (idx < 0 || idx > 225) return;
        if (idx != 225 && this.P[idx].type != TYPE_EMPTY) {
            if (this.P[idx].type == TYPE_MARK || this.P[idx].type == TYPE_MOVE) {
                this.cleLb(idx);
            }
            else {
                this.cleNb(idx);
            }
        }
        let i = this.MSindex + 1;

        let colorName = this.firstColor == "black" ? ["white", "black"] : ["black", "white"],
            c = color == "auto" ? colorName[this.MSindex & 1] : color;
        if (isFoulPoint && c == "black") {
            warn(EMOJI_FOUL_THREE + idxToName(idx) + " 是禁手" + EMOJI_FOUL_THREE, 100)
        }
        this.cletLbMoves();
        if (color == "auto" || type == TYPE_NUMBER) { // 顺序添加棋子

            this.MSindex++;
            // 如果当前添加的点和历史记录不一样，就把后面没用的记录删除
            if (this.MS.length >= i && this.MS[i] != idx) {
                this.MS.length = i;
            }

            this.MS[i] = idx; //顺序添加的棋子 记录下来

        }

        this.P[idx].color = c == "black" ? this.bNumColor : this.wNumColor;
        this.P[idx].type = type == null ? color == "auto" ? TYPE_NUMBER : c == this.wNumColor ? TYPE_WHITE : TYPE_BLACK : type;
        this.P[idx].text = this.P[idx].type == TYPE_NUMBER ? String(i + 1) : "";

        this.printPoint(idx, showNum);

        this.refreshMarkArrow(idx);
        this.autoDelay(bind(function() {
            this.onMove(idx);
            this.autoShow();
        }, this), timer);
    };



    // 把 page 坐标 转成 canvas 坐标
    CheckerBoard.prototype.xyPageToObj = function(p, canvas) {

        let l = canvas.offsetLeft;
        let t = canvas.offsetTop;
        let parentNode = canvas.parentNode;
        while (parentNode != document.body && parentNode != null) {

            l += parentNode.offsetLeft;
            t += parentNode.offsetTop;
            parentNode = parentNode.parentNode;
        }
        p.x = p.x - l;
        p.y = p.y - t;
    };



    // 把 canvas 坐标 转成 page 坐标
    CheckerBoard.prototype.xyObjToPage = function(p, canvas) {

        let l = canvas.offsetLeft;
        let t = canvas.offsetTop;
        let parentNode = canvas.parentNode;
        while (parentNode != document.body && parentNode != null) {

            l += parentNode.offsetLeft;
            t += parentNode.offsetTop;
            parentNode = parentNode.parentNode;
        }
        p.x = p.x + l;
        p.y = p.y + t;
    };


    exports.TYPE_EMPTY = TYPE_EMPTY;
    exports.TYPE_MARK = TYPE_MARK; // 标记
    exports.TYPE_NUMBER = TYPE_NUMBER; // 顺序添加的棋子
    exports.TYPE_BLACK = TYPE_BLACK; // 无序号 添加的黑棋
    exports.TYPE_WHITE = TYPE_WHITE; // 无序号 添加的黑棋
    exports.TYPE_MOVE = TYPE_MOVE; //VCF手顺
    exports.TYPE_MARKFOUL = TYPE_MARKFOUL;
    exports.TYPE_MARKARROW = TYPE_MARKARROW;
    exports.TYPE_MARKLINE = TYPE_MARKLINE;

    exports.COORDINATE_ALL = COORDINATE_ALL;
    exports.COORDINATE_LEFT_UP = COORDINATE_LEFT_UP;
    exports.COORDINATE_RIGHT_UP = COORDINATE_RIGHT_UP;
    exports.COORDINATE_RIGHT_DOWN = COORDINATE_RIGHT_DOWN;
    exports.COORDINATE_LEFT_DOWN = COORDINATE_LEFT_DOWN;
    exports.COORDINATE_NONE = COORDINATE_NONE;

    exports.CheckerBoard = CheckerBoard;
})))
