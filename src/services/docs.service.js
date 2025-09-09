const httpStatus = require("http-status");
const path = require("path");
const fs = require("fs");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const textract = require("textract");
const { createSummary } = require("./ai.service");
const { generateSkillEvaluationReport } = require("./generateTemplate");

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


  const jobDescriptionText = await extractTextFromFile(
    jobDescriptionFile.path,
    jobDescriptionFile.originalname
  );

  const resumeContents = [];
  
  for (let file of resumeFiles) {
    const resumeText = await extractTextFromFile(file.path, file.originalname);
    resumeContents.push({
      filename: file.originalname,
      content: resumeText,
    });
  }

  const summary = await createSummary(jobDescriptionText, resumeContents);
  console.log("summary", summary);

  const htmlGenerationResult = await generateSkillEvaluationReport(summary, 'generated');
  console.log("HTML Generation Result:", htmlGenerationResult);

  const response = {
    submissionId: Date.now().toString(),
    jobDescription: {
      originalName: jobDescriptionFile.originalname,
      path: jobDescriptionFile.path,
      size: jobDescriptionFile.size,
      content: jobDescriptionText,
    },
    resumes: resumeFiles.map((file, index) => ({
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      content: resumeContents[index]?.content,
    })),
    summary,
    htmlReports: htmlGenerationResult,
  };

  return response;
}

module.exports = {
  uploadDocs,
};