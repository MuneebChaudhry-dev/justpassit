import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { UploadPreview } from 'shared';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/ui/file-dropzone';
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
import { messageFrom } from './errors';

interface UploadPanelProps {
  testId: string;
  /** Called after a successful commit. */
  onUploaded?: (inserted: number) => void;
  /** Label for the commit button's "done" affordance. */
  commitLabel?: string;
}

/**
 * Reusable upload UI: dropzone → dry-run preview with per-row validation →
 * commit (only enabled when every row is valid; server re-validates anyway).
 * Used by both the create-test wizard and the test detail page.
 */
export function UploadPanel({
  testId,
  onUploaded,
  commitLabel,
}: UploadPanelProps) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [busy, setBusy] = useState(false);

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
      setFile(null);
      setPreview(null);
      onUploaded?.(inserted);
    } catch (e) {
      toast.error(messageFrom(e, 'Import failed'));
    } finally {
      setBusy(false);
    }
  };

  const canCommit =
    !!preview && preview.errorCount === 0 && preview.validCount > 0 && !busy;

  return (
    <div className="flex flex-col gap-4">
      <FileDropzone
        file={file}
        onFile={(f) => void onFile(f)}
        disabled={busy}
        hint="Columns: Index, Question, Option A–E, Answer (letter A–E or the option text), Reason. Re-uploading replaces all existing questions."
      />

      {busy && !preview && (
        <p className="text-sm text-muted-foreground">Reading file…</p>
      )}

      {preview && (
        <>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{preview.totalRows} rows</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-primary">{preview.validCount} valid</span>
            {preview.errorCount > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-destructive">
                  {preview.errorCount} with errors
                </span>
              </>
            )}
          </div>

          <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-foreground/10">
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
                    <TableCell className="text-muted-foreground">
                      {row.rowNumber}
                    </TableCell>
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

          <div className="flex justify-end">
            <Button onClick={() => void onCommit()} disabled={!canCommit}>
              {busy
                ? 'Importing…'
                : (commitLabel ??
                  `Import ${preview.validCount} question${preview.validCount === 1 ? '' : 's'}`)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
