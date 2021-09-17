async function getBatteryStatus(info) {
    const battery = await info.getBatteryStatus();
    console.log(info.wid);
    return `Battery Status : ${battery.battery}% \nPhone Charge : ${battery.plugged} `
}

async function getStatusPhone(info){
    const battery = await info.getBatteryStatus();
    console.log(info);
    return `Battery Status : ${battery.battery}%\n` +
        `Phone Charge : ${battery.plugged}\n` +
        `Phone : ${info.phone.device_manufacturer}\n` +
        `OS : ${info.phone.os_build_number}\n` + 
        `Platform : ${info.platform}\n` + 
        `wa_version : ${info.phone.wa_version}`
}

module.exports = { getBatteryStatus, getStatusPhone }