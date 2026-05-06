import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Entrar — ZapTend' }

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">ZapTend</h1>
          <p className="text-sm text-muted-foreground">Entre na sua conta para continuar</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Criar conta grátis
          </Link>
        </p>
      </div>
    </main>
  )
}
