// src/App.tsx

import React from 'react';
import AgentDetails from './components/AgentDetails';

const App: React.FC = () => {
  return (
    <div>
      <h1>Crypto AI Dashboard</h1>
      <AgentDetails username="cookiedotfun" />
    </div>
  );
};

export default App;