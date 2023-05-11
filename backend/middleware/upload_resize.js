const multer = require('multer');
const sharp = require('sharp');
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

const resizeAndSaveImage = async  (req, res, next) => {
  if (!req.file) return next();

  try{
    // Resize image to width, height
    const buffer =  await sharp(req.file.buffer)
    .resize({
      width:206,
      height:260,
      fit: sharp.fit.cover
    })
    .webp({quality: 50}) // Use WebP option for output image.
    .toBuffer();
    // Change image's filename to avoid invalid characters
    const filename = Date.now() + '.webp';
    await sharp(buffer).toFile('./images/' + filename);
    req.file.filename = filename;
    next();
  }
  catch(error){
    res.status(401).json({ error });
  }
}
//  upload a singe file to the storage, then resize and save it to correct destination
const uploadAndResizeImage = [upload.single('image'), resizeAndSaveImage];
module.exports = uploadAndResizeImage;
