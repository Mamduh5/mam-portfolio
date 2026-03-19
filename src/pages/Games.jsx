import ProjectList from "../components/ProjectList"
import { useApiData } from "../hooks/useApiData"

function Games() {
  const { data: games = [], isLoading, error } = useApiData("/projects?type=game", [])

  if (isLoading) {
    return <div className="status-panel">Loading games...</div>
  }

  if (error) {
    return <div className="status-panel is-error">{error}</div>
  }

  return (
    <ProjectList
      title="Games"
      items={games}
      emptyMessage="No games have been added yet."
    />
  )
}

export default Games
