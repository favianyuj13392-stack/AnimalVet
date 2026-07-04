import { LoginForm } from "@/domains/users/autenticacion/components/LoginForm";

export default function LoginPage() {
  // Ya no necesitamos <main> con flex y centrado aquí, el LoginForm hará todo.
  return <LoginForm />;
}