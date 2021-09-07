const wa = require('@open-wa/wa-automate');
const { msgHandler } = require('./msgHandler');

wa.create().then(client => start(client));

function start(client) {
    client.onMessage(async message => {
        msgHandler(client, message);
    });
}