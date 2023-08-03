const mysql = require('mysql');
const { loadMarket, setMarketOwner } = require('../../../blockchain/nodeApi');
const encrypter = require('../../../utils/encrypter');
const db = require('../dbPoolCreator');
const key = "market";

class MarketDao {
    DB_VERSION = 1;

    constructor() {
        require('dotenv').config();

        let settingObj = {
            host: process.env.MARKET_DB_ENDPOINT,
            port: 3306,
            user: process.env.MARKET_DB_ID,
            password: process.env.MARKEY_DB_PASSWORD,
            multipleStatements: false,
            database: "market",
            connectionLimit: 30,
        }

        db.createPool(key, settingObj).then(() => this.initDB());
    }

    initDB() {
        this.sqlHandler("SHOW TABLES").then(ret => {
            if (ret.length == 0) {
                this.createDB();
            } else {
                this.migrationDB();
            }
        });

        this.getMarketInfo().then(ret => {
            //createStore();
            //loadStore(ret[0].SolMarket, ret[0].RoaCoreMarket);
        });
    }

    createDB() {
        console.log("create db")

        this.sqlHandler("CREATE TABLE IF NOT EXISTS User (Uid INT NOT NULL AUTO_INCREMENT PRIMARY KEY, Name VARCHAR(128), Email VARCHAR(128), LoginType INT, Avatar VARCHAR(256), Background VARCHAR(256), CustomUrl VARCHAR(256), Bio VARCHAR(1024), JoinTime TIMESTAMP, Grade INT DEFAULT 1, Creator BOOL DEFAULT false, Admin BOOL DEFAULT false, Twitter VARCHAR(256), Facebook VARCHAR(256), Instagram VARCHAR(256), Marketing BOOL DEFAULT false)") // type : 0(email), 1(google)
        this.sqlHandler("ALTER TABLE User AUTO_INCREMENT = 1000");
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Password (Uid INT, Password VARCHAR(64), Salt VARCHAR(64))")
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Verification (Email VARCHAR(128), Code VARCHAR(5), ExpiredTime TIMESTAMP)")
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Market (Address VARCHAR(64), MarketFee FLOAT DEFAULT 0, Version INT DEFAULT 0)")
        this.sqlHandler("INSERT INTO Market (Address, MarketFee, Version) VALUES (?, ?, ?)", ['', 0, this.DB_VERSION])
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Wallet (Uid INT, Chain VARCHAR(16), Address VARCHAR(64), Private VARCHAR(256), Iv VARCHAR(16))")
        this.sqlHandler("CREATE TABLE IF NOT EXISTS TokenContract (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, Chain VARCHAR(16), Address VARCHAR(64), Symbol VARCHAR(64), Enabled BOOL DEFAULT true)")
        this.sqlHandler("INSERT INTO TokenContract (Chain, Address, Symbol) VALUES (?, ?, ?)", [process.env.DEFAULT_CHAIN, "0x0", "MATIC"])
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Category (Name VARCHAR(64), Image VARCHAR(256))")
        this.sqlHandler("INSERT INTO Category (Name, Image) VALUES (?, ?)", ["ART", ""])
        this.sqlHandler("INSERT INTO Category (Name, Image) VALUES (?, ?)", ["GAME", ""])
        this.sqlHandler("INSERT INTO Category (Name, Image) VALUES (?, ?)", ["MUSIC", ""])
        this.sqlHandler("CREATE TABLE IF NOT EXISTS NftContract (Address VARCHAR(64), Enabled BOOL DEFAULT true, Title VARCHAR(128), Symbol VARCHAR(128), TokenType VARCHAR(16), TotalSupply INT DEFAULT 0, ImageUrl VARCHAR(256), Description VARCHAR(4096), ExternalUrl VARCHAR(256), Category VARCHAR(256), CreatorUid INT DEFAULT 0, CreatorFee FLOAT DEFAULT 0, CreationTime TIMESTAMP)")
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Nft (Contract VARCHAR(64), TokenId INT, Title VARCHAR(64), Description VARCHAR(4096), MetadataUrl VARCHAR(256), MediaUrl VARCHAR(256), OwnerUid INT DEFAULT 0, OwnerAddress VARCHAR(64), CreatorUid INT DEFAULT 0, CreationTime TIMESTAMP, Enabled BOOL DEFAULT true)")
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Likes (Uid INT, Contract VARCHAR(64), TokenId INT)")
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Sell (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, Contract VARCHAR(64), TokenId INT, SellerUid INT, SellPrice FLOAT, CurrencyTokenId INT, SellStartTime TIMESTAMP, State INT DEFAULT 1, TxHash VARCHAR(67))") // state : 1(valid), 2(canceled), 3(exired), 4(done), 5(updated)
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Notification (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, Uid INT, Type VARCHAR(32), Contents VARCHAR(1024), Link VARCHAR(256), DataInt INT, DataStr VARCHAR(256), Contract VARCHAR(64), TokenId INT, Address VARCHAR(64), CreationTime TIMESTAMP, Checked BOOL DEFAULT false)")
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Trade (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, Contract VARCHAR(64), TokenId INT, BuyerUid INT, SellerUid INT, Price FLOAT, CurrencyTokenId INT, TradeTime TIMESTAMP, State INT, TxHash VARCHAR(67))") // state : 1(buy now), 2(accept offer), 3(auction)
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Offer (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, Contract VARCHAR(64), TokenId INT, BuyerUid INT, OfferPrice FLOAT, CurrencyTokenId INT, OfferStartTime TIMESTAMP, State INT DEFAULT 1, TxHash VARCHAR(67))") // state : 1(valid), 2(canceled), 3(exired), 4(done), 5(updated)
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Log (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, Time TIMESTAMP, Caller INT, Type VARCHAR(32), Params VARCHAR(1024), Status SMALLINT, Contents VARCHAR(128))");
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Notice (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, CreationTime TIMESTAMP, Category SMALLINT, Title VARCHAR(256), Contents VARCHAR(2048))"); // category : 0 (notice), 1(event), 2 (announce)
        this.sqlHandler("CREATE TABLE IF NOT EXISTS FaQ (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, Category VARCHAR(32), Title VARCHAR(256), Contents VARCHAR(2048))");
        this.sqlHandler("CREATE TABLE IF NOT EXISTS Promotion (Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, Title VARCHAR(256), ImageUrl VARCHAR(256), Link VARCHAR(256))");
        this.sqlHandler("CREATE TABLE IF NOT EXISTS CreatingProcess (Uid INT, Step INT, Progress INT)");
    }

