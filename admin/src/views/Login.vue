<template>
  <div class="login-page">
    <div class="login-card">
      <h2>CJ-ATPlist</h2>
      <p style="text-align:center;color:var(--text-secondary);margin-bottom:24px">Amazon 联盟营销管理后台</p>

      <div v-if="!isRegister">
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="email" type="email" placeholder="请输入邮箱" @keyup.enter="handleLogin" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </div>
        <button class="btn btn-primary" @click="handleLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <p style="text-align:center;margin-top:16px;font-size:13px;color:var(--text-secondary)">
          没有账号？<a href="#" @click.prevent="isRegister = true">注册</a>
        </p>
      </div>

      <div v-else>
        <div class="form-group">
          <label>用户名</label>
          <input v-model="name" placeholder="请输入用户名" />
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="email" type="email" placeholder="请输入邮箱" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="至少6位" />
        </div>
        <button class="btn btn-primary" @click="handleRegister" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <p style="text-align:center;margin-top:16px;font-size:13px;color:var(--text-secondary)">
          已有账号？<a href="#" @click.prevent="isRegister = false">登录</a>
        </p>
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const store = useUserStore();

const email = ref('');
const password = ref('');
const name = ref('');
const loading = ref(false);
const error = ref('');
const isRegister = ref(false);

async function handleLogin() {
  if (!email.value || !password.value) { error.value = '请填写邮箱和密码'; return; }
  loading.value = true; error.value = '';
  try {
    await store.login(email.value, password.value);
    router.push('/dashboard');
  } catch (e) { error.value = e.error || '登录失败'; } finally { loading.value = false; }
}

async function handleRegister() {
  if (!name.value || !email.value || !password.value) { error.value = '请填写所有字段'; return; }
  if (password.value.length < 6) { error.value = '密码至少6位'; return; }
  loading.value = true; error.value = '';
  try {
    await store.register(email.value, password.value, name.value);
    router.push('/dashboard');
  } catch (e) { error.value = e.error || '注册失败'; } finally { loading.value = false; }
}
</script>
