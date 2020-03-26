import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Gem() {
  const link = useRef(null);
  const [, update] = useState(null);

  useEffect(() => {
    addEventListener('hosturlchanged', () => {
      update(Date.now());
      link.current.click();
    });
  }, []);

  return <Link to={location.pathname} ref={link} replace style={{ display: 'none' }}></Link>;
}
