import { Routes, Route, Navigate } from "react-router-dom";

import { ProtectedRoute } from "@/shared/routing/protected-route";
import { OnboardingGuard } from "@/shared/routing/onboarding-guard";
import { UserLayout } from "@/widgets/layout/user-layout";
import { AdminLayout } from "@/widgets/layout/admin-layout";
import { LoginPage } from "@/pages/auth/login";
import { RegisterPage } from "@/pages/auth/register";
import { OnboardingPage } from "@/pages/onboarding";
import { HomePage } from "@/pages/home";
import { ProfilePage } from "@/pages/profile";
import { EditProfilePage } from "@/pages/profile/edit-profile";
import { AddBookPage } from "@/pages/book/add-book";
import { BookDetailPage } from "@/pages/book/book-detail";
import { EditBookPage } from "@/pages/book/edit-book";
import { ExchangesPage } from "@/pages/exchanges";
import { MapPage } from "@/pages/map";
import { LikedBooksPage } from "@/pages/liked-books";
import { NearbyUsersPage } from "@/pages/nearby";
import { DashboardPage } from "@/pages/admin/dashboard";
import { ModerationPage } from "@/pages/admin/moderation";
import { UsersPage } from "@/pages/admin/users";
import { AdminExchangesPage } from "@/pages/admin/exchanges";

export const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route element={<ProtectedRoute />}>
      <Route index element={<Navigate to="/home" replace />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      <Route element={<OnboardingGuard />}>
        <Route element={<UserLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/add-book" element={<AddBookPage />} />
          <Route path="/book/:bookId" element={<BookDetailPage />} />
          <Route path="/book/:bookId/edit" element={<EditBookPage />} />
          <Route path="/my-exchanges" element={<ExchangesPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/liked-books" element={<LikedBooksPage />} />
          <Route path="/nearby" element={<NearbyUsersPage />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/books" element={<ModerationPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/exchanges" element={<AdminExchangesPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);
