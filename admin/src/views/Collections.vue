<template>
  <div>
    <div class="topbar">
      <h1>推荐合集</h1>
      <div class="topbar-actions">
        <button class="btn btn-primary" @click="openModal()">+ 新建合集</button>
      </div>
    </div>
    <div class="content">
      <div class="card" v-for="c in list" :key="c.id" style="margin-bottom:16px">
        <div class="card-header">
          <div>
            <h2>{{ c.title }}</h2>
            <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">
              Slug: <code>{{ c.slug }}</code> &middot;
              <span class="badge" :class="c.status === 'published' ? 'badge-published' : 'badge-draft'">{{ c.status }}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm btn-outline" @click="openDetail(c)">管理商品</button>
            <button class="btn btn-sm btn-outline" @click="openModal(c)">编辑</button>
            <button class="btn btn-sm btn-danger" @click="handleDelete(c.id)">删除</button>
          </div>
        </div>
        <div v-if="c.seoTitle" style="font-size:13px;color:var(--text-secondary)">
          SEO: {{ c.seoTitle }}
        </div>
      </div>
      <div v-if="!list.length" class="empty-state">暂无合集，点击上方按钮创建</div>

      <div v-if="detailModal" class="modal-overlay" @click.self="detailModal = false">
        <div class="modal-card" style="max-width:800px">
          <h3>{{ currentCollection.title }} - 商品管理</h3>
          <div style="margin-bottom:16px;display:flex;gap:8px">
            <input v-model="addProductAsin" placeholder="输入商品 ASIN" style="max-width:200px" />
            <button class="btn btn-sm btn-primary" @click="handleAddProduct">添加</button>
          </div>
          <table v-if="detailProducts.length">
            <thead><tr><th>ASIN</th><th>标题</th><th>价格</th><th>排序</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="p in detailProducts" :key="p.id">
                <td><code>{{ p.asin }}</code></td>
                <td>{{ p.title }}</td>
                <td>{{ p.price || '-' }}</td>
                <td>{{ p.sort_order }}</td>
                <td><button class="btn btn-sm btn-danger" @click="handleRemoveProduct(p.product_id)">移除</button></td>
              </tr>
            </tbody>
          </table>
          <div v-else style="padding:20px;text-align:center;color:var(--text-secondary)">暂无商品</div>
          <div class="modal-actions"><button class="btn btn-outline" @click="detailModal = false">关闭</button></div>
        </div>
      </div>

      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-card">
          <h3>{{ editing ? '编辑合集' : '新建合集' }}</h3>
          <div class="form-group"><label>标题</label><input v-model="form.title" placeholder="2026年最佳厨房好物" /></div>
          <div class="form-group"><label>Slug（URL 路径）</label><input v-model="form.slug" placeholder="best-kitchen-tools-2026" /></div>
          <div class="form-group"><label>描述</label><textarea v-model="form.description" rows="3" placeholder="合集描述" /></div>
          <div class="form-group"><label>封面图片 URL</label><input v-model="form.coverImage" placeholder="https://..." /></div>
          <div class="form-group"><label>SEO 标题</label><input v-model="form.seoTitle" /></div>
          <div class="form-group"><label>SEO 描述</label><textarea v-model="form.seoDescription" rows="2" /></div>
          <div class="form-group"><label>SEO 关键词（逗号分隔）</label><input v-model="form.seoKeywords" placeholder="keyword1, keyword2" /></div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="form.status">
              <option value="draft">草稿</option>
              <option value="published">发布</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="showModal = false">取消</button>
            <button class="btn btn-primary" @click="handleSave" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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
  try { const res = await api.list(); list.value = res.collections; } catch {}
}

function openModal(collection = null) {
  editing.value = !!collection;
  form.value = collection
    ? { ...collection }
    : { title: '', slug: '', description: '', coverImage: '', seoTitle: '', seoDescription: '', seoKeywords: '', status: 'draft' };
  showModal.value = true;
}

async function handleSave() {
  if (!form.value.title || !form.value.slug) { alert('标题和 Slug 必填'); return; }
  saving.value = true;
  try {
    if (editing.value) await api.update(form.value.id, form.value);
    else await api.create(form.value);
    showModal.value = false;
    await loadCollections();
  } catch (e) { alert(e.error || '保存失败'); } finally { saving.value = false; }
}

async function handleDelete(id) {
  if (!confirm('确定删除此合集？')) return;
  try { await api.remove(id); await loadCollections(); } catch {}
}

async function openDetail(collection) {
  currentCollection.value = collection;
  try {
    const res = await api.get(collection.id);
    detailProducts.value = res.products || [];
  } catch { detailProducts.value = []; }
  detailModal.value = true;
}

async function handleAddProduct() {
  if (!addProductAsin.value) return;
  try {
    const pList = await productApi.list({ search: addProductAsin.value });
    const product = pList.products?.find(p => p.asin === addProductAsin.value);
    if (!product) { alert('未找到该 ASIN 的商品，请先在商品管理中添加'); return; }
    await api.addProduct(currentCollection.value.id, product.id);
    addProductAsin.value = '';
    const res = await api.get(currentCollection.value.id);
    detailProducts.value = res.products || [];
  } catch (e) { alert(e.error || '添加失败'); }
}

async function handleRemoveProduct(productId) {
  try {
    await api.removeProduct(currentCollection.value.id, productId);
    const res = await api.get(currentCollection.value.id);
    detailProducts.value = res.products || [];
  } catch {}
}

onMounted(loadCollections);
</script>
