const { create, ev } = require('@open-wa/wa-automate');
const { msgHandler } = require('./src/script/msgHandler');
const fs = require('fs');
const express = require('express');
const server = express();

const PORT = process.env.PORT || 8000

server.use(express.json())

ev.on('qr.**', async (qrcode, sessionId) => {
    const bufferImg = Buffer.from(qrcode.replace('data:image/png;base64', ''), 'base64');
    fs.writeFileSync(`qr_code${sessionId? '_' + sessionId:''}.png`, bufferImg);
})

server.use('/', (req, res) => {
    res.status(200).json({
        status: true,
        message: 'Hello World'
    })
})

create({
    sessionId: 'wa-bot',
    headless: false,
    qrTimeout: 0,
    authTimeout: 0,
    restartOnCrash: start,
    cacheEnabled: false,
    useChrome: true,
    killProcessOnBrowserClose: true,
    throwErrorOnTosBlock: false,
    popup: process.env.PORT || 8000,
    defaultViewport: null,
}).then(client => {
    app.listen((PORT) => console.log(`Listening on PORT ${PORT}`))
    start(client)

})
.catch(error => console.error(error));

function start(client) {
    app.listen((PORT) => console.log(`Running on PORT ${PORT}`));

    client.onMessage(async message => {
        msgHandler(client, message);
    });

    client.onIncomingCall(async (call) => {
        await client.sendText(call.peerJid, 'BOT tidak bisa menerima panggilan');
    })
}