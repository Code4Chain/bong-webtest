// routes/home.js

const express = require('express');
var router = express.Router(); // router함수를 초기화
const path = require('path');
const market_place_index = path.resolve(__dirname, '../market_place/build/index.html');
const homepage_index = path.resolve(__dirname, '../homepage/build/index.html');


// Home
router.get('/', function (req, res) { // "/"에 get 요청이 오는 경우를 router함수에 설정
    res.render('homepage/build/index.html');
});

// Home
router.get('/admin', function (req, res) { // "/"에 get 요청이 오는 경우를 router함수에 설정
    res.sendFile(homepage_index);
});

// Minting demo
router.get('/minting', function (req, res) { // "/"에 get 요청이 오는 경우를 router함수에 설정
    res.render('minting/build/index.html');
});

// Market place demo
router.get('/market_place/*', function (req, res) { // "/"에 get 요청이 오는 경우를 router함수에 설정
    res.sendFile(market_place_index);
});


module.exports = router; // module.exports에 담긴 object(여기서는 router object)가 module이 되어 require시에 사용