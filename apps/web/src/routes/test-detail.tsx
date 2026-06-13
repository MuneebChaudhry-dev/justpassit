import { useEffect, useState } from 'react';
import { createRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft01Icon,
  Delete02Icon,
  CloudUploadIcon,
} from '@hugeicons/core-free-icons';
import { updateTestSchema, type UpdateTestInput } from 'shared';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
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
import { UploadPanel } from '@/features/tests/upload-panel';
import { messageFrom } from '@/features/tests/errors';
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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateTestInput>({
    resolver: zodResolver(updateTestSchema),
  });

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
    try {
      await deleteTest.mutateAsync(testId);
      toast.success('Test deleted');
      navigate({ to: '/tests' });
    } catch (e) {
      toast.error(messageFrom(e, 'Could not delete the test'));
      setConfirmOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* One-line header: Back · Title (+badges) · Delete */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/tests' })}
        >
          <Icon icon={ArrowLeft01Icon} size={16} />
          Back
        </Button>
        <div className="flex flex-1 items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {test.name}
          </h1>
          {test.isLocked && <Badge variant="secondary">Locked</Badge>}
          {!test.isActive && <Badge variant="outline">Inactive</Badge>}
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={deleteTest.isPending}
        >
          <Icon icon={Delete02Icon} size={16} />
          Delete test
        </Button>
      </div>

      {test.isLocked && (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
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
            <div className="flex max-w-xs flex-col gap-1.5">
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
            <label className="flex w-fit items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" {...register('isActive')} />
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
          {!test.isLocked && questions && questions.length > 0 && (
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Icon icon={CloudUploadIcon} size={16} />
                  Replace questions
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Replace questions</DialogTitle>
                </DialogHeader>
                <UploadPanel
                  testId={testId}
                  onUploaded={() => setUploadOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {!questions || questions.length === 0 ? (
            test.isLocked ? (
              <p className="text-sm text-muted-foreground">
                No questions on this locked test.
              </p>
            ) : (
              // Empty + unlocked → show the dropzone inline so uploading is obvious.
              <UploadPanel testId={testId} />
            )
          ) : (
            <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
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
                      <TableCell className="text-muted-foreground">
                        {q.orderNum}
                      </TableCell>
                      <TableCell>{q.questionText}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{q.correctAnswer}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this test?"
        description={`"${test.name}" and its questions will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete test"
        destructive
        loading={deleteTest.isPending}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}
