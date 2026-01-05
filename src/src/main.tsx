import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App.tsx';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../styles/globals.css';
import { sqliteService } from '../database/sqlite-service';

console.log('✅ main.tsx is loading...');

const rootElement = document.getElementById('root');
console.log('✅ Root element:', rootElement);

if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

async function bootstrap() {
  try {
    console.log('✅ Initializing SQLite database...');
    await sqliteService.init();
    console.log('✅ SQLite initialized');

    console.log('✅ Creating React root...');
    ReactDOM.createRoot(rootElement!).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
    console.log('✅ React app rendered!');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
  }
}

bootstrap();
