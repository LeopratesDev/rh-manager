import { z } from 'zod';
import { isValidCpf, onlyDigits } from '../../lib/cpf';

export const employeeSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(150, 'Máximo de 150 caracteres.'),
  email: z.string().trim().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
  cpf: z.string().refine(isValidCpf, 'CPF inválido.').transform(onlyDigits),
  position: z.string().trim().min(1, 'Informe o cargo.').max(100, 'Máximo de 100 caracteres.'),
  salary: z.number({ error: 'Informe o salário.' }).positive('O salário deve ser maior que zero.'),
  hireDate: z.string().min(1, 'Informe a data de admissão.'),
  departmentId: z
    .number({ error: 'Selecione o departamento.' })
    .int()
    .positive('Selecione o departamento.'),
  status: z.enum(['Active', 'Inactive']),
});

export type EmployeeFormInput = z.input<typeof employeeSchema>;
export type EmployeeFormOutput = z.output<typeof employeeSchema>;
