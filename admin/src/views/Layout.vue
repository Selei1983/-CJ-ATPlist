<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-logo">CJ-ATPlist</div>
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="sidebar-link">📊 仪表盘</router-link>
        <router-link to="/products" class="sidebar-link">📦 商品管理</router-link>
        <router-link to="/collections" class="sidebar-link">📋 推荐合集</router-link>
        <template v-if="store.isAdmin">
          <div class="sidebar-section">系统管理</div>
          <router-link to="/analytics" class="sidebar-link">📈 数据分析</router-link>
          <router-link to="/users" class="sidebar-link">👥 用户管理</router-link>
        </template>
      </nav>
      <div class="sidebar-footer">
        <div>{{ store.user?.name || store.user?.email }}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:4px">
          <span class="badge" :class="store.user?.role === 'admin' ? 'badge-admin' : 'badge-user'">{{ store.user?.role }}</span>
        </div>
        <button class="btn btn-outline btn-sm" style="margin-top:12px;width:100%;color:var(--sidebar-text);border-color:rgba(255,255,255,.2)" @click="handleLogout">退出登录</button>
      </div>
    </aside>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const store = useUserStore();
const router = useRouter();

function handleLogout() {
  store.logout();
  router.push('/login');
}
</script>
