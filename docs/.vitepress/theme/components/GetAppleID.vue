<template>
  <div :key="route.fullPath">
    <div v-if="dataLoaded">
      <p>Message: {{ msg }}</p>

      <!-- 显示全部账号 -->
      <div v-if="showAll">
        <div
          v-for="(acc, i) in accounts"
          :key="acc?.id ?? i"
          style="padding: 10px 0; border-bottom: 1px solid #eee;"
        >
          <p>
            苹果账号: {{ acc.username }}
            <button @click="copyToClipboard(acc.username)">点击复制</button>
          </p>
          <p>
            苹果密码: {{ acc.password }}
            <button @click="copyToClipboard(acc.password)">点击复制</button>
          </p>
          <p>账号状态: {{ acc.message }}</p>
          <p>上次检查: {{ acc.last_check }}</p>
          <p>账号地区: {{ acc.region_display }}</p>
        </div>
      </div>

      <!-- 只显示某一个账号 -->
      <div v-else>
        <p>
          苹果账号: {{ current && current.username }}
          <button @click="copyToClipboard(current && current.username)">点击复制</button>
        </p>
        <p>
          苹果密码: {{ current && current.password }}
          <button @click="copyToClipboard(current && current.password)">点击复制</button>
        </p>
        <p>账号状态: {{ current && current.message }}</p>
        <p>上次检查: {{ current && current.last_check }}</p>
        <p>账号地区: {{ current && current.region_display }}</p>
      </div>
    </div>

    <div v-else>
      <p v-if="errorMsg">{{ errorMsg }}</p>
      <p v-else>Loading...</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

const props = defineProps({
  index: { type: [Number, String], default: 0 },         // 第几个账号（0 开始）
  showAll: { type: [Boolean, String], default: false },  // 显示全部
  api: { type: String, default: '/api-getappleid' }      // API 路径
})

const dataLoaded = ref(false)
const msg = ref('')
const accounts = ref([])
const errorMsg = ref('')

const parsedIndex = computed(() => {
  const n = Number(props.index)
  return Number.isFinite(n) ? n : 0
})

const showAll = computed(() => props.showAll === true || props.showAll === 'true')

const current = computed(() => (Array.isArray(accounts.value) ? accounts.value[parsedIndex.value] : null))

async function fetchData() {
  dataLoaded.value = false
  errorMsg.value = ''

  try {
    const response = await fetch(props.api)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()

    msg.value = data && data.msg ? data.msg : ''
    accounts.value = Array.isArray(data && data.accounts) ? data.accounts : []

    if (!showAll.value && !current.value) {
      errorMsg.value = `未找到第 ${parsedIndex.value} 个账号（accounts 长度=${accounts.value.length}）`
      return
    }

    dataLoaded.value = true
  } catch (e) {
    console.error('Error fetching data:', e)
    errorMsg.value = '无法加载数据，请稍后再试。'
  }
}

function copyToClipboard(text) {
  if (!text) return
  navigator.clipboard
    .writeText(text)
    .then(() => alert('复制成功: ' + text))
    .catch((err) => console.error('复制失败: ', err))
}

onMounted(fetchData)
</script>
