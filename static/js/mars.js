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
        console.log('[WS] Ricevuto: '+msg.data);
    }
}

function save_img(){

    let email = $("#userEmail").val(); // EMAIL UTENTE LOGGATO
    let msg={
        cmd: 'save_mars',
        api_key: 'e'
    }
    
    //ws.send(JSON.stringify(msg));
}

function no_saveDB() {
    alert("Attenzione. Devi essere loggato per procedere");
}
