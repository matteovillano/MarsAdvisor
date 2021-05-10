//User.js contiene lo schema dell'utente nel database, la funzione per criptare la password prima che venga inviata al database e la funzione di login
const mongoose = require('mongoose');                                      //Libreria con funzioni che permettono di generare schema dati per il database MongoDB
const bcrypt = require('bcrypt');                                          //Libreria con funzioni che permettono di criptare stringhe (nel nostro caso la utilizzeremo per criptare password prima che vengano memorizzate nel database)

//Modello di dati di un user utilizzato nel database (con i vari campi presenti)
const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true},
        email: { type: String, required: true},
        password: { type: String, required: true},
        date: { type: Date, default: Date.now}
    },
    { 
        collection: 'users'
    }
);

//Funzione asincrona che viene eseguita prima di salvare l'utente nel database MongoDB. Eseguo la funzione di hash della libreria bcrypt sulla password così da renderla criptata quando sarà memorizzata nel database
userSchema.pre('save', async function(next) {
    const salt = await bcrypt.genSalt();                                    //genera un salt (randomico), ovvero il fattore di costo di tempo (ex 10) per generare l'hash, più è alto più impiegherà tempo a essere generato
    this.password = await bcrypt.hash(this.password, salt);                 //eseguo la funzione di hash di bcrypt fornendogli la password e il salt generato precedentemente
    next();                                                                 //una volta eseguito l'hashing e salvato in 'password' passo alla prossima funzione nella stack
});

//Funzione asincrona statica che permette di fare il login e a cui è necessario fornire le credenziali username e password (restituisce un valore booleano in caso di successo o meno)
userSchema.statics.login = async function(username, password) {
    const user = await this.findOne({ username });                          //prima cerca se nel database c'è lo user
    if (user) {
      const auth = await bcrypt.compare(password, user.password);           //funzione di bcrypt che compara le due stringhe di password, quella fornita e quella all'interno del database
      if (auth) {
        return user;                                                        //ritorna lo user (da notare che user è un valore booleano true o false)
      }
      throw Error('Password errata');                                       //errore password
    }
    throw Error('Username errato');                                         //errore username
  };

const User = mongoose.model('user', userSchema);                            //Compila il modello userSchema e viene assegnato a User https://mongoosejs.com/docs/models.html (da notare che user deve essere singolare e non users!!!)
module.exports = User;                                                      //Esporta il modello User e le sue funzioni

//Riferimenti agli strumenti utilizzati
//https://masteringjs.io/tutorials/fundamentals/class#statics qui spiega cosa sono le funzioni statiche (permettono di utilizzare "this")
//https://www.npmjs.com/package/bcrypt BCRYPT
//https://mongoosejs.com/docs/models.html MONGOOSE