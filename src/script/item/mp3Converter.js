const ffmpeg = require('fluent-ffmpeg')();
let totalConvert = 0; 
let progress = ``;

function toMp3(filePath, fileOut, arg) {

  if (totalConvert >= 1) {
    console.log(totalConvert);
    throw `Proses Convert sedang berjalan harap 1 per 1\nProgress: *${progress}*`  
  }

  if (arg === 'info') {
    if (progress === '') return 'tidak ada convert yg berjalan / convert belum dimulai'
    return `Proses convert : *${progress}%* `;
  }
  
  ++totalConvert
  return new Promise((resolve, reject) => {
    ffmpeg
      .input(filePath)
      .on('progress', (info) => {
          console.log(`Progress : ${Math.floor(info.percent)} %`);
          progress = `${Math.floor(info.percent)} % convert`
      })
      .output(fileOut)
      .on('error', (err) => { 
        console.log(err); 
        reject(err)
      })
      .on('end', () => {
        console.log('Finished processing');
        totalConvert = 0
        resolve('finish');
      }) 
      .run();
  })
}

module.exports = { toMp3 }