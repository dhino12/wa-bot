const { create, ev } = require('@open-wa/wa-automate');
const { msgHandler } = require('./msgHandler');
const fs = require('fs');
const app = require('express')();


ev.on('qr.**', async (qrcode, sessionId) => {
    const bufferImg = Buffer.from(qrcode.replace('data:image/png;base64', ''), 'base64');
    fs.writeFileSync(`qr_code${sessionId? '_' + sessionId:''}.png`, bufferImg);
})

create({
    sessionId: 'wa-bot',
    headless: true,
    qrTimeout: 0,
    authTimeout: 0,
    restartOnCrash: start,
    cacheEnabled: false,
    useChrome: true,
    killProcessOnBrowserClose: true,
    throwErrorOnTosBlock: false,
    popup: 3012,
    defaultViewport: null,
}).then(client => {
    app.listen((PORT) => console.log(`Listening on PORT ${PORT}`))
    start(client)

})
.catch(error => console.error(error));

function start(client) {
    client.onMessage(async message => {
        msgHandler(client, message);
    });

    client.onIncomingCall(async (call) => {
        await client.sendText(call.peerJid, 'BOT tidak bisa menerima panggilan');
    })
}