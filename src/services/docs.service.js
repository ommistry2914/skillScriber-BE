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
    resumes: [],
  };

  try {
    // Upload job description to S3
    const jdKey = generateS3Key(
      jobDescriptionFile.originalname,
      "job-descriptions",
      "jobDescriptions"
    );
    const jdUrl = await uploadFileToS3(jobDescriptionFile.path, jdKey);
    uploadedFiles.jobDescription = {
      originalName: jobDescriptionFile.originalname,
      storedName: path.basename(jdKey), // The name stored in S3 (same as local)
      url: jdUrl,
      key: jdKey,
      localPath: jobDescriptionFile.path,
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
        localPath: file.path,
      });
    }

    // Extract text from files for processing
    const jobDescriptionText = await extractTextFromFile(
      jobDescriptionFile.path,
      jobDescriptionFile.originalname
    );

    const resumeContents = [];

    for (let file of resumeFiles) {
      const resumeText = await extractTextFromFile(
        file.path,
        file.originalname
      );
      resumeContents.push({
        filename: file.originalname,
        content: resumeText,
      });
    }

    // Generate summary and reports
    const summary = await createSummary(jobDescriptionText, resumeContents);
    console.log("summary", summary);

    const reportResult = await generateSkillEvaluationReport(
      summary,
      "generated"
    );
    console.log("HTML Generation Result:", reportResult);

    if (!reportResult.success || !reportResult.files) {
      throw new Error(reportResult.message || "Failed to generate reports");
    }

    return {
      reports: reportResult.files.map((f) => ({
        candidateName: f.candidateName,
        s3Files: f.s3Files, // { html, pdf, docx }
      })),
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
