
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'
import { ElMessage } from 'element-plus'
import { getDashboardStatistics } from '@/api/dashboard'

interface AgeGroupItem {
  ageGroup: string
  total: number
}
interface CareTrendItem {
  date: string
  total: number
}
interface DashboardStatistics {
  elderly?: {
    total?: number
    male?: number
    female?: number
  }
  admission?: {
    current?: number
  }
  bed?: {
    used?: number
    empty?: number
  }
  care?: {
    today?: number
    trend?: CareTrendItem[]
  }
  ageGroup?: AgeGroupItem[]
}

const statistics = ref<DashboardStatistics>({})
const loading = ref(false)
const genderChartEl = ref<HTMLDivElement | null>(null)
const ageChartEl = ref<HTMLDivElement | null>(null)
const bedChartEl = ref<HTMLDivElement | null>(null)
const careChartEl = ref<HTMLDivElement | null>(null)

let genderChart: ECharts | null = null
let ageChart: ECharts | null = null
let bedChart: ECharts | null = null
let careChart: ECharts | null = null
let resizeObserver: ResizeObserver | null = null
let requestId = 0

function createChart(
  chart: ECharts | null,
  dom: HTMLDivElement | null
): ECharts | null {
  if (!dom) return chart
  if (chart && !chart.isDisposed() && chart.getDom() === dom) return chart
  if (chart && !chart.isDisposed()) chart.dispose()
  return echarts.init(dom)
}

function updateCharts() {
  genderChart = createChart(genderChart, genderChartEl.value)
  ageChart = createChart(ageChart, ageChartEl.value)
  bedChart = createChart(bedChart, bedChartEl.value)
  careChart = createChart(careChart, careChartEl.value)

  genderChart?.setOption({
    title: { text: '老人性别比例', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['35%', '60%'],
      data: [
        { value: statistics.value.elderly?.male ?? 0, name: '男性' },
        { value: statistics.value.elderly?.female ?? 0, name: '女性' }
      ]
    }]
  } satisfies EChartsOption)

  ageChart?.setOption({
    title: { text: '老人年龄分布' },
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, bottom: 30, top: 55 },
    xAxis: {
      type: 'category',
      data: (statistics.value.ageGroup ?? []).map(item => item.ageGroup),
      axisLabel: { interval: 0, rotate: 20 }
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: '人数',
      type: 'bar',
      data: (statistics.value.ageGroup ?? []).map(item => item.total)
    }]
  } satisfies EChartsOption)

  bedChart?.setOption({
    title: { text: '床位使用情况', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['35%', '60%'],
      data: [
        { value: statistics.value.bed?.used ?? 0, name: '已入住' },
        { value: statistics.value.bed?.empty ?? 0, name: '空闲' }
      ]
    }]
  } satisfies EChartsOption)

  careChart?.setOption({
    title: { text: '近7天护理趋势' },
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, bottom: 30, top: 55 },
    xAxis: {
      type: 'category',
      data: (statistics.value.care?.trend ?? []).map(item => item.date)
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: '护理次数',
      type: 'line',
      smooth: true,
      data: (statistics.value.care?.trend ?? []).map(item => item.total)
    }]
  } satisfies EChartsOption)
}

function handleResize() {
  genderChart?.resize()
  ageChart?.resize()
  bedChart?.resize()
  careChart?.resize()
}

async function loadData() {
  const currentRequestId = ++requestId
  loading.value = true
  try {
    const res = await getDashboardStatistics()
    if (currentRequestId !== requestId) return
    const data = res.data?.data
    if (!data || typeof data !== 'object') {
      throw new Error('统计接口返回的数据格式不正确')
    }
    statistics.value = data as DashboardStatistics
    await nextTick()
    if (currentRequestId === requestId) updateCharts()
  } catch (error) {
    if (currentRequestId === requestId) {
      console.error('加载首页统计失败：', error)
      ElMessage.error('首页统计加载失败，请稍后重试')
    }
  } finally {
    if (currentRequestId === requestId) loading.value = false
  }
}

function disposeCharts() {
  genderChart?.dispose()
  ageChart?.dispose()
  bedChart?.dispose()
  careChart?.dispose()
  genderChart = ageChart = bedChart = careChart = null
}

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await nextTick()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(handleResize)
    ;[genderChartEl.value, ageChartEl.value, bedChartEl.value, careChartEl.value]
      .forEach(dom => {
        if (dom) resizeObserver?.observe(dom)
      })
  }
  await loadData()
})

onBeforeUnmount(() => {
  requestId++
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  disposeCharts()
})
</script>

<template>
  <div class="dashboard" v-loading="loading">
    <div class="page-header">
      <h2>养老机构首页</h2>
      <el-button type="primary" :loading="loading" @click="loadData">刷新数据</el-button>
    </div>
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="12" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">老人总数</div>
          <div class="stat-value">{{ statistics.elderly?.total ?? 0 }}</div>
          <div class="stat-desc">机构老人档案总数</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">当前入住</div>
          <div class="stat-value">{{ statistics.admission?.current ?? 0 }}</div>
          <div class="stat-desc">当前在住老人数量</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">空闲床位</div>
          <div class="stat-value">{{ statistics.bed?.empty ?? 0 }}</div>
          <div class="stat-desc">当前可安排床位</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">今日护理</div>
          <div class="stat-value">{{ statistics.care?.today ?? 0 }}</div>
          <div class="stat-desc">今日护理记录数量</div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <div ref="genderChartEl" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <div ref="ageChartEl" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <div ref="bedChartEl" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <div ref="careChartEl" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard { padding: 4px; }
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.page-header h2 { margin: 0; font-size: 22px; font-weight: 600; }
.stat-row, .chart-row { row-gap: 20px; }
.stat-card { height: 150px; }
.stat-label { color: #606266; font-size: 14px; }
.stat-value { margin: 15px 0 10px; color: #303133; font-size: 32px; font-weight: 600; }
.stat-desc { color: #909399; font-size: 12px; }
.chart { width: 100%; height: 320px; }
@media (max-width: 768px) {
  .stat-card { height: 140px; }
  .stat-value { font-size: 26px; }
  .chart { height: 280px; }
}
</style>
