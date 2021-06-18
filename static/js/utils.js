function calcDate_Hour(){
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const day = yyyy + '-' + mm + '-' + dd;

    const hour = today.getHours() < 10 ? "0"+ today.getHours() : today.getHours();
    const minutes = today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes();
    const seconds = today.getSeconds() < 10 ? "0" + today.getSeconds() : today.getSeconds();
    const time = hour + ":" + minutes + ":" + seconds;

    return {date: day, time: time}
}

function check_date(date){
    if(date.length == 10){
        let regex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
        return regex.test(date);
    }
    else return false
    
}

function check_time(time){
    let regex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])$/;
    return regex.test(time)
}

module.exports = { calcDate_Hour, check_date, check_time };