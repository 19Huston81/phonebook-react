import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataProvider";
import PublicPage from "./pages/PublicPage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
