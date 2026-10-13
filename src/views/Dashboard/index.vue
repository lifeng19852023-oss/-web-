<script setup lang="ts">
import { onMounted, ref } from 'vue'
import StatCard from '../../components/StatCard.vue'
import GenderChart from '../../components/GenderChart.vue'
import AgeChart from '../../components/AgeChart.vue'
import { getElderlyStatistics } from '../../api/elderly'

const total = ref(0)
const male = ref(0)
const female = ref(0)
const ageGroup = ref([])
onMounted(async () => {
  try {
    const res = await getElderlyStatistics()

    console.log('统计数据：', res.data)

    const data = res.data.data

    total.value = data.total
    male.value = data.male
    female.value = data.female
    ageGroup.value = data.ageGroup
  } catch (error) {
    console.error('获取老人统计失败：', error)
  }
})
</script>

<template>
  <div class="dashboard">

    <h1>养老机构概览</h1>

    <div class="stats">

      <StatCard
        title="老人总数"
        :value="total"
      />

      <StatCard
        title="男性老人"
        :value="male"
      />

      <StatCard
        title="女性老人"
        :value="female"
      />

    </div>

    <div class="charts">
      <GenderChart
        :male="male"
        :female="female"
      />
      <AgeChart :data="ageGroup" />
    </div>


  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
</style>