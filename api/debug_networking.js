require('dotenv').config();
const VaultService = require('./Services/vaultService');

async function debugNetworking() {
  try {
    console.log('=== NETWORKING DOMAIN DEBUG ===');
    
    const vaultService = new VaultService();
    
    // Get sections for networking domain
    console.log('\n--- SECTIONS IN NETWORKING DOMAIN ---');
    const sections = await vaultService.getSectionsByDomain('networking');
    console.log(JSON.stringify(sections, null, 2));
    
    // Get all notes in networking domain
    console.log('\n--- ALL NOTES IN NETWORKING DOMAIN ---');
    const allNotes = await vaultService.getNotesBySection('networking', '_root');
    console.log(`Found ${allNotes.length} notes:`);
    allNotes.forEach((note, index) => {
      console.log(`${index + 1}. ${note.title}`);
    });
    
  } catch (error) {
    console.error('DEBUG ERROR:', error.message);
  }
}

debugNetworking();
