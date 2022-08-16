if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["RenjuTree"] = "v2015.03";
(function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    'use strict';
    //console.log(exports);

    function getPath(node) {
        let path = [];
        while (node.parentNode) {
            node = node.parentNode;
            path.splice(0, 0, node.idx);
        }
        path.splice(0, 1);
        return path;
    }

    function getRoot(node) {
        while (node.parentNode) {
            node = node.parentNode;
        }
        return node;
    }

    function getDown(node) {
        if (node.childNode.length)
            return node.childNode[0];
        if (node.defaultChildNode && node.defaultChildNode.length)
            return node.defaultChildNode[0];
        return null;
    }

    function getRight(self) {
        let parentNode = self.parentNode;
        if (parentNode) {
            let nodes = parentNode.childNode;
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i] === self) return nodes[i + 1] || null;
            }
        }
        else {
            return null;
        }
    }

    function setParentNode(parentNode, childNode) {
        childNode.parentNode = parentNode;
    }

    function getChildNode(node, idx) {
        //alert(`node=${node}, ${node.childNode.constructor.name}`)
        for (let i = node.childNode.length - 1; i >= 0; i--) {
            if (node.childNode[i].idx === idx)
                return node.childNode[i];
        }
        if (node.defaultChildNode) {
            for (let i = node.defaultChildNode.length - 1; i >= 0; i--) {
                if (node.defaultChildNode[i].idx === idx)
                    return node.defaultChildNode[i];
            }
        }
        return null;
    }


    function pushChildNode(parentNode, childNode) {
        parentNode.childNode.push(childNode);
        setParentNode(parentNode, childNode);
    }

    function popChildNode(parentNode) {
        let rt = parentNode.childNode[parentNode.childNode.length - 1];
        parentNode.childNode.length--;
        return rt;
    }

    function addBranch(tree, branch) {
        pushChildNode(getVariant(tree, branch.path), branch.node)
    }

    function addBranchArray(tree, arrStack) {
        for (let i = arrStack.length - 1; i >= 0; i--) {
            //alert(`addBranchArray, i=${i}`)
            addBranch(tree, arrStack[i])
        }
    }

    function getVariant(node, path) {
        for (let i = path.length - 1; i >= 0; i--) {
            node = getChildNode(node, path[i])
        }
        if (node)
            return node
        else
            throw new Error("nd is not RenjuNode")
    }

    //----------------------------------------------------

    function Point2Idx(point) {
        return point.x + point.y * 15;
    }

    function Idx2Point(idx) {
        let x = idx % 15,
            y = ~~(idx / 15);
        return { x: x, y: y }
    }

    function rotate90(point) {
        let x = 7 - point.x,
            y = 7 - point.y;
        return { x: 7 + y, y: 7 - x }
    }

    function rotate180(point) {
        let x = 7 - point.x,
            y = 7 - point.y;
        return { x: 7 + x, y: 7 + y }
    }

    function rotate270(point) {
        let x = 7 - point.x,
            y = 7 - point.y;
        return { x: 7 - y, y: 7 + x }
    }

    function reflectX(point) {
        return { x: point.x, y: 14 - point.y }
    }

    function normalizeCoord(point, nMatch) {
        switch (nMatch) {
            case 0:
            case 4:
                break;
            case 1:
            case 5:
                point = rotate270(point);
                break;
            case 2:
            case 6:
                point = rotate180(point);
                break;
            case 3:
            case 7:
                point = rotate90(point);
                break;
        }
        if (nMatch > 3) point = reflectX(point);
        return point;
    }

    function transposeCoord(point, nMatch) {
        if (nMatch > 3) point = reflectX(point);
        switch (nMatch) {
            case 0:
            case 4:
                break;
            case 1:
            case 5:
                point = rotate90(point);
                break;
            case 2:
            case 6:
                point = rotate180(point);
                break;
            case 3:
            case 7:
                point = rotate270(point);
                break;
        }
        return point;
    }


    class RenjuNode {
        constructor(idx = `-1`, parentNode, childNode = [], defaultChildNode = []) {
            if (typeof idx == "object") {
                let object = idx;
                this.parentNode = object.parentNode;
                this.childNode = object.childNode || [];
                this.defaultChildNode = object.defaultChildNode || [];
                this.idx = object.idx || -1;
                this.txt = object.txt || "";
                //this.txtColor = object.txtColor || "black";
                this.innerHTML = object.innerHTML || "";
            }
            else {
                this.parentNode = parentNode;
                this.childNode = childNode;
                this.defaultChildNode = defaultChildNode;
                this.idx = idx;
                this.txt = "";
                //this.txtColor = "black";
                this.innerHTML = "";
            }
        }
    }

    RenjuNode.prototype.getPos = function() {
        return Idx2Point(this.idx)
    }

    RenjuNode.prototype.getPath = function() {
        return getPath(this)
    }

    RenjuNode.prototype.getRoot = function() {
        return getRoot(this);
    }

    RenjuNode.prototype.getDown = function() {
        return getDown(this);
    }

    RenjuNode.prototype.getRight = function() {
        return getRight(this);
    }

    RenjuNode.prototype.setParentNode = function(parentNode) {
        setParentNode(parentNode, this);
    }

    RenjuNode.prototype.pushChildNode = function(childNode) {
        pushChildNode(this, childNode)
    }

    RenjuNode.prototype.popChildNode = function() {
        return popChildNode(this)
    }

    RenjuNode.prototype.getChildNode = function(idx) {
        return getChildNode(this, idx)
    }



    class RenjuBranch {
        constructor(path, node) {
            this.path = path;
            this.node = node;
        }
    }



    class RenjuTree {
        constructor(firstColor = "black", keyMap = new Map()) {
            if (typeof firstColor == "object") {
                let object = firstColor;
                this.childNode = object.childNode || [];
                this.firstColor = object.firstColor || "black";
                this.idx = object.idx || -1;
                this.txt = object.txt || "";
                this.txtColor = object.txtColor || "black";
                this.innerHTML = object.innerHTML || "";
                this.keyMap = object.keyMap || new Map();
                this.autoColor = object.autoColor;
                this.moveNodes = [];
                this.moveNodesIndex = -1;
            }
            else {
                this.childNode = [];
                this.firstColor = firstColor;
                this.idx = -1;
                this.txt = "";
                this.txtColor = "black";
                this.innerHTML = "";
                this.keyMap = keyMap;
                this.autoColor;
                this.moveNodes = [];
                this.moveNodesIndex = -1;
            }
        }
    }

    RenjuTree.prototype.getPath = function() {
        return getPath(this)
    }

    RenjuTree.prototype.getRoot = function() {
        return getRoot(this);
    }

    RenjuTree.prototype.getDown = function() {
        return getDown(this);
    }

    RenjuTree.prototype.getRight = function() {
        return getRight(this);
    }

    RenjuTree.prototype.pushChildNode = function(childNode) {
        pushChildNode(this, childNode)
    }

    RenjuTree.prototype.popChildNode = function() {
        return popChildNode(this)
    }

    RenjuTree.prototype.getChildNode = function(idx) {
        return getChildNode(this, idx)
    }

    RenjuTree.prototype.addBranch = function(branch) {
        addBranch(this, branch)
    }

    RenjuTree.prototype.addBranchArray = function(arrStack) {
        addBranchArray(this, arrStack)
    }

    RenjuTree.prototype.getVariant = function(path) {
        return getVariant(this, path)
    }

    RenjuTree.prototype.getBranchNodes = function(path) {

        function normalizeNodes(nodes, nMatch) {
            let idx,
                txt,
                rt = [];
            for (let i = 0; i < nodes.length; i++) {
                nodes[i].idx = Point2Idx(normalizeCoord(Idx2Point(nodes[i].idx), nMatch))
                //nodes[i].txt = nMatch>0 && nodes[i].txt == "○" ? "●" : nodes[i].txt; 
                rt[i] = nodes[i];
            }
            return rt;
        }

        function transposePath(path, nMatch) {
            let rt = [];
            for (let i = 0; i < path.length; i++) {
                rt[i] = Point2Idx(transposeCoord(Idx2Point(path[i]), nMatch))
            }
            return rt;
        }

        function searchInnerHTMLInfo(path = []) {
            let pMove = this,
                innerHTMLInfo = { innerHTML: this.innerHTML, depth: -1 };
            for (let i = 0; i < path.length; i++) {
                pMove = getChildNode(pMove, path[i]);
                if (pMove) {
                    let innerHTML = pMove.innerHTML;
                    if (innerHTML && i === path.length - 1) innerHTMLInfo = { innerHTML: innerHTML, depth: i };
                }
                else {
                    break;
                }
            }
            return innerHTMLInfo;
        }

        function getTXT(pMove) {
            return pMove.txt || "○";
        }

        function pushNodes(nodes1, nodes2) {
            function hasNode(nodes, node) {
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].idx === node.idx) return true
                }
                return false;
            }
            for (let i = nodes2.length - 1; i >= 0; i--) {
                if (hasNode(nodes1, nodes2[i])) nodes2.splice(i, 1);
            }
            return nodes1.concat(nodes2);
        }

        function _getBranchNodes(path) {
            let done = false,
                pMove = getDown(this),
                nodes = [],
                jointNodes = [],
                jointNode = null,
                moveList = [],
                moveStack = [],
                defaultNode;
            while (!done) {
                console.error(`${pMove}, ${pMove && pMove.idx} [${moveList}]`)
                if (pMove) {
                    let idx = path.indexOf(pMove.idx);
                    moveList.push(pMove.idx);
                    console.log(`getRight ${getRight(pMove)}`)
                    if (getRight(pMove) &&
                        moveList.length <= path.length + 1
                    ) {
                        //console.log(`stack push ${getRight(pMove).idx}`)
                        moveStack.push({ pMove: getRight(pMove), length: moveList.length - 1 });
                    }

                    if (moveList.length & 1 === (path.length + 1) & 1) {
                        if (idx === -1 ||
                            moveList.length & 1 !== (idx + 1) & 1
                        ) {
                            if (!jointNode) {
                                jointNode = { pMove: pMove, length: moveList.length - 1 }
                            }
                            else {
                                pMove = null;
                                continue;
                            }
                        }
                    }
                    else {
                        if (idx === -1 ||
                            moveList.length & 1 !== (idx + 1) & 1
                        ) {
                            pMove = false;
                            continue;
                        }
                    }

                    if ((idx === -1 ||
                            moveList.length & 1 === (idx + 1) & 1) &&
                        moveList.length <= path.length + 1
                    ) {
                        if (moveList.length === path.length + 1) {
                            let node = new RenjuNode(pMove);
                            if (idx === -1) {
                                nodes.push(node);
                            }
                            else {
                                node.idx = jointNode.pMove.idx;
                                jointNodes.push(node);
                            }
                        }
                        pMove = getDown(pMove);
                    }
                    else {
                        pMove = 0;
                    }
                }
                else if (moveStack.length) {
                    let node = moveStack.pop();
                    pMove = node.pMove;
                    //console.log(`stack pop ${pMove.idx}`)
                    moveList.length = node.length;
                    if (jointNode && moveList.length <= jointNode.length) jointNode = null;
                }
                else {
                    done = true;
                }
            }

            return jointNodes.concat(nodes);
        }

        let done = false,
            innerHTMLInfo = { innerHTML: "", depth: -2 },
            nodes = [],
            PH,
            NS,
            normalizeNS,
            defaultNode;

        for (let i = 0; i < 1; i++) {
            PH = transposePath(path, i);
            //console.log(PH)
            NS = _getBranchNodes.call(this, PH);
            console.info(NS[0] && NS[0].idx)
            normalizeNS = normalizeNodes(NS, i);
            //console.log(`i=${i}, ${NS[0].idx}`)
            nodes = pushNodes(nodes, normalizeNS);
            let info = searchInnerHTMLInfo.call(this, PH);
            if (info.depth > innerHTMLInfo.depth) innerHTMLInfo = info;
        }

        return { nodes: nodes, innerHTML: innerHTMLInfo.innerHTML };
    }


    exports.RenjuNode = RenjuNode;
    exports.RenjuBranch = RenjuBranch;
    exports.RenjuTree = RenjuTree;
})))

