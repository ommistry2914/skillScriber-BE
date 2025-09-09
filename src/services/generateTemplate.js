const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const htmlDocx = require("html-docx-js");


// HTML template function
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
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            background-color: #2c3e50;
            color: white;
            padding: 15px;
            margin: -20px -20px 20px -20px;
            border-radius: 8px 8px 0 0;
        }
        .candidate-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
            background-color: #ecf0f1;
            padding: 20px;
            border-radius: 5px;
        }
        .info-item {
            display: flex;
            align-items: center;
        }
        .info-label {
            font-weight: bold;
            min-width: 150px;
            color: #2c3e50;
        }
        .info-value {
            color: #34495e;
            margin-left: 10px;
        }
        .skills-section {
            margin-top: 30px;
        }
        .skills-header {
            background-color: #3498db;
            color: white;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .skills-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .skills-table th {
            background-color: #34495e;
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #2c3e50;
            font-size: 14px;
        }
        .skills-table td {
            padding: 10px 8px;
            border: 1px solid #bdc3c7;
            vertical-align: top;
            font-size: 13px;
        }
        .skills-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .skills-table tr:hover {
            background-color: #e8f4fd;
        }
        .skill-name {
            font-weight: bold;
            color: #2c3e50;
            max-width: 200px;
            word-wrap: break-word;
        }
        .mandatory {
            background-color: #e74c3c;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
        }
        .optional {
            background-color: #f39c12;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
        }
        .projects-cell {
            max-width: 250px;
            word-wrap: break-word;
            line-height: 1.4;
        }
        .years-cell {
            text-align: center;
            font-weight: bold;
            color: #2c3e50;
        }
        .description-cell {
            max-width: 300px;
            word-wrap: break-word;
            line-height: 1.4;
            color: #34495e;
        }
        .not-available {
            color: #7f8c8d;
            font-style: italic;
        }
        @media print {
            body { margin: 0; background-color: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Contractor Connect Skill Evaluation Sheet</h1>
        </div>
        
        <div class="candidate-info">
            <div class="info-item">
                <span class="info-label">Candidate Name:</span>
                <span class="info-value">${candidateData.candidateName || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Total Experience:</span>
                <span class="info-value">${candidateData.totalExperience || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">JD Clarification Provided:</span>
                <span class="info-value">${candidateData.jdClarificationProvided || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Relevant Experience:</span>
                <span class="info-value">${candidateData.relevantExperience || 'N/A'}</span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Notice Period:</span>
                <span class="info-value">${candidateData.noticePeriod || 'N/A'}</span>
            </div>
        </div>

        <div class="skills-section">
            <div class="skills-header">
                MSP INPUT - Supplier Inputs
            </div>
            
            <table class="skills-table">
                <thead>
                    <tr>
                        <th style="width: 25%;">Candidate Skills</th>
                        <th style="width: 15%;">Mandatory/Optional</th>
                        <th style="width: 25%;">Name of Projects in which the skills were used</th>
                        <th style="width: 15%;">No. of years worked in each Project</th>
                        <th style="width: 20%;">Description of work done using the skill</th>
                    </tr>
                </thead>
                <tbody>
                    ${candidateData.skills ? candidateData.skills.map(skill => `
                    <tr>
                        <td class="skill-name">${skill.skillName || 'N/A'}</td>
                        <td style="text-align: center;">
                            <span class="${skill.mandatory === 'Mandatory' ? 'mandatory' : 'optional'}">
                                ${skill.mandatory || 'N/A'}
                            </span>
                        </td>
                        <td class="projects-cell">
                            ${skill.projects !== 'Not Available' ? skill.projects || 'N/A' : '<span class="not-available">Not Available</span>'}
                        </td>
                        <td class="years-cell">
                            ${skill.yearsWorked !== 'Not Available' ? skill.yearsWorked || 'N/A' : '<span class="not-available">Not Available</span>'}
                        </td>
                        <td class="description-cell">
                            ${skill.description !== 'Not Available' ? skill.description || 'N/A' : '<span class="not-available">Not Available</span>'}
                        </td>
                    </tr>
                    `).join('') : '<tr><td colspan="5" style="text-align: center; color: #7f8c8d;">No skills data available</td></tr>'}
                </tbody>
            </table>
        </div>
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