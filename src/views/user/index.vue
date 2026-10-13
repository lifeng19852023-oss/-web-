
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, User, UserFilled, Key, Setting, Delete, Edit } from '@element-plus/icons-vue'
import { getUserList, createUser, deleteUser, updateUserRole } from '@/api/user'
import { useUserStore } from '@/stores/user'

interface UserItem {
  id: number
  username: string
  role?: string
  roleCode?: string
}

const userStore = useUserStore()
const users = ref<UserItem[]>([])
const loading = ref(false)
const keyword = ref('')
const roleFilter = ref('')
const dialogVisible = ref(false)
const submitting = ref(false)
const username = ref('')
const password = ref('')
const role = ref('staff')

const currentUsername = computed(() => userStore.userInfo?.username)

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchKeyword = !keyword.value || user.username.toLowerCase().includes(keyword.value.toLowerCase())
    const matchRole = !roleFilter.value || (user.roleCode || user.role) === roleFilter.value
    return matchKeyword && matchRole
  })
})

const adminCount = computed(() => users.value.filter(user => (user.roleCode || user.role) === 'admin').length)
const staffCount = computed(() => users.value.filter(user => (user.roleCode || user.role) === 'staff').length)
const viewerCount = computed(() => users.value.filter(user => (user.roleCode || user.role) === 'viewer').length)

function getRoleName(user: UserItem) {
  const value = user.roleCode || user.role
  const roleMap: Record<string, string> = {
    admin: '管理员',
    staff: '工作人员',
    viewer: '普通用户'
  }
  return roleMap[value || ''] || value || '未设置'
}

function getRoleType(user: UserItem) {
  const value = user.roleCode || user.role
  if (value === 'admin') return 'danger'
  if (value === 'staff') return 'primary'
  return 'info'
}

async function loadUsers() {
  loading.value = true
  try {
    const res = await getUserList()
    users.value = res.data.data || []
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  username.value = ''
  password.value = ''
  role.value = 'staff'
  dialogVisible.value = true
}

async function handleCreate() {
  if (!username.value.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!password.value) {
    ElMessage.warning('请输入密码')
    return
  }
  submitting.value = true
  try {
    await createUser({
      username: username.value.trim(),
      password: password.value,
      role: role.value
    })
    ElMessage.success('用户创建成功')
    dialogVisible.value = false
    await loadUsers()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '创建用户失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(user: UserItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除用户「${user.username}」吗？删除后无法直接恢复。`,
      '删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteUser(user.id)
    ElMessage.success('用户删除成功')
    await loadUsers()
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.response?.data?.message || '删除用户失败')
    }
  }
}

async function handleRoleChange(user: UserItem, newRole: string) {
  const oldRole = user.roleCode || user.role || 'staff'
  if (newRole === oldRole) return
  try {
    await updateUserRole(user.id, newRole)
    ElMessage.success('角色修改成功')
    await loadUsers()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '角色修改失败')
    await loadUsers()
  }
}

function resetFilters() {
  keyword.value = ''
  roleFilter.value = ''
}

onMounted(loadUsers)
</script>

