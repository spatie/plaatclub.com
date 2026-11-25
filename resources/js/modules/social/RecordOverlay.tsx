import { Link, router, usePage } from '@inertiajs/react';
import {
    createContext,
    lazy,
    Suspense,
    useContext,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import {
    artworkOrigin,
    type SleeveOrigin,
} from '@/components/records/recordMotion';
import type { SocialProps } from '@/modules/social/types';
import '../../../css/record-overlay.css';

const loadRecordView = () =>
    import('@/modules/social/SocialRecordView')
        .then((module) => ({ default: module.SocialRecordView }))
        .catch(() => ({ default: RecordViewUnavailable }));
const SocialRecordView = lazy(loadRecordView);

function RecordViewUnavailable({ onBack }: { onBack: () => void }) {
    return <RecordLoadStatus failed onBack={onBack} />;
}

function RecordLoadStatus({
    failed = false,
    onBack,
}: {
    failed?: boolean;
    onBack: () => void;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useLayoutEffect(() => {
        const element = dialog.current;
        element?.showModal();
        return () => element?.close();
    }, []);

    return (
        <dialog
            ref={dialog}
            className="record-load-status"
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();
                onBack();
            }}
        >
            <h2 id={titleId} role={failed ? 'alert' : 'status'}>
                {failed ? 'Couldn’t open this record' : 'Opening record…'}
            </h2>
            {failed && <p>Check your connection, then reload to try again.</p>}
            <div className="actions">
                <button className="button secondary" onClick={onBack}>
                    {failed ? 'Close' : 'Cancel'}
                </button>
                {failed && (
                    <button
                        className="button"
                        onClick={() => window.location.reload()}
                    >
                        Reload
                    </button>
                )}
            </div>
        </dialog>
    );
}

export const RecordOverlayContext = createContext<
    (url: string, source?: HTMLElement | null) => void
>((url) => router.visit(url));

export function RecordLink({
    href,
    children,
    className,
}: {
    href: string;
    children: ReactNode;
    className?: string;
}) {
    const open = useContext(RecordOverlayContext);
    return (
        <Link
            href={href}
            className={className}
            onClick={(event) => {
                if (
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                )
                    return;
                event.preventDefault();
                open(href, event.currentTarget as HTMLElement);
            }}
        >
            {children}
        </Link>
    );
}

export function RecordOverlay({ children }: { children: ReactNode }) {
    const overlay = usePage<SocialProps>().props.recordOverlay;
    const [origin, setOrigin] = useState<SleeveOrigin | null>(null);
    const source = useRef<HTMLElement | null>(null);
    const sourceArtwork = useRef<HTMLElement | null>(null);
    const returnUrl = useRef<string | null>(null);
    const opened = Boolean(overlay);

    useLayoutEffect(() => {
        if (!opened) return;
        if (sourceArtwork.current?.isConnected)
            setOrigin(artworkOrigin(sourceArtwork.current));
        const previous = document.body.style.overflow;
        const artwork =
            source.current?.querySelector<HTMLElement>('.catalog-record-art') ??
            sourceArtwork.current;
        const visibility = artwork?.style.visibility ?? '';
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
            if (artwork) artwork.style.visibility = visibility;
            source.current?.focus({ preventScroll: true });
        };
    }, [opened]);

    function open(url: string, element?: HTMLElement | null) {
        void loadRecordView();
        source.current = element?.closest<HTMLElement>('a, button') ?? null;
        const artwork =
            element?.querySelector<HTMLElement>('.catalog-record-art, img') ??
            element;
        sourceArtwork.current = artwork ?? null;
        setOrigin(artwork ? artworkOrigin(artwork) : null);
        returnUrl.current = window.location.href;
        const destination = new URL(url, window.location.href);
        destination.search = window.location.search;
        destination.hash = window.location.hash;
        destination.searchParams.delete('record');
        destination.searchParams.delete('commentsPage');
        router.visit(destination.href, {
            only: ['recordOverlay'],
            preserveState: true,
            preserveScroll: true,
        });
    }

    function close() {
        const destination = new URL(
            returnUrl.current ?? overlay!.collectionUrl,
            window.location.href,
        );
        destination.searchParams.delete('record');
        destination.searchParams.delete('commentsPage');
        router.replace({
            url: destination.href,
            props: (props) => ({ ...props, recordOverlay: null }),
            preserveState: true,
            preserveScroll: true,
        });
    }

    return (
        <RecordOverlayContext value={open}>
            <div inert={opened} aria-hidden={opened}>
                {children}
            </div>
            {overlay && (
                <Suspense fallback={<RecordLoadStatus onBack={close} />}>
                    <SocialRecordView
                        key={overlay.record.id}
                        data={overlay}
                        returnOrigin={() =>
                            sourceArtwork.current?.isConnected
                                ? artworkOrigin(sourceArtwork.current)
                                : null
                        }
                        origin={origin}
                        onReady={() => {
                            const artwork =
                                source.current?.querySelector<HTMLElement>(
                                    '.catalog-record-art',
                                ) ?? sourceArtwork.current;
                            if (artwork) artwork.style.visibility = 'hidden';
                        }}
                        onBack={close}
                    />
                </Suspense>
            )}
        </RecordOverlayContext>
    );
}
