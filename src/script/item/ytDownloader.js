const e = require('cors');
const ytdl = require('ytdl-core');
const { validateUrl } = require('./util');

let startTime = 0;
let percentDownload = 0;
let titleVideo = ''
const cookieYt = 'LOGIN_INFO=AFmmF2swRQIhAOa9HZz5PJq5rsUxqrNFP5Pzf9hLFn8QXqbAD8qseHcFAiB1UkLFZHiOQMjLpehU-WSX8QP0_fXJzSxDGt2BNg84sg:QUQ3MjNmeHVDWVUxWXZzUHRuOGNIdnlMRWhjbnA1alpCRHJRem9ZY1FicEJxUzJlTnZTbEJ1VTF4RTlFOV92MXZBbVhtc0daRlI0dng2LVdSZU1Ra0ZNYTg0cnJkb3l2SjBKWWl0RmItbGNQRWk1M0g5Wm1Dd3FzaWJ6ZDEwdV9GZUlPX1FMdG81S2F4bTBVcFJPRTIzTlZGRWdOaFpYV2dB; VISITOR_INFO1_LIVE=hY4uyJRyYuk; PREF=tz=Asia.Jakarta; SID=CggAK0u6Zh7Oxr8-bSZlv47tgql7k_Q3JHjTHpVHekrRspzwWuUTqcdOPSSQfPK3CU2gbw.; __Secure-1PSID=CggAK0u6Zh7Oxr8-bSZlv47tgql7k_Q3JHjTHpVHekrRspzwLh37J1fWdhm_-oaWGsBLpw.; __Secure-3PSID=CggAK0u6Zh7Oxr8-bSZlv47tgql7k_Q3JHjTHpVHekrRspzwQhZxBddeN9wLnu9jsqXYeA.; HSID=Ay-Ql0STi6eDw2MGm; SSID=AumIMA47UOMwA1NaF; APISID=YPxrSF99A5p2kI8c/AgPobtWPScIpWNn9H; SAPISID=Oaz5GNwhoy5uF6ei/AWvaMRlNVDQxR7rch; __Secure-1PAPISID=Oaz5GNwhoy5uF6ei/AWvaMRlNVDQxR7rch; __Secure-3PAPISID=Oaz5GNwhoy5uF6ei/AWvaMRlNVDQxR7rch; YSC=nEdeRoTG6HA; SIDCC=AJi4QfEiKPPhRusxD1TrjPvB94heHq7FRSXCvwTAKYnIqOsFOlZG8KeJM5eMnP3hkEaj0mUKkg; __Secure-3PSIDCC=AJi4QfFhdrbvwUAoxREMqKqR-ZDuDMUE6nH8kR3K3o9m7nXOTmR2Vxdfj_qTEUsnqaulESi-IA'

async function ytInfo(arg, optionInfo, optionSize) {

    if (arg === 'info' && titleVideo !== '') {
        // jika perintahnya /yt info
        return `Video : ${titleVideo}\nProses : *${percentDownload}%* downloaded !`;
    }

    if (!validateUrl(arg)) return

    const {
        videoDetails,
        formats
    } = await ytdl.getInfo(arg, {
        requestOptions: {
            header: {
                cookie: cookieYt
            }
        }
    }).catch((e) => {
        startTime = 0;
        titleVideo = ''
        return e;
    });

    if (videoDetails === undefined) {
        startTime = 0
        throw 410
    }

    if (optionInfo === 'info' || optionSize === 'info') {
        // jika perintahnya /yt <link> info
        return `List Size Video\n============== ${infoVideoYt(formats)}`;
    }

    if (videoDetails.lengthSeconds >= 1800) {
        return `Video tidak boleh lebih dari 30menit,\nsedangkan video anda\n` +
            `*${Math.floor(videoDetails.lengthSeconds / 60)}:${Math.floor(videoDetails.lengthSeconds % 60)}* !`;
    }
    if (startTime > 1) {
        // jika ingin memulai download baru tetapi proses sebelumnya belum selesai
        return `${percentDownload}% downloaded` + `\nproses download video *${titleVideo}* masih berlangsung, harap 1 per 1 !`;
    }

    const bestQualityVideo = searchVideoBestQuality(formats);
    const higher = bestQualityVideo[bestQualityVideo.length - 1]

    if (higher === undefined) {
        startTime = 0;
        titleVideo = ''
        return `Video youtube dengan size ${optionSize} tidak tersedia !`;
    }
    higher.title = videoDetails.title;
    titleVideo = videoDetails.title

    return higher
}

async function ytDownloader(dataObj, createWriteStream) {
    const {
        arg,
        optionInfo,
        optionSize
    } = dataObj;

    ++startTime;
    const higher = await ytInfo(arg, optionInfo, optionSize);

    if (typeof higher === 'string' && higher.startsWith('List')) {
        return higher; // output = List Size Video\n======= formatVideo

    }
    if (typeof higher === 'string' && !higher.startsWith('List')) {
        startTime = 0
        throw higher; // output = error video;
    }

    const filePath = `./media/tmp/video/tmpVideo.${higher.mimeType.split(';')[0].split('/')[1]}`

    return new Promise((resolve, reject) => {
        ytdl(arg, {
                quality: higher.itag
            })
            .on('progress', (chunkLength, downloaded, total) => {
                percentDownload = ((downloaded / total) * 100).toFixed(2);
            })
            .pipe(createWriteStream(filePath))
            .on('error', (e) => {
                console.log(e);
                startTime = 0;
                titleVideo = ''
                reject(e);
            })
            .on('finish', async () => {
                resolve(`${higher.title};${filePath}`);
                startTime = 0;
                titleVideo = '';
            })
    })
}

function infoVideoYt(formats) {
    return formats.map(video => {
        if (video.audioQuality !== undefined && video.qualityLabel !== null) {
            return `\n${video.qualityLabel}`
        } else {
            if (video.qualityLabel !== null && video.audioSampleRate === undefined) {
                return `\n${video.qualityLabel} hanya video`
            } else if (video.qualityLabel === null && video.audioSampleRate !== null) {
                return `\n${video.audioSampleRate / 100}/kbps hanya audio`
            }
        }
    });
}

function searchVideoBestQuality(formats) {
    return formats.filter(video => video.qualityLabel !== null && video.audioQuality !== undefined)
}

module.exports = {
    ytDownloader
}