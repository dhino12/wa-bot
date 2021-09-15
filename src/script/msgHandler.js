const {
    removeBackgroundFromImageBase64,
    RemoveBgResult
} = require('remove.bg');
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
const { MessageMedia } = require('whatsapp-web.js');
const ffmpeg = require('ffmpeg');

const useragentOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';

const msgHandler = async (client, message) => {
    const {
        from,
        body,
        hasQuotedMsg,
    } = message;

    const command = body.toLowerCase().split(' ')[0];
    const argURL = body.split(' ')[1];

    switch (command) {
        case '/hi':
            await client.sendMessage(from, '👋 Hello!');
            break;

        case '/wa-ver':
            const waver = await client.getWAVersion();
            await client.sendText(from, `versi whatsapp anda: ${waver.toString()}`);
            break;

        case '/stiker' || '/sticker':
            if (!hasQuotedMsg && !argURL) {
                // if message it a image
                const media = await message.downloadMedia();
                const stickerMedia = new MessageMedia(media.mimetype, media.data);
                client.sendMessage(message.from, stickerMedia, {sendMediaAsSticker: true});
            }

            if (hasQuotedMsg) {
                // if reply message
                const getReplyMessage = await message.getQuotedMessage();
                const media = await getReplyMessage.downloadMedia();
                const stickerMedia = new MessageMedia(media.mimetype, media.data);
                client.sendMessage(message.from, stickerMedia, {sendMediaAsSticker: true});
            }

            if (validateUrl(argURL)) {
                const media = await MessageMedia.fromUrl(argURL)
                client.sendMessage(from, media, { sendMediaAsSticker: true });
            }
            break;

        case '/stiker-nobg':
            const mediaData = await message.downloadMedia();
            const base64img = `data:${mediaData.mimetype};base64,${mediaData.data.toString('base64')}`;
            const outputFile = './media/image/noBg.png';
            const dirPath = './media/image';

            if (!existsSync(dirPath)) {
                mkdirSync(dirPath, { recursive: true });
            }

            const result = await removeBackgroundFromImageBase64({
                base64img,
                apiKey: 'QM3HY6Cy3hGQwbxC9sQhQHwX',
                size: 'regular',
                type: 'product',
                outputFile
            });
            const stickerMedia = new MessageMedia(mediaData.mimetype, result.base64img);
            await client.sendMessage(from, stickerMedia, {sendMediaAsSticker: true});
            // nonaktif untuk menyimpan gambar yang di remove backgroundnya
            // await fs.writeFile(outputFile, result.base64img, (err) => {
            //     if(err) throw err
            //     console.log('File sudah disimpan');
            // });
            break;

        // case '/stiker-gif':
        //     console.log(message);
        //     const media = await message.downloadMedia();
        //     // const md = await decryptMedia(message, useragentOverride);
        //     const pathTmpVideo = `./media/tmp/video/animated.${media.mimetype.split('/')[1]}`;
        //     const pathTmpGif = './media/gif/animation.gif';
        //     await writeFile(pathTmpVideo, media.data, () => {});

        //     try {
        //         const Process = await new ffmpeg('./media/tmp/video/animated.mp4');
        //         const videoSize = await Process.setVideoSize('640x?', true, true);
        //         await videoSize.save('./media/gif/animation.gif', async (error, file) => {
        //             if (!error) {
        //                 console.log('Video file: ' + file);
        //             } else console.log('ERROR : ' + error);
        //         });

        //     } catch (error) {
        //         console.log(`ERROR CODE :  ${error.code}`);
        //         console.log(`ERROR MSG : ${error.msg}`);
        //     }

        //     const gif = await readFileSync(pathTmpGif, {
        //         encoding: "base64"
        //     });
        //     const stickerGifMedia = new MessageMedia('image/gif', gif.toString('base64'));
            
        //     await client.sendMessage(from, mediaVideo, {sendVideoAsGif: true})
        //     break;
    }
}

function validateUrl(value) {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

module.exports = {
    msgHandler
};