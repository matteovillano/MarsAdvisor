
//modules import
const express=require('express');
const mongoose=require('mongoose');
const axios=require('axios');
const dotenv=require('dotenv');

//////////////
var path = require('path');
var request = require('request');
const websocket=require('ws');
const { callNasaImageAPI, callMarsAPIs, getBinary , uploadImage} = require("./functions/api-calls");
const { requireAuth, checkUser } = require('./middleware/authMiddleware');
const cookieParser = require('cookie-parser');


const app=express();
dotenv.config();

app.use(express.static(__dirname + '/static'));
app.set('view engine', 'ejs');

// previene il caching di tutti gli utenti non loggati una volta che viene cambiata la pagina(si ricorda comunque dell'utente se rimane loggato), questo per evitare il problema del back button del browser dopo il logout (facendo back button dopo il logout rimaneva in cache la pagina dello user)
app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
  });

var wss=new websocket.Server({port: 8002});
const url = "ws://localhost:8002";
const connection = new websocket(url);

//VARIABILI GLOBALI
let url_to_save='';
let access_token = '';
let binary_media = '';
let upload_token = '';
//import thing from dotenv
const nasa_api_key=process.env.NASA_API_KEY;
const api_key = process.env.NASA_API_KEY;
const client_id = process.env.OAUTH_CLIENT;
const secret = process.env.OAUTH_SECRET;



//these two methods are for read HTTP requests body
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());


/************************************MONGODB******************************/

//schema
const itemSchema=new mongoose.Schema({
    title: String,
    media_type: String,
    url: String,
    hdurl: String,
    explanation: String,
    date: String,
    copyright: String,
    comment: String
});

//model
const Item=mongoose.model('Item',itemSchema);

const authRoutes = require('./routes/authRoutes');  // carica e rende globali nell'app le route di authRoutes così che possa essere utilizzato
app.use(authRoutes);

/**********************************COOKIES**********************************/
app.use(cookieParser());


/////////////////////////////////////////////////////////////////////////////
app.get('*', checkUser);  //utilizza su tutte le location il middleware checkUser per verificare se c'è un token dell'user ed è verificato, così da poter vedere i suoi dati dinamicamente (se ce ne sono)
app.get('/user', requireAuth, (req, res) => res.render('user'));   //pagina dell'utente loggato (eseguie prima la funzione middleware requireAuth per verificare se l'utente è loggato)
app.get('/', function(req, res) {

    const resp = callNasaImageAPI();  //chiamo funzione generica 
    resp.then(async (response) => {
        if (response.error){
            res.render('errore', {error: "Errore durante la chiamata API Apod"});  //gestire schermata di errore generica
        }
        else{
            const data = response.res.data;
            let url = data.media_type == 'video' ? data.thumbnail_url : data.url;  // differenzio video e foto
            let is_video = false;
            if (data.media_type == 'video' && typeof(url) == 'undefined'){  // caso in cui non c'è una url per un'immagine
                url = data.url;
                is_video = true;  // la risorsa è solo video
            }
            res.render('index', { url: url , title:data.title, description:data.explanation , copyright:typeof(data.copyright) != 'undefined' ? data.copyright : ' - ', date: data.date, video: is_video});
            binary_media = await getBinary(url);
        }
    }).catch((error) => {
        console.error(error);
        res.render('errore', {error: "Errore durante la chiamata API Apod"});
    })

    
});

app.post('/', function(req, res) {
    if (req.body['apod-day']){
        const data = req.body['apod-day'];
        const resp = callNasaImageAPI(data);  //chiamo funzione generica 
        resp.then(async (response) => {
            if (response.error){
                res.render('errore', {error: "Errore durante la chiamata API Apod"});  //gestire schermata di errore generica
            }
            else{
                const data = response.res.data;
                let url = data.media_type == 'video' ? data.thumbnail_url : data.url;  // differenzio video e foto
                let is_video = false;
                if (data.media_type == 'video' && typeof(url) == 'undefined'){
                    url = data.url;
                    is_video = true;  // risorsa solo video
                }
                res.render('index', { url: url , title:data.title, description:data.explanation , copyright:typeof(data.copyright) != 'undefined' ? data.copyright : ' - ', date: data.date, video: is_video});
                binary_media = await getBinary(url);
            }
        }).catch((error) => {
            console.error(error);
            res.render('errore', {error: "Errore durante la chiamata API Apod"});
        })
    }
    else{
        res.render('errore', {error: "Errore durante la richiesta POST, nessuna data è stata passata"}); // gestire errore
    }
});

