<template>
  <div>
    <div class="topbar">
      <h1>商品管理</h1>
      <div class="topbar-actions">
        <input class="search-input" v-model="search" placeholder="搜索 ASIN / 标题..." @input="loadProducts" />
        <button class="btn btn-primary" @click="openModal()">+ 添加商品</button>
      </div>
    </div>
    <div class="content">
      <div class="card">
        <table v-if="list.length">
          <thead>
            <tr>
              <th>ASIN</th>
              <th>标题</th>
              <th>价格</th>
              <th>状态</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in list" :key="p.id">
              <td><code>{{ p.asin }}</code></td>
              <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ p.title }}</td>
              <td>{{ p.price || '-' }}</td>
              <td><span class="badge" :class="p.status === 'active' ? 'badge-active' : 'badge-draft'">{{ p.status }}</span></td>
              <td>{{ formatDate(p.updatedAt) }}</td>
              <td>
                <button class="btn btn-sm btn-outline" @click="openModal(p)">编辑</button>
                <button class="btn btn-sm btn-danger" @click="handleDelete(p.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">暂无商品，点击上方按钮添加或通过扩展采集</div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h3>{{ editing ? '编辑商品' : '添加商品' }}</h3>
        <div class="form-group">
          <label>ASIN *</label>
          <input v-model="form.asin" :disabled="editing" placeholder="B0XXXXXXXXX" />
        </div>
        <div class="form-group">
          <label>标题 *</label>
          <input v-model="form.title" placeholder="商品标题" />
        </div>
        <div class="form-group">
          <label>价格</label>
          <input v-model="form.price" placeholder="$29.99" />
        </div>
        <div class="form-group">
          <label>Amazon 链接</label>
          <input v-model="form.url" placeholder="https://www.amazon.com/dp/..." />
        </div>
        <div class="form-group">
          <label>联盟链接</label>
          <input v-model="form.affiliateUrl" placeholder="https://www.amazon.com/dp/...?tag=yourtag" />
        </div>
        <div class="form-group">
          <label>分类</label>
          <input v-model="form.category" placeholder="Electronics" />
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea v-model="form.description" rows="4" placeholder="商品描述" />
        </div>
        <div class="form-group">
          <label>标签（逗号分隔）</label>
          <input v-model="form.tagsStr" placeholder="tag1, tag2, tag3" />
        </div>
        <div class="form-group">
          <label>状态</label>
          <select v-model="form.status">
            <option value="active">上架</option>
            <option value="draft">草稿</option>
            <option value="inactive">下架</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="handleSave" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { products as api } from '../api';

const list = ref([]);
const search = ref('');
const showModal = ref(false);
const editing = ref(false);
const saving = ref(false);
const form = ref({});

function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-'; }

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
  if (!form.value.asin || !form.value.title) { alert('ASIN 和标题必填'); return; }
  saving.value = true;
  const data = {
    ...form.value,
    tags: form.value.tagsStr ? form.value.tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
  };
  delete data.tagsStr;
  try {
    if (editing.value) { await api.update(form.value.id, data); }
    else { await api.create(data); }
    showModal.value = false;
    await loadProducts();
  } catch (e) { alert(e.error || '保存失败'); } finally { saving.value = false; }
}

async function handleDelete(id) {
  if (!confirm('确定删除此商品？')) return;
  try { await api.remove(id); await loadProducts(); } catch {}
}

onMounted(loadProducts);
</script>
