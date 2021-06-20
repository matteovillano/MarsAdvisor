$(document).ready(function() {
    let ws;
    let today = new Date();
    today.setDate(today.getDate()); // data di ieri, c'è il fuso orario di mezzo con le immagini nasa
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    
    today = yyyy + '-' + mm + '-' + dd;
     
    let data_pick = document.getElementById('apod-day'); // date picker
    let btn = document.getElementById('send_date'); // bottone invio data
    btn.disabled = true; // button disabilitato all'inizio

    data_pick.max = today;  // setto max date = ieri

    init();
});

function button_status(){// chiamata sull' onchange del datepicker per abilitare il bottone di invio richiesta
    let data_pick = document.getElementById('apod-day');
    let btn = document.getElementById('send_date');
    btn.disabled = true;
    if(!data_pick.value){
        btn.disabled = true;
    }   
    else{btn.disabled = false;}
}

function no_save() { // chiamata in caso di risorsa video senza una immagine thumbnail da mostrare
    alert("Impossibile salvare la risorsa su Google Foto");
}

function no_saveDB() {
    alert("Attenzione. Devi essere loggato per procedere");
}

function init(){
    if(!'WebSocket' in window){
        alert('protocollo websocket non supportato, alcune funzioni potrebbero non funzionare');
    }

    ws=new WebSocket('ws://localhost:8006');

    ws.onopen=function(){
        console.log('Websocket aperta');
    };

    ws.onmessage=function(msg){
        console.log('[WS] Ricevuto: '+msg.data);
    }
}

function save_apod(){
    let date=document.getElementById('apod-day').value;
    let email = $("#userEmail").val(); // EMAIL UTENTE LOGGATO
    let msg={
        cmd: 'save_apod',
        api_key: 'e'
    }

    if(date==""){
        ws.send(JSON.stringify(msg));
    }else{
        msg['date']=date;
        ws.send(JSON.stringify(msg));
    }
}