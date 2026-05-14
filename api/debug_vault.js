require('dotenv').config();
const VaultService = require('./Services/vaultService');

async function debugVault() {
  try {
    console.log('=== VAULT DEBUG ===');
    console.log('VAULT_PATH:', process.env.VAULT_PATH);
    
    const vaultService = new VaultService();
    
    // Get all domains
    console.log('\n--- AVAILABLE DOMAINS ---');
    const domains = await vaultService.getAllDomains();
    console.log(JSON.stringify(domains, null, 2));
    
    if (domains.length > 0) {
      // Get sections for first domain
      const firstDomain = domains[0].name;
      console.log(`\n--- SECTIONS IN DOMAIN: ${firstDomain} ---`);
      const sections = await vaultService.getSectionsByDomain(firstDomain);
      console.log(JSON.stringify(sections, null, 2));
      
      // Get notes for first section
      if (sections.length > 0) {
        const firstSection = sections[0].name;
        console.log(`\n--- NOTES IN SECTION: ${firstSection} ---`);
        const notes = await vaultService.getNotesBySection(firstDomain, firstSection);
        console.log(`Found ${notes.length} notes`);
        if (notes.length > 0) {
          console.log('First note preview:', notes[0].title);
        }
      }
    }
    
  } catch (error) {
    console.error('DEBUG ERROR:', error.message);
    console.error('Full error:', error);
  }
}

debugVault();
