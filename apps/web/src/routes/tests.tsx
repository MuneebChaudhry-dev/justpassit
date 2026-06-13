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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Tests</h1>
        <CreateTestDialog />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && (
        <p className="text-sm text-destructive">Could not load tests.</p>
      )}

      {tests && tests.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tests yet. Create your first one.
        </p>
      )}

      {tests && tests.length > 0 && (
        <div className="rounded-md ring-1 ring-foreground/10">
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
