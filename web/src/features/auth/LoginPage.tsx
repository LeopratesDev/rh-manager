import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router';
import { z } from 'zod';
import { getErrorMessage, getStatus } from '../../api/errors';
import { FormField } from '../../components/FormField';
import { login } from './authApi';
import { homePathFor, useAuth } from './authContext';

const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      signIn(session);
      navigate(homePathFor(session.user), { replace: true });
    },
  });

  if (user) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  const errorMessage = loginMutation.isError
    ? getStatus(loginMutation.error) === 401
      ? 'E-mail ou senha inválidos.'
      : getErrorMessage(loginMutation.error)
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        noValidate
        onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        className="w-full max-w-sm space-y-5 rounded-xl bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">RH Manager</h1>
          <p className="text-sm text-slate-500">Entre com seu e-mail corporativo.</p>
        </div>

        <FormField label="E-mail" error={errors.email?.message}>
          <input type="email" autoComplete="username" {...register('email')} />
        </FormField>

        <FormField label="Senha" error={errors.password?.message}>
          <input type="password" autoComplete="current-password" {...register('password')} />
        </FormField>

        {errorMessage && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
