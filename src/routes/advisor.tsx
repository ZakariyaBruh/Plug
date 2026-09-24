import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/advisor')({
  component: AdvisorPage,
})

function AdvisorPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Advisor Configuration</h1>
      <p>Advisor token loaded and active.</p>
      <p>Token: <code>8c05a9c7e728a9bdcd859b116fa7b4d7c713ac2c</code></p>
      <p>Advisor is always on to handle reasoning delegation.</p>
    </div>
  )
}
