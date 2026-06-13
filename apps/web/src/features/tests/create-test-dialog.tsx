import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTestSchema, type CreateTestInput } from 'shared';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTest } from './hooks';

export function CreateTestDialog() {
  const [open, setOpen] = useState(false);
  const createTest = useCreateTest();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTestInput>({
    resolver: zodResolver(createTestSchema),
    defaultValues: { name: '', description: '', passingPct: 70 },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createTest.mutateAsync(values);
      toast.success('Test created');
      reset();
      setOpen(false);
    } catch {
      toast.error('Could not create the test');
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New test</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a test</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="passingPct">Passing %</Label>
            <Input
              id="passingPct"
              type="number"
              min={1}
              max={100}
              aria-invalid={!!errors.passingPct}
              {...register('passingPct', { valueAsNumber: true })}
            />
            {errors.passingPct && (
              <p className="text-xs text-destructive">
                {errors.passingPct.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createTest.isPending}>
              {createTest.isPending ? 'Creating…' : 'Create test'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
