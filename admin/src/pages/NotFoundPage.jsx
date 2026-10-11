import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <h1>404</h1>
        <p>This admin page does not exist.</p>
        <Link to="/" className="btn">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
