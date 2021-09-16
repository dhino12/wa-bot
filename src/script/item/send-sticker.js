const { MessageMedia } = require('whatsapp-web.js');

async function sendStickerFromUrl(client, message){
    const chat = await message.getChat();
    const media = await MessageMedia.fromUrl('https://p4.wallpaperbetter.com/wallpaper/801/429/239/anime-girls-genshin-impact-hutao-genshin-impact-winking-hd-wallpaper-preview.jpg')
    client.sendMessage(message.from, media, { sendMediaAsSticker: true });
}

async function sendStickerFromLocal(message){
    const media = await message.downloadMedia();
    console.log(`media : ${media.mimetype}`);
    const chat = await message.getChat();
    const stickerMedia = MessageMedia.fromFilePath('./media/gif/siesta.webp');
    console.log(`sticker media : ${stickerMedia.mimetype}`);
    chat.sendMessage(stickerMedia, {sendMediaAsSticker: true})
}

async function sendImageAsSticker(message, client) {
    const media = await message.downloadMedia();
    const stickerMedia = new MessageMedia(media.mimetype, media.data);
    client.sendMessage(message.from, stickerMedia, {sendMediaAsSticker: true});
}

module.exports = { sendStickerFromUrl, sendImageAsSticker };