var nodemailer = require('nodemailer');

require('dotenv').config();
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_ACCOUNT,
        pass: process.env.GMAIL_PASSWORD
    }
});
module.exports = (function () {
    return {
        sendVerificationCode: async function (to, code) {
            return new Promise((resolve, reject) => {
                var mailOptions = {
                    from: process.env.GMAIL_ACCOUNT,
                    to: to,
                    subject: 'Verification code for Code4Chain Marketplace',
                    html: '<span>Please enter the code below exactly.</span><br /><h1>' + code + '</h1>'
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(info);
                    }
                });
            });
        },
    }
})();