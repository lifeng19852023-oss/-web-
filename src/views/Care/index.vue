```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Refresh, User, Calendar, Check, TrendCharts, Tools } from '@element-plus/icons-vue'
import { getCareList, createCare } from '@/api/care'
import { getElderlyList } from '@/api/elderly'
import { useUserStore } from '@/stores/user'

interface CareRecord {
  id: number
  elderly_id?: number
  elderly_name: string
  care_type: string
  care_date: string
  content?: string
}
interface Elderly {
  id: number
  name: string
}

const userStore = useUserStore()
const records = ref<CareRecord[]>([])
const elderlyList = ref<Elderly[]>([])
const loading = ref(false)
const saving = ref(false)

const keyword = ref('')
const filterType = ref('')
const filterDate = ref('')
const elderlyId = ref<number | null>(null)
const careType = ref('测血压')
const careDate = ref('')
const content = ref('')
const formVisible = ref(false)

const canManage = computed(() => userStore.hasPermission('care:manage'))
const careTypes = ['测血压', '喂药', '洗澡', '康复训练']

const filteredRecords = computed(() => {
  return records.value.filter(item => {
    const searchText = keyword.value.trim().toLowerCase()
    const matchKeyword = !searchText ||
      String(item.elderly_name || '').toLowerCase().includes(searchText) ||
      String(item.content || '').toLowerCase().includes(searchText)
    const matchType = !filterType.value || item.care_type === filterType.value
    const matchDate = !filterDate.value ||
      String(item.care_date || '').slice(0, 10) === filterDate.value
    return matchKeyword && matchType && matchDate
  })
})

const careStats = computed(() => ({
  total: records.value.length,
  bloodPressure: records.value.filter(item => item.care_type === '测血压').length,
  medication: records.value.filter(item => item.care_type === '喂药').length,
  rehabilitation: records.value.filter(item => item.care_type === '康复训练').length
}))

function careTagType(type: string) {
  const types: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    测血压: 'success',
    喂药: 'warning',
    洗澡: 'info',
    康复训练: 'danger'
  }
  return types[type] || 'info'
}

function formatDate(value?: string) {
  if (!value) return '—'
  const datePart = String(value).slice(0, 10)
  const parts = datePart.split('-')
  if (parts.length === 3 && parts.every(part => /^\d+$/.test(part))) {
    return `${parts[0]}-${parts[1]}-${parts[2]}`
  }
  return value
}

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function loadCare() {
  const res = await getCareList()
  records.value = res.data.data || []
}

async function loadElderly() {
  const res = await getElderlyList()
  elderlyList.value = res.data.data || []
}

async function refreshAll() {
  loading.value = true
  try {
    await Promise.all([loadCare(), loadElderly()])
  } catch {
    ElMessage.error('护理数据加载失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

function openCreateForm() {
  elderlyId.value = null
  careType.value = '测血压'
  careDate.value = getToday()
  content.value = ''
  formVisible.value = true
}

async function handleCreate() {
  if (elderlyId.value === null) {
    ElMessage.warning('请选择老人')
    return
  }
  if (!careDate.value) {
    ElMessage.warning('请选择护理日期')
    return
  }
  if (!content.value.trim()) {
    ElMessage.warning('请填写护理内容')
    return
  }

  saving.value = true
  try {
    await createCare({
      elderly_id: elderlyId.value,
      care_type: careType.value,
      care_date: careDate.value,
      content: content.value.trim()
    })
    ElMessage.success('护理记录新增成功')
    formVisible.value = false
    content.value = ''
    elderlyId.value = null
    await loadCare()
  } catch {
    ElMessage.error('新增护理记录失败，请检查输入内容后重试')
  } finally {
    saving.value = false
  }
}

function resetFilters() {
  keyword.value = ''
  filterType.value = ''
  filterDate.value = ''
}

onMounted(refreshAll)
</script>

<template>
  <div class="care-page">
    <div class="page-header">
      <div>
        <h1>护理管理</h1>
        <p class="page-description">记录老人日常护理、健康监测与康复服务情况</p>
      </div>
      <el-button v-if="canManage" type="primary" :icon="Plus" @click="openCreateForm">
        新增护理记录
      </el-button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total-icon"><el-icon><Check /></el-icon></div>
        <div class="stat-info">
          <span>护理记录总数</span>
          <strong>{{ careStats.total }}</strong>
          <small>全部历史记录</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pressure-icon"><el-icon><TrendCharts /></el-icon></div>
        <div class="stat-info">
          <span>血压监测</span>
          <strong>{{ careStats.bloodPressure }}</strong>
          <small>测血压记录</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon medication-icon"><el-icon><Tools /></el-icon></div>
        <div class="stat-info">
          <span>喂药记录</span>
          <strong>{{ careStats.medication }}</strong>
          <small>用药护理记录</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rehab-icon"><el-icon><User /></el-icon></div>
        <div class="stat-info">
          <span>康复训练</span>
          <strong>{{ careStats.rehabilitation }}</strong>
          <small>康复护理记录</small>
        </div>
      </div>
    </div>

    <div class="content-card">
      <div class="section-header">
        <div>
          <h2>护理记录列表</h2>
          <p>当前显示 {{ filteredRecords.length }} 条记录</p>
        </div>
        <el-button :icon="Refresh" :loading="loading" @click="refreshAll">刷新</el-button>
      </div>

      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索老人姓名或护理内容"
          clearable
          :prefix-icon="Search"
          class="search-input"
        />
        <el-select v-model="filterType" placeholder="全部护理类型" clearable class="filter-select">
          <el-option v-for="type in careTypes" :key="type" :label="type" :value="type" />
        </el-select>
        <el-date-picker
          v-model="filterDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择护理日期"
          clearable
          class="date-filter"
        />
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredRecords"
        row-key="id"
        stripe
        class="care-table"
        empty-text="暂无护理记录"
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

        <el-table-column label="护理类型" min-width="130">
          <template #default="{ row }">
            <el-tag :type="careTagType(row.care_type)" effect="light" round>
              {{ row.care_type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="护理日期" min-width="150">
          <template #default="{ row }">
            <div class="date-cell">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDate(row.care_date) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="护理内容" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="care-content">{{ row.content || '未填写护理内容' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" fixed="right">
          <template #default>
            <span class="no-action">—</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="formVisible" title="新增护理记录" width="500px" destroy-on-close>
      <el-form label-position="top" @submit.prevent="handleCreate">
        <el-form-item label="选择老人" required>
          <el-select
            v-model="elderlyId"
            placeholder="请选择接受护理的老人"
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

        <el-form-item label="护理类型" required>
          <el-select v-model="careType" style="width: 100%">
            <el-option v-for="type in careTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>

        <el-form-item label="护理日期" required>
          <el-date-picker
            v-model="careDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择护理日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="护理内容" required>
          <el-input
            v-model="content"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="例如：测量血压 125/80 mmHg，老人状态正常"
          />
        </el-form-item>

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
          :loading="saving"
          :disabled="elderlyList.length === 0"
          @click="handleCreate"
        >
          保存记录
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.care-page {
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
.pressure-icon { color: #67c23a; background: #f0f9eb; }
.medication-icon { color: #e6a23c; background: #fdf6ec; }
.rehab-icon { color: #909399; background: #f4f4f5; }
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
.filter-select { width: 170px; }
.date-filter { width: 190px; }
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
.date-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #606266;
  font-size: 13px;
}
.date-cell .el-icon { color: #909399; }
.care-content {
  color: #606266;
  font-size: 13px;
}
.no-action {
  color: #c0c4cc;
  font-size: 13px;
}
.care-table { width: 100%; }
@media (max-width: 1100px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 650px) {
  .care-page { padding: 14px; }
  .page-header { align-items: flex-start; }
  .page-header h1 { font-size: 21px; }
  .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .stat-card { gap: 10px; padding: 14px; }
  .stat-icon { width: 38px; height: 38px; font-size: 19px; }
  .stat-info strong { font-size: 22px; }
  .content-card { padding: 15px; }
  .filter-bar { flex-direction: column; }
  .search-input, .filter-select, .date-filter { width: 100%; }
}
</style>