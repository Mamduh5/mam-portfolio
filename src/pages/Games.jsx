import { useEffect, useState } from "react"
import { api } from "../services/api"

function Games() {

  const [games, setGames] = useState([])

  useEffect(() => {

    const fetchGames = async () => {
      const res = await api.get("/projects?type=game")
      setGames(res.data)
    }

    fetchGames()

  }, [])

  return (
    <div>
      <h2>Games</h2>

      {games.map(game => (
        <div key={game._id}>
          <h3>{game.name}</h3>
          <p>{game.description}</p>
        </div>
      ))}

    </div>
  )
}

export default Games