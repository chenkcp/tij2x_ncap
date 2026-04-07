import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="page-shell">
      <h1>AppLayout</h1>
      <div className="content-area">
        <Outlet />
      </div>
    </div>
  );
}