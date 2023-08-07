const { decryptMedia } = require('@open-wa/wa-decrypt');

const {
    existsSync,
    mkdirSync,
    createWriteStream,
    createReadStream,
    statSync,
    rmSync,
    writeFileSync,
    writeFile,
    readFileSync
} = require('fs');

const axios = require('axios');
const FormData = require('form-data');

const { replaceAll, validateUrl } = require('./item/util');
const { removeBg, removeBgColor } = require('./item/removeBg');
const { desc, onlyCommands } = require('./item/commands');
const { ytDownloader } = require('./item/ytDownloader');
const { toMp3 } = require('./item/mp3Converter');

const os = require('os');
const { monitorPrayerTimes, updatePrayerTimesByCity, checkWaktuSholat } = require('./item/waktuSholat');
let forwardOfNumber = []
let forwardOfMessageIds = []
let fromSender = null

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
        chatId,
        isMedia,
        isGroupMsg,
        mentionedJidList,
        msgDelete,
        type,
        chat,
        to
    } = message;

    let grupId;

    const sendText = (text) => {
        console.log(text);
        client.sendText(from, text)
    }
    
    if (msgDelete === true) {
        const file = readFileSync('./src/script/lib/msgRecover.json', 'utf-8');
        const msgRecovers = JSON.parse(file);

        console.log(msgRecovers);
        const date = new Date();
        message.time = `${date.getHours()}:${(date.getMinutes().toString().length === 1)? `0${date.getMinutes()}` : date.getMinutes()}`;
        message.date = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
        msgRecovers.unshift(message);
        writeFileSync('./src/script/lib/msgRecover.json', JSON.stringify(msgRecovers))
        return;
    } else {
        grupId = chatId.split('-')[1];
    }

    if (!`${body}`.includes("/") && (!`${caption}`.search("/") !== 0)) return;
    // if (!caption.search('/') && !validateUrl(caption)) return;

    const commands = caption || body;
    const command =  commands.toLowerCase().split(' ')[0];
    const arg = commands.split(' ')[1];
    const optionSize = commands.split(' ')[2]; // size video = 360p, 480p, 720p, 1080p / info video
    const optionInfo = commands.split(' ')[3]; // info video
    let dataMessage = undefined;

    if (quotedMsg) {
        dataMessage = quotedMsg;
        mimetype = dataMessage.mimetype;
        duration = dataMessage.duration;
    } else {
        dataMessage = message
    }
    let mediaData = undefined;
    let bufferBase64 = undefined;

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
                mediaData = await decryptMedia(dataMessage, useragentOverride);
                console.log(mediaData.toString('base64'));
                bufferBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`;
                await client.sendImageAsSticker(from, bufferBase64, {
                    author: '',
                    circle: false,
                    keepScale: true
                });
            }
            break;

        case onlyCommands['/stiker-nobg']:
            try {
                const outputFile = './media/image/noBg.png';
                mediaData = await decryptMedia(dataMessage, useragentOverride);
                bufferBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`;

                const dirPath = './media/image';

                if (!existsSync(dirPath)) {
                    mkdirSync(dirPath, {
                        recursive: true
                    });
                }

                const result = await removeBg(bufferBase64, outputFile);
                
                await client.sendImageAsSticker(from, `data:${mimetype};base64,${result.base64img}`, {
                    author: '',
                    circle: false,
                    keepScale: true
                });
                rmSync(outputFile);
            } catch (error) {
                console.error(error);
            }
            // nonaktif untuk menyimpan gambar yang di remove backgroundnya
            // await fs.writeFile(outputFile, result.base64img, (err) => {
            //     if(err) throw err
            //     console.log('File sudah disimpan');
            // });
            break;
            
        case onlyCommands['/removebg']: 
            try {
                const outputFile = './media/image/noBg.png';
                mediaData = await decryptMedia(dataMessage, useragentOverride);
                bufferBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`;
                const dirPath = './media/image';

                if (!existsSync(dirPath)) {
                    mkdirSync(dirPath, {
                        recursive: true
                    });
                }
                let resultRemoveBg = null
                if (typeof arg == 'string' && arg != ""){
                    resultRemoveBg = await removeBgColor({bufferBase64, bg_color: arg}, outputFile);

                } else {
                    resultRemoveBg = await removeBg(bufferBase64, outputFile);
                }
                bufferBase64 = `data:application/x-zip-compressed;base64,${resultRemoveBg.base64img}`;
                // console.log(bufferBase64);
                await client.sendFile(from, bufferBase64, 'foto-nobg.png', 'fotonya tuan' ,false, false, false, true);
                
                rmSync(outputFile);
            } catch (error) {
                console.log(error);
            }
            break;

        case onlyCommands['/stiker-gif']:
            if (mimetype === 'video/mp4' && duration <= 10) {
                mediaData = await decryptMedia(dataMessage, useragentOverride);
                try {
                    bufferBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`;
                    await client.sendMp4AsSticker(from, bufferBase64, {
                        crop: false
                    }, {
                        keepScale: true
                    });
                } catch (error) {
                    console.log(error.data);
                    await client.reply(from, 'File membutuhkan waktu terlalu lama, bisa diulangi kembali', id);
                }
            } else {
                if (mimetype !== 'video/mp4') {
                    await client.reply(from, 'oops ini bukan video', id)
                    return
                }
                await client.reply(from, 'oops file melebihi aturan durasi *10 detik*', id)
            }
            break;

        case onlyCommands['/topdf']:
            if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                mediaData = await decryptMedia(dataMessage, useragentOverride);
                const formData = new FormData();
                formData.append('testAja', JSON.stringify({
                    parts: [
                        {
                            file: "document"
                        }
                    ],
                    actions: [
                        {
                            type: "watermark",
                            image: "company-logo",
                            width: "50%"
                        },
                        {
                            type: "watermark",
                            text: "Property of PSPDFKit",
                            width: 150,
                            height: 20,
                            left: 0,
                            bottom: "100%"
                        }
                    ]
                }))

                formData.append('documents', createReadStream('./media/test.docx'));

                axios.post('https://api.pspdfkit.com/build', formData, {
                    headers: formData.getHeaders({
                        'Authorization': 'Bearer pdf_live_A2Gt5UEsQthBW4bmO6WDqSS0qVWkHu3lq1zRUWRPmhk'
                    }),
                    responseType: 'stream'
                }).then((response) => {
                    response.data.pipe(createWriteStream('result.pdf'))
                }).catch(async function(e) {
                    console.log(e);
                    const errorString = await streamToString(e.response.data);
                    console.log(errorString);
                })

                function streamToString(stream) {
                    const chunks = []
                    return new Promise((resolve, reject) => {
                        stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
                        stream.on("error", (err) => reject(err))
                        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
                    })
                }
                  
                // try {
                //     bufferBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`;
                //     const data = fetch('https://api.pspdfkit.com/build', {
                        
                //     })
                // } catch (error) {
                    
                // }
            } else {
                console.log('selain docx');
            }
            await client.sendText(from, 'Masa pengembangan (beta)');
            break;

        case onlyCommands['/yt']:
            console.log('start');
            const ytData = {};
            ytData.arg = arg;
            ytData.optionInfo = optionInfo;
            ytData.optionSize = optionSize  ;
            ytData.from = from;

            if (!validateUrl(arg) && arg !== 'info') return await client.sendText(from, 'oops sepertinya anda typo gunakan /yt info atau /yt <link>')

            try {
                let filePath = await ytDownloader(ytData, createWriteStream);

                console.log(`filePath  : ${filePath}`);
                if (filePath !== undefined && !filePath.includes('.mp4') && !filePath.includes('.webm')) {
                    await client.sendText(from, filePath);
                    return;
                }

                const fileName = filePath.split(';')[0];
                filePath = filePath.split(';')[1];
                
                await client.sendFile(from, filePath, fileName, fileName);
                rmSync(filePath);

            } catch (error) {
                console.log(error);
                if (error.statusCode === 410 || error === 410) {
                    await client.sendText(from, 'Maaf error, sepertinya bot terkena cekal izin Youtube', id);

                } else if (error.includes("!")) {
                    await client.sendText(from, `${error}`, id);

                }
            }
            break;

        case onlyCommands['/fb']:
            console.log('hello');
            // try {
            //     const response = await Axios({
            //         method: 'GET',
            //         url: 'https://unsplash.com/photos/hE0nmTffKtM/download?ixid=MnwxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNjM0NzM2Njg1&force=true',
            //         responseType: 'stream'
            //     })
            //     console.log(response); 
            // } catch (error) {
            //     console.log(error);
            // }
            break;

        case onlyCommands['/kick']:
            if (isGroupMsg) {
                if (mentionedJidList.length <= 1) {
                    await client.removeParticipant(from, mentionedJidList[0])
                } else {
                    mentionedJidList.forEach(async (participant) => {
                        await client.removeParticipant(from, participant)
                    });
                }
            }
            break;

        case onlyCommands['/mp3']:
            if (arg === 'info') {
                const mp3Convert = toMp3(undefined, undefined, arg);
                await client.sendText(from, mp3Convert);
                return
            }

            if (mimetype !== 'video/mp4') {
                await client.sendText(from, 'oops... file bukan mp4')
                return
            }
            const filePath = `./media/tmp/video/videoTmp.${mimetype.split('/')[1]}`;
            let fileOut = `./media/tmp/audio/audio.mp3`;

            if (arg !== undefined && arg !== 'info') {
                fileOut = `./media/tmp/audio/${arg}.mp3`;
            }

            try {
                mediaData = await decryptMedia(dataMessage, useragentOverride);
                writeFileSync(filePath, mediaData);
                await toMp3(filePath, fileOut, arg);

                const fileName = fileOut.split('/')[4];
                await client.sendFile(from, fileOut, fileName, fileName);
                rmSync(fileOut);
                rmSync(filePath);
            } catch (error) {
                console.log(error);

                if (error.search("Progress:")) await client.sendText(from, error)
            }
            break;

        case onlyCommands['/show']:
            const readMsgRecover = readFileSync('./src/script/lib/msgRecover.json', 'utf-8');
            const msgRecover = JSON.parse(readMsgRecover)
            let msgRecoverUser;
            if (mentionedJidList[0] === undefined && arg === undefined) {
                msgRecoverUser = msgRecover.find(user => user.from.split('-')[1] === grupId)

            } else {
                msgRecoverUser = msgRecover.filter(user => {
                    const userGrupId = user.from.split('-')[1];
                    const userId = user.from.split('-')[0];

                    console.log(user.time);
                    if (userGrupId === grupId && arg === user.time) {
                        // get by time example : 13:03 
                        return user
                    }
                })
            }

            let msgTmpSendText = ""
            if (Array.isArray(msgRecoverUser)) {
                msgRecoverUser.forEach(async (msg) => {
                    if (msg.type === "chat") {
                        msgTmpSendText += `Pesan: ${msg.body}\n\`\`\`Waktu: ${msg.time}\`\`\`\n================\n`;
                        await client.reply(from, msgTmpSendText, id);

                    } else if (msg.type === "image") {
                        mediaData = await decryptMedia(msg, useragentOverride);
                        bufferBase64 = `data:image/png;base64,${mediaData.toString('base64')}`;
                        await client.sendFile(from, bufferBase64, 'gambarnya tuan', msg.caption);

                    }  else if (msg.type === "video") {
                        mediaData = await decryptMedia(msg, useragentOverride);
                        bufferBase64 = `data:video/mp4;base64,${mediaData.toString('base64')}`;
                        await client.sendFile(from, bufferBase64, 'videonya tuan', msg.caption);
                    }
                })
            } else {
                if (msgRecoverUser.type === "chat") {
                    msgTmpSendText += `Pesan: ${msgRecoverUser.body}\n\`\`\`Waktu: ${msgRecoverUser.time}\`\`\`\n================\n`;
                    await client.reply(from, msgTmpSendText, id);
                    // await client.sendTextWithMentions(from, `@${msgRecoverUser.from.split('-')[0]}`)

                } else if (msgRecoverUser.type === "image") {
                    mediaData = await decryptMedia(msgRecoverUser, useragentOverride);
                    bufferBase64 = `data:image/png;base64,${mediaData.toString('base64')}`;
                    await client.sendFile(from, bufferBase64, 'gambarnya tuan', msgRecoverUser.caption);

                } else if (msgRecoverUser.type === "video") {
                    mediaData = await decryptMedia(msgRecoverUser, useragentOverride);
                    bufferBase64 = `data:video/mp4;base64,${mediaData.toString('base64')}`;
                    await client.sendFile(from, bufferBase64, 'videonya tuan', msgRecoverUser.caption);
                }
            }
            break;

        case onlyCommands['/sholat']:
            if (arg == "update") {
                await updatePrayerTimesByCity()
                return;
            }

            if (arg == "start") {
                await client.reply(from, 'Pengingat sholat sudah dimulai..', id)
                setInterval(async () => {
                    monitorPrayerTimes(sendText)
                }, 6000);
                return;
            }
            await client.reply(from, checkWaktuSholat(), id);
            break;

        case onlyCommands['/help']:
            const allCommands = Object.keys(desc).map((command, i) => `*${command}* : ${Object.values(desc)[i]}\n`);
            let strCommand = '======= Perintah untuk bot =======\n' + '=============================\n'
            strCommand += replaceAll(allCommands.toString(), ',', '')
            await client.sendText(from, strCommand);
            break;
    }
}


module.exports = {
    msgHandler
};