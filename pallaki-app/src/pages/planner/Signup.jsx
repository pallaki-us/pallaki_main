import AuthLayout from '../../components/auth/AuthLayout'
import SignupForm from '../../components/auth/SignupForm'

export default function PlannerSignup() {
  return (
    <AuthLayout role="planner">
      <SignupForm role="planner" />
    </AuthLayout>
  )
}
