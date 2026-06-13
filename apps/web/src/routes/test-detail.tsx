import { useEffect } from 'react';
import { createRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateTestSchema, type UpdateTestInput } from 'shared';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UploadDialog } from '@/features/tests/upload-dialog';
import {
  useDeleteTest,
  useQuestions,
  useTest,
  useUpdateTest,
} from '@/features/tests/hooks';
import { protectedRoute } from './protected';

export const testDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/tests/$testId',
  beforeLoad: ({ context }) => {
    if (!context.auth.isLoading && context.auth.user?.role !== 'SUPERADMIN') {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: TestDetailPage,
});

function TestDetailPage() {
  const { testId } = testDetailRoute.useParams();
  const navigate = useNavigate();
  const { data: test, isLoading } = useTest(testId);
  const { data: questions } = useQuestions(testId);
  const updateTest = useUpdateTest(testId);
  const deleteTest = useDeleteTest();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateTestInput>({
    resolver: zodResolver(updateTestSchema),
  });

  // Populate the form once the test loads.
  useEffect(() => {
    if (test) {
      reset({
        name: test.name,
        description: test.description ?? '',
        passingPct: test.passingPct,
        isActive: test.isActive,
      });
    }
  }, [test, reset]);

  if (isLoading || !test) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const onSave = handleSubmit(async (values) => {
    try {
      await updateTest.mutateAsync(values);
      toast.success('Saved');
    } catch (e) {
      toast.error(messageFrom(e, 'Could not save changes'));
    }
  });

  const onDelete = async () => {
    if (!confirm(`Delete "${test.name}"? This cannot be undone.`)) return;
    try {
      await deleteTest.mutateAsync(testId);
      toast.success('Test deleted');
      navigate({ to: '/tests' });
    } catch (e) {
      toast.error(messageFrom(e, 'Could not delete the test'));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground">{test.name}</h1>
          {test.isLocked && <Badge variant="secondary">Locked</Badge>}
          {!test.isActive && <Badge variant="outline">Inactive</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: '/tests' })}>
          Back to tests
        </Button>
      </div>

      {test.isLocked && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          This test has attempts and is locked. Questions and the passing % can no
          longer be changed; you can still edit the name/description and
          activate/deactivate it.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="passingPct">Passing %</Label>
              <Input
                id="passingPct"
                type="number"
                min={1}
                max={100}
                disabled={test.isLocked}
                aria-invalid={!!errors.passingPct}
                {...register('passingPct', { valueAsNumber: true })}
              />
              {test.isLocked && (
                <p className="text-xs text-muted-foreground">
                  Locked — passing % cannot change.
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('isActive')} />
              Active
            </label>
            <div>
              <Button type="submit" disabled={updateTest.isPending || !isDirty}>
                {updateTest.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Questions ({test.totalQuestions})</CardTitle>
          {!test.isLocked && <UploadDialog testId={testId} />}
        </CardHeader>
        <CardContent>
          {!questions || questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No questions yet.{' '}
              {test.isLocked ? '' : 'Upload a sheet to add them.'}
            </p>
          ) : (
            <div className="rounded-md ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead className="w-16">Answer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>{q.orderNum}</TableCell>
                      <TableCell>{q.questionText}</TableCell>
                      <TableCell>{q.correctAnswer}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => void onDelete()}
          disabled={deleteTest.isPending}
        >
          Delete test
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">
          Only possible while the test has no attempts.
        </p>
      </div>
    </div>
  );
}

function messageFrom(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const resp = (error as { response?: { data?: { message?: unknown } } })
      .response;
    const msg = resp?.data?.message;
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}
