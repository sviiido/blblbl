<!-- components/AppNavbar.vue -->
<template>
  <nav class="navbar">
    <div class="container navbar-inner">
      <NuxtLink to="/" class="navbar-brand">📚 RezervaceApp</NuxtLink>

      <div class="navbar-links">
        <template v-if="user">
          <NuxtLink to="/resources">Zdroje</NuxtLink>
          <NuxtLink to="/reservations">Rezervace</NuxtLink>
          <NuxtLink v-if="isAdmin" to="/admin">Admin</NuxtLink>
          <span class="text-muted" style="font-size:0.85rem">{{ profile?.display_name }}</span>
          <button class="btn btn-secondary btn-sm" @click="logout">Odhlásit</button>
        </template>
        <template v-else>
          <NuxtLink to="/login">Přihlásit</NuxtLink>
          <NuxtLink to="/register" class="btn btn-primary btn-sm">Registrace</NuxtLink>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { profile, isAdmin } = useProfile()
const router = useRouter()

async function logout() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>