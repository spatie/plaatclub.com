import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

import { ListRecordArtwork } from '@/modules/lists/ListRecordArtwork';
import { listEntryIdentity } from '@/modules/lists/listEntryIdentity';
import { RecordOwnership } from '@/modules/lists/RecordOwnership';
import type { PickerRecord } from '@/modules/lists/types';

export function SortableListRecord({
    index,
    onRemove,
    record,
    disabled = false,
}: {
    index: number;
    onRemove: () => void;
    record: PickerRecord;
    disabled?: boolean;
}) {
    const {
        attributes,
        isDragging,
        listeners,
        setActivatorNodeRef,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: listEntryIdentity(record), disabled });
    const title = record.track?.title ?? record.displayTitle;
    const artist = record.track?.artist || record.artist;

    return (
        <li
            ref={setNodeRef}
            className={isDragging ? 'is-dragging' : undefined}
            style={{ transform: CSS.Transform.toString(transform), transition }}
        >
            <button
                ref={setActivatorNodeRef}
                className="selection-drag"
                type="button"
                disabled={disabled}
                {...attributes}
                {...listeners}
                aria-label={`Reorder ${title} by ${artist}`}
            >
                <GripVertical size={20} aria-hidden="true" />
            </button>
            <span className="selection-number">{index + 1}</span>
            <ListRecordArtwork record={record} />
            <div className="picker-record-text">
                <strong>{title}</strong>
                <small>{artist}</small>
                {record.track && (
                    <small>
                        From {record.displayTitle}
                        {record.track.duration
                            ? ` · ${record.track.duration}`
                            : ''}
                    </small>
                )}
                {!record.track && (
                    <>
                        <small>
                            {[record.year, record.format, record.country]
                                .filter(Boolean)
                                .join(' · ')}
                        </small>
                        {record.catalogNumber && (
                            <small>{record.catalogNumber}</small>
                        )}
                        <RecordOwnership {...record} />
                    </>
                )}
            </div>
            <button
                className="selection-remove"
                type="button"
                disabled={disabled}
                aria-label={`Remove ${title} by ${artist}`}
                onClick={onRemove}
            >
                <X size={17} aria-hidden="true" />
            </button>
        </li>
    );
}
