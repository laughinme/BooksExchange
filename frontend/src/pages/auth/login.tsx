import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { BookOpen } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useLogin } from "@/features/auth/model/hooks";
import { profileQueryKey } from "@/entities/profile/model/hooks";
import type { Profile } from "@/entities/profile/model/types";
import { hasRole } from "@/shared/authz";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";

type FormValues = {
  email: string;
  password: string;
};

type DemoAccount = {
  id: string;
  label: string;
  role: "Админ" | "Пользователь";
  email: string;
  password: string;
};

const demoAccounts: DemoAccount[] = [
  {
    id: "admin",
    label: "Администратор",
    role: "Админ",
    email: "admin@books.com",
    password: "admin1234",
  },
  {
    id: "demo",
    label: "Демо пользователь",
    role: "Пользователь",
    email: "demo@books.com",
    password: "demo1234",
  },
  {
    id: "reader",
    label: "Читатель",
    role: "Пользователь",
    email: "reader@books.com",
    password: "reader1234",
  },
];

export const LoginPage = () => {
  const { register, handleSubmit, formState, setValue } = useForm<FormValues>();
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const performLogin = async (values: FormValues) => {
    setError(null);
    try {
      await loginMutation.mutateAsync(values);
      const redirectFromState =
        (location.state as { from?: Location })?.from?.pathname;

      const profile = queryClient.getQueryData<Profile>(profileQueryKey);
      const isAdmin = hasRole(profile?.roles, "admin");

      const isAdminRouteRequested = redirectFromState?.startsWith("/admin");
      const redirect = (() => {
        if (isAdminRouteRequested) return isAdmin ? "/admin" : "/home";
        return redirectFromState || "/home";
      })();

      navigate(redirect, { replace: true });
    } catch {
      setError("Не удалось войти. Проверьте данные и попробуйте снова.");
    }
  };

  const handleQuickLogin = async (account: DemoAccount) => {
    setValue("email", account.email, { shouldDirty: true, shouldValidate: true });
    setValue("password", account.password, { shouldDirty: true, shouldValidate: true });
    await performLogin({ email: account.email, password: account.password });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-0 -z-10 be-app-bg" />
      <Card className="w-full max-w-md">
        <CardHeader className="flex items-center gap-2">
          <BookOpen className="size-6 text-primary" />
          <CardTitle>Войти</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(performLogin)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register("email", { required: "Укажите email" })}
              />
              {formState.errors.email && (
                <p className="text-sm text-destructive">
                  {formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password", { required: "Введите пароль" })}
              />
              {formState.errors.password && (
                <p className="text-sm text-destructive">
                  {formState.errors.password.message}
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Входим..." : "Войти"}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Тестовые аккаунты
                </p>
              </div>
              <Badge variant="muted">Demo</Badge>
            </div>

            <div className="space-y-3">
              {demoAccounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-lg border border-border/60 bg-muted/30 p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {account.label}
                        </p>

                      </div>
                      <div className="space-y-0.5 text-[11px] leading-4 text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground/70">
                            Email:
                          </span>{" "}
                          <span className="font-mono">{account.email}</span>
                        </p>

                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleQuickLogin(account)}
                        disabled={loginMutation.isPending}
                      >
                        Login
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ещё нет аккаунта?{" "}
            <Link to="/register" className="text-primary underline">
              Зарегистрироваться
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
