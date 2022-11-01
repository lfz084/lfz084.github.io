if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["worker"] = "v2108.03";
/Worker/.exec(`${self}`) && (function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    'use strict';
    //console.log(exports);

    if ("importScripts" in self) 
        self.importScripts('emoji.js', `EvaluatorWebassembly.js`, `EvaluatorJScript.js`, `Evaluator.js`);

    let isWorkerBusy = false;
    const MSG_RESOLVE = { cmd: "resolve" };
    const COMMAND = {
        setGameRules: function ({rules}) {
            isWorkerBusy = true;
            let timer = setInterval(() => {
                if ("setGameRules" in self) {
                    clearInterval(timer);
                    setGameRules(rules);
                    post({ cmd: "info", param: `已经设置为${[undefined,"无禁","有禁"][rules]}规则`});
                    post(MSG_RESOLVE);
                    isWorkerBusy = false;
                }
            }, 10)
        },
        getLevelB: function({arr, color, maxVCF, maxDepth, maxNode}) {
            getLevelB(arr, color, maxVCF, maxDepth, maxNode);
            //post({ cmd: "levelBInfo", param: { levelBInfo: levelBInfo } });
            //post(MSG_RESOLVE);
            post({cmd: "resolve", param: levelBInfo})
        },
        findVCF: function({ arr, color, maxVCF, maxDepth, maxNode }) {
            findVCF(arr, color, maxVCF, maxDepth, maxNode);
            //post({cmd: "vcfInfo", param: {vcfInfo: vcfInfo}});
            //post(MSG_RESOLVE);
            post({cmd: "resolve", param: vcfInfo})
        },
        getBlockVCF: function({arr, color, vcfMoves, includeFour}) {
            let points = getBlockVCF(arr, color, vcfMoves, includeFour);
            //post({ cmd: "points", param: { points: points } });
            //post(MSG_RESOLVE);
            post({cmd: "resolve", param: points})
        },
        selectPoints: function({ arr, color, radius, maxVCF, maxDepth, maxNode}) {
            let selectArr = selectPoints(arr, color, radius, maxVCF, maxDepth, maxNode);
            //post({ cmd: "selectPoints", param: { selectArr: selectArr } });
            //post(MSG_RESOLVE);
            post({cmd: "resolve", param: selectArr})
        },
        selectPointsLevel: function({ arr, color, radius, maxVCF, maxDepth, maxNode, nMaxDepth}) {
            let selectArr = selectPointsLevel(arr, color, radius, maxVCF, maxDepth, maxNode, nMaxDepth);
            //post({ cmd: "selectPointsLevel", param: { selectArr: selectArr } });
            //post(MSG_RESOLVE);
            post({cmd: "resolve", param: selectArr})
        },
        excludeBlockVCF: function({points, arr, color, maxVCF, maxDepth, maxNode}) {
            let ps = excludeBlockVCF(points, arr, color, maxVCF, maxDepth, maxNode);
            //post({ cmd: "points", param: { points: ps } });
            //post(MSG_RESOLVE);
            post({cmd: "resolve", param: ps})
        },
        getBlockPoints: function({arr, color, radius, maxVCF, maxDepth, maxNode}) {
            let ps = getBlockPoints(arr, color, radius, maxVCF, maxDepth, maxNode);
            //post({ cmd: "points", param: { points: ps } });
            //post(MSG_RESOLVE);
            post({cmd: "resolve", param: ps})
        }
    };

    function onmessage(e) {
        /*let i = 0,
            timer = setInterval(() => {
                if (i++ < 30) post({ cmd: "log", param: i });?
                else post(MSG_RESOLVE);
            }, 1000);*/

        if (isWorkerBusy) throw new Error("Worker onmessage Error: Worker is Busy");
        else if (typeof COMMAND[e.data.cmd] == "function") {
            //post({cmd: "info", param: e.data.param});
            COMMAND[e.data.cmd](e.data.param);
        }
        else throw new Error(`Worker onmessage Error: not found cmd "${e.data.cmd}"`);
    }

    function post({ cmd, param }) {
        typeof postMessage == "function" && postMessage({ cmd: cmd, param: param });
    }
    
    exports.onmessage = onmessage;
    exports.post = post;
})))
