import { useEffect, useState } from "react"
import { api } from "../services/api"

function Home() {

  const [profile, setProfile] = useState(null)

  useEffect(() => {
    api.get("/profile")
      .then(res => {
        setProfile(res.data)
      })
      .catch(err => {
        console.error(err)
      })
  }, [])

  if (!profile) return <div>Loading...</div>

  return (
    <div>
      <h2>{profile.name}</h2>
      <p>{profile.title}</p>

      <p>Email: {profile.email}</p>

      <p>
        Github: 
        <a href={profile.github} target="_blank">
          {profile.github}
        </a>
      </p>

    </div>
  )
}

export default Home