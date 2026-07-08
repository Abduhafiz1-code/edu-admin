<script setup lang="ts">
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'

const route = useRoute()
</script>

<template>
  <div data-theme="eduverse">
    <NavBar v-if="!route.meta.public">
      <RouterView />
    </NavBar>
    <RouterView v-else />
  </div>
</template>
