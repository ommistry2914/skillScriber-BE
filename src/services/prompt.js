async function buildPrompt(jobDescription, resume) {
  return `
You are an AI that analyzes a single resume against a job description.  

### Job Description:
${jobDescription}

### Resume:
${resume.content}

---

### Task:
1. Extract **exactly 6 skills**:  
   - First 3 should be **Primary Skills** (highly relevant, mostly from Job Description).  
   - Next 3 should be **Secondary Skills** (supportive or additional, first from JD, if not enough then from resume).  
   - Skills must be unique and sorted in the above order.  
   - In the **skillName field**, prefix the category:  
     - "Primary Skill - {skill}"  
     - "Secondary Skill - {skill}"  

2. For each skill, determine:  
   - id (1–6 based on order)  
   - skillName (with prefix as described above)   
   - mandatory ("Mandatory"/"Optional" – based on JD if available, otherwise "Optional")  
   - yearsWorked (if available)  
   - projects (if available)  
   - description (if available)  

3. Extract the following fields in **valid JSON format**:  
   - candidateName  
   - totalExperience  
   - jdClarificationProvided ("YES"/"NO")  
   - relevantExperience  
   - noticePeriod  
   - skills[] (as per above rule, always 6 skills)  

### Important:
- Prioritize Job Description skills first.  
- If JD provides fewer than 6 skills, fill remaining slots from the Resume.  
- If info is missing, put "Not Available".  
- **Output must be a single JSON object (not array).**  
- **Do not add explanations, introductions, or markdown.**  
- **Return ONLY valid JSON.**
`;
}


// async function buildPrompt(jobDescription, resumes) {
//   return `
// You are an AI that analyzes resumes against a job description.  

// ### Job Description:
// ${jobDescription}

// ### Resumes:
// ${resumes
//   .map(
//     (r, i) => `
// Resume ${i + 1} (${r.filename}):
// ${r.content}
// `
//   )
//   .join("\n\n")}

// ---

// ### Task:
// 1. Extract **exactly 6 skills**:  
//    - First 3 should be **Primary Skills** (highly relevant, mostly from Job Description).  
//    - Next 3 should be **Secondary Skills** (supportive or additional, first from JD, if not enough then from resume).  
//    - Skills must be unique and sorted in the above order.  
//    - In the **skillName field**, prefix the category:  
//      - "Primary Skill - {skill}"  
//      - "Secondary Skill - {skill}"  

// 2. For each skill, determine:  
//    - id (1–6 based on order)  
//    - skillName (with prefix as described above)   
//    - mandatory ("Mandatory"/"Optional" – based on JD if available, otherwise "Optional")  
//    - yearsWorked (if available)  
//    - projects (if available)  
//    - description (if available)  

// 3. For each resume, also extract the following fields in **valid JSON format**:  
//    - candidateName  
//    - totalExperience  
//    - jdClarificationProvided ("YES"/"NO")  
//    - relevantExperience  
//    - noticePeriod  
//    - skills[] (as per above rule, always 6 skills)  

// ### Important:
// - Prioritize Job Description skills first.  
// - If JD provides fewer than 6 skills, fill remaining slots from the Resume.  
// - If info is missing, put "Not Available".  
// - **Output must be a single JSON array of objects (one per resume).**  
// - **Do not add explanations, introductions, or markdown.**  
// - **Return ONLY a valid JSON array. Nothing else.**
// `;
// }

// module.exports = {
//   buildPrompt,
// };