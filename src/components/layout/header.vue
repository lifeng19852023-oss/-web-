```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { SwitchButton, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

function handleLogout() {
  userStore.logout()
  router.replace('/login')
}
</script>

<template>
  <header class="header">
    <div class="header-left">
      <span class="page-title">养老机构管理系统</span>
      <el-tag type="info" effect="plain" size="small">
        管理后台
      </el-tag>
    </div>

    <div class="header-right">
      <div class="user-info">
        <el-avatar :size="34" :icon="UserFilled" />
        <div class="user-text">
          <span class="username">
            {{ userStore.userInfo?.username || '当前用户' }}
          </span>
          <span class="user-role">
            {{ userStore.userInfo?.role || '用户' }}
          </span>
        </div>
      </div>

      <el-divider direction="vertical" />

      <el-button
        type="danger"
        plain
        :icon="SwitchButton"
        @click="handleLogout"
      >
        退出登录
      </el-button>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}
.header-left,
.header-right,
.user-info {
  display: flex;
  align-items: center;
}
.header-left {
  gap: 12px;
}
.page-title {
  color: #303133;
  font-size: 17px;
  font-weight: 600;
}
.header-right {
  gap: 16px;
}
.user-info {
  gap: 10px;
}
.user-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.username {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}
.user-role {
  color: #909399;
  font-size: 12px;
}
</style>
```