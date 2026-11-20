<template>
  <div class="qa-page">
    <div class="qa-card">
      <div class="qa-title">知识库智能问答</div>
      <div class="qa-sub">
        基于参考项目知识库（100 条）检索 Top-3 条目后作答；未配置大模型时按模板拼接命中条目的原文摘要。
      </div>
      <el-input
        v-model="question"
        type="textarea"
        :rows="3"
        maxlength="500"
        show-word-limit
        placeholder="例如：香樟的生长习性是什么？红蜘蛛怎么防治？草坪多久修剪一次？"
        @keydown.enter.exact.prevent="ask"
      />
      <div class="qa-actions">
        <div class="qa-samples">
          <span>示例：</span>
          <el-link
            v-for="sample in samples"
            :key="sample"
            type="primary"
            :underline="false"
            @click="applySample(sample)"
          >
            {{ sample }}
          </el-link>
        </div>
        <el-button type="primary" :loading="loading" :disabled="!question.trim()" @click="ask">提问</el-button>
      </div>
      <el-alert v-if="error" class="qa-error" type="error" :title="error" show-icon :closable="false" />
    </div>

    <div v-if="answer" class="qa-card">
      <div class="qa-label">回答</div>
      <div class="qa-answer">{{ answer }}</div>
    </div>

    <div v-if="references.length" class="qa-card">
      <div class="qa-label">引用条目（{{ references.length }}）</div>
      <div v-for="ref in references" :key="ref.id" class="qa-ref">
        <div class="qa-ref-head">
          <span class="qa-ref-name">{{ ref.name }}</span>
          <el-tag size="small" :type="tagType(ref.category)">{{ categoryLabel(ref.category) }}</el-tag>
          <span class="qa-ref-id">{{ ref.id }}</span>
        </div>
        <div class="qa-ref-summary">{{ ref.summary }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { apiJson } from '@/libs/manage/api'

interface KbReference {
  id: string
  category: string
  name: string
  summary: string
}

const CATEGORY_TEXT: Record<string, string> = { tree: '苗木', pest: '病虫害', maintenance_standard: '养护标准' }
const samples = ['香樟的生长习性是什么？', '红蜘蛛（叶螨类）怎么防治？', '草坪多久修剪一次？']

const question = ref('')
const loading = ref(false)
const error = ref('')
const answer = ref('')
const references = ref<KbReference[]>([])

function categoryLabel(category: string): string {
  return CATEGORY_TEXT[category] || category
}

function tagType(category: string): 'success' | 'warning' | 'info' {
  if (category === 'tree') return 'success'
  if (category === 'pest') return 'warning'
  return 'info'
}

function applySample(text: string): void {
  question.value = text
}

async function ask(): Promise<void> {
  const text = question.value.trim()
  if (!text || loading.value) return
  loading.value = true
  error.value = ''
  answer.value = ''
  references.value = []
  try {
    const res = await apiJson<{ answer: string; references: KbReference[] }>('/api/kb/qa', {
      method: 'POST',
      body: { question: text }
    })
    answer.value = res.answer || ''
    references.value = res.references || []
  } catch (err: any) {
    error.value = err?.message || '问答请求失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.qa-page {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qa-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
}

.qa-title {
  font-size: 16px;
  font-weight: 600;
  color: #123f36;
}

.qa-sub {
  margin: 6px 0 12px;
  color: #6b7f78;
  font-size: 13px;
}

.qa-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.qa-samples {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  color: #6b7f78;
  font-size: 13px;
}

.qa-error {
  margin-top: 12px;
}

.qa-label {
  font-size: 14px;
  font-weight: 600;
  color: #123f36;
  margin-bottom: 10px;
}

.qa-answer {
  white-space: pre-wrap;
  line-height: 1.8;
  color: #24413a;
  font-size: 14px;
}

.qa-ref {
  padding: 10px 12px;
  border: 1px solid #e4ece9;
  border-radius: 6px;
}

.qa-ref + .qa-ref {
  margin-top: 10px;
}

.qa-ref-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qa-ref-name {
  font-weight: 600;
  color: #123f36;
}

.qa-ref-id {
  color: #8a9a94;
  font-size: 12px;
}

.qa-ref-summary {
  margin-top: 6px;
  color: #4c625b;
  font-size: 13px;
  line-height: 1.7;
}
</style>
