<!-- pages/reserve/[id].vue -->
<template>
  <div class="page">
    <div class="container" style="max-width:520px; margin: 2rem auto;">
      <NuxtLink to="/resources" class="text-muted" style="font-size:0.9rem;">← Zpět na zdroje</NuxtLink>

      <div class="card" style="margin-top:1rem;">
        <h1 class="page-title" style="font-size:1.3rem;">
          Rezervovat: {{ resource?.name ?? '...' }}
        </h1>

        <div v-if="resource" style="margin-bottom:1.25rem;">
          <span class="badge badge-info">{{ typeLabel(resource.type) }}</span>
          <span v-if="!resource.available" class="badge badge-danger" style="margin-left:0.5rem;">Momentálně nedostupné</span>
          <p class="text-muted" style="margin-top:0.5rem; font-size:0.88rem;">{{ resource.description }}</p>
          <p class="text-muted" style="font-size:0.85rem;">📍 {{ resource.location }}</p>
        </div>

        <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div class="form-group">
          <label>Začátek rezervace *</label>
          <input v-model="startTime" type="datetime-local" class="form-control" :min="minDate" />
        </div>
        <div class="form-group">
          <label>Konec rezervace *</label>
          <input v-model="endTime" type="datetime-local" class="form-control" :min="startTime || minDate" />
        </div>
        <div class="form-group">
          <label>Poznámka</label>
          <input v-model="note" type="text" class="form-control" placeholder="Volitelná poznámka" />
        </div>

        <div class="modal-footer" style="margin-top:0;">
          <NuxtLink to="/resources" class="btn btn-secondary">Zrušit</NuxtLink>
          <button class="btn btn-primary" :disabled="saving" @click="submit">
            {{ saving ? 'Rezervuji...' : 'Potvrdit rezervaci' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const { createReservation } = useReservations()

const resource = ref<any>(null)
const startTime = ref('')
const endTime = ref('')
const note = ref('')
const saving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// Minimální datum = teď
const minDate = computed(() => new Date().toISOString().slice(0, 16))

// Načti zdroj
onMounted(async () => {
  const { data } = await supabase
    .from('resources')
    .select('*')
    .eq('id', route.params.id)
    .single()
  resource.value = data
})

function typeLabel(t: string) {
  return { classroom: '🏫 Učebna', equipment: '🔧 Vybavení', other: '📦 Ostatní' }[t] ?? t
}

async function submit() {
  if (!startTime.value || !endTime.value) { errorMsg.value = 'Vyplňte čas začátku a konce.'; return }
  if (endTime.value <= startTime.value) { errorMsg.value = 'Konec musí být po začátku.'; return }

  saving.value = true; errorMsg.value = ''
  try {
    await createReservation({
      resource_id: route.params.id as string,
      start_time: new Date(startTime.value).toISOString(),
      end_time: new Date(endTime.value).toISOString(),
      note: note.value || undefined,
    })
    successMsg.value = 'Rezervace vytvořena! Přesměrovávám...'
    setTimeout(() => router.push('/reservations'), 1500)
  } catch (e: any) {
    errorMsg.value = e.message
  } finally {
    saving.value = false
  }
}
</script>