import AuthLayout from '../../components/auth/AuthLayout'
import LoginForm from '../../components/auth/LoginForm'

export default function VendorLogin() {
  return (
    <AuthLayout role="vendor">
      <LoginForm role="vendor" />
    </AuthLayout>
  )
}
