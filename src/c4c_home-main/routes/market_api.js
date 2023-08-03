// routes/market.js

const express = require('express');
const marketDao = require('../aws/db/market/marketDao');
const { authenticateAccessToken, generateAccessToken } = require('../session/jwt');
const nodeApi = require('../blockchain/nodeApi');
const encrypter = require('../utils/encrypter');
const mailer = require('../utils/mailer');
const Web3 = require('web3')
var router = express.Router(); // router함수를 초기화
const marketDbUpdator = require('../aws/db/market/marketDbUpdator');
const BN = require('bn.js');

const getWallet = (walletInfo) => {
    return {
        public: walletInfo.Address,
        private: encrypter.decipher(walletInfo.Private, walletInfo.Iv)
    }
}

const getCompletedNfts = (raw_nfts) => Promise.all(
    raw_nfts.map(async row => {
        let ownerInfo = null;
        if (row.OwnerUid > 0) {
            let ownerInfos = await marketDao.getUserById(row.OwnerUid);
            ownerInfo = ownerInfos.length > 0 ? ownerInfos[0] : null;
        }
        if (ownerInfo == null) {
            ownerInfo = { Name: row.OwnerAddress, Avatar: '', Creator: false, Admin: false }
        }

        let priceInfos = await marketDao.getSellOrders(row.Contract, row.TokenId, 1);
        let priceInfo = priceInfos.length > 0 ? priceInfos[0] : null;

        let contracts = await marketDao.getEnabledNftContract(row.Contract);
        let contract = contracts.length > 0 ? contracts[0] : null;

        let category = contract ? contract.Category : "";
        let favorite = (await marketDao.getNftLikeCount(row.Contract, row.TokenId))[0].Count;

        let creatorInfo = null;
        if (contract.CreatorUid > 0) {
            let creatorInfos = await marketDao.getUserById(contract.CreatorUid);
            creatorInfo = creatorInfos.length > 0 ? creatorInfos[0] : null;
        }
        if (creatorInfo == null) {
            creatorInfo = { Uid: 0, Name: '', Avatar: '' }
        }

        return {
            ...row,
            title: row.Title,
            tokenId: row.TokenId,
            contract: row.Contract,
            description: row.Description,
            metadataUrl: row.MetadataUrl,
            image: row.MediaUrl,
            category: category,
            favorite: favorite,
            sell: {
                price: priceInfo ? priceInfo.SellPrice.toString() : 0,
                currencyId: priceInfo ? priceInfo.CurrencyTokenId : ''
            },
            owner: {
                id: row.OwnerUid,
                name: ownerInfo.Name,
                avatar: ownerInfo.Avatar,
                verified: ownerInfo ? ownerInfo.Creator || ownerInfo.Admin : false,
            },
            creator: {
                id: creatorInfo.Uid,
                name: creatorInfo.Name,
                avatar: creatorInfo.Avatar,
            }
        }
    })
);

const isNotEnoughtGasError = (error) => {
    return error.indexOf("insufficient funds for gas") != -1;
}

router.post('/login', function (req, res) {
    let email = req.body.params.email;
    let password = req.body.params.password;

    marketDao.getLoginInfo(email, 0).then(userRecord => {
        if (userRecord.length == 0) {
            marketDao.getUserByEmail(email).then(userRecord => {
                if (userRecord.length == 0) {
                    res.json({ status: 404 });
                    marketDao.writeLog(0, "post/login", { ...req.body.params, password: '' }, 404, "no search user");
                } else {
                    res.json({ status: 404, loginType: userRecord[0].LoginType });
                    marketDao.writeLog(0, "post/login", { ...req.body.params, password: '' }, 404, "login type mismatch/" + userRecord[0].LoginType);
                }
            }).catch(err => {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(0, "post/login", { ...req.body.params, password: '' }, 403, "getUserByEmail/" + err.message);
            });
        } else {
            let storedPwd = userRecord[0].Password;
            let salt = userRecord[0].Salt;

            encrypter.encryptSalt(password, salt).then(result => {
                if (result === storedPwd) {
                    let token = generateAccessToken({ uid: userRecord[0].Uid });
                    res.json({ status: 200, token: token, uid: userRecord[0].Uid });
                    marketDao.writeLog(0, "post/login", { ...req.body.params, password: '' }, 200, userRecord[0].Uid);
                } else {
                    res.json({ status: 406 });
                    marketDao.writeLog(0, "post/login", { ...req.body.params, password: '' }, 406, "password mismatch");
                }
            }).catch(err => {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(0, "post/login", { ...req.body.params, password: '' }, 403, "encryptSalt/" + err.message);
            });
        }
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "post/login", { ...req.body.params, password: '' }, 403, "getLoginInfo/" + err.message);
    });
});

router.post('/login_social', function (req, res) {
    let email = req.body.params.email;
    let loginType = req.body.params.loginType;

    marketDao.getUserBySocial(email, loginType).then(userRecord => {
        if (userRecord.length <= 0) {
            res.json({ status: 404, msg: "No search user" });
            marketDao.writeLog(0, "post/login_social", req.body.params, 404, "no search user");
        } else {
            let token = generateAccessToken({ uid: userRecord[0].Uid });
            res.json({ status: 200, token: token, uid: userRecord[0].Uid });
            marketDao.writeLog(0, "post/login_social", req.body.params, 200, userRecord[0].Uid);
        }
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "post/login_social", req.body.params, 403, "getUserBySocial/" + err.message);
    });
});

router.post('/signup', function (req, res) {
    let name = req.body.params.name;
    let email = req.body.params.email;
    let password = req.body.params.password;
    let marketing = req.body.params.marketing;

    marketDao.getUserByEmail(email).then(userRecord => {
        if (userRecord.length > 0) {
            res.json({ status: 404, msg: "Email is already in use." });
            marketDao.writeLog(0, "post/signup", req.body.params, 404, "email is already in use.");
        } else {
            encrypter.encrypt(password).then(result => {
                let salt = result.salt;
                let key = result.key;

                marketDao.createUser(name, email, key, salt, 0, marketing).then(() => {
                    res.json({ status: 200 });
                    marketDao.writeLog(0, "post/signup", req.body.params, 200, "");
                }).catch(err => {
                    res.json({ status: 403, msg: err.message });
                    marketDao.writeLog(0, "post/signup", req.body.params, 403, "createUser/" + err.message);
                });
            }).catch(err => {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(0, "post/signup", req.body.params, 403, "encrypt/" + err.message);
            });
        }
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "post/signup", req.body.params, 403, "getUserByEmail/" + err.message);
    });
});

router.post('/signup_social', function (req, res) {
    let name = req.body.params.name;
    let email = req.body.params.email;
    let loginType = req.body.params.loginType;
    let marketing = req.body.params.marketing;

    marketDao.getUserByEmail(email).then(userRecord => {
        if (userRecord.length > 0) {
            res.json({ status: 404, msg: "Email is already in use." });
            marketDao.writeLog(0, "post/signup_social", req.body.params, 404, "email is already in use.");
        } else {
            marketDao.createUser(name, email, null, null, loginType, marketing).then(() => {
                res.json({ status: 200 });
                marketDao.writeLog(0, "post/signup_social", req.body.params, 200, "");
            }).catch(err => {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(0, "post/signup_social", req.body.params, 403, "createUser/" + err.message);
            });
        }
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "post/signup_social", req.body.params, 403, "getUserByEmail/" + err.message);
    });
});

router.post('/verification', function (req, res) {
    let email = req.body.params.email;
    let code = Math.floor(Math.random() * 89999) + 10000;

    mailer.sendVerificationCode(email, code).then(ret => {
        marketDao.createVerificationCode(email, code).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(0, "post/verification", req.body.params, 200, code);
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(0, "post/verification", req.body.params, 403, "createVerificationCode/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "post/verification", req.body.params, 403, "sendVerificationCode/" + err.message);
    });
});

router.get('/verification', function (req, res) {
    let email = req.query.email;
    let code = req.query.code;
    let findPassword = req.query.findPassword == 'true';

    marketDao.getVerificationCode(email).then(record => {
        if (record.length <= 0) {
            res.json({ status: 400, msg: "No data" });
            marketDao.writeLog(0, "get/verification", req.query, 400, "No data");
            return;
        }

        if (record[0].Code == code) {
            if (findPassword) {
                marketDao.getUserByEmail(email).then(userRecord => {
                    if (userRecord.length <= 0) {
                        res.json({ status: 404, msg: "No search user" });
                        marketDao.writeLog(0, "get/verification", req.query, 404, "No search user");
                    } else {
                        let token = generateAccessToken({ uid: userRecord[0].Uid });
                        res.json({ status: 200, token: token, uid: userRecord[0].Uid });
                    }
                }).catch(err => {
                    res.json({ status: 403, msg: err.message });
                    marketDao.writeLog(0, "get/verification", req.query, 403, "getUserByEmail/" + err.message);
                });
            } else {
                res.json({ status: 200 });
                marketDao.writeLog(0, "get/verification", req.query, 200, "sign up");
            }
            marketDao.deleteVerificationCode(email);
        } else {
            res.json({ status: 404, msg: "Code is invalid" });
            marketDao.writeLog(0, "get/verification", req.query, 404, "Code is invalid");
        }
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/verification", req.query, 403, "getVerificationCode/" + err.message);
    });
});


router.post('/change_password', authenticateAccessToken, function (req, res) {
    let uid = req.body.params.uid;
    let password = req.body.params.password;

    encrypter.encrypt(password).then(result => {
        let salt = result.salt;
        let key = result.key;

        marketDao.changePassword(uid, key, salt).then(() => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/change_password", { ...req.body.params, password: '' }, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/change_password", { ...req.body.params, password: '' }, 403, "changePassword/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/change_password", { ...req.body.params, password: '' }, 403, "encrypt/" + err.message);
    });

});

router.get('/user', authenticateAccessToken, function (req, res) {
    let uid = req.token.user.uid;

    marketDao.getUserById(uid).then(async userRecord => {
        if (userRecord.length == 0) {
            res.json({ status: 400, msg: "No search user" });
        } else {
            let walletInfos = await marketDao.getAllWallet(userRecord[0].Uid);

            let walletInfo = {};
            try {
                walletInfo = (await Promise.all(walletInfos.map(async (wallet) => {
                    let tokenList = await marketDao.getTokensByChain(wallet.Chain);

                    let tokens = [];
                    try {
                        tokens = await Promise.all(tokenList.filter(token => token.Address != '').map(async (token) => {
                            return {
                                id: token.Id,
                                contract: token.Address,
                                balance: (await nodeApi.getTokenBalance(wallet.Address, token.Address)).toString(),
                            }
                        }));
                    } catch (err) {
                        marketDao.writeLog(uid, "get/user", req.query, 0, "tokenList.map/" + err.message);
                    }

                    return {
                        chain: wallet.Chain,
                        address: wallet.Address,
                        balance: (await nodeApi.getBalance(wallet.Address)).toString(),
                        tokens: tokens,
                    }
                }))).reduce(function (r, e) {
                    r[e.chain] = {
                        ...e
                    };
                    return r;
                }, {});;

            } catch (err) {
                marketDao.writeLog(uid, "get/user", req.query, 0, "walletInfos.map/" + err.message);
            }

            res.json({ status: 200, user: { ...userRecord[0], wallet: walletInfo } });
        }
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "get/user", req.query, 403, "getUserById/" + err.message);
    });
});

