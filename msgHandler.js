const {
    decryptMedia
} = require('@open-wa/wa-decrypt');

const msgHandler = async (client, message) => {
    const {
        from,
        body,
        quotedMsg,
        caption,
        mimetype,
        id
    } = message;

    const commands = body || caption;
    const command = commands.toLowerCase();

    console.log(command);

    switch (command) {
        case '/hi': 
            await client.sendText(from, '👋 Hello!');
            break;
        
        case '/wa-ver':
            const waver = await client.getWAVersion();
            await client.sendText(from, `versi whatsapp anda: ${waver.toString()}`);
            break;

        case '/stiker' || '/sticker':
            console.log(message.isMedia);
            console.log("========================== ////////////////////////// ");
            console.log(quotedMsg);
            const useragentOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';
            const mediaData = await decryptMedia(quotedMsg, useragentOverride);
            const imgBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`;
            await client.sendImageAsSticker(from, imgBase64);
            break;
    }
}

module.exports = {
    msgHandler
};