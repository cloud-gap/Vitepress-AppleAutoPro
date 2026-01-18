<template>
  <div :key="route.fullPath" class="wrap">
    <!-- 顶部红色提醒条 -->
    <div class="alert" role="alert">
      <div class="alertIcon">⚠️</div>
      <div class="alertText">
        <div class="alertTitle">重要提醒</div>
        <div class="alertDesc">
          请 <b>只登录 App Store</b> 下载应用，<b>不要登录 iCloud</b>，避免触发安全验证/锁定。
        </div>
      </div>

      <button class="btn btn-ghost alertBtn" @click="fetchData" :disabled="loading">
        {{ loading ? '刷新中…' : '刷新' }}
      </button>
    </div>

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
        <div v-for="(acc, i) in accounts" :key="acc?.id ?? i" class="card">
          <div class="cardTop">
            <div class="left">
              <div class="cardTitle">账号 #{{ acc?.id ?? i }}</div>
              <div class="meta">
                <span class="pill" :class="acc?.status ? 'pill-ok' : 'pill-bad'">
                  {{ acc?.status ? '可用' : '不可用' }}
                </span>
                <span class="pill pill-soft">{{ acc?.region_display || '未知地区' }}</span>
              </div>
            </div>

            <div class="right">
              <div class="hint">只登录 App Store，不要登录 iCloud</div>
            </div>
          </div>

          <!-- 账号行 -->
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
                @click="revealAndCopy(acc.username, accKey(acc, i), 'user', `u-${accKey(acc, i)}`)"
              >
                {{ copied[`u-${accKey(acc, i)}`] ? '已复制' : '显示并复制' }}
              </button>
            </div>
          </div>

          <!-- 密码行 -->
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
                @click="revealAndCopy(acc.password, accKey(acc, i), 'pass', `p-${accKey(acc, i)}`)"
              >
                {{ copied[`p-${accKey(acc, i)}`] ? '已复制' : '显示并复制' }}
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

      <!-- 单个账号 -->
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
              <div class="hint">只登录 App Store，不要登录 iCloud</div>
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
                @click="revealAndCopy(current?.username, 'single', 'user', 'u-single')"
              >
                {{ copied['u-single'] ? '已复制' : '显示并复制' }}
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
                @click="revealAndCopy(current?.password, 'single', 'pass', 'p-single')"
              >
                {{ copied['p-single'] ? '已复制' : '显示并复制' }}
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

      <div v-if="accounts?.length === 0" class="empty">暂无账号数据</div>
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

const revealed = reactive({})
const copied = reactive({})

function accKey(acc, i) {
  return acc && acc.id != null ? String(acc.id) : String(i)
}

function ensureRevealState(key) {
  if (!revealed[key]) revealed[key] = { user: false, pass: false }
}

function markCopied(key) {
  copied[key] = true
  setTimeout(() => {
    copied[key] = false
  }, 1500)
}

function copy(text, copiedKey) {
  if (!text) return
  navigator.clipboard
    .writeText(text)
    .then(() => markCopied(copiedKey))
    .catch((err) => console.error('复制失败:', err))
}

/**
 * 点击一个按钮 = 自动显示 + 自动复制
 * @param {string} text 要复制的内容
 * @param {string} revealKey revealed 对象 key（single 或账号 id）
 * @param {'user'|'pass'} field 显示的字段
 * @param {string} copiedKey copied 对象 key
 */
function revealAndCopy(text, revealKey, field, copiedKey) {
  ensureRevealState(revealKey)
  revealed[revealKey][field] = true // 自动显示
  copy(text, copiedKey) // 自动复制
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
/* VitePress 变量：夜间/白天自动适配 */
.wrap {
  margin: 12px 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

.header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0 12px;
}

.h1 {
  font-size: 18px;
  font-weight: 900;
}

.sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--vp-c-text-2);
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

/* 顶部红色提醒条 */
.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--vp-c-danger-1) 35%, transparent);
  background: color-mix(in srgb, var(--vp-c-danger-1) 14%, transparent);
}

.alertIcon {
  font-size: 18px;
  line-height: 1;
}

.alertText {
  flex: 1;
  min-width: 0;
}

.alertTitle {
  font-weight: 900;
}

.alertDesc {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.alertBtn {
  white-space: nowrap;
}

/* 卡片 */
.card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  padding: 14px;
  background: var(--vp-c-bg-elv);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.10);
}

.cardTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.cardTitle {
  font-weight: 900;
  font-size: 15px;
}

.meta {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hint {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

.pill-ok {
  border-color: color-mix(in srgb, var(--vp-c-green-1) 40%, var(--vp-c-divider));
  color: var(--vp-c-text-1);
}

.pill-bad {
  border-color: color-mix(in srgb, var(--vp-c-danger-1) 45%, var(--vp-c-divider));
  color: var(--vp-c-text-1);
}

.pill-soft {
  opacity: 0.9;
}

/* 行布局 */
.row {
  display: grid;
  grid-template-columns: 82px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
}

.label {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.value {
  min-width: 0;
  overflow: hidden;
}

.ops {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* 分隔线 */
.divider {
  height: 1px;
  background: var(--vp-c-divider);
  margin: 10px 0;
}

/* kv */
.kv {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
}

.kvItem .k {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.kvItem .v {
  margin-top: 2px;
  font-weight: 650;
  color: var(--vp-c-text-1);
  word-break: break-word;
}

/* 遮罩 */
.mask {
  display: inline-block;
  width: 100%;
  max-width: 420px;
  padding: 7px 10px;
  border-radius: 14px;
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  color: transparent;
  user-select: none;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mask.reveal {
  color: var(--vp-c-text-1);
}

/* 按钮 */
.btn {
  padding: 7px 12px;
  border-radius: 14px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: background 0.15s ease, transform 0.06s ease, opacity 0.15s ease;
  font-size: 13px;
}

.btn:hover {
  background: var(--vp-c-bg);
}

.btn:active {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 55%, var(--vp-c-divider));
  background: color-mix(in srgb, var(--vp-c-brand-1) 22%, var(--vp-c-bg-soft));
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--vp-c-brand-1) 28%, var(--vp-c-bg-soft));
}

.btn-ghost {
  opacity: 0.95;
}

.loadingBox {
  padding: 14px;
  border-radius: 18px;
  border: 1px dashed var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.err {
  color: var(--vp-c-danger-1);
  font-weight: 800;
}

.muted {
  color: var(--vp-c-text-2);
}

.empty {
  margin-top: 12px;
  color: var(--vp-c-text-2);
  text-align: center;
}

/* 📱 手机端优化 */
@media (max-width: 520px) {
  .header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .actions {
    width: 100%;
  }

  .actions .btn {
    width: 100%;
  }

  .alert {
    align-items: flex-start;
  }

  .alertBtn {
    display: none;
  }

  .row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .ops {
    justify-content: flex-start;
  }

  .kv {
    grid-template-columns: 1fr;
  }

  .mask {
    max-width: 100%;
  }
}
</style>
