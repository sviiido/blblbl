<!-- pages/admin.vue -->
<template>
  <div class="page">
    <div class="container">
      <h1 class="page-title">Správa uživatelů</h1>

      <div v-if="!isAdmin" class="alert alert-error">Přístup odepřen. Pouze pro administrátory.</div>

      <template v-else>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div v-if="loading" class="empty-state">Načítám...</div>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Jméno</th>
                <th>E-mail</th>
                <th>Role</th>
                <th>Registrace</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in profiles" :key="p.id">
                <td>{{ p.display_name }}</td>
                <td>{{ p.email }}</td>
                <td>
                  <span :class="p.role === 'admin' ? 'badge badge-info' : 'badge badge-muted'">
                    {{ p.role }}
                  </span>
                </td>
                <td class="text-muted">{{ fmtDate(p.created_at) }}</td>
                <td>
                  <button
                    class="btn btn-secondary btn-sm"
                    :disabled="p.id === currentUserId"
                    @click="toggleRole(p)"
                  >
                    {{ p.role === 'admin' ? 'Degradovat' : 'Povýšit na admin' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { isAdmin } = useProfile()

const profiles = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const successMsg = ref('')

const currentUserId = computed(() => user.value?.id)

onMounted(async () => {
  if (!isAdmin.value) return
  loading.value = true
  const { data, error: err } = await supabase.from('profiles').select('*').order('created_at')
  if (err) error.value = err.message
  else profiles.value = data
  loading.value = false
})

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('cs-CZ')
}

async function toggleRole(p: any) {
  const newRole = p.role === 'admin' ? 'student' : 'admin'
  const { error: err } = await supabase.from('profiles').update({ role: newRole }).eq('id', p.id)
  if (err) { error.value = err.message; return }
  p.role = newRole
  successMsg.value = `Role uživatele ${p.display_name} změněna na ${newRole}.`
}
</script>