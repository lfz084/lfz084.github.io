if (self.SCRIPT_VERSIONS) self.SCRIPT_VERSIONS["IndexedDB"] = "v2108.02";

(function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    'use strict';
    let database = {
        name: undefined,
        version: undefined,
        IDBDatabase: undefined
    };
    
    function openDB(name, version = 1) {
        return new Promise((resolve, reject) => {
            let request = window.indexedDB.open(name, version);
            request.onerror = function(event) {
                // Do something with request.errorCode!
                console.error(`openDB : ${event.target.errorCode}`);
                reject();
            };
            request.onsuccess = function(event) {
                // Do something with request.result!
                database.IDBDatabase = event.target.result;
                database.name = name;
                database.version = version;
                console.log(`openDB: ${name} ${version}`);
                resolve(database);
            };
            request.onupgradeneeded = function(event) {
                // 保存 IDBDataBase 接口
                let db = event.target.result;
                // 为该数据库创建一个对象仓库
                var objectStore = db.createObjectStore("name", { keyPath: "myKey" });
                console.log(`onupgradeneeded: ${name} ${version}`);
            };
        })
    }
    
    function closeDB() {
        database.IDBDatabase && (database.IDBDatabase.close(), console.log(`closeDB: ${database.name}`))
    }
    
    function deleteDB() {
        window.indexedDB.deleteDatabase(database.name);
        console.log(`deleteDB: ${database.name}`);
    }
    
})))
