const api_key = "9ae8deefe98841fc87e193b2737e4988";

$( document ).ready(function() {
    $.ajax({
        method: "GET",
        url: " http://localhost:8005/api/bodies",
        async: true,
      })
        .done(function( msg ) {   
            if(!msg.error){
                let value;
                for(i=0; i<msg.length;i++){
                    value = msg[i];
                    $('#bodies').append(`<option value="${value}">
                        ${value}
                    </option>`);
                }
            } 
            else{
                alert("Errore Bodies");
            }        
    });
});

function dataApi(){
    const location = $("#citta").val();

    if(location.trim() == ""){
        alert("Inserisci una località");
    }
    else{
        $("#result1").show();
        $("#result2").hide();
    
        $("#loader1").show();
        $("#iperror").hide();
        $("#astronomyIp").hide();
        const url = "https://api.ipgeolocation.io/astronomy?apiKey="+api_key+"&location="+location;
        var data_ip = $.ajax( url )
        .done(function() {
            console.log( "success1" );
            console.log(data_ip.responseJSON);
            try{
                const response = data_ip.responseJSON;
                const table = $("#astronomyIp");
               
                $("#date").text(response.date + "  " + response.current_time)
                table.find("#alt_luna").text(response.moon_altitude);
                table.find("#az_luna").text(response.moon_azimuth);
                table.find("#dist_luna").text(response.moon_distance);
                table.find("#alt_sole").text(response.sun_altitude);
                table.find("#az_sole").text(response.sun_azimuth);
                table.find("#dist_sole").text(response.sun_distance);
                table.find("#noon").text(response.solar_noon);
                table.find("#sunrise").text(response.sunrise);
                table.find("#sunset").text(response.sunset);
                $("#loader1").hide();
                $("#iperror").hide();
                $("#astronomyIp").show();
                
            }catch(errors){
                
                $("#loader1").hide();
                $("#iperror").show();
                $("#astronomyIp").hide();
            }
        })
        .fail(function() {
            $("#loader1").hide();
            $("#iperror").show();
            $("#astronomyIp").hide();
        });
    }
}

function geoAPI(){
    const city_ip = $.ajax( "https://api.ipgeolocation.io/ipgeo?apiKey="+api_key )
    .done(function() {
        console.log( "success" );
        console.log(city_ip.responseJSON.city);
        
        const location = city_ip.responseJSON.city;
        $("#citta").val(location);
    })
    .fail(function() {
        alert("errore tracciamento ip")
    });
};

function position(){
    try{

        const citta = $("#citta").val();
        const corpo = $("#bodies").val();
        if(citta.trim() != "" && corpo != ""){
            $("#result1").hide();
            $("#result2").show();
        
            $("#loader2").show();
            $("#positionerror").hide();
            $("#positions").hide();
            const response = $.ajax({
                method: "GET",
                url: "http://localhost:8005/api/bodies/position_body?city="+citta+"&corpo="+corpo,
                async: true,
            })
                .done(function( msg ) {   
                    console.log(msg);
                    const table = $("#positions");
                    $("#result2").find("#date2").text(msg.date);
                    table.find("#distanza").find("#km").text("Dalla Terra (km) :  " + msg.distance.fromEarth.km);
                    table.find("#distanza").find("#au").text("Unità Astronomiche :  " + msg.distance.fromEarth.au);
                    const elongazione = msg.extraInfo.elongation;
                    const magnitudine = msg.extraInfo.magnitude;
                    elongazione == null ? table.find("#elongazione").text(" - ") : table.find("#elongazione").text(elongazione);
                    magnitudine == null ? table.find("#magnitudine").text(" - ") : table.find("#magnitudine").text(magnitudine); 

                    $("#loader2").hide();
                    $("#positionerror").hide();
                    $("#positions").show();

            }).fail(function() {
                $("#loader2").hide();
                $("#positionerror").show();
                $("#positions").hide();
            });
        }
        else{
            alert("Dati non validi")
        }
    }catch(errors){
        $("#result1").hide();
        $("#result2").show();

        $("#loader2").hide();
        $("#positionerror").show();
        $("#positions").hide();
    }

}