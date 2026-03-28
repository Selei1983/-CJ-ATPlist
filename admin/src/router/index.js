import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
      { path: 'products', name: 'Products', component: () => import('../views/Products.vue') },
      { path: 'collections', name: 'Collections', component: () => import('../views/Collections.vue') },
      { path: 'analytics', name: 'Analytics', component: () => import('../views/Analytics.vue'), meta: { admin: true } },
      { path: 'users', name: 'Users', component: () => import('../views/Users.vue'), meta: { admin: true } },
    ],
  },
];

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes,
});

router.beforeEach((to, from, next) => {
  const store = useUserStore();
  if (to.meta.requiresAuth && !store.isLoggedIn) return next('/login');
  if (to.path === '/login' && store.isLoggedIn) return next('/dashboard');
  if (to.meta.admin && !store.isAdmin) return next('/dashboard');
  next();
});

export default router;
