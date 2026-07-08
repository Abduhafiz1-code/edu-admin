<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
}>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': open }">
    <div class="modal-box">
      <h3 class="font-display font-bold text-lg">{{ title }}</h3>
      <p class="py-3 text-sm opacity-80">{{ message }}</p>
      <div class="modal-action">
        <button class="btn btn-ghost" @click="emit('cancel')">Bekor qilish</button>
        <button class="btn btn-error text-white" @click="emit('confirm')">Ha, o'chirish</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="emit('cancel')">yopish</button>
    </form>
  </dialog>
</template>
