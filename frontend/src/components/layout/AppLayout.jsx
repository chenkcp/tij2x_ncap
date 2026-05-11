import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useSite } from '../../contexts/SiteContext';
import Header from './Header';
import SiteTabs from './SiteTabs';
import SideMenu from './SideMenu';

export default function AppLayout() {
  const { siteCode } = useParams();
  const { setSelectedSite } = useSite();
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedSite(siteCode);
  }, [siteCode, setSelectedSite]);

  const handleSiteChange = (newSite) => {
    navigate(`/site/${newSite}/home`);
  };

  return (
    <div className="page-shell">
      <Header />
      <SiteTabs currentSite={siteCode} onSiteChange={handleSiteChange} />
      <div className="main-area">
        <SideMenu siteCode={siteCode} />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}