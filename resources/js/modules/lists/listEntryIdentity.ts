import type { PickerRecord } from '@/modules/lists/types';

export function listEntryIdentity(record: PickerRecord): string {
    return (
        record.entryPublicId ??
        `${record.releaseId}:${record.track?.index ?? 'record'}`
    );
}
