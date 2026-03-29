<template>
  <div>
    <div class="page-header">
      <h3>API 密钥管理</h3>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> 生成新密钥
      </el-button>
    </div>

    <el-alert
      type="info"
      :closable="false"
      style="margin-bottom:20px"
    >
      <template #title>
        <span style="font-size:13px">API Key 用于外部工具（如 OpenClaw）调用接口。请求头：<code style="background:#f4f4f5;padding:2px 6px;border-radius:3px;font-size:12px">X-API-Key: cj_xxxxxxxx</code></span>
      </template>
    </el-alert>

    <el-card v-if="newlyCreated" style="margin-bottom:20px;border-color:#10b981">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <el-icon style="color:#10b981;font-size:20px;margin-top:2px"><CircleCheckFilled /></el-icon>
        <div style="flex:1">
          <div style="font-weight:600;margin-bottom:8px">密钥已生成，请立即复制</div>
          <el-input :model-value="newlyCreated.key" readonly style="font-family:monospace">
            <template #append>
              <el-button @click="copyKey(newlyCreated.key)">复制</el-button>
            </template>
          </el-input>
          <div style="font-size:12px;color:var(--text-muted);margin-top:8px">此密钥只会显示一次，关闭后无法再次查看完整密钥。</div>
        </div>
      </div>
    </el-card>

    <el-card>
      <el-table v-if="keys.length" :data="keys" stripe>
        <el-table-column label="名称" min-width="160">
          <template #default="{ row }">
            <span style="font-weight:500">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="密钥前缀" width="160">
          <template #default="{ row }">
            <span style="font-family:'SF Mono',Menlo,monospace;font-size:12px;color:var(--text-secondary)">{{ row.keyPrefix }}••••••</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small" effect="plain">
              {{ row.status === 'active' ? '有效' : '已吊销' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后使用" width="170">
          <template #default="{ row }">
            <span style="color:var(--text-muted);font-size:12px">{{ row.lastUsedAt ? formatDate(row.lastUsedAt) : '从未使用' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            <span style="color:var(--text-muted);font-size:12px">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'active'" size="small" text type="warning" @click="handleRevoke(row.id)">吊销</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无 API 密钥" />
    </el-card>

    <el-dialog v-model="showCreate" title="生成新 API 密钥" width="420px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="密钥名称" required>
          <el-input v-model="keyName" placeholder="如：OpenClaw 每日任务" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, CircleCheckFilled } from '@element-plus/icons-vue';
import { apiKeys as api } from '../api';

const keys = ref([]);
const showCreate = ref(false);
const keyName = ref('');
const creating = ref(false);
const newlyCreated = ref(null);

function formatDate(d) {
  return d ? new Date(d).toLocaleString('zh-CN') : '-';
}

async function loadKeys() {
  try {
    const res = await api.list();
    keys.value = res.keys;
  } catch {}
}

function openCreate() {
  keyName.value = '';
  newlyCreated.value = null;
  showCreate.value = true;
}

async function handleCreate() {
  if (!keyName.value.trim()) {
    ElMessage.warning('请输入密钥名称');
    return;
  }
  creating.value = true;
  try {
    const res = await api.create(keyName.value.trim());
    newlyCreated.value = res.key;
    showCreate.value = false;
    ElMessage.success('密钥已生成');
    await loadKeys();
  } catch (e) {
    ElMessage.error(e.error || '生成失败');
  } finally {
    creating.value = false;
  }
}

async function handleRevoke(id) {
  try {
    await ElMessageBox.confirm('吊销后此密钥将立即失效，确定？', '确认', { type: 'warning' });
    await api.revoke(id);
    ElMessage.success('已吊销');
    await loadKeys();
  } catch {}
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定删除此密钥？', '确认', { type: 'warning' });
    await api.remove(id);
    ElMessage.success('已删除');
    await loadKeys();
  } catch {}
}

function copyKey(key) {
  navigator.clipboard.writeText(key).then(() => {
    ElMessage.success('已复制到剪贴板');
  }).catch(() => {
    ElMessage.error('复制失败');
  });
}

onMounted(loadKeys);
</script>
