const nodeApi = require('../../../blockchain/nodeApi');
const marketDao = require('./marketDao');
const axios = require('axios');

class MarketDBUpdator {
    constructor() {
        require('dotenv').config();

        if (process.env.MARKET_DB_UPDATE_INTERVAL > 0) {
            // setTimeout(() => this.createContractInfo('0x5A877E3fc2f925Cd1058432Fc4c455991a89Afe6'), 1000);

            setTimeout(this.dbUpdate, 1000);
            setInterval(this.dbUpdate, process.env.MARKET_DB_UPDATE_INTERVAL)
        }
    }

    print = (str) => {
        console.log(str);
    }

    dbUpdate = async () => {
        this.print("DB update start >>>>");

        let contractList = await marketDao.getAllNftContracts();
        this.print("  contract length : " + contractList.length);

        for (var c = 0; c < contractList.length; c++) {
            let record = contractList[c];

            if (!record.Enabled) continue;

            try {
                await this.syncNftContract(record.Address);
            } catch (err) {
                this.print("  occur err:" + err);
            }
        }

        this.print("DB update end <<<<");
    }

    syncNftContract = async (contractAddress) => {
        this.print("    Contract update start (" + contractAddress + ") >>>>");
        let totalSupply = await this.updateContractInfo(contractAddress);
        this.print("      total supply : " + totalSupply);

        var pageKey = null;
        do {
            let ret = await nodeApi.getNftsForCollection(contractAddress, pageKey);
            pageKey = ret.pageKey;
            try {
                await this.updateNftsInfo(contractAddress, ret.nfts);
            } catch (err) {
                this.print("  occur err:" + err);
            }
        } while (pageKey);

        this.print("    Contract update end <<<<");
    }

    createContractInfo = async (contractAddress) => {
        let contract = await marketDao.getNftContract(contractAddress);
        if (contract.length <= 0) {
            let ret = await nodeApi.getContractMetadata(contractAddress);
            try {
                await marketDao.createNftContract(contractAddress, ret.name, ret.symbol, ret.tokenType, ret.totalSupply, ret.openSea.imageUrl, ret.openSea.description, ret.openSea.externalUrl, '', 0, 0);
            } catch (err) {
                this.print("  occur err:" + err);
                return;
            }
            this.syncNftContract(contractAddress);
        }
    }

    updateContractInfo = async (contractAddress) => {
        try {
            let ret = await nodeApi.getContractMetadata(contractAddress);
            await marketDao.updateNftContract(contractAddress, ret.name, ret.symbol, ret.tokenType, ret.totalSupply);
            return ret.totalSupply;
        } catch (err) {
            this.print("  occur err:" + err);
            return 0;
        }
    }

    updateNftsInfo = async (contractAddress, nfts) => {
        for (var i = 0; i < nfts.length; i++) {
            try {
                const nftInfo = nfts[i];

                var ownerAddress = await nodeApi.getOwnerForToken(contractAddress, nftInfo.tokenId);

                let ownerInfos = await marketDao.getUser(ownerAddress.owners[0]);
                let ownerUid = ownerInfos.length > 0 ? ownerInfos[0].Uid : 0;
                // owner uid 변경 된 경우 sell 및 bid(?) 전부 캔슬

                if (!nftInfo.title || !nftInfo.desciption || nftInfo.media.length <= 0) {
                    const res = await axios.get(nftInfo.tokenUri.gateway);

                    nftInfo.title = res.data.name;
                    nftInfo.media = [{ gateway: res.data.image }];
                    nftInfo.desciption = res.data.description;
                }

                marketDao.updateOrInsertNftInfo(contractAddress, nftInfo.tokenId, nftInfo.title, nftInfo.desciption, nftInfo.tokenUri.gateway, nftInfo.media[0].gateway, ownerUid, ownerAddress.owners[0]);
            } catch (err) {
                this.print("  occur err:" + err);
            }
        }
    }
}

module.exports = new MarketDBUpdator();