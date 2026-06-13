import { createRoute, Link, redirect } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/layout/page-header';
import { CreateTestDialog } from '@/features/tests/create-test-dialog';
import { useTests } from '@/features/tests/hooks';
import { protectedRoute } from './protected';

export const testsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/tests',
  // SuperAdmin-only for Phase 1.
  beforeLoad: ({ context }) => {
    if (!context.auth.isLoading && context.auth.user?.role !== 'SUPERADMIN') {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: TestsPage,
});

function TestsPage() {
  const { data: tests, isLoading, isError } = useTests();

  return (
    <div>
      <PageHeader
        title="Tests"
        description="Create tests and upload their question sheets."
        actions={<CreateTestDialog />}
      />

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && (
        <p className="text-sm text-destructive">Could not load tests.</p>
      )}

      {tests && tests.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">No tests yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first test to get started.
          </p>
        </div>
      )}

      {tests && tests.length > 0 && (
        <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-24">Passing %</TableHead>
                <TableHead className="w-24">Questions</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-28">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>
                    <Link
                      to="/tests/$testId"
                      params={{ testId: test.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {test.name}
                    </Link>
                  </TableCell>
                  <TableCell>{test.passingPct}%</TableCell>
                  <TableCell>{test.totalQuestions}</TableCell>
                  <TableCell className="space-x-1">
                    <Badge variant={test.isActive ? 'default' : 'outline'}>
                      {test.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {test.isLocked && <Badge variant="secondary">Locked</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(test.createdAt), 'dd MMM yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
