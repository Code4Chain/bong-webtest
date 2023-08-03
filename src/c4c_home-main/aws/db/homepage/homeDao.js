const mysql = require('mysql');
const db = require('../dbPoolCreator');
const key = "home";

class HomeDao {
    constructor() {
        require('dotenv').config();

        let settingObj = {
            host: process.env.MARKET_DB_ENDPOINT,
            port: 3306,
            user: process.env.MARKET_DB_ID,
            password: process.env.MARKEY_DB_PASSWORD,
            multipleStatements: false,
            database: "homepage",
            connectionLimit: 10,
        }

        db.createPool(key, settingObj).then(() => this.initDB());
    }

    initDB() {
        console.log("init homepage DB");
    }

    sqlHandler = (sql, values) => {
        let _sql = sql;

        if (values) {
            _sql = mysql.format(sql, values)
        }

        console.log(_sql)
        return new Promise(async (resolve, reject) => {
            try {
                // pool을 가져오는 과정
                const dbPool = await db.getPool(key)

                // pool에서 연결객체를 가져오는 과정
                dbPool.getConnection((err, conn) => {
                    if (err) {
                        if (conn) conn.release();
                        return reject(err)
                    }
                    // 내부 콜백에서 쿼리를 수행
                    conn.query(_sql, (err, rows, fields) => {
                        conn.release();
                        if (err) return reject(err)
                        resolve(rows)
                    })
                })
            } catch (err) {
                return reject(err)
            }
        })
    }

    createNews = async (imageUrl, title, contents, date, url) => {
        return this.sqlHandler("INSERT INTO News (ImageUrl, Title, Contents, Date, Url) VALUES (?, ?, ?, ?, ?)", [imageUrl, title, contents, date, url]);
    }

    updateNews = async (id, imageUrl, title, contents, date, url) => {
        return this.sqlHandler("UPDATE News SET ImageUrl = ?, Title = ?, Contents = ?, Date = ?, Url = ? WHERE Id = ?", [imageUrl, title, contents, date, url, id]);
    }

    deleteNews = async (id) => {
        return this.sqlHandler("DELETE FROM News WHERE Id = ?", [id]);
    }

    getNews = async () => {
        return this.sqlHandler("SELECT * FROM News ORDER BY Id DESC");
    }

    updateDisplay = async (ceo) => {
        return this.sqlHandler("UPDATE Display SET CEO = ?", [ceo]);
    }

    getDisplay = async () => {
        return this.sqlHandler("SELECT * FROM Display");
    }
}

module.exports = new HomeDao()