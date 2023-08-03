// index.js
var express = require('express');
var http = require('http');
const cors = require("cors");
var bodyParser = require('body-parser'); // 웹브라우저의 form으로 전송된 data를 서버에서 쉽게 사용하기 위해 body-parser 사용
var methodOverride = require('method-override'); // query로 method 값을 받아서 request의 HTTP method를 바꿔주는 역할
const cookieParser = require("cookie-parser");
var app = express();
var server = http.createServer(app);

// Other settings
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public')); // '현재_위치/public' route를 static폴더로 지정하라는 명령어, 즉 '/'에 접속하면 '현재_위치/public'를, '/css'에 접속하면 '현재_위치/public/css'를 연결
app.use('/', express.static(__dirname + '/homepage/build')); // '현재_위치/public' route를 static폴더로 지정하라는 명령어, 즉 '/'에 접속하면 '현재_위치/public'를, '/css'에 접속하면 '현재_위치/public/css'를 연결
app.use('/minting', express.static(__dirname + '/minting/build')); // '현재_위치/public' route를 static폴더로 지정하라는 명령어, 즉 '/'에 접속하면 '현재_위치/public'를, '/css'에 접속하면 '현재_위치/public/css'를 연결
app.use('/market_place', express.static(__dirname + '/market_place/build')); // '현재_위치/public' route를 static폴더로 지정하라는 명령어, 즉 '/'에 접속하면 '현재_위치/public'를, '/css'에 접속하면 '현재_위치/public/css'를 연결
app.use(bodyParser.json()); // json 형식의 데이터를 받는다는 설정, route의 callback함수(function(req, res, next){...})의 req.body에서 form으로 입력받은 데이터를 사용할 수 있음
app.use(bodyParser.urlencoded({ extended: true })); // urlencoded data를 extended 알고리듬을 사용해서 분석한다는 설정
app.use(methodOverride('_method')); // _method의 query로 들어오는 값으로 HTTP method를 바꿈, 예를들어 http://example.com/category/id?_method=delete를 받으면 _method의 값인 delete을 읽어 해당 request의 HTTP method를 delete으로 바꿈
app.use(cors({
    origin: ["http://localhost:3000"],
    credentials: true,
}));
app.use(cookieParser());
app.engine('html', require('ejs').renderFile);

// Routes
app.use('/', require('./routes/home')); // home.js의 module.exports에 담긴 object(router object)가 module이 되어 require시에 사용
app.use('/market_api', require('./routes/market_api')); // home.js의 module.exports에 담긴 object(router object)가 module이 되어 require시에 사용
app.use('/home_api', require('./routes/home_api')); // home.js의 module.exports에 담긴 object(router object)가 module이 되어 require시에 사용

// Port setting
var port = 8080;
server.listen(port, function () {
    console.log('server on! port : ' + port);
});
