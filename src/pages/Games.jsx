import { useEffect, useMemo, useState } from "react"
import { api } from "../services/api"
import CommandHero from "../components/CommandHero"
import ProjectMissionCard from "../components/ProjectMissionCard"

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
        eyebrow={<span className="static-chip">Game projects</span>}
        title="Games unavailable"
        description="Games could not be loaded right now. Try again in a moment."
      />
    )
  }

  if (games.length === 0) {
    return (
      <CommandHero
        eyebrow={<span className="static-chip">Game projects</span>}
        title="Games"
        description="No games selected yet."
      />
    )
  }

  return (
    <div className="page-stack">
      <CommandHero
        eyebrow={<span className="static-chip">Game projects</span>}
        title="Games"
        description="Playable works."
        actions={<button className="button button--secondary" type="button">View selected</button>}
      >
        <div className="featured-project">
          <span className="card-kicker">Featured game</span>
          <h2>{selectedGame.name}</h2>
          <p>{selectedGame.description || "No game description yet."}</p>
        </div>
      </CommandHero>

      <section className="mission-grid" aria-label="Game cards">
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
