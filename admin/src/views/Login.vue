<template>
  <div class="login-container">
    <el-card class="login-card" shadow="always">
      <div class="login-header">
        <h2>CJ-ATPlist</h2>
        <p>Amazon 联盟营销管理平台</p>
      </div>
      <el-tabs v-model="activeTab" stretch>
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" @submit.prevent="handleLogin" label-position="top" style="margin-top:8px">
            <el-form-item label="邮箱">
              <el-input v-model="loginForm.email" type="email" placeholder="name@example.com" :prefix-icon="Message" size="large" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="loginForm.password" type="password" placeholder="输入密码" show-password :prefix-icon="Lock" size="large" @keyup.enter="handleLogin" />
            </el-form-item>
            <el-button type="primary" style="width:100%;margin-top:8px" size="large" :loading="loading" @click="handleLogin">登录</el-button>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" @submit.prevent="handleRegister" label-position="top" style="margin-top:8px">
            <el-form-item label="用户名">
              <el-input v-model="registerForm.name" placeholder="你的名字" :prefix-icon="User" size="large" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="registerForm.email" type="email" placeholder="name@example.com" :prefix-icon="Message" size="large" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="registerForm.password" type="password" placeholder="至少6位" show-password :prefix-icon="Lock" size="large" />
            </el-form-item>
            <el-button type="primary" style="width:100%;margin-top:8px" size="large" :loading="loading" @click="handleRegister">注册</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" style="margin-top:16px" />
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { Message, Lock, User } from '@element-plus/icons-vue';

const router = useRouter();
const store = useUserStore();

const activeTab = ref('login');
const loading = ref(false);
const error = ref('');

const loginForm = ref({ email: '', password: '' });
const registerForm = ref({ name: '', email: '', password: '' });

async function handleLogin() {
  if (!loginForm.value.email || !loginForm.value.password) {
    error.value = '请填写邮箱和密码';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await store.login(loginForm.value.email, loginForm.value.password);
    router.push('/dashboard');
  } catch (e) {
    error.value = e.error || '登录失败';
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  const f = registerForm.value;
  if (!f.name || !f.email || !f.password) {
    error.value = '请填写所有字段';
    return;
  }
  if (f.password.length < 6) {
    error.value = '密码至少6位';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await store.register(f.email, f.password, f.name);
    router.push('/dashboard');
  } catch (e) {
    error.value = e.error || '注册失败';
  } finally {
    loading.value = false;
  }
}
</script>
