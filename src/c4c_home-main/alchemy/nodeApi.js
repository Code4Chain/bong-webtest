// Setup

const { Network, Alchemy } = require('alchemy-sdk');
const Web3 = require('web3');

class NodeDao {

    constructor() {
        require('dotenv').config();

        const settings = {
            apiKey: process.env.ALCHEMY_API_KEY,
            network: Network.MATIC_MUMBAI,
        };

        this.web3 = new Web3("https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_API_KEY);
        this.alchemy = new Alchemy(settings);
    }

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
}


module.exports = new NodeDao()