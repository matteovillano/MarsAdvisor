if(!'WebSocket' in window){
    alert('protocollo websocket non supportato, alcune funzioni potrebbero non funzionare');
}

let ws=new WebSocket('ws://localhost:8006');

ws.onopen=function(){
    //alert('Websocket aperta');
};

ws.onmessage=function(msg){
    alert('[WS] Ricevuto: '+msg.data);
}

function save_img(){

    let msg={
        cmd: 'save_mars',
        api_key: 'e'
    }
    
    ws.send(JSON.stringify(msg));
}

/*
var ws;
    
function init(){
    if(!'WebSocket' in window){
        alert('Protocollo WebSocket non supportato dal tuo Browser!\nAlcune funzioni potrebbero non funzionare..');
    }
                
    ws=new WebSocket('ws://localhost:8006');
    
    ws.onopen=function(){
        console.log('WebSocket aperta');
    }
    
    ws.onmessage=function(message){
        console.log('recived a message');
        console.log(message.data);
    };
}
    
function save_img(){
    console.log('sent a request!');
    ws.send('save_img');
}
*/