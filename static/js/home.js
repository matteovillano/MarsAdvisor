$(document).ready(function() {
    console.log( "ready!" );
    let today = new Date();
    today.setDate(today.getDate()); // data di ieri, c'è il fuso orario di mezzo con le immagini nasa
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    
    today = yyyy + '-' + mm + '-' + dd;
    console.log(today);   
     
    let data_pick = document.getElementById('apod-day'); // date picker
    let btn = document.getElementById('send_date'); // bottone invio data
    btn.disabled = true; // button disabilitato all'inizio

    console.log(data_pick);
    data_pick.max = today;  // setto max date = ieri
    console.log(data_pick.value);
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