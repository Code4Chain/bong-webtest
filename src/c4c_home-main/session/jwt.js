require("dotenv").config();

const jwt = require("jsonwebtoken");

exports.generateAccessToken = (user) => {
    return jwt.sign({ user }, process.env.JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: "6h",
    });
}

exports.authenticateAccessToken = (req, res, next) => {
    let authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        // console.log("wrong token format or token is not sended");
        return res.json({ status: 400, msg: "wrong token format or token is not sended" });
    }

    jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, (error, token) => {
        if (error) {
            // console.log(error);

            if (error.name === 'TokenExpiredError') {
                return res.json({
                    status: 401,
                    msg: 'Token Expired.',
                });
            }

            if (error.name === 'JsonWebTokenError') {
                return res.status({
                    status: 401,
                    msg: 'Invalid Token.',
                });
            }
            return res.json({ status: 404, msg: error.message });
        }

        let uid = req.query.uid || req.body.params.uid;
        if (token.user.uid != uid) {
            // console.log("User info is not valid\n  uid : " + uid + "\n  token.user.uid : " + token.user.uid);

            return res.json({ status: 406, msg: "User info is invalid" });
        }

        req.token = token;
        next();
    });
};