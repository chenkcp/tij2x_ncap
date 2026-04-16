import { sites } from '../../config/sites';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SiteTabs({ currentSite, onSiteChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're on the home page
  const isHomePage = location.pathname.endsWith('/home');
  
  const handleHomeClick = () => {
    navigate(`/site/${currentSite}/home`);
  };

  return (
    <div className="site-tabs">
      <button 
        className={`tab-button ${isHomePage ? 'home-active' : ''}`}
        onClick={handleHomeClick}
      >
        home
      </button>
      {sites.map((site) => (
        <button
          key={site}
          className={`tab-button ${currentSite === site ? 'active' : ''}`}
          onClick={() => onSiteChange(site)}
        >
          {site}
        </button>
      ))}
    </div>
  );
}