router.get('/email', function (req, res) {
    let email = req.query.email;

    marketDao.getUserByEmail(email).then(userRecord => {
        if (userRecord.length <= 0) {
            res.json({ status: 400, msg: "No search user" });
            return;
        }

        marketDao.getAllWallet(userRecord[0].Uid).then(walletInfo => {
            res.json({ status: 200, user: { ...userRecord[0], wallet: walletInfo } });
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(0, "get/email", req.query, 403, "getAllWallet/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/email", req.query, 403, "getUserByEmail/" + err.message);
    });
});

router.get('/username', function (req, res) {
    let name = req.query.name;

    marketDao.getUserByName(name).then(userRecord => {
        if (userRecord.length <= 0) {
            res.json({ status: 409, msg: "No search user" });
            return;
        }

        marketDao.getAllWallet(userRecord[0].Uid).then(walletInfo => {
            res.json({ status: 200, user: { ...userRecord[0], wallet: walletInfo } });
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(0, "get/username", req.query, 403, "getAllWallet/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/username", req.query, 403, "getUserByName/" + err.message);
    });
});

router.get('/balance', function (req, res) {
    let address = req.query.address;

    nodeApi.getBalance(address).then(balance => {
        res.json({ status: 200, balance: balance.toString() });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/balance", req.query, 403, "getBalance/" + err.message);
    });
});

router.post('/user', authenticateAccessToken, function (req, res) {
    let uid = req.body.params.uid;

    marketDao.getUserById(uid).then(async record => {
        if (record.length > 0 && record[0].Uid != uid) {
            res.json({ status: 403, msg: "User is different" });
            marketDao.writeLog(uid, "post/user", req.body.params, 403, "User is different/" + record[0].Uid);
            return;
        }

        if (record[0].Name != req.body.params.userInfo.commonInfo.name) {
            try {
                let nicknameRecord = await marketDao.getUserByName(req.body.params.userInfo.commonInfo.name);
                if (nicknameRecord.length > 0) {
                    res.json({ status: 409, msg: "Nickname is duplicated" });
                    marketDao.writeLog(uid, "post/user", req.body.params, 409, "Nickname is duplicated");
                    return;
                }
            } catch (err) {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(uid, "post/user", req.body.params, 403, "getUserByName/" + err.message);
                return;
            }
        }

        let name = req.body.params.userInfo.commonInfo.name;
        let email = req.body.params.userInfo.commonInfo.email;
        let avatar = req.body.params.userInfo.commonInfo.avatar;
        let background = req.body.params.userInfo.commonInfo.background;
        let customUrl = req.body.params.userInfo.commonInfo.customUrl;
        let bio = req.body.params.userInfo.commonInfo.bio;
        let twitter = req.body.params.userInfo.socialInfo.twitter;
        let facebook = req.body.params.userInfo.socialInfo.facebook;
        let instagram = req.body.params.userInfo.socialInfo.instagram;

        marketDao.updateUser(uid, name, email, avatar, background, customUrl, bio, twitter, facebook, instagram).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/user", req.body.params, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/user", req.body.params, 403, "updateUser/" + err.message);
        })
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/user", req.body.params, 403, "getUserById/" + err.message);
    })
});

router.post('/create_wallet', authenticateAccessToken, function (req, res) {
    let uid = req.body.params.uid;
    let chain = req.body.params.chain;

    marketDao.getWallet(uid, chain).then(record => {
        if (record.length > 0) {
            res.json({ status: 404, msg: "The wallet already exists." });
            marketDao.writeLog(uid, "post/create_wallet", req.body.params, 404, "The wallet already exists.");
            return;
        }

        nodeApi.createWallet().then(ret => {
            const result = encrypter.cipher(ret.privateKey);

            marketDao.createWallet(uid, chain, ret.address, result.result, result.iv).then(() => {
                res.json({ status: 200, address: ret.address });
                marketDao.writeLog(uid, "post/create_wallet", req.body.params, 200, ret.address);
            }).catch(err => {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(uid, "post/create_wallet", req.body.params, 403, "nodeApi.createWallet/" + err.message);
            })
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/create_wallet", req.body.params, 403, "marketDao.createWallet/" + err.message);
        })
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/create_wallet", req.body.params, 403, "getWallet/" + err.message);
    })
});

router.get('/nfts', async function (req, res) {
    let uid = req.query.uid;
    let offset = req.query.offset;
    let limit = req.query.limit;

    if (!uid) {
        res.json({ status: 403, msg: "Please input uid" });
        return;
    }

    marketDao.getNftsInfoByOwnerUid(uid, offset, limit).then(async (ret) => {
        try {
            let nftInfos = await getCompletedNfts(ret);
            res.json({ status: 200, nfts: nftInfos })
        } catch (err) {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(0, "get/nfts", req.query, 403, "Promise.all/" + err.message);
        }
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/nfts", req.query, 403, "getNftsInfoByOwnerUid/" + err.message);
    })
});

router.get('/nfts_onsale', async function (req, res) {
    let uid = req.query.uid;
    let offset = req.query.offset;
    let limit = req.query.limit;

    if (!uid) {
        res.json({ status: 403, msg: "Please input uid" });
        return;
    }

    marketDao.getNftsInfoOnSale(uid, offset, limit).then(async (ret) => {
        try {
            let nftInfos = await getCompletedNfts(ret);
            res.json({ status: 200, nfts: nftInfos })
        } catch (err) {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(0, "get/nfts_onsale", req.query, 403, "Promise.all/" + err.message);
        }
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/nfts_onsale", req.query, 403, "getNftsInfoOnSale/" + err.message);
    })

});

router.get('/nfts_creator', async function (req, res) {
    let uid = req.query.uid;
    let offset = req.query.offset;
    let limit = req.query.limit;

    if (!uid) {
        res.json({ status: 403, msg: "Please input uid" });
        return;
    }

    marketDao.getNftsInfoByCreatorUid(uid, offset, limit).then(async (ret) => {
        try {
            let nftInfos = await getCompletedNfts(ret);
            res.json({ status: 200, nfts: nftInfos })
        } catch (err) {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(0, "get/nfts_creator", req.query, 403, "Promise.all/" + err.message);
        }
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/nfts_creator", req.query, 403, "getNftsInfoByCreatorUid/" + err.message);
    })
});

router.get('/nfts_likes', async function (req, res) {
    let uid = req.query.uid;
    let offset = req.query.offset;
    let limit = req.query.limit;

    if (!uid) {
        res.json({ status: 403, msg: "Please input uid" });
        return;
    }

    marketDao.getNftsInfoByLikes(uid, offset, limit).then(async (ret) => {
        try {
            let nftInfos = await getCompletedNfts(ret);
            res.json({ status: 200, nfts: nftInfos })
        } catch (err) {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(0, "get/nfts_likes", req.query, 403, "Promise.all/" + err.message);
        }
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/nfts_likes", req.query, 403, "getNftsInfoByLikes/" + err.message);
    });
});

router.get('/likes', authenticateAccessToken, function (req, res) {
    let uid = req.query.uid;
    let contract = req.query.contract;
    let tokenId = req.query.tokenId;

    marketDao.getLikes(uid, contract, tokenId).then(ret => {
        res.json({ status: 200, likes: ret.length > 0 });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "get/likes", req.query, 403, "getLikes/" + err.message);
    });
});

router.post('/likes', authenticateAccessToken, function (req, res) {
    let uid = req.body.params.uid;
    let contract = req.body.params.contract;
    let tokenId = req.body.params.tokenId;
    let enabled = req.body.params.enabled;

    if (enabled) {
        marketDao.addLikes(uid, contract, tokenId).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/likes", req.body.params, 200, "addLikes");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/likes", req.body.params, 403, "addLikes/" + err.message);
        });
    } else {
        marketDao.removeLikes(uid, contract, tokenId).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/likes", req.body.params, 200, "removeLikes");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/likes", req.body.params, 403, "removeLikes/" + err.message);
        });
    }

});

