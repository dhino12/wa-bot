const ffmpeg = require('fluent-ffmpeg')();
let progress = ``;

function toMp3(filePath, fileOut, arg) {

  if (arg === 'info') {
    return `Proses convert : *${progress}%* `;
  }
  
  return new Promise((resolve, reject) => {
    ffmpeg
      .input(filePath)
      .on('progress', (info) => {
          console.log(`Progress : ${info.percent} %`);
          progress = `${info.percent} % convert`
      })
      .output(fileOut)
      .on('error', (err) => { 
        console.log(err); 
        reject(err)
      })
      .on('end', () => {
        console.log('Finished processing');
        resolve('finish');
      }) 
      .run();
  })
}

module.exports = { toMp3 }