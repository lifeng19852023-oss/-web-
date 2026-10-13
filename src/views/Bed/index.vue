```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, House, Check, User, Tools } from '@element-plus/icons-vue'
import { getBedList, createBed, updateBed, deleteBed } from '@/api/bed'
import { getRoomList } from '@/api/room'
import { useUserStore } from '@/stores/user'

interface Room {
  id: number
  room_no: string | number
  floor?: number
  type?: string
  status?: string
}
interface Bed {
  id: number
  room_id: number
  room_no: string | number
  bed_no: string
  status: string
}

const userStore = useUserStore()
const beds = ref<Bed[]>([])
const rooms = ref<Room[]>([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)

const keyword = ref('')
const filterRoom = ref('')
const filterStatus = ref('')

const formVisible = ref(false)
const roomId = ref<number | null>(null)
const bedNo = ref('')
const status = ref('空闲')
const editId = ref<number | null>(null)

const canManage = computed(() => userStore.hasPermission('bed:manage'))

const filteredBeds = computed(() => {
  return beds.value.filter((bed) => {
    const matchKeyword = !keyword.value ||
      String(bed.bed_no).toLowerCase().includes(keyword.value.trim().toLowerCase())
    const matchRoom = !filterRoom.value || String(bed.room_id) === filterRoom.value
    const matchStatus = !filterStatus.value || bed.status === filterStatus.value
    return matchKeyword && matchRoom && matchStatus
  })
})

const bedStats = computed(() => ({
  total: beds.value.length,
  free: beds.value.filter(bed => bed.status === '空闲').length,
  occupied: beds.value.filter(bed => bed.status === '入住中').length,
  repair: beds.value.filter(bed => bed.status === '维修中').length
}))

function statusTagType(value: string) {
  const types: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    空闲: 'success',
    入住中: 'warning',
    维修中: 'danger',
    停用: 'info'
  }
  return types[value] || 'info'
}

async function loadRooms() {
  try {
    const res = await getRoomList()
    rooms.value = res.data.data || []
    if (rooms.value.length && roomId.value === null) {
      roomId.value = rooms.value[0].id
    }
  } catch {
    ElMessage.error('房间列表加载失败')
  }
}

async function loadBeds() {
  loading.value = true
  try {
    const res = await getBedList()
    beds.value = res.data.data || []
  } catch {
    ElMessage.error('床位列表加载失败')
  } finally {
    loading.value = false
  }
}

function openAddForm() {
  clearForm()
  if (rooms.value.length) {
    roomId.value = rooms.value[0].id
  }
  formVisible.value = true
}

function handleEdit(bed: Bed) {
  editId.value = bed.id
  roomId.value = bed.room_id
  bedNo.value = bed.bed_no
  status.value = bed.status
  formVisible.value = true
}

async function handleSave() {
  if (!bedNo.value.trim()) {
    ElMessage.warning('请输入床位编号')
    return
  }
  if (!editId.value && roomId.value === null) {
    ElMessage.warning('请先选择房间')
    return
  }

  saving.value = true
  try {
    if (editId.value !== null) {
      await updateBed(editId.value, {
        bed_no: bedNo.value.trim(),
        status: status.value
      })
      ElMessage.success('床位修改成功')
    } else {
      await createBed({
        room_id: roomId.value,
        bed_no: bedNo.value.trim()
      })
      ElMessage.success('床位新增成功')
    }
    formVisible.value = false
    clearForm()
    await loadBeds()
  } catch {
    ElMessage.error(editId.value !== null ? '修改床位失败，请检查编号是否重复' : '新增床位失败，请检查房间和床位编号')
  } finally {
    saving.value = false
  }
}

async function handleDelete(bed: Bed) {
  try {
    await ElMessageBox.confirm(
      `确定删除房间 ${bed.room_no} 的床位「${bed.bed_no}」吗？`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  deletingId.value = bed.id
  try {
    await deleteBed(bed.id)
    ElMessage.success('床位删除成功')
    await loadBeds()
  } catch {
    ElMessage.error('删除床位失败，该床位可能已关联入住记录')
  } finally {
    deletingId.value = null
  }
}

function clearForm() {
  roomId.value = rooms.value[0]?.id ?? null
  bedNo.value = ''
  status.value = '空闲'
  editId.value = null
}

function resetFilters() {
  keyword.value = ''
  filterRoom.value = ''
  filterStatus.value = ''
}

onMounted(async () => {
  await loadRooms()
  await loadBeds()
})
</script>

<template>
  <div class="bed-page">
    <div class="page-header">
      <div>
        <h1>床位管理</h1>
        <p class="page-description">统一管理养老院床位信息、使用状态及房间归属</p>
      </div>
      <el-button v-if="canManage" type="primary" :icon="Plus" @click="openAddForm">
        新增床位
      </el-button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total-icon"><el-icon><House /></el-icon></div>
        <div class="stat-info">
          <span>床位总数</span>
          <strong>{{ bedStats.total }}</strong>
          <small>当前床位数量</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon free-icon"><el-icon><Check /></el-icon></div>
        <div class="stat-info">
          <span>空闲床位</span>
          <strong>{{ bedStats.free }}</strong>
          <small>可安排入住</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon occupied-icon"><el-icon><User /></el-icon></div>
        <div class="stat-info">
          <span>入住中</span>
          <strong>{{ bedStats.occupied }}</strong>
          <small>正在使用的床位</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon repair-icon"><el-icon><Tools /></el-icon></div>
        <div class="stat-info">
          <span>维修中</span>
          <strong>{{ bedStats.repair }}</strong>
          <small>暂不可安排入住</small>
        </div>
      </div>
    </div>

    <div class="content-card">
      <div class="section-header">
        <div>
          <h2>床位列表</h2>
          <p>共 {{ filteredBeds.length }} 个床位</p>
        </div>
        <el-button :icon="Refresh" :loading="loading" @click="loadBeds">刷新</el-button>
      </div>

      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索床位编号"
          clearable
          :prefix-icon="Search"
          class="search-input"
        />
        <el-select v-model="filterRoom" placeholder="全部房间" clearable class="filter-select">
          <el-option
            v-for="room in rooms"
            :key="room.id"
            :label="`${room.room_no}号房`"
            :value="String(room.id)"
          />
        </el-select>
        <el-select v-model="filterStatus" placeholder="全部状态" clearable class="filter-select">
          <el-option label="空闲" value="空闲" />
          <el-option label="入住中" value="入住中" />
          <el-option label="维修中" value="维修中" />
          <el-option label="停用" value="停用" />
        </el-select>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredBeds"
        row-key="id"
        stripe
        class="bed-table"
        empty-text="暂无床位数据"
      >
        <el-table-column label="房间信息" min-width="160">
          <template #default="{ row }">
            <div class="room-cell">
              <div class="room-icon"><el-icon><House /></el-icon></div>
              <div>
                <strong>{{ row.room_no }}号房</strong>
                <span>房间 ID：{{ row.room_id }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="bed_no" label="床位编号" min-width="130">
          <template #default="{ row }">
            <span class="bed-number">{{ row.bed_no }}</span>
          </template>
        </el-table-column>
        <el-table-column label="床位状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light" round>
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <div v-if="canManage" class="action-buttons">
              <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
              <el-button
                link
                type="danger"
                :icon="Delete"
                :loading="deletingId === row.id"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </div>
            <span v-else class="no-permission">无操作权限</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="formVisible"
      :title="editId !== null ? '编辑床位' : '新增床位'"
      width="480px"
      destroy-on-close
      @closed="clearForm"
    >
      <el-form label-position="top" @submit.prevent="handleSave">
        <el-form-item label="所属房间" required>
          <el-select
            v-model="roomId"
            placeholder="请选择房间"
            style="width: 100%"
            :disabled="editId !== null"
          >
            <el-option
              v-for="room in rooms"
              :key="room.id"
              :label="`${room.room_no}号房${room.floor ? `（${room.floor}楼）` : ''}`"
              :value="room.id"
            />
          </el-select>
          <div v-if="editId !== null" class="field-tip">
            当前接口的修改参数不包含 room_id，因此编辑时不能更换所属房间。
          </div>
        </el-form-item>
        <el-form-item label="床位编号" required>
          <el-input v-model="bedNo" placeholder="请输入床位编号，例如 01 床" maxlength="30" />
        </el-form-item>
        <el-form-item v-if="editId !== null" label="床位状态">
          <el-select v-model="status" style="width: 100%">
            <el-option label="空闲" value="空闲" />
            <el-option label="入住中" value="入住中" />
            <el-option label="维修中" value="维修中" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
        <el-alert
          v-if="editId === null"
          title="新床位将以“空闲”状态创建。"
          type="info"
          :closable="false"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editId !== null ? '保存修改' : '确认新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.bed-page {
  padding: 24px;
  min-height: 100%;
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
.free-icon { color: #67c23a; background: #f0f9eb; }
.occupied-icon { color: #e6a23c; background: #fdf6ec; }
.repair-icon { color: #f56c6c; background: #fef0f0; }
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
.search-input { width: 240px; }
.filter-select { width: 170px; }
.room-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.room-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  color: #409eff;
  background: #ecf5ff;
  border-radius: 9px;
  font-size: 19px;
}
.room-cell strong {
  display: block;
  color: #303133;
  font-size: 14px;
  font-weight: 550;
}
.room-cell span {
  display: block;
  margin-top: 5px;
  color: #a0a4ab;
  font-size: 12px;
}
.bed-number {
  color: #303133;
  font-weight: 600;
}
.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}
.no-permission {
  color: #c0c4cc;
  font-size: 13px;
}
.field-tip {
  margin-top: 7px;
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}
.bed-table { width: 100%; }
@media (max-width: 1100px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 650px) {
  .bed-page { padding: 14px; }
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