router.get('/tokens', function (req, res) {
    marketDao.getTokens().then(ret => {
        res.json({ status: 200, tokens: ret });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/tokens", req.query, 403, "getTokens/" + err.message);
    });
});

router.get('/nft', async function (req, res) {
    let contract = req.query.contract;
    let tokenId = req.query.tokenId;

    marketDao.getNftInfo(contract, tokenId).then(async (ret) => {
        try {
            if (ret.length <= 0) {
                res.json({ status: 200, nft: null })
                return;
            }

            let row = ret[0];

            let ownerInfos = row.OwnerUid > 0 ? await marketDao.getUserById(row.OwnerUid) : [];
            let ownerInfo = ownerInfos.length > 0 ? ownerInfos[0] : null;

            let creatorInfos = row.CreatorUid > 0 ? await marketDao.getUserById(row.CreatorUid) : [];
            let creatorInfo = creatorInfos.length > 0 ? creatorInfos[0] : null;

            let priceInfos = await marketDao.getSellOrders(contract, tokenId, 1);
            let priceInfo = priceInfos.length > 0 ? priceInfos[0] : null;

            let offerInfos = await marketDao.getOfferOrders(contract, tokenId, 1);
            offerInfos.sort(function (a, b) {
                return b.OfferPrice - a.OfferPrice;
            });
            offerInfos = await Promise.all(offerInfos.map(async (ret) => {
                let buyerInfos = await marketDao.getUserById(ret.BuyerUid);
                let buyerInfo = buyerInfos.length > 0 ? buyerInfos[0] : null;

                return {
                    ...ret,
                    price: ret.OfferPrice.toString(),
                    name: buyerInfo ? buyerInfo.Name : '',
                    avatar: buyerInfo ? buyerInfo.Avatar : ''
                }
            }));

            let contractInfo = (await marketDao.getEnabledNftContract(row.Contract))[0];
            let nftInfo = {
                ...row,
                title: row.Title,
                tokenId: row.TokenId,
                contract: row.Contract,
                description: row.Description,
                metadataUrl: row.MetadataUrl,
                image: row.MediaUrl,
                contractTitle: contractInfo.Title,
                category: contractInfo.Category,
                creatorFee: contractInfo.CreatorFee,
                marketFee: (await marketDao.getMarketInfo())[0].MarketFee,
                favorite: (await marketDao.getNftLikeCount(row.Contract, row.TokenId))[0].Count,
                sell: {
                    price: priceInfo ? priceInfo.SellPrice.toString() : 0,
                    currencyId: priceInfo ? priceInfo.CurrencyTokenId : ''
                },
                offer: offerInfos,
                owner: {
                    id: row.OwnerUid,
                    name: ownerInfo ? ownerInfo.Name : row.OwnerAddress,
                    avatar: ownerInfo ? ownerInfo.Avatar : '',
                    verified: ownerInfo ? ownerInfo.Creator || ownerInfo.Admin : false,
                },
                creator: {
                    id: row.CreatorUid,
                    name: creatorInfo ? creatorInfo.Name : '',
                    avatar: creatorInfo ? creatorInfo.Avatar : '',
                }
            }
            res.json({ status: 200, nft: nftInfo })
        } catch (err) {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(0, "get/nft", req.query, 403, "getNftInfo await/" + err.message);
        }
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/nft", req.query, 403, "getNftInfo/" + err.message);
    })

});

router.get('/market_info', async function (req, res) {
    marketDao.getMarketInfo().then(async (ret) => {
        if (ret.length <= 0) {
            res.json({ status: 403, msg: "market info not found" })
            marketDao.writeLog(0, "get/market_info", req.query, 403, "market info not found");
            return;
        }

        marketDao.getWallet(0, process.env.DEFAULT_CHAIN).then(async ret => {
            let ownerAddress = ret[0].Address;
            let ownerBalance = (await nodeApi.getBalance(ownerAddress)).toString();

            res.json({
                status: 200, info: {
                    ...ret[0],
                    ownerAddress: ownerAddress,
                    ownerBalance: ownerBalance
                }
            })
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(0, "get/market_info", req.query, 403, "getWallet/" + err.message);
        })
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/market_info", req.query, 403, "getMarketInfo/" + err.message);
    })

});

