import KeycloakService from '../services/KeycloakService.js';
import 'dotenv/config';

async function test() {
  console.log('🧪 Test connessione Keycloak\n');

  try {
    await KeycloakService.authenticate();
    console.log('\n✅ Test superato!');
  } catch (error) {
    console.error('\n❌ Test fallito:', error.message);
  }
}

test();