const wa = require('@open-wa/wa-automate');
const { msgHandler } = require('./msgHandler');

wa.create({
    sessionId: 'wa-bot',
    headless: true,
    qrTimeout: 0,
    authTimeout: 0,
    restartOnCrash: start,
    cacheEnabled: false,
    useChrome: true,
    killProcessOnBrowserClose: true,
    throwErrorOnTosBlock: false,
    chromiumArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--aggressive-cache-discard',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disk-cache-size=0'
    ]
}).then(client => start(client));

function start(client) {
    client.onMessage(async message => {
        msgHandler(client, message);
    });

    client.onIncomingCall(async (call) => {
        await client.sendText(call.peerJid, 'BOT tidak bisa menerima panggilan');
    })
}