<template>
  <div :key="route.fullPath">
    <div v-if="dataLoaded">
      <p>Message: {{ msg }}</p>

      <!-- 显示全部账号 -->
      <div v-if="showAll">
        <div
          v-for="(acc, i) in accounts"
          :key="acc?.id ?? acc?.username ?? i"
          style="padding: 12px 0; border-bottom: 1px solid #eee;"
        >
          <p>
            苹果账号:
            <span class="mask" :class="{ reveal: revealed[accKey(acc, i)]?.user }">
              {{ revealed[accKey(acc, i)]?.user ? acc.username : '••••••••••••••••' }}
            </span>

            <button
              class="btn"
              :disabled="copied[`u-${accKey(acc, i)}`]"
              @click="copyToClipboard(acc.username, `u-${accKey(acc, i)}`)"
            >
              {{ copied[`u-${accKey(acc, i)}`] ? '已复制' : '复制账号' }}
            </button>

            <button class="btn" @click="toggleReveal(accKey(acc, i), 'user')">
              {{ revealed[accKey(acc, i)]?.user ? '隐藏' : '显示' }}
            </button>
          </p>

          <p>
            苹果密码:
            <span class="mask" :class="{ reveal: revealed[accKey(acc, i)]?.pass }">
              {{ revealed[accKey(acc, i)]?.pass ? acc.password : '••••••••••••••••' }}
            </span>

            <button
              class="btn"
              :disabled="copied[`p-${accKey(acc, i)}`]"
              @click="copyToClipboard(acc.password, `p-${accKey(acc, i)}`)"
            >
              {{ copied[`p-${accKey(acc, i)}`] ? '已复制' : '复制密码' }}
            </button>

            <button class="btn" @click="toggleReveal(accKey(acc, i), 'pass')">
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

          <button
            class="btn"
            :disabled="copied['u-single']"
            @click="copyToClipboard(current?.username, 'u-single')"
          >
            {{ copied['u-single'] ? '已复制' : '复制账号' }}
          </button>

          <button class="btn" @click="toggleReveal('single', 'user')">
            {{ revealed.single?.user ? '隐藏' : '显示' }}
          </button>
        </p>

        <p>
          苹果密码:
          <span class="mask" :class="{ reveal: revealed.single?.pass }">
            {{ revealed.single?.pass ? current?.password : '••••••••••••••••' }}
          </span>

          <button
            class="btn"
            :disabled="copied['p-single']"
            @click="copyToClipboard(current?.password, 'p-single')"
          >
            {{ copied['p-single'] ? '已复制' : '复制密码' }}
          </button>

          <button class="btn" @click="toggleReveal('single', 'pass')">
            {{ revealed.single?.pass ? '隐藏' : '显示' }}
          </button>
        </p>

        <p>账号状态: {{ current?.message }}</p>
        <p>上次检查: {{ current?.last_check }}</p>
        <p>账号地区: {{ current?.region_display }}</p>

        <p v-if="!current" style="margin-top: 10px;">
          未找到第 {{ parsedIndex }} 个账号（accounts={{ accounts.length }}）
        </p>
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
  // 优先用 username 做 key（防止 acc.id 缺失/重复导致状态错乱）
  return (acc && acc.username) ? String(acc.username) : (acc && acc.id != null ? String(acc.id) : String(i))
}

function toggleReveal(key, field) {
  if (!revealed[key]) revealed[key] = { user: false, pass: false }
  revealed[key][field] = !revealed[key][field]
}

/* 复制状态：复制后按钮显示“已复制”，1.5s 后恢复 */
const copied = reactive({})

function markCopied(key) {
  copied[key] = true
  setTimeout(() => {
    copied[key] = false
  }, 1500)
}

function copyToClipboard(text, key) {
  if (!text) return
  navigator.clipboard
    .writeText(text)
    .then(() => markCopied(key))
    .catch((err) => console.error('复制失败:', err))
}

const parsedIndex = computed(() => {
  const n = Number(props.index)
  return Number.isFinite(n) ? n : 0
})

const showAll = computed(() => props.showAll === true || props.showAll === 'true')

const current = computed(() => {
  return Array.isArray(accounts.value) ? accounts.value[parsedIndex.value] : null
})

function dedupeAccounts(list) {
  // ✅ 按 username 去重（你现在出现 1 和 3 一样，基本就是这里能修掉）
  const seen = new Set()
  return list.filter((a) => {
    const key = a?.username
    if (!key) return false
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchData() {
  dataLoaded.value = false
  errorMsg.value = ''

  try {
    const response = await fetch(props.api)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()

    msg.value = data?.msg ?? ''

    const list = Array.isArray(data?.accounts) ? data.accounts : []
    accounts.value = dedupeAccounts(list)

    dataLoaded.value = true
  } catch (e) {
    console.error(e)
    errorMsg.value = '无法加载数据，请稍后再试'
  }
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

.btn {
  margin-right: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
