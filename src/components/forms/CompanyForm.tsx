'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CompanySchema } from '@/lib/schemas';
import { z } from 'zod';

export type CompanyFormValues = z.infer<typeof CompanySchema>;

export default function CompanyForm({ onSubmit, defaultValues } : {
  onSubmit: (v: CompanyFormValues)=>Promise<void>|void,
  defaultValues?: Partial<CompanyFormValues>,
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<CompanyFormValues>({ resolver: zodResolver(CompanySchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 max-w-xl">
      <label className="text-sm">Company Name</label>
      <input {...register('name')} className="input" placeholder="Company Inc."/>
      {errors.name && <p className="text-red-600 text-xs">{errors.name.message}</p>}

      <label className="text-sm">Logo URL</label>
      <input {...register('logoUrl')} className="input" placeholder="https://..."/>
      {errors.logoUrl && <p className="text-red-600 text-xs">{errors.logoUrl.message}</p>}

      <button disabled={isSubmitting} className="btn w-fit">Save</button>
    </form>
  );
}
