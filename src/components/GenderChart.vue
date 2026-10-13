<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  male: number
  female: number
}>()

const chartRef = ref<HTMLDivElement | null>(null)

let chart: echarts.ECharts | null = null

function updateChart() {
  if (!chart) return

  chart.setOption({
    title: {
      text: '老人性别分布'
    },

    tooltip: {
      trigger: 'item'
    },

    series: [
      {
        type: 'pie',

        data: [
          {
            name: '男性',
            value: props.male
          },
          {
            name: '女性',
            value: props.female
          }
        ]
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
  () => [props.male, props.female],
  () => {
    updateChart()
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