import { AppleIcon } from '@/components/records/AppleIcon';
import { safeExternalUrl } from '@/components/records/discogsText';
import { SpotifyIcon } from '@/components/records/SpotifyIcon';
import type { ListTrack } from '@/modules/lists/types';

export function TrackListeningLinks({
    track,
}: {
    track: Omit<ListTrack, 'index'>;
}) {
    const query = encodeURIComponent(`${track.artist} ${track.title}`);
    const services = [
        {
            name: 'Apple Music',
            url: safeExternalUrl(track.appleMusicUrl),
            searchUrl: `https://music.apple.com/search?term=${query}`,
            search: track.appleMusicSearch,
            icon: <AppleIcon size={18} />,
        },
        {
            name: 'Spotify',
            url: safeExternalUrl(track.spotifyUrl),
            searchUrl: `https://open.spotify.com/search/${query}`,
            search: track.spotifySearch,
            icon: <SpotifyIcon size={18} />,
        },
    ];

    return (
        <div
            className="list-track-links"
            aria-label={`Listen to ${track.title}`}
        >
            {services.map((service) => (
                <a
                    key={service.name}
                    href={service.url ?? safeExternalUrl(service.searchUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${service.search || !service.url ? 'Find' : 'Open'} ${track.title} on ${service.name}`}
                >
                    {service.icon}
                    <span>{service.name}</span>
                    {(service.search || !service.url) && (
                        <span className="list-track-search-label">Search</span>
                    )}
                </a>
            ))}
        </div>
    );
}
