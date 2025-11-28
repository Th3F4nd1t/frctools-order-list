<template>
  <div>
    <UAuthForm
      :fields="fields"
      :schema="schema"
      title="Create an account"
      :submit="{ label: 'Create account' }"
      @submit="onSubmit"
    >
      <template #description>
        Already have an account?
        <ULink
          to="/auth/login"
          class="text-primary font-medium"
        >Login</ULink>.
      </template>

      <template #footer>
        By signing up, you agree to our
        <ULink
          to="/docs/privacy"
          class="text-primary font-medium"
        >Privacy Policy</ULink>.
      </template>
    </UAuthForm>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()
const { signUp } = useAuth()

const redirectTarget = computed(() => {
  const redirect = route.query.redirect

  if (Array.isArray(redirect)) {
    return redirect[0]?.startsWith('/') ? redirect[0] : '/app'
  }

  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect
  }

  return '/app'
})

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email('Invalid email'),
  password: z.string()
})

type Schema = z.output<typeof schema>

const toast = useToast()
async function onSubmit(event: FormSubmitEvent<Schema>) {
  const { data, error } = await signUp.email({
    name: event.data.name,
    email: event.data.email,
    password: event.data.password
  })
  if (data) {
    toast.add({
      title: 'Success',
      description: 'You have successfully signed up!',
      color: 'success'
    })
    await useAuth().fetchSession()
    await navigateTo(redirectTarget.value)
  }

  if (error) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'error'
    })
  }
}
const fields = [
  {
    name: 'name',
    type: 'text' as const,
    label: 'Name',
    placeholder: 'Enter your name',
    required: true
  },
  {
    name: 'email',
    type: 'text' as const,
    label: 'Email',
    placeholder: 'Enter your email',
    required: true
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password' as const,
    placeholder: 'Enter your password'
  }
]
</script>
