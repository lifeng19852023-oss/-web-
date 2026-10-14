```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, User, House, Check, Clock, Calendar, SwitchButton } from '@element-plus/icons-vue'
import { getAdmissionList, createAdmission, checkoutAdmission } from '@/api/admission'
import { getElderlyList } from '@/api/elderly'
import { getBedList } from '@/api/bed'
import { useUserStore } from '@/stores/user'

interface Admission {
  id: number
  elderly_id?: number
  elderly_name: string
  bed_id?: number
  room_no: string | number
  bed_no: string
  check_in: string
  check_out?: string | null
  status: string
}
interface Elderly {
  id: number
  name: string
}
interface Bed {
  id: number
  room_id: number
  room_no: string | number
  bed_no: string
  status: string
}

const userStore = useUserStore()
const admissions = ref<Admission[]>([])
const elderlyList = ref<Elderly[]>([])
const bedList = ref<Bed[]>([])
const loading = ref(false)
const submitting = ref(false)
const checkoutId = ref<number | null>(null)

const keyword = ref('')
const filterStatus = ref('')
const elderlyId = ref<number | null>(null)
const bedId = ref<number | null>(null)
const formVisible = ref(false)

const canManage = computed(() => userStore.hasPermission('admission:manage'))

const filteredAdmissions = computed(() => {
  return admissions.value.filter(item => {
    const searchText = keyword.value.trim().toLowerCase()
    const matchKeyword = !searchText ||
      String(item.elderly_name || '').toLowerCase().includes(searchText) ||
      String(item.room_no || '').toLowerCase().includes(searchText) ||
      String(item.bed_no || '').toLowerCase().includes(searchText)
    const matchStatus = !filterStatus.value || item.status === filterStatus.value
    return matchKeyword && matchStatus
  })
})

const admissionStats = computed(() => ({
  total: admissions.value.length,
  active: admissions.value.filter(item => item.status === '入住中').length,
  checkedOut: admissions.value.filter(item => item.status === '已退住').length,
  availableBeds: bedList.value.length
}))

function statusTagType(status: string) {
  const types: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    入住中: 'success',
    已退住: 'info',
    已取消: 'danger'
  }
  return types[status] || 'info'
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

async function loadAdmissions() {
  const res = await getAdmissionList()
  admissions.value = res.data.data || []
}

async function loadElderly() {
  const res = await getElderlyList()
  elderlyList.value = res.data.data.list || []
  console.log(res.data)
}

async function loadBeds() {
  const res = await getBedList()
  bedList.value = (res.data.data || []).filter((item: Bed) => item.status === '空闲')
}

async function refreshAll() {
  loading.value = true
  try {
    await Promise.all([loadAdmissions(), loadElderly(), loadBeds()])
  } catch {
    ElMessage.error('入住管理数据加载失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

function openCreateForm() {
  elderlyId.value = null
  bedId.value = null
  formVisible.value = true
}

async function handleCreate() {
  if (elderlyId.value === null || bedId.value === null) {
    ElMessage.warning('请选择老人和空闲床位')
    return
  }

  submitting.value = true
  try {
    await createAdmission({
      elderly_id: elderlyId.value,
      bed_id: bedId.value
    })
    ElMessage.success('办理入住成功')
    formVisible.value = false
    elderlyId.value = null
    bedId.value = null
    await refreshAll()
  } catch {
    ElMessage.error('办理入住失败，请确认老人和床位状态后重试')
  } finally {
    submitting.value = false
  }
}

async function handleCheckout(item: Admission) {
  try {
    await ElMessageBox.confirm(
      `确定为「${item.elderly_name}」办理退住吗？`,
      '退住确认',
      {
        confirmButtonText: '确认退住',
        cancelButtonText: '暂不退住',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  checkoutId.value = item.id
  try {
    await checkoutAdmission(item.id)
    ElMessage.success('退住办理成功')
    await refreshAll()
  } catch {
    ElMessage.error('退住办理失败，请检查该入住记录的状态')
  } finally {
    checkoutId.value = null
  }
}

function resetFilters() {
  keyword.value = ''
  filterStatus.value = ''
}

onMounted(refreshAll)
</script>

<template>
  <div class="admission-page">
    <div class="page-header">
      <div>
        <h1>入住管理</h1>
        <p class="page-description">管理老人入住、床位分配及退住记录</p>
      </div>
      <el-button
        v-if="canManage"
        type="primary"
        :icon="Plus"
        :disabled="bedList.length === 0 || elderlyList.length === 0"
        @click="openCreateForm"
      >
        办理入住
      </el-button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total-icon"><el-icon><Calendar /></el-icon></div>
        <div class="stat-info">
          <span>入住记录总数</span>
          <strong>{{ admissionStats.total }}</strong>
          <small>包含历史记录</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active-icon"><el-icon><User /></el-icon></div>
        <div class="stat-info">
          <span>当前入住</span>
          <strong>{{ admissionStats.active }}</strong>
          <small>正在入住的老人</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon checkout-icon"><el-icon><Check /></el-icon></div>
        <div class="stat-info">
          <span>已退住记录</span>
          <strong>{{ admissionStats.checkedOut }}</strong>
          <small>已完成退住</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bed-icon"><el-icon><House /></el-icon></div>
        <div class="stat-info">
          <span>可用床位</span>
          <strong>{{ admissionStats.availableBeds }}</strong>
          <small>当前空闲床位</small>
        </div>
      </div>
    </div>

    <div class="content-card">
      <div class="section-header">
        <div>
          <h2>入住记录</h2>
          <p>当前显示 {{ filteredAdmissions.length }} 条记录</p>
        </div>
        <el-button :icon="Refresh" :loading="loading" @click="refreshAll">刷新</el-button>
      </div>

      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索老人姓名、房间或床位"
          clearable
          :prefix-icon="Search"
          class="search-input"
        />
        <el-select v-model="filterStatus" placeholder="全部入住状态" clearable class="filter-select">
          <el-option label="入住中" value="入住中" />
          <el-option label="已退住" value="已退住" />
          <el-option label="已取消" value="已取消" />
        </el-select>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredAdmissions"
        row-key="id"
        stripe
        class="admission-table"
        empty-text="暂无入住记录"
      >
        <el-table-column label="老人信息" min-width="160">
          <template #default="{ row }">
            <div class="elderly-cell">
              <div class="elderly-avatar"><el-icon><User /></el-icon></div>
              <div>
                <strong>{{ row.elderly_name || '未获取姓名' }}</strong>
                <span>记录编号：{{ row.id }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="入住位置" min-width="155">
          <template #default="{ row }">
            <div class="location-cell">
              <strong>{{ row.room_no }}号房</strong>
              <span>{{ row.bed_no }} 床</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="入住时间" min-width="175">
          <template #default="{ row }">
            <div class="date-cell">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDate(row.check_in) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="退住时间" min-width="175">
          <template #default="{ row }">
            <span class="checkout-time">{{ formatDate(row.check_out) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="入住状态" min-width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light" round>
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canManage && row.status === '入住中'"
              link
              type="warning"
              :icon="SwitchButton"
              :loading="checkoutId === row.id"
              @click="handleCheckout(row)"
            >
              办理退住
            </el-button>
            <span v-else class="no-action">
              {{ row.status === '入住中' ? '无操作权限' : '—' }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="formVisible" title="办理入住" width="480px" destroy-on-close>
      <el-form label-position="top" @submit.prevent="handleCreate">
        <el-form-item label="选择老人" required>
          <el-select
            v-model="elderlyId"
            placeholder="请选择需要入住的老人"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="elderly in elderlyList"
              :key="elderly.id"
              :label="elderly.name"
              :value="elderly.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="选择空闲床位" required>
          <el-select
            v-model="bedId"
            placeholder="请选择空闲床位"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="bed in bedList"
              :key="bed.id"
              :label="`${bed.room_no}号房 · ${bed.bed_no}`"
              :value="bed.id"
            />
          </el-select>
          <div class="field-tip">这里只展示当前状态为“空闲”的床位。</div>
        </el-form-item>

        <el-alert
          v-if="bedList.length === 0"
          title="当前没有空闲床位，请先在床位管理中确认床位状态。"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-alert
          v-if="elderlyList.length === 0"
          title="当前没有老人档案，请先在老人管理中添加老人信息。"
          type="warning"
          :closable="false"
          show-icon
        />
      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="bedList.length === 0 || elderlyList.length === 0"
          @click="handleCreate"
        >
          确认入住
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.admission-page {
  min-height: 100%;
  padding: 24px;
  background: #f5f7fb;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
.page-header h1 {
  margin: 0;
  color: #1f2937;
  font-size: 25px;
  font-weight: 650;
}
.page-description {
  margin: 8px 0 0;
  color: #909399;
  font-size: 14px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 22px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(31 41 55 / 3%);
}
.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  font-size: 23px;
}
.total-icon { color: #409eff; background: #ecf5ff; }
.active-icon { color: #67c23a; background: #f0f9eb; }
.checkout-icon { color: #909399; background: #f4f4f5; }
.bed-icon { color: #e6a23c; background: #fdf6ec; }
.stat-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.stat-info span { color: #606266; font-size: 14px; }
.stat-info strong { color: #303133; font-size: 27px; line-height: 1.2; }
.stat-info small { color: #a0a4ab; font-size: 12px; }
.content-card {
  padding: 24px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(31 41 55 / 3%);
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}
.section-header h2 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}
.section-header p {
  margin: 7px 0 0;
  color: #909399;
  font-size: 13px;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.search-input { width: 280px; }
.filter-select { width: 180px; }
.elderly-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.elderly-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  color: #409eff;
  background: #ecf5ff;
  border-radius: 50%;
  font-size: 19px;
}
.elderly-cell strong {
  display: block;
  color: #303133;
  font-size: 14px;
  font-weight: 550;
}
.elderly-cell span {
  display: block;
  margin-top: 5px;
  color: #a0a4ab;
  font-size: 12px;
}
.location-cell strong {
  display: block;
  color: #303133;
  font-size: 14px;
}
.location-cell span {
  display: block;
  margin-top: 5px;
  color: #909399;
  font-size: 13px;
}
.date-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #606266;
  font-size: 13px;
}
.date-cell .el-icon { color: #909399; }
.checkout-time {
  color: #909399;
  font-size: 13px;
}
.no-action {
  color: #c0c4cc;
  font-size: 13px;
}
.field-tip {
  margin-top: 7px;
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}
.admission-table { width: 100%; }
@media (max-width: 1100px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 650px) {
  .admission-page { padding: 14px; }
  .page-header { align-items: flex-start; }
  .page-header h1 { font-size: 21px; }
  .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .stat-card { gap: 10px; padding: 14px; }
  .stat-icon { width: 38px; height: 38px; font-size: 19px; }
  .stat-info strong { font-size: 22px; }
  .content-card { padding: 15px; }
  .filter-bar { flex-direction: column; }
  .search-input, .filter-select { width: 100%; }
}
</style>