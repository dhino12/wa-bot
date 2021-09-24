const commands = {
    '/hi': 'katakan halo',
    '/wa-ver': 'lihat versi whatsapp',
    '/stiker': 'membuat stiker dengan gambar',
    '/stiker-nobg': 'membuat stiker tanpa background',
    '/stiker-gif': 'membuat stiker dengan video',
    '/yt':'download video youtube',
    '/help': 'bantuan'
}

const onlyCommands = {};
Object.keys(commands).map(command => onlyCommands[`${command}`] = command);

module.exports = {commands, onlyCommands}