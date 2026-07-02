import type { ContentStatus } from "@/generated/prisma/client";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
