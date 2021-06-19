//modules import
const express=require('express');
const mongoose=require('mongoose');
const axios=require('axios');
const dotenv=require('dotenv');
const swaggerUi=require('swagger-ui-express');
const swaggerJsDoc=require('swagger-jsdoc');
const websocket=require('ws');
var path = require('path');
var request = require('request');
const cookieParser = require('cookie-parser');

const { geoCoding, starChart, positionBody , positions, bodies, moon} = require("./static/js/rest_calls");
const { callNasaImageAPI, callMarsAPIs, getBinary , uploadImage} = require("./functions/api-calls");
const { requireAuth, checkUser } = require('./middleware/authMiddleware');


//operazioni di configurazione dei moduli
const app=express();
dotenv.config();

//variabili globali
let access_token = '';
let binary_media = '';
const database_url=process.env.DATABASE_URL;
const port=8005;
const ws_port=8006;
const nasa_api_key=process.env.NASA_API_KEY;
const client_id = process.env.OAUTH_CLIENT;
const secret = process.env.OAUTH_SECRET;
const redirect_uri = process.env.REDIRECT_URL;

//setto ejs
app.use(express.static(__dirname + '/static'));
app.set('view engine', 'ejs');

// previene il caching di tutti gli utenti non loggati una volta che viene cambiata la pagina(si ricorda comunque dell'utente se rimane loggato), questo per evitare il problema del back button del browser dopo il logout (facendo back button dopo il logout rimaneva in cache la pagina dello user)
app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
  });




//these two methods are for read HTTP requests body
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());


//*******************SWAGGER **************/
const swaggerOptions={
    swaggerDefinition: {
        info:{
            title: 'MarsAdvisor API Documentation',
            description: 'Questa è la documentazione delle API REST offerte dal servizio MarsAdvisor.\n'+
            'Queste API consentono di salvare su un database file multimediali della NASA che vengono ritenuti interessanti aggiungendo un commento.\n'+
            'Un secondo tipo di servizi consente invece di accedere ad informazioni riguardanti i corpi celesti del Sistema Solare.\n'+
            'Per fornire una risposta il più accurata possibile queste API si avvalgono a loro volta di altri servizi REST, in particolare\n'+
            'degli endpoint AstronomyApi ( per i dati astronomici ) e Geoapify ( per la localizzazione della posizione dell\' utente.\n' +
            'Le API sono accedibili come qualsiasi sevizio REST tramite HTTP\n'+
            'E\' possibile testare le API direttamente da questa pagina web ',
            contact: {
                name: 'Matteo Villano',
            },
            servers: ['http://localhost:8005'],
        }
    },
    apis: ['docs.js']
}

const swaggerDocs=swaggerJsDoc(swaggerOptions);

app.use('/api-docs',swaggerUi.serve,swaggerUi.setup(swaggerDocs));



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
    comment: String,
    api_key: {
        type: String,
        required: true
    }
});

//model
const Item=mongoose.model('Item',itemSchema);

/****************************WEBSOCKET**********************************/
//inizializzo la websocket
const wss=new websocket.Server({port: ws_port});

//gestione ws
wss.on('connection',function(ws){
    //console.log('nouva websocket creata');
    ws.on('message',async function(msg){
        console.log('[WS] Recived: '+msg);
        let ws_cmd;
        try{
            ws_cmd=JSON.parse(msg);
        }catch(err){
            ws.send('Errore, non si può parsare la stringa inviata');
            return;
        }

        if(!isValidAK(ws_cmd.api_key)){
            ws.send('Invalid API_KEY, potresti non essere loggato');
            return;
        }
        const api_key=ws_cmd.api_key;

        if(!ws_cmd.cmd){
            ws.send('Errore, nessun comando trovato');
            return;
        }else if(ws_cmd.cmd=='save_apod'){
            try{
                const date=ws_cmd.date||(new Date).toISOString().slice(0,10);
                //ws.send('comando ricevuto... salvo l\'apod del '+date);
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
                    //comment: comment,
                    api_key: api_key
                });
                const result=await new_item.save();
                if(result._id){
                    ws.send('Oggetto salvato correttamente sul DB');
                }else{
                    ws.send('Errore, impossibile salvare l\'ogetto sul db');
                }
                //console.log(result);
            }catch(err){
                ws.send('Errore, qualcosa è andato storto...'+err);
            }
        }else{
            ws.send('Comando sconosciuto');
        }

    });

});




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
            if(req.query.status){
                res.render('index', { url: url , title:data.title, description:data.explanation , copyright:typeof(data.copyright) != 'undefined' ? data.copyright : ' - ', date: data.date, video: is_video, google_status: "ok"});
            }else{
                res.render('index', { url: url , title:data.title, description:data.explanation , copyright:typeof(data.copyright) != 'undefined' ? data.copyright : ' - ', date: data.date, video: is_video, google_status: ""});
            }
            
            binary_media = await getBinary(url); // TODO: gestire la conversione solo se richiesta dall'utente !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        }
    }).catch((error) => {
        console.error(error);
        res.render('errore', {error: "Errore durante la chiamata API Apod"});
    })

    
});

app.get('/1',function(req,res){
    res.send('<!DOCTYPE html><html><head><title>MarsAdvisor</title></head><body><h1>MarsAdvisor index</h1></br> <a href="/ws">ws</a></br><a href="/api-docs">documentazione</a></body></html>');
});

app.get('/ws', function(req,res){
    res.render('ws');
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
                res.render('index', { url: url , title:data.title, description:data.explanation , copyright:typeof(data.copyright) != 'undefined' ? data.copyright : ' - ', date: data.date, video: is_video,  google_status: ""});
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

app.post('/google_oauth', function (req, res){  //authorization request. 
    if(req.body.url_img){
        url_to_save = req.body.url_img;
        const google_params = new URLSearchParams({
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': 'https://www.googleapis.com/auth/photoslibrary.appendonly',  //solo salvataggio, niente lettura
            'access_type': 'online',
            'state': 'rdc_project',
            'prompt': "select_account consent"
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
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    });
    if (code) {
        try{
            const google_response = await axios.post('https://oauth2.googleapis.com/token', upload_params);
            if(google_response.status == 200){
                access_token = google_response.data.access_token;  //salvo token per accedere al servizio
                const upload = await uploadImage (binary_media, access_token);  //funzione che salva l'immagine su google photo dandogli l'immagine e un token di accesso di google oauth
                console.log(upload.status);
                res.redirect('/?status=ok');  // ridireziona sull'homepage senza aspettare che uploadImage venga terminata
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


function isValidAK(api_key){
    if(!api_key)
    return false;
    return true;
}

//******************INTERFACCIA REST*********************/

//***********GET******************/
app.get('/api/resources',async function(req,res){
    try{
        const api_key=req.query.api_key;
        if(isValidAK(api_key)){
            const id=req.query.id||req.body.id;
            let result;
            let sorter={};
            let selecter={};
            if(req.query.sort){
                sorter[req.query.sort]=1;
            }
            if(req.query.select){
                let temp=req.query.select.split(',');
                for(const i in temp){
                    selecter[temp[i]]=1
                }
            }
            if(id){
                result=await Item
                    .find({
                        api_key: api_key,
                        _id: id
                    })
                    .select(selecter);
            }else{
                
                result=await Item
                    .find({
                        api_key: api_key
                    })
                    .limit(parseInt(req.query.limit))
                    .sort(sorter)
                    .select(selecter);
            }
            
            //console.log(result);
            res.send(result);
        }else{
            res.status(400).send('API KEY assente o invalida');
        }
    }catch(err){
        res.status(400).send('Errore\n'+err);
    }
});


app.get('/api/resources/:id',async function(req,res){
    try{
        const api_key=req.query.api_key;
        if(isValidAK(api_key)){
            const id=req.params.id||req.query.id||req.body.id;
            let result;
            let sorter={};
            let selecter={};
            if(req.query.sort){
                sorter[req.query.sort]=1;
            }
            if(req.query.select){
                let temp=req.query.select.split(',');
                for(const i in temp){
                    selecter[temp[i]]=1
                }
            }
            if(id){
                result=await Item
                    .findById(id)
                    .find({
                        api_key: api_key
                    })
                    .select(selecter);
            }else{
                
                result=await Item
                    .find({
                        api_key: api_key
                    })
                    .limit(parseInt(req.query.limit))
                    .sort(sorter)
                    .select(selecter);
            }
            
            //console.log(result);
            res.send(result);
        }else{
            res.status(400).send('API KEY assente o invalida');
        }
    }catch(err){
        res.status(400).send('Errore\n'+err);
    }
});


//***************POST**********************/
app.post('/api/resources/apod',async function(req,res){
    const api_key=req.query.api_key||req.body.api_key;
    if(isValidAK(api_key)){
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
            //console.log(nasa_data);
            
            const new_item=new Item({
                title: nasa_data.title,
                media_type: nasa_data.media_type,
                url: nasa_data.url,
                hdurl: nasa_data.hdurl,
                explanation: nasa_data.explanation,
                date: nasa_data.date,
                copyright: nasa_data.copyright,
                comment: comment,
                api_key: api_key
            });
            const result=await new_item.save();
            //console.log('oleeee');
            res.send(result);
            
        }catch(err){
            //console.log(err);
            res.status(400).send('qualcosa è andato storto durante la procedura');
        }
    }else{
        res.status(400).send('API KEY assente o invalida');
    }
});



//*********************PUT***************************/
app.put('/api/resources',async function(req,res){
    const api_key=req.query.api_key||req.body.api_key;
    if(isValidAK(api_key)){

        const result=await Item.updateOne({
            _id: req.body.id,
            api_key: api_key
        },{
            comment: req.body.comment
        });
        res.send(result);
    }else{
        res.status(400).send('API KEY assente o invaida');
    }
});


 app.put('/api/resources/one',async function(req,res){
    const api_key=req.query.api_key||req.body.api_key;
    if(isValidAK(api_key)){
        const new_comment=req.body.new_comment;
        let filter=req.body;
        filter['new_comment']=undefined;
        filter['api_key']=api_key;
        filter['comment']=filter['old_comment'];
        filter['old_comment']=undefined;

        const result=await Item.updateOne(filter,{
            comment: new_comment
        });
        res.send(result);
    }else{
        res.status(400).send('API KEY assente o invaida');
    }
});


 app.put('/api/resources/many',async function(req,res){
    const api_key=req.query.api_key||req.body.api_key;
    if(isValidAK(api_key)){
        const new_comment=req.body.new_comment;
        let filter=req.body;
        filter['new_comment']=undefined;
        filter['api_key']=api_key;
        filter['comment']=filter['old_comment'];
        filter['old_comment']=undefined;

        const result=await Item.updateMany(filter,{
            comment: new_comment
        });
        res.send(result);
    }else{
        res.status(400).send('API KEY assente o invaida');
    }
});

//*********************DELETE***************************/
app.delete('/api/resources', async function(req,res){
    const api_key=req.query.api_key||req.body.api_key;
    if(isValidAK(api_key)){
        if(req.body.id){
            const result= await Item.deleteOne({
                _id: req.body.id,
                api_key: api_key
            });
            res.send(result);
        }else{
            res.status(400).send('Id assente');
        }
    }else{
        res.status(400).send('API KEY assente o invalido');
    }
});


 app.delete('/api/resources/one', async function(req,res){
    const api_key=req.query.api_key||req.body.api_key;
    if(isValidAK(api_key)){
        let filter=req.body;
        filter['api_key']=api_key;
        //console.log(filter);
        const result=await Item.deleteOne(filter);
        res.send(result);
    }else{
        res.status(400).send('API KEY assente o invalido');
    }
});


 app.delete('/api/resources/many', async function(req,res){
    const api_key=req.query.api_key||req.body.api_key;
    if(isValidAK(api_key)){
        let filter=req.body;
        filter['api_key']=api_key;
        //console.log(filter);
        const result=await Item.deleteMany(filter);
        res.send(result);
    }else{
        res.status(400).send('API KEY assente o invalido');
    }
});


app.get('/api/bodies', async function(req,res){
    const response = await bodies();
    console.log(response);
    if(!response.error){
        res.send(response.response);
    }
    else{
        res.status(400).send('Errore chiamata');
    }
});

app.get('/api/bodies/position_body', async function(req,res){
    const citta=req.query.city;
    const corpo = req.query.corpo;
    const data = req.query.data;
    const ora = req.query.ora;

    if(citta && corpo){
        const posizione = await geoCoding(citta);
        if(!posizione.error){
            const response = await positionBody(posizione.response.properties["lat"], posizione.response.properties["lat"], corpo, data, ora);
            if(!response.error){
                res.send(response.response['data']['table']['rows'][0]["cells"][0]);
            }
            else{
                "message" in response.response ? res.status(400).send(response.response["message"]) : res.status(400).send('Errore chiamata');
            }
        }
        else{
            res.status(400).send('Errore chiamata, città non valida');
        }
    }
    else{
        res.status(400).send('Parametri mancanti');
    }
});

app.post('/api/bodies/moon_phase', async function(req,res){
    const citta = req.body.city;
    const data = req.body.data;
    if(citta){
        const posizione = await geoCoding(citta);
        if(!posizione.error){
            const response = await moon(posizione.response.properties["lat"], posizione.response.properties["lat"], data);
            if(!response.error){
                res.send(response.response);
            }
            else{
                res.status(400).send('Errore chiamata');
            }
        }
        else{
            res.status(400).send('Errore chiamata, città non valida');
        }
    }else{
        res.status(400).send('Parametri mancanti');
    }
})



/************************Server inizialization************************/

mongoose.connect(database_url,{
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then(function(){
            console.log('Connected to database');
            app.listen(port,function(){
                console.log('listening on port '+port);
            });
        })
        .catch(function(err){
            console.error('Error...',err);
        });
