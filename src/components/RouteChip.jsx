function RouteChip({ method = "GET", path }) {
  return (
    <span className={`route-chip route-chip--${method.toLowerCase()}`}>
      <span>{method}</span> {path}
    </span>
  )
}

export default RouteChip
