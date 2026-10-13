```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, House, Tools } from '@element-plus/icons-vue'
import { getRoomList, createRoom, updateRoom, deleteRoom } from '@/api/room'
import { useUserStore } from '@/stores/user'

interface Room {
  id: number
  room_no: string
  floor: number
  type: string
  status: string
}

const userStore = useUserStore()
const rooms = ref<Room[]>([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const keyword = ref('')
const filterFloor = ref('')
const filterType = ref('')
const filterStatus = ref('')
const roomNo = ref('')
const floor = ref<number>(1)
const type = ref('单人间')
const status = ref('空闲')
const editId = ref<number | null>(null)
const formVisible = ref(false)

const canManage = computed(() => userStore.hasPermission('room:manage'))
const filteredRooms = computed(() => {
  return rooms.value.filter(room => {
    const matchesKeyword = !keyword.value || room.room_no.toLowerCase().includes(keyword.value.trim().toLowerCase())
    const matchesFloor = filterFloor.value === '' || room.floor === Number(filterFloor.value)
    const matchesType = !filterType.value || room.type === filterType.value
    const matchesStatus = !filterStatus.value || room.status === filterStatus.value
    return matchesKeyword && matchesFloor && matchesType && matchesStatus
  })
})

const roomStats = computed(() => ({
  total: rooms.value.length,
  free: rooms.value.filter(room => room.status === '空闲').length,
  occupied: rooms.value.filter(room => room.status === '入住中').length,
  repair: rooms.value.filter(room => room.status === '维修中').length
}))

function statusTagType(value: string) {
  const types: Record<string, 'success' | 'primary' | 'warning' | 'info' | 'danger'> = {
    空闲: 'success',
    入住中: 'primary',
    维修中: 'warning'
  }
  return types[value] ?? 'info'
}

async function loadRooms() {
  loading.value = true
  try {
    const res = await getRoomList()
    rooms.value = res.data.data
  } catch (error) {
    ElMessage.error('房间列表加载失败，请稍后重试')
    console.error(error)
  } finally {
    loading.value = false
  }
}

function openAddForm() {
  clearForm()
  formVisible.value = true
}

function handleEdit(room: Room) {
  editId.value = room.id
  roomNo.value = room.room_no
  floor.value = room.floor
  type.value = room.type
  status.value = room.status
  formVisible.value = true
}

async function handleSave() {
  if (!canManage.value || saving.value) return
  const normalizedRoomNo = roomNo.value.trim()
  if (!normalizedRoomNo) {
    ElMessage.warning('请输入房间编号')
    return
  }
  if (!Number.isInteger(Number(floor.value)) || Number(floor.value) < 1) {
    ElMessage.warning('楼层必须是大于等于 1 的整数')
    return
  }

  saving.value = true
  try {
    const data = {
      room_no: normalizedRoomNo,
      floor: Number(floor.value),
      type: type.value,
      status: status.value
    }
    if (editId.value !== null) {
      await updateRoom(editId.value, data)
      ElMessage.success('房间修改成功')
    } else {
      await createRoom(data)
      ElMessage.success('房间新增成功')
    }
    formVisible.value = false
    clearForm()
    await loadRooms()
  } catch (error) {
    ElMessage.error('保存失败，请检查房间编号是否重复，或稍后重试')
    console.error(error)
  } finally {
    saving.value = false
  }
}

async function handleDelete(room: Room) {
  if (!canManage.value || deletingId.value !== null) return
  try {
    await ElMessageBox.confirm(
      `确定删除房间「${room.room_no}」吗？如果该房间关联床位或入住记录，系统可能会拒绝删除。`,
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

  deletingId.value = room.id
  try {
    await deleteRoom(room.id)
    ElMessage.success('房间删除成功')
    await loadRooms()
  } catch (error) {
    ElMessage.error('房间删除失败，请检查该房间是否仍关联床位或入住记录')
    console.error(error)
  } finally {
    deletingId.value = null
  }
}

function clearForm() {
  roomNo.value = ''
  floor.value = 1
  type.value = '单人间'
  status.value = '空闲'
  editId.value = null
}

function resetFilters() {
  keyword.value = ''
  filterFloor.value = ''
  filterType.value = ''
  filterStatus.value = ''
}

onMounted(loadRooms)
</script>

<template>
  <div class="room-page">
    <div class="page-heading">
      <div>
        <h1>房间管理</h1>
        <p>统一管理房间编号、楼层、房型及使用状态</p>
      </div>
      <el-button v-if="canManage" type="primary" :icon="Plus" @click="openAddForm">
        新增房间
      </el-button>
    </div>

    <div class="stats-grid">
      <el-card shadow="never" class="stat-card">
        <div class="stat-content">
          <div>
            <div class="stat-label">房间总数</div>
            <div class="stat-value">{{ roomStats.total }}</div>
          </div>
          <div class="stat-icon blue"><el-icon><House /></el-icon></div>
        </div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-content">
          <div>
            <div class="stat-label">空闲房间</div>
            <div class="stat-value">{{ roomStats.free }}</div>
          </div>
          <div class="stat-icon green"><el-icon><House /></el-icon></div>
        </div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-content">
          <div>
            <div class="stat-label">入住中</div>
            <div class="stat-value">{{ roomStats.occupied }}</div>
          </div>
          <div class="stat-icon purple"><el-icon><House /></el-icon></div>
        </div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-content">
          <div>
            <div class="stat-label">维修房间</div>
            <div class="stat-value">{{ roomStats.repair }}</div>
          </div>
          <div class="stat-icon orange"><el-icon><Tools /></el-icon></div>
        </div>
      </el-card>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form class="filter-form" @submit.prevent>
        <el-form-item label="房间编号">
          <el-input
            v-model="keyword"
            placeholder="输入房间编号"
            clearable
            :prefix-icon="Search"
            @keyup.enter="void 0"
          />
        </el-form-item>
        <el-form-item label="楼层">
          <el-select v-model="filterFloor" placeholder="全部楼层" clearable>
            <el-option
              v-for="item in [...new Set(rooms.map(room => room.floor))].sort((a, b) => a - b)"
              :key="item"
              :label="`${item} 楼`"
              :value="String(item)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="房型">
          <el-select v-model="filterType" placeholder="全部房型" clearable>
            <el-option label="单人间" value="单人间" />
            <el-option label="双人间" value="双人间" />
            <el-option label="三人间" value="三人间" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterStatus" placeholder="全部状态" clearable>
            <el-option label="空闲" value="空闲" />
            <el-option label="入住中" value="入住中" />
            <el-option label="维修中" value="维修中" />
          </el-select>
        </el-form-item>
        <el-form-item class="filter-actions">
          <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
          <el-button :icon="Refresh" :loading="loading" @click="loadRooms">刷新数据</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="table-heading">
          <div>
            <span class="table-title">房间列表</span>
            <span class="table-subtitle">共 {{ filteredRooms.length }} 间房</span>
          </div>
          <el-tag type="info" effect="plain">实时筛选</el-tag>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="filteredRooms"
        row-key="id"
        stripe
        class="room-table"
        empty-text="没有找到符合条件的房间"
      >
        <el-table-column prop="room_no" label="房间编号" min-width="140">
          <template #default="{ row }">
            <span class="room-number">{{ row.room_no }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="floor" label="所在楼层" width="120" align="center">
          <template #default="{ row }">{{ row.floor }} 楼</template>
        </el-table-column>
        <el-table-column prop="type" label="房间类型" min-width="130">
          <template #default="{ row }">
            <el-tag effect="plain" type="info">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="使用状态" min-width="130">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light" round>
              {{ row.status || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="canManage"
              type="primary"
              link
              :icon="Edit"
              @click="handleEdit(row)"
            >编辑</el-button>
            <el-button
              v-if="canManage"
              type="danger"
              link
              :icon="Delete"
              :loading="deletingId === row.id"
              @click="handleDelete(row)"
            >删除</el-button>
            <span v-if="!canManage" class="readonly-text">仅查看</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="formVisible"
      :title="editId !== null ? '编辑房间' : '新增房间'"
      width="520px"
      destroy-on-close
      :close-on-click-modal="false"
      :close-on-press-escape="!saving"
    >
      <el-form label-width="100px" class="room-form" @submit.prevent="handleSave">
        <el-form-item label="房间编号" required>
          <el-input v-model="roomNo" placeholder="例如：301" maxlength="30" clearable />
        </el-form-item>
        <el-form-item label="所在楼层" required>
          <el-input-number v-model="floor" :min="1" :max="100" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="房间类型" required>
          <el-select v-model="type" style="width: 100%">
            <el-option label="单人间" value="单人间" />
            <el-option label="双人间" value="双人间" />
            <el-option label="三人间" value="三人间" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用状态" required>
          <el-select v-model="status" style="width: 100%">
            <el-option label="空闲" value="空闲" />
            <el-option label="入住中" value="入住中" />
            <el-option label="维修中" value="维修中" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="saving" @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ saving ? '保存中...' : editId !== null ? '保存修改' : '确认新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.room-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  color: #303133;
}
.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.page-heading h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 650;
  color: #1f2937;
}
.page-heading p {
  margin: 8px 0 0;
  color: #909399;
  font-size: 14px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.stat-card,
.filter-card,
.table-card {
  border-radius: 10px;
  border-color: #ebeef5;
}
.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.stat-label {
  color: #909399;
  font-size: 13px;
}
.stat-value {
  margin-top: 10px;
  color: #303133;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 650;
}
.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  font-size: 22px;
}
.stat-icon.blue {
  color: #409eff;
  background: #ecf5ff;
}
.stat-icon.green {
  color: #67c23a;
  background: #f0f9eb;
}
.stat-icon.purple {
  color: #8b5cf6;
  background: #f5f0ff;
}
.stat-icon.orange {
  color: #e6a23c;
  background: #fdf6ec;
}
.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0 16px;
}
.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.filter-form :deep(.el-input),
.filter-form :deep(.el-select) {
  width: 180px;
}
.filter-actions :deep(.el-form-item__content) {
  gap: 8px;
}
.table-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.table-title {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}
.table-subtitle {
  margin-left: 12px;
  color: #909399;
  font-size: 13px;
  font-weight: 400;
}
.room-number {
  color: #303133;
  font-weight: 600;
}
.readonly-text {
  color: #909399;
  font-size: 13px;
}
.room-form {
  padding: 8px 12px 0 0;
}
@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 768px) {
  .page-heading {
    align-items: flex-start;
  }
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .stat-value {
    font-size: 24px;
  }
  .filter-form {
    gap: 12px;
  }
  .filter-form :deep(.el-form-item) {
    width: 100%;
  }
  .filter-form :deep(.el-input),
  .filter-form :deep(.el-select) {
    width: 100%;
  }
}
</style>
```