const { MessageMedia } = require('whatsapp-web.js');

async function sendStickerFromUrl(client, message){
    const chat = await message.getChat();
    const media = await MessageMedia.fromUrl('https://p4.wallpaperbetter.com/wallpaper/801/429/239/anime-girls-genshin-impact-hutao-genshin-impact-winking-hd-wallpaper-preview.jpg')
    client.sendMessage(message.from, media, { sendMediaAsSticker: true });
}

async function sendStickerFromLocal(message){
    const chat = await message.getChat();
    const media = await MessageMedia.fromUrl('https://p4.wallpaperbetter.com/wallpaper/801/429/239/anime-girls-genshin-impact-hutao-genshin-impact-winking-hd-wallpaper-preview.jpg')
    chat.sendMessage(media);
}

async function sendImageAsSticker(message, client) {
    const media = await message.downloadMedia();
    const stickerMedia = new MessageMedia(media.mimetype, media.data);
    client.sendMessage(message.from, stickerMedia, {sendMediaAsSticker: true});
}

module.exports = { sendStickerFromUrl, sendImageAsSticker };