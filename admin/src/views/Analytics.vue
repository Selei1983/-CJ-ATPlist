<template>
  <div>
    <div class="topbar">
      <h1>数据分析</h1>
      <div class="topbar-actions">
        <button class="btn btn-outline" @click="loadData">🔄 刷新</button>
      </div>
    </div>
    <div class="content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalClicks || 0 }}</div>
          <div class="stat-label">总点击量</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.clicks7d || 0 }}</div>
          <div class="stat-label">近 7 天点击</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.clicks30d || 0 }}</div>
          <div class="stat-label">近 30 天点击</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalProducts || 0 }}</div>
          <div class="stat-label">商品总数</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h2>热门商品 TOP 10</h2></div>
        <table v-if="stats.topProducts?.length">
          <thead>
            <tr><th>ASIN</th><th>标题</th><th>点击量</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in stats.topProducts" :key="p.product_id">
              <td><code>{{ p.asin || '-' }}</code></td>
              <td>{{ p.title || '-' }}</td>
              <td>{{ p.clicks }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">暂无数据</div>
      </div>

      <div class="card">
        <div class="card-header"><h2>每日点击趋势（近30天）</h2></div>
        <div v-if="stats.dailyClicks?.length" style="padding:8px 0">
          <div v-for="d in stats.dailyClicks" :key="d.date" style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
            <span style="width:100px;font-size:13px;color:var(--text-secondary)">{{ d.date }}</span>
            <div style="background:var(--primary);height:20px;border-radius:4px;min-width:2px" :style="{ width: barWidth(d.count) + 'px' }"></div>
            <span style="font-size:13px;font-weight:600">{{ d.count }}</span>
          </div>
        </div>
        <div v-else class="empty-state">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { admin } from '../api';

const stats = ref({});
const maxClick = () => Math.max(...(stats.value.dailyClicks?.map(d => d.count) || [1]), 1);
const barWidth = (count) => Math.max(2, (count / maxClick()) * 300);

async function loadData() {
  try {
    const res = await admin.stats();
    stats.value = res.stats;
  } catch {}
}

onMounted(loadData);
</script>
