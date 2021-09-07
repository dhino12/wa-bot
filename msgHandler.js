const {
    decryptMedia
} = require('@open-wa/wa-decrypt');

const useragentOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';

const msgHandler = async (client, message) => {
    const {
        from,
        body,
        quotedMsg,
        caption,
        mimetype,
        id,
        isMedia
    } = message;


    const commands = caption || body;
    const command = commands.toLowerCase().split(' ')[0];
    const argURL = commands.split(' ')[1];
    console.log(`url is : ${validateUrl(argURL)}`);

    switch (command) {
        case '/hi':
            await client.sendText(from, '👋 Hello!');
            break;

        case '/wa-ver':
            const waver = await client.getWAVersion();
            await client.sendText(from, `versi whatsapp anda: ${waver.toString()}`);
            break;

        case '/stiker':
            if (quotedMsg === '' || isMedia) {
                const mediaData = await decryptMedia(message, useragentOverride);
                const imgBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`;
                await client.sendImageAsSticker(from, imgBase64);
            }

            if (quotedMsg) {
                const mediaData = await decryptMedia(quotedMsg, useragentOverride);
                const imgBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`;
                await client.sendImageAsSticker(from, imgBase64)
            }

            if (validateUrl(argURL)) {
                await client.sendStickerfromUrl(from, argURL);
            } 

            console.log("========================== ////////////////////////// ");

            break;
    }
}


function validateUrl(value) {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

module.exports = {
    msgHandler
};