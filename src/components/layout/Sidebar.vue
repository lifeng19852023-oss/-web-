```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  House,
  User,
  OfficeBuilding,
  Management,
  Calendar,
  FirstAidKit,
  Setting
} from '@element-plus/icons-vue'

defineProps<{ title: string }>()

const route = useRoute()
const userStore = useUserStore()

const menus = [
  { title: '首页', path: '/home', permission: 'elderly:view', icon: House },
  { title: '老人管理', path: '/elderly', permission: 'elderly:view', icon: User },
  { title: '房间管理', path: '/room', permission: 'room:view', icon: OfficeBuilding },
  { title: '床位管理', path: '/bed', permission: 'bed:view', icon: Management },
  { title: '入住管理', path: '/admission', permission: 'admission:view', icon: Calendar },
  { title: '护理管理', path: '/care', permission: 'care:manage', icon: FirstAidKit },
  { title: '用户管理', path: '/user', permission: 'user:manage', icon: Setting }
]

const showMenus = computed(() =>
  menus.filter(menu => userStore.hasPermission(menu.permission))
)
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <el-icon :size="28" color="#409eff">
        <FirstAidKit />
      </el-icon>
      <h2>{{ title }}</h2>
    </div>

    <el-menu
      :default-active="route.path"
      router
      class="sidebar-menu"
    >
      <el-menu-item
        v-for="menu in showMenus"
        :key="menu.path"
        :index="menu.path"
      >
        <el-icon>
          <component :is="menu.icon" />
        </el-icon>
        <span>{{ menu.title }}</span>
      </el-menu-item>
    </el-menu>

    <div class="sidebar-footer">
      养老机构管理系统
      <span>管理平台</span>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 230px;
  min-width: 230px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e4e7ed;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 64px;
  padding: 0 20px;
  border-bottom: 1px solid #f0f2f5;
}
.brand h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}
.sidebar-menu {
  flex: 1;
  border-right: none;
  padding: 12px 10px;
}
.sidebar-menu :deep(.el-menu-item) {
  height: 46px;
  margin-bottom: 6px;
  border-radius: 6px;
}
.sidebar-menu :deep(.el-menu-item.is-active) {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 600;
}
.sidebar-menu :deep(.el-menu-item:hover) {
  background: #f5f7fa;
}
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #f0f2f5;
  color: #606266;
  font-size: 12px;
  text-align: center;
}
.sidebar-footer span {
  display: block;
  margin-top: 5px;
  color: #a8abb2;
}
</style>
```