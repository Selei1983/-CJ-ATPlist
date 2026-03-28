<template>
  <div>
    <div class="topbar">
      <h1>仪表盘</h1>
      <div class="topbar-actions">
        <span style="font-size:13px;color:var(--text-secondary)">欢迎回来，{{ store.user?.name }}</span>
      </div>
    </div>
    <div class="content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalProducts || 0 }}</div>
          <div class="stat-label">商品总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalCollections || 0 }}</div>
          <div class="stat-label">推荐合集</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalClicks || 0 }}</div>
          <div class="stat-label">总点击数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.clicks7d || 0 }}</div>
          <div class="stat-label">近7天点击</div>
        </div>
      </div>

      <div class="card" v-if="store.isAdmin">
        <div class="card-header">
          <h2>近30天点击趋势</h2>
        </div>
        <div v-if="stats.dailyClicks?.length" style="padding:10px 0">
          <div v-for="d in stats.dailyClicks" :key="d.date" style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="width:100px;font-size:13px;color:var(--text-secondary)">{{ d.date }}</span>
            <div style="height:16px;border-radius:4px;background:var(--primary);min-width:2px" :style="{ width: barWidth(d.count) + 'px' }"></div>
            <span style="font-size:13px">{{ d.count }}</span>
          </div>
        </div>
        <div v-else class="empty-state" style="padding:20px">暂无数据</div>
      </div>

      <div class="card" v-if="store.isAdmin && stats.topProducts?.length">
        <div class="card-header"><h2>热门商品</h2></div>
        <table>
          <thead><tr><th>ASIN</th><th>标题</th><th>点击数</th></tr></thead>
          <tbody>
            <tr v-for="p in stats.topProducts" :key="p.product_id">
              <td>{{ p.asin || '-' }}</td>
              <td>{{ p.title || '-' }}</td>
              <td>{{ p.clicks }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../stores/user';
import { products as productApi, admin } from '../api';

const store = useUserStore();
const stats = ref({});

const maxClick = () => Math.max(...(stats.value.dailyClicks?.map(d => d.count) || [1]), 1);
const barWidth = (count) => Math.max(2, (count / maxClick()) * 300);

onMounted(async () => {
  try {
    const res = await productApi.list();
    stats.value.totalProducts = res.total;
  } catch {}
  if (store.isAdmin) {
    try {
      const res = await admin.stats();
      Object.assign(stats.value, res.stats);
    } catch {}
  }
});
</script>
