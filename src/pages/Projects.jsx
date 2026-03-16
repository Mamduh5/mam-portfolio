import { useEffect, useState } from "react"
import { api } from "../services/api"

function Projects() {

  const [projects, setProjects] = useState([])

  useEffect(() => {

    const fetchProjects = async () => {
      const res = await api.get("/projects")
      setProjects(res.data)
    }

    fetchProjects()

  }, [])

  return (
    <div>
      <h2>Projects</h2>

      {projects.map(project => (
        <div key={project._id}>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
        </div>
      ))}

    </div>
  )
}

export default Projects