    migrationDB() {
        console.log("migration db")

        this.sqlHandler("SELECT * FROM Market").then((ret) => {
            console.log("version = " + ret[0].Version);

            loadMarket(ret[0].Address);
        });

        this.sqlHandler("SELECT * FROM Wallet WHERE Uid = 0").then((ret) => {
            setMarketOwner({
                public: ret[0].Address,
                private: encrypter.decipher(ret[0].Private, ret[0].Iv)
            });
        });
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

    getLoginInfo = (email, loginType) => {
        return this.sqlHandler("SELECT * FROM Password WHERE Uid = (SELECT Uid FROM User WHERE Email = ? AND LoginType = ?)", [email, loginType]);
    }

    createUser = async (name, email, password, salt, loginType, marketing) => {
        await this.sqlHandler("INSERT INTO User (Name, Email, LoginType, JoinTime, Marketing) VALUES (?, ?, ?, NOW(), ?)", [name, email, loginType, marketing]);
        const ret = await this.sqlHandler("SELECT Uid FROM User WHERE Email = ? LIMIT 1;", email)
        await this.sqlHandler("INSERT INTO Password (Uid, Password, Salt) VALUES (?, ?, ?)", [ret[0].Uid, password, salt]);
        return ret[0].Uid;
    }

    changePassword = async (uid, password, salt) => {
        return this.sqlHandler("UPDATE Password SET Password = ?, Salt = ? WHERE Uid = ?", [password, salt, uid]);
    }

    getUser = (address) => {
        return this.sqlHandler("SELECT * FROM User WHERE Uid = (SELECT Uid FROM Wallet WHERE Address = ? LIMIT 1)", [address]);
    }

    getUsers = () => {
        return this.sqlHandler("SELECT * FROM User");
    }

    getUserById = (uid) => {
        return this.sqlHandler("SELECT * FROM User WHERE Uid = ?", [uid]);
    }

    getUserByName = (name) => {
        return this.sqlHandler("SELECT * FROM User WHERE Name = ?", name);
    }

    getUserByEmail = (email) => {
        return this.sqlHandler("SELECT * FROM User WHERE Email = ?", email);
    }

    getUserBySocial = (email, loginType) => {
        return this.sqlHandler("SELECT * FROM User WHERE Email = ? AND LoginType = ?", [email, loginType]);
    }

    updateUser = async (uid, name, email, avatar, background, customUrl, bio, twitter, facebook, instagram) => {
        return this.sqlHandler("UPDATE User SET Name = ?, Email = ?, Avatar = ?, Background = ?, CustomUrl = ?, Bio = ?, Twitter = ?, Facebook = ?, Instagram = ? WHERE Uid = ?", [name, email, avatar, background, customUrl, bio, twitter, facebook, instagram, uid]);
    }

    updateUserCreator = async (uid, creator) => {
        return this.sqlHandler("UPDATE User SET Creator = ? WHERE Uid = ?", [creator, uid]);
    }

    getAllNftContracts = async () => {
        return this.sqlHandler("SELECT * FROM NftContract");
    }

    getAllEnabledNftContracts = async () => {
        return this.sqlHandler("SELECT * FROM NftContract WHERE Enabled = true");
    }

    getNftContract = async (contractAddress) => {
        return this.sqlHandler("SELECT * FROM NftContract WHERE Address = ?", [contractAddress]);
    }

    getEnabledNftContract = async (contractAddress) => {
        return this.sqlHandler("SELECT * FROM NftContract WHERE Address = ? AND Enabled = true", [contractAddress]);
    }

    getNftContractCreator = async (creatorUid) => {
        return this.sqlHandler("SELECT * FROM NftContract WHERE CreatorUid = ? AND Enabled = true", [creatorUid]);
    }

    updateNftContractEnabled = async (contractAddress, enabled) => {
        return this.sqlHandler("UPDATE NftContract SET Enabled = ? WHERE Address = ?", [enabled, contractAddress]);
    }

    updateNftContractInfo = async (contractAddress, desciption, externalUrl, category) => {
        return this.sqlHandler("UPDATE NftContract SET Description = ?, ExternalUrl = ?, Category = ? WHERE Address = ?", [desciption, externalUrl, category, contractAddress]);
    }

    getWallet = async (uid, chain) => {
        return this.sqlHandler("SELECT Chain, Address FROM Wallet WHERE Uid = ? and Chain = ?", [uid, chain]);
    }

    getWalletSecret = async (uid, chain) => {
        return this.sqlHandler("SELECT * FROM Wallet WHERE Uid = ? and Chain = ?", [uid, chain]);
    }

    getWalletByAddress = async (chain, address) => {
        return this.sqlHandler("SELECT * FROM Wallet WHERE Chain = ? AND Address = ?", [chain, address]);
    }

    getAllWallet = async (uid) => {
        return this.sqlHandler("SELECT Chain, Address FROM Wallet WHERE Uid = ?", [uid]);
    }

    createWallet = async (uid, chain, address, encrypPrivate, iv) => {
        await this.sqlHandler("INSERT INTO Wallet (Uid, Chain, Address, Private, Iv) VALUES (?, ?, ?, ?, ?)", [uid, chain, address, encrypPrivate, iv]);
    }

    createVerificationCode = async (email, code) => {
        await this.deleteVerificationCode(email);
        return this.sqlHandler("INSERT INTO Verification (Email, Code, ExpiredTime) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))", [email, code]);
    }

    getVerificationCode = async (email) => {
        return this.sqlHandler("SELECT * FROM Verification WHERE Email = ?", [email]);
    }

    deleteVerificationCode = async (email) => {
        return this.sqlHandler("DELETE FROM Verification WHERE Email = ?", [email]);
    }

    createNftContract = async (address, title, symbol, tokenType, totalSupply, imageUrl, description, externalUrl, category, creatorUid, creatorFee) => {
        return this.sqlHandler("INSERT INTO NftContract (Address, Enabled, Title, Symbol, TokenType, TotalSupply, ImageUrl, Description, ExternalUrl, Category, CreatorUid, CreatorFee, CreationTime) VALUES (?, true, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())", [address, title, symbol, tokenType, totalSupply, imageUrl, description, externalUrl, category, creatorUid, creatorFee]);
    }

    updateNftContract = async (address, title, symbol, tokenType, totalSupply) => {
        return this.sqlHandler("UPDATE NftContract SET Title = ?, Symbol = ?, TokenType = ?, TotalSupply = ? WHERE Address = ?", [title, symbol, tokenType, totalSupply, address]);
    }

    editNftContract = async (address, imageUrl, description, externalUrl, category, creatorFee) => {
        return this.sqlHandler("UPDATE NftContract SET ImageUrl = ?, Description = ?, ExternalUrl = ?, Category = ?, CreatorFee = ? WHERE Address = ?", [imageUrl, description, externalUrl, category, creatorFee, address]);
    }

    updateNftContractTotalSupply = async (address, totalSupply) => {
        return this.sqlHandler("UPDATE NftContract SET TotalSupply = ? WHERE Address = ?", [totalSupply, address]);
    }

    getNftContractByTitle = async (creatorUid, title) => {
        return this.sqlHandler("SELECT * FROM NftContract WHERE CreatorUid = ? AND Title = ?", [creatorUid, title]);
    }

    getNftContractByAddress = async (creatorUid, address) => {
        return this.sqlHandler("SELECT * FROM NftContract WHERE CreatorUid = ? AND Address = ?", [creatorUid, address]);
    }

    getNftInfo = async (contract, tokenId) => {
        return this.sqlHandler("SELECT * FROM Nft WHERE Contract = ? AND TokenId = ? AND Enabled = true AND Contract IN (SELECT Address FROM NftContract WHERE Enabled = true)", [contract, tokenId]);
    }

    getNftInfos = async (contract) => {
        return this.sqlHandler("SELECT * FROM Nft WHERE Contract = ? AND Enabled = true AND Contract IN (SELECT Address FROM NftContract WHERE Enabled = true)", [contract]);
    }

    getNftInfosCondition = async (contract, offset, limit, condition) => {
        var additionalCondition = '';
        if (condition.sale == 'true') {
            var priceCondition = '';
            if (!isNaN(condition.price.min) && !isNaN(condition.price.max) && condition.price.min >= 0 && condition.price.max > 0) {
                priceCondition = ' AND CurrencyTokenId = \'' + condition.currency.Id + '\' AND SellPrice >= \'' + condition.price.min + '\' AND SellPrice <= \'' + condition.price.max + '\'';
            }

            additionalCondition += ' AND TokenId IN (SELECT TokenId FROM Sell WHERE State = 1' + priceCondition + ')'
        }

        var categoryCondition = '';
        if (condition.category != 'All Items') {
            categoryCondition = ' AND Category = \'' + condition.category + '\'';
        }

        var addColumn = '';
        var orderBy = 'ORDER BY '
        if (condition.sortIdx == '0') {
            orderBy += 'Title';
        } else if (condition.sortIdx == '1') {
            orderBy += 'CreationTime';
        } else if (condition.sortIdx == '2') {
            addColumn = ', (SELECT SellPrice FROM Sell WHERE Nft.TokenId = Sell.tokenId AND Nft.Contract = Sell.Contract AND Sell.State = 1 AND Sell.CurrencyTokenId = 1) as SellPrice'
            orderBy += 'SellPrice';
        } else if (condition.sortIdx == '3') {
            addColumn = ', (SELECT SellPrice FROM Sell WHERE Nft.TokenId = Sell.tokenId AND Nft.Contract = Sell.Contract AND Sell.State = 1 AND Sell.CurrencyTokenId = 1) as SellPrice'
            orderBy += 'SellPrice DESC';
        } else if (condition.sortIdx == '4') {
            addColumn = ', (SELECT COUNT(*) FROM Likes WHERE Nft.TokenId = Likes.tokenId AND Nft.Contract = Likes.Contract) AS Likes'
            orderBy += 'Likes DESC';
        }

        return this.sqlHandler("SELECT *" + addColumn + " FROM Nft WHERE Contract = ? AND Enabled = true AND Contract IN (SELECT Address FROM NftContract WHERE Enabled = true" + categoryCondition + ")" + additionalCondition + " " + orderBy + " LIMIT " + offset + ", " + limit, [contract]);
    }

    getNftsInfoOnSale = async (ownerUid, offset, limit) => {
        return this.sqlHandler("SELECT * FROM Nft WHERE OwnerUid = ? AND Enabled = true AND (Contract, TokenId) IN (SELECT Contract, TokenId FROM Sell WHERE SellerUid = ? AND State = 1) LIMIT " + offset + ", " + limit, [ownerUid, ownerUid]);
    }

    getNftsInfoByOwnerUid = async (ownerUid, offset, limit) => {
        return this.sqlHandler("SELECT * FROM Nft WHERE OwnerUid = ? AND Enabled = true AND Contract IN (SELECT Address FROM NftContract WHERE Enabled = true) LIMIT " + offset + ", " + limit, [ownerUid]);
    }

    getNftsInfoByCreatorUid = async (creatorUid, offset, limit) => {
        return this.sqlHandler("SELECT * FROM Nft WHERE CreatorUid = ? AND Enabled = true AND Contract IN (SELECT Address FROM NftContract WHERE Enabled = true) LIMIT " + offset + ", " + limit, [creatorUid]);
    }

    updateOrInsertNftInfo = async (address, tokenId, title, description, metadataUrl, mediaUrl, ownerUid, ownerAddress) => {
        this.getNftInfo(address, tokenId).then(nftInfo => {
            if (nftInfo.length > 0) {
                this.sqlHandler("UPDATE Nft SET Title = ?, Description = ?, MetadataUrl = ?, MediaUrl = ?, OwnerUid = ?, OwnerAddress = ? WHERE Contract = ? AND TokenId = ?", [title, description, metadataUrl, mediaUrl, ownerUid, ownerAddress, address, tokenId]);
            } else {
                this.sqlHandler("INSERT INTO Nft (Contract, TokenId, Title, Description, MetadataUrl, MediaUrl, OwnerUid, OwnerAddress, CreatorUid, CreationTime, Enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, (NOW()), true)", [address, tokenId, title, description, metadataUrl, mediaUrl, ownerUid, ownerAddress]);
            }
        })
    }

    createNftInfo = async (address, tokenId, title, description, metadataUrl, mediaUrl, ownerUid, ownerAddress, creatorUid) => {
        return this.sqlHandler("INSERT INTO Nft (Contract, TokenId, Title, Description, MetadataUrl, MediaUrl, OwnerUid, OwnerAddress, CreatorUid, CreationTime, Enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (NOW()), true)", [address, tokenId, title, description, metadataUrl, mediaUrl, ownerUid, ownerAddress, creatorUid]);
    }

    updateOwnerOfNft = async (address, tokenId, ownerUid, ownerAddress) => {
        this.sqlHandler("UPDATE Nft SET OwnerUid = ?, OwnerAddress = ? WHERE Contract = ? AND TokenId = ?", [ownerUid, ownerAddress, address, tokenId]);
    }

    updateOwnerUidOfNftByWallet = async (uid, address) => {
        this.sqlHandler("UPDATE Nft SET OwnerUid = ? WHERE OwnerUid = 0 AND OwnerAddress = ?", [uid, address]);
    }

    getNftsInfoByLikes = async (uid, offset, limit) => {
        return this.sqlHandler("SELECT * FROM Nft WHERE (Contract, TokenId) IN (SELECT Contract, TokenId FROM Likes WHERE Uid = ?) AND Contract IN (SELECT Address FROM NftContract WHERE Enabled = true) LIMIT " + offset + ", " + limit, [uid]);
    }

    getLikes = async (uid, contract, tokenId) => {
        return this.sqlHandler("SELECT * FROM Likes WHERE Uid = ? AND Contract = ? AND TokenId = ?", [uid, contract, tokenId]);
    }

    addLikes = async (uid, contract, tokenId) => {
        return this.sqlHandler("INSERT INTO Likes (Uid, Contract, TokenId) VALUES (?, ?, ?)", [uid, contract, tokenId]);
    }

    removeLikes = async (uid, contract, tokenId) => {
        return this.sqlHandler("DELETE FROM Likes WHERE Uid = ? AND Contract = ? AND TokenId = ?", [uid, contract, tokenId]);
    }

    getMarketInfo = async () => {
        return this.sqlHandler("SELECT * FROM Market");
    }

    makeSellOrder = async (contract, tokenId, sellerUid, sellPrice, currencyTokenId, state = 1, txHash) => {
        return this.sqlHandler("INSERT INTO Sell (Contract, TokenId, SellerUid, SellPrice, CurrencyTokenId, SellStartTime, State, TxHash) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)", [contract, tokenId, sellerUid, sellPrice, currencyTokenId, state, txHash]);
    }

    updateSellOrderState = async (sellOrderId, state) => {
        return this.sqlHandler("UPDATE Sell SET State = ? WHERE Id = ?", [state, sellOrderId]);
    }

    getSellOrders = async (contract, tokenId, state) => {
        return this.sqlHandler("SELECT * FROM Sell WHERE Contract = ? AND TokenId = ? AND State = ?", [contract, tokenId, state]);
    }

    getSellOrdersByUid = async (uid) => {
        return this.sqlHandler("SELECT * FROM Sell WHERE SellerUid = ? AND State = 1", [uid]);
    }

    makeOfferOrder = async (contract, tokenId, buyerUid, offerPrice, currencyTokenId, state = 1, txHash) => {
        return this.sqlHandler("INSERT INTO Offer (Contract, TokenId, BuyerUid, OfferPrice, CurrencyTokenId, OfferStartTime, State, TxHash) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)", [contract, tokenId, buyerUid, offerPrice, currencyTokenId, state, txHash]);
    }

    updateOfferOrderState = async (offerOrderId, state) => {
        return this.sqlHandler("UPDATE Offer SET State = ? WHERE Id = ?", [state, offerOrderId]);
    }

    getOfferOrders = async (contract, tokenId, state) => {
        return this.sqlHandler("SELECT * FROM Offer WHERE Contract = ? AND TokenId = ? AND State = ?", [contract, tokenId, state]);
    }

    getOfferOrderByUid = async (uid, contract, tokenId, state) => {
        return this.sqlHandler("SELECT * FROM Offer WHERE BuyerUid = ? AND Contract = ? AND TokenId = ? AND State = ?", [uid, contract, tokenId, state]);
    }

    getOfferOrderById = async (offerOrderId) => {
        return this.sqlHandler("SELECT * FROM Offer WHERE Id = ? AND State = 1", [offerOrderId]);
    }

    createTradingInfo = async (contract, tokenId, sellerUid, buyerUid, price, currencyTokenId, state, txHash) => {
        return this.sqlHandler("INSERT INTO Trade (Contract, TokenId, SellerUid, BuyerUid, Price, CurrencyTokenId, TradeTime, State, TxHash) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)", [contract, tokenId, sellerUid, buyerUid, price, currencyTokenId, state, txHash]);
    }

    createNotification = async (uid, type, contents, link, dataInt, dataStr, contract, tokenId, address) => {
        return this.sqlHandler("INSERT INTO Notification (Uid, Type, Contents, Link, DataInt, DataStr, Contract, TokenId, Address, CreationTime, Checked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), false)", [uid, type, contents, link, dataInt, dataStr, contract, tokenId, address]);
    }

    createNotificationsForAllUser = async (type, contents, link, dataInt, dataStr, contract, tokenId, address) => {

    }

    readAllNotifications = async (uid) => {

    }

    getNotifications = async (uid) => {

    }

    createNotice = async (category, title, contents) => {
        return this.sqlHandler("INSERT INTO Notice (CreationTime, Category, Title, Contents) VALUES (NOW(), ?, ?, ?)", [category, title, contents]);
    }

    updateNotice = async (id, category, title, contents) => {
        return this.sqlHandler("UPDATE Notice SET Category = ?, Title = ?, Contents = ? WHERE Id = ?", [category, title, contents, id]);
    }

    deleteNotice = async (id) => {
        return this.sqlHandler("DELETE FROM Notice WHERE Id = ?", [id]);
    }

    getNotices = async () => {
        return this.sqlHandler("SELECT * FROM Notice ORDER BY CreationTime DESC");
    }

    writeLog = async (uid, type, params, status, contents) => {
        return this.sqlHandler("INSERT INTO Log (Time, Caller, Type, Params, Status, Contents) VALUES (NOW(), ?, ?, ?, ?, ?)", [uid, type, JSON.stringify(params), status, contents]);
    }

    createCategory = async (name, image) => {
        return this.sqlHandler("INSERT INTO Category (Name, Image) VALUES (?, ?)", [name, image]);
    }

    updateCategory = async (name, newName, image) => {
        return this.sqlHandler("UPDATE Category SET Name = ?, Image = ? WHERE Name = ?", [newName, image, name]);
    }

    deleteCategory = async (name) => {
        return this.sqlHandler("DELETE FROM Category WHERE Name = ?", [name]);
    }

    getCategories = async () => {
        return this.sqlHandler("SELECT * FROM Category");
    }

    getCategory = async (name) => {
        return this.sqlHandler("SELECT * FROM Category WHERE Name = ?", [name]);
    }

    createFaQ = async (category, title, contents) => {
        return this.sqlHandler("INSERT INTO FaQ (Category, Title, Contents) VALUES (?, ?, ?)", [category, title, contents]);
    }

    updateFaQ = async (id, category, title, contents) => {
        return this.sqlHandler("UPDATE FaQ SET Category = ?, Title = ?, Contents = ? WHERE Id = ?", [category, title, contents, id]);
    }

    deleteFaQ = async (id) => {
        return this.sqlHandler("DELETE FROM FaQ WHERE Id = ?", [id]);
    }

    getFaQs = async () => {
        return this.sqlHandler("SELECT * FROM FaQ");
    }

    createPromotion = async (title, imageUrl, link) => {
        return this.sqlHandler("INSERT INTO Promotion (Title, ImageUrl, Link) VALUES (?, ?, ?)", [title, imageUrl, link]);
    }

    updatePromotion = async (id, title, imageUrl, link) => {
        return this.sqlHandler("UPDATE Promotion SET Title = ?, ImageUrl = ?, Link = ? WHERE Id = ?", [title, imageUrl, link, id]);
    }

    deletePromotion = async (id) => {
        return this.sqlHandler("DELETE FROM Promotion WHERE Id = ?", [id]);
    }

    getPromotions = async () => {
        return this.sqlHandler("SELECT * FROM Promotion");
    }

    getTotalVolume = async (contractAddress) => {
        return this.sqlHandler("SELECT SUM(Price) AS Total FROM Trade WHERE CurrencyTokenId IN (SELECT Id FROM TokenContract WHERE Chain = ? AND Address = '0x0') AND Contract = ?", [process.env.DEFAULT_CHAIN, contractAddress]);
    }

    getFloorPrice = async (contractAddress) => {
        return this.sqlHandler("SELECT SellPrice FROM Sell WHERE CurrencyTokenId IN (SELECT Id FROM TokenContract WHERE Chain = ? AND Address = '0x0') AND Contract = ? AND State = 1 ORDER BY SellPrice ASC LIMIT 1;", [process.env.DEFAULT_CHAIN, contractAddress]);
    }

    getLastTradeTime = async (contractAddress) => {
        return this.sqlHandler("SELECT TradeTime FROM Trade WHERE Contract = ? ORDER BY TradeTime DESC LIMIT 1", [contractAddress]);
    }

    getListedCount = async (contractAddress) => {
        return this.sqlHandler("SELECT COUNT(*) AS Count FROM Sell WHERE Contract = ? AND State = 1", [contractAddress]);
    }

    getOwnerCount = async (contractAddress) => {
        return this.sqlHandler("SELECT (SELECT COUNT(DISTINCT OwnerUid) FROM Nft WHERE Contract = ? AND OwnerUid > 0) + (SELECT COUNT(DISTINCT OwnerAddress) FROM Nft WHERE Contract = ? AND OwnerUid = 0) AS Count", [contractAddress, contractAddress])
    }

    getContractLikeCount = async (contractAddress) => {
        return this.sqlHandler("SELECT COUNT(*) AS Count FROM Likes WHERE Contract = ?", [contractAddress]);
    }

    getNftLikeCount = async (contractAddress, tokenId) => {
        return this.sqlHandler("SELECT COUNT(*) AS Count FROM Likes WHERE Contract = ? AND TokenId = ?", [contractAddress, tokenId]);
    }

    getTokens = async () => {
        return this.sqlHandler("SELECT * FROM TokenContract WHERE Enabled = true");
    }

    getTokensByChain = async (chain) => {
        return this.sqlHandler("SELECT * FROM TokenContract WHERE Chain = ? AND Enabled = true", [chain]);
    }

    searchUserName = async (str) => {
        return this.sqlHandler("SELECT * FROM User WHERE INSTR(Name, ?)", [str]);
    }

    searchCollectionTitle = async (str) => {
        return this.sqlHandler("SELECT * FROM NftContract WHERE INSTR(Title, ?) AND Enabled = true", [str]);
    }

    searchNftTitle = async (str, offset, limit, condition) => {
        var additionalCondition = '';
        if (condition.sale == 'true') {
            var priceCondition = '';
            if (!isNaN(condition.price.min) && !isNaN(condition.price.max) && condition.price.min >= 0 && condition.price.max > 0) {
                priceCondition = ' AND CurrencyTokenId = \'' + condition.currency.Id + '\' AND SellPrice >= \'' + condition.price.min + '\' AND SellPrice <= \'' + condition.price.max + '\'';
            }

            additionalCondition += ' AND TokenId IN (SELECT TokenId FROM Sell WHERE State = 1' + priceCondition + ')'
        }

        var categoryCondition = '';
        if (condition.category != 'All Items') {
            categoryCondition = ' AND Category = \'' + condition.category + '\'';
        }

        var addColumn = '';
        var orderBy = 'ORDER BY '
        if (condition.sortIdx == '0') {
            orderBy += 'Title';
        } else if (condition.sortIdx == '1') {
            orderBy += 'CreationTime';
        } else if (condition.sortIdx == '2') {
            addColumn = ', (SELECT SellPrice FROM Sell WHERE Nft.TokenId = Sell.tokenId AND Nft.Contract = Sell.Contract AND Sell.State = 1 AND Sell.CurrencyTokenId = 1) as SellPrice'
            orderBy += 'SellPrice';
        } else if (condition.sortIdx == '3') {
            addColumn = ', (SELECT SellPrice FROM Sell WHERE Nft.TokenId = Sell.tokenId AND Nft.Contract = Sell.Contract AND Sell.State = 1 AND Sell.CurrencyTokenId = 1) as SellPrice'
            orderBy += 'SellPrice DESC';
        } else if (condition.sortIdx == '4') {
            addColumn = ', (SELECT COUNT(*) FROM Likes WHERE Nft.TokenId = Likes.tokenId AND Nft.Contract = Likes.Contract) AS Likes'
            orderBy += 'Likes DESC';
        }

        return this.sqlHandler("SELECT *" + addColumn + " FROM Nft WHERE INSTR(Title, ?) AND Contract IN (SELECT Address FROM NftContract WHERE Enabled = true" + categoryCondition + ")" + additionalCondition + " " + orderBy + " LIMIT " + offset + ", " + limit, [str]);
    }

    createCreatingProcess = async (uid) => {
        return this.sqlHandler("INSERT INTO CreatingProcess (Uid, Step, Progress) VALUES (?, ?, ?)", [uid, 0, 0]);
    }

    updateCreatingProcess = async (uid, step, progress) => {
        return this.sqlHandler("UPDATE CreatingProcess SET Step = ?, Progress = ? WHERE Uid = ?", [step, progress, uid]);
    }

    deleteCreatingProcess = async (uid) => {
        return this.sqlHandler("DELETE FROM CreatingProcess WHERE Uid = ?", [uid]);
    }

    getCreatingProcess = async (uid) => {
        return this.sqlHandler("SELECT * FROM CreatingProcess WHERE Uid = ?", [uid]);
    }
}

module.exports = new MarketDao()