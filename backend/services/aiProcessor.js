const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * generateSummary(analysisData)
 *
 * @param {Object} analysisData
 * @param {string} analysisData.repoName
 * @param {Array<{name: string, description: string}>} analysisData.folderStructure
 * @param {{fileName: string, filePath: string, flowTrace: string[]}} analysisData.entryPoint
 * @param {Array<{source: string, dependencies: string[]}>} analysisData.dependencies
 * @param {{totalFiles: number, totalFolders: number}} analysisData.meta
 *
 * @returns {Promise<{summary: string, insights: string[], techStack: string[]}>}
 */
async function generateSummary(analysisData) {
  try {
    const { repoName, folderStructure, entryPoint, dependencies, meta } = analysisData;

    const foldersText = Array.isArray(folderStructure)
      ? folderStructure.map((f) => `${f.name}: ${f.description}`).join(', ')
      : '';

    const importsText = Array.isArray(entryPoint?.flowTrace)
      ? entryPoint.flowTrace.join(', ')
      : '';

    const prompt = `You are a code analyst. Analyze this repository and respond in JSON only.
No markdown, no backticks, just raw JSON.

Repository: ${repoName}
Total files: ${meta?.totalFiles ?? 0}
Total folders: ${meta?.totalFolders ?? 0}
Entry point: ${entryPoint?.fileName ?? 'unknown'}
Imports: ${importsText}
Folders: ${foldersText}
Dependency links: ${Array.isArray(dependencies) ? dependencies.length : 0}

Respond with exactly this JSON:
{
  "summary": "2-3 sentence plain English overview of what this project is and does",
  "insights": [
    "insight about folder structure",
    "insight about entry point or flow",
    "insight about dependencies"
  ],
  "techStack": ["tech1", "tech2", "tech3"]
}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return parsed;
  } catch (err) {
    console.error('Gemini API Error:', err.message || err);
    return { summary: 'unavailable', insights: [], techStack: [] };
  }
}

module.exports = { generateSummary };
