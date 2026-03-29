<template>
  <div>
    <div class="page-header">
      <h3>{{ list.length }} 个合集</h3>
      <el-button type="primary" @click="openModal()">
        <el-icon><Plus /></el-icon> 新建合集
      </el-button>
    </div>

    <div v-if="list.length" class="collections-grid">
      <el-card v-for="c in list" :key="c.id" class="collection-admin-card" shadow="hover">
        <div class="collection-card-inner">
          <div class="collection-card-status">
            <el-tag :type="c.status === 'published' ? 'success' : 'warning'" size="small" effect="plain">
              {{ c.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </div>
          <div class="collection-card-body">
            <h3>{{ c.title }}</h3>
            <p>{{ c.description || '暂无描述' }}</p>
            <div class="collection-card-meta">
              <span style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:var(--text-muted)">{{ c.slug }}</span>
            </div>
          </div>
          <div class="collection-card-actions">
            <el-button text type="primary" @click="openDetail(c)">
              <el-icon><List /></el-icon> 管理商品
            </el-button>
            <el-button text @click="openModal(c)">编辑</el-button>
            <el-button text type="danger" @click="handleDelete(c.id)">删除</el-button>
          </div>
        </div>
      </el-card>
    </div>
    <el-empty v-else description="暂无合集，点击上方按钮创建" />

    <el-dialog v-model="detailModal" :title="currentCollection.title + ' - 商品管理'" width="720px" destroy-on-close>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <el-input v-model="addProductAsin" placeholder="输入商品 ASIN" style="max-width:240px" />
        <el-button type="primary" @click="handleAddProduct">添加</el-button>
      </div>
      <el-table v-if="detailProducts.length" :data="detailProducts" stripe>
        <el-table-column prop="asin" label="ASIN" width="140">
          <template #default="{ row }">
            <span style="font-family:'SF Mono',Menlo,monospace;font-size:12px">{{ row.asin }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">{{ row.price || '-' }}</template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="70" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" text type="danger" @click="handleRemoveProduct(row.product_id)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无商品" :image-size="48" />
      <template #footer>
        <el-button @click="detailModal = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showModal" :title="editing ? '编辑合集' : '新建合集'" width="560px" destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="标题" required>
              <el-input v-model="form.title" placeholder="2026年最佳厨房好物" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="Slug" required>
              <el-input v-model="form.slug" placeholder="best-kitchen-tools" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="合集描述" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="封面图 URL">
              <el-input v-model="form.coverImage" placeholder="https://..." />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width:100%">
                <el-option label="草稿" value="draft" />
                <el-option label="发布" value="published" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="SEO 标题">
          <el-input v-model="form.seoTitle" placeholder="用于搜索引擎展示" />
        </el-form-item>
        <el-form-item label="SEO 描述">
          <el-input v-model="form.seoDescription" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="SEO 关键词">
          <el-input v-model="form.seoKeywords" placeholder="keyword1, keyword2" />
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
import { Plus, List } from '@element-plus/icons-vue';
import { collections as api, products as productApi } from '../api';

const list = ref([]);
const showModal = ref(false);
const editing = ref(false);
const saving = ref(false);
const form = ref({});
const detailModal = ref(false);
const currentCollection = ref({});
const detailProducts = ref([]);
const addProductAsin = ref('');

async function loadCollections() {
  try {
    const res = await api.list();
    list.value = res.collections;
  } catch {}
}

function openModal(collection = null) {
  editing.value = !!collection;
  form.value = collection
    ? { ...collection }
    : { title: '', slug: '', description: '', coverImage: '', seoTitle: '', seoDescription: '', seoKeywords: '', status: 'draft' };
  showModal.value = true;
}

async function handleSave() {
  if (!form.value.title || !form.value.slug) {
    ElMessage.warning('标题和 Slug 必填');
    return;
  }
  saving.value = true;
  try {
    if (editing.value) await api.update(form.value.id, form.value);
    else await api.create(form.value);
    showModal.value = false;
    ElMessage.success('保存成功');
    await loadCollections();
  } catch (e) {
    ElMessage.error(e.error || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定删除此合集？', '确认', { type: 'warning' });
    await api.remove(id);
    ElMessage.success('已删除');
    await loadCollections();
  } catch {}
}

async function openDetail(collection) {
  currentCollection.value = collection;
  try {
    const res = await api.get(collection.id);
    detailProducts.value = res.products || [];
  } catch {
    detailProducts.value = [];
  }
  detailModal.value = true;
}

async function handleAddProduct() {
  if (!addProductAsin.value) return;
  try {
    const pList = await productApi.list({ search: addProductAsin.value });
    const product = pList.products?.find(p => p.asin === addProductAsin.value);
    if (!product) {
      ElMessage.warning('未找到该 ASIN 的商品，请先在商品管理中添加');
      return;
    }
    await api.addProduct(currentCollection.value.id, product.id);
    addProductAsin.value = '';
    const res = await api.get(currentCollection.value.id);
    detailProducts.value = res.products || [];
    ElMessage.success('添加成功');
  } catch (e) {
    ElMessage.error(e.error || '添加失败');
  }
}

async function handleRemoveProduct(productId) {
  try {
    await api.removeProduct(currentCollection.value.id, productId);
    const res = await api.get(currentCollection.value.id);
    detailProducts.value = res.products || [];
    ElMessage.success('已移除');
  } catch {}
}

onMounted(loadCollections);
</script>
