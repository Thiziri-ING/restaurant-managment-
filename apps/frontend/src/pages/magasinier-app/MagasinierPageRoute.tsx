import { useNavigate } from 'react-router-dom';
import { MagasinierPage } from './MagasinierHomePage';

export function MagasinierPageRoute() {
  const navigate = useNavigate();
  return <MagasinierPage onBack={() => navigate('/login', { replace: true })} />;
}
