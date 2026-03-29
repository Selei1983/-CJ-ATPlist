<template>
  <div>
    <el-row :gutter="20" style="margin-bottom:28px">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" body-style="padding:24px">
          <div class="value">{{ stats.totalProducts || 0 }}</div>
          <div class="label">商品总数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" body-style="padding:24px">
          <div class="value">{{ stats.totalCollections || 0 }}</div>
          <div class="label">推荐合集</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" body-style="padding:24px">
          <div class="value">{{ stats.totalClicks || 0 }}</div>
          <div class="label">总点击数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" body-style="padding:24px">
          <div class="value">{{ stats.clicks7d || 0 }}</div>
          <div class="label">近 7 天点击</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card v-if="store.isAdmin" style="margin-bottom:20px">
          <template #header>
            <span style="font-weight:600;font-size:14px">近 30 天点击趋势</span>
          </template>
          <div v-if="stats.dailyClicks?.length" class="chart-container">
            <div v-for="d in stats.dailyClicks" :key="d.date" class="click-bar">
              <span class="date">{{ d.date.slice(5) }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: barPercent(d.count) + '%' }"></div>
              </div>
              <span class="count">{{ d.count }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无数据" :image-size="48" />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card v-if="store.isAdmin && stats.topProducts?.length">
          <template #header>
            <span style="font-weight:600;font-size:14px">热门商品</span>
          </template>
          <div class="top-products">
            <div v-for="(p, i) in stats.topProducts" :key="p.asin" class="top-product-item">
              <div class="rank">{{ i + 1 }}</div>
              <div class="top-product-info">
                <div class="top-product-title">{{ p.title || p.asin }}</div>
                <el-tag size="small" type="info" style="font-size:11px">{{ p.asin || '-' }}</el-tag>
              </div>
              <div class="top-product-clicks">{{ p.clicks }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../stores/user';
import { products as productApi, admin } from '../api';

const store = useUserStore();
const stats = ref({});

const maxClick = () => Math.max(...(stats.value.dailyClicks?.map(d => d.count) || [1]), 1);
const barPercent = (count) => Math.max(1, (count / maxClick()) * 100);

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
