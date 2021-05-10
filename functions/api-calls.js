var request = require('request');
const https = require('https');
const axios = require('axios');
require('dotenv').config();
const { response } = require('express');
const api_key = process.env.NASA_API_KEY;

async function callNasaImageAPI (date=null) {
    try{
        const response = date== null ?  await axios.get(`https://api.nasa.gov/planetary/apod?api_key=` + api_key) : await axios.get("https://api.nasa.gov/planetary/apod?", {
            params: {
                api_key: api_key,
                date: date,
                thumbs: true,  
            }
        });
        //console.log(response);
        return {error:false, res:response}
    }catch(error){
        console.error(error);
        return {error:true}
    }
}


async function callMarsAPIs(nome_sonda=null) {
    try {
        const response = await axios.get('https://api.nasa.gov/mars-photos/api/v1/rovers/' + (nome_sonda && (nome_sonda=='opportunity'||'curiosity'||'perseverance'||'spirit') ? nome_sonda : 'perseverance') + '/latest_photos?', {  //controllo se la sonda è selezionata
            params: {
                api_key: api_key
            }
        });
        const response2 = await axios.get('https://api.nasa.gov/insight_weather/?', {
            params: {
                feedtype: 'json', version:'1.0', api_key: api_key
            }
        });
        const key = Object.keys(response2.data)[0];
        //console.log(key);
        return {error:false, ob_0:response.data.latest_photos[0], ob_1:response2.data[key]};
    } catch (error) {
        console.error(error);
        return {error:true}
    }
}
async function uploadImage (image, access_token) {
    try {
        const upload_token_response = await axios.post("https://photoslibrary.googleapis.com/v1/uploads", image, {  //genero l'upload token
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-type': 'application/octet-stream',
                'X-Goog-Upload-Content-Type': 'image/jpeg',
                'X-Goog-Upload-Protocol': 'raw'
            }
        });
        const upload_token = upload_token_response.data;  //salvo l'upload token in upload_token
        const media_item = {
            'newMediaItems': [{
                'description': 'Prima Foto',
                'simpleMediaItem': {
                    'fileName': 'Foto Nasa',
                    'uploadToken': upload_token
                    }
            }]
        };
        const upload_completion_response = await axios.post('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', JSON.stringify(media_item), {
            headers: {
                'Content-type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            }
        });
        console.log(upload_completion_response.data.newMediaItemResults);
    } catch (error) {
        console.error(error);
        return {error:error};
    }
}
async function getBinary(url) {
    return await axios
      .get(url, {
        responseType: 'arraybuffer'
      })
      .then(response => {
            //console.log(response);
            const raw = Buffer.from(response.data, 'binary');
            //console.log('Raw', raw);
            return raw;
        }).catch(error => {
            console.error(error);
            return "";
        })
}
module.exports = { callNasaImageAPI, callMarsAPIs, getBinary , uploadImage};