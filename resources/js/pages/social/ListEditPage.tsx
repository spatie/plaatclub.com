import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Check, Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { ListRecordArtwork } from '@/modules/lists/ListRecordArtwork';
import { listEntryIdentity } from '@/modules/lists/listEntryIdentity';
import { RecordOwnership } from '@/modules/lists/RecordOwnership';
import { SortableListRecord } from '@/modules/lists/SortableListRecord';
import { TrackPicker } from '@/modules/lists/TrackPicker';
import type { ListEditProps, PickerRecord } from '@/modules/lists/types';
import { VisibilityPicker } from '@/modules/social/VisibilityPicker';
import '../../../css/record-lists.css';

export function ListEditPage({
    list,
    records,
    results,
    query,
    source: initialSource,
    searchError,
}: ListEditProps) {
    const form = useForm(`RecordList:${list.publicId}`, {
        name: list.name,
        description: list.description ?? '',
        visibility: list.visibility,
        selection: records as PickerRecord[],
    });
    const [source, setSource] = useState(initialSource);
    const [search, setSearch] = useState(query);
    const [review, setReview] = useState(false);
    const [searching, setSearching] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cancelSearch = useRef<(() => void) | null>(null);
    const base = `/lists/${list.publicId}`;
    const isTrackList = list.type === 'tracks';
    const itemName = isTrackList ? 'track' : 'record';
    const itemNames = isTrackList ? 'tracks' : 'records';
    const selected = form.data.selection;
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    useEffect(
        () => () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
            cancelSearch.current?.();
        },
        [],
    );

    useEffect(() => {
        if (!form.isDirty) return;
        const preventUnload = (event: BeforeUnloadEvent) =>
            event.preventDefault();
        window.addEventListener('beforeunload', preventUnload);
        const stop = router.on('before', (event) => {
            if (
                event.detail.visit.method !== 'get' ||
                event.detail.visit.url.pathname === `${base}/edit`
            )
                return;
            if (!window.confirm('Leave without saving your list changes?'))
                event.preventDefault();
        });
        return () => {
            window.removeEventListener('beforeunload', preventUnload);
            stop();
        };
    }, [form.isDirty, base]);

    function visit(url: string, paginate = false) {
        if (form.processing) return;
        cancelSearch.current?.();
        setSearching(true);
        router.get(
            url,
            {},
            {
                only: ['results', 'query', 'source', 'searchError'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onCancelToken: (token) => {
                    cancelSearch.current = token.cancel;
                },
                onSuccess: () => {
                    if (paginate)
                        document
                            .getElementById('record-search')
                            ?.scrollIntoView({ block: 'center' });
                },
                onFinish: () => setSearching(false),
            },
        );
    }

    function searchFor(value: string) {
        if (form.processing) return;
        setSearch(value);
        cancelSearch.current?.();
        setSearching(true);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(
            () =>
                visit(
                    `${base}/edit?source=${source}&q=${encodeURIComponent(value)}`,
                ),
            source === 'discogs' ? 500 : 250,
        );
    }

    return (
        <>
            <Head title={`Pick ${itemNames} · ${list.name}`} />
            <div className="list-editor-heading">
                <Link href={base}>← Back to list</Link>
                <p className="page-eyebrow">
                    Edit your {isTrackList ? 'track' : 'record'} list
                </p>
                <h1>{list.name}</h1>
                <p>
                    {isTrackList
                        ? 'Find a release in your collection or on Discogs, choose individual tracks, then arrange your mix.'
                        : 'Pick records from your collection or Discogs, then drag them into order.'}{' '}
                    Adding to a list never adds to your collection.
                </p>
            </div>
            {list.removedCount > 0 && (
                <p className="notice">
                    {list.removedCount}{' '}
                    {list.removedCount === 1
                        ? `${itemName} was`
                        : `${itemNames} were`}{' '}
                    removed from your Discogs collection and no longer appear in
                    this list. Save to acknowledge.
                </p>
            )}
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    if (form.processing) return;
                    if (searchTimer.current) clearTimeout(searchTimer.current);
                    cancelSearch.current?.();
                    form.transform(({ selection, ...data }) => ({
                        ...data,
                        entries: selection.map(
                            ({ entryPublicId, releaseId, track }) => ({
                                entryPublicId,
                                releaseId,
                                ...(isTrackList
                                    ? { trackIndex: track?.index }
                                    : {}),
                            }),
                        ),
                    }));
                    form.patch(base);
                }}
            >
                {Object.keys(form.errors).length > 0 && (
                    <div className="notice list-form-errors" role="alert">
                        <strong>Your list hasn’t been saved.</strong>
                        <ul>
                            {Object.entries(form.errors).map(
                                ([field, message]) => (
                                    <li key={field}>{message}</li>
                                ),
                            )}
                        </ul>
                    </div>
                )}
                <section
                    className="list-edit-metadata"
                    aria-label="List settings"
                >
                    <div className="list-metadata">
                        <label htmlFor="name">
                            List name
                            <input
                                id="name"
                                required
                                maxLength={120}
                                aria-invalid={!!form.errors.name}
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                            />
                        </label>
                        <label htmlFor="description">
                            <span>
                                A few words <small>Optional</small>
                            </span>
                            <textarea
                                id="description"
                                rows={2}
                                maxLength={2000}
                                aria-invalid={!!form.errors.description}
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                            />
                        </label>
                    </div>
                    <div className="list-editor-visibility">
                        <span>Visibility</span>
                        <VisibilityPicker
                            disabled={form.processing}
                            error={form.errors.visibility}
                            label="List visibility"
                            value={form.data.visibility}
                            onChange={(value) =>
                                form.setData('visibility', value)
                            }
                        />
                    </div>
                </section>
                <div
                    className="picker-mobile-tabs"
                    aria-label="Record picker view"
                >
                    <button
                        type="button"
                        aria-pressed={!review}
                        onClick={() => setReview(false)}
                    >
                        1. Add {itemNames}
                    </button>
                    <button
                        type="button"
                        aria-pressed={review}
                        onClick={() => setReview(true)}
                    >
                        2. Arrange ({selected.length})
                    </button>
                </div>
                <div className={`record-picker ${review ? 'reviewing' : ''}`}>
                    <section
                        className="picker-results"
                        aria-label="Find records"
                    >
                        <h2 className="picker-step-title">
                            <span>1</span> Add {itemNames}
                        </h2>
                        <p className="muted">
                            Your picks stay while you switch sources and browse.
                        </p>
                        <div
                            className="picker-source-tabs"
                            aria-label="Search source"
                        >
                            {(['collection', 'discogs'] as const).map(
                                (value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        aria-pressed={source === value}
                                        disabled={form.processing}
                                        onClick={() => {
                                            setSource(value);
                                            if (searchTimer.current)
                                                clearTimeout(
                                                    searchTimer.current,
                                                );
                                            visit(
                                                `${base}/edit?source=${value}&q=${encodeURIComponent(search)}`,
                                            );
                                        }}
                                    >
                                        {value === 'collection'
                                            ? 'Your collection'
                                            : 'Discogs'}
                                    </button>
                                ),
                            )}
                        </div>
                        <label
                            className="picker-search"
                            htmlFor="record-search"
                        >
                            <Search size={21} aria-hidden="true" />
                            <span className="sr-only">
                                {source === 'discogs'
                                    ? 'Search Discogs'
                                    : 'Search your collection'}
                            </span>
                            <input
                                id="record-search"
                                type="search"
                                placeholder={
                                    source === 'discogs'
                                        ? 'Artist, album or Discogs release URL…'
                                        : 'Search artist, album, year…'
                                }
                                maxLength={500}
                                disabled={form.processing}
                                value={search}
                                onChange={(event) =>
                                    searchFor(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter')
                                        event.preventDefault();
                                }}
                            />
                        </label>
                        <p className="muted" role="status">
                            {searching
                                ? 'Searching…'
                                : search
                                  ? `Results for “${query}”`
                                  : source === 'discogs'
                                    ? 'Search the Discogs catalogue. Choose a specific pressing.'
                                    : 'Recently added to your collection'}
                        </p>
                        {searchError && (
                            <p className="field-error" role="alert">
                                {searchError}
                            </p>
                        )}
                        <div aria-busy={searching} className="picker-rows">
                            {results.data.map((record) => {
                                const added = selected.some(
                                    (entry) =>
                                        entry.releaseId === record.releaseId,
                                );
                                return (
                                    <div
                                        className="picker-row"
                                        key={
                                            record.copyPublicId ??
                                            record.releaseId
                                        }
                                    >
                                        <ListRecordArtwork record={record} />
                                        <div className="picker-record-text">
                                            <strong>
                                                {record.displayTitle}
                                            </strong>
                                            <span>{record.artist}</span>
                                            <small>
                                                {[
                                                    record.year,
                                                    record.format,
                                                    record.country,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </small>
                                            {(record.label ||
                                                record.catalogNumber) && (
                                                <small>
                                                    {[
                                                        record.label,
                                                        record.catalogNumber,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </small>
                                            )}
                                            {source === 'discogs' &&
                                                record.discogsUrl && (
                                                    <small>
                                                        <a
                                                            href={
                                                                record.discogsUrl
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            View this edition on
                                                            Discogs ↗
                                                        </a>
                                                    </small>
                                                )}
                                            <RecordOwnership {...record} />
                                        </div>
                                        {isTrackList ? (
                                            <TrackPicker
                                                listId={list.publicId}
                                                record={record}
                                                selected={selected}
                                                disabled={
                                                    searching || form.processing
                                                }
                                                onAdd={(entry) =>
                                                    form.setData('selection', [
                                                        ...selected,
                                                        entry,
                                                    ])
                                                }
                                            />
                                        ) : (
                                            <button
                                                className={`picker-add ${added ? 'is-added' : ''}`}
                                                type="button"
                                                disabled={
                                                    added ||
                                                    searching ||
                                                    form.processing ||
                                                    selected.length >= 1000
                                                }
                                                aria-label={`${added ? 'Added' : 'Add'} ${record.displayTitle} by ${record.artist}`}
                                                onClick={() =>
                                                    form.setData('selection', [
                                                        ...selected,
                                                        record,
                                                    ])
                                                }
                                            >
                                                {added ? (
                                                    <Check size={17} />
                                                ) : (
                                                    <Plus size={17} />
                                                )}
                                                {added ? 'Added' : 'Add'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            {results.data.length === 0 &&
                                !searchError &&
                                !searching && (
                                    <div className="list-empty">
                                        <h3>
                                            {source === 'discogs' &&
                                            search.trim().length < 3
                                                ? 'Find your next record.'
                                                : search
                                                  ? 'Nothing found this time.'
                                                  : 'Your collection is empty.'}
                                        </h3>
                                        <p>
                                            {source === 'discogs' &&
                                            search.trim().length < 3
                                                ? 'Type at least three characters, or paste a Discogs release URL. You don’t need to own a record to save it here.'
                                                : search
                                                  ? 'Try an artist, a shorter title or a different spelling.'
                                                  : 'Import your records from Discogs in Settings, then come back to make your selection.'}
                                        </p>
                                        {!search && source === 'collection' && (
                                            <button
                                                type="button"
                                                className="text-button"
                                                onClick={() => {
                                                    setSource('discogs');
                                                    visit(
                                                        `${base}/edit?source=discogs`,
                                                    );
                                                }}
                                            >
                                                Search Discogs instead
                                            </button>
                                        )}
                                    </div>
                                )}
                        </div>
                        <div className="actions picker-pagination">
                            {results.prev_page_url && (
                                <button
                                    className="button secondary"
                                    type="button"
                                    disabled={searching || form.processing}
                                    onClick={() =>
                                        visit(results.prev_page_url!, true)
                                    }
                                >
                                    Previous records
                                </button>
                            )}
                            {results.next_page_url && (
                                <button
                                    className="button secondary"
                                    type="button"
                                    disabled={searching || form.processing}
                                    onClick={() =>
                                        visit(results.next_page_url!, true)
                                    }
                                >
                                    More records
                                </button>
                            )}
                        </div>
                    </section>
                    <aside
                        className="picker-selection"
                        aria-labelledby="selected-title"
                    >
                        <h2 id="selected-title" tabIndex={-1}>
                            <span className="picker-step-number">2</span>{' '}
                            Arrange your list
                        </h2>
                        <p className="muted">
                            Drag the handles to reorder, or focus a handle and
                            press Space, use the arrow keys, then press Space
                            again.
                        </p>
                        <p className="selection-count" role="status">
                            {selected.length}{' '}
                            {selected.length === 1 ? itemName : itemNames} in
                            your list
                        </p>
                        {selected.length === 0 && (
                            <p className="list-empty">
                                {isTrackList
                                    ? 'Choose a release, then add a track to start your mix.'
                                    : 'A good list starts with one record. Find one in your collection or on Discogs and add it here.'}
                            </p>
                        )}
                        <DndContext
                            collisionDetection={closestCenter}
                            sensors={sensors}
                            onDragEnd={({ active, over }) => {
                                if (!over || active.id === over.id) return;
                                form.setData(
                                    'selection',
                                    arrayMove(
                                        selected,
                                        selected.findIndex(
                                            (record) =>
                                                listEntryIdentity(record) ===
                                                active.id,
                                        ),
                                        selected.findIndex(
                                            (record) =>
                                                listEntryIdentity(record) ===
                                                over.id,
                                        ),
                                    ),
                                );
                            }}
                        >
                            <SortableContext
                                items={selected.map(listEntryIdentity)}
                                strategy={verticalListSortingStrategy}
                            >
                                <ol>
                                    {selected.map((record, index) => (
                                        <SortableListRecord
                                            key={listEntryIdentity(record)}
                                            index={index}
                                            record={record}
                                            disabled={form.processing}
                                            onRemove={() =>
                                                form.setData(
                                                    'selection',
                                                    selected.filter(
                                                        (entry) =>
                                                            listEntryIdentity(
                                                                entry,
                                                            ) !==
                                                            listEntryIdentity(
                                                                record,
                                                            ),
                                                    ),
                                                )
                                            }
                                        />
                                    ))}
                                </ol>
                            </SortableContext>
                        </DndContext>
                        {selected.length >= 1000 && (
                            <p>Lists can contain up to 1,000 {itemNames}.</p>
                        )}
                    </aside>
                </div>
                <div className="picker-footer">
                    <button
                        className="picker-review-count"
                        type="button"
                        onClick={() => {
                            setReview(true);
                            requestAnimationFrame(() => {
                                document
                                    .getElementById('selected-title')
                                    ?.focus();
                            });
                        }}
                    >
                        {selected.length}{' '}
                        {selected.length === 1 ? itemName : itemNames} selected
                        <span>Review your list ↑</span>
                    </button>
                    <div className="actions">
                        <Link href={base} className="button secondary">
                            Cancel
                        </Link>
                        <button className="button" disabled={form.processing}>
                            {form.processing ? 'Saving…' : 'Save list'}
                        </button>
                    </div>
                </div>
            </form>
        </>
    );
}
