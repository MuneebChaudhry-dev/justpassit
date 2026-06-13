import { useRef, useState, type DragEvent } from 'react';
import { CloudUploadIcon, File01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  accept?: string;
  file: File | null;
  onFile: (file: File | null) => void;
  hint?: string;
  disabled?: boolean;
}

/**
 * Styled drag-and-drop / click-to-browse file picker. Replaces the raw native
 * <input type=file> so uploads look intentional and on-theme.
 */
export function FileDropzone({
  accept = '.xlsx,.xls,.csv',
  file,
  onFile,
  hint,
  disabled = false,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFile(dropped);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-input/20 px-6 py-8 text-center transition-colors',
          'hover:border-primary/60 hover:bg-input/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none',
          dragging && 'border-primary bg-primary/5',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon icon={file ? File01Icon : CloudUploadIcon} size={22} />
        </span>
        {file ? (
          <span className="text-sm font-medium text-foreground">{file.name}</span>
        ) : (
          <>
            <span className="text-sm font-medium text-foreground">
              Drop your sheet here, or{' '}
              <span className="text-primary">browse</span>
            </span>
            <span className="text-xs text-muted-foreground">
              Excel (.xlsx, .xls) or CSV
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
