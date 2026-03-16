import { Routes, Route } from "react-router-dom"

import Projects from "./pages/Projects"
import Home from "./pages/Home"
import Games from "./pages/Games"
import Contact from "./pages/Contact"

function App() {
  return (
    <div>
      <h1>Mam Portfolio</h1>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/games" element={<Games />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

    </div>
  )
}

export default App