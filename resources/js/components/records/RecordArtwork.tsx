import '../../../css/record-cases.css';

function revealCover(image: HTMLImageElement | null) {
    if (!image?.complete || image.naturalWidth === 0) return;

    void image.decode().then(
        () => {
            image.dataset.loaded = 'true';
        },
        () => {},
    );
}

export function RecordArtwork({
    cover,
    coverPreview,
    artist,
    title,
    mediaFormat,
}: {
    cover: string;
    coverPreview?: string;
    artist: string;
    title: string;
    mediaFormat?: string;
}) {
    const responsive = cover.startsWith('/') && cover.endsWith('/cover');

    return (
        <span className="catalog-record-art">
            <span
                className="catalog-record-image"
                style={
                    coverPreview
                        ? { backgroundImage: `url("${coverPreview}")` }
                        : undefined
                }
            >
                <img
                    key={cover}
                    alt=""
                    decoding="async"
                    draggable={false}
                    height={600}
                    loading="lazy"
                    ref={revealCover}
                    onLoad={(event) => revealCover(event.currentTarget)}
                    src={cover}
                    srcSet={
                        responsive
                            ? `${cover}?width=320 320w, ${cover}?width=640 640w, ${cover}?width=1200 1200w`
                            : undefined
                    }
                    sizes={
                        responsive
                            ? '(max-width: 600px) 45vw, 300px'
                            : undefined
                    }
                    width={600}
                />
            </span>
            {mediaFormat === 'Cassette' && (
                <span className="cassette-inlay" aria-hidden="true">
                    <strong>{artist}</strong>
                    <span>{title}</span>
                    <small>Cassette</small>
                </span>
            )}
            <span className="cover-gloss" />
        </span>
    );
}
