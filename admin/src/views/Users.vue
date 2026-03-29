<template>
  <div>
    <div class="page-header">
      <h3>{{ users.length }} 位用户</h3>
    </div>
    <el-card>
      <el-table v-if="users.length" :data="users" stripe>
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:10px">
              <el-avatar :size="32" style="background:#3b82f6;flex-shrink:0">
                {{ (row.name || row.email || '?')[0].toUpperCase() }}
              </el-avatar>
              <div>
                <div style="font-weight:500;font-size:13px">{{ row.name }}</div>
                <div style="font-size:12px;color:var(--text-muted)">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small" effect="plain">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="商品数" width="100">
          <template #default="{ row }">
            <span style="font-weight:600">{{ row.productCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="170">
          <template #default="{ row }">
            <span style="color:var(--text-muted);font-size:12px">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button v-if="row.role !== 'admin'" size="small" text type="primary" @click="handleSetAdmin(row.id)">设为管理员</el-button>
            <el-button v-if="row.role === 'admin' && row.id !== store.user?.id" size="small" text type="warning" @click="handleSetUser(row.id)">降为用户</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无用户" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../stores/user';
import { admin } from '../api';

const store = useUserStore();
const users = ref([]);

function formatDate(d) {
  return d ? new Date(d).toLocaleString('zh-CN') : '-';
}

async function loadUsers() {
  try {
    const res = await admin.users();
    users.value = res.users;
  } catch {}
}

async function handleSetAdmin(id) {
  try {
    await ElMessageBox.confirm('确定将该用户设为管理员？', '确认', { type: 'warning' });
    await admin.updateRole(id, 'admin');
    ElMessage.success('已设为管理员');
    await loadUsers();
  } catch {}
}

async function handleSetUser(id) {
  try {
    await ElMessageBox.confirm('确定将该管理员降为普通用户？', '确认', { type: 'warning' });
    await admin.updateRole(id, 'user');
    ElMessage.success('已降为用户');
    await loadUsers();
  } catch {}
}

onMounted(loadUsers);
</script>
