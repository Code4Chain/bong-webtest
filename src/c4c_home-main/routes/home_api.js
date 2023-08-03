// routes/market.js

const express = require('express');
const homeDao = require('../aws/db/homepage/homeDao');
var router = express.Router(); // router함수를 초기화

router.get('/news', function (req, res) {
    homeDao.getNews().then(ret => {
        res.json({ status: 200, news: ret });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
    });
});

router.post('/news', function (req, res) {
    let imageUrl = req.body.params.imageUrl;
    let title = req.body.params.title;
    let contents = req.body.params.contents;
    let date = req.body.params.date;
    let url = req.body.params.url;

    homeDao.createNews(imageUrl, title, contents, date, url).then(ret => {
        res.json({ status: 200 });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
    });
});

router.post('/update_news', function (req, res) {
    let id = req.body.params.id;
    let imageUrl = req.body.params.imageUrl;
    let title = req.body.params.title;
    let contents = req.body.params.contents;
    let date = req.body.params.date;
    let url = req.body.params.url;

    homeDao.updateNews(id, imageUrl, title, contents, date, url).then(ret => {
        res.json({ status: 200 });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
    });
});

router.delete('/news', function (req, res) {
    let id = req.query.id;

    homeDao.deleteNews(id).then(ret => {
        res.json({ status: 200 });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
    });
});

router.get('/display', function (req, res) {
    homeDao.getDisplay().then(ret => {
        res.json({ status: 200, display: ret[0] });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
    });
});

router.post('/display', function (req, res) {
    let ceo = req.body.params.ceo;

    homeDao.updateDisplay(ceo).then(ret => {
        res.json({ status: 200 });
    }).catch(err => {
        res.json({ status: 403, msg: err.message });
    });
});

module.exports = router; // module.exports에 담긴 object(여기서는 router object)가 module이 되어 require시에 사용