app.post('/google_oauth', function (req, res){  //post per il salvataggio su g. foto, inizio procedura oAuth
    if(req.body.url_img){
        url_to_save = req.body.url_img;
        const google_params = new URLSearchParams({
            'client_id': client_id,
            'redirect_uri': 'http://localhost:8001/save_image/',
            'response_type': 'code',
            'scope': 'https://www.googleapis.com/auth/photoslibrary.appendonly',  //solo salvataggio, niente lettura
            'access_type': 'online',
            'state': 'rdc_project'
        });
        res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${google_params}`);
    }
})

app.get('/save_image', async function (req, res) { //procedura di invio authorization code
    const code = req.query.code;
    const upload_params = new URLSearchParams({
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        'client_id': client_id,
        'client_secret': secret,
        'code': code,
        'redirect_uri': 'http://localhost:8001/save_image/',
        'grant_type': 'authorization_code'
    });
    if (code) {
        try{
            const google_response = await axios.post('https://oauth2.googleapis.com/token', upload_params);
            if(google_response.status == 200){
                access_token = google_response.data.access_token;  //salvo token per accedere al servizio
                const upload = await uploadImage (binary_media, access_token);  //funzione che salva l'immagine su google photo dandogli l'immagine e un token di accesso di google oauth
                console.log(upload.status);
                const risposta = {staatus: "ko", tipo: "upload"};
                connection.send(JSON.stringify(risposta));
                res.redirect('/');  // ridireziona sull'homepage senza aspettare che uploadImage venga terminata
            }
            else{
                res.render('errore', {error: "Errore durante la procedura oAuth"}); // gestire errore
            }
        } catch (error) {
            console.log(error);
            res.send('errore google_response');
        }
    }
})

app.get('/mars', function(req, res) {
    let call = callMarsAPIs();
    call.then((response) => {
        if(response.error){
            res.render('errore', {error: "Errore durante la chiamata API Mars Photos"});
        }
        else{
            let image;
            image = response.response;
            res.render('mars', 
            { url: image.img_src , sol: image.sol
            , date: image.earth_date, name: image.rover.name
            });
        }
    }).catch((error) => {
        console.error(error);
        res.render('errore', {error: "Errore durante la chiamata API Mars Photos"});
    })
});

app.post('/mars', function(req, res) {
    if(req.body['sonda']){
        const sonda = req.body['sonda'];
        let call = callMarsAPIs(sonda);
        call.then((response) => {
            if(response.error){
                res.render('errore', {error: "Errore durante la chiamata API Mars Photos"});
            }
            else{
                let image;
                image = response.response;

                res.render('mars', 
                { url: image.img_src , sol: image.sol
                , date: image.earth_date, name:image.rover.name
                });
            }
        }).catch((error) => {
            console.error(error);
            res.render('errore', {error: "Errore durante la chiamata API Mars Photos"});
        })
    }
    else {
        res.render('errore', {error: "Errore durante la richiesta POST, nessuna sonda è stata passata"});
    }
    
})



/*************************************REST API **************************************/

/////////////////post (create)
app.post('/api/apod',async function(req,res){
    try{
        const date=req.body.date||(new Date).toISOString().slice(0,10);
        const comment=req.body.comment;
        const nasa_res=await axios.get("https://api.nasa.gov/planetary/apod?",{
            params: {
                api_key: nasa_api_key,
                date: date
            }
        });
        const nasa_data=nasa_res.data;
        const new_item=new Item({
            title: nasa_data.title,
            media_type: nasa_data.media_type,
            url: nasa_data.url,
            hdurl: nasa_data.hdurl,
            explanation: nasa_data.explanation,
            date: nasa_data.date,
            copyright: nasa_data.copyright,
            comment: comment
        });
        const result=await new_item.save();
        console.log('oleeee');
        res.send(result);
    }catch(err){
        res.send(err);
    }
});

app.post('/api/mars',function(req,res){
    //da implementare
});

///////////////get (read)
app.get('/api',async function(req,res){
    if(req.body.id){

        const id=req.body.id;
        const result=await Item
            .findById(id)
            //la riga successiva andrà decommentata e serevirà ad implementare la funzione multiutente
            //.find({user: "xxxxxx"})//questa modifica va effettuata ovunque, attenzione non è segnalata
            .select(req.body.select);
        res.send(result);
    }else{
        const result=await Item
            .find(req.body.find)
            .limit(parseInt(req.body.limit))
            .sort(req.body.sort)
            .select(req.body.select);

        res.send(result);
    }
});

//////////put (update)
app.put('/api',async function(req,res){
    const id=req.body.id;
    if(!id){
        res.send('you have to give the id parameter');
        return;
    }
    const item1=await Item.findById(id);
    if(!item1){
        res.send('No item found');
        return;
    }
    console.log('okkk');
    console.log(req.body.comment);
    item1.comment=req.body.comment;
    const result=await item1.save();
    //const setter={comment: req.body.comment};
    //const response=item1.set(setter);

    res.send(result);
});

app.put('/api/one',async function(req,res){
    const comment=req.body.comment;
    const result=await Item.updateOne(req.body.filter,{
        $set: {
            comment: comment
        }
    });
    res.send(result);
});

app.put('/api/many',async function(req,res){
    const comment=req.body.comment;
    const result=await Item.updateMany(req.body.filter,{
        $set: {
            comment: comment
        }
    });

    res.send(result);
});


///////////////delete (delete)
app.delete('/api',async function(req,res){
    const id=req.body.id;
    const result=await Item.findByIdAndDelete(id);
    res.send(result);
});

app.delete('/api/one',async function(req,res){
    const result=await Item.deleteOne(req.body.filter);

    res.send(result);
});

app.delete('/api/many',async function(req,res){
    const result=await Item.deleteMany(req.body.filter);

    res.send(result);
});

/************************Server inizialization************************/

mongoose.connect('mongodb://localhost:27888/',{
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then(function(){
            const port=8001;
            console.log('Connected to database');
            app.listen(port,function(){
                console.log('listening on port '+port);
            });
        })
        .catch(function(err){
            console.error('Error...',err);
        });
