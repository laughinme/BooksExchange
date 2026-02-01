import { useState } from "react";
import { useForm } from "react-hook-form";
import { BookOpen } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useLogin } from "@/features/auth/model/hooks";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type FormValues = {
  email: string;
  password: string;
};

export const LoginPage = () => {
  const { register, handleSubmit, formState } = useForm<FormValues>();
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await loginMutation.mutateAsync(values);
      const redirectFromState =
        (location.state as { from?: Location })?.from?.pathname;
      const adminLogin =
        values.email === "admin@example.com" && values.password === "admin";

      const redirect = adminLogin
        ? "/"
        : redirectFromState || "/home";

      navigate(redirect, { replace: true });
    } catch {
      setError("Не удалось войти. Проверьте данные и попробуйте снова.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex items-center gap-2">
          <BookOpen className="size-6 text-primary" />
          <CardTitle>Войти</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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

          <p className="mt-4 text-center text-sm text-muted-foreground">
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
