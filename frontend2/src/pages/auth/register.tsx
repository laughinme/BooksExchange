import { useState } from "react";
import { useForm } from "react-hook-form";
import { BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useRegister } from "@/features/auth/model/hooks";
import { profileQueryOptions } from "@/entities/profile/model/hooks";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type FormValues = {
  username: string;
  email: string;
  password: string;
};

export const RegisterPage = () => {
  const { register, handleSubmit, formState } = useForm<FormValues>();
  const registerMutation = useRegister();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await registerMutation.mutateAsync(values);
      await queryClient.ensureQueryData(profileQueryOptions());
      navigate("/home", { replace: true });
    } catch {
      setError("Не удалось завершить регистрацию. Попробуйте позже.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex items-center gap-2">
          <BookOpen className="size-6 text-primary" />
          <CardTitle>Регистрация</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                autoComplete="username"
                {...register("username", { required: "Введите имя" })}
              />
              {formState.errors.username && (
                <p className="text-sm text-destructive">
                  {formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
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
                autoComplete="new-password"
                {...register("password", {
                  required: "Введите пароль",
                  minLength: { value: 8, message: "Минимум 8 символов" },
                })}
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
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Регистрация..." : "Создать аккаунт"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-primary underline">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
