const {
    removeBackgroundFromImageBase64,
    RemoveBgResult
} = require('remove.bg');
const {
    getBatteryStatus,
    getStatusPhone
} = require('./item/batteryStatus')
const {
    writeFileSync,
    readFileSync,
    writeFile,
    readFile,
    existsSync,
    mkdirSync,
    createWriteStream,
    rmSync
} = require('fs');
const {
    exec,
    spawn
} = require('child_process');
const {
    Util,
    MessageMedia
} = require('whatsapp-web.js');
const ffmpeg = require('ffmpeg');

const {
    commands,
    onlyCommands
} = require('../../commands');


const msgHandler = async (client, message) => {
    const {
        from,
        body,
        hasQuotedMsg,
    } = message;

    const commandFromClient = body.toLowerCase().split(' ')[0];
    const argURL = body.split(' ')[1];

    switch (commandFromClient) {
        case onlyCommands['/hi']:
            await client.sendMessage(from, '👋 Hello!');
            break;

        case onlyCommands['/wa-ver']:
            const waver = await client.getWWebVersion();
            await client.sendMessage(from, `versi whatsapp anda: ${waver.toString()}`);
            break;

        case onlyCommands['/stiker']:
            const chat = await message.getChat();
            if (!hasQuotedMsg && !argURL) {
                // if message it a image
                const media = await message.downloadMedia();
                const stickerMedia = new MessageMedia(media.mimetype, media.data);
                await chat.sendMessage(stickerMedia, {
                    sendMediaAsSticker: true,
                    stickerAuthor: 'wa-bot',
                    stickerName: 'meme'
                })

            }

            if (hasQuotedMsg) {
                // if reply message
                const getReplyMessage = await message.getQuotedMessage();
                const mediaReply = await getReplyMessage.downloadMedia();
                const stickerMedia = new MessageMedia(mediaReply.mimetype, mediaReply.data);
                chat.sendMessage(message.from, stickerMedia, {
                    sendMediaAsSticker: true
                });
            }

            if (validateUrl(argURL)) {
                const media = await MessageMedia.fromUrl(argURL)
                chat.sendMessage(from, media, {
                    sendMediaAsSticker: true
                });
            }
            break;

        case onlyCommands['/stiker-nobg']:
            const mediaData = await message.downloadMedia();
            const base64img = `data:${mediaData.mimetype};base64,${mediaData.data.toString('base64')}`;
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

            const stickerMedia = new MessageMedia(mediaData.mimetype, result.base64img);
            await client.sendMessage(from, stickerMedia, {
                sendMediaAsSticker: true
            });
            // nonaktif untuk menyimpan gambar yang di remove backgroundnya
            // await fs.writeFile(outputFile, result.base64img, (err) => {
            //     if(err) throw err
            //     console.log('File sudah disimpan');
            // });
            break;

        case onlyCommands['/stiker-gif']:

            try {
                const mediaDataGif = await message.downloadMedia();
                const chats = await message.getChat();
                console.log(mediaDataGif.mimetype, "\n");
                const pathTmpVideo = `./media/tmp/video/animated.mp4`;
                const pathTempWebp = './media/tmp/gif/animation.webp';
                writeFileSync(pathTmpVideo, mediaDataGif.data, 'base64');

                const Process = await new ffmpeg(pathTmpVideo);

                if (Process.metadata.duration.seconds >= 11) {
                    console.log(Process.metadata.duration.seconds);
                    chats.sendMessage('Maaf video tidak boleh lebih dari 10 detik');
                    rmSync(pathTmpVideo);
                    return;
                }
                const videoSize = Process.setVideoSize('300x300', true, true);
                videoSize.save(pathTempWebp, async (error, file) => {
                    if (!error) {
                        console.log('Video file: ' + file);
                        const gif = readFileSync(file, { encoding: "base64" });
                        const messageMediaData = new MessageMedia('image/webp', gif);
                        await chats.sendMessage(messageMediaData, {
                            sendMediaAsSticker: true
                        });
                        
                        rmSync(pathTempWebp);
                        rmSync(pathTmpVideo);
                    } else{
                        console.log('ERROR : ' + error)
                    };
                });
            } catch (error) {
                console.log(`ERROR CODE :  ${error.code}`);
                console.log(`ERROR MSG : ${error.msg}`);
                console.log(error);
            }
            break;

        case onlyCommands['/help']:
            const allCommands = Object.keys(commands).map((command, i) => `*${command}* : ${Object.values(commands)[i]}\n`);
            
            let strCommand = '======= Perintah untuk bot =======\n' + '=============================\n'
            strCommand += replaceAll(allCommands.toString(), ',', '')

            client.sendMessage(from, strCommand);
            break;

        
    }
}

function validateUrl(value) {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

module.exports = {
    msgHandler
};