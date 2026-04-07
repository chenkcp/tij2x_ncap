// import { useEffect, useState } from "react";

// function App() {
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     fetch("http://localhost:5000/api/health")
//       .then((res) => res.json())
//       .then((data) => setMessage(data.message))
//       .catch((err) => console.error(err));
//   }, []);

//   return (
//     <div>
//       <h1>React + Node.js + Express</h1>
//       <p>{message}</p>
//     </div>
//   );
// }

// export default App;

import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import ProductLookupPage from './pages/ProductLookupPage';
import ProductAddPage from './pages/ProductAddPage';
import InkWeightEditPage from './pages/InkWeightEditPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/site/CJASite_1/home" replace />} />
      <Route path="/site/:siteCode" element={<AppLayout />}>
        <Route path="home" element={<HomePage />} />
        <Route path="list/product-lookup" element={<ProductLookupPage />} />
        <Route path="add/product-ref" element={<ProductAddPage />} />
        <Route path="edit/inkweight" element={<InkWeightEditPage />} />
      </Route>
    </Routes>
  );
}