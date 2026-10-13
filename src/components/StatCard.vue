<script setup lang="ts">
defineProps<{
  title: string
  value: number | string
}>()
</script>

<template>
  <div class="stat-card">
    <div class="stat-title">
      {{ title }}
    </div>

    <div class="stat-value">
      {{ value }}
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-title {
  color: #666;
  font-size: 14px;
}

.stat-value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: bold;
}
</style>