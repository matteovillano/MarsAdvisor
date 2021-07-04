$(document).ready(function() {
    let ws;
    init();
});

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
            console.log(mess["comment_id"]);
            const textarea = mess["comment_id"];
            const comment = mess["comment"];
            console.log(textarea, comment, $("#"+textarea).text());
            $("#"+textarea).text(comment);
        }
        alert('[WS] Ricevuto: '+mess["text"]);
    }
}

function save_comment(obj){
    console.log(obj);
    let id = $(obj).data("id-item");
    let text_id = "t"+$(obj).data("id-msg").substring(1);
    let comment = $("#"+text_id).val();

    console.log(id, text_id, comment);
    let api_key = key; // key UTENTE LOGGATO
    let msg={
        cmd: 'save_comment',
        api_key: api_key,
        comment: comment,
        id_item: id,
        id_text: text_id
    }

    ws.send(JSON.stringify(msg));
}

function reset(obj){
    console.log(obj);
    let modal = $(obj).data("id-msg");
    console.log(modal);

    $("#"+modal).find("form").get(0).reset();

}