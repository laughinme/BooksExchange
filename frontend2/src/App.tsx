import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "@/app/routes";
import { QueryProvider } from "@/app/providers/query-client";
import { AuthProvider } from "@/app/providers/auth-provider";

const App = () => (
  <QueryProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </QueryProvider>
);

export default App;
