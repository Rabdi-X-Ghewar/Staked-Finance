// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'

import Home from './pages/Dashboard'
import RootLayout from './pages/layout'

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
    <div className='flex  w-full h-screen bg-gray-50'>
      <RootLayout>
        <Home />
      </RootLayout>
      </div>
    </>
  )
}

export default App
