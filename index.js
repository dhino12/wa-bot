const { Client } = require('whatsapp-web.js');
const { sendStickerFromUrl, sendImageAsSticker } = require('./src/script/item/send-sticker');
const { msgHandler } = require('./src/script/msgHandler');
const qrCode = require('qrcode-terminal');
const fs = require('fs');
const app = require('express')();

const SESSION_FILE_PATH = './wa-session.json';
let sessionCfg;

if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });

client.on('qr', qr => {
    qrCode.generate(qr);
    console.log(`QR Received`, qr);
})

client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});

client.on('ready', () => {
    console.log(`Client is Ready`);
})

client.on(`message`, message => {
    msgHandler(client, message);
})

client.initialize(); 