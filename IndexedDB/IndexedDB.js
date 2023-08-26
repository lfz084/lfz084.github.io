if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["IndexedDB"] = "v2110.02";

(function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    'use strict';

    const DEFAULT_OBJECTSTORE_INFO = {
        name: "objectStore",
        optionalParameters: {
            keyPath: "ID",
            autoIncrement: false
        },
        indexInfoList: [{
            indexName: "indexName",
            keyPath: "index",
            objectParameters: { unique: false, multiEntry: false }
        }]
    };

    function isPromise(obj) {
        return obj && "Promise" === (obj.constructor && obj.constructor.name)
    }

    function getTransaction(storeName, mode = "readonly") {
        try {
            return this.database.transaction(storeName, mode);
        }
        catch (e) {
            console.error(e.message);
        }
    }

    function getStore(storeName, mode = "readonly") {
        if (this.database && this.database.constructor.name == "IDBDatabase") {
            let transaction = this.getTransaction(storeName, mode);
            if (transaction && transaction.constructor.name == "IDBTransaction") {
                return transaction.objectStore(storeName);
            }
            else console.error(`Error transaction is not IDBTransaction`)
        }
        else console.error(`Error this.database is not IDBDatabase`)
    }

    function getIndex(storeName, indexName, mode = "readonly") {
        let store = this.getStore(storeName, mode);
        if (store && store.constructor.name == "IDBObjectStore") {
            return store.index(indexName);
        }
        else console.error(`Error store is not IDBObjectStore`)
    }

    async function add(store, data, key) { //add data
        return new Promise(resolve => {
            try {
                if (!store) { resolve(false); return };
                let request = store.add(data, key);
                request.onerror = function(event) {
                    console.error(`Error adding new data`);
                    resolve(false);
                };
                request.onsuccess = function(event) { resolve(true) };
            } catch (e) {
                console.error(e.stack);
                resolve(false);
            }
        })
    }

    async function put(store, data, key) { //put data
        return new Promise(resolve => {
            try {
                if (!store) { resolve(false); return };
                let request = store.put(data, key);
                request.onerror = function(event) {
                    console.error(`Error putting new data`);
                    resolve(false);
                };
                request.onsuccess = function(event) { resolve(true) };
            } catch (e) {
                console.error(e.stack);
                resolve(false);
            }
        })
    }

    async function get(IDBobj, value) { //get data
        return new Promise(resolve => {
            try {
                if (!IDBobj) { resolve(); return };
                let request = IDBobj.get(value);
                request.onerror = function(event) {
                    console.error(`Error getting new data`);
                    resolve();
                };
                request.onsuccess = function(event) {
                    resolve(event.target.result);
                };
            } catch (e) {
                console.error(e.stack);
                resolve();
            }
        })
    }

    async function del(store, value) { //delete data
        return new Promise(resolve => {
            try {
                if (!store) { resolve(false); return };
                let request = store.delete(value);
                request.onerror = function(event) {
                    console.error(`Error deleting new data`);
                    resolve(false);
                };
                request.onsuccess = function(event) { resolve(true) };
            } catch (e) {
                console.error(e.stack);
                resolve(false);
            }
        })
    }

    async function openDB(name, version = 1, createStoreList = [DEFAULT_OBJECTSTORE_INFO], deleteStoreList = []) {
        return new Promise(resolve => {
            try {
                let request = exports.indexedDB.open(name, version);
                request.onerror = function(event) {
                    // Do something with request.errorCode!
                    console.error(`openDB : ${request.errorCode}`);
                    resolve();
                }.bind(this);
                request.onsuccess = function(event) {
                    // Do something with request.result!
                    this.database = event.target.result;
                    this.name = name;
                    this.version = version;
                    console.log(`openDB: "${name}" ${version}`);
                    console.log(this.database.objectStoreNames)
                    resolve(this);
                }.bind(this);
                request.onupgradeneeded = function(event) {
                    // 保存 IDBDataBase 接口
                    let db = event.target.result;
                    // 为该数据库创建一个对象仓库
                    createStoreList.map(info => {
                        let logStr = "";
                        if (!db.objectStoreNames.contains(info.name)) {
                            let objectStore = db.createObjectStore(info.name, info.optionalParameters);
                            logStr += `createObjectStore name: "${info.name}", optionalParameters: ${info.optionalParameters && `{ keyPath: "${info.optionalParameters.keyPath}", autoIncrement: ${info.optionalParameters.autoIncrement} }`}\n`
                            info.indexInfoList && info.indexInfoList.map(indexInfo => {
                                objectStore.createIndex(indexInfo.indexName, indexInfo.keyPath, indexInfo.objectParameters);
                                logStr += `createIndex indexName: "${indexInfo.indexName}", keyPath: "${indexInfo.keyPath}", unique: ${indexInfo.objectParameters && indexInfo.objectParameters.unique}, multiEntry: ${indexInfo.objectParameters && indexInfo.objectParameters.multiEntry}\n`
                            })
                        }
                        console.log(logStr);
                    })
                    deleteStoreList.map(info => {
                        let logStr = "";
                        if (db.objectStoreNames.contains(info.name)) {
                            db.deleteObjectStore(info.name);
                            logStr += `deleteObjectStore name: ${info.name}\n`
                        }
                        console.log(logStr);
                    })
                    console.log(`onupgradeneeded name: "${name}", version: ${version}`);
                }.bind(this);
            } catch (e) {
                console.error(e.stack);
                resolve();
            }
        })
    }

    async function count(idbIndex, key) {
        return new Promise(resolve => {
            try {
                let countRequest = idbIndex.count(key);
                countRequest.onsuccess = () => {
                    resolve(countRequest.result);
                };
            } catch (e) { 
                console.error(e.stack); 
                resolve();
            }
        })
    }

    function closeDB() {
        try {
            if (this.database) {
                this.database.close();
                console.log(`closeDB: "${this.name}"`);
                this.name = undefined;
                this.version = undefined;
                this.database = undefined;
            }
        } catch (e) { console.error(e.stack) }
    }

    function deleteDB() {
        try {
            let name = this.name;
            this.close();
            console.log(`deleteDB: "${name}"`);
            return exports.indexedDB.deleteDatabase(name);
        } catch (e) { console.error(e.stack) }
    }

    function clearStore(storeName) {
        try {
            let store = this.getStore(storeName, "readwrite");
            store.clear();
            return true;
        } catch (e) { console.error(e.stack); return false }
    }

    async function addData(storeName, dataList, key) {
        try {
            let store = this.getStore(storeName, "readwrite");
            for (let i = 0; i < dataList.length; i++) {
                if (false == await add(store, dataList[i]), key) {
                    return false;
                }
                console.log(`addData ${i+1}/${dataList.length}`)
            }
            return true;
        } catch (e) { console.error(e.stack); return false }
    }

    async function putData(storeName, dataList, key) {
        try {
            let store = this.getStore(storeName, "readwrite");
            for (let i = 0; i < dataList.length; i++) {
                if (false == await put(store, dataList[i], key)) {
                    return false;
                }
                console.log(`putData ${i+1}/${dataList.length}`)
            }
            return true;
        } catch (e) { console.error(e.stack); return false }
    }

    async function getDataByKey(storeName, value) {
        try {
            let store = this.getStore(storeName, "readonly");
            return await get(store, value);
        } catch (e) { console.error(e.stack) }
    }

    async function getDataByIndex(storeName, indexName, value) {
        try {
            let index = this.getIndex(storeName, indexName, "readonly");
            return await get(index, value);
        } catch (e) { console.error(e.stack) }
    }

    async function deleteDataByKey(storeName, value) {
        try {
            let store = this.getStore(storeName, "readwrite");
            return await del(store, value);
        } catch (e) { console.error(e.stack); return false }
    }

    let IndexedDB = {
        name: undefined,
        version: undefined,
        database: undefined
    };
    IndexedDB.getTransaction = getTransaction.bind(IndexedDB);
    IndexedDB.getStore = getStore.bind(IndexedDB);
    IndexedDB.getIndex = getIndex.bind(IndexedDB);
    IndexedDB.open = openDB.bind(IndexedDB);
    IndexedDB.close = closeDB.bind(IndexedDB);
    IndexedDB.count = count.bind(IndexedDB);
    IndexedDB.delete = deleteDB.bind(IndexedDB);
    IndexedDB.clearStore = clearStore.bind(IndexedDB);
    IndexedDB.addData = addData.bind(IndexedDB);
    IndexedDB.putData = putData.bind(IndexedDB);
    IndexedDB.getDataByKey = getDataByKey.bind(IndexedDB);
    IndexedDB.getDataByIndex = getDataByIndex.bind(IndexedDB);
    IndexedDB.deleteDataByKey = deleteDataByKey.bind(IndexedDB);

    exports.IndexedDB = IndexedDB;

    /*------------------- test code ------------------------*/

    let uint8 = new Uint8Array(1024).fill(1),
        students = [],
        students2 = [];
    for (let i = 0; i < 10; i++) {
        students.push({
            id: [i, i],
            name: i,
            age: i,
            uint8: uint8
        })
        i > 5 && students2.push({
            id: [i, i],
            name: i,
            age: i & 1,
            uint8: uint8
        })
    }

    async function test() {
        let out = await IndexedDB.open("test", 1, [{
                name: "test",
                optionalParameters: {
                    keyPath: "id",
                    autoIncrement: false
                },
                indexInfoList: [{
                    indexName: "age",
                    keyPath: "age",
                    objectParameters: { unique: false, multiEntry: false }
                }, {
                    indexName: "name",
                    keyPath: "name",
                    objectParameters: { unique: true, multiEntry: false }
                }]
        }, {
                name: "test1",
                indexInfoList: [{
                    indexName: "age",
                    keyPath: "age",
                    objectParameters: { unique: false, multiEntry: false }
                }, {
                    indexName: "name",
                    keyPath: "name",
                    objectParameters: { unique: true, multiEntry: false }
                }]
        }, {
                name: "test2"
    }],
    [{
                name: "ttt",
        }, {
                name: "test1"
        }, {
                name: "test2"
    }])
        console.log(out)

        out = await IndexedDB.getStore("test")
        console.log(out)

        out = await IndexedDB.getIndex("test", "age")
        console.log(out)

        out = await IndexedDB.addData("test", students)
        console.log(out)

        out = await IndexedDB.putData("test", students2)
        console.log(out)

        out = await IndexedDB.getDataByKey("test", [5, 5])
        console.log(`${out && out.id}`)

        out = await IndexedDB.getDataByIndex("test", "age", 1)
        console.log(`${out && out.id}`)

        out = await IndexedDB.getDataByIndex("test", "age", 0)
        console.log(`${out && out.id}`)
        
        out = await IndexedDB.count(await IndexedDB.getStore("test"));
        console.log(`${out}`)

        console.log(`test deleteDataByKey ${await IndexedDB.deleteDataByKey("test", 1001)}`)

        console.log(`test clearStore ${IndexedDB.clearStore("test")}`)

        console.log(IndexedDB.delete("test"))
    }

    IndexedDB.test = test;

})))
