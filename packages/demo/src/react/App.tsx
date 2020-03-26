import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Link } from 'react-router-dom';

import Gem from './Gem'

const Home = lazy(() => import('./Home'));
const About = lazy(() => import('./About'));

export default function App() {
  return (
    <BrowserRouter>
      <Gem />
      <nav>
        <Link to="/">Home</Link>
        <Link to="/b">About</Link>
      </nav>
      <Suspense fallback={<div>Loading...</div>}>
        <Route path="/" exact component={Home}></Route>
        <Route path="/b" get component={About}></Route>
      </Suspense>
    </BrowserRouter>
  );
}
