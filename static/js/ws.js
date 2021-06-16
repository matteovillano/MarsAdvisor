
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


function foo(){
    let data=document.getElementById('apod-day').value;
    let msg={
        cmd: 'save_apod',
        api_key: 'd'
    }
    if(data==""){
        ws.send(JSON.stringify(msg));
    }else{
        msg['date']=data;
        ws.send(JSON.stringify(msg));
    }
    
}
