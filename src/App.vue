<script setup lang="ts">

import { globalLoading } from './utils/loading'

</script>


<template>

  <div
    v-if="globalLoading"
    class="global-loading"
  >
    正在加载...
  </div>

  <router-view />

</template>


<style scoped>

.global-loading {
  position: fixed;

  top: 0;
  left: 0;

  width: 100%;

  padding: 10px;

  background: #409eff;

  color: white;

  text-align: center;

  z-index: 9999;
}

</style>