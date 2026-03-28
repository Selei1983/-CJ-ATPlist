<template>
  <div>
    <div class="topbar">
      <h1>用户管理</h1>
    </div>
    <div class="content">
      <div class="card">
        <table v-if="users.length">
          <thead>
            <tr>
              <th>用户名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>商品数</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td><span class="badge" :class="u.role === 'admin' ? 'badge-admin' : 'badge-user'">{{ u.role }}</span></td>
              <td>{{ u.productCount || 0 }}</td>
              <td>{{ formatDate(u.createdAt) }}</td>
              <td>
                <button v-if="u.role !== 'admin'" class="btn btn-sm btn-outline" @click="handleSetAdmin(u.id)">设为管理员</button>
                <button v-if="u.role === 'admin' && u.id !== store.user?.id" class="btn btn-sm btn-outline" @click="handleSetUser(u.id)">降为用户</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">暂无用户</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../stores/user';
import { admin } from '../api';

const store = useUserStore();
const users = ref([]);

function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-'; }

async function loadUsers() {
  try {
    const res = await admin.users();
    users.value = res.users;
  } catch {}
}

async function handleSetAdmin(id) {
  if (!confirm('确定将该用户设为管理员？')) return;
  try { await admin.updateRole(id, 'admin'); await loadUsers(); } catch {}
}

async function handleSetUser(id) {
  if (!confirm('确定将该管理员降为普通用户？')) return;
  try { await admin.updateRole(id, 'user'); await loadUsers(); } catch {}
}

onMounted(loadUsers);
</script>
