import { useEffect, useMemo, useState } from "react"
import { api } from "../services/api"
import CommandHero from "../components/CommandHero"
import ProjectMissionCard from "../components/ProjectMissionCard"
import RouteChip from "../components/RouteChip"

function Games() {
  const [games, setGames] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await api.get("/projects?type=game")
        const payload = Array.isArray(res.data) ? res.data : []
        setGames(payload)
        setSelectedId(payload[0]?._id || null)
        setError(false)
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [])

  const selectedGame = useMemo(
    () => games.find(game => game._id === selectedId) || games[0],
    [games, selectedId]
  )

  if (loading) {
    return (
      <div className="page-stack">
        <div className="skeleton skeleton--hero" />
        <div className="bento-grid bento-grid--two">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <CommandHero
        eyebrow={<RouteChip method="GET" path="/projects?type=game" />}
        title="Games unavailable"
        description="The games endpoint did not respond. The public route can retry when the API is online."
      />
    )
  }

  if (games.length === 0) {
    return (
      <CommandHero
        eyebrow={<RouteChip method="GET" path="/projects?type=game" />}
        title="Games"
        description="No game projects yet. Add a game project to activate this route."
      />
    )
  }

  return (
    <div className="page-stack">
      <CommandHero
        eyebrow={<RouteChip method="GET" path="/projects?type=game" />}
        title="Games"
        description="Playable work and experiments share the same mission card system."
        actions={<button className="button button--secondary" type="button">Inspect</button>}
      >
        <div className="featured-project">
          <span className="card-kicker">Featured game</span>
          <h2>{selectedGame.name}</h2>
          <p>{selectedGame.description || "No mission briefing yet."}</p>
        </div>
      </CommandHero>

      <section className="mission-grid" aria-label="Game missions">
        {games.map(game => (
          <ProjectMissionCard
            key={game._id}
            project={game}
            selected={selectedGame?._id === game._id}
            onSelect={(item) => setSelectedId(item._id)}
          />
        ))}
      </section>
    </div>
  )
}

export default Games
