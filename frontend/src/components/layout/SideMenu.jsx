import { NavLink } from 'react-router-dom';
import { menuConfig } from '../../config/menuConfig';

export default function SideMenu({ siteCode }) {
  return (
    <aside className="side-menu">
      <div className="side-menu-title">Nextcap Products</div>
      {menuConfig.map((section) => (
        <div key={section.title} className="menu-section">
          <div className="menu-section-title">{section.title}</div>
          {section.items.map((item) => (
            <NavLink
              key={item.path}
              className="menu-link"
              to={`/site/${siteCode}/${item.path}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}