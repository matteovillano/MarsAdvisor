//authController.js serve per renderizzare la pagina login, register, per creare i token da memorizzare nei cookie una volta registrati/loggati e per gestire le richieste POST della registrazione e del login
require('dotenv').config();                                                                   //carico le variabili del enviroment contenute in .env
const User = require('../models/User');                                                       //carico User.js conenuto in /model
const jwt = require('jsonwebtoken');                                                          //carico la libreria jasonwebtoken


const maxAge = 3 * 24 * 60 * 60;                                                              //ogni numero di maxAge è in secondi perciò il risultato finale dell'operazione è 3 giorni (3giorni*24ore*60minuti*60secondi)
const createToken = (id) => {                                                                 //funzione che prende come parametro l'id dello user e ritorna un token
  return jwt.sign({ id }, process.env.JWT_SECRET, {                                           //alla funzione sign devo fornire almeno l'oggetto id e il secret JWT_SECRET (che si trova in .env). JWT_SECRET è una stringa (che può avere caratteri random a piacere) e viene utilizzato per generare il token
    expiresIn: maxAge                                                                         //impongo una scadenza per il token pari a maxAge
  });
};

const signup_get = (req, res) => {
    res.render('signup');                                                                     //renderizza la pagina signup
}
  
const login_get = (req, res) => {
    res.render('login');                                                                      //renderizza la pagina login
}
  
const signup_post = async (req, res) => {                                                     //funzione asincrona invocata quando viene eseguito una request POST nella paggina di signup
    const { username, email, password } = req.body                                            //prende dal body della request username, email e password
    try {                                                                                     //cerca di creare lo user
        const user = await User.create({                                                      //crea lo user
            username,
            email,
            password
        })
        console.log('User creato con successo: ', user)
        const token = createToken(user._id);                                                  //crea il token dello user
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });                  //pone il token nei cookie, così da poter essere riutilizzato quando si andrà a visualizzare delle pagine o dei post dedicati solo a quello user (se siamo in https va messo HttpOnly: falase), inoltre maxAge è il tempo di validità del cookie e viene moltiplicato per 1000 poiché maxAge è in millisecondi (non in secondi a differenza di espiresIn)
        res.json({ status: 'ok' });                                                           //ritorna uno status di correttezza
    } catch (error) {                                                                         //la creazione dello user dà errore
        if (error.code === 11000) {
            return res.json({ status: 'error', error: 'Nome già in uso' })                    //errore
        }
        throw error                                                                           //errore
    }
}

const login_post = async (req, res) => {                                                      //funzione asincrona invocata quando viene eseguito una request POST nella paggina di login
    const { username, password } = req.body                                                   //prende dal body della request username e password
    try {                                                                                     //cerca di loggare lo user
        const user = await User.login(username,password);                                     //invoca la funzione login contenuta in /model
        const token = createToken(user._id);                                                  //crea il token dello user
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });                  //pone il token nei cookie, così da poter essere riutilizzato quando si andrà a visualizzare delle pagine o dei post dedicati solo a quello user (se siamo in https va messo HttpOnly: falase), inoltre maxAge è il tempo di validità del cookie e viene moltiplicato per 1000 poiché maxAge è in millisecondi (non in secondi a differenza di espiresIn)
        res.json({ status: 'ok'})                                                             //ritorna uno status di correttezza
    } catch (error) {
        res.json({ error: 'User o password sbagliata'})                                       //errore
    }
}
const logout_get = (req, res) => {                                                            // funzione che "cancella" il cookie jwt (jwt è il token che identifica l'utente ed è memorizzato, una volta loggati, dentro i cookie )
    res.cookie('jwt', '', { maxAge: 1});                                                      // in realtà non può essere cancellato, ma verrà sostituito dalla stringa vuota e inoltre questo cookie vuoto avrà scadenza di 1 millisecondo (questo perché il cookie non può essere cancellato)
    res.redirect('/');
}
module.exports = { signup_get , login_get , signup_post, login_post, logout_get };  
//Riferimenti agli strumenti utilizzati
//https://www.npmjs.com/package/jsonwebtoken JSONWEBTOKEN
//https://www.npmjs.com/package/dotenv DOTENV
