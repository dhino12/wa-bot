const {
    removeBackgroundFromImageBase64,
    RemoveBgResult,
    removeBackgroundFromImageFile
} = require('remove.bg');

async function removeBg(bufferBase64, outputFile) {
    return await removeBackgroundFromImageBase64({
        base64img: bufferBase64,
        apiKey: 'QM3HY6Cy3hGQwbxC9sQhQHwX',
        size: 'regular',
        type: 'product',
        outputFile
    });
}

async function removeBgColor({bufferBase64, bg_color}, outputFile) {
    return await removeBackgroundFromImageBase64({
        base64img: bufferBase64,
        apiKey: 'QM3HY6Cy3hGQwbxC9sQhQHwX',
        bg_color,
        size: 'regular',
        type: 'product',
        outputFile
    });
}

module.exports = { removeBg, removeBgColor }