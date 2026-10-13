```vue
<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

interface ElderlyFormData {
  name: string
  gender: string
  age: string | number
  id_card: string
  phone: string
}

const props = defineProps<{
  elderly?: Partial<ElderlyFormData> | null
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [data: ElderlyFormData & { age: number }]
  cancel: []
}>()

const formRef = ref<FormInstance>()
const form = reactive<ElderlyFormData>({
  name: '', gender: '', age: '', id_card: '', phone: ''
})

const rules: FormRules<ElderlyFormData> = {
  name: [
    { required: true, message: '请输入老人姓名', trigger: 'blur' },
    { min: 2, max: 30, message: '姓名长度应为 2～30 个字符', trigger: 'blur' }
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  age: [{
    validator: (_rule, value, callback) => {
      if (value === '' || value === null || value === undefined) {
        callback(new Error('请输入年龄'))
      } else if (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 150) {
        callback(new Error('年龄必须是 0～150 的整数'))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }],
  id_card: [{
    validator: (_rule, value, callback) => {
      if (!value || /^\d{17}[\dXx]$/.test(value)) callback()
      else callback(new Error('身份证号应为 18 位'))
    },
    trigger: 'blur'
  }],
  phone: [{
    validator: (_rule, value, callback) => {
      if (!value || /^1[3-9]\d{9}$/.test(value)) callback()
      else callback(new Error('请输入有效的 11 位手机号'))
    },
    trigger: 'blur'
  }]
}

function initForm() {
  Object.assign(form, {
    name: props.elderly?.name ?? '',
    gender: props.elderly?.gender ?? '',
    age: props.elderly?.age ?? '',
    id_card: props.elderly?.id_card ?? '',
    phone: props.elderly?.phone ?? ''
  })
  formRef.value?.clearValidate()
}

watch(() => props.elderly, initForm, { immediate: true })

async function handleSave() {
  if (props.saving || !formRef.value) return
  try {
    await formRef.value.validate()
    emit('save', {
      ...form,
      age: Number(form.age),
      id_card: form.id_card.trim(),
      phone: form.phone.trim()
    })
  } catch {
    // 校验失败时，表单会显示对应的错误信息
  }
}

function handleCancel() {
  if (!props.saving) emit('cancel')
}
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    status-icon
  >
    <el-form-item label="老人姓名" prop="name">
      <el-input v-model="form.name" placeholder="请输入老人姓名" maxlength="30" clearable />
    </el-form-item>
    <el-form-item label="性别" prop="gender">
      <el-radio-group v-model="form.gender">
        <el-radio value="男">男</el-radio>
        <el-radio value="女">女</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="年龄" prop="age">
      <el-input v-model="form.age" type="number" placeholder="请输入年龄" min="0" max="150">
        <template #append>岁</template>
      </el-input>
    </el-form-item>
    <el-form-item label="身份证号" prop="id_card">
      <el-input v-model="form.id_card" placeholder="请输入身份证号" maxlength="18" clearable />
    </el-form-item>
    <el-form-item label="联系电话" prop="phone">
      <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" clearable />
    </el-form-item>
    <el-form-item class="form-actions">
      <el-button :disabled="saving" @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">
        {{ saving ? '保存中...' : '保存' }}
      </el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.form-actions {
  margin-bottom: 0;
  padding-top: 8px;
}
.form-actions :deep(.el-form-item__content) {
  justify-content: flex-end;
}
</style>
```