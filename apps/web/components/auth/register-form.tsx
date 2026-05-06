'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api/auth'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    companyName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
    email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const { tenant } = useAuthStore()
  const setStore = useAuthStore.setState

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  useEffect(() => {
    if (tenant) router.replace(`/${tenant.slug}/inbox`)
  }, [tenant, router])

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await authApi.register({
        name: data.name,
        companyName: data.companyName,
        email: data.email,
        password: data.password,
      })
      setStore({
        user: response.user,
        tenant: response.tenant,
        accessToken: response.accessToken,
        _refreshToken: response.refreshToken,
        error: null,
      })
    } catch (err: unknown) {
      const message = getErrorMessage(err) ?? 'Erro ao criar conta. Tente novamente.'
      setError('root', { message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Nome completo
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="João Silva"
          disabled={isSubmitting}
          {...register('name')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="companyName" className="block text-sm font-medium text-foreground">
          Nome da empresa
        </label>
        <input
          id="companyName"
          type="text"
          autoComplete="organization"
          placeholder="Minha Empresa Ltda"
          disabled={isSubmitting}
          {...register('companyName')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        {errors.companyName && (
          <p className="text-xs text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="reg-email" className="block text-sm font-medium text-foreground">
          E-mail
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          disabled={isSubmitting}
          {...register('email')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="reg-password" className="block text-sm font-medium text-foreground">
          Senha
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          disabled={isSubmitting}
          {...register('password')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
          Confirmar senha
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repita sua senha"
          disabled={isSubmitting}
          {...register('confirmPassword')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {errors.root && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errors.root.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Criar conta grátis
      </button>
    </form>
  )
}

function getErrorMessage(err: unknown): string | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response
    return response?.data?.message ?? null
  }
  return null
}
