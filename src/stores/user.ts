import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  // 保存Token
  const token = ref(
    localStorage.getItem('token') || ''
  )

  // 保存用户信息
  const userInfo = ref(
    JSON.parse(
      localStorage.getItem('userInfo') || 'null'
    )
  )

  // 保存用户权限
  const permissions = ref<string[]>(
    JSON.parse(
      localStorage.getItem('permissions') || '[]'
    )
  )

  // 用户登录
  async function loginUser(
    username: string,
    password: string
  ) {
    const res = await login({
      username,
      password
    })

    // 保存Token
    token.value = res.data.data.token

    // 保存用户信息
    userInfo.value = res.data.data.user

    // 保存权限列表
    permissions.value = res.data.data.user.permissions

    // 保存到浏览器缓存
    localStorage.setItem(
      'token',
      token.value
    )

    localStorage.setItem(
      'userInfo',
      JSON.stringify(userInfo.value)
    )

    localStorage.setItem(
      'permissions',
      JSON.stringify(permissions.value)
    )
  }

  // 退出登录
  function logout() {
    token.value = ''
    userInfo.value = null
    permissions.value = []

    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('permissions')
  }

  // 判断角色
  function hasRole(role: string) {
    return userInfo.value?.role === role
  }

  // 判断权限
  function hasPermission(permission: string) {
    return permissions.value.includes(permission)
  }

  return {
    token,
    userInfo,
    permissions,
    loginUser,
    logout,
    hasRole,
    hasPermission
  }
})