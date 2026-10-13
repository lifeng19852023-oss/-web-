<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()

const username = ref('')
const password = ref('')

async function handleLogin() {
  try {
    await userStore.loginUser(
      username.value,
      password.value
    )

    console.log('登录成功')

    // 登录成功，跳转首页
    router.push('/')
  } catch (error) {
    console.error('登录失败', error)
  }
}
</script>

<template>
  <div class="login">
    <h2>养老机构管理系统</h2>

    <div>
      <input
        v-model="username"
        placeholder="账号"
      />
    </div>

    <div>
      <input
        v-model="password"
        type="password"
        placeholder="密码"
      />
    </div>

    <button @click="handleLogin">
      登录
    </button>
  </div>
</template>