import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { UploadPreview } from 'shared';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { commitUpload, previewUpload } from './api';
import { testKeys } from './hooks';

/**
 * Upload wizard: choose a .xlsx/.xls/.csv → dry-run preview with per-row
 * validation → commit only when every row is valid (server re-validates anyway).
 */
export function UploadDialog({ testId }: { testId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onFile = async (f: File | null) => {
    setFile(f);
    setPreview(null);
    if (!f) return;
    setBusy(true);
    try {
      setPreview(await previewUpload(testId, f));
    } catch (e) {
      toast.error(messageFrom(e, 'Could not read that file'));
    } finally {
      setBusy(false);
    }
  };

  const onCommit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const { inserted } = await commitUpload(testId, file);
      toast.success(`Imported ${inserted} question${inserted === 1 ? '' : 's'}`);
      void qc.invalidateQueries({ queryKey: testKeys.questions(testId) });
      void qc.invalidateQueries({ queryKey: testKeys.detail(testId) });
      void qc.invalidateQueries({ queryKey: testKeys.all });
      reset();
      setOpen(false);
    } catch (e) {
      toast.error(messageFrom(e, 'Import failed'));
    } finally {
      setBusy(false);
    }
  };

  const canCommit =
    !!preview && preview.errorCount === 0 && preview.validCount > 0 && !busy;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Upload questions</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload questions</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="text-sm"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            Columns: Index, Question, Option A–E, Answer (letter A–E or the option
            text), Reason. Re-uploading replaces all existing questions.
          </p>

          {busy && !preview && (
            <p className="text-sm text-muted-foreground">Reading file…</p>
          )}

          {preview && (
            <>
              <div className="text-sm">
                <span className="font-medium">{preview.totalRows}</span> rows ·{' '}
                <span className="text-primary">{preview.validCount} valid</span>
                {preview.errorCount > 0 && (
                  <span className="text-destructive">
                    {' '}
                    · {preview.errorCount} with errors
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-auto rounded-md ring-1 ring-foreground/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead className="w-16">Answer</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {row.data?.questionText ?? '—'}
                        </TableCell>
                        <TableCell>{row.data?.correctAnswer ?? '—'}</TableCell>
                        <TableCell>
                          {row.errors.length === 0 ? (
                            <span className="text-primary">OK</span>
                          ) : (
                            <span className="text-destructive">
                              {row.errors.join('; ')}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {preview.errorCount > 0 && (
                <p className="text-xs text-destructive">
                  Fix the flagged rows in your sheet and re-upload — import requires
                  every row to be valid.
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => void onCommit()} disabled={!canCommit}>
            {busy && preview
              ? 'Importing…'
              : preview
                ? `Import ${preview.validCount} question${preview.validCount === 1 ? '' : 's'}`
                : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Pull a useful message out of an axios error, falling back to a default. */
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
