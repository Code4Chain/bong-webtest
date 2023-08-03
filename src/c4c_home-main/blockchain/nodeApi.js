// Setup

const { Network, Alchemy } = require('alchemy-sdk');
const Web3 = require('web3');
const fs = require('fs');
const solc = require('solc')

class NodeDao {

    constructor() {
        require('dotenv').config();
        const isMainnet = process.env.USE_MAINNET == "true";

        const settings = {
            apiKey: process.env.ALCHEMY_API_KEY,
            network: isMainnet ? Network.MATIC_MAINNET : Network.MATIC_MUMBAI,
        };

        if (isMainnet) {
            this.web3 = new Web3("https://polygon-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY);
        }
        else {
            this.web3 = new Web3("https://polygon-mumbai.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY);
        }
        this.alchemy = new Alchemy(settings);

        this.loadSolFile();
    }

    loadMarket = async (address) => {
        const abiFile = fs.readFileSync("blockchain/contracts/C4CMarket.abi", 'utf8');
        const abiJson = JSON.parse(abiFile);
        this.marketContract = new this.web3.eth.Contract(
            abiJson,
            address
        );

        console.log("Loaded market " + address);
    }

    loadSolFile = async () => {
        this.nftContractBytecode = fs.readFileSync('blockchain/contracts/C4CNFT.bc', 'utf8').toString();
        const abiFile = fs.readFileSync("blockchain/contracts/C4CNFT.abi", 'utf8');
        this.nftContractAbi = JSON.parse(abiFile);
        this.nftContract = new this.web3.eth.Contract(this.nftContractAbi);

        //const fileContent = fs.readFileSync('blockchain/contracts/C4CNFT_flat.sol', 'utf8').toString();
        //var input = {
        //    language: "Solidity",
        //    sources: {
        //        "C4CNFT_flat.sol": {
        //            content: fileContent,
        //        },
        //    },
        //    settings: {
        //        outputSelection: {
        //            "*": {
        //                "*": ["*"],
        //            },
        //        },
        //    },
        //};

        //var output = JSON.parse(solc.compile(JSON.stringify(input)));
        //const abi = output.contracts["C4CNFT_flat.sol"]["Code4ChainNFT"].abi;
        //this.nftContractBytecode = output.contracts["C4CNFT_flat.sol"]["Code4ChainNFT"].evm.bytecode.object;
        //this.nftContract = new this.web3.eth.Contract(abi);

        console.log("Loaded NftContract");
    }

    setMarketOwner = async (wallet) => {
        this.marketOwner = wallet;

        console.log("Set owner address " + wallet.public);
    }

    sendTransaction = (resolve, reject, method, wallet = this.marketOwner, to = this.marketContract._address, value = 0, gas = 3000000) => {
        let encodedABI = null;

        if (method) {
            encodedABI = method.encodeABI();
        }

        var tx = {
            from: wallet.public,
            to: to,
            gas: gas,
            data: encodedABI,
            value: value
        };

        try {
            this.web3.eth.accounts.signTransaction(tx, wallet.private).then(signed => {
                var tran = this.web3.eth.sendSignedTransaction(signed.rawTransaction);

                tran.on('receipt', (receipt) => {
                    resolve(receipt);
                });

                tran.on('error', (err) => {
                    reject(err);
                });
            });
        } catch (err) {
            throw err;
        }
    }

    /**
     * ----------------------------------------------------------------------------------------------
     * MarketAPI
     * */

    setMarketFee = (set) => new Promise((resolve, reject) => {
        if (!this.marketContract) {
            reject("Market contract is not initialized");
            return;
        }

        if (!this.marketOwner) {
            reject("Market owner is not initialized");
            return;
        }

        const method = this.marketContract.methods.setMarketFee(set);
        this.sendTransaction(resolve, reject, method);
    });

    initFeeInfo = (contractAddress, creatorAddress, initFeeRate) => new Promise((resolve, reject) => {
        if (!this.marketContract) {
            reject("Market contract is not initialized");
            return;
        }

        if (!this.marketOwner) {
            reject("Market owner is not initialized");
            return;
        }

        const method = this.marketContract.methods.initFeeInfo(contractAddress, creatorAddress, initFeeRate);
        this.sendTransaction(resolve, reject, method);
    });

    setCreatorFee = (contractAddress, feeRate) => new Promise((resolve, reject) => {
        if (!this.marketContract) {
            reject("Market contract is not initialized");
            return;
        }

        const method = this.marketContract.methods.setCreatorFee(contractAddress, feeRate);
        this.sendTransaction(resolve, reject, method);
    });

    list = (wallet, contractAddress, tokenId, price) => new Promise((resolve, reject) => {
        if (!this.marketContract) {
            reject("Market contract is not initialized");
            return;
        }

        const method = this.marketContract.methods.list(contractAddress, tokenId, price);
        this.sendTransaction(resolve, reject, method, wallet);
    });

    cancelList = (wallet, contractAddress, tokenId) => new Promise((resolve, reject) => {
        if (!this.marketContract) {
            reject("Market contract is not initialized");
            return;
        }

        const method = this.marketContract.methods.cancelList(contractAddress, tokenId);
        this.sendTransaction(resolve, reject, method, wallet);
    });

    offer = (wallet, contractAddress, tokenId, price) => new Promise((resolve, reject) => {
        if (!this.marketContract) {
            reject("Market contract is not initialized");
            return;
        }

        const method = this.marketContract.methods.offer(contractAddress, tokenId, price);
        this.sendTransaction(resolve, reject, method, wallet, this.marketContract._address, price);
    });

    cancelOffer = (wallet, contractAddress, tokenId) => new Promise((resolve, reject) => {
        if (!this.marketContract) {
            reject("Market contract is not initialized");
            return;
        }

        const method = this.marketContract.methods.cancelOffer(contractAddress, tokenId);
        this.sendTransaction(resolve, reject, method, wallet);
    });

    acceptOffering = (wallet, contractAddress, tokenId, offererAddress, price) => new Promise((resolve, reject) => {
        if (!this.marketContract) {
            reject("Market contract is not initialized");
            return;
        }

        const method = this.marketContract.methods.acceptOffering(contractAddress, tokenId, offererAddress, price);
        this.sendTransaction(resolve, reject, method, wallet);
    });

    buyNow = (wallet, contractAddress, tokenId, price) => new Promise((resolve, reject) => {
        if (!this.marketContract) {
            reject("Market contract is not initialized");
            return;
        }

        const method = this.marketContract.methods.buyNow(contractAddress, tokenId, price);
        this.sendTransaction(resolve, reject, method, wallet, this.marketContract._address, price);
    });



    /**
     * ----------------------------------------------------------------------------------------------
     * NftAPI
     * */

    deployNftContract = (name, symbol, urlPrefix) => new Promise((resolve, reject) => {
        if (!this.marketOwner) {
            reject("Market owner is not initialized");
            return;
        }

        const method = this.nftContract.deploy({
            data: this.nftContractBytecode,
            arguments: [name, symbol, urlPrefix]
        });

        this.sendTransaction(resolve, reject, method, this.ownerWallet, null, 0, 10000000);
    });

    mintNft = (contractAddress, toAddress, startIdx, endIdx) => new Promise((resolve, reject) => {
        if (!this.marketOwner) {
            reject("Market owner is not initialized");
            return;
        }

        const nftContract = new this.web3.eth.Contract(
            this.nftContractAbi,
            contractAddress
        );

        const method = nftContract.methods.multiMint(toAddress, startIdx, endIdx);
        this.sendTransaction(resolve, reject, method, this.marketOwner, contractAddress, 0, 15000000);
    });

    transferOwnerShip = (contractAddress, toAddress) => new Promise((resolve, reject) => {
        if (!this.marketOwner) {
            reject("Market owner is not initialized");
            return;
        }

        const nftContract = new this.web3.eth.Contract(
            this.nftContractAbi,
            contractAddress
        );

        const method = nftContract.methods.transferOwnership(toAddress);
        this.sendTransaction(resolve, reject, method, this.marketOwner, contractAddress);
    });

    isApprovedForAll = (contractAddress, ownerAddress, operatorAddress) => new Promise((resolve, reject) => {
        const nftContract = new this.web3.eth.Contract(
            this.nftContractAbi,
            contractAddress
        );

        nftContract.methods.isApprovedForAll(ownerAddress, operatorAddress).call().then(ret => {
            resolve(ret);
        }).catch(err => {
            reject(err);
        })
    });

    setApprovalForAll = (contractAddress, ownerWallet, operatorAddress) => new Promise((resolve, reject) => {
        const nftContract = new this.web3.eth.Contract(
            this.nftContractAbi,
            contractAddress
        );

        const method = nftContract.methods.setApprovalForAll(operatorAddress, true);
        this.sendTransaction(resolve, reject, method, ownerWallet, contractAddress);
    });

    /**
     * ----------------------------------------------------------------------------------------------
     * CommonAPI
     * */

    transferCoin = (fromWallet, toAddress, valueWei) => new Promise((resolve, reject) => {
        this.sendTransaction(resolve, reject, null, fromWallet, toAddress, value = valueWei);
    });

    // receipt
    // Transaction Fee : effectiveGasPrice * gasUsed
    //
    //{
    //  transactionHash: '0xf49a2e8b48ea68f4fc877c03256d0b52f1644c4bb106272a97f1e3af89a7bdc4',
    //  blockHash: '0xb6ec5823957659e1caeea26474d105b7f4810f27422f6c2bef06d927b0df6895',
    //  blockNumber: 31177205,
    //  logs: [
    //    ...
    //  ],
    //  contractAddress: null,
    //  effectiveGasPrice: 1500000016,
    //  cumulativeGasUsed: 453971,
    //  from: '0xc1a08b369ebcf215e6338740004e136bb5c61dea',
    //  gasUsed: 29108,
    //  logsBloom: '0x00000000000000000000000000000000000000000000000000804200000000000000000000000000800000000020000000008000000000000000000000008000000000000000000000000000000000800001000000000000000100000000000000100000000000000000000000002000000000000000000080000000000000400000000000000000000000000000000000000000000000000000000000000000200000000000000000080004000000000000004000000000000000000000004000001000000000000001000000000100000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000100000',
    //  status: true,
    //  to: '0xf54beb99f6bd26f45f069b39e1caba9d90b760f2',
    //  transactionIndex: 3,
    //  type: '0x0'
    //}

    /**
     * ----------------------------------------------------------------------------------------------
     * */

    getNftsForOwner = (address) => {
        return this.alchemy.nft.getNftsForOwner(address);
    }

    /**
     * {
          "nfts": [
            {
              "contract": {
                "address": "0xe785E82358879F061BC3dcAC6f0444462D4b5330"
              },
              "id": {
                "tokenId": "0x0000000000000000000000000000000000000000000000000000000000000000",
                "tokenMetadata": {
                  "tokenType": "ERC721"
                }
              },
              "title": "WoW #0",
              "description": "",
              "tokenUri": {
                "raw": "ipfs://QmTNBQDbggLZdKF1fRgWnXsnRikd52zL5ciNu769g9JoUP/0",
                "gateway": "https://ipfs.io/ipfs/QmTNBQDbggLZdKF1fRgWnXsnRikd52zL5ciNu769g9JoUP/0"
              },
              "media": [
                {
                  "raw": "ipfs://QmYPznMvizE4BxrYaXM8dpRrzgN6Pg2rtTczjzNn13More",
                  "gateway": "https://ipfs.io/ipfs/QmYPznMvizE4BxrYaXM8dpRrzgN6Pg2rtTczjzNn13More"
                }
              ],
              "metadata": {
                "name": "WoW #0",
                "image": "ipfs://QmYPznMvizE4BxrYaXM8dpRrzgN6Pg2rtTczjzNn13More",
                "attributes": [
                  {
                    "value": "Soft Purple",
                    "trait_type": "Background"
                  },
                ]
              },
              "timeLastUpdated": "2022-11-23T15:12:17.193Z",
              "contractMetadata": {
                 ...
              }
            },
          ]
     * }
     * 
     * @param {any} contractAddress
     */
    getNftsForCollection = (contractAddress, pageKey) => { // CU : 100 -> 0
        return this.alchemy.nft.getNftsForContract(contractAddress, { withMetadata: true, pageSize: 100, pageKey: pageKey });
    }

    /**
     * {
          "address": "0xe785e82358879f061bc3dcac6f0444462d4b5330",
          "contractMetadata": {
            "name": "World Of Women",
            "symbol": "WOW",
            "totalSupply": "10000",
            "tokenType": "ERC721",
            "openSea": {
              "floorPrice": 1.578,
              "collectionName": "World of Women",
              "safelistRequestStatus": "verified",
              "imageUrl": "https://i.seadn.io/gae/EFAQpIktMBU5SU0TqSdPWZ4byHr3hFirL_mATsR8KWhM5z-GJljX8E73V933lkyKgv2SAFlfRRjGsWvWbQQmJAwu3F2FDXVa1C9F?w=500&auto=format",
              "description": "A community celebrating representation, inclusivity, and equal opportunities for all.\r\nUnited by a first-of-its-kind collection, featuring 10,000 artworks of diverse and powerful women.\r\n\r\nCreated and Illustrated by Yam Karkai (@ykarkai)\r\n\r\nNew official collection World of Women Galaxy available here:\r\nhttps://opensea.io/collection/world-of-women-galaxy",
              "externalUrl": "http://worldofwomen.art",
              "twitterUsername": "worldofwomennft",
              "discordUrl": "https://discord.gg/worldofwomen",
              "lastIngestedAt": "2022-11-23T02:36:58.000Z"
            }
          }
     *  }
     * 
     * @param {any} contractAddress
     */
    getContractMetadata = (contractAddress) => { // CU : 100 -> 0
        return this.alchemy.nft.getContractMetadata(contractAddress);
    }

    /**
     * 
     * {
            "owners": [
            "0x9f4f78a6c4a5e6f8afa81631b9120ae3c831b494"
            ]
        }
     * @param {any} contractAddress
     * @param {any} tokenId
     */
    getOwnerForToken = (contractAddress, tokenId) => { // CU : 100 -> 0
        return this.alchemy.nft.getOwnersForNft(contractAddress, tokenId)
    }

    refreshNftMetadata = (contractAddress, tokenId) => {
        return this.alchemy.nft.refreshNftMetadata(contractAddress, tokenId);
    }

    createWallet = () => {
        return Promise.resolve(this.web3.eth.accounts.create());
    }

    getBalance = (address) => {
        return this.alchemy.core.getBalance(address, "latest");
    }

    getTokenBalance = (address, tokenContract) => {
        return this.alchemy.core.getTokenBalances(address, [tokenContract]);
    }

    sleep = (ms) => {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }
}


module.exports = new NodeDao()