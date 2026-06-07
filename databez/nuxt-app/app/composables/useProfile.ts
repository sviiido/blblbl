// composables/useProfile.ts
export const useProfile = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const profile = useState<any>('profile', () => null)
  const isAdmin = computed(() => profile.value?.role === 'admin')

  // Načte profil aktuálního uživatele
  async function fetchProfile() {
    if (!user.value) { profile.value = null; return }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    profile.value = data
  }

  // Sleduj přihlášení/odhlášení
  watch(user, fetchProfile, { immediate: true })

  return { profile, isAdmin, fetchProfile }
}