import { Fragment, useEffect, useRef, useState } from 'react';
import { Arrow, Cross } from 'attrib-wordle/src';
import { ArtistData, Track } from '../../util';
import DataInput from '../components/DataInput';
import HomeLink from '../components/HomeLink';
import { renderDuration } from '../util';

const ICON_SIZE = 20;

const getEmptyTrack = () => ({
    name: '',
    id: Date.now() + '',
    duration: 0,
    features: [],
    vocalists: [],
});
const getEmptyData = () => ({
    name: '',
    attribs: {},
    albums: [],
    singles: [],
});

export default () => {
    const renderTracks = (tracks: Track[], album?: boolean) => <div><table>
        <thead><tr>
            {album ? <th/> : ''}
            <th>Title</th>
            <th>Duration</th>
            {data!.attribs.features ? <th>Features</th> : ''}
            {data!.attribs.vocalists ? <th>Vocalists</th> : ''}
            <th>Spotify ID</th>
            <th>Popularity</th>
        </tr></thead>
        <tbody>{tracks.map((x, i, a) => <tr key={x.id + ';' + fixedIndices[x.id]}>
            {album ? <td><input defaultValue={x.tracklistIndex!} type='number' className='numberInput' onInput={e => {
                x.tracklistIndex = +(e.target as HTMLInputElement).value;
                setData({ ...data! });
            }}/></td> : ''}
            <td><input defaultValue={x.name} onInput={e => {
                x.name = (e.target as HTMLInputElement).value;
                setData({ ...data! });
            }}/></td>
            <td><input defaultValue={renderDuration(x.duration)} className='durationInput' onInput={e => {
                const [m, s] = (e.target as HTMLInputElement).value.split(':').map(x => +x);
                if (!isNaN(m) && !isNaN(s)) {
                    x.duration = (m * 60 + s) * 1000;
                    setData({ ...data! });
                }
            }}/></td>
            {(['features', 'vocalists'] as const).map(k => data!.attribs[k]
                ? <td key={k}><input defaultValue={x[k].join('; ')} onInput={e => {
                    x[k] = (e.target as HTMLInputElement).value.split(';').map(x => x.trim());
                    setData({ ...data! });
                }}/></td>
                : null
            )}
            <td><input defaultValue={x.spotifyId || ''} onInput={e => {
                x.spotifyId = (e.target as HTMLInputElement).value;
                setData({ ...data! });
            }}/></td>
            <td>{x.popularity || 'N/A'}</td>
            <td className='row'>
                {getButtons(a, i)}
                {
                    toMove
                        ? toMove[0].id === x.id
                            ? <button onClick={() => setToMove(undefined)}>Cancel moving</button>
                            : ''
                        : <button onClick={() => setToMove([x, () => a.splice(i, 1)])}>Move</button> 
                }
            </td>
        </tr>)}</tbody>
    </table></div>;
    const getButtons = <T,>(arr: T[], i: number) => <>
        <Cross size={ICON_SIZE} fn={() => {
            arr.splice(i, 1);
            setData({ ...data! });
        }}/>
        {
            i
                ? <Arrow size={ICON_SIZE} rotation={0} fn={() => {
                    arr.splice(i - 1, 0, ...arr.splice(i, 1));
                    setData({ ...data! });
                }}/>
                : ''
        }
        {
            i < arr.length - 1
                ? <Arrow size={ICON_SIZE} rotation={180} fn={() => {
                    arr.splice(i + 1, 0, ...arr.splice(i, 1));
                    setData({ ...data! });
                }}/>
                : ''
        }
    </>;
    const loadData = (id: string) => fetch('/api/getDiscography/' + id).then(d => d.json()).then(d => d.error ? alert(d.error) : setData(d));
    const [data, setData] = useState<ArtistData | undefined>();
    const [search, setSearch] = useState<Record<'id' | 'name' | 'url' | 'img', string>[]>([]);
    const [fixedIndices, setFixedIndices] = useState<Record<string, number>>({});
    const [toMove, setToMove] = useState<[Track, () => any] | undefined>();
    const idInput = useRef<HTMLInputElement>(null);
    const searchInput = useRef<HTMLInputElement>(null);
    const albumIdInput = useRef<HTMLInputElement>(null);
    useEffect(() => {
        document.title = 'Create an Artist | Music Games';
    }, []);
    return data
        ? <div className='column'>
            <HomeLink/>
            <div className='row'>
                <button onClick={() => {
                    const a = document.createElement('a');
                    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
                    a.download = 'artist.json';
                    a.click();
                }}>Download</button>
                <button onClick={() => setData(getEmptyData())}>Reset data</button>
                <button onClick={() => fetch('/api/getPopularity', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(data),
                }).then(d => d.json()).then(d => setData({ ...d }))}>Get popularity</button>
                <button onClick={() => {
                    data.albums.push({ id: Date.now() + '', name: '', cover: '', tracks: [] });
                    setData({ ...data });
                }}>Add album</button>
            </div>
            <div className='row'>
                <input ref={albumIdInput}/>
                <button onClick={() => fetch('/api/getAlbum/' + albumIdInput.current!.value).then(d => d.json()).then(d => {
                    if (d.error) return alert(d.error);
                    albumIdInput.current!.value = '';
                    data.albums.push(d);
                    setData({ ...data });
                })}>Add album from Spotify ID</button>
            </div>
            <label>Name: <input defaultValue={data.name} onInput={e => setData({ ...data, name: (e.target as HTMLInputElement).value })}/></label>
            <ul>
                <li>Show featured artists: <input type='checkbox' defaultChecked={data.attribs.features} onChange={e => {
                    data.attribs.features = e.target.checked;
                    setData({ ...data });
                }}/></li>
                <li>Show vocalists: <input type='checkbox' defaultChecked={data.attribs.vocalists} onChange={e => {
                    data.attribs.vocalists = e.target.checked;
                    setData({ ...data });
                }}/></li>
            </ul>
            <h2>Singles</h2>
            <div className='row'>
                <button onClick={() => {
                    data.singles.push(getEmptyTrack());
                    setData({ ...data });
                }}>Add single</button>
                <button onClick={() => {
                    data.singles.sort((a, b) => a.name.localeCompare(b.name));
                    setData({ ...data });
                }}>Order alphabetically</button>
                {
                    toMove
                        ? <button onClick={() => {
                            data.singles.push({ ...toMove[0], tracklistIndex: undefined });
                            toMove[1]();
                            setToMove(undefined);
                            setData({ ...data });
                        }}>Move here</button>
                        : ''
                }
            </div>
            {renderTracks(data.singles)}
            {data.albums.map((x, i) => <Fragment key={x.id}>
                <hr/>
                <div className='row'>
                    <input value={x.name} onInput={e => {
                        x.name = (e.target as HTMLInputElement).value;
                        setData({ ...data });
                    }}/>
                    <button onClick={() => {
                        x.tracks.push({ ...getEmptyTrack(), tracklistIndex: x.tracks.length ? x.tracks.slice(-1)[0].tracklistIndex! + 1 : 1 });
                        setData({ ...data });
                    }}>Add track</button>
                    <button onClick={() => {
                        x.tracks.forEach((x, i) => {
                            x.tracklistIndex = i + 1;
                            fixedIndices[x.id] = (fixedIndices[x.id] || 0) + 1;
                        });
                        setData({ ...data });
                        setFixedIndices({ ...fixedIndices });
                    }}>Fix indices</button>
                    <button onClick={() => {
                        x.tracks.sort((a, b) => a.tracklistIndex! - b.tracklistIndex!);
                        setData({ ...data });
                    }}>Order by indices</button>
                    {
                        toMove
                            ? <button onClick={() => {
                                x.tracks.push({ ...toMove[0], tracklistIndex: x.tracks.length + 1 });
                                toMove[1]();
                                setToMove(undefined);
                                setData({ ...data });
                            }}>Move here</button>
                            : ''
                    }
                    {getButtons(data.albums, i)}
                </div>
                {x.spotifyId ? <div>ID: <a href={x.id} target='_blank'>{x.spotifyId}</a></div> : ''}
                <label>Cover: <input defaultValue={x.cover} onInput={e => {
                    x.cover = (e.target as HTMLInputElement).value;
                    setData({ ...data });
                }}/></label>
                <img src={x.cover} className='cover'/>
                {renderTracks(x.tracks, true)}
            </Fragment>)}
        </div>
        : <div className='column'>
            <DataInput callback={x => setData(x)} create/>
            <div><button onClick={() => setData(getEmptyData())}>Enter data manually</button></div>
            <a>Load from Spotify (might take a while):</a>
            <div className='row'>
                <input ref={idInput}/>
                <button onClick={() => loadData(idInput.current!.value)}>Load from Spotify ID</button>
            </div>
            <div className='row'>
                <input ref={searchInput}/>
                <button onClick={() => fetch('/api/searchArtists?q=' + encodeURIComponent(searchInput.current!.value)).then(d => d.json()).then(d => setSearch(d))}>Search on Spotify</button>
            </div>
            <div className='artistResults'>{search.map((x, i) => <div key={i} className='artistResult'>
                <img src={x.img}/>
                <h2><a href={x.url} target='_blank'>{x.name}</a></h2>
                <button onClick={() => loadData(x.id)}>Load</button>
            </div>)}</div>
        </div>;
};