router.post('/put_sale', authenticateAccessToken, function (req, res) {
    let uid = req.body.params.uid;
    let contract = req.body.params.contract;
    let tokenId = req.body.params.tokenId;
    let price = req.body.params.price;
    let currency = req.body.params.currency;

    marketDao.getWalletSecret(uid, process.env.DEFAULT_CHAIN).then(walletInfos => {
        if (walletInfos.length <= 0) {
            res.json({ status: 404, msg: "Wallet info not found" });
            marketDao.writeLog(uid, "post/put_sale", req.body.params, 404, "Wallet info not found");
            return;
        }

        marketDao.getSellOrders(contract, tokenId, 1).then(async orders => {
            if (orders.length > 0) {
                res.json({ status: 404, msg: "This product is already registered for sale." });
                marketDao.writeLog(uid, "post/put_sale", req.body.params, 404, "This product is already registered for sale.");
                return;
            }

            const wallet = getWallet(walletInfos[0]);

            try {
                const marketAddress = (await marketDao.getMarketInfo())[0].Address;
                const isApproved = await nodeApi.isApprovedForAll(contract, wallet.public, marketAddress);

                if (!isApproved) {
                    await nodeApi.setApprovalForAll(contract, wallet, marketAddress);
                }
            } catch (err) {
                if (isNotEnoughtGasError(err.message)) {
                    res.json({ status: 499, msg: err.message });
                } else {
                    res.json({ status: 403, msg: err.message });
                }
                marketDao.writeLog(uid, "post/put_sale", req.body.params, 403, "approve/" + err.message);
                return;
            }

            nodeApi.list(wallet, contract, tokenId, price).then(receipt => {
                marketDao.makeSellOrder(contract, tokenId, uid, price, currency, 1, receipt.transactionHash).then(ret => {
                    res.json({ status: 200 });
                    marketDao.writeLog(uid, "post/put_sale", req.body.params, 200, receipt.transactionHash);
                }).catch(err => {
                    res.json({ status: 403, msg: err.message });
                    marketDao.writeLog(uid, "post/put_sale", req.body.params, 403, "makeSellOrder/" + err.message);
                });
            }).catch(err => {
                if (isNotEnoughtGasError(err.message)) {
                    res.json({ status: 499, msg: err.message });
                } else {
                    res.json({ status: 403, msg: err.message });
                } marketDao.writeLog(uid, "post/put_sale", req.body.params, 403, "list/" + err.message);
            });
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/put_sale", req.body.params, 403, "getSellOrders/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/put_sale", req.body.params, 403, "getWallet/" + err.message);
    })
});

router.post('/change_sale', authenticateAccessToken, function (req, res) {
    let uid = req.body.params.uid;
    let contract = req.body.params.contract;
    let tokenId = req.body.params.tokenId;
    let price = req.body.params.price;
    let currency = req.body.params.currency;

    marketDao.getWalletSecret(uid, process.env.DEFAULT_CHAIN).then(walletInfos => {
        if (walletInfos.length <= 0) {
            res.json({ status: 404, msg: "Wallet info not found" });
            marketDao.writeLog(uid, "post/change_sale", req.body.params, 404, "Wallet info not found");
            return;
        }

        marketDao.getSellOrders(contract, tokenId, 1).then(orders => {
            if (orders.length <= 0) {
                res.json({ status: 404, msg: "There is no sale order" });
                marketDao.writeLog(uid, "post/change_sale", req.body.params, 404, "There is no sale order");
                return;
            }

            const wallet = getWallet(walletInfos[0]);
            let sellId = orders[0].Id;

            nodeApi.list(wallet, contract, tokenId, price).then(receipt => {
                marketDao.updateSellOrderState(sellId, 5).then(ret => {
                    marketDao.makeSellOrder(contract, tokenId, uid, price, currency, 1, receipt.transactionHash).then(ret => {
                        res.json({ status: 200 });
                        marketDao.writeLog(uid, "post/change_sale", req.body.params, 200, receipt.transactionHash);
                    }).catch(err => {
                        res.json({ status: 403, msg: err.message });
                        marketDao.writeLog(uid, "post/change_sale", req.body.params, 403, "makeSellOrder/" + err.message);
                    });
                }).catch(err => {
                    res.json({ status: 403, msg: err.message });
                    marketDao.writeLog(uid, "post/change_sale", req.body.params, 403, "updateSellOrderState/" + err.message);
                });
            }).catch(err => {
                if (isNotEnoughtGasError(err.message)) {
                    res.json({ status: 499, msg: err.message });
                } else {
                    res.json({ status: 403, msg: err.message });
                } marketDao.writeLog(uid, "post/change_sale", req.body.params, 403, "list/" + err.message);
            })
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/change_sale", req.body.params, 403, "getSellOrders/" + err.message);
        })

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/change_sale", req.body.params, 403, "getWallet/" + err.message);
    })
});

router.post('/remove_sale', authenticateAccessToken, function (req, res) {
    let uid = req.body.params.uid;
    let contract = req.body.params.contract;
    let tokenId = req.body.params.tokenId;

    marketDao.getWalletSecret(uid, process.env.DEFAULT_CHAIN).then(walletInfos => {
        if (walletInfos.length <= 0) {
            res.json({ status: 404, msg: "Wallet info not found" });
            marketDao.writeLog(uid, "post/remove_sale", req.body.params, 404, "Wallet info not found");
            return;
        }

        marketDao.getSellOrders(contract, tokenId, 1).then(orders => {
            if (orders.length <= 0) {
                res.json({ status: 404, msg: "There is no sale order" });
                marketDao.writeLog(uid, "post/remove_sale", req.body.params, 404, "There is no sale order");
                return;
            }

            const wallet = getWallet(walletInfos[0]);
            let sellId = orders[0].Id;

            nodeApi.cancelList(wallet, contract, tokenId).then(receipt => {
                marketDao.updateSellOrderState(sellId, 5).then(ret => {
                    marketDao.makeSellOrder(contract, tokenId, uid, orders[0].SellPrice, orders[0].CurrencyTokenId, 2, receipt.transactionHash).then(ret => {
                        res.json({ status: 200 });
                        marketDao.writeLog(uid, "post/remove_sale", req.body.params, 200, receipt.transactionHash);
                    }).catch(err => {
                        res.json({ status: 403, msg: err.message });
                        marketDao.writeLog(uid, "post/remove_sale", req.body.params, 403, "makeSellOrder/" + err.message);
                    });
                }).catch(err => {
                    res.json({ status: 403, msg: err.message });
                    marketDao.writeLog(uid, "post/remove_sale", req.body.params, 403, "updateSellOrderState/" + err.message);
                });
            }).catch(err => {
                if (isNotEnoughtGasError(err.message)) {
                    res.json({ status: 499, msg: err.message });
                } else {
                    res.json({ status: 403, msg: err.message });
                }
                marketDao.writeLog(uid, "post/remove_sale", req.body.params, 403, "cancelList/" + err.message);
            });
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/remove_sale", req.body.params, 403, "getSellOrders/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/remove_sale", req.body.params, 403, "getWallet/" + err.message);
    });
});

router.post('/make_offer', authenticateAccessToken, function (req, res) {
    let uid = req.body.params.uid;
    let contract = req.body.params.contract;
    let tokenId = req.body.params.tokenId;
    let price = req.body.params.price;
    let currency = req.body.params.currency;

    marketDao.getWalletSecret(uid, process.env.DEFAULT_CHAIN).then(walletInfos => {
        if (walletInfos.length <= 0) {
            res.json({ status: 404, msg: "Wallet info not found" });
            marketDao.writeLog(uid, "post/put_offer", req.body.params, 404, "Wallet info not found");
            return;
        }

        marketDao.getOfferOrderByUid(uid, contract, tokenId, 1).then(orders => {
            if (orders.length > 0) {
                res.json({ status: 404, msg: "There is already a offer request for this item." });
                marketDao.writeLog(uid, "post/put_offer", req.body.params, 404, "There is already a offer request for this item.");
                return;
            }

            const wallet = getWallet(walletInfos[0]);
            nodeApi.getBalance(wallet.public).then(balance => {
                const b = new BN(balance.toString());
                const p = new BN(price);
                if (b.lt(p)) {
                    res.json({ status: 409, msg: "Not enougth balance" });
                    marketDao.writeLog(uid, "post/put_offer", req.body.params, 409, balance);
                    return;
                }

                nodeApi.offer(wallet, contract, tokenId, price).then(receipt => {
                    marketDao.makeOfferOrder(contract, tokenId, uid, price, currency, 1, receipt.transactionHash).then(ret => {
                        res.json({ status: 200 });
                        marketDao.writeLog(uid, "post/put_offer", req.body.params, 200, receipt.transactionHash);
                    }).catch(err => {
                        res.json({ status: 403, msg: err.message });
                        marketDao.writeLog(uid, "post/put_offer", req.body.params, 403, "makeOfferOrder/" + err.message);
                    });
                }).catch(err => {
                    if (isNotEnoughtGasError(err.message)) {
                        res.json({ status: 499, msg: err.message });
                    } else {
                        res.json({ status: 403, msg: err.message });
                    }
                    marketDao.writeLog(uid, "post/put_offer", req.body.params, 403, "offer/" + err.message);
                });
            }).catch(err => {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(uid, "post/put_offer", req.body.params, 403, "getBalance/" + err.message);
            });
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/put_offer", req.body.params, 403, "getOfferOrderByUid/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/put_offer", req.body.params, 403, "getWallet/" + err.message);
    });
});

router.post('/remove_offer', authenticateAccessToken, function (req, res) {
    let uid = req.body.params.uid;
    let contract = req.body.params.contract;
    let tokenId = req.body.params.tokenId;

    marketDao.getWalletSecret(uid, process.env.DEFAULT_CHAIN).then(walletInfos => {
        if (walletInfos.length <= 0) {
            res.json({ status: 404, msg: "Wallet info not found" });
            marketDao.writeLog(uid, "post/remove_offer", req.body.params, 404, "Wallet info not found");
            return;
        }

        marketDao.getOfferOrderByUid(uid, contract, tokenId, 1).then(orders => {
            if (orders.length <= 0) {
                res.json({ status: 404, msg: "There is no offer order" });
                marketDao.writeLog(uid, "post/remove_offer", req.body.params, 404, "There is no offer order");
                return;
            }

            const wallet = getWallet(walletInfos[0]);
            let offerId = orders[0].Id;

            nodeApi.cancelOffer(wallet, contract, tokenId).then(receipt => {
                marketDao.updateOfferOrderState(offerId, 5).then(ret => {
                    marketDao.makeOfferOrder(contract, tokenId, uid, orders[0].OfferPrice, orders[0].CurrencyTokenId, 2, receipt.transactionHash).then(ret => {
                        res.json({ status: 200 });
                        marketDao.writeLog(uid, "post/remove_offer", req.body.params, 200, receipt.transactionHash);
                    }).catch(err => {
                        res.json({ status: 403, msg: err.message });
                        marketDao.writeLog(uid, "post/remove_offer", req.body.params, 403, "makeOfferOrder/" + err.message);
                    });
                }).catch(err => {
                    res.json({ status: 403, msg: err.message });
                    marketDao.writeLog(uid, "post/remove_offer", req.body.params, 403, "updateOfferOrderState/" + err.message);
                });
            }).catch(err => {
                if (isNotEnoughtGasError(err.message)) {
                    res.json({ status: 499, msg: err.message });
                } else {
                    res.json({ status: 403, msg: err.message });
                }
                marketDao.writeLog(uid, "post/remove_offer", req.body.params, 403, "cancelOffer/" + err.message);
            });
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/remove_offer", req.body.params, 403, "getOfferOrderByUid/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/remove_offer", req.body.params, 403, "getWallet/" + err.message);
    });
});

router.post('/checkout', authenticateAccessToken, function (req, res) {
    let uid = req.body.params.uid;
    let contract = req.body.params.contract;
    let tokenId = req.body.params.tokenId;
    let price = req.body.params.price;

    marketDao.getWalletSecret(uid, process.env.DEFAULT_CHAIN).then(walletInfos => {
        if (walletInfos.length <= 0) {
            res.json({ status: 404, msg: "Wallet info not found" });
            marketDao.writeLog(uid, "post/checkout", req.body.params, 404, "Wallet info not found");
            return;
        }

        marketDao.getSellOrders(contract, tokenId, 1).then(orders => {
            if (orders.length <= 0) {
                res.json({ status: 404, msg: "There is no sell order info" });
                marketDao.writeLog(uid, "post/checkout", req.body.params, 404, "There is no sell order info");
                return;
            }

            let sellOrder = orders[0];
            const wallet = getWallet(walletInfos[0]);

            nodeApi.buyNow(wallet, contract, tokenId, price).then(async receipt => {
                try {
                    await marketDao.updateSellOrderState(sellOrder.Id, 4);
                    await marketDao.updateOwnerOfNft(contract, tokenId, uid, wallet.public);
                    await marketDao.createTradingInfo(contract, tokenId, sellOrder.SellerUid, uid, sellOrder.SellPrice, sellOrder.CurrencyTokenId, 1, receipt.transactionHash);

                    // cancel offer
                    marketDao.getOfferOrderByUid(uid, contract, tokenId, 1).then(orders => {
                        if (orders.length <= 0) {
                            // no offer data
                            return;
                        }
                        let offerId = orders[0].Id;
                        marketDao.updateOfferOrderState(offerId, 5).then(ret => {
                            marketDao.makeOfferOrder(contract, tokenId, uid, orders[0].OfferPrice, orders[0].CurrencyTokenId, 2, receipt.transactionHash).then(ret => {
                                marketDao.writeLog(uid, "post/checkout", req.body.params, 200, "cancelOffer/" + receipt.transactionHash);
                            }).catch(err => {
                                marketDao.writeLog(uid, "post/checkout", req.body.params, 403, "makeOfferOrder/" + err.message);
                            });
                        }).catch(err => {
                            marketDao.writeLog(uid, "post/checkout", req.body.params, 403, "updateOfferOrderState/" + err.message);
                        });

                    }).catch(err => {
                        marketDao.writeLog(uid, "post/checkout", req.body.params, 403, "getOfferOrderByUid/" + err.message);
                    });

                    res.json({ status: 200, hash: receipt.transactionHash });
                    marketDao.writeLog(uid, "post/checkout", req.body.params, 200, receipt.transactionHash);
                } catch (err) {
                    res.json({ status: 403, msg: err.message });
                    marketDao.writeLog(uid, "post/checkout", req.body.params, 403, "await/" + err.message);
                }
            }).catch(err => {
                if (isNotEnoughtGasError(err.message)) {
                    res.json({ status: 499, msg: err.message });
                } else {
                    res.json({ status: 403, msg: err.message });
                }
                marketDao.writeLog(uid, "post/checkout", req.body.params, 403, "buyNow/" + err.message);
            });
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/checkout", req.body.params, 403, "getSellOrders/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/checkout", req.body.params, 403, "getWallet/" + err.message);
    });
});

router.post('/accept', authenticateAccessToken, function (req, res) {
    let uid = req.body.params.uid;
    let contract = req.body.params.contract;
    let tokenId = req.body.params.tokenId;
    let offerId = req.body.params.offerId;
    let price = req.body.params.price;

    marketDao.getWalletSecret(uid, process.env.DEFAULT_CHAIN).then(walletInfos => {
        if (walletInfos.length <= 0) {
            res.json({ status: 404, msg: "Wallet info not found" });
            marketDao.writeLog(uid, "post/accept", req.body.params, 404, "Wallet info not found");
            return;
        }

        marketDao.getOfferOrderById(offerId).then(orders => {
            if (orders.length <= 0) {
                res.json({ status: 404, msg: "There is no offer order info" });
                marketDao.writeLog(uid, "post/accept", req.body.params, 404, "There is no offer order info");
                return;
            }

            let offerOrder = orders[0];

            marketDao.getWallet(offerOrder.BuyerUid, process.env.DEFAULT_CHAIN).then(async offererWallets => {
                if (offererWallets.length <= 0) {
                    res.json({ status: 404, msg: "Offerer wallet info not found" });
                    marketDao.writeLog(uid, "post/accept", req.body.params, 404, "Offerer wallet info not found");
                    return;
                }

                const offererAddress = offererWallets[0].Address;
                const wallet = getWallet(walletInfos[0]);

                try {
                    const marketAddress = (await marketDao.getMarketInfo())[0].Address;
                    const isApproved = await nodeApi.isApprovedForAll(contract, wallet.public, marketAddress);

                    if (!isApproved) {
                        await nodeApi.setApprovalForAll(contract, wallet, marketAddress);
                    }
                } catch (err) {
                    if (isNotEnoughtGasError(err.message)) {
                        res.json({ status: 499, msg: err.message });
                    } else {
                        res.json({ status: 403, msg: err.message });
                    }
                    marketDao.writeLog(uid, "post/accept", req.body.params, 403, "approve/" + err.message);
                    return;
                }

                nodeApi.acceptOffering(wallet, contract, tokenId, offererAddress, price).then(async receipt => {
                    try {
                        await marketDao.updateOfferOrderState(offerOrder.Id, 4);
                        await marketDao.updateOwnerOfNft(contract, tokenId, offerOrder.BuyerUid, offererAddress);
                        await marketDao.createTradingInfo(contract, tokenId, uid, offerOrder.BuyerUid, offerOrder.OfferPrice, offerOrder.CurrencyTokenId, 2, receipt.transactionHash);

                        // cancel listing
                        marketDao.getSellOrders(contract, tokenId, 1).then(orders => {
                            if (orders.length <= 0) {
                                // no listing data
                                return;
                            }

                            let sellId = orders[0].Id;
                            marketDao.updateSellOrderState(sellId, 5).then(ret => {
                                marketDao.makeSellOrder(contract, tokenId, uid, orders[0].SellPrice, orders[0].CurrencyTokenId, 2, receipt.transactionHash).then(ret => {
                                    marketDao.writeLog(uid, "post/accept", req.body.params, 200, "cancelSellOrder/" + receipt.transactionHash);
                                }).catch(err => {
                                    marketDao.writeLog(uid, "post/accept", req.body.params, 403, "makeSellOrder/" + err.message);
                                });
                            }).catch(err => {
                                marketDao.writeLog(uid, "post/accept", req.body.params, 403, "updateSellOrderState/" + err.message);
                            });
                        }).catch(err => {
                            res.json({ status: 403, msg: err.message });
                            marketDao.writeLog(uid, "post/accept", req.body.params, 403, "getSellOrders/" + err.message);
                        });

                        res.json({ status: 200, hash: receipt.transactionHash });
                        marketDao.writeLog(uid, "post/accept", req.body.params, 200, receipt.transactionHash);
                    } catch (err) {
                        res.json({ status: 403, msg: err.message });
                        marketDao.writeLog(uid, "post/accept", req.body.params, 403, "await/" + err.message);
                    }
                }).catch(err => {
                    if (isNotEnoughtGasError(err.message)) {
                        res.json({ status: 499, msg: err.message });
                    } else {
                        res.json({ status: 403, msg: err.message });
                    }
                    marketDao.writeLog(uid, "post/accept", req.body.params, 403, "buyNow/" + err.message);
                });
            }).catch(err => {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(uid, "post/accept", req.body.params, 403, "getWallet2/" + err.message);
            });
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/accept", req.body.params, 403, "getOfferOrderById/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/accept", req.body.params, 403, "getWallet/" + err.message);
    });
});

router.get('/notices', function (req, res) {
    marketDao.getNotices().then(ret => {
        res.json({ status: 200, notices: ret });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/notices", req.query, 403, "getNotices/" + err.message);
    });
});

router.post('/notice', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let category = req.body.params.category;
    let title = req.body.params.title;
    let contents = req.body.params.contents;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/notice", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "post/notice", req.body.params, 404, "User is not admin");
            return;
        }

        marketDao.createNotice(category, title, contents).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/notice", req.body.params, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/notice", req.body.params, 403, "createNotice/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/notice", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.post('/update_notice', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let id = req.body.params.id;
    let category = req.body.params.category;
    let title = req.body.params.title;
    let contents = req.body.params.contents;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/update_notice", req.body.params, 404, "User not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "post/update_notice", req.body.params, 404, "User is not admin");
            return;
        }

        marketDao.updateNotice(id, category, title, contents).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/update_notice", req.body.params, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/update_notice", req.body.params, 403, "updateNotice/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/update_notice", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.delete('/notice', authenticateAccessToken, async function (req, res) {
    let uid = req.query.uid;
    let id = req.query.id;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "delete/notice", req.query, 404, "User not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "delete/notice", req.query, 404, "User is not admin");
            return;
        }

        marketDao.deleteNotice(id).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "delete/notice", req.query, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "delete/notice", req.query, 403, "deleteNotice/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "delete/notice", req.query, 403, "getUserById/" + err.message);
    });
});

router.get('/categories', function (req, res) {

    marketDao.getCategories().then(ret => {
        res.json({ status: 200, categories: ret });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/categories", req.query, 403, "getCategories/" + err.message);
    });
});

router.get('/category', function (req, res) {
    let name = req.query.name;

    marketDao.getCategory(name).then(ret => {
        res.json({ status: 200, category: ret });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/category", req.query, 403, "getCategory/" + err.message);
    });
});

router.post('/category', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let name = req.body.params.name;
    let image = req.body.params.image;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/category", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "post/category", req.body.params, 404, "User is not admin");
            return;
        }

        try {
            let categoryRecord = await marketDao.getCategory(name);
            if (categoryRecord.length > 0) {
                res.json({ status: 409, msg: "name is already in use" });
                marketDao.writeLog(uid, "post/category", req.body.params, 404, "already use");
                return;
            }
        } catch (err) {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/category", req.body.params, 404, "getCategory/" + err.message);
            return;
        }

        marketDao.createCategory(name, image).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/category", req.body.params, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/category", req.body.params, 403, "createCategory/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/category", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.post('/update_category', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let name = req.body.params.name;
    let newName = req.body.params.newName;
    let image = req.body.params.image;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/update_category", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "post/update_category", req.body.params, 404, "User is not admin");
            return;
        }

        if (name != newName) {
            try {
                let categoryRecord = await marketDao.getCategory(newName);
                if (categoryRecord.length > 0) {
                    res.json({ status: 409, msg: "name is already in use" });
                    marketDao.writeLog(uid, "post/update_category", req.body.params, 404, "already use");
                    return;
                }
            } catch (err) {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(uid, "post/update_category", req.body.params, 404, "getCategory/" + err.message);
                return;
            }
        }

        marketDao.updateCategory(name, newName, image).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/update_category", req.body.params, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/update_category", req.body.params, 403, "updateCategory/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/update_category", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.delete('/category', authenticateAccessToken, async function (req, res) {
    let uid = req.query.uid;
    let name = req.query.name;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "delete/category", req.query, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "delete/category", req.query, 404, "User is not admin");
            return;
        }

        marketDao.deleteCategory(name).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "delete/category", req.query, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "delete/category", req.query, 403, "deleteCategory/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "delete/category", req.query, 403, "getUserById/" + err.message);
    });
});

router.get('/users', authenticateAccessToken, function (req, res) {
    let uid = req.query.uid;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "get/users", req.query, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "get/users", req.query, 404, "User is not admin");
            return;
        }

        marketDao.getUsers().then(async ret => {
            try {
                res.json({
                    status: 200, users: await Promise.all(ret.map(async user => {
                        let address = '';
                        let walletInfo = await marketDao.getAllWallet(user.Uid);
                        let defaultChainWallet = walletInfo.filter(it => it.Chain == process.env.DEFAULT_CHAIN);
                        if (defaultChainWallet.length > 0) {
                            address = defaultChainWallet[0].Address;
                        }

                        return {
                            ...user,
                            address: address,
                        }
                    })
                    )
                });
            } catch (err) {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(uid, "get/users", req.query, 403, "Promise.all/" + err.message);
            }
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "get/users", req.query, 403, "getUsers/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "get/users", req.query, 403, "getUserById/" + err.message);
    });

});

router.post('/creator', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let targetUid = req.body.params.targetUid;
    let creator = req.body.params.creator;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/creator", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "post/creator", req.body.params, 404, "User is not admin");
            return;
        }

        marketDao.updateUserCreator(targetUid, creator).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/creator", req.body.params, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/creator", req.body.params, 403, "updateUserCreator/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/creator", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.get('/faqs', function (req, res) {
    marketDao.getFaQs().then(ret => {
        res.json({ status: 200, faqs: ret });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/faqs", req.query, 403, "getFaQs/" + err.message);
    });
});

router.post('/faq', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let category = req.body.params.category;
    let title = req.body.params.title;
    let contents = req.body.params.contents;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/faq", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "post/faq", req.body.params, 404, "User is not admin");
            return;
        }

        marketDao.createFaQ(category, title, contents).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/faq", req.body.params, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/faq", req.body.params, 403, "createFaQ/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/faq", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.post('/update_faq', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let id = req.body.params.id;
    let category = req.body.params.category;
    let title = req.body.params.title;
    let contents = req.body.params.contents;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/update_faq", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "post/update_faq", req.body.params, 404, "User is not admin");
            return;
        }

        marketDao.updateFaQ(id, category, title, contents).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/update_faq", req.body.params, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/update_faq", req.body.params, 403, "updateFaQ/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/update_faq", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.delete('/faq', authenticateAccessToken, async function (req, res) {
    let uid = req.query.uid;
    let id = req.query.id;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "delete/faq", req.query, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "delete/faq", req.query, 404, "User is not admin");
            return;
        }

        marketDao.deleteFaQ(id).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "delete/faq", req.query, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "delete/faq", req.query, 403, "deleteFaQ/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "delete/faq", req.query, 403, "getUserById/" + err.message);
    });
});

