<template>
  <div :key="route.fullPath">
    <div v-if="dataLoaded">
      <p>Message: {{ msg }}</p>

      <!-- 显示全部账号 -->
      <div v-if="showAll">
        <div
          v-for="(acc, i) in accounts"
          :key="accKey(acc, i)"
          style="padding: 10px 0; border-bottom: 1px solid #eee;"
        >
          <p class="row">
            <span class="label">苹果账号:</span>
            <span class="mask" :class="{ reveal: isRevealed(accKey(acc, i), 'user') }">
              {{ isRevealed(accKey(acc, i), 'user') ? acc.username : maskedText }}
            </span>
            <button class="btn" @click="copyToClipboard(acc.username)">复制账号</button>
            <button class="btn" @click="toggleReveal(accKey(acc, i), 'user')">
              {{ isRevealed(accKey(acc, i), 'user') ? '隐藏' : '显示' }}
            </button>
          </p>

          <p class="row">
            <span class="label">苹果密码:</span>
            <span class="mask" :class="{ reveal: isRevealed(accKey(acc, i), 'pass') }">
              {{ isRevealed(accKey(acc, i), 'pass') ? acc.password : maskedText }}
            </span>
            <button class="btn" @click="copyToClipboard(acc.password)">复制密码</button>
            <button class="btn" @click="toggleReveal(accKey(acc, i), 'pass')">
              {{ isRevealed(accKey(acc, i), 'pass') ? '隐藏' : '显示' }}
            </button>
          </p>

          <p>账号状态: {{ acc.message }}</p>
          <p>上次检查: {{ acc.last_check }}</p>
          <p>账号地区: {{ acc.region_display }}</p>
        </div>
      </div>

      <!-- 只显示某一个账号 -->
      <div v-else>
        <p v-if="!current">未找到第 {{ parsedIndex }} 个账号（accounts 长度={{ accounts.length }}）</p>

        <div v-else>
          <p class="row">
            <span class="label">苹果账号:</span>
            <span class="mask" :class="{ reveal: isRevealed(accKey(current, parsedIndex), 'user') }">
              {{ isRevealed(accKey(current, parsedIndex), 'user') ? current.username : maskedText }}
            </span>
            <button class="btn" @click="copyToClipboard(current.username)">复制账号</button>
            <button class="btn" @click="toggleReveal(accKey(current, parsedIndex), 'user')">
              {{ isRevealed(accKey(current, parsedIndex), 'user') ? '隐藏' : '显示' }}
            </button>
          </p>

          <p class="row">
            <span class="label">苹果密码:</span>
            <span class="mask" :class="{ reveal: isRevealed(accKey(current, parsedIndex), 'pass') }">
              {{ isRevealed(accKey(current, parsedIndex), 'pass') ? current.password : maskedText }}
            </span>
            <button class="btn" @click="copyToClipboard(current.password)">复制密码</button>
            <button class="btn" @click="toggleReveal(accKey(current, parsedIndex), 'pass')">
              {{ isRevealed(accKey(current, parsedIndex), 'pass') ? '隐藏' : '显示' }}
            </button>
          </p>

          <p>账号状态: {{ current.message }}</p>
          <p>上次检查: {{ current.last_check }}</p>
          <p>账号地区: {{ current.region_display }}</p>
        </div>
      </div>

      <div class="hint">
        <span>口令：</span>
        <button class="btn" @click="resetKey">重新输入口令</button>
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

/**
 * 用法：
 * <GetAppleID />                    // 默认第 0 个
 * <GetAppleID :index="1" />         // 第 2 个
 * <GetAppleID showAll="true" />     // 显示全部
 * <GetAppleID api="/api-getappleid" />
 */
const props = defineProps({
  index: { type: [Number, String], default: 0 },
  showAll: { type: [Boolean, String], default: false },
  api: { type: String, default: '/api-getappleid' }
})

const dataLoaded = ref(false)
const msg = ref('')
const accounts = ref([])
const errorMsg = ref('')

const maskedText = '████████████████'

const parsedIndex = computed(() => {
  const n = Number(props.index)
  return Number.isFinite(n) ? n : 0
})

const showAll = computed(() => props.showAll === true || props.showAll === 'true')

const current = computed(() => (Array.isArray(accounts.value) ? accounts.value[parsedIndex.value] : null))

// 每个账号一个 reveal 状态（user/pass 分开）
const revealed = reactive({})

function accKey(acc, i) {
  return acc && acc.id != null ? String(acc.id) : String(i)
}
function isRevealed(key, field) {
  return !!(revealed[key] && revealed[key][field])
}
function toggleReveal(key, field) {
  if (!revealed[key]) revealed[key] = { user: false, pass: false }
  revealed[key][field] = !revealed[key][field]
}

// ====== 口令管理（方案 B）======
const KEY_STORAGE = 'APPLE_API_KEY'

function getKeySilently() {
  return localStorage.getItem(KEY_STORAGE) || ''
}

function askKey() {
  const k = prompt('请输入访问口令（用于获取账号/密码）') || ''
  if (k) localStorage.setItem(KEY_STORAGE, k)
  return k
}

function resetKey() {
  localStorage.removeItem(KEY_STORAGE)
  // 立刻重拉一次（让用户重新输入）
  fetchData(true)
}

async function fetchData(forceAskKey = false) {
  dataLoaded.value = false
  errorMsg.value = ''

  let key = getKeySilently()
  if (forceAskKey || !key) {
    key = askKey()
  }

  if (!key) {
    errorMsg.value = '未输入口令，无法获取账号信息。'
    return
  }

  try {
    const response = await fetch(props.api, {
      headers: {
        'x-access-key': key
      }
    })

    // 口令错误/无权限：清掉口令，提示重输
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem(KEY_STORAGE)
      errorMsg.value = '口令错误或无权限，请点击“重新输入口令”。'
      return
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      errorMsg.value = `请求过于频繁（被限流）。请稍后再试。${retryAfter ? 'Retry-After: ' + retryAfter + 's' : ''}`
      return
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    msg.value = data?.msg ?? ''
    accounts.value = Array.isArray(data?.accounts) ? data.accounts : []
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
    .then(() => alert('复制成功'))
    .catch((err) => console.error('复制失败: ', err))
}

onMounted(() => fetchData(false))
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 6px 0;
}

.label {
  min-width: 72px;
}

.mask {
  display: inline-block;
  min-width: 180px;
  padding: 4px 10px;
  border-radius: 8px;
  background: #111;
  color: transparent;
  user-select: none;
  letter-spacing: 1px;
}
.mask.reveal {
  color: #fff;
}

.btn {
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: transparent;
  cursor: pointer;
}

.hint {
  margin-top: 10px;
  opacity: 0.8;
}
</style>
