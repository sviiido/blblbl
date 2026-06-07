<!-- pages/login.vue -->
<template>
  <div class="page">
    <div class="container" style="max-width:420px; margin: 3rem auto;">
      <div class="card">
        <h1 class="page-title" style="font-size:1.4rem; margin-bottom:1.5rem;">Přihlášení</h1>

        <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>

        <div class="form-group">
          <label>E-mail</label>
          <input v-model="email" type="email" class="form-control" placeholder="vas@email.cz" />
        </div>
        <div class="form-group">
          <label>Heslo</label>
          <input v-model="password" type="password" class="form-control" placeholder="••••••••" />
        </div>

        <button class="btn btn-primary" style="width:100%" :disabled="loading" @click="login">
          {{ loading ? 'Přihlašuji...' : 'Přihlásit se' }}
        </button>

        <p class="text-muted mt-1" style="text-align:center; margin-top:1rem;">
          Nemáte účet? <NuxtLink to="/register">Registrace</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

const supabase = useSupabaseClient()
const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function login() {
  if (!email.value || !password.value) { errorMsg.value = 'Vyplňte všechna pole.'; return }
  loading.value = true; errorMsg.value = ''
  const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
  if (error) { errorMsg.value = error.message; loading.value = false; return }
  router.push('/resources')
}
</script>