router.get('/promotions', function (req, res) {
    marketDao.getPromotions().then(ret => {
        res.json({ status: 200, promotions: ret });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/promotions", req.query, 403, "getPromotions/" + err.message);
    });
});

router.post('/promotion', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let title = req.body.params.title;
    let imageUrl = req.body.params.imageUrl;
    let link = req.body.params.link;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/promotion", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "post/promotion", req.body.params, 404, "User is not admin");
            return;
        }

        marketDao.createPromotion(title, imageUrl, link).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/promotion", req.body.params, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/promotion", req.body.params, 403, "createPromotion/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/promotion", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.post('/update_promotion', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let id = req.body.params.id;
    let title = req.body.params.title;
    let imageUrl = req.body.params.imageUrl;
    let link = req.body.params.link;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/update_promotion", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "post/update_promotion", req.body.params, 404, "User is not admin");
            return;
        }

        marketDao.updatePromotion(id, title, imageUrl, link).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/update_promotion", req.body.params, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/update_promotion", req.body.params, 403, "updatePromotion/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/update_promotion", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.delete('/promotion', authenticateAccessToken, async function (req, res) {
    let uid = req.query.uid;
    let id = req.query.id;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "delete/promotion", req.query, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "delete/promotion", req.query, 404, "User is not admin");
            return;
        }

        marketDao.deletePromotion(id).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "delete/promotion", req.query, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "delete/promotion", req.query, 403, "deletePromotion/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "delete/promotion", req.query, 403, "getUserById/" + err.message);
    });
});


