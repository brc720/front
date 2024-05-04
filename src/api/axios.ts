import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../../router/index';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

axios.interceptors.request.use((req: any) => {
  req.headers['Authorization'] = localStorage.getItem('userToken') || '';
  req.headers['Content-Type'] = 'application/json';

  if (req?.url.includes('mempool')) {
    req.headers['Authorization'] = undefined;
  }
  return req;
});

axios.interceptors.response.use(
  (res) => {
    if (res?.request?.responseURL.includes('mempool')) {
      return res.data;
    }

    if (res && res.data && res.data.code !== 200) {
      ElMessage.error(res.data.msg);
      if (res.data?.code == 401) {
        localStorage.clear();
        router.push({ path: '/' });
      }
      return Promise.reject(res.data);
    }

    return res;
  },
  (errorRes) => {
    console.log(errorRes);
    if (errorRes && errorRes.response && errorRes.response.data) {
      const { code, msg } = errorRes.response.data;
      if (code === 401) {
        localStorage.clear();
        return Promise.reject(errorRes.response.data);
      } else {
        ElMessage.error(msg);
      }
    }
  }
);

export default axios;
