/**
 * Convert folder-level analysis into plain English.
 *
 * Placeholder implementation: will be wired to your analyzer outputs later.
 */

function explainFolders(folderStructure = []) {
  // TODO: Translate folder structure deeply once analyzer output format is finalized.
  if (!Array.isArray(folderStructure) || folderStructure.length === 0) {
    return {
      summary: 'Folder explanation placeholder.',
      folders: [],
    };
  }

  return {
    summary: `Repository has ${folderStructure.length} top-level folder entries.`,
    folders: folderStructure,
  };
}

module.exports = {
  explainFolders,
};

