import { useContext, useEffect } from 'react';
import { NavigateContext } from '../util';

export default () => {
    const navigate = useContext(NavigateContext)!;
    useEffect(() => {
        document.title = 'Music Games';
    }, []);
    return <>
        <h1>Games</h1>
        <div className='row'>
            <button onClick={() => navigate('guess')}>Guess the track</button>
            <button onClick={() => navigate('higherlower')}>Higher or lower</button>
        </div>
        <h1>Other</h1>
        <button onClick={() => navigate('create')}>Create artist data</button>
    </>;
};