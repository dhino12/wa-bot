const desc = {
    '/hi': 'katakan halo',
    '/kick': 'Kick seseorang',
    '/removebg': 'remove background',
    '/show': 'Tampilkan pesan terhapus',
    '/stiker': 'membuat stiker dengan gambar',
    '/stiker-nobg': 'membuat stiker tanpa background',
    '/stiker-gif': 'membuat stiker dengan video',
    '/sholat': 'memulai pengingat sholat',
    '/wa-ver': 'lihat versi whatsapp',
    '/help': 'bantuan'
}

const onlyCommands = {};
Object.keys(desc).map(command => onlyCommands[`${command}`] = command);

module.exports = {desc, onlyCommands}