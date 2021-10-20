const desc = {
    '/fb': 'Download video facebook',
    '/hi': 'katakan halo',
    '/kick': 'Kick seseorang',
    '/mp3': 'Convert ke mp3',
    '/stiker': 'membuat stiker dengan gambar',
    '/stiker-nobg': 'membuat stiker tanpa background',
    '/stiker-gif': 'membuat stiker dengan video',
    '/wa-ver': 'lihat versi whatsapp',
    '/yt': 'download video youtube',
    '/help': 'bantuan'
}

const onlyCommands = {};
Object.keys(desc).map(command => onlyCommands[`${command}`] = command);

module.exports = {desc, onlyCommands}