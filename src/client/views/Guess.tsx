import { useEffect, useState } from 'react';
import Game from 'attrib-wordle/src';
import { ArtistData, Track } from '../../util';
import DataInput from '../components/DataInput';
import HomeLink from '../components/HomeLink';
import { renderDuration } from '../util';

export default () => {
    const [data, setData] = useState<ArtistData>();
    useEffect(() => {
        document.title = 'Guess the Track | Music Games';
    }, []);
    return data
        ? <>
            <HomeLink/>
            <Game entries={[...data.albums.flatMap((x, i) => x.tracks.map(y => ({ ...y, album: i }))), ...data.singles] as (Track & { album?: number; })[]} id='name' attribs={[
                { name: 'Title', render: x => x.name, value: x => x.name },
                { name: 'Album', render: x => typeof x.album === 'number' ? <img src={data.albums[x.album!].cover} height={70}/> : 'N/A', value: x => x.album!, maxDifference: 2 },
                { name: 'Track no.', render: x => x.tracklistIndex || 'N/A', value: x => x.tracklistIndex!, maxDifference: 2 },
                { name: 'Duration', render: x => renderDuration(x.duration), value: x => x.duration, maxDifference: 30000 },
                ...data.attribs.features ? [{ name: 'Features', render: (x: Track) => x.features.join(', ') || 'No features', value: (x: Track) => x.features }] : [],
                ...data.attribs.vocalists ? [{ name: 'Vocalists', render: (x: Track) => x.vocalists.join(', '), value: (x: Track) => x.vocalists }] : [],
            ]} guesses={8} optionCount={5}/>
        </>
        : <DataInput callback={x => setData(x)}/>;
};