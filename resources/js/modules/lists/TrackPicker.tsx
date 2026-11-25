import { Check, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useId, useState } from 'react';

import type { ListTrack, PickerRecord } from '@/modules/lists/types';

export function TrackPicker({
    listId,
    record,
    selected,
    disabled,
    onAdd,
}: {
    listId: string;
    record: PickerRecord;
    selected: PickerRecord[];
    disabled: boolean;
    onAdd: (record: PickerRecord) => void;
}) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [tracks, setTracks] = useState<ListTrack[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadTracks() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `/lists/${listId}/releases/${record.releaseId}/tracks`,
                {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                },
            );
            if (!response.ok) {
                if (response.status === 422) {
                    const data = (await response.json()) as {
                        errors?: { tracks?: string | string[] };
                    };
                    const message = data.errors?.tracks;
                    setError(
                        Array.isArray(message)
                            ? message.join(' ')
                            : (message ??
                                  'This release’s tracks are unavailable. Try again in a moment.'),
                    );
                    return;
                }
                throw new Error('Unable to load tracks');
            }
            const data = (await response.json()) as { tracks: ListTrack[] };
            setTracks(data.tracks);
        } catch {
            setError(
                'Couldn’t load tracks. Check your connection and try again.',
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                className="picker-add picker-choose-tracks"
                type="button"
                aria-expanded={open}
                aria-controls={id}
                aria-label={`${open ? 'Hide' : 'Choose'} tracks from ${record.displayTitle} by ${record.artist}`}
                disabled={disabled}
                onClick={() => {
                    setOpen(!open);
                    if (!open && tracks === null && !loading) void loadTracks();
                }}
            >
                {open ? 'Hide tracks' : 'Choose tracks'}
                {open ? (
                    <ChevronUp size={16} aria-hidden="true" />
                ) : (
                    <ChevronDown size={16} aria-hidden="true" />
                )}
            </button>
            <div
                id={id}
                hidden={!open}
                className="picker-release-tracks"
                aria-busy={loading}
            >
                {loading && <p role="status">Loading tracks…</p>}
                {error && (
                    <div role="alert" className="field-error">
                        <p>{error}</p>
                        <button
                            className="text-button"
                            type="button"
                            disabled={loading || disabled}
                            onClick={() => void loadTracks()}
                        >
                            Try again
                        </button>
                    </div>
                )}
                {tracks?.length === 0 && (
                    <p>
                        No individual tracks are available for this release. Try
                        another edition on Discogs.
                    </p>
                )}
                {tracks && tracks.length > 0 && (
                    <ol aria-label={`Tracks on ${record.displayTitle}`}>
                        {tracks.map((track) => {
                            const added = selected.some(
                                (entry) =>
                                    entry.releaseId === record.releaseId &&
                                    entry.track?.index === track.index,
                            );
                            return (
                                <li key={track.index}>
                                    <span className="track-position">
                                        {track.position || track.index + 1}
                                    </span>
                                    <div className="picker-record-text">
                                        <strong>{track.title}</strong>
                                        <small>
                                            {track.artist || record.artist}
                                        </small>
                                    </div>
                                    <span className="track-duration">
                                        {track.duration}
                                    </span>
                                    <button
                                        className={`picker-add ${added ? 'is-added' : ''}`}
                                        type="button"
                                        disabled={
                                            added ||
                                            disabled ||
                                            selected.length >= 1000
                                        }
                                        aria-label={`${added ? 'Added' : 'Add'} ${track.title} by ${track.artist || record.artist}`}
                                        onClick={() =>
                                            onAdd({ ...record, track })
                                        }
                                    >
                                        {added ? (
                                            <Check
                                                size={17}
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <Plus
                                                size={17}
                                                aria-hidden="true"
                                            />
                                        )}
                                        {added ? 'Added' : 'Add'}
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>
        </>
    );
}
