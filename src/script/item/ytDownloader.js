const e = require('cors');
const ytdl = require('ytdl-core');
const { validateUrl } = require('./util');

let startTime = 0;
let percentDownload = 0;
let titleVideo = ''
const cookieYt = 'VISITOR_INFO1_LIVE=FkS34CAN-g4; PREF=tz=Asia.Jakarta; SID=DQgAK-HUXaWObShc5RQNLjrlrmPveLTtUnpUGf7H_9hfJdJxiiMFOOo283LMo3mxSiI04A.; __Secure-1PSID=DQgAK-HUXaWObShc5RQNLjrlrmPveLTtUnpUGf7H_9hfJdJxo7QMSKtzyzHbsQ-pMfewEg.; __Secure-3PSID=DQgAK-HUXaWObShc5RQNLjrlrmPveLTtUnpUGf7H_9hfJdJxdOXlLaDtY3cYkG6nsYs5AQ.; HSID=APBHwFdgNhCheii6G; SSID=AdlpyLgzrxdyXYsx9; APISID=g23aN6MX5hRJAjbV/AU9DtCZHzvGMVOhd5; SAPISID=rCCP-uFlRgQW-YYx/A6NVTKMqj2KE0seQx; __Secure-1PAPISID=rCCP-uFlRgQW-YYx/A6NVTKMqj2KE0seQx; __Secure-3PAPISID=rCCP-uFlRgQW-YYx/A6NVTKMqj2KE0seQx; YSC=xjnGWV4N1Mo; LOGIN_INFO=AFmmF2swRQIhAOjVWTFaLWShYTxsvlDUWNq4pf84c0Rs-6PI_oXM_AldAiA4jAY2hZO5nQ9IlLuDTkjEIpplTDgaMdmjThM33NJ8DQ:QUQ3MjNmd1R1N1JmMEdXSHJnTWgxX3dWeXJZY2drNy0ydEZlNnRsbHBDeExEc3IyTW5Lel9GZHJfUk9Wd3RoU1FScDJHZ0J6ZnhUcjZBajUzQjY0V3M5VVQ1dktsSXRucmhZSENiM1VNcHNBNjc3VTIxVEN2TEJ0ODFHOWkxMzUtUEVVTmw4eG53OUtVNU1NWFZZMWxnTTF5bVdGMElLcm13; CONSISTENCY=AGDxDePx3Var27Sg4YTvzJbKAa966-QjINzDzXVX0A0x2zo59hjNXZ6PRclx0pZYn3cALAVcmFfBvan7HTu1qH2CCh_VlEQdeffgwk3_QU3Fa-s40mYd22dBmVW9ETYtJJ-8XW4Ru5XDEeNRSTKZY6lj; SIDCC=AJi4QfHDityjOoi1XakSbq_vHRzAd33SEjcnJL0YU1A1bGhx3L0EiZcmdtfZ74E6vccBuZKMBA; __Secure-3PSIDCC=AJi4QfF6x8nyPR8WpbIW5jt7aTqA-rcpU7Gr_2j1Dd7KsFsDxAtC70PRp9tPNDgdmPXvWoHEdw'

async function ytInfo (arg, optionInfo, optionSize) {
    if (arg === 'info' && titleVideo !== '') {
        // jika perintahnya /yt info
        return `Video : ${titleVideo}\nProses : *${percentDownload}%* downloaded`;
    } 
     

    if (!validateUrl(arg)) return
       
    const { videoDetails, formats } = await ytdl.getInfo(arg,  {
        requestOptions: {
            header: {
                cookie: cookieYt
            }
        }
    }).catch((e) => {
        return e
    });

    if (videoDetails === undefined) throw 410 
    
    if( optionInfo === 'info' || optionSize === 'info') {
        // jika perintahnya /yt <link> info
        return `List Size Video\n============== ${infoVideoYt(formats)}`;
    }

    if (videoDetails.lengthSeconds >= 1800) {
        return `Video tidak boleh lebih dari 30menit,\nsedangkan video anda\n` +
        `*${Math.floor(videoDetails.lengthSeconds / 60)}:${Math.floor(videoDetails.lengthSeconds % 60)}*`;
    }
    if ( startTime > 1 ) {
        // jika ingin memulai download baru tetapi proses sebelumnya belum selesai
        return `${percentDownload}% downloaded` + `\nproses download video *${titleVideo}* masih berlangsung, harap 1 per 1`;
    }

    const bestQualityVideo = searchVideoBestQuality(formats);
    const higher = bestQualityVideo[bestQualityVideo.length - 1]

    if (higher === undefined) {
        startTime = 0;
        return `Video youtube dengan size ${optionSize} tidak tersedia `;
    } 
    higher.title = videoDetails.title;
    titleVideo = videoDetails.title

    return higher
}

async function ytDownloader(dataObj, createWriteStream) {
    const { arg, optionInfo, optionSize } = dataObj;

    ++startTime;
    const higher = await ytInfo(arg, optionInfo, optionSize);

    if (typeof higher === 'string' && higher.startsWith('List')) {
        return higher; // output = List Size Video\n======= formatVideo

    }  
    if (typeof higher === 'string' && !higher.startsWith('List') ) {
        startTime = 0
        throw higher; // output = error video;
    }
    
    const filePath = `./media/tmp/video/tmpVideo.${higher.mimeType.split(';')[0].split('/')[1]}`

    return new Promise((resolve, reject) => {
        ytdl(arg,  {
            quality: higher.itag
        }) 
        .on('progress', (chunkLength, downloaded, total) => {
            percentDownload = ((downloaded / total) * 100).toFixed(2);
        })
        .pipe(createWriteStream(filePath))
        .on('error', (e) => {
            console.log(e);
            startTime = 0;
            reject(e);
        })
        .on('finish', async () => {
            resolve(`${higher.title};${filePath}`);
            startTime = 0;
        })    
    })
}

function infoVideoYt(formats) { 
    return formats.map(video => { 
        if(video.audioQuality !== undefined && video.qualityLabel !== null) {
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

function searchVideoBestQuality (formats) {
    return formats.filter(video => video.qualityLabel !== null && video.audioQuality !== undefined)
}

module.exports = { ytDownloader }