router.get('/collections', authenticateAccessToken, function (req, res) {
    let uid = req.query.uid;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "get/collections", req.query, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "get/collections", req.query, 404, "User is not admin");
            return;
        }

        marketDao.getAllNftContracts().then(async ret => {
            try {
                res.json({
                    status: 200, collections: await Promise.all(ret.map(async collection => {
                        let creatorName = '';
                        let userInfos = await marketDao.getUserById(collection.CreatorUid);
                        if (userInfos.length > 0) {
                            creatorName = userInfos[0].Name;
                        }

                        return {
                            ...collection,
                            creatorName: creatorName,
                        }
                    })
                    )
                });
            } catch (err) {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(uid, "get/collections", req.query, 403, "Promise.all/" + err.message);
            }
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "get/collections", req.query, 403, "getAllNftContracts/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "get/collections", req.query, 403, "getUserById1/" + err.message);
    });

});

router.post('/collection_enabled', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let address = req.body.params.address;
    let enabled = req.body.params.enabled;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/collection_enabled", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "post/collection_enabled", req.body.params, 404, "User is not admin");
            return;
        }

        marketDao.updateNftContractEnabled(address, enabled).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/collection_enabled", req.body.params, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/collection_enabled", req.body.params, 403, "updateNftContractEnabled/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/collection_enabled", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.post('/check_collection', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let address = req.body.params.address;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/check_collection", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "post/check_collection", req.body.params, 404, "User is not admin");
            return;
        }

        marketDao.getNftContract(address).then(async ret => {
            if (ret.length > 0) {
                res.json({ status: 409, title: ret[0].Title });
                marketDao.writeLog(uid, "post/check_collection", req.body.params, 404, "user not found");
                return;
            }

            try {
                let contract = await nodeApi.getContractMetadata(address);
                res.json({ status: 200, contract: contract });
                marketDao.writeLog(uid, "post/check_collection", req.body.params, 200, contract.name);
            } catch (err) {
                res.json({ status: 400 });
                marketDao.writeLog(uid, "post/check_collection", req.body.params, 400, err.message);
            }
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/check_collection", req.body.params, 403, "getNftContract/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/check_collection", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.post('/import_collection', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let address = req.body.params.address;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/import_collection", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Admin) {
            res.json({ status: 404, msg: "User is not admin" });
            marketDao.writeLog(uid, "post/import_collection", req.body.params, 404, "User is not admin");
            return;
        }

        marketDbUpdator.createContractInfo(address);
        res.json({ status: 200 });
        marketDao.writeLog(uid, "post/import_collection", req.body.params, 200, "");
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/import_collection", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.get('/collection', async function (req, res) {
    let address = req.query.address;

    marketDao.getEnabledNftContract(address).then(async (contracts) => {
        if (contracts.length <= 0) {
            res.json({ status: 404, contract: { found: false } })
            return;
        }

        let contract = contracts[0];
        if (!contract.Enabled) {
            res.json({ status: 404, contract: { found: false } })
        }

        let creatorName = '';
        try {
            let users = await marketDao.getUserById(contract.CreatorUid);
            creatorName = users.length > 0 ? users[0].Name : '';
        } catch (err) {
            marketDao.writeLog(0, "get/collection", req.query, 0, "getUserById/" + contract.CreatorUid + "/" + err.message);
        }

        let totalVolume = await marketDao.getTotalVolume(contract.Address);
        let floorPrice = await marketDao.getFloorPrice(contract.Address);
        let lastTrade = await marketDao.getLastTradeTime(contract.Address);
        let listed = await marketDao.getListedCount(contract.Address);
        let owners = await marketDao.getOwnerCount(contract.Address);
        let favorite = await marketDao.getContractLikeCount(contract.Address);

        //let nftInfos = [];
        //try {
        //    let nfts = await marketDao.getNftInfos(contract.Address);
        //    nftInfos = await getCompletedNfts(nfts);
        //} catch (err) {
        //    marketDao.writeLog(0, "get/collection", req.query, 0, "getNftInfos/" + err.message);
        //}

        let contractInfo = {
            ...contract,
            found: true,
            creatorName: creatorName,
            totalVolume: totalVolume.length > 0 ? totalVolume[0].Total : 0,
            floorPrice: floorPrice.length > 0 ? floorPrice[0].SellPrice : 0,
            lastTrade: lastTrade.length > 0 ? lastTrade[0].TradeTime : '-',
            listed: listed[0].Count * 100 / contract.TotalSupply,
            owners: owners[0].Count,
            favorite: favorite[0].Count,
            //items: nftInfos,
        }
        res.json({ status: 200, collection: contractInfo })

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/collection", req.query, 403, "getEnabledNftContract/" + err.message);
    })
});

router.get('/collection_nft', async function (req, res) {
    let address = req.query.address;
    let offset = req.query.offset;
    let limit = req.query.limit;
    let filterData = req.query.filterData;

    marketDao.getNftInfosCondition(address, offset, limit, filterData).then(async (nfts) => {
        let nftInfos = [];
        try {
            nftInfos = await getCompletedNfts(nfts);
        } catch (err) {
            marketDao.writeLog(0, "get/collection", req.query, 0, "getNftInfos/" + err.message);
        }

        res.json({ status: 200, nftInfos: nftInfos })

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/collection", req.query, 403, "getEnabledNftContract/" + err.message);
    })
});

router.get('/collection_creator', async function (req, res) {
    let uid = req.query.uid;

    marketDao.getNftContractCreator(uid).then(async (contracts) => {
        res.json({ status: 200, collections: contracts })

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/collection_creator", req.query, 403, "getNftContractCreator/" + err.message);
    })
});

