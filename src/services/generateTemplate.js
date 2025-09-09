const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const htmlDocx = require("html-docx-js");


function generateSkillEvaluationHTML(candidateData) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contractor Connect Skill Evaluation Sheet</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 1200px;
      margin: 0 auto;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 14px;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px 10px;
      text-align: left;
    }
    .main-header {
      background-color: #92d050;
      font-weight: bold;
      font-size: 18px;
      text-align: center;
      color: #000;
    }
    .section-label {
      width: 25%;
      background-color: #f9f9f9;
      font-weight: bold;
    }
    .msp-header {
      background-color: #e2f0d9;
      font-weight: bold;
      text-align: center;
    }
    .supplier-header {
      background-color: #e2f0d9;
      font-weight: bold;
      text-align: center;
    }
    .sub-header {
      background-color: #c6efce;
      font-weight: bold;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <table>
      <!-- Main header -->
      <tr>
        <td colspan="5" class="main-header">
          Contractor Connect Skill Evaluation Sheet
        </td>
      </tr>
      
      <!-- Candidate info -->
      <tr>
        <td class="section-label">Candidate Name:</td>
        <td colspan="4">${candidateData.candidateName || 'N/A'}</td>
      </tr>
      <tr>
        <td class="section-label">Total Experience:</td>
        <td colspan="4">${candidateData.totalExperience || 'N/A'}</td>
      </tr>
      <tr>
        <td class="section-label">JD Clarification Provided to Candidate</td>
        <td colspan="4">${candidateData.jdClarificationProvided || 'N/A'}</td>
      </tr>
      <tr>
        <td class="section-label">Relevant Experience:</td>
        <td colspan="4">${candidateData.relevantExperience || 'N/A'}</td>
      </tr>
      <tr>
        <td class="section-label">Notice Period:</td>
        <td colspan="4">${candidateData.noticePeriod || 'N/A'}</td>
      </tr>

      <!-- Skills table header -->
      <tr>
        <td colspan="2" class="msp-header">MSP INPUT</td>
        <td colspan="3" class="supplier-header">Supplier Inputs</td>
      </tr>
      <tr>
        <td class="sub-header">Candidate Skills</td>
        <td class="sub-header">Mandatory/Optional</td>
        <td class="sub-header">Name of Projects in which the skills were used</td>
        <td class="sub-header">No. of years worked in each Project</td>
        <td class="sub-header">Description of work done using the skill</td>
      </tr>

      <!-- Skills rows -->
      ${
        candidateData.skills && candidateData.skills.length > 0
          ? candidateData.skills.map(skill => `
            <tr>
              <td>${skill.skillName || 'N/A'}</td>
              <td>${skill.mandatory || 'N/A'}</td>
              <td>${skill.projects || 'N/A'}</td>
              <td>${skill.yearsWorked || 'N/A'}</td>
              <td>${skill.description || 'N/A'}</td>
            </tr>
          `).join('')
          : `<tr><td colspan="5" style="text-align:center; color:#777;">No skills data available</td></tr>`
      }
    </table>
  </div>
</body>
</html>`;
  
  return html;
}


// Function to generate and save HTML file
async function generateSkillEvaluationReport(candidatesData, outputDir = "generated") {
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const results = [];
    const candidates = Array.isArray(candidatesData) ? candidatesData : [candidatesData];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const html = generateSkillEvaluationHTML(candidate);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const candidateName = candidate.candidateName
        ? candidate.candidateName.replace(/[^a-zA-Z0-9]/g, "_")
        : "Unknown";

      // Filenames
      const baseFilename = `skill_evaluation_${candidateName}_${timestamp}`;
      const htmlFilePath = path.join(outputDir, `${baseFilename}.html`);
      const pdfFilePath = path.join(outputDir, `${baseFilename}.pdf`);
      const docxFilePath = path.join(outputDir, `${baseFilename}.docx`);

      // 1. Save HTML
      fs.writeFileSync(htmlFilePath, html, "utf8");

      // 2. Save PDF (using puppeteer for accurate rendering)
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      await page.pdf({ path: pdfFilePath, format: "A4" });
      await browser.close();

      // 3. Save DOCX (using html-docx-js)
      const blob = htmlDocx.asBlob(html);
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(docxFilePath, buffer);


      results.push({
        candidateName: candidate.candidateName,
        htmlFile: path.resolve(htmlFilePath),
        pdfFile: path.resolve(pdfFilePath),
        docxFile: path.resolve(docxFilePath),
        success: true,
      });
    }

    return {
      success: true,
      message: `Generated ${results.length} reports (HTML, PDF, DOCX)`,
      files: results,
    };
  } catch (error) {
    console.error("Error generating reports:", error);
    return {
      success: false,
      message: "Failed to generate reports",
      error: error.message,
    };
  }
}
module.exports = {
  generateSkillEvaluationHTML,
  generateSkillEvaluationReport
};