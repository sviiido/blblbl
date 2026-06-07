<!-- pages/index.vue -->
<template>
  <div class="page">
    <div class="container">
      <div style="text-align:center; padding: 4rem 1rem;">
        <h1 style="font-size:2.5rem; font-weight:800; margin-bottom:1rem;">
          📚 Rezervační systém
        </h1>
        <p class="text-muted" style="font-size:1.1rem; max-width:500px; margin:0 auto 2rem;">
          Rezervujte učebny a vybavení rychle a jednoduše. Bez kolizí, bez stresu.
        </p>
        <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
          <NuxtLink to="/resources" class="btn btn-primary">Prohlédnout zdroje</NuxtLink>
          <NuxtLink v-if="!user" to="/register" class="btn btn-secondary">Registrovat se</NuxtLink>
          <NuxtLink v-if="user" to="/reservations" class="btn btn-secondary">Moje rezervace</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
</script>