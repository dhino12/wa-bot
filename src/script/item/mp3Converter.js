const ffmpeg = require('fluent-ffmpeg')();

function toMp3(filePath, fileOut) {
    ffmpeg
        .input(filePath)
        .on('progress', (info) => {
            console.log(`Progress : ${info.percent} %`);
        })
        .output(fileOut)
        .on('end', function() {
          console.log('Finished processing');
        })
        .on('error', (err) => { console.log(err); })
        .run();
}

module.exports = { toMp3 }