import { useContext } from 'react';
import { NavigateContext } from '../util';

export default () => {
    const navigate = useContext(NavigateContext)!;
    return <a className='home' onClick={() => navigate('')}>Home</a>;
};