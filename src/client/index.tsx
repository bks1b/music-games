import { ReactElement, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import HomeLink from './components/HomeLink';
import { NavigateContext } from './util';
import Create from './views/Create';
import Guess from './views/Guess';
import HigherLower from './views/HigherLower';
import Home from './views/Home';

const getPath = () => window.location.pathname.slice(1);

const App = () => {
    const [path, setPath] = useState(getPath());
    useEffect(() => {
        window.onpopstate = () => setPath(getPath());
    });
    return <NavigateContext.Provider value={(x: string) => {
        window.history.pushState('', '', '/' + x);
        setPath(x);
    }}>{({
            guess: () => <Guess/>,
            higherlower: () => <HigherLower/>,
            create: () => <Create/>,
            '': () => <Home/>,
        } as Record<string, () => ReactElement>)[path]?.() || <><HomeLink/><h1>Page not found.</h1></>}</NavigateContext.Provider>;
};

createRoot(document.getElementById('root')!).render(<App/>);