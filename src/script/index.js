const { Client, Chat } = require('whatsapp-web.js');
const { Client } = require('./index');
// const { msgHandler } = require('./msgHandler');
const qrCode = require('qrcode-terminal');
const fs = require('fs');
const app = require('express')();
const fs = require('fs');

const SESSION_FILE_PATH = './wa-session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });

client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});

client.on('qr', qr => {
    qrCode.generate(qr);
    console.log(`QR Received`, qr);
})

client.on('ready', () => {
    console.log(`Client is Ready`);
})

client.on(`message`, message => {
    console.log(message);
    if(message.body === 'hello'){
        message.reply('Hai');
    }
})

client.initialize();