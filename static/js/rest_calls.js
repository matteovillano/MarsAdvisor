const axios = require('axios');
var btoa = require('btoa');
const dotenv=require('dotenv');

const { calcDate_Hour, check_date, check_time } = require("./utils");

dotenv.config();
const astronomy_id=process.env.ASTRONOMICAL_ID;
const astronomy_secret=process.env.ASTRONOMICAL_SECRET;
const geoapify=process.env.GEOAPIFY;

const hash = btoa(`${astronomy_id}:${astronomy_secret}`);


// corpi celesti tornati dall'api
async function bodies() {
    try{
        const response = await axios
            .get("https://api.astronomyapi.com/api/v2/bodies", {
                headers: {
                    'Authorization': `Basic ${hash}` 
                }
            });
        console.log(response);
        return {response: response.data.data.bodies, error: false}
    }catch(errors){
        console.error(errors);
        return {error: true}
    }
}
// tutte le posizioni, troppi dati !!!
async function positions(lat, long, date=null, time=null) {
    try{
        console.log(lat, long);
        const response = await axios.get("https://api.astronomyapi.com/api/v2/bodies/positions", {
            headers: {
                'Authorization': `Basic ${hash}` 
            },
            params: {
                latitude: lat,
                longitude: long,
                elevation: "0",
                from_date: "2021-05-15",
                to_date: "2021-05-16",
                time: "23:00:00"
    
            }
          });
          return {response: response.data, error: false}
    }catch(errors){
        console.error(errors);
        return {error: true}
    }
}

// dati del singolo corpo celeste
async function positionBody(lat, long, corpo, data=null, ora=null) {
    const timestamp = calcDate_Hour(); // se data e/o ora non validi ==> prendo data e ora attuali
    let date = (data == null || typeof(data) == "undifined" || !check_date(data)) ? timestamp.date : data;
    let time = (ora == null || typeof(ora) == "undifined" || !check_time(ora)) ? timestamp.time : ora;

    try{
        const response = await axios
            .get("https://api.astronomyapi.com/api/v2/bodies/positions/"+corpo, {
            headers: {
                'Authorization': `Basic ${hash}` 
            },
            params: {
                latitude: lat,
                longitude: long,
                elevation: "0",
                from_date: date,
                to_date: date,
                time: time
    
            }
        });
        return {response: response.data, error: false}
    }catch(errors){
        console.log("[+] ERROR", errors);
        return {error: true, response: errors.response.data}
    }
}

async function starChart(lat, long, data=null) {
    const timestamp = calcDate_Hour(); // se data non valida ==> prendo dsts attuale
    let date = (data == null || typeof(data) == "undifined" || !check_date(data)) ? timestamp.date : data;
    let body = {
        "style": "inverted",
        "observer": {
            "latitude": lat,
            "longitude": long,
            "date": date
        },
        "view": {
            "type": "constellation",
            "parameters": {
                "constellation": "ori" // 3 letter constellation id
            }
        }
    };
    try{
        const response = await axios
        .post("https://api.astronomyapi.com/api/v2/studio/star-chart", body, {
          headers: {
              'Authorization': `Basic ${hash}` 
          },
  
        });
        console.log(response);
        return {response: response, error: false}
    }catch(errors){
        console.log("[+] ERROR", errors);
        return {error: true, response: errors}
    }

}


async function moon(lat, long, data=null){
    const timestamp = calcDate_Hour(); // se data non valida ==> prendo dsts attuale
    let date = (data == null || typeof(data) == "undifined" || !check_date(data)) ? timestamp.date : data;
    const bodyM = {
        "format": "png",
        "style": {
            "moonStyle": "sketch",
            "backgroundStyle": "stars",
            "backgroundColor": "red",
            "headingColor": "white",
            "textColor": "red"
        },
        "observer": {
            "latitude": lat,
            "longitude": long,
            "date": date
        },
        "view": {
            "type": "portrait-simple"
        }
    };

    try{
        const response = await  axios
        .post("https://api.astronomyapi.com/api/v2/studio/moon-phase", bodyM, {
          headers: {
              'Authorization': `Basic ${hash}` 
          }
        });
        console.log(response);
        return {response: response.data.data, error: false}
    }catch(errors){
        console.log("[+] ERROR", errors);
        return {error: true, response: errors}
    }
}

async function geoCoding(citta){
    console.log(citta);
    try{
        const response = await axios
        .get("https://api.geoapify.com/v1/geocode/search?city="+citta+"&type=city&limit=1&apiKey=" + geoapify, {
        });
        if(response.data.type=="FeatureCollection"){
            if(response.data.features.length > 0){
                return {error: false, response: response.data.features[0]}
            }
            else return {error: true}
        }
        else{
          return {error: false, response:response.data}
        }

    }catch(errors){
        console.error(errors);
        return {error: true}
    }
}

module.exports = { geoCoding, starChart, positionBody , positions, bodies, moon};