<template>
  <div>
    <div class="page-header">
      <el-input
        v-model="search"
        placeholder="搜索 ASIN / 标题..."
        clearable
        style="max-width:280px"
        :prefix-icon="Search"
        @input="loadProducts"
      />
      <el-button type="primary" @click="openModal()">
        <el-icon><Plus /></el-icon> 添加商品
      </el-button>
    </div>

    <el-card>
      <el-table v-if="list.length" :data="list" stripe>
        <el-table-column prop="asin" label="ASIN" width="150">
          <template #default="{ row }">
            <span style="font-family:'SF Mono',Menlo,monospace;font-size:12px;font-weight:600;color:var(--text-secondary)">{{ row.asin }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" show-overflow-tooltip>
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:10px">
              <img v-if="row.images?.length" :src="row.images[0]" style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0" />
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="110">
          <template #default="{ row }">
            <span style="font-weight:600;color:var(--text-primary)">{{ row.price || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small" effect="plain">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">
            <span style="color:var(--text-muted);font-size:12px">{{ formatDate(row.updatedAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openModal(row)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无商品，点击上方按钮添加或通过扩展采集" />
    </el-card>

    <el-dialog v-model="showModal" :title="editing ? '编辑商品' : '添加商品'" width="560px" destroy-on-close>
      <el-form :model="form" label-width="90px" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="ASIN" required>
              <el-input v-model="form.asin" :disabled="editing" placeholder="B0XXXXXXXXX" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价格">
              <el-input v-model="form.price" placeholder="$29.99" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="商品标题" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Amazon 链接">
              <el-input v-model="form.url" placeholder="https://..." />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联盟链接">
              <el-input v-model="form.affiliateUrl" placeholder="含 tag 参数" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-input v-model="form.category" placeholder="Electronics" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width:100%">
                <el-option label="上架" value="active" />
                <el-option label="草稿" value="draft" />
                <el-option label="下架" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="商品描述" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tagsStr" placeholder="tag1, tag2, tag3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showModal = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
import { products as api } from '../api';

const list = ref([]);
const search = ref('');
const showModal = ref(false);
const editing = ref(false);
const saving = ref(false);
const form = ref({});

const statusMap = { active: '上架', draft: '草稿', inactive: '下架' };
const statusTypeMap = { active: 'success', draft: 'warning', inactive: 'info' };
const statusLabel = (s) => statusMap[s] || s;
const statusType = (s) => statusTypeMap[s] || 'info';

function formatDate(d) {
  return d ? new Date(d).toLocaleString('zh-CN') : '-';
}

async function loadProducts() {
  try {
    const res = await api.list({ search: search.value || undefined });
    list.value = res.products;
  } catch {}
}

function openModal(product = null) {
  editing.value = !!product;
  if (product) {
    form.value = { ...product, tagsStr: (product.tags || []).join(', ') };
  } else {
    form.value = { asin: '', title: '', price: '', url: '', affiliateUrl: '', category: '', description: '', tagsStr: '', status: 'active' };
  }
  showModal.value = true;
}

async function handleSave() {
  if (!form.value.asin || !form.value.title) {
    ElMessage.warning('ASIN 和标题必填');
    return;
  }
  saving.value = true;
  const data = {
    ...form.value,
    tags: form.value.tagsStr ? form.value.tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
  };
  delete data.tagsStr;
  try {
    if (editing.value) {
      await api.update(form.value.id, data);
    } else {
      await api.create(data);
    }
    showModal.value = false;
    ElMessage.success('保存成功');
    await loadProducts();
  } catch (e) {
    ElMessage.error(e.error || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定删除此商品？', '确认', { type: 'warning' });
    await api.remove(id);
    ElMessage.success('已删除');
    await loadProducts();
  } catch {}
}

onMounted(loadProducts);
</script>
