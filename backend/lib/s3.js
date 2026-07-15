const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'netflixclonedata';

// Create S3 client – if no explicit credentials are provided,
// the SDK will fall back to the default credential chain:
//   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars → ~/.aws/credentials → EC2 IAM role
const s3Client = new S3Client({
  region: REGION,
});

/**
 * Upload a file (buffer / stream) to S3.
 *
 * @param {Object} options
 * @param {string} options.key        – S3 object key (e.g. "videos/abc123.mp4")
 * @param {Buffer|ReadableStream} options.body – file content
 * @param {string} [options.contentType] – MIME type (optional)
 * @returns {Promise<string>} The S3 object key of the uploaded object.
 */
async function uploadFile({ key, body, contentType }) {
  const parallelUploads3 = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
    },
    // Allow the SDK to decide part size – works well for files of any size.
    queueSize: 4,
    partSize: 5 * 1024 * 1024, // 5 MB parts
    leavePartsOnError: false,
  });

  await parallelUploads3.done();

  // Return the S3 key (not the public URL, since bucket is private)
  return key;
}

/**
 * Generate a pre-signed URL for a given S3 key.
 * The URL expires after the specified number of seconds.
 *
 * @param {string} key – S3 object key (e.g. "videos/abc123.mp4")
 * @param {number} [expiresIn=3600] – URL expiry in seconds (default 1 hour)
 * @returns {Promise<string>} Pre-signed URL
 */
async function getSignedObjectUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete an object from S3.
 *
 * @param {string} key – S3 object key to delete.
 */
async function deleteFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await s3Client.send(command);
}

/**
 * Generate a unique S3 key for a given file name and prefix folder.
 *
 * @param {string} folder   – e.g. "videos" or "thumbnails"
 * @param {string} filename – original file name with extension
 * @returns {string} e.g. "videos/1623456789-987654321-avatar.jpg"
 */
function generateKey(folder, filename) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  return `${folder}/${uniqueSuffix}${path.extname(filename)}`;
}

module.exports = { uploadFile, deleteFile, generateKey, getSignedObjectUrl };