router.post('/collection_info', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let collection = req.body.params.collection;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/collection_info", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Creator) {
            res.json({ status: 404, msg: "User is not creator" });
            marketDao.writeLog(uid, "post/collection_info", req.body.params, 404, "User is not creator");
            return;
        }

        let collections = await marketDao.getNftContract(collection.address);
        if (collections.length <= 0) {
            res.json({ status: 404, msg: "Collection not found" });
            marketDao.writeLog(uid, "post/collection_info", req.body.params, 404, "collection not found");
            return;
        }

        let foundCollection = collections[0];
        if (foundCollection.Address != collection.address) {
            res.json({ status: 409, msg: "Collection address not matched" });
            marketDao.writeLog(uid, "post/collection_info", req.body.params, 404, "Collection address not matched/" + foundCollection.Address);
            return;
        }

        marketDao.updateNftContractInfo(collection.address, collection.description, collection.url, collection.category).then(ret => {
            res.json({ status: 200 });
            marketDao.writeLog(uid, "post/collection_info", req.body.params, 200, "");
        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/collection_info", req.body.params, 403, "updateNftContractInfo/" + err.message);
        })
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/collection_info", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.get('/search', async function (req, res) {
    let word = req.query.word;
    let offset = req.query.offset;
    let limit = req.query.limit;
    let filterData = req.query.filterData;

    try {
        if (word.startsWith('0x')) {
            // address
            let users = await marketDao.getUser(word);
            let collections = await marketDao.getNftContract(word);

            res.json({
                status: 200, result: {
                    type: "address",
                    users: users,
                    collections: collections,
                }
            })

        } else {
            let users = await marketDao.searchUserName(word);
            let collections = await marketDao.searchCollectionTitle(word);
            let collectionsWithMoreInfos = await Promise.all(
                collections.map(async row => {
                    let creatorInfo = null;
                    if (row.CreatorUid > 0) {
                        let creatorInfos = await marketDao.getUserById(row.CreatorUid);
                        creatorInfo = creatorInfos.length > 0 ? creatorInfos[0] : null;
                    }
                    if (creatorInfo == null) {
                        creatorInfo = { Name: '', Avatar: '' }
                    }

                    return {
                        ...row,
                        nfts: await marketDao.getNftInfos(row.Address),
                        CreatorAvatar: creatorInfo.Avatar,
                        CreatorName: creatorInfo.Name,
                    }
                })
            );
            let nfts = await marketDao.searchNftTitle(word, offset, limit, filterData);
            let nftInfos = await getCompletedNfts(nfts);

            res.json({
                status: 200, result: {
                    type: "word",
                    users: users,
                    collections: collectionsWithMoreInfos,
                    nfts: nftInfos
                }
            })
        }
    } catch (err) {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/search", req.query, 403, "await/" + err.message);
    }
});


router.get('/search_nft', async function (req, res) {
    let word = req.query.word;
    let offset = req.query.offset;
    let limit = req.query.limit;
    let filterData = req.query.filterData;

    try {
        let nfts = await marketDao.searchNftTitle(word, offset, limit, filterData);
        let nftInfos = await getCompletedNfts(nfts);

        res.json({
            status: 200, result: { nfts: nftInfos }
        })
    } catch (err) {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/search_nft", req.query, 403, "await/" + err.message);
    }
});

router.get('/discover', async function (req, res) {

    try {
        let collections = await marketDao.getAllEnabledNftContracts();
        let collectionsWithMoreInfos = await Promise.all(
            collections.map(async row => {
                let creatorInfo = null;
                if (row.CreatorUid > 0) {
                    let creatorInfos = await marketDao.getUserById(row.CreatorUid);
                    creatorInfo = creatorInfos.length > 0 ? creatorInfos[0] : null;
                }
                if (creatorInfo == null) {
                    creatorInfo = { Name: '', Avatar: '' }
                }

                let floorPrices = await marketDao.getFloorPrice(row.Address);
                let floorPrice = floorPrices.length > 0 ? floorPrices[0].Count : 0;

                return {
                    ...row,
                    nfts: await marketDao.getNftInfos(row.Address),
                    floorPrice: floorPrice,
                    favorite: await marketDao.getContractLikeCount(row.Address),
                    CreatorAvatar: creatorInfo.Avatar,
                    CreatorName: creatorInfo.Name,
                }
            })
        );

        res.json({
            status: 200, collections: collectionsWithMoreInfos,
        })
    } catch (err) {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/search", req.query, 403, "await/" + err.message);
    }
});

router.get('/check_collection_name', async function (req, res) {
    let uid = req.query.uid;
    let title = req.query.title;

    marketDao.getNftContractByTitle(uid, title).then(ret => {
        res.json({ status: 200, exist: ret.length > 0 });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/check_collection_name", req.body.params, 403, "getNftContractByTitle/" + err.message);
    });
});

router.post('/create_collection', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let collectionInfo = req.body.params.collectionInfo;
    let baseUrl = req.body.params.baseUrl;
    let imageUrl = req.body.params.imageUrl;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/create_collection", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Creator) {
            res.json({ status: 405, msg: "User is not creator" });
            marketDao.writeLog(uid, "post/create_collection", req.body.params, 405, "User is not creator");
            return;
        }

        marketDao.getWallet(uid, process.env.DEFAULT_CHAIN).then(walletInfos => {
            if (walletInfos.length <= 0) {
                res.json({ status: 406, msg: "Wallet info not found" });
                marketDao.writeLog(uid, "post/create_collection", req.body.params, 406, "Wallet info not found");
                return;
            }

            marketDao.getNftContractByTitle(uid, collectionInfo.title).then(ret => {
                if (ret.length > 0) {
                    res.json({ status: 407, msg: "Collection name is duplicated" });
                    marketDao.writeLog(uid, "post/create_collection", req.body.params, 407, "Collection name is duplicated");
                    return;
                }

                const wallet = walletInfos[0];

                nodeApi.deployNftContract(collectionInfo.title, collectionInfo.symbol, baseUrl).then(receipt => {

                    marketDao.createNftContract(receipt.contractAddress, collectionInfo.title, collectionInfo.symbol, collectionInfo.nftType, 0, imageUrl, collectionInfo.description, collectionInfo.url, collectionInfo.category, uid, collectionInfo.creatorFee).then(ret => {
                        res.json({ status: 200 });
                        marketDao.writeLog(uid, "post/create_collection", req.body.params, 200, receipt.contractAddress);

                        nodeApi.transferOwnerShip(receipt.contractAddress, wallet.Address).then(oReceipt => {
                            marketDao.writeLog(uid, "post/create_collection", req.body.params, 200, "transferOwnerShip/" + oReceipt.transactionHash);

                            nodeApi.initFeeInfo(receipt.contractAddress, wallet.Address, parseInt(parseFloat(collectionInfo.creatorFee) * 10000)).then(iReceipt => {
                                marketDao.writeLog(uid, "post/create_collection", req.body.params, 200, "initFeeInfo/" + iReceipt.transactionHash);
                            }).catch(err => {
                                marketDao.writeLog(uid, "post/create_collection", req.body.params, 403, "initFeeInfo/" + err.message);
                            })
                        }).catch(err => {
                            marketDao.writeLog(uid, "post/create_collection", req.body.params, 403, "transferOwnerShip/" + err.message);
                        })
                    }).catch(err => {
                        res.json({ status: 403, msg: err.message });
                        marketDao.writeLog(uid, "post/create_collection", req.body.params, 403, "createNftContract/" + err.message);
                    });
                }).catch(err => {
                    res.json({ status: 403, msg: err.message });
                    marketDao.writeLog(uid, "post/create_collection", req.body.params, 403, "deployNftContract/" + err.message);
                });
            }).catch(err => {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(uid, "post/create_collection", req.body.params, 403, "getNftContractByTitle/" + err.message);
            });

        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/create_collection", req.body.params, 403, "getWallet/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/create_collection", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.post('/create_nfts', authenticateAccessToken, async function (req, res) {
    const uid = req.body.params.uid;
    const collectionInfo = req.body.params.collectionInfo;
    const itemMetadataListSummary = req.body.params.itemMetadataListSummary;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/create_nfts", req.body.params, 404, "user not found");
            marketDao.updateCreatingProcess(uid, -1, 404)
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Creator) {
            res.json({ status: 405, msg: "User is not creator" });
            marketDao.writeLog(uid, "post/create_nfts", req.body.params, 405, "User is not creator");
            marketDao.updateCreatingProcess(uid, -1, 405)
            return;
        }

        marketDao.getWallet(uid, process.env.DEFAULT_CHAIN).then(walletInfos => {
            if (walletInfos.length <= 0) {
                res.json({ status: 406, msg: "Wallet info not found" });
                marketDao.writeLog(uid, "post/create_nfts", req.body.params, 406, "Wallet info not found");
                return;
            }

            marketDao.getNftContractByAddress(uid, collectionInfo.address).then(async ret => {
                if (ret.length <= 0) {
                    res.json({ status: 407, msg: "Collection is not found" });
                    marketDao.writeLog(uid, "post/create_nfts", req.body.params, 407, "Collection is not found");
                    return;
                }

                const wallet = walletInfos[0];

                var itemMetadataList = [];

                for (var i = 0; i < itemMetadataListSummary.length; i++) {
                    const itemMetadataSummary = itemMetadataListSummary[i];

                    for (var j = 0; j < itemMetadataSummary.count; j++) {
                        const tokenId = itemMetadataSummary.startIdx + j;
                        itemMetadataList.push({
                            id: tokenId,
                            name: itemMetadataSummary.title + " #" + tokenId.toString().padStart(4, '0'),
                            description: itemMetadataSummary.description,
                            meta: itemMetadataSummary.prefixUrl + tokenId + ".json",
                            image: itemMetadataSummary.image,
                        })
                    }
                }

                itemMetadataList = itemMetadataList.sort((first, second) => first.id - second.id);

                for (var i = 0; i < itemMetadataList.length; i += 100) {
                    const startIdx = itemMetadataList[i].id;
                    const endIdx = itemMetadataList.length >= i + 100 ? itemMetadataList[i + 99].id + 1 : itemMetadataList[itemMetadataList.length - 1].id + 1;

                    try {
                        await nodeApi.mintNft(collectionInfo.address, wallet.Address, startIdx, endIdx);
                        marketDao.writeLog(uid, "post/create_nfts", req.body.params, 200, "mintNft/" + startIdx + "-" + endIdx);
                    } catch (err) {
                        res.json({ status: 408, msg: err.message });
                        marketDao.writeLog(uid, "post/create_nfts", req.body.params, 408, "mintNft/" + err.message);
                        return;
                    }
                }

                for (var i = 0; i < itemMetadataList.length; i++) {
                    const itemMetadata = itemMetadataList[i];
                    try {
                        await marketDao.createNftInfo(collectionInfo.address, itemMetadata.id, itemMetadata.name, itemMetadata.description, itemMetadata.meta, itemMetadata.image, uid, wallet.public, uid);
                    } catch (err) {
                        res.json({ status: 409, msg: err.message });
                        marketDao.writeLog(uid, "post/create_nfts", req.body.params, 409, "createNftInfo/" + err.message);
                        return;
                    }
                }

                marketDao.updateNftContractTotalSupply(collectionInfo.address, Number(collectionInfo.totalSupply) + itemMetadataList.length).then(ret => {
                    res.json({ status: 200 });
                    marketDao.writeLog(uid, "post/create_nfts", req.body.params, 200, "");
                }).catch(err => {
                    res.json({ status: 403, msg: err.message });
                    marketDao.writeLog(uid, "post/create_nfts", req.body.params, 403, "updateNftContractTotalSupply/" + err.message);
                });
            }).catch(err => {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(uid, "post/create_nfts", req.body.params, 403, "getNftContractByAddress/" + err.message);
            });

        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/create_nfts", req.body.params, 403, "getWallet/" + err.message);
        });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/create_nfts", req.body.params, 403, "getUserById/" + err.message);
        marketDao.updateCreatingProcess(uid, -1, 403)
    });
});


