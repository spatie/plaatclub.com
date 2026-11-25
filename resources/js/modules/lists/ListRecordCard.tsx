import { useForm } from '@inertiajs/react';
import { ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import { useState } from 'react';

import { RecordDetails } from '@/components/records/RecordDetails';
import { safeExternalUrl } from '@/components/records/discogsText';
import type { CollectionRecord } from '@/components/records/types';
import { ListRecordArtwork } from '@/modules/lists/ListRecordArtwork';
import { RecordOwnership } from '@/modules/lists/RecordOwnership';
import { TrackListeningLinks } from '@/modules/lists/TrackListeningLinks';
import type { ListRecord } from '@/modules/lists/types';
import { FieldError } from '@/modules/social/FieldError';

export function ListRecordCard({
    listId,
    record,
    number,
    canEdit,
}: {
    listId: string;
    record: ListRecord;
    number: number;
    canEdit: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [details, setDetails] = useState<CollectionRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [editingNote, setEditingNote] = useState(false);
    const note = useForm({ privateNote: record.privateNote ?? '' });
    const track = record.track;
    const title = track?.title ?? record.displayTitle;
    const artist = track?.artist || record.artist;
    const discogsUrl = safeExternalUrl(record.discogsUrl);

    async function loadDetails() {
        setLoading(true);
        setError(false);
        try {
            const response = await fetch(
                `/lists/${listId}/entries/${record.entryPublicId}`,
                { headers: { Accept: 'application/json' } },
            );
            if (!response.ok) throw new Error('Unable to load record');
            setDetails((await response.json()) as CollectionRecord);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <li
            className={`list-record-card ${track ? 'list-track-card' : ''}`}
            id={`record-${record.entryPublicId}`}
        >
            {!track && record.copyId !== undefined && (
                <span id={`record-${record.copyId}`} />
            )}
            <button
                className="list-record-toggle"
                type="button"
                aria-expanded={open}
                aria-controls={`details-${record.entryPublicId}`}
                onClick={() => {
                    setOpen(!open);
                    if (!open && !details && !loading) void loadDetails();
                }}
            >
                <span className="list-record-number">
                    {String(number).padStart(2, '0')}
                </span>
                <ListRecordArtwork record={record} />
                <span className="picker-record-text">
                    <strong>{title}</strong>
                    <span>{artist}</span>
                    {track ? (
                        <small>
                            From {record.displayTitle}
                            {track.duration ? ` · ${track.duration}` : ''}
                        </small>
                    ) : (
                        <>
                            <small>
                                {[record.year, record.format, record.country]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </small>
                            {(record.label || record.catalogNumber) && (
                                <small>
                                    {[record.label, record.catalogNumber]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </small>
                            )}
                            {canEdit && <RecordOwnership {...record} />}
                        </>
                    )}
                </span>
                {open ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                <span className="sr-only">
                    {track
                        ? 'Track and release details'
                        : 'Tracks and listening links'}
                </span>
            </button>
            {track && (
                <TrackListeningLinks track={details?.tracks[0] ?? track} />
            )}
            {canEdit && (
                <div className="list-entry-note">
                    {editingNote ? (
                        <form
                            className="stack"
                            onSubmit={(event) => {
                                event.preventDefault();
                                note.patch(
                                    `/lists/${listId}/entries/${record.entryPublicId}`,
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            note.setDefaults();
                                            setEditingNote(false);
                                        },
                                    },
                                );
                            }}
                        >
                            <label htmlFor={`note-${record.entryPublicId}`}>
                                Private note
                                <textarea
                                    id={`note-${record.entryPublicId}`}
                                    autoFocus
                                    rows={2}
                                    maxLength={2000}
                                    value={note.data.privateNote}
                                    disabled={note.processing}
                                    onChange={(event) =>
                                        note.setData(
                                            'privateNote',
                                            event.target.value,
                                        )
                                    }
                                    aria-describedby={`note-help-${record.entryPublicId}${note.errors.privateNote ? ` note-error-${record.entryPublicId}` : ''}`}
                                    aria-invalid={!!note.errors.privateNote}
                                />
                            </label>
                            <small id={`note-help-${record.entryPublicId}`}>
                                Only you can see this, whatever your list’s
                                visibility.
                            </small>
                            <FieldError
                                id={`note-error-${record.entryPublicId}`}
                                message={note.errors.privateNote}
                            />
                            <div className="actions">
                                <button
                                    className="button small"
                                    disabled={note.processing}
                                >
                                    {note.processing ? 'Saving…' : 'Save note'}
                                </button>
                                <button
                                    className="text-button"
                                    type="button"
                                    disabled={note.processing}
                                    onClick={() => {
                                        note.reset();
                                        note.clearErrors();
                                        setEditingNote(false);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            {record.privateNote && (
                                <p className="list-private-note">
                                    <small>Private note</small>
                                    {record.privateNote}
                                </p>
                            )}
                            <button
                                className="text-button"
                                type="button"
                                onClick={() => setEditingNote(true)}
                            >
                                <StickyNote size={14} aria-hidden="true" />{' '}
                                {record.privateNote
                                    ? 'Edit private note'
                                    : 'Add private note'}
                                <span className="sr-only"> for {title}</span>
                            </button>
                        </>
                    )}
                </div>
            )}
            <div
                id={`details-${record.entryPublicId}`}
                hidden={!open}
                className="list-record-details"
            >
                {loading && (
                    <p role="status">
                        {track ? 'Loading track details…' : 'Loading tracks…'}
                    </p>
                )}
                {error && (
                    <p role="alert">
                        Couldn’t load this record.{' '}
                        <button
                            className="text-button"
                            type="button"
                            onClick={() => void loadDetails()}
                        >
                            Try again
                        </button>
                    </p>
                )}
                {details &&
                    (track ? (
                        <div className="list-track-release-details">
                            <p>
                                <strong>{record.displayTitle}</strong> ·{' '}
                                {record.artist}
                            </p>
                            <p>
                                {[
                                    record.year,
                                    record.format,
                                    record.country,
                                    record.label,
                                    record.catalogNumber,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                            {discogsUrl && (
                                <a
                                    href={discogsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View this edition on Discogs ↗
                                </a>
                            )}
                            {canEdit && <RecordOwnership {...record} />}
                        </div>
                    ) : (
                        <RecordDetails
                            record={record}
                            details={details}
                            titleId={`record-title-${record.entryPublicId}`}
                        />
                    ))}
            </div>
        </li>
    );
}