<template>
  <div class="user-page">
    <div class="page-header">
      <div>
        <h1>用户管理</h1>
        <p>管理系统账号、角色与访问权限</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        新增用户
      </el-button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue"><el-icon><User /></el-icon></div>
        <div class="stat-info"><span>用户总数</span><strong>{{ users.length }}</strong></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><el-icon><Setting /></el-icon></div>
        <div class="stat-info"><span>管理员</span><strong>{{ adminCount }}</strong></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><el-icon><UserFilled /></el-icon></div>
        <div class="stat-info"><span>工作人员</span><strong>{{ staffCount }}</strong></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><el-icon><Key /></el-icon></div>
        <div class="stat-info"><span>普通用户</span><strong>{{ viewerCount }}</strong></div>
      </div>
    </div>

    <div class="content-card">
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索用户名"
          clearable
          :prefix-icon="Search"
          class="search-input"
        />
        <el-select v-model="roleFilter" placeholder="全部角色" clearable class="role-select">
          <el-option label="管理员" value="admin" />
          <el-option label="工作人员" value="staff" />
          <el-option label="普通用户" value="viewer" />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
        <div class="filter-spacer"></div>
        <el-button :icon="Refresh" :loading="loading" @click="loadUsers">刷新数据</el-button>
      </div>

      <el-table :data="filteredUsers" v-loading="loading" stripe>
        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="38">{{ row.username?.charAt(0)?.toUpperCase() }}</el-avatar>
              <div class="user-detail">
                <strong>{{ row.username }}</strong>
                <span>用户 ID：{{ row.id }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="账号角色" width="160">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row)" effect="light" round>
              {{ getRoleName(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="角色调整" min-width="180">
          <template #default="{ row }">
            <el-select
              :model-value="row.roleCode || row.role || 'staff'"
              :disabled="row.username === currentUsername"
              size="small"
              class="table-role-select"
              @change="(value: string) => handleRoleChange(row, value)"
            >
              <el-option label="管理员" value="admin" />
              <el-option label="工作人员" value="staff" />
              <el-option label="普通用户" value="viewer" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" width="130">
          <template #default="{ row }">
            <el-tag v-if="row.username === currentUsername" type="success" effect="light">
              当前账号
            </el-tag>
            <el-tag v-else type="info" effect="light">系统用户</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.username !== currentUsername"
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row)"
            >删除</el-button>
            <span v-else class="self-label">本人账号</span>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无用户数据" />
        </template>
      </el-table>

      <div class="table-footer">
        <span>共 {{ filteredUsers.length }} 个用户</span>
        <span v-if="keyword || roleFilter">筛选前共 {{ users.length }} 个用户</span>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="新增系统用户" width="460px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="用户名" required>
          <el-input v-model="username" placeholder="请输入登录用户名" maxlength="50" />
        </el-form-item>
        <el-form-item label="登录密码" required>
          <el-input v-model="password" type="password" placeholder="请输入初始密码" show-password />
        </el-form-item>
        <el-form-item label="用户角色">
          <el-select v-model="role" style="width: 100%">
            <el-option label="工作人员" value="staff" />
            <el-option label="普通用户" value="viewer" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-alert
          title="请谨慎分配管理员角色，管理员通常拥有更高的系统操作权限。"
          type="warning"
          :closable="false"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">创建用户</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-page{padding:24px;background:#f5f7fb;min-height:100%;color:#303133}
.page-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px}
.page-header h1{font-size:24px;margin:0 0 8px;font-weight:650}
.page-header p{margin:0;color:#909399;font-size:14px}
.stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-bottom:22px}
.stat-card{display:flex;align-items:center;gap:16px;padding:22px;background:#fff;border:1px solid #ebeef5;border-radius:12px;box-shadow:0 2px 8px #1d29390a}
.stat-icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;font-size:23px;flex-shrink:0}
.stat-icon.blue{background:#ecf5ff;color:#409eff}.stat-icon.red{background:#fef0f0;color:#f56c6c}.stat-icon.green{background:#f0f9eb;color:#67c23a}.stat-icon.orange{background:#fdf6ec;color:#e6a23c}
.stat-info{display:flex;flex-direction:column;gap:8px;min-width:0}
.stat-info span{font-size:13px;color:#909399}.stat-info strong{font-size:27px;line-height:1.1;color:#303133}
.content-card{background:#fff;border:1px solid #ebeef5;border-radius:12px;padding:20px;box-shadow:0 2px 8px #1d29390a}
.filter-bar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px}
.search-input{width:240px}.role-select{width:150px}.filter-spacer{flex:1}
.user-cell{display:flex;align-items:center;gap:12px}.user-detail{display:flex;flex-direction:column;gap:5px}.user-detail strong{font-size:14px;font-weight:600}.user-detail span{font-size:12px;color:#909399}
.table-role-select{width:140px}.self-label{font-size:12px;color:#909399}.table-footer{display:flex;justify-content:space-between;gap:12px;padding-top:18px;color:#909399;font-size:13px}
@media(max-width:1000px){.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.user-page{padding:14px}.page-header{align-items:flex-start}.page-header h1{font-size:21px}.stats-grid{gap:10px}.stat-card{padding:14px;gap:10px}.stat-icon{width:40px;height:40px;font-size:20px}.stat-info strong{font-size:23px}.content-card{padding:12px}.search-input,.role-select{width:100%}.filter-spacer{display:none}.table-footer{flex-wrap:wrap}}
</style>