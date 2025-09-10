const httpStatus = require("http-status");
const path = require("path");
const fs = require("fs");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const textract = require("textract");
const { createSummary } = require("./ai.service");
const { generateSkillEvaluationReport } = require("./generateTemplate");
const { generateS3Key, uploadFileToS3 } = require("../utils/s3");

// Function to extract text from PDF
async function extractPdfText(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return "Error reading PDF file";
  }
}

// Function to extract text from DOCX
async function extractDocxText(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error("Error extracting DOCX text:", error);
    return "Error reading DOCX file";
  }
}

// Function to extract text from DOC (using textract)
async function extractDocText(filePath) {
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, (error, text) => {
      if (error) {
        console.error("Error extracting DOC text:", error);
        resolve("Error reading DOC file");
      } else {
        resolve(text);
      }
    });
  });
}

// Generic function to extract text based on file extension
async function extractTextFromFile(filePath, originalName) {
  const extension = path.extname(originalName).toLowerCase();

  switch (extension) {
    case ".pdf":
      return await extractPdfText(filePath);
    case ".docx":
      return await extractDocxText(filePath);
    case ".doc":
      return await extractDocText(filePath);
    default:
      return "Unsupported file format";
  }
}

async function uploadDocs(req) {
  if (!req.files || !req.files.jobDescription || !req.files.resumes) {
    throw new Error("Job description and resumes are required");
  }

  const jobDescriptionFile = req.files.jobDescription[0];
  const resumeFiles = req.files.resumes;

  // Upload original files to S3
  const uploadedFiles = {
    jobDescription: null,
    resumes: []
  };

  try {
    // Upload job description to S3
    const jdKey = generateS3Key(jobDescriptionFile.originalname, "job-descriptions", "jobDescriptions");
    const jdUrl = await uploadFileToS3(jobDescriptionFile.path, jdKey);
    uploadedFiles.jobDescription = {
      originalName: jobDescriptionFile.originalname,
      storedName: path.basename(jdKey), // The name stored in S3 (same as local)
      url: jdUrl,
      key: jdKey,
      localPath: jobDescriptionFile.path
    };

    // Upload resumes to S3
    for (let file of resumeFiles) {
      const resumeKey = generateS3Key(file.originalname, "resumes", "resumes");
      const resumeUrl = await uploadFileToS3(file.path, resumeKey);
      uploadedFiles.resumes.push({
        originalName: file.originalname,
        storedName: path.basename(resumeKey), // The name stored in S3 (same as local)
        url: resumeUrl,
        key: resumeKey,
        localPath: file.path
      });
    }

    // Extract text from files for processing
    const jobDescriptionText = await extractTextFromFile(
      jobDescriptionFile.path,
      jobDescriptionFile.originalname
    );

    // Now process each resume separately (per-resume AI call + report)
    const reportResults  = [];

    for (let file of resumeFiles) {
      const resumeText = await extractTextFromFile(file.path, file.originalname);

      try {
        // One AI request per resume
        const summary = await createSummary(jobDescriptionText, [
          { filename: file.originalname, content: resumeText }
        ]);

        // AI may return a single object or array → normalize
        const candidateData = Array.isArray(summary) ? summary[0] : summary;

        // Generate reports (HTML, PDF, DOCX) for this candidate
        const reportResult = await generateSkillEvaluationReport(candidateData, "generated");

        reportResults.push({
          candidateName: candidateData.candidateName || file.originalname,
          s3Files: reportResult.files[0].s3Files, // only 1 candidate here
          success: true,
        });
      } catch (err) {
        console.error(`Error processing resume ${file.originalname}:`, err);
        reportResults.push({
          candidateName: file.originalname,
          error: err.message,
          success: false,
        });
      }
    }

    return {
      success: true,
      message: `Processed ${reportResults.length} resumes with per-resume requests`,
      reports: reportResults,
    };
  } catch (error) {
    // Clean up files even if there's an error
    try {
      if (fs.existsSync(jobDescriptionFile.path)) {
        fs.unlinkSync(jobDescriptionFile.path);
      }
      for (let file of resumeFiles) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    } catch (cleanupError) {
      console.error("Error cleaning up files:", cleanupError);
    }

    throw error;
  }
}

module.exports = {
  uploadDocs,
};