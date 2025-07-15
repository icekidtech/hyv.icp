import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Use the css file for tailwind

const root = ReactDOM.createRoot(document.getElementById('root'));

const init = async () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

init();
