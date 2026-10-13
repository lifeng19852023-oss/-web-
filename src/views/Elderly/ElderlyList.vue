```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue'
import ElderlyForm from '../../components/ElderlyForm.vue'
import { useElderly } from '../../composables/useElderly'

const saving = ref(false)
const {
  elderlyList,
  keyword,
  gender,
  minAge,
  maxAge,
  page,
  total,
  totalPages,
  loadElderlyList,
  handleSearch,
  handlePrevPage,
  handleNextPage,
  addElderly,
  editElderly,
  removeElderly
} = useElderly()

const showForm = ref(false)
const currentElderly = ref<any | null>(null)

function showAddForm() {
  currentElderly.value = null
  showForm.value = true
}

function handleEdit(elderly: any) {
  currentElderly.value = elderly
  showForm.value = true
}

function handleCancel() {
  if (saving.value) return
  showForm.value = false
  currentElderly.value = null
}

async function handleFormSave(data: any) {
  if (saving.value) return
  saving.value = true
  try {
    if (currentElderly.value) {
      await editElderly(currentElderly.value.id, data)
    } else {
      await addElderly(data)
    }
    ElMessage.success(currentElderly.value ? '编辑成功' : '新增成功')
    showForm.value = false
    currentElderly.value = null
  } catch (error) {
    ElMessage.error('保存失败，请检查数据或稍后重试')
    console.error(error)
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm(
      '删除后无法恢复，确定要删除这位老人吗？',
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    // 用户取消或关闭确认框，不执行删除
    return
  }

  try {
    await removeElderly(id)
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('删除失败，请稍后重试')
    console.error(error)
  }
}

function resetSearch() {
  keyword.value = ''
  gender.value = ''
  minAge.value = ''
  maxAge.value = ''
  handleSearch()
}

function handlePageChange(newPage: number) {
  if (newPage === page.value) return
  if (newPage === page.value - 1) {
    handlePrevPage()
  } else if (newPage === page.value + 1) {
    handleNextPage()
  } else {
    page.value = newPage
    loadElderlyList()
  }
}

onMounted(() => {
  loadElderlyList()
})
</script>

<template>
  <div class="elderly-page">
    <div class="page-heading">
      <div>
        <h1>老人管理</h1>
        <p>管理入住老人档案、基本信息及联系方式</p>
      </div>
      <el-button
        v-permission="'elderly:create'"
        type="primary"
        :icon="Plus"
        @click="showAddForm"
      >
        新增老人
      </el-button>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form class="search-form" @submit.prevent="handleSearch">
        <el-form-item label="姓名">
          <el-input
            v-model="keyword"
            placeholder="请输入老人姓名"
            clearable
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="性别">
          <el-select v-model="gender" placeholder="全部性别" clearable>
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>

        <el-form-item label="最小年龄">
          <el-input v-model="minAge" type="number" placeholder="最小年龄" clearable />
        </el-form-item>

        <el-form-item label="最大年龄">
          <el-input v-model="maxAge" type="number" placeholder="最大年龄" clearable />
        </el-form-item>

        <el-form-item class="search-actions">
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-heading">
          <span>老人档案列表</span>
          <span class="total-text">共 {{ total }} 条记录</span>
        </div>
      </template>

      <el-table
        :data="elderlyList"
        row-key="id"
        stripe
        border
        empty-text="暂无老人数据"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="姓名" min-width="120" show-overflow-tooltip />
        <el-table-column prop="gender" label="性别" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.gender === '男' ? 'primary' : 'danger'" effect="light">
              {{ row.gender || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="90" align="center" />
        <el-table-column prop="id_card" label="身份证号" min-width="190" show-overflow-tooltip />
        <el-table-column prop="phone" label="联系电话" min-width="140" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'elderly:update'"
              type="primary"
              link
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'elderly:delete'"
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <span class="pagination-info">
          第 {{ page }} / {{ Math.max(totalPages, 1) }} 页
        </span>
        <el-pagination
          :current-page="page"
          :page-count="Math.max(totalPages, 1)"
          layout="prev, pager, next"
          background
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="showForm"
      :title="currentElderly ? '编辑老人信息' : '新增老人'"
      width="600px"
      destroy-on-close
      :close-on-click-modal="false"
      :close-on-press-escape="!saving"
      :show-close="!saving"
    >
      <ElderlyForm
        :elderly="currentElderly"
        :saving="saving"
        @save="handleFormSave"
        @cancel="handleCancel"
      />
    </el-dialog>
  </div>
</template>

<style scoped>
.elderly-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.page-heading h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}
.page-heading p {
  margin: 8px 0 0;
  color: #909399;
  font-size: 14px;
}
.search-card,
.table-card {
  border-radius: 8px;
}
.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0 16px;
}
.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.search-form :deep(.el-input) {
  width: 180px;
}
.search-form :deep(.el-select) {
  width: 140px;
}
.search-form :deep(.search-actions .el-form-item__content) {
  gap: 8px;
}
.table-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 600;
}
.total-text {
  color: #909399;
  font-size: 13px;
  font-weight: 400;
}
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}
.pagination-info {
  color: #606266;
  font-size: 13px;
}
@media (max-width: 768px) {
  .page-heading {
    align-items: flex-start;
  }
  .search-form {
    gap: 12px;
  }
  .search-form :deep(.el-form-item) {
    width: 100%;
  }
  .search-form :deep(.el-input),
  .search-form :deep(.el-select) {
    width: 100%;
  }
}
</style>
```