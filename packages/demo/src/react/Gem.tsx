import React, { useEffect } from 'react';
import { useHistory } from 'react-router';

export function Gem() {
  const history = useHistory();

  useEffect(() => {
    addEventListener('hosturlchange', () => {
      history.replace({ pathname: location.pathname });
    });
  }, []);

  return <></>;
}
