$(document).ready(function() {
    init();
});

let ws;
function init(){
    if(!'WebSocket' in window){
        alert('protocollo websocket non supportato, alcune funzioni potrebbero non funzionare');
    }

    ws=new WebSocket('ws://localhost:8006');

    ws.onopen=function(){
        console.log('Websocket aperta');
    };

    ws.onmessage=function(msg){
        mess = JSON.parse(msg.data);
        console.log(mess);
        if(mess["status"] == "ok"){
            isFavourite = true;
        }
        alert('[WS] Ricevuto: '+mess["text"]);
    }
}

function save_img(){

    let api_key = key; // KEY UTENTE LOGGATO
    let sonda = $("#sonda").val(); // NOME SONDA SELEZIONATA
    let msg={
        cmd: 'save_mars',
        api_key: api_key,
        rover: sonda
    }

    if(isFavourite==true){
        alert("Risorsa già presente tra i preferiti");
    }
    else{
        ws.send(JSON.stringify(msg));
    }
}

function no_saveDB() {
    alert("Attenzione. Devi essere loggato per procedere");
}
