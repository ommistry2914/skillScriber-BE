const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const htmlDocx = require("html-docx-js");
const { uploadFileToS3 } = require("../utils/s3");
const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, TextRun, BorderStyle } = require("docx");

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

// Function to generate DOCX using docx library (more reliable)
function generateSkillEvaluationDOCX(candidateData) {
  const tableRows = [];
  
  // Main header row
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Contractor Connect Skill Evaluation Sheet",
                  bold: true,
                  size: 36, // 18pt
                })
              ],
              alignment: AlignmentType.CENTER,
            })
          ],
          columnSpan: 5,
          shading: {
            fill: "92d050",
          },
        })
      ]
    })
  );

  // Candidate information rows
  const candidateInfo = [
    ["Candidate Name:", candidateData.candidateName || 'N/A'],
    ["Total Experience:", candidateData.totalExperience || 'N/A'],
    ["JD Clarification Provided to Candidate", candidateData.jdClarificationProvided || 'N/A'],
    ["Relevant Experience:", candidateData.relevantExperience || 'N/A'],
    ["Notice Period:", candidateData.noticePeriod || 'N/A']
  ];

  candidateInfo.forEach(([label, value]) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label,
                    bold: true,
                  })
                ]
              })
            ],
            width: {
              size: 25,
              type: WidthType.PERCENTAGE,
            },
            shading: {
              fill: "f9f9f9",
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: value,
                  })
                ]
              })
            ],
            columnSpan: 4,
          })
        ]
      })
    );
  });

  // MSP and Supplier headers row
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "MSP INPUT",
                  bold: true,
                })
              ],
              alignment: AlignmentType.CENTER,
            })
          ],
          columnSpan: 2,
          shading: {
            fill: "e2f0d9",
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Supplier Inputs",
                  bold: true,
                })
              ],
              alignment: AlignmentType.CENTER,
            })
          ],
          columnSpan: 3,
          shading: {
            fill: "e2f0d9",
          },
        })
      ]
    })
  );

  // Sub headers row
  const subHeaders = [
    "Candidate Skills",
    "Mandatory/Optional", 
    "Name of Projects in which the skills were used",
    "No. of years worked in each Project",
    "Description of work done using the skill"
  ];

  tableRows.push(
    new TableRow({
      children: subHeaders.map(header => 
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: header,
                  bold: true,
                })
              ],
              alignment: AlignmentType.CENTER,
            })
          ],
          shading: {
            fill: "c6efce",
          },
        })
      )
    })
  );

  // Skills data rows
  if (candidateData.skills && candidateData.skills.length > 0) {
    candidateData.skills.forEach(skill => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: skill.skillName || 'N/A',
                    })
                  ]
                })
              ]
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: skill.mandatory || 'N/A',
                    })
                  ]
                })
              ]
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: skill.projects || 'N/A',
                    })
                  ]
                })
              ]
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: skill.yearsWorked || 'N/A',
                    })
                  ]
                })
              ]
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: skill.description || 'N/A',
                    })
                  ]
                })
              ]
            })
          ]
        })
      );
    });
  } else {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "No skills data available",
                    color: "777777",
                  })
                ],
                alignment: AlignmentType.CENTER,
              })
            ],
            columnSpan: 5,
          })
        ]
      })
    );
  }

  const table = new Table({
    rows: tableRows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [table],
      },
    ],
  });

  return doc;
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
      const baseFilename = `${candidateName}_skill_evaluation_${timestamp}`;
      const htmlFilePath = path.join(outputDir, `${baseFilename}.html`);
      const pdfFilePath = path.join(outputDir, `${baseFilename}.pdf`);
      const docxFilePath = path.join(outputDir, `${baseFilename}.docx`);

      // 1. Save HTML
      fs.writeFileSync(htmlFilePath, html, "utf8");

      // 2. Save PDF (using puppeteer for accurate rendering)
      const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"], });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      await page.pdf({ path: pdfFilePath, format: "A4", printBackground: true, });
      await browser.close();

      // 3. Save DOCX (using html-docx-js)
      // const blob = htmlDocx.asBlob(html);
      // const arrayBuffer = await blob.arrayBuffer();
      // const buffer = Buffer.from(arrayBuffer);
      // fs.writeFileSync(docxFilePath, buffer);

      // 3. Save DOCX (using the new method)
      const docxDoc = generateSkillEvaluationDOCX(candidate);
      const docxBuffer = await Packer.toBuffer(docxDoc);
      fs.writeFileSync(docxFilePath, docxBuffer);

      // Upload to S3
      const htmlS3Url = await uploadFileToS3(htmlFilePath, `reports/${baseFilename}.html`);
      const pdfS3Url = await uploadFileToS3(pdfFilePath, `reports/${baseFilename}.pdf`);
      const docxS3Url = await uploadFileToS3(docxFilePath, `reports/${baseFilename}.docx`);


      results.push({
        candidateName: candidate.candidateName,
        localFiles: {
          html: path.resolve(htmlFilePath),
          pdf: path.resolve(pdfFilePath),
          docx: path.resolve(docxFilePath),
        },
        s3Files: {
          html: htmlS3Url,
          pdf: pdfS3Url,
          docx: docxS3Url,
        },
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
  generateSkillEvaluationReport,
  generateSkillEvaluationDOCX,
};