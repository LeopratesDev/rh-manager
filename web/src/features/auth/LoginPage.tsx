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
    <main className="grid min-h-screen md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section className="flex flex-col justify-between bg-ctps px-8 py-10 text-white md:px-14 md:py-16">
        <p className="text-sm font-semibold text-ouro">RH Manager</p>
        <div className="my-10 max-w-sm">
          <h1 className="text-4xl leading-tight font-extrabold text-ouro md:text-5xl">
            Férias pedidas, aprovadas e registradas.
          </h1>
          <p className="mt-4 text-white/75">
            O colaborador pede, o RH aprova ou rejeita com motivo, e cada decisão fica registrada.
          </p>
        </div>
        <p className="text-xs text-white/50">Projeto de portfólio · dados fictícios</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <form
          noValidate
          onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
          className="w-full max-w-sm space-y-5"
        >
          <div>
            <h2 className="text-2xl font-extrabold text-ctps">Entrar</h2>
            <p className="text-sm text-tinta-suave">Use seu e-mail corporativo.</p>
          </div>

          <FormField label="E-mail" error={errors.email?.message}>
            <input type="email" autoComplete="username" {...register('email')} />
          </FormField>

          <FormField label="Senha" error={errors.password?.message}>
            <input type="password" autoComplete="current-password" {...register('password')} />
          </FormField>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-md bg-carimbo-vermelho/5 px-3 py-2 text-sm text-carimbo-vermelho"
            >
              {errorMessage}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
