// import { ElMessage } from 'element-plus';
import { createRouter, createWebHistory } from 'vue-router';

// createWebHistory(import.meta.env.BASE_URL)
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../src/views/create/CreateView.vue')
    },
    {
      path: '/mybrc720',
      name: 'Mybrc',
      component: () => import('../src/views/myBrc720/MyBrc720.vue')
    }, {
      path: '/marketplace',
      name: 'Marketplace',
      component: () => import('../src/views/marketplace/IndexView.vue')
    },
  ]
});

// router.beforeEach((to, from) => {
//   if (to.name === 'Mybrc') {
//     if (!localStorage.getItem('walletAddress') || !localStorage.getItem('userToken')) {
//       // ElMessage('Please connect your wallet')
//       return false;
//     }
//     return true
//   }

//   return true
// })

export default router;
