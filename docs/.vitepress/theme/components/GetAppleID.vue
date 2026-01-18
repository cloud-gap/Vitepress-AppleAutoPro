<template>
  <div :key="route.fullPath" class="wrap">
    <div v-if="dataLoaded">
      <div class="header">
        <div class="title">
          <div class="h1">Apple ID 获取</div>
          <div class="sub">Message：{{ msg }}</div>
        </div>

        <div class="actions">
          <button class="btn btn-ghost" @click="fetchData" :disabled="loading">
            {{ loading ? '刷新中…' : '刷新' }}
          </button>
        </div>
      </div>

      <!-- 显示全部账号 -->
      <div v-if="showAll" class="grid">
        <div
          v-for="(acc, i) in accounts"
          :key="acc?.id ?? i"
          class="card"
        >
          <div class="cardTop">
            <div class="left">
              <div class="cardTitle">
                账号 #{{ (acc?.id ?? i) }}
              </div>
              <div class="meta">
                <span class="pill" :class="acc?.status ? 'pill-ok' : 'pill-bad'">
                  {{ acc?.status ? '可用' : '不可用' }}
                </span>
                <span class="pill pill-soft">
                  {{ acc?.region_display || '未知地区' }}
                </span>
              </div>
            </div>

            <div class="right">
              <span class="hint">建议：只登录 App Store，不要登录 iCloud</span>
            </div>
          </div>

          <div class="row">
            <div class="label">苹果账号</div>
            <div class="value">
              <span class="mask" :class="{ reveal: revealed[accKey(acc, i)]?.user }">
                {{ revealed[accKey(acc, i)]?.user ? acc.username : '••••••••••••••••' }}
              </span>
            </div>
            <div class="ops">
              <button
                class="btn btn-primary"
                :disabled="copied[`u-${accKey(acc, i)}`]"
                @click="copyToClipboard(acc.username, `u-${accKey(acc, i)}`)"
              >
                {{ copied[`u-${accKey(acc, i)}`] ? '已复制' : '复制账号' }}
              </button>
              <button class="btn btn-ghost" @click="toggleReveal(accKey(acc, i), 'user')">
                {{ revealed[accKey(acc, i)]?.user ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>

          <div class="row">
            <div class="label">苹果密码</div>
            <div class="value">
              <span class="mask" :class="{ reveal: revealed[accKey(acc, i)]?.pass }">
                {{ revealed[accKey(acc, i)]?.pass ? acc.password : '••••••••••••••••' }}
              </span>
            </div>
            <div class="ops">
              <button
                class="btn btn-primary"
                :disabled="copied[`p-${accKey(acc, i)}`]"
                @click="copyToClipboard(acc.password, `p-${accKey(acc, i)}`)"
              >
                {{ copied[`p-${accKey(acc, i)}`] ? '已复制' : '复制密码' }}
              </button>
              <button class="btn btn-ghost" @click="toggleReveal(accKey(acc, i), 'pass')">
                {{ revealed[accKey(acc, i)]?.pass ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>

          <div class="divider"></div>

          <div class="kv">
            <div class="kvItem">
              <div class="k">账号状态</div>
              <div class="v">{{ acc?.message || '-' }}</div>
            </div>
            <div class="kvItem">
              <div class="k">上次检查</div>
              <div class="v">{{ acc?.last_check || '-' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 只显示单个账号 -->
      <div v-else>
        <div class="card">
          <div class="cardTop">
            <div class="left">
              <div class="cardTitle">账号 #{{ parsedIndex }}</div>
              <div class="meta">
                <span class="pill" :class="current?.status ? 'pill-ok' : 'pill-bad'">
                  {{ current?.status ? '可用' : '不可用' }}
                </span>
                <span class="pill pill-soft">{{ current?.region_display || '未知地区' }}</span>
              </div>
            </div>
            <div class="right">
              <span class="hint">建议：只登录 App Store，不要登录 iCloud</span>
            </div>
          </div>

          <div class="row">
            <div class="label">苹果账号</div>
            <div class="value">
              <span class="mask" :class="{ reveal: revealed.single?.user }">
                {{ revealed.single?.user ? current?.username : '••••••••••••••••' }}
              </span>
            </div>
            <div class="ops">
              <button
                class="btn btn-primary"
                :disabled="copied['u-single']"
                @click="copyToClipboard(current?.username, 'u-single')"
              >
                {{ copied['u-single'] ? '已复制' : '复制账号' }}
              </button>
              <button class="btn btn-ghost" @click="toggleReveal('single', 'user')">
                {{ revealed.single?.user ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>

          <div class="row">
            <div class="label">苹果密码</div>
            <div class="value">
              <span class="mask" :class="{ reveal: revealed.single?.pass }">
                {{ revealed.single?.pass ? current?.password : '••••••••••••••••' }}
              </span>
            </div>
            <div class="ops">
              <button
                class="btn btn-primary"
                :disabled="copied['p-single']"
                @click="copyToClipboard(current?.password, 'p-single')"
              >
                {{ copied['p-single'] ? '已复制' : '复制密码' }}
              </button>
              <button class="btn btn-ghost" @click="toggleReveal('single', 'pass')">
                {{ revealed.single?.pass ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>

          <div class="divider"></div>

          <div class="kv">
            <div class="kvItem">
              <div class="k">账号状态</div>
              <div class="v">{{ current?.message || '-' }}</div>
            </div>
            <div class="kvItem">
              <div class="k">上次检查</div>
              <div class="v">{{ current?.last_check || '-' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="accounts?.length === 0" class="empty">
        暂无账号数据
      </div>
    </div>

    <div v-else class="loadingBox">
      <p v-if="errorMsg" class="err">{{ errorMsg }}</p>
      <p v-else class="muted">Loading...</p>
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
const loading = ref(false)
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

async function fetchData() {
  loading.value = true
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
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
/* 基础：兼容浅色/深色（VitePress 会提供深色背景） */
.wrap {
  margin: 12px 0;
  font-size: 14px;
  line-height: 1.6;
}

.header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.h1 {
  font-size: 18px;
  font-weight: 700;
}

.sub {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.75;
}

.actions {
  display: flex;
  gap: 8px;
}

.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.card {
  border: 1px solid rgba(125, 125, 125, 0.25);
  border-radius: 14px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

/* 深色模式适配 */
:global(.dark) .card {
  background: rgba(24, 24, 24, 0.65);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
}

.cardTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.cardTitle {
  font-weight: 700;
  font-size: 15px;
}

.meta {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid rgba(125, 125, 125, 0.28);
  background: rgba(255, 255, 255, 0.6);
}

:global(.dark) .pill {
  background: rgba(30, 30, 30, 0.6);
}

.pill-ok {
  border-color: rgba(22, 163, 74, 0.35);
}

.pill-bad {
  border-color: rgba(220, 38, 38, 0.35);
}

.pill-soft {
  opacity: 0.85;
}

.hint {
  font-size: 12px;
  opacity: 0.75;
}

.row {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
}

.label {
  font-size: 12px;
  opacity: 0.8;
}

.value {
  overflow: hidden;
}

.ops {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.divider {
  height: 1px;
  background: rgba(125, 125, 125, 0.22);
  margin: 10px 0;
}

.kv {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;
}

.kvItem .k {
  font-size: 12px;
  opacity: 0.75;
}
.kvItem .v {
  margin-top: 2px;
  font-weight: 600;
  word-break: break-word;
}

/* 黑框遮罩（默认不可见） */
.mask {
  display: inline-block;
  min-width: 200px;
  padding: 5px 10px;
  border-radius: 10px;
  background: #111;
  color: transparent;
  user-select: none;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mask.reveal {
  color: #fff;
}

/* 按钮 */
.btn {
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid rgba(125, 125, 125, 0.28);
  background: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  transition: transform 0.06s ease, opacity 0.15s ease;
  font-size: 13px;
}
:global(.dark) .btn {
  background: rgba(30, 30, 30, 0.65);
}

.btn:active {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  border-color: rgba(59, 130, 246, 0.35);
}

.btn-ghost {
  opacity: 0.9;
}

.loadingBox {
  padding: 14px;
  border-radius: 14px;
  border: 1px dashed rgba(125, 125, 125, 0.28);
}

.err {
  color: #dc2626;
  font-weight: 600;
}

.muted {
  opacity: 0.7;
}

.empty {
  margin-top: 12px;
  opacity: 0.7;
  text-align: center;
}
</style>
