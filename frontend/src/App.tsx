import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "@/app/routes";
import { QueryProvider } from "@/app/providers/query-client";
import { AuthProvider } from "@/app/providers/auth-provider";
import { AuthzProvider } from "@/shared/authz";

const App = () => (
  <QueryProvider>
    <AuthProvider>
      <AuthzProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthzProvider>
    </AuthProvider>
  </QueryProvider>
);

export default App;
