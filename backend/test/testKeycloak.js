import KeycloakService from '../services/KeycloakService.js';
import 'dotenv/config';

async function test() {
  console.log('Test connessione Keycloak\n');

  try {
    await KeycloakService.authenticate();
    console.log('\nTest superato!');
  } catch (error) {
    console.error('\nTest fallito:', error.message);
  }
}

try {
  test();
} catch (error) {
  console.error('Errore durante l\'esecuzione del test:', error.message);
}