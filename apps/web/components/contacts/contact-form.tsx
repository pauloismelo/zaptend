'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useContactsStore } from '@/stores/contacts.store'

const contactFormSchema = z.object({
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos numéricos'),
  name: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  company: z.string().optional(),
  tags: z.string().optional(),
})

type ContactFormData = z.infer<typeof contactFormSchema>

interface ContactFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ContactForm({ onSuccess, onCancel }: ContactFormProps) {
  const { createContact } = useContactsStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ContactFormData>({ resolver: zodResolver(contactFormSchema) })

  const onSubmit = async (data: ContactFormData) => {
    try {
      const tags = data.tags
        ? data.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : []

      await createContact({
        phone: data.phone,
        name: data.name || undefined,
        email: data.email || undefined,
        company: data.company || undefined,
        tags,
      })
      onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar contato'
      setError('root', { message })
    }
  }

  const inputClass =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

  const labelClass = 'block text-sm font-medium text-foreground mb-1'

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="cf-phone" className={labelClass}>
          Telefone <span className="text-destructive">*</span>
        </label>
        <input
          id="cf-phone"
          type="tel"
          placeholder="11999990000"
          disabled={isSubmitting}
          {...register('phone')}
          className={inputClass}
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="cf-name" className={labelClass}>
          Nome
        </label>
        <input
          id="cf-name"
          type="text"
          placeholder="Nome completo"
          disabled={isSubmitting}
          {...register('name')}
          className={inputClass}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="cf-email" className={labelClass}>
          E-mail
        </label>
        <input
          id="cf-email"
          type="email"
          placeholder="contato@empresa.com.br"
          disabled={isSubmitting}
          {...register('email')}
          className={inputClass}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="cf-company" className={labelClass}>
          Empresa
        </label>
        <input
          id="cf-company"
          type="text"
          placeholder="Nome da empresa"
          disabled={isSubmitting}
          {...register('company')}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="cf-tags" className={labelClass}>
          Tags
        </label>
        <input
          id="cf-tags"
          type="text"
          placeholder="vip, cliente, lead (separados por vírgula)"
          disabled={isSubmitting}
          {...register('tags')}
          className={inputClass}
        />
        <p className="mt-0.5 text-xs text-muted-foreground">Separe as tags por vírgula</p>
      </div>

      {errors.root && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errors.root.message}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar contato
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
