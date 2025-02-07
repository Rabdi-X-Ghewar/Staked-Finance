// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import AgentDetails from './pages/AgentDetails';
import Home from './pages/Dashboard'
import RootLayout from './pages/layout'
import { Routes, Route } from "react-router-dom";

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <div className="flex  w-full h-screen bg-gray-900">
        <RootLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agent" element={<AgentDetails/>} />
          </Routes>
        </RootLayout>
      </div>
    </>
  );
}

export default App
