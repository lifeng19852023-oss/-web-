<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  data: Array<{
    ageGroup: string
    total: number
  }>
}>()

const chartRef = ref<HTMLDivElement | null>(null)

let chart: echarts.ECharts | null = null

function updateChart() {
  if (!chart) return

  chart.setOption({
    title: {
      text: '老人年龄分布'
    },

    tooltip: {
      trigger: 'axis'
    },

    xAxis: {
      type: 'category',
      data: props.data.map(item => item.ageGroup)
    },

    yAxis: {
      type: 'value'
    },

    series: [
      {
        type: 'bar',
        data: props.data.map(item => item.total)
      }
    ]
  })
}

onMounted(() => {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)

  updateChart()
})

watch(
  () => props.data,
  () => {
    updateChart()
  },
  {
    deep: true
  }
)

onBeforeUnmount(() => {
  chart?.dispose()
})
</script>

<template>
  <div ref="chartRef" class="chart"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 400px;
}
</style>