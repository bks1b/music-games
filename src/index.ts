import { join } from 'path';
import express from 'express';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import { ArtistData, validateData } from './util';

const PORT = process.env.PORT || 2000;
const API = 'https://api.spotify.com/v1';
const AUTH_API = 'https://accounts.spotify.com/api/token';
const MAX_REQUESTS = 10;
const LIMIT = 50;

config();

let token: { token: string; expires: number; };
let ratelimitExpires = 0;

const cleanName = (str: string) => str.replace(/(?!^)(-|\(|\[]).*?(version|remaster|bonus|deluxe|edition|reissue).*/ig, '').trim();
const getTrack = (x: TracklistResponse['items'][number], artist: string) => ({
    name: cleanName(x.name),
    spotifyId: x.id,
    id: x.external_urls.spotify,
    duration: x.duration_ms,
    features: x.artists.filter(x => x.id !== artist).map(x => x.name),
    vocalists: [],
});
const getAlbum = (x: AlbumResponse['items'][number]) => ({
    name: cleanName(x.name),
    spotifyId: x.id,
    id: x.external_urls.spotify,
    cover: x.images[0].url,
    year: +x.release_date.split('-')[0],
});

const get = async <T>(path: string): Promise<T> => {
    if (Date.now() < ratelimitExpires) await new Promise(r => setTimeout(r, ratelimitExpires - Date.now()));
    if (!token || Date.now() > token.expires) await fetch(AUTH_API, {
        method: 'POST',
        headers: {
            authorization: 'Basic ' + Buffer.from(process.env.AUTHORIZATION!).toString('base64'),
            'content-type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    }).then(d => d.json()).then(d => token = { token: d.access_token, expires: Date.now() + +d.expires_in * 1000 });
    return fetch(path.startsWith('/') ? API + path : path, { headers: { authorization: 'Bearer ' + token.token } }).then(async r => {
        const d = await r.json();
        if (d.error?.status === 429) {
            ratelimitExpires = Date.now() + (+r.headers.get('retry-after')! + 1) * 1000;
            return get(path);
        }
        return d;
    });
};
const getTracklist = async (id: string, artist: string) => {
    const arr = [];
    let url = `/albums/${id}/tracks?limit=${LIMIT}`;
    for (let j = 0; j < MAX_REQUESTS; j++) {
        const data = await get<TracklistResponse>(url);
        arr.push(...data.items.map((x, i) => ({ ...getTrack(x, artist), tracklistIndex: arr.length + i + 1 })));
        url = data.next;
        if (!url) break;
    }
    return arr;
};
const getPopularity = async (data: ArtistData) => {
    const ids = [...new Set([...data.singles, ...data.albums.flatMap(x => x.tracks)].map(x => x.spotifyId).filter(x => x))];
    const map: Record<string, number> = {};
    for (let i = 0; i < ids.length; i += LIMIT) {
        const arr = await get<{ tracks: { id: string; popularity: number; }[]; }>(`/tracks?ids=${ids.slice(i, i + LIMIT).join(',')}`);
        for (const x of arr.tracks) if (x) map[x.id] = x.popularity;
    }
    for (const track of [...data.singles, ...data.albums.flatMap(x => x.tracks)]) if (track.spotifyId) track.popularity = map[track.spotifyId];
    return data;
};

const client = new MongoClient(process.env.MONGO_URI!);
const db = client.connect().then(() => client.db('music_games'));

express()
    .use(express.json({ limit: '5mb' }))
    .get('/api/getDiscography/:id', async (req, res) => {
        let name;
        const albums = [];
        let albumsURL = `/artists/${req.params.id}/albums?include_groups=album,compilation&limit=${LIMIT}`;
        for (let i = 0; i < MAX_REQUESTS; i++) {
            const data = await get<AlbumResponse & ErrorResponse>(albumsURL);
            if (data.error?.status === 400) return res.json({ error: 'Artist not found.' });
            if (!name && data.items.length) name = data.items[0].artists.find(x => x.id === req.params.id)!.name;
            albums.push(...data.items.map(x => ({ ...getAlbum(x), tracks: <any[]>[] })));
            albumsURL = data.next;
            if (!albumsURL) break;
        }
        for (const a of albums) a.tracks = await getTracklist(a.spotifyId, req.params.id);
        const singles = [];
        let singlesURL = `/artists/${req.params.id}/albums?include_groups=single&limit=${LIMIT}`;
        for (let i = 0; i < MAX_REQUESTS; i++) {
            const data = await get(singlesURL) as AlbumResponse;
            for (const single of data.items) singles.push(...(await get<TracklistResponse>(`/albums/${single.id}/tracks?limit=${LIMIT}`)).items.reverse().map(x => getTrack(x, req.params.id)));
            singlesURL = data.next;
            if (!singlesURL) break;
        }
        res.json({
            name,
            attribs: {},
            albums: albums.sort((a, b) => a.year - b.year).map(x => ({ ...x, year: undefined })),
            singles: singles.reverse(),
        });
    })
    .get('/api/getAlbum/:id', (req, res) => get<AlbumResponse['items'][number] & ErrorResponse>('/albums/' + req.params.id).then(async d => res.json(
        d.error?.status === 400
            ? { error: 'Album not found.' }
            : { ...getAlbum(d), tracks: await getTracklist(req.params.id, d.artists[0].id) }
    )))
    .get('/api/searchArtists', (req, res) => get<{ artists: { items: BaseData[]; }; }>(`/search?type=artist&q=${encodeURIComponent(<string>req.query.q)}&limit=${LIMIT}`).then(d => res.json(d.artists.items.map(x => ({
        id: x.id,
        name: x.name,
        url: x.external_urls.spotify,
        img: x.images[0]?.url,
    })))))
    .post('/api/getPopularity', async (req, res) => res.json(validateData(req.body) ? await getPopularity(req.body) : {}))
    .get('/api/getUploads', (req, res) => db.then(d => d.collection('artists').find({}).toArray().then(x => {
        if ('dl' in req.query) {
            res.setHeader('content-type', 'application/json');
            res.setHeader('content-disposition', 'attachment; filename=uploads.json');
        }
        res.json(x);
    })))
    .get('/api/updatePopularity', async (req, res, next) => {
        if (req.query.auth !== process.env.PASSWORD) return next();
        const coll = (await db).collection<ArtistData>('artists');
        const arr = await coll.find({}).toArray();
        for (const x of arr) await coll.updateOne({ name: x.name }, { $set: await getPopularity(x) });
        res.json({});
    })
    .use(express.static(join(process.cwd(), 'build')))
    .use(express.static(join(process.cwd(), 'src/client/static')))
    .get('/attrib-wordle.css', (_, res) => res.sendFile(join(process.cwd(), 'node_modules/attrib-wordle/src/style.css')))
    .get('*', (_, res) => res.sendFile(join(process.cwd(), 'src/client/index.html')))
    .listen(PORT, () => console.log('Listening on port', PORT));

type BaseData = {
    external_urls: { spotify: string; };
    images: { url: string; }[];
    id: string;
    name: string;
};
type AlbumResponse = { next: string; items: (BaseData & { artists: BaseData[]; release_date: string; })[]; };
type TracklistResponse = {
    next: string;
    items: (BaseData & { duration_ms: number; artists: { id: string; name: string; }[]; })[];
};
type ErrorResponse = { error?: { status: number; }; };