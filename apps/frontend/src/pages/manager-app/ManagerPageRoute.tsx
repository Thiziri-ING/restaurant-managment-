import { useNavigate } from 'react-router-dom';
import { ManagerPage } from './ManagerHomePage';

export function ManagerPageRoute() {
  const navigate = useNavigate();
  return <ManagerPage onBack={() => navigate('/login', { replace: true })} />;
}
