$(document).ready(function() {
    init();
});

function init(){
    if(!'WebSocket' in window){
        alert('protocollo websocket non supportato, alcune funzioni potrebbero non funzionare');
    }

    let ws=new WebSocket('ws://localhost:8006');

    ws.onopen=function(){
        console.log('Websocket aperta');
    };

    ws.onmessage=function(msg){
        console.log('[WS] Ricevuto: '+msg.data);
    }
}

function save_img(){

    let msg={
        cmd: 'save_mars',
        api_key: 'e'
    }
    
    ws.send(JSON.stringify(msg));
}
