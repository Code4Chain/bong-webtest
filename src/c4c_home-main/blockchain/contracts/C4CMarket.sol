// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// testnet : 0x0792bbBA9B05bC646BBaE512A84A601eD6dA300F
contract C4CMarket is Pausable {

    event settingFeeRate(address indexed contractAddress, uint feeRate);
    event listing(address indexed owner, address indexed contractAddress, uint indexed tokenId, uint price);
    event offering(address indexed owner, address indexed contractAddress, uint indexed tokenId, uint price);
    event trading(address indexed buyer, address sellerAddress, address indexed contractAddress, uint indexed tokenId, uint price, uint8 tradeType); // 1: accept offering, 2: buy now

    struct FeeInfo {
        address payable owner;
        uint feeRate;
    }

    address payable public ownerAddress;
    uint public marketFeeRate = 0;

    mapping(address => FeeInfo) public feeInfo;
    mapping(address => mapping(uint => uint)) public listItem;
    mapping(address => mapping(uint => mapping(address => uint))) public offerItem;

    constructor() {
        ownerAddress = payable(msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == ownerAddress);
        _;
    }

    function transferOwnership(address payable newOwnerAddress) public onlyOwner {
        ownerAddress = newOwnerAddress;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function initFeeInfo(address contractAddress, address payable creatorAddress, uint initFeeRate) public onlyOwner {
        feeInfo[contractAddress] = FeeInfo({
            owner: creatorAddress,
            feeRate: initFeeRate
        });

        emit settingFeeRate(contractAddress, initFeeRate);
    }

    function setCreatorFee(address contractAddress, uint feeRate) public onlyOwner {
        feeInfo[contractAddress].feeRate = feeRate;

        emit settingFeeRate(contractAddress, feeRate);
    }

    function setMarketFee(uint feeRate) public onlyOwner {
        marketFeeRate = feeRate;
    }

    function list(address contractAddress, uint tokenId, uint price) public whenNotPaused {
        ERC721 nft = ERC721(contractAddress);

        require(nft.isApprovedForAll(msg.sender, address(this)));
        require(msg.sender == nft.ownerOf(tokenId));

        listItem[contractAddress][tokenId] = price;
        
        emit listing(msg.sender, contractAddress, tokenId, price);
    }

    function cancelList(address contractAddress, uint tokenId) public whenNotPaused {
        ERC721 nft = ERC721(contractAddress);

        require(nft.isApprovedForAll(msg.sender, address(this)));
        require(msg.sender == nft.ownerOf(tokenId));

        listItem[contractAddress][tokenId] = 0;
        
        emit listing(msg.sender, contractAddress, tokenId, 0);
    }

    function offer(address contractAddress, uint tokenId, uint price) public payable whenNotPaused {
        require(msg.value == price);

        offerItem[contractAddress][tokenId][msg.sender] = price;

        emit offering(msg.sender, contractAddress, tokenId, price);
    }

    function cancelOffer(address contractAddress, uint tokenId) public whenNotPaused {
        uint price = offerItem[contractAddress][tokenId][msg.sender];

        require(price > 0);

        offerItem[contractAddress][tokenId][msg.sender] = 0;

        address payable sender = payable(msg.sender);
        sender.transfer(price);

        emit offering(msg.sender, contractAddress, tokenId, 0);
    }

    function calcFee(uint price, uint feeRate) public pure returns (uint) {
        return price * feeRate / 1000000;
    }

    function acceptOffering(address contractAddress, uint tokenId, address offererAddress, uint price) public whenNotPaused {
        ERC721 nft = ERC721(contractAddress);

        require(nft.isApprovedForAll(msg.sender, address(this)));
        require(msg.sender == nft.ownerOf(tokenId));

        uint offerPrice = offerItem[contractAddress][tokenId][offererAddress];

        require(offerPrice == price);

        if (listItem[contractAddress][tokenId] > 0) {
            listItem[contractAddress][tokenId] = 0;
            emit listing(msg.sender, contractAddress, tokenId, 0);
        }

        offerItem[contractAddress][tokenId][offererAddress] = 0;
        emit offering(offererAddress, contractAddress, tokenId, 0);
        
        uint creatorFee = 0;
        if (feeInfo[contractAddress].feeRate > 0) {
            creatorFee = calcFee(price, feeInfo[contractAddress].feeRate);
            feeInfo[contractAddress].owner.transfer(creatorFee);
        }

        uint marketFee = 0;
        if (marketFeeRate > 0) {
            marketFee = calcFee(price, marketFeeRate);
            ownerAddress.transfer(marketFee);
        }

        address payable sellerAddress = payable(msg.sender);
        sellerAddress.transfer(price - creatorFee - marketFee);
        nft.safeTransferFrom(msg.sender, offererAddress, tokenId);
        
        emit trading(offererAddress, msg.sender, contractAddress, tokenId, price, 1);
    }

    function buyNow(address contractAddress, uint tokenId, uint price) public payable whenNotPaused {
        ERC721 nft = ERC721(contractAddress);
        address payable sellerAddress = payable(nft.ownerOf(tokenId));

        require(nft.isApprovedForAll(sellerAddress, address(this)));

        uint listPrice = listItem[contractAddress][tokenId];

        require(listPrice == price);
        require(price == msg.value);

        listItem[contractAddress][tokenId] = 0;
        emit listing(sellerAddress, contractAddress, tokenId, 0);

        uint offerPrice = offerItem[contractAddress][tokenId][msg.sender];
        if (offerPrice > 0) {
            offerItem[contractAddress][tokenId][msg.sender] = 0;
            address payable sender = payable(msg.sender);
            sender.transfer(offerPrice);
            emit offering(msg.sender, contractAddress, tokenId, 0);
        }

        uint creatorFee = 0;
        if (feeInfo[contractAddress].feeRate > 0) {
            creatorFee = calcFee(price, feeInfo[contractAddress].feeRate);
            feeInfo[contractAddress].owner.transfer(creatorFee);
        }

        uint marketFee = 0;
        if (marketFeeRate > 0) {
            marketFee = calcFee(price, marketFeeRate);
            ownerAddress.transfer(marketFee);
        }

        sellerAddress.transfer(price - creatorFee - marketFee);
        nft.safeTransferFrom(sellerAddress, msg.sender, tokenId);

        emit trading(msg.sender, sellerAddress, contractAddress, tokenId, price, 2);
    }
    
}