import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';

interface IconProps {
  icon: IconSvgElement;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Thin wrapper over HugeiconsIcon so icon usage is consistent across the app.
 * Pass an icon from `@hugeicons/core-free-icons`, e.g. <Icon icon={ViewIcon} />.
 */
export function Icon({ icon, className, size = 18, strokeWidth = 1.8 }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={cn('shrink-0', className)}
    />
  );
}
