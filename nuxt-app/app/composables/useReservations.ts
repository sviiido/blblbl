// composables/useReservations.ts
export interface Reservation {
  id: string
  resource_id: string
  user_id: string
  start_time: string
  end_time: string
  status: 'active' | 'cancelled'
  note: string | null
  created_at: string
  resources?: { name: string; type: string }
  profiles?: { display_name: string; email: string }
}

export const useReservations = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { isAdmin } = useProfile()

  const reservations = ref<Reservation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // READ
  async function fetchReservations() {
    loading.value = true; error.value = null

    let query = supabase
      .from('reservations')
      .select('*, resources(name, type), profiles(display_name, email)')
      .order('start_time', { ascending: false })

    // Student vidí jen své, admin vidí vše (RLS to taky hlídá)
    if (!isAdmin.value) {
      query = query.eq('user_id', user.value!.id)
    }

    const { data, error: err } = await query
    if (err) error.value = err.message
    else reservations.value = data as Reservation[]
    loading.value = false
  }

  // Kontrola kolize přes DB funkci
  async function checkConflict(
    resourceId: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<boolean> {
    const { data, error: err } = await supabase.rpc('check_reservation_conflict', {
      p_resource_id: resourceId,
      p_start_time: startTime,
      p_end_time: endTime,
      p_exclude_id: excludeId ?? null,
    })
    if (err) throw new Error(err.message)
    return data as boolean
  }

  // CREATE
  async function createReservation(payload: {
    resource_id: string
    start_time: string
    end_time: string
    note?: string
  }) {
    // Kontrola kolize
    const conflict = await checkConflict(payload.resource_id, payload.start_time, payload.end_time)
    if (conflict) throw new Error('Zdroj je v tomto čase již rezervován. Zvolte jiný časový slot.')

    const { data, error: err } = await supabase
      .from('reservations')
      .insert({ ...payload, user_id: user.value!.id, status: 'active' })
      .select('*, resources(name, type), profiles(display_name, email)')
      .single()

    if (err) throw new Error(err.message)
    reservations.value.unshift(data as Reservation)
    return data
  }

  // UPDATE (status nebo note)
  async function updateReservation(id: string, payload: Partial<Reservation>) {
    // Kontrola kolize při přeplánování
    if (payload.start_time && payload.end_time && payload.resource_id) {
      const conflict = await checkConflict(payload.resource_id, payload.start_time, payload.end_time, id)
      if (conflict) throw new Error('Zdroj je v tomto čase již rezervován.')
    }

    const { data, error: err } = await supabase
      .from('reservations')
      .update(payload)
      .eq('id', id)
      .select('*, resources(name, type), profiles(display_name, email)')
      .single()

    if (err) throw new Error(err.message)
    const idx = reservations.value.findIndex(r => r.id === id)
    if (idx !== -1) reservations.value[idx] = data as Reservation
    return data
  }

  // CANCEL (soft delete – nastaví status na cancelled)
  async function cancelReservation(id: string) {
    return updateReservation(id, { status: 'cancelled' })
  }

  // DELETE (pouze admin)
  async function deleteReservation(id: string) {
    const { error: err } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)
    if (err) throw new Error(err.message)
    reservations.value = reservations.value.filter(r => r.id !== id)
  }

  return {
    reservations, loading, error,
    fetchReservations, createReservation, updateReservation, cancelReservation, deleteReservation, checkConflict
  }
}