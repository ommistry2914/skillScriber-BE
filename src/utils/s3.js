const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const config = require("../config/config");

const s3 = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

async function uploadFileToS3(filePath, key) {
  try {
    const fileContent = fs.readFileSync(filePath);

    const command = new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: key,
      Body: fileContent,
      ContentType: getContentType(filePath),
    });

    await s3.send(command);

    return `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw error;
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".pdf": return "application/pdf";
    case ".docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".doc": return "application/msword";
    case ".html": return "text/html";
    case ".txt": return "text/plain";
    default: return "application/octet-stream";
  }
}


function generateS3Key(originalName, fileType, folder) {
  const timestamp = Date.now();
  const nameInLowercase = originalName.toLowerCase();
  const fileExtension = path.extname(nameInLowercase);
  const fileNameWithoutExt = path.basename(nameInLowercase, fileExtension);
  
  // Create filename with original name and timestamp
  const safeFileName = `${fileNameWithoutExt.replace(/[^a-z0-9]/g, '_')}_${timestamp}${fileExtension}`;
  
  // Store in upload folder
  return `uploads/${folder}/${safeFileName}`;
}

module.exports = { uploadFileToS3, generateS3Key };
