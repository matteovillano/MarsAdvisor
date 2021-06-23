const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

async function isUser(token){
    let user = null;
    if (token) {
        const verify = await  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
          if (err) {
            user = null;
          } else {
            let utente = await User.findById(decodedToken.id);
            user = utente;
          }
        });
        return {user: user}
    } 
    else {
        return {user: null}
      }
}

module.exports = { isUser };