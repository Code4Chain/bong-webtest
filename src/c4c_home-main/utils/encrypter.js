var crypto = require("crypto")

module.exports = (function () {
    return {
        encrypt: async function (text) {
            return new Promise((resolve, reject) => {
                crypto.randomBytes(64, (err, buf) => {
                    let salt = buf.toString('base64').substring(0, 32);
                    crypto.pbkdf2(text, salt, 100000, 32, 'sha512', (err, key) => {
                        if (err) return reject(err);

                        return resolve({
                            salt: salt,
                            key: key.toString('base64')
                        });
                    });
                });
            });
        },

        encryptSalt: async function (text, salt) {
            return new Promise((resolve, reject) => {
                crypto.pbkdf2(text, salt, 100000, 32, 'sha512', (err, key) => {
                    if (err) return reject(err);

                    return resolve(key.toString('base64'));
                });
            });
        },

        cipher: function (text) {
            const iv = crypto.randomBytes(16).toString('hex').slice(0, 16);
            const c = crypto.createCipheriv('aes-256-cbc', process.env.CIPHER_KEY, iv);
            let result = c.update(text, 'utf8', 'hex');
            result += c.final('hex');
            return { result: result, iv: iv };
        },

        decipher: function (encode, iv) {
            const c = crypto.createDecipheriv('aes-256-cbc', process.env.CIPHER_KEY, iv);
            let result = c.update(encode, 'hex', 'utf8');
            result += c.final('utf8');
            return result;
        },
    }
})();