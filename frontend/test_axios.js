import { updateProfile } from './src/api/authApi.js';
import axiosInstance from './src/api/axiosInstance.js';

async function test() {
  try {
    const res = await axiosInstance.post('/auth/login', { email: 'testadmin@hsms.com', password: 'adminpassword123' });
    console.log('Login success');
    axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.token;
    
    const updateRes = await updateProfile({ phone: '123' });
    console.log('Update success', updateRes.data);
  } catch (err) {
    console.log('Error caught:', err.message, err.response?.data);
  }
}
test();
