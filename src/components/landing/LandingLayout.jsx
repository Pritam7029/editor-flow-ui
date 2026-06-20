import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import '../../styles/landing.css';

export default function LandingLayout() {
  const location = useLocation();

  return (
    <div className="landing-page" key={location.pathname}>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
