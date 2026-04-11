import AuthLayout from '../../components/auth/AuthLayout'
import LoginForm from '../../components/auth/LoginForm'

export default function PlannerLogin() {
  return (
    <AuthLayout role="planner">
      <LoginForm role="planner" />
    </AuthLayout>
  )
}
