// composables/useResources.ts
export interface Resource {
  id: string
  name: string
  type: 'classroom' | 'equipment' | 'other'
  description: string | null
  location: string | null
  quantity: number
  available: boolean
  created_at: string
}

export const useResources = () => {
  const supabase = useSupabaseClient()
  const resources = ref<Resource[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // READ – načte všechny zdroje s volitelným filtrem
  async function fetchResources(filters?: { search?: string; type?: string; available?: boolean }) {
    loading.value = true; error.value = null
    let query = supabase.from('resources').select('*').order('name')

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.available !== undefined) {
      query = query.eq('available', filters.available)
    }

    const { data, error: err } = await query
    if (err) error.value = err.message
    else resources.value = data as Resource[]
    loading.value = false
  }

  // CREATE
  async function createResource(payload: Omit<Resource, 'id' | 'created_at'>) {
    const { data, error: err } = await supabase
      .from('resources')
      .insert(payload)
      .select()
      .single()
    if (err) throw new Error(err.message)
    resources.value.unshift(data as Resource)
    return data
  }

  // UPDATE
  async function updateResource(id: string, payload: Partial<Resource>) {
    const { data, error: err } = await supabase
      .from('resources')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (err) throw new Error(err.message)
    const idx = resources.value.findIndex(r => r.id === id)
    if (idx !== -1) resources.value[idx] = data as Resource
    return data
  }

  // DELETE
  async function deleteResource(id: string) {
    const { error: err } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)
    if (err) throw new Error(err.message)
    resources.value = resources.value.filter(r => r.id !== id)
  }

  return { resources, loading, error, fetchResources, createResource, updateResource, deleteResource }
}