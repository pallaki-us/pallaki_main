import AuthLayout from '../../components/auth/AuthLayout'
import SignupForm from '../../components/auth/SignupForm'

export default function VendorSignup() {
  return (
    <AuthLayout role="vendor">
      <SignupForm role="vendor" />
    </AuthLayout>
  )
}
