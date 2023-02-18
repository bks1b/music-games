import { useEffect, useState } from 'react';
import { compareTwoStrings } from 'string-similarity';
import { ArtistData, validateData } from '../../util';
import HomeLink from './HomeLink';

export default ({ callback, create }: { callback: (x: ArtistData) => any; create?: boolean; }) => {
    const [data, setData] = useState<ArtistData[]>();
    const [query, setQuery] = useState('');
    useEffect(() => {
        fetch('/api/getUploads').then(d => d.json()).then(d => setData(d));
    }, []);
    const results = data?.map(x => [x, compareTwoStrings(x.name.toLowerCase(), query.toLowerCase())] as const).filter(x => x[1] > 0.2);
    return data
        ? <div className='column'>
            <HomeLink/>
            <a>Upload an artist or search from uploaded artists{create ? ':' : ' to play.'}</a>
            <label>Upload: <input type='file' onChange={e => {
                const reader = new FileReader();
                reader.addEventListener('load', e => {
                    const str = e.target!.result as string;
                    try {
                        const d: ArtistData = JSON.parse(str);
                        if (!validateData(d)) throw '';
                        callback(d);
                    } catch {
                        alert('Invalid input');
                    }
                });
                reader.readAsText(e.target.files![0]);
            }}/></label>
            <label>Search: <input onInput={e => setQuery((e.target as HTMLInputElement).value)}/></label>
            {
                results!.length
                    ? <ul>{results!.sort((a, b) => b[1] - a[1]).map((x, i) => <li key={i} className='link' onClick={() => callback(x[0])}>{x[0].name}</li>)}</ul>
                    : ''
            }
        </div>
        : <></>;
};