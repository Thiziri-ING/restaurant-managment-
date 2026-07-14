import { useNavigate } from 'react-router-dom';
import { CaissierPage } from './CaissierHomePage';

export function CaissierPageRoute() {
  const navigate = useNavigate();
  return <CaissierPage onBack={() => navigate('/login', { replace: true })} />;
}
