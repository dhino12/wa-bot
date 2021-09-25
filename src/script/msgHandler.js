const {
    decryptMedia
} = require('@open-wa/wa-decrypt');

const {
    removeBackgroundFromImageBase64,
    RemoveBgResult
} = require('remove.bg');

const {
    existsSync,
    mkdirSync,
    createWriteStream,
    rmSync
} = require('fs');

const ytdl = require('ytdl-core');

const {
    replaceAll,
    validateUrl
} = require('./item/util');

const {
    exec,
    spawn
} = require('child_process');

const {
    desc,
    onlyCommands
} = require('./item/commands');

const useragentOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';

const msgHandler = async (client, message) => {
    const {
        from,
        body,
        quotedMsg,
        caption,
        mimetype,
        duration,
        id,
        isMedia
    } = message;


    const commands = caption || body;
    const command = commands.toLowerCase().split(' ')[0];
    const arg = commands.split(' ')[1];
    const optionFormat = commands.split(' ')[2]; // format video = mp4, webm
    const optionSize = commands.split(' ')[3]; // size vide = 360p, 480p, 720p, 1080p,

    switch (command) {
        case onlyCommands['/hi']:
            await client.sendText(from, '👋 Hello!');
            break;

        case onlyCommands['/wa-ver']:
            const waver = await client.getWAVersion();
            await client.sendText(from, `versi whatsapp anda: ${waver.toString()}`);
            break;

        case onlyCommands['/stiker']:
            if (quotedMsg === '' || isMedia) {
                const mediaData = await decryptMedia(message, useragentOverride);
                const imgBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`;
                await client.sendImageAsSticker(from, imgBase64, {
                    author: '',
                    circle: false,
                    keepScale: true
                });
            }

            if (quotedMsg) {
                const mediaData = await decryptMedia(quotedMsg, useragentOverride);
                const imgBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`;
                console.log(quotedMsg);
                await client.sendImageAsSticker(from, imgBase64)
            }

            if (validateUrl(arg)) {
                await client.sendStickerfromUrl(from, argURL)
            }
            break;

        case onlyCommands['/stiker-nobg']:
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
            await client.sendImageAsSticker(from, `data:${mimetype};base64,${result.base64img}`, {
                author: '',
                circle: false,
                keepScale: true
            });

            // nonaktif untuk menyimpan gambar yang di remove backgroundnya
            // await fs.writeFile(outputFile, result.base64img, (err) => {
            //     if(err) throw err
            //     console.log('File sudah disimpan');
            // });
            break;

        case onlyCommands['/stiker-gif']:
            if (mimetype === 'video/mp4' && duration <= 10) {
                const md = await decryptMedia(message, useragentOverride);
                try {
                    const fileBuffer = `data:${mimetype};base64,${md.toString('base64')}`;
                    const result = await client.sendMp4AsSticker(from, fileBuffer, {
                        crop: false
                    }, {
                        keepScale: true
                    });
                    if (result) {
                        console.log(message);
                    }
                } catch (error) {
                    console.log(error.data);
                    client.reply(message.to, 'File membutuhkan waktu terlalu lama, bisa diulangi kembali', message.id);
                }
            } else {}
            break;

        case onlyCommands['/yt']:
            console.log('start');
            if (validateUrl(arg)) {
                // ytDownloader(arg)
            }
        break;

        case onlyCommands['/help']:
            const allCommands = Object.keys(desc).map((command, i) => `*${command}* : ${Object.values(desc)[i]}\n`);
            let strCommand = '======= Perintah untuk bot =======\n' + '=============================\n'
            strCommand += replaceAll(allCommands.toString(), ',', '')
            await client.sendText(from, strCommand);
            break; 
    }
}

async function ytDownloader(link, quality = 720) {
    const info = await ytdl.getBasicInfo(link);
    console.log(info);
    const higher = info.formats.filter(item => item.height === quality && item.audioQuality !== undefined)[0];
    const filePath = `./media/tmp/video/yt.${higher.mimeType.split((';'))[0].split('/')[1]}`
    ytdl(link, {
            quality: higher.itag
        })
        .pipe(createWriteStream(filePath))
        .on('end', async () => {
            // await client.sendFile(from, '');
            // rmSync(filePath);
        })
}

module.exports = {
    msgHandler
};