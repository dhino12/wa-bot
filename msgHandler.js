const {
    decryptMedia
} = require('@open-wa/wa-decrypt');

const {
    removeBackgroundFromImageBase64,
    RemoveBgResult
} = require('remove.bg');

const gm = require('gm');
const ffmpeg = require('ffmpeg');

const {
    writeFileSync,
    readFileSync,
    writeFile,
    readFile,
    existsSync,
    mkdirSync,
    createWriteStream
} = require('fs');
const {
    exec,
    spawn
} = require('child_process');

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

    switch (command) {
        case '/hi':
            await client.sendText(from, '👋 Hello!');
            break;

        case '/wa-ver':
            const waver = await client.getWAVersion();
            await client.sendText(from, `versi whatsapp anda: ${waver.toString()}`);
            break;

        case '/stiker' || '/sticker':
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
                await client.sendStickerfromUrl(from, argURL)
            }
            break;

        case '/stiker-nobg':
            const mediaData = await decryptMedia(message, useragentOverride);
            const base64img = `data:${mimetype};base64,${mediaData.toString('base64')}`;
            const outputFile = './media/image/noBg.png';
            const dirPath = './media/image';

            if (!existsSync(dirPath)) {
                mkdirSync(dirPath, {
                    recursive: true
                });
            }

            const result = await removeBackgroundFromImageBase64({
                base64img,
                apiKey: 'QM3HY6Cy3hGQwbxC9sQhQHwX',
                size: 'regular',
                type: 'product',
                outputFile
            });
            await client.sendImageAsSticker(from, `data:${mimetype};base64,${result.base64img}`);

            // nonaktif untuk menyimpan gambar yang di remove backgroundnya
            // await fs.writeFile(outputFile, result.base64img, (err) => {
            //     if(err) throw err
            //     console.log('File sudah disimpan');
            // });
            break;

        case '/stiker-gif':
            console.log(mimetype);
            const md = await decryptMedia(message, useragentOverride);
            const pathTmpVideo = `./media/tmp/video/animated.${mimetype.split('/')[1]}`;
            const pathTmpGif = './media/tmp/video/animation.gif'
            await writeFile(pathTmpVideo, md, () => {});

            try {
                const process = new ffmpeg('./media/tmp/video/animated.mp4');
                process.then(function (video) {

                    video
                        .setVideoSize('640x?', true, true)
                        .save('./media/tmp/video/animation.gif', function (error, file) {
                            if (!error)
                                console.log('Video file: ' + file);
                            else console.log('ERROR : ' + error);
                        });
                    
                }, function (err) {
                    console.log('Error: ' + err);
                });
                // const Input = await process();
                // const videoSize = await Input.setVideoSize('640x?', true, true).save;
                // const save = 
            } catch (error) {
                console.log(`ERROR CODE :  ${error.code}`);
                console.log(`ERROR MSG : ${error.msg}`);
            }

            // const gif = readFileSync(pathTmpGif, {encoding: 'base64'});
            // const imgBase64 = `data:image/gif;base64,${gif.toString('base64')}`;
            // await client.sendImageAsSticker(from, imgBase64);

            break;
    }
}

function validateUrl(value) {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

module.exports = {
    msgHandler
};