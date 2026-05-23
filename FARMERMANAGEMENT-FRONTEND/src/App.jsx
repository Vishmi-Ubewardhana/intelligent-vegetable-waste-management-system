import { RouterProvider } from 'react-router-dom';
import router from './Routes/router';
import './Css/global.css';

export default function App() {
  return <RouterProvider router={router} />;
}
