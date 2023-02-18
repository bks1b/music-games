import { useEffect, useState } from 'react';
import { Cross } from 'attrib-wordle/src';
import { Album, ArtistData, Track } from '../../util';
import DataInput from '../components/DataInput';
import HomeLink from '../components/HomeLink';

export default () => {
    const end = (str: string) => {
        setEnded(true);
        setTimeout(() => {
            alert(str);
            if (highScore < used.length - 1) setHighScore(used.length - 1);
            setEnded(false);
            setUsed([]);
            setTracks(undefined);
        });
    };
    const setClosest = (i: number) => {
        const closest = data!
            .map((x, j) => [Math.abs(x.popularity! - data![i].popularity!), j])
            .filter(x => ![...used!, i].includes(x[1]))
            .sort((a, b) => a[0] - b[0]);
        setUsed([...used!, i]);
        if (closest.length) setTracks([i, closest[Math.floor(Math.random() ** 1.25 * closest.length)][1]]);
        else end('Game over: no tracks remaining');
    };
    const submit = (n: number) => {
        if ([0, n].includes(Math.sign(data![tracks![1]].popularity! - data![tracks![0]].popularity!))) setClosest(tracks![1]);
        else end('Game over');
    };
    const renderTrack = (x: IndividualTrack) => <>
        {
            x.album
                ? <img className='albumCover' src={x.album!.cover}/>
                : <div className='albumCover' style={{ aspectRatio: 1 }}>&nbsp;</div>
        }
        <h1>{x.name}</h1>
        <h2>{x.artist}</h2>
        {x.album ? <h3>{x.album!.name}</h3> : ''}
    </>;
    const [artists, setArtists] = useState<ArtistData[]>([]);
    const [data, setData] = useState<IndividualTrack[]>();
    const [used, setUsed] = useState<number[]>([]);
    const [tracks, setTracks] = useState<number[]>();
    const [ended, setEnded] = useState(false);
    const [highScore, setHighScore] = useState(0);
    useEffect(() => {
        if (data && !ended) setClosest(Math.floor(Math.random() * data.length));
    }, [data, ended]);
    useEffect(() => {
        document.title = 'Higher or Lower | Music Games';
    }, []);
    return data && tracks
        ? <>
            <HomeLink/>
            <br/>
            <a>Score: {used.length - 1}</a>
            <br/>
            <a>High score: {highScore}</a>
            <div className='tracks'>
                <div>
                    {renderTrack(data[tracks[0]])}
                    <a>{data[tracks[0]].popularity} popularity</a>
                </div>
                <div>
                    {renderTrack(data[tracks[1]])}
                    {
                        ended
                            ? <a>{data[tracks[1]].popularity} popularity</a>
                            : <div className='higherLowerButtons'>
                                <button onClick={() => submit(1)}>Higher</button>
                                <button onClick={() => submit(-1)}>Lower</button>
                            </div>
                    }
                </div>
            </div>
        </>
        : <div className='column'>
            <DataInput callback={x => !artists.some(y => y.name === x.name) && setArtists([...artists, x])}/>
            {
                artists.length
                    ? <>
                        <a>Included artists:</a>
                        <ul>{artists.map(x => <li key={x.name}><div className='artistList'>
                            <a>{x.name}</a>
                            <Cross size={15} fn={() => setArtists(artists.filter(y => y.name !== x.name))}/>
                        </div></li>)}</ul>
                    </>
                    : ''
            }
            <div><button onClick={() => setData(artists.flatMap(a => [...a.albums.flatMap(x => x.tracks.map(y => ({ ...y, album: x }))), ...a.singles].filter(x => x.popularity).map(x => ({ ...x, artist: a.name }))))}>Play</button></div>
        </div>;
};

type IndividualTrack = Track & { artist: string; album?: Album; };