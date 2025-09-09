async function buildPrompt(jobDescription, resumes) {
  return `
You are an AI that analyzes resumes against a job description.  

### Job Description:
${jobDescription}

### Resumes:
${resumes
  .map(
    (r, i) => `
Resume ${i + 1} (${r.filename}):
${r.content}
`
  )
  .join("\n\n")}

---

### Task:
1. First, extract **all skills from the job description**.  
   - Mark each skill as **"Mandatory"** or **"Optional"** according to the JD.  

2. For each resume:  
   - Extract the following fields in **valid JSON format**:
     - candidateName  
     - totalExperience  
     - jdClarificationProvided ("YES"/"NO")  
     - relevantExperience  
     - noticePeriod  
     - skills[] (only include skills mentioned in the job description):
       - id (number starting from 1 for each skill in JD order)  
       - skillName  
       - mandatory ("Mandatory"/"Optional")  
       - presentInResume ("YES"/"NO")  
       - projects (if available)  
       - yearsWorked (if available)  
       - description (if available)  

### Important:
- If any info is missing, put "Not Available".  
- **Output must be a single JSON array of objects (one per resume).**  
- **Do not add explanations, introductions, or markdown.**  
- **Return ONLY a valid JSON array. Nothing else.**
`;
}

module.exports = {
  buildPrompt,
};
