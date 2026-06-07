<!-- pages/reservations.vue -->
<template>
  <div class="page">
    <div class="container">
      <h1 class="page-title">{{ isAdmin ? 'Všechny rezervace' : 'Moje rezervace' }}</h1>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

      <!-- Filtr -->
      <div class="search-bar">
        <input v-model="search" type="text" class="form-control" placeholder="Hledat zdroj nebo uživatele..." />
        <select v-model="filterStatus" class="form-control" style="max-width:160px">
          <option value="">Všechny stavy</option>
          <option value="active">Aktivní</option>
          <option value="cancelled">Zrušené</option>
        </select>
      </div>

      <div v-if="loading" class="empty-state">Načítám...</div>

      <div v-else-if="filtered.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Zdroj</th>
              <th v-if="isAdmin">Uživatel</th>
              <th>Začátek</th>
              <th>Konec</th>
              <th>Stav</th>
              <th>Poznámka</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filtered" :key="r.id">
              <td><strong>{{ r.resources?.name }}</strong><br><span class="text-muted" style="font-size:0.8rem">{{ r.resources?.type }}</span></td>
              <td v-if="isAdmin">{{ r.profiles?.display_name }}<br><span class="text-muted" style="font-size:0.8rem">{{ r.profiles?.email }}</span></td>
              <td>{{ fmtDate(r.start_time) }}</td>
              <td>{{ fmtDate(r.end_time) }}</td>
              <td>
                <span :class="r.status === 'active' ? 'badge badge-success' : 'badge badge-muted'">
                  {{ r.status === 'active' ? 'Aktivní' : 'Zrušená' }}
                </span>
              </td>
              <td class="text-muted">{{ r.note ?? '—' }}</td>
              <td>
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                  <button v-if="r.status === 'active'" class="btn btn-secondary btn-sm" @click="openEdit(r)">Upravit</button>
                  <button v-if="r.status === 'active'" class="btn btn-danger btn-sm" @click="doCancel(r.id)">Zrušit</button>
                  <button v-if="isAdmin" class="btn btn-danger btn-sm" @click="doDelete(r.id)">Smazat</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <p>Žádné rezervace nenalezeny.</p>
        <NuxtLink to="/resources" class="btn btn-primary" style="margin-top:1rem">Rezervovat zdroj</NuxtLink>
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Upravit rezervaci</span>
          <button class="btn btn-secondary btn-sm" @click="showModal=false">✕</button>
        </div>
        <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
        <div class="form-group">
          <label>Začátek *</label>
          <input v-model="editForm.start_time" type="datetime-local" class="form-control" />
        </div>
        <div class="form-group">
          <label>Konec *</label>
          <input v-model="editForm.end_time" type="datetime-local" class="form-control" />
        </div>
        <div class="form-group">
          <label>Poznámka</label>
          <input v-model="editForm.note" type="text" class="form-control" />
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal=false">Zrušit</button>
          <button class="btn btn-primary" :disabled="saving" @click="saveEdit">
            {{ saving ? 'Ukládám...' : 'Uložit' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reservation } from '~/composables/useReservations'

definePageMeta({ middleware: 'auth' })

const { isAdmin } = useProfile()
const { reservations, loading, error, fetchReservations, updateReservation, cancelReservation, deleteReservation } = useReservations()

const search = ref('')
const filterStatus = ref('')
const successMsg = ref('')

onMounted(fetchReservations)

const filtered = computed(() => reservations.value.filter(r => {
  const q = search.value.toLowerCase()
  const matchSearch = !q || r.resources?.name?.toLowerCase().includes(q) || r.profiles?.display_name?.toLowerCase().includes(q)
  const matchStatus = !filterStatus.value || r.status === filterStatus.value
  return matchSearch && matchStatus
}))

function fmtDate(d: string) {
  return new Date(d).toLocaleString('cs-CZ', { dateStyle: 'short', timeStyle: 'short' })
}

// Cancel
async function doCancel(id: string) {
  if (!confirm('Opravdu zrušit rezervaci?')) return
  try { await cancelReservation(id); successMsg.value = 'Rezervace zrušena.' } catch (e: any) { error.value = e.message }
}

// Delete (admin)
async function doDelete(id: string) {
  if (!confirm('Smazat rezervaci natrvalo?')) return
  try { await deleteReservation(id); successMsg.value = 'Smazáno.' } catch (e: any) { error.value = e.message }
}

// Edit modal
const showModal = ref(false)
const saving = ref(false)
const modalError = ref('')
const editingId = ref('')
const editForm = reactive({ start_time: '', end_time: '', note: '', resource_id: '' })

function openEdit(r: Reservation) {
  editingId.value = r.id
  editForm.resource_id = r.resource_id
  editForm.start_time = r.start_time.slice(0, 16)
  editForm.end_time = r.end_time.slice(0, 16)
  editForm.note = r.note ?? ''
  modalError.value = ''; showModal.value = true
}

async function saveEdit() {
  if (!editForm.start_time || !editForm.end_time) { modalError.value = 'Vyplňte časy.'; return }
  if (editForm.end_time <= editForm.start_time) { modalError.value = 'Konec musí být po začátku.'; return }
  saving.value = true; modalError.value = ''
  try {
    await updateReservation(editingId.value, {
      resource_id: editForm.resource_id,
      start_time: new Date(editForm.start_time).toISOString(),
      end_time: new Date(editForm.end_time).toISOString(),
      note: editForm.note || null,
    })
    showModal.value = false
    successMsg.value = 'Rezervace aktualizována.'
  } catch (e: any) {
    modalError.value = e.message
  } finally {
    saving.value = false
  }
}
</script>