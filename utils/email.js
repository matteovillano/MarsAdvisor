const sgMail = require("@sendgrid/mail");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = (to, from, subject, html) => {
  const msg = {
    to,
    from,
    subject,
    html: html,
  };

  sgMail.send(msg, function (err, result) {
    if (err) {
      console.log("Errore: email non iviata");
    } else {
      console.log("Email inviata");
    }
  });
};

module.exports = sendEmail;
