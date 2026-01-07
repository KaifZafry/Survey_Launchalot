'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SurveySchema } from '@/lib/schemas';
import { z } from 'zod';

export type SurveyFormValues = z.infer<typeof SurveySchema>;

export default function SurveyForm({ onSubmit, companies } : {
  onSubmit: (v: SurveyFormValues)=>Promise<void>|void,
  companies: { id: string; name: string }[],
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<SurveyFormValues>({ resolver: zodResolver(SurveySchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 max-w-xl">
      <label className="text-sm">Company</label>
      <select {...register('companyId')} className="input">
        <option value="">Select company</option>
        {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {errors.companyId && <p className="text-red-600 text-xs">{errors.companyId.message}</p>}

      <label className="text-sm">Survey Name</label>
      <input {...register('name')} className="input" placeholder="Customer NPS 2025"/>
      {errors.name && <p className="text-red-600 text-xs">{errors.name.message}</p>}

      <label className="text-sm">Status</label>
      <select {...register('status')} className="input">
        <option value="ACTIVE">ACTIVE</option>
        <option value="INACTIVE">INACTIVE</option>
      </select>

      <button disabled={isSubmitting} className="btn w-fit">Save</button>
    </form>
  );
}
