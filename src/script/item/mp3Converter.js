const ffmpeg = require('fluent-ffmpeg')();

function toMp3(filePath, fileOut) {
    ffmpeg
        .input(filePath)
        .on('progress', (info) => {
            console.log(`Progress : ${info.percent} %`);
        })
        .output(fileOut)
        .run();
}

module.exports = { toMp3 }