<template>
  <el-container style="height:100vh">
    <el-aside width="220px" class="sidebar">
      <div class="sidebar-logo">
        <h2>CJ-ATPlist</h2>
        <div class="logo-sub">Amazon Affiliate</div>
      </div>
      <el-menu
        :default-active="route.path"
        router
        background-color="transparent"
        text-color="#a1a1aa"
        active-text-color="#fafafa"
        style="border-right:none;flex:1;padding-top:8px"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/collections">
          <el-icon><Folder /></el-icon>
          <span>推荐合集</span>
        </el-menu-item>
        <el-menu-item index="/api-keys">
          <el-icon><Key /></el-icon>
          <span>API 密钥</span>
        </el-menu-item>
        <el-sub-menu v-if="store.isAdmin" index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/analytics">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据分析</span>
          </el-menu-item>
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
      <div class="sidebar-footer">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <el-avatar :size="32" style="background:#3b82f6;flex-shrink:0">
            {{ (store.user?.name || store.user?.email || '?')[0].toUpperCase() }}
          </el-avatar>
          <div style="min-width:0">
            <div style="font-size:13px;color:#fafafa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ store.user?.name || store.user?.email }}</div>
            <el-tag :type="store.isAdmin ? 'danger' : 'info'" size="small" style="margin-top:2px;font-size:11px">{{ store.user?.role }}</el-tag>
          </div>
        </div>
        <el-button size="small" text style="width:100%;color:#a1a1aa" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon> 退出登录
        </el-button>
      </div>
    </el-aside>
    <el-container>
      <el-header class="topbar" style="display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:56px">
        <h2 style="margin:0;font-size:16px;font-weight:600;letter-spacing:-0.01em">{{ pageTitle }}</h2>
        <span style="font-size:13px;color:#a1a1aa">{{ store.user?.name }}</span>
      </el-header>
      <el-main style="background:#fafafa;padding:24px 28px">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const route = useRoute();
const router = useRouter();
const store = useUserStore();

const pageTitles = {
  '/dashboard': '仪表盘',
  '/products': '商品管理',
  '/collections': '推荐合集',
  '/api-keys': 'API 密钥',
  '/analytics': '数据分析',
  '/users': '用户管理',
};
const pageTitle = computed(() => pageTitles[route.path] || '仪表盘');

function handleLogout() {
  store.logout();
  router.push('/login');
}
</script>
