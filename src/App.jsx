import { Routes, Route } from "react-router-dom"

import Projects from "./pages/Projects"
import Home from "./pages/Home"
import Games from "./pages/Games"
import Contact from "./pages/Contact"
import Login from "./pages/Login"
import AdminOverview from "./pages/admin/AdminOverview"
import AdminMessages from "./pages/admin/AdminMessages"
import AdminProjects from "./pages/admin/AdminProjects"
import AdminProfile from "./pages/admin/AdminProfile"
import AdminUploads from "./pages/admin/AdminUploads"
import ConsoleShell from "./components/ConsoleShell"
import AdminShell from "./components/AdminShell"
import ProtectedRoute from "./components/ProtectedRoute"
import { useVisit } from "./hooks/useVisit"

function PublicShell({ children }) {
  return <ConsoleShell>{children}</ConsoleShell>
}

function App() {
  useVisit()

  return (
    <Routes>
      <Route path="/" element={<PublicShell><Home /></PublicShell>} />
      <Route path="/projects" element={<PublicShell><Projects /></PublicShell>} />
      <Route path="/games" element={<PublicShell><Games /></PublicShell>} />
      <Route path="/contact" element={<PublicShell><Contact /></PublicShell>} />
      <Route path="/login" element={<PublicShell><Login /></PublicShell>} />
      <Route
        path="/admin"
        element={(
          <ProtectedRoute>
            <AdminShell />
          </ProtectedRoute>
        )}
      >
        <Route index element={<AdminOverview />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="uploads" element={<AdminUploads />} />
      </Route>
    </Routes>
  )
}

export default App
