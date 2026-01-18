<template>
  <div :key="route.fullPath">
    <div v-if="dataLoaded">
      <p>Message: {{ msg }}</p>

      <!-- 显示全部账号 -->
      <div v-if="showAll">
        <div
          v-for="(acc, i) in accounts"
          :key="acc?.id ?? i"
          style="padding: 12px 0; border-bottom: 1px solid #eee;"
        >
          <p>
            苹果账号:
            <span class="mask" :class="{ reveal: revealed[accKey(acc, i)]?.user }">
              {{ revealed[accKey(acc, i)]?.user ? acc.username : '••••••••••••••••' }}
            </span>
            <button @click="copyToClipboard(acc.username)">复制账号</button>
            <button @click="toggleReveal(accKey(acc, i), 'user')">
              {{ revealed[accKey(acc, i)]?.user ? '隐藏' : '显示' }}
            </button>
          </p>

          <p>
            苹果密码:
            <span class="mask" :class="{ reveal: revealed[accKey(acc, i)]?.pass }">
              {{ revealed[accKey(acc, i)]?.pass ? acc.password : '••••••••••••••••' }}
            </span>
            <button @click="copyToClipboard(acc.password)">复制密码</button>
            <button @click="toggleReveal(accKey(acc, i), 'pass')">
              {{ revealed[accKey(acc, i)]?.pass ? '隐藏' : '显示' }}
            </button>
          </p>

          <p>账号状态: {{ acc.message }}</p>
          <p>上次检查: {{ acc.last_check }}</p>
          <p>账号地区: {{ acc.region_display }}</p>
        </div>
      </div>

      <!-- 只显示单个账号 -->
      <div v-else>
        <p>
          苹果账号:
          <span class="mask" :class="{ reveal: revealed.single?.user }">
            {{ revealed.single?.user ? current?.username : '••••••••••••••••' }}
          </span>
          <button @click="copyToClipboard(current?.username)">复制账号</button>
          <button @click="toggleReveal('single', 'user')">
            {{ revealed.single?.user ? '隐藏' : '显示' }}
          </button>
        </p>

        <p>
          苹果密码:
          <span class="mask" :class="{ reveal: revealed.single?.pass }">
            {{ revealed.single?.pass ? current?.password : '••••••••••••••••' }}
          </span>
          <button @click="copyToClipboard(current?.password)">复制密码</button>
          <button @click="toggleReveal('single', 'pass')">
            {{ revealed.single?.pass ? '隐藏' : '显示' }}
          </button>
        </p>

        <p>账号状态: {{ current?.message }}</p>
        <p>上次检查: {{ current?.last_check }}</p>
        <p>账号地区: {{ current?.region_display }}</p>
      </div>
    </div>

    <div v-else>
      <p v-if="errorMsg">{{ errorMsg }}</p>
      <p v-else>Loading...</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

const props = defineProps({
  index: { type: [Number, String], default: 0 },
  showAll: { type: [Boolean, String], default: false },
  api: { type: String, default: '/api-getappleid' }
})

const dataLoaded = ref(false)
const msg = ref('')
const accounts = ref([])
const errorMsg = ref('')

/* 显示/隐藏状态 */
const revealed = reactive({})

function accKey(acc, i) {
  return acc && acc.id != null ? String(acc.id) : String(i)
}

function toggleReveal(key, field) {
  if (!revealed[key]) revealed[key] = { user: false, pass: false }
  revealed[key][field] = !revealed[key][field]
}

const parsedIndex = computed(() => {
  const n = Number(props.index)
  return Number.isFinite(n) ? n : 0
})

const showAll = computed(() => props.showAll === true || props.showAll === 'true')

const current = computed(() => {
  return Array.isArray(accounts.value) ? accounts.value[parsedIndex.value] : null
})

async function fetchData() {
  dataLoaded.value = false
  errorMsg.value = ''

  try {
    const response = await fetch(props.api)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()

    msg.value = data?.msg ?? ''
    accounts.value = Array.isArray(data?.accounts) ? data.accounts : []

    if (!showAll.value && !current.value) {
      errorMsg.value = `未找到第 ${parsedIndex.value} 个账号（accounts=${accounts.value.length}）`
      return
    }

    dataLoaded.value = true
  } catch (e) {
    console.error(e)
    errorMsg.value = '无法加载数据，请稍后再试'
  }
}

function copyToClipboard(text) {
  if (!text) return
  navigator.clipboard
    .writeText(text)
    .then(() => alert('复制成功'))
    .catch((err) => console.error('复制失败:', err))
}

onMounted(fetchData)
</script>

<style scoped>
.mask {
  display: inline-block;
  min-width: 180px;
  padding: 3px 10px;
  border-radius: 6px;
  background: #111;
  color: transparent;
  user-select: none;
  vertical-align: middle;
  margin: 0 8px;
}
.mask.reveal {
  color: #fff;
}
</style>
