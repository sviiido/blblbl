<!-- pages/resources.vue -->
<template>
  <div class="page">
    <div class="container">
      <div class="flex-between" style="margin-bottom:1.5rem;">
        <h1 class="page-title" style="margin:0;">Dostupné zdroje</h1>
        <button v-if="isAdmin" class="btn btn-primary" @click="openCreate">+ Přidat zdroj</button>
      </div>

      <!-- Filtry / Vyhledávání -->
      <div class="search-bar">
        <input v-model="search" type="text" class="form-control" placeholder="Hledat název..." />
        <select v-model="filterType" class="form-control" style="max-width:180px">
          <option value="">Všechny typy</option>
          <option value="classroom">Učebna</option>
          <option value="equipment">Vybavení</option>
          <option value="other">Ostatní</option>
        </select>
        <select v-model="filterAvailable" class="form-control" style="max-width:160px">
          <option value="">Dostupnost: vše</option>
          <option value="true">Dostupné</option>
          <option value="false">Nedostupné</option>
        </select>
        <button class="btn btn-secondary" @click="load">Filtrovat</button>
      </div>

      <!-- Alert -->
      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <!-- Loading -->
      <div v-if="loading" class="empty-state">Načítám...</div>

      <!-- Grid karet -->
      <div v-else-if="resources.length" class="card-grid">
        <div v-for="r in resources" :key="r.id" class="card">
          <div class="flex-between" style="margin-bottom:0.5rem;">
            <strong>{{ r.name }}</strong>
            <span :class="r.available ? 'badge badge-success' : 'badge badge-danger'">
              {{ r.available ? 'Dostupné' : 'Nedostupné' }}
            </span>
          </div>
          <span class="badge badge-info" style="margin-bottom:0.5rem;">{{ typeLabel(r.type) }}</span>
          <p class="text-muted" style="font-size:0.88rem; margin:0.4rem 0;">{{ r.description }}</p>
          <p class="text-muted" style="font-size:0.85rem;">📍 {{ r.location }} &nbsp;|&nbsp; Počet: {{ r.quantity }}</p>

          <div style="display:flex; gap:0.5rem; margin-top:1rem; flex-wrap:wrap;">
            <NuxtLink :to="`/reserve/${r.id}`" class="btn btn-primary btn-sm" v-if="user">Rezervovat</NuxtLink>
            <template v-if="isAdmin">
              <button class="btn btn-secondary btn-sm" @click="openEdit(r)">Upravit</button>
              <button class="btn btn-danger btn-sm" @click="confirmDelete(r)">Smazat</button>
            </template>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>Žádné zdroje nenalezeny.</p>
      </div>
    </div>

    <!-- Modal: Přidat / Upravit -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">{{ editing ? 'Upravit zdroj' : 'Přidat zdroj' }}</span>
          <button class="btn btn-secondary btn-sm" @click="showModal=false">✕</button>
        </div>

        <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>

        <div class="form-group">
          <label>Název *</label>
          <input v-model="form.name" class="form-control" placeholder="Učebna A101" />
        </div>
        <div class="form-group">
          <label>Typ *</label>
          <select v-model="form.type" class="form-control">
            <option value="classroom">Učebna</option>
            <option value="equipment">Vybavení</option>
            <option value="other">Ostatní</option>
          </select>
        </div>
        <div class="form-group">
          <label>Popis</label>
          <input v-model="form.description" class="form-control" placeholder="Volitelný popis" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Umístění</label>
            <input v-model="form.location" class="form-control" placeholder="Budova A, 1. patro" />
          </div>
          <div class="form-group">
            <label>Počet *</label>
            <input v-model.number="form.quantity" type="number" min="1" class="form-control" />
          </div>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="form.available" style="margin-right:0.4rem;" />
            Dostupné
          </label>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal=false">Zrušit</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            {{ saving ? 'Ukládám...' : (editing ? 'Uložit změny' : 'Přidat') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete -->
    <div v-if="showDeleteConfirm" class="modal-overlay">
      <div class="modal" style="max-width:380px;">
        <div class="modal-header">
          <span class="modal-title">Smazat zdroj?</span>
        </div>
        <p>Opravdu chcete smazat <strong>{{ toDelete?.name }}</strong>? Tato akce je nevratná.</p>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteConfirm=false">Zrušit</button>
          <button class="btn btn-danger" :disabled="saving" @click="doDelete">Smazat</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Resource } from '~/composables/useResources'

definePageMeta({ middleware: 'auth' })

const user = useSupabaseUser()
const { isAdmin } = useProfile()
const { resources, loading, error, fetchResources, createResource, updateResource, deleteResource } = useResources()

const search = ref('')
const filterType = ref('')
const filterAvailable = ref('')

async function load() {
  await fetchResources({
    search: search.value || undefined,
    type: filterType.value || undefined,
    available: filterAvailable.value === '' ? undefined : filterAvailable.value === 'true',
  })
}

onMounted(load)

function typeLabel(t: string) {
  return { classroom: '🏫 Učebna', equipment: '🔧 Vybavení', other: '📦 Ostatní' }[t] ?? t
}

// Modal
const showModal = ref(false)
const editing = ref<Resource | null>(null)
const saving = ref(false)
const modalError = ref('')
const form = reactive({ name: '', type: 'classroom' as Resource['type'], description: '', location: '', quantity: 1, available: true })

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', type: 'classroom', description: '', location: '', quantity: 1, available: true })
  modalError.value = ''; showModal.value = true
}

function openEdit(r: Resource) {
  editing.value = r
  Object.assign(form, { name: r.name, type: r.type, description: r.description ?? '', location: r.location ?? '', quantity: r.quantity, available: r.available })
  modalError.value = ''; showModal.value = true
}

async function save() {
  if (!form.name || !form.quantity) { modalError.value = 'Vyplňte povinná pole.'; return }
  saving.value = true; modalError.value = ''
  try {
    if (editing.value) {
      await updateResource(editing.value.id, { ...form })
    } else {
      await createResource({ ...form })
    }
    showModal.value = false
  } catch (e: any) {
    modalError.value = e.message
  } finally {
    saving.value = false
  }
}

// Delete
const showDeleteConfirm = ref(false)
const toDelete = ref<Resource | null>(null)

function confirmDelete(r: Resource) { toDelete.value = r; showDeleteConfirm.value = true }

async function doDelete() {
  if (!toDelete.value) return
  saving.value = true
  try {
    await deleteResource(toDelete.value.id)
    showDeleteConfirm.value = false
  } catch (e: any) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>