router.post('/edit_collection', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;
    let collectionInfo = req.body.params.collectionInfo;
    let imageUrl = req.body.params.imageUrl;

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/edit_collection", req.body.params, 404, "user not found");
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Creator) {
            res.json({ status: 405, msg: "User is not creator" });
            marketDao.writeLog(uid, "post/edit_collection", req.body.params, 405, "User is not creator");
            return;
        }

        marketDao.getWallet(uid, process.env.DEFAULT_CHAIN).then(walletInfos => {
            if (walletInfos.length <= 0) {
                res.json({ status: 406, msg: "Wallet info not found" });
                marketDao.writeLog(uid, "post/edit_collection", req.body.params, 406, "Wallet info not found");
                return;
            }

            marketDao.getNftContractByAddress(uid, collectionInfo.address).then(collectionInfos => {
                if (collectionInfos.length <= 0) {
                    res.json({ status: 408, msg: "Collection not found" });
                    marketDao.writeLog(uid, "post/edit_collection", req.body.params, 408, "Collection not found");
                    return;
                }

                const collection = collectionInfos[0];

                if (collection.CreatorUid != uid) {
                    res.json({ status: 407, msg: "Not collection owner" });
                    marketDao.writeLog(uid, "post/edit_collection", req.body.params, 407, "Not collection owner");
                    return;
                }

                marketDao.editNftContract(collectionInfo.address, imageUrl, collectionInfo.description, collectionInfo.url, collectionInfo.category, collectionInfo.creatorFee).then(ret => {
                    res.json({ status: 200 });
                    marketDao.writeLog(uid, "post/edit_collection", req.body.params, 200, "");

                    if (collection.CreatorFee != collectionInfo.creatorFee) {
                        nodeApi.setCreatorFee(collectionInfo.address, parseInt(parseFloat(collectionInfo.creatorFee) * 10000)).then(iReceipt => {
                            marketDao.writeLog(uid, "post/edit_collection", req.body.params, 200, "setCreatorFee/" + iReceipt.transactionHash);
                        }).catch(err => {
                            marketDao.writeLog(uid, "post/edit_collection", req.body.params, 403, "setCreatorFee/" + err.message);
                        })
                    }
                }).catch(err => {
                    res.json({ status: 403, msg: err.message });
                    marketDao.writeLog(uid, "post/edit_collection", req.body.params, 403, "createNftContract/" + err.message);
                });
            }).catch(err => {
                res.json({ status: 403, msg: err.message });
                marketDao.writeLog(uid, "post/edit_collection", req.body.params, 403, "getNftContractByTitle/" + err.message);
            });

        }).catch(err => {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/edit_collection", req.body.params, 403, "getWallet/" + err.message);
        });

    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/edit_collection", req.body.params, 403, "getUserById/" + err.message);
    });
});

router.post('/mint_collection', authenticateAccessToken, async function (req, res) {
    let uid = req.body.params.uid;

    let collectionInfo = req.body.params.metadata.collectionMetadata;
    let itemMetadataList = req.body.params.metadata.itemMetadataList;

    let processInfos = await marketDao.getCreatingProcess(uid);
    if (processInfos.length <= 0) {
        await marketDao.createCreatingProcess(uid);
    } else {
        await marketDao.updateCreatingProcess(uid, 0, 0)
    }

    marketDao.getUserById(uid).then(async record => {
        if (record.length <= 0) {
            res.json({ status: 404, msg: "User is not found" });
            marketDao.writeLog(uid, "post/mint_collection", req.body.params, 404, "user not found");
            marketDao.updateCreatingProcess(uid, -1, 404)
            return;
        }

        let userRecord = record[0];

        if (!userRecord.Creator) {
            res.json({ status: 405, msg: "User is not creator" });
            marketDao.writeLog(uid, "post/mint_collection", req.body.params, 405, "User is not creator");
            marketDao.updateCreatingProcess(uid, -1, 405)
            return;
        }

        let wallets = await marketDao.getWallet(uid, process.env.DEFAULT_CHAIN);
        let walletAddress = wallets.length > 0 ? wallets[0].Address : '';

        if (walletAddress == '') {
            res.json({ status: 409, msg: "Creator wallet is not connected" });
            marketDao.writeLog(uid, "post/mint_collection", req.body.params, 409, "walletAddress not found");
            marketDao.updateCreatingProcess(uid, -1, 409)
            return;
        }
        try {
            let collectionAddress = await nodeApi.createCollection(collectionInfo.title, collectionInfo.symbol, collectionInfo.metadataUrl, walletAddress,
                (msg) => marketDao.writeLog(uid, "post/createCollection", '', 0, msg),
                (step, progress) => marketDao.updateCreatingProcess(uid, step, progress),
            );

            if (collectionAddress == '') {
                res.json({ status: 410, msg: "Can not make collection" });
                marketDao.writeLog(uid, "post/mint_collection", req.body.params, 410, "collectionAddress is null");
                marketDao.updateCreatingProcess(uid, -1, 410)
                return;
            }

            let candyMachineAddress = await nodeApi.createCandyMachine(collectionAddress, itemMetadataList, collectionInfo.title, collectionInfo.symbol, collectionInfo.totalCount, collectionInfo.prefixUrl, walletAddress,
                (msg) => marketDao.writeLog(uid, "post/createCandyMachine", '', 0, msg),
                (step, progress) => marketDao.updateCreatingProcess(uid, step, progress),
            );

            if (candyMachineAddress == '') {
                res.json({ status: 411, msg: "Can not make candy machine" });
                marketDao.writeLog(uid, "post/mint_collection", req.body.params, 411, "candyMachineAddress is null");
                marketDao.updateCreatingProcess(uid, -1, 411)
                return;
            }

            let nftInfos = await nodeApi.mintNft(candyMachineAddress, collectionInfo.totalCount, walletAddress,
                (msg) => marketDao.writeLog(uid, "post/mintNft", '', 0, msg),
                (step, progress) => marketDao.updateCreatingProcess(uid, step, progress),
            );

            if (nftInfos.length != collectionInfo.totalCount) {
                res.json({ status: 412, msg: "Can not mint item" });
                marketDao.writeLog(uid, "post/mint_collection", req.body.params, 412, "minted info size is different/" + nftInfos.length);
                marketDao.updateCreatingProcess(uid, -1, 412)
                return;
            }

            marketDao.updateCreatingProcess(uid, 12, 0)
            marketDao.createNftContract(collectionAddress.toBase58(), collectionInfo.title, collectionInfo.symbol, '', collectionInfo.totalCount, collectionInfo.imageUrl, collectionInfo.description, collectionInfo.url, collectionInfo.category, uid, 0).then(async ret => {

                for (var id = 0; id < nftInfos.length; id++) {
                    const nftInfo = nftInfos[id];
                    const metadataInfo = itemMetadataList[id];

                    await marketDao.createNftInfo(collectionAddress.toBase58(), nftInfo.address.toBase58(), id, metadataInfo.name, metadataInfo.description, metadataInfo.meta, metadataInfo.image, uid, walletAddress, uid);
                    marketDao.updateCreatingProcess(uid, 13, id)
                }

                res.json({ status: 200, collectionAddress: collectionAddress.toBase58() });
                marketDao.writeLog(uid, "post/mint_collection", req.body.params, 200, "");
                nodeApi.sleep(500);
                marketDao.updateCreatingProcess(uid, 14, 0)
            }).catch(err => {
                res.json({ status: 413, msg: "Can not insert data" });
                marketDao.writeLog(uid, "post/mint_collection", req.body.params, 413, "createNftContract or createNftInfo/" + err.message);
                marketDao.updateCreatingProcess(uid, -1, 413)
            });

        } catch (err) {
            res.json({ status: 403, msg: err.message });
            marketDao.writeLog(uid, "post/mint_collection", req.body.params, 403, "createCreatingProcess or await/" + err.message);
            marketDao.updateCreatingProcess(uid, -1, 403)
        }
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(uid, "post/mint_collection", req.body.params, 403, "getUserById/" + err.message);
        marketDao.updateCreatingProcess(uid, -1, 403)
    });
});

router.get('/creating_progress', async function (req, res) {
    let uid = req.query.uid;

    marketDao.getCreatingProcess(uid).then(async ret => {
        const process = ret.length > 0 ? ret[0] : { Step: 0, Progress: 0 };
        res.json({ status: 200, info: { Step: process.Step, Progress: process.Progress } });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
        marketDao.writeLog(0, "get/creating_progress", req.query, 403, "getCreatingProcess/" + err.message);
    });
});

module.exports = router; // module.exports에 담긴 object(여기서는 router object)가 module이 되어 require시에 사용