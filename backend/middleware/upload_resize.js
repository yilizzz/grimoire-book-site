const multer = require('multer');
const sharp = require('sharp');
const storage = multer.memoryStorage();
const upload = multer({storage: storage});
const axios = require('axios');

const { S3Client, PutObjectCommand }= require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const resizeAndSaveImage = async (req, res, next) => {
  if (!req.file) return next();
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    signatureVersion: "v4",
});
  try {
    // Resize image to width, height
    const buffer = await sharp(req.file.buffer)
      .resize({
        width: 206,
        height: 260,
        fit: sharp.fit.cover,
      })
      .webp({ quality: 50 }) // Use WebP option for output image.
      .toBuffer();

    // Change image's filename to avoid invalid characters
    const filename = Date.now() + '.webp';

    // Generate a presigned URL
    const signedUrlExpireSeconds = 60 * 5;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filename,
      ContentType: 'image/webp',
    });
    const url = await getSignedUrl(s3, command, {
      expiresIn: signedUrlExpireSeconds,
    });

    // Upload the resized image to an AWS S3 bucket using the presigned URL
    await axios.put(url, buffer);
    req.file.filename = filename;
    next();
  } catch (error) {
    res.status(401).json({message: `aws error : ${error}`});
  }
};

// upload a single file to the storage, then resize and save it to correct destination
const uploadAndResizeImage = [upload.single('image'), resizeAndSaveImage];
module.exports = uploadAndResizeImage;
