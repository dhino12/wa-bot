const { create, ev } = require('@open-wa/wa-automate');
const { msgHandler } = require('./src/script/msgHandler');

const socketIo = require('socket.io');
const express = require('express');
const http = require('http');
const path = require('path');

const publicPath = path.join(__dirname, './src/views');
const app = express();
const server = http.createServer(app)
const io = socketIo(server);
const port = process.env.PORT || 8000;
process.env.TZ = "Asia/Jakarta";

// app.use(express.static(publicPath))
app.get('/', (req, res) => {
    // res.sendFile('/src/views/index.html', {
    //     root: __dirname
    // })
    create({
        headless: true,
        useChrome: true,
        qrTimeout: 0,
        authTimeout: 0,
        chromiumArgs: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
        ],
        multiDevice: true
    }).then(client => start(client))
    .catch(error => console.log(error));
    
    function start(client) {
        client.onMessage(async message => {
            await msgHandler(client, message);
        })
    
        client.onMessageDeleted(async (message) => {
            message.msgDelete = true
            console.log(message);
            await msgHandler(client, message)
        })
    }
    
    ev.on('qr.**', async (qr) => {
        //base64 encoded qr code image
        console.log(`QR Code Received`);
        console.log(qr);
        
        res.json({
            img: qr
        })
    });
    
    ev.on('STARTUP.**', async (data, sessionId) => {
        if(data==='SUCCESS') {
            console.log(`${sessionId} wa-bot started!`)
        }
    })
})

io.on('connection', (socket) => {
    // ev.on('Authenticating', )
    socket.emit('message', 'Connecting ...')

    
})

server.listen(port, () => {
    console.log('App Running on port : '+ port);
})