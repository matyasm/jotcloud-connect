
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add global error handling
const handleError = (error: Error) => {
  console.error('Caught in global handler:', error);
};

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Create the root with error handling
try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  handleError(error as Error);
  // Show a minimal error message when the app can't even render
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2 style="color: #e53e3e;">Application Error</h2>
        <p>Sorry, there was a problem loading the application.</p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 8px 16px; background-color: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload
        </button>
      </div>
    `;
  }
}
