const mysql = require('mysql')

module.exports = (function () {
    let dbPool = new Map();

    return {
        createPool: async function (key, settingsObj) {
            if (dbPool.get(key)) {
                throw 'Pool is created already';
            }

            dbPool.set(key, await mysql.createPool(settingsObj));
        },

        getPool: async function (key) {
            if (!dbPool.get(key)) {
                throw 'createPool first';
            }
            return dbPool.get(key);
        }
    }
})();