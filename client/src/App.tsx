import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Routes, Route, useParams } from "react-router";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import KitchenLayout from "./pages/kitchen/KitchenLayout";
import RecipeWorkspace from "./pages/kitchen/RecipeWorkspace";
import NewRecipe from "./pages/kitchen/NewRecipe";
import Toast from "./components/Toast";
import { ToastProvider } from "./context/ToastContext";
import { useToast } from "./hooks/useToast";

const queryClient = new QueryClient();

function ToastContainer() {
  const { toast, setToast } = useToast();

  if (!toast) return null;

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kitchen" element={<KitchenLayout />}>
            <Route index element={<NewRecipe />} />
            <Route path=":id" element={<RecipeWorkspace />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastContainer />
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
