<template>
  <div :key="route.fullPath" class="wrap">
    <!-- 顶部警告条 -->
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

      <!-- 全部账号：卡片网格 -->
      <div v-if="showAll" class="grid">
        <div v-for="(acc, i) in accounts" :key="acc?.id ?? i" class="card">
          <div class="cardTop">
            <div class="left">
              <div class="cardTitle">账号 #{{ acc?.id ?? i }}</div>
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
                @click="copyToClipboard(acc.username, `u-${accKey(acc, i)}`)"
              >
                {{ copied[`u-${accKey(acc, i)}`] ? '已复制' : '复制账号' }}
              </button>

              <button class="btn btn-ghost" @click="toggleReveal(accKey(acc, i), 'user')">
                {{ revealed[accKey(acc, i)]?.user ? '隐藏' : '显示' }}
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

      <!-- 单个账号：一张卡 -->
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
/* =========================
   主题色：更偏 iOS 风
   - Light：白底+柔和边框
   - Dark：接近 iOS 深色（黑灰、清晰边界）
========================= */

.wrap {
  margin: 12px 0;
  font-size: 14px;
  line-height: 1.6;
}

/* 顶部警告条 */
.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.08);
  margin-bottom: 12px;
}
:global(.dark) .alert {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.12);
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
  font-weight: 800;
}
.alertDesc {
  font-size: 12px;
  opacity: 0.9;
}
.alertBtn {
  white-space: nowrap;
}

/* header */
.header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0 12px;
}
.h1 {
  font-size: 18px;
  font-weight: 800;
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

/* 卡片（Light） */
.card {
  border: 1px solid rgba(15, 23, 42, 0.10);
  border-radius: 16px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

/* 卡片（Dark：iOS-ish） */
:global(.dark) .card {
  background: #0b0f14;                 /* 更接近 iOS 深色 */
  border-color: rgba(148, 163, 184, 0.20);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
}

/* 顶部信息 */
.cardTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.cardTitle {
  font-weight: 800;
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
  opacity: 0.8;
}

/* pills */
.pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.55);
}
:global(.dark) .pill {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.06);
}
.pill-ok {
  border-color: rgba(34, 197, 94, 0.35);
}
.pill-bad {
  border-color: rgba(239, 68, 68, 0.35);
}
.pill-soft {
  opacity: 0.85;
}

/* 行布局（桌面） */
.row {
  display: grid;
  grid-template-columns: 82px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
}
.label {
  font-size: 12px;
  opacity: 0.78;
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
  background: rgba(148, 163, 184, 0.18);
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
  opacity: 0.75;
}
.kvItem .v {
  margin-top: 2px;
  font-weight: 650;
  word-break: break-word;
}

/* 遮罩（Light） */
.mask {
  display: inline-block;
  width: 100%;
  max-width: 420px;
  padding: 7px 10px;
  border-radius: 12px;
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

/* 遮罩（Dark：避免黑上加黑） */
:global(.dark) .mask {
  background: #1f2937;
  color: transparent;
  border: 1px solid rgba(148, 163, 184, 0.22);
}
:global(.dark) .mask.reveal {
  color: #f8fafc;
}

/* 按钮（iOS-ish） */
.btn {
  padding: 7px 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  transition: transform 0.06s ease, opacity 0.15s ease, background 0.15s ease;
  font-size: 13px;
}
.btn:active {
  transform: translateY(1px);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Dark buttons */
:global(.dark) .btn {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(148, 163, 184, 0.20);
  color: #e5e7eb;
}
:global(.dark) .btn:hover {
  background: rgba(255, 255, 255, 0.10);
}

/* primary */
.btn-primary {
  border-color: rgba(59, 130, 246, 0.35);
}
:global(.dark) .btn-primary {
  border-color: rgba(59, 130, 246, 0.45);
}

/* ghost */
.btn-ghost {
  opacity: 0.92;
}

/* Loading/Empty */
.loadingBox {
  padding: 14px;
  border-radius: 16px;
  border: 1px dashed rgba(148, 163, 184, 0.26);
}
.err {
  color: #ef4444;
  font-weight: 700;
}
.muted {
  opacity: 0.7;
}
.empty {
  margin-top: 12px;
  opacity: 0.7;
  text-align: center;
}

/* =========================
   📱 手机端优化
   - 行改为两行：label+value / buttons 换行
========================= */
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
    display: none; /* 手机上隐藏警告条右侧刷新按钮，避免挤压 */
  }

  .row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .label {
    opacity: 0.9;
  }
  .ops {
    justify-content: flex-start;
  }
  .btn {
    width: auto;
  }
  .mask {
    max-width: 100%;
  }

  .kv {
    grid-template-columns: 1fr;
  }
}
</style>
