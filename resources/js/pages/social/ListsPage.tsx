import { Head, useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { useRef } from 'react';

import { CollectionTabs } from '@/modules/lists/CollectionTabs';
import { RecordListPreview } from '@/modules/lists/RecordListPreview';
import type { ListPreview, ListType } from '@/modules/lists/types';
import { FieldError } from '@/modules/social/FieldError';
import type { Visibility } from '@/modules/social/types';
import { VisibilityPicker } from '@/modules/social/VisibilityPicker';

export function ListsPage({ lists }: { lists: ListPreview[] }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const nameInput = useRef<HTMLInputElement>(null);
    const form = useForm({
        name: '',
        type: 'records' as ListType,
        description: '',
        visibility: 'only_me' as Visibility,
    });

    return (
        <>
            <Head title="Your lists" />
            <div className="page-heading list-heading">
                <h1>Your lists</h1>
            </div>
            <CollectionTabs active="lists" listCount={lists.length} />
            <section aria-label="Your lists">
                <div className="section-heading lists-section-heading">
                    <button
                        className="button"
                        type="button"
                        onClick={() => {
                            dialog.current?.showModal();
                            nameInput.current?.focus();
                        }}
                    >
                        <Plus size={18} aria-hidden="true" /> Make a list
                    </button>
                </div>
                {lists.length === 0 ? (
                    <div className="list-empty">
                        <h2>No lists yet</h2>
                        <p>
                            Collect favourite albums, make a mixtape, or pick
                            the best tracks by an artist or genre.
                        </p>
                    </div>
                ) : (
                    <div className="collection-previews list-cards">
                        {lists.map((list) => (
                            <RecordListPreview key={list.id} list={list} />
                        ))}
                    </div>
                )}
            </section>
            <dialog
                ref={dialog}
                className="list-create-dialog"
                aria-labelledby="new-list-title"
                aria-describedby="new-list-description"
                onCancel={(event) => {
                    if (form.processing) event.preventDefault();
                }}
                onClick={(event) => {
                    if (
                        event.target === event.currentTarget &&
                        !form.processing
                    )
                        dialog.current?.close();
                }}
            >
                <div className="list-create-content stack">
                    <div className="list-create-heading">
                        <h2 id="new-list-title">Make a list</h2>
                        <button
                            className="list-create-close"
                            type="button"
                            aria-label="Close new list"
                            disabled={form.processing}
                            onClick={() => dialog.current?.close()}
                        >
                            <X size={22} aria-hidden="true" />
                        </button>
                    </div>
                    <p id="new-list-description">
                        Choose whole records or individual tracks, then find
                        your picks in your collection or on Discogs.
                    </p>
                    <form
                        className="stack"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/lists');
                        }}
                    >
                        <fieldset
                            className="list-type-picker"
                            disabled={form.processing}
                        >
                            <legend>What goes in your list?</legend>
                            {(['records', 'tracks'] as const).map((type) => (
                                <label key={type}>
                                    <input
                                        type="radio"
                                        name="list-type"
                                        value={type}
                                        checked={form.data.type === type}
                                        onChange={() =>
                                            form.setData('type', type)
                                        }
                                    />
                                    <span>
                                        <strong>
                                            {type === 'records'
                                                ? 'Records'
                                                : 'Tracks'}
                                        </strong>
                                        <small>
                                            {type === 'records'
                                                ? 'Whole albums and releases. Favourites, wishlists, and records for a rainy day.'
                                                : 'Individual songs. Make a mixtape or pick the best of an artist or genre.'}
                                        </small>
                                    </span>
                                </label>
                            ))}
                        </fieldset>
                        <FieldError
                            id="type-error"
                            message={form.errors.type}
                        />
                        <label htmlFor="name">
                            List name
                            <input
                                ref={nameInput}
                                id="name"
                                required
                                maxLength={120}
                                placeholder={
                                    form.data.type === 'tracks'
                                        ? 'The best of Kieran Hebden'
                                        : 'Sunday morning records'
                                }
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                aria-invalid={!!form.errors.name}
                                aria-describedby={
                                    form.errors.name ? 'name-error' : undefined
                                }
                            />
                        </label>
                        <FieldError
                            id="name-error"
                            message={form.errors.name}
                        />
                        <label htmlFor="description">
                            <span>
                                A few words <small>Optional</small>
                            </span>
                            <textarea
                                id="description"
                                rows={3}
                                maxLength={2000}
                                aria-invalid={!!form.errors.description}
                                aria-describedby={
                                    form.errors.description
                                        ? 'description-error'
                                        : undefined
                                }
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                            />
                        </label>
                        <FieldError
                            id="description-error"
                            message={form.errors.description}
                        />
                        <div className="list-editor-visibility">
                            <span>Visibility</span>
                            <VisibilityPicker
                                disabled={form.processing}
                                error={form.errors.visibility}
                                label="New list visibility"
                                value={form.data.visibility}
                                onChange={(value) =>
                                    form.setData('visibility', value)
                                }
                            />
                        </div>
                        <div className="actions list-create-actions">
                            <button
                                className="text-button"
                                type="button"
                                disabled={form.processing}
                                onClick={() => dialog.current?.close()}
                            >
                                Cancel
                            </button>
                            <button
                                className="button"
                                disabled={form.processing}
                            >
                                {form.processing ? 'Creating…' : 'Create list'}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>
        </>
    );
}
