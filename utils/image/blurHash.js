const { encode } = require('blurhash');
const { createCanvas, loadImage } = require('canvas');

const processImageToBlurHash = async (imageBuffer) => {
  try {
    const image = await loadImage(imageBuffer);
    const width = image.width;
    const height = image.height;

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const blurHash = encode(imageData.data, width, height, 4, 4);

    return blurHash;
  } catch (error) {
    throw new Error(`Error processing image: ${error.message}`);
  }
};

module.exports = { processImageToBlurHash };