
//modules import
const express=require('express');
const mongoose=require('mongoose');
const axios=require('axios');
const dotenv=require('dotenv');

const app=express();
dotenv.config();


//import thing from dotenv
const nasa_api_key=process.env.NASA_API_KEY;

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

mongoose.connect('mongodb://localhost/my_prog',{
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
