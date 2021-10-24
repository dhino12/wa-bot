const e = require('cors');
const ytdl = require('ytdl-core');
const { validateUrl } = require('./util');

let startTime = 0;
let percentDownload = 0;
let titleVideo = ''
const cookieYt = 'APISID=QWfHd-O8geWNDkdm/A9VNZxBwqUK590wlN;LOGIN_INFO=AFmmF2swRQIhAOw0s1O3RlWdqv-3wanIGqzofrEjhhrFNSBccHojd954AiAhX51JopUhUBaybUgSLKW2teR1sQ_Uoh2J3_ZFPpMcvA:QUQ3MjNmeFIxbS1vUVpkQnlVenlWRHdIN01OMWstNTJ4LXU4TzJxTUh1Nzg2Wkp4Z0pRYXZCMXZqV3lRSmE2UUtmbWJEalpHMzhEd2ZIc0JLSXBGU0l5NU9pOGJrYkZnLVRKbFBhblo5Mkw0cjlza3NDR1ZvZ2ppMDdENlNwdF9UME8td0lLNy1DRDBYazZXbVdTLUlxaVM2NVJ1MXZnWXhR;PREF=tz=Asia.Jakarta;SAPISID=rJBeomQ_RtKptRPG/A2eSWuxGRFwgYiFeW;SID=CwgAK0JHm7ME-XzyP2Lj9nCC3vnHCzos46XSEJEE8sr24fQOUdfESD4ZnP-OcPEigm4aDQ.;SIDCC=AJi4QfGI62VP78wEANiK_jDw64JlJg5_ZzI_3FwagzMGRpjnJn_jTjhR4X16uYXAbl5RH2nILYQ; '

async function ytInfo (arg, optionInfo, optionSize) {
    if (arg === 'info' && titleVideo !== '') {
        // jika perintahnya /yt info
        return `Video : ${titleVideo}\nProses : *${percentDownload}%* downloaded`;
    } 
     

    if (!validateUrl(arg)) return
       
    const { videoDetails, formats } = await ytdl.getInfo(arg, {
        requestOptions: {
            header: {
                cookie: cookieYt
            }
        }
    }).catch((e) => {
        return e
    });

    if( optionInfo === 'info' || optionSize === 'info') {
        // jika perintahnya /yt <link> info
        return `List Size Video\n============== ${infoVideoYt(formats)}`;
    }
 
    console.log(await ytdl.getInfo(arg));
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
            quality: higher.itag,
            requestOptions: {
                header: {
                    cookieYt
                }
            }
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