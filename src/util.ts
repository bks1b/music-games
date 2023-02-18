export const validateData = (d: ArtistData) => d && d.attribs && typeof d.attribs === 'object' && typeof d.name === 'string' && ![d.albums, d.singles].some(x => !Array.isArray(x)) && !d.albums.some(x => typeof x.name !== 'string' && typeof x.id === 'string' && typeof x.cover === 'string' && Array.isArray(x.tracks) && !x.tracks.some(x => !x || typeof x.tracklistIndex !== 'number')) && !d.singles.some(x => !x || x.tracklistIndex !== undefined) && ![...d.singles, ...d.albums.flatMap(x => x.tracks)].some(x => typeof x.name !== 'string' || typeof x.id !== 'string' || typeof x.duration !== 'number' || !Array.isArray(x.features) || x.features.some(x => typeof x !== 'string'));

type BaseData = { name: string; id: string; spotifyId?: string; };
export type Track = BaseData & {
    tracklistIndex?: number;
    duration: number;
    features: string[];
    vocalists: string[];
    popularity?: number;
};
export type Album = BaseData & { cover: string; tracks: Track[]; };
export type ArtistData = {
    name: string;
    attribs: { [k in 'features' | 'vocalists']?: boolean };
    albums: Album[];
    singles: Track[];
};