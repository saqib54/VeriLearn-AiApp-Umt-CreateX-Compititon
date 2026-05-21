export const API_BASE = window.location.hostname.includes('run.app')
  ? 'https://verilearn-backend-388366922818.us-central1.run.app'
  : `http://${window.location.hostname || 'localhost'}:3001`;
