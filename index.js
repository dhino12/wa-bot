const {
    Client
} = require('whatsapp-web.js');
const {
    msgHandler
} = require('./src/script/msgHandler');
const qrCode = require('qrcode');
const socketIO = require('socket.io');
const fs = require('fs');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = process.env.PORT || 8000;

const SESSION_FILE_PATH = './wa-session.json';
let sessionCfg;

if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
        ],

    },
    session: sessionCfg
});

app.get('/', (req, res) => {
    res.sendFile('./src/views/index.html', {
        root: __dirname
    });
})

client.on(`message`, message => {
    msgHandler(client, message);
})

client.initialize();

// Socket IO
io.on('connection', (socket) => {
    socket.emit('message', 'Connecting ...')

    client.on('authenticated', (session) => {
        console.log('authenticated', 'Whatsapp is authenticated!');
        console.log('message', 'Whatsapp is authenticated!');
        console.log('AUTHENTICATED', session);
        sessionCfg = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err);
            }
        });
    });

    client.on('qr', qr => {
        console.log(`QR Received`);
        qrCode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('message', 'QR Code Received');
        })
    })

    client.on('ready', () => {
        console.log(`Client is Ready`);
        socket.emit('message', 'Whatsapp Ready');
        socket.emit('ready', 'Whatsapp Ready');
    })
})

server.listen(port, () => {
    console.log('wa-bot running on : localhost:' + port);
})