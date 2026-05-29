import { Routes, Route } from "react-router-dom"

import Projects from "./pages/Projects"
import Home from "./pages/Home"
import Games from "./pages/Games"
import Contact from "./pages/Contact"
import Login from "./pages/Login"
import ConsoleShell from "./components/ConsoleShell"
import { useVisit } from "./hooks/useVisit"

function App() {
  useVisit()

  return (
    <ConsoleShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/games" element={<Games />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </ConsoleShell>
  )
}

export default App
