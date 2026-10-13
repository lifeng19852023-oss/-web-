import { ref } from 'vue'

import {
  getElderlyList,
  createElderly,
  updateElderly,
  deleteElderly
} from '../api/elderly'

export function useElderly() {


  // =====================
  // 数据
  // =====================

  const elderlyList = ref<any[]>([])

  // =====================
  // 搜索条件
  // =====================

  const keyword = ref('')
  const gender = ref('')
  const minAge = ref('')
  const maxAge = ref('')

  // =====================
  // 分页
  // =====================

  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const totalPages = ref(0)


  // =====================
  // 获取老人列表
  // =====================

  async function loadElderlyList() {

    const res = await getElderlyList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      gender: gender.value,
      minAge: minAge.value,
      maxAge: maxAge.value
    })

    elderlyList.value = res.data.data

    total.value = res.data.pagination.total

    totalPages.value = res.data.pagination.totalPages
  }


  // =====================
  // 搜索
  // =====================

  function handleSearch() {

    page.value = 1

    loadElderlyList()
  }


  // =====================
  // 上一页
  // =====================

  function handlePrevPage() {

    if (page.value <= 1) {
      return
    }

    page.value--

    loadElderlyList()
  }


  // =====================
  // 下一页
  // =====================

  function handleNextPage() {

    if (page.value >= totalPages.value) {
      return
    }

    page.value++

    loadElderlyList()
  }


  // =====================
  // 新增
  // =====================

  async function addElderly(data: any) {

    await createElderly(data)

    await loadElderlyList()
  }


  // =====================
  // 修改
  // =====================

  async function editElderly(
    id: number,
    data: any
  ) {

    await updateElderly(id, data)

    await loadElderlyList()
  }


  // =====================
  // 删除
  // =====================

  async function removeElderly(id: number) {

    await deleteElderly(id)

    await loadElderlyList()
  }


  return {
    elderlyList,

    keyword,
    gender,
    minAge,
    maxAge,

    page,
    pageSize,
    total,
    totalPages,

    loadElderlyList,

    handleSearch,
    handlePrevPage,
    handleNextPage,

    addElderly,
    editElderly,
    removeElderly
  }
}