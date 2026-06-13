import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Add01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { createTestSchema, type CreateTestInput, type Test } from 'shared';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTest } from './hooks';
import { messageFrom } from './errors';
import { UploadPanel } from './upload-panel';

/**
 * Two-step "New test" wizard in one modal:
 *   1. Test info → create (gets an id back)
 *   2. Upload the question sheet (optional — can be done later from the detail page)
 * Closing after step 1 keeps the created test and lands on its detail page.
 */
export function CreateTestDialog() {
  const navigate = useNavigate();
  const createTest = useCreateTest();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Test | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTestInput>({
    resolver: zodResolver(createTestSchema),
    defaultValues: { name: '', description: '', passingPct: 70 },
  });

  const close = (goToDetail: boolean) => {
    setOpen(false);
    const id = created?.id;
    setCreated(null);
    reset();
    if (goToDetail && id) {
      navigate({ to: '/tests/$testId', params: { testId: id } });
    }
  };

  const onCreate = handleSubmit(async (values) => {
    try {
      const test = await createTest.mutateAsync(values);
      setCreated(test); // advance to step 2
      toast.success('Test created — now add its questions');
    } catch (e) {
      toast.error(messageFrom(e, 'Could not create the test'));
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close(!!created);
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Icon icon={Add01Icon} size={16} />
          New test
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        {/* Step indicator */}
        <DialogHeader>
          <DialogTitle>
            {created ? 'Add questions' : 'Create a test'}
          </DialogTitle>
          <DialogDescription>
            {created
              ? `Upload the question sheet for "${created.name}", or skip and do it later.`
              : 'Step 1 of 2 — enter the test details.'}
          </DialogDescription>
        </DialogHeader>

        {!created ? (
          <form onSubmit={onCreate} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Geography 101"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What this test covers…"
                {...register('description')}
              />
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
                {createTest.isPending ? 'Creating…' : 'Continue'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground">
              <Icon
                icon={CheckmarkCircle02Icon}
                size={18}
                className="text-primary"
              />
              Test created. Now upload its questions.
            </div>
            <UploadPanel
              testId={created.id}
              onUploaded={() => close(true)}
              commitLabel="Import & finish"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => close(true)}>
                Skip for now
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
