//authMiddleware.js serve per contenere le funzioni di middleware di autentificazione, ovvero verifica, controllando nei cookies se l'utente è loggato e quindi autorizzato ad accedere alla risorsa (per esempio app.get('/home', esempioFunzione, (req, res) => res.render('home')); ha una funzione di middleware)
const jwt = require('jsonwebtoken');                                           //carica jsonwebtoken
const User = require('../models/User');
require('dotenv').config();                                                    //carica dotenv per le variabili dell'ambiente

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {         //verifica se il token è legale
      if (err) {
        console.log(err.message);
        res.redirect('/login');                                                //redirige sulla pagina login in caso di errore
      } else {
        console.log(decodedToken);
        next();
      }
    });
  } else {
    res.redirect('/login');                                                    //redirige sulla pagina login in caso di mancanza di un token
  }
};
const checkUser = (req, res, next) => {                                        //funzione che permette di verficare chi è l'user e restituisce dei dati attraverso res.local.<nome_dato> = <dato_utente>
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {   //verifica se il token è legale
      if (err) {
        console.log(err.message);
        res.locals.user = null;                                                //di default setto la proprietà username a null
        next();                                                                //non fa nulla ed esegue la prossima funzione nello stack
      } else {
        let user = await User.findById(decodedToken.id)                        //dentro decodedToken c'è l'id dello user
        res.locals.user = user;                                                //res.locals.<nome_dato> = <dato_utente> restituisce nella view un dato da poter poi utilizzare attraverso (per esempio locals.user.username)
        next();
      }
    });
  } else {
    res.locals.user = null;                                                   //di default setto la proprietà username a null
    next();
  }
}
module.exports = { requireAuth , checkUser };                                 //esporta la funzione requireAuth e checkUser

//Riferimenti agli strumenti utilizzati
//https://www.npmjs.com/package/jsonwebtoken JSONWEBTOKEN
//https://www.npmjs.com/package/dotenv DOTENV