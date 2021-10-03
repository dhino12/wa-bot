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
    validateUrl,
    overcomeENOENT
} = require('./item/util');

const {
    exec,
    spawn
} = require('child_process');

const {
    desc,
    onlyCommands
} = require('./item/commands');

const os = require('os');
const e = require('cors');

let startTime = 0;

const useragentOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';

const msgHandler = async (client, message) => {
    let {
        from,
        body,
        quotedMsg,
        caption,
        mimetype,
        duration,
        id,
        isMedia,
        isGroupMsg,
        mentionedJidList
    } = message;

    // if (!caption.search('/') && !validateUrl(caption)) return;

    const commands = caption || body;
    const command = commands.toLowerCase().split(' ')[0];
    const arg = commands.split(' ')[1];
    const optionSize = commands.split(' ')[2]; // size video = 360p, 480p, 720p, 1080p / info video
    const optionInfo = commands.split(' ')[3]; // info video
    let dataMessage = undefined;
    
    // if (allCommands.filter(command => command != body || command != caption)) return;
    
    if (quotedMsg) {
        dataMessage = quotedMsg;
        mimetype = dataMessage.mimetype;
        duration = dataMessage.duration;
    } else {
        dataMessage = message
    }

    switch (command) {
        case onlyCommands['/hi']:
            await client.sendText(from, '👋 Hello!');
            console.log(os.platform());
            break;

        case onlyCommands['/wa-ver']:
            const waver = await client.getWAVersion();
            await client.sendText(from, `versi whatsapp anda: ${waver.toString()}`);
            break;

        case onlyCommands['/stiker']:
            if (validateUrl(arg)) {
                await client.sendStickerfromUrl(from, arg, {
                    author: '',
                    circle: false,
                    keepScale: true
                })
            } else {
                const mediaData = await decryptMedia(dataMessage, useragentOverride);
                const imgBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`;
                await client.sendImageAsSticker(from, imgBase64, {
                    author: '',
                    circle: false,
                    keepScale: true
                });
            }

            break;

        case onlyCommands['/stiker-nobg']:
            const mediaData = await decryptMedia(dataMessage, useragentOverride);
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
            rmSync(outputFile);
            // nonaktif untuk menyimpan gambar yang di remove backgroundnya
            // await fs.writeFile(outputFile, result.base64img, (err) => {
            //     if(err) throw err
            //     console.log('File sudah disimpan');
            // });
            break;

        case onlyCommands['/stiker-gif']:
            if (mimetype === 'video/mp4' && duration <= 10) {
                const md = await decryptMedia(dataMessage, useragentOverride);
                try {
                    const fileBuffer = `data:${mimetype};base64,${md.toString('base64')}`;
                    const result = await client.sendMp4AsSticker(from, fileBuffer, {
                        crop: false
                    }, {
                        keepScale: true
                    });
                } catch (error) {
                    console.log(error.data);
                    await client.reply(from, 'File membutuhkan waktu terlalu lama, bisa diulangi kembali', id);
                }
            } 
            break;

        case onlyCommands['/yt']:
            console.log('start');

            if (validateUrl(arg)) {
                try { 
                    const { videoDetails, formats } = await ytdl.getBasicInfo(arg);
                    ++startTime;
                    if (videoDetails.lengthSeconds <= 1800) {
                        if ( startTime > 1 ) {
                            await client.reply(from, 'proses download masih berlangsung, harap 1 per 1', id);
                            return;
                        }
                        if( optionInfo === 'info' || optionSize === 'info') {
                            const videoSize = `List Size Video\n============== ${infoVideoYt(formats)}`; 
                            await client.sendText(from, videoSize.toString());
                            startTime = 0;
                            return;
                        }
                        const higher = formats.filter(item => item.qualityLabel === `${
                            (optionSize !== undefined)? optionSize : searchVideoBestQuality(formats)[0].qualityLabel
                        }` && item.audioQuality !== undefined)[0];

                        if (higher === undefined) {
                            await client.sendText(
                                from, 
                                `Video youtube dengan size ${optionSize} tidak tersedia, cek dengan /yt <link> info`
                                );
                            return;
                        }
                        const filePath = `./media/tmp/video/${overcomeENOENT(videoDetails.title)}.${higher.mimeType.split(';')[0].split('/')[1]}`
                        ytdl(arg)
                            .pipe(createWriteStream(filePath))
                            .on('error', (e) => {
                                console.log(e);
                                startTime = 0;
                            })
                            .on('finish', async () => {
                                const fileName = filePath.split('/')[4];
                                await client.sendFile(from, filePath, fileName, fileName);
                                rmSync(filePath);
                                startTime = 0;
                            })
                    } else {
                        await client.reply(
                            from, 
                            'Video tidak boleh lebih dari 30menit,\n' + 
                            `sedangkan video anda ${Math.floor(videoDetails.lengthSeconds / 60)}:${Math.floor(videoDetails.lengthSeconds % 60)}`,
                            id
                        )
                    }
                } catch (error) {
                    console.log(error);
                }
            }
            break;

        case onlyCommands['/kick']:
            if (isGroupMsg) {
                console.log(message);
                if (mentionedJidList.length <= 1) {
                    await client.removeParticipant(from, mentionedJidList[0])
                } else {
                    mentionedJidList.forEach(async (participant) => {
                        await client.removeParticipant(from, participant)
                    });
                }
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

function infoVideoYt(formats) {
    return formats.map(video => { 
        if(video.audioQuality !== undefined && video.qualityLabel !== undefined) {
            return `\n${video.qualityLabel}`
        } else {
            if (video.qualityLabel !== undefined) {
                return `\n${video.qualityLabel} hanya video`
            } else {
                return `\n${video.audioSampleRate / 100}/kbps hanya audio`
            }
        }
    });
}

function searchVideoBestQuality (formats) {
    return formats.filter(video => video.qualityLabel !== undefined && video.audioQuality !== undefined)
}

module.exports = {
    msgHandler
};