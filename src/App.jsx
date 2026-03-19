import { Route, Routes } from "react-router-dom"
import { useVisit } from "./hooks/useVisit"
import Layout from "./components/Layout"
import Contact from "./pages/Contact"
import Games from "./pages/Games"
import Home from "./pages/Home"
import Projects from "./pages/Projects"

function App() {
  useVisit()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/games" element={<Games />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
    </Routes>
  )
}

export default App
