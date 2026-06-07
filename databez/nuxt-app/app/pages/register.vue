<!-- pages/register.vue -->
<template>
  <div class="page">
    <div class="container" style="max-width:420px; margin: 3rem auto;">
      <div class="card">
        <h1 class="page-title" style="font-size:1.4rem; margin-bottom:1.5rem;">Registrace</h1>

        <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div class="form-group">
          <label>Jméno</label>
          <input v-model="displayName" type="text" class="form-control" placeholder="Jan Novák" />
        </div>
        <div class="form-group">
          <label>E-mail</label>
          <input v-model="email" type="email" class="form-control" placeholder="vas@email.cz" />
        </div>
        <div class="form-group">
          <label>Heslo <span class="text-muted">(min. 6 znaků)</span></label>
          <input v-model="password" type="password" class="form-control" placeholder="••••••••" />
        </div>

        <button class="btn btn-primary" style="width:100%" :disabled="loading" @click="register">
          {{ loading ? 'Registruji...' : 'Vytvořit účet' }}
        </button>

        <p class="text-muted mt-1" style="text-align:center; margin-top:1rem;">
          Máte účet? <NuxtLink to="/login">Přihlásit se</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

const supabase = useSupabaseClient()
const router = useRouter()
const displayName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function register() {
  if (!displayName.value || !email.value || !password.value) {
    errorMsg.value = 'Vyplňte všechna pole.'; return
  }
  if (password.value.length < 6) {
    errorMsg.value = 'Heslo musí mít alespoň 6 znaků.'; return
  }
  loading.value = true; errorMsg.value = ''

  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: { data: { display_name: displayName.value } }
  })

  if (error) { errorMsg.value = error.message; loading.value = false; return }
  successMsg.value = 'Účet vytvořen! Nyní se přihlaste.'
  loading.value = false
  setTimeout(() => router.push('/login'), 1500)
}
</script>