```vue
<script setup lang="ts">
import Sidebar from '../components/layout/Sidebar.vue'
import Header from '@/components/layout/header.vue'
</script>

<template>
  <div class="layout">
    <Sidebar title="养老机构管理系统" />

    <main class="main">
      <Header />

      <section class="content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f5f7fa;
}
.main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
.content {
  flex: 1;
  padding: 24px;
  overflow: auto;
}
</style>
```