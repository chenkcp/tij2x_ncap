import { useLocation, useNavigate } from 'react-router-dom';
import { menuConfig } from '../../config/menuConfig';

export default function SideMenu({ siteCode }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="side-menu">
      <div className="side-menu-title">Nextcap Products</div>
      {menuConfig.map((section) => (
        <div key={section.title} className="menu-section">
          <div className="menu-section-title">{section.title}</div>
          {section.items.map((item) => {
            const path = `/site/${siteCode}/${item.path}`;
            const isActive = location.pathname === path;

            return (
              <button
                key={item.path}
                type="button"
                className={`menu-link${isActive ? ' active' : ''}`}
                onClick={() => navigate(path)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}