import { useNavigate } from 'react-router-dom'

export default function RoleToggle({ role, page }) {
  const navigate = useNavigate()
  return (
    <div className="auth-role-toggle">
      <button
        type="button"
        className={`art-tab${role === 'planner' ? ' act' : ''}`}
        onClick={() => navigate(`/planner/${page}`)}
      >
        👰 Event Planner
      </button>
      <button
        type="button"
        className={`art-tab${role === 'vendor' ? ' act' : ''}`}
        onClick={() => navigate(`/vendor/${page}`)}
      >
        💼 Vendor
      </button>
    